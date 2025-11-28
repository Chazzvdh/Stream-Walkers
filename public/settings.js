// File: `public/settings.js`
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
const messageDisappearTimeInput = document.getElementById('messageDisappearTime');

const spriteInput = document.getElementById('spriteImage');
const spriteGallery = document.getElementById('spriteGallery');
let uploadedSprites = []; // {url, frames, framesX, framesY, direction, crop, frameSpeed}
let defaultFrameSpeed = 10;

const nameFontFamilyInput = document.getElementById('nameFontFamily');
const nameFontWeightInput = document.getElementById('nameFontWeight');
const nameFontStyleInput = document.getElementById('nameFontStyle');
const nameStrokeStyleInput = document.getElementById('nameStrokeStyle');
const nameLineWidthInput = document.getElementById('nameLineWidth');
const messageFontFamilyInput = document.getElementById('messageFontFamily');
const messageFontWeightInput = document.getElementById('messageFontWeight');
const messageFontStyleInput = document.getElementById('messageFontStyle');
const messageStrokeStyleInput = document.getElementById('messageStrokeStyle');
const messageLineWidthInput = document.getElementById('messageLineWidth');
const messageFillStyleInput = document.getElementById('messageFillStyle');

// new DOM ref used by search
const settingsSearch = document.getElementById('settingsSearch');

// editor state
let dragSelectMode = true;

// Helper: ensure a canvas has a DPR-scaled backing store and ctx transform
function ensureCanvasDPR(c) {
    const dpr = window.devicePixelRatio || 1;
    const cssW = c.clientWidth || parseInt(c.style.width) || c.width || 300;
    const cssH = c.clientHeight || parseInt(c.style.height) || c.height || 150;
    c.style.width = cssW + 'px';
    c.style.height = cssH + 'px';
    c.width = Math.max(1, Math.round(cssW * dpr));
    c.height = Math.max(1, Math.round(cssH * dpr));
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    try {
        ctx.imageSmoothingEnabled = false;
        if (typeof ctx.imageSmoothingQuality !== 'undefined') ctx.imageSmoothingQuality = 'low';
    } catch (e) {}
    return ctx;
}

