const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socket = io();

const avatars = [];
let spriteImage = new Image();
let spriteFrames = 6; // default

let userSettings = null;

async function loadConfig() {
    const res = await fetch('/config');
    userSettings = await res.json();
    spriteImage.src = userSettings.spriteUrl || 'sprite.png';
    spriteFrames = userSettings.spriteFrames || 6;
    spriteImage.onload = startApp;
}

let prevWidth = canvas.width;
let prevHeight = canvas.height;

function resizeCanvas() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    // Scale avatar positions
    if (prevWidth) {
        const scaleX = newWidth / prevWidth;
        avatars.forEach(avatar => {
            avatar.x *= scaleX;
            avatar.baseY = newHeight - avatar.size - 10;
            if (!avatar.isJumping) {
                avatar.y = avatar.baseY;
            }
        });
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    prevWidth = newWidth;
    prevHeight = newHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function getUserSettings() {
    const jumpsPerMinute = parseFloat(userSettings.jumpChance) || 1;
    const jumpChance = jumpsPerMinute / 3600;
    return {
        channelName: userSettings.channelName || 'default',
        color: userSettings.avatarColor || '#ff0000',
        walkingSpeed: parseFloat(userSettings.walkingSpeed) || 1,
        useTwitchColor: !!userSettings.useTwitchColor,
        enableJumping: !!userSettings.enableJumping,
        jumpVelocity: parseFloat(userSettings.jumpVelocity) || 12,
        gravity: parseFloat(userSettings.gravity) || 1,
        jumpChance: jumpChance,
        enableMessageDisplay: !!userSettings.enableMessageDisplay,
        messageChance: parseFloat(userSettings.messageChance) || 5,
        avatarSize: parseInt(userSettings.avatarSize, 10) || 64,
        nameFontSize: parseInt(userSettings.nameFontSize, 10) || 20,
        directionChangeChance: parseFloat(userSettings.directionChangeChance) || 1,
        muteMessages: !!userSettings.muteMessages,
        showShadows: userSettings.showShadows !== undefined ? !!userSettings.showShadows : true,
        avatarOpacity: parseFloat(userSettings.avatarOpacity) || 1,
        enableDespawn: !!userSettings.enableDespawn,
        despawnTime: parseInt(userSettings.despawnTime, 10) || 60
    };
}

// --- Avatar persistence helpers ---
function saveAvatars(channelName, avatars) {
    const data = avatars.map(a => ({
        username: a.username,
        color: a.color,
        x: a.x,
        y: a.y,
        baseY: a.baseY,
        dx: a.dx,
        spawnTime: a.spawnTime
    }));
    localStorage.setItem('avatars_' + channelName, JSON.stringify(data));
    localStorage.setItem('avatars_channel', channelName);
}

function loadAvatars(channelName, settings) {
    const saved = localStorage.getItem('avatars_' + channelName);
    if (!saved) return [];
    try {
        const arr = JSON.parse(saved);
        return arr.map(a => {
            const avatar = new Avatar(a.username, a.color, settings.walkingSpeed, settings);
            avatar.x = a.x;
            avatar.y = a.y;
            avatar.baseY = a.baseY;
            avatar.dx = a.dx;
            avatar.spawnTime = a.spawnTime || Date.now();
            return avatar;
        });
    } catch {
        return [];
    }
}
// --- End Avatar persistence helpers ---

// --- Word wrapping helper ---
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lines = [];
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);
    for (let i = 0; i < lines.length; i++) {
        ctx.strokeText(lines[i], x, y + i * lineHeight);
        ctx.fillText(lines[i], x, y + i * lineHeight);
    }
}
// --- End word wrapping helper ---

class Avatar {
    constructor(username, color, walkingSpeed = 1, settings = {}) {
        this.settings = settings;
        this.size = settings.avatarSize || 64;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = canvas.height - this.size - 10;
        this.baseY = this.y;
        const randomSpeedFactor = Math.random() * 1 + 0.5;
        this.dx = (Math.random() < 0.5 ? 1 : -1) * walkingSpeed * randomSpeedFactor;
        this.username = username;
        this.color = color;
        this.message = null;
        this.messageTimer = 0;
        this.frameX = 0;
        this.gameFrame = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.gravity = settings.gravity ?? 1;
        this.enableJumping = settings.enableJumping ?? true;
        this.userJumpVelocity = settings.jumpVelocity ?? 12;
        this.jumpChance = settings.jumpChance ?? 0.001;
        this.directionChangeChance = (settings.directionChangeChance || 1) / 100;
        this.showShadows = settings.showShadows !== undefined ? settings.showShadows : true;
        this.avatarOpacity = settings.avatarOpacity !== undefined ? settings.avatarOpacity : 1;
        this.nameFontSize = settings.nameFontSize || 20;
        this.muteMessages = !!settings.muteMessages;
        this.spawnTime = Date.now();
    }

    setMessage(msg) {
        this.message = msg;
        this.messageTimer = 180; // 3 seconds at 60 FPS
    }

