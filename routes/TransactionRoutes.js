const Router = require('express').Router()
const {TransactionControllers} = require('./../controllers')

Router.post('/onpaycc', TransactionControllers.onpaycc)

module.exports = Router