# baileys-bot-base

> A lightweight, production-ready WhatsApp bot base template using [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys). Build intelligent bots with minimal configuration.

## Features

🚀 **Multiple Authentication Modes**
- Pairing Code (minimal setup)
- QR Code Terminal Display
- QR Code File Output

⚙️ **Flexible Configuration**
- Customizable command prefixes (or prefix-free mode)
- Case-sensitive/insensitive commands
- Self-message response toggle
- Configurable refresh intervals

🔄 **Robust Connection Management**
- Auto-reconnect with exponential backoff
- Smart credential validation
- Connection state logging with color formatting
- Session persistence across restarts

💬 **Command Handler Pattern**
- Clean switch-case command router
- Extensible handler architecture
- Support for text, image captions, and extended messages

📊 **Rich Logging**
- Color-coded console output
- Incoming/outgoing message tracking
- Group/private chat distinction
- Sender identification

## Requirements

- **Node.js** 16+ (18+ recommended)
- **npm** or **yarn**
- **WhatsApp Account** (personal/business)

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/dani-techno/baileys-bot-base.git
cd baileys-bot-base
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your preferences:
```env
MODE=pairing              # or qr-terminal / qr-image
PREFIXES=.,#,!           # customize command prefixes
SELF_RESPONSE=true
```

### 3. Run Bot

**Production:**
```bash
npm start
```

**Development (with auto-reload):**
```bash
npm run dev
```

### 4. Authenticate

**For Pairing Mode (recommended):**
- Bot will request your WhatsApp phone number
- Enter your number (format: `628xx` or `0812xx`)
- Confirm the code shown on your WhatsApp phone
- Bot connects automatically

**For QR Mode:**
- Scan the QR code with WhatsApp mobile app
- Go to Settings → Linked Devices → Link Device
- Point camera at generated QR code

## Usage

### Try Built-in Commands

Once bot is running, send messages to test:

| Command | Description | Example |
|---------|-------------|---------|
| `.ping` | Check bot status | `.ping` |
| `.menu` / `.help` | Show available commands | `.menu` |
| `.case` | List all commands | `.case` |

*Replace `.` with your configured prefix (`.`, `#`, `!` etc.)*

### Add Custom Commands

Edit `handler.js` and add a new case:

```javascript
case 'hello': {
    const name = m.pushName || 'Stranger';
    await sock.sendMessage(jid, { 
        text: `Hello ${name}! 👋` 
    }, { quoted: m })
    break
}
```

Then send: `.hello`

### More Examples

**Simple Greeting:**
```javascript
case 'greet': {
    await sock.sendMessage(jid, { text: `Hey ${m.pushName}!` }, { quoted: m })
    break
}
```

**Echo Command:**
```javascript
case 'echo': {
    if (!text) return
    await sock.sendMessage(jid, { text }, { quoted: m })
    break
}
```

**Get User Info:**
```javascript
case 'info': {
    const isGroup = jid.endsWith('@g.us')
    const info = `👤 ${m.pushName}\nℹ️ ${isGroup ? 'Group' : 'Private'}`
    await sock.sendMessage(jid, { text: info }, { quoted: m })
    break
}
```

## Configuration Reference

### `MODE`
- `pairing` - Pairing code (minimal setup, recommended)
- `qr-terminal` - QR in terminal
- `qr-image` - QR saved as PNG

### `PREFIXES`
- `"."` - Single prefix
- `".,#,!"` - Multiple prefixes
- `"false"` or `"none"` - No prefix required

### `AUTH_FOLDER`
Default: `.auth_info` — Where session credentials are stored

### `QR_REFRESH_INTERVAL`
Default: `120000` (2 minutes) — Regenerate QR if pending

## Project Structure

```
baileys-bot-base/
├── index.js           # Main bot entry point & connection logic
├── handler.js         # Command handler (add your commands here)
├── config.js          # Configuration manager (reads from .env)
├── package.json       # Dependencies
├── .env.example       # Environment template
├── nodemon.json       # Auto-reload config
└── README.md          # This file
```

## Architecture

```
index.js
├── Socket Connection (Baileys)
├── Auth State Management
├── Connection Event Listeners
├── Message Event Handler
│   └── handler.js
│       ├── Prefix Detection
│       ├── Command Parser
│       └── Case Router
└── Logging & Formatting
```

## Troubleshooting

### "creds.json not registered"
Session hasn't connected yet. For pairing mode, confirm the code on your phone.

### "Invalid phone number format"
Use format: `62812xxxxx` (start with 62) or `08xx` (start with 0).

### QR code won't scan
- Ensure good lighting
- Try `qr-terminal` mode instead
- Clear auth folder and restart: `rm -rf .auth_info`

### Bot doesn't respond
- Check `PREFIXES` config — ensure you're using correct prefix
- Enable `SELF_RESPONSE=true` to test with own account
- Check console for errors (should be visible)

### Connection keeps dropping
- Normal after fresh pairing — bot auto-reconnects
- Check internet stability
- Increase `QR_REFRESH_INTERVAL` if hanging on QR

### "Logout, hapus auth..."
WhatsApp detected suspicious activity. Restart bot and re-authenticate.

## Environment & Deployment

### Local Development
```bash
npm run dev
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci --only=production
CMD ["node", "index.js"]
```

### VPS / Termux Deployment
```bash
git clone https://github.com/dani-techno/baileys-bot-base.git
cd baileys-bot-base
npm install
nohup npm start > bot.log 2>&1 &
```

### PM2 (Recommended for Production)
```bash
npm install -g pm2
pm2 start index.js --name baileys-bot
pm2 save
pm2 startup
```

## Best Practices

1. **Add `.auth_info/` to `.gitignore`** — Never commit credentials
2. **Use strong prefixes** — Avoid common characters that might conflict
3. **Handle errors gracefully** — Try-catch in custom handlers
4. **Rate limit responses** — WhatsApp has strict anti-spam policies
5. **Test locally first** — Use `SELF_RESPONSE=true` for testing

## Limitations

- ⚠️ This uses an unofficial WhatsApp API (Baileys). Meta may change protocols.
- WhatsApp blocks accounts performing spam or suspicious activity.
- Some advanced features may not work (e.g., status updates, call interception).

## Contributing

Found a bug or want to improve? Create an issue or PR:
1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## License

MIT License © 2026 [PT Inovixa Technologies Solution](https://inovixats.web.id)

See [LICENSE](./LICENSE) for full details.

## Support

- 📧 Email: dani.joest.id@gmail.com
- 🐙 GitHub: [@dani-techno](https://github.com/dani-techno)
- 📚 Baileys Documentation: https://github.com/WhiskeySockets/Baileys

## Disclaimer

This project is for educational purposes. Users are responsible for compliance with WhatsApp's Terms of Service. Misuse may result in account suspension.

---

**Made with ❤️ by PT Inovixa Technologies Solution**
