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

const spriteInput = document.getElementById('spriteImage');
const spriteGallery = document.getElementById('spriteGallery');
let uploadedSprites = []; // {url, frames}

function renderSpriteGallery() {
    spriteGallery.innerHTML = '';
    uploadedSprites.forEach((s, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'sprite-wrapper';

        const img = document.createElement('img');
        img.src = s.url;
        img.className = 'sprite-img';
        img.title = `Frames: ${s.frames}`;
        wrapper.appendChild(img);

        const frameLabel = document.createElement('label');
        frameLabel.textContent = 'Frames:';
        frameLabel.className = 'sprite-frame-label';
        wrapper.appendChild(frameLabel);

        const frameInput = document.createElement('input');
        frameInput.type = 'number';
        frameInput.min = 1;
        frameInput.max = 20;
        frameInput.value = s.frames || 6;
        frameInput.className = 'sprite-frame-input';
        frameInput.addEventListener('change', () => {
            uploadedSprites[idx].frames = parseInt(frameInput.value, 10) || 6;
            saveSpritesConfig();
        });
        wrapper.appendChild(frameInput);

        const delBtn = document.createElement('button');
        delBtn.type = 'button'; // Prevent form submission
        delBtn.textContent = 'Delete';
        delBtn.className = 'button sprite-delete-btn';
        delBtn.addEventListener('click', () => {
            fetch('/delete-sprite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: s.url })
            }).then(() => {
                uploadedSprites.splice(idx, 1);
                renderSpriteGallery();
                saveSpritesConfig();
            });
        });
        wrapper.appendChild(delBtn);

        spriteGallery.appendChild(wrapper);
    });
}

// Delete All Sprites button logic
const deleteAllBtn = document.getElementById('deleteAllSprites');
if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', () => {
        if (!confirm('Are you sure you want to delete all sprites?')) return;
        fetch('/delete-all-sprites', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    uploadedSprites = [];
                    renderSpriteGallery();
                    saveSpritesConfig();
                }
            });
    });
}

function saveSpritesConfig() {
    fetch('/set-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...getFormConfig(),
            sprites: uploadedSprites
        })
    });
}

function getFormConfig() {
    return {
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
        despawnTime: parseInt(despawnTimeInput.value, 10)
    };
}

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
        uploadedSprites = Array.isArray(config.sprites) ? config.sprites : [];
        renderSpriteGallery();
    });

spriteInput.addEventListener('change', function() {
    const files = Array.from(spriteInput.files);
    if (!files.length) return;
    files.forEach(file => {
        const formData = new FormData();
        formData.append('sprite', file);
        fetch('/upload-sprite', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    uploadedSprites.push({ url: data.url, frames: 6 });
                    renderSpriteGallery();
                    saveSpritesConfig();
                }
            });
    });
});

form.addEventListener('submit', function(e) {
    e.preventDefault();
    const newConfig = {
        ...getFormConfig(),
        sprites: uploadedSprites
    };
    fetch('/set-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
    }).then(() => {
        window.location.href = '/index.html';
    });
});