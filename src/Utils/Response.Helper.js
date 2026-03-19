module.exports = {
  success: (data) => ({ success: true, data }),
  error: (message) => ({ success: false, error: message })
};
