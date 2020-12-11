const Router = require('express').Router()
const {UserOrdersControllers} = require('../controllers')
// const {auth} = require('./../helpers/Auth')


Router.get('/getOrders/:id', UserOrdersControllers.getOrderDetails)
Router.get('/getCurrentOrder/:id', UserOrdersControllers.getSelectedOrder)
Router.post('/completeOrder', UserOrdersControllers.completeOrder)

module.exports = Router