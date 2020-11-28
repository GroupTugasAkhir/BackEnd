const express = require('express')
const app = express()

app.use(express.static('public'))

const bodyParser = require('body-parser')
app.use(bodyParser.json())

const cors = require('cors')

const bearerToken = require('express-bearer-token')

require('dotenv').config()

app.use(cors())
app.use(bearerToken())

const {authRoutes} = require('./routes')
app.use('/auth',authRoutes)

app.listen(5001,()=>console.log('port 5000 is active'))