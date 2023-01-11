const
  chats = require('../models/chat.server.models'),
  users = require('../models/user.server.models'),
  contacts = require('../models/contact.server.models'),
  log = require('../lib/logger')(),
  validator = require('../lib/validator'),
  config = require('../config/config.js'),
  schema = require('../config/' + config.get('specification'));


const get_chats = (req, res) => {
    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, _id) => {
        if(err){
            log.warn(`chat.controller.get_chats: ${JSON.stringify(err)}`);
            return res.sendStatus(500); 
        }

        chats.get_all_chats(_id, (err, results) => {
            if(err){
                log.warn(`chat.controller.get_chats: ${JSON.stringify(err)}`);
                return res.sendStatus(500); 
            }

            return res.status(200).send(results);
        }) 
    })
}

const create_chat = (req, res) => {
    if (!validator.isValidSchema(req.body, 'components.schemas.CreateChat')) {
        log.warn(`chat.controller.create_chat: bad data ${JSON.stringify(req.body)}`);
        log.warn(validator.getLastErrors());
        return res.sendStatus(400);
    }

    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, _id) => {
        if(err){
            log.warn(`chat.controller.create_chat: ${JSON.stringify(err)}`);
            return res.sendStatus(500); 
        }

        let chat = Object.assign({}, req.body);

        chats.insert(chat, _id, function(err, id){
            if(err) {
                log.warn(`chat.controller.create_chat: couldn't create ${JSON.stringify(chat)}: ${err}`);
                return res.sendStatus(500);
            }

            return res.status(201).send({"chat_id": id});  
        });

    })
}

const get_single_chat = (req, res) => {
    let chat_id = parseInt(req.params.chat_id);
    if (!validator.isValidId(chat_id)) return res.sendStatus(404);

    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, _id) => {
        if(err){
            log.warn(`chat.controller.get_single_chat: ${JSON.stringify(err)}`);
            return res.sendStatus(500); 
        }

        chats.get_single_chat(chat_id, (err, chat_details) => {
            if(err){
                if(err === 404){
                    log.warn(`chat.controller.get_single_chat: no chat found`);
                    return res.sendStatus(404); 
                }

                log.warn(`chat.controller.get_single_chat: ${JSON.stringify(err)}`);
                console.log("HERE")
                return res.sendStatus(500); 
            }

            //logged in user not a chat member?
            let logged_in_is_member = chat_details.members.find(user => user.user_id === _id);

            if(!logged_in_is_member){
                log.warn(`chat.controller.get_single_chat: logged in user isn't a member of the chat`);
                return res.sendStatus(403);
            }

            return res.status(200).send(chat_details);
        }) 
    })
}

const update_chat = (req, res) => {
    let chat_id = parseInt(req.params.chat_id);
    if (!validator.isValidId(chat_id)) return res.sendStatus(404);

    if (!validator.isValidSchema(req.body, 'components.schemas.UpdateChat')) {
        log.warn(`chat.controller.update_chat: bad data ${JSON.stringify(req.body)}`);
        log.warn(validator.getLastErrors());
        return res.sendStatus(400);
    }

    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, _id) => {
        if(err){
            log.warn(`chat.controller.update_chat: ${JSON.stringify(err)}`);
            return res.sendStatus(500); 
        }
    
        //chat exists?
        chats.get_single_chat(chat_id, (err, chat_details) => {
            if(err){
                log.warn(`chat.controller.update_chat: ${JSON.stringify(err)}`);
                return res.sendStatus(500); 
            }

            if(!chat_details){
                log.warn(`chat.controller.update_chat: chat doesn't exist with ID: ${chat_id}`);
                return res.sendStatus(404); 
            }

            //logged in user is member of the chat
            let logged_in_is_member = chat_details.members.find(user => user.user_id === _id);

            if(!logged_in_is_member){
                log.warn(`chat.controller.update_chat: logged in user isn't a member of the chat with ID: ${chat_id}`);
                return res.sendStatus(403); 
            }

            let chat = Object.assign({}, req.body);

            chats.update_chat(chat_id, chat, (err) => {
                if(err){
                    log.warn(`chat.controller.update_chat: ${JSON.stringify(err)}`);
                    return res.sendStatus(500);
                }

                return res.sendStatus(200);
            })
        });
    })
}

