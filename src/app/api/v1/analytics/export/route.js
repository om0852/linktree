import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import { requireProfileOwner } from '@/lib/authorization';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = (searchParams.get('target_id') || searchParams.get('username') || '').toLowerCase().trim();
    const range = (searchParams.get('range') || '30d').toLowerCase();

    if (!targetId) {
      return new NextResponse('target_id or username parameter is required', { status: 400 });
    }
    const access = await requireProfileOwner(request, targetId);
    if (access.error) return access.error;

    await connectToDatabase();

    const now = new Date();
    let startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (range === '24h' || range === 'today') {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'all') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const events = await AnalyticsEvent.find({
      $or: [
        { target_id: targetId },
        { profileUsername: targetId }
      ],
      timestamp: { $gte: startDate }
    })
    .sort({ timestamp: -1 })
    .limit(10000)
    .lean();

    // RFC 4180 CSV generation
    const headers = [
      'Event ID',
      'Timestamp (ISO)',
      'Event Type',
      'Target ID',
      'Link ID',
      'Destination URL',
      'Country',
      'Country Code',
      'City',
      'Region',
      'Device',
      'Operating System',
      'Browser',
      'Attribution Source',
      'Referrer',
      'Is Unique',
      'Is Bot',
      'Edge Latency (ms)'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = events.map(e => [
      escapeCsv(e.id),
      escapeCsv(e.timestamp ? new Date(e.timestamp).toISOString() : ''),
      escapeCsv(e.event_type),
      escapeCsv(e.target_id || e.profileUsername),
      escapeCsv(e.link_id || ''),
      escapeCsv(e.destination_url || ''),
      escapeCsv(e.country || ''),
      escapeCsv(e.country_code || ''),
      escapeCsv(e.city || ''),
      escapeCsv(e.region || ''),
      escapeCsv(e.device || ''),
      escapeCsv(e.os || ''),
      escapeCsv(e.browser || ''),
      escapeCsv(e.source || ''),
      escapeCsv(e.referrer || ''),
      escapeCsv(e.is_unique ? 'TRUE' : 'FALSE'),
      escapeCsv(e.is_bot ? 'TRUE' : 'FALSE'),
      escapeCsv(e.latency_ms || 0)
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    const filename = `telemetry_${targetId}_${range}_${now.toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('CSV Export error:', error);
    return new NextResponse('Export failed: ' + error.message, { status: 500 });
  }
}
