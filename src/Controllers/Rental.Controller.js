const Response = require('../Utils/Response.Helper');
const RentalService = require('../Services/Rental.Service');

module.exports = {
  handleMessage: async (user, data) => {
    try {
      const pubkey = user && user.publicKey ? user.publicKey : 'unknown';
      const action = (data && data.action) || '';

      switch (action) {
        case 'register_asset': {
          const { assetId, name, metadata } = data;
          const out = await RentalService.registerAsset(pubkey, assetId, name, metadata || {});
          return Response.success(out);
        }
        case 'list_assets': {
          const { availableOnly } = data;
          const out = await RentalService.listAssets(availableOnly);
          return Response.success(out);
        }
        case 'rent_asset': {
          const { assetId, durationSeconds } = data;
          const out = await RentalService.rentAsset(assetId, pubkey, durationSeconds);
          return Response.success(out);
        }
        case 'return_asset': {
          const { rentalId } = data;
          const out = await RentalService.returnAsset(rentalId, pubkey);
          return Response.success(out);
        }
        case 'my_rentals': {
          const out = await RentalService.myRentals(pubkey);
          return Response.success(out);
        }
        default:
          return Response.error('Unknown action.');
      }
    } catch (err) {
      return Response.error(err && err.message ? err.message : String(err));
    }
  }
};
