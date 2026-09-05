import { MongoClient } from 'mongodb';

// Sangat disarankan menaruh string ini di Vercel > Settings > Environment Variables dengan nama MONGODB_URI
// Agar password database tidak bocor jika kode ini di-push ke GitHub publik.
const uri = process.env.MONGODB_URI || "mongodb+srv://manzzygenshin_db_user:OKdzMae2OLtMAqP2@jpmmanz.nax4l7g.mongodb.net/kingjpm?retryWrites=true&w=majority&appName=Jpmmanz";

// Variabel global untuk cache koneksi (Penting untuk Vercel Serverless)
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb };
    
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('kingjpm'); // Nama database dari link URL
    
    cachedClient = client;
    cachedDb = db;
    return { client, db };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { action, username, password, targetUser, waNumber } = req.body;

    try {
        const { db } = await connectToDatabase();
        const usersCol = db.collection('am_users');
        const settingsCol = db.collection('am_settings');

        switch(action) {
            case 'init':
                // Auto create akun admin dan default WA
                await usersCol.updateOne(
                    { username: 'man' },
                    { $setOnInsert: { username: 'man', password: 'admin', role: 'admin' } },
                    { upsert: true }
                );
                await settingsCol.updateOne(
                    { key: 'wa_admin' },
                    { $setOnInsert: { key: 'wa_admin', value: '628123456789' } },
                    { upsert: true }
                );
                return res.json({ success: true, message: "DB Ready" });

            case 'register':
                const exist = await usersCol.findOne({ username });
                if (exist) return res.status(400).json({ error: 'Username sudah ada' });
                
                await usersCol.insertOne({ username, password, role: 'user' });
                return res.json({ success: true, role: 'user' });

            case 'login':
                const user = await usersCol.findOne({ username, password });
                if (!user) return res.status(401).json({ error: 'Username/Password salah' });
                return res.json({ success: true, role: user.role });

            case 'getWa':
                const wa = await settingsCol.findOne({ key: 'wa_admin' });
                return res.json({ success: true, wa: wa ? wa.value : null });

            case 'setWa':
                await settingsCol.updateOne(
                    { key: 'wa_admin' },
                    { $set: { value: waNumber } },
                    { upsert: true }
                );
                return res.json({ success: true });

            case 'upgrade':
                const target = await usersCol.updateOne(
                    { username: targetUser },
                    { $set: { role: 'premium' } }
                );
                if (target.matchedCount === 0) return res.status(404).json({ error: 'Username tidak ditemukan' });
                return res.json({ success: true });
                
            default:
                return res.status(400).json({ error: 'Unknown action' });
        }
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
