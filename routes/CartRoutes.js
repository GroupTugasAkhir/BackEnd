const Router = require('express').Router()
const {CartControllers} = require('./../controllers')

Router.get('/getCart/:user_id',CartControllers.getCart)
Router.post('/getTrx',CartControllers.userTrxOnCart)
Router.post('/updateCart',CartControllers.updateCart)
Router.post('/deleteCart',CartControllers.deleteCart)
Router.get('/cartLength/:user_id',CartControllers.getCartLength)
Router.get('/userCart/:user_id',CartControllers.userCartData)

module.exports = Router