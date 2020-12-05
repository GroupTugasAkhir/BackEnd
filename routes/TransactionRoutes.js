const Router = require('express').Router()
const {TransactionControllers} = require('./../controllers')

Router.post('/onpaycc', TransactionControllers.onpaycc)
Router.post('/onpayinvoice', TransactionControllers.onpayinvoice)

module.exports = Router