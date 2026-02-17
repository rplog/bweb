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
    // We pass raw timestamps to client for formatting

    // Theme Colors (approximate match to Tailwind config)
    const colors = {
        bg: "#0a0a0a",
        text: "#e0e0e0",
        accent: "#00ff9d", // Neon Green
        muted: "#666666",
        border: "#333333",
        cardBg: "#111111"
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename} - NeoSphere Notes</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <style>
        body { 
            background-color: ${colors.bg}; 
            color: ${colors.text}; 
            font-family: 'Courier New', Courier, monospace; 
            margin: 0; 
            padding: 20px; 
            line-height: 1.6; 
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .container { 
            width: 100%; 
            max-width: 800px; 
            background: ${colors.cardBg};
            border: 1px solid ${colors.border}; 
            padding: 24px; 
            border-radius: 8px; 
            box-shadow: 0 0 20px rgba(0, 255, 157, 0.05); 
        }
        h1 { 
            color: ${colors.accent}; 
            border-bottom: 1px solid ${colors.border}; 
            padding-bottom: 16px; 
            margin-top: 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .meta { 
            color: ${colors.muted}; 
            font-size: 0.85em; 
            margin-bottom: 24px; 
            display: flex; 
            flex-wrap: wrap; 
            gap: 16px;
        }
        .meta-item { display: flex; align-items: center; gap: 6px; }
        .content-wrapper { position: relative; }
        .content { 
            white-space: pre-wrap; 
            background: #000; 
            padding: 20px; 
            border-radius: 4px; 
            border: 1px solid ${colors.border}; 
            font-size: 0.95em;
            overflow-x: auto;
            color: ${colors.text};
        }
        .btn {
            background: transparent;
            border: 1px solid ${colors.accent};
            color: ${colors.accent};
            padding: 6px 12px;
            cursor: pointer;
            font-family: inherit;
            font-size: 0.8em;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.2s;
        }
        .btn:hover { background: ${colors.accent}; color: #000; }
        
        .history { margin-top: 40px; border-top: 1px solid ${colors.border}; padding-top: 20px; }
        .history h3 { color: ${colors.muted}; font-size: 1em; text-transform: uppercase; letter-spacing: 1px; }
        .edit-entry { 
            font-size: 0.85em; 
            color: ${colors.muted}; 
            border-left: 2px solid ${colors.border}; 
            padding-left: 10px; 
            margin-bottom: 10px; 
        }
        .edit-entry .user { color: ${colors.accent}; font-weight: bold; }
        
        .footer { margin-top: 40px; text-align: center; color: ${colors.muted}; font-size: 0.8em; }
        a { color: ${colors.accent}; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>
            ${filename}
            <button class="btn" onclick="copyContent()">Copy All</button>
        </h1>
        <div class="meta">
            <div class="meta-item">
                <span id="created-date">Loading date...</span>
            </div>
            <div class="meta-item">
                From: ${city}, ${country}
            </div>
             <div class="meta-item">
                Timezone: ${timezone || 'UTC'}
            </div>
        </div>
        
        <div class="content-wrapper">
            <div class="content" id="note-content">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        </div>

        ${edits.length > 0 ? `
        <div class="history">
            <h3>Edit History</h3>
            <div id="edit-list">
                <!-- Populated by JS -->
            </div>
        </div>` : ''}

        <div class="footer">
            Shared via <a href="/">NeoSphere Terminal</a>
        </div>
    </div>

    <script>
        // Data passed from server
        const createdAt = ${created_at};
        const writerTimezone = "${timezone || 'UTC'}";
        const edits = ${JSON.stringify(edits)};

        // Format Date
        function formatDate(timestamp, tz) {
            try {
                return new Date(timestamp).toLocaleString('en-US', { 
                    timeZone: tz,
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'short'
                });
            } catch (e) {
                // Fallback if timezone is invalid
                return new Date(timestamp).toLocaleString();
            }
        }

        document.getElementById('created-date').textContent = 'Created: ' + formatDate(createdAt, writerTimezone);

        // Render Edits
        const editList = document.getElementById('edit-list');
        if (editList) {
            edits.forEach(edit => {
                const el = document.createElement('div');
                el.className = 'edit-entry';
                // Simple textual diff description is hard without a library, 
                // but we can show who edited it and when.
                const dateStr = formatDate(edit.created_at, writerTimezone);
                el.innerHTML = \`<span class="user">\${edit.ip} (\${edit.city})</span> edited on \${dateStr}\`;
                // If we really wanted to show DIFF, we'd need a JS diff lib here.
                // For now, let's just log the event as requested "Show their IP".
                // "text they appended or removed" -> simplified to "Edited". 
                // Full diff requires visual UI which is complex for a single file.
                editList.appendChild(el);
            });
        }

        function copyContent() {
            const text = document.getElementById('note-content').innerText;
            navigator.clipboard.writeText(text).then(() => {
                const btn = document.querySelector('.btn');
                const originalText = btn.innerText;
                btn.innerText = 'Copied!';
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
