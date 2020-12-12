const Router = require('express').Router()
const {UserOrdersControllers} = require('../controllers')
// const {auth} = require('./../helpers/Auth')


Router.get('/getOrders/:id', UserOrdersControllers.getOrderDetails)
Router.get('/getCurrentOrder/:id', UserOrdersControllers.getSelectedOrder)
Router.post('/completeOrder', UserOrdersControllers.completeOrder)

// Completed order
Router.get('/getCompleted/:id', UserOrdersControllers.getCompleted)
Router.get('/getRating/:idUs/:idPr', UserOrdersControllers.getRating)

module.exports = Router