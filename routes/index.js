const authRoutes = require('./authRoutes')
const AdminRoutes = require('./AdminRoutes')

module.exports = {
    authRoutes,
    AdminRoutes,
    CartRoutes: require('./CartRoutes')
}