const errorHandler = (err, req, res, next) => {

  let statusCode = err.statusCode || 500
  let message = err.message || "Internal Server Error"

  /* =========================================
     Mongoose CastError (Invalid ObjectId)
  ========================================= */
  if (err.name === "CastError") {
    statusCode = 400
    message = `Invalid ${err.path}: ${err.value}`
  }

  /* =========================================
     Mongoose Duplicate Key
  ========================================= */
  if (err.code === 11000) {
    statusCode = 400
    const field = Object.keys(err.keyValue)[0]
    message = `Duplicate value for field: ${field}`
  }

  /* =========================================
     Mongoose Validation Error
  ========================================= */
  if (err.name === "ValidationError") {
    statusCode = 400
    message = Object.values(err.errors)
      .map(val => val.message)
      .join(", ")
  }

  /* =========================================
     Multer File Size Limit
  ========================================= */
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400
    message = "File size too large. Maximum allowed size is 5MB."
  }

  /* =========================================
     Final Error Response
  ========================================= */
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack
    })
  })
}

export default errorHandler