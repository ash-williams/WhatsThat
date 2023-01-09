const   config = require('../config/config.js');

const   contacts = require('../controllers/contact.server.controllers'),
        auth = require('../lib/middleware');

const   version = config.get("version");

module.exports = function(router){

    router.route('/contacts')
        .get(auth.isAuthenticated, contacts.get_contacts);
    
    router.route('/user/:user_id/contact')
        .post(auth.isAuthenticated, contacts.add_contact)
        .delete(auth.isAuthenticated, contacts.remove_contact);

    router.route('/blocked')
        .get(auth.isAuthenticated, contacts.get_blocked);
    
    router.route('/user/:user_id/block')
        .post(auth.isAuthenticated, contacts.block_contact)
        .delete(auth.isAuthenticated, contacts.unblock_contact);

};