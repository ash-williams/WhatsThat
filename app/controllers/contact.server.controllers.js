const
  contacts = require('../models/contact.server.models'),
  users = require('../models/user.server.models'),
  log = require('../lib/logger')(),
  validator = require('../lib/validator'),
  config = require('../config/config.js'),
  schema = require('../config/' + config.get('specification'));


const get_contacts = (req, res) => {
    let token = req.get(config.get('authToken'));

    users.getIdFromToken(token, (err, id) => {
        if(err){
            log.warn(`contacts.controller.get_contacts: ${JSON.stringify(err)}`);
            return res.sendStatus(500); 
        }

        contacts.get_contacts(id, (err, results) => {
            if(err){
                log.warn(`contacts.controller.get_contacts: ${JSON.stringify(err)}`);
                return res.sendStatus(500);
            }

            if(!results){
                return res.status(200).json([]);
            }

            return res.status(200).json(results);
        })
    });
}

const add_contact = (req, res) => {

    let id = parseInt(req.params.user_id);
    if (!validator.isValidId(id)) return res.sendStatus(404);

    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, _id) => {
        if(err){
            log.warn(`contacts.controller.add_contact: ${JSON.stringify(err)}`);
            return res.sendStatus(500); 
        }

        if(id === _id){
            return res.status(400).send("You can't add yourself as a contact")
        }

        users.getOne(id, (err, user) => {
            if(err){
                log.warn(`contacts.controller.add_contact: ${JSON.stringify(err)}`);
                return res.sendStatus(500);
            }
        
            if(!user){
                return res.sendStatus(404);
            }

            contacts.add_contact(_id, id, (err) => {
                if(err) {
                    if(err.errno === 19){
                        return res.status(200).send("Already a contact")
                    }
                    log.warn(`contacts.controller.add_contact: ${JSON.stringify(err)}`);
                    return res.sendStatus(500);
                }

                return res.sendStatus(200);
            })
        })
    })
}

const remove_contact = (req, res) => {

    let id = parseInt(req.params.user_id);
    if (!validator.isValidId(id)) return res.sendStatus(404);

    let token = req.get(config.get('authToken'));
    users.getIdFromToken(token, (err, _id) => {
        if(err){
            log.warn(`contacts.controller.remove_contact: ${JSON.stringify(err)}`);
            return res.sendStatus(500); 
        }

        if(id === _id){
            return res.status(400).send("You can't remove yourself as a contact")
        }

        users.getOne(id, (err, user) => {
            if(err){
                log.warn(`contacts.controller.remove_contact: ${JSON.stringify(err)}`);
                return res.sendStatus(500);
            }
        
            if(!user){
                return res.sendStatus(404);
            }

            contacts.remove_contact(_id, id, (err) => {

                if(err) {
                    log.warn(`contacts.controller.remove_contact: ${JSON.stringify(err)}`);
                    return res.sendStatus(500);
                }

                return res.sendStatus(200);
            })
        })
    })
}

const get_blocked = (req, res) => {

    //200, 500

    return res.sendStatus(500);
}

const block_contact = (req, res) => {

    //200, 404, 500

    return res.sendStatus(500);
}

const unblock_contact = (req, res) => {

    //200, 404, 500

    return res.sendStatus(500);
}

module.exports = {
    get_contacts,
    add_contact,
    remove_contact,
    get_blocked,
    block_contact,
    unblock_contact
};