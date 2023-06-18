const WebSocket = require("ws");
const {spawn} = require("child_process");
const wss = new WebSocket.Server({ port: 25056 });

let connectedUsersWebSockets = [];

wss.on('connection', (ws) => {
    console.log('WebSocket connection established');

    // Handle incoming WebSocket messages
    ws.on('message', (message) => {
        if(JSON.parse(message).type === 'init') {
            connectedUsersWebSockets[JSON.parse(message).username] = ws;
            console.log(`User ${JSON.parse(message).username} connected`);
        } else if (JSON.parse(message).type === 'move') {
            connectedUsersWebSockets[JSON.parse(message).opponent].send(JSON.stringify({
                type: 'move',
                newBoard: flipFen(JSON.parse(message).newBoard)
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
