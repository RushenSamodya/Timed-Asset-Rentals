const sqlite3 = require('sqlite3').verbose();

let _db = null;

async function init(dbPath) {
  return new Promise((resolve, reject) => {
    try {
      _db = new sqlite3.Database(dbPath, (err) => {
        if (err) return reject(err);
        resolve(true);
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    _db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

async function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    _db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    _db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = { init, run, get, all };
