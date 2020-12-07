const Router = require('express').Router()
const {NotificationControllers} = require('../controllers')

Router.post('/createRequest',NotificationControllers.checkCompletePayment)
Router.get('/getRequest',NotificationControllers.getRequestNotification)
Router.get('/checkBeforeRequest',NotificationControllers.checkBeforeRequest)
Router.post('/requestHandling',NotificationControllers.requestHandling)
Router.post('/confirmRequest',NotificationControllers.confirmingRequest)

module.exports = Router