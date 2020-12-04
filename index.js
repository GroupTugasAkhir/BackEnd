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

const {authRoutes, ProductRoutes, CartRoutes} = require('./routes')

app.use('/auth',authRoutes)
app.use('/product', ProductRoutes)
app.use('/cart', CartRoutes)

app.listen(5001,()=>console.log('port 5001 is active'))
