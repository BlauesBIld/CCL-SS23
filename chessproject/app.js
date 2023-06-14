const express = require('express');
const WebSocket = require('ws');
const app = express();
const { spawn } = require('child_process');

// Serve the public directory as static files
app.use(express.static('public'));

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 25056 });

// Handle incoming WebSocket connections
wss.on('connection', (ws) => {
    console.log('WebSocket connection established');

    // Handle incoming WebSocket messages
    ws.on('message', (message) => {
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
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});