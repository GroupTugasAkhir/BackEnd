const { db } = require('./../connection')
const fs = require('fs')
const {uploader} = require('./../helpers/uploader')

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
                    status: 'paymentCompleted',
                    payment_proof,
                    location_id: locationRes[0].location_id
                }
        
                db.query(sql, updateTransData, (err)=> {
                    if (err) return res.status(500).send({message:err.message})
        
                    return res.send('succeed') //tidak perlu getcart lagi karena jika berhasil, di front otomatis kosong
                })
            })
        })
    },
    onpayinvoice: (req, res)=> {
        const path = '/invoice'
        const upload = uploader(path, 'INVOICE').fields([{ name: 'invoice'}])

        upload(req, res, (err)=> {
            if(err) return res.status(500).json({message: 'upload picture failed !', error: err.message})
            
            console.log('invoice uploaded')
            const { invoice } = req.files
            const invoicePath =  invoice ? path + '/' + invoice[0].filename : null
            console.log(invoicePath);

            console.log(req.body.datainvoice);
            const invoiceData = JSON.parse(req.body.datainvoice)

            let idUser = {
                notes: invoiceData.notes
            }

            let sql = `update tbl_user set ? where user_id = ${db.escape(invoiceData.user_id)}`
            db.query(sql, [idUser], (err)=> {
                if (err) return res.status(500).send({message:err.message})

                sql = `select * from tbl_location where longitude = ? and latitude = ?`
                db.query(sql, [invoiceData.matchLoc.longitude, invoiceData.matchLoc.latitude], (err, locationRes)=> {
                    if (err) return res.status(500).send({message:err.message})

                    sql = `update tbl_transaction set ? where transaction_id = ${db.escape(invoiceData.idtrans)}`
                    let updateTransData = {
                        date_in: Date.now(),
                        status: 'waitingAdminConfirmation',
                        payment_proof: invoicePath,
                        location_id: locationRes[0].location_id
                    }
            
                    db.query(sql, updateTransData, (err)=> {
                        if (err) {
                            fs.unlinkSync('./public'+invoicePath)
                            res.status(500).send({message: err.message})
                        }
                        
                        console.log('succeed');
                        return res.send('succeed') //tidak perlu getcart lagi karena jika berhasil, di front otomatis kosong
                    })
                })
            })
        })
    }
}