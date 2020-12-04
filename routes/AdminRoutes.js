const Router = require('express').Router()
const {AdminControllers} = require('../controllers')
// const {auth} = require('./../helpers/Auth')

Router.post('/addProduct', AdminControllers.addProduct)
Router.get('/getProduct', AdminControllers.getProduct)
Router.get('/getProductbyPage/:page', AdminControllers.getProductbyPage)
Router.get('/getProduct/:category', AdminControllers.getProductbyCategory)
Router.get('/newArrival', AdminControllers.getProductbyNewArrival)
Router.get('/popular', AdminControllers.getProductbyPopular)
Router.get('/category', AdminControllers.getCategory)
Router.put('/editProduct/:id', AdminControllers.editProduct)
Router.delete('/deleteProduct/:id', AdminControllers.deleteProduct)

//For warehouse product
Router.post('/addWHProduct', AdminControllers.addWHProduct) 
Router.get('/getWHProduct', AdminControllers.getWHProduct)
Router.put('/editWHProduct/:id', AdminControllers.editWHProduct)
Router.delete('/deleteWHProduct/:id', AdminControllers.deleteWHProduct)

module.exports = Router