    update() {
        // Randomly change direction
        if (Math.random() < this.directionChangeChance / 60) {
            this.dx *= -1;
        }
        if (this.enableJumping && !this.isJumping && Math.random() < this.jumpChance) {
            this.isJumping = true;
            this.jumpVelocity = -this.userJumpVelocity - Math.random() * 4;
        }
        if (this.isJumping) {
            this.y += this.jumpVelocity;
            this.jumpVelocity += this.gravity;
            if (this.y >= this.baseY) {
                this.y = this.baseY;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        }
        this.x += this.dx;
        if (this.x < 0 || this.x + this.size > canvas.width) {
            this.dx *= -1;
        }
        if (this.gameFrame % Math.max(1, Math.floor(60 / spriteFrames)) === 0) {
            this.frameX = (this.frameX + 1) % spriteFrames;
        }
        if (this.messageTimer > 0) {
            this.messageTimer--;
            if (this.messageTimer === 0) {
                this.message = null;
            }
        }
        this.gameFrame++;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.avatarOpacity;

        // Calculate shadow scale based on jump height
        let jumpHeight = this.baseY - this.y;
        let maxJump = this.userJumpVelocity * 1.5; // Estimate max jump height
        let shadowScale = 1 - Math.min(jumpHeight / (maxJump * 2), 0.2); // Shrink up to 70%

        // Draw shadow
        if (this.showShadows) {
            ctx.save();
            ctx.globalAlpha = 0.1 * this.avatarOpacity;
            ctx.beginPath();
            ctx.ellipse(
                this.x + this.size / 2,
                this.baseY + this.size - 5,
                (this.size / 2.2) * shadowScale,
                (this.size / 7) * shadowScale,
                0, 0, 2 * Math.PI
            );
            ctx.fillStyle = "#000";
            ctx.fill();
            ctx.restore();
        }

        // Calculate frame width/height based on image and frame count
        const frameWidth = spriteImage.width / spriteFrames;
        const frameHeight = spriteImage.height;

        // Draw avatar sprite
        if (this.dx < 0) {
            ctx.scale(-1, 1);
            ctx.drawImage(
                spriteImage,
                this.frameX * frameWidth, 0, frameWidth, frameHeight,
                -this.x - this.size, this.y, this.size, this.size
            );
        } else {
            ctx.drawImage(
                spriteImage,
                this.frameX * frameWidth, 0, frameWidth, frameHeight,
                this.x, this.y, this.size, this.size
            );
        }
        ctx.restore();

        // Draw username
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.font = `${this.nameFontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(this.username, this.x + this.size / 2, this.y - 10);
        ctx.fillText(this.username, this.x + this.size / 2, this.y - 10);
        ctx.restore();

        // Draw message if present and not muted
        if (this.message && this.messageTimer > 0 && !this.muteMessages) {
            ctx.save();
            ctx.font = `${Math.round(this.nameFontSize * 0.8)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.fillStyle = '#fff';
            const maxWidth = Math.max(200, this.size * 2);
            const lineHeight = Math.round(this.nameFontSize * 0.9);

            // Calculate wrapped lines
            const words = this.message.split(' ');
            let line = '';
            let lines = [];
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    lines.push(line);
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line);

            // Calculate y so the bottom of the text is above the character
            const totalHeight = lines.length * lineHeight;
            const baseY = this.y - 55; // 55 keeps a gap above the avatar
            const startY = baseY - totalHeight + lineHeight;

            for (let i = 0; i < lines.length; i++) {
                ctx.strokeText(lines[i], this.x + this.size / 2, startY + i * lineHeight);
                ctx.fillText(lines[i], this.x + this.size / 2, startY + i * lineHeight);
            }
            ctx.restore();
        }
    }
}

function startApp() {
    const settings = getUserSettings();

    // --- Avatar persistence logic ---
    const lastChannel = localStorage.getItem('avatars_channel');
    if (lastChannel && lastChannel !== settings.channelName) {
        localStorage.removeItem('avatars_' + lastChannel);
    }
    avatars.length = 0;
    avatars.push(...loadAvatars(settings.channelName, settings));
    localStorage.setItem('avatars_channel', settings.channelName);
    // --- End avatar persistence logic ---

    socket.on('new-chatter', (data) => {
        const settings = getUserSettings();
        let color;
        if (settings.useTwitchColor) {
            color = data.color ? data.color : '#9147ff';
        } else {
            color = settings.color;
        }
        let avatar = avatars.find(a => a.username === data.username);
        if (!avatar) {
            avatar = new Avatar(
                data.username,
                color,
                settings.walkingSpeed,
                settings
            );
            avatars.push(avatar);
        }
        if (
            settings.enableMessageDisplay &&
            !settings.muteMessages &&
            Math.random() < (settings.messageChance / 100) &&
            data.message
        ) {
            avatar.setMessage(data.message);
        }
    });

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const now = Date.now();
        const settings = getUserSettings();

        for (let i = avatars.length - 1; i >= 0; i--) {
            const avatar = avatars[i];
            // Despawn logic
            if (
                settings.enableDespawn &&
                now - avatar.spawnTime > (settings.despawnTime * 1000)
            ) {
                avatars.splice(i, 1);
                continue;
            }
            avatar.update();
            avatar.draw();
        }

        saveAvatars(settings.channelName, avatars);

        requestAnimationFrame(animate);
    }

    if (spriteImage.complete) {
        animate();
    } else {
        spriteImage.onload = animate;
    }
}

loadConfig();