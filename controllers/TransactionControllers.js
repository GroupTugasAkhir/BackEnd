const { db } = require('./../connection')

const queryProm = (sql) => {
    return new Promise((resolve, reject)=> {
        db.query(sql, (err, results)=> {
            if (err) {
                reject(err)
            } else {
                resolve(results)
            }
        })
    })
}

module.exports = {
    onpaycc: (req, res)=> {
        const {user_id, idtrans, payment_proof, notes, matchLoc} = req.body

        console.log(matchLoc.longitude);
        console.log(matchLoc.latitude);

        let idUser = {
            notes: notes
        }

        let sql = `update tbl_user set ? where user_id = ${db.escape(user_id)}`
        db.query(sql, [idUser], (err)=> {
            if (err) return res.status(500).send({message:err.message})

            sql = `select * from tbl_location where longitude = ? and latitude = ?`
            db.query(sql, [matchLoc.longitude, matchLoc.latitude], (err, locationRes)=> {
                if (err) return res.status(500).send({message:err.message})

                sql = `update tbl_transaction set ? where transaction_id = ${db.escape(idtrans)}`
                let updateTransData = {
                    date_in: Date.now(),
                    status: 'completed',
                    payment_proof,
                    location_id: locationRes[0].location_id
                }
        
                db.query(sql, updateTransData, (err)=> {
                    if (err) return res.status(500).send({message:err.message})
        
                    return res.send('berhasil') //tidak perlu getcart lagi karena jika berhasil, di front otomatis kosong
                })
            })
        })
    }
}