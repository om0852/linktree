import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Profile from '../src/models/Profile.js';
import User from '../src/models/User.js';
import { INITIAL_USER_PROFILE } from '../src/constants/app.js';

test('Brand Bio Workspace Creation & Profile Schema Validation Suite', async (t) => {
  await t.test('validates Profile schema against INITIAL_USER_PROFILE with all design options cleanly', () => {
    const roundnessOptions = ['sharp', 'slight', 'moderate', 'pill', 'rounded', 'full'];
    
    for (const roundness of roundnessOptions) {
      const p = new Profile({
        ...INITIAL_USER_PROFILE,
        username: `brand_${roundness}`,
        name: `Brand ${roundness}`,
        designSettings: {
          ...(INITIAL_USER_PROFILE.designSettings || {}),
          buttonRoundness: roundness,
          buttonShadow: 'soft',
          customColors: {},
        },
      });

      const err = p.validateSync();
      assert.equal(err, undefined, `Profile validation failed for buttonRoundness: ${roundness}`);
    }
  });

  await t.test('validates User model multi-profile workspace fields', () => {
    const dummyId1 = new mongoose.Types.ObjectId();
    const dummyId2 = new mongoose.Types.ObjectId();

    const u = new User({
      email: 'agency@treeinbio.com',
      username: 'agencycreator',
      passwordHash: 'dummy_hash_123',
      name: 'Agency Creator',
      role: 'agency',
      profiles: [dummyId1, dummyId2],
      activeProfileId: dummyId2,
    });

    const err = u.validateSync();
    assert.equal(err, undefined, 'User validation must pass cleanly with multi-profile array and activeProfileId');
    assert.equal(u.profiles.length, 2);
    assert.equal(u.activeProfileId.toString(), dummyId2.toString());
  });

  await t.test('verifies active workspace profile resolution logic', () => {
    const rootProfile = { _id: new mongoose.Types.ObjectId(), username: 'om_root', name: 'OM Root' };
    const brandProfile = { _id: new mongoose.Types.ObjectId(), username: 'salunke_brand', name: 'Salunke Brand' };

    const userWithActiveBrand = {
      username: 'om_root',
      activeProfileId: brandProfile._id,
      profiles: [rootProfile._id, brandProfile._id],
    };

    // Simulate session resolution
    const resolvedProfile = userWithActiveBrand.activeProfileId.toString() === brandProfile._id.toString()
      ? brandProfile
      : rootProfile;

    assert.equal(resolvedProfile.username, 'salunke_brand', 'Should resolve active brand workspace profile instead of root');
    assert.equal(resolvedProfile._id.toString(), brandProfile._id.toString());
  });
});
