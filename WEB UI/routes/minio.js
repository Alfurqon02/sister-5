const express = require('express');
const Minio = require('minio');
const multer = require('multer');
const router = express.Router();

//ANCHOR Configure MinIO client using environment variables
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

//ANCHOR Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

//ANCHOR Test MinIO connection
router.get('/test', async (req, res) => {
    try {
        console.log('Testing MinIO connection...');
        const buckets = await minioClient.listBuckets();
        console.log('MinIO test successful, buckets:', buckets);
        res.json({ success: true, message: 'MinIO server is running', buckets: buckets });
    } catch (error) {
        console.error('MinIO test error:', error);
        res.status(500).json({ success: false, error: 'MinIO server is not reachable: ' + error.message });
    }
});

//ANCHOR List all buckets
router.get('/buckets', async (req, res) => {
    try {
        console.log('Listing MinIO buckets...');
        const buckets = await minioClient.listBuckets();
        console.log('MinIO buckets listed:', buckets);
        res.json({ success: true, buckets: buckets });
    } catch (error) {
        console.error('MinIO list buckets error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

//ANCHOR Helper function to validate and normalize bucket name
function validateAndNormalizeBucketName(bucketName) {
    if (!bucketName || typeof bucketName !== 'string') {
        throw new Error('Bucket name is required');
    }
    
    // Normalize bucket name: convert to lowercase and replace invalid characters
    let normalizedName = bucketName
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, '-')  
        .replace(/^[-.]|[-.]$/g, '')     
        .replace(/[-]{2,}/g, '-')        
        .replace(/[.]{2,}/g, '.');       
    
    // Ensure minimum length
    if (normalizedName.length < 3) {
        normalizedName = normalizedName.padEnd(3, 'x');
    }
    
    // Ensure maximum length
    if (normalizedName.length > 63) {
        normalizedName = normalizedName.substring(0, 63);
    }
    
    // Final validation
    if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(normalizedName) && normalizedName.length > 1) {
        throw new Error('Bucket name contains invalid characters even after normalization');
    }
    
    return normalizedName;
}

//ANCHOR Create bucket
router.post('/buckets', async (req, res) => {
    try {
        const { bucketName } = req.body;
        console.log('Original bucket name:', bucketName);
        
        // Validate and normalize bucket name
        let normalizedBucketName;
        try {
            normalizedBucketName = validateAndNormalizeBucketName(bucketName);
            console.log('Normalized bucket name:', normalizedBucketName);
        } catch (validationError) {
            console.log('Bucket name validation failed:', validationError.message);
            return res.status(400).json({ 
                success: false, 
                error: `Invalid bucket name: ${validationError.message}. Bucket names must be lowercase, 3-63 characters, and contain only letters, numbers, dots, and hyphens.` 
            });
        }
        
        // Check if bucket exists
        console.log('Checking if bucket exists...');
        const exists = await minioClient.bucketExists(normalizedBucketName);
        console.log('Bucket exists check result:', exists);
        
        if (exists) {
            console.log('Bucket already exists');
            return res.json({ success: false, error: `Bucket '${normalizedBucketName}' already exists` });
        }
        
        console.log('Creating new bucket...');
        await minioClient.makeBucket(normalizedBucketName);
        console.log('Bucket created successfully');
        
        const message = bucketName !== normalizedBucketName 
            ? `Bucket created as '${normalizedBucketName}' (normalized from '${bucketName}')` 
            : `Bucket '${normalizedBucketName}' created successfully`;
            
        res.json({ success: true, message: message, bucketName: normalizedBucketName });
    } catch (error) {
        console.error('MinIO create bucket error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

//ANCHOR Delete bucket
router.delete('/buckets/:bucketName', async (req, res) => {
    try {
        const { bucketName } = req.params;
        console.log('Attempting to delete bucket:', bucketName);
        
        // Check if bucket exists
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            console.log('Bucket does not exist:', bucketName);
            return res.json({ success: false, error: 'Bucket does not exist' });
        }
        
        // Check if bucket is empty
        console.log('Checking if bucket is empty...');
        const objects = [];
        const stream = minioClient.listObjects(bucketName, '', true);
        
        await new Promise((resolve, reject) => {
            stream.on('data', (obj) => {
                objects.push(obj);
            });
            
            stream.on('end', () => {
                resolve();
            });
            
            stream.on('error', (err) => {
                reject(err);
            });
        });
        
        if (objects.length > 0) {
            console.log('Bucket is not empty, contains', objects.length, 'objects');
            return res.status(400).json({ 
                success: false, 
                error: `Cannot delete bucket '${bucketName}'. Bucket is not empty. It contains ${objects.length} object(s). Please delete all objects first.`,
                objectCount: objects.length
            });
        }
        
        console.log('Bucket is empty, proceeding with deletion...');
        await minioClient.removeBucket(bucketName);
        console.log('Bucket deleted successfully:', bucketName);
        res.json({ success: true, message: `Bucket '${bucketName}' deleted successfully` });
    } catch (error) {
        console.error('Delete bucket error:', error);
        
        // Handle specific MinIO/S3 errors
        if (error.code === 'BucketNotEmpty') {
            return res.status(400).json({ 
                success: false, 
                error: `Cannot delete bucket '${bucketName}'. Bucket is not empty. Please delete all objects first.` 
            });
        }
        
        res.status(500).json({ success: false, error: error.message });
    }
});

//ANCHOR Force delete bucket (empties bucket first, then deletes it)
router.delete('/buckets/:bucketName/force', async (req, res) => {
    try {
        const { bucketName } = req.params;
        console.log('Force deleting bucket:', bucketName);
        
        // Check if bucket exists
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            console.log('Bucket does not exist:', bucketName);
            return res.json({ success: false, error: 'Bucket does not exist' });
        }
        
        // Get all objects in bucket
        console.log('Getting all objects to delete...');
        const objects = [];
        const stream = minioClient.listObjects(bucketName, '', true);
        
        await new Promise((resolve, reject) => {
            stream.on('data', (obj) => {
                objects.push(obj.name);
            });
            
            stream.on('end', () => {
                resolve();
            });
            
            stream.on('error', (err) => {
                reject(err);
            });
        });
        
        // Delete all objects if any exist
        if (objects.length > 0) {
            console.log(`Deleting ${objects.length} objects from bucket...`);
            await minioClient.removeObjects(bucketName, objects);
            console.log('All objects deleted');
        }
        
        // Now delete the empty bucket
        console.log('Deleting empty bucket...');
        await minioClient.removeBucket(bucketName);
        console.log('Bucket force deleted successfully:', bucketName);
        
        res.json({ 
            success: true, 
            message: `Bucket '${bucketName}' and all its contents (${objects.length} objects) deleted successfully` 
        });
    } catch (error) {
        console.error('Force delete bucket error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

//ANCHOR List objects in bucket
router.get('/buckets/:bucketName/objects', async (req, res) => {
    try {
        const { bucketName } = req.params;
        
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            return res.json({ success: false, error: 'Bucket does not exist' });
        }
        
        const objects = [];
        const stream = minioClient.listObjects(bucketName, '', true);
        
        stream.on('data', (obj) => {
            objects.push(obj);
        });
        
        stream.on('end', () => {
            res.json({ success: true, objects: objects });
        });
        
        stream.on('error', (err) => {
            res.status(500).json({ success: false, error: err.message });
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//ANCHOR Upload file
router.post('/buckets/:bucketName/objects', upload.single('file'), async (req, res) => {
    try {
        const { bucketName } = req.params;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            return res.json({ success: false, error: 'Bucket does not exist' });
        }
        
        const objectName = req.body.objectName || file.originalname;
        
        await minioClient.putObject(bucketName, objectName, file.buffer, file.size, {
            'Content-Type': file.mimetype
        });
        
        res.json({ 
            success: true, 
            message: `File '${objectName}' uploaded successfully to bucket '${bucketName}'`,
            objectName: objectName,
            size: file.size
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//ANCHOR Upload text content
router.post('/buckets/:bucketName/text', async (req, res) => {
    try {
        const { bucketName } = req.params;
        const { objectName, content } = req.body;
        
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            return res.json({ success: false, error: 'Bucket does not exist' });
        }
        
        const buffer = Buffer.from(content, 'utf8');
        
        await minioClient.putObject(bucketName, objectName, buffer, buffer.length, {
            'Content-Type': 'text/plain'
        });
        
        res.json({ 
            success: true, 
            message: `Text content uploaded successfully as '${objectName}' to bucket '${bucketName}'`,
            objectName: objectName,
            size: buffer.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//ANCHOR Download/Get object
router.get('/buckets/:bucketName/objects/:objectName', async (req, res) => {
    try {
        const { bucketName, objectName } = req.params;
        
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            return res.json({ success: false, error: 'Bucket does not exist' });
        }
        
        const stream = await minioClient.getObject(bucketName, objectName);
        
        // Set appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename="${objectName}"`);
        
        stream.pipe(res);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//ANCHOR Get object content as text
router.get('/buckets/:bucketName/objects/:objectName/text', async (req, res) => {
    try {
        const { bucketName, objectName } = req.params;
        
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            return res.json({ success: false, error: 'Bucket does not exist' });
        }
        
        const stream = await minioClient.getObject(bucketName, objectName);
        
        let content = '';
        stream.on('data', (chunk) => {
            content += chunk.toString();
        });
        
        stream.on('end', () => {
            res.json({ success: true, content: content });
        });
        
        stream.on('error', (err) => {
            res.status(500).json({ success: false, error: err.message });
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//ANCHOR Delete object
router.delete('/buckets/:bucketName/objects/:objectName', async (req, res) => {
    try {
        const { bucketName, objectName } = req.params;
        
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            return res.json({ success: false, error: 'Bucket does not exist' });
        }
        
        await minioClient.removeObject(bucketName, objectName);
        res.json({ success: true, message: `Object '${objectName}' deleted successfully from bucket '${bucketName}'` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;