const http = require("http");

const PORT = 5000;
const HOST = "0.0.0.0";

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@musekit/services — Package Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 960px; margin: 0 auto; padding: 2rem 1rem; }
    header { text-align: center; padding: 3rem 0 2rem; }
    header h1 { font-size: 2rem; font-weight: 700; color: #f8fafc; margin-bottom: 0.5rem; }
    header p { color: #94a3b8; font-size: 1.1rem; }
    .badge { display: inline-block; padding: 0.25rem 0.75rem; background: #1e40af; color: #93c5fd; font-size: 0.75rem; border-radius: 9999px; font-weight: 600; margin-top: 0.75rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; transition: border-color 0.2s; }
    .card:hover { border-color: #3b82f6; }
    .card h2 { font-size: 1.1rem; color: #f1f5f9; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
    .card .icon { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .card ul { list-style: none; padding: 0; }
    .card li { padding: 0.35rem 0; color: #94a3b8; font-size: 0.875rem; border-bottom: 1px solid #1e293b; display: flex; align-items: center; gap: 0.5rem; }
    .card li::before { content: '→'; color: #3b82f6; font-weight: bold; }
    .card li:last-child { border-bottom: none; }
    .status-section { margin-top: 2rem; }
    .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem; }
    .status-item { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1rem; }
    .status-item .label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .status-item .value { font-size: 1rem; color: #f1f5f9; margin-top: 0.25rem; font-weight: 600; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 0.5rem; }
    .dot-green { background: #22c55e; }
    .dot-yellow { background: #eab308; }
    .dot-blue { background: #3b82f6; }
    footer { text-align: center; margin-top: 3rem; padding: 1.5rem 0; border-top: 1px solid #1e293b; color: #475569; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>@musekit/services</h1>
      <p>Backend services package for the MuseKit SaaS platform</p>
      <span class="badge">v0.1.0 — Library Package</span>
    </header>

    <div class="grid">
      <div class="card">
        <h2><span class="icon" style="background:#1e40af;">🔔</span> Notifications</h2>
        <ul>
          <li>createNotification(userId, type, title, message)</li>
          <li>getUnreadCount(userId)</li>
          <li>markAllRead(userId)</li>
          <li>getNotifications(userId, options)</li>
          <li>NotificationBell component</li>
        </ul>
      </div>

      <div class="card">
        <h2><span class="icon" style="background:#7c3aed;">🔗</span> Webhooks</h2>
        <ul>
          <li>dispatchWebhook(event, payload)</li>
          <li>8 event types with HMAC-SHA256 signing</li>
          <li>Fire-and-forget with 3x retry</li>
          <li>getWebhookConfig / updateWebhookConfig</li>
          <li>validateWebhookUrl(url)</li>
        </ul>
      </div>

      <div class="card">
        <h2><span class="icon" style="background:#059669;">🤖</span> AI Provider</h2>
        <ul>
          <li>createAIProvider(config) — pluggable factory</li>
          <li>xAI Grok, OpenAI, Anthropic support</li>
          <li>chatCompletion (non-streaming)</li>
          <li>streamChatCompletion (streaming)</li>
          <li>HelpWidget component with NPS</li>
        </ul>
      </div>

      <div class="card">
        <h2><span class="icon" style="background:#dc2626;">⚡</span> Background Jobs</h2>
        <ul>
          <li>BullMQ queue with Upstash Redis</li>
          <li>emailDelivery processor</li>
          <li>webhookRetry processor</li>
          <li>reportGeneration / metricsReport</li>
          <li>Rate limiter with in-memory fallback</li>
        </ul>
      </div>
    </div>

    <div class="status-section">
      <h2 style="font-size:1.1rem; color:#f1f5f9;">Environment Status</h2>
      <div class="status-grid">
        <div class="status-item">
          <div class="label">Supabase</div>
          <div class="value"><span class="dot dot-green"></span>${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Connected' : 'Not Configured'}</div>
        </div>
        <div class="status-item">
          <div class="label">xAI API Key</div>
          <div class="value"><span class="dot ${process.env.XAI_API_KEY ? 'dot-green' : 'dot-yellow'}"></span>${process.env.XAI_API_KEY ? 'Configured' : 'Missing'}</div>
        </div>
        <div class="status-item">
          <div class="label">Upstash Redis</div>
          <div class="value"><span class="dot ${process.env.UPSTASH_REDIS_REST_URL ? 'dot-green' : 'dot-yellow'}"></span>${process.env.UPSTASH_REDIS_REST_URL ? 'Configured' : 'Missing'}</div>
        </div>
        <div class="status-item">
          <div class="label">Package Build</div>
          <div class="value"><span class="dot dot-blue"></span>TypeScript Library</div>
        </div>
      </div>
    </div>

    <footer>
      <p>@musekit/services — Notifications, Webhooks, AI Provider, Background Jobs</p>
    </footer>
  </div>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", package: "@musekit/services", version: "0.1.0" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
});

server.listen(PORT, HOST, function() {
  console.log("@musekit/services dev dashboard running at http://" + HOST + ":" + PORT);
});
