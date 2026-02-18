export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (context) => {
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

    const { content, created_at, updated_at, city, country, timezone } = note;

    // Fetch latest edit for modification location
    const latestEdit = await env.DB.prepare(
        "SELECT city, country FROM note_edits WHERE note_id = ? ORDER BY created_at DESC LIMIT 1"
    ).bind(note.id).first();

    const createdCity = city;
    const createdCountry = country;
    const modifiedCity = latestEdit?.city || city;
    const modifiedCountry = latestEdit?.country || country;

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

    const escapeHtml = (text: string) => {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };
    const safeFilename = escapeHtml(String(filename));

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeFilename} - NeoSphere Notes</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    ${edits.length > 0 ? '<script src="https://cdn.jsdelivr.net/npm/diff@8.0.3/dist/diff.min.js"></script>' : ''}
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
            flex-direction: column;
            gap: 8px;
            font-family: 'JetBrains Mono', monospace;
        }
        .meta-row { display: flex; flex-wrap: wrap; gap: 20px; align-items: center; }
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
        
        /* Diff Styles */
        .diff-container {
            font-size: 0.9rem;
        }
        .diff-line {
            display: flex;
            font-family: 'JetBrains Mono', monospace;
            line-height: 1.5;
            min-height: 1.5em;
        }
        .diff-line-num {
            width: 45px;
            min-width: 45px;
            text-align: right;
            padding: 0 8px;
            color: ${colors.textMuted};
            user-select: none;
            flex-shrink: 0;
            font-size: 0.85em;
        }
        .diff-line-prefix {
            width: 20px;
            min-width: 20px;
            text-align: center;
            user-select: none;
            flex-shrink: 0;
            font-weight: bold;
        }
        .diff-line-content {
            flex: 1;
            white-space: pre-wrap;
            word-break: break-word;
            padding-right: 8px;
        }
        .diff-line.added {
            background-color: rgba(46, 160, 67, 0.15);
        }
        .diff-line.added .diff-line-prefix {
            color: #3fb950;
        }
        .diff-line.added .diff-line-content {
            color: #aff5b4;
        }
        .diff-line.removed {
            background-color: rgba(248, 81, 73, 0.15);
        }
        .diff-line.removed .diff-line-prefix {
            color: #f85149;
        }
        .diff-line.removed .diff-line-content {
            color: #ffdce0;
        }
        .diff-line.context {
            background: transparent;
        }
        .diff-line.context .diff-line-content {
            color: ${colors.textSecondary};
        }
        .diff-stats {
            padding: 8px 16px;
            font-size: 0.85em;
            color: ${colors.textSecondary};
            border-bottom: 1px solid ${colors.border};
        }
        .diff-stats .added-count { color: #3fb950; font-weight: bold; }
        .diff-stats .removed-count { color: #f85149; font-weight: bold; }
        
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
            left: -6px; /* Center on 1px border (11px width: -6 + 5.5 = -0.5) */
            top: 8px;   /* Center vertically on line height */
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
            margin-top: auto;
            text-align: center; 
            color: ${colors.textMuted}; 
            font-size: 0.875rem; 
            border-top: 1px solid ${colors.border};
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
            background-color: ${colors.bg};
            font-weight: 700;
        }
        a { color: ${colors.textSecondary}; text-decoration: none; transition: color 0.2s;}
        a:hover { color: ${colors.accent}; }

        /* Mobile Responsiveness */
        .breadcrumb {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 20px;
            color: ${colors.textSecondary};
        }
        .breadcrumb a {
            color: ${colors.accent};
            text-decoration: none;
            transition: opacity 0.2s;
        }
        .breadcrumb a:hover {
            opacity: 0.8;
            text-decoration: underline;
        }
        .breadcrumb .sep {
            margin: 0 8px;
            color: ${colors.border};
        }
        .breadcrumb .current {
            color: ${colors.textPrimary};
        }

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
        <nav class="breadcrumb">
            <a href="/">~</a>
            <span class="sep">/</span>
            <a href="/?dir=visitors_notes">visitors_notes</a>
            <span class="sep">/</span>
            <span class="current">${filename}</span>
        </nav>
        <header>
            <h1>
                <span>${safeFilename}</span>
                <button class="btn" onclick="copyContent()">Copy</button>
            </h1>
            <div class="meta">
                <div class="meta-row">
                    <div class="meta-item">
                        <span class="meta-label">Created:</span>
                        <span id="created-date">...</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">From:</span>
                        <span>${createdCity}, ${createdCountry}</span>
                    </div>
                </div>
                <div class="meta-row">
                    <div class="meta-item">
                        <span class="meta-label">Last Modified:</span>
                        <span id="updated-date">...</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">From:</span>
                        <span>${modifiedCity}, ${modifiedCountry}</span>
                    </div>
                </div>
            </div>
        </header>

        <div class="content-wrapper">
            <div id="history-banner" class="status-banner">
                <span>Viewing diff for <button id="viewing-hash" onclick="copyViewedHash()">...</button></span>
                <div>
                     <button onclick="viewFileContent()" id="toggle-view-btn" style="margin-right: 10px;">View Content</button>
                     <button onclick="restoreLatest()">Restore Latest</button>
                </div>
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
            <div style="max-width: 80rem; margin: 0 auto; padding: 0 1rem;">
                &copy; Neosphere v2.0
            </div>
        </div>
    </div>

    <script>
        const createdAt = ${created_at};
        const updatedAt = ${updated_at};
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
        document.getElementById('updated-date').textContent = formatGitDate(updatedAt, writerTimezone);

        // History Logic
        const editList = document.getElementById('edit-list');
        const banner = document.getElementById('history-banner');
        const hashDisplay = document.getElementById('viewing-hash');
        const toggleBtn = document.getElementById('toggle-view-btn');

        let currentViewedEdit = null;
        let isDiffView = true;

        function viewVersion(id) {
            const index = edits.findIndex(e => e.id === id);
            if (index === -1) return;
            const edit = edits[index];
            currentViewedEdit = { edit, index };
            isDiffView = true; // Default to diff

            renderCurrentView();

            banner.style.display = 'flex';
            hashDisplay.textContent = id.substring(0, 7);
            
            // Highlight active
            document.querySelectorAll('.git-entry').forEach(el => el.classList.remove('active'));
            document.getElementById('entry-' + id)?.classList.add('active');
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function renderCurrentView() {
            if (!currentViewedEdit) return;
            const { edit, index } = currentViewedEdit;

            toggleBtn.textContent = isDiffView ? "View File Content" : "View Diff";

            if (isDiffView) {
                try {
                    var oldText = (edit.previous_content != null) ? String(edit.previous_content) : "";
                    var newText = (index === 0) ? latestContent : ((edits[index - 1].previous_content != null) ? String(edits[index - 1].previous_content) : "");

                    if (window.Diff) {
                        var normOld = oldText.replace(/\\r\\n/g, '\\n');
                        var normNew = newText.replace(/\\r\\n/g, '\\n');
                        // Ensure both end with newline to prevent phantom last-line diffs
                        if (normOld.length > 0 && normOld[normOld.length - 1] !== '\\n') normOld += '\\n';
                        if (normNew.length > 0 && normNew[normNew.length - 1] !== '\\n') normNew += '\\n';
                        var diff = window.Diff.diffLines(normOld, normNew);
                        
                        var addedCount = 0;
                        var removedCount = 0;
                        var oldLineNum = 1;
                        var newLineNum = 1;
                        var linesHtml = '';
                        
                        diff.forEach(function(part) {
                            var val = part.value || '';
                            var lines = val.replace(/\\n$/, '').split('\\n');
                            
                            for (var li = 0; li < lines.length; li++) {
                                var escaped = escapeHtml(lines[li]);
                                if (part.added) {
                                    addedCount++;
                                    linesHtml += '<div class="diff-line added"><span class="diff-line-num">' + newLineNum + '</span><span class="diff-line-prefix">+</span><span class="diff-line-content">' + escaped + '</span></div>';
                                    newLineNum++;
                                } else if (part.removed) {
                                    removedCount++;
                                    linesHtml += '<div class="diff-line removed"><span class="diff-line-num">' + oldLineNum + '</span><span class="diff-line-prefix">-</span><span class="diff-line-content">' + escaped + '</span></div>';
                                    oldLineNum++;
                                } else {
                                    linesHtml += '<div class="diff-line context"><span class="diff-line-num">' + newLineNum + '</span><span class="diff-line-prefix"> </span><span class="diff-line-content">' + escaped + '</span></div>';
                                    oldLineNum++;
                                    newLineNum++;
                                }
                            }
                        });
                        
                        var statsHtml = '<div class="diff-stats"><span class="added-count">+' + addedCount + '</span> additions, <span class="removed-count">-' + removedCount + '</span> deletions</div>';
                        contentEl.innerHTML = '<div class="diff-container">' + statsHtml + linesHtml + '</div>';
                    } else {
                        contentEl.textContent = "Diff library not loaded. Refresh page.";
                    }
                } catch (err) {
                    console.error('Diff rendering error:', err);
                    contentEl.innerHTML = escapeHtml(edit.previous_content || "(Error rendering diff)");
                }
            } else {
                var newText2 = (index === 0) ? latestContent : ((edits[index - 1].previous_content != null) ? edits[index - 1].previous_content : "");
                contentEl.innerHTML = escapeHtml(newText2);
            }
        }

        function viewFileContent() {
            isDiffView = !isDiffView;
            renderCurrentView();
        }
        // Expose
        window.viewFileContent = viewFileContent;

        function restoreLatest() {
            contentEl.innerHTML = escapeHtml(latestContent);
            banner.style.display = 'none';
            document.querySelectorAll('.git-entry').forEach(function(el) { el.classList.remove('active'); });
            currentViewedEdit = null;
        }
        
        // Expose to window for onclick
        window.restoreLatest = restoreLatest;

        if (editList) {
            edits.forEach(function(edit) {
                var el = document.createElement('div');
                el.className = 'git-entry';
                el.id = 'entry-' + edit.id;
                
                var hash = edit.id.substring(0, 7);
                var dateStr = formatGitDate(edit.created_at, writerTimezone);
                
                var authorDisplay = edit.author_name ? escapeHtml(edit.author_name) : (edit.ip + ' (' + edit.city + ')');
                var msgDisplay = edit.commit_msg ? escapeHtml(edit.commit_msg) : 'Update';
                
                if (!edit.commit_msg && !edit.author_name) {
                     msgDisplay = 'msg from ' + authorDisplay;
                     authorDisplay = ''; 
                }

                el.innerHTML = '<div>'
                    + '<span class="commit-hash" onclick="viewVersion(' + "'" + edit.id + "'" + ')">' + hash + '</span>'
                    + '<span class="commit-author">' + authorDisplay + (authorDisplay && msgDisplay ? ': ' : ' ') + msgDisplay + '</span>'
                    + '</div>'
                    + '<span class="commit-date">Date:   ' + dateStr + '</span>';
                editList.appendChild(el);
            });
        }
        
        // Expose for onclick
        window.viewVersion = viewVersion;

        function copyContent() {
            var text;
            if (currentViewedEdit) {
                var idx = currentViewedEdit.index;
                text = (idx === 0) ? latestContent : ((edits[idx - 1].previous_content != null) ? edits[idx - 1].previous_content : '');
            } else {
                text = latestContent;
            }
            navigator.clipboard.writeText(text).then(function() {
                var btn = document.querySelector('.btn');
                var originalText = btn.innerText;
                btn.innerText = 'COPIED';
                setTimeout(function() { btn.innerText = originalText; }, 2000);
            }).catch(function(err) {
                console.error('Failed to copy: ', err);
            });
        }

        function copyViewedHash() {
            var btn = document.getElementById('viewing-hash');
            if (!btn) return;
            var hash = btn.textContent;
            if (hash === 'COPIED') return;

            navigator.clipboard.writeText(hash).then(function() {
                var originalText = hash;
                btn.textContent = 'COPIED';
                setTimeout(function() { 
                    if (btn.textContent === 'COPIED') {
                        btn.textContent = originalText; 
                    }
                }, 1500);
            });
        }
        window.copyViewedHash = copyViewedHash;
    </script>
</body>
</html>
    `;

    return new Response(html, {
        headers: { "Content-Type": "text/html" },
    });
};
