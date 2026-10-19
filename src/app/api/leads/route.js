import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Profile from '@/models/Profile';
import { syncLeadToGoogleContacts } from '@/lib/googleContactsSync';
import { getAuthUser } from '@/lib/auth';
import { requireProfileOwner } from '@/lib/authorization';
import { consumeRateLimit } from '@/lib/rateLimit';

// Validation Regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(\+?[0-9\s\-().]{7,20})$/;

/**
 * Validates lead submission payload based on creator's field settings.
 */
function validateLeadInput(body, leadConfig) {
  const fields = leadConfig?.fields || {
    name: { enabled: true, required: true },
    phone: { enabled: true, required: true },
    email: { enabled: true, required: true },
    company: { enabled: false, required: false },
    note: { enabled: true, required: false },
  };

  const errors = {};

  // 1. Name validation
  const name = (body.fullName || body.name || '').trim();
  if (fields.name?.enabled && fields.name?.required && name.length < 2) {
    errors.fullName = 'Please enter your full name (at least 2 characters).';
  }

  // 2. Phone validation
  const phone = (body.phone || body.contactNo || '').trim();
  const isWhatsApp = Boolean(body.isWhatsApp);
  if (fields.phone?.enabled) {
    if (fields.phone?.required && !phone) {
      errors.phone = 'Phone number is required.';
    } else if (phone && !PHONE_REGEX.test(phone)) {
      errors.phone = 'Please enter a valid phone number (e.g. +1 555-0199 or 9876543210).';
    }
  }

  // 3. Email validation
  const email = (body.email || '').trim().toLowerCase();
  if (fields.email?.enabled) {
    if (fields.email?.required && !email) {
      errors.email = 'Email address is required.';
    } else if (email && !EMAIL_REGEX.test(email)) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com).';
    }
  }

  // 4. Company validation
  const company = (body.company || '').trim();
  if (fields.company?.enabled && fields.company?.required && !company) {
    errors.company = 'Company / organization name is required.';
  }

  // 5. Note validation
  const note = (body.note || body.message || '').trim();
  if (fields.note?.enabled && fields.note?.required && !note) {
    errors.note = 'Please enter a short message or reason for contact.';
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors, cleanData: { fullName: name, phone, isWhatsApp, email, company, note } };
}

