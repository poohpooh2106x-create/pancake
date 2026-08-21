# 🥞 Pancake Customer Data Extraction & Management Application

A production-ready integration system that captures inbound customer conversations and orders from **Pancake (Pancake Chat / Pancake POS)**, automatically extracts deep customer profiles (Thai mobile & landline numbers, Facebook PSID, LINE OA, Admin tags, order history), and synchronizes structured data to **PostgreSQL/SQLite** and **Google Sheets**.

---

## 🏛️ System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Pancake Ecosystem
        PC[Pancake Chat / Pancake POS]
        FB[Facebook Page]
        LN[LINE Official Account]
        IG[Instagram DM]
        FB --> PC
        LN --> PC
        IG --> PC
    end

    subgraph Ingestion & Security
        WH[POST /api/webhooks/pancake]
        HMAC[HMAC SHA-256 Auth Middleware]
        ACK[Immediate HTTP 200 ACK]
        PC -- Webhook Event --> HMAC --> WH --> ACK
    end

    subgraph Async Processing Engine
        Q[Async Event Dispatcher]
        Parser[Pancake Parser Service]
        RegexEngine[Thai Phone Extraction & Normalization]
        Carrier[Carrier Detection: AIS / TRUE-DTAC / NT]
        
        WH -. Background Task .-> Q
        Q --> Parser --> RegexEngine --> Carrier
    end

    subgraph Persistence & Deduplication
        DB[(PostgreSQL / SQLite via Prisma)]
        Upsert[Customer & Phone Upsert Logic]
        Audit[Webhook Audit & Message Logs]
        
        Carrier --> Upsert --> DB
        Q --> Audit --> DB
    end

    subgraph External Sync & Fallback
        Sheets[Google Sheets API v4]
        Poller[Scheduled Fallback Polling Engine]
        OpenAPI[Pancake Open REST API]
        
        Upsert -- Real-time Sync --> Sheets
        Poller -- Periodic Backup Sync --> OpenAPI --> Parser
    end
```

---

## 🚀 Key Features

1. **⚡ Lightning-Fast Immediate ACK Webhook**: Returns `200 OK` in `< 30ms` to prevent Pancake timeout retries while dispatching background workers.
2. **📱 Advanced Thai Phone Number Extraction Engine**:
   - Handles standard formats: `081-234-5678`, `081 234 5678`, `0812345678`.
   - Handles international prefixes: `+66812345678`, `+66 81 234 5678`, `66812345678`.
   - Handles spaced digits: `0 8 1 2 3 4 5 6 7 8`.
   - Handles Thai numerals: `๐๘๑-๒๓๔-๕๖๗๘` $\rightarrow$ `0812345678`.
   - Handles Landlines: `02-xxx-xxxx`, `053-xxx-xxx`.
   - Normalizes to both local (`0812345678`) and E.164 (`+66812345678`).
   - Identifies telecom carriers: **AIS**, **TRUE/DTAC**, **NT**.
   - Filters false positives (Bank accounts, promptpay IDs, tracking numbers).
3. **🔄 Real-time Google Sheets Synchronization**: Automatically appends or updates customer rows using Google Sheets API (v4) with Service Account authentication.
4. **🛡️ Enterprise Security & Observability**:
   - HMAC-SHA256 signature verification & token validation.
   - Audit trail of all webhook payloads in `WebhookEventLog`.
   - Pino structured logging.
5. **⏰ Fallback Polling Engine**: Built-in scheduled cron poller that fetches historical conversations via Pancake Open API (`pages.fm/api/v1`) to catch any dropped webhooks.

---

## 📂 Project Structure

```
C:\pancake\
├── prisma/
│   └── schema.prisma          # Database models (Customer, Phone, Message, Order, WebhookLog)
├── src/
│   ├── app.ts                 # Express application setup
│   ├── server.ts              # Server bootstrap and graceful shutdown
│   ├── config/
│   │   └── env.ts             # Zod environment variable validation
│   ├── controllers/
│   │   └── webhook.controller.ts # Webhook ACK and background queue
│   ├── db/
│   │   └── prisma.ts          # Shared Prisma client
│   ├── middleware/
│   │   ├── auth.middleware.ts # HMAC signature verification
│   │   ├── error.middleware.ts# Global error handler
│   │   └── logger.middleware.ts # Structured HTTP request logger
│   ├── routes/
│   │   ├── customer.routes.ts # Customer CRM & querying endpoints
│   │   ├── health.routes.ts   # Health & DB check endpoint
│   │   └── webhook.routes.ts  # Webhook route definition
│   ├── scripts/
│   │   └── sync-historical.ts # CLI backfill script for Pancake API
│   ├── services/
│   │   ├── customer.service.ts      # Customer deduplication & upsert
│   │   ├── google-sheets.service.ts # Google Sheets API sync
│   │   ├── pancake-api.service.ts   # Pancake Open REST API client
│   │   ├── pancake-parser.service.ts# Payload normalization service
│   │   └── sync-scheduler.service.ts# Scheduled fallback cron worker
│   ├── types/
│   │   ├── customer.types.ts  # Internal data models
│   │   └── pancake.types.ts   # Pancake payload type definitions
│   └── utils/
│       ├── crypto.util.ts     # HMAC & hashing utilities
│       ├── logger.ts          # Pino logger instance
│       └── phone-extractor.util.ts # Thai phone extraction engine
├── tests/
│   ├── phone-extractor.test.ts # Unit tests for phone parsing
│   └── webhook.test.ts        # Integration tests for Webhook endpoint
├── .env.example               # Environment variables template
├── package.json
└── tsconfig.json
```

---

## 🛠️ Quick Start & Local Setup

### 1. Install Dependencies
```bash
cd C:\pancake
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Initialize Database
Initialize the local SQLite database schema:
```bash
npx prisma db push
```

