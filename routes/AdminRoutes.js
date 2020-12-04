const Router = require('express').Router()
const {AdminControllers} = require('../controllers')
// const {auth} = require('./../helpers/Auth')

Router.post('/addProduct', AdminControllers.addProduct)
Router.get('/getProduct', AdminControllers.getProduct)
Router.put('/editProduct/:id', AdminControllers.editProduct)
Router.delete('/deleteProduct/:id', AdminControllers.deleteProduct)

//For warehouse product
Router.post('/addWHProduct', AdminControllers.addWHProduct) 
Router.get('/getWHProduct', AdminControllers.getWHProduct)
Router.put('/editWHProduct/:id', AdminControllers.editWHProduct)
Router.delete('/deleteWHProduct/:id', AdminControllers.deleteWHProduct)

//For category
Router.put('/editCategory/:id', AdminControllers.editCategory)
Router.delete('/deleteCategory/:id', AdminControllers.deleteCategory)

module.exports = Router