// POST /api/leads - Public Lead Capture Submission from Visitor
export async function POST(request) {
  try {
    const rate = consumeRateLimit(request, 'lead-capture', 10, 60 * 60 * 1000);
    if (!rate.allowed) return NextResponse.json({ success: false, error: 'Too many submissions. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
    await connectToDatabase();
    const body = await request.json();

    const rawUsername = body.creatorUsername || body.username;
    if (!rawUsername) {
      return NextResponse.json(
        { success: false, error: 'Creator username is required.' },
        { status: 400 }
      );
    }

    const creatorUsername = rawUsername.toLowerCase().trim();

    // Fetch creator profile configuration from MongoDB
    const profile = await Profile.findOne({ username: creatorUsername }).lean();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: `Creator @${creatorUsername} does not exist.` },
        { status: 404 }
      );
    }

    const leadConfig = profile.leadCapture || {
      enabled: true,
      syncToGoogleContacts: true,
      successMessage: 'Thank you! Your contact details have been sent.',
    };

    if (leadConfig.enabled === false) {
      return NextResponse.json(
        { success: false, error: 'This creator has disabled contact submissions.' },
        { status: 403 }
      );
    }

    // Validate inputs
    const { isValid, errors, cleanData } = validateLeadInput(body, leadConfig);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: Object.values(errors)[0],
          validationErrors: errors,
        },
        { status: 400 }
      );
    }

    // 1. Save lead to MongoDB in creator's account
    const newLead = await Lead.create({
      creatorUsername,
      fullName: cleanData.fullName,
      phone: cleanData.phone,
      isWhatsApp: cleanData.isWhatsApp,
      email: cleanData.email,
      company: cleanData.company,
      note: cleanData.note,
      source: body.source || 'bio_form_dialog',
      status: 'new',
    });

    // 2. Trigger automated Google Contacts / Gmail Sync if enabled by creator
    let syncResult = null;
    if (leadConfig.syncToGoogleContacts === false) {
      newLead.syncedToGoogleContacts = false;
      newLead.syncStatus = 'not_configured';
      newLead.syncNote = 'Auto-sync is turned off in creator settings';
      await newLead.save();
    } else if (cleanData.phone || cleanData.email) {
      try {
        syncResult = await syncLeadToGoogleContacts(newLead, creatorUsername);
        newLead.syncedToGoogleContacts = syncResult.success;
        newLead.googleContactId = syncResult.googleContactId || '';
        newLead.syncStatus = syncResult.status;
        newLead.syncNote = syncResult.note;
        if (syncResult.success) {
          newLead.syncedAt = new Date();
        }
        await newLead.save();
      } catch (syncErr) {
        console.error('Lead Google Contacts sync error:', syncErr);
        newLead.syncStatus = 'failed';
        newLead.syncNote = syncErr.message;
        await newLead.save();
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: leadConfig.successMessage || 'Thank you! Your contact details have been sent.',
        lead: newLead,
        syncStatus: newLead.syncStatus,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Leads POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET /api/leads?username=alexrivera
export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const rawUsername = searchParams.get('username');
    const status = searchParams.get('status');
    const query = searchParams.get('q');

    const authUser = await getAuthUser(request);
    let creatorUsername = rawUsername ? rawUsername.toLowerCase().trim() : authUser?.username;

    if (!creatorUsername) {
      return NextResponse.json(
        { success: false, error: 'Username parameter or authenticated session is required.' },
        { status: 400 }
      );
    }

    const access = await requireProfileOwner(request, creatorUsername);
    if (access.error) return access.error;

    const filter = { creatorUsername };

    if (status && status !== 'all') {
      if (status === 'synced') {
        filter.$or = [
          { syncedToGoogleContacts: true },
          { syncStatus: 'synced' }
        ];
      } else if (status === 'pending') {
        filter.syncedToGoogleContacts = { $ne: true };
        filter.syncStatus = { $ne: 'synced' };
      } else {
        filter.status = status;
      }
    }

    if (query) {
      const searchOr = [
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { company: { $regex: query, $options: 'i' } },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }

    const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean();

    // Calculate global stats for this creator so tab badges always reflect true totals
    const allCreatorLeads = await Lead.find({ creatorUsername }).select('phone email syncedToGoogleContacts syncStatus').lean();
    const total = allCreatorLeads.length;
    const withPhone = allCreatorLeads.filter((l) => Boolean(l.phone)).length;
    const withEmail = allCreatorLeads.filter((l) => Boolean(l.email)).length;
    const syncedToGoogle = allCreatorLeads.filter((l) => l.syncedToGoogleContacts || l.syncStatus === 'synced').length;

    return NextResponse.json({
      success: true,
      leads,
      stats: {
        total,
        withPhone,
        withEmail,
        syncedToGoogle,
      },
    });
  } catch (error) {
    console.error('Leads GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/leads?id=...&username=...
export async function DELETE(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const rawUsername = searchParams.get('username');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Lead ID is required.' }, { status: 400 });
    }

    const lead = await Lead.findById(id).select('creatorUsername').lean();
    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found.' }, { status: 404 });
    const creatorUsername = rawUsername ? rawUsername.toLowerCase().trim() : lead.creatorUsername;
    const access = await requireProfileOwner(request, creatorUsername);
    if (access.error) return access.error;

    const query = { _id: id, creatorUsername };

    const deleted = await Lead.findOneAndDelete(query);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Lead not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Contact lead deleted successfully.',
    });
  } catch (error) {
    console.error('Leads DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
