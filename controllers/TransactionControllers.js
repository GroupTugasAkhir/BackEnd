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
        const {idtrans, ccNumber} = req.body
        let sql = `update tbl_transaction set ? where id = ${db.escape(idtrans)}`
        let updateTransData = {
            date_in: Date.now(),
            status: 'completed',
            payment_proof: ccNumber
        }

        db.query(sql, updateTransData, (err)=> {
            if (err) return res.status(500).send(err)

            return res.send('berhasil') //tidak perlu getcart lagi karena jika berhasil, di front otomatis kosong
        })
    }
}