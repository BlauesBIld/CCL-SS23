const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const ws = require("../service/websocket");

const spectatorsModel = require("../model/spectatorsModel");
const gameModel = require("../model/gameModel");
const movesModel = require("../model/movesModel");


function removeSpectatorIfExists(username) {
    return new Promise((resolve, reject) => {
        spectatorsModel.getSpectatorByUsername(username).then((spectator) => {
            if (spectator) {
                spectatorsModel.removeSpectator(username).then(() => {
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
    removeSpectatorIfExists
}