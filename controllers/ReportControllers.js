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
    }

}