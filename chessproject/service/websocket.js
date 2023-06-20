const WebSocket = require("ws");
const {spawn} = require("child_process");
const wss = new WebSocket.Server({ port: 25056 });
const gameController = require("../controller/gameController");

let connectedUsersWebSockets = [];

wss.on('connection', (ws) => {
    console.log('WebSocket connection established');

    // Handle incoming WebSocket messages
    ws.on('message', (message) => {
        if(JSON.parse(message).type === 'init') {
            connectedUsersWebSockets[JSON.parse(message).username] = ws;
            console.log(`User ${JSON.parse(message).username} connected`);
        } else if (JSON.parse(message).type === 'move') {
            console.log(JSON.parse(message).move);
            connectedUsersWebSockets[JSON.parse(message).opponent].send(JSON.stringify({
                type: 'move',
                newBoard: flipFen(JSON.parse(message).newBoard),
                move: JSON.parse(message).move
            }));
        } else {
            console.log(`Received message: ${message}`);
            const pythonScript = spawn('python', ['testGame.py', message]);
            pythonScript.stdout.on('data', (data) => {
                console.log(`Best move: ${data}`);
                ws.send(`${data}`);
            });

            pythonScript.stderr.on('data', (data) => {
                console.error(`Error: ${data}`);
            });

            pythonScript.on('close', (code) => {
                console.log(`Python script exited with code ${code}`);
            });
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        // Remove the disconnected user from the connectedUsersWebSockets object
        for (let username in connectedUsersWebSockets) {
            if (connectedUsersWebSockets[username] === ws) {
                delete connectedUsersWebSockets[username];
                console.log(`User ${username} disconnected`);
                gameController.checkIfUserIsInAGameAndEndIt(username);
                break;
            }
        }
    });
});

function getSocketByUsername(username) {
    return connectedUsersWebSockets[username];
}

function flipFen(fen) {
    let [board, turn, castling, enPassant, halfMoves, fullMoves] = fen.split(' ');
    let flippedBoard = board.split('/').reverse().join('/').split('').reverse().join('');
    let flippedRows = flippedBoard.split('/');
    for (let i = 0; i < flippedRows.length; i++) {
        flippedRows[i] = flippedRows[i].split('').reverse().join('');
    }
    return [flippedRows.join('/'), turn, castling, enPassant, halfMoves, fullMoves].join(' ');
}

module.exports = {
    getSocketByUsername
}
