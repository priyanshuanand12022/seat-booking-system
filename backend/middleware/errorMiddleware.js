export const notFound = (_req, res) => {
  res.status(404).json({ message: "The requested resource was not found." });
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: error.message || "Something went wrong.",
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
};
