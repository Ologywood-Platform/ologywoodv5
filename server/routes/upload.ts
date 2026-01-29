/**
 * File Upload Route
 * Handles file uploads to S3 without multer
 */

import { Router, Request, Response } from 'express';
import { storagePut } from '../services/storage';

const router = Router();

/**
 * POST /api/upload
 * Upload a file to S3
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Get the file from the request body (FormData sends as multipart)
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    // For now, we'll accept the raw body as the file
    // In production, you'd want to use a proper multipart parser
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'No file data provided' });
    }

    // Get the file buffer from the request
    let fileBuffer: Buffer;
    let mimeType = 'image/jpeg';

    // Try to extract file from FormData
    // Since we're using express.json(), we need to handle this differently
    // For now, return a placeholder that the client can handle
    
    return res.status(400).json({ 
      error: 'File upload requires proper multipart handling',
      message: 'Please try again'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: 'Failed to upload file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
