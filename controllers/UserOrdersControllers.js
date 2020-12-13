const {db} = require('../connection')
const {uploader} = require('../helpers/uploader')
const {encrypt} = require('./../helpers')
const {createJWToken} = require('./../helpers/jwt')
const fs = require('fs')

module.exports = {
    getOrderDetails: (req, res) => {
        const {id} = req.params // user_id
        let sql = `select distinct td.*, p.product_name, p.image, t.status, t.user_id, t.date_in,
        lt.product_id as prod_id, lt.status as status_log
        from tbl_transaction_detail td join tbl_product p on td.product_id=p.product_id
        join tbl_transaction t on td.transaction_id=t.transaction_id
        left join tbl_log_transaction lt on lt.transaction_id=t.transaction_id
        and lt.product_id=td.product_id and lt.status = 'completed'
        where t.user_id=${db.escape(id)} and t.status != 'onCart' and t.status != 'completed'
        order by t.date_in desc;`

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
                    
                    let sql = `select distinct t.*, td.product_id, lt.product_id as prod_id, lt.status as status_log
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

                                    let sql = `select distinct td.*, p.product_name, p.image, t.status, t.user_id,  t.date_in,
                                    lt.product_id as prod_id, lt.status as status_log
                                    from tbl_transaction_detail td join tbl_product p on td.product_id=p.product_id
                                    join tbl_transaction t on td.transaction_id=t.transaction_id
                                    left join tbl_log_transaction lt on lt.transaction_id=t.transaction_id
                                    and lt.product_id=td.product_id and lt.status = 'completed'
                                    where t.user_id=${db.escape(id)} and t.status != 'onCart' and t.status != 'completed'
                                    order by t.date_in desc;`
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
                            let sql = `select distinct td.*, p.product_name, p.image, t.status, t.user_id,  t.date_in,
                            lt.product_id as prod_id, lt.status as status_log
                            from tbl_transaction_detail td join tbl_product p on td.product_id=p.product_id
                            join tbl_transaction t on td.transaction_id=t.transaction_id
                            left join tbl_log_transaction lt on lt.transaction_id=t.transaction_id
                            and lt.product_id=td.product_id and lt.status = 'completed'
                            where t.user_id=${db.escape(id)} and t.status != 'onCart' and t.status != 'completed'
                            order by t.date_in desc;`
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

    },

    //========================================= COMPLETED ORDER ========================================

    getCompleted: (req, res) => {
        const {id} = req.params // user_id
        let sql = `select distinct td.*, p.product_name, p.image, t.status, t.user_id, t.date_in,
        lt.product_id as prod_id, lt.status as status_log
        from tbl_transaction_detail td join tbl_product p on td.product_id=p.product_id
        join tbl_transaction t on td.transaction_id=t.transaction_id
        left join tbl_log_transaction lt on lt.transaction_id=t.transaction_id
        and lt.product_id=td.product_id and lt.status = 'completed'
        where t.user_id=${db.escape(id)} and lt.status = 'completed' order by t.date_in desc;`

        db.query(sql, (err, dataOrdersUser)=>{
            if (err) return res.status(500).send({message:err.message})
            
            return res.status(200).send(dataOrdersUser)
        })
    },

    getRating: (req, res) => {
        const {idUs, idPr} = req.params // user_id, product_id
        // const data = req.body
        // console.log(idUs)
        // console.log(data.IdPr)
        let sql = `select c.*, p.product_name, p.image, u.username, u.photo
        from tbl_comment c join tbl_user u on c.user_id=u.user_id
        join tbl_product p on c.product_id=p.product_id
        where c.user_id=${db.escape(idUs)} and c.product_id=${db.escape(idPr)}
        order by date_in desc`

        db.query(sql, (err, dataRating)=>{
            if (err) return res.status(500).send({message:err.message})
            if (!dataRating) {
                return res.status(500).send({message: 'data rating tidak ada'})
            }
            
            // console.log(dataRating)
            return res.status(200).send(dataRating)
        })
    },

    //========================================= NOTIFICATION ========================================

    getAllNotif: (req, res) => {
        const {id} = req.params // user_id
        let sql = `select * from (select td.transaction_detail_id, td.transaction_id,
        group_concat(td.quantity) as quantity, group_concat(p.price) as price
        , group_concat(p.product_name) as product_name
        , group_concat(p.image) as image, t.status, t.user_id, 
        t.date_in as trans_code,t.notes as notes_read
        from tbl_transaction_detail td join tbl_product p on td.product_id=p.product_id
        join tbl_transaction t on td.transaction_id=t.transaction_id
        group by td.transaction_id) as datas
        left join (select distinct t.transaction_id as trans_id2, lt.log_id, 
        group_concat(lt.status) as status_log, group_concat(lt.notes) as notes_log,
        group_concat(lt.date_in) as date_in, lt.transaction_id as trans_id3
        from tbl_transaction t join 
        (select * from tbl_log_transaction where status not in('request', 'confirm')) as lt
        on t.transaction_id=lt.transaction_id group by t.transaction_id) as logg
        on datas.transaction_id=logg.trans_id2 where datas.user_id=${db.escape(id)}`
        // console.log(id)

        db.query(sql, (err, dataAllNotif)=>{
            if (err) return res.status(500).send({message:err.message})
            // console.log(dataAllNotif)
            
            return res.status(200).send(dataAllNotif)
        })
    },

    getProgress: (req, res) => {
        const {id} = req.params // transaction_id
        let sql = `select distinct t.transaction_id, t.date_in as trans_code,t.status, t.user_id
        , lt.log_id, lt.status as status_log, lt.date_in, lt.notes, lt.transaction_id as trans_id
        from tbl_transaction t left join 
        (select * from tbl_log_transaction where status not in('request', 'confirm')) as lt
        on t.transaction_id=lt.transaction_id where t.transaction_id=${db.escape(id)}
        order by lt.date_in desc;`

        db.query(sql, (err, dataProgress)=>{
            if (err) return res.status(500).send({message:err.message})
            // console.log(dataAllNotif)
            
            return res.status(200).send(dataProgress)
        })
    },

    getNotif: (req, res) => {
        const {id} = req.params // user_id
        let sql = `select distinct t.transaction_id, t.date_in as trans_code,t.status, t.user_id, t.notes as notes_read
        , lt.log_id, max(lt.date_in) as date_newest, lt.notes, lt.transaction_id as trans_id
        from (select * from tbl_transaction where notes != 'read' and status!='onCart') as t left join 
        (select * from tbl_log_transaction where status not in('request', 'confirm')) as lt
        on t.transaction_id=lt.transaction_id where t.user_id=?
        group by t.transaction_id order by lt.date_in desc limit 5;`

        db.query(sql, [id], (err, dataNotif)=>{
            if (err) return res.status(500).send({message:err.message})
            
            return res.status(200).send(dataNotif)
        })
    },

    updateNotif: (req, res) => {
        const {id} = req.params // transaction_id
        let sql = `select * from tbl_transaction where transaction_id = ? `

        db.query(sql, [id], (err, result)=>{
            if (err) return res.status(500).send({message:err.message})
            if(!result) return res.status(500).send({message:'transaksi tidak ada'})

            let newNotes= {
                notes: 'read'
            }
            console.log(id)
            console.log('dfdfd')
            sql = `update tbl_transaction set ? where transaction_id = ${id}`
            db.query(sql, newNotes, (err, resultUpdate)=>{
                if(err){
                    console.log(err)
                    return res.status(500).send(err)
                }
                console.log(resultUpdate)
                sql = `select distinct t.transaction_id, t.date_in as trans_code,t.status, t.user_id, t.notes as notes_read
                , lt.log_id, max(lt.date_in) as date_newest, lt.notes, lt.transaction_id as trans_id
                from (select * from tbl_transaction where notes != 'read' and status!='onCart') as t left join 
                (select * from tbl_log_transaction where status not in('request', 'confirm')) as lt
                on t.transaction_id=lt.transaction_id where t.user_id=?
                group by t.transaction_id order by lt.date_in desc limit 5;`
        
                db.query(sql, [result[0].user_id], (err, dataNotif)=>{
                    if (err) return res.status(500).send({message:err.message})
                    
                    return res.status(200).send(dataNotif)
                })
            })
        })
    }
}