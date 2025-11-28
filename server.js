// File: `server.js`
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
app.use('/packs', express.static(path.join(__dirname, 'packs')));
app.use(bodyParser.json());

// Multer with basic validation (images only, 5MB limit)
const upload = multer({
    dest: 'public/sprites/',
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ok = /^image\/(png|jpeg|jpg|gif|webp|bmp)$/i.test(file.mimetype);
        cb(ok ? null : new Error('Invalid file type'), ok);
    }
});

let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Centralized twitch client management
let twitchClient = null;

function setupTwitchClient(channel) {
    if (!channel) return;
    // cleanup existing
    if (twitchClient) {
        try {
            twitchClient.removeAllListeners();
            // disconnect returns a promise
            twitchClient.disconnect().catch(() => {});
        } catch (e) { /* ignore */ }
        twitchClient = null;
    }

    twitchClient = new tmi.Client({ channels: [channel] });

    twitchClient.on('connected', (addr, port) => {
        console.log(`Connected to Twitch chat for: ${channel} (${addr}:${port})`);
    });

    twitchClient.on('message', (channelName, tags, message, self) => {
        if (self) return;
        const username = tags['display-name'] || tags['username'] || 'unknown';
        const twitchColor = tags['color'] || '#ff0000';
        io.emit('new-chatter', {
            username,
            color: twitchColor,
            twitchColor,
            message
        });
        console.log(`Chat message from ${username} (${channelName}).`);
    });

    twitchClient.connect().catch(err => {
        console.error('Failed to connect to Twitch:', err);
    });
}

// initial connect
setupTwitchClient(config.channelName || '');

// Watch config.json for channel changes and reload
fs.watchFile('config.json', () => {
    try {
        const newConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        if (newConfig.channelName && newConfig.channelName !== config.channelName) {
            console.log(`Channel changed: ${config.channelName} -> ${newConfig.channelName}. Reconnecting Twitch client.`);
            setupTwitchClient(newConfig.channelName);
        }
        config = newConfig;
    } catch (e) {
        console.error('Failed to reload config.json', e);
    }
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
    try {
        fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
        res.json({ success: true });
    } catch (e) {
        console.error('Failed to write config.json', e);
        res.status(500).json({ success: false, error: 'Failed to save config' });
    }
});

// Sprite upload endpoint
app.post('/upload-sprite', upload.single('sprite'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
        const ext = path.extname(req.file.originalname) || '';
        const safeExt = ext.toLowerCase().replace(/[^.a-z0-9]/g, '') || '.png';
        const newName = `sprite_${Date.now()}${safeExt}`;
        const newPath = path.join(__dirname, 'public', 'sprites', newName);
        fs.renameSync(req.file.path, newPath);
        if (!Array.isArray(config.sprites)) config.sprites = [];
        config.sprites.push({ url: `/sprites/${newName}`, frames: 6 });
        fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
        res.json({ success: true, url: `/sprites/${newName}` });
    } catch (e) {
        console.error('Upload error', e);
        res.status(500).json({ success: false, error: 'Upload failed' });
    }
});

// Delete a single sprite endpoint
app.post('/delete-sprite', (req, res) => {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ success: false });
    try {
        if (Array.isArray(config.sprites)) {
            config.sprites = config.sprites.filter(s => s.url !== url);
            const filePath = path.join(__dirname, 'public', url);
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) { console.warn('Failed to delete file', filePath, e); }
            }
            fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
        }
        res.json({ success: true });
    } catch (e) {
        console.error('Failed to delete sprite', e);
        res.status(500).json({ success: false, error: 'Failed to delete' });
    }
});

