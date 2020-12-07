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
                                    to : value1.location_id,
                                    status : 'request'
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
    }
}