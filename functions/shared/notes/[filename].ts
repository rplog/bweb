export const onRequestGet = async (context: any) => {
    const { params, env } = context;
    const filename = params.filename;

    const note = await env.DB.prepare(
        "SELECT * FROM notes WHERE filename = ?"
    ).bind(filename).first();

    if (!note) {
        return new Response("Note not found", { status: 404 });
    }

    // Fetch edits
    const { results: edits } = await env.DB.prepare(
        "SELECT * FROM note_edits WHERE note_id = ? ORDER BY created_at DESC"
    ).bind(note.id).all();

    const { content, created_at, city, country, timezone } = note;

    // Theme Colors (Gold/Elegant from index.css)
    const colors = {
        bg: "#121212",
        card: "#1e1e1e",
        border: "#333333",
        textPrimary: "#e0e0e0",
        textSecondary: "#a0a0a0",
        textMuted: "#666666",
        accent: "#C9A66B",
        accentHover: "#E0C080",
        danger: "#ff5555"
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename} - NeoSphere Notes</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { 
            background-color: ${colors.bg}; 
            color: ${colors.textPrimary}; 
            font-family: 'JetBrains Mono', 'Consolas', monospace; 
            margin: 0; 
            padding: 40px 20px; 
            line-height: 1.6; 
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .container { 
            width: 100%; 
            max-width: 900px; 
            background: transparent;
        }
        
        /* Header Section */
        header {
            margin-bottom: 30px;
            border-bottom: 1px solid ${colors.border};
            padding-bottom: 20px;
        }
        h1 { 
            color: ${colors.accent}; 
            margin: 0 0 10px 0;
            font-size: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .meta { 
            color: ${colors.textSecondary}; 
            font-size: 0.9em; 
            display: flex; 
            flex-wrap: wrap; 
            gap: 20px;
            font-family: 'JetBrains Mono', monospace;
        }
        .meta-item { display: flex; align-items: center; gap: 8px; }
        .meta-label { color: ${colors.textMuted}; }
        
        /* content */
        .content-wrapper { 
            position: relative; 
            background: ${colors.card}; 
            border: 1px solid ${colors.border};
            border-radius: 4px;
            margin-bottom: 40px;
        }
        .content { 
            white-space: pre-wrap; 
            padding: 24px; 
            font-size: 1rem;
            overflow-x: auto;
            color: ${colors.textPrimary};
            tab-size: 4;
            word-break: break-word; /* Prevent content overflow */
        }
        
        /* Status Banner */
        .status-banner {
            background: ${colors.accent};
            color: ${colors.bg};
            padding: 8px 12px;
            font-size: 0.9em;
            font-weight: bold;
            display: none; 
            justify-content: space-between;
            align-items: center;
            border-radius: 4px 4px 0 0;
            flex-wrap: wrap; 
            gap: 10px;
        }

        .status-banner button {
            background: rgba(0,0,0,0.2);
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: inherit;
            font-weight: bold;
        }
        .status-banner button:hover { background: rgba(0,0,0,0.4); }
        
        /* Button */
        .btn {
            background: transparent;
            border: 1px solid ${colors.accent};
            color: ${colors.accent};
            padding: 8px 16px;
            cursor: pointer;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.2s;
            border-radius: 2px;
            flex-shrink: 0;
        }
        .btn:hover { 
            background: ${colors.accent}; 
            color: ${colors.bg}; 
        }
        
        /* Git Log Style History */
        .history { 
            margin-top: 20px;
        }
        .history-header {
            color: ${colors.textMuted};
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.85rem;
            margin-bottom: 15px;
            border-bottom: 1px solid ${colors.border};
            padding-bottom: 5px;
            display: inline-block;
        }
        .git-log {
            list-style: none;
            padding: 0;
            margin: 0;
            border-left: 1px solid ${colors.border};
            margin-left: 0px;
            padding-left: 0px;
        }
        .git-entry { 
            margin-bottom: 20px;
            position: relative;
            padding-left: 20px;
            transition: opacity 0.2s;
        }
        .git-entry:hover { opacity: 0.8; }
        .git-entry::before {
            content: '';
            position: absolute;
            left: -4px;
            top: 6px;
            width: 7px;
            height: 7px;
            background: ${colors.border};
            border-radius: 50%;
            border: 2px solid ${colors.bg};
        }
        .git-entry.active::before {
            background: ${colors.accent};
            border-color: ${colors.accent};
        }
        .commit-hash { 
            color: ${colors.accent}; 
            font-weight: bold; 
            margin-right: 10px; 
            cursor: pointer; 
            text-decoration: underline;
            text-underline-offset: 4px;
            display: inline-block; 
        }
        .commit-hash:hover { color: ${colors.accentHover}; }
        .commit-author { 
            color: ${colors.textSecondary}; 
            word-break: break-all; /* Force break specifically for long IPs */
        }
        .commit-date { color: ${colors.textMuted}; font-size: 0.9em; display: block; margin-top: 4px; }
        
        .footer { 
            margin-top: 60px; 
            text-align: center; 
            color: ${colors.textMuted}; 
            font-size: 0.85rem; 
            border-top: 1px solid ${colors.border};
            padding-top: 20px;
        }
        a { color: ${colors.textSecondary}; text-decoration: none; transition: color 0.2s;}
        a:hover { color: ${colors.accent}; }

        /* Mobile Responsiveness */
        @media (max-width: 600px) {
            body { padding: 20px 15px; }
            h1 { 
                font-size: 1.2rem; 
                flex-direction: column; 
                align-items: flex-start;
                gap: 10px;
            }
            h1 .btn { align-self: flex-start; }
            .content { padding: 15px; font-size: 0.9rem; }
            .meta { gap: 10px; font-size: 0.8em; }
            .git-entry { padding-left: 15px; }
            .commit-hash { margin-bottom: 2px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>
                <span>${filename}</span>
                <button class="btn" onclick="copyContent()">Copy</button>
            </h1>
            <div class="meta">
                <div class="meta-item">
                    <span class="meta-label">Created:</span>
                    <span id="created-date">...</span>
                </div>
                <div class="meta-item">
                     <span class="meta-label">From:</span>
                     <span>${city}, ${country}</span>
                </div>
            </div>
        </header>

        <div class="content-wrapper">
            <div id="history-banner" class="status-banner">
                <span>Viewing version <span id="viewing-hash">...</span></span>
                <button onclick="restoreLatest()">Restore Latest</button>
            </div>
            <div class="content" id="note-content"></div>
        </div>

        ${edits.length > 0 ? `
        <div class="history">
            <div class="history-header">History</div>
            <div class="git-log" id="edit-list">
                <!-- Javascript will populate this -->
            </div>
        </div>` : ''}

        <div class="footer">
            <a href="/">neosphere.pages.dev</a>
        </div>
    </div>

    <script>
        const createdAt = ${created_at};
        const writerTimezone = "${timezone || 'UTC'}";
        const latestContent = ${JSON.stringify(content)};
        const edits = ${JSON.stringify(edits)}; // Contains previous_content

        // Secure content rendering to prevent XSS (basic)
        function escapeHtml(text) {
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        // Initialize content
        const contentEl = document.getElementById('note-content');
        contentEl.innerHTML = escapeHtml(latestContent);

        // Date Format
        function formatGitDate(timestamp, tz) {
             try {
                return new Date(timestamp).toLocaleString('en-US', { 
                    timeZone: tz,
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'longOffset'
                });
            } catch (e) {
                return new Date(timestamp).toLocaleString();
            }
        }

        document.getElementById('created-date').textContent = formatGitDate(createdAt, writerTimezone);

        // History Logic
        const editList = document.getElementById('edit-list');
        const banner = document.getElementById('history-banner');
        const hashDisplay = document.getElementById('viewing-hash');

        function viewVersion(id) {
            const edit = edits.find(e => e.id === id);
            if (!edit) return;

            contentEl.innerHTML = escapeHtml(edit.previous_content || "(No content recorded)");
            banner.style.display = 'flex';
            hashDisplay.textContent = id.substring(0, 7);
            
            // Highlight active
            document.querySelectorAll('.git-entry').forEach(el => el.classList.remove('active'));
            document.getElementById('entry-' + id)?.classList.add('active');
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function restoreLatest() {
            contentEl.innerHTML = escapeHtml(latestContent);
            banner.style.display = 'none';
            document.querySelectorAll('.git-entry').forEach(el => el.classList.remove('active'));
        }
        
        // Expose to window for onclick
        window.restoreLatest = restoreLatest;

        if (editList) {
            edits.forEach(edit => {
                const el = document.createElement('div');
                el.className = 'git-entry';
                el.id = 'entry-' + edit.id;
                
                const hash = edit.id.substring(0, 7);
                const dateStr = formatGitDate(edit.created_at, writerTimezone);
                
                el.innerHTML = \`
                    <div>
                        <span class="commit-hash" onclick="viewVersion('\${edit.id}')">\${hash}</span>
                        <span class="commit-author">msg from \${edit.ip} (\${edit.city})</span>
                    </div>
                    <span class="commit-date">Date:   \${dateStr}</span>
                \`;
                editList.appendChild(el);
            });
        }
        
        // Expose for onclick
        window.viewVersion = viewVersion;

        function copyContent() {
            const text = contentEl.innerText;
            navigator.clipboard.writeText(text).then(() => {
                const btn = document.querySelector('.btn');
                const originalText = btn.innerText;
                btn.innerText = 'COPIED';
                setTimeout(() => btn.innerText = originalText, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        }
    </script>
</body>
</html>
    `;

    return new Response(html, {
        headers: { "Content-Type": "text/html" },
    });
};
