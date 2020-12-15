const Router = require('express').Router()
const {ReportControllers} = require('../controllers')

Router.get('/getuser',ReportControllers.reportUser)
Router.get('/getproduct',ReportControllers.reportProduct)
Router.get('/getbranch',ReportControllers.reportBranch)
Router.get('/gettransactions',ReportControllers.reportTransaction)
Router.get('/gettrxbranch',ReportControllers.getTotalTrxPerBranch)

module.exports = Router