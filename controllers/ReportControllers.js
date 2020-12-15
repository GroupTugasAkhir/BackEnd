const { db } = require('./../connection')

module.exports = {
    reportUser:(req,res)=>{
        let sql = `select count(user_id) as user_qty from tbl_user
        where role_id = 1`
        db.query(sql,(err,result1)=>{
            if(err) return res.status(500).send({message:err.message})
            sql = `select count(t.user_id) as user_qty from tbl_user u
            left join tbl_transaction t
            on t.user_id = u.user_id
            where role_id = 1;`
            db.query(sql,(err,result2)=>{
                if(err) return res.status(500).send({message:err.message})
                return res.send([result1,result2])
            })
        })
    },
    reportProduct:(req,res)=>{
        let sql = `SELECT pd.product_id, sum(pd.quantity) as qty, p.product_name FROM tbl_product_detail pd
        inner join tbl_product p
        on p.product_id = pd.product_id
        group by product_id`
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            return res.send(result)
        })
    },
    reportBranch:(req,res)=>{
        let sql =`select n.destination, count(notification_id) as act_branch, l.location_name from tbl_notification n
        inner join tbl_location l
        on l.location_id = n.destination
        where n.from = 0
        group by l.location_id`
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            return res.send(result)
        })
    },
    reportTransaction:(req,res)=>{
        let sql = `SELECT t.date_in, td.price FROM tbl_transaction t
        inner join tbl_transaction_detail td
        on td.transaction_id = t.transaction_id
        where t.status != 'onCart'
        limit 10`
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            return res.send(result)
        })
    },
    getTotalTrxPerBranch:(req,res)=>{
        let sql = `SELECT t.transaction_id, t.status, t.location_id, sum(td.price) as total FROM tbl_transaction t
        inner join tbl_transaction_detail td
        on td.transaction_id = t.transaction_id
        where t.status = 'completed'
        group by t.location_id, t.status`
        db.query(sql,(err,result)=>{
            if(err) return res.status(500).send({message:err.message})
            return res.send(result)
        })
    }
}