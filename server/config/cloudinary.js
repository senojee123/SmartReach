import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../public/uploads');

// Verify if Cloudinary config variables exist in the environment
const hasCloudinaryConfig = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// Initialize Cloudinary if configs are present
if (hasCloudinaryConfig()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary Storage Service Configured.');
} else {
  // Ensure the local uploads directory exists (skip on Vercel to prevent read-only crashes)
  if (!process.env.VERCEL && !fs.existsSync(UPLOADS_DIR)) {
    try {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    } catch (err) {
      console.warn('Failed to create local uploads directory:', err.message);
    }
  }
  console.log('======================================================================');
  console.log('  Cloudinary environment credentials not found.');
  console.log(`  FALLBACK ENABLING: Storing files locally in '${UPLOADS_DIR}'.`);
  console.log('======================================================================');
}

/**
 * Uploads file to Cloudinary or saves locally if fallback mode is active.
 * @param {Object} file Multer file object
 * @returns {Promise<Object>} Contains fileUrl, publicId, fileSize, duration, etc.
 */
export const uploadFile = async (file) => {
  if (hasCloudinaryConfig()) {
    return new Promise((resolve, reject) => {
      const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
      
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: 'smartreach',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(new Error(`Cloudinary upload failed: ${error.message}`));
          }
          resolve({
            fileUrl: result.secure_url,
            publicId: result.public_id,
            fileSize: result.bytes,
            duration: result.duration ? Math.round(result.duration) : 0,
            assetType: resourceType === 'video' ? 'Video' : 'Image'
          });
        }
      );
      
      uploadStream.end(file.buffer);
    });
  } else {
    // Local fallback logic
    const uniqueFilename = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFilename);
    
    // Save file buffer to local disk
    fs.writeFileSync(filePath, file.buffer);
    
    const fileUrl = `${process.env.APP_URL || 'http://localhost:5000'}/uploads/${uniqueFilename}`;
    const assetType = file.mimetype.startsWith('video/') ? 'Video' : 'Image';
    
    // Mock video duration as 15 seconds if it is a video
    const duration = assetType === 'Video' ? 15 : 0;
    
    return {
      fileUrl,
      publicId: `local-${uniqueFilename}`,
      fileSize: file.size,
      duration,
      assetType
    };
  }
};

/**
 * Deletes file from Cloudinary or local disk.
 * @param {string} publicId File identifier
 * @param {string} assetType Image or Video
 * @returns {Promise<boolean>}
 */
export const deleteFile = async (publicId, assetType) => {
  if (hasCloudinaryConfig() && !publicId.startsWith('local-')) {
    try {
      const resourceType = assetType.toLowerCase() === 'video' ? 'video' : 'image';
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return result.result === 'ok';
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error.message);
      return false;
    }
  } else {
    // Local fallback logic
    try {
      const filename = publicId.replace('local-', '');
      const filePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting local file:', error.message);
      return false;
    }
  }
};
