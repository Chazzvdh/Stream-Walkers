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

// Helper: ensure a canvas has a DPR-scaled backing store and ctx transform
function ensureCanvasDPR(c) {
    const dpr = window.devicePixelRatio || 1;
    // Use computed CSS sizes; fallback to element attributes if not set
    const cssW = c.clientWidth || parseInt(c.style.width) || c.width || 300;
    const cssH = c.clientHeight || parseInt(c.style.height) || c.height || 150;
    c.style.width = cssW + 'px';
    c.style.height = cssH + 'px';
    c.width = Math.max(1, Math.round(cssW * dpr));
    c.height = Math.max(1, Math.round(cssH * dpr));
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // --- Disable smoothing so downscaled frames stay sharp (nearest-neighbor) ---
    try {
        ctx.imageSmoothingEnabled = false;
        if (typeof ctx.imageSmoothingQuality !== 'undefined') {
            ctx.imageSmoothingQuality = 'low';
        }
    } catch (e) {}

    return ctx;
}

// --- renderSpriteGallery changes: render small CSS-sized preview canvases and draw scaled frames ---
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

            // fixed display height for previews (CSS pixels)
            const displayH = 50;
            const aspect = (frameW && frameH) ? (frameW / frameH) : 1;
            const displayW = Math.max(30, Math.round(displayH * aspect));

            const canvas = document.createElement('canvas');
            canvas.className = 'sprite-img';
            // set CSS size then scale backing store via ensureCanvasDPR
            canvas.style.width = displayW + 'px';
            canvas.style.height = displayH + 'px';
            const ctx = ensureCanvasDPR(canvas);

            // draw the first frame cropped and scaled into the small preview
            // ensure no smoothing for crisp preview
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
        frameInput.max = 100;
        frameInput.value = s.frames || 6;
        frameInput.className = 'sprite-frame-input';
        frameInput.addEventListener('change', () => {
            uploadedSprites[idx].frames = parseInt(frameInput.value, 10) || 6;
            saveSpritesConfig();
        });
        wrapper.appendChild(frameInput);

        // --- Frames X ---
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

        // --- Frames Y ---
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

        // --- Frame speed label and input ---
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

        // --- Edit and Delete buttons side by side ---
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
            });
        });
        btnRow.appendChild(delBtn);

        wrapper.appendChild(btnRow);

        spriteGallery.appendChild(wrapper);
    });
}

// --- Set All Frame Speed Logic ---
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

