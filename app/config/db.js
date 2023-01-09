const sqlite3 = require('sqlite3').verbose()

const DBSOURCE = "db.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    }else{
        console.log('Connected to the SQLite database.') 

        db.run(`CREATE TABLE whatsthat_users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            given_name text NOT NULL,
            family_name text NOT NULL,
            email text NOT NULL UNIQUE,
            password text NOT NULL,
            salt text NOT NULL,
            token text DEFAULT NULL UNIQUE,
            CONSTRAINT email_unique UNIQUE (email),
            CONSTRAINT token_unique UNIQUE (token)
        )`, (err) => {

            if(err){
                //console.log(err)
                console.log("whatsthat_users table already created")
            }else{
                console.log("whatsthat_users table created")
            }

            db.run(`CREATE TABLE whatsthat_user_contacts (
                user_id INTEGER,
                contact_id INTEGER,
                blocked INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY(user_id, contact_id),
                FOREIGN KEY(user_id) REFERENCES whatsthat_users(user_id)
                FOREIGN KEY(contact_id) REFERENCES whatsthat_users(user_id)
            )`, (err) => {

                if(err){
                    //console.log(err)
                    console.log("whatsthat_user_contacts table already created")
                }else{
                    console.log("whatsthat_user_contacts table created")
                }

                db.run(`CREATE TABLE whatsthat_chats (
                    chat_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    creator INTEGER NOT NULL,
                    FOREIGN KEY(creator) REFERENCES whatsthat_users(user_id)                   
                )`, (err) => {
        
                    if(err){
                        //console.log(err)
                        console.log("whatsthat_chats table already created")
                    }else{
                        console.log("whatsthat_chats table created")
                    }

                    db.run(`CREATE TABLE whatsthat_chat_users (
                        chat_id INTEGER,
                        user_id INTEGER,
                        PRIMARY KEY(chat_id, user_id),
                        FOREIGN KEY(chat_id) REFERENCES whatsthat_chats(chat_id),
                        FOREIGN KEY(user_id) REFERENCES whatsthat_users(user_id) 
                    )`, (err) => {
                
                        if(err){
                            //console.log(err)
                            console.log("whatsthat_chat_users table already created")
                        }else{
                            console.log("whatsthat_chat_users table created")
                        }

                        db.run(`CREATE TABLE whatsthat_messages (
                            message_id INTEGER PRIMARY KEY AUTOINCREMENT,
                            chat_id INTEGER NOT NULL,
                            message TEXT NOT NULL,
                            timestamp INTEGER NOT NULL DEFAULT -1,
                            author INTEGER NOT NULL,
                            FOREIGN KEY(chat_id) REFERENCES whatsthat_chats(chat_id),
                            FOREIGN KEY(author) REFERENCES whatsthat_users(user_id) 
                        )`, (err) => {
                        
                            if(err){
                                //console.log(err)
                                console.log("whatsthat_messages table already created")
                            }else{
                                console.log("whatsthat_messages table created")
                            }
                        
                        })
                    })
                })
            })
        })
    }
})


module.exports = db