function renderSpriteGallery() {
    spriteGallery.innerHTML = '';
    uploadedSprites.forEach((s, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'sprite-wrapper';

        const img = new window.Image();
        img.src = s.url;
        img.onload = () => {
            const crop = s.crop || { x: 0, y: 0, w: img.width, h: img.height };
            const framesX = s.framesX || s.frames || 1;
            const framesY = s.framesY || 1;
            const frameW = crop.w / framesX;
            const frameH = crop.h / framesY;
            const displayH = 50;
            const aspect = (frameW && frameH) ? (frameW / frameH) : 1;
            const displayW = Math.max(30, Math.round(displayH * aspect));

            const canvas = document.createElement('canvas');
            canvas.className = 'sprite-img';
            canvas.style.width = displayW + 'px';
            canvas.style.height = displayH + 'px';
            const ctx = ensureCanvasDPR(canvas);

            try {
                ctx.imageSmoothingEnabled = false;
                if (typeof ctx.imageSmoothingQuality !== 'undefined') ctx.imageSmoothingQuality = 'low';
            } catch (e) {}
            ctx.clearRect(0, 0, displayW, displayH);
            ctx.drawImage(
                img,
                crop.x, crop.y, frameW, frameH,
                0, 0, displayW, displayH
            );
            wrapper.insertBefore(canvas, wrapper.firstChild);
        };
        img.onerror = () => { /* ignore */ };

        const frameLabel = document.createElement('label');
        frameLabel.textContent = 'Frames:';
        frameLabel.className = 'sprite-frame-label';
        wrapper.appendChild(frameLabel);

        const frameInput = document.createElement('input');
        frameInput.type = 'number';
        frameInput.min = 1;
        frameInput.max = 100;
        frameInput.value = s.frames || 6;
        frameInput.className = 'sprite-frame-input';
        frameInput.addEventListener('change', () => {
            uploadedSprites[idx].frames = parseInt(frameInput.value, 10) || 6;
            saveSpritesConfig();
        });
        wrapper.appendChild(frameInput);

        const frameXLabel = document.createElement('label');
        frameXLabel.textContent = 'Frames X:';
        frameXLabel.className = 'sprite-frame-label';
        wrapper.appendChild(frameXLabel);

        const frameXInput = document.createElement('input');
        frameXInput.type = 'number';
        frameXInput.min = 1;
        frameXInput.max = 100;
        frameXInput.value = s.framesX || s.frames || 1;
        frameXInput.className = 'sprite-frame-input';
        frameXInput.addEventListener('change', () => {
            uploadedSprites[idx].framesX = parseInt(frameXInput.value, 10) || 1;
            saveSpritesConfig();
        });
        wrapper.appendChild(frameXInput);

        const frameYLabel = document.createElement('label');
        frameYLabel.textContent = 'Frames Y:';
        frameYLabel.className = 'sprite-frame-label';
        wrapper.appendChild(frameYLabel);

        const frameYInput = document.createElement('input');
        frameYInput.type = 'number';
        frameYInput.min = 1;
        frameYInput.max = 100;
        frameYInput.value = s.framesY || 1;
        frameYInput.className = 'sprite-frame-input';
        frameYInput.addEventListener('change', () => {
            uploadedSprites[idx].framesY = parseInt(frameYInput.value, 10) || 1;
            saveSpritesConfig();
        });
        wrapper.appendChild(frameYInput);

        const frameSpeedLabel = document.createElement('label');
        frameSpeedLabel.textContent = 'Frame Speed:';
        frameSpeedLabel.className = 'sprite-frame-label';
        wrapper.appendChild(frameSpeedLabel);

        const frameSpeedInput = document.createElement('input');
        frameSpeedInput.type = 'number';
        frameSpeedInput.min = 1;
        frameSpeedInput.max = 60;
        frameSpeedInput.value = s.frameSpeed != null ? s.frameSpeed : defaultFrameSpeed;
        frameSpeedInput.className = 'sprite-frame-input';
        frameSpeedInput.style.width = '60px';
        frameSpeedInput.addEventListener('change', () => {
            uploadedSprites[idx].frameSpeed = parseInt(frameSpeedInput.value, 10) || defaultFrameSpeed;
            saveSpritesConfig();
        });
        wrapper.appendChild(frameSpeedInput);

        const btnRow = document.createElement('div');
        btnRow.className = 'sprite-btn-row';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.textContent = 'Edit';
        editBtn.className = 'button';
        editBtn.addEventListener('click', () => openSpriteEditor(idx));
        btnRow.appendChild(editBtn);

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
            }).catch(e => {
                console.error('Failed to delete sprite', e);
            });
        });
        btnRow.appendChild(delBtn);

        wrapper.appendChild(btnRow);
        spriteGallery.appendChild(wrapper);
    });
}

const setAllFrameSpeedInput = document.getElementById('setAllFrameSpeed');
const applyAllFrameSpeedBtn = document.getElementById('applyAllFrameSpeed');
if (applyAllFrameSpeedBtn && setAllFrameSpeedInput) {
    applyAllFrameSpeedBtn.addEventListener('click', () => {
        const val = parseInt(setAllFrameSpeedInput.value, 10) || 10;
        defaultFrameSpeed = val;
        uploadedSprites.forEach(s => { s.frameSpeed = val; });
        renderSpriteGallery();
        saveSpritesConfig();
    });
}

// Debounce helper
function debounce(fn, wait = 150) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

