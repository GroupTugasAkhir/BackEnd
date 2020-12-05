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

app.get('/', (req, res)=>{
    res.send('<h1> Welcome to API AKEI</h1>')
})

const {authRoutes, AdminRoutes, CartRoutes, TransactionRoutes} = require('./routes')

app.use('/auth',authRoutes)
app.use('/admin', AdminRoutes)
app.use('/cart', CartRoutes)
app.use('/transaction', TransactionRoutes)

app.listen(5001,()=>console.log('port 5001 is active'))
