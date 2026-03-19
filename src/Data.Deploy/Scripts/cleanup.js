const db = require('../../Services/dbHandler');

(async () => {
  await db.run('DELETE FROM rentals WHERE status = \"returned\"');
  console.log('Cleanup done.');
})();
