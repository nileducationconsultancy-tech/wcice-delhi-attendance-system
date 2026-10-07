const jwt = require('jsonwebtoken');

const generateToken = (res, userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: isProduction, // HTTPS in production
        sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-domain cookies (Vercel <-> Render)
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return token;
};

module.exports = generateToken;
