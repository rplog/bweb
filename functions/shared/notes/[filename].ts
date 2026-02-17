export const onRequestGet = async (context: any) => {
    const { params, env } = context;
    const filename = params.filename;

    const note = await env.DB.prepare(
        "SELECT * FROM notes WHERE filename = ?"
    ).bind(filename).first();

    if (!note) {
        return new Response("Note not found", { status: 404 });
    }

    const { content, created_at, city, country } = note;
    const date = new Date(created_at).toLocaleString();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename} - NeoSphere Notes</title>
    <style>
        body { background-color: #0a0a0a; color: #00ff00; font-family: 'Courier New', monospace; padding: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; border: 1px solid #333; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 255, 0, 0.1); }
        h1 { color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .meta { color: #888; font-size: 0.8em; margin-bottom: 20px; }
        .content { white-space: pre-wrap; background: #111; padding: 15px; border-radius: 4px; border: 1px solid #222; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 0.8em; }
        a { color: #00ff00; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${filename}</h1>
        <div class="meta">
            Created: ${date}<br>
            From: ${city}, ${country}
        </div>
        <div class="content">${content}</div>
        <div class="footer">
            Shared via <a href="/">NeoSphere Terminal</a>
        </div>
    </div>
</body>
</html>
    `;

    return new Response(html, {
        headers: { "Content-Type": "text/html" },
    });
};
