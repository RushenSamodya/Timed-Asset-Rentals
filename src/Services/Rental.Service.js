const db = require('./dbHandler');
const { v4: uuidv4 } = require('uuid');

const DEFAULT_MAX = parseInt(process.env.DEFAULT_MAX_RENTAL_SECONDS || '86400', 10);

module.exports = {
  bootstrap: async () => {
    // place to seed defaults if needed
    return true;
  },

  registerAsset: async (ownerPubKey, assetId, name, metadata) => {
    if (!assetId || !name) throw new Error('assetId and name are required');

    const existing = await db.get('SELECT asset_id FROM assets WHERE asset_id = ?', [assetId]);
    if (existing) throw new Error('Asset already exists');

    const createdAt = Math.floor(Date.now() / 1000);
    await db.run(
      'INSERT INTO assets (asset_id, owner, name, metadata, available, created_at) VALUES (?,?,?,?,?,?)',
      [assetId, ownerPubKey, name, JSON.stringify(metadata || {}), 1, createdAt]
    );
    return { assetId, owner: ownerPubKey, name, metadata, available: true, createdAt };
  },

  listAssets: async (availableOnly) => {
    if (availableOnly) {
      return await db.all('SELECT asset_id as assetId, owner, name, metadata, available, created_at as createdAt FROM assets WHERE available = 1', []);
    }
    return await db.all('SELECT asset_id as assetId, owner, name, metadata, available, created_at as createdAt FROM assets', []);
  },

  rentAsset: async (assetId, renterPubKey, durationSeconds) => {
    if (!assetId) throw new Error('assetId is required');
    const asset = await db.get('SELECT asset_id, owner, available FROM assets WHERE asset_id = ?', [assetId]);
    if (!asset) throw new Error('Asset not found');
    if (asset.available !== 1) throw new Error('Asset not available');

    const dur = parseInt(durationSeconds || DEFAULT_MAX, 10);
    if (dur <= 0 || dur > DEFAULT_MAX) throw new Error('Invalid duration');

    const now = Math.floor(Date.now() / 1000);
    const end = now + dur;
    const rentalId = uuidv4();

    await db.run(
      'INSERT INTO rentals (rental_id, asset_id, renter, start_time, end_time, status) VALUES (?,?,?,?,?,?)',
      [rentalId, assetId, renterPubKey, now, end, 'active']
    );
    await db.run('UPDATE assets SET available = 0 WHERE asset_id = ?', [assetId]);

    return { rentalId, assetId, renter: renterPubKey, startTime: now, endTime: end, status: 'active' };
  },

  returnAsset: async (rentalId, requesterPubKey) => {
    if (!rentalId) throw new Error('rentalId is required');
    const rental = await db.get('SELECT rental_id, asset_id, renter, status FROM rentals WHERE rental_id = ?', [rentalId]);
    if (!rental) throw new Error('Rental not found');
    if (rental.status !== 'active') throw new Error('Rental is not active');

    // authorize: renter or owner of the asset
    const asset = await db.get('SELECT owner FROM assets WHERE asset_id = ?', [rental.asset_id]);
    if (!asset) throw new Error('Asset not found');
    if (requesterPubKey !== rental.renter && requesterPubKey !== asset.owner) throw new Error('Not authorized to return');

    await db.run('UPDATE rentals SET status = \"returned\" WHERE rental_id = ?', [rentalId]);
    await db.run('UPDATE assets SET available = 1 WHERE asset_id = ?', [rental.asset_id]);

    return { returned: true, rentalId };
  },

  autoReturnExpired: async () => {
    const now = Math.floor(Date.now() / 1000);
    const expired = await db.all('SELECT rental_id, asset_id FROM rentals WHERE status = \"active\" AND end_time <= ?', [now]);
    for (const r of expired) {
      await db.run('UPDATE rentals SET status = \"returned\" WHERE rental_id = ?', [r.rental_id]);
      await db.run('UPDATE assets SET available = 1 WHERE asset_id = ?', [r.asset_id]);
    }
    return { processed: expired.length };
  },

  myRentals: async (pubkey) => {
    return await db.all(
      'SELECT rental_id as rentalId, asset_id as assetId, renter, start_time as startTime, end_time as endTime, status FROM rentals WHERE renter = ? ORDER BY start_time DESC',
      [pubkey]
    );
  }
};
