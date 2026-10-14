import express from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const ADMIN_PASSWORD = process.env.CONTROL_PANEL_PASSWORD || process.env.REDIS_PASSWORD || 'admin';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Return 204 No Content for favicon requests to prevent console 404 errors
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Zero-dependency cookie parser helper
const parseCookies = (cookieHeader) => {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
    }
  });
  return list;
};

// Helper to run shell commands safely
const runCommand = (cmd) => {
  return new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      resolve({
        success: !error,
        stdout: stdout ? stdout.trim() : '',
        stderr: stderr ? stderr.trim() : '',
      });
    });
  });
};

// Middleware to check authentication
const authenticate = (req, res, next) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.admin_token;
  if (token === ADMIN_PASSWORD) {
    return next();
  }
  // Redirect to login if unauthorized
  res.status(401).send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login | HRMS Control Panel</title>
      <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏥</text></svg>">
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --bg-grad: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          --panel-bg: rgba(30, 41, 59, 0.7);
          --border: rgba(255, 255, 255, 0.08);
          --accent: #6366f1;
          --accent-hover: #4f46e5;
          --text: #f1f5f9;
          --text-muted: #94a3b8;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
        body {
          background: var(--bg-grad);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .login-card {
          background: var(--panel-bg);
          backdrop-filter: blur(16px);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 40px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          text-align: center;
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        h2 { font-size: 28px; font-weight: 700; margin-bottom: 8px; color: #fff; }
        p { font-size: 14px; color: var(--text-muted); margin-bottom: 32px; }
        .form-group { margin-bottom: 24px; text-align: left; }
        label { display: block; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 8px; }
        input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          outline: none;
          transition: all 0.2s;
        }
        input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); }
        button {
          width: 100%;
          padding: 14px;
          background: var(--accent);
          color: #fff;
          font-weight: 600;
          font-size: 15px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        button:hover { background: var(--accent-hover); transform: translateY(-1px); }
        .error-msg { color: #f87171; font-size: 14px; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="login-card">
        <h2>HRMS Portal</h2>
        <p>Dashboard Monitoring & Kontrol Produksi</p>
        <form method="POST" action="/login">
          <div class="form-group">
            <label for="password">Password Produksi</label>
            <input type="password" id="password" name="password" placeholder="Masukkan password..." required autofocus>
          </div>
          <button type="submit">Masuk Ke Panel</button>
        </form>
        \${req.query.error ? '<p class="error-msg">Password tidak valid!</p>' : ''}
      </div>
    </body>
    </html>
  `);
};

// Login Route
app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.setHeader('Set-Cookie', `admin_token=${ADMIN_PASSWORD}; Path=/; HttpOnly; Max-Age=86400`);
    return res.redirect('/');
  }
  res.redirect('/?error=1');
});

// Logout Route
app.get('/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'admin_token=; Path=/; HttpOnly; Max-Age=0');
  res.redirect('/');
});

// Main Dashboard HTML
app.get('/', authenticate, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HRMS-Pro Control Panel</title>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --bg: #090d16;
          --bg-grad: linear-gradient(135deg, #090d16 0%, #0d0c24 100%);
          --panel: rgba(22, 28, 45, 0.6);
          --panel-hover: rgba(22, 28, 45, 0.85);
          --border: rgba(255, 255, 255, 0.05);
          --border-hover: rgba(255, 255, 255, 0.12);
          
          --text: #f8fafc;
          --text-muted: #64748b;
          
          --accent: #6366f1;
          --green: #10b981;
          --red: #ef4444;
          --orange: #f59e0b;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
        body {
          background: var(--bg-grad);
          color: var(--text);
          min-height: 100vh;
          padding: 24px;
          overflow-x: hidden;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 20px;
        }
        .logo-section h1 { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .logo-section p { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
        
        .nav-actions { display: flex; gap: 12px; }
        .btn {
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #fff;
          text-decoration: none;
        }
        .btn-primary { background: var(--accent); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25); }
        .btn-primary:hover { background: #4f46e5; transform: translateY(-1px); }
        .btn-outline { background: transparent; border: 1px solid var(--border); }
        .btn-outline:hover { background: rgba(255,255,255,0.05); border-color: var(--border-hover); }
        .btn-danger { background: var(--red); }
        .btn-danger:hover { background: #dc2626; }

        /* Grid Layout */
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 24px;
          margin-bottom: 24px;
        }

        .card {
          background: var(--panel);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          transition: border-color 0.2s, background-color 0.2s;
        }
        .card:hover { border-color: var(--border-hover); background: var(--panel-hover); }

        .col-4 { grid-column: span 4; }
        .col-6 { grid-column: span 6; }
        .col-8 { grid-column: span 8; }
        .col-12 { grid-column: span 12; }

        @media (max-width: 1024px) {
          .col-4, .col-6, .col-8 { grid-column: span 12; }
        }

        .card-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* Metrics Progress Bars */
        .metric-item { margin-bottom: 20px; }
        .metric-header { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; font-weight: 500; }
        .metric-bar-outer { height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
        .metric-bar-inner { height: 100%; border-radius: 4px; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        
        /* Links grid */
        .hub-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .hub-item {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border);
          padding: 16px;
          border-radius: 12px;
          text-decoration: none;
          color: #fff;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .hub-item:hover {
          background: rgba(99, 102, 241, 0.08);
          border-color: var(--accent);
          transform: translateY(-2px);
        }
        .hub-name { font-weight: 700; font-size: 15px; }
        .hub-desc { font-size: 12px; color: var(--text-muted); }

        /* Process Table */
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { padding: 12px 16px; font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border); }
        td { padding: 16px; font-size: 14px; border-bottom: 1px solid var(--border); }
        tr:last-child td { border-bottom: none; }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .badge-online { background: rgba(16, 185, 129, 0.1); color: var(--green); }
        .badge-offline { background: rgba(239, 68, 68, 0.1); color: var(--red); }
        .badge-restarting { background: rgba(245, 158, 11, 0.1); color: var(--orange); }

        .action-group { display: flex; gap: 8px; justify-content: flex-end; }
        .action-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn:hover { background: rgba(255,255,255,0.06); border-color: var(--border-hover); }

        /* Log console */
        .console {
          background: #040711;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          font-family: monospace;
          font-size: 13px;
          line-height: 1.6;
          height: 300px;
          overflow-y: auto;
          color: #a7f3d0;
          white-space: pre-wrap;
        }
        .console-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .console-tab {
          display: flex;
          gap: 8px;
        }
        .tab-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }
        .tab-btn.active {
          background: rgba(99, 102, 241, 0.15);
          color: var(--accent);
          border-color: var(--accent);
        }
      </style>
    </head>
    <body>
      <header>
        <div class="logo-section">
          <h1>🏥 HRMS-Pro Control Panel</h1>
          <p>Portal Manajemen & Monitoring Server Produksi</p>
        </div>
        <div class="nav-actions">
          <a href="/" class="btn btn-outline" onclick="refreshDashboard(); return false;">🔄 Segarkan</a>
          <a href="/logout" class="btn btn-danger">🚪 Keluar</a>
        </div>
      </header>

      <div class="dashboard-grid">
        <!-- System Health metrics -->
        <div class="card col-4">
          <div class="card-title">🖥️ Status Sumber Daya VM</div>
          
          <div class="metric-item">
            <div class="metric-header">
              <span>Beban CPU</span>
              <span id="cpu-val">0%</span>
            </div>
            <div class="metric-bar-outer">
              <div id="cpu-bar" class="metric-bar-inner" style="width: 0%; background: var(--accent);"></div>
            </div>
          </div>

          <div class="metric-item">
            <div class="metric-header">
              <span>Penggunaan Memori (RAM)</span>
              <span id="ram-val">0 MB / 0 MB</span>
            </div>
            <div class="metric-bar-outer">
              <div id="ram-bar" class="metric-bar-inner" style="width: 0%; background: var(--green);"></div>
            </div>
          </div>

          <div class="metric-item">
            <div class="metric-header">
              <span>Penyimpanan Disk (/)</span>
              <span id="disk-val">0%</span>
            </div>
            <div class="metric-bar-outer">
              <div id="disk-bar" class="metric-bar-inner" style="width: 0%; background: var(--orange);"></div>
            </div>
          </div>
        </div>

        <!-- Consolidated Portal Hub -->
        <div class="card col-8">
          <div class="card-title">🔗 Portal Akses Terpadu</div>
          <div class="hub-grid">
            <a href="http://192.168.1.254" target="_blank" class="hub-item">
              <div class="hub-name">🌐 Aplikasi HRMS-Pro</div>
              <div class="hub-desc">Akses portal website sistem manajemen kepegawaian utama.</div>
            </a>
            <a href="http://192.168.1.254:3002" target="_blank" class="hub-item">
              <div class="hub-name">📊 Grafana Dashboard</div>
              <div class="hub-desc">Visualisasi performa server, memori cache, dan log aplikasi.</div>
            </a>
            <a href="http://192.168.1.254:9090" target="_blank" class="hub-item">
              <div class="hub-name">📈 Prometheus Target</div>
              <div class="hub-desc">Database pencatatan metrik, status kluster, dan alarm otomatis.</div>
            </a>
            <a href="http://192.168.1.254:5601" target="_blank" class="hub-item">
              <div class="hub-name">🔍 Kibana Logs</div>
              <div class="hub-desc">Pencarian log terdistribusi Elasticsearch untuk pelacakan error.</div>
            </a>
          </div>
        </div>

        <!-- PM2 Clustered Processes -->
        <div class="card col-12">
          <div class="card-title">📦 PM2 Application Processes</div>
          <div style="overflow-x: auto;">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama Aplikasi</th>
                  <th>Mode</th>
                  <th>PID</th>
                  <th>Uptime</th>
                  <th>CPU</th>
                  <th>Memori</th>
                  <th>Status</th>
                  <th style="text-align: right;">Aksi</th>
                </tr>
              </thead>
              <tbody id="pm2-table-body">
                <tr>
                  <td colspan="9" style="text-align: center; color: var(--text-muted);">Memuat proses PM2...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Docker Infrastructure Containers -->
        <div class="card col-12">
          <div class="card-title">🐳 Docker Infrastructure Containers</div>
          <div style="overflow-x: auto;">
            <table>
              <thead>
                <tr>
                  <th>Nama Kontainer</th>
                  <th>Status</th>
                  <th>Uptime / Keadaan</th>
                  <th>Port Mapping</th>
                  <th style="text-align: right;">Aksi</th>
                </tr>
              </thead>
              <tbody id="docker-table-body">
                <tr>
                  <td colspan="5" style="text-align: center; color: var(--text-muted);">Memuat kontainer Docker...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Console logs tail -->
        <div class="card col-12">
          <div class="console-header">
            <div class="console-tab">
              <button class="tab-btn active" onclick="switchLogTab('error', this)">🚨 App Error Logs</button>
              <button class="tab-btn" onclick="switchLogTab('combined', this)">📝 Combined Logs</button>
            </div>
            <span style="font-size: 12px; color: var(--text-muted);">Menampilkan 50 baris terakhir</span>
          </div>
          <div id="log-console" class="console">Memuat file log...</div>
        </div>
      </div>

      <script>
        let currentLogTab = 'error';

        async function apiPost(url) {
          try {
            const res = await fetch(url, { method: 'POST' });
            const data = await res.json();
            refreshDashboard();
            if(!data.success) {
              alert('Gagal melakukan aksi: ' + (data.error || 'Unknown error'));
            }
          } catch(e) {
            alert('Kesalahan jaringan: ' + e.message);
          }
        }

        async function refreshDashboard() {
          try {
            const res = await fetch('/api/status');
            if (res.status === 401) {
              window.location.reload();
              return;
            }
            const data = await res.json();
            
            // 1. Update Metrics
            const cpu = data.system.cpu;
            const mem = data.system.mem;
            const disk = data.system.disk;
            
            document.getElementById('cpu-val').innerText = cpu + '%';
            document.getElementById('cpu-bar').style.width = cpu + '%';
            
            document.getElementById('ram-val').innerText = mem.used + ' MB / ' + mem.total + ' MB';
            document.getElementById('ram-bar').style.width = mem.percent + '%';
            
            document.getElementById('disk-val').innerText = disk.percent + '% (' + disk.used + ' dari ' + disk.total + ')';
            document.getElementById('disk-bar').style.width = disk.percent + '%';

            // 2. Update PM2
            const pm2Body = document.getElementById('pm2-table-body');
            pm2Body.innerHTML = '';
            if(data.pm2 && data.pm2.length > 0) {
              data.pm2.forEach(p => {
                const badgeClass = p.status === 'online' ? 'badge-online' : p.status === 'error' || p.status === 'stopped' ? 'badge-offline' : 'badge-restarting';
                pm2Body.innerHTML += \`
                  <tr>
                    <td>\${p.id}</td>
                    <td style="font-weight: 600;">\${p.name}</td>
                    <td>\${p.mode}</td>
                    <td>\${p.pid}</td>
                    <td>\${p.uptime}</td>
                    <td>\${p.cpu}%</td>
                    <td>\${p.mem} MB</td>
                    <td><span class="status-badge \${badgeClass}">\${p.status}</span></td>
                    <td class="action-group">
                      <button class="action-btn" onclick="apiPost('/api/pm2/restart/\${p.id}')">🔄 Restart</button>
                      <button class="action-btn" style="color: var(--red);" onclick="apiPost('/api/pm2/stop/\${p.id}')">🛑 Stop</button>
                    </td>
                  </tr>
                \`;
              });
            } else {
              pm2Body.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-muted);">Tidak ada proses PM2 aktif</td></tr>';
            }

            // 3. Update Docker
            const dockerBody = document.getElementById('docker-table-body');
            dockerBody.innerHTML = '';
            if(data.docker && data.docker.length > 0) {
              data.docker.forEach(c => {
                const badgeClass = c.state === 'running' ? 'badge-online' : c.state === 'exited' ? 'badge-offline' : 'badge-restarting';
                dockerBody.innerHTML += \`
                  <tr>
                    <td style="font-weight: 600;">\${c.name}</td>
                    <td><span class="status-badge \${badgeClass}">\${c.state.toUpperCase()}</span></td>
                    <td>\${c.status}</td>
                    <td style="font-family: monospace; font-size: 13px;">\${c.ports || '-'}</td>
                    <td class="action-group">
                      <button class="action-btn" onclick="apiPost('/api/docker/restart/\${c.name}')">🔄 Restart</button>
                      <button class="action-btn" style="color: var(--red);" onclick="apiPost('/api/docker/stop/\${c.name}')">🛑 Stop</button>
                      <button class="action-btn" style="color: var(--green);" onclick="apiPost('/api/docker/start/\${c.name}')">▶️ Start</button>
                    </td>
                  </tr>
                \`;
              });
            } else {
              dockerBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Tidak ada kontainer Docker aktif</td></tr>';
            }
          } catch(e) {
            console.error('Error fetching status:', e);
          }
        }

        async function refreshLogs() {
          try {
            const res = await fetch('/api/logs?type=' + currentLogTab);
            if (res.status === 401) return;
            const data = await res.json();
            const consoleEl = document.getElementById('log-console');
            consoleEl.innerText = data.logs || 'File log kosong atau tidak dapat diakses.';
            // Auto scroll console
            consoleEl.scrollTop = consoleEl.scrollHeight;
          } catch(e) {
            console.error('Error fetching logs:', e);
          }
        }

        function switchLogTab(type, btn) {
          currentLogTab = type;
          document.querySelectorAll('.console-header .tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          refreshLogs();
        }

        // Auto Refresh
        refreshDashboard();
        refreshLogs();
        setInterval(refreshDashboard, 3000);
        setInterval(refreshLogs, 5000);
      </script>
    </body>
    </html>
  `);
});

