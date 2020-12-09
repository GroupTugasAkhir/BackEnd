const { db } = require('./../connection')
const fs = require('fs')
const {uploader} = require('./../helpers/uploader')


const updateQuery = (sql) => {
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
        const {user_id, idtrans, payment_proof, notes, matchLoc, userCart} = req.body

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
                    location_id: locationRes[0].location_id,
                    method: 'cc'
                }
        
                db.query(sql, updateTransData, (err)=> {
                    if (err) return res.status(500).send({message:err.message})

                    let newArray = []
                    userCart.forEach(val=> {
                        newArray.push(updateQuery(`update tbl_transaction_detail set price = ${val.price} where transaction_id = ${val.idtrans} and product_id = ${val.idprod}`))
                    })

                    Promise.all(newArray).then(()=> {
                        console.log('succeed');
                        return res.send('succeed') //tidak perlu getcart lagi karena jika berhasil, di front otomatis kosong
                    }).catch((err)=> {
                        return res.status(500).send({message:err.message})
                    })
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
                        location_id: locationRes[0].location_id,
                        method: 'transfer'
                    }
            
                    db.query(sql, updateTransData, (err)=> {
                        if (err) {
                            fs.unlinkSync('./public'+invoicePath)
                            res.status(500).send({message: err.message})
                        }

                        let newArray = []
                        invoiceData.userCart.forEach(val=> {
                            newArray.push(updateQuery(`update tbl_transaction_detail set price = ${val.price} where transaction_id = ${val.idtrans} and product_id = ${val.idprod}`))
                        })

                        Promise.all(newArray).then(()=> {
                            console.log('succeed');
                            return res.send('succeed') //tidak perlu getcart lagi karena jika berhasil, di front otomatis kosong
                        }).catch((err)=> {
                            return res.status(500).send({message:err.message})
                        })
                    })
                })
            })
        })
    }
}