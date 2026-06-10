import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, isGroup, rules, contactSettings } = body;

    console.log("Receiving message at backend router:", body);
    
    if (!message || !rules || !contactSettings) {
       return NextResponse.json({ reply: null, reason: 'Payload tidak valid' }, { status: 400 });
    }

    // Cek setelan kontak grup
    if (isGroup && !contactSettings.enableGroups) {
      return NextResponse.json({ reply: null, reason: 'Balasan grup dinonaktifkan' });
    }

    // Processing balasan kata kunci
    let matchedReply = null;
    for (const rule of rules) {
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

    return NextResponse.json({ reply: matchedReply, success: true });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
