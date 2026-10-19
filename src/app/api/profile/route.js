import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import Profile from '@/models/Profile';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { INITIAL_USER_PROFILE } from '@/constants/app';
import { toPublicProfile, toOwnerProfile } from '@/lib/publicProfile';
import { requireProfileOwner } from '@/lib/authorization';
import { hashPassword } from '@/lib/auth';

// GET profile by ?username=xyz or current authenticated user
export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const queryUsername = searchParams.get('username');

    let targetUsername = queryUsername ? queryUsername.toLowerCase().trim() : null;

    if (!targetUsername) {
      const authUser = await getAuthUser(request);
      if (authUser) {
        const targetUserId = authUser.id || authUser.userId || authUser._id;
        let user = targetUserId 
          ? await User.findById(targetUserId).lean() 
          : null;
        if (!user && authUser.username) {
          user = await User.findOne({ username: authUser.username.toLowerCase() }).lean();
        }

        if (user?.activeProfileId) {
          const activeProf = await Profile.findById(user.activeProfileId).lean();
          if (activeProf) {
            return NextResponse.json({ success: true, profile: toOwnerProfile(activeProf) });
          }
        }
        targetUsername = authUser.username;
      }
    }

    if (!targetUsername) {
      return NextResponse.json({ success: false, message: 'Username parameter or authenticated session required' }, { status: 400 });
    }

    const profile = await Profile.findOne({ username: targetUsername }).lean();
    if (!profile) {
      return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 });
    }

    const authUser = await getAuthUser(request);
    const isOwner = authUser && (authUser.role === 'admin' || authUser.username === targetUsername);
    if (isOwner) {
      return NextResponse.json({ success: true, profile: toOwnerProfile(profile) });
    }
    return NextResponse.json({ success: true, profile: toPublicProfile(profile) });
  } catch (error) {
    console.error('API Profile GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create or update profile (upsert)
export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    if (!body || !body.username) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    const normalizedUsername = body.username.toLowerCase().trim();

    // Verify session authorization
    const access = await requireProfileOwner(request, normalizedUsername);
    if (access.error) return access.error;
    const existingGate = await Profile.findOne({ username: normalizedUsername }).select('accessGate').lean();
    const submittedPasscode = typeof body.accessGate?.passcode === 'string' ? body.accessGate.passcode : '';
    if (submittedPasscode.length > 128) return NextResponse.json({ success: false, error: 'Passcode must be 128 characters or fewer.' }, { status: 400 });
    const passcodeHash = submittedPasscode.startsWith('$2')
      ? submittedPasscode
      : submittedPasscode
        ? await hashPassword(submittedPasscode.trim())
        : existingGate?.accessGate?.passcode || '';

    // Clean links structure preserving power attributes
    const cleanedLinks = Array.isArray(body.links)
      ? body.links.map((link, idx) => ({
          id: link.id || `l_${Date.now()}_${idx}`,
          title: link.title || 'Untitled Link',
          url: link.url || '#',
          type: link.type || 'standard',
          badge: link.badge || '',
          icon: link.icon || 'link',
          size: link.size === 'large' ? 'large' : 'small',
          clicks: typeof link.clicks === 'number' ? link.clicks : 0,
          active: link.active !== undefined ? link.active : true,
          disabled: Boolean(link.disabled),
          isArchived: Boolean(link.isArchived),
          subtitle: link.subtitle || '',
          leadMagnet: link.leadMagnet || {
            enabled: false,
            assetUrl: '',
            assetType: 'pdf',
            previewText: 'Free Download',
            requireEmail: true,
            requireWhatsApp: false,
            marketingPlatform: 'none',
            marketingListId: '',
          },
          embed: link.embed || {
            enabled: false,
            platform: 'none',
            embedId: '',
          },
          schedule: link.schedule || {
            enabled: false,
            startsAt: null,
            expiresAt: null,
          },
          collectionId: typeof link.collectionId === 'string' ? link.collectionId : '',
          thumbnail: typeof link.thumbnail === 'string' ? link.thumbnail : '',
          thumbnailType: ['image', 'icon', 'none'].includes(link.thumbnailType) ? link.thumbnailType : 'none',
          thumbnailIcon: typeof link.thumbnailIcon === 'string' ? link.thumbnailIcon : '',
          price: typeof link.price === 'string' ? link.price : '',
          mediaType: ['standard', 'instagram', 'youtube', 'product', 'link'].includes(link.mediaType) ? link.mediaType : 'standard',
          geoTargeting: link.geoTargeting ? {
            enabled: Boolean(link.geoTargeting.enabled),
            mode: ['include', 'exclude'].includes(link.geoTargeting.mode) ? link.geoTargeting.mode : 'include',
            countries: Array.isArray(link.geoTargeting.countries) ? link.geoTargeting.countries : [],
          } : {
            enabled: false,
            mode: 'include',
            countries: [],
          },
        }))
      : [];

    // Clean collections structure
    const cleanedCollections = Array.isArray(body.collections)
      ? body.collections.map((col, idx) => ({
          id: col.id || `col_${Date.now()}_${idx}`,
          title: col.title || 'Untitled Collection',
          viewMode: ['list', 'grid', 'carousel', 'showcase'].includes(col.viewMode) ? col.viewMode : 'list',
          type: ['custom', 'instagram', 'youtube', 'products'].includes(col.type) ? col.type : 'custom',
          active: col.active !== undefined ? Boolean(col.active) : true,
        }))
      : [];

    const finalName = (body.name || body.title || normalizedUsername).trim();
    const finalTitle = (body.title || body.name || normalizedUsername).trim();

    const updateData = {
      username: normalizedUsername,
      name: finalName,
      title: finalTitle,
      titleLogo: body.titleLogo ? {
        enabled: Boolean(body.titleLogo.enabled),
        url: body.titleLogo.url || '',
        altText: body.titleLogo.altText || '',
        height: Number(body.titleLogo.height) || 40,
      } : { enabled: false, url: '', altText: '', height: 40 },
      bio: body.bio || '',
      avatar: body.avatar || '',
      avatarShape: ['circle', 'rounded', 'squircle', 'hexagon', 'arch', 'diamond', 'cutout'].includes(body.avatarShape) ? body.avatarShape : 'circle',
      verified: Boolean(body.verified),
      location: body.location || '',
      niche: body.niche || 'creator',
      nicheLabel: body.nicheLabel || 'Creator',
      layout: body.layout || 'bento',
      theme: body.theme || 'atelier',
      buttonShape: body.buttonShape || 'rounded',
      font: body.font || 'Playfair Display',
      headerLayout: ['classic', 'banner', 'hero', 'cutout', 'shape'].includes(body.headerLayout) ? body.headerLayout : 'classic',
      coverImage: body.coverImage || '',
      socialsPosition: ['top', 'bottom'].includes(body.socialsPosition) ? body.socialsPosition : 'top',
      heroVideo: body.heroVideo || '',
      socials: body.socials || {},
      links: cleanedLinks,
      collections: cleanedCollections,
      widgets: {
        hasNewsletter: Boolean(body.widgets?.hasNewsletter),
        newsletterTitle: body.widgets?.newsletterTitle || '',
        hasTipJar: body.widgets?.hasTipJar !== undefined ? Boolean(body.widgets?.hasTipJar) : true,
        mediaKitStats: body.widgets?.mediaKitStats || {
          followers: '0',
          engagement: '0%',
          monthlyViews: '0',
        },
      },
      storyBubble: body.storyBubble || {
        enabled: false,
        videoUrl: '',
        caption: '',
      },
      socialProof: body.socialProof || {
        enabled: false,
        showDownloads: true,
        showClicks: true,
        intervalMs: 8000,
      },
      trackingPixels: body.trackingPixels || {
        metaPixelId: '',
        ga4MeasurementId: '',
        tiktokPixelId: '',
        pinterestTagId: '',
      },
      compliance: body.compliance || {
        affiliateDisclosure: false,
        disclosureText: 'This page contains affiliate links. I may earn a commission at no extra cost to you.',
      },
      accessGate: body.accessGate ? {
        enabled: Boolean(body.accessGate.enabled),
        type: ['none', 'passcode', 'age_18', 'sensitive'].includes(body.accessGate.type) ? body.accessGate.type : 'none',
        passcode: passcodeHash,
        title: body.accessGate.title || 'Restricted Profile',
        description: body.accessGate.description || 'This profile requires verification before viewing content.',
      } : (existingGate?.accessGate || INITIAL_USER_PROFILE.accessGate),
      leadCapture: body.leadCapture || INITIAL_USER_PROFILE.leadCapture,
      scheduleMeeting: body.scheduleMeeting || INITIAL_USER_PROFILE.scheduleMeeting,
      shop: body.shop || { enabled: false, products: [] },
      designSettings: body.designSettings ? {
        wallpaper: body.designSettings.wallpaper || { type: 'fill', value: '', blur: 0 },
        buttonStyle: ['solid', 'glass', 'outline'].includes(body.designSettings.buttonStyle) ? body.designSettings.buttonStyle : 'solid',
        buttonRoundness: (() => {
          let r = body.designSettings.buttonRoundness;
          if (r === 'full') r = 'pill';
          if (r === 'rounded') r = 'moderate';
          return ['sharp', 'slight', 'moderate', 'pill'].includes(r) ? r : 'moderate';
        })(),
        buttonShadow: (() => {
          let s = body.designSettings.buttonShadow;
          if (s === 'offset') s = 'strong';
          return ['none', 'soft', 'strong', 'hard'].includes(s) ? s : 'none';
        })(),
        buttonColor: body.designSettings.buttonColor || '',
        buttonTextColor: body.designSettings.buttonTextColor || '',
        buttonShadowColor: body.designSettings.buttonShadowColor || '#000000',
        customColors: body.designSettings.customColors || {},
        stickers: Array.isArray(body.designSettings.stickers)
          ? body.designSettings.stickers.map((stk, sIdx) => {
              const isImg = typeof stk.src === 'string' && /^(https?:\/\/|\/|data:image\/|blob:)/i.test(stk.src.trim());
              const isImgUrl = typeof stk.imageUrl === 'string' && /^(https?:\/\/|\/|data:image\/|blob:)/i.test(stk.imageUrl.trim());
              const cleanSrc = isImg ? stk.src.trim() : (isImgUrl ? stk.imageUrl.trim() : '');
              const cleanEmoji = stk.emoji || (!isImg && stk.src ? stk.src : '✨');

              return {
                id: stk.id || `stk_${Date.now()}_${sIdx}`,
                stickerId: stk.stickerId || 'sticker',
                src: cleanSrc,
                emoji: cleanEmoji,
                name: stk.name || 'Sticker',
                x: typeof stk.x === 'number' ? stk.x : 50,
                y: typeof stk.y === 'number' ? stk.y : 50,
                scale: typeof stk.scale === 'number' ? stk.scale : 1,
                rotation: typeof stk.rotation === 'number' ? stk.rotation : (typeof stk.rotate === 'number' ? stk.rotate : 0),
                rotate: typeof stk.rotate === 'number' ? stk.rotate : (typeof stk.rotation === 'number' ? stk.rotation : 0),
                flipX: Boolean(stk.flipX ?? stk.flipHorizontal),
                flipHorizontal: Boolean(stk.flipHorizontal ?? stk.flipX),
                devices: stk.devices && typeof stk.devices === 'object' ? stk.devices : {},
              };
            })
          : [],
        hideFooter: Boolean(body.designSettings.hideFooter),
      } : (INITIAL_USER_PROFILE.designSettings || {
        wallpaper: { type: 'fill', value: '', blur: 0 },
        buttonStyle: 'solid',
        buttonRoundness: 'moderate',
        buttonShadow: 'none',
        buttonColor: '',
        buttonTextColor: '',
        buttonShadowColor: '#000000',
        customColors: {},
        stickers: [],
        hideFooter: false,
      }),
    };

    if (typeof body.performanceMediaKitEnabled === 'boolean') {
      updateData.performanceMediaKitEnabled = body.performanceMediaKitEnabled;
    }

    const savedProfile = await Profile.findOneAndUpdate(
      { username: normalizedUsername },
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Invalidate Next.js cache so changes reflect instantly on public and creator pages
    try {
      revalidatePath(`/${normalizedUsername}`);
      revalidatePath('/');
      revalidatePath('/leads');
      revalidatePath('/bookings');
    } catch (revalErr) {
      console.warn('Path revalidation notice:', revalErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile saved and published successfully!',
      profile: toOwnerProfile(savedProfile),
      publicUrl: `/${savedProfile.username}`,
    });
  } catch (error) {
    console.error('API Profile POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
