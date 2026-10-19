import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Tip from '@/models/Tip';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { username, amount, senderName, message } = body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid tip amount is required.' },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'Creator username is required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedUsername = username.toLowerCase().trim();

    const tip = await Tip.create({
      profileUsername: normalizedUsername,
      amount: parsedAmount,
      senderName: senderName?.trim() || 'Generous Supporter',
      message: message?.trim() || '',
      status: 'completed',
    });

    return NextResponse.json({
      success: true,
      message: `Tip of $${parsedAmount.toFixed(2)} recorded successfully!`,
      tip,
    });
  } catch (error) {
    console.error('API Tip error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
