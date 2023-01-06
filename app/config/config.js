const convict = require('convict');


let config = convict({
    version: {
      format: String,
      default: '1.0.0'
    },
    specification:{
      format: String,
      default: './swagger-spec-v1.0.0.json'
    },
    authToken: {
        format: String,
        default: 'X-Authorization'
    }
});


module.exports = config;