app.post('/delete-all-sprites', (req, res) => {
    try {
        const spritesDir = path.join(__dirname, 'public', 'sprites');
        if (!fs.existsSync(spritesDir)) {
            if (!Array.isArray(config.sprites)) config.sprites = [];
            fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
            return res.json({ success: true, deleted: 0, removedFromConfig: 0 });
        }

        const files = fs.readdirSync(spritesDir).filter(f => /\.(png|jpe?g|gif|webp|bmp)$/i.test(f));
        let deleted = 0;
        files.forEach(file => {
            try {
                fs.unlinkSync(path.join(spritesDir, file));
                deleted++;
            } catch (e) {
                console.warn('Failed to delete sprite file', file, e);
            }
        });

        if (!Array.isArray(config.sprites)) config.sprites = [];
        const before = config.sprites.length;
        config.sprites = config.sprites.filter(s => {
            if (!s || !s.url) return true;
            const u = String(s.url);
            return !(u.includes('/sprites/') || u.includes('/packs/'));
        });
        const removedFromConfig = before - config.sprites.length;
        fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
        res.json({ success: true, deleted, removedFromConfig });
    } catch (err) {
        console.error('Failed to delete all sprites', err);
        res.status(500).json({ success: false, error: 'Failed to delete sprites' });
    }
});

// List available sprite packs
app.get('/sprite-packs', (req, res) => {
    const packsDir = path.join(__dirname, 'packs');
    if (!fs.existsSync(packsDir)) return res.json([]);
    try {
        const entries = fs.readdirSync(packsDir, { withFileTypes: true })
            .filter(d => d.isDirectory()).map(d => d.name);
        const packs = entries.map(id => {
            const manifestPath = path.join(packsDir, id, 'manifest.json');
            if (fs.existsSync(manifestPath)) {
                try {
                    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                    if (m.sprites && m.sprites.length && !m.preview) {
                        m.preview = `/packs/${id}/${m.sprites[0].file || m.sprites[0].url}`;
                    } else if (!m.preview) {
                        m.preview = `/packs/${id}/preview.png`;
                    }
                    return { id, ...m };
                } catch (e) {
                    return { id, name: id, description: '', preview: `/packs/${id}/preview.png`, sprites: [] };
                }
            } else {
                const files = fs.readdirSync(path.join(packsDir, id)).filter(f => /\.(png|jpe?g|gif)$/i.test(f));
                const preview = files.length ? `/packs/${id}/${files[0]}` : null;
                return { id, name: id, description: '', preview, sprites: files.map(f => ({ file: f })) };
            }
        });
        res.json(packs);
    } catch (e) {
        console.error('Failed to list packs', e);
        res.status(500).json([]);
    }
});

// Install pack
app.post('/install-pack', (req, res) => {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, error: 'Missing pack id' });
    const packDir = path.join(__dirname, 'packs', id);
    const manifestPath = path.join(packDir, 'manifest.json');
    if (!fs.existsSync(packDir)) return res.status(404).json({ success: false, error: 'Pack not found' });

    let manifest = null;
    if (fs.existsSync(manifestPath)) {
        try {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        } catch (e) { manifest = null; }
    }

    let spritesToAdd = [];
    if (manifest && Array.isArray(manifest.sprites) && manifest.sprites.length) {
        spritesToAdd = manifest.sprites.map(sp => {
            const file = sp.url || sp.file;
            const url = file && file.startsWith('http') ? file : `/packs/${id}/${file}`;
            return {
                url,
                frames: sp.frames != null ? sp.frames : (sp.framesX && sp.framesY ? (sp.framesX * sp.framesY) : 6),
                frameSpeed: sp.frameSpeed,
                framesX: sp.framesX,
                framesY: sp.framesY,
                direction: sp.direction,
                crop: sp.crop,
                selectedFrames: sp.selectedFrames
            };
        });
    } else {
        const files = fs.readdirSync(packDir).filter(f => /\.(png|jpe?g|gif)$/i.test(f));
        spritesToAdd = files.map(f => ({ url: `/packs/${id}/${f}`, frames: 6 }));
    }

    if (!Array.isArray(config.sprites)) config.sprites = [];
    config.sprites = config.sprites.concat(spritesToAdd);
    try {
        fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
        res.json({ success: true, added: spritesToAdd.length, config });
    } catch (e) {
        console.error('Failed to write config on pack install', e);
        res.status(500).json({ success: false, error: 'Failed to save config' });
    }
});

io.on('connection', (socket) => {
    console.log('A client (OBS Browser Source) connected.');
    socket.on('disconnect', () => {
        console.log('A client disconnected.');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
