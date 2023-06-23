const express = require('express');
const router = express.Router();
const userController = require("../controller/userController");
const gameController = require("../controller/gameController");
const chessDataController = require("../controller/chessDataController");
const userModel = require("../model/userModel");
const authenticationService = require("../service/authentication");
const spectatorController = require("../controller/spectatorsController");
const ws = require("../service/websocket");

router.get('/', authenticationService.authenticateJWTAndContinueWithGuest, (req, res) => {
    gameController.getTopTenOngoingAverageEloRatingGames().then((games) => {
        console.log(games);
        res.render('index', {loggedInUser: req.user, games: games});
    });
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
    .get((req, res, next) => {
        res.render('register');
    })
    .post((req, res, next) => {
        userController.registerUser(req, res, next);
    });

router.get('/logout', (req, res, next) => {
    res.clearCookie('accessToken');
    res.redirect('/');
});

router.post('/queueup', (req, res) => {
    userController.queueUp(req, res);
});

router.post('/spectate', (req, res) => {
    let username = req.body.username;
    let gameId = req.body.gameId;
    ws.addSpectatorToGame(gameId, username);
});

router.get('/user/:id', authenticationService.authenticateJWTAndForceToLogin, chessDataController.renderChessDataPage);

module.exports = router;