const { HotPocketContract } = require('hotpocket-nodejs-contract');
const hpc = new HotPocketContract();

const path = require('path');
const { v4: uuidv4 } = require('uuid');
const RentalController = require('./Controllers/Rental.Controller');
const RentalService = require('./Services/Rental.Service');
const dbHandler = require('./Services/dbHandler');
const initDB = require('./Data.Deploy/initDB');

const contract = {
  onContractInit: async (ctx) => {
    try {
      const dbPath = process.env.DB_PATH || 'asset_rental.db';
      await dbHandler.init(path.resolve('.', dbPath));
      await initDB();
      await RentalService.bootstrap();
    } catch (err) {
      console.error('Initialization error:', err);
    }
  },
  onRequest: async (ctx) => {
    try {
      // Iterate user requests and handle JSON messages.
      for (const req of ctx.requests || []) {
        const user = req.user;
        let payloadStr = '';
        try {
          payloadStr = (req.msg || req.data || req.payload || Buffer.alloc(0)).toString();
        } catch (e) {
          payloadStr = '';
        }

        let json;
        try {
          json = payloadStr ? JSON.parse(payloadStr) : {};
        } catch (e) {
          json = {};
        }

        const result = await RentalController.handleMessage(user, json);
        await hpc.sendResponse(user, Buffer.from(JSON.stringify(result)));
      }
    } catch (err) {
      console.error('onRequest error:', err);
    }
  },
  onConsensus: async (ctx) => {
    try {
      await RentalService.autoReturnExpired();
    } catch (err) {
      console.error('onConsensus error:', err);
    }
  }
};

hpc.init(contract);
