import 'dotenv/config'
import express from 'express'
import itemRoutes from './routes/itemRoutes.js'

import requestRoutes from './routes/requestRoutes.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import returnRoutes from './routes/returnRoutes.js'
import unitRoutes from './routes/unitRoutes.js'
import warehouseRoutes from './routes/warehouseRoutes.js'
const app = express()

app.use(express.json())

app.use('/api/items', itemRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/returns', returnRoutes)
app.use('/api/units', unitRoutes)
app.use('/api/warehouses', warehouseRoutes)
export default app