*(To use PostgreSQL in production, simply change `DATABASE_URL` in `.env` to `postgresql://user:pass@host:5432/pancake_db` and provider to `postgresql` in `prisma/schema.prisma`)*.

### 4. Run Unit Tests
```bash
npm test
```

### 5. Start Development Server
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

---

## 🌐 Pancake Webhook Configuration & Local Testing

### Step 1: Expose Localhost with ngrok
```bash
ngrok http 3000
```
Copy the generated public URL (e.g., `https://xxxx-xx-xx.ngrok-free.app`).

### Step 2: Configure in Pancake Chat / Pancake POS
1. Log in to [Pancake POS / Chat Dashboard](https://pages.fm).
2. Go to **Settings (ตั้งค่า)** $\rightarrow$ **Webhooks / API**.
3. Set **Webhook URL** to:
   ```
   https://xxxx-xx-xx.ngrok-free.app/api/webhooks/pancake
   ```
4. Set your **Secret Key** (e.g. `my_secure_pancake_token`) and copy it into `.env` as `PANCAKE_WEBHOOK_SECRET`.
5. Enable events:
   - `new_message`
   - `customer_updated`
   - `order_created`
6. Send a test message or customer update from Pancake.

---

## 📊 Google Sheets Sync Setup

1. Create a Google Cloud Project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Google Sheets API**.
3. Create a **Service Account** and download its JSON Key.
4. Create a Google Spreadsheet and share edit permissions with the Service Account email (`xxx@xxx.iam.gserviceaccount.com`).
5. Update your `.env`:
   ```env
   GOOGLE_SHEETS_ENABLED=true
   GOOGLE_SHEETS_SPREADSHEET_ID="your_spreadsheet_id_from_url"
   GOOGLE_SHEETS_SHEET_NAME="Pancake Customers"
   GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
   ```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service uptime and database connectivity check |
| `POST` | `/api/webhooks/pancake` | Inbound Pancake Webhook endpoint (immediate ACK) |
| `GET` | `/api/customers` | List customers with search, pagination, and filters |
| `GET` | `/api/customers/stats` | Summary CRM metrics (total customers, phones, channels) |
| `GET` | `/api/customers/:id` | Detailed customer profile with phone list and messages |
| `POST` | `/api/customers/sync/sheets` | Manual trigger to sync all customers to Google Sheets |
| `POST` | `/api/customers/sync/pancake/:pageId` | Manual historical conversation pull from Pancake API |

---

## 🚢 Production Deployment

### 1. Build TypeScript Code
```bash
npm run build
```

### 2. Run with PM2
```bash
npm install -g pm2
pm2 start dist/server.js --name "pancake-service" -i max
pm2 save
```

### 3. Docker Deployment
A lightweight Dockerfile:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3000
CMD ["node", "dist/server.js"]
```
