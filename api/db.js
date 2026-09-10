import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://manzzygenshin_db_user:OKdzMae2OLtMAqP2@jpmmanz.nax4l7g.mongodb.net/kingjpm?retryWrites=true&w=majority&appName=Jpmmanz";

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb };
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('kingjpm');
    cachedClient = client;
    cachedDb = db;
    return { client, db };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { action, username, password, targetUser, waNumber, videoLink, fingerprint } = req.body;

    try {
        const { db } = await connectToDatabase();
        const usersCol = db.collection('am_users');
        const settingsCol = db.collection('am_settings');

        switch(action) {
            case 'init':
                await usersCol.updateOne({ username: 'man' }, { $setOnInsert: { username: 'man', password: 'admin', role: 'admin' } }, { upsert: true });
                await settingsCol.updateOne({ key: 'wa_admin' }, { $setOnInsert: { key: 'wa_admin', value: '628123456789' } }, { upsert: true });
                await settingsCol.updateOne({ key: 'tutorial_video' }, { $setOnInsert: { key: 'tutorial_video', value: '' } }, { upsert: true });
                return res.json({ success: true, message: "DB Ready" });

            case 'register':
                const exist = await usersCol.findOne({ username });
                if (exist) return res.status(400).json({ error: 'Username sudah ada' });
                await usersCol.insertOne({ username, password, role: 'user' });
                return res.json({ success: true, role: 'user' });

            case 'login':
                const user = await usersCol.findOne({ username, password });
                if (!user) return res.status(401).json({ error: 'Username/Password salah' });

                if (user.role !== 'admin') {
                    if (!fingerprint) return res.status(400).json({ error: 'Memuat sistem keamanan. Silakan klik Login sekali lagi.' });
                    if (!user.fingerprint) {
                        await usersCol.updateOne({ username }, { $set: { fingerprint: fingerprint } });
                    } else if (user.fingerprint !== fingerprint) {
                        return res.status(403).json({ error: 'AKSES DITOLAK: Akun ini terikat pada perangkat lain (Anti-Share).' });
                    }
                }
                
                const newToken = Math.random().toString(36).substring(2, 15);
                await usersCol.updateOne({ username }, { $set: { sessionToken: newToken } });
                return res.json({ success: true, role: user.role, token: newToken });

            case 'getSettings':
                // Mengambil WA dan Video sekaligus
                const wa = await settingsCol.findOne({ key: 'wa_admin' });
                const vid = await settingsCol.findOne({ key: 'tutorial_video' });
                return res.json({ success: true, wa: wa?.value, video: vid?.value });

            case 'setWa':
                await settingsCol.updateOne({ key: 'wa_admin' }, { $set: { value: waNumber } }, { upsert: true });
                return res.json({ success: true });
                
            case 'setVideo':
                await settingsCol.updateOne({ key: 'tutorial_video' }, { $set: { value: videoLink } }, { upsert: true });
                return res.json({ success: true });

            case 'upgrade':
                const target = await usersCol.updateOne({ username: targetUser }, { $set: { role: 'premium' } });
                if (target.matchedCount === 0) return res.status(404).json({ error: 'Username tidak ditemukan' });
                return res.json({ success: true });

            case 'resetDevice':
                const reset = await usersCol.updateOne({ username: targetUser }, { $unset: { fingerprint: "", sessionToken: "" } });
                if (reset.matchedCount === 0) return res.status(404).json({ error: 'Username tidak ditemukan' });
                return res.json({ success: true });
                
            default:
                return res.status(400).json({ error: 'Unknown action' });
        }
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}