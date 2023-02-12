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



const remove_user_from_chat = (chat_id, user_id, done) => {
    let values = [chat_id, user_id];

    db.run(
        'DELETE FROM whatsthat_chat_users WHERE chat_id = ? AND user_id = ?',
        values,
        function(err){
            
            // If the chat has no users, delete the chat too (and messages)
            db.all(
                "SELECT * FROM whatsthat_chat_users WHERE chat_id = ?",
                [chat_id],
                (err, rows) => {
                    if(err) return done(err);

                    if(rows.length > 0){
                        //still has members, do nothing
                        return done(null)
                    }

                    db.run(
                        "DELETE FROM whatsthat_messages WHERE chat_id = ?",
                        [chat_id],
                        (err) => {
                            if(err) return done(err)

                            db.run(
                                "DELETE FROM whatsthat_chats WHERE chat_id = ?",
                                [chat_id],
                                (err) => {
                                    return done(err)
                                }
                            )
                        }
                    )

                }
            )
        }
    );  
}



// const get_chat_info = (user_id) => {
//     return new Promise((resolve, reject) => {

//         const query = `SELECT cu.chat_id, c.name, c.creator, u.user_id, u.given_name, u.family_name, u.email, m.message_id, m.timestamp, m.message, m.author, mu.user_id AS "author_user_id", mu.given_name AS "author_first_name", mu.family_name AS "author_last_name", mu.email AS "author_email" 
//         FROM whatsthat_chat_users cu, whatsthat_chats c, whatsthat_users u, whatsthat_messages m, whatsthat_users mu
//         WHERE cu.user_id = ?
//         AND cu.chat_id = c.chat_id
//         AND c.creator = u.user_id
//         AND m.chat_id = c.chat_id  
//         AND m.author = mu.user_id
//         GROUP BY c.chat_id
//         HAVING MAX(m.timestamp)            
//         `;

//         let results = [];

//         db.all(query, [user_id], (err, rows) => {
//             console.log(err, rows)

//             if(err) reject(err)

//             rows.forEach((row) => {
//                 results.push({
//                     "chat_id": row.chat_id,
//                     "name": row.name,
//                     "creator": {
//                         "user_id": row.user_id,
//                         "first_name": row.given_name,
//                         "last_name": row.family_name,
//                         "email": row.email
//                     },
//                     "last_message": {
//                         "message_id": row.message_id,
//                         "timestamp": row.timestamp,
//                         "message": row.message,
//                         "author": {
//                             "user_id": row.author_user_id,
//                             "first_name": row.author_first_name,
//                             "last_name": row.author_last_name,
//                             "email": row.author_email
//                         }
//                     }

//                 })

//             })
//             resolve(results)
//         })
//     })
// }

// const get_all_chats = (user_id, done) => {
//     get_chat_info(user_id)
//     .then((data) => {
//         return done(null, data)
//     })
//     .catch((err) => {
//         return done(err, null)
//     })
// }

const get_last_message = (chat_id) => {
    return new Promise((resolve, reject) => {
        let last_message_query = `
            SELECT m.message_id, m.timestamp, m.message, m.author, mu.user_id AS "author_user_id", mu.given_name AS "author_first_name", mu.family_name AS "author_last_name", mu.email AS "author_email" 
            FROM whatsthat_messages m, whatsthat_users mu
            WHERE m.chat_id = ?
            AND mu.user_id = m.author
            GROUP BY m.chat_id
            HAVING MAX(m.timestamp)
        `;

        db.get(last_message_query, [chat_id], (err, last_message_details) => {
            if(err) return reject(err)

            if(!last_message_details || last_message_details === null){
                resolve({})
            }else{
                resolve({
                    "message_id": last_message_details.message_id,
                    "timestamp": last_message_details.timestamp,
                    "message": last_message_details.message,
                    "author": {
                        "user_id": last_message_details.author_user_id,
                        "first_name": last_message_details.author_first_name,
                        "last_name": last_message_details.author_last_name,
                        "email": last_message_details.author_email
                    }
                })
            }
        })
    })
}

const get_all_chats = (user_id, done) => {
    let chats = [];
    let errors = [];

    let chats_query = `
        SELECT c.chat_id, c.name, c.creator, u.user_id, u.given_name, u.family_name, u.email
        FROM whatsthat_chats c, whatsthat_users u
        WHERE c.chat_id IN (SELECT chat_id from whatsthat_chat_users WHERE user_id = ?)
        AND c.creator = u.user_id`;

    db.each(
        chats_query, 
        [user_id],
        (err, chat_details) => {
            if(err) errors.push(err);

            let chat_object = {
                "chat_id": chat_details.chat_id,
                "name": chat_details.name,
                "creator": {
                    "user_id": chat_details.user_id,
                    "first_name": chat_details.given_name,
                    "last_name": chat_details.family_name,
                    "email": chat_details.email
                }
            }

            chats.push(chat_object)
            
        },
        (err) => {
            if(err) return done(err, null);
            if(errors.length > 0) return done(errors, null)

            let counter = 0;

            chats.forEach((chat) => {
                get_last_message(chat.chat_id)
                .then((last_message) => {
                    chat["last_message"] = last_message

                    counter ++;
                    if(counter === chats.length){
                        return done(null, chats)
                    }
                })
                .catch((err) => {
                    return done(err, null)
                })
            }) 
        }
    )
}



const update_chat = (chat_id, chat, done) => {
    db.run("UPDATE whatsthat_chats SET name=? WHERE chat_id=?",
        [chat.name, chat_id],
        function(err){
            done(err);
        }
    );
}



const send_message = (chat_id, message, author_id, done) => {

    db.run("INSERT INTO whatsthat_messages (chat_id, message, timestamp, author) VALUES (?,?,?,?)",
        [chat_id, message.message, new Date(), author_id],
        function(err){
            done(err);
        }
    );
}



const update_message = (chat_id, message_id, message, author_id, done) => {

    db.get("SELECT * FROM whatsthat_messages WHERE message_id = ? AND chat_id = ?",
        [message_id, chat_id],
        (err, row) => {
            if(err) return done(err);
            if(!row) return done(404)
            if(row.author != author_id) return done(403)

            db.run("UPDATE whatsthat_messages SET message = ? WHERE message_id = ?",
                [message.message, message_id],
                function(err){
                    done(err);
                }
            );
        }
    )  
}



const delete_message = (chat_id, message_id, author_id, done) => {

    db.get("SELECT * FROM whatsthat_messages WHERE message_id = ? AND chat_id = ?",
        [message_id, chat_id],
        (err, row) => {
            if(err) return done(err);
            if(!row) return done(404)
            if(row.author != author_id) return done(403)

            db.run("DELETE FROM whatsthat_messages WHERE message_id = ?",
                [message_id],
                function(err){
                    done(err);
                }
            );
        }
    )  
}








module.exports = {
    insert,
    add_user_to_chat,
    get_single_chat,
    get_all_chats,
    remove_user_from_chat,
    update_chat,
    send_message,
    update_message,
    delete_message
}