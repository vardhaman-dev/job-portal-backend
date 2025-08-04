module.exports = {
  secret: process.env.JWT_SECRET || 'default_jwt_secret_key_for_development_only',
  expiresIn: '8h'
};
