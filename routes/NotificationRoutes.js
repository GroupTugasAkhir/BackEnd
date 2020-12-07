const Router = require('express').Router()
const {NotificationControllers} = require('../controllers')

Router.post('/createRequest',NotificationControllers.checkCompletePayment)
// Router.post('/getTrx',CartControllers.userTrxOnCart)
// Router.post('/updateCart',CartControllers.updateCart)
// Router.post('/deleteCart',CartControllers.deleteCart)
// Router.get('/cartLength/:user_id',CartControllers.getCartLength)
// Router.get('/userCart/:user_id',CartControllers.userCartData)

module.exports = Router