# Stream Walkers

**Stream Walkers** is a Twitch chat overlay for OBS that visualizes chatters as animated avatars walking, jumping, and displaying messages on your stream.

![20251127-2253-46 6606940](https://github.com/user-attachments/assets/81654ec1-1e99-435f-a2d1-db4f31dd53e5)

---

## License & Terms

This project is free for **Personal Use**, but closed for **Commercial Redistribution**.

### ✅ You are free to:
- **Use on Stream:** Run this overlay on your own personal Twitch or YouTube channel.
- **Customize:** Modify the code, sprites, and settings to fit your personal branding.
- **Learn:** Read the source code for educational purposes.

### ❌ You are NOT allowed to:
- **Sell:** You cannot sell this software, specific features, or installation services for money.
- **Redistribute:** You cannot re-upload this code (modified or unmodified) to other repositories or websites claiming it as your own product.
- **Commercialize:** You cannot include this code in a paid software bundle or SaaS product.

### Attribution
If you use this project, please credit the original author or link back to this repository.

*Copyright © [2025] [RAZE Digital]. All Rights Reserved for Commercial Use.*

---
## Features

- **Animated Avatars:** Distinct avatars for each Twitch chatter.
- **Customizable:** Adjust avatar appearance, movement speed, and colors.
- **Interactive:** Chat messages appear directly above avatars.
- **Real-time Configuration:** Settings page updates instantly.
- **Persistence:** Settings are saved server-side.
- **Advanced Logic:** Supports avatar despawn timers, shadows, and gravity/physics.

---

## Setup

1. **Install dependencies**
   Open your terminal in the project folder and run:
   ```bash
   npm install
   ```

2. **Configure**
   Edit `config.json` or use the `/settings.html` page in your browser to set your Twitch channel and avatar options.

3. **Run the server**
   ```bash
   npm start
   ```
   The server runs on [http://localhost:3000](http://localhost:3000).

4. **Add to OBS**
   - Add a **Browser Source** in OBS.
   - Set the URL to `http://localhost:3000/` (or your server's LAN address).
   - Set the width and height to match your stream canvas (usually 1920x1080).

---

## Settings

- **Access:** Go to `http://localhost:3000/settings.html`.
- **Options:** All options (avatar color, size, speed, jumping, message display, etc.) are configurable and saved automatically.

---

## Sprite Packs

You can now install pre-made sprite packs (for example a "dino pack") without uploading files manually.

- Packs are stored on the server under the `packs/` directory.
- Each pack should include a `manifest.json` describing the sprites (optional) and the image files.
- Use the Settings page -> "Sprite Packs" to browse available packs and install them into your sprites list.

Manifest example (packs/dino/manifest.json):
```json
{
  "id": "dino",
  "name": "Dino Pack",
  "description": "Cute dinosaur avatars",
  "preview": "/packs/dino/preview.png",
  "sprites": [
    {
      "file": "doux.png",
      "frames": 7,
      "frameSpeed": 5,
      "framesX": 24,
      "framesY": 1,
      "direction": "horizontal",
      "crop": {
        "x": 0,
        "y": 0,
        "w": 576,
        "h": 24
      },
      "selectedFrames": [
        17,
        18,
        19,
        20,
        21,
        22,
        23
      ]
    }
  ]
}

```

---

## File Structure

- `server.js` — Node.js backend, Twitch chat integration, config endpoints.
- `public/` — Frontend files (overlay, settings page, styles).
- `config.json` — Persistent settings storage.

---

## Example `config.json`

```json
{
  "channelName": "dougdoug",
  "avatarColor": "#ffffff",
  "walkingSpeed": 0.5,
  "useTwitchColor": true,
  "enableJumping": true,
  "jumpVelocity": 2,
  "gravity": 1,
  "jumpChance": 1,
  "enableMessageDisplay": true,
  "messageChance": 100,
  "avatarSize": 64,
  "nameFontSize": 20,
  "directionChangeChance": 10,
  "muteMessages": false,
  "showShadows": true,
  "avatarOpacity": 1,
  "enableDespawn": true,
  "despawnTime": 60,
  "messageDisappearTime": 20,
  "nameFontFamily": "sans-serif",
  "nameFontWeight": "normal",
  "nameFontStyle": "normal",
  "nameStrokeStyle": "#000000",
  "nameLineWidth": 2,
  "messageFontFamily": "Tahoma, Geneva, sans-serif",
  "messageFontWeight": "normal",
  "messageFontStyle": "normal",
  "messageStrokeStyle": "#ffffff",
  "messageLineWidth": 5,
  "messageFillStyle": "#000000",
  "defaultFrameSpeed": 5,
  "sprites": []
}
```

---

## Dependencies

- [express](https://www.npmjs.com/package/express)
- [socket.io](https://www.npmjs.com/package/socket.io)
- [tmi.js](https://www.npmjs.com/package/tmi.js)
- [body-parser](https://www.npmjs.com/package/body-parser)
- [cors](https://www.npmjs.com/package/cors)
- [nodemon](https://www.npmjs.com/package/nodemon) (dev)

---

*Made for streamers who want their chat to come alive!*
