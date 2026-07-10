const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = { errorHandler };
