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

let getGameByPlayerUsername = (username) => new Promise((resolve, reject) => {
    db.query('SELECT * FROM games WHERE player1_username = ? OR player2_username = ?', [username, username], function (err, result, fields) {
        if (err) {
            reject(err)
        } else {
            resolve(result[0]);
        }
    });
});

let endGame = (id, winnerUsername) => new Promise((resolve, reject) => {
    if (!winnerUsername) {
        db.query("UPDATE games SET status = ? WHERE id = ?", ["concluded", id], function (err, result, fields) {
            if (err) reject(err);
            resolve(result);
        });
    } else {
        db.query("UPDATE games SET status = ?, winner_username = ? WHERE id = ?", ["concluded", winnerUsername, id], function (err, result, fields) {
            if (err) reject(err);
            resolve(result);
        });
    }
});

let updateLastFenForGameId = (id, lastFen) => new Promise((resolve, reject) => {
    db.query("UPDATE games SET last_fen = ? WHERE id = ?", [lastFen, id], function (err, result, fields) {
        if (err) reject(err);
        resolve(result);
    });
});

let getOngoingGameByPlayerUsername = (username) => new Promise((resolve, reject) => {
    db.query('SELECT * FROM games WHERE (player1_username = ? OR player2_username = ?) AND status = ?', [username, username, "ongoing"], function (err, result, fields) {
        if (err) {
            reject(err)
        } else {
            resolve(result[0]);
        }
    });
});

let setAllOngoingGamesToConcluded = () => new Promise((resolve, reject) => {
    db.query("UPDATE games SET status = ? WHERE status = ?", ["concluded", "ongoing"], function (err, result, fields) {
        if (err) reject(err);
        resolve(result);
    });
});

module.exports = {
    getGames,
    getGameById,
    createGame,
    getTopTenOngoingAverageEloRatingGames,
    getGameByPlayerUsername,
    getOngoingGameByPlayerUsername,
    endGame,
    setAllOngoingGamesToConcluded,
    updateLastFenForGameId
}