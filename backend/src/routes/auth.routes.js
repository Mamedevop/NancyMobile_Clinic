const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Validation middleware
const validateRegister = [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim()
];

const validateLogin = [
    body('email').isEmail(),
    body('password').notEmpty()
];

// Register new user
router.post('/register', validateRegister, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { email, password, firstName, lastName, phone, address, role } = req.body;

    // Only allow customer or technician self-registration
    const allowedRoles = ['customer', 'technician'];
    const selectedRole = allowedRoles.includes(role) ? role : 'customer';

    // Check if user exists
    const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
    );

    if (existingUser.rows.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Email already registered'
        });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Get role ID
    const roleResult = await query(
        'SELECT id FROM roles WHERE name = $1',
        [selectedRole]
    );

    if (roleResult.rows.length === 0) {
        return res.status(500).json({
            success: false,
            message: 'Role "' + selectedRole + '" not found in database. Please contact support.'
        });
    }

    const userId = uuidv4();
    
    // Create user
    try {
        await query(
            `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, address, role_id, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
            [userId, email, passwordHash, firstName, lastName, phone || null, address || null, roleResult.rows[0].id]
        );
    } catch (insertErr) {
        // Fallback: insert without phone/address if columns don't exist
        console.error('Insert error:', insertErr.message);
        await query(
            `INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [userId, email, passwordHash, firstName, lastName, roleResult.rows[0].id]
        );
    }

    // Generate JWT token
    const token = jwt.sign(
        { userId, email, role: selectedRole },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
    );

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        token,
        user: {
            id: userId,
            email,
            firstName,
            lastName,
            role: selectedRole
        }
    });
}));

// Login user
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { email, password } = req.body;

    // Find user (case-insensitive email)
    const userResult = await query(
        `SELECT u.*, r.name as role 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE LOWER(u.email) = LOWER($1) AND u.is_active = true`,
        [email]
    );

    if (userResult.rows.length === 0) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    // Update last login
    await query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
    );

    res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            phone: user.phone,
            address: user.address,
            is_verified: user.is_verified,
            verification_status: user.verification_status
        }
    });
}));

// Get current user
router.get('/me', asyncHandler(async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        const userResult = await query(
            `SELECT u.*, r.name as role 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.id = $1 AND u.is_active = true`,
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.rows[0];
        
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                phone: user.phone,
                address: user.address,
                profileImage: user.profile_picture,
                is_verified: user.is_verified,
                verification_status: user.verification_status
            }
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
}));

// Forgot password
router.post('/forgot-password', asyncHandler(async (req, res) => {
    const { email } = req.body;

    const userResult = await query(
        'SELECT id, email FROM users WHERE email = $1',
        [email]
    );

    if (userResult.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Email not found'
        });
    }

    // Generate reset token (in production, send email)
    const resetToken = jwt.sign(
        { userId: userResult.rows[0].id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
    );

    // TODO: Send email with reset link
    console.log(`Reset token for ${email}: ${resetToken}`);

    res.json({
        success: true,
        message: 'Password reset link sent to email'
    });
}));

module.exports = router;