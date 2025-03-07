const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors =  require('cors')
const path = require('path');
const cookieparser = require('cookie-parser')
// const multer = require('multer');
// const {fileURLToPath} = require('url');

// Basic Initalisation
const app = express();

// To parse JSON request bodies
app.use(express.json());

app.use(express.urlencoded({ extended: true })); 
app.use(cookieparser());

const PORT = process.env.PORT || 3000;
const routes = require('./routes/index.js');

// Database connection - Connect to MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Connected to MongoDB Atlas');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB Atlas: ', error);
  });

// CORS Settings
const allowedOrigins = [
  'https://attendance-frontend-88xi.vercel.app',
  'https://attendance-frontend-one.vercel.app',
  'http://localhost:5173',
  process.env.CLIENT_URL,
];

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });


app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// app.use(cors(corsOptions));

// File storage .
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes will be written here 
// app.use('/', admin);

app.use('/', routes);


// App Start

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

 app.get("/", (req, res) => {
   res.send("Hello, Vercel!");
 });

 module.exports = app;  
