const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const tmi = require('tmi.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// Serve the frontend files from the 'public' directory
app.use(express.static('public'));

// ------------------------------------------------------------------
// 1. TMI.JS (Twitch Chat) Setup
// ------------------------------------------------------------------

const twitchClient = new tmi.Client({
    // IMPORTANT: Replace 'YOUR_TWITCH_CHANNEL' with your lowercase Twitch username
    channels: ['donkaaklijn']
});

twitchClient.connect().then(() => {
    console.log(`Successfully connected to Twitch chat for: ${twitchClient.opts.channels[0]}`);
}).catch(err => {
    console.error("Failed to connect to Twitch:", err);
});

// Listener for all messages in the connected channel
twitchClient.on('message', (channel, tags, message, self) => {
    // Ignore messages from the bot itself
    if (self) return;

    const username = tags['display-name'];

    // Emit the new chatter's data to all connected web clients (the OBS browser source)
    io.emit('new-chatter', {
        username: username,
        color: tags['color'] || '#FFFFFF', // Use user's color or default to white
        // Include other properties like emotes, badges if needed later
    });

    console.log(`Chat message from ${username}. Emitting event to OBS.`);
});

// ------------------------------------------------------------------
// 2. SOCKET.IO (Real-time connection) Setup
// ------------------------------------------------------------------

io.on('connection', (socket) => {
    console.log('A client (OBS Browser Source) connected.');
    socket.on('disconnect', () => {
        console.log('A client disconnected.');
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});