const add_user_to_chat = (req, res) => {
    let chat_id = parseInt(req.params.chat_id);
    let user_id = parseInt(req.params.user_id);
    if (!validator.isValidId(chat_id) || !validator.isValidId(user_id) ) return res.sendStatus(404);

    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, _id) => {
        if(err){
            log.warn(`chat.controller.add_user_to_chat: ${JSON.stringify(err)}`);
            return res.sendStatus(500); 
        }
    
        //chat exists?
        chats.get_single_chat(chat_id, (err, chat_details) => {
            if(err){
                log.warn(`chat.controller.add_user_to_chat: ${JSON.stringify(err)}`);
                return res.sendStatus(500); 
            }

            if(!chat_details){
                log.warn(`chat.controller.add_user_to_chat: chat doesn't exist with ID: ${chat_id}`);
                return res.sendStatus(404); 
            }

            //logged in user is member of the chat
            let logged_in_is_member = chat_details.members.find(user => user.user_id === _id);

            if(!logged_in_is_member){
                log.warn(`chat.controller.add_user_to_chat: logged in user isn't a member of the chat with ID: ${chat_id}`);
                return res.sendStatus(403); 
            }

             //user is not already in the chat
             let user_is_member = chat_details.members.find(user => user.user_id === user_id);

             //user is not already in the chat
            if(user_is_member){
                log.warn(`chat.controller.add_user_to_chat: adding a user who is already in the chat`);
                return res.status(400).send("User already in the chat");
            }

            //user exists?
            users.getOne(user_id, (err, results) => {
                if (err) {
                    log.warn(`chat.controller.add_user_to_chat: ${JSON.stringify(err)}`);
                    return res.sendStatus(500);
                }
                
                if (!results) {  // no user found
                    log.warn(`chat.controller.add_user_to_chat: no user found`);
                    return res.sendStatus(404);
                }

                //user is in the contacts of the logged in user?
                contacts.is_contact(_id, user_id, (err, contact) => {
                    if (err) {
                        log.warn(`chat.controller.add_user_to_chat: ${JSON.stringify(err)}`);
                        return res.sendStatus(500);
                    }

                    if(!contact){
                        log.warn(`chat.controller.add_user_to_chat: adding a user who isn't a contact`);
                        return res.status(400).send("Add the user as a contact first");
                    }

                   

                    chats.add_user_to_chat(chat_id, user_id, (err) => {
                        if(err){
                            log.warn(`chat.controller.add_user_to_chat: ${JSON.stringify(err)}`);
                            return res.sendStatus(500);
                        }

                        return res.sendStatus(200);
                    })
                })
            })
        });
    })
}

const remove_user_from_chat = (req, res) => {
    let chat_id = parseInt(req.params.chat_id);
    let user_id = parseInt(req.params.user_id);
    if (!validator.isValidId(chat_id) || !validator.isValidId(user_id) ) return res.sendStatus(404);

    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, _id) => {
        if(err){
            log.warn(`chat.controller.remove_user_from_chat: ${JSON.stringify(err)}`);
            return res.sendStatus(500); 
        }
    
        //chat exists?
        chats.get_single_chat(chat_id, (err, chat_details) => {
            if(err){
                log.warn(`chat.controller.remove_user_from_chat: ${JSON.stringify(err)}`);
                return res.sendStatus(500); 
            }

            if(!chat_details){
                log.warn(`chat.controller.remove_user_from_chat: chat doesn't exist with ID: ${chat_id}`);
                return res.sendStatus(404); 
            }

            //logged in user is member of the chat
            let logged_in_is_member = chat_details.members.find(user => user.user_id === _id);

            if(!logged_in_is_member){
                log.warn(`chat.controller.remove_user_from_chat: logged in user isn't a member of the chat with ID: ${chat_id}`);
                return res.sendStatus(403); 
            }

             //user is already in the chat
             let user_is_member = chat_details.members.find(user => user.user_id === user_id);

             //user is not already in the chat
            if(!user_is_member){
                log.warn(`chat.controller.remove_user_from_chat: removing a user who is not in the chat`);
                return res.status(400).send("User not in the chat");
            }

            //user exists?
            users.getOne(user_id, (err, results) => {
                if (err) {
                    log.warn(`chat.controller.remove_user_from_chat: ${JSON.stringify(err)}`);
                    return res.sendStatus(500);
                }
                
                if (!results) {  // no user found
                    log.warn(`chat.controller.remove_user_from_chat: no user found`);
                    return res.sendStatus(404);
                }

                chats.remove_user_from_chat(chat_id, user_id, (err) => {
                    if(err){
                        log.warn(`chat.controller.remove_user_from_chat: ${JSON.stringify(err)}`);
                        return res.sendStatus(500);
                    }

                    return res.sendStatus(200);
                })
            })
        });
    })
}

