const
  chats = require('../models/chat.server.models'),
  log = require('../lib/logger')(),
  validator = require('../lib/validator'),
  config = require('../config/config.js'),
  schema = require('../config/' + config.get('specification'));


const get_chats = (req, res) => {
    return res.sendStatus(500);
}

const create_chat = (req, res) => {
    return res.sendStatus(500);
}

const get_single_chat = (req, res) => {
    return res.sendStatus(500);
}

const update_chat = (req, res) => {
    return res.sendStatus(500);
}

const add_user_to_chat = (req, res) => {
    return res.sendStatus(500);
}

const remove_user_from_chat = (req, res) => {
    return res.sendStatus(500);
}

const send_message = (req, res) => {
    return res.sendStatus(500);
}

const update_message = (req, res) => {
    return res.sendStatus(500);
}

const delete_message = (req, res) => {
    return res.sendStatus(500);
}

module.exports = {
    get_chats,
    create_chat,
    get_single_chat,
    update_chat,
    add_user_to_chat,
    remove_user_from_chat,
    send_message,
    update_message,
    delete_message
};