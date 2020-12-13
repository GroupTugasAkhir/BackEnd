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
                                    notes : `from user ${value1.user_id}`,
                                    req_another : '0'
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
                        sql = `insert into tbl_log_transaction set ?`
                        let another_data = {
                            activities : 'tbl_transaction',
                            status : 'request',
                            date_in : Date.now(),
                            transaction_id : value1.transaction_id,
                            notes : 'item request from user to branch'
                        }
                        db.query(sql,another_data,(err)=>{
                            if(err) return res.status(500).send({message:err.message})
                        })
                    })
                })
            }
            return res.send('your item is on the way')
        })
    },

    getRequestNotification:(req,res)=>{
        const {location_id} = req.body
        if(location_id){
            let sql = `select n.notification_id, n.transaction_detail_id, n.quantity as req_qty, n.notes,
            n.from, n.destination, n.status, p.product_id, p.product_name, p.image, l.location_name, l.location_id, n.req_another
            from tbl_notification n
            inner join tbl_transaction_detail td
            on n.transaction_detail_id = td.transaction_detail_id
            inner join tbl_product p
            on p.product_id = td.product_id
            inner join tbl_location l
            on l.location_id = n.from
            where status = 'request' and destination = ? and n.from != '0'
            and n.req_another in (1,2)`
            db.query(sql,[location_id],(err,result)=>{
                if(err) return res.status(500).send({message:err.message})
                res.send(result)
            })
        } else {
            let sql = `select n.notification_id, n.transaction_detail_id, n.quantity as req_qty,
            n.from, n.destination, n.status, p.product_id, p.product_name, p.image
            from tbl_notification n
            inner join tbl_transaction_detail td
            on n.transaction_detail_id = td.transaction_detail_id
            inner join tbl_product p
            on p.product_id = td.product_id
            where status = 'request'`
            db.query(sql,(err,result)=>{
                if(err) return res.status(500).send({message:err.message})
                res.send(result)
            })
        }
    },

    getWaitingConfirmItem:(req,res)=>{
        const {location_id} = req.body
        sql = `select n.notification_id, n.transaction_detail_id, n.quantity as req_qty, n.notes,n.req_another,
        n.from, n.destination, n.status, p.product_id, p.product_name, p.image, l.location_name, l.location_id
        from tbl_notification n
        inner join tbl_transaction_detail td
        on n.transaction_detail_id = td.transaction_detail_id
        inner join tbl_product p
        on p.product_id = td.product_id
        inner join tbl_location l
        on l.location_id = n.from
        where status = 'request' and destination = ? and n.from != '0'
        and n.req_another = '0'`
        db.query(sql,[location_id],(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            res.send(result)
        })
    },

    requestNotificationDetail:(req,res)=>{
        const {product_id, location_id} = req.body
        let sql = `select product_id, location_id, sum(quantity) as stock 
        from tbl_product_detail 
        where product_id = ?
        and location_id = ?
        group by product_id, location_id`
        db.query(sql,[product_id,location_id],(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            res.send(result)
        })
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
        const {location_id,product_id,req_quantity,transaction_detail_id, notification_id} = req.body
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
                notes : `notif_id ${notification_id}`,
                req_another : 1
            }
            if(location_id==1){
                data = {...data,destination:2}
            } else if (location_id==2){
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
                    let another_data = {
                        activities : 'tbl_notification',
                        status : 'request',
                        date_in : Date.now(),
                        product_id,
                        notes : `request from ${location_id}`
                    }
                    sql = `insert into tbl_log_transaction set ?`
                    db.query(sql,another_data,(err)=>{
                        if(err) return res.status(500).send({message:err.message})
                        another_data = {
                            activities : 'tbl_product_detail',
                            status : 'modify',
                            date_in : Date.now(),
                            product_id,
                            notes : req_quantity * -1
                        }
                        sql = `insert into tbl_log_transaction set ?`
                        db.query(sql,another_data,(err)=>{
                            if(err) return res.status(500).send({message:err.message})
                            let param = {
                                notes : 'waitingConfirmation',
                                req_another : '0'
                            }
                            sql = `update tbl_notification set ? where notification_id = ?`
                            db.query(sql,[param,notification_id],(err)=>{
                                if(err) return res.status(500).send({message:err.message})
                                return res.send('request have been made')
                            })
                        })
                    })
                })
            })            
        })
    },

    confirmingRequest:(req,res)=>{
        const {product_id, mod_qty,notification_id,location_id,destination_id,notes,transaction_detail_id} = req.body
        if(notes === 'from user'){
            sql=`insert into tbl_product_detail set ?`
            let obj={
                product_id:product_id,
                location_id: location_id,
                date_in:Date.now(),
                status:'add',
                notes:`from ${destination_id}`,
                quantity: mod_qty
            }
            db.query(sql,obj,(err)=>{
                if(err) return res.status(500).send({message:err.message})
                console.log('masuk sini')
                let new_obj = {
                    product_id:product_id,
                    location_id: destination_id,
                    date_in:Date.now(),
                    status:'modify',
                    notes:`sent to ${location_id}`,
                    quantity: mod_qty * -1
                }
                sql=`insert into tbl_product_detail set ?`
                db.query(sql,new_obj,(err)=>{
                    if(err) return res.status(500).send({message:err.message})
                    let param = {
                        status : 'confirm',
                        req_another : '0'
                    }
                    sql = `update tbl_notification set ? where notification_id = ?`
                    db.query(sql,[param,notification_id],(err)=>{
                        if(err) return res.status(500).send({message:err.message})
                        sql = `update tbl_notification set notes = '' where destination = ? and transaction_detail_id = ?`
                        db.query(sql,[location_id,transaction_detail_id],(err)=>{
                            if(err) return res.status(500).send({message:err.message})
                            return res.send('confirmed euy')
                        })
                    })
                })
            })
        }else{
            let raw = notes.split(' ')
            let notif_mod = raw[1]
            sql = `select * from tbl_notification n where n.notification_id = ?`
            db.query(sql,notif_mod,(err,result10)=>{
                if(err) return res.status(500).send({message:err.message})
                if(result10[0].from == 0){
                    sql=`insert into tbl_product_detail set ?`
                    let obj={
                        product_id:product_id,
                        location_id: location_id,
                        date_in:Date.now(),
                        status:'add',
                        notes:`from ${destination_id}`,
                        quantity: mod_qty
                    }
                    db.query(sql,obj,(err)=>{
                        if(err) return res.status(500).send({message:err.message})
                        console.log('masuk opsi ini')
                        let new_obj = {
                            product_id:product_id,
                            location_id: destination_id,
                            date_in:Date.now(),
                            status:'modify',
                            notes:`sent to ${location_id}`,
                            quantity: mod_qty * -1
                        }
                        sql=`insert into tbl_product_detail set ?`
                        db.query(sql,new_obj,(err)=>{
                            if(err) return res.status(500).send({message:err.message})
                            let param = {
                                status : 'confirm',
                                req_another : '0'
                            }
                            sql = `update tbl_notification set ? where notification_id = ?`
                            db.query(sql,[param,notification_id],(err)=>{
                                if(err) return res.status(500).send({message:err.message})
                                sql = `update tbl_notification set notes = '' where destination = ? and transaction_detail_id = ?`
                                db.query(sql,[location_id,transaction_detail_id],(err)=>{
                                    if(err) return res.status(500).send({message:err.message})
                                    return res.send('confirmed euy')
                                })
                            })
                        })
                    })
                }else{
                    sql=`insert into tbl_product_detail set ?`
                    let obj={
                        product_id:product_id,
                        location_id: location_id,
                        date_in:Date.now(),
                        status:'add',
                        notes:`from ${destination_id}`,
                        quantity: mod_qty
                    }
                    db.query(sql,obj,(err)=>{
                        if(err) return res.status(500).send({message:err.message})
                        console.log('masuk sini')
                        let new_obj = {
                            product_id:product_id,
                            location_id: destination_id,
                            date_in:Date.now(),
                            status:'modify',
                            notes:`sent to ${location_id}`,
                            quantity: mod_qty * -1
                        }
                        sql=`insert into tbl_product_detail set ?`
                        db.query(sql,new_obj,(err)=>{
                            if(err) return res.status(500).send({message:err.message})
                            sql = `update tbl_notification set status = 'confirm' where notification_id = ?`
                            db.query(sql,notification_id,(err)=>{
                                if(err) return res.status(500).send({message:err.message})
                                sql = `update tbl_notification set notes = 'from user' where notification_id = ?`
                                db.query(sql,notif_mod,(err)=>{
                                    if(err) return res.status(500).send({message:err.message})
                                    let data = {
                                        activities : 'tbl_product_detail',
                                        status : 'modify',
                                        date_in : Date.now(),
                                        product_id,
                                        notes : `sent item to ${destination_id}`
                                    }
                                    sql = `insert into tbl_log_transaction set ?`
                                    db.query(sql,data,(err)=>{
                                        if(err) return res.status(500).send({message:err.message})
                                        data = {
                                            activities : 'tbl_notification',
                                            status : 'confirm',
                                            date_in : Date.now(),
                                            product_id,
                                            notes : `sent item to ${destination_id}`
                                        }
                                        sql = `insert into tbl_log_transaction set ?`
                                        db.query(sql,data,(err)=>{
                                            if(err) return res.status(500).send({message:err.message})
                                            sql = `select * from tbl_notification where notification_id = ?`
                                            db.query(sql,notification_id,(err,result)=>{
                                                if(err) return res.status(500).send({message:err.message})
                                                if(result[0].req_another == 0){
                                                    sql = `update tbl_notification set req_another = '0' where notification_id = ?`
                                                    db.query(sql,notif_mod,(err)=>{
                                                        console.log('zzzz')
                                                        if(err) return res.status(500).send({message:err.message})
                                                        return res.send(`confirmed already ${notif_mod}`)
                                                    })
                                                }
                                                if(result[0].req_another > 0){
                                                    sql = `update tbl_notification set req_another = '1' where notification_id = ?`
                                                    db.query(sql,notif_mod,(err)=>{
                                                        console.log('zzzz')
                                                        if(err) return res.status(500).send({message:err.message})
                                                        return res.send(`confirmed already ${notif_mod}`)
                                                    })
                                                }else{
                                                    return res.send(`confirmed already ${notif_mod}`)
                                                }
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                }
            })
        }
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
        let sql = `select n.notification_id, n.from, n.destination, n.quantity as req_qty, n.status, n.notes,
        td.transaction_detail_id, td.transaction_id,
        p.product_name, p.image, jt.stock, p.product_id
        from tbl_notification n
        inner join tbl_transaction_detail td
        on td.transaction_detail_id = n.transaction_detail_id
        inner join tbl_product p 
        on p.product_id = td.product_id
        inner join (select pd.product_id, sum(pd.quantity) as stock, location_id from tbl_product_detail pd
        where pd.location_id = ?
        group by pd.product_id, pd.location_id) jt
        on jt.product_id = p.product_id
        where jt.location_id = ?
        and transaction_id = ?
        and n.from = 0
        and status = 'request'
        and notes != 'waitingConfirmation'`
        db.query(sql,[location_id,location_id,transaction_id],(err,result1)=>{
            if(err) return res.status(500).send({message:err.message})
            sql = `select n.notification_id, n.from, n.destination, n.quantity as req_qty, n.status, n.notes,
            td.transaction_detail_id, td.transaction_id,
            p.product_name, p.product_id, p.image
            from tbl_notification n
            inner join tbl_transaction_detail td
            on td.transaction_detail_id = n.transaction_detail_id
            inner join tbl_product p 
            on p.product_id = td.product_id
            inner join (select pd.product_id, sum(pd.quantity) as stock, location_id from tbl_product_detail pd
            where pd.location_id = ?
            group by pd.product_id, pd.location_id) jt
            on jt.product_id = p.product_id
            where jt.location_id = ?
            and transaction_id = ?
            and n.from = 0
            and status = 'confirm'`
            db.query(sql,[location_id,location_id,transaction_id],(err,result2)=>{
                if(err) return res.status(500).send({message:err.message})
                sql = `select n.notification_id, n.from, n.destination, n.quantity as req_qty, n.status, n.notes,
                td.transaction_detail_id, td.transaction_id,
                p.product_name, p.product_id, p.image
                from tbl_notification n
                inner join tbl_transaction_detail td
                on td.transaction_detail_id = n.transaction_detail_id
                inner join tbl_product p 
                on p.product_id = td.product_id
                inner join (select pd.product_id, sum(pd.quantity) as stock, location_id from tbl_product_detail pd
                where pd.location_id = ?
                group by pd.product_id, pd.location_id) jt
                on jt.product_id = p.product_id
                where jt.location_id = ?
                and transaction_id = ?
                and n.from = 0
                and notes = 'waitingConfirmation';`
                db.query(sql,[location_id,location_id,transaction_id],(err,result3)=>{
                    if(err) return res.status(500).send({message:err.message})
                    return res.send([result1,result2,result3])
                })
            })
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
            sql = `update tbl_notification set status = 'confirm' where transaction_detail_id = ? and req_another = '0'`
            db.query(sql,trx_detail_id,(err)=>{
                if(err) return res.status(500).send({message:err.message})
                let data = {
                    activities : 'tbl_product_detail',
                    status : 'add',
                    date_in : Date.now(),
                    product_id,
                    notes : 'hold item'
                }
                sql = `insert into tbl_log_transaction set ?`
                db.query(sql,data,(err)=>{
                    if(err) return res.status(500).send({message:err.message})
                    data = {
                        activities : 'tbl_notification',
                        status : 'confirm',
                        date_in : Date.now(),
                        product_id,
                        notes : 'confirm from branch to user'
                    }
                    sql = `insert into tbl_log_transaction set ?`
                    db.query(sql,data,(err)=>{
                        if(err) return res.status(500).send({message:err.message})
                        return res.send('confirmed already')
                    })
                })
            })
        })
    },

    onPackagingItem:(req,res)=>{
        const {location_id, transaction_id} = req.body
        let sql = `select n.notification_id, n.from, n.destination, n.quantity as req_qty, n.status, n.notes,
        td.transaction_detail_id, td.transaction_id,
        p.product_name, p.product_id, p.image
        from tbl_notification n
        inner join tbl_transaction_detail td
        on td.transaction_detail_id = n.transaction_detail_id
        inner join tbl_product p 
        on p.product_id = td.product_id
        inner join (select pd.product_id, sum(pd.quantity) as stock, location_id from tbl_product_detail pd
        where pd.location_id = ?
        group by pd.product_id, pd.location_id) jt
        on jt.product_id = p.product_id
        where jt.location_id = ?
        and transaction_id = ?
        and n.from = 0
        and status = 'confirm'`
        db.query(sql,[location_id,location_id,transaction_id],(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            return res.send(result)
        })
    },

    onWaitingItem:(req,res)=>{
        const {location_id, transaction_id} = req.body
        let sql = `select n.notification_id, n.from, n.destination, n.quantity as req_qty, n.status, n.notes,
        td.transaction_detail_id, td.transaction_id,
        p.product_name, p.product_id, p.image
        from tbl_notification n
        inner join tbl_transaction_detail td
        on td.transaction_detail_id = n.transaction_detail_id
        inner join tbl_product p 
        on p.product_id = td.product_id
        inner join (select pd.product_id, sum(pd.quantity) as stock, location_id from tbl_product_detail pd
        where pd.location_id = ?
        group by pd.product_id, pd.location_id) jt
        on jt.product_id = p.product_id
        where jt.location_id = ?
        and transaction_id = ?
        and n.from = 0
        and notes = 'waitingConfirmation';`
        db.query(sql,[location_id,location_id,transaction_id],(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            return res.send(result)
        })
    },

    checkConfirmItem:(req,res)=>{
        const {transaction_id} = req.params
        let sql = `SELECT distinct(td.transaction_id), td.transaction_detail_id, n.status, n.from FROM tbl_notification n 
        inner join tbl_transaction_detail td
        on td.transaction_detail_id = n.transaction_detail_id
        where n.status = 'confirm' and n.from = 0 and td.transaction_id = ?;`
        db.query(sql,transaction_id,(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            sql = `SELECT * FROM tbl_transaction_detail
            where transaction_id = ?`
            db.query(sql,transaction_id,(err,result2)=>{
                if(result.length && result2.length){
                    if(result.length === result2.length){
                        return res.send('1')
                    }else {
                        return res.send('0')
                    }
                } else {
                    return res.send('0')
                }
            })
        })
    },

    sendItem:(req,res)=>{
        const {transaction_id} = req.params
        let sql = `update tbl_transaction set status = 'sentToUser' where transaction_id = ?`
        db.query(sql,transaction_id,(err)=>{
            if(err) return res.status(500).send({message:err.message})
            let data = {
                activities : 'tbl_transaction',
                status : 'sentToUser',
                date_in : Date.now(),
                transaction_id,
                notes : 'item send to user and waiting for confirmation'
            }
            sql = `insert into tbl_log_transaction set ?`
            db.query(sql,data,(err)=>{
                if(err) return res.status(500).send({message:err.message})
                return res.send('item send to user and waiting for confirmation')
            })
        })
    }
}