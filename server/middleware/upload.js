import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const httpError = (status, message) => Object.assign(new Error(message), { status });

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    cb(ok ? null : httpError(400, "Only JPG, PNG or WEBP images allowed"), ok);
  },
});

export const upload = multerUpload.single("photo");

export const uploadToCloudinary = (req, res, next) => {
  if (!req.file) return next();
  cloudinary.uploader
    .upload_stream({ folder: "contacts" }, (err, result) => {
      if (err) return next(httpError(502, "Photo upload failed, please try again"));
      req.uploadedPhoto = { url: result.secure_url, publicId: result.public_id };
      next();
    })
    .end(req.file.buffer);
};

// delete fail hone par request fail nahi hogi, sirf log hoga
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete failed:", publicId, err.message);
  }
};