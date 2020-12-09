const Router = require('express').Router()
const {NotificationControllers} = require('../controllers')

Router.post('/createRequest',NotificationControllers.checkCompletePayment)
Router.post('/getRequest',NotificationControllers.getRequestNotification)
Router.post('/requestNotificationDetail',NotificationControllers.requestNotificationDetail)
Router.get('/checkBeforeRequest',NotificationControllers.checkBeforeRequest)
Router.get('/getTransaction/:location_id',NotificationControllers.getTransaction)
Router.post('/getTransactionDetail',NotificationControllers.getTransactionDetail)
Router.post('/requestHandling',NotificationControllers.requestHandling)
Router.post('/confirmRequest',NotificationControllers.confirmingRequest)
Router.post('/confirmUserRequest',NotificationControllers.confirmUserReq)
Router.post('/onPackagingItem',NotificationControllers.onPackagingItem)
Router.post('/onWaitingItem',NotificationControllers.onWaitingItem)

module.exports = Router