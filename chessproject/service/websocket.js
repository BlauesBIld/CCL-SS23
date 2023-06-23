const WebSocket = require("ws");
const {spawn} = require("child_process");
const wss = new WebSocket.Server({port: 25056});
const gameController = require("../controller/gameController");
const spectatorsController = require("../controller/spectatorsController");
const gameModel = require("../model/gameModel");
const movesModel = require("../model/movesModel");
const {Chess} = require('chess.js');
const spectatorsModel = require("../model/spectatorsModel");
const chessDataModel = require("../model/chessDataModel");

let connectedUsersWebSockets = [];

wss.on('connection', (ws) => {
    console.log('WebSocket connection established');

    // Handle incoming WebSocket messages
    ws.on('message', (message) => {
        if (JSON.parse(message).type === 'init') {
            connectedUsersWebSockets[JSON.parse(message).username] = ws;
            console.log(`User ${JSON.parse(message).username} connected`);
        } else if (JSON.parse(message).type === 'move') {
            console.log(JSON.parse(message).move);
            connectedUsersWebSockets[JSON.parse(message).opponent].send(JSON.stringify({
                type: 'move',
                newBoard: flipFen(JSON.parse(message).newBoard),
                move: JSON.parse(message).move
            }));

            let gameFen = getFenWithWhiteSideDown(JSON.parse(message).newBoard);
            createMoveInDatabase(JSON.parse(message).opponent, JSON.parse(message).move);
            gameModel.getOngoingGameByPlayerUsername(JSON.parse(message).opponent).then((game) => {
                if (game) {
                    gameModel.updateLastFenForGameId(game.id, gameFen);
                    sendMoveToAllSpectatorsOfGame(game.id, gameFen, JSON.parse(message).move);
                }
            });

            // Check if the game is over and determine the winner
            const winner = getWinner(JSON.parse(message).newBoard);
            let winnerUsername = "No one";

            if (winner !== null) {
                console.log(`Game over. Winner: ${winner}`);
                gameModel.getOngoingGameByPlayerUsername(JSON.parse(message).opponent).then((game) => {
                    if(game) {
                        if (winner === 'White') {
                            winnerUsername = game.player1_username;
                            gameController.endGame(game.id, game.player1_username);
                        } else if (winner === 'Black') {
                            winnerUsername = game.player2_username;
                            gameController.endGame(game.id, game.player2_username);
                        } else {
                            gameController.endGame(game.id, null);
                        }
                    }
                    console.log(`Game over. Winner: ${winnerUsername}`);
                });
            }
        } else if (JSON.parse(message).type === 'surrender') {
            console.log(`User ${JSON.parse(message).username} surrendered`);
            gameModel.getOngoingGameByPlayerUsername(JSON.parse(message).winner).then((game) => {
                if (game) {
                    gameController.endGame(game.id, JSON.parse(message).winner).then((finishedGame) => {
                        sendGameEnded(finishedGame.player1_username, finishedGame);
                        sendGameEnded(finishedGame.player2_username, finishedGame);
                    });
                } else {
                    sendGameEnded(JSON.parse(message).winner, null, JSON.parse(message).winnerColor);
                    sendGameEnded(JSON.parse(message).loser, null, JSON.parse(message).winnerColor);
                }
            });

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
                console.log(`User ${username} disconnected`);
                gameController.checkIfUserIsInAGameAndEndIt(username).then((game) => {
                    if (game !== undefined) {
                        sendGameEndedToSpectators(game);
                        console.log("Looking for game");
                        if (game !== undefined) {
                            console.log("Found game: " + JSON.stringify(game));
                            let winnerUsername = game.player1_username === username ? game.player2_username : game.player1_username;
                            sendGameEnded(winnerUsername, game);
                        }
                    }
                });
                spectatorsController.removeSpectatorIfExists(username);
                delete connectedUsersWebSockets[username];
                break;
            }
        }
    });
});

function getWinner(fen) {
    const game = new Chess(fen);

    if (game.isCheckmate()) {
        let winner = game.turn() === 'w' ? 'Black' : 'White';
        console.log(`Winner: ${winner}`);
        return winner;
    } else if (game.isDraw()) {
        return 'Draw';
    } else {
        return null;
    }
}

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