function saveSpritesConfig() {
    fetch('/set-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...getFormConfig(),
            defaultFrameSpeed,
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

        // Font and style settings
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
                    uploadedSprites.push({ url: data.url, frames: 6, frameSpeed: defaultFrameSpeed });
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
        defaultFrameSpeed,
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

// Sprite Editor logic
let editingSpriteIdx = null;
let editorImage = null;
let crop = { x: 0, y: 0, w: 100, h: 100 };
let isDragging = false, dragStart = {};
let dragSelecting = false, dragSelectMode = true; // true=select, false=deselect
let dragStartCol = 0, dragStartRow = 0;
let selectedFrames = []; // array of indices (row*framesX+col) for selected cells

// --- NEW: helper to select/deselect a rectangular region of cells ---
function updateSelectionGrid(c1, r1, c2, r2, selectMode) {
    const framesX = parseInt(editorFramesX.value, 10) || 1;
    const framesY = parseInt(editorFramesY.value, 10) || 1;
    const minC = Math.max(0, Math.min(c1, c2));
    const maxC = Math.min(framesX - 1, Math.max(c1, c2));
    const minR = Math.max(0, Math.min(r1, r2));
    const maxR = Math.min(framesY - 1, Math.max(r1, r2));

    if (selectMode) {
        // Add cells in row-major order, avoid duplicates
        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                const idx = r * framesX + c;
                if (!selectedFrames.includes(idx)) selectedFrames.push(idx);
            }
        }
        selectedFrames.sort((a, b) => a - b);
    } else {
        // Remove cells
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

// Use the span already present in settings.html
const editorFramesLabel = document.getElementById('editorFramesLabel');

function openSpriteEditor(idx) {
    editingSpriteIdx = idx;
    editorImage = new window.Image();
    editorImage.src = uploadedSprites[idx].url;
    editorImage.onload = () => {
        crop = uploadedSprites[idx].crop
            ? { ...uploadedSprites[idx].crop }
            : { x: 0, y: 0, w: editorImage.width, h: editorImage.height };
        editorFramesX.value = uploadedSprites[idx].framesX || uploadedSprites[idx].frames || 6;
        editorFramesY.value = uploadedSprites[idx].framesY || 1;
        editorDirection.value = uploadedSprites[idx].direction || 'horizontal';
        // Load selectedFrames or default to NONE (empty) so nothing is pre-selected
        const framesX = parseInt(editorFramesX.value, 10) || 1;
        const framesY = parseInt(editorFramesY.value, 10) || 1;
        if (Array.isArray(uploadedSprites[idx].selectedFrames)) {
            selectedFrames = [...uploadedSprites[idx].selectedFrames];
        } else {
            // Default: none selected (user will select cells manually)
            selectedFrames = [];
        }
        // ensure DPR for editor canvas then draw
        ensureCanvasDPR(spriteEditorCanvas);
        drawEditorCanvas();
        spriteEditorModal.classList.add('active');
    };
}

// --- Auto-update sprite editor preview on input changes ---
editorFramesX.addEventListener('input', () => {
    // Reset selection to NONE on grid change (previously selected all)
    const framesX = parseInt(editorFramesX.value, 10) || 1;
    const framesY = parseInt(editorFramesY.value, 10) || 1;
    selectedFrames = [];
    drawEditorCanvas();
});
editorFramesY.addEventListener('input', () => {
    // Reset selection to NONE on grid change
    const framesX = parseInt(editorFramesX.value, 10) || 1;
    const framesY = parseInt(editorFramesY.value, 10) || 1;
    selectedFrames = [];
    drawEditorCanvas();
});

function drawEditorCanvas() {
    if (!editorImage) return;
    // ensure DPR transform
    const ctx = ensureCanvasDPR(spriteEditorCanvas);

    // ensure no smoothing for editor rendering
    try {
        ctx.imageSmoothingEnabled = false;
        if (typeof ctx.imageSmoothingQuality !== 'undefined') ctx.imageSmoothingQuality = 'low';
    } catch (e) {}

    ctx.clearRect(0, 0, spriteEditorCanvas.clientWidth, spriteEditorCanvas.clientHeight);
    // Fit image to canvas using CSS pixel sizes
    const scale = Math.min(spriteEditorCanvas.clientWidth / editorImage.width, spriteEditorCanvas.clientHeight / editorImage.height, 1);
    const offsetX = (spriteEditorCanvas.clientWidth - editorImage.width * scale) / 2;
    const offsetY = (spriteEditorCanvas.clientHeight - editorImage.height * scale) / 2;
    ctx.drawImage(editorImage, offsetX, offsetY, editorImage.width * scale, editorImage.height * scale);

    // Draw crop rectangle
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

    // Draw grid and selection using CSS-scaled coordinates
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
    editorFramesLabel.textContent = `Selected Frames: ${selectedFrames.length}`;
}

// Update event handlers that computed scale using element.width/height to use client sizes
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
    if (!isDragging) return;
    if (!editorImage) return;
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

// Prevent default context menu on the editor canvas (we use right-click for deselect)
spriteEditorCanvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Finalize drag selection on mouseup / leave
window.addEventListener('mouseup', (e) => {
    if (isDragging) {
        isDragging = false;
        // ensure final draw to show completed selection
        drawEditorCanvas();
    }
});
spriteEditorCanvas.addEventListener('mouseleave', (e) => {
    if (isDragging) {
        isDragging = false;
        drawEditorCanvas();
    }
});

// When opening the editor ensure DPR sizing before drawing
function openSpriteEditor(idx) {
    editingSpriteIdx = idx;
    editorImage = new window.Image();
    editorImage.src = uploadedSprites[idx].url;
    editorImage.onload = () => {
        crop = uploadedSprites[idx].crop
            ? { ...uploadedSprites[idx].crop }
            : { x: 0, y: 0, w: editorImage.width, h: editorImage.height };
        editorFramesX.value = uploadedSprites[idx].framesX || uploadedSprites[idx].frames || 6;
        editorFramesY.value = uploadedSprites[idx].framesY || 1;
        editorDirection.value = uploadedSprites[idx].direction || 'horizontal';
        if (Array.isArray(uploadedSprites[idx].selectedFrames)) {
            selectedFrames = [...uploadedSprites[idx].selectedFrames];
        } else {
            selectedFrames = [];
        }
        // ensure DPR for editor canvas then draw
        ensureCanvasDPR(spriteEditorCanvas);
        drawEditorCanvas();
        spriteEditorModal.classList.add('active');
    };
}

// Also ensure DPR when the window resizes so the editor stays sharp
window.addEventListener('resize', () => {
    // If editor is open, re-ensure DPR and redraw
    if (spriteEditorModal.classList.contains('active')) {
        ensureCanvasDPR(spriteEditorCanvas);
        drawEditorCanvas();
    }
    // re-render gallery so previews stay crisp on DPR changes / resize
    renderSpriteGallery();
});

// --- Sprite Packs logic ---

const spritePacksContainer = document.getElementById('spritePacks');
const refreshPacksBtn = document.getElementById('refreshPacksBtn');

// Load and render available packs
async function loadSpritePacks() {
    try {
        const res = await fetch('/sprite-packs');
        const packs = await res.json();
        renderSpritePacks(packs || []);
    } catch (e) {
        console.error('Failed to load packs', e);
        spritePacksContainer.innerHTML = '<div style="color:#f88">Failed to load packs</div>';
    }
}

function renderSpritePacks(packs) {
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
                    // Refresh config and gallery
                    const cfgRes = await fetch('/config');
                    const cfg = await cfgRes.json();
                    uploadedSprites = Array.isArray(cfg.sprites) ? cfg.sprites : [];
                    renderSpriteGallery();
                    saveSpritesConfig(); // persist UI changes to server-side config
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

// Load packs initially
loadSpritePacks();

// --- Add Save & Close handlers for sprite editor ---
// Save edits back into uploadedSprites and persist
saveSpriteEdit.addEventListener('click', () => {
    if (editingSpriteIdx === null) return;
    const framesX = parseInt(editorFramesX.value, 10) || 1;
    const framesY = parseInt(editorFramesY.value, 10) || 1;
    // clamp selectedFrames to valid range and keep order
    const maxIdx = framesX * framesY;
    selectedFrames = selectedFrames.filter(i => Number.isInteger(i) && i >= 0 && i < maxIdx);
    selectedFrames.sort((a, b) => a - b);

    const s = uploadedSprites[editingSpriteIdx] || {};
    s.framesX = framesX;
    s.framesY = framesY;
    s.direction = editorDirection.value || 'horizontal';
    s.crop = { ...crop };
    s.selectedFrames = [...selectedFrames];
    // ensure frames count matches selection (fallback to full grid if none selected)
    s.frames = selectedFrames.length > 0 ? selectedFrames.length : (framesX * framesY);
    uploadedSprites[editingSpriteIdx] = s;

    renderSpriteGallery();
    saveSpritesConfig();
    spriteEditorModal.classList.remove('active');
    editingSpriteIdx = null;
});

// Close button: just hide modal and clear editing index (discarding unsaved changes)
closeSpriteEditor.addEventListener('click', () => {
    spriteEditorModal.classList.remove('active');
    editingSpriteIdx = null;
});

