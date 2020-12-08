const { db } = require('./../connection')

module.exports = {
    
    checkCompletePayment: (req, res)=> {
        let sql = `select * from tbl_transaction where status = 'paymentCompleted';`
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
                                    from : 0,
                                    destination : value1.location_id,
                                    status : 'request',
                                    notes : `from user ${value1.user_id}`
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
                    sql = `update tbl_transaction set ? where status = 'paymentCompleted' and transaction_id = ?`
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
        let sql = `SELECT pd.product_id, pd.location_id,pd.status, sum(pd.quantity) as stock, p.product_name, p.image FROM tbl_product_detail pd
        inner join tbl_product p
        on p.product_id = pd.product_id
        where pd.location_id = ? and p.product_id = ?
        group by product_id, location_id`
        db.query(sql,[location_id,product_id],(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            let temp = req_quantity - result[0].stock
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
                // res.send('request have been made')
                let wait = {
                    product_id : product_id,
                    location_id : data.destination,
                    quantity : 0,
                    date_in : Date.now(),
                    status : 'modify',
                    notes : `onWaiting ${temp}`
                }
                sql=`insert into tbl_product_detail set ?`
                db.query(sql,wait,(err)=>{
                    if(err) return res.status(500).send({message:err.message})
                    res.send('request have been made')
                })
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
    },

    getTransaction:(req,res)=>{
        const {location_id} = req.params
        let sql = `SELECT t.transaction_id, t.date_in, t.status, t.user_id, t.location_id,
        u.user_id, u.username FROM tbl_transaction t 
        inner join tbl_user u
        on u.user_id = t.user_id
        where location_id = ? and status='productOTW'`
        db.query(sql,location_id,(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            return res.send(result)
        })
    },

    getTransactionDetail:(req,res)=>{
        const {location_id, transaction_id} = req.body
        let sql = `SELECT distinct(t.transaction_id), td.transaction_detail_id, td.quantity as req_qty, td.product_id, t.status, t.user_id, t.location_id
        ,jt.image, jt.product_name, jt.stock, jt.status as status_item, n.status
        FROM tbl_transaction t
        inner join tbl_transaction_detail td
        on td.transaction_id = t.transaction_id
        inner join tbl_notification n
        on n.transaction_detail_id = td.transaction_detail_id
        inner join (SELECT pd.product_id, pd.location_id,pd.status, sum(pd.quantity) as stock, p.product_name, p.image FROM tbl_product_detail pd
        inner join tbl_product p
        on p.product_id = pd.product_id
        where pd.location_id = ? and pd.status != 'hold'
        group by product_id, location_id, pd.status) jt
        on jt.product_id = td.product_id
        where t.status = 'productOTW'
        and t.transaction_id = ?
        and n.status = 'request'
        order by td.product_id`
        db.query(sql,[location_id,transaction_id],(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            return res.send(result)
        })
    },

    confirmUserReq:(req,res)=>{
        const {product_id, mod_qty,trx_detail_id,location_id} = req.body
        sql=`insert into tbl_product_detail set ?`
        let obj={
            product_id:product_id,
            location_id,
            date_in:Date.now(),
            status:'hold',
            notes:'onPackaging',
            quantity: mod_qty * -1
        }
        db.query(sql,obj,(err)=>{
            if(err) return res.status(500).send({message:err.message})
            sql = `update tbl_notification set status = 'confirm' where transaction_detail_id = ?`
            db.query(sql,trx_detail_id,(err)=>{
                if(err) return res.status(500).send({message:err.message})
                return res.send('confirmed already')
            })
        })
    },

    onPackagingItem:(req,res)=>{
        const {location_id, transaction_id} = req.body
        let sql = `SELECT td.transaction_detail_id, t.transaction_id, td.product_id, td.quantity as req_qty, t.location_id,
        p.product_name, p.image, pd.quantity, pd.notes
        FROM tbl_transaction_detail td
        inner join tbl_transaction t
        on t.transaction_id = td.transaction_id
        inner join tbl_product p
        on p.product_id = td.product_id
        inner join tbl_product_detail pd
        on pd.product_id = p.product_id
        inner join tbl_notification n
        on n.transaction_detail_id = td.transaction_detail_id
        where t.location_id = ? and t.transaction_id = ? and pd.notes = 'onPackaging'`
        db.query(sql,[location_id,transaction_id],(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            return res.send(result)
        })
    },

    onWaitingItem:(req,res)=>{
        const {location_id, transaction_id} = req.body
        let sql = `SELECT distinct(td.transaction_detail_id), t.transaction_id, td.product_id, td.quantity as req_qty, t.location_id,
        p.product_name, p.image, pd.quantity, pd.notes
        FROM tbl_transaction_detail td
        inner join tbl_transaction t
        on t.transaction_id = td.transaction_id
        inner join tbl_product p
        on p.product_id = td.product_id
        inner join tbl_product_detail pd
        on pd.product_id = p.product_id
        inner join tbl_notification n
        on n.transaction_detail_id = td.transaction_detail_id
        where t.location_id = ? and t.transaction_id = ? and pd.notes like 'onWaiting%'`
        db.query(sql,[location_id,transaction_id],(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            return res.send(result)
        })
    }
}