function sendGameEnded(toUsername, game, winnerColor = 'Draw') {
    console.log(`Sending game over to ${toUsername}`);
    if (connectedUsersWebSockets[toUsername] !== undefined) {
        if (!game) {
            console.log("User found, sending packet");
            connectedUsersWebSockets[toUsername].send(JSON.stringify({
                type: 'gameOver',
                winner: winnerColor
            }));
        } else {
            console.log("User found, sending packet");
            console.log("decision: " + game.winner_username + " " + game.player1_username + " " + game.player2_username);
            winnerColor = game.winner_username === game.player1_username ? 'White' : 'Black';
            connectedUsersWebSockets[toUsername].send(JSON.stringify({
                type: 'gameOver',
                winner: winnerColor
            }));
        }
    }
}

function sendMoveAndFENBoardToSpectator(username, fen, move) {
    console.log(`Sending move to ${username}`);
    if (connectedUsersWebSockets[username] !== undefined) {
        console.log("User found, sending specMove packet");
        connectedUsersWebSockets[username].send(JSON.stringify({
            type: 'specMove',
            newBoard: fen,
            move: move
        }));
    }
}

function getFenWithWhiteSideDown(fen) {
    const fenParts = fen.split(' ');

    if (fenParts[1] === 'b') {
        return flipFen(fen);
    } else {
        return fen;
    }
}

function createMoveInDatabase(opponent, move) {
    gameModel.getOngoingGameByPlayerUsername(opponent).then((game) => {
        if (game) {
            movesModel.createMove(game.id, opponent, move.san).then(() => {
            });
        }
    });
}

function initializeGameToSpectator(username, game, moves) {
    console.log(`Sending game to ${username}`);
    console.log('moves: ' + JSON.stringify(moves));
    console.log('last fen: ' + game.last_fen);
    if (connectedUsersWebSockets[username] !== undefined) {
        console.log("User found, sending packet");
        chessDataModel.getChessDataFromUserByUsername(game.player1_username).then((player1ChessData) => {
            chessDataModel.getChessDataFromUserByUsername(game.player2_username).then((player2ChessData) => {
                connectedUsersWebSockets[username].send(JSON.stringify({
                    type: 'joinAsSpectator',
                    player1Username: game.player1_username,
                    player2Username: game.player2_username,
                    player1Elo: player1ChessData.elo,
                    player2Elo: player2ChessData.elo,
                    gameFen: game.last_fen,
                    moves: moves
                }));
            });
        });
    }
}

function addSpectatorToGame(gameId, username) {
    return new Promise((resolve, reject) => {
        spectatorsModel.createSpectator(gameId, username).then((result) => {
            movesModel.getMovesFromGameId(gameId).then((moves) => {
                gameModel.getGameById(gameId).then((game) => {
                    initializeGameToSpectator(username, game, moves);
                    resolve();
                }).catch((err) => {
                    reject(err);
                });
            });
        }).catch((err) => {
            reject(err);
        });
    });
}


function sendMoveToAllSpectatorsOfGame(gameId, gameFen, move) {
    return new Promise((resolve, reject) => {
        console.log('Looking for spectators of game ' + gameId);
        spectatorsModel.getSpectatorsForGameId(gameId).then((spectators) => {
            console.log('Found ' + spectators.length + ' spectators');
            console.log('Sending fen string: ' + gameFen);
            spectators.forEach((spectator) => {
                sendMoveAndFENBoardToSpectator(spectator.username, gameFen, move);
            });
            resolve();
        }).catch((err) => {
            reject(err);
        });
    });
}

function sendGameEndedToSpectators(game) {
    spectatorsModel.getSpectatorsForGameId(game.id).then((spectators) => {
        for (let spectator of spectators) {
            if (connectedUsersWebSockets[spectator.username] !== undefined) {
                let winnerColor = game.winner_username === game.player1_username ? 'White' : 'Black';
                connectedUsersWebSockets[spectator.username].send(JSON.stringify({
                    type: 'gameOver',
                    winner: winnerColor
                }));
            }
        }
    });
}

module.exports = {
    getSocketByUsername,
    sendGameEnded,
    sendMoveAndFENBoardToSpectator,
    initializeGameToSpectator,
    addSpectatorToGame
}
