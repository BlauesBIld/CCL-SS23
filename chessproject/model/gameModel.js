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

let createGame = (gameData) => new Promise(async (resolve, reject) => {
    db.query("INSERT INTO games (player1_id, player2_id) VALUES (?, ?)", [gameData.player1_id, gameData.player2_id], function (err, result, fields) {
        if (err) {
            reject(err)
        }
        resolve(result);
    });
});

module.exports = {
    getGames,
    getGameById
}