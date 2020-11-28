const Crypto=require('crypto')

module.exports=(password)=>{
    var password_key='itsawrap'
    return Crypto.createHmac('sha256',password_key).update(password).digest('hex')
}