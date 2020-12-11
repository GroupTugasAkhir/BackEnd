const {db} = require('../connection')
const {uploader} = require('../helpers/uploader')
const {encrypt} = require('./../helpers')
const {createJWToken} = require('./../helpers/jwt')
const fs = require('fs')

module.exports = {
    getOrderDetails: (req, res) => {
        const {id} = req.params // user_id
        let sql = `select td.*, p.product_name, p.image, t.status, t.user_id, t.location_id
        from tbl_transaction_detail td join tbl_product p on td.product_id=p.product_id
        join tbl_transaction t on td.transaction_id=t.transaction_id
        where t.user_id=${db.escape(id)} and status != 'onCart'`
        db.query(sql, (err, dataOrdersUser)=>{
            if (err) return res.status(500).send({message:err.message})
            
            return res.status(200).send(dataOrdersUser)
        })
    },

    getSelectedOrder: (req, res) => {
        const {id} = req.params // transaction_detail_id
        let sql = `select td.*, p.product_name, p.image, t.status, t.user_id, t.location_id
        from tbl_transaction_detail td join tbl_product p on td.product_id=p.product_id
        join tbl_transaction t on td.transaction_id=t.transaction_id
        where td.transaction_detail_id=${db.escape(id)};`
        db.query(sql, (err, dataCurrentOrder)=>{
            if (err) return res.status(500).send({message:err.message})
            
            return res.status(200).send(dataCurrentOrder[0])
        })
    },

    completeOrder: (req, res) => {
        const data = req.body
        const insertTransLog = {
            activities: 'tbl_transaction',
            status: 'completed',
            date_in : data.date_in,
            product_id: data.product_id,
            notes: data.location_id,
            user_id: data.user_id,
            transaction_id: data.transaction_id
        }
        db.beginTransaction((err)=>{
            if (err) {
                return res.status(500).send({message:err.message})
            }

            let sql = `insert into tbl_log_transaction set ?`
            db.query(sql, insertTransLog, (err)=>{
                if (err) {
                    return db.rollback(()=>{
                        console.log(err)
                        res.status(500).send({message:err.message})
                    })
                }

                const insertComment = {
                    user_id: data.user_id,
                    date_in : data.date_in,
                    product_id: data.product_id,
                    comment_content: data.comment,
                    rating: data.rating
                }
                let sql = `insert into tbl_comment set ?`
                db.query(sql, insertComment, (err)=>{
                    if (err) {
                    return db.rollback(()=>{
                        console.log(err)
                        res.status(500).send({message:err.message})
                    })
                }
                    
                    let sql = `select t.*, td.product_id, lt.product_id as prod_id, lt.status as status_log
                    from tbl_transaction_detail td join tbl_transaction t on t.transaction_id=td.transaction_id
                    left join tbl_log_transaction lt on lt.transaction_id=t.transaction_id
                    and lt.product_id=td.product_id and lt.status = 'completed'
                    where t.transaction_id=${db.escape(data.transaction_id)};`
                    db.query(sql, (err, dataTrans)=>{
                        if (err) {
                            return db.rollback(()=>{
                                console.log(err)
                                res.status(500).send({message:err.message})
                            })
                        }

                        if (dataTrans == false) {
                            return res.status(500).send({message: 'data transaksi tidak ada'})
                        }
                        var counter = 0
                        dataTrans.forEach((val, index) => {
                            if (val.status_log) {
                                counter++
                            }
                        });

                        if(counter == dataTrans.length){
                            sql = `Update tbl_transaction set ? where transaction_id = ${db.escape(data.transaction_id)}`
                            
                            db.query(sql, {status: 'completed'}, (err)=>{
                                if (err) {
                                    return db.rollback(()=>{
                                        console.log(err)
                                        res.status(500).send({message:err.message})
                                    })
                                }
                                db.commit((err)=>{
                                    if (err) {
                                        return db.rollback(()=>{
                                            console.log(err)
                                            res.status(500).send({message:err.message})
                                        })
                                    }

                                    let sql = `select td.*, p.product_name, p.image, t.status, t.user_id, t.location_id
                                    from tbl_transaction_detail td join tbl_product p on td.product_id=p.product_id
                                    join tbl_transaction t on td.transaction_id=t.transaction_id
                                    where t.user_id=${db.escape(data.user_id)} and status != 'onCart'`
                                    db.query(sql, (err, dataOrdersUser)=>{
                                        if (err) return res.status(500).send({message:err.message})
                                        
                                        let sql = `select td.*, p.product_name, p.image, t.status, t.user_id, t.location_id
                                        from tbl_transaction_detail td join tbl_product p on td.product_id=p.product_id
                                        join tbl_transaction t on td.transaction_id=t.transaction_id
                                        where td.transaction_detail_id=${db.escape(data.transaction_detail_id)};`
                                        db.query(sql, (err, dataCurrentOrder)=>{
                                            if (err) return res.status(500).send({message:err.message})
                                            
                                            return res.status(200).send({
                                                dataOrdersUser,
                                                dataCurrentOrder: dataCurrentOrder[0]
                                            })
                                        })
                                    })
                                })

                                
                            })
                        }else{
                            let sql = `select td.*, p.product_name, p.image, t.status, t.user_id, t.location_id
                            from tbl_transaction_detail td join tbl_product p on td.product_id=p.product_id
                            join tbl_transaction t on td.transaction_id=t.transaction_id
                            where t.user_id=${db.escape(data.user_id)} and status != 'onCart'`
                            db.query(sql, (err, dataOrdersUser)=>{
                                if (err) return res.status(500).send({message:err.message})
                                
                                let sql = `select td.*, p.product_name, p.image, t.status, t.user_id, t.location_id
                                from tbl_transaction_detail td join tbl_product p on td.product_id=p.product_id
                                join tbl_transaction t on td.transaction_id=t.transaction_id
                                where td.transaction_detail_id=${db.escape(data.transaction_detail_id)};`
                                db.query(sql, (err, dataCurrentOrder)=>{
                                    if (err) return res.status(500).send({message:err.message})
                                    
                                    return res.status(200).send({
                                        dataOrdersUser,
                                        dataCurrentOrder: dataCurrentOrder[0]
                                    })
                                })
                            })
                        }
                        
                    })
                })
            })
        })

    }
}