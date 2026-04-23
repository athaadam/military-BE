import 'dotenv/config'
import express from 'express'
import itemRoutes from './routes/itemRoutes.js'
import requetRoutes from './routes/requetRoutes.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import returnRoutes from './routes/returnRoutes.js'

const app = express()

app.use(express.json())

app.use('/api/items', itemRoutes)
app.use('/api/requests', requetRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/returns', returnRoutes)

export default app