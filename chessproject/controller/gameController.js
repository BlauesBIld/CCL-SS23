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

function checkIfUserIsInAGameAndEndIt(username) {
    return new Promise((resolve, reject) => {
        gameModel.getGameByPlayerUsername(username).then((game) => {
            if (game !== undefined) {
                let winnerUsername = game.player1_username === username ? game.player2_username : game.player1_username;
                gameModel.endGame(game.id, winnerUsername).then(() => {
                    resolve();
                }).catch((err) => {
                    reject(err);
                });
            } else {
                resolve();
            }
        }).catch((err) => {
            reject(err);
        });
    });
}


module.exports = {
    getTopTenOngoingAverageEloRatingGames,
    checkIfUserIsInAGameAndEndIt
}