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
const avatarSizeInput = document.getElementById('avatarSize');
const nameFontSizeInput = document.getElementById('nameFontSize');
const directionChangeChanceInput = document.getElementById('directionChangeChance');
const muteMessagesInput = document.getElementById('muteMessages');
const showShadowsInput = document.getElementById('showShadows');
const avatarOpacityInput = document.getElementById('avatarOpacity');
const enableDespawnInput = document.getElementById('enableDespawn');
const despawnTimeInput = document.getElementById('despawnTime');

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
        avatarSizeInput.value = config.avatarSize || 64;
        nameFontSizeInput.value = config.nameFontSize || 20;
        directionChangeChanceInput.value = config.directionChangeChance || 1;
        muteMessagesInput.checked = !!config.muteMessages;
        showShadowsInput.checked = !!config.showShadows;
        avatarOpacityInput.value = config.avatarOpacity || 1;
        enableDespawnInput.checked = !!config.enableDespawn;
        despawnTimeInput.value = config.despawnTime || 60;
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
        messageChance: parseFloat(messageChanceInput.value),
        avatarSize: parseInt(avatarSizeInput.value, 10),
        nameFontSize: parseInt(nameFontSizeInput.value, 10),
        directionChangeChance: parseFloat(directionChangeChanceInput.value),
        muteMessages: muteMessagesInput.checked,
        showShadows: showShadowsInput.checked,
        avatarOpacity: parseFloat(avatarOpacityInput.value),
        enableDespawn: enableDespawnInput.checked,
        despawnTime: parseInt(despawnTimeInput.value, 10),
    };
    fetch('/set-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
    }).then(() => {
        window.location.href = '/index.html';
    });
});