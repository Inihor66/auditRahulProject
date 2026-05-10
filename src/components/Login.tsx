import React, { useState } from "react";
import { motion } from "motion/react";
import { Building2, UserCircle, ArrowRight, ShieldCheck, Mail, Phone, User, Landmark, MapPin } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [role, setRole] = useState<"firm" | "auditor">("auditor");
  const [mode, setMode] = useState<"register" | "signin">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [signInContact, setSignInContact] = useState(""); // Email or Phone
  const [firmData, setFirmData] = useState({ name: "", phone: "", email: "" });
  const [auditorData, setAuditorData] = useState({ 
    name: "", aadhar: "", upi: "", currentLocation: "", 
    auditLocations: "", phone: "", email: "" 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const safeJson = async (res: Response) => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error("Failed to parse JSON response:", text);
          throw new Error("Invalid server response (not JSON)");
        }
      };

      if (mode === "signin") {
        const response = await fetch("/api/login/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact: signInContact, role }),
        });

        if (response.ok) {
          const user = await safeJson(response);
          onLogin(user);
        } else {
          const err = await safeJson(response).catch(() => ({ error: "Login failed (Server error)" }));
          setError(err.error || "Login failed");
        }
      } else {
        const endpoint = role === "firm" ? "/api/login/firm" : "/api/login/auditor";
        const body = role === "firm" ? firmData : { 
          ...auditorData, 
          auditLocations: auditorData.auditLocations.split(",").map(l => l.trim()) 
        };

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const user = await safeJson(response);
          onLogin(user);
        } else {
          const err = await safeJson(response).catch(() => ({ error: "Registration failed (Server error)" }));
          setError(err.error || "Registration failed");
        }
      }
    } catch (error) {
      console.error("Auth failed:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-xl">
        <div className="mb-10 text-center animate-in fade-in zoom-in-95 duration-700">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 sm:text-5xl">
            AuditPro <span className="text-blue-600">{mode === 'signin' ? 'Login' : 'Sign Up'}</span>
          </h1>
          <p className="mt-4 text-sm font-medium text-slate-500 uppercase tracking-widest leading-relaxed">
            {mode === 'signin' 
              ? 'Login to your account' 
              : 'Create your new account today'}
          </p>
        </div>

        {/* Role & Mode Selection */}
        <div className="space-y-4 mb-8">
          <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner border border-slate-200">
            <button
              onClick={() => setRole("auditor")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
                role === "auditor" ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <UserCircle className="h-4 w-4" />
              I am a Student
            </button>
            <button
              onClick={() => setRole("firm")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
                role === "firm" ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Building2 className="h-4 w-4" />
              I am a Firm
            </button>
          </div>
          
          <div className="flex justify-center gap-6">
            <button 
              onClick={() => setMode("signin")}
              className={cn(
                "text-xs font-black uppercase tracking-widest transition-all pb-1 border-b-2",
                mode === "signin" ? "border-blue-600 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              Go to Login
            </button>
            <button 
              onClick={() => setMode("register")}
              className={cn(
                "text-xs font-black uppercase tracking-widest transition-all pb-1 border-b-2",
                mode === "register" ? "border-blue-600 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              Go to Sign Up
            </button>
          </div>
        </div>

        {/* Form Container */}
        <motion.div 
          key={`${role}-${mode}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[40px] bg-white p-12 shadow-2xl shadow-slate-200/50 border border-slate-200 relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-[100%] -mr-16 -mt-16 -z-10" />
          
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-black tracking-tighter text-slate-900 leading-tight">
                {mode === 'signin' 
                  ? `Welcome Back!`
                  : (role === "firm" ? "Register your Firm" : "Join as a Student")
                }
              </h2>
              <p className="text-sm font-medium text-slate-500">
                {mode === 'signin' 
                  ? 'Enter your mobile number or email to login.' 
                  : 'Just fill in your details to get started.'}
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <div className="grid gap-6">
              {mode === "signin" ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email or Phone</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      required
                      type="text"
                      value={signInContact}
                      onChange={(e) => setSignInContact(e.target.value)}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-white pl-11 pr-4 py-4 text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                      placeholder="Your mobile or email"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* Field Groups for Registration */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Your Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                          required
                          type="text"
                          value={role === "firm" ? firmData.name : auditorData.name}
                          onChange={(e) => role === "firm" 
                            ? setFirmData({ ...firmData, name: e.target.value })
                            : setAuditorData({ ...auditorData, name: e.target.value })
                          }
                          className="w-full rounded-2xl border-2 border-slate-100 bg-white pl-11 pr-4 py-4 text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                          placeholder="Your Name"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Mobile Number</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                          required
                          type="tel"
                          value={role === "firm" ? firmData.phone : auditorData.phone}
                          onChange={(e) => role === "firm" 
                            ? setFirmData({ ...firmData, phone: e.target.value })
                            : setAuditorData({ ...auditorData, phone: e.target.value })
                          }
                          className="w-full rounded-2xl border-2 border-slate-100 bg-white pl-11 pr-4 py-4 text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <input
                        required
                        type="email"
                        value={role === "firm" ? firmData.email : auditorData.email}
                        onChange={(e) => role === "firm" 
                          ? setFirmData({ ...firmData, email: e.target.value })
                          : setAuditorData({ ...auditorData, email: e.target.value })
                        }
                        className="w-full rounded-2xl border-2 border-slate-100 bg-white pl-11 pr-4 py-4 text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                        placeholder="example@gmail.com"
                      />
                    </div>
                  </div>

                  {/* Auditor Specific Fields */}
                  {role === "auditor" && (
                    <div className="grid gap-5 border-t border-slate-50 pt-8 animate-in slide-in-from-top-4 duration-500">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Aadhar Number</label>
                          <input
                            required
                            type="text"
                            value={auditorData.aadhar}
                            onChange={(e) => setAuditorData({ ...auditorData, aadhar: e.target.value })}
                            className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-5 py-4 text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                            placeholder="12 Digit ID"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">UPI ID (For Payments)</label>
                          <div className="relative group">
                            <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                              required
                              type="text"
                              value={auditorData.upi}
                              onChange={(e) => setAuditorData({ ...auditorData, upi: e.target.value })}
                              className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 pl-11 pr-4 py-4 text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                              placeholder="name@upi"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Your City</label>
                          <div className="relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                              required
                              type="text"
                              value={auditorData.currentLocation}
                              onChange={(e) => setAuditorData({ ...auditorData, currentLocation: e.target.value })}
                              className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 pl-11 pr-4 py-4 text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                              placeholder="Where you live?"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Work Locations</label>
                          <input
                            required
                            type="text"
                            value={auditorData.auditLocations}
                            onChange={(e) => setAuditorData({ ...auditorData, auditLocations: e.target.value })}
                            className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-5 py-4 text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                            placeholder="Cities you can go to"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pt-6">
              <button
                disabled={loading}
                type="submit"
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[24px] bg-slate-900 py-5 text-lg font-black text-white shadow-2xl shadow-slate-200 transition-all hover:shadow-slate-300 active:scale-[0.98] disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative z-10">{loading ? "Logging in..." : (mode === 'signin' ? 'Login Now' : 'Sign Up Now')}</span>
                <ArrowRight className="relative z-10 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="mt-6 flex flex-col items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                  Safe & Secure
                </p>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
