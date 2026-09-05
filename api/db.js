import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { action, username, password, targetUser, waNumber, currentUser } = req.body;

    try {
        switch(action) {
            case 'init':
                // Auto create table dan user admin
                await sql`CREATE TABLE IF NOT EXISTS am_users (username VARCHAR(255) PRIMARY KEY, password VARCHAR(255), role VARCHAR(50) DEFAULT 'user');`;
                await sql`CREATE TABLE IF NOT EXISTS am_settings (key VARCHAR(255) PRIMARY KEY, value TEXT);`;
                await sql`INSERT INTO am_users (username, password, role) VALUES ('man', 'admin', 'admin') ON CONFLICT DO NOTHING;`;
                await sql`INSERT INTO am_settings (key, value) VALUES ('wa_admin', '628123456789') ON CONFLICT DO NOTHING;`;
                return res.json({ success: true, message: "DB Ready" });

            case 'register':
                const exist = await sql`SELECT * FROM am_users WHERE username=${username}`;
                if (exist.rowCount > 0) return res.status(400).json({ error: 'Username sudah ada' });
                await sql`INSERT INTO am_users (username, password) VALUES (${username}, ${password})`;
                return res.json({ success: true, role: 'user' });

            case 'login':
                const user = await sql`SELECT * FROM am_users WHERE username=${username} AND password=${password}`;
                if (user.rowCount === 0) return res.status(401).json({ error: 'Username/Password salah' });
                return res.json({ success: true, role: user.rows[0].role });

            case 'getWa':
                const wa = await sql`SELECT value FROM am_settings WHERE key='wa_admin'`;
                return res.json({ success: true, wa: wa.rows[0]?.value });

            case 'setWa':
                await sql`UPDATE am_settings SET value=${waNumber} WHERE key='wa_admin'`;
                return res.json({ success: true });

            case 'upgrade':
                await sql`UPDATE am_users SET role='premium' WHERE username=${targetUser}`;
                return res.json({ success: true });
                
            default:
                return res.status(400).json({ error: 'Unknown action' });
        }
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
