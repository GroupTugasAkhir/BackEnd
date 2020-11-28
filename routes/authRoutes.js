const Router = require('express').Router()
const {authControllers} = require('./../controllers')
const {auth} = require('./../helpers/auth')

Router.post('/register',authControllers.register)
Router.post('/login',authControllers.login)
Router.get('/verified',auth,authControllers.verified)
Router.get('/keepLogin/:user_id',authControllers.keepLogin)


module.exports = Router