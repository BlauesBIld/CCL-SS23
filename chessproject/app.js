const express = require('express');
const WebSocket = require('ws');
const app = express();
const { spawn } = require('child_process');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const ws = require('./service/websocket');

const indexRouter = require('./routes/index');
const path = require("path");

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(cookieParser());
app.use(cors());
app.use('/', indexRouter);

app.listen(3000, () => {
    console.log('Server listening on port http://localhost:3000');
});