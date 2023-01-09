const db = require('../config/db');
const crypto = require('crypto');

const fs = require('fs');
const photosDirectory = './storage/';
const photo_tools = require('../lib/photo.tools.js');


const getHash = function(password, salt){
    return crypto.pbkdf2Sync(password, salt, 100000, 256, 'sha256').toString('hex');
};



/**
 * insert user
 */
const insert = function(user, done){

    const salt = crypto.randomBytes(64);
    const hash = getHash(user.password, salt);

    //console.log(salt);

    let values = [user.first_name, user.last_name, user.email, hash, salt.toString('hex')];

    db.run(
        'INSERT INTO whatsthat_users (given_name, family_name, email, password, salt) VALUES (?,?,?,?,?)',
        values,
        function(err){
            if (err) {
              console.log(err);
              return done(err);
            }

            return done(err, this.lastID)
        }
    );
};


/*
 *   authenticate user
 */
const authenticate = function(email, password, done){
    db.get(
        'SELECT user_id, password, salt FROM whatsthat_users WHERE (email=?)',
        [email],
        function(err, row) {

            if (err || !row){
                console.log("AUTH 1", err, row);
                return done(true); // return error = true (failed auth)
            }else{

                if(row.salt == null){
                    row.salt = '';
                }

                let salt = Buffer.from(row.salt, 'hex');

                if (row.password === getHash(password, salt)){
                    return done(false, row.user_id);
                }else{
                    console.log("failed passwd check");
                    return done(true); // failed password check
                }

            }
        }
    );
};



/**
 * get existing token
 *
 */
const getToken = function(id, done){
    db.get(
        'SELECT token FROM whatsthat_users WHERE user_id=?',
        [id],
        function(err, row){
          if (row && row.token){
            return done(null, row.token);
          }else{
            return done(null, null);
          } 
        }
    );
};



/**
 * create and store a new token for a user
 */
const setToken = function(id, done){
    let token = crypto.randomBytes(16).toString('hex');
    db.run(
        'UPDATE whatsthat_users SET token=? WHERE user_id=?',
        [token, id],
        function(err){return done(err, token)}
    );
};



/**
 * remove a token for a user
 */
const removeToken = (token, done) => {
    db.run(
        'UPDATE whatsthat_users SET token=null WHERE token=?',
        [token],
        function(err){return done(err)}
    )
};



/**
 * get the user id associated with a given token, return null if not found
 */
const getIdFromToken = (token, done) => {
    if (token === undefined || token === null)
        return done(true, null);
    else {
        db.get(
            'SELECT user_id FROM whatsthat_users WHERE token=?',
            [token],
            function(err, row){
                if (row)
                    return done(null, row.user_id);
                return done(err, null);
            }
        )
    }
};



/**
 * return user details, or null if user not found
 *
 * @param id
 * @param done
 */
const getOne = (id, done) => {
    let query = 'SELECT user_id, given_name, family_name, email FROM whatsthat_users WHERE user_id=?';
    db.get(
        query,
        [id],
        function(err, row){
            if (err){
                console.log(err);
                return done(err, false);
            }
            
            if(!row || row.length == 0){
                //console.log(row.length == 0);
                return done(false, null);
            }
            
            let user = row;
  
            let to_return = {
                "user_id": user.user_id,
                "first_name": user.given_name,
                "last_name": user.family_name,
                "email": user.email
            };

            return done(null, to_return);
  
        }
    )
};



/**
 * update user
 *
 */
const alter = (id, user, done) => {

    let query_string = '';
    let values = [];

    if(user.hasOwnProperty('password')){
        const salt = crypto.randomBytes(64);
        const hash = getHash(user.password, salt);

        query_string = 'UPDATE whatsthat_users SET given_name=?, family_name=?, email=?, password=?, salt=? WHERE user_id=?';
        values = [user.first_name, user.last_name, user.email, hash, salt.toString('hex'), id];
    }else{
        query_string = 'UPDATE whatsthat_users SET given_name=?, family_name=?, email=? WHERE user_id=?';
        values = [user.first_name, user.last_name, user.email, id];
    }

    db.run(query_string,
        values,
        function(err){
            done(err);
        }
    );
};



