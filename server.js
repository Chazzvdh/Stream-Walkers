const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const tmi = require('tmi.js');
const fs = require('fs');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

app.use(express.static('public'));
app.use('/sprites', express.static(path.join(__dirname, 'public/sprites')));
app.use(bodyParser.json());

const upload = multer({ dest: 'public/sprites/' });

let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

let twitchClient = new tmi.Client({
    channels: [config.channelName]
});

function connectTwitchClient() {
    twitchClient.connect().then(() => {
        console.log(`Connected to Twitch chat for: ${twitchClient.opts.channels[0]}`);
    }).catch(err => {
        console.error("Failed to connect to Twitch:", err);
    });
}

connectTwitchClient();

twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return;
    const username = tags['display-name'];
    const twitchColor = tags['color'] || '#ff0000';
    io.emit('new-chatter', {
        username: username,
        color: twitchColor,
        twitchColor: twitchColor,
        message: message
    });
    console.log(`Chat message from ${username} with color ${twitchColor}. Emitting event to OBS.`);
});

io.on('connection', (socket) => {
    console.log('A client (OBS Browser Source) connected.');
    socket.on('disconnect', () => {
        console.log('A client disconnected.');
    });
});

// Watch config.json for channel changes
fs.watchFile('config.json', (curr, prev) => {
    const newConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    if (newConfig.channelName !== config.channelName) {
        twitchClient.disconnect().then(() => {
            twitchClient = new tmi.Client({
                channels: [newConfig.channelName]
            });
            connectTwitchClient();
            config = newConfig;
        });
    }
    config = newConfig;
});

// Endpoint to get config
app.get('/config', (req, res) => {
    res.json(config);
});

// Endpoint to update config from browser
app.post('/set-config', (req, res) => {
    const newConfig = req.body;
    if (typeof newConfig.channelName !== 'string' || !newConfig.channelName) {
        return res.status(400).json({ success: false, error: 'Invalid channel name' });
    }
    config = newConfig;
    fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
    res.json({ success: true });
});

// Sprite upload endpoint
app.post('/upload-sprite', upload.single('sprite'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false });
    const ext = req.file.originalname.split('.').pop();
    const newName = `sprite_${Date.now()}.${ext}`;
    const newPath = path.join('public/sprites', newName);
    fs.renameSync(req.file.path, newPath);
    res.json({ success: true, url: `/sprites/${newName}` });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});