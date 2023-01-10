const db = require('../config/db');


/**
 * get the list of contacts for a given user id
 */
const get_contacts = (id, done) => {
    if (id === undefined || id === null)
        return done(true, null);
    else {
        let query = 'SELECT user_id, given_name AS first_name, family_name AS last_name, email FROM whatsthat_users ';
        query += 'WHERE user_id IN (SELECT contact_id FROM whatsthat_user_contacts WHERE user_id=' + id + ' AND blocked = 0)';
        query += 'OR user_id IN (SELECT user_id FROM whatsthat_user_contacts WHERE contact_id=' + id + ' AND blocked = 0)';

        let results = []
        let errors = []

        db.each(
            query,
            [],
            (err, row) => {
                if(err) errors.push(err);

                results.push(row);
            },
            (err) => {
                if(err) return done(err, null);
                if(errors.length > 0) return done(errors, null)

                return done(null, results)
            }
        )
    }
};



const add_contact = (user_id, contact_id, done) => {
    if(user_id === undefined || user_id === null || contact_id === undefined || contact_id === null){
        return done(true)
    }

    let query = "INSERT INTO whatsthat_user_contacts (user_id, contact_id) VALUES (?, ?)"

    db.run(query, [user_id, contact_id], function(err){
        if(err) {
            return done(err)
        }

        return done(false)
    })
}



const remove_contact = (user_id, contact_id, done) => {
    if(user_id === undefined || user_id === null || contact_id === undefined || contact_id === null){
        return done(true)
    }

    let query = "DELETE FROM whatsthat_user_contacts WHERE (user_id = ? AND contact_id =?) OR (user_id = ? AND contact_id =?)"

    db.run(query, [user_id, contact_id, contact_id, user_id], function(err){
        if(err) {
            return done(err)
        }

        return done(false)
    })
}



/**
 * get the list of blocked contacts for a given user id
 */
const get_blocked = (id, done) => {
    if (id === undefined || id === null)
        return done(true, null);
    else {
        let query = 'SELECT user_id, given_name AS first_name, family_name AS last_name, email FROM whatsthat_users ';
        query += 'WHERE user_id IN (SELECT contact_id FROM whatsthat_user_contacts WHERE user_id=' + id + ' AND blocked = 1)';

        let results = []
        let errors = []

        db.each(
            query,
            [],
            (err, row) => {
                if(err) errors.push(err);

                results.push(row);
            },
            (err) => {
                if(err) return done(err, null);
                if(errors.length > 0) return done(errors, null)

                return done(null, results)
            }
        )
    }
};




const is_contact = (user_id, contact_id, done) => {
    if(user_id === undefined || user_id === null || contact_id === undefined || contact_id === null){
        return done(true)
    }

    let query = "SELECT * FROM whatsthat_user_contacts WHERE user_id = ? AND contact_id = ?"

    db.get(query, [user_id, contact_id], function(err, row){
        if(err) {
            return done(err, null)
        }

        return done(false, row)
    })
}



const block_contact = (user_id, contact_id, done) => {
    if(user_id === undefined || user_id === null || contact_id === undefined || contact_id === null){
        return done(true)
    }

    let query = "UPDATE whatsthat_user_contacts SET blocked = 1 WHERE user_id = ? AND contact_id = ?"

    db.run(query, [user_id, contact_id], function(err){
        if(err) {
            return done(err)
        }

        return done(false)
    })
}



const unblock_contact = (user_id, contact_id, done) => {
    if(user_id === undefined || user_id === null || contact_id === undefined || contact_id === null){
        return done(true)
    }

    let query = "UPDATE whatsthat_user_contacts SET blocked = 0 WHERE user_id = ? AND contact_id = ?"

    db.run(query, [user_id, contact_id], function(err){
        if(err) {
            return done(err)
        }

        return done(false)
    })
}


module.exports = {
    get_contacts,
    add_contact,
    remove_contact,
    get_blocked,
    is_contact,
    block_contact,
    unblock_contact
}
