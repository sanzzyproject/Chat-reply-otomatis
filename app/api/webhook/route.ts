import { NextResponse } from 'next/server';

// Memori sementara untuk serverless lambda Vercel
// Berfungsi sangat cepat tidak ada 1 detik memproses rules (cache warm-up lambda)
let serverRules: any[] = [];
let serverContacts: any = { replyTo: 'all', enableGroups: true };

export async function GET(req: Request) {
  return NextResponse.json({ status: 'Online', message: 'Backend Router Aktif & Siap Membalas Via WhatsAuto.' });
}

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    let body: any = {};
    
    // Parsing yang sangat aman agar WhatsAuto tidak mengalami error
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      // Jika WhatsAuto mengirim format ter-encode (URLSearchParams fallback)
      const params = new URLSearchParams(bodyText);
      body = Object.fromEntries(params.entries());
    }
    
    // --- 1. Mode Sinkronisasi Aturan dari Frontend Web ---
    if (body.type === 'sync') {
      serverRules = body.rules || [];
      serverContacts = body.contactSettings || serverContacts;
      return NextResponse.json({ success: true, message: 'Sinkronisasi sukses. Webhook siap!' });
    }

    // --- 2. Mode Simulasi & Mode Real External (WhatsAuto payload) ---
    const message = body.message || '';
    const isGroup = body.isGroup === true || body.isGroup === 'true' || !!body.group_name;
    
    const rulesToUse = body.rules || serverRules;
    const contactsToUse = body.contactSettings || serverContacts;

    // Jika WhatsAuto mem-ping "Pesan percobaan" (Fitur default testing WhatsAuto)
    if (message === 'Pesan percobaan' && rulesToUse.length === 0) {
      return NextResponse.json({ reply: 'Koneksi dari WhatsAuto ke Vercel sukses! Tambahkan aturan di web Anda untuk mulai membalas otomatis.' });
    }

    // Jika pesan kosong atau filter grup aktif tapi chat dari grup
    if (!message || (isGroup && !contactsToUse.enableGroups)) {
      return NextResponse.json({ reply: "" }); // Respon kosong / tidak usah dibalas
    }

    // Proses pencocokan (algoritma linier sangat cepat di bawah 1 detik)
    let matchedReply = "";
    for (const rule of rulesToUse) {
      const msgLower = message.toLowerCase();
      const kwLower = rule.keyword.toLowerCase();

      if (rule.matchType === 'exact' && msgLower === kwLower) {
        matchedReply = rule.reply;
        break;
      } else if (rule.matchType === 'contains' && msgLower.includes(kwLower)) {
        matchedReply = rule.reply;
        break;
      }
    }

    // Mengembalikan JSON standar WhatsAuto {"reply": "pesan"}
    return NextResponse.json({ reply: matchedReply });

  } catch (error: any) {
    console.error("Webhook processing error:", error.message);
    // Jika ada error internal, return {"reply": ""} agar WhatsAuto tidak mendeteksi null
    return NextResponse.json({ reply: "" });
  }
}

