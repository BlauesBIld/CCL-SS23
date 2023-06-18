const express = require('express');
const router = express.Router();
const userController = require("../controller/userController");
const userModel = require("../model/userModel");
const authenticationService = require("../service/authentication");

router.get('/', authenticationService.authenticateJWTAndContinueWithGuest, (req, res) => {
    res.render('index', {loggedInUser: req.user});
});

router.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post((req, res) => {
        userModel.getUsers()
            .then((users) => {
                authenticationService.authenticateUser(req.body, users, res)
            })
            .catch((err) => {
                res.sendStatus(500)
            })
    });

router.route('/register')
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {
        userController.registerUser(req, res);
    });

router.get('/logout', (req, res, next) => {
    res.clearCookie('accessToken');
    res.redirect('/');
});

router.post('/queueup', (req, res) => {
    userController.queueUp(req, res);
});

module.exports = router;