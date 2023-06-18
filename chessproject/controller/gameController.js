const gameModel = require("../model/gameModel");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const ws = require("../service/websocket");

let activeGuestGames = [];

module.exports = {
}