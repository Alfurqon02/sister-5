require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

//ANCHOR Import routes
const soapRoutes = require('./routes/soap');
const minioRoutes = require('./routes/minio');

const app = express();
const PORT = process.env.WEB_UI_PORT || 3000;

//ANCHOR Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//ANCHOR Serve static files
app.use(express.static(path.join(__dirname, 'public')));

//ANCHOR API Routes
app.use('/api/soap', soapRoutes);
app.use('/api/minio', minioRoutes);

//ANCHOR Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://${process.env.WEB_UI_HOST || 'localhost'}:${PORT}`);
    console.log('Make sure the following services are running:');
    console.log(`- SOAP API server on ${process.env.SOAP_URL || 'http://localhost:8000'}`);
    console.log(`- MinIO server on http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9000}`);
});