// Debounced network save
const debouncedSave = debounce((payload) => {
    fetch('/set-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(e => console.error('Failed to save config', e));
}, 300);

// Replace saveSpritesConfig with debounce support
function saveSpritesConfig(immediate = false) {
    const payload = {
        ...getFormConfig(),
        defaultFrameSpeed,
        sprites: uploadedSprites
    };
    if (immediate) {
        fetch('/set-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(e => console.error('Failed to save config', e));
    } else {
        debouncedSave(payload);
    }
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
        despawnTime: parseInt(despawnTimeInput.value, 10),
        messageDisappearTime: parseFloat(messageDisappearTimeInput.value),
        nameFontFamily: nameFontFamilyInput.value,
        nameFontWeight: nameFontWeightInput.value,
        nameFontStyle: nameFontStyleInput.value,
        nameStrokeStyle: nameStrokeStyleInput.value,
        nameLineWidth: parseInt(nameLineWidthInput.value, 10),
        messageFontFamily: messageFontFamilyInput.value,
        messageFontWeight: messageFontWeightInput.value,
        messageFontStyle: messageFontStyleInput.value,
        messageStrokeStyle: messageStrokeStyleInput.value,
        messageLineWidth: parseInt(messageLineWidthInput.value, 10),
        messageFillStyle: messageFillStyleInput.value,
    };
}

// Load settings from server
fetch('/config')
    .then(res => res.json())
    .then(config => {
        colorInput.value = typeof config.avatarColor === 'string' ? config.avatarColor : '#ff0000';
        speedInput.value = config.walkingSpeed != null ? config.walkingSpeed : '1';
        useTwitchColorInput.checked = !!config.useTwitchColor;
        enableJumpingInput.checked = !!config.enableJumping;
        jumpVelocityInput.value = config.jumpVelocity != null ? config.jumpVelocity : '12';
        gravityInput.value = config.gravity != null ? config.gravity : '1';
        jumpChanceInput.value = config.jumpChance != null ? config.jumpChance : '1';
        enableMessageDisplayInput.checked = !!config.enableMessageDisplay;
        messageChanceInput.value = config.messageChance != null ? config.messageChance : '5';
        channelNameInput.value = typeof config.channelName === 'string' ? config.channelName : 'ohnepixel';
        avatarSizeInput.value = config.avatarSize != null ? config.avatarSize : 64;
        nameFontSizeInput.value = config.nameFontSize != null ? config.nameFontSize : 20;
        directionChangeChanceInput.value = config.directionChangeChance != null ? config.directionChangeChance : 1;
        muteMessagesInput.checked = !!config.muteMessages;
        showShadowsInput.checked = config.showShadows !== undefined ? !!config.showShadows : true;
        avatarOpacityInput.value = config.avatarOpacity != null ? config.avatarOpacity : 1;
        enableDespawnInput.checked = !!config.enableDespawn;
        despawnTimeInput.value = config.despawnTime != null ? config.despawnTime : 60;
        messageDisappearTimeInput.value = config.messageDisappearTime != null ? config.messageDisappearTime : 3;

        nameFontFamilyInput.value = config.nameFontFamily || 'sans-serif';
        nameFontWeightInput.value = config.nameFontWeight || 'normal';
        nameFontStyleInput.value = config.nameFontStyle || 'normal';
        nameStrokeStyleInput.value = typeof config.nameStrokeStyle === 'string' ? config.nameStrokeStyle : '#000000';
        nameLineWidthInput.value = config.nameLineWidth != null ? config.nameLineWidth : 2;
        messageFontFamilyInput.value = config.messageFontFamily || 'sans-serif';
        messageFontWeightInput.value = config.messageFontWeight || 'normal';
        messageFontStyleInput.value = config.messageFontStyle || 'normal';
        messageStrokeStyleInput.value = typeof config.messageStrokeStyle === 'string' ? config.messageStrokeStyle : '#ffffff';
        messageLineWidthInput.value = config.messageLineWidth != null ? config.messageLineWidth : 3;
        messageFillStyleInput.value = typeof config.messageFillStyle === 'string' ? config.messageFillStyle : '#000000';
        uploadedSprites = Array.isArray(config.sprites) ? config.sprites : [];
        defaultFrameSpeed = config.defaultFrameSpeed != null ? config.defaultFrameSpeed : 10;
        if (setAllFrameSpeedInput) setAllFrameSpeedInput.value = defaultFrameSpeed;
        renderSpriteGallery();
    }).catch(e => console.error('Failed to load config', e));

spriteInput.addEventListener('change', function() {
    const files = Array.from(spriteInput.files || []);
    if (!files.length) return;
    files.forEach(file => {
        const formData = new FormData();
        formData.append('sprite', file);
        fetch('/upload-sprite', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    uploadedSprites.push({ url: data.url, frames: 6, frameSpeed: defaultFrameSpeed });
                    renderSpriteGallery();
                    saveSpritesConfig();
                } else {
                    console.error('Upload failed', data);
                }
            }).catch(e => console.error('Upload error', e));
    });
});

if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const newConfig = {
            ...getFormConfig(),
            defaultFrameSpeed,
            sprites: uploadedSprites
        };
        fetch('/set-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newConfig)
        }).then(() => {
            // ensure immediate save; redirect afterwards
            window.location.href = '/index.html';
        }).catch(e => {
            console.error('Failed to save config', e);
            alert('Failed to save config.');
        });
    });
}

