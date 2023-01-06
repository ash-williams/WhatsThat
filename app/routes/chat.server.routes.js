const   config = require('../config/config.js');

const   chats = require('../controllers/chat.server.controllers'),
        auth = require('../lib/middleware');

const   version = config.get("version");

module.exports = function(router){

    router.route('/chat')
        .get(auth.isAuthenticated, chats.get_chats)
        .post(auth.isAuthenticated, chats.create_chat);
    
    router.route('/chat/:chat_id')
        .get(auth.isAuthenticated, chats.get_single_chat)
        .patch(auth.isAuthenticated, chats.update_chat);
    

    router.route('/chat/:chat_id/user/:user_id')
        .post(auth.isAuthenticated, chats.add_user_to_chat)
        .delete(auth.isAuthenticated, chats.remove_user_from_chat);
    
    router.route('/chat/:chat_id/message')
        .post(auth.isAuthenticated, chats.send_message);
    
    router.route('/chat/:chat_id/message/:message_id')
        .patch(auth.isAuthenticated, chats.update_message)
        .delete(auth.isAuthenticated, chats.delete_message);


};