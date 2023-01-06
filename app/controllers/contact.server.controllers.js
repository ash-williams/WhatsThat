const
  contacts = require('../models/contact.server.models'),
  log = require('../lib/logger')(),
  validator = require('../lib/validator'),
  config = require('../config/config.js'),
  schema = require('../config/' + config.get('specification'));


const get_contacts = (req, res) => {
    return res.sendStatus(500);
}

const add_contact = (req, res) => {
    return res.sendStatus(500);
}

const remove_contact = (req, res) => {
    return res.sendStatus(500);
}

const block_contact = (req, res) => {
    return res.sendStatus(500);
}

const unblock_contact = (req, res) => {
    return res.sendStatus(500);
}

module.exports = {
    get_contacts,
    add_contact,
    remove_contact,
    block_contact,
    unblock_contact
};