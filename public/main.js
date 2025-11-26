const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socket = io();

const avatars = [];
let spriteImages = [];
let spriteFramesArr = [];
let userSettings = null;

async function loadConfig() {
    const res = await fetch('/config');
    userSettings = await res.json();
    if (Array.isArray(userSettings.sprites) && userSettings.sprites.length > 0) {
        spriteImages = userSettings.sprites.map(s => {
            const img = new Image();
            img.src = s.url;
            return img;
        });
        spriteFramesArr = userSettings.sprites.map(s => s.frames || 6);
        // Wait for all images to load
        await Promise.all(spriteImages.map(img => new Promise(r => {
            if (img.complete) r();
            else img.onload = r;
        })));
        startApp();
    } else {
        // fallback to single sprite
        const img = new Image();
        img.src = userSettings.spriteUrl;
        spriteImages = [img];
        spriteFramesArr = [userSettings.spriteFrames || 6];
        img.onload = startApp;
    }
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
        nameFontFamily: userSettings.nameFontFamily || 'sans-serif',
        nameFontWeight: userSettings.nameFontWeight || 'bold',
        nameFontStyle: userSettings.nameFontStyle || 'normal',
        nameStrokeStyle: userSettings.nameStrokeStyle || '#000000',
        nameLineWidth: userSettings.nameLineWidth != null ? userSettings.nameLineWidth : 2,
        directionChangeChance: parseFloat(userSettings.directionChangeChance) || 1,
        muteMessages: !!userSettings.muteMessages,
        showShadows: userSettings.showShadows !== undefined ? !!userSettings.showShadows : true,
        avatarOpacity: parseFloat(userSettings.avatarOpacity) || 1,
        enableDespawn: !!userSettings.enableDespawn,
        despawnTime: parseInt(userSettings.despawnTime, 10) || 60,
        messageDisappearTime: parseFloat(userSettings.messageDisappearTime) || 3,
        messageFontFamily: userSettings.messageFontFamily || 'sans-serif',
        messageFontWeight: userSettings.messageFontWeight || 'normal',
        messageFontStyle: userSettings.messageFontStyle || 'normal',
        messageStrokeStyle: userSettings.messageStrokeStyle || '#000000',
        messageLineWidth: userSettings.messageLineWidth != null ? userSettings.messageLineWidth : 3,
        messageFillStyle: userSettings.messageFillStyle || '#ffffff',
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
        spawnTime: a.spawnTime,
        spriteIdx: a.spriteIdx
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
            const avatar = new Avatar(a.username, a.color, settings.walkingSpeed, settings, a.spriteIdx);
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

class Avatar {
    constructor(username, color, walkingSpeed = 1, settings = {}, spriteIdx = null) {
        this.size = settings.avatarSize || 64;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = canvas.height - this.size - 10;
        this.baseY = this.y;
        const randomSpeedFactor = Math.random() + 0.5;
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
        this.nameFontFamily = settings.nameFontFamily || 'sans-serif';
        this.nameFontWeight = settings.nameFontWeight || 'bold';
        this.nameFontStyle = settings.nameFontStyle || 'normal';
        this.nameStrokeStyle = settings.nameStrokeStyle || '#000000';
        this.nameLineWidth = settings.nameLineWidth != null ? settings.nameLineWidth : 2;
        this.messageFontFamily = settings.messageFontFamily || 'sans-serif';
        this.messageFontWeight = settings.messageFontWeight || 'normal';
        this.messageFontStyle = settings.messageFontStyle || 'normal';
        this.messageStrokeStyle = settings.messageStrokeStyle || '#000000';
        this.messageLineWidth = settings.messageLineWidth != null ? settings.messageLineWidth : 3;
        this.messageFillStyle = settings.messageFillStyle || '#ffffff';
        this.spawnTime = Date.now();
        this.messageDisappearTime = settings.messageDisappearTime || 3;
        // Sprite selection
        if (spriteIdx !== null && spriteImages[spriteIdx]) {
            this.spriteIdx = spriteIdx;
        } else {
            this.spriteIdx = Math.floor(Math.random() * spriteImages.length);
        }
        this.spriteImage = spriteImages[this.spriteIdx];
        this.spriteFrames = spriteFramesArr[this.spriteIdx];
    }

    setMessage(msg) {
        this.message = msg;
        this.messageTimer = Math.round((this.messageDisappearTime || 3) * 60); // seconds to frames
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
        if (this.gameFrame % Math.max(1, Math.floor(60 / this.spriteFrames)) === 0) {
            this.frameX = (this.frameX + 1) % this.spriteFrames;
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

        // --- Sprite cropping and direction logic ---
        let spriteConfig = (userSettings.sprites && userSettings.sprites[this.spriteIdx]) || {};
        let crop = spriteConfig.crop || { x: 0, y: 0, w: this.spriteImage.width, h: this.spriteImage.height };
        let direction = spriteConfig.direction || 'horizontal';
        let frames = spriteConfig.frames || this.spriteFrames;

        let frameWidth, frameHeight, sx, sy;
        if (direction === 'vertical') {
            frameWidth = crop.w;
            frameHeight = crop.h / frames;
            sx = crop.x;
            sy = crop.y + this.frameX * frameHeight;
        } else {
            frameWidth = crop.w / frames;
            frameHeight = crop.h;
            sx = crop.x + this.frameX * frameWidth;
            sy = crop.y;
        }

        // --- Aspect ratio correction ---
        const targetW = this.size;
        const targetH = this.size;
        const frameAspect = frameWidth / frameHeight;
        const targetAspect = targetW / targetH;

        let drawW, drawH;
        if (frameAspect > targetAspect) {
            // Frame is wider than target: fit width
            drawW = targetW;
            drawH = targetW / frameAspect;
        } else {
            // Frame is taller than target: fit height
            drawH = targetH;
            drawW = targetH * frameAspect;
        }
        const offsetX = this.x + (targetW - drawW) / 2;
        const offsetY = this.y + (targetH - drawH) / 2;

        if (this.dx < 0) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.spriteImage,
                sx, sy, frameWidth, frameHeight,
                -offsetX - drawW, offsetY, drawW, drawH
            );
            ctx.restore();
        } else {
            ctx.drawImage(
                this.spriteImage,
                sx, sy, frameWidth, frameHeight,
                offsetX, offsetY, drawW, drawH
            );
        }
        ctx.restore();

        // Draw username
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.font = `${this.nameFontStyle} ${this.nameFontWeight} ${this.nameFontSize}px ${this.nameFontFamily}`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = this.nameStrokeStyle;
        ctx.lineWidth = this.nameLineWidth;
        ctx.strokeText(this.username, this.x + this.size / 2, this.y - 10);
        ctx.fillText(this.username, this.x + this.size / 2, this.y - 10);
        ctx.restore();

        // Draw message if present and not muted
        if (this.message && this.messageTimer > 0 && !this.muteMessages) {
            ctx.save();
            ctx.font = `${this.messageFontStyle} ${this.messageFontWeight} ${Math.round(this.nameFontSize * 0.8)}px ${this.messageFontFamily}`;
            ctx.textAlign = 'center';
            ctx.strokeStyle = this.messageStrokeStyle;
            ctx.lineWidth = this.messageLineWidth;
            ctx.fillStyle = this.messageFillStyle;
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

    animate();
}

loadConfig();