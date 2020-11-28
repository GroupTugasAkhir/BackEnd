const jwt = require('jsonwebtoken')

module.exports={
    createJWToken(payload){
        const key = "getup"
        return jwt.sign(payload,key,{expiresIn:'23h'})
    }
}