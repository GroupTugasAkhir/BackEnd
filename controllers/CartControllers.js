const { db } = require('./../connection')

module.exports = {
    getCart: (req, res)=> {
        const {user_id} = req.params
        let sql = `select tp.product_name, tp.price, tp.image, ttd.quantity, tp.product_id as idprod, tt.transaction_id as idtrans from tbl_product tp
        join tbl_transaction_detail ttd on tp.product_id = ttd.product_id
        join tbl_transaction tt on tt.transaction_id = ttd.transaction_id
        where status = 'onCart' and tt.user_id = ?`

        db.query(sql, [user_id], (err, cartData)=> {
            if(err) return res.status(500).send({message:err.message})
    
            sql = `select latitude, longitude from tbl_location`
            db.query(sql, (err, locationData)=> {
                if(err) return res.status(500).send({message:err.message})

                return res.send({cartData: cartData, locationData: locationData})
            })
        })
    },
    updateCart: (req, res)=> {
        const {idprod, idtrans, quantity} = req.body
        let updateQty = {
            quantity: quantity
        }
        let sql = `update tbl_transaction_detail set ? where transaction_id = ? and product_id = ?`
        db.query(sql, [updateQty, idtrans, idprod], (err)=> {
            if(err) return res.status(500).send({message:err.message})
            return res.send('updated')
        })
    },
    deleteCart: (req, res)=> {
        const {idtrans, idprod} = req.body
        let sql = `delete from tbl_transaction_detail where transaction_id = ? and product_id = ?`
        db.query(sql, [idtrans, idprod], (err)=> {
            if(err) return res.status(500).send({message:err.message})

            return res.send('deleted')
        })
    },

    userTrxOnCart:(req,res)=>{
        const {user_id, product_id, quantity} = req.body
        let sql = `select * from tbl_transaction
        where user_id = ? and status = 'onCart'`
        db.query(sql,[user_id],(err,result)=>{
            if(err)return res.status(500).send(err)
            if(result.length){
                sql = `select * from tbl_transaction_detail
                where transaction_id = ? and product_id = ?`
                db.query(sql,[result[0].transaction_id,product_id],(err,result3)=>{
                    if(err)return res.status(500).send(err)
                    if(result3.length){
                        let newQty = {
                            quantity : result3[0].quantity + quantity
                        }
                        sql = `update tbl_transaction_detail set ? where transaction_id = ? and product_id = ?`
                        db.query(sql,[newQty,result[0].transaction_id,product_id],(err)=>{
                            if(err)return res.status(500).send(err)
                            return res.send('data successfully update')
                        })
                    } else {
                        let newTrxDetail = {
                            transaction_id : result[0].transaction_id,
                            product_id,
                            quantity
                        }
                        sql = `insert into tbl_transaction_detail set ?`
                        db.query(sql,newTrxDetail,(err)=>{
                            if(err)return res.status(500).send(err)
                            return res.send('data successfully added')
                        })
                    }
                })
            } else{
                let createDate = Math.round((new Date()).getTime() / 1000);
                let data = {
                    date_in : createDate,
                    status: 'onCart',
                    user_id,
                    payment_proof: null,
                    location_id: 0
                }
                sql = `insert into tbl_transaction set ?`
                db.query(sql,data,(err)=>{
                    if(err) return res.status('500').send({message:err})
                    // return res.send('data successfully added')
                    sql = `select * from tbl_transaction
                    where user_id = ? and status = 'onCart'`
                    db.query(sql,[user_id],(err,result2)=>{
                        if(err)return res.status(500).send(err)
                        let data_product = {
                            transaction_id : result2[0].transaction_id,
                            product_id,
                            quantity
                        }
                        sql = `insert into tbl_transaction_detail set ?`
                        db.query(sql,data_product,(err)=>{
                            if(err)return res.status(500).send(err)
                            return res.send('data successfully added')
                        })
                    })
                })
            }
        })
    },

    getCartLength:(req,res)=>{
        const {user_id} = req.params
        let sql = `SELECT count(td.transaction_detail_id) as cart FROM tbl_transaction t
        inner join tbl_transaction_detail td
        on td.transaction_id = t.transaction_id
        where t.user_id = ?
        and t.status = "onCart"`
        db.query(sql,[user_id],(err,result)=>{
            if(err)return res.status(500).send(err)
            return res.send(result)
        })
    },

    userCartData:(req,res)=>{
        const {user_id} = req.params
        let sql = `SELECT p.product_id, td.quantity, p.product_name, p.price, p.image  FROM tbl_transaction_detail td
        inner join tbl_transaction t
        on t.transaction_id = td.transaction_id
        inner join tbl_product p
        on p.product_id = td.product_id
        where user_id = ?
        and t.status = "onCart" 
        order by p.product_name`
        db.query(sql,[user_id],(err,result)=>{
            if(err)return res.status(500).send(err)
            return res.send(result)
        })
    }

    
}