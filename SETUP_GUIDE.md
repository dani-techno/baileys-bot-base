# Quick Setup Guide - baileys-bot-base

## ⚡ Setup in 5 Minutes

### Step 1: Install Node.js
Download from https://nodejs.org/ (v18+ recommended)

Verify:
```bash
node --version  # Should be v16+
npm --version   # Should be v7+
```

### Step 2: Clone Repository
```bash
git clone https://github.com/dani-techno/baileys-bot-base.git
cd baileys-bot-base
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Setup Environment
```bash
cp .env.example .env
```

**Optional:** Edit `.env` if you want to change configuration (defaults are fine for testing).

### Step 5: Run Bot
```bash
npm start
```

### Step 6: Authenticate
Bot will ask for your WhatsApp number:
```
Masukin nomor WA lu (62xxxx):
```

Enter your number in format:
- `628123456789` (with country code 62)
- `0812 3456 789` (bot will auto-format)

A pairing code will appear. Open WhatsApp on your phone:
1. **Settings** → **Devices** → **Link a Device**
2. **Enter the code** shown in terminal

Bot connects automatically! 🎉

---

## 🧪 Test Commands

Once connected, try these:
```
.ping       # Check if bot is working
.menu       # Show command list
.help       # Show help (alias for .menu)
```

The `.` is the default prefix. You can customize it in `.env`.

---

## 🛠 Configuration Cheat Sheet

Edit `.env` to customize:

| Setting | Default | Options |
|---------|---------|---------|
| `MODE` | pairing | `pairing` \| `qr-terminal` \| `qr-image` |
| `PREFIXES` | `.,#,!` | Any characters, or empty for no prefix |
| `SELF_RESPONSE` | true | `true` \| `false` |
| `CASE_INSENSITIVE` | true | `true` \| `false` |

---

## 📝 Add Your First Custom Command

Open `handler.js` and find this section:
```javascript
case 'ping': {
    await sock.sendMessage(jid, { text: 'pong' }, { quoted: m })
    break
}
```

Add your command right after it:
```javascript
case 'hello': {
    await sock.sendMessage(jid, { 
        text: `Hello ${m.pushName}! 👋` 
    }, { quoted: m })
    break
}
```

Save and restart bot (or use `npm run dev` for auto-reload).

Test by sending: `.hello`

---

## 🚀 Development Tips

**Auto-reload on code changes:**
```bash
npm run dev
```

**Monitor logs:**
```bash
npm start 2>&1 | tee bot.log
```

**Clear session (start fresh):**
```bash
rm -rf .auth_info qr.png
npm start
```

---

## ❌ Common Issues

### "Invalid phone number format"
- Use format: `628xx` or `0812xx`
- Bot auto-converts 0812 → 62812

### "QR Code won't scan"
- Try pairing code mode (default, recommended)
- Or use `qr-terminal` mode in `.env`

### "Bot doesn't respond to commands"
- Check prefix (default: `.`, `#`, `!`)
- Enable `SELF_RESPONSE=true` to test with yourself
- Check console for errors

### Connection keeps dropping
- Normal after fresh pairing
- Check your internet
- Bot auto-reconnects, be patient

### "Logout detected"
- WhatsApp detected suspicious activity
- Simply restart bot and re-authenticate

---

## 📚 Next Steps

1. **Read README.md** for full documentation
2. **Check handler.js** for more examples
3. **Customize config.js** for advanced settings
4. **Deploy** to VPS/Termux for 24/7 operation

---

## 🆘 Need Help?

- 📧 Email: dani.joest.id@gmail.com
- 🐙 GitHub Issues: https://github.com/dani-techno/baileys-bot-base/issues
- 📚 Baileys Docs: https://github.com/WhiskeySockets/Baileys

---

Happy botting! 🤖
