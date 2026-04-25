"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from '@/components/ui/Sidebar'
import { GlassCard } from '@/components/ui/GlassCard'
import { 
  MessageSquare, 
  Search, 
  Phone, 
  Video, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile,
  Circle
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mockChats = [
  { id: '1', name: 'Dr. Sarah Wilson', specialization: 'Cardiologist', lastMessage: 'Your latest lab results look good. We will discuss...', time: '10:45 AM', unread: 2, online: true },
  { id: '2', name: 'Dr. Michael Chen', specialization: 'General Physician', lastMessage: 'Please make sure to take the prescribed...', time: '9:30 AM', unread: 0, online: false },
  { id: '3', name: 'Dr. Emily Brooks', specialization: 'Dermatologist', lastMessage: 'How is the skin irritation today?', time: 'Yesterday', unread: 0, online: true },
]

export default function Messages() {
  const [activeChat, setActiveChat] = useState(mockChats[0])

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar role="PATIENT" />

      <main className="flex-1 lg:ml-[80px] xl:ml-[280px] flex transition-all duration-300">
        {/* Chat List */}
        <div className="w-full md:w-[350px] border-r border-slate-200 bg-white flex flex-col pt-16 lg:pt-0">
          <div className="p-6">
            <h1 className="text-2xl font-black text-slate-900 mb-6">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="h-10 w-full rounded-xl border border-slate-100 bg-slate-50 pl-10 pr-4 text-xs font-bold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
            {mockChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group",
                  activeChat.id === chat.id ? "bg-primary-50" : "hover:bg-slate-50"
                )}
              >
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-primary-600 font-black">
                    {chat.name.charAt(4)}
                  </div>
                  {chat.online && (
                    <div className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="font-bold text-slate-900 truncate">{chat.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">{chat.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{chat.lastMessage}</p>
                </div>
                
                {chat.unread > 0 && (
                  <div className="h-5 w-5 rounded-full bg-primary-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    {chat.unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className="hidden md:flex flex-1 flex-col bg-slate-50">
          {/* Top Bar */}
          <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-black">
                {activeChat.name.charAt(4)}
              </div>
              <div>
                <h2 className="font-bold text-slate-900">{activeChat.name}</h2>
                <div className="flex items-center gap-1.5">
                  <Circle className={cn("h-2 w-2 fill-current", activeChat.online ? "text-emerald-500" : "text-slate-300")} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {activeChat.online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-primary-600 transition-all">
                <Phone className="h-5 w-5" />
              </button>
              <button className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-primary-600 transition-all">
                <Video className="h-5 w-5" />
              </button>
              <button className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-primary-600 transition-all">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-mesh">
             <div className="flex flex-col items-center justify-center h-full opacity-50 grayscale">
                <MessageSquare className="h-16 w-16 text-primary-200 mb-4" />
                <p className="font-bold text-slate-400 tracking-tight">Select a conversation to start messaging</p>
             </div>
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-slate-200 shrink-0">
            <div className="flex items-end gap-4 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <textarea
                  placeholder="Type your message..."
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 pr-24 text-sm font-bold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all resize-none min-h-[56px] max-h-32"
                  rows={1}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors">
                    <Smile className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors">
                    <Paperclip className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <button className="h-14 w-14 flex items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all active:scale-95">
                <Send className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
