import { getComposioClient, isComposioConfigured } from './composio.js';

/**
 * Syncs a captured lead directly to the creator's connected Google Contacts / Gmail account via Composio.
 * 
 * @param {Object} lead - The lead document containing fullName, email, phone, company, note
 * @param {String} creatorUsername - The username of the creator whose Google account to sync into
 * @returns {Promise<{ success: boolean, googleContactId?: string, note: string }>}
 */
export async function syncLeadToGoogleContacts(lead, creatorUsername = 'creator_default') {
  if (!isComposioConfigured()) {
    return {
      success: false,
      status: 'not_configured',
      note: 'Composio API key is not configured in .env.local',
    };
  }

  const client = getComposioClient();
  const userId = creatorUsername || 'creator_default';

  // Parse name into givenName and familyName
  const nameParts = (lead.fullName || '').trim().split(' ');
  const givenName = nameParts[0] || 'Lead';
  const familyName = nameParts.slice(1).join(' ') || '';

  const phone = (lead.phone || '').trim();
  const email = (lead.email || '').trim().toLowerCase();
  const note = (lead.note || '').trim();
  const company = (lead.company || '').trim();

  // Helper to extract app slug safely from string or object
  const getAppSlug = (acc) => {
    if (!acc) return '';
    if (typeof acc.toolkit === 'string') return acc.toolkit;
    if (acc.toolkit?.slug) return acc.toolkit.slug;
    if (acc.toolkit?.name) return acc.toolkit.name;
    if (typeof acc.app === 'string') return acc.app;
    if (acc.app?.slug) return acc.app.slug;
    if (acc.appName) return String(acc.appName);
    if (acc.app_name) return String(acc.app_name);
    if (acc.toolkitSlug) return String(acc.toolkitSlug);
    if (acc.wordId) return String(acc.wordId);
    return '';
  };

  try {
    // 1. Verify user actually has a connected Google / Gmail account in Composio
    let accounts = null;
    try {
      accounts = await client.connectedAccounts.list({ userIds: [userId] });
    } catch {
      try {
        accounts = await client.connectedAccounts.list();
      } catch {
        accounts = null;
      }
    }

    const connectedGoogleAcc = accounts?.items?.find((acc) => {
      const app = getAppSlug(acc).toLowerCase();
      const status = (acc.status || '').toUpperCase();
      const isGoogle = app.includes('google') || app.includes('gmail');
      const isActive = status === 'ACTIVE' || status === 'CONNECTED';
      return isGoogle && isActive;
    });

    if (!connectedGoogleAcc) {
      return {
        success: false,
        status: 'not_configured',
        note: 'Google / Gmail account is not connected yet. Please connect your Google account in the Connectors Hub to enable contact syncing.',
      };
    }

    const appSlug = getAppSlug(connectedGoogleAcc).toLowerCase();

    // 2. Prepare contact payload
    const contactParams = {
      givenName,
      familyName,
      phoneNumbers: phone ? [{ value: phone, type: 'mobile' }] : [],
      emailAddresses: email ? [{ value: email, type: 'work' }] : [],
      organizations: company ? [{ name: company, title: 'TreeInBio Contact' }] : [],
      biography: note ? `Source: TreeInBio Link-in-Bio | Message: ${note}` : 'Captured via TreeInBio Link-in-Bio',
    };

    let result = null;

    // 3. Execute sync depending on connected capability (Google Contacts vs Gmail)
    if (appSlug.includes('contact')) {
      try {
        result = await client.tools.execute('googlecontacts_create_contact', {
          userId,
          dangerouslySkipVersionCheck: true,
          arguments: contactParams,
        });
      } catch (primaryErr) {
        result = await client.tools.execute('GOOGLECONTACTS_CREATE_CONTACT', {
          userId,
          dangerouslySkipVersionCheck: true,
          arguments: contactParams,
        });
      }
    } else {
      // Gmail connected: create follow-up draft in creator's mailbox
      const draftSubject = `[TreeInBio Lead] ${lead.fullName || 'New Contact Submission'}`;
      const draftBody = `Hi ${givenName},\n\nThank you for reaching out via my TreeInBio profile.\n\nCaptured Lead Details:\n• Name: ${lead.fullName || 'N/A'}\n• Email: ${email || 'N/A'}\n• Phone: ${phone || 'N/A'}\n• Company: ${company || 'N/A'}\n• Note: ${note || 'N/A'}\n\nBest regards,\n${creatorUsername}`;

      result = await client.tools.execute('GMAIL_CREATE_EMAIL_DRAFT', {
        userId,
        dangerouslySkipVersionCheck: true,
        arguments: {
          recipient_email: email || connectedGoogleAcc.data?.displayName || 'lead@example.com',
          subject: draftSubject,
          body: draftBody,
        },
      });
    }

    const isSuccess = Boolean(result && result.successful !== false && !result.error);

    if (isSuccess) {
      const syncNote = appSlug.includes('contact')
        ? 'Successfully synced to connected Google Contacts address book.'
        : `Successfully synced lead to connected Gmail (${connectedGoogleAcc.data?.displayName || 'Active'}) with a ready follow-up draft.`;

      return {
        success: true,
        status: 'synced',
        googleContactId: result?.data?.id || result?.data?.resourceName || `sync_${Date.now()}`,
        note: syncNote,
        result,
      };
    }

    return {
      success: false,
      status: 'failed',
      note: result?.error || 'Google Contacts sync failed during execution.',
      result,
    };
  } catch (error) {
    const msg = error.message || 'Google Contacts sync failed';
    const isAuthError = msg.includes('Connected account not found') || 
                        msg.includes('No connected account') || 
                        msg.includes('authenticate') ||
                        msg.includes('OAuth');

    return {
      success: false,
      status: isAuthError ? 'not_configured' : 'failed',
      note: isAuthError 
        ? 'Google account is not connected yet. Please connect your Google account in the Connectors Hub to enable contact syncing.' 
        : `Google Contacts sync error: ${msg}`,
    };
  }
}
