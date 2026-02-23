const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./database');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'place_holder',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'place_holder',
    callbackURL: "/api/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;
            const googleId = profile.id;
            const name = profile.displayName;

            let userResult = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [googleId, email]);

            let user;
            if (userResult.rows.length === 0) {
                let insertResult = await pool.query(
                    'INSERT INTO users (name, email, google_id, role) VALUES ($1, $2, $3, $4) RETURNING *',
                    [name, email, googleId, 'candidate']
                );
                user = insertResult.rows[0];
            } else {
                user = userResult.rows[0];
                if (!user.google_id) {
                    await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
                    user.google_id = googleId;
                }
            }
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }
));

module.exports = passport;
