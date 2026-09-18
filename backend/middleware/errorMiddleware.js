export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
};
export const errorHandler = (err, req, res, next) => {
  const status = res.statusCode >= 400 ? res.statusCode : 500;
  console.error(err);
  res
    .status(status)
    .json({ success: false, message: err.message || "Server error" });
};
