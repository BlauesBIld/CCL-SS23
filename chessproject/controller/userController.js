const userModel = require('../model/userModel');
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

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
    console.log(req.body)
    console.log('------------------');
    userModel.createUser(req.body)
        .then((user) => {
            res.redirect('/login');
        })
        .catch((err) => {
            res.status(500);
            next(err);
        });
}

module.exports = {
    getUsers,
    getUserById,
    editUser,
    createUser,
    deleteUser,
    registerUser
}
