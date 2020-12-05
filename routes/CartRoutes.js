const Router = require('express').Router()
const {CartControllers} = require('./../controllers')

Router.get('/getCart/:user_id',CartControllers.getCart)
Router.post('/updateCart',CartControllers.updateCart)
Router.post('/deleteCart',CartControllers.deleteCart)

module.exports = Router