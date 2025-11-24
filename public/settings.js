const form = document.getElementById('settingsForm');
const colorInput = document.getElementById('avatarColor');
const speedInput = document.getElementById('walkingSpeed');
const useTwitchColorInput = document.getElementById('useTwitchColor');
const enableJumpingInput = document.getElementById('enableJumping');
const jumpVelocityInput = document.getElementById('jumpVelocity');
const gravityInput = document.getElementById('gravity');
const jumpChanceInput = document.getElementById('jumpChance');
const enableMessageDisplayInput = document.getElementById('enableMessageDisplay');
const messageChanceInput = document.getElementById('messageChance');
const channelNameInput = document.getElementById('channelName');

// Load settings from server
fetch('/config')
    .then(res => res.json())
    .then(config => {
        colorInput.value = config.avatarColor || '#ff0000';
        speedInput.value = config.walkingSpeed || '1';
        useTwitchColorInput.checked = !!config.useTwitchColor;
        enableJumpingInput.checked = !!config.enableJumping;
        jumpVelocityInput.value = config.jumpVelocity || '12';
        gravityInput.value = config.gravity || '1';
        jumpChanceInput.value = config.jumpChance || '1';
        enableMessageDisplayInput.checked = !!config.enableMessageDisplay;
        messageChanceInput.value = config.messageChance || '5';
        channelNameInput.value = config.channelName || 'ohnepixel';
    });

form.addEventListener('submit', function(e) {
    e.preventDefault();
    const newConfig = {
        channelName: channelNameInput.value,
        avatarColor: colorInput.value,
        walkingSpeed: parseFloat(speedInput.value),
        useTwitchColor: useTwitchColorInput.checked,
        enableJumping: enableJumpingInput.checked,
        jumpVelocity: parseFloat(jumpVelocityInput.value),
        gravity: parseFloat(gravityInput.value),
        jumpChance: parseFloat(jumpChanceInput.value),
        enableMessageDisplay: enableMessageDisplayInput.checked,
        messageChance: parseFloat(messageChanceInput.value)
    };
    fetch('/set-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
    }).then(() => {
        window.location.href = '/index.html';
    });
});