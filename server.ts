import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    if (req.url.startsWith("/api")) {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    }
    next();
  });

  // In-memory data store
  const data = {
    assignments: [] as any[],
    users: [] as any[],
    auditors: [] as any[],
    messages: [] as any[],
    groups: [] as any[],
    notifications: [] as any[],
  };

  // Socket.io Logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their private room`);
    });

    socket.on("join-group", (groupId) => {
      socket.join(groupId);
      console.log(`User ${socket.id} joined group room ${groupId}`);
    });

    socket.on("send-message", (msg) => {
      const message = {
        id: Date.now().toString(),
        ...msg,
        timestamp: new Date().toISOString(),
      };
      data.messages.push(message);
      
      // Determine recipient room
      const recipientRoom = msg.groupId || msg.receiverId;
      if (recipientRoom) {
        io.to(recipientRoom).emit("new-message", message);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // API Routes
  app.post("/api/login/search", (req, res) => {
    const { contact, role } = req.body;
    let user;
    if (role === "firm") {
      user = data.users.find(u => u.email === contact || u.phone === contact);
    } else {
      user = data.auditors.find(u => u.email === contact || u.phone === contact);
    }

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "Profile not found. Please register first." });
    }
  });

  app.post("/api/login/firm", (req, res) => {
    const { name, phone, email } = req.body;
    
    const existingByEmail = data.users.find(u => u.email === email);
    const existingByPhone = data.users.find(u => u.phone === phone);

    if (existingByEmail || existingByPhone) {
      if (existingByEmail && existingByPhone && existingByEmail.id === existingByPhone.id) {
        return res.json(existingByEmail);
      }
      return res.status(400).json({ error: "Email or Phone number is already registered with another firm." });
    }

    const user = { id: Date.now().toString(), name, phone, email, role: "firm" };
    data.users.push(user);
    res.json(user);
  });

  app.post("/api/login/auditor", (req, res) => {
    const { name, aadhar, upi, currentLocation, auditLocations, phone, email } = req.body;
    
    const existingByEmail = data.auditors.find(a => a.email === email);
    const existingByPhone = data.auditors.find(a => a.phone === phone);

    if (existingByEmail || existingByPhone) {
      if (existingByEmail && existingByPhone && existingByEmail.id === existingByPhone.id) {
        return res.json(existingByEmail);
      }
      return res.status(400).json({ error: "Email or Phone number is already registered with another student account." });
    }

    const auditor = {
      id: Date.now().toString(),
      name,
      aadhar,
      upi,
      currentLocation,
      auditLocations,
      phone,
      email,
      role: "auditor"
    };
    data.auditors.push(auditor);
    res.json(auditor);
  });

  app.post("/api/assignments", (req, res) => {
    const assignment = {
      id: Date.now().toString(),
      ...req.body,
      status: "pending_admin", // pending_admin -> approved -> assigned -> completed
      createdAt: new Date().toISOString(),
      adminFields: {},
      visibleFields: ["firmName", "firmPhone", "firmEmail", "auditLocation", "auditType", "requirement", "paymentDetail", "paymentDueDate", "dueDate"],
    };
    data.assignments.push(assignment);
    res.json(assignment);
  });

  app.get("/api/assignments", (req, res) => {
    const { userId, role } = req.query;
    
    if (role === "admin") {
      return res.json(data.assignments);
    }

    if (role === "firm") {
      return res.json(data.assignments.filter(a => a.firmId === userId));
    }

    if (role === "auditor") {
      // Auditors see assignments that are "approved" (open) OR specifically assigned to them
      return res.json(data.assignments.filter(a => 
        a.status === "approved" || a.auditorId === userId
      ));
    }

    res.json([]);
  });

  app.put("/api/assignments/:id", (req, res) => {
    const { id } = req.params;
    const index = data.assignments.findIndex(a => a.id === id);
    if (index !== -1) {
      const oldStatus = data.assignments[index].status;
      const updateData = { ...req.body };
      
      // If student is claiming, set assignedAt
      if (oldStatus === "approved" && updateData.status === "assigned") {
        updateData.assignedAt = new Date().toISOString();
      }

      data.assignments[index] = { ...data.assignments[index], ...updateData };
      const newStatus = data.assignments[index].status;

      // Handle Notifications for Auditors when assignment is approved (becomes "open" or "approved")
      if (oldStatus !== "approved" && newStatus === "approved") {
        const location = data.assignments[index].auditLocation.toLowerCase();
        data.auditors.forEach(auditor => {
          const auditorLocs = auditor.auditLocations.toLowerCase().split(",").map((s: string) => s.trim());
          const isMatch = auditorLocs.some((loc: string) => location.includes(loc) || loc.includes(location));
          
          if (isMatch) {
            const notification = {
              id: Date.now().toString(),
              userId: auditor.id,
              title: "New work found nearby!",
              message: `A new ${data.assignments[index].auditType} task is available in ${data.assignments[index].auditLocation}. Want to check it out?`,
              assignmentId: id,
              createdAt: new Date().toISOString(),
              isRead: false,
            };
            data.notifications.push(notification);
            io.to(auditor.id).emit("notification", notification);
          }
        });
      }
      
      res.json(data.assignments[index]);
    } else {
      res.status(404).json({ error: "Assignment not found" });
    }
  });

  app.delete("/api/assignments/:id", (req, res) => {
    const { id } = req.params;
    data.assignments = data.assignments.filter(a => a.id !== id);
    res.json({ success: true });
  });

  app.post("/api/assignments/:id/cancel", (req, res) => {
    const { id } = req.params;
    const index = data.assignments.findIndex(a => a.id === id);
    if (index !== -1) {
      const assignment = data.assignments[index];
      // Check if within 12 hours of assignedAt
      const assignedAt = new Date(assignment.assignedAt || assignment.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - assignedAt.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);

      if (diffHrs <= 12) {
        // Reset to approved so others can claim
        data.assignments[index].status = "approved";
        data.assignments[index].auditorId = null;
        data.assignments[index].auditorName = null;
        delete data.assignments[index].assignedAt;
        res.json({ success: true, message: "Assignment released back to pool" });
      } else {
        res.status(403).json({ error: "Cannot cancel after 12 hours of approval" });
      }
    } else {
      res.status(404).json({ error: "Assignment not found" });
    }
  });

  // Chat API
  app.get("/api/messages/:room", (req, res) => {
    const { room } = req.params; // room can be groupId or direct chat id (e.g. admin-auditorId)
    const messages = data.messages.filter(m => m.groupId === room || m.receiverId === room || (m.senderId === room));
    res.json(messages);
  });

  app.get("/api/chats/:userId", (req, res) => {
    const { userId } = req.params;
    // For admin, return all active chats
    // For others, return their relevant chats/groups
    const userGroups = data.groups.filter(g => g.members.includes(userId));
    res.json({ groups: userGroups });
  });

  app.post("/api/groups", (req, res) => {
    const group = {
      id: `group-${Date.now()}`,
      ...req.body, // { name, members: [id1, id2, ...], assignmentId }
      createdAt: new Date().toISOString(),
    };
    data.groups.push(group);
    
    // Notify members
    group.members.forEach((memberId: string) => {
      io.to(memberId).emit("group-created", group);
    });
    
    res.json(group);
  });

  app.get("/api/notifications/:userId", (req, res) => {
    const { userId } = req.params;
    res.json(data.notifications.filter(n => n.userId === userId));
  });

  app.get("/api/users", (req, res) => {
    // Return unique students and firms with contact details
    const students = data.assignments
      .filter(a => a.auditorId && a.auditorName)
      .map(a => {
        const auditorProfile = data.auditors.find(aud => aud.id === a.auditorId);
        return { 
          id: a.auditorId, 
          name: a.auditorName, 
          loginName: auditorProfile?.name || a.auditorName,
          location: a.auditLocation, 
          phone: a.phone || "N/A", // Application phone
          loginPhone: auditorProfile?.phone || "N/A", // Profile phone
          designation: "Field Auditor",
          type: "student",
          email: a.auditorId === "student" ? "student@example.com" : `user_${a.auditorId}@audit.link`
        };
      });
    
    // Also include from auditors registered but not assigned yet
    const registeredAuditors = data.auditors.map(a => ({
      id: a.id,
      name: a.name,
      loginName: a.name,
      location: a.currentLocation,
      phone: "N/A",
      loginPhone: a.phone,
      designation: "Registered Auditor",
      type: "student",
      email: a.email
    }));
    
    const firms = data.assignments.map(a => ({ 
      id: a.firmId, 
      name: a.firmName, 
      location: a.auditLocation, 
      phone: a.firmPhone || "N/A",
      designation: "Firm Authority",
      type: "firm",
      email: a.firmEmail 
    }));
    
    const uniqueUsers = [...students, ...registeredAuditors, ...firms].reduce((acc: any[], current) => {
      const x = acc.find(item => item.id === current.id);
      if (!x) return acc.concat([current]);
      return acc;
    }, []);

    res.json(uniqueUsers);
  });

  app.get("/api/users/:userId/assignments", (req, res) => {
    const { userId } = req.params;
    const userAssignments = data.assignments.filter(a => a.auditorId === userId || a.firmId === userId);
    res.json(userAssignments);
  });

  // API 404 Catch-all
  app.all("/api/*", (req, res) => {
    console.warn(`404 - API Route Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
