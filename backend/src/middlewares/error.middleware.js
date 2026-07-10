const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';

    // Log full error details
    console.error(`[ERROR] ${req.method} ${req.path}: ${message}`);
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    // Handle specific DB errors gracefully
    if (err.code === 'ECONNREFUSED' || err.code === '57P03' || message.includes('connect')) {
        return res.status(503).json({
            success: false,
            message: 'Database temporarily unavailable. Please try again in a moment.'
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({ success: false, message });
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = { errorHandler };
