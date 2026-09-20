import makeWASocket, { Browsers, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys'
import pino from 'pino'
import readline from 'readline'
import fs from 'fs'
import QRCode from 'qrcode'
import qrcodeTerminal from 'qrcode-terminal'
import path from 'path'
import config from './config.js'
import handler from './handler.js'

const MODE = config.MODE
const AUTH_FOLDER = config.AUTH_FOLDER
const QR_PATH = config.QR_PATH
const QR_REFRESH_INTERVAL = config.QR_REFRESH_INTERVAL

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

let qrInterval = null
let pairingInterval = null
let lastQR = null
let currentPhoneNumber = null
let isWaitingAuth = false
let hasJustPaired = false
let isRestarting = false
let currentSock = null

const C = {
    reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', cyan: '\x1b[36m',
    yellow: '\x1b[33m', magenta: '\x1b[35m', blue: '\x1b[34m', red: '\x1b[31m',
    bgGreen: '\x1b[42m\x1b[30m', bgBlue: '\x1b[44m\x1b[37m',
}

function formatPairingCode(code) {
    if (!code) return code
    const raw = code.replace(/-/g, '').trim().toUpperCase()
    if (raw.length <= 3) return raw
    const mid = Math.floor(raw.length / 2)
    return `${raw.slice(0, mid)}-${raw.slice(mid)}`
}

function cleanCredsIfInvalid() {
    const credsPath = `${AUTH_FOLDER}/creds.json`
    if (!fs.existsSync(credsPath)) return
    try {
        const data = JSON.parse(fs.readFileSync(credsPath, 'utf-8'))
        if (!data.registered) {
            if (isWaitingAuth) {
                console.log('ℹ️ creds.json belum registered tapi lagi nunggu auth, dibiarin dulu...')
                return
            }
            console.log('⚠️ creds.json belum terhubung sebelum scan/pairing, lagi hapus biar gak error...')
            fs.rmSync(credsPath, { force: true })
            if (fs.existsSync(QR_PATH)) fs.rmSync(QR_PATH, { force: true })
        }
    } catch {
        fs.rmSync(credsPath, { force: true })
        if (fs.existsSync(QR_PATH)) fs.rmSync(QR_PATH, { force: true })
    }
}

function clearAllIntervals() {
    if (qrInterval) { clearInterval(qrInterval); qrInterval = null }
    if (pairingInterval) { clearInterval(pairingInterval); pairingInterval = null }
}

function safeRestart(reason, delay = 2000) {
    if (isRestarting) return
    isRestarting = true
    clearAllIntervals()
    console.log(`\n${C.yellow}[RESTART]${C.reset} ${reason} - restart internal ${delay}ms...`)
    try { currentSock?.end?.() } catch {}
    try { currentSock?.ws?.close?.() } catch {}

    setTimeout(() => {
        isRestarting = false
        console.log(`${C.green}🔄 Restarting bot sekarang...${C.reset}\n`)
        startBot()
    }, delay)
}

async function displayQRImageOnly(qr) {
    try {
        const absPath = path.resolve(QR_PATH)
        await QRCode.toFile(QR_PATH, qr, { width: 512, margin: 1 })
        console.log(`\n[${new Date().toLocaleTimeString()}] [QR-IMAGE] ✅ QR di ${absPath}\n`)
    } catch (e) { console.log('❌ Gagal QR:', e.message) }
}

function displayQRTerminalOnly(qr) {
    console.log(`\n[${new Date().toLocaleTimeString()}] [QR-TERMINAL] Scan:`)
    qrcodeTerminal.generate(qr, { small: true })
}

function formatNumber(input) {
    let num = input.replace(/[^0-9]/g, '')
    if (!num) return null
    if (num.startsWith('0')) num = '62' + num.slice(1)
    else if (num.startsWith('8')) num = '62' + num
    if (num.length < 10) return null
    return num
}

async function getValidPhoneNumber() {
    if (currentPhoneNumber && isWaitingAuth) return currentPhoneNumber
    while (true) {
        let input = await question('Masukin nomor WA lu (62xxxx): ')
        if (!input.trim()) continue
        const f = formatNumber(input)
        if (!f) { console.log('❌ Format salah'); continue }
        return f
    }
}

function extractOutgoingText(c) {
    if (!c) return '-'
    return c.text || c.caption || JSON.stringify(c).slice(0, 100)
}

async function startBot() {
    clearAllIntervals()
    cleanCredsIfInvalid()
    isRestarting = false

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER)
    const { version } = await fetchLatestBaileysVersion()

    if (!state.creds.registered) hasJustPaired = true

    const sock = makeWASocket({
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS("Safari"),
        printQRInTerminal: false,
        markOnlineOnConnect: false,
        syncFullHistory: false,
        fireInitQueries: false,
        generateHighQualityLinkPreview: false,
        version,
    })
    currentSock = sock

    sock.ev.on('creds.update', saveCreds)

    const origSend = sock.sendMessage.bind(sock)
    sock.sendMessage = async (jid, content, opts = {}) => {
        const res = await origSend(jid, content, opts)
        try {
            const isGroup = jid.endsWith('@g.us')
            const text = extractOutgoingText(content)
            const time = new Date().toLocaleTimeString()
            const target = jid.split('@')[0]
            let gName = ''
            if (isGroup) { try { const meta = await sock.groupMetadata(jid); gName = `(${meta.subject})` } catch {} }
            console.log(`${C.green}┌─${C.reset} ${C.bgGreen} BOT REPLY ${C.reset} ${C.dim}[${time}]${C.reset}`)
            console.log(`${C.green}│${C.reset} ${C.cyan}➜ Ke :${C.reset} ${target} ${C.yellow}${gName}${C.reset}`)
            console.log(`${C.green}└─${C.reset} ${C.cyan}➜ Balasan :${C.reset} ${C.green}${text}${C.reset}\n`)
        } catch {}
        return res
    }

    if (MODE === 'pairing' && !state.creds.registered) {
        await new Promise(r => setTimeout(r, 1500))
        currentPhoneNumber = await getValidPhoneNumber()
        if (fs.existsSync(QR_PATH)) fs.rmSync(QR_PATH, { force: true })
        const reqCode = async (isRefresh = false) => {
            try {
                isWaitingAuth = true
                const raw = await sock.requestPairingCode(currentPhoneNumber)
                const code = formatPairingCode(raw)
                console.log(`\n[${new Date().toLocaleTimeString()}] [${isRefresh ? 'PAIRING REFRESH' : 'PAIRING CODE'}] Kode: ${code} | Nomor: ${currentPhoneNumber}\n`)
            } catch (e) { console.log('❌ Gagal pairing:', e.message) }
        }
        await reqCode(false)
        pairingInterval = setInterval(() => reqCode(true), QR_REFRESH_INTERVAL)
    }

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr) { lastQR = qr; isWaitingAuth = true }

        if (qr && MODE === 'qr-terminal') {
            displayQRTerminalOnly(qr)
            if (qrInterval) clearInterval(qrInterval)
            qrInterval = setInterval(() => { if (lastQR) qrcodeTerminal.generate(lastQR, { small: true }) }, QR_REFRESH_INTERVAL)
        } else if (qr && MODE === 'qr-image') {
            await displayQRImageOnly(qr)
            if (qrInterval) clearInterval(qrInterval)
            qrInterval = setInterval(async () => { if (lastQR) await displayQRImageOnly(lastQR) }, QR_REFRESH_INTERVAL)
        }

        if (connection === 'open') {
            clearAllIntervals()
            lastQR = null

            if (isWaitingAuth || hasJustPaired) {
                console.log('✅ Bot konek bos! (fresh login)')
                console.log(`${C.yellow}⚠️ Fresh pairing/QR, wajib restart internal biar listener aktif...${C.reset}`)
                if (fs.existsSync(QR_PATH)) fs.rmSync(QR_PATH, { force: true })
                isWaitingAuth = false
                hasJustPaired = false
                safeRestart('Fresh login - aktivasi listener', 2000)
                return
            }

            isWaitingAuth = false
            hasJustPaired = false
            console.log('✅ Bot konek bos!')
            if (fs.existsSync(QR_PATH)) fs.rmSync(QR_PATH, { force: true })
            try { rl.close() } catch {}
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            const errMsg = lastDisconnect?.error?.message || ''
            console.log(`Koneksi ketutup... code:${statusCode} ${errMsg}`)

            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                console.log('Logout, hapus auth...')
                if (fs.existsSync(AUTH_FOLDER)) fs.rmSync(AUTH_FOLDER, { recursive: true, force: true })
                if (fs.existsSync(QR_PATH)) fs.rmSync(QR_PATH, { force: true })
                isWaitingAuth = false
                hasJustPaired = true
                currentPhoneNumber = null
                safeRestart('Logged out', 2000)
                return
            }

            if (statusCode === DisconnectReason.restartRequired || errMsg.includes('restart required') || errMsg.includes('Stream Errored')) {
                if (isWaitingAuth) {
                    console.log(`[${new Date().toLocaleTimeString()}] Restart required pas nunggu pairing/qr, restart langsung...`)
                    safeRestart('Restart required saat pairing', 1000)
                } else {
                    safeRestart('Restart required', 1000)
                }
                return
            }

            if ([DisconnectReason.connectionClosed, DisconnectReason.connectionLost, DisconnectReason.timedOut].includes(statusCode)) {
                safeRestart(`Connection ${statusCode}`, 1500)
                return
            }

            safeRestart(`Unknown ${statusCode}`, 2000)
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message) return
        if (!config.SELF_RESPONSE && m.key.fromMe) return

        const jid = m.key.remoteJid
        const text = (m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "").trim()
        if (!text) return

        const isGroup = jid.endsWith('@g.us')
        const senderJid = isGroup ? (m.key.participant || m.participant || '') : jid
        const senderNumber = (senderJid || jid).split('@')[0].split(':')[0]
        const senderName = m.pushName || 'Tanpa Nama'
        const time = new Date().toLocaleTimeString()
        let groupName = '-', groupId = '-'
        if (isGroup) {
            groupId = jid
            try { const meta = await sock.groupMetadata(jid); groupName = meta.subject } catch { groupName = '(gagal ambil)' }
        }

        console.log(`\n${C.blue}┌─${C.reset} ${C.bgBlue} INCOMING CMD ${C.reset} ${C.dim}[${time}]${C.reset} ${C.yellow}${text}${C.reset}`)
        console.log(`${C.blue}│${C.reset} ${C.cyan}├─ Pengirim :${C.reset} ${senderName} ${C.magenta}${senderNumber}${C.reset}${m.key.fromMe ? ` ${C.bgGreen} SELF ${C.reset}` : ''}`)
        console.log(`${C.blue}│${C.reset} ${C.cyan}├─ JID :${C.reset} ${C.dim}${senderJid || jid}${C.reset}`)
        if (isGroup) {
            console.log(`${C.blue}│${C.reset} ${C.cyan}├─ Grup :${C.reset} ${groupName}`)
            console.log(`${C.blue}│${C.reset} ${C.cyan}├─ ID Grup :${C.reset} ${C.dim}${groupId}${C.reset}`)
        } else {
            console.log(`${C.blue}│${C.reset} ${C.cyan}├─ Tipe : PRIVATE`)
        }
        console.log(`${C.blue}└─${C.reset} Pesan : ${text}\n`)

        try {
            await handler(sock, m)
        } catch (err) {
            console.log(`${C.red}❌ Error handler:${C.reset}`, err.message)
        }
    })
}

startBot()