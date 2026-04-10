import 'dotenv/config'
import express from 'express'
import itemRoutes from './routes/itemRoutes.js'
import requetRoutes from './routes/requetRoutes.js'

const app = express()

app.use(express.json())

app.use('/api/items', itemRoutes)
app.use('/api/requests', requetRoutes)

export default app