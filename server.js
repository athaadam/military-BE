require('dotenv').config();
const app = require('./src/app');
const db = require('./src/db'); // Initialize database connection

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server jalan di port ${PORT}`);
});