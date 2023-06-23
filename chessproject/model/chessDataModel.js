const db = require('../service/database.js').config;
const fs = require('fs')
const bcrypt = require('bcrypt')
require('body-parser');
const userModel = require("../model/userModel");

let getChessDataByUserId = (id) => new Promise((resolve, reject) => {
    db.query('SELECT * FROM chess_data WHERE user_id = ?', [id], function (err, result, fields) {
        if (err) {
            reject(err)
        } else {
            resolve(result[0]);
        }
    });
});

let createChessDataForNewUser = (id) => new Promise(async (resolve, reject) => {
    db.query("INSERT INTO chess_data (user_id) VALUES (?)", [id], function (err, result, fields) {
        if (err) {
            reject(err)
        }
        resolve(result);
    });
});

let getChessDataFromUserByUsername = (username) => new Promise((resolve, reject) => {
    userModel.getUserByUsername(username).then((user) => {
        getChessDataByUserId(user.id).then((chessData) => {
            resolve(chessData);
        });
    });
});

let addConcludedGameToRecordsOfPlayers = (game) => new Promise(async (resolve, reject) => {
    console.log("Game: " + JSON.stringify(game));
    getChessDataFromUserByUsername(game.player1_username).then((player1ChessData) => {
        getChessDataFromUserByUsername(game.player2_username).then((player2ChessData) => {
            player1ChessData.games_played++;
            player2ChessData.games_played++;
            if(game.winner_username === game.player1_username) {
                player1ChessData.wins++;
                player1ChessData.elo+=15;
                player2ChessData.losses++;
                player2ChessData.elo-=15;
            } else if(game.winner_username === game.player2_username) {
                player2ChessData.wins++;
                player2ChessData.elo+=15;
                player1ChessData.losses++;
                player1ChessData.elo-=15;
            } else {
                player1ChessData.draws++;
                player2ChessData.draws++;
            }
            updateChessDataForUser(player1ChessData).then(() => {
                updateChessDataForUser(player2ChessData).then(() => {
                    resolve();
                });
            });
        });
    });
});

let updateChessDataForUser = (chessData) => new Promise(async (resolve, reject) => {
    console.log("Updating chess data for user: " + chessData.user_id);
    console.log(JSON.stringify(chessData));
    db.query("UPDATE chess_data SET elo = ?, wins = ?, losses = ?, draws = ?, games_played = ? WHERE user_id = ?", [chessData.elo, chessData.wins, chessData.losses, chessData.draws, chessData.games_played, chessData.user_id], function (err, result, fields) {
        if (err) {
            reject(err)
        }
        resolve(result);
    });
});

module.exports = {
    getChessDataByUserId,
    createChessDataForNewUser,
    addConcludedGameToRecordsOfPlayers,
    getChessDataFromUserByUsername
}