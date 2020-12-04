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

            return res.send(cartData)
        })
    },
    updateCart: (req, res)=> {
        const {idprod, idtrans, quantity} = req.body
        let updateQty = {
            quantity: quantity
        }
        let sql = `update tbl_transaction_detail set ? where transaction_id = ? and product_id = ?`
        db.query(sql, [updateQty, idtrans, idprod], (err, cartData)=> {
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
    }
}