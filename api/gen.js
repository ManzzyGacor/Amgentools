export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    const { searchParams } = new URL(req.url);
    const amount = searchParams.get('amount') || 1;
    
    // API Target dengan API Key yang disembunyikan di backend
    const targetUrl = `https://api.jerexd.my.id/api/am/bulk?apikey=VaresaMD&amount=${amount}`;
    
    const response = await fetch(targetUrl);
    
    // Meneruskan Server-Sent Events (SSE) stream ke frontend
    return new Response(response.body, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    });
}
