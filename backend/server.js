require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const mainRoutes = require('./routes/index');
const userRoutes = require('./routes/userRoutes');

app.use('/api', mainRoutes);
app.use('/api/users', userRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('Dating App Backend is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
