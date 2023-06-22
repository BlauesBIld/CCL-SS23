const db = require('../service/database.js').config;
const fs = require('fs')
const bcrypt = require('bcrypt')
require('body-parser');

let getSpectatorsForGameId = (id) => new Promise((resolve, reject) => {
    db.query('SELECT * FROM spectators WHERE game_id = ?', [id], function (err, result, fields) {
        if (err) {
            reject(err)
        } else {
            resolve(result);
        }
    });
});

let getSpectatorByUsername = (username) => new Promise((resolve, reject) => {
    db.query('SELECT * FROM spectators WHERE username = ?', [username], function (err, result, fields) {
        if (err) {
            reject(err)
        } else {
            resolve(result[0]);
        }
    });
});

let createSpectator = (gameId, username) => new Promise(async (resolve, reject) => {
    // Check if the username already exists in the spectators table
    const existingSpectator = await getSpectatorByUsername(username);
    if (existingSpectator) {
        // Username already exists, remove the existing spectator before creating a new one
        await removeSpectator(username);
    }

    // Create the new spectator
    db.query("INSERT INTO spectators (game_id, username) VALUES (?, ?)", [gameId, username], function (err, result, fields) {
        if (err) {
            reject(err);
        }
        resolve(result);
    });
});

let removeSpectator = (username) => new Promise(async (resolve, reject) => {
    db.query("DELETE FROM spectators WHERE username = ?", [username], function (err, result, fields) {
        if (err) {
            reject(err);
        }
        resolve(result);
    });
});

module.exports = {
    getSpectatorsForGameId,
    createSpectator,
    removeSpectator,
    getSpectatorByUsername
}
