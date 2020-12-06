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
                    description: data.description,
                    date_in: Date.now()
                }

                console.log(dataInsert)
                db.query(`insert into tbl_product set ?`, dataInsert, (err, resultAddProduct)=>{
                    if(err) {
                        if(imagePath){
                            fs.unlinkSync('./public' + imagePath)
                        }
                        console.log(err)
                        return res.status(500).send(err)
                    }
                    sql="insert into ref_product_category (product_id, category_id) values ?"
                    
                    var insertRefCategory = data.categoryRefCart.map((val,index)=>{
                        console.log(val)
                        return [
                            resultAddProduct.insertId,
                            val.value
                        ]
                    })
                    db.query(sql, [insertRefCategory], (err)=>{
                        if (err) return res.status(500).send(err)
                        db.query(`select * from tbl_product`, (err, dataProduct)=>{
                            if (err) return res.status(500).send(err)

                            sql = `select p.product_id, c.category_id, p.product_name, c.category_name
                            from tbl_category c join ref_product_category pc on c.category_id = pc.category_id
                            join tbl_product p on pc.product_id = p.product_id ;`
                            db.query(sql, (err, datarefcategory)=>{
                                if (err) return res.status(500).send(err)

                                return res.status(200).send({dataProduct, datarefcategory})
                            })
                        })
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

                sql = `select p.product_id, c.category_id, p.product_name, c.category_name
                from tbl_category c join ref_product_category pc on c.category_id = pc.category_id
                join tbl_product p on pc.product_id = p.product_id ;`
                db.query(sql, (err, datarefcategory)=>{
                    if (err) return res.status(500).send(err)
                    return res.status(200).send({dataproduct, datacategory, datarefcategory})
                })
            })
        })
    },

    getProductbySearch: (req, res)=>{
        const {key} = req.params
        let sql = `SELECT p.product_id, p.image, p.price, p.product_name, c.category_id, c.category_name FROM ref_product_category pc
        inner join tbl_product p
        on p.product_id = pc.product_id
        inner join tbl_category c
        on c.category_id = pc.category_id
        where p.product_name like '%${key}%'`
        db.query(sql, (err, dataproduct)=>{
            if (err) return res.status(500).send(err)
            return res.status(200).send(dataproduct)
        })
    },

    getProductbyId: (req, res)=>{
        const {id} = req.params
        let sql = `SELECT p.product_id, p.description, p.image, p.price, p.product_name, c.category_id, c.category_name FROM ref_product_category pc
        inner join tbl_product p
        on p.product_id = pc.product_id
        inner join tbl_category c
        on c.category_id = pc.category_id
        where p.product_id = ?`
        db.query(sql,[id],(err, dataproduct)=>{
            if (err) return res.status(500).send(err)
            return res.status(200).send(dataproduct)
        })
    },

    getProductbyPage:(req,res)=>{
        const {page} = req.params
        let sql =`select * from tbl_product limit ${(page-1)*5},8`
        db.query(sql,(err,result)=>{
            if(err)return res.status(500).send(err)
            return res.status(200).send(result)
        })
    },

    getProductbyCategory:(req,res)=>{
        const {category} = req.params
        let sql =`SELECT p.product_id, p.image, p.price, p.product_name, c.category_id, c.category_name FROM ref_product_category pc
        inner join tbl_product p
        on p.product_id = pc.product_id
        inner join tbl_category c
        on c.category_id = pc.category_id
        where c.category_id = ${db.escape(category)}`
        db.query(sql,(err,result)=>{
            if(err)return res.status(500).send(err)
            return res.status(200).send(result)
        })
    },

    getProductbyNewArrival: (req, res)=>{
        let sql = `select distinct (product_id), product_name, image, description, price, date_in from tbl_product
        order by date_in desc limit 3`
        db.query(sql, (err, dataproduct)=>{
            if (err) return res.status(500).send(err)
            return res.status(200).send(dataproduct)
        })
    },

    getProductbyPopular: (req, res)=>{
        let sql = `select p.product_id, p.product_name, p.price, avg(c.rating) as avg_rating, p.image from tbl_comment c
        inner join tbl_product p
        on p.product_id = c.product_id
        group by p.product_id
        order by avg_rating desc limit 2`
        db.query(sql, (err, dataproduct)=>{
            if (err) return res.status(500).send(err)
            return res.status(200).send(dataproduct)
        })
    },

    getCategory: (req, res)=>{
        let sql = `select * from tbl_category`
        db.query(sql, (err, category)=>{
            if (err) return res.status(500).send(err)
            return res.status(200).send(category)
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
        console.log(req.body)
        // const data = JSON.parse(req.body)
        const data = req.body
        console.log(data)
        const dataInsert = {...data, date_in: Date.now()}
        // const dataInsert = {
        //     product_id: data.product_id,
        //     location_id: data.location_id,
        //     quantity: data.quantity,
        //     date_in : Date.now(),
        //     status: data.status
        // }
        console.log(dataInsert)
        let sql = `insert into tbl_product_detail set ?`
        db.query(sql, dataInsert,(err)=>{
            if(err) return res.status(500).send(err)
            // console.log('masuk dbad')
            sql = `select p.product_name, p.image, pd.*, sum(quantity) as real_quantity
            from tbl_product p join tbl_product_detail pd on p.product_id = pd.product_id
            where location_id=${db.escape(dataInsert.location_id)} group by product_id;`
            db.query(sql, (err,results)=>{
                if(err)return res.status(500).send(err)
                return res.status(200).send(results)
            })
        })
    },

    getAllWHProduct: (req, res) => {
        let sql = `select * from tbl_product_detail`
        db.query(sql, (err,results)=>{
            if(err)return res.status(500).send(err)
            return res.status(200).send(results)
        })
    },

    getCurrentWHProduct: (req, res) => {
        const {id} = req.params //location_id
        let sql = `select p.product_name, p.image, pd.*, sum(quantity) as real_quantity from tbl_product p join tbl_product_detail pd on p.product_id = pd.product_id where location_id=${db.escape(id)} group by product_id;`
        db.query(sql, (err, dataCurrentWH)=>{
            if(err)return res.status(500).send(err)
            
            sql = `select * from tbl_product`
            db.query(sql, (err, dataMainProd)=>{
                if(err)return res.status(500).send(err)

                sql = `select p.product_name, p.image, pd.*, sum(quantity) as real_quantity
                from tbl_product p join tbl_product_detail pd on p.product_id = pd.product_id
                where location_id=${db.escape(id)} and status='on_packaging' group by product_id;`
                db.query(sql, (err, dataSoldCurrentWH)=>{
                    if(err)return res.status(500).send(err)
                    return res.status(200).send({dataCurrentWH, dataMainProd, dataSoldCurrentWH})
                })
            })
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

    addCategory: (req, res) => {
        let data = req.body
        let sql = `insert into tbl_category set ?`
            db.query(sql,data,(err)=>{
                if(err) return res.status(500).send(err)
                
                sql = `select * from tbl_category`
                db.query(sql, (err,results)=>{
                    if(err)return res.status(500).send(err)
                    return res.status(200).send(results)
                })
        })
    },

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

