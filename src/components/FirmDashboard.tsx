import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare,
  Plus, 
  History, 
  MapPin, 
  Calendar, 
  User, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  ArrowRight,
  LayoutDashboard,
  Wallet,
  Trash2,
  Edit3,
  ShieldCheck,
  Briefcase
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { User as UserType, Assignment } from "@/src/types";

interface FirmDashboardProps {
  user: UserType;
  setUser: (user: any) => void;
}

import { Chat } from "./Chat";
import { io } from "socket.io-client";

export default function FirmDashboard({ user, setUser }: FirmDashboardProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "create" | "history" | "pending" | "dues" | "profile" | "chats">("dashboard");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<{ id: string; name: string; isGroup: boolean } | null>(null);

  // Create Assignment State
  const [formData, setFormData] = useState({
    auditLocation: "",
    auditType: "",
    requirement: "",
    paymentDetail: "",
    paymentDueDate: "",
    dueDate: "",
  });

  // Filters
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/assignments?userId=${user.id}&role=firm`);
      const data = await response.json();
      setAssignments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch(`/api/chats/${user.id}`);
      const data = await res.json();
      // Only show groups where this firm is a member
      setGroups(data.groups.filter((g: any) => g.members.includes(user.id)));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchGroups();

    const socket = io();
    socket.emit("join", user.id);
    
    socket.on("group-created", (group) => {
      setGroups(prev => [...prev, group]);
    });

    return () => { socket.close(); };
  }, [user.id, activeTab]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          firmId: user.id,
          firmName: user.name,
          firmPhone: user.phone,
          firmEmail: user.email,
        }),
      });
      if (response.ok) {
        setActiveTab("history");
        setFormData({ auditLocation: "", auditType: "", requirement: "", paymentDetail: "", paymentDueDate: "", dueDate: "" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssignment = async (id: string, updates: any) => {
    await fetch(`/api/assignments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    fetchAssignments();
  };

  const handleDeleteAssignment = async (id: string) => {
    await fetch(`/api/assignments/${id}`, { method: "DELETE" });
    fetchAssignments();
  };

  const tabs = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "create", label: "Add Task", icon: Plus },
    { id: "history", label: "History", icon: History },
    { id: "chats", label: "Messages", icon: MessageSquare },
    { id: "pending", label: "Pending", icon: MapPin },
    { id: "dues", label: "Wallet", icon: Wallet },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full shrink-0 border-b border-slate-200 bg-white p-4 lg:w-64 lg:border-b-0 lg:border-r lg:p-6">
        <div className="mb-8 hidden lg:block">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Menu
          </div>
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

      {/* Primary Workspace */}
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
                "flex-1 rounded-[40px] overflow-hidden bg-white border border-slate-200 shadow-xl",
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

          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-5xl space-y-10"
            >
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Welcome back!</h2>
                <p className="text-sm font-medium text-slate-500">Here's a quick look at your current audits.</p>
              </div>

              {/* Bento Stats */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-50 opacity-50" />
                  <div className="relative">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Pipeline</div>
                    <div className="mt-2 text-5xl font-black tracking-tight text-slate-900">{assignments.length}</div>
                    <div className="mt-4 text-xs font-bold text-blue-600">Active assignments</div>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-50 opacity-50" />
                  <div className="relative">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verification Pending</div>
                    <div className="mt-2 text-5xl font-black tracking-tight text-amber-500">
                      {assignments.filter(a => a.status === "pending_admin").length}
                    </div>
                    <div className="mt-4 text-xs font-bold text-amber-600">Awaiting admin review</div>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-50 opacity-50" />
                  <div className="relative">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Audit Completion</div>
                    <div className="mt-2 text-5xl font-black tracking-tight text-emerald-500">
                      {assignments.filter(a => a.status === "completed").length}
                    </div>
                    <div className="mt-4 text-xs font-bold text-emerald-600">Successfully closed units</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Table Style */}
              <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                  <h3 className="text-lg font-bold text-slate-800">Operational Log</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {assignments.slice(0, 5).map(a => (
                    <div key={a.id} className="group flex items-center justify-between p-6 transition-colors hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-2xl border transition-all",
                          a.status === "completed" 
                            ? "border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm" 
                            : "border-blue-100 bg-blue-50 text-blue-600"
                        )}>
                          {a.status === "completed" ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{a.auditType}</p>
                          <p className="text-xs font-medium text-slate-500">
                            {a.auditLocation} <span className="mx-1 opacity-20">|</span> {new Date(a.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">
                        {a.status.replace("_", " ")}
                      </div>
                    </div>
                  ))}
                  {assignments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                      <Search className="mb-4 h-12 w-12" />
                      <p className="font-bold tracking-tight">No activity recorded yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "create" && (
            <motion.div 
              key="create"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mx-auto max-w-4xl space-y-8"
            >
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Post an Audit</h2>
                <p className="text-sm font-medium text-slate-500">Fill in the details for your new audit requirement.</p>
              </div>

              <div className="rounded-[40px] bg-white p-10 border border-slate-100 shadow-xl">
                <form onSubmit={handleCreateAssignment} className="space-y-8">
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Where is the audit?</label>
                      <div className="relative group">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input required value={formData.auditLocation} onChange={e => setFormData({...formData, auditLocation: e.target.value})} className="w-full rounded-2xl border-2 border-slate-100 bg-white pl-12 pr-5 py-4 text-sm font-bold outline-none focus:border-blue-600 transition-all font-sans" placeholder="City or Branch Name" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Type of Audit</label>
                      <div className="relative group">
                        <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input required value={formData.auditType} onChange={e => setFormData({...formData, auditType: e.target.value})} className="w-full rounded-2xl border-2 border-slate-100 bg-white pl-12 pr-5 py-4 text-sm font-bold outline-none focus:border-blue-600 transition-all font-sans" placeholder="Financial, Safety, etc." />
                      </div>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">What needs to be done?</label>
                      <textarea required value={formData.requirement} onChange={e => setFormData({...formData, requirement: e.target.value})} className="w-full rounded-2xl border-2 border-slate-100 bg-white px-5 py-4 text-sm font-medium outline-none focus:border-blue-600 transition-all min-h-[120px] leading-relaxed" placeholder="List your requirements here..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Payment Amount</label>
                      <div className="relative group">
                        <Wallet className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input required value={formData.paymentDetail} onChange={e => setFormData({...formData, paymentDetail: e.target.value})} className="w-full rounded-2xl border-2 border-slate-100 bg-white pl-12 pr-5 py-4 text-sm font-bold outline-none focus:border-blue-600 transition-all font-sans" placeholder="Fees you will pay" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Payment Payout Date</label>
                      <div className="relative group">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input required type="date" value={formData.paymentDueDate} onChange={e => setFormData({...formData, paymentDueDate: e.target.value})} className="w-full rounded-2xl border-2 border-slate-100 bg-white pl-12 pr-5 py-4 text-sm font-bold outline-none focus:border-blue-600 transition-all font-sans" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Audit Submission Due Date</label>
                      <div className="relative group">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input required type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full rounded-2xl border-2 border-slate-100 bg-white pl-12 pr-5 py-4 text-sm font-bold outline-none focus:border-blue-600 transition-all font-sans" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-50">
                    <button 
                      disabled={loading}
                      type="submit" 
                      className="w-full py-5 bg-slate-900 text-white font-black rounded-[24px] shadow-2xl shadow-slate-200 hover:bg-slate-800 hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50"
                    >
                      {loading ? "Sending..." : "Submit Audit Request"}
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-4 font-bold uppercase tracking-widest italic">
                      Admin will review this before it goes live.
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold">Assignment History</h2>
              <div className="grid gap-4">
                {assignments.map(a => (
                  <div key={a.id} className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-lg font-bold">{a.auditType}</div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <MapPin className="h-4 w-4" /> {a.auditLocation}
                          <Calendar className="h-4 w-4 ml-2" /> Due: {new Date(a.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-start">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                          a.status === "completed" ? "bg-green-100 text-green-700" :
                          a.status === "assigned" ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {a.status.replace("_", " ")}
                        </span>
                        {a.status === "pending_admin" && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setFormData({
                                  auditLocation: a.auditLocation,
                                  auditType: a.auditType,
                                  requirement: a.requirement,
                                  paymentDetail: a.paymentDetail,
                                  paymentDueDate: a.paymentDueDate || "",
                                  dueDate: a.dueDate,
                                });
                                setActiveTab("create");
                                handleDeleteAssignment(a.id); // Re-create on submit
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteAssignment(a.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        <button 
                          onClick={() => setSelectedAudit(a)}
                          className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all"
                        >
                          View Details
                        </button>
                        {a.status === "approved" && (
                           <button 
                            onClick={() => handleDeleteAssignment(a.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {assignments.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 text-slate-400">
                    No assignments found. Start by creating one!
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "pending" && (
             <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-2xl font-bold">Pending Locations</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {assignments.filter(a => a.status !== "completed").map(a => (
                    <div key={a.id} className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-2 h-full bg-blue-500" />
                      <h4 className="font-bold text-lg mb-2">{a.auditLocation}</h4>
                      <p className="text-sm text-slate-500 mb-4">{a.auditType}</p>
                      <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
                        <Clock className="h-4 w-4" /> {a.status.replace("_", " ")}
                      </div>
                    </div>
                  ))}
                </div>
             </motion.div>
          )}

          {activeTab === "dues" && (
            <motion.div key="dues" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">Payment Dues</h2>
                <div className="flex gap-2 items-center">
                   <div className="text-xs font-bold uppercase text-slate-400 mr-2">Filter Range:</div>
                   <input 
                    type="date" 
                    className="text-xs border rounded-lg px-2 py-1 outline-none" 
                    onChange={e => setDateFilter({...dateFilter, start: e.target.value})} 
                   />
                   <span className="text-slate-300">to</span>
                   <input 
                    type="date" 
                    className="text-xs border rounded-lg px-2 py-1 outline-none"
                    onChange={e => setDateFilter({...dateFilter, end: e.target.value})}
                   />
                </div>
              </div>

              <div className="space-y-4">
                {assignments.filter(a => {
                  if (!dateFilter.start && !dateFilter.end) {
                    const today = new Date().toISOString().split('T')[0];
                    return a.dueDate === today;
                  }
                  const d = a.dueDate;
                  const start = dateFilter.start || '1900-01-01';
                  const end = dateFilter.end || '2100-01-01';
                  return d >= start && d <= end;
                }).map(a => (
                  <div key={a.id} className="flex flex-col sm:flex-row items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-sm gap-4">
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-bold text-lg">{a.auditType}</div>
                        <div className="text-sm text-slate-500">Location: {a.auditLocation} • Due: {new Date(a.dueDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tighter">Amount Quote</div>
                      <div className="text-xl font-black text-slate-900">{a.paymentDetail}</div>
                    </div>
                  </div>
                ))}
                {assignments.filter(a => {
                   const today = new Date().toISOString().split('T')[0];
                   return a.dueDate === today;
                }).length === 0 && !dateFilter.start && (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed text-slate-400">
                    No payments due today.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <h2 className="text-2xl font-bold">Firm Profile</h2>
              <div className="rounded-3xl bg-white p-8 border border-slate-100 shadow-xl max-w-2xl">
                 <div className="space-y-6">
                    <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                       <div className="h-20 w-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <User className="h-10 w-10" />
                       </div>
                       <div>
                          <h3 className="text-xl font-bold">{user.name}</h3>
                          <p className="text-slate-500">Firm Account</p>
                       </div>
                    </div>
                    
                    <div className="grid gap-6">
                       <div className="space-y-2">
                          <label className="text-sm font-medium">Firm Name</label>
                          <input 
                            value={user.name} 
                            onChange={e => setUser({...user, name: e.target.value})}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-medium">Email Address</label>
                          <input 
                            value={user.email} 
                            onChange={e => setUser({...user, email: e.target.value})}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-medium">Phone Number</label>
                          <input 
                            value={user.phone} 
                            onChange={e => setUser({...user, phone: e.target.value})}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" 
                          />
                       </div>
                    </div>
                    
                    <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all">
                       Update Profile
                    </button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Firm View Details Modal */}
        <AnimatePresence>
          {selectedAudit && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden p-10"
              >
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Audit Summary</h3>
                  <button onClick={() => setSelectedAudit(null)} className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold">×</button>
                </div>

                <div className="space-y-8">
                   <section>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 italic">Assignment Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-slate-50 rounded-2xl">
                            <label className="text-[8px] font-bold text-slate-400 block uppercase">Location</label>
                            <span className="font-bold text-sm">{selectedAudit.auditLocation}</span>
                         </div>
                         <div className="p-4 bg-slate-50 rounded-2xl">
                            <label className="text-[8px] font-bold text-slate-400 block uppercase">Type</label>
                            <span className="font-bold text-sm">{selectedAudit.auditType}</span>
                         </div>
                         <div className="p-4 bg-slate-50 rounded-2xl cursor-not-allowed opacity-60">
                            <label className="text-[8px] font-bold text-slate-400 block uppercase">Budget Set</label>
                            <span className="font-bold text-sm text-blue-600">{selectedAudit.paymentDetail}</span>
                         </div>
                         <div className="p-4 bg-slate-50 rounded-2xl">
                            <label className="text-[8px] font-bold text-slate-400 block uppercase">Audit Due</label>
                            <span className="font-bold text-sm">{selectedAudit.dueDate}</span>
                         </div>
                         <div className="p-4 bg-slate-50 rounded-2xl">
                            <label className="text-[8px] font-bold text-slate-400 block uppercase">Payment Due</label>
                            <span className="font-bold text-sm text-emerald-600">{selectedAudit.paymentDueDate || "N/A"}</span>
                         </div>
                      </div>
                   </section>

                   {selectedAudit.auditorSubmission && (
                      <section className="animate-in fade-in slide-in-from-bottom-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4 italic">Allocated Auditor Info</h4>
                        <div className="p-6 bg-blue-50 border-2 border-blue-100 rounded-3xl space-y-3">
                           <div className="flex justify-between items-center pb-3 border-b border-blue-200/50">
                              <span className="text-xs font-medium text-blue-700">Name</span>
                              <span className="text-sm font-black text-slate-900">{selectedAudit.auditorSubmission.auditorName}</span>
                           </div>
                           <div className="flex justify-between items-center pb-3 border-b border-blue-200/50">
                              <span className="text-xs font-medium text-blue-700">Phone</span>
                              <span className="text-sm font-bold text-slate-900">{selectedAudit.auditorSubmission.auditorPhone}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-blue-700">Email</span>
                              <span className="text-sm font-bold text-slate-900">{selectedAudit.auditorSubmission.auditorEmail}</span>
                           </div>
                        </div>
                      </section>
                   )}

                   {selectedAudit.adminFields?.termsConditions && (
                      <section>
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 italic">Admin Compliance Terms</h4>
                         <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl text-xs text-amber-800 leading-relaxed italic">
                            "{selectedAudit.adminFields.termsConditions}"
                         </div>
                      </section>
                   )}

                   <button onClick={() => setSelectedAudit(null)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:scale-[1.01] transition-all">Dismiss View</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
