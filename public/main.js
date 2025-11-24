const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socket = io();

canvas.width = 1920;
canvas.height = 1080;

const avatars = [];
const spriteImage = new Image();
spriteImage.src = 'sprite.png';

const FRAME_WIDTH = 32;
const FRAME_HEIGHT = 50;
const SCALE = 3;
const DISPLAY_WIDTH = FRAME_WIDTH * SCALE;
const DISPLAY_HEIGHT = FRAME_HEIGHT * SCALE;
const DEFAULT_WALKING_SPEED = 1;
const STAGGER_FRAMES = 8;

let userSettings = null;

async function loadConfig() {
    const res = await fetch('/config');
    userSettings = await res.json();
    startApp();
}

function getUserSettings() {
    const jumpsPerMinute = parseFloat(userSettings.jumpChance) || 1;
    const jumpChance = jumpsPerMinute / 3600;
    return {
        username: userSettings.username || 'Guest',
        color: userSettings.avatarColor || '#ff0000',
        walkingSpeed: parseFloat(userSettings.walkingSpeed) || DEFAULT_WALKING_SPEED,
        useTwitchColor: !!userSettings.useTwitchColor,
        enableJumping: !!userSettings.enableJumping,
        jumpVelocity: parseFloat(userSettings.jumpVelocity) || 12,
        gravity: parseFloat(userSettings.gravity) || 1,
        jumpChance: jumpChance,
        enableMessageDisplay: !!userSettings.enableMessageDisplay,
        messageChance: parseFloat(userSettings.messageChance) || 5
    };
}

class Avatar {
    constructor(username, color, walkingSpeed = DEFAULT_WALKING_SPEED, settings = {}) {
        this.x = Math.random() * (canvas.width - DISPLAY_WIDTH);
        this.y = canvas.height - DISPLAY_HEIGHT - 10;
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
    }

    setMessage(msg) {
        this.message = msg;
        this.messageTimer = 180; // 3 seconds at 60 FPS
    }

    update() {
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
        if (this.x < 0 || this.x + DISPLAY_WIDTH > canvas.width) {
            this.dx *= -1;
        }
        if (this.gameFrame % STAGGER_FRAMES === 0) {
            this.frameX = (this.frameX + 1) % 3;
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
        if (this.dx < 0) {
            ctx.scale(-1, 1);
            ctx.drawImage(
                spriteImage,
                this.frameX * FRAME_WIDTH, 0, FRAME_WIDTH, FRAME_HEIGHT,
                -this.x - DISPLAY_WIDTH, this.y, DISPLAY_WIDTH, DISPLAY_HEIGHT
            );
        } else {
            ctx.drawImage(
                spriteImage,
                this.frameX * FRAME_WIDTH, 0, FRAME_WIDTH, FRAME_HEIGHT,
                this.x, this.y, DISPLAY_WIDTH, DISPLAY_HEIGHT
            );
        }
        ctx.restore();

        ctx.fillStyle = this.color;
        ctx.font = `${10 * SCALE}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(this.username, this.x + DISPLAY_WIDTH / 2, this.y - 10);
        ctx.fillText(this.username, this.x + DISPLAY_WIDTH / 2, this.y - 10);

        // Draw message if present
        if (this.message && this.messageTimer > 0) {
            ctx.save();
            ctx.font = `${8 * SCALE}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(this.message, this.x + DISPLAY_WIDTH / 2, this.y - 50);
            ctx.fillStyle = '#fff';
            ctx.fillText(this.message, this.x + DISPLAY_WIDTH / 2, this.y - 50);
            ctx.restore();
        }
    }
}

function startApp() {
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
            Math.random() < (settings.messageChance / 100) &&
            data.message
        ) {
            avatar.setMessage(data.message);
        }
    });

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = avatars.length - 1; i >= 0; i--) {
            const avatar = avatars[i];
            avatar.update();
            avatar.draw();
        }
        requestAnimationFrame(animate);
    }

    spriteImage.onload = animate;
}

loadConfig();