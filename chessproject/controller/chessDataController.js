const chessDataModel = require("../model/chessDataModel");
const userModel = require('../model/userModel');
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const ws = require("../service/websocket");

function renderChessDataPage(req, res, next) {
    userModel.getUserById(req.params.id).then((user) => {
        user.password = undefined;
        chessDataModel.getChessDataByUserId(user.id).then((userChessData) => {
            res.render('chessData', {loggedInUser: req.user, user, stats: userChessData});
        });
    }).catch((err) => {
        res.status(404);
        next(err);
    });
}

module.exports = {
    renderChessDataPage
}