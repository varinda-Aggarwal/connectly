import multer from "multer";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

const uploader = multer({
  storage: multer.memoryStorage(), // file disk par nahi, memory mein parse hogi
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    // browser ka mimetype bharosemand nahi (Windows par .csv ko application/vnd.ms-excel bhejta hai), isliye extension dekho
    if (!/\.csv$/i.test(file.originalname)) {
      return cb(new Error("Only .csv files are allowed"));
    }
    cb(null, true);
  },
}).single("file");

export const csvUpload = (req, res, next) => {
  uploader(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? "CSV file must be 2 MB or smaller" : err.message;
      return res.status(400).json({ message });
    }
    if (!req.file) return res.status(400).json({ message: "Please choose a CSV file" });
    next();
  });
};