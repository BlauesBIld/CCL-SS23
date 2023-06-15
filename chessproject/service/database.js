require('dotenv').config();     // allows us to use .env file
const mysql = require('mysql');
const fs = require('fs');

const config = mysql.createConnection({
    host: "atp.fhstp.ac.at",
    port: 8007,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

config.connect(function(err) {
    if (err) throw err;
    console.log("Database connected!");
});

module.exports = {config};
