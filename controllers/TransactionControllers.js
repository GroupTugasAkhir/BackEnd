const { db } = require('./../connection')
const fs = require('fs')
const {uploader} = require('./../helpers/uploader')
const haversine = require('haversine')


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

            // sql = `select * from tbl_location where longitude = ? and latitude = ?`
            // db.query(sql, [matchLoc.longitude, matchLoc.latitude], (err, locationRes)=> {
            sql = `select * from tbl_location`
            db.query(sql, (err, locationRes)=> {
                if (err) return res.status(500).send({message:err.message})

                // haversine cek distance
                let start = {
                    latitude : matchLoc.longitude,
                    longitude : matchLoc.latitude
                }

                let comparison = locationRes.filter((val)=>{
                    return val.longitude !== matchLoc.longitude && val.latitude !== matchLoc.latitude
                })

                let init_location = locationRes.filter((val)=>{
                    return val.longitude === matchLoc.longitude && val.latitude === matchLoc.latitude
                })

                let end = {}
                let distance = 0
                let alternateBranch = comparison.map((val)=>{
                    end = {
                        latitude : val.latitude,
                        longitude : val.longitude
                    }
                    distance = haversine(start,end)
                    return {
                        location_id : val.location_id,
                        distance
                    }
                }) 
                alternateBranch.sort((a,b) => (a.distance > b.distance) ? 1 : ((b.distance > a.distance) ? -1 : 0)); 
                let alternateToString=''
                alternateBranch.map((val)=>{
                    alternateToString += `${val.location_id}, `
                })
                console.log(alternateBranch)
                console.log(alternateToString)
                // haversine cek distance

                sql = `update tbl_transaction set ? where transaction_id = ${db.escape(idtrans)}`
                let updateTransData = {
                    date_in: Date.now(),
                    status: 'paymentCompleted',
                    payment_proof,
                    // location_id: locationRes[0].location_id,
                    location_id: init_location[0].location_id,
                    method: 'cc',
                    notes: 'noread',
                    alternate_branch: alternateToString,
                }
        
                db.query(sql, updateTransData, (err)=> {
                    if (err) return res.status(500).send({message:err.message})

                    let newArray = []
                    userCart.forEach(val=> {
                        newArray.push(updateQuery(`update tbl_transaction_detail set price = ${val.price} where transaction_id = ${val.idtrans} and product_id = ${val.idprod}`))
                    })

                    Promise.all(newArray).then(()=> {
                        console.log('succeed');
                        // return res.send('succeed') //tidak perlu getcart lagi karena jika berhasil, di front otomatis kosong
                        let insertLogTrans = {
                            activities: 'tbl_transaction',
                            status: updateTransData.status,
                            date_in: Date.now(),
                            user_id: user_id,
                            transaction_id: idtrans
                        }
                        sql = `insert into tbl_log_transaction set ?`
                        db.query(sql, insertLogTrans, (err)=>{
                            if (err) return res.status(500).send({message:err.message})

                            sql = `select distinct t.transaction_id, t.date_in as trans_code,t.status, t.user_id, t.notes as notes_read
                            , lt.log_id, max(lt.date_in) as date_newest, lt.notes, lt.transaction_id as trans_id
                            from (select * from tbl_transaction where notes != 'read' and status!='onCart') as t left join 
                            (select * from tbl_log_transaction where status not in('request', 'confirm')) as lt
                            on t.transaction_id=lt.transaction_id where t.user_id=?
                            group by t.transaction_id order by lt.date_in desc limit 5;`
                    
                            db.query(sql, [user_id], (err, dataNotif)=>{
                                if (err) return res.status(500).send({message:err.message})
                                
                                return res.status(200).send({
                                    cart: 'succeed',
                                    dataNotif
                                })
                            })

                        })
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
                    console.log(locationRes[0]);
                    sql = `update tbl_transaction set ? where transaction_id = ${db.escape(invoiceData.idtrans)}`
                    let updateTransData = {
                        date_in: Date.now(),
                        status: 'waitingAdminConfirmation',
                        payment_proof: invoicePath,
                        location_id: locationRes[0].location_id,
                        method: 'transfer',
                        notes: 'noread'
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
                            // return res.send('succeed') //tidak perlu getcart lagi karena jika berhasil, di front otomatis kosong

                            let insertLogTrans = {
                                activities: 'tbl_transaction',
                                status: updateTransData.status,
                                date_in: Date.now(),
                                user_id: invoiceData.user_id,
                                transaction_id: invoiceData.idtrans
                            }
                            sql = `insert into tbl_log_transaction set ?`
                            db.query(sql, insertLogTrans, (err)=>{
                                if (err) return res.status(500).send({message:err.message})
    
                                sql = `select distinct t.transaction_id, t.date_in as trans_code,t.status, t.user_id, t.notes as notes_read
                                , lt.log_id, max(lt.date_in) as date_newest, lt.notes, lt.transaction_id as trans_id
                                from (select * from tbl_transaction where notes != 'read' and status!='onCart') as t left join 
                                (select * from tbl_log_transaction where status not in('request', 'confirm')) as lt
                                on t.transaction_id=lt.transaction_id where t.user_id=?
                                group by t.transaction_id order by lt.date_in desc limit 5;`
                        
                                db.query(sql, [invoiceData.user_id], (err, dataNotif)=>{
                                    if (err) return res.status(500).send({message:err.message})
                                    
                                    return res.status(200).send({
                                        cart: 'succeed',
                                        dataNotif
                                    })
                                })
    
                            })
                        }).catch((err)=> {
                            return res.status(500).send({message:err.message})
                        })
                    })
                })
            })
        })
    }
}