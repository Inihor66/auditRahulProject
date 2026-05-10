/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  ArrowLeft,
  Building2, 
  UserCircle, 
  LayoutDashboard, 
  LogOut, 
  History, 
  Clock, 
  Wallet, 
  CheckCircle2,
  FilePlus2,
  Settings,
  Printer
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import FirmDashboard from "./components/FirmDashboard";
import AuditorDashboard from "./components/AuditorDashboard";
import AdminDashboard from "./components/AdminDashboard";
import Login from "./components/Login";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [adminPassword, setAdminPassword] = useState("");

  const handleLogoClick = () => {
    setLogoClicks(prev => {
      const next = prev + 1;
      if (next === 7) {
        setShowAdminLogin(true);
        return 0;
      }
      return next;
    });
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "Rahul03072003") {
      setUser({ role: "admin", name: "System Administrator - Rahul", id: "admin" });
      setShowAdminLogin(false);
      setAdminPassword("");
    } else {
      alert("Invalid Password");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLogoClicks(0);
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-[32px] bg-white p-8 shadow-2xl border border-slate-100"
            >
              <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">Restricted Access</h2>
              <p className="text-sm font-medium text-slate-500 mb-6">Enter administrative credentials to continue.</p>
              
              <form onSubmit={handleAdminAuth} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</label>
                  <input 
                    type="password"
                    autoFocus
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-lg font-bold outline-none focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => { setShowAdminLogin(false); setAdminPassword(""); }}
                    className="flex-1 h-12 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 h-12 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
                  >
                    Authenticate
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Top Navigation Bar */}
      <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Secret Logo Trigger */}
          <button 
            onClick={handleLogoClick}
            className="group relative cursor-pointer rounded p-2 transition-colors hover:bg-slate-100 active:scale-95"
            title="Click 7 times for Admin access"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-xl font-bold text-white">A</div>
            <div className="absolute -bottom-8 left-0 hidden whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[10px] text-white group-hover:block">
              AuditPro v1.0
            </div>
          </button>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            AuditPro <span className="text-blue-600">Assistant</span>
          </h1>
          {user && (
            <button 
              onClick={() => setUser(null)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-blue-600 active:scale-95"
            >
              <ArrowLeft className="h-3 w-3 text-blue-600" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-3 border-l pl-6 transition-all animate-in fade-in slide-in-from-right-4">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">Hello, {user.name.split(' ')[0]}!</p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
              <div className="group relative">
                <button 
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-slate-600 shadow-sm transition-all hover:bg-rose-50 hover:text-rose-600"
                >
                  <span className="font-bold">{user.name.substring(0, 2).toUpperCase()}</span>
                </button>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 scale-0 rounded bg-slate-800 px-2 py-1 text-[10px] text-white transition-all group-hover:scale-100">
                  Logout
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Identity Verification System
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.main
              key="login"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="flex-1 overflow-y-auto"
            >
              <Login onLogin={setUser} />
            </motion.main>
          ) : (
            <motion.div
              key="layout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-1 overflow-hidden"
            >
              {user.role === "admin" ? (
                <AdminDashboard />
              ) : user.role === "firm" ? (
                <FirmDashboard user={user} setUser={setUser} />
              ) : (
                <AuditorDashboard user={user} setUser={setUser} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Status Bar */}
      <footer className="flex h-8 shrink-0 items-center justify-between bg-slate-800 px-6 text-[10px] font-medium uppercase tracking-widest text-slate-400">
        <div className="flex items-center gap-4">
          <span>System: <span className="text-emerald-400">Ready</span></span>
          {user && <span>You are: <span className="text-white">{user.role}</span></span>}
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">Made with care</span>
          <span>© {new Date().getFullYear()} AuditPro</span>
        </div>
      </footer>
    </div>
  );
}
