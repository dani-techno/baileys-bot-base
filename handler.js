import config from './config.js'

/**
 * Handler khusus case / command
 * @param {import('@whiskeysockets/baileys').WASocket} sock 
 * @param {any} m - Baileys message
 */
export default async function handler(sock, m) {
    const jid = m.key.remoteJid
    const rawText = (
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        ""
    ).trim()

    if (!rawText) return

    // --- PREFIX LOGIC ---
    let usedPrefix = null
    let commandText = rawText

    if (config.PREFIXES.length === 0) {
        // mode tanpa prefix, langsung anggap semua text adalah command
        commandText = rawText
    } else {
        const found = config.PREFIXES.find(p => rawText.startsWith(p))
        if (!found) return // kalau prefix aktif tapi pesan ga pake prefix, abaikan
        usedPrefix = found
        commandText = rawText.slice(found.length).trim()
    }

    if (!commandText) return

    const args = commandText.split(/\s+/)
    let command = args.shift() || ""
    const text = args.join(" ")

    if (config.CASE_INSENSITIVE) {
        command = command.toLowerCase()
    }

    // --- CASE STATEMENT ---
    switch (command) {
        case 'ping': {
            await sock.sendMessage(jid, { text: 'pong' }, { quoted: m })
            break
        }

        case 'case':
        case 'menu':
        case 'help': {
            const prefixInfo = config.PREFIXES.length === 0 ? '(tanpa prefix)' : config.PREFIXES.join(' ')
            await sock.sendMessage(jid, { 
                text: `*Bot Active*\nPrefix: ${prefixInfo}\nSelf: ${config.SELF_RESPONSE ? 'ON' : 'OFF'}\n\nAvailable:\n${prefixInfo !== '(tanpa prefix)' ? config.PREFIXES[0] : ''}ping - cek bot\n${prefixInfo !== '(tanpa prefix)' ? config.PREFIXES[0] : ''}case - list ini` 
            }, { quoted: m })
            break
        }

        // tambahin case baru di sini
        
        /*case 'hello': {
    const name = m.pushName || 'Stranger';
    await sock.sendMessage(jid, { 
        text: `Hello ${name}! 👋` 
    }, { quoted: m })
    break
}

case 'greet': {
    await sock.sendMessage(jid, { text: `Hey ${m.pushName}!` }, { quoted: m })
    break
}

case 'echo': {
    if (!text) return
    await sock.sendMessage(jid, { text }, { quoted: m })
    break
}

case 'info': {
    const isGroup = jid.endsWith('@g.us')
    const info = `👤 ${m.pushName}\nℹ️ ${isGroup ? 'Group' : 'Private'}`
    await sock.sendMessage(jid, { text: info }, { quoted: m })
    break
}*/

/*
Mention a user:
await sock.sendMessage(
    jid,
    {
        text: '@12345678901',
        mentions: ['12345678901@s.whatsapp.net']
    }
)

Forward a message:
const msg = getMessageFromStore() // implement this on your end
await sock.sendMessage(jid, { forward: msg }) // WA forward the message!

Location message:
await sock.sendMessage(
    jid,
    {
        location: {
            degreesLatitude: 24.121231,
            degreesLongitude: 55.1121221
        }
    }
)

Contact message:
const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
            + 'VERSION:3.0\n'
            + 'FN:Jeff Singh\n' // full name
            + 'ORG:Ashoka Uni;\n' // the organization of the contact
            + 'TEL;type=CELL;type=VOICE;waid=911234567890:+91 12345 67890\n' // WhatsApp ID + phone number
            + 'END:VCARD'

await sock.sendMessage(
    jid,
    {
        contacts: {
            displayName: 'Jeff',
            contacts: [{ vcard }]
        }
    }
)

Reaction message:
await sock.sendMessage(
    jid,
    {
        react: {
            text: '💖', // use an empty string to remove the reaction
            key: message.key
        }
    }
)

Pin message:
Duration	Seconds
24 hours	86400
7 days	604800
30 days	2592000

await sock.sendMessage(
    jid,
    {
        pin: {
            type: 1, // 0 to remove
            time: 86400,
            key: message.key
        }
    }
)

Poll message:
await sock.sendMessage(
    jid,
    {
        poll: {
            name: 'My Poll',
            values: ['Option 1', 'Option 2'],
            selectableCount: 1,
            toAnnouncementGroup: false // or true
        }
    }
)

Delete a chat:
const lastMsgInChat = await getLastMessageInChat(jid) // implement this on your end
await sock.chatModify({
        delete: true,
        lastMessages: [
            {
                key: lastMsgInChat.key,
                messageTimestamp: lastMsgInChat.messageTimestamp
            }
        ]
    },
    jid
)

Mark messages as read:
const key: WAMessageKey
// can pass multiple keys to read multiple messages as well
await sock.readMessages([key])

Update presence:
Value	Meaning
available	You are online
unavailable	You are offline
composing	You are typing a message
recording	You are recording a voice note
paused	You stopped typing (typing paused)

await sock.sendPresenceUpdate('available', jid)


Media Messages:
await sock.sendMessage(
    jid,
    {
        image: {
            url: './Media/ma_img.png'
        },
        caption: 'hello word'
    }
)

await sock.sendMessage(
    jid,
    {
        video: {
            url: './Media/ma_gif.mp4'
        },
        caption: 'hello word',
        ptv: false // if set to true, will send as a `video note`
    }
)

await sock.sendMessage(
    jid,
    {
        video: fs.readFileSync('Media/ma_gif.mp4'),
        caption: 'hello word',
        gifPlayback: true
    }
)

ffmpeg -i input.mp4 -c:a libopus -ac 1 -avoid_negative_ts make_zero output.ogg

await sock.sendMessage(
    jid,
    {
        audio: {
            url: './Media/output.ogg'
        },
        mimetype: 'audio/ogg; codecs=opus'
    }
)

await sock.sendMessage(
    jid,
    {
        image: {
            url: './Media/ma_img.png'
        },
        viewOnce: true, //works with video, audio too
        caption: 'hello word'
    }
)
*/

        default:
            // command tidak dikenal, diamkan biar ga spam
            break
    }
}