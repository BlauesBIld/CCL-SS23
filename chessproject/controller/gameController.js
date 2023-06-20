const gameModel = require("../model/gameModel");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const ws = require("../service/websocket");

let activeGuestGames = [];

function getTopTenOngoingAverageEloRatingGames() {
    return new Promise((resolve, reject) => {
        gameModel.getTopTenOngoingAverageEloRatingGames().then((games) => {
            resolve(games);
        }).catch((err) => {
            reject(err);
        });
    });
}

module.exports = {
    getTopTenOngoingAverageEloRatingGames
}