import { NextResponse } from 'next/server';

// Memori sementara untuk serverless lambda Vercel
// Berfungsi sangat cepat tidak ada 1 detik memproses rules (cache warm-up lambda)
let serverRules: any[] = [];
let serverContacts: any = { replyTo: 'all', enableGroups: true };

export async function GET(req: Request) {
  return NextResponse.json({ status: 'Online', message: 'Backend Router Aktif & Siap Membalas.' });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // --- 1. Mode Sinkronisasi Aturan dari Frontend Web ---
    if (body.type === 'sync') {
      serverRules = body.rules || [];
      serverContacts = body.contactSettings || serverContacts;
      return NextResponse.json({ success: true, message: 'Sinkronisasi sukses. Webhook siap!' });
    }

    // --- 2. Mode Simulasi & Mode Real External (Misal dari Fitur "Balasan Server" WhatsAuto) ---
    // Payload dari aplikasi pihak ketiga / WhatsAuto: { app, sender, message, group_name, phone }
    const message = body.message || '';
    const isGroup = body.isGroup !== undefined ? body.isGroup : !!body.group_name;
    
    // Gunakan payload rules dari body (simulasi UI) atau memori server (Request asli Whatsauto)
    const rulesToUse = body.rules || serverRules;
    const contactsToUse = body.contactSettings || serverContacts;

    if (!message) {
       return NextResponse.json({ reply: null, reason: 'Payload kosong' }, { status: 400 });
    }

    // Setelan filter grup (beroperasi sangat cepat)
    if (isGroup && !contactsToUse.enableGroups) {
      return NextResponse.json({ reply: null, reason: 'Grup dinonaktifkan', success: true });
    }

    // Proses pencocokan (algoritma O(N) linier sangat cepat di bawah 1 detik)
    let matchedReply = null;
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

    // Jika eksternal webhook butuh JSON dengan key "reply", ini dikembalikan dengan latensi serendah mungkin.
    if (matchedReply) {
      return NextResponse.json({ reply: matchedReply, success: true });
    }

    return NextResponse.json({ reply: null, success: true });

  } catch (error: any) {
    console.error("Webhook processing error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
