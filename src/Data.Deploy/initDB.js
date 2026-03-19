const db = require('../Services/dbHandler');

module.exports = async function initDB() {
  await db.run(`CREATE TABLE IF NOT EXISTS assets (
    asset_id TEXT PRIMARY KEY,
    owner TEXT NOT NULL,
    name TEXT NOT NULL,
    metadata TEXT,
    available INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  )`);

  await db.run(`CREATE TABLE IF NOT EXISTS rentals (
    rental_id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    renter TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY(asset_id) REFERENCES assets(asset_id)
  )`);

  await db.run('CREATE INDEX IF NOT EXISTS idx_assets_available ON assets(available)');
  await db.run('CREATE INDEX IF NOT EXISTS idx_rentals_status_end ON rentals(status, end_time)');
};
