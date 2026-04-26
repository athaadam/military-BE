<<<<<<< HEAD
import app from './src/app.js'
=======
require('dotenv').config();
const app = require('./src/app');
const db = require('./src/db'); // Initialize database connection
>>>>>>> 8da931236db4aa5c4387a28a13fc4a3bdba18b30

const PORT = 3000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})