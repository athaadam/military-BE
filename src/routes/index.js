const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
  res.json({ message: 'API route jalan 🚀' });
});


module.exports = router;