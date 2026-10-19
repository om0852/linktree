import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { syncLeadToGoogleContacts } from '@/lib/googleContactsSync';
import { requireProfileOwner } from '@/lib/authorization';

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const leadId = body.leadId || body.id;

    if (!leadId) {
      return NextResponse.json({ success: false, error: 'leadId is required.' }, { status: 400 });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found.' }, { status: 404 });
    }

    const username = String(lead.creatorUsername || '').toLowerCase();
    const access = await requireProfileOwner(request, username);
    if (access.error) return access.error;

    const syncResult = await syncLeadToGoogleContacts(lead, username);

    lead.syncedToGoogleContacts = syncResult.success;
    lead.googleContactId = syncResult.googleContactId || lead.googleContactId;
    lead.syncStatus = syncResult.status;
    lead.syncNote = syncResult.note;
    if (syncResult.success) {
      lead.syncedAt = new Date();
    }
    await lead.save();

    return NextResponse.json({
      success: true,
      synced: syncResult.success,
      status: syncResult.status,
      message: syncResult.note,
      syncResult,
      lead,
    });
  } catch (error) {
    console.error('Leads sync error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