// Sprite Editor logic
let editingSpriteIdx = null;
let editorImage = null;
let crop = { x: 0, y: 0, w: 100, h: 100 };
let isDragging = false, dragStart = {};
let dragStartCol = 0, dragStartRow = 0;
let selectedFrames = [];

function updateSelectionGrid(c1, r1, c2, r2, selectMode) {
    const framesX = parseInt(editorFramesX.value, 10) || 1;
    const framesY = parseInt(editorFramesY.value, 10) || 1;
    const minC = Math.max(0, Math.min(c1, c2));
    const maxC = Math.min(framesX - 1, Math.max(c1, c2));
    const minR = Math.max(0, Math.min(r1, r2));
    const maxR = Math.min(framesY - 1, Math.max(r1, r2));

    if (selectMode) {
        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                const idx = r * framesX + c;
                if (!selectedFrames.includes(idx)) selectedFrames.push(idx);
            }
        }
        selectedFrames.sort((a, b) => a - b);
    } else {
        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                const idx = r * framesX + c;
                const p = selectedFrames.indexOf(idx);
                if (p !== -1) selectedFrames.splice(p, 1);
            }
        }
    }
    drawEditorCanvas();
}

const spriteEditorModal = document.getElementById('spriteEditorModal');
const spriteEditorCanvas = document.getElementById('spriteEditorCanvas');
const editorFramesX = document.getElementById('editorFramesX');
const editorFramesY = document.getElementById('editorFramesY');
const editorDirection = document.getElementById('editorDirection');
const saveSpriteEdit = document.getElementById('saveSpriteEdit');
const closeSpriteEditor = document.getElementById('closeSpriteEditor');
const editorFramesLabel = document.getElementById('editorFramesLabel');

if (closeSpriteEditor) {
    closeSpriteEditor.addEventListener('click', () => {
        spriteEditorModal.classList.remove('active');
        editingSpriteIdx = null;
        editorImage = null;
        selectedFrames = [];
    });
}

if (editorFramesX) editorFramesX.addEventListener('input', () => { selectedFrames = []; drawEditorCanvas(); });
if (editorFramesY) editorFramesY.addEventListener('input', () => { selectedFrames = []; drawEditorCanvas(); });

