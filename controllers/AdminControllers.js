const {db} = require('../connection')
const {uploader} = require('../helpers/uploader')
const fs = require('fs')

module.exports = {
    addProduct: (req, res) => {
        try {
            // console.log('asas')
            const path = '/product'
            const upload = uploader(path, 'PROD').fields([{name: 'image'}])
            upload(req, res, (err)=>{
                if (err){
                    return res.status(500).json({message: 'Upload picture failed', error: err.message})
                }
                console.log('berhasil upload')
                const {image} = req.files
                console.log(image)
                const imagePath = image ? path + '/' + image[0].filename : null
                console.log(imagePath)
                console.log(req.body.data)
                const data = JSON.parse(req.body.data)
                let dataInsert = {
                    product_name: data.product_name,
                    price: data.price,
                    image:imagePath,
                    description: data.description
                }
                console.log(dataInsert)
                db.query(`insert into tbl_product set ?`, dataInsert, (err)=>{
                    if(err) {
                        if(imagePath){
                            fs.unlinkSync('./public' + imagePath)
                        }
                        return res.status(500).send(err)
                    }
                    db.query(`select * from tbl_product`, (err, dataProduct)=>{
                        if (err) return res.status(500).send(err)
                        return res.status(200).send(dataProduct)
                    })
                })
            })
        }catch(error){
            console.log('eror')
            return res.status(500).send(error)
        }
    },

    getProduct: (req, res)=>{
        // get product and category
        let sql = `select * from tbl_product`
        db.query(sql, (err, dataproduct)=>{
            if (err) return res.status(500).send(err)
            
            sql = `select * from tbl_category`
            db.query(sql, (err, datacategory)=>{
                if (err) return res.status(500).send(err)
                return res.status(200).send({dataproduct, datacategory})
            })
        })
    },

    editProduct: (req, res)=>{
        const {id} = req.params
        let sql = `Select * from tbl_product where product_id = ${db.escape(id)}`
        db.query(sql, (err, results)=>{
            if(err)return res.status(500).send(err)

            if(results.length){
                try{
                    console.log('try editprod')
                    const path = '/product'
                    const upload = uploader(path, 'PROD').fields([{name: 'image'}])
                    upload(req, res, (err)=>{
                        if (err){
                            return res.status(500).json({message: 'Upload picture failed', error: err.message})
                        }
                        console.log('berhasil upload edit')
                        const {image} = req.files
                        // console.log(image)
                        const imagePath = image ? path + '/' + image[0].filename : null
                        // console.log(imagePath)
                        // console.log(req.body.data)
                        const data = JSON.parse(req.body.data)
                        let dataUpdate = {
                            product_name: data.product_name,
                            price: data.price,
                            image:imagePath,
                            description: data.description
                        }
                        console.log(dataUpdate)
                        sql = `Update tbl_product set ? where product_id = ${db.escape(id)}`
                        console.log('sini')
                        db.query(sql, dataUpdate, (err)=>{
                            if(err) {
                                if(imagePath){
                                    fs.unlinkSync('./public' + imagePath)
                                }
                                return res.status(500).send(err)
                            }

                            if(imagePath) { // hapus foto lama
                                if(results[0].image){
                                    fs.unlinkSync('./public'+ results[0].image)
                                }
                            }

                            // console.log('asadaa')
                            sql = `Select * from tbl_product`
                            db.query(sql, (err, allProducts)=>{
                                if(err)return res.status(500).send(err)
                                return res.status(200).send(allProducts)
                            })
                        })
                    })
                }catch(error){
                    console.log('eror')
                    return res.status(500).send(error)
                }
            }else{
                return res.status(500).send('product tidak ada')
            }
        })
    },

    deleteProduct: (req, res) => {
        const {id} = req.params
        let sql = `select * from tbl_product where product_id = ${db.escape(id)}`
        db.query(sql, (err, dataproduct)=>{
            if(err) return res.status(500).send(err)
            if(dataproduct.length){
                sql = `delete from tbl_product where product_id = ${db.escape(id)}`
                db.query(sql, (err)=>{
                    if(err) return res.status(500).send(error)

                    if(dataproduct[0].image){
                        fs.unlinkSync('./public'+ dataproduct[0].image)
                    }
                    sql = `select * from tbl_product`
                    db.query(sql, (err, allproduct)=>{
                        if (err) return res.status(500).send(err)
                        return res.status(200).send(allproduct)
                    })
                })
            }else{
                return res.status(500).send('product tidak ada')
            }
        })
    },

    //=========================================PRODUCT GUDANG========================================

    addWHProduct: (req, res) => {
        let data = req.body
        let sql = `insert into tbl_product_detail set ?`
            db.query(sql,data,(err)=>{
                if(err) return res.status(500).send(err)
                console.log('masuk dbad')
                sql = `select * from tbl_product_detail`
                db.query(sql, (err,results)=>{
                    if(err)return res.status(500).send(err)
                    return res.status(200).send(results)
                })
        })
    },

    getWHProduct: (req, res) => {
        let sql = `select * from tbl_product_detail`
        db.query(sql, (err,results)=>{
            if(err)return res.status(500).send(err)
            return res.status(200).send(results)
        })
    },

    editWHProduct: (req, res) => {
        let data = req.body
        const {id} = req.params
        let sql = `Select * from tbl_product_detail where product_detail_id = ${db.escape(id)}`
        db.query(sql, (err, results)=>{
            if(err)return res.status(500).send(err)

            if(results.length){
                sql = `Update tbl_product_detail set ? where product_detail_id = ${db.escape(id)}`
                console.log('sini')
                db.query(sql, data, (err)=>{
                    if(err)return res.status(500).send(err)
                    console.log('asadaa')
                    sql = `Select * from tbl_product_detail`
                    db.query(sql, (err, allProducts)=>{
                        if(err)return res.status(500).send(err)
                        return res.status(200).send(allProducts)
                    })
                })
            }else{
                return res.status(500).send('product tidak ada')
            }
        })
    },

    deleteWHProduct: (req, res) => {
        const {id} = req.params
        let sql = `Select * from tbl_product_detail where product_detail_id = ${db.escape(id)}`
        db.query(sql, (err, dataProduct)=>{
            if(err)return res.status(500).send(err)
            if(dataProduct.length){
                sql = `delete from tbl_product_detail where product_detail_id = ${db.escape(id)}`
                db.query(sql, (err)=>{
                    if(err)return res.status(500).send(err)

                    sql = `Select * from tbl_product_detail`
                    db.query(sql, (err, allProducts)=>{
                        if(err)return res.status(500).send(err)
                        return res.status(200).send(allProducts)
                    })
                })
            }else{
                return res.status(500).send('product tidak ada')
            }
        })
    },

    //========================================= CATEGORY ========================================

    editCategory: (req, res)=>{
        let data = req.body
        const {id} = req.params
        let sql = `Select * from tbl_category where category_id = ${db.escape(id)}`
        db.query(sql, (err, results)=>{
            if(err)return res.status(500).send(err)

            if(results.length){
                sql = `Update tbl_category set ? where category_id = ${db.escape(id)}`
                db.query(sql, data, (err)=>{
                    if(err)return res.status(500).send(err)
                    sql = `Select * from tbl_category`
                    db.query(sql, (err, categories)=>{
                        if(err)return res.status(500).send(err)
                        return res.status(200).send(categories)
                    })
                })
            }else{
                return res.status(500).send('category tidak ada')
            }
        })
    },

    deleteCategory: (req, res) => {
        const {id} = req.params
        let sql = `Select * from tbl_category where category_id = ${db.escape(id)}`
        db.query(sql, (err, results)=>{
            if(err)return res.status(500).send(err)
            if(results.length){
                sql = `delete from tbl_category where category_id = ${db.escape(id)}`
                db.query(sql, (err)=>{
                    if(err)return res.status(500).send(err)

                    sql = `Select * from tbl_category`
                    db.query(sql, (err, categories)=>{
                        if(err)return res.status(500).send(err)
                        return res.status(200).send(categories)
                    })
                })
            }else{
                return res.status(500).send('category tidak ada')
            }
        })
    },
}