const retreivePhoto = async (id, done) => {
    let filename_png = photosDirectory + id + ".png";
    let filename_jpg = photosDirectory + id + ".jpeg";
  
    fs.exists(filename_png, (exists) => {
        console.log("PNG exists: ", exists, filename_png);
        if(!exists){
            fs.exists(filename_jpg, (exists) => {
                console.log("JPEG exists: ", exists, filename_jpg);
          
                if(!exists){
                    filename_jpg = photosDirectory + "default.jpeg";
                }
  
                console.log("JPG Exists, time to read...");
  
                fs.readFile(filename_jpg, (err, image) => {
                    if(err){
                        console.log(err);
                        done(null, err);
                    }else{
                        let mimeType = photo_tools.getImageMimetype(filename_jpg);
                        done({image, mimeType}, null);
                    }
                });
            });
        }else{
            console.log("PNG Exists, time to read...");
  
            fs.readFile(filename_png, (err, image) => {
                if(err){
                    done(null, err);
                }else{
                    let mimeType = photo_tools.getImageMimetype(filename_png);
                    done({image, mimeType}, null);
                }
            });
        }
    });
}



const addPhoto = async function(image, fileExt, id, done){
    let filename = id + fileExt;
  
    try{
        const path = photosDirectory + filename;
  
        fs.writeFile(path, image.body, function(err, result){
            if(err){
                return done(err);
            }else{
                console.log("RESULT", result);
                return done(null);
            }
        });
    }catch (err){
        console.log(err);
        fs.unlink(photosDirectory + filename).catch(err => done(err));
        done(err);
    }
}



const deletePhotoIfExists = async function(id, done){
    let filename_png = photosDirectory + id + ".png";
    let filename_jpg = photosDirectory + id + ".jpeg";
  
    fs.exists(filename_png, (exists) => {
        console.log("PNG exists: ", exists, filename_png);
        if(!exists){
            fs.exists(filename_jpg, (exists) => {
                console.log("JPEG exists: ", exists, filename_jpg);
                if(!exists){
                    done(null);
                }else{
                    console.log("JPG Exists, time to delete...");
                    fs.unlink(filename_jpg, (err) => {
                        if(err){
                            done(err);
                        }else{
                            done(null);
                        }
                    });
                }
            });
        }else{
            console.log("PNG Exists, time to delete...");
            fs.unlink(filename_png, (err) => {
                if(err){
                    done(err);
                }else{
                    done(null);
                }
            });
        }
    });
}



const search_users = (params, user_id, done) => {
    let query = 'SELECT u.user_id, u.given_name, u.family_name, u.email FROM whatsthat_users u ';

    if(params.q){
        query += "WHERE u.given_name LIKE '%" + params.q + "%' OR u.family_name LIKE '%" + params.q + "%' OR u.email LIKE '%" + params.q + "%' ";
    }

    query += "GROUP BY u.user_id "

    if(params.search_in === "contacts"){
        query += 'HAVING u.user_id IN (SELECT c.user_id FROM whatsthat_user_contacts c WHERE c.contact_id=' + user_id + ' AND c.blocked = 0 UNION SELECT c.contact_id FROM whatsthat_user_contacts c WHERE c.user_id=' + user_id + ' AND c.blocked = 0) '
    }

    if(params.limit && params.limit >= 1 && params.limit <= 100){
        query += "LIMIT " + params.limit + " ";
    }else{
        query += "LIMIT 20 ";
    }
    
    if(params.offset && params.offset >= 0){
        query += "OFFSET " + params.offset + " ";
    }else{
        query += "OFFSET 0 ";
    }

    db.all(
        query,
        async function(err, users){
            if(err){
                console.log(err);
                return done(err, false);
            }else if(users.length ==0){
                console.log("empty");
                return done(err, []);
            }else{
                return done(null, users);
            }
        }
    ); 
}

module.exports = {
    insert,
    authenticate,
    getToken,
    setToken,
    removeToken,
    getIdFromToken,
    getOne,
    alter,
    retreivePhoto,
    addPhoto,
    deletePhotoIfExists,
    search_users
}