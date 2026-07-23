# AI Travel Planner: Multi-Agent Itinerary & Travel Planner

A full-stack, AI-powered travel assistant that creates detailed, day-by-day travel itineraries. The system integrates natural language processing via LLMs, fetches real-time flight options via Duffel, retrieves/generates hotel recommendations based on MongoDB fixtures, and streams progress updates using Server-Sent Events (SSE).

---

## ⚡ Key Architectural Features

* **Multi-Agent Orchestration:** Coordinates different sub-tasks (itinerary drafting, flight search, hotel verification, and synthesis) into a coherent workflow.
* **Server-Sent Events (SSE) Streaming:** Pipes real-time generation states (e.g. `PLANNING_ITINERARY`, `SOURCING_TRAVEL_DATA`, `COMPLETE`) and raw content tokens directly to the client.
* **Dynamic Location Metadata & Constraints:** Enforces regional geographical rules and transit constraints loaded dynamically from MongoDB (e.g. West Coast sunset rules, local transport guidelines, airport distances).
* **Duffel Flight API Integration:** Sources real-time flight offers for domestic and international sectors, converting prices to INR and selecting preferred cabin classes. Falls back to a simulated provider if no API key is present.
* **JIT Hotel Fixture Generation:** Seeds destination-specific fictional hotels dynamically using LLM completions, avoiding scrapping of live hotel data.

---

## 📂 Repository Structure

```text
ai-travel-planner/
│
├── backend/            # Express Server & Agent Orchestration
│   ├── src/
│   │   ├── agent/      # Itinerary generation agent (Groq SDK)
│   │   ├── models/     # Mongoose Schemas (User, LocationMetadata, HotelModel, RefreshToken)
│   │   ├── routes/     # Auth and Agent API endpoints
│   │   ├── services/   # Flight search (Duffel), Hotel search, and Itinerary synthesis
│   │   ├── scripts/    # Database seeding scripts for location metadata & hotels
│   │   └── utils/      # SSE and LLM helpers
│   ├── tests/          # Integration & evaluation test suite
│   ├── .env.example    # Backend environment template
│   └── package.json
│
└── frontend/           # React Web Application
    ├── src/
    │   ├── components/ # AgenticDashboard UI & state aggregation
    │   ├── services/   # MainServices wrapper handling ReadableStream decoding
    │   └── AppConfig.js# Frontend base URL configuration
    └── package.json
```

---

## 🚀 Getting Started

Follow the steps below to setup and run the application on your local machine.

### Prerequisites
* **Node.js** (v20.0.0 or higher recommended)
* **npm** (comes with Node.js)
* **MongoDB** (Local instance or MongoDB Atlas cluster)

---

### 1. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file by copying the template:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and populate it with your credentials:
   
   ```env
   PORT=3007
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/travel-planner
   JWT_SECRET=your_long_random_secret_here
   JWT_EXPIRES_IN=15m
   REFRESH_TOKEN_EXPIRES_IN=7d
   NODE_ENV=development
   
   # Agent Configuration (Groq API is required for itinerary generation)
   AGENT_PROVIDER=groq
   GROQ_API_KEY=gsk_your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   
   # Flight Search API (Duffel - Optional, falls back to mock data if omitted or invalid)
   DUFFEL_KEY=duffel_test_your_token_here
   USD_TO_INR_RATE=85
   ```

4. **Seed the Database:**
   The backend relies on seeded database documents for destination rules and hotel listings. Run the following scripts:
   
   * **Seed Location Metadata:** Seeds regional rules, airports, and transport limits.
     ```bash
     npm run seed
     ```
   * **Seed Hotel Listings:** Uses the LLM to generate 6 realistic (but fictional) hotels for each major destination. *(Requires `GROQ_API_KEY` to be set in `.env`)*
     ```bash
     npm run seed-hotels
     ```

5. **Start the Backend Server:**
   * **For Development (with auto-reload):**
     ```bash
     npm run dev
     ```
   * **For Production:**
     ```bash
     npm run start
     ```
   The backend will start running at `http://localhost:3007` (or the port defined in `.env`).

---

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure the API Endpoint:**
   Open the file [frontend/src/AppConfig.js](file:///Users/vpatil/Desktop/Workspace/ai-travel-planner/frontend/src/AppConfig.js) and ensure that `baseUrl` points to your running backend port (default: `http://localhost:3007`):
   ```javascript
   const AppConfig = {
       "baseUrl": "http://localhost:3007",
       "AppVersion": "1.06 (dev)"
   }
   module.exports = AppConfig
   ```

4. **Run the React App:**
   ```bash
   npm start
   ```
   This compiles the React app and opens it in your default browser at `http://localhost:3000`.

---

## 🧪 Verification & Testing

To verify the backend logic and travel itinerary evaluations, run the test suite:

1. Ensure the backend dependencies are installed and `.env` is configured.
2. In the `backend` directory, run:
   ```bash
   npm run test:evals
   ```
   This will execute the Jest integration and evaluation tests defined in `tests/evals/travel-evals.test.js`.