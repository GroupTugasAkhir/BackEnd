const Router = require('express').Router()
const {ProductControllers} = require('./../controllers')
// const {auth} = require('./../helpers/Auth')

Router.post('/addProduct', ProductControllers.addProduct)
Router.get('/getProduct', ProductControllers.getProduct)

module.exports = Router