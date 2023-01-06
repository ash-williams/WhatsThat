const
  users = require('../models/user.server.models'),
  log = require('../lib/logger')(),
  validator = require('../lib/validator'),
  config = require('../config/config.js'),
  schema = require('../config/' + config.get('specification'));


const create = (req, res) => {
    return res.sendStatus(500);
}

const login = (req, res) => {
    return res.sendStatus(500);
}

const logout = (req, res) => {
    return res.sendStatus(500);
}

const get_one = (req, res) => {
    return res.sendStatus(500);
}

const update = (req, res) => {
    return res.sendStatus(500);
}

const get_profile_photo = (req, res) => {
    return res.sendStatus(500);
}

const add_profile_photo = (req, res) => {
    return res.sendStatus(500);
}

const search = (req, res) => {
    return res.sendStatus(500);
}

module.exports = {
    create: create,
    login: login,
    logout: logout,
    get_one: get_one,
    update: update,
    get_profile_photo: get_profile_photo,
    add_profile_photo: add_profile_photo,
    search: search
};