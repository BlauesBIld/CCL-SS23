const userModel = require('../model/userModel');
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const ws = require("../service/websocket");

let guestQueue = [];
let userQueue = [];

let guestUsernamesInUse = [];

function getUsers(req, res, next) {
    const loggedInUser = jwt.verify(req.cookies['accessToken'], process.env.ACCESS_TOKEN_SECRET);

    userModel.getUsers()
        .then((users) => {
            userModel.getUserById(loggedInUser.id)
                .then((loggedInUser) => {
                    res.render('users', {users: users, loggedInUser: req.user});
                });
        }).catch((err) => {
        res.status(404);
        next(err);
    });
}

function getUserById(req, res, next) {
    const id = req.params.id;

    userModel.getUserById(parseInt(id)).then((user) => {
        if (user.avatarPath === undefined || user.avatarPath === '' || !fs.existsSync('public/avatars/' + user.avatarPath)) {
            user.avatarPath = 'default.png';
        }

        if (user.guild_id === null) {
            res.render('user', {user, loggedInUser: req.user});
        } else {
            guildModel.getGuildById(parseInt(user.guild_id)).then((guild) => {
                res.render('user', {user, loggedInUser: req.user, guild});
            });
        }
    }).catch((err) => {
        res.status(404);
        next(err);
    });
}

function editUser(req, res, next) {
    const loggedInUser = jwt.verify(req.cookies['accessToken'], process.env.ACCESS_TOKEN_SECRET);

    if (parseInt(req.params.id) !== loggedInUser.id && loggedInUser.role !== 'admin') {
        throw new Error('You are not allowed to access this page!');
    }
    userModel.getUserById(parseInt(req.params.id))
        .then((user) => {
            if (user.avatarPath === undefined || user.avatarPath === '' || !fs.existsSync('public/avatars/' + user.avatarPath)) {
                user.avatarPath = 'default.png';
            }
            res.render('editUser', {user});
        })
        .catch((err) => {
            res.status(500);
            next(err);
        });
}

function createUser(req, res, next) {
    userModel.createUser(req.body)
        .then((user) => {
            res.render('user', {user, loggedInUser: req.user});
        })
        .catch((err) => {
            res.status(500);
            next(err);
        });
}

function deleteUser(req, res, next) {
    userModel.deleteUser(parseInt(req.params.id))
        .then(() => {
            if (req.user.role === 'admin') {
                userModel.getUsers()
                    .then((users) => {
                        res.render('users', {users, loggedInUser: req.user});
                    });
            } else if (parseInt(req.params.id) === req.user.id) {
                res.redirect('/logout');
            }
        })
        .catch((err) => {
            res.status(500);
            next(err);
        });
}

function registerUser(req, res, next) {
    userModel.createUser(req.body)
        .then((user) => {
            res.redirect('/login');
        })
        .catch((err) => {
            res.status(500);
            next(err);
        });
}

function startGame(player1Username, player2Username) {
    let player1 = ws.getSocketByUsername(player1Username);
    let player2 = ws.getSocketByUsername(player2Username);

    if (player1 !== undefined && player2 !== undefined) {
        player1.send(JSON.stringify({
            type: "startGame",
            opponent: player2Username,
            color: "white"
        }));
        player2.send(JSON.stringify({
            type: "startGame",
            opponent: player1Username,
            color: "black"
        }));
    } else {
        console.log("one of the players is not connected");
    }
}

function queueUp(req, res) {
    if (req.body.userId === -1) {
        if (guestQueue.length === 0) {
            console.log("added " + req.body.username + " to guest queue");
            guestQueue.push(req.body.username);
        } else {
            let player1 = guestQueue.pop();
            let player2 = req.body.username;
            console.log("started game between " + player1 + " and " + player2);
            startGame(player1, player2);
        }
    } else if (req.body.userId !== -1) {
        userModel.getUserById(req.body.userId).then((user) => {

        });
    } else {
        res.sendStatus(500);
    }
}

function generateUniqueGuestName() {
    let guestName = "Guest";
    let guestNameNumber = Math.floor(Math.random() * 900000) + 100000; // Generate a random 6-digit number
    while (guestUsernamesInUse.includes(guestName + guestNameNumber)) {
        guestNameNumber = Math.floor(Math.random() * 900000) + 100000; // Generate a new random 6-digit number if the current one is already in use
    }
    guestUsernamesInUse.push(guestName + guestNameNumber);
    return guestName + guestNameNumber;
}

module.exports = {
    getUsers,
    getUserById,
    editUser,
    createUser,
    deleteUser,
    registerUser,
    queueUp,
    generateUniqueGuestName
}
