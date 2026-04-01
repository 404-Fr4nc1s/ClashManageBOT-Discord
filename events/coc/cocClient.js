const { Client } = require('clashofclans.js');
const config = require('../../config');

const coc = new Client({ keys: [config.clashApiToken] });

module.exports = coc;
