import { ApiError } from "./ApiError.js";

const errorHandler = (err, req, res, next) => {
  if (     !(err instanceof ApiError ) ) {
    const statusCode = err.statusCode || 500;
    const message = err.message || "somwthing went wrong ";
    err = new ApiError(statusCode, message);
  }
  console.log("getting");
  
  const response = {
    statusCode: err.statusCode,
    success: false,
    message: err.message,
    errors: err.errors || [],
  };

  res.status(err.statusCode || 500).json(response);
};

export { errorHandler };
