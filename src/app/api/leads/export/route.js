import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';

function escapeCsvField(field) {
  if (field === null || field === undefined) return '""';
  const stringVal = String(field).replace(/"/g, '""');
  return `"${stringVal}"`;
}

export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return new NextResponse('Username parameter is required', { status: 400 });
    }

    const leads = await Lead.find({ creatorUsername: username.toLowerCase().trim() })
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      'Full Name',
      'Phone Number',
      'Email Address',
      'Company / Brand',
      'Message / Note',
      'Google Contacts Synced',
      'Sync Status',
      'Date Captured',
    ];

    const rows = leads.map((lead) => [
      escapeCsvField(lead.fullName),
      escapeCsvField(lead.phone),
      escapeCsvField(lead.email),
      escapeCsvField(lead.company),
      escapeCsvField(lead.note),
      escapeCsvField(lead.syncedToGoogleContacts ? 'YES' : 'NO'),
      escapeCsvField(lead.syncStatus),
      escapeCsvField(new Date(lead.createdAt).toISOString()),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${username}-leads.csv"`,
      },
    });
  } catch (error) {
    console.error('Leads CSV export error:', error);
    return new NextResponse('Export failed: ' + error.message, { status: 500 });
  }
}
