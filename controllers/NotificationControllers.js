const { db } = require('./../connection')

module.exports = {
    
    checkCompletePayment: (req, res)=> {
        let sql = `select * from tbl_transaction where status = 'completed';`
        db.query(sql, (err,result1)=> {
            if(err) return res.status(500).send({message:err.message})
            if(result1.length){
                result1.map((value1)=>{
                    sql = `select * from tbl_transaction_detail where transaction_id = ?`
                    db.query(sql,[value1.transaction_id],(err,result2)=>{
                        if(err) return res.status(500).send({message:err.message})
                        if(result2.length){
                            result2.map((value2)=>{
                                var data = {
                                    transaction_detail_id : value2.transaction_detail_id,
                                    quantity : value2.quantity,
                                    from : value1.user_id,
                                    destination : value1.location_id,
                                    status : 'request',
                                    notes : 'from user'
                                }
                                sql=`insert into tbl_notification set ?`
                                db.query(sql,data,(err)=>{
                                    if(err) return res.status(500).send({message:err.message})
                                    // return res.send('notification request created')
                                })
                            })
                        }
                    })
                    let temp = {
                        status : "productOTW"
                    }
                    sql = `update tbl_transaction set ? where status = 'completed' and transaction_id = ?`
                    db.query(sql,[temp,value1.transaction_id],(err)=>{
                        if(err) return res.status(500).send({message:err.message})
                    })
                })
            }
            return res.send('your item is on the way')
        })
    },

    getRequestNotification:(req,res)=>{
        const {location_id} = req.body
        if(location_id){
            let sql = `select * from tbl_notification where status = 'request' and destination = ?`
            db.query(sql,[location_id],(err,result)=>{
                if(err) return res.status(500).send({message:err.message})
                res.send(result)
            })
        } else {
            let sql = `select * from tbl_notification where status = 'request'`
            db.query(sql,[location_id],(err,result)=>{
                if(err) return res.status(500).send({message:err.message})
                res.send(result)
            })
        }
    },

    checkBeforeRequest:(req,res)=>{
        const {location_id,product_id,req_quantity} = req.body
        let sql = `SELECT * FROM tbl_product_detail where location_id = ? and product_id = ? and quantity >= ?`
        db.query(sql,[location_id,product_id,req_quantity],(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            res.send(result)
        })
    },

    requestHandling:(req,res)=>{
        const {location_id,product_id,req_quantity,transaction_detail_id} = req.body
        let sql = `SELECT * FROM tbl_product_detail where location_id = ? and product_id = ?`
        db.query(sql,[location_id,product_id],(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            let temp = req_quantity - result[0].quantity
            var data = {
                transaction_detail_id : transaction_detail_id,
                quantity : temp,
                from : location_id,
                status : 'request',
                notes : null
            }
            if(location_id===1){
                data = {...data,destination:2}
            } else if (location_id===2){
                data = {...data,destination:3}
            } else {
                data = {...data,destination:1}
            }
            sql=`insert into tbl_notification set ?`
            db.query(sql,data,(err)=>{
                if(err) return res.status(500).send({message:err.message})
                res.send('request have been made')
            })            
        })
    },

    confirmingRequest:(req,res)=>{
        const {notification_id} = req.body
        let sql = `SELECT tn.notification_id, tn.transaction_detail_id, tn.quantity,tn.from,tn.destination,
        td.product_id FROM tbl_notification tn
        inner join tbl_transaction_detail td
        on td.transaction_detail_id = tn.transaction_detail_id
        where notification_id = ?`
        db.query(sql,notification_id,(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            sql = `update tbl_notification set status = 'confirm' where notification_id = ?`
            db.query(sql,notification_id,(err)=>{
                if(err) return res.status(500).send({message:err.message})
                sql = `select * from tbl_product_detail where product_id = ? and location_id = ?`
                db.query(sql,[result[0].product_id,result[0].from],(err,result2)=>{
                    if(err) return res.status(500).send({message:err.message})
                    let data = {
                        quantity : result[0].quantity + result2[0].quantity
                    }
                    console.log(result[0].quantity)
                    console.log(result2[0].quantity)
                    sql = `update tbl_product_detail set ? where location_id = ? and product_id = ?`
                    db.query(sql,[data,result[0].from,result[0].product_id],(err)=>{
                        if(err) return res.status(500).send({message:err.message})
                        console.log('ke sini4')
                        sql = `select * from tbl_product_detail where product_id = ? and location_id = ?`
                        db.query(sql,[result[0].product_id,result[0].destination],(err,result3)=>{
                            if(err) return res.status(500).send({message:err.message})
                            data = {
                                quantity : result3[0].quantity - result[0].quantity
                            }
                            sql = `update tbl_product_detail set ? where location_id = ? and product_id = ?`
                            db.query(sql,[data,result[0].destination,result[0].product_id],(err)=>{
                                if(err) return res.status(500).send({message:err.message})
                                return res.send('confirmed')
                            })  
                        })
                    })
                })
            })
        })
    }
}