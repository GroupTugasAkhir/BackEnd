const Router = require('express').Router()
const {ReportControllers} = require('../controllers')

Router.get('/getuser',ReportControllers.reportUser)

module.exports = Router