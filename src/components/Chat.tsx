import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { ArrowLeft, Send, User, Building2, ShieldCheck, Paperclip, ImageIcon, Phone, Video, MoreVertical, Check, CheckCheck } from "lucide-react";
import { cn } from "../lib/utils";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId?: string;
  groupId?: string;
  text: string;
  type: "text" | "image" | "file";
  timestamp: string;
}

interface ChatProps {
  currentUser: { id: string; name: string; role: string };
  targetRoom: string; // userId or groupId
  roomName: string;
  isGroup?: boolean;
  onBack?: () => void;
}

export function Chat({ currentUser, targetRoom, roomName, isGroup, onBack }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.emit("join", currentUser.id);
    if (isGroup) {
      newSocket.emit("join-group", targetRoom);
    }

    // Fetch initial messages
    fetch(`/api/messages/${targetRoom}`)
      .then(res => res.json())
      .then(data => setMessages(data));

    newSocket.on("new-message", (msg: Message) => {
      if (msg.groupId === targetRoom || msg.senderId === targetRoom || msg.receiverId === currentUser.id) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      newSocket.close();
    };
  }, [targetRoom, currentUser.id, isGroup]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (fileData?: { data: string; name: string; type: "image" | "file" }) => {
    if (!inputText.trim() && !fileData || !socket) return;

    const msgData = {
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: fileData ? fileData.name : inputText,
      fileData: fileData?.data,
      type: fileData?.type || "text",
      [isGroup ? "groupId" : "receiverId"]: targetRoom,
    };

    socket.emit("send-message", msgData);
    setInputText("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as string;
      const type = file.type.startsWith("image/") ? "image" : "file";
      handleSend({ data, name: file.name, type });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="mr-1 h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all active:scale-90 md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="relative group">
            <div className={cn(
               "flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner transition-transform group-hover:scale-105",
               isGroup ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-100"
            )}>
              {isGroup ? <ShieldCheck className="h-6 w-6" /> : <User className="h-6 w-6" />}
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 tracking-tight text-lg">{roomName}</h3>
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {isGroup ? "Connect Group" : "Direct Operations"}
              </p>
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <button className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#e5ddd5] relative"
        style={{
          backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
          backgroundBlendMode: "overlay",
          backgroundColor: "#e5ddd5"
        }}
      >
        <div className="absolute inset-0 bg-white/10 pointer-events-none" />
        <div className="relative z-10 space-y-3">
          {messages.map((msg, idx) => {
            const isOwn = msg.senderId === currentUser.id;
            const showDate = !messages[idx-1] || new Date(messages[idx-1].timestamp).toDateString() !== new Date(msg.timestamp).toDateString();
            
            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="px-3 py-1 bg-white/80 rounded-lg text-[10px] font-black uppercase text-slate-500 shadow-sm">
                      {new Date(msg.timestamp).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
                <div 
                  className={cn(
                    "flex flex-col group",
                    isOwn ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "relative max-w-[85%] md:max-w-[70%] px-4 py-2 shadow-sm transition-all",
                    isOwn 
                      ? "bg-[#dcf8c6] text-slate-800 rounded-lg rounded-tr-none border-[#c8e2b3]" 
                      : "bg-white text-slate-800 rounded-lg rounded-tl-none border-[#d1d1d1]"
                  )}>
                    {!isOwn && isGroup && (
                      <span className="text-[10px] font-black text-blue-600 block mb-1">
                        {msg.senderName}
                      </span>
                    )}

                    {msg.type === "image" ? (
                      <div className="space-y-1.5">
                        <img src={(msg as any).fileData} alt={msg.text} className="max-w-full rounded-md shadow-sm pointer-events-auto cursor-zoom-in" referrerPolicy="no-referrer" />
                        <p className="text-xs font-medium">{msg.text}</p>
                      </div>
                    ) : msg.type === "file" ? (
                      <div className="flex items-center gap-3 bg-black/5 p-2 rounded-lg border border-black/5">
                        <div className="h-10 w-10 bg-white/80 rounded-lg flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                          <Paperclip className="h-5 w-5" />
                        </div>
                        <div className="flex-1 overflow-hidden min-w-[120px]">
                          <p className="text-xs font-bold truncate text-slate-800">{msg.text}</p>
                          <a href={(msg as any).fileData} download={msg.text} className="text-[10px] text-blue-600 font-black hover:underline uppercase tracking-tight">Download</a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}
                    
                    <div className="flex items-center justify-end gap-1.5 mt-1 opacity-40">
                      <span className="text-[9px] font-bold">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isOwn && <CheckCheck className="h-3 w-3 text-blue-500" />}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white border-t border-slate-100">
        <div className="flex items-center gap-3 bg-slate-50 p-2 pl-4 rounded-[28px] border border-slate-200 shadow-inner focus-within:border-blue-300 transition-all">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-transparent py-2 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
          />
          <input 
            type="file" 
            id="chat-file-upload" 
            className="hidden" 
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
          <div className="flex items-center gap-1 pr-1">
            <button 
              onClick={() => document.getElementById("chat-file-upload")?.click()}
              className="h-9 w-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-white hover:text-slate-900 transition-all"
            >
                <Paperclip className="h-5 w-5" />
            </button>
            <button 
              onClick={() => {
                const input = document.getElementById("chat-file-upload") as HTMLInputElement;
                input.accept = "image/*";
                input.click();
              }}
              className="h-9 w-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-white hover:text-slate-900 transition-all"
            >
                <ImageIcon className="h-5 w-5" />
            </button>
            <button 
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-full transition-all shadow-lg",
                    inputText.trim() 
                        ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95" 
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
            >
                <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
        <p className="text-[9px] text-center text-slate-400 mt-3 font-bold uppercase tracking-widest">
           Secure AuditLink Encrypted Channel
        </p>
      </div>
    </div>
  );
}
