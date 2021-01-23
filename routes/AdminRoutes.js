const Router = require('express').Router()
const {AdminControllers} = require('../controllers')
// const {auth} = require('./../helpers/Auth')

//For Superadmin : Main Product
Router.post('/addProduct', AdminControllers.addProduct)
Router.get('/getProduct', AdminControllers.getProduct)
Router.get('/getProductStock/:id', AdminControllers.getProductandStock)
Router.get('/getStock/:id', AdminControllers.getStock)
Router.put('/editProduct/:id', AdminControllers.editProduct)
Router.delete('/deleteProduct/:id', AdminControllers.deleteProduct)

//For Home Page
Router.get('/getAllProductCount', AdminControllers.getAllProductCount)
Router.get('/getCategProductCount', AdminControllers.getCategProductCount)
Router.get('/getProduct/:id', AdminControllers.getProductbyId)
Router.get('/getProductbyPage/:page', AdminControllers.getProductbyPage)
Router.get('/getAllProductMobile', AdminControllers.getAllProductMobile)
Router.get('/getProductbyCategory', AdminControllers.getProductbyCategory)
// Router.get('/getProductbyCategory/:category', AdminControllers.getProductbyCategory)
Router.get('/getProductbySearch/:key', AdminControllers.getProductbySearch)
Router.get('/newArrival', AdminControllers.getProductbyNewArrival)
Router.get('/popular', AdminControllers.getProductbyPopular)
Router.get('/category', AdminControllers.getCategory)
Router.get('/getProductbywh/:prodID', AdminControllers.getProductbywh)

//For warehouse product
Router.post('/addWHProduct', AdminControllers.addWHProduct) 
Router.get('/getWHProduct', AdminControllers.getAllWHProduct)
Router.get('/getCurrentWHProduct/:id', AdminControllers.getCurrentWHProduct)

//For category
Router.post('/addCategory', AdminControllers.addCategory)
Router.put('/editCategory/:id', AdminControllers.editCategory)
Router.delete('/deleteCategory/:id', AdminControllers.deleteCategory)

//For user management
Router.get('/getwhlocation', AdminControllers.getWHLocation)
Router.post('/createAdminWH', AdminControllers.createAdminWH)
Router.get('/getalladminWH', AdminControllers.getalladminWH)

//For Transaction Log Super Admin
Router.get('/getWHActivityLog', AdminControllers.getWHActivityLog)
Router.get('/getWHTrackingLog', AdminControllers.getWHTrackingLog)
Router.get('/getTrxUser', AdminControllers.getTrxUser)
Router.get('/getTrxDetailById/:id', AdminControllers.getTrxDetailById)
Router.get('/getTrxTrackingById/:idTrx/:idLoc', AdminControllers.getTrxTrackingById)
Router.get('/getSupplyFlow/:id', AdminControllers.getSupplyFlow)
Router.get('/getPaymentCheck/:id', AdminControllers.getPaymentCheck)
Router.put('/acceptPaymentTrf/:id', AdminControllers.acceptPaymentTrf)
Router.put('/rejectPaymentTrf/:id', AdminControllers.rejectPaymentTrf)

module.exports = Router