const send_message = (req, res) => {
    let chat_id = parseInt(req.params.chat_id);
    if (!validator.isValidId(chat_id)) return res.sendStatus(404);

    if (!validator.isValidSchema(req.body, 'components.schemas.SendMessage')) {
        log.warn(`chat.controller.send_message: bad data ${JSON.stringify(req.body)}`);
        log.warn(validator.getLastErrors());
        return res.sendStatus(400);
    }

    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, _id) => {
        if(err){
            log.warn(`chat.controller.send_message: ${JSON.stringify(err)}`);
            return res.sendStatus(500); 
        }
    
        //chat exists?
        chats.get_single_chat(chat_id, (err, chat_details) => {
            if(err){
                log.warn(`chat.controller.send_message: ${JSON.stringify(err)}`);
                return res.sendStatus(500); 
            }

            if(!chat_details){
                log.warn(`chat.controller.send_message: chat doesn't exist with ID: ${chat_id}`);
                return res.sendStatus(404); 
            }

            //logged in user is member of the chat
            let logged_in_is_member = chat_details.members.find(user => user.user_id === _id);

            if(!logged_in_is_member){
                log.warn(`chat.controller.send_message: logged in user isn't a member of the chat with ID: ${chat_id}`);
                return res.sendStatus(403); 
            }

            let message = Object.assign({}, req.body);

            chats.send_message(chat_id, message, _id, (err) => {
                if(err){
                    log.warn(`chat.controller.send_message: ${JSON.stringify(err)}`);
                    return res.sendStatus(500);
                }

                return res.sendStatus(200);
            })
        });
    })
}

const update_message = (req, res) => {
    let chat_id = parseInt(req.params.chat_id);
    let message_id = parseInt(req.params.message_id);
    if (!validator.isValidId(chat_id) || !validator.isValidId(message_id)) return res.sendStatus(404);

    if (!validator.isValidSchema(req.body, 'components.schemas.UpdateMessage')) {
        log.warn(`chat.controller.update_message: bad data ${JSON.stringify(req.body)}`);
        log.warn(validator.getLastErrors());
        return res.sendStatus(400);
    }

    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, _id) => {
        if(err){
            log.warn(`chat.controller.update_message: ${JSON.stringify(err)}`);
            return res.sendStatus(500); 
        }
    
        //chat exists?
        chats.get_single_chat(chat_id, (err, chat_details) => {
            if(err){
                log.warn(`chat.controller.update_message: ${JSON.stringify(err)}`);
                return res.sendStatus(500); 
            }

            if(!chat_details){
                log.warn(`chat.controller.update_message: chat doesn't exist with ID: ${chat_id}`);
                return res.sendStatus(404); 
            }

            let message = Object.assign({}, req.body);

            chats.update_message(chat_id, message_id, message, _id, (err) => {
                if(err){

                    if(err === 403){
                        log.warn(`chat.controller.update_message: ${JSON.stringify(err)}`);
                        return res.status(403).send("Can't edit messages written by others");
                    }

                    if(err === 404){
                        log.warn(`chat.controller.update_message: ${JSON.stringify(err)}`);
                        return res.status(404).send("Can't find message with that ID");
                    }

                    log.warn(`chat.controller.update_message: ${JSON.stringify(err)}`);
                    return res.sendStatus(500);
                }

                return res.sendStatus(200);
            })
        });
    })
}

const delete_message = (req, res) => {
    let chat_id = parseInt(req.params.chat_id);
    let message_id = parseInt(req.params.message_id);
    if (!validator.isValidId(chat_id) || !validator.isValidId(message_id)) return res.sendStatus(404);

    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, _id) => {
        if(err){
            log.warn(`chat.controller.delete_message: ${JSON.stringify(err)}`);
            return res.sendStatus(500); 
        }
    
        //chat exists?
        chats.get_single_chat(chat_id, (err, chat_details) => {
            if(err){
                log.warn(`chat.controller.delete_message: ${JSON.stringify(err)}`);
                return res.sendStatus(500); 
            }

            if(!chat_details){
                log.warn(`chat.controller.delete_message: chat doesn't exist with ID: ${chat_id}`);
                return res.sendStatus(404); 
            }

            chats.delete_message(chat_id, message_id, _id, (err) => {
                if(err){

                    if(err === 403){
                        log.warn(`chat.controller.delete_message: ${JSON.stringify(err)}`);
                        return res.status(403).send("Can't delete messages written by others");
                    }

                    if(err === 404){
                        log.warn(`chat.controller.delete_message: ${JSON.stringify(err)}`);
                        return res.status(404).send("Can't find message with that ID");
                    }

                    log.warn(`chat.controller.delete_message: ${JSON.stringify(err)}`);
                    return res.sendStatus(500);
                }

                return res.sendStatus(200);
            })
        });
    })
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