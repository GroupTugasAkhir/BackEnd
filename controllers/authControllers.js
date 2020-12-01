const { db } = require('./../connection')
const {encrypt} = require('./../helpers')
const nodeMailer = require('nodemailer')
const fs = require('fs')
const handlebars = require('handlebars')
const {createJWToken} = require('./../helpers/jwt')

let transporter=nodeMailer.createTransport({
    service:'gmail',
    auth:{
        user:'hasianamin14@gmail.com',
        pass: 'zdmyshyaqtriljwr'
    },
    tls:{
        rejectUnauthorized:false
    }
})

module.exports = {
    register:(req,res)=>{
        const {username, email, password} = req.body
        let hashPassword = encrypt(password)
        let sql = 'select * from tbl_user where username = ?'
        db.query(sql,[username],(err,result)=>{
            if(err) return res.status('500').send({message:err})
            if(result.length){
                return res.status('500').send({messagge:'username is already register'})
            } else{
                let data = {
                    username,
                    password: hashPassword,
                    email,
                    isVerified:0,
                    photo:'/users/default.png',
                    role_id: 3,
                    date_created: Date.now()
                }
                sql = 'insert into tbl_user set ?'
                db.query(sql, data, (err, result)=>{
                    if(err) return res.status('500').send({message:err})
                    sql = 'select * from tbl_user where user_id = ?'
                    db.query(sql, [result.insertId],(err, user_data) => {
                        if(err) return res.status(500).send({message:err.message})
                        const htmlRender =  fs.readFileSync('index.html','utf8')
                        const template = handlebars.compile(htmlRender)
                        const token = createJWToken({user_id:user_data[0].user_id, username:user_data[0].username })
                        const link = `http://localhost:3000/verified?token=${token}`
                        const htmlEmail = template({username:user_data[0].username, link})
                        transporter.sendMail({
                            from:'akei online furniture <hasianamin14@gmail.com',
                            to:email,
                            subject: 'User verification for account in akei',
                            html:htmlEmail
                        },(err)=>{
                            if(err) return res.status(500).send({message:err.message})
                            user_data[0].token = token
                            return res.send(user_data[0])
                        })
                    })
                })
            }
        })
    },
    login:(req,res)=>{
        const {email, password} = req.body
        console.log(password)
        let hashPassword = encrypt(password)
        console.log(hashPassword)
        let sql = "select * from tbl_user where email = ? and password = ?"
        db.query(sql,[email, hashPassword],(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            if(!result.length) return res.status(500).send({message:'user tidak terdaftar'})
            
            sql = "select * from tbl_user where email = ? and password = ? and isVerified = 1"
            db.query(sql,[email, hashPassword],(err, result2)=>{
                if(err) return res.send({message:err.message})
                sql = `update tbl_user set ? where user_id = ${db.escape(result2[0].user_id)}`
                let data = {
                    date_created: Date.now()
                }
                db.query(sql,data,(err)=>{
                    if(err) return res.status(500).send({message:err.message})
                    const token = createJWToken({user_id:result[0].user_id,username:result[0].username})
                    result[0].token = token
                    return res.send(result[0])
                })
            })
        })
    },
    verified:(req,res)=>{
        const id=req.user.user_id
        let editData = {
            isVerified: 1
        }
        let sql = `update tbl_user set ? where user_id=${db.escape(id)}`
        db.query(sql,editData,(err)=>{
            if(err) return res.status(500).send({message:err.message})
            sql = `select * from tbl_user where user_id=${db.escape(id)}`
            db.query(sql,(err,result)=>{
                if(err) return res.status(500).send({message:err.message})
                result[0].token = req.token
                res.send(result[0])
            })
        })
    },
    keepLogin:(req,res)=>{
        const {user_id}=req.params
        let sql='select * from tbl_user where user_id = ?'
        db.query(sql,[user_id],(err,datauser)=>{
            if(err) return res.status(500).send({message:err.message})
            // const token=createJWToken({user_id:datauser[0].user_id,username:datauser[0].username})
            // datauser[0].token=token
            return res.send(datauser[0])
        })
    },
    firebaseauth: (req, res)=> {
        const {username, email, password, photo} = req.body
        let sql = 'select * from tbl_user where email = ?'
        db.query(sql, [email], (err, datauser)=> {
            if(err) return res.status('500').send({message:err})
            if(!datauser.length) {
                let data = {
                    username,
                    password,
                    email,
                    isVerified: 1 ,
                    photo,
                    role_id: 3,
                    date_created: Date.now()
                }

                sql = 'insert into tbl_user set ?'
                db.query(sql, data, (err, result)=> {
                    if(err) return res.status('500').send({message:err})

                    sql = 'select * from tbl_user where user_id = ?'
                    db.query(sql, [result.insertId],(err, user_data) => {
                        if(err) return res.status(500).send({message:err.message})
                        
                        const token = createJWToken({user_id:user_data[0].user_id, username:user_data[0].username })
                        return res.send(user_data[0])
                    })
                })
            } else {
                console.log(datauser[0]);
                return res.send(datauser[0])
            }
        })
    }
}