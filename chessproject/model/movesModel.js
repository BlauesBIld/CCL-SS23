const db = require('../service/database.js').config;
const fs = require('fs')
const bcrypt = require('bcrypt')
require('body-parser');

let getMovesFromGameId = (id) => new Promise((resolve, reject) => {
    db.query('SELECT * FROM moves WHERE game_id = ?', [id], function (err, result, fields) {
        if (err) {
            reject(err)
        } else {
            resolve(result);
        }
    });
});

let createMove = (gameId, playerUsername, moveSan) => new Promise(async (resolve, reject) => {
    db.query("INSERT INTO moves (game_id, player_username, move_san) VALUES (?, ?, ?)", [gameId, playerUsername, moveSan], function (err, result, fields) {
        if (err) {
            reject(err);
        }
        resolve(result);
    });
});

module.exports = {
    getMovesFromGameId,
    createMove
}