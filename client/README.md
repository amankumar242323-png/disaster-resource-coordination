# Disaster Resource Coordination (DRC) — Frontend (React.js)

The interactive, high-resilience frontend for the Disaster Resource Coordination platform, built with **React.js + Vite** and engineered specifically for disaster and low-connectivity environments.

---

## Key Features

1. **Role-Based Command Centers (6 Personas)**:
   - **👑 Disaster Administrator**: Super admin console, active disaster declarations, IMD weather feed status, circuit breaker simulator, and correlation-ID distributed tracing logs.
   - **📋 Manager / Coordinator**: Aggregated cross-shelter inventory matrix, inter-shelter resource transfer approvals with idempotency protection, and single-roundtrip GraphQL composite query inspector.
   - **📡 Field Officer**: Mobile-optimized field intelligence tool with GPS tagging, hazard severity rating, and auto-queuing outbox.
   - **🤝 Volunteer**: Onsite check-in, shift action checklist, and large-touch real-time handout tally counter (+1 food, water, blankets).
   - **🎁 Donor / Supplier**: Live critical shortages wishlist across shelters, supply pledge workflow, and direct monetary relief donation with simulated **Razorpay** checkout and 80G tax receipt generator.
   - **🆘 Affected People / Public**: Citizen emergency portal with instant Emergency SOS broadcast beacon, live shelter occupancy and acceptance tracker, and direct hotlines.

2. **User Authentication & Role Registration (JWT Simulation)**:
   - **Interactive Auth Modal**: Toggle smoothly between **Sign In** and **Create Account**.
   - **One-Click Instant Demo Profiles**: Switch between pre-configured officials (👑 NDMA Administrator, 📋 Regional Coordinator, 📡 Rapid Rescue Field Officer, 🤝 Volunteer Worker, 🎁 Philanthropic Donor, 🆘 Public Citizen) in one tap.
   - **Account Registration**: Register with legal name, email, password, assigned role, organization/agency (NDRF, Red Cross, Civic Corps), and phone number with simulated JWT generation.
   - **Session Persistence**: User profile and token persist in `localStorage` across page reloads.

3. **Network Resilience & Bad-Network Simulator**:
   - **Normal (Fast)**: 200ms latency.
   - **3G / Spotty**: 1800ms latency with 10% simulated packet loss, throttling, and auto-retry backoff.
   - **Offline Mode**: Disconnects central servers and redirects mutations into a resilient client-side **Outbox** with unique **Idempotency Keys** (`req_...`, `rep_...`).
   - **Auto-Sync Engine**: When connectivity is restored, the Outbox automatically synchronizes and updates the central state.

3. **Geospatial Radar & Shelter Map**:
   - Offline-first vector radar map of flood/cyclone hazard perimeters, river basins, coastline surge zones, and shelter status markers (Accepting, Near Capacity, Full).

4. **Tri-Theme Adaptive Design**:
   - **Dark Mode** (Default sleek command center palette)
   - **Light Mode** (Daytime office coordinator view)
   - **Emergency High-Contrast Mode** (High-visibility for field officers in bright outdoor sunlight or battery-saving conditions)

---

## Getting Started

### 1. Install Dependencies

In the `client/` directory:

```bash
cd client
npm install
```

### 2. Start Local Development Server

```bash
npm run dev
```

The application will be available at: **`http://localhost:5173`**

### 3. Build for Production

```bash
npm run build
```

---

## Architecture Alignment with Project Brief

- **Idempotent POSTs**: All resource transfer requests, citizen SOS distress calls, and field situation reports generate and store client-side UUID-based Idempotency Keys.
- **Circuit Breaker Integration**: Admin view includes a live circuit breaker toggle (CLOSED, OPEN, HALF_OPEN) for the external government weather SOAP feed.
- **REST + GraphQL Side-by-Side**: Coordinator dashboard demonstrates the performance advantage of single-roundtrip GraphQL composite queries vs multi-hop REST calls on slow networks.
- **Zero Heavy External Icon Bloat**: Pure inline SVG vector icons ensure zero network delay on initial render.