# Stream Walkers

**Stream Walkers** is a Twitch chat overlay for OBS that visualizes chatters as animated avatars walking, jumping, and displaying messages on your stream.

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

## File Structure

- `server.js` — Node.js backend, Twitch chat integration, config endpoints.
- `public/` — Frontend files (overlay, settings page, styles).
- `config.json` — Persistent settings storage.

---

## Example `config.json`

```json
{
  "channelName": "pestily",
  "avatarColor": "#ffffff",
  "walkingSpeed": 1,
  "useTwitchColor": true,
  "enableJumping": true,
  "jumpVelocity": 10,
  "gravity": 0.5,
  "jumpChance": 5,
  "enableMessageDisplay": true,
  "messageChance": 100,
  "avatarSize": 64,
  "nameFontSize": 20,
  "directionChangeChance": 10,
  "muteMessages": false,
  "showShadows": true,
  "avatarOpacity": 1,
  "enableDespawn": true,
  "despawnTime": 10
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
