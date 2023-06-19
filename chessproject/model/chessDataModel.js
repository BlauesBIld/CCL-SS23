const db = require('../service/database.js').config;
const fs = require('fs')
const bcrypt = require('bcrypt')
require('body-parser');

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

module.exports = {
    getChessDataByUserId,
    createChessDataForNewUser
}