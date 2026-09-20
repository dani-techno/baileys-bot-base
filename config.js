import dotenv from 'dotenv'
dotenv.config()

function parsePrefixes(raw) {
    if (raw === undefined || raw === null) return ['.', '#', '!']
    const trimmed = String(raw).trim()
    if (!trimmed) return []
    const lower = trimmed.toLowerCase()
    if (['false', 'none', '0', 'off', 'disable', 'disabled', 'no'].includes(lower)) return []

    // kalau pake koma: .,#,!
    if (trimmed.includes(',')) {
        return trimmed.split(',').map(s => s.trim()).filter(Boolean)
    }
    // kalau pake spasi: . # !
    if (trimmed.includes(' ')) {
        return trimmed.split(/\s+/).map(s => s.trim()).filter(Boolean)
    }
    // kalau tanpa separator: .#! -> jadi ['.', '#', '!']
    // kalau cuma 1 char: . -> jadi ['.']
    return [...trimmed].filter(Boolean)
}

const config = {
    MODE: process.env.MODE || 'pairing',
    AUTH_FOLDER: process.env.AUTH_FOLDER || 'auth_info',
    QR_PATH: process.env.QR_PATH || './qr.png',
    QR_REFRESH_INTERVAL: parseInt(process.env.QR_REFRESH_INTERVAL) || 120_000,
    PREFIXES: parsePrefixes(process.env.PREFIXES ?? process.env.PREFIX ?? '.,#,!'),
    SELF_RESPONSE: String(process.env.SELF_RESPONSE ?? 'true').toLowerCase() === 'true',
    CASE_INSENSITIVE: String(process.env.CASE_INSENSITIVE ?? 'true').toLowerCase() === 'true',
}

export default config