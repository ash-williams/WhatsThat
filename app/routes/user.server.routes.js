const   config = require('../config/config.js');

const   users = require('../controllers/user.server.controllers'),
        auth = require('../lib/middleware');

const   version = config.get("version");

module.exports = function(router){

    router.route('/user')
        .post(users.create);

    router.route('/login')
        .post(users.login);

    router.route('/logout')
        .post(auth.isAuthenticated, users.logout);

    router.route('/user/:user_id')
        .get(auth.isAuthenticated, users.get_one)
        .patch(auth.isAuthenticated, users.update);

    router.route('/user/:user_id/photo')
        .get(auth.isAuthenticated, users.get_profile_photo)
        .post(auth.isAuthenticated, users.add_profile_photo);

    router.route('/search')
        .get(auth.isAuthenticated, users.search)
    
};