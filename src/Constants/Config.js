module.exports = {
  maxRentalDurationSeconds: parseInt(process.env.DEFAULT_MAX_RENTAL_SECONDS || '86400', 10)
};
