const db = require('../service/database.js').config;
const fs = require('fs')
const bcrypt = require('bcrypt')
require('body-parser');

const chessDataModel = require("../model/chessDataModel");

let getUsers = () => new Promise((resolve, reject) => {
    db.query('SELECT * FROM users', function (err, result, fields) {
        if (err) reject(err);
        resolve(result);
    });
});

let getUserById = (id) => new Promise((resolve, reject) => {
    db.query('SELECT * FROM users WHERE id = ?', [id], function (err, result, fields) {
        if (err) {
            reject(err)
        } else {
            resolve(result[0]);
        }
    });
});

let createUser = (userData) => new Promise(async (resolve, reject) => {
    console.log(userData);
    userData.password = await bcrypt.hash(userData.password, 10);
    let sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

    let values = [userData.username, userData.email, userData.password];

    createUserInDatabase(sql, values, reject, resolve, userData);
});

function createUserInDatabase(sql, values, reject, resolve, userData) {
    db.query(sql, values, function (err, result, fields) {
        if (err) {
            reject(err)
        }
        getUserById(result.insertId).then((user) => {
            resolve(user);
        });
    })
}

let deleteUser = (id) => new Promise((resolve, reject) => {
    db.query("DELETE FROM users WHERE id = " + parseInt(id), function (err, result, fields) {
        if (err) reject(err);
        resolve(result);
    });
});

let getUserByUsername = (username) => new Promise((resolve, reject) => {
    db.query('SELECT * FROM users WHERE username = ?', [username], function (err, result, fields) {
        if (err) {
            reject(err)
        } else {
            resolve(result[0]);
        }
    });
});


module.exports = {
    getUsers,
    getUserById,
    createUser,
    deleteUser,
    getUserByUsername
}
