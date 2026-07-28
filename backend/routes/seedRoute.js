/**
 * seedRoute.js
 *
 * POST /api/seed
 * ─────────────
 * Uses the EXISTING backend MongoDB connection (no new connection needed).
 * Reads 2 existing users + 12 existing listings, creates 4 new users,
 * then distributes listings 2-per-user via bulkWrite.
 *
 * Protected by a secret key so it can't be triggered by random users.
 * Key is checked via ?key=SEED_SECRET in query or x-seed-key header.
 */

const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');
const Listing  = require('../models/Listing');

// ─── 4 New Users ──────────────────────────────────────────
const NEW_USERS = [
  { name: 'Sneha Gupta', email: 'sneha@easy.com', phone: '+91 98000 11223', password: '12345678' },
  { name: 'Karan Mehta', email: 'karan@easy.com', phone: '+91 95555 66666', password: '12345678' },
  { name: 'Meera Joshi', email: 'meera@easy.com', phone: '+91 99999 00000', password: '12345678' },
  { name: 'Rohan Das',   email: 'rohan@easy.com', phone: '+91 97777 88888', password: '12345678' },
];

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// POST /api/seed?key=dev-seed-2024
router.post('/', async (req, res) => {
  // Simple key guard — prevents accidental triggers
  const key = req.query.key || req.headers['x-seed-key'];
  if (key !== 'dev-seed-2024') {
    return res.status(401).json({ message: 'Unauthorized. Provide ?key=dev-seed-2024' });
  }

  try {
    const log = [];

    // ── Step 1: Read existing users ──────────────────────
    const existingUsers = await User.find({}).lean();
    log.push(`Found ${existingUsers.length} existing user(s): ${existingUsers.map(u => u.name).join(', ')}`);

    // ── Step 2: Create 4 new users (skip if already exist)
    const newUsers = [];
    for (const userData of NEW_USERS) {
      const exists = await User.findOne({ email: userData.email });
      if (exists) {
        log.push(`Skipped (already exists): ${userData.name}`);
        newUsers.push(exists);
      } else {
        const created = await User.create(userData); // bcrypt pre-save hook runs
        log.push(`Created user: ${created.name} <${created.email}>`);
        newUsers.push(created);
      }
    }

    // ── Step 3: Read all listings ─────────────────────────
    const listings = await Listing.find({}).sort({ createdAt: 1 }).lean();
    log.push(`Found ${listings.length} listing(s)`);

    if (listings.length === 0) {
      return res.status(400).json({ message: 'No listings found in DB to distribute.', log });
    }

    // ── Step 4: Distribute 2 listings per user ────────────
    const allUsers = [...existingUsers, ...newUsers];
    const LISTINGS_PER_USER = 2;
    const bulkOps = [];
    const assignment = [];

    listings.forEach((listing, idx) => {
      const userIdx = Math.floor(idx / LISTINGS_PER_USER) % allUsers.length;
      const user    = allUsers[userIdx];

      bulkOps.push({
        updateOne: {
          filter: { _id: listing._id },
          update: {
            $set: {
              seller:         user._id,
              sellerName:     user.name,
              sellerInitials: getInitials(user.name),
              sellerPhone:    user.phone || '',
            },
          },
        },
      });

      assignment.push({
        listing: listing.title,
        seller:  user.name,
        email:   user.email,
      });
    });

    // ── Step 5: Apply updates ─────────────────────────────
    const result = await Listing.bulkWrite(bulkOps);
    log.push(`Updated ${result.modifiedCount} listings`);

    // ── Summary table ─────────────────────────────────────
    const summary = allUsers.map((user, i) => {
      const start    = i * LISTINGS_PER_USER;
      const assigned = listings.slice(start, start + LISTINGS_PER_USER).map(l => l.title);
      return {
        name:     user.name,
        email:    user.email,
        type:     i < existingUsers.length ? 'existing' : 'new',
        listings: assigned,
      };
    });

    return res.json({
      success: true,
      totalUsers:    allUsers.length,
      totalListings: listings.length,
      log,
      summary,
      note: 'All users have password: 12345678',
    });

  } catch (err) {
    console.error('Seed error:', err.message);
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
