# Neosphere

A sophisticated personal portfolio website featuring a functional terminal interface, immersive visual effects, and serverless backend integration.

## Features

- **Terminal Interface**: Fully functional command-line environment with history, auto-completion, and file system navigation.
- **Graphical Applications**: Seamless transitions between terminal commands and full UI pages (Gallery, About, Contact).
- **Backend Integration**: Serverless functions for dynamic content handling.
- **Secure Contact Form**: Support for Telegram notifications, SMTP emails, and database storage.
- **Admin Tools**: Built-in terminal commands for managing the site (`login`, `inbox`, `alerts`).
- **Database**: Persistent storage using Cloudflare D1.
- **Performance**: Cloudflare Image Resizing and Edge Caching for fast media delivery.
- **Security**: Rate limiting on sensitive endpoints using Cloudflare KV.

## Architecture

See [docs/architecture.md](docs/architecture.md) for a detailed overview of the system design and data flow.

## Prerequisites

- Node.js (v18 or higher)
- Cloudflare Wrangler CLI (`npm install -g wrangler`)
- A Cloudflare account

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd bweb
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

This project relies on Cloudflare Pages Functions, D1 Database, KV Storage, and R2 Object Storage.

### 1. Database Setup

Create a D1 database in your Cloudflare dashboard or via CLI:
```bash
npx wrangler d1 create neosphere-db
```

Update `wrangler.toml` with your new database ID:
```toml
[[d1_databases]]
binding = "DB"
database_name = "neosphere-db"
database_id = "<your-database-id>"
```

Apply the schema to the remote database:
```bash
npx wrangler d1 execute neosphere-db --file=./schema.sql --remote
```

For local development, apply it locally:
```bash
npx wrangler d1 execute neosphere-db --file=./schema.sql --local
```

### 2. Object Storage (R2) Setup

The Gallery feature requires an R2 bucket to store images.

1. Create a bucket:
   ```bash
   npx wrangler r2 bucket create neosphere-assets
   ```

2. The binding is already configured in `wrangler.toml`:
   ```toml
   [[r2_buckets]]
   binding = "neosphere_assets"
   bucket_name = "neosphere-assets"
   ```

3. **Important**: You must upload images to this bucket for the Gallery to work. You can use the Cloudflare Dashboard or Wrangler.

### 4. KV Namespace (Rate Limiting)

Create a KV namespace to store rate limit counters:
```bash
npx wrangler kv:namespace create RATE_LIMITER
```

Update `wrangler.toml` with the ID:
```toml
[[kv_namespaces]]
binding = "RATE_LIMITER"
id = "<your-kv-id>"
```

### 3. Environment Secrets

The application requires several secrets for full functionality. Set them using the Wrangler CLI.

**System Secrets:**
```bash
# Required: Admin password for 'login' command
npx wrangler pages secret put ADMIN_PASSWORD --project-name neosphere

# Optional: JWT Secret for signing tokens (defaults to ADMIN_PASSWORD if not set)
npx wrangler pages secret put JWT_SECRET --project-name neosphere
```

**External APIs:**
```bash
# Required for 'weather' command
npx wrangler pages secret put OPENWEATHER_API_KEY --project-name neosphere

# Required for Contact Form Notifications
npx wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name neosphere
npx wrangler pages secret put TELEGRAM_CHAT_ID --project-name neosphere
```

**SMTP Email (Optional):**
```bash
npx wrangler pages secret put SMTP_HOST --project-name neosphere
npx wrangler pages secret put SMTP_PORT --project-name neosphere
npx wrangler pages secret put SMTP_USER --project-name neosphere
npx wrangler pages secret put SMTP_PASS --project-name neosphere
npx wrangler pages secret put SMTP_FROM --project-name neosphere
```

## Development

Start the local development server with Cloudflare Pages simulation:

```bash
npm run pages:dev
```

**Note**: To test R2 locally, you may need to rely on remote bindings (`npm run pages:dev -- --remote`) or mock the R2 bucket locally.

## Deployment

Deployment is handled automatically by Cloudflare Pages when pushing to the `main` branch.

To deploy manually:
```bash
npm run build
npx wrangler pages deploy dist
```

## Usage

### Terminal Commands
- `help`: List available commands
- `ls`: List directory contents
- `cat`: Read file contents
- `login`: Admin authentication
- `inbox`: Read contact messages (Admin)
- `alerts`: Configure notification settings (Admin)
- `gallery`: Launch Gallery application
