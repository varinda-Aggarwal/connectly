import multer from "multer";

export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "Photo must be 2MB or smaller",
      LIMIT_UNEXPECTED_FILE: 'Photo field name must be "photo"',
    };
    return res.status(400).json({ message: messages[err.code] || err.message });
  }

  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }

  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
};