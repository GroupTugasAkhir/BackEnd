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
                return res.status('500').send({message:'username is already register'})
            } else{
                let data = {
                    username,
                    password: hashPassword,
                    email,
                    isVerified:0,
                    photo:'/users/default.png',
                    role_id: 1,
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
        const {emailuser, password} = req.body
        let hashPassword = encrypt(password)

        let sql = "select * from tbl_user where email = ? and password = ?"
        db.query(sql,[emailuser, hashPassword],(err, resultEmail)=>{
            if(err) return res.status(500).send({message:err.message})
            if(!resultEmail.length) {
                sql = `select * from tbl_user where username = ? and password = ?`

                db.query(sql, [emailuser, hashPassword], (err, resultUser)=> {
                    if(err) return res.status(500).send({message:err.message})
                    if(!resultUser.length) {
                        return res.status(500).send({message:'user tidak terdaftar'})
                    }

                    sql = `update tbl_user set ? where user_id = ${db.escape(resultUser[0].user_id)}`
                    let data = {
                        date_created: Date.now()
                    }

                    db.query(sql,data,(err)=>{
                        if(err) return res.status(500).send({message:err.message})

                        sql = `select tp.product_name, tp.price, tp.image, ttd.quantity, tp.product_id as idprod, tt.transaction_id as idtrans from tbl_product tp
                        join tbl_transaction_detail ttd on tp.product_id = ttd.product_id
                        join tbl_transaction tt on tt.transaction_id = ttd.transaction_id
                        where status = 'onCart' and tt.user_id = ?`

                        db.query(sql, [resultUser[0].user_id], (err, cartData)=> {
                            if(err) return res.status(500).send({message:err.message})

                            const token = createJWToken({user_id:resultUser[0].user_id, username:resultUser[0].username})
                            resultUser[0].token = token
                            return res.send({dataLogin: resultUser[0], dataCart: cartData})
                        })
                    })
                })
            } else {
                sql = `update tbl_user set ? where user_id = ${db.escape(resultEmail[0].user_id)}`
                let data = {
                    date_created: Date.now()
                }

                db.query(sql,data,(err)=>{
                    if(err) return res.status(500).send({message:err.message})

                    sql = `select tp.product_name, tp.price, tp.image, ttd.quantity, tp.product_id as idprod, tt.transaction_id as idtrans from tbl_product tp
                    join tbl_transaction_detail ttd on tp.product_id = ttd.product_id
                    join tbl_transaction tt on tt.transaction_id = ttd.transaction_id
                    where status = 'onCart' and tt.user_id = ?`

                    db.query(sql, [resultEmail[0].user_id], (err, cartData)=> {
                        if(err) return res.status(500).send({message:err.message})

                        const token = createJWToken({user_id:resultEmail[0].user_id,username:resultEmail[0].username})
                        resultEmail[0].token = token
                        return res.send({dataLogin: resultEmail[0], dataCart: cartData})
                    })
                })
            }
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
            if(err) return res.status(500).send(err)
            // const token=createJWToken({user_id:datauser[0].user_id,username:datauser[0].username})
            // datauser[0].token=token
            sql = `select tp.product_name, tp.price, tp.image, ttd.quantity, tp.product_id as idprod, tt.transaction_id as idtrans from tbl_product tp
            join tbl_transaction_detail ttd on tp.product_id = ttd.product_id
            join tbl_transaction tt on tt.transaction_id = ttd.transaction_id
            where status = 'onCart' and tt.user_id = ?`
            db.query(sql, [datauser[0].user_id], (err, cartData)=> {
                if(err) return res.status(500).send({message:err.message})
                return res.send({dataLogin: datauser[0], dataCart: cartData})
            })
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
                    role_id: 1,
                    date_created: Date.now()
                }

                sql = 'insert into tbl_user set ?'
                db.query(sql, data, (err, result)=> {
                    if(err) return res.status('500').send({message:err})

                    sql = 'select * from tbl_user where user_id = ?'
                    db.query(sql, [result.insertId],(err, user_data) => {
                        if(err) return res.status(500).send({message:err.message})
                        
                        sql = `select tp.product_name, tp.price, tp.image, ttd.quantity, tp.product_id as idprod, tt.transaction_id as idtrans from tbl_product tp
                        join tbl_transaction_detail ttd on tp.product_id = ttd.product_id
                        join tbl_transaction tt on tt.transaction_id = ttd.transaction_id
                        where status = 'onCart' and tt.user_id = ?`

                        db.query(sql, [user_data[0].id], (err, cartData)=> {
                            if(err) return res.status('500').send({message:err.message})
        
                            const token = createJWToken({user_id:user_data[0].user_id, username:user_data[0].username })
                            user_data[0].token = token
                            return res.send({dataLogin: user_data[0], dataCart: cartData})
                        })

                    })
                })
            } else {
                sql = `select tp.product_name, tp.price, tp.image, ttd.quantity, tp.product_id as idprod, tt.transaction_id as idtrans from tbl_product tp
                join tbl_transaction_detail ttd on tp.product_id = ttd.product_id
                join tbl_transaction tt on tt.transaction_id = ttd.transaction_id
                where status = 'onCart' and tt.user_id = ?`

                db.query(sql, [datauser[0].id], (err, cartData)=> {
                    if(err) return res.status('500').send({message:err})

                    return res.send({dataLogin: datauser[0], dataCart: cartData})
                })
            }
        })
    }
}