const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY);
console.log("API Secret Loaded:", !!process.env.CLOUDINARY_API_SECRET);


const storage    = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only image files allowed'));
};

exports.upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

exports.uploadToCloudinary = (buffer, folder = 'foodash', options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', ...options },
      (err, result) => err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });

exports.deleteFromCloudinary = async (publicId) => {
  try { await cloudinary.uploader.destroy(publicId); } catch {}
};