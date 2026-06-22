import http from 'http';
import { readdir, readFile, stat } from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TESTS_DIR = path.join(__dirname, 'Tests');
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.md': 'text/plain'
};

const server = http.createServer(async (req, res) => {
    try {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const pathname = urlParams.pathname;

        // ── API: list all .md files in Tests/ ─────────────────────────────────────
        if (pathname === '/api/tests' && req.method === 'GET') {
            try {
                const entries = await readdir(TESTS_DIR);
                const files = entries.filter(f => f.toLowerCase().endsWith('.md'));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ files }));
            } catch (err) {
                console.error('Failed to read Tests directory:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Could not read tests directory' }));
            }
        }

        // ── API: serve the content of a single .md file ───────────────────────────
        if (pathname.startsWith('/api/tests/') && req.method === 'GET') {
            const filename = path.basename(decodeURIComponent(pathname.substring('/api/tests/'.length)));
            if (!filename.toLowerCase().endsWith('.md')) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Only .md files are served' }));
            }

            const fullPath = path.join(TESTS_DIR, filename);
            try {
                const content = await readFile(fullPath, 'utf-8');
                res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end(content);
            } catch (err) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: `File not found: ${filename}` }));
            }
        }

        // ── Production: serve the Vite build output ───────────────────────────────
        if (process.env.NODE_ENV === 'production') {
            let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
            if (safePath === '/' || safePath === '\\') safePath = '/index.html';

            let fullPath = path.join(DIST_DIR, safePath);
            try {
                let fileStat = await stat(fullPath);
                if (fileStat.isDirectory()) {
                    fullPath = path.join(fullPath, 'index.html');
                    fileStat = await stat(fullPath);
                }

                const ext = path.extname(fullPath).toLowerCase();
                const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

                res.writeHead(200, { 'Content-Type': mimeType });
                createReadStream(fullPath).pipe(res);
                return;
            } catch (err) {
                // SPA fallback
                if (!pathname.startsWith('/assets/')) {
                    try {
                        const fallbackPath = path.join(DIST_DIR, 'index.html');
                        await stat(fallbackPath);
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        createReadStream(fallbackPath).pipe(res);
                        return;
                    } catch (e) { }
                }

                res.writeHead(404, { 'Content-Type': 'text/plain' });
                return res.end('404 Not Found');
            }
        } else {
            // Development fallback
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('Not Found (Frontend should be run via Vite dev server)');
        }
    } catch (e) {
        console.error("Internal server error:", e);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Internal Server Error');
    }
});

server.listen(PORT, () => {
    const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    console.log(`\n🚀  Test server running in ${mode} mode`);
    console.log(`   API:  http://localhost:${PORT}/api/tests`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`   App:  http://localhost:${PORT}\n`);
    } else {
        console.log(`   App:  http://localhost:5173  (Vite dev server)\n`);
    }
});
