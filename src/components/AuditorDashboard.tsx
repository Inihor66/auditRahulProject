import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell,
  MessageSquare,
  Compass, 
  Search, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  User, 
  Wallet,
  Briefcase,
  FileText,
  ChevronRight,
  Info,
  Building2,
  Phone,
  Mail,
  CreditCard,
  History,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { User as UserType, Assignment } from "@/src/types";

import { Chat } from "./Chat";
import { io } from "socket.io-client";

interface AuditorDashboardProps {
  user: UserType;
  setUser: (user: any) => void;
}

export default function AuditorDashboard({ user, setUser }: AuditorDashboardProps) {
  const [activeTab, setActiveTab] = useState<"explore" | "my-audits" | "reports" | "profile" | "chats">("explore");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<Assignment | null>(null);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showSubmission, setShowSubmission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    auditorName: user.name,
    auditorPhone: user.phone,
    auditorEmail: user.email,
    auditorAadhar: user.aadhar || "",
    auditorUPI: user.upi || "",
    customReport: "",
  });

  const [claimForm, setClaimForm] = useState({
    auditorName: user.name,
    auditorPhone: user.phone,
    auditorEmail: user.email,
    auditorAadhar: user.aadhar || "",
    auditorUPI: user.upi || "",
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<{ id: string; name: string; isGroup: boolean } | null>(null);
  const [searchText, setSearchText] = useState("");

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/assignments?userId=${user.id}&role=auditor`);
      const data = await response.json();
      setAssignments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications/${user.id}`);
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch(`/api/chats/${user.id}`);
      const data = await res.json();
      // Filter out only groups where this user is invited
      setGroups(data.groups.filter((g: any) => g.members.includes(user.id)));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchNotifications();
    fetchGroups();

    const socket = io();
    socket.emit("join", user.id);
    
    socket.on("notification", (notif) => {
      setNotifications(prev => [notif, ...prev]);
    });

    socket.on("group-created", (group) => {
      setGroups(prev => [...prev, group]);
    });

    return () => { socket.close(); };
  }, [user.id, activeTab]);

  const handleAssign = async () => {
    if (!selectedAudit) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/assignments/${selectedAudit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "assigned",
          auditorId: user.id,
          adminFields: {
            ...selectedAudit.adminFields,
            auditorName: claimForm.auditorName,
            auditorAadhar: claimForm.auditorAadhar,
            auditorPhone: claimForm.auditorPhone,
            auditorEmail: claimForm.auditorEmail,
          },
          auditorSubmission: {
            ...claimForm,
            status: "pending"
          }
        }),
      });
      if (response.ok) {
        setShowClaimForm(false);
        setSelectedAudit(null);
        setActiveTab("my-audits");
        fetchAssignments();
        fetchGroups();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedAudit) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/assignments/${selectedAudit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditorSubmission: {
            ...submissionForm,
            status: "submitted",
            completedAt: new Date().toISOString(),
          },
          status: "completed"
        }),
      });
      if (response.ok) {
        setShowSubmission(false);
        setSelectedAudit(null);
        fetchAssignments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAudit = async (auditId: string) => {
    if (!confirm("Are you sure you want to cancel this audit? It will be made available to other students.")) return;
    try {
      const res = await fetch(`/api/assignments/${auditId}/cancel`, { method: "POST" });
      if (res.ok) {
        fetchAssignments();
        setSelectedAudit(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to cancel audit");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: "explore", label: "Find Work", icon: Briefcase },
    { id: "my-audits", label: "My Tasks", icon: Clock },
    { id: "chats", label: "Messages", icon: MessageSquare },
    { id: "reports", label: "Earnings", icon: FileText },
    { id: "profile", label: "My Profile", icon: User },
  ];

  const openAssignments = assignments.filter(a => a.status === "approved");
  const myAssignments = assignments.filter(a => a.auditorId === user.id);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden lg:flex-row">
      {/* Search & Navigation Sidebar */}
      <aside className="w-full shrink-0 border-b border-slate-200 bg-white p-4 lg:w-64 lg:border-b-0 lg:border-r lg:p-6">
        <div className="mb-8 hidden lg:block">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Welcome
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between lg:mb-8">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-full p-2 hover:bg-slate-50 transition-all"
          >
            <Bell className="h-5 w-5 text-slate-600" />
            {notifications.some(n => !n.isRead) && (
              <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
            )}
          </button>
        </div>
        
        <nav className="flex flex-row flex-wrap gap-2 lg:flex-col">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "group flex flex-1 items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-bold transition-all lg:flex-none",
                activeTab === tab.id 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              <tab.icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", activeTab === tab.id ? "text-blue-400" : "text-slate-400")} />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10">
        <AnimatePresence mode="wait">
          {activeTab === "chats" && (
            <motion.div 
              key="chats" 
              initial={{ opacity: 0, scale: 0.99 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="flex h-full gap-6"
            >
              <div className="w-80 shrink-0 space-y-4">
                <div className="rounded-[32px] bg-white p-6 border border-slate-200">
                   <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Official Channels</h3>
                   <div className="space-y-2">
                      <button 
                        onClick={() => setActiveChat({ id: "admin", name: "Admin Support", isGroup: false })}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all",
                          activeChat?.id === "admin" ? "bg-slate-900 text-white shadow-lg" : "hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        <ShieldCheck className={cn("h-5 w-5", activeChat?.id === "admin" ? "text-white" : "text-blue-600")} />
                        <div className="flex-1 overflow-hidden">
                          <p className="font-bold text-sm">Central Admin</p>
                          <p className={cn("text-[10px] uppercase font-medium", activeChat?.id === "admin" ? "text-blue-100" : "text-slate-400")}>Direct Support</p>
                        </div>
                      </button>

                      {groups.map(g => (
                        <button 
                          key={g.id}
                          onClick={() => setActiveChat({ id: g.id, name: g.name, isGroup: true })}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all",
                            activeChat?.id === g.id ? "bg-blue-600 text-white shadow-lg" : "hover:bg-slate-50 text-slate-700"
                          )}
                        >
                          <Briefcase className={cn("h-5 w-5", activeChat?.id === g.id ? "text-white" : "text-blue-600")} />
                          <div className="flex-1 overflow-hidden">
                            <p className="font-bold text-sm truncate">{g.name}</p>
                            <p className={cn("text-[10px] uppercase font-medium", activeChat?.id === g.id ? "text-blue-100" : "text-slate-400")}>Official Project Channel</p>
                          </div>
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              <div className={cn(
                "flex-1 rounded-[40px] overflow-hidden bg-white border border-slate-200 shadow-xl relative",
                !activeChat && "hidden md:flex",
                activeChat && "absolute inset-0 z-10 md:relative md:flex"
              )}>
                 {activeChat ? (
                   <Chat 
                    currentUser={user} 
                    targetRoom={activeChat.id} 
                    roomName={activeChat.name} 
                    isGroup={activeChat.isGroup} 
                    onBack={() => setActiveChat(null)}
                   />
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-20 bg-white">
                      <MessageSquare className="h-16 w-16 mb-4" />
                      <p className="font-bold tracking-tight">Select a message stream</p>
                   </div>
                 )}
              </div>
            </motion.div>
          )}

          {activeTab === "explore" && (
            <motion.div 
              key="explore" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mx-auto max-w-5xl space-y-8"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">New Work</h2>
                  <p className="text-sm font-medium text-slate-500">Pick a task that's right for you.</p>
                </div>
                <div className="relative w-full max-w-xs transition-all duration-300 focus-within:max-w-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    placeholder="Filter by city..." 
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-white text-sm font-medium shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" 
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {openAssignments.filter(a => a.auditLocation.toLowerCase().includes(searchText.toLowerCase())).map(a => (
                  <div 
                    key={a.id} 
                    onClick={() => setSelectedAudit(a)}
                    className="group relative flex flex-col gap-4 overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-300 transition-all group-hover:bg-blue-50 group-hover:text-blue-500">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-xl font-bold tracking-tight text-slate-800">{a.auditLocation}</h4>
                      <p className="text-sm font-medium text-slate-500">{a.auditType}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors italic">
                        {a.visibleFields?.includes("firmName") ? a.firmName : "Restricted Branch"}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600">
                        <Calendar className="h-3 w-3" />
                        {new Date(a.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {openAssignments.length === 0 && (
                  <div className="sm:col-span-2 flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-[32px] opacity-40">
                     <Compass className="mb-4 h-12 w-12" />
                     <p className="font-bold tracking-tight">Monitoring new secure streams...</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "my-audits" && (
            <motion.div key="my-audits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
               <h2 className="text-2xl font-bold">Current Assignments</h2>
               <div className="grid gap-4">
                  {myAssignments.map(a => (
                    <div key={a.id} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                       <div className="space-y-4">
                          <div className="flex items-center gap-3">
                             <div className={cn(
                               "h-10 w-10 rounded-xl flex items-center justify-center",
                               a.status === "completed" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                             )}>
                               {a.status === "completed" ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                             </div>
                             <div>
                                <h4 className="font-bold">{a.auditType}</h4>
                                <p className="text-sm text-slate-500">{a.auditLocation}</p>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                             <div className="p-3 rounded-xl bg-slate-50">
                                <span className="text-slate-400 font-bold block mb-1">DUE DATE</span>
                                <span className="font-bold">{new Date(a.dueDate).toLocaleDateString()}</span>
                             </div>
                             <div className="p-3 rounded-xl bg-slate-50">
                                <span className="text-slate-400 font-bold block mb-1">PAYOUT</span>
                                <span className="font-black text-blue-600">{a.adminFields.paymentInfo || a.paymentDetail}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex flex-col gap-2 justify-center">
                          {a.status === "assigned" && (
                            (() => {
                              const assignedAt = new Date(a.assignedAt || a.createdAt);
                              const diffHrs = (new Date().getTime() - assignedAt.getTime()) / (1000 * 60 * 60);
                              if (diffHrs <= 12) {
                                return (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleCancelAudit(a.id); }}
                                    className="px-6 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-red-100 transition-all mb-1"
                                  >
                                    Cancel Claim (12h Left)
                                  </button>
                                );
                              }
                              return null;
                            })()
                          )}
                          <button 
                            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all"
                            onClick={() => setSelectedAudit(a)}
                          >
                             View Details
                          </button>
                       </div>
                    </div>
                  ))}
                  {myAssignments.length === 0 && (
                     <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed text-slate-400">
                        Pick an assignment from the explore tab to get started.
                     </div>
                  )}
               </div>
            </motion.div>
          )}

          {activeTab === "reports" && (
            <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
               <h2 className="text-2xl font-bold">Earnings & Reports</h2>
               <div className="grid gap-6 sm:grid-cols-2">
                  <div className="p-8 bg-slate-900 text-white rounded-3xl shadow-xl">
                     <History className="h-8 w-8 text-blue-400 mb-4" />
                     <h4 className="text-slate-400 font-medium">Pending Dues</h4>
                     <div className="text-4xl font-black mt-2">
                        {myAssignments.filter(a => a.status === "assigned").length} <span className="text-lg font-normal text-slate-500">Items</span>
                     </div>
                     <p className="mt-4 text-sm text-slate-400 italic">Payments currently under processing from Firms.</p>
                  </div>
                  <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm">
                     <CheckCircle2 className="h-8 w-8 text-green-500 mb-4" />
                     <h4 className="text-slate-500 font-medium">Completed Audits</h4>
                     <div className="text-4xl font-black mt-2 text-slate-900">
                        {myAssignments.filter(a => a.status === "completed").length}
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === "profile" && (
             <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-2xl space-y-8">
               <div className="flex flex-col gap-1">
                 <h2 className="text-3xl font-black tracking-tight text-slate-900">My Profile</h2>
                 <p className="text-sm font-medium text-slate-500">View and update your student details</p>
               </div>

               <div className="rounded-[40px] bg-white p-10 border border-slate-100 shadow-xl space-y-10 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-[100%] -mr-16 -mt-16 -z-10" />
                 
                 <div className="flex items-center gap-6">
                    <div className="group relative">
                      <div className="h-24 w-24 rounded-[32px] bg-slate-900 text-white flex items-center justify-center shadow-2xl relative z-10">
                         <User className="h-10 w-10" />
                      </div>
                      <div className="absolute inset-0 bg-blue-600 rounded-[32px] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h3>
                       <div className="flex items-center gap-2 mt-1">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Verified Student Auditor</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="grid gap-8 sm:grid-cols-2 pt-6 border-t border-slate-100">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Aadhar ID</label>
                       <div className="relative">
                          <input readOnly value={user.aadhar} className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-sm font-bold text-slate-500 outline-none" />
                          <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 opacity-50" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">UPI ID (For Money)</label>
                       <div className="relative group">
                          <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                          <input 
                            value={user.upi} 
                            onChange={e => setUser({...user, upi: e.target.value})}
                            placeholder="yourname@bank"
                            className="w-full rounded-2xl border-2 border-slate-100 bg-white pl-12 pr-5 py-4 text-sm font-bold outline-none focus:border-blue-600 transition-all shadow-sm" 
                          />
                       </div>
                    </div>
                    <div className="space-y-2 col-span-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cities I Can Work In</label>
                       <div className="flex flex-wrap gap-2 p-5 bg-slate-50 border border-slate-100 rounded-3xl min-h-[60px]">
                          {user.auditLocations?.map((loc: string) => (
                             <span key={loc} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-600 shadow-sm">
                                {loc}
                             </span>
                          ))}
                          <p className="text-[10px] text-slate-400 mt-2 w-full italic">Ask admin if you want to add more cities.</p>
                       </div>
                    </div>
                 </div>
                 
                 <button className="relative w-full overflow-hidden group py-5 bg-slate-900 text-white font-black rounded-3xl transition-all hover:shadow-2xl hover:shadow-slate-900/20 active:scale-[0.98]">
                    <span className="relative z-10">Save My Details</span>
                    <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                 </button>
              </div>
             </motion.div>
          )}
        </AnimatePresence>

        {/* Notification Drawer */}
        <AnimatePresence>
          {showNotifications && (
            <div className="fixed inset-0 z-[110] flex justify-end">
              <motion.div 
                initial={{ x: "100%" }} 
                animate={{ x: 0 }} 
                exit={{ x: "100%" }}
                className="w-full max-w-md h-full bg-white shadow-2xl shadow-slate-900/20 border-l border-slate-100 p-8"
              >
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-xl font-black tracking-tight">Live Alerts</h3>
                     <button onClick={() => setShowNotifications(false)} className="px-3 py-1 text-xs font-bold bg-slate-50 rounded-lg">Dismiss</button>
                  </div>
                  <div className="space-y-4">
                     {notifications.map(n => (
                        <div key={n.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 relative group">
                           <p className="text-sm font-bold text-slate-800">{n.title}</p>
                           <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                           <p className="text-[10px] text-slate-400 mt-2">{new Date(n.createdAt).toLocaleTimeString()}</p>
                        </div>
                     ))}
                     {notifications.length === 0 && (
                        <div className="text-center py-20 opacity-30">
                           <Bell className="h-12 w-12 mx-auto mb-4" />
                           <p className="font-bold text-sm">Scanning for area-specific tasks...</p>
                        </div>
                     )}
                  </div>
              </motion.div>
              <div className="fixed inset-0 bg-black/5 -z-10" onClick={() => setShowNotifications(false)} />
            </div>
          )}
        </AnimatePresence>

        {/* Audit Detail Modal */}
        <AnimatePresence>
           {selectedAudit && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="w-full max-w-2xl bg-white rounded-[40px] overflow-hidden shadow-2xl relative"
                >
                   <button onClick={() => setSelectedAudit(null)} className="absolute top-6 right-6 h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-all font-bold">×</button>
                   
                   <div className="p-10">
                       <div className="space-y-6 mb-10">
                          <div>
                             <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Project Brand / Firm</div>
                             <h2 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">
                                {selectedAudit.visibleFields.includes("firmName") ? selectedAudit.firmName : "Semi-Anonymous"}
                             </h2>
                          </div>
                          <div>
                             <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Audit Location</div>
                             <h3 className="text-2xl font-bold text-slate-700 tracking-tight flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-emerald-500" /> {selectedAudit.auditLocation}
                             </h3>
                          </div>
                       </div>

                      <div className="grid gap-8 md:grid-cols-2">
                         <div className="space-y-6">
                            <section>
                               <h5 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                                  <Building2 className="h-3 w-3" /> Firm Information
                               </h5>
                               <div className="space-y-2">
                                  {selectedAudit.visibleFields.includes("firmName") ? (
                                    <div className="text-sm font-bold text-slate-700">{selectedAudit.firmName}</div>
                                  ) : (
                                    <div className="text-sm font-bold text-slate-400 italic">Firm Name Restricted</div>
                                  )}
                                  {selectedAudit.visibleFields.includes("firmEmail") ? (
                                    <div className="flex items-center gap-2 text-sm text-slate-500"><Mail className="h-3 w-3" /> {selectedAudit.firmEmail}</div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-xs text-slate-400 italic"><Mail className="h-3 w-3" /> Email Restricted</div>
                                  )}
                                  {selectedAudit.visibleFields.includes("firmPhone") ? (
                                    <div className="flex items-center gap-2 text-sm text-slate-500"><Phone className="h-3 w-3" /> {selectedAudit.firmPhone}</div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-xs text-slate-400 italic"><Phone className="h-3 w-3" /> Phone Restricted</div>
                                  )}
                               </div>
                            </section>

                            <section>
                               <h5 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                                  <Info className="h-3 w-3" /> Requirements
                               </h5>
                               <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl italic">
                                  "{selectedAudit.requirement}"
                               </p>
                            </section>
                         </div>

                         <div className="space-y-6">
                             <section className="bg-white p-6 rounded-[32px] border-2 border-blue-100 shadow-md text-slate-900 font-sans">
                               <h5 className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest mb-4">
                                  <CreditCard className="h-4 w-4" /> Remuneration (Payout)
                               </h5>
                               <div className="text-4xl font-black text-slate-900 mb-1">{selectedAudit.adminFields.paymentInfo || selectedAudit.paymentDetail}</div>
                               {selectedAudit.paymentDueDate && (
                                  <div className="text-xs text-emerald-600 font-black uppercase tracking-widest mt-1 bg-emerald-50 inline-block px-2 py-0.5 rounded">
                                     Payout Date: {selectedAudit.paymentDueDate}
                                  </div>
                               )}
                            </section>

                            <section className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                               <h5 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2 italic">
                                  Terms & Conditions
                               </h5>
                               <div className="text-xs text-slate-500 leading-relaxed">
                                  {selectedAudit.adminFields.termsConditions || "Standard platform compliance terms apply."}
                               </div>
                            </section>
                         </div>
                      </div>

                      {selectedAudit.status === "approved" && (
                         <div className="mt-10 pt-10 border-t border-slate-100">
                            <button 
                              disabled={loading}
                              onClick={() => {
                                setClaimForm({
                                  auditorName: user.name,
                                  auditorPhone: user.phone,
                                  auditorEmail: user.email,
                                  auditorAadhar: user.aadhar || "",
                                  auditorUPI: user.upi || "",
                                });
                                setShowClaimForm(true);
                              }}
                              className="w-full py-5 bg-blue-600 text-white text-lg font-black rounded-2xl shadow-[0_20px_50px_rgba(37,99,235,0.2)] hover:shadow-none hover:translate-y-1 transition-all"
                            >
                               Claim this Audit Assignment
                            </button>
                            <p className="text-center text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest italic">
                               Claiming this audit automatically provides your professional credentials to the firm.
                            </p>
                         </div>
                      )}
                      
                      {selectedAudit.status === "assigned" && (
                        <div className="mt-10 space-y-4">
                           <div className="p-4 bg-green-50 text-green-700 rounded-2xl text-center font-bold text-sm">
                              You have claimed this audit. Please proceed to location.
                           </div>
                           <button 
                            onClick={() => {
                              setSubmissionForm({
                                auditorName: user.name,
                                auditorPhone: user.phone,
                                auditorEmail: user.email,
                                auditorAadhar: user.aadhar || "",
                                auditorUPI: user.upi || "",
                                customReport: selectedAudit.auditorSubmission?.customReport || "",
                              });
                              setShowSubmission(true);
                            }}
                            className="w-full py-5 bg-slate-900 text-white text-lg font-black rounded-2xl shadow-xl hover:bg-slate-800 transition-all"
                           >
                             Open Audit Submission Form
                           </button>
                        </div>
                      )}
                   </div>
                </motion.div>
             </div>
           )}
        </AnimatePresence>

        {/* Claim Assignment (Pre-fill) Modal */}
        <AnimatePresence>
          {showClaimForm && selectedAudit && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md overflow-y-auto">
               <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl p-10 my-8"
               >
                  <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Verify & Claim</h2>
                      <p className="text-sm font-medium text-slate-500">Review details and confirm your participation</p>
                    </div>
                    <button onClick={() => setShowClaimForm(false)} className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold">×</button>
                  </div>

                  <div className="space-y-8">
                    {/* Review Section */}
                    <div className="grid gap-6 md:grid-cols-2">
                       <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Audit Summary</h4>
                          <div className="space-y-2">
                             <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Location</span>
                                <span className="font-bold">{selectedAudit.auditLocation}</span>
                             </div>
                             <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Firm</span>
                                <span className="font-bold">
                                  {selectedAudit.visibleFields.includes("firmName") ? selectedAudit.firmName : "Semi-Anonymous"}
                                </span>
                             </div>
                             <div className="mt-4 pt-4 border-t border-slate-200">
                                <span className="text-[10px] font-black text-blue-600 block mb-1">PAYOUT</span>
                                <span className="text-2xl font-black text-slate-900">{selectedAudit.adminFields.paymentInfo || selectedAudit.paymentDetail}</span>
                                {selectedAudit.paymentDueDate && (
                                   <span className="block text-[8px] font-bold text-emerald-600 uppercase mt-1">Due: {selectedAudit.paymentDueDate}</span>
                                )}
                             </div>
                          </div>
                       </div>

                       <div className="bg-amber-50/50 p-6 rounded-3xl space-y-3 border border-amber-100">
                          <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Special Rules</h4>
                          <p className="text-xs text-amber-800 leading-relaxed italic">
                             "{selectedAudit.adminFields.termsConditions || "Standard platform compliance terms apply."}"
                          </p>
                       </div>
                    </div>

                    {/* Editable Details */}
                    <div className="space-y-4">
                       <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Your Credentials (Pre-filled)</h3>
                       <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Name</label>
                             <input 
                               value={claimForm.auditorName} 
                               onChange={e => setClaimForm({...claimForm, auditorName: e.target.value})}
                               className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Phone</label>
                             <input 
                               value={claimForm.auditorPhone} 
                               onChange={e => setClaimForm({...claimForm, auditorPhone: e.target.value})}
                               className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Email</label>
                             <input 
                               value={claimForm.auditorEmail} 
                               onChange={e => setClaimForm({...claimForm, auditorEmail: e.target.value})}
                               className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Aadhar ID</label>
                             <input 
                               value={claimForm.auditorAadhar} 
                               onChange={e => setClaimForm({...claimForm, auditorAadhar: e.target.value})}
                               className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                             />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase px-1">UPI ID (For Payment)</label>
                          <input 
                            value={claimForm.auditorUPI} 
                            onChange={e => setClaimForm({...claimForm, auditorUPI: e.target.value})}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                            placeholder="e.g. name@upi"
                          />
                       </div>
                    </div>

                    <button 
                      disabled={loading}
                      onClick={handleAssign}
                      className="w-full py-5 bg-blue-600 text-white text-lg font-black rounded-3xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]"
                    >
                      {loading ? "Processing..." : "Confirm & Claim Assignment"}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 uppercase font-black tracking-widest">
                       Secure AuditLink Smart Contract Claims
                    </p>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Audit Submission Modal */}
        <AnimatePresence>
          {showSubmission && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md overflow-y-auto">
               <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl p-10"
               >
                  <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Personal Submission</h2>
                      <p className="text-sm font-medium text-slate-500">Confirm your details and submit work</p>
                    </div>
                    <button onClick={() => setShowSubmission(false)} className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold">×</button>
                  </div>

                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Full Name</label>
                          <input 
                            value={submissionForm.auditorName} 
                            onChange={e => setSubmissionForm({...submissionForm, auditorName: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</label>
                          <input 
                            value={submissionForm.auditorPhone} 
                            onChange={e => setSubmissionForm({...submissionForm, auditorPhone: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                          <input 
                            value={submissionForm.auditorEmail} 
                            onChange={e => setSubmissionForm({...submissionForm, auditorEmail: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aadhar ID (Verified)</label>
                          <input 
                            value={submissionForm.auditorAadhar} 
                            onChange={e => setSubmissionForm({...submissionForm, auditorAadhar: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all"
                          />
                       </div>
                    </div>

                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">UPI ID (For Direct Payout)</label>
                       <input 
                        value={submissionForm.auditorUPI} 
                        onChange={e => setSubmissionForm({...submissionForm, auditorUPI: e.target.value})}
                        placeholder="yourname@upi"
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all"
                       />
                    </div>

                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Final Audit Report / Comments</label>
                       <textarea 
                        value={submissionForm.customReport} 
                        onChange={e => setSubmissionForm({...submissionForm, customReport: e.target.value})}
                        placeholder="Add your audit findings here..."
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-blue-600 focus:bg-white transition-all min-h-[120px] leading-relaxed"
                       />
                    </div>

                    <button 
                      disabled={loading}
                      onClick={handleSubmitReport}
                      className="w-full py-5 bg-blue-600 text-white text-lg font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                      {loading ? "Submitting..." : "Authorize & Finalize Submission"}
                    </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