// REST API endpoint: Consolidated Status
app.get('/api/status', authenticate, async (req, res) => {
  const status = {
    system: { cpu: 0, mem: { total: 0, used: 0, percent: 0 }, disk: { total: '', used: '', percent: 0 } },
    pm2: [],
    docker: []
  };

  // 1. Gather System Metrics (Linux host native parses)
  const cpuLoad = await runCommand("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'");
  status.system.cpu = parseFloat(cpuLoad.stdout) || 0;

  const memInfo = await runCommand("free -m | grep 'Mem:' | awk '{print $2\",\"$3}'");
  if(memInfo.success && memInfo.stdout) {
    const [total, used] = memInfo.stdout.split(',').map(Number);
    status.system.mem.total = total;
    status.system.mem.used = used;
    status.system.mem.percent = Math.round((used / total) * 100) || 0;
  }

  const diskInfo = await runCommand("df -h / | tail -n 1 | awk '{print $2\",\"$3\",\"$5}'");
  if(diskInfo.success && diskInfo.stdout) {
    const [total, used, percentStr] = diskInfo.stdout.split(',');
    status.system.disk.total = total;
    status.system.disk.used = used;
    status.system.disk.percent = parseInt(percentStr) || 0;
  }

  // 2. Gather PM2 Clustered list
  const pm2List = await runCommand("pm2 jlist");
  if(pm2List.success && pm2List.stdout) {
    try {
      const pm2Raw = JSON.parse(pm2List.stdout);
      status.pm2 = pm2Raw.map(p => {
        const uptimeMs = Date.now() - p.pm2_env.pm_uptime;
        const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
        const uptimeMins = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
        return {
          id: p.pm_id,
          name: p.name,
          mode: p.pm2_env.exec_mode.replace('_mode', ''),
          pid: p.pid,
          uptime: `${uptimeHours}h ${uptimeMins}m`,
          cpu: p.monit ? p.monit.cpu : 0,
          mem: p.monit ? Math.round(p.monit.memory / (1024 * 1024)) : 0,
          status: p.pm2_env.status
        };
      });
    } catch(e) {
      console.error(e);
    }
  }

  // 3. Gather Docker list
  const dockerList = await runCommand('docker ps -a --format "{\\\"name\\\":\\\"{{.Names}}\\\",\\\"status\\\":\\\"{{.Status}}\\\",\\\"state\\\":\\\"{{.State}}\\\",\\\"ports\\\":\\\"{{.Ports}}\\\"}"');
  if(dockerList.success && dockerList.stdout) {
    const lines = dockerList.stdout.split('\n').filter(Boolean);
    status.docker = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  res.json(status);
});

// REST API endpoint: PM2 Controls
app.post('/api/pm2/:action/:id', authenticate, async (req, res) => {
  const { action, id } = req.params;
  if (!['restart', 'stop', 'reload'].includes(action)) {
    return res.json({ success: false, error: 'Aksi tidak valid' });
  }

  const result = await runCommand(`pm2 ${action} ${id}`);
  res.json({ success: result.success, error: result.stderr });
});

// REST API endpoint: Docker Controls
app.post('/api/docker/:action/:container', authenticate, async (req, res) => {
  const { action, container } = req.params;
  if (!['start', 'stop', 'restart'].includes(action)) {
    res.json({ success: false, error: 'Aksi tidak valid' });
    return;
  }

  // Prevent restarting the control panel's container if it was in docker (it's PM2 host so it's fine)
  const result = await runCommand(`docker ${action} ${container}`);
  res.json({ success: result.success, error: result.stderr });
});

// REST API endpoint: Logs retrieval
app.get('/api/logs', authenticate, (req, res) => {
  const type = req.query.type || 'error';
  const logFile = type === 'error' ? 'logs/error.log' : 'logs/out.log';
  const filePath = path.resolve(__dirname, '..', logFile);

  if (!fs.existsSync(filePath)) {
    return res.json({ success: false, logs: 'File log tidak ditemukan.' });
  }

  // Read last 50 lines of log file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.json({ success: false, logs: 'Gagal membaca file log.' });
    }
    const lines = data.split('\n');
    const tailLines = lines.slice(-50).join('\n');
    res.json({ success: true, logs: tailLines });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 HRMS Admin Control Panel running on port ${PORT}`);
});
