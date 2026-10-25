import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    cb(ok ? null : new Error("Only JPG, PNG or WEBP images allowed"), ok);
  },
});

export const upload = multerUpload.single("photo");

export const uploadToCloudinary = (req, res, next) => {
  if (!req.file) return next();
  cloudinary.uploader
    .upload_stream({ folder: "contacts" }, (err, result) => {
      if (err) return next(err);
      req.body.photoUrl = result.secure_url;
      req.body.photoPublicId = result.public_id;
      next();
    })
    .end(req.file.buffer);
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};