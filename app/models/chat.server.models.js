const db = require('../config/db');


/**
 * insert chat
 */
const insert = (chat, user_id, done) => {

    let values = [chat.name, user_id];

    db.run(
        'INSERT INTO whatsthat_chats (name, creator) VALUES (?,?)',
        values,
        function(err){
            if (err) {
              console.log(err);
              return done(err);
            }

            let chat_id = this.lastID;

            db.run(
                'INSERT INTO whatsthat_chat_users (chat_id, user_id) VALUES (?,?)',
                [chat_id, user_id],
                function(err){
                    if (err) {
                      console.log(err);
                      return done(err);
                    }
        
                    return done(err, chat_id)
                }
            );
        }
    );
};


const get_single_chat = (chat_id, done) => {

    let chat_details = {}

    db.get(
        "SELECT * FROM whatsthat_chats WHERE chat_id = ?",
        [chat_id],
        function(err, chat){
            if(err) return done(err);
            if(!chat) return done(404);

            chat_details["name"] = chat.name;

            console.log(1, chat_details)
            

            db.get(
                "SELECT * FROM whatsthat_users WHERE user_id = ?",
                [chat.creator],
                function(err, creator){
                    if(err) return done(err);
                    if(!creator) return done(404);
                    
                    chat_details["creator"] = {
                        "user_id": creator.user_id,
                        "first_name": creator.given_name,
                        "last_name": creator.family_name,
                        "email": creator.email
                    }

                    console.log(2, chat_details)

                    let members = [];
                    let member_errors = [];

                    db.each(
                        `SELECT u.user_id AS user_id, 
                                u.given_name AS first_name,
                                u.family_name AS last_name,
                                u.email AS email
                         FROM whatsthat_users u, whatsthat_chat_users c
                         WHERE c.chat_id = ?
                         AND c.user_id = u.user_id`,
                        [chat_id],
                        (err, row) => {
                            if(err) member_errors.push(err);

                            members.push(row);
                        },
                        (err) => {
                            if(err) return done(err);
                            if(member_errors.length > 0) return done(member_errors)

                            chat_details["members"] = members;

                            console.log(3, chat_details)
                            
                            //messages
                            let messages = [];
                            let message_errors = [];

                            let query = `SELECT m.message_id, m.timestamp, m.message, u.user_id, u.given_name, u.family_name, u.email
                                         FROM whatsthat_messages m, whatsthat_users u
                                         WHERE m.chat_id = ? 
                                         AND m.author = u.user_id
                                         ORDER BY timestamp DESC`;
                                

                            db.each(
                                query,
                                [chat_id],
                                (err, row) => {
                                    if(err) message_errors.push(err);

                                    messages.push({
                                        "message_id": row.message_id,
                                        "timestamp": row.timestamp,
                                        "message": row.message,
                                        "author": {
                                            "user_id": row.user_id,
                                            "first_name": row.given_name,
                                            "last_name": row.family_name,
                                            "email": row.email
                                        }
                                    });
                                },
                                (err) => {
                                    if(err) return done(err);
                                    if(message_errors.length > 0) return done(message_errors)

                                    chat_details["messages"] = messages;

                                    console.log(4, chat_details)
                                    return done(null, chat_details)
                                }
                            ) 
                        }
                    )
                }
            )
        }
    )
}



const add_user_to_chat = (chat_id, user_id, done) => {
    let values = [chat_id, user_id];

    db.run(
        'INSERT INTO whatsthat_chat_users (chat_id, user_id) VALUES (?,?)',
        values,
        function(err){
            if (err) {
              console.log(err);
              return done(err);
            }

            return done(err, this.lastID)
        }
    );  
}



// const get_chat_members = (chat_id, done) => {
//     let members = []
//     let member_errors = []

//     db.each(
//         `
//         SELECT u.user_id, u.given_name AS first_name, u.family_name AS last_name, u.email
//         FROM whatsthat_users u, whatsthat_chat_users c
//         WHERE u.user_id = c.user_id
//         AND c.chat_id = ?
//         `,
//         [chat_id],
//         (err, row) => {
//             if(err) member_errors.push(err)
//             members.push(row)
//         },
//         (err) => {
//             if(err) return done(err);
//             if(member_errors.length > 0) return done(member_errors)

//             return done(null, members)
//         }
//     )
// }

const get_chat_info = (user_id) => {
    return new Promise((resolve, reject) => {

        const query = `SELECT cu.chat_id, c.name, c.creator, u.user_id, u.given_name, u.family_name, u.email, m.message_id, m.timestamp, m.message, m.author, mu.user_id AS "author_user_id", mu.given_name AS "author_first_name", mu.family_name AS "author_last_name", mu.email AS "author_email" 
        FROM whatsthat_chat_users cu, whatsthat_chats c, whatsthat_users u, whatsthat_messages m, whatsthat_users mu
        WHERE cu.user_id = ?
        AND cu.chat_id = c.chat_id
        AND c.creator = u.user_id
        AND m.chat_id = c.chat_id  
        AND m.author = mu.user_id
        GROUP BY c.chat_id
        HAVING MAX(m.timestamp)            
        `;

        let results = [];

        db.all(query, [user_id], (err, rows) => {
            console.log(err, rows)

            if(err) reject(err)

            rows.forEach((row) => {
                results.push({
                    "chat_id": row.chat_id,
                    "name": row.name,
                    "creator": {
                        "user_id": row.user_id,
                        "first_name": row.given_name,
                        "last_name": row.family_name,
                        "email": row.email
                    },
                    "last_message": {
                        "message_id": row.message_id,
                        "timestamp": row.timestamp,
                        "message": row.message,
                        "author": {
                            "user_id": row.author_user_id,
                            "first_name": row.author_first_name,
                            "last_name": row.author_last_name,
                            "email": row.author_email
                        }
                    }

                })

            })
            resolve(results)
        })
    })
}

const get_all_chats = (user_id, done) => {
    get_chat_info(user_id)
    .then((data) => {
        return done(null, data)
    })
    .catch((err) => {
        return done(err, null)
    })
}








module.exports = {
    insert,
    add_user_to_chat,
    get_single_chat,
    get_all_chats
}