function drawEditorCanvas() {
    if (!editorImage) return;
    const ctx = ensureCanvasDPR(spriteEditorCanvas);
    try {
        ctx.imageSmoothingEnabled = false;
        if (typeof ctx.imageSmoothingQuality !== 'undefined') ctx.imageSmoothingQuality = 'low';
    } catch (e) {}
    ctx.clearRect(0, 0, spriteEditorCanvas.clientWidth, spriteEditorCanvas.clientHeight);
    const scale = Math.min(spriteEditorCanvas.clientWidth / editorImage.width, spriteEditorCanvas.clientHeight / editorImage.height, 1);
    const offsetX = (spriteEditorCanvas.clientWidth - editorImage.width * scale) / 2;
    const offsetY = (spriteEditorCanvas.clientHeight - editorImage.height * scale) / 2;
    ctx.drawImage(editorImage, offsetX, offsetY, editorImage.width * scale, editorImage.height * scale);

    ctx.save();
    ctx.strokeStyle = '#b280ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(
        offsetX + crop.x * scale,
        offsetY + crop.y * scale,
        crop.w * scale,
        crop.h * scale
    );
    ctx.restore();

    const framesX = parseInt(editorFramesX.value, 10) || 1;
    const framesY = parseInt(editorFramesY.value, 10) || 1;
    const cellW = crop.w / framesX;
    const cellH = crop.h / framesY;

    for (let row = 0; row < framesY; row++) {
        for (let col = 0; col < framesX; col++) {
            const idx = row * framesX + col;
            const x = offsetX + (crop.x + col * cellW) * scale;
            const y = offsetY + (crop.y + row * cellH) * scale;
            const w = cellW * scale;
            const h = cellH * scale;
            if (selectedFrames.includes(idx)) {
                ctx.save();
                ctx.fillStyle = 'rgba(178,128,255,0.35)';
                ctx.fillRect(x, y, w, h);
                ctx.restore();
            } else {
                ctx.save();
                ctx.fillStyle = 'rgba(255,255,255,0.10)';
                ctx.fillRect(x, y, w, h);
                ctx.restore();
            }
            ctx.save();
            ctx.strokeStyle = selectedFrames.includes(idx) ? '#b280ff' : '#888';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, w, h);
            ctx.restore();
            if (selectedFrames.includes(idx)) {
                ctx.save();
                ctx.fillStyle = '#fff';
                ctx.font = `${Math.max(10, Math.floor(h * 0.4))}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const order = selectedFrames.indexOf(idx) + 1;
                ctx.fillText(order, x + w / 2, y + h / 2);
                ctx.restore();
            }
        }
    }
    if (editorFramesLabel) editorFramesLabel.textContent = `Selected Frames: ${selectedFrames.length}`;
}

// Canvas mouse handlers
spriteEditorCanvas.addEventListener('mousedown', (e) => {
    if (!editorImage) return;
    isDragging = true;
    const rect = spriteEditorCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    const scale = Math.min(spriteEditorCanvas.clientWidth / editorImage.width, spriteEditorCanvas.clientHeight / editorImage.height, 1);
    const offsetX = (spriteEditorCanvas.clientWidth - editorImage.width * scale) / 2;
    const offsetY = (spriteEditorCanvas.clientHeight - editorImage.height * scale) / 2;
    const framesX = parseInt(editorFramesX.value, 10) || 1;
    const framesY = parseInt(editorFramesY.value, 10) || 1;
    const cellW = crop.w / framesX;
    const cellH = crop.h / framesY;
    const relX = (x - offsetX - crop.x * scale) / (cellW * scale);
    const relY = (y - offsetY - crop.y * scale) / (cellH * scale);
    const col = Math.floor(relX);
    const row = Math.floor(relY);
    if (col < 0 || col >= framesX || row < 0 || row >= framesY) return;
    const idx = row * framesX + col;
    dragStartCol = col;
    dragStartRow = row;
    if (e.button === 0) {
        dragSelectMode = !selectedFrames.includes(idx);
        updateSelectionGrid(col, row, col, row, dragSelectMode);
    }
    if (e.button === 2) {
        dragSelectMode = false;
        updateSelectionGrid(col, row, col, row, false);
    }
    drawEditorCanvas();
});
spriteEditorCanvas.addEventListener('mousemove', (e) => {
    if (!isDragging || !editorImage) return;
    const rect = spriteEditorCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    const scale = Math.min(spriteEditorCanvas.clientWidth / editorImage.width, spriteEditorCanvas.clientHeight / editorImage.height, 1);
    const offsetX = (spriteEditorCanvas.clientWidth - editorImage.width * scale) / 2;
    const offsetY = (spriteEditorCanvas.clientHeight - editorImage.height * scale) / 2;
    const framesX = parseInt(editorFramesX.value, 10) || 1;
    const framesY = parseInt(editorFramesY.value, 10) || 1;
    const cellW = crop.w / framesX;
    const cellH = crop.h / framesY;
    const relX = (x - offsetX - crop.x * scale) / (cellW * scale);
    const relY = (y - offsetY - crop.y * scale) / (cellH * scale);
    let col = Math.floor(relX);
    let row = Math.floor(relY);
    col = Math.max(0, Math.min(framesX - 1, col));
    row = Math.max(0, Math.min(framesY - 1, row));
    updateSelectionGrid(dragStartCol, dragStartRow, col, row, dragSelectMode);
    drawEditorCanvas();
});
spriteEditorCanvas.addEventListener('contextmenu', (e) => { e.preventDefault(); });
window.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        drawEditorCanvas();
    }
});
spriteEditorCanvas.addEventListener('mouseleave', () => {
    if (isDragging) {
        isDragging = false;
        drawEditorCanvas();
    }
});

function openSpriteEditor(idx) {
    editingSpriteIdx = idx;
    editorImage = new window.Image();
    editorImage.crossOrigin = 'anonymous';
    editorImage.src = uploadedSprites[idx].url;
    editorImage.onload = () => {
        crop = uploadedSprites[idx].crop ? { ...uploadedSprites[idx].crop } : { x: 0, y: 0, w: editorImage.width, h: editorImage.height };
        editorFramesX.value = uploadedSprites[idx].framesX || uploadedSprites[idx].frames || 6;
        editorFramesY.value = uploadedSprites[idx].framesY || 1;
        editorDirection.value = uploadedSprites[idx].direction || 'horizontal';
        if (Array.isArray(uploadedSprites[idx].selectedFrames)) {
            selectedFrames = [...uploadedSprites[idx].selectedFrames];
        } else {
            selectedFrames = [];
        }

        spriteEditorModal.classList.add('active');
        spriteEditorCanvas.style.width = '900px';
        spriteEditorCanvas.style.height = '480px';

        requestAnimationFrame(() => {
            ensureCanvasDPR(spriteEditorCanvas);
            drawEditorCanvas();
        });
    };
    editorImage.onerror = () => {
        alert('Failed to load sprite image for editing.');
    };
}

window.addEventListener('resize', () => {
    if (spriteEditorModal && spriteEditorModal.classList && spriteEditorModal.classList.contains('active')) {
        ensureCanvasDPR(spriteEditorCanvas);
        drawEditorCanvas();
    }
    renderSpriteGallery();
});

function clampSelectedFramesForGrid(sel, framesX, framesY) {
    const max = Math.max(0, framesX * framesY);
    return Array.from(new Set((sel || []).map(n => parseInt(n, 10)).filter(n => Number.isFinite(n) && n >= 0 && n < max))).sort((a,b)=>a-b);
}

if (saveSpriteEdit) {
    saveSpriteEdit.addEventListener('click', () => {
        if (editingSpriteIdx == null) return;
        const framesX = Math.max(1, parseInt(editorFramesX.value, 10) || 1);
        const framesY = Math.max(1, parseInt(editorFramesY.value, 10) || 1);
        const direction = editorDirection.value || 'horizontal';
        const validSelected = clampSelectedFramesForGrid(selectedFrames, framesX, framesY);
        const spriteEntry = uploadedSprites[editingSpriteIdx] || {};
        spriteEntry.framesX = framesX;
        spriteEntry.framesY = framesY;
        spriteEntry.direction = direction;
        spriteEntry.crop = { ...crop };
        if (spriteEntry.frameSpeed == null) spriteEntry.frameSpeed = defaultFrameSpeed;
        spriteEntry.selectedFrames = validSelected.length ? validSelected : [];
        spriteEntry.frames = validSelected.length ? validSelected.length : (framesX * framesY);
        uploadedSprites[editingSpriteIdx] = spriteEntry;
        saveSpritesConfig();
        renderSpriteGallery();
        spriteEditorModal.classList.remove('active');
        editingSpriteIdx = null;
        editorImage = null;
        selectedFrames = [];
    });
}

// Delete All Sprites handler
const deleteAllSpritesBtn = document.getElementById('deleteAllSprites');
if (deleteAllSpritesBtn) {
    deleteAllSpritesBtn.addEventListener('click', async () => {
        if (!confirm('Delete ALL uploaded sprites and installed pack sprites from the sprites list? (This will remove uploaded files in public/sprites and remove any pack-installed entries from your sprites list)')) return;
        deleteAllSpritesBtn.disabled = true;
        const prevText = deleteAllSpritesBtn.textContent;
        deleteAllSpritesBtn.textContent = 'Deleting...';
        try {
            const r = await fetch('/delete-all-sprites', { method: 'POST' });
            const data = await r.json();
            if (r.ok && data && data.success) {
                uploadedSprites = uploadedSprites.filter(s => {
                    if (!s || !s.url) return true;
                    const u = String(s.url);
                    return !(u.includes('/sprites/') || u.includes('/packs/'));
                });
                renderSpriteGallery();
                saveSpritesConfig();
                deleteAllSpritesBtn.textContent = 'Deleted';
                setTimeout(() => {
                    deleteAllSpritesBtn.disabled = false;
                    deleteAllSpritesBtn.textContent = prevText;
                }, 900);
            } else {
                console.error('Server failed to delete sprites', data);
                alert('Failed to delete sprites on server.');
                deleteAllSpritesBtn.disabled = false;
                deleteAllSpritesBtn.textContent = prevText;
            }
        } catch (e) {
            console.error('Error deleting sprites', e);
            alert('Error deleting sprites (see console).');
            deleteAllSpritesBtn.disabled = false;
            deleteAllSpritesBtn.textContent = prevText;
        }
    });
}

// Sprite Packs logic (unchanged flow)
const spritePacksContainer = document.getElementById('spritePacks');
const refreshPacksBtn = document.getElementById('refreshPacksBtn');

async function loadSpritePacks() {
    try {
        const res = await fetch('/sprite-packs');
        const packs = await res.json();
        renderSpritePacks(packs || []);
    } catch (e) {
        console.error('Failed to load packs', e);
        if (spritePacksContainer) spritePacksContainer.innerHTML = '<div style="color:#f88">Failed to load packs</div>';
    }
}

function renderSpritePacks(packs) {
    if (!spritePacksContainer) return;
    spritePacksContainer.innerHTML = '';
    if (!packs.length) {
        spritePacksContainer.innerHTML = '<div style="color:#ccc">No packs available on the server.</div>';
        return;
    }
    packs.forEach(p => {
        const card = document.createElement('div');
        card.className = 'sprite-wrapper';
        card.style.maxWidth = '220px';
        card.style.textAlign = 'center';

        const img = document.createElement('img');
        img.src = p.preview || '/packs/' + p.id + '/' + (p.sprites && p.sprites[0] && (p.sprites[0].file || p.sprites[0].url) || 'preview.png');
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.objectFit = 'contain';
        img.alt = p.name || p.id;
        card.appendChild(img);

        const title = document.createElement('div');
        title.textContent = p.name || p.id;
        title.style.fontWeight = 'bold';
        title.style.marginTop = '8px';
        card.appendChild(title);

        const desc = document.createElement('div');
        desc.textContent = p.description || '';
        desc.style.fontSize = '0.9em';
        desc.style.color = '#cfcfcf';
        desc.style.marginTop = '6px';
        card.appendChild(desc);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'button';
        btn.style.marginTop = '8px';
        btn.textContent = 'Install Pack';
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.textContent = 'Installing...';
            try {
                const r = await fetch('/install-pack', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: p.id })
                });
                const data = await r.json();
                if (data && data.success) {
                    const cfgRes = await fetch('/config');
                    const cfg = await cfgRes.json();
                    uploadedSprites = Array.isArray(cfg.sprites) ? cfg.sprites : [];
                    renderSpriteGallery();
                    saveSpritesConfig();
                    btn.textContent = 'Installed';
                } else {
                    console.error('Pack install failed', data);
                    btn.textContent = 'Failed';
                    btn.disabled = false;
                }
            } catch (e) {
                console.error('Install error', e);
                btn.textContent = 'Error';
                btn.disabled = false;
            }
        });
        card.appendChild(btn);
        spritePacksContainer.appendChild(card);
    });
}

if (refreshPacksBtn) {
    refreshPacksBtn.addEventListener('click', () => loadSpritePacks());
}
loadSpritePacks();

// Search / Filter hook
function textMatches(el, q) {
    if (!el || !q) return false;
    return (el.textContent || '').toLowerCase().indexOf(q) !== -1;
}
function performSearch(rawQuery) {
    const q = (rawQuery || '').trim().toLowerCase();
    document.querySelectorAll('.category').forEach(cat => {
        if (!q) { cat.style.display = ''; return; }
        const nodesToCheck = Array.from(cat.querySelectorAll('h2, .label, .setting-desc, .info-icon, .input, select, option'));
        const matches = nodesToCheck.some(n => textMatches(n, q));
        cat.style.display = matches ? '' : 'none';
    });
    document.querySelectorAll('#spriteGallery .sprite-wrapper').forEach(w => {
        if (!q) { w.style.display = ''; return; }
        const match = textMatches(w, q) || (w.querySelector('.sprite-frame-label') && textMatches(w.querySelector('.sprite-frame-label'), q));
        w.style.display = match ? '' : 'none';
    });
    document.querySelectorAll('#spritePacks .sprite-wrapper').forEach(card => {
        if (!q) { card.style.display = ''; return; }
        const match = textMatches(card, q) || textMatches(card.querySelector('div'), q);
        card.style.display = match ? '' : 'none';
    });
}

if (settingsSearch) {
    const debounced = debounce((e) => performSearch(e.target.value), 120);
    settingsSearch.addEventListener('input', debounced);
    settingsSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            settingsSearch.value = '';
            performSearch('');
        }
    });
}
