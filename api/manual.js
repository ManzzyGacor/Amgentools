export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { action, email, link } = req.body;
    const apiKey = 'VaresaMD';

    try {
        if (action === 'send') {
            const url = `https://api.jerexd.my.id/api/am/send?apikey=${apiKey}&email=${encodeURIComponent(email)}`;
            const response = await fetch(url);
            const data = await response.json();
            return res.status(200).json(data);
            
        } else if (action === 'verif') {
            const url = `https://api.jerexd.my.id/api/am/verif?apikey=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, link })
            });
            const data = await response.json();
            return res.status(200).json(data);
        }
        
        return res.status(400).json({ error: 'Invalid action' });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}