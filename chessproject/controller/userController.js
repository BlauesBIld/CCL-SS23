const userModel = require('../model/userModel');
const chessDataModel = require("../model/chessDataModel");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const ws = require("../service/websocket");
const gameModel = require("../model/gameModel");

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

function startGuestGame(player1Username, player2Username) {
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

function removeAllUserQueuesEntriesWithUsernames(usernames) {
    for (let i = 0; i < usernames.length; i++) {
        for (let j = 0; j < userQueue.length; j++) {
            if (userQueue[j].username === usernames[i]) {
                userQueue.splice(j, 1);
            }
        }
    }
}

function startUserGame(player1QueueEntry, player2QueueEntry) {
    console.log("Trying to get websockets from " + player1QueueEntry.username + " & " + player2QueueEntry.username);
    let player1 = ws.getSocketByUsername(player1QueueEntry.username);
    let player2 = ws.getSocketByUsername(player2QueueEntry.username);

    console.log("hello " + player1);

    if (player1 !== undefined && player2 !== undefined) {
        removeAllUserQueuesEntriesWithUsernames([player1QueueEntry.username, player2QueueEntry.username]);
        player1.send(JSON.stringify({
            type: "startGame",
            opponent: player2QueueEntry.username,
            eloRating: player2QueueEntry.eloRating,
            color: "white"
        }));
        player2.send(JSON.stringify({
            type: "startGame",
            opponent: player1QueueEntry.username,
            eloRating: player1QueueEntry.eloRating,
            color: "black"
        }));

        let averageEloRatingBetweenPlayers = (player1QueueEntry.eloRating + player2QueueEntry.eloRating) / 2;
        gameModel.createGame(player1QueueEntry.username, player2QueueEntry.username, averageEloRatingBetweenPlayers);
    } else {
        console.log("one of the players is not connected");
    }
    console.log("current user queue:");
    for (let i = 0; i < userQueue.length; i++) {
        console.log(userQueue[i].username + " " + userQueue[i].eloRating);
    }
}

function findUserNameInUserQueueWithSimilarRating(player1username, eloRating) {
    let foundUsername;
    let maxDifference = 100;
    for (let i = 0; i < userQueue.length; i++) {
        if (userQueue[i].username === player1username) {
            continue;
        }
        if (Math.abs(userQueue[i].eloRating - eloRating) < maxDifference) {
            foundUsername = userQueue[i];
        }
    }
    if (foundUsername) {
        console.log("found user in queue: " + foundUsername.username)
    }
    return foundUsername;
}

function queueUp(req, res) {
    if (req.body.userId === -1) {
        if (guestQueue.length === 0) {
            guestQueue.push(req.body.username);
        } else {
            let player1 = guestQueue.pop();
            let player2 = req.body.username;
            startGuestGame(player1, player2);
        }
    } else if (req.body.userId !== -1) {
        userModel.getUserById(req.body.userId).then((user) => {
            if (userQueue.find((queueEntry) => queueEntry.username === user.username)) {
                console.log("user is already in queue");
            } else {
                chessDataModel.getChessDataByUserId(req.body.userId).then((chessData) => {
                    gameModel.getGameByPlayerUsername(user.username).then((game) => {
                        if (game) {
                            winner = game.player1Username === user.username ? game.player2Username : game.player1Username;
                            gameModel.endGame(game.id, winner);
                        }
                    });

                    let newQueueEntry = {
                        username: user.username,
                        eloRating: chessData.elo
                    }
                    userQueue.push(newQueueEntry);
                    console.log(newQueueEntry);

                    let foundUsername;
                    if ((foundUsername = findUserNameInUserQueueWithSimilarRating(req.body.username, chessData.elo))) {
                        let player1 = foundUsername;
                        let player2 = {username: user.username, eloRating: chessData.elo};
                        startUserGame(player1, player2);
                    }
                });
            }
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
