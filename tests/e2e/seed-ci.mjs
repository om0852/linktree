// Seeds an empty CI database with the demo creator the API integration tests
// expect ("emilyvance", a public profile with two links and a tip jar).
// Refuses to run unless the database name ends in _ci, so it can never
// write to a real database.
import mongoose from 'mongoose';
import Profile from '../../src/models/Profile.js';

const uri = process.env.MONGODB_URI || '';
const dbName = new URL(uri.replace(/^mongodb(\+srv)?:/, 'http:')).pathname.replace(/^\//, '');
if (!/_ci$/.test(dbName)) {
  console.error(`Refusing to seed "${dbName || '(no database)'}": the database name must end in _ci.`);
  process.exit(1);
}

await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
await Profile.updateOne(
  { username: 'emilyvance' },
  {
    $setOnInsert: {
      username: 'emilyvance',
      name: 'Emily Vance',
      title: 'Emily Vance',
      bio: 'Designer and creator. Demo profile for automated tests.',
      verified: true,
      links: [
        { id: 'ci-link-1', title: 'Portfolio', url: 'https://example.com/portfolio', active: true },
        { id: 'ci-link-2', title: 'Newsletter', url: 'https://example.com/newsletter', active: true },
      ],
      widgets: { hasNewsletter: false, hasTipJar: true, mediaKitStats: { followers: '100K', engagement: '4.5%', monthlyViews: '500K' } },
    },
  },
  { upsert: true },
);
console.log(`Seeded demo creator in ${dbName}`);
await mongoose.disconnect();
