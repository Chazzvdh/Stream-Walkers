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

// --- New: serve sprite packs from ./packs ---
app.use('/packs', express.static(path.join(__dirname, 'packs')));

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

// Sprite upload endpoint (append to array)
app.post('/upload-sprite', upload.single('sprite'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false });
    const ext = req.file.originalname.split('.').pop();
    const newName = `sprite_${Date.now()}.${ext}`;
    const newPath = path.join('public/sprites', newName);
    fs.renameSync(req.file.path, newPath);
    if (!Array.isArray(config.sprites)) config.sprites = [];
    config.sprites.push({ url: `/sprites/${newName}`, frames: 6 });
    fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
    res.json({ success: true, url: `/sprites/${newName}` });
});

// Delete a single sprite endpoint
app.post('/delete-sprite', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false });
    if (Array.isArray(config.sprites)) {
        config.sprites = config.sprites.filter(s => s.url !== url);
        const filePath = path.join(__dirname, 'public', url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
    }
    res.json({ success: true });
});

app.post('/delete-all-sprites', (req, res) => {
    const spritesDir = path.join(__dirname, 'public', 'sprites');
    fs.readdir(spritesDir, (err, files) => {
        if (err) return res.json({ success: false });
        let pending = files.length;
        if (!pending) return res.json({ success: true });
        files.forEach(file => {
            fs.unlink(path.join(spritesDir, file), () => {
                pending -= 1;
                if (!pending) res.json({ success: true });
            });
        });
    });
});

// --- New: list available sprite packs (reads packs/<id>/manifest.json) ---
app.get('/sprite-packs', (req, res) => {
    const packsDir = path.join(__dirname, 'packs');
    if (!fs.existsSync(packsDir)) return res.json([]);
    try {
        const entries = fs.readdirSync(packsDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);
        const packs = entries.map(id => {
            const manifestPath = path.join(packsDir, id, 'manifest.json');
            if (fs.existsSync(manifestPath)) {
                try {
                    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                    // Provide preview path if not absolute
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
                // fallback: list image files in directory
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

// --- New: install a pack (merge pack sprites into config.sprites) ---
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
        } catch (e) {
            manifest = null;
        }
    }

    // Build sprite entries from manifest or by scanning files
    let spritesToAdd = [];
    if (manifest && Array.isArray(manifest.sprites) && manifest.sprites.length) {
        spritesToAdd = manifest.sprites.map(sp => {
            // allow absolute url in manifest, otherwise point into /packs/<id>/
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
        // fallback: add all images in the pack dir
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

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});