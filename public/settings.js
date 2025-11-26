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
let uploadedSprites = []; // {url, frames, framesX, framesY, direction, crop}

function renderSpriteGallery() {
    spriteGallery.innerHTML = '';
    uploadedSprites.forEach((s, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'sprite-wrapper';

        const img = new window.Image();
        img.src = s.url;
        img.onload = () => {
            const crop = s.crop || { x: 0, y: 0, w: img.width, h: img.height };
            const canvas = document.createElement('canvas');
            canvas.width = crop.w;
            canvas.height = crop.h;
            canvas.className = 'sprite-img';

            // Always set CSS height to 50px, width auto (preserve aspect)
            const cssH = 50;
            const cssW = Math.round((crop.w / crop.h) * cssH);
            canvas.style.height = cssH + 'px';
            canvas.style.width = cssW + 'px';

            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, crop.w, crop.h);
            ctx.drawImage(
                img,
                crop.x, crop.y, crop.w, crop.h,
                0, 0, crop.w, crop.h
            );
            wrapper.insertBefore(canvas, wrapper.firstChild);
        };
        img.onerror = () => {
            // fallback: show nothing or error
        };

        // --- Frame label and input ---
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

        // --- Edit button ---
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.textContent = 'Edit';
        editBtn.className = 'button';
        editBtn.style.marginTop = '4px';
        editBtn.addEventListener('click', () => openSpriteEditor(idx));
        wrapper.appendChild(editBtn);

        // --- Delete button ---
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
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

function clearAvatarsForCurrentChannel() {
    const channel = channelNameInput.value;
    localStorage.removeItem('avatars_' + channel);
}

enableDespawnInput.addEventListener('change', () => {
    if (enableDespawnInput.checked) {
        clearAvatarsForCurrentChannel();
    }
});

useTwitchColorInput.addEventListener('change', () => {
    clearAvatarsForCurrentChannel();
});

// Sprite Editor logic
let editingSpriteIdx = null;
let editorImage = null;
let crop = { x: 0, y: 0, w: 100, h: 100 };
let isDragging = false, dragStart = {};

const spriteEditorModal = document.getElementById('spriteEditorModal');
const spriteEditorCanvas = document.getElementById('spriteEditorCanvas');
const editorFrames = document.getElementById('editorFrames');
const editorFramesX = document.getElementById('editorFramesX');
const editorFramesY = document.getElementById('editorFramesY');
const editorDirection = document.getElementById('editorDirection');
const saveSpriteEdit = document.getElementById('saveSpriteEdit');
const closeSpriteEditor = document.getElementById('closeSpriteEditor');

let dragStartCol = 0, dragStartRow = 0;

function openSpriteEditor(idx) {
    editingSpriteIdx = idx;
    editorImage = new window.Image();
    editorImage.src = uploadedSprites[idx].url;
    editorImage.onload = () => {
        crop = uploadedSprites[idx].crop
            ? { ...uploadedSprites[idx].crop }
            : { x: 0, y: 0, w: editorImage.width, h: editorImage.height };
        editorFrames.value = uploadedSprites[idx].frames || 6;
        editorFramesX.value = uploadedSprites[idx].framesX || uploadedSprites[idx].frames || 6;
        editorFramesY.value = uploadedSprites[idx].framesY || 1;
        editorDirection.value = uploadedSprites[idx].direction || 'horizontal';
        drawEditorCanvas();
        spriteEditorModal.classList.add('active');
    };
}

function drawEditorCanvas() {
    const ctx = spriteEditorCanvas.getContext('2d');
    ctx.clearRect(0, 0, spriteEditorCanvas.width, spriteEditorCanvas.height);
    // Fit image to canvas
    const scale = Math.min(spriteEditorCanvas.width / editorImage.width, spriteEditorCanvas.height / editorImage.height, 1);
    const offsetX = (spriteEditorCanvas.width - editorImage.width * scale) / 2;
    const offsetY = (spriteEditorCanvas.height - editorImage.height * scale) / 2;
    ctx.drawImage(editorImage, offsetX, offsetY, editorImage.width * scale, editorImage.height * scale);
    // Draw crop rectangle
    ctx.strokeStyle = '#b280ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(
        offsetX + crop.x * scale,
        offsetY + crop.y * scale,
        crop.w * scale,
        crop.h * scale
    );
}

spriteEditorCanvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = spriteEditorCanvas.getBoundingClientRect();
    dragStart = {
        x: (e.clientX - rect.left),
        y: (e.clientY - rect.top)
    };
    const scale = Math.min(spriteEditorCanvas.width / editorImage.width, spriteEditorCanvas.height / editorImage.height, 1);
    const offsetX = (spriteEditorCanvas.width - editorImage.width * scale) / 2;
    const offsetY = (spriteEditorCanvas.height - editorImage.height * scale) / 2;
    const framesX = parseInt(editorFramesX.value, 10) || 1;
    const framesY = parseInt(editorFramesY.value, 10) || 1;
    const frameW = Math.floor(editorImage.width / framesX);
    const frameH = Math.floor(editorImage.height / framesY);
    dragStartCol = Math.floor(((dragStart.x - offsetX) / scale) / frameW);
    dragStartRow = Math.floor(((dragStart.y - offsetY) / scale) / frameH);
    handleSnapCrop(e);
});

spriteEditorCanvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    handleSnapCrop(e);
});
spriteEditorCanvas.addEventListener('mouseup', () => { isDragging = false; });

function handleSnapCrop(e) {
    const rect = spriteEditorCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    const scale = Math.min(spriteEditorCanvas.width / editorImage.width, spriteEditorCanvas.height / editorImage.height, 1);
    const offsetX = (spriteEditorCanvas.width - editorImage.width * scale) / 2;
    const offsetY = (spriteEditorCanvas.height - editorImage.height * scale) / 2;
    const framesX = parseInt(editorFramesX.value, 10) || 1;
    const framesY = parseInt(editorFramesY.value, 10) || 1;
    const frameW = Math.floor(editorImage.width / framesX);
    const frameH = Math.floor(editorImage.height / framesY);

    let col = Math.floor(((x - offsetX) / scale) / frameW);
    let row = Math.floor(((y - offsetY) / scale) / frameH);
    col = Math.max(0, Math.min(framesX - 1, col));
    row = Math.max(0, Math.min(framesY - 1, row));
    const startCol = Math.min(dragStartCol, col);
    const endCol = Math.max(dragStartCol, col);
    const startRow = Math.min(dragStartRow, row);
    const endRow = Math.max(dragStartRow, row);

    crop.x = startCol * frameW;
    crop.y = startRow * frameH;
    crop.w = (endCol - startCol + 1) * frameW;
    crop.h = (endRow - startRow + 1) * frameH;

    drawEditorCanvas();
}

closeSpriteEditor.addEventListener('click', () => {
    spriteEditorModal.classList.remove('active');
});

saveSpriteEdit.addEventListener('click', () => {
    if (editingSpriteIdx !== null) {
        uploadedSprites[editingSpriteIdx].frames = parseInt(editorFrames.value, 10) || 6;
        uploadedSprites[editingSpriteIdx].framesX = parseInt(editorFramesX.value, 10) || 1;
        uploadedSprites[editingSpriteIdx].framesY = parseInt(editorFramesY.value, 10) || 1;
        uploadedSprites[editingSpriteIdx].direction = editorDirection.value;
        uploadedSprites[editingSpriteIdx].crop = { ...crop };
        renderSpriteGallery();
        saveSpritesConfig();
        spriteEditorModal.classList.remove('active'); // <-- fix here
    }
});