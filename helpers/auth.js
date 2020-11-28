const jwt = require('jsonwebtoken')

module.exports = {
    auth:(req,res,next)=>{
        if(req.method !== "OPTIONS"){
            const key = "getup"
            jwt.verify(req.token,key,(error,decoded)=>{
                if (error) {
                    return res.status(401).json({ message: "User not authorized.", error: "User not authorized." });
                }
                // console.log(decoded, 'ini decoded')
                req.user = decoded;
                next();
            })
        } else{
            next()
        }
    }
}