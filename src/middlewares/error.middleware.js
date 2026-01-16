import { ApiError } from '../utils/ApiError_utils.js';

const errorHandler = (err, req, res, next) => {
    console.error('=== ERROR ===');
    console.error('Message:', err?.message);
    console.error('Stack:', err?.stack);
    console.error(err);

    // Handle if response already sent
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors || [],
        });
    }

    // Multer-specific errors
    if (err && err.name === 'MulterError') {
        return res.status(400).json({ 
            success: false, 
            message: `File upload error: ${err.message}`,
            errors: []
        });
    }

    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: messages
        });
    }

    // Mongoose cast errors
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            errors: []
        });
    }

    const status = err.statusCode || 500;
    return res.status(status).json({ 
        success: false, 
        message: err.message || 'Internal Server Error',
        errors: [],
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}

export default errorHandler;
