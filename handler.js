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
        // case 'halo': {
        //     await sock.sendMessage(jid, { text: `halo ${m.pushName}` }, { quoted: m })
        //     break
        // }

        default:
            // command tidak dikenal, diamkan biar ga spam
            break
    }
}