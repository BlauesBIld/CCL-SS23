const db = require('../service/database.js').config;
const fs = require('fs')
const bcrypt = require('bcrypt')
require('body-parser');

let getGames = () => new Promise((resolve, reject) => {
    db.query('SELECT * FROM games', function (err, result, fields) {
        if (err) reject(err);
        resolve(result);
    });
});

let getGameById = (id) => new Promise((resolve, reject) => {
    db.query('SELECT * FROM games WHERE id = ?', [id], function (err, result, fields) {
        if (err) {
            reject(err)
        } else {
            resolve(result[0]);
        }
    });
});

let createGame = (player1Username, player2Username, averageEloRatingBetweenPlayers) => new Promise(async (resolve, reject) => {
    db.query("INSERT INTO games (player1_username, player2_username, average_elo_rating) VALUES (?, ?, ?)", [player1Username, player2Username, averageEloRatingBetweenPlayers], function (err, result, fields) {
        if (err) {
            reject(err)
        }
        resolve(result);
    });
});

let getTopTenOngoingAverageEloRatingGames = () => new Promise((resolve, reject) => {
    db.query("SELECT * FROM games WHERE status = ? ORDER BY average_elo_rating DESC LIMIT 10", ["ongoing"], function (err, result, fields) {
        if (err) reject(err);
        resolve(result);
    });
});

module.exports = {
    getGames,
    getGameById,
    createGame,
    getTopTenOngoingAverageEloRatingGames
}