import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  Settings, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Eye, 
  Edit3, 
  Hash, 
  Plus, 
  Trash2, 
  FileText, 
  Printer, 
  Search,
  MessageSquare,
  Users,
  LayoutGrid,
  ChevronDown,
  Building2,
  User,
  Phone,
  MoreVertical,
  Download
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { Assignment } from "@/src/types";

import { Chat } from "./Chat";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"pre-edit" | "pending" | "assigned" | "summary" | "completed" | "chats">("pre-edit");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [editingAudit, setEditingAudit] = useState<Assignment | null>(null);
  const [viewingAudit, setViewingAudit] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [userSearchText, setUserSearchText] = useState("");
  const [userSearchType, setUserSearchType] = useState<"student" | "firm">("student");
  const [users, setUsers] = useState<any[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [activeChat, setActiveChat] = useState<{ id: string; name: string; isGroup: boolean } | null>(null);
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
  const [userAssignments, setUserAssignments] = useState<Assignment[]>([]);

  const ADMIN_USER = { id: "admin", name: "Super Admin", role: "admin" };

  // Edit states
  const [adminForm, setAdminForm] = useState({
    paymentInfo: "",
    termsConditions: "",
    customFields: [] as { label: string; value: string }[]
  });
  const [visibleFields, setVisibleFields] = useState<string[]>([]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/assignments?role=admin");
      const data = await response.json();
      setAssignments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch(`/api/chats/${ADMIN_USER.id}`);
      const data = await res.json();
      setGroups(data.groups);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewProfile = async (user: any) => {
    setViewingProfile(user);
    try {
      const res = await fetch(`/api/users/${user.id}/assignments`);
      const data = await res.json();
      setUserAssignments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchGroups();
    fetchUsers();
  }, [activeTab]);

  const manualCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          members: ["admin", ...selectedGroupMembers],
          type: "manual",
        }),
      });
      const group = await res.json();
      setGroups(prev => [...prev, group]);
      setNewGroupName("");
      setSelectedGroupMembers([]);
      setIsCreatingGroup(false);
      setActiveChat({ id: group.id, name: group.name, isGroup: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (a: Assignment) => {
    setEditingAudit(a);
    setAdminForm({
      paymentInfo: a.adminFields?.paymentInfo || "",
      termsConditions: a.adminFields?.termsConditions || "",
      customFields: a.adminFields?.customFields || []
    });
    setVisibleFields(a.visibleFields || []);
  };

  const handleSaveAndUpload = async () => {
    if (!editingAudit) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/assignments/${editingAudit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          adminFields: adminForm,
          visibleFields: visibleFields,
        }),
      });
      
      if (res.ok) {
        // Removed automatic group creation per user request
      }

      setEditingAudit(null);
      fetchAssignments();
      fetchGroups();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = (field: string) => {
    setVisibleFields(prev => 
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const tabs = [
    { id: "pre-edit", label: "New Requests", icon: Edit3, count: assignments.filter(a => a.status === "pending_admin").length },
    { id: "pending", label: "Open Tasks", icon: Clock, count: assignments.filter(a => a.status === "approved").length },
    { id: "assigned", label: "Ongoing", icon: Users, count: assignments.filter(a => a.status === "assigned").length },
    { id: "chats", label: "Messages", icon: MessageSquare, count: 0 },
    { id: "summary", label: "Reports", icon: LayoutGrid, count: 0 },
    { id: "completed", label: "Finished", icon: CheckCircle2, count: assignments.filter(a => a.status === "completed").length },
  ];

  const handlePrint = (a: Assignment) => {
     const printContent = `
      <html>
        <head>
          <title>Invoice - ${a.firmName}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>AuditLink INVOICE</h1>
              <p>ID: ${a.id}</p>
            </div>
            <div style="text-align: right">
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div class="section">
            <h3>FIRM DETAILS</h3>
            <p><strong>Name:</strong> ${a.firmName}</p>
            <p><strong>Email:</strong> ${a.firmEmail}</p>
          </div>
          <div class="section">
            <h3>AUDIT PARTICULARS</h3>
            <table>
              <tr><th>Field</th><th>Details</th></tr>
              <tr><td>Location</td><td>${a.auditLocation}</td></tr>
              <tr><td>Type</td><td>${a.auditType}</td></tr>
              <tr><td>Due Date</td><td>${a.dueDate}</td></tr>
              <tr><td>Payment Due</td><td>${a.paymentDueDate || "N/A"}</td></tr>
              <tr><td>Requirement</td><td>${a.requirement}</td></tr>
              <tr><td>Firm Quote</td><td>${a.paymentDetail}</td></tr>
            </table>
          </div>
          <div class="footer">
            Generated via AuditLink Management Platform.
          </div>
        </body>
      </html>
    `;
    const win = window.open("", "_blank");
    win?.document.write(printContent);
    win?.document.close();
    win?.print();
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full shrink-0 border-b border-slate-200 bg-white p-4 lg:w-64 lg:border-b-0 lg:border-r lg:p-6">
        <div className="mb-8 hidden lg:block">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Main Menu
          </div>
        </div>
        <nav className="flex flex-row flex-wrap gap-2 lg:flex-col">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "group relative flex flex-1 items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-bold transition-all lg:flex-none",
                activeTab === tab.id 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              <tab.icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", activeTab === tab.id ? "text-blue-400" : "text-slate-400")} />
              <span className="whitespace-nowrap">{tab.label}</span>
              {tab.count > 0 && (
                <span className={cn(
                  "ml-auto flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black",
                  activeTab === tab.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10">
        <AnimatePresence mode="wait">
          {activeTab === "chats" && (
            <motion.div 
              key="chats" 
              initial={{ opacity: 0, scale: 0.99 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="flex h-full gap-6"
            >
              <div className="w-80 shrink-0 space-y-4 flex flex-col h-full overflow-hidden">
                <div className="rounded-[32px] bg-white p-6 border border-slate-200 flex flex-col max-h-[40%] overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Channels</h3>
                    <button 
                      onClick={() => setIsCreatingGroup(true)}
                      className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2 overflow-y-auto pr-1">
                    {groups.map(g => (
                      <button 
                        key={g.id}
                        onClick={() => setActiveChat({ id: g.id, name: g.name, isGroup: true })}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all",
                          activeChat?.id === g.id ? "bg-blue-600 text-white shadow-lg" : "hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        <ShieldCheck className={cn("h-4 w-4", activeChat?.id === g.id ? "text-white" : (g.type === "firm-admin" ? "text-emerald-600" : "text-blue-600"))} />
                        <div className="flex-1 overflow-hidden">
                          <p className="font-bold text-xs truncate">{g.name}</p>
                          <p className={cn("text-[8px] uppercase font-bold", activeChat?.id === g.id ? "text-blue-100" : "text-slate-400")}>
                            {g.type === "firm-admin" ? "Firm Hub" : g.type === "auditor-admin" ? "Student Hub" : "Custom Group"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[32px] bg-white p-6 border border-slate-200 flex-1 flex flex-col overflow-hidden">
                   <div className="space-y-4 mb-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Direct Directory</h3>
                      <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                        <button 
                          onClick={() => setUserSearchType("student")}
                          className={cn("flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", userSearchType === "student" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}
                        >Students</button>
                        <button 
                          onClick={() => setUserSearchType("firm")}
                          className={cn("flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", userSearchType === "firm" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400")}
                        >Firms</button>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder={`Search by location or name...`}
                          value={userSearchText}
                          onChange={(e) => setUserSearchText(e.target.value)}
                          className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-9 pr-4 text-[11px] font-bold focus:ring-2 ring-blue-500/20"
                        />
                      </div>
                   </div>
                   
                   <div className="space-y-2 overflow-y-auto pr-1">
                      {users.filter(u => u.type === userSearchType && (u.name.toLowerCase().includes(userSearchText.toLowerCase()) || u.location?.toLowerCase().includes(userSearchText.toLowerCase()))).map(u => (
                        <div key={u.id} className="flex gap-1">
                          <button 
                            onClick={() => setActiveChat({ id: u.id, name: u.name, isGroup: false })}
                            className={cn(
                              "flex-1 flex items-center gap-3 p-3 rounded-2xl text-left transition-all",
                              activeChat?.id === u.id ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-600"
                            )}
                          >
                            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm", activeChat?.id === u.id ? "bg-slate-800" : "bg-white border border-slate-100")}>
                               {u.type === "student" ? <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="font-bold text-xs truncate">{u.name}</p>
                              <p className="text-[9px] font-bold opacity-60 truncate uppercase tracking-tight">{u.location || "Active Session"}</p>
                            </div>
                          </button>
                          <button 
                            onClick={() => handleViewProfile(u)}
                            className="w-10 h-10 self-center rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center text-slate-400 hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              <div className={cn(
                "flex-1 rounded-[40px] overflow-hidden bg-white border border-slate-200 shadow-xl",
                !activeChat && "hidden md:flex",
                activeChat && "absolute inset-0 z-10 md:relative md:flex"
              )}>
                 {activeChat ? (
                   <Chat 
                    currentUser={ADMIN_USER} 
                    targetRoom={activeChat.id} 
                    roomName={activeChat.name} 
                    isGroup={activeChat.isGroup} 
                    onBack={() => setActiveChat(null)}
                   />
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-20">
                      <MessageSquare className="h-16 w-16 mb-4" />
                      <p className="font-bold tracking-tight">Select a channel to start communicating</p>
                   </div>
                 )}
              </div>
            </motion.div>
          )}

          {activeTab === "assigned" && (
            <motion.div key="assigned" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-5xl space-y-6">
               <div className="flex flex-col gap-1">
                 <h2 className="text-3xl font-black tracking-tight text-slate-900">Active Workflows</h2>
                 <p className="text-sm font-medium text-slate-500">Collaborative group management for ongoing audits</p>
               </div>
               <div className="grid gap-6">
                  {assignments.filter(a => a.status === "assigned").map(a => {
                    const hasGroup = groups.some(g => g.assignmentId === a.id);
                    return (
                      <div key={a.id} className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-5">
                          <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <ShieldCheck className="h-7 w-7" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold tracking-tight">{a.auditType}</h4>
                            <p className="text-sm text-slate-500 font-medium">{a.auditLocation}</p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-black uppercase tracking-widest">
                               <span className="text-slate-400">Firm: <span className="text-slate-900">{a.firmName}</span> <span className="text-blue-600 font-mono ml-1">({a.firmPhone})</span></span>
                               <span className="text-slate-400">Auditor: <span className="text-slate-900">{a.adminFields?.auditorName}</span> <span className="text-blue-600 font-mono ml-1">({a.adminFields?.auditorPhone || a.auditorSubmission?.auditorPhone})</span></span>
                            </div>
                          </div>
                        </div>
                         <div className="flex items-center gap-3">
                           <button 
                            onClick={() => setViewingAudit(a)}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                           >
                             View Details
                           </button>
                           {hasGroup ? (
                             <button 
                               onClick={() => { 
                                 setActiveTab("chats"); 
                                 const targetGroup = groups.find(g => g.assignmentId === a.id);
                                 if (targetGroup) setActiveChat({ id: targetGroup.id, name: targetGroup.name, isGroup: true });
                               }}
                               className="px-6 py-3 bg-slate-100 text-slate-800 rounded-2xl text-xs font-bold hover:scale-105 transition-all outline-none"
                              >
                                Manage Channels
                              </button>
                            ) : (
                              <button 
                               onClick={() => {
                                 setActiveTab("chats");
                                 setIsCreatingGroup(true);
                                 setNewGroupName(`${a.auditType} - ${a.auditLocation}`);
                                 setSelectedGroupMembers([]);
                               }}
                               className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all font-sans italic"
                              >
                                Create Group
                              </button>
                            )}
                           <button onClick={() => handlePrint(a)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"><Printer className="h-5 w-5 text-slate-500" /></button>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </motion.div>
          )}

          {activeTab === "pre-edit" && (
            <motion.div 
              key="pre-edit" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mx-auto max-w-5xl space-y-8"
            >
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">New Requests</h2>
                <p className="text-sm font-medium text-slate-500">Approve these to start the process.</p>
              </div>

              <div className="grid gap-4">
                {assignments.filter(a => a.status === "pending_admin").map(a => (
                  <div 
                    key={a.id} 
                    className="group relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                          <Building2 className="h-7 w-7" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold tracking-tight text-slate-800">{a.auditType}</h4>
                          <p className="text-sm font-medium text-slate-500">
                            Requested by <span className="font-bold text-slate-900">{a.firmName}</span>
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <MapPin className="h-3 w-3" /> {a.auditLocation}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleOpenEdit(a)}
                        className="group flex items-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-blue-500/10 transition-all hover:bg-blue-700 active:scale-95"
                      >
                        <Edit3 className="h-4 w-4" /> 
                        Review & Approve
                      </button>
                    </div>
                  </div>
                ))}
                
                {assignments.filter(a => a.status === "pending_admin").length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <CheckCircle2 className="mb-4 h-16 w-16 text-slate-400" />
                    <p className="text-xl font-bold tracking-tight text-slate-800">No New Requests</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        {activeTab === "pending" && (
          <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
             {assignments.filter(a => a.status === "approved").map(a => (
                <div key={a.id} className="p-6 bg-slate-900 text-white rounded-[32px] relative overflow-hidden group">
                   <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={() => handlePrint(a)} className="p-2 rounded-full bg-white/10 hover:bg-white/20"><Printer className="h-4 w-4" /></button>
                      <button onClick={() => fetch(`/api/assignments/${a.id}`, { method: "DELETE" }).then(() => fetchAssignments())} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-500"><Trash2 className="h-4 w-4" /></button>
                   </div>
                   <div className="mb-6">
                      <h4 className="text-xl font-bold">{a.auditLocation}</h4>
                      <p className="text-xs text-slate-400 tracking-wider uppercase mt-1 italic">{a.auditType}</p>
                   </div>
                   <div className="space-y-2 mb-6">
                      <div className="text-xs flex items-center justify-between"><span className="text-slate-400">Firm</span> <span>{a.firmName}</span></div>
                      <div className="text-xs flex items-center justify-between"><span className="text-slate-400">Pay Info</span> <span>{a.adminFields.paymentInfo}</span></div>
                   </div>
                   <div className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-xl text-center text-[10px] font-black uppercase tracking-widest border border-blue-500/30">
                      Live on Auditor Hub
                   </div>
                </div>
             ))}
          </motion.div>
        )}

        {activeTab === "summary" && (
          <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                   <tr>
                      <th className="px-6 py-4">Serial</th>
                      <th className="px-6 py-4">Entity/Location</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Firm Detail</th>
                      <th className="px-6 py-4">Auditor Detail</th>
                      <th className="px-6 py-4">Pay/Dues</th>
                      <th className="px-6 py-4">Action</th>
                   </tr>
                </thead>
                <tbody className="text-sm divide-y">
                   {assignments.map((a, idx) => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 font-mono text-[10px]">{idx + 1}</td>
                         <td className="px-6 py-4">
                            <div className="font-bold">{a.auditLocation}</div>
                            <div className="text-xs text-slate-400">{a.auditType}</div>
                         </td>
                         <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                              a.status === "completed" ? "bg-green-100 text-green-700" :
                              a.status === "assigned" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                            )}>
                              {a.status}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <div className="font-medium">{a.firmName}</div>
                            <div className="text-xs text-slate-400">{a.firmPhone}</div>
                         </td>
                         <td className="px-6 py-4">
                            {a.auditorId ? (
                              <>
                                <div className="font-medium">{a.adminFields.auditorName}</div>
                                <div className="text-xs text-slate-400">{a.adminFields.auditorPhone}</div>
                              </>
                            ) : <span className="text-slate-300 italic">Unassigned</span>}
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                               <div className="flex items-center justify-between gap-4">
                                  <span className="text-[10px] uppercase font-black text-slate-400">Firm Paid:</span>
                                  <span className="font-bold text-blue-600">{a.paymentDetail}</span>
                               </div>
                               <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-1">
                                  <span className="text-[10px] uppercase font-black text-slate-400">Student Get:</span>
                                  <span className="font-bold text-emerald-600">{a.adminFields.paymentInfo || "N/A"}</span>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <button onClick={() => handlePrint(a)} className="p-2 hover:bg-slate-200 rounded-lg transition-all"><Printer className="h-4 w-4" /></button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin View Details Modal */}
      <AnimatePresence>
        {viewingAudit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl my-8 overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Assignment Breakdown</h2>
                    <p className="text-sm font-medium text-slate-500">Dual-layer report: Firm vs Auditor</p>
                  </div>
                  <button onClick={() => setViewingAudit(null)} className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold">×</button>
                </div>

                <div className="grid gap-10 lg:grid-cols-2">
                  {/* Firm Layer */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-blue-600">
                      <Building2 className="h-5 w-5" />
                      <h3 className="font-bold uppercase tracking-widest text-[10px]">Firm Layer (Submission)</h3>
                    </div>
                    <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
                      {[
                        { label: "Firm Name", value: viewingAudit.firmName },
                        { label: "Contact", value: viewingAudit.firmPhone },
                        { label: "Email", value: viewingAudit.firmEmail },
                        { label: "Location", value: viewingAudit.auditLocation },
                        { label: "Type", value: viewingAudit.auditType },
                        { label: "Budget", value: viewingAudit.paymentDetail },
                        { label: "Due Date", value: viewingAudit.dueDate },
                        { label: "Payment Due", value: viewingAudit.paymentDueDate || "N/A" },
                      ].map(item => (
                        <div key={item.label} className="flex justify-between items-start">
                          <span className="text-xs font-medium text-slate-500">{item.label}</span>
                          <span className="text-xs font-bold text-slate-900 text-right">{item.value}</span>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-slate-200">
                        <span className="text-xs font-medium text-slate-500 block mb-1">Requirement:</span>
                        <p className="text-xs text-slate-700 italic">"{viewingAudit.requirement}"</p>
                      </div>
                    </div>
                  </div>

                  {/* Auditor Layer */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-emerald-600">
                      <User className="h-5 w-5" />
                      <h3 className="font-bold uppercase tracking-widest text-[10px]">Auditor Layer (Performance)</h3>
                    </div>
                    {viewingAudit.auditorSubmission ? (
                      <div className="bg-emerald-50/50 rounded-3xl p-6 space-y-4 border border-emerald-100">
                        {[
                          { label: "Auditor Name", value: viewingAudit.auditorSubmission.auditorName },
                          { label: "Phone", value: viewingAudit.auditorSubmission.auditorPhone },
                          { label: "Email", value: viewingAudit.auditorSubmission.auditorEmail },
                          { label: "Aadhar", value: viewingAudit.auditorSubmission.auditorAadhar },
                          { label: "UPI ID", value: viewingAudit.auditorSubmission.auditorUPI },
                          { label: "Status", value: viewingAudit.auditorSubmission.status.toUpperCase() },
                        ].map(item => (
                          <div key={item.label} className="flex justify-between items-start">
                            <span className="text-xs font-medium text-emerald-600">{item.label}</span>
                            <span className="text-xs font-bold text-slate-900 text-right">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-40 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 opacity-50">
                        <User className="h-8 w-8 mb-2 text-slate-400" />
                        <p className="text-xs font-bold text-slate-400">Auditor has not submitted report yet</p>
                      </div>
                    )}

                    <div className="bg-slate-900 text-white p-6 rounded-3xl">
                      <h4 className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-3">Admin Overrides</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Auditor Payout</span>
                          <span className="font-bold">{viewingAudit.adminFields.paymentInfo || "N/A"}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Special Terms</span>
                          <span className="font-bold truncate max-w-[150px]">{viewingAudit.adminFields.termsConditions || "None"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button onClick={() => setViewingAudit(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Close</button>
                  <button onClick={() => handlePrint(viewingAudit)} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2">
                    <Printer className="h-4 w-4" /> Print Invoice
                  </button>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-6">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">WhatsApp Connect Operations</h4>
                   <div className="flex flex-wrap gap-4">
                      <a 
                        href={`https://wa.me/${viewingAudit.firmPhone}?text=Hello ${viewingAudit.firmName}, this is regarding your ${viewingAudit.auditType} request.`}
                        target="_blank"
                        className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-[24px] text-sm font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                      >
                         <Phone className="h-4 w-4" /> Message Firm
                      </a>
                      {viewingAudit.auditorSubmission && (
                        <a 
                          href={`https://wa.me/${viewingAudit.auditorSubmission.auditorPhone}?text=Hello ${viewingAudit.auditorSubmission.auditorName}, this is AuditLink Admin regarding ${viewingAudit.auditType}.`}
                          target="_blank"
                          className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-[24px] text-sm font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-100"
                        >
                           <Phone className="h-4 w-4" /> Message Auditor
                        </a>
                      )}
                   </div>
                   <p className="text-[9px] text-slate-400 mt-4 italic font-medium">Quick connect links will open external chat windows.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Edit/Upload Modal */}
      <AnimatePresence>
         {editingAudit && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
             <motion.div 
               initial={{ opacity: 0, y: 100 }} 
               animate={{ opacity: 1, y: 0 }} 
               className="w-full max-w-4xl bg-white rounded-[48px] overflow-hidden shadow-2xl my-8"
             >
                <div className="p-12">
                   <div className="flex justify-between items-start mb-12">
                      <div className="flex gap-5">
                         <div className="h-16 w-16 rounded-[24px] bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                            <ShieldCheck className="h-8 w-8" />
                         </div>
                         <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Audit Review</h2>
                            <p className="text-slate-500 font-medium">Check the details from <span className="text-blue-600 underline">@{editingAudit.firmName}</span></p>
                         </div>
                      </div>
                      <button onClick={() => setEditingAudit(null)} className="h-12 w-12 rounded-full border border-slate-100 flex items-center justify-center font-bold font-mono hover:bg-slate-50 transition-all">✕</button>
                   </div>

                   <div className="grid gap-12 lg:grid-cols-2">
                       {/* Left - Firm Info View */}
                       <div className="space-y-8">
                          <div className="p-8 bg-slate-50 rounded-[32px] space-y-6">
                             <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-4">Submission Particulars</h4>
                             <div className="space-y-4">
                                {["firmName", "firmPhone", "firmEmail", "auditLocation", "auditType", "requirement", "paymentDetail", "paymentDueDate", "dueDate"].map(field => (
                                   <div key={field} className="flex justify-between items-center group">
                                      <div className="capitalize text-slate-500 text-sm">{field.replace("firm", "Firm ")}</div>
                                      <div className="flex items-center gap-3">
                                         <span className="text-sm font-bold">{(editingAudit as any)[field]}</span>
                                         <button 
                                          onClick={() => toggleVisibility(field)}
                                          className={cn("p-1.5 rounded-lg transition-all", visibleFields.includes(field) ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400")}
                                         >
                                            <Eye className="h-3 w-3" />
                                         </button>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>                        {/* Right - Admin Enhancements */}
                       <div className="space-y-8">
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Audit Info</h4>
                          <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Student Fees</label>
                                <input 
                                  value={adminForm.paymentInfo} 
                                  onChange={e => setAdminForm({...adminForm, paymentInfo: e.target.value})}
                                  placeholder="e.g. ₹5,000 + Travel"
                                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-blue-600 focus:bg-white rounded-3xl outline-none transition-all font-bold text-lg"
                                />
                                <p className="text-[10px] text-slate-400 italic px-2">Fees the student will get.</p>
                             </div>

                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Special Rules</label>
                                <textarea 
                                  value={adminForm.termsConditions} 
                                  onChange={e => setAdminForm({...adminForm, termsConditions: e.target.value})}
                                  placeholder="Any extra info for the student?"
                                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-blue-600 focus:bg-white rounded-3xl outline-none transition-all min-h-[120px] text-sm leading-relaxed"
                                />
                             </div>

                             <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                   <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Extra Fields</label>
                                   <button 
                                    onClick={() => setAdminForm({...adminForm, customFields: [...adminForm.customFields, {label: "", value: ""}]})}
                                    className="p-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md"><Plus className="h-4 w-4" /></button>
                                </div>
                                {adminForm.customFields.map((cf, i) => (
                                   <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-right-2">
                                      <input 
                                        placeholder="Label" 
                                        value={cf.label} 
                                        onChange={e => {
                                          const next = [...adminForm.customFields];
                                          next[i].label = e.target.value;
                                          setAdminForm({...adminForm, customFields: next});
                                        }}
                                        className="w-1/3 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-blue-200" 
                                      />
                                      <input 
                                        placeholder="Value" 
                                        value={cf.value} 
                                        onChange={e => {
                                          const next = [...adminForm.customFields];
                                          next[i].value = e.target.value;
                                          setAdminForm({...adminForm, customFields: next});
                                        }}
                                        className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:border-blue-200" 
                                      />
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                   </div>

                   <div className="mt-16 flex gap-4">
                      <button 
                        disabled={loading}
                        onClick={handleSaveAndUpload}
                        className="flex-1 py-6 bg-slate-900 text-white text-lg font-black rounded-3xl shadow-2xl shadow-slate-200 hover:scale-[1.02] transition-all"
                      >
                         {loading ? "Processing..." : "Approve Audit"}
                      </button>
                      <button 
                        onClick={() => setEditingAudit(null)}
                        className="px-8 py-6 bg-white border border-slate-200 text-slate-400 font-bold rounded-3xl hover:bg-slate-50 transition-all"
                      >
                         Cancel
                      </button>
                   </div>
                </div>
             </motion.div>
           </div>
         )}
      </AnimatePresence>

      {/* Manual Group Creation Modal */}
      <AnimatePresence>
        {isCreatingGroup && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10"
            >
              <h3 className="text-2xl font-black text-slate-900 mb-2">Create Custom Channel</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Designate project workspace</p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Channel Name</label>
                   <input 
                     type="text"
                     placeholder="e.g. Audit Team - Mumbai Hub"
                     value={newGroupName}
                     onChange={e => setNewGroupName(e.target.value)}
                     className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-600 transition-all font-sans"
                   />
                </div>

                <div className="space-y-2">
                   <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Select Participants</label>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{selectedGroupMembers.length} Selected</span>
                   </div>
                   <div className="max-h-64 overflow-y-auto space-y-2 border-2 border-slate-100 rounded-3xl p-3 bg-slate-50/50">
                      {users.map(u => (
                        <button 
                          key={u.id}
                          onClick={() => setSelectedGroupMembers(prev => prev.includes(u.id) ? prev.filter(i => i !== u.id) : [...prev, u.id])}
                          className={cn(
                            "w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2",
                            selectedGroupMembers.includes(u.id) ? "bg-blue-600 border-blue-600 text-white shadow-xl scale-[1.02]" : "bg-white border-white text-slate-600 hover:border-slate-200"
                          )}
                        >
                           <div className="flex items-center gap-4">
                              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", selectedGroupMembers.includes(u.id) ? "bg-white/20" : "bg-slate-100 text-slate-400")}>
                                 {u.type === "student" ? <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                              </div>
                              <div className="text-left overflow-hidden">
                                <div className="text-[13px] font-black truncate flex items-center gap-2">
                                  {u.name}
                                  {u.loginName && u.loginName !== u.name && (
                                    <span className="text-[10px] text-blue-500">(aka {u.loginName})</span>
                                  )}
                                  <span className={cn("text-[8px] px-1.5 py-0.5 rounded uppercase", selectedGroupMembers.includes(u.id) ? "bg-white/20" : "bg-slate-900 text-white")}>{u.designation}</span>
                                </div>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                   <div className="flex items-center gap-2">
                                      <Phone className="h-2.5 w-2.5 opacity-60" />
                                      <span className="text-[10px] font-mono font-bold opacity-80">App: {u.phone}</span>
                                      {u.loginPhone && u.loginPhone !== u.phone && (
                                        <span className="text-[10px] font-mono font-bold text-blue-400">/ Login: {u.loginPhone}</span>
                                      )}
                                   </div>
                                   <span className="text-[8px] font-black uppercase opacity-40">• {u.location}</span>
                                </div>
                              </div>
                           </div>
                           <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center", selectedGroupMembers.includes(u.id) ? "bg-white text-blue-600 border-white" : "border-slate-200")}>
                             {selectedGroupMembers.includes(u.id) && <CheckCircle2 className="h-4 w-4" />}
                           </div>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex gap-3 pt-4">
                   <button 
                     onClick={() => setIsCreatingGroup(false)}
                     className="flex-1 py-4 text-xs font-black text-slate-400 uppercase hover:bg-slate-50 rounded-2xl transition-all"
                   >Cancel</button>
                   <button 
                     onClick={manualCreateGroup}
                     disabled={!newGroupName.trim() || selectedGroupMembers.length === 0}
                     className="flex-2 py-4 bg-blue-600 text-white text-xs font-black uppercase rounded-2xl shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                   >Establish Connection</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* User Profile Modal (Instagram Style) */}
      <AnimatePresence>
        {viewingProfile && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
               <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-600">
                  <button 
                    onClick={() => setViewingProfile(null)}
                    className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-all"
                  >✕</button>
               </div>
               
               <div className="px-8 pb-8 -mt-12 flex-1 overflow-y-auto">
                  <div className="flex flex-col items-center mb-8">
                     <div className="h-24 w-24 rounded-full bg-white p-1.5 shadow-xl">
                        <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white">
                           {viewingProfile.type === "student" ? <User className="h-10 w-10" /> : <Building2 className="h-10 w-10" />}
                        </div>
                     </div>
                     <h3 className="mt-4 text-2xl font-black text-slate-900">{viewingProfile.name}</h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{viewingProfile.type === "student" ? "Field Auditor" : "Business Entity"}</p>
                     
                     <div className="mt-6 flex gap-8">
                        <div className="text-center">
                           <div className="text-lg font-black text-slate-900">{userAssignments.length}</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase">Projects</div>
                        </div>
                        <div className="text-center">
                           <div className="text-lg font-black text-slate-900">{userAssignments.filter(a => a.status === "completed").length}</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase">Success</div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Location Fingerprints</h4>
                        <div className="grid grid-cols-2 gap-3">
                           {Array.from(new Set(userAssignments.map(a => a.auditLocation))).map((loc, i) => (
                             <div key={i} className="bg-slate-50 p-3 rounded-2xl flex items-center gap-2 border border-slate-100">
                                <MapPin className="h-3 w-3 text-blue-600" />
                                <span className="text-[10px] font-bold text-slate-700 truncate">{loc}</span>
                             </div>
                           ))}
                           {userAssignments.length === 0 && <p className="text-[10px] text-slate-400 italic col-span-2 text-center py-4">No active footprint found</p>}
                        </div>
                     </div>

                     <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Recent Activity</h4>
                        <div className="space-y-2">
                           {userAssignments.slice(0, 5).map(a => (
                             <div key={a.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all group">
                                <div>
                                   <p className="text-xs font-bold text-slate-800">{a.auditType}</p>
                                   <p className="text-[9px] font-medium text-slate-400">{a.auditLocation} • {new Date(a.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className={cn(
                                   "px-2 py-1 rounded-lg text-[8px] font-black uppercase",
                                   a.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                )}>{a.status}</span>
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className="pt-4 flex gap-3">
                        <a 
                          href={`mailto:${viewingProfile.email}`} 
                          className="flex-1 py-3 bg-slate-900 text-white text-[10px] font-black uppercase text-center rounded-2xl hover:bg-slate-800 transition-all"
                        >Contact via Email</a>
                        <button 
                          onClick={() => {
                            setActiveChat({ id: viewingProfile.id, name: viewingProfile.name, isGroup: false });
                            setViewingProfile(null);
                            setActiveTab("chats");
                          }}
                          className="flex-1 py-3 bg-blue-600 text-white text-[10px] font-black uppercase text-center rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >Send Message</button>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>

  </div>
  );
}
