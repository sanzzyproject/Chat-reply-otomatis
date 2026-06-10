'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { MessageCircle, Users, Activity, Settings, Plus, Trash2, Bell, Send, Check, ShieldAlert, Bot, User, Smartphone, Server, RefreshCw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Rule = { id: string; keyword: string; reply: string; matchType: 'exact' | 'contains' };
type Contacts = { replyTo: string; enableGroups: boolean };
type ChatMsg = { id: string; text: string; sender: 'user' | 'bot'; isGroup?: boolean; timestamp: Date; via?: 'webhook' | 'direct' };

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'aturan' | 'kontak' | 'direct' | 'whatsauto' | 'testing'>('aturan');
  const [rules, setRules, isClient] = useLocalStorage<Rule[]>('wa-rules', []);
  const [contacts, setContacts] = useLocalStorage<Contacts>('wa-contacts', { replyTo: 'all', enableGroups: true });
  
  const [notificationPerm, setNotificationPerm] = useState<NotificationPermission | 'default'>('default');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [swActive, setSwActive] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Fungsi untuk sinkronisasi paksa ke Vercel Lambda Memory (Webhook)
  const syncToServer = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sync', rules, contactSettings: contacts })
      });
      setLastSync(new Date());
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPerm(Notification.permission);
      if (Notification.permission === 'default') {
        setShowPermissionModal(true);
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        setSwActive(true);
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SYNC', rules, contacts
          });
        }
      });
    }
  }, []);

  // Auto-sync setiap kali rules/contacts berubah (Ke Webhook & SW Latar Belakang)
  useEffect(() => {
    if (isClient) {
      // 1. Sync Ke Webhook (WhatsAuto)
      syncToServer(true);
      
      // 2. Sync Ke Service Worker (Direct Notif)
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC', rules, contacts
        });
      }
    }
  }, [rules, contacts, isClient]);

  // Keep-alive Vercel Lambda
  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(() => {
      syncToServer(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [isClient, rules, contacts]);

  const requestNotificationAndStart = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPerm(perm);
    }
    setShowPermissionModal(false);
  };

  if (!isClient) return <div className="min-h-screen bg-[#111b21] flex items-center justify-center text-white">Memuat Dual Engine...</div>;

  return (
    <div className="min-h-screen bg-[#111b21] text-gray-200 font-sans selection:bg-teal-600 pb-20">
      
      {/* Modal Izin Akses Notifikasi */}
      <AnimatePresence>
        {showPermissionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#202c33] p-7 rounded-3xl max-w-sm w-full border border-gray-700 shadow-2xl text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-teal-500/5 blur-3xl pointer-events-none"></div>
               <div className="w-20 h-20 bg-[#0b141a] rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-teal-500/30 relative z-10 shadow-[0_0_30px_rgba(20,184,166,0.2)]">
                 <Bell className="w-10 h-10 text-teal-400" />
                 <div className="absolute top-0 right-0 w-4 h-4 bg-teal-400 rounded-full animate-ping"></div>
                 <div className="absolute top-0 right-0 w-4 h-4 bg-teal-500 rounded-full border-2 border-[#0b141a]"></div>
               </div>
               <h2 className="text-xl font-bold text-white mb-2 relative z-10">Izin Notifikasi</h2>
               <p className="text-sm text-gray-400 mb-6 leading-relaxed relative z-10">
                 Fitur &quot;Langsung Balas&quot; membutuhkan akses notifikasi untuk berjalan di latar belakang secara otomatis (tanpa aplikasi ketiga).
               </p>
               <button
                 onClick={requestNotificationAndStart}
                 className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-teal-900/40 relative z-10"
               >
                 <Zap className="w-5 h-5 text-teal-200" />
                 Izinkan & Mulai
               </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-[#202c33] px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-md border-b border-gray-700 gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Smartphone className="w-8 h-8 text-teal-500" />
          <div>
            <h1 className="text-lg font-bold text-gray-100 leading-tight">Bot Web Auto</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", isSyncing ? "bg-orange-400 animate-ping" : "bg-teal-400")}></span>
                <span className={cn("relative inline-flex rounded-full h-2 w-2", isSyncing ? "bg-orange-500" : "bg-teal-500")}></span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                 Dual Engine: (Direct Notif & WhatsAuto)
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => syncToServer()}
             disabled={isSyncing}
             className="flex items-center justify-center gap-2 text-xs bg-[#2a3942] hover:bg-[#374b57] text-teal-400 border border-teal-500/30 px-3 py-2 rounded-lg transition font-bold"
             title="Sinkronisasi paksa WhatsAuto"
           >
             <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
           </button>
           {notificationPerm !== 'granted' && !showPermissionModal && (
             <button 
               onClick={requestNotificationAndStart}
               className="flex items-center justify-center gap-2 text-xs bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition font-medium"
             >
               <Bell className="w-4 h-4" /> Akses
             </button>
           )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto mt-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto scrollbar-hide py-1 px-4 sm:px-0 scroll-smooth">
          {[
            { id: 'aturan', label: 'ATURAN PESAN', icon: MessageCircle },
            { id: 'kontak', label: 'KONTAK', icon: Users },
            { id: 'direct', label: 'DIRECT NOTIF', icon: Activity },
            { id: 'whatsauto', label: 'WHATSAUTO', icon: Server },
            { id: 'testing', label: 'PENGUJIAN', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap",
                activeTab === tab.id ? "text-teal-400" : "text-gray-400 hover:text-gray-300"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
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
        <main className="px-4">
          <AnimatePresence mode="wait">
            {activeTab === 'aturan' && <AturanTab key="aturan" rules={rules} setRules={setRules} />}
            {activeTab === 'kontak' && <KontakTab key="kontak" contacts={contacts} setContacts={setContacts} />}
            {activeTab === 'direct' && <DirectTab key="direct" swActive={swActive} notifPerm={notificationPerm} />}
            {activeTab === 'whatsauto' && <WhatsAutoTab key="whatsauto" rules={rules} syncToServer={syncToServer} />}
            {activeTab === 'testing' && <TestingTab key="testing" rules={rules} contacts={contacts} />}
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
        <h2 className="text-lg font-medium text-white mb-4">Tambahkan Kata Kunci Otorisasi</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Kata Kunci Masuk (Dari Anggota Grup/Teman)</label>
            <input 
              type="text" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Misal: info harga, halo"
              className="w-full bg-[#2a3942] border border-gray-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-teal-500 transition"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Tingkat Kecocokan Keyword</label>
            <div className="relative">
               <select 
                 value={matchType}
                 onChange={(e) => setMatchType(e.target.value as any)}
                 className="w-full bg-[#2a3942] border border-gray-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-teal-500 transition appearance-none"
               >
                 <option value="contains">Mengandung kata (Bebas / Terselip)</option>
                 <option value="exact">Sama persis utuh (Strict)</option>
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                 <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
               </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Teks Balasan Anda</label>
            <textarea 
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Tulis pesan yang akan terkirim otomatis..."
              rows={3}
              className="w-full bg-[#2a3942] border border-gray-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-teal-500 transition resize-none"
            />
          </div>
          <button 
            onClick={handleAdd}
            disabled={!keyword.trim() || !reply.trim()}
            className="disabled:opacity-50 disabled:cursor-not-allowed bg-teal-600 hover:bg-teal-500 w-full text-white px-4 py-3 rounded-lg text-sm font-bold transition flex justify-center items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Simpan Aturan Memory
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-400 px-1">Aturan Aktif di Dual Engine ({rules.length})</h3>
        {rules.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-[#202c33] rounded-xl border border-gray-700 border-dashed">
            Belum ada aturan yang diteruskan.
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
            Pengaturan Balasan Bot (Untuk Direct/WhatsAuto)
          </h2>
        </div>
        <div className="p-2">
          {[
            { id: 'all', label: 'Semua Orang (Siapa saja yang chat)' },
            { id: 'my_contacts', label: 'Daftar Teman Saya Saja' },
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
          <h3 className="text-sm font-medium text-white mb-1">Merespons di Dalam Grup</h3>
          <p className="text-xs text-gray-400">Bot akan mengekstrak nama pengirim dan otomatis membalas sesuai keyword di grup.</p>
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

function DirectTab({ swActive, notifPerm }: { swActive: boolean, notifPerm: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="bg-[#202c33] p-6 rounded-xl border border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl rounded-full"></div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-400" />
          Detail Sistem Notifikasi Latar Belakang
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#0b141a] border border-gray-700/50 rounded-lg p-4 flex items-center gap-4">
             <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                 <Bell className={cn("w-5 h-5", notifPerm === 'granted' ? "text-teal-400" : "text-gray-500")} />
             </div>
             <div>
               <p className="text-xs text-gray-400">Akses Notifikasi</p>
               <p className={cn("text-sm font-semibold", notifPerm === 'granted' ? "text-teal-400" : "text-red-400")}>
                 {notifPerm === 'granted' ? "DIIZINKAN" : "BELUM DIIZINKAN"}
               </p>
             </div>
          </div>
          
          <div className="bg-[#0b141a] border border-gray-700/50 rounded-lg p-4 flex items-center gap-4">
             <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center relative">
                 <Settings className={cn("w-5 h-5", swActive ? "text-teal-400 animate-[spin_3s_linear_infinite]" : "text-gray-500")} />
             </div>
             <div>
               <p className="text-xs text-gray-400">Service Worker Engine</p>
               <p className={cn("text-sm font-semibold", swActive ? "text-teal-400" : "text-red-400")}>
                 {swActive ? "RUNNING < 50ms" : "MENUNGGU INIT"}
               </p>
             </div>
          </div>
        </div>

        <div className="bg-[#2a3942] rounded-lg p-4 text-[13px] text-gray-300 leading-relaxed border border-gray-700/50 shadow-sm border-l-4 border-l-teal-500">
           <strong className="text-white block mb-2 text-sm">Otomatis Langsung Balas (Direct Notif):</strong>
           Fitur ini mendaftarkan <strong>Service Worker lokal</strong> di browser. Ia mengekstrak pesan Notifikasi dan memberikan balasan &quot;Otomatis&quot; kurang dari 1 detik tanpa WhatsAuto! Pastikan Anda Install aplikasi web ini di Beranda HP.
        </div>
      </div>
    </motion.div>
  );
}

function WhatsAutoTab({ rules, syncToServer }: { rules: Rule[], syncToServer: any }) {
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);
  const webhookUrl = `${origin}/api/webhook`;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="bg-[#202c33] p-6 rounded-xl border border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 blur-3xl rounded-full"></div>
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2 relative z-10">
          <Server className="w-6 h-6 text-teal-400" />
          Mode WhatsAuto (Webhook)
        </h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed relative z-10 max-w-lg">
          Gunakan URL ini di aplikasi WhatsAuto Anda (menu Balasan Server).
        </p>
        
        <div className="space-y-6 relative z-10">
          <div>
             <div className="flex shadow-lg shadow-black/20">
               <input 
                 type="text" 
                 readOnly 
                 value={webhookUrl} 
                 className="flex-1 bg-[#0b141a] border border-gray-600 rounded-l-lg px-4 py-3.5 text-sm sm:text-base text-teal-400 font-mono focus:outline-none"
               />
               <button 
                 onClick={() => navigator.clipboard.writeText(webhookUrl)}
                 className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-3.5 border border-l-0 border-teal-600 rounded-r-lg text-sm font-bold transition flex items-center gap-2"
               >
                 Salin URL
               </button>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TestingTab({ rules, contacts }: { rules: Rule[], contacts: Contacts }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isGroupSim, setIsGroupSim] = useState(false);
  const [testMode, setTestMode] = useState<'direct' | 'whatsauto'>('direct');
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

    if (testMode === 'direct') {
      // Test via Service Worker Latar Belakang (Message Channel)
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          setIsLoading(false);
          if (event.data.reply) {
            setMessages(prev => [...prev, { id: generateId(), text: event.data.reply, sender: 'bot', timestamp: new Date(), via: 'direct' }]);
          }
        };
        navigator.serviceWorker.controller.postMessage({
          type: 'TEST_MESSAGE',
          message: userMsg.text,
          isGroup: userMsg.isGroup
        }, [channel.port2]);
      } else {
         setIsLoading(false);
         setMessages(prev => [...prev, { id: generateId(), text: "[ERROR] Sistem Latar Belakang belum siap.", sender: 'bot', timestamp: new Date() }]);
      }
    } else {
      // Test via API Webhook (WhatsAuto)
      try {
        const res = await fetch('/api/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            app: 'WhatsAuto', message: userMsg.text, group_name: isGroupSim ? 'Grup Dummy' : '', rules, contactSettings: contacts
          })
        });
        const rawText = await res.text();
        let data = { reply: "" };
        try { data = JSON.parse(rawText); } catch(e) {}
        setIsLoading(false);
        if (data.reply) {
          setMessages(prev => [...prev, { id: generateId(), text: data.reply, sender: 'bot', timestamp: new Date(), via: 'webhook' }]);
        }
      } catch (error: any) {
         setIsLoading(false);
         setMessages(prev => [...prev, { id: generateId(), text: `[ERROR] Webhook gagal: ${error.message}`, sender: 'bot', timestamp: new Date() }]);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col h-[600px] bg-[#0b141a] rounded-xl border border-gray-700 overflow-hidden relative shadow-md">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "url('https://static.whatsapp.net/rsrc.php/v3/yl/r/rro_jQnXYFm.png')", backgroundSize: "contain" }}></div>

      <div className="bg-[#202c33] p-3 flex flex-col gap-3 shadow-sm z-10 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
               {isGroupSim ? <Users className="w-5 h-5 text-gray-300" /> : <User className="w-6 h-6 text-gray-300" />}
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">E2E End-to-End Test</h3>
              <p className="text-[11px] text-teal-400 font-medium tracking-wide flex items-center gap-1">
                 Masa: {testMode === 'direct' ? 'Otomatis Langsung Balas < 1 dtk' : 'Via WhatsAuto Webhook'}
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-400 bg-[#2a3942] px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-700 transition border border-gray-600">
            <input 
              type="checkbox" 
              checked={isGroupSim}
              onChange={(e) => setIsGroupSim(e.target.checked)}
              className="rounded border-gray-500 bg-transparent text-teal-500 focus:ring-teal-500 focus:ring-offset-0"
            />
            Pesan Grup
          </label>
        </div>
        
        {/* Toggle Mode Test */}
        <div className="flex bg-[#0b141a] p-1 rounded-lg border border-gray-700">
           <button 
             onClick={() => setTestMode('direct')}
             className={cn("flex-1 py-1.5 text-xs font-medium rounded transition", testMode === 'direct' ? "bg-teal-600 text-white" : "text-gray-400 hover:text-gray-200")}
           >
             1. OTO LANGSUNG (SW)
           </button>
           <button 
             onClick={() => setTestMode('whatsauto')}
             className={cn("flex-1 py-1.5 text-xs font-medium rounded transition", testMode === 'whatsauto' ? "bg-teal-600 text-white" : "text-gray-400 hover:text-gray-200")}
           >
             2. WHATSAUTO (Webhook)
           </button>
        </div>
      </div>

      <div ref={chatRef} className="flex-1 p-4 overflow-y-auto space-y-3 z-10 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <span className="bg-[#182229] border border-gray-700 text-teal-200 text-xs px-4 py-2 rounded-lg shadow-sm font-medium flex flex-col items-center gap-2 max-w-[80%] mx-auto justify-center text-center">
              <Zap className="w-5 h-5 text-teal-400" />
              <span>Pilih mode pengujian di atas. Kemudian ketik keyword yang mengandung pesan. Sistem dipastikan berjalan Normal!</span>
            </span>
          </div>
        )}
        
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
             <div key={msg.id} className={cn("flex flex-col w-full", isUser ? "items-start" : "items-end")}>
               {isUser && msg.isGroup && <span className="text-[10px] text-gray-400 mb-1 ml-1">Dari Grup Dummy</span>}
               <div className={cn(
                 "max-w-[85%] rounded-lg px-3 py-2 shadow-sm text-[14px] leading-relaxed break-words relative",
                 isUser ? "bg-[#202c33] text-gray-200 rounded-tl-sm border border-gray-800" : "bg-[#005c4b] text-[#e9edef] rounded-tr-sm border border-[#005c4b]"
               )}>
                 {!isUser && <Bot className="w-3 h-3 text-teal-100 absolute -top-1.5 -right-1.5 bg-[#005c4b] rounded-full p-0.5 border-gray-900 border" />}
                 {msg.text}
                 <div className="text-[10px] text-right mt-1 opacity-60 flex justify-end items-center gap-1">
                   {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   {!isUser && <span className="px-1 bg-black/20 rounded font-mono">{msg.via === 'direct' ? 'SW' : 'HOOK'}</span>}
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
          placeholder={`Test E2E ${testMode === 'direct' ? 'Notifikasi Latar' : 'Webhook Vercel'}...`}
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
