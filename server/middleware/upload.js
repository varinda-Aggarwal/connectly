const multer = require('multer');
const cloudinary = require('../config/cloudinary');

const upload = multer({
  storage: multer.memoryStorage(), // local disk use nahi hoti
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPG, PNG or WEBP images allowed'), ok);
  },
});

const uploadToCloudinary = (req, res, next) => {
  if (!req.file) return next();
  cloudinary.uploader
    .upload_stream({ folder: 'contacts' }, (err, result) => {
      if (err) return next(err);
      req.body.photoUrl = result.secure_url;
      req.body.photoPublicId = result.public_id;
      next();
    })
    .end(req.file.buffer);
};

module.exports = { upload: upload.single('photo'), uploadToCloudinary };