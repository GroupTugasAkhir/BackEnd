const Router = require('express').Router()
const {ProductControllers} = require('./../controllers')
// const {auth} = require('./../helpers/Auth')

Router.post('/addProduct', ProductControllers.addProduct)
Router.get('/getProduct', ProductControllers.getProduct)
Router.put('/editProduct/:id', ProductControllers.editProduct)
Router.delete('/deleteProduct/:id', ProductControllers.deleteProduct)

module.exports = Router