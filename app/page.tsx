'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { MessageCircle, Users, Settings, Plus, Trash2, Bell, Send, Check, ShieldAlert, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Rule = { id: string; keyword: string; reply: string; matchType: 'exact' | 'contains' };
type Contacts = { replyTo: string; enableGroups: boolean };
type ChatMsg = { id: string; text: string; sender: 'user' | 'bot'; isGroup?: boolean; timestamp: Date };

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'aturan' | 'kontak' | 'testing'>('aturan');
  const [rules, setRules, isClient] = useLocalStorage<Rule[]>('wa-rules', []);
  const [contacts, setContacts] = useLocalStorage<Contacts>('wa-contacts', { replyTo: 'all', enableGroups: true });
  
  const [notificationPerm, setNotificationPerm] = useState<NotificationPermission | 'default'>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPerm(Notification.permission);
    }
  }, []);

  const requestNotification = async () => {
    if (!('Notification' in window)) {
      alert('Browser ini tidak mendukung notifikasi. Gunakan browser desktop standar.');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotificationPerm(perm);
  };

  const fireLocalNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  if (!isClient) return <div className="min-h-screen bg-[#111b21] flex items-center justify-center text-white">Memuat Sistem...</div>;

  return (
    <div className="min-h-screen bg-[#111b21] text-gray-200 font-sans selection:bg-teal-600">
      {/* Header */}
      <header className="bg-[#202c33] px-4 py-4 flex items-center justify-between shadow-md border-b border-gray-700">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-teal-500" />
          <h1 className="text-xl font-semibold text-gray-100">Autoreply Web</h1>
        </div>
        {notificationPerm !== 'granted' && (
          <button 
            onClick={requestNotification}
            className="flex items-center gap-2 text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-full transition shadow-sm"
          >
            <Bell className="w-4 h-4" />
            Izin Notifikasi
          </button>
        )}
      </header>

      <div className="max-w-3xl mx-auto mt-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          {[
            { id: 'aturan', label: 'ATURAN KATA KUNCI', icon: MessageCircle },
            { id: 'kontak', label: 'KONTAK', icon: Users },
            { id: 'testing', label: 'PENGUJIAN', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative",
                activeTab === tab.id ? "text-teal-400" : "text-gray-400 hover:text-gray-300"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <main className="px-4 pb-12">
          <AnimatePresence mode="wait">
            {activeTab === 'aturan' && <AturanTab key="aturan" rules={rules} setRules={setRules} />}
            {activeTab === 'kontak' && <KontakTab key="kontak" contacts={contacts} setContacts={setContacts} />}
            {activeTab === 'testing' && <TestingTab key="testing" rules={rules} contacts={contacts} onBotReply={(msg) => fireLocalNotification("Pesan Otomatis Terkirim", `AI/Sistem: ${msg}`)} />}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// --- Sub-components ---

function AturanTab({ rules, setRules }: { rules: Rule[], setRules: any }) {
  const [keyword, setKeyword] = useState('');
  const [reply, setReply] = useState('');
  const [matchType, setMatchType] = useState<'exact' | 'contains'>('contains');

  const handleAdd = () => {
    if (!keyword.trim() || !reply.trim()) return;
    setRules([...rules, { id: generateId(), keyword: keyword.trim(), reply: reply.trim(), matchType }]);
    setKeyword('');
    setReply('');
  };

  const removeRule = (id: string) => {
    setRules(rules.filter((r: Rule) => r.id !== id));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="bg-[#202c33] p-5 rounded-xl border border-gray-700 shadow-sm">
        <h2 className="text-lg font-medium text-white mb-4">Tambah Balasan Kata Kunci</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Kata Kunci Masuk (Keyword)</label>
            <input 
              type="text" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Misal: info harga, halo"
              className="w-full bg-[#2a3942] border border-gray-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-teal-500 transition"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Opsi Kecocokan Kata Kunci</label>
            <div className="relative">
               <select 
                 value={matchType}
                 onChange={(e) => setMatchType(e.target.value as any)}
                 className="w-full bg-[#2a3942] border border-gray-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-teal-500 transition appearance-none"
               >
                 <option value="contains">Mengandung kata (Contains)</option>
                 <option value="exact">Sama persis (Exact Match)</option>
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                 <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
               </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Teks Balasan otomatis</label>
            <textarea 
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Tulis balasan di sini..."
              rows={3}
              className="w-full bg-[#2a3942] border border-gray-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-teal-500 transition resize-none"
            />
          </div>
          <button 
            onClick={handleAdd}
            disabled={!keyword.trim() || !reply.trim()}
            className="disabled:opacity-50 disabled:cursor-not-allowed bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Simpan Aturan
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-400 px-1">Daftar Aturan ({rules.length})</h3>
        {rules.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-[#202c33] rounded-xl border border-gray-700 border-dashed">
            Belum ada aturan kata kunci yang dibuat.
          </div>
        )}
        {rules.map((rule: Rule) => (
          <div key={rule.id} className="bg-[#202c33] p-4 rounded-xl border border-gray-700 flex justify-between items-start gap-4 hover:border-gray-500 transition">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border border-teal-500/30">
                  {rule.matchType === 'exact' ? 'Exact' : 'Contains'}
                </span>
                <strong className="text-white text-sm truncate">{rule.keyword}</strong>
              </div>
              <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">{rule.reply}</p>
            </div>
            <button 
              onClick={() => removeRule(rule.id)}
              className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition"
              title="Hapus aturan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function KontakTab({ contacts, setContacts }: { contacts: Contacts, setContacts: any }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="bg-[#202c33] rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700 bg-[#2a3942]/50">
          <h2 className="text-sm font-medium text-gray-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-teal-500" />
            Balas otomatis ke
          </h2>
        </div>
        <div className="p-2">
          {[
            { id: 'all', label: 'Semua orang' },
            { id: 'my_contacts', label: 'Daftar kontak saya...' },
            { id: 'except', label: 'Kecuali daftar kontak saya...' },
          ].map((opt) => (
            <label key={opt.id} className="flex items-center gap-3 p-3 hover:bg-[#2a3942] rounded-lg cursor-pointer transition">
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                contacts.replyTo === opt.id ? "border-teal-500 bg-[#202c33]" : "border-gray-500"
              )}>
                {contacts.replyTo === opt.id && <div className="w-2.5 h-2.5 bg-teal-500 rounded-full" />}
              </div>
              <span className="text-sm text-gray-200">{opt.label}</span>
              <input 
                type="radio" 
                name="replyTo" 
                className="hidden" 
                checked={contacts.replyTo === opt.id}
                onChange={() => setContacts({ ...contacts, replyTo: opt.id })}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="bg-[#202c33] p-5 rounded-xl border border-gray-700 flex items-center justify-between shadow-sm cursor-pointer" onClick={() => setContacts({ ...contacts, enableGroups: !contacts.enableGroups })}>
        <div>
          <h3 className="text-sm font-medium text-white mb-1">Aktifkan Grup</h3>
          <p className="text-xs text-gray-400">Bot akan merespons pesan kata kunci di dalam grup chat.</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={contacts.enableGroups}
            readOnly
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
        </label>
      </div>
    </motion.div>
  );
}

function TestingTab({ rules, contacts, onBotReply }: { rules: Rule[], contacts: Contacts, onBotReply: (m: string) => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isGroupSim, setIsGroupSim] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMsg = {
      id: generateId(),
      text: input.trim(),
      sender: 'user',
      isGroup: isGroupSim,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Memanggil backend router Next.js API
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.text,
          isGroup: userMsg.isGroup,
          rules,
          contactSettings: contacts
        })
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.reply) {
        // Simulasi delay pengetikan seakan nyata
        setTimeout(() => {
          const botMsg: ChatMsg = {
            id: generateId(),
            text: data.reply,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMsg]);
          onBotReply(data.reply);
        }, 800);
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Backend API Error:", error);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col h-[550px] bg-[#0b141a] rounded-xl border border-gray-700 overflow-hidden relative shadow-md">
      
      {/* Fake Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "url('https://static.whatsapp.net/rsrc.php/v3/yl/r/rro_jQnXYFm.png')", backgroundSize: "contain" }}></div>

      <div className="bg-[#202c33] p-3 flex items-center justify-between shadow-sm z-10 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
             {isGroupSim ? <Users className="w-5 h-5 text-gray-300" /> : <User className="w-6 h-6 text-gray-300" />}
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">{isGroupSim ? 'Grup Testing (Simulasi)' : 'Pengguna Test (Simulasi)'}</h3>
            <p className="text-[11px] text-teal-500 font-medium tracking-wide">● BACKEND ROUTER AKTIF</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-400 bg-[#2a3942] px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-700 transition border border-gray-600">
          <input 
            type="checkbox" 
            checked={isGroupSim}
            onChange={(e) => setIsGroupSim(e.target.checked)}
            className="rounded border-gray-500 bg-transparent text-teal-500 focus:ring-teal-500 focus:ring-offset-0"
          />
          Pesan dari Grup
        </label>
      </div>

      <div ref={chatRef} className="flex-1 p-4 overflow-y-auto space-y-3 z-10 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <span className="bg-[#182229] border border-gray-700 text-gray-300 text-xs px-4 py-2 rounded-lg shadow-sm">
              Coba ketik pesan yang cocok dengan aturan kata kunci Anda.
            </span>
          </div>
        )}
        
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={cn("flex flex-col w-full", isUser ? "items-start" : "items-end")}>
              {isUser && msg.isGroup && <span className="text-[10px] text-gray-400 mb-1 ml-1">Dari Anggota Grup</span>}
              <div className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 shadow-sm text-[14px] leading-relaxed break-words relative",
                isUser ? "bg-[#202c33] text-gray-200 rounded-tl-sm border border-gray-800" : "bg-[#005c4b] text-[#e9edef] rounded-tr-sm border border-[#005c4b]"
              )}>
                {!isUser && <Bot className="w-3 h-3 text-teal-100 absolute -top-1.5 -right-1.5 bg-[#005c4b] rounded-full p-0.5 border-gray-900 border" />}
                {msg.text}
                <div className="text-[10px] text-right mt-1 opacity-60 flex justify-end items-center gap-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {!isUser && <Check className="w-3 h-3 text-teal-300" />}
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-end">
            <div className="bg-[#005c4b] max-w-[80%] rounded-lg p-3 rounded-tr-sm shadow-sm flex items-center justify-center border border-[#005c4b]">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-teal-200 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-teal-200/80 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-1.5 h-1.5 bg-teal-200/60 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#202c33] p-3 flex gap-2 z-10 border-t border-gray-700">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ketik simulasi pesan masuk..." 
          className="flex-1 bg-[#2a3942] border border-gray-600 text-white text-sm rounded-full px-5 py-2.5 focus:outline-none focus:border-teal-500 transition"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-11 h-11 bg-teal-600 disabled:opacity-50 disabled:bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-teal-500 transition"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </div>
    </motion.div>
  );
}
