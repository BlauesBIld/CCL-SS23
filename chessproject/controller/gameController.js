const gameModel = require("../model/gameModel");
const chessDataModel = require("../model/chessDataModel");
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
        gameModel.getOngoingGameByPlayerUsername(username).then((game) => {
            if (game !== undefined) {
                let winnerUsername = game.player1_username === username ? game.player2_username : game.player1_username;
                endGame(game.id, winnerUsername).then(() => {
                    gameModel.getGameById(game.id).then((updatedGame) => {
                        resolve(updatedGame);
                    });
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

function endGame(id, winnerUsername) {
    return new Promise((resolve, reject) => {
        gameModel.endGame(id, winnerUsername).then(() => {
            gameModel.getGameById(id).then((updatedGame) => {
                chessDataModel.addConcludedGameToRecordsOfPlayers(updatedGame).then(() => {
                    resolve(updatedGame);
                });
            });
        }).catch((err) => {
            reject(err);
        });
    });
}


module.exports = {
    getTopTenOngoingAverageEloRatingGames,
    checkIfUserIsInAGameAndEndIt,
    endGame
}