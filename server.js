const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === '.csv') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
});

// Routes

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload CSV endpoint
app.post('/api/upload', upload.single('csvFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        const filePath = req.file.path;
        const csvData = fs.readFileSync(filePath, 'utf8');

        // Parse CSV
        const rows = csvData.split('\n').filter(row => row.trim());
        const headers = rows[0].split(',').map(h => h.trim());
        
        const parsedData = rows.slice(1).map(row => {
            const values = row.split(',');
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index]?.trim() || '';
            });
            return obj;
        }).filter(row => row.work_year);

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            message: `Successfully loaded ${parsedData.length} records`,
            data: parsedData,
            recordCount: parsedData.length
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing file: ' + error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB.'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'File upload error: ' + err.message
        });
    }
    
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║   Secure Salary Dashboard Server              ║
║   Running on http://localhost:${PORT}         ║
╚════════════════════════════════════════════════╝
    `);
    console.log('✓ Server is ready');
    console.log('✓ Static files served from: public/');
    console.log('✓ File uploads directory: uploads/');
    console.log('\nEndpoints:');
    console.log('  GET  / - Main dashboard');
    console.log('  POST /api/upload - Upload CSV file');
    console.log('  GET  /api/health - Health check');
    console.log('\n');
});

module.exports = app;