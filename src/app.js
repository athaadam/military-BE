import express from 'express'
import itemRoutes from './routes/itemRoutes.js'
import requestRoutes from './routes/requestRoutes.js'

const app = express()

app.use(express.json())

app.use('/api/items', itemRoutes)
app.use('/api/requests', requestRoutes)

export default app