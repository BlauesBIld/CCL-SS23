const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userModel = require("../model/userModel");
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

async function checkPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

async function authenticateUser({email, password}, users, res) {
    const user = users.find((u) => {
        return u.email === email
    });
    if (user && await checkPassword(password, user.password)) {
        // Generate an access token
        const accessToken = jwt.sign({id: user.id, name: user.name}, ACCESS_TOKEN_SECRET, {expiresIn: '24h'});
        res.cookie('accessToken', accessToken);
        res.redirect('/');
    } else {
        const message = 'Wrong Username or Password!';
        res.render('login', {message: message});
    }
}

function authenticateJWTAndContinueWithGuest(req, res, next) {
    const token = req.cookies['accessToken'];
    if (token) {
        jwt.verify(token, ACCESS_TOKEN_SECRET, (err, userJWT) => {
            if (err) {
                const message = 'There was an error with your session. Please log in again.';
                res.render('login', {message: message});
            }
            userModel.getUserById(userJWT.id).then((user) => {
                req.user = user;
                next();
            });
        });
    } else {
        req.user = {id: -1, username: 'Guest'};
        next();
    }
}

function authenticateJWTAndForceToLogin(req, res, next) {
    const token = req.cookies['accessToken'];
    if (token) {
        jwt.verify(token, ACCESS_TOKEN_SECRET, (err, userJWT) => {
            if (err) {
                const message = 'There was an error with your session. Please log in again.';
                res.render('login', {message: message});
            }
            userModel.getUserById(userJWT.id).then((user) => {
                req.user = user;
                next();
            });
        });
    } else {
        const message = 'Please log in to access this page!';
        res.render('login', {message: message});
    }
}

module.exports = {
    authenticateUser,
    authenticateJWTAndContinueWithGuest,
    authenticateJWTAndForceToLogin
}
