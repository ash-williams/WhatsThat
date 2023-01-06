const express = require("express");
const router = express.Router();

require('./user.server.routes')(router);
require('./contact.server.routes')(router);
require('./chat.server.routes')(router);

module.exports = router;