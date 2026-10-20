# StarTip — Stellar Creator Tipping & Monetization Platform

[![Stellar](https://img.shields.io/badge/Blockchain-Stellar%20Testnet-08B5E5?logo=stellar&logoColor=white)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Smart%20Contract-Soroban%20Rust-orange)](https://soroban.stellar.org)
[![Django](https://img.shields.io/badge/Backend-Django%205.1%20%7C%20DRF-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![OpenAPI](https://img.shields.io/badge/Docs-OpenAPI%203.0%20%28Swagger%2FReDoc%29-85EA2D?logo=openapi-initiative&logoColor=black)](/api/docs/)
[![Docker](https://img.shields.io/badge/Deployment-Docker%20%26%20Dokploy-2496ED?logo=docker&logoColor=white)](https://dokploy.com)

StarTip is a high-performance, non-custodial tipping and creator monetization platform powered by the **Stellar Network**. It enables creators, livestreamers, developers, and independent publishers to receive direct digital tips in **XLM** and **USDC** with instant on-chain settlement, low transaction fees, embeddable widgets, and real-time livestream alerts.

---

## 🌟 Architecture Overview

```
                                  ┌────────────────────────┐
                                  │   Supporter Browser    │
                                  │ (Widget / Tip Website) │
                                  └───────────┬────────────┘
                                              │
                    1. Create Payment Request │ 2. Get Unsigned XDR
                                              ▼
┌───────────────────────┐         ┌────────────────────────┐         ┌────────────────────────┐
│  Stellar Testnet Node │ ◄───────┤ StarTip Django Backend ├───────► │   OpenAI Moderation    │
│  (Horizon & Soroban)  │ 4.Verify│   (REST API + SSE)     │         │   & Thank-You Engine   │
└───────────┬───────────┘         └───────────┬────────────┘         └────────────────────────┘
            │                                 │
            │ 3. Sign & Submit Payment        │ 5. Real-Time Alert Event (SSE)
            ▼                                 ▼
┌───────────────────────┐         ┌────────────────────────┐
│ Creator Stellar Wallet│         │ Livestream OBS Overlay │
│  (Direct Custody)     │         │ (Browser Source Scene) │
└───────────────────────┘         └────────────────────────┘
```

---

## 1. Stellar Soroban Smart Contract (`contracts/`)

Located in [`contracts/`](file:///home/lucifer/Desktop/Startip/contracts/):
A complete, gas-optimized, tested Soroban smart contract written in Rust using `soroban-sdk`.

### Features
- **Direct Token Transfer**: Transfers native XLM or USDC tokens via Stellar Asset Contracts (`token::Client`).
- **Creator Registry**: Creators register minimum tip amounts and receiving addresses.
- **Configurable Platform Fee**: Defaults to 0 bps (100% non-custodial direct tipping), adjustable up to 1000 bps (10%).
- **On-Chain Event Emissions**: Emits typed `("tip", creator, token)` events with supporter, amount, message, and ledger timestamp.
- **On-Chain Analytics**: Tracks cumulative tips count and volume per token per creator.
- **Strict Authorization**: `require_auth()` enforced for supporters, creators, and admin.

### Contract Methods

| Function | Parameters | Description |
|---|---|---|
| `initialize` | `admin, fee_recipient, fee_bps` | One-time contract initialization |
| `register_creator` | `creator, receiving_address, min_tip_amount` | Registers creator tipping configuration |
| `set_creator_status` | `creator, active` | Pauses or resumes tipping for creator |
| `tip` | `supporter, creator, token, amount, supporter_name, message` | Routes tokens directly to creator and emits event |
| `update_fee` | `caller, new_fee_recipient, new_fee_bps` | Admin-only fee config update |
| `get_creator` | `creator -> Option<CreatorProfile>` | Reads creator configuration |
| `get_creator_stats` | `creator, token -> i128` | Reads total tipped amount for creator and token |
| `get_total_tips` | `() -> u32` | Reads global tip counter |
| `get_fee_config` | `() -> (Option<Address>, u32)` | Reads current fee configuration |

### Building and Testing

```bash
cd contracts

# Run unit tests (4/4 passed)
cargo test

# Build optimized WebAssembly (WASM) bytecode
cargo build --target wasm32-unknown-unknown --release
```

WASM artifact: `contracts/target/wasm32-unknown-unknown/release/startip_contract.wasm`

---

## 2. Django & Django REST Framework Backend (`backend/`)

### Key Capabilities

1. **Stellar Payment Engine (`payments/services.py`)**:
   - Generates unique tip references (e.g. `ST-A1B2C3D4`) adhering to Stellar's 28-byte `MEMO_TEXT` limits.
   - Builds unsigned XDR transaction envelopes for wallet signing (`stellar_sdk.TransactionBuilder`).
   - Verifies settlement on Stellar Horizon Testnet before crediting tips (checks status, recipient, asset issuer, amount, and memo).
   - Atomic database transactions with replay attack prevention.

2. **SEP-0010 Stellar Wallet Authentication (`core/auth.py`)**:
   - Cryptographic challenge-response authentication.
   - Validates Ed25519 signatures generated by Stellar wallets.
   - Issues secure bearer session tokens for creator dashboard actions.

3. **Creator Profiles & Customization (`creators/`)**:
   - Multi-asset support (XLM and Circle Testnet USDC: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`).
   - Customizable widget themes (`dark`, `light`, `midnight`, `cyber`), preset amounts, and branding.
   - Comprehensive dashboard analytics (totals per asset, daily activity, top supporters).

4. **Live Stream Alert Overlay (`alerts/`)**:
   - Real-time Server-Sent Events (SSE) stream (`/api/alerts/stream/<overlay_token>/`).
   - Dedicated OBS/Streamlabs Browser Source overlay (`/overlay/<overlay_token>/`).
   - Web Audio API chime synthesis and auto-dismissing animated popups.
   - Instant test alert trigger (`POST /api/alerts/test/`).

5. **OpenAI Message Moderation & Thank-You Generator (`ai_services/`)**:
   - Message safety analysis using OpenAI Moderation API to protect live streams from harassment.
   - Personalized thank-you note generator powered by OpenAI GPT models.
   - Automatic heuristic fallback when running in offline or test mode without an API key.

---

## 3. OpenAPI 3.0 Documentation (Swagger & ReDoc)

Interactive, developer-ready API documentation is generated via `drf-spectacular`:

- **Interactive Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc Documentation**: `http://localhost:8000/api/redoc/`
- **OpenAPI Schema (JSON)**: `http://localhost:8000/api/schema/`
- **Developer Test Console**: `http://localhost:8000/demo/`
- **Health & Diagnostics**: `http://localhost:8000/api/health/`

---

## 4. Live Deployment with Dokploy (https://dokploy.com)

Dokploy is an open-source, Docker and Traefik-powered self-hosted PaaS. StarTip is engineered for zero-friction live deployment on Dokploy.

### Deployment Option A: Dokploy Application (Single Dockerfile)

1. Open your **Dokploy Dashboard**.
2. Click **Create Project** -> **Create Application**.
3. Configure the source:
   - **Source Type**: GitHub / Git Repository.
   - **Repository URL**: `https://github.com/<your-username>/Startip.git`
   - **Branch**: `main`
   - **Build Type**: `Dockerfile` (uses root [`Dockerfile`](file:///home/lucifer/Desktop/Startip/Dockerfile)).
4. Under **Environment Variables**, set:
   ```env
   DJANGO_DEBUG=False
   DJANGO_SECRET_KEY=generate-a-secure-64-character-key
   DJANGO_ALLOWED_HOSTS=*
   STELLAR_NETWORK=TESTNET
   STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   STELLAR_USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
   SEED_DEMO_DATA=true
   OPENAI_API_KEY=sk-... (optional)
   ```
5. Under **Domains**, add your live domain (e.g. `api.yourdomain.com`), set port to `8000`, and toggle **Enable HTTPS / SSL (Let's Encrypt)**.
6. Click **Deploy**. Dokploy automatically builds the image, starts Gunicorn, runs migrations, collects static assets, and attaches Traefik SSL!

---

### Deployment Option B: Dokploy Compose (Full Stack with PostgreSQL & Redis)

1. In Dokploy, click **Create Compose**.
2. Paste the contents of [`docker-compose.yml`](file:///home/lucifer/Desktop/Startip/docker-compose.yml).
3. Set your custom domain in the `.env` tab:
   ```env
   DOMAIN=startip.yourdomain.com
   DJANGO_SECRET_KEY=production-secure-key
   POSTGRES_PASSWORD=strong-db-password
   ```
4. Click **Deploy**. Dokploy provisions PostgreSQL 16, Redis 7, and the StarTip Django backend with automatic Traefik routing.

---

## 5. Local Development Quickstart

### Prerequisites
- Python 3.12+
- Rust & Cargo (for Soroban smart contract)
- Docker & Docker Compose

### Running Locally with Python Virtualenv

```bash
# 1. Setup Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Run Database Migrations
python manage.py migrate

# 3. Seed Demo Data
python manage.py seed_demo_data

# 4. Run Automated Test Suite (9/9 passed)
python manage.py test core

# 5. Start Development Server
python manage.py runserver 0.0.0.0:8000
```

Open `http://localhost:8000/demo/` to view the live interactive preview!

### Running Locally with Docker

```bash
# Build and run with Docker Compose
docker compose up --build -d

# Check health
curl http://localhost:8000/api/health/
```

---

## 6. Embeddable Widget Integration

### Method 1: iframe Embed
```html
<iframe
  src="https://your-domain.com/embed/alex_dev/"
  width="380"
  height="540"
  frameborder="0"
  style="border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);"
  title="Tip Alex River">
</iframe>
```

### Method 2: JavaScript Snippet
```html
<div id="startip-widget"></div>
<script
  src="https://your-domain.com/static/widget.js"
  data-creator="alex_dev"
  data-target="startip-widget">
</script>
```

---

## 7. Automated Test Suite Results

All unit tests across the Smart Contract and Backend pass with zero warnings:

- **Soroban Smart Contract**: `cargo test` -> **4 passed; 0 failed**
- **Django REST Backend**: `python manage.py test core` -> **9 passed; 0 failed**
- **Docker Build**: Validated with production entrypoint and healthcheck.
