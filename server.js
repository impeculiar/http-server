const express = require('express');
const http = require('http'); // Remove .createServer(app) here
const socketio = require("socket.io");
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const logFilePath = path.join(__dirname, 'chat.log');
const port = 3000;

function writeToLog(logData, ipAddress, requestType, url) {
    const currentDate = new Date();
    const formattedDate = [`${currentDate.toISOString()}`];
    const logLine = `${formattedDate} ${ipAddress} ${requestType} ${url} ${logData}\n`;

    fs.appendFile(logFilePath, logLine, (err) => {
        if (err) console.error('Error writing to log file:', err);
    });
}

app.get('/', (req, res) => {
    const ipAddress = req.connection.remoteAddress;
    const requestType = req.method;
    const url = req.url;

    writeToLog('User accessed homepage', ipAddress, requestType, url);
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    const ipAddress = socket.handshake.address;
    writeToLog('User connected to chat', ipAddress, 'CONNECTION', 'Socket Connection');

    socket.on('join', (nickname) => {
        socket.nickname = nickname; // Assign nickname to the socket
        io.emit('chat message', `${socket.nickname} entered the chat`);
        writeToLog(`User with nickname ${nickname} joined the chat`, ipAddress, 'CHAT JOIN', 'Chat Room');
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', `${socket.nickname}: ${msg}`);
        writeToLog(`${socket.nickname}: ${msg}`, ipAddress, 'CHAT MESSAGE', 'Chat Room Message');
    });

    socket.on('disconnect', () => setTimeout(() => {
        io.emit('chat message', `${socket.nickname} left the chat`);
        writeToLog(`User with nickname ${socket.nickname} left the chat`, ipAddress, 'DISCONNECTION', 'Socket Disconnection');
    }, 60000));
});


server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
