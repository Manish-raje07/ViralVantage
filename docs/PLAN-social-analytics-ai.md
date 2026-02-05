# 🚀 PLAN: Social Media Analytics AI Dashboard

> **Hackathon Problem Statement 3:** Social Media Analysis Dashboard — Data-Driven Content Strategy Optimizer

---

## 📋 Overview

### Problem Statement Summary
Creators and businesses struggle to analyze performance across multiple social media platforms. They manually track metrics and make decisions based on assumptions instead of data.

### Our Solution
A **unified, AI-powered analytics platform** that:
- Consolidates social media data from multiple platforms into one interface
- Visualizes performance metrics with interactive charts
- Provides **AI-powered natural language query** system
- Generates **automated strategic recommendations**
- Enables **data export** for planning and decision-making

### Project Type
**WEB** - Next.js 15 full-stack application with MongoDB backend

---

## 🎯 Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| **Innovation** | AI query accuracy + unique features | Natural language → actionable insights |
| **UI/UX** | Visual polish, responsiveness | Premium glassmorphic design, <3s load |
| **Impact** | Problem-solution fit | Solves all 4 challenges from PS |
| **Feasibility** | Working demo | All 5 deliverables functional |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │Dashboard │ │Comparison│ │ AI Chat  │ │ Insights │ │Reports ││
│  │  View    │ │  View    │ │Interface │ │  Panel   │ │ Export ││
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘│
└───────┼────────────┼────────────┼────────────┼───────────┼─────┘
        │            │            │            │           │
        ▼            ▼            ▼            ▼           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API ROUTES (Next.js)                        │
│  /api/analytics  /api/compare  /api/ai-query  /api/insights     │
│  /api/social/instagram  /api/social/twitter  /api/reports       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   MongoDB     │  │  Gemini AI    │  │ Social APIs   │
│  (Metrics DB) │  │  (NL Query)   │  │ (Meta/Twitter)│
└───────────────┘  └───────────────┘  └───────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 15.3.3 (App Router) | Already in codebase, SSR + API routes |
| **Frontend** | React 19 + TypeScript | Type safety, modern hooks |
| **Styling** | Tailwind CSS 4 | Already configured, rapid UI |
| **State** | Zustand + TanStack Query | Already installed, efficient caching |
| **Database** | MongoDB Atlas | User-provided, flexible schema |
| **AI** | Google Gemini API | User preference, natural language |
| **Charts** | Chart.js + react-chartjs-2 | Already installed |
| **Social APIs** | Meta Graph API, Twitter API v2 | Real data integration |
| **Export** | jsPDF + csv-stringify | PDF/CSV generation |

---

## 📁 New Files to Create

```
src/
├── app/api/                    # API Routes
│   ├── analytics/route.ts
│   ├── compare/route.ts
│   ├── ai-query/route.ts
│   ├── insights/route.ts
│   ├── reports/route.ts
│   └── social/
│       ├── instagram/route.ts
│       └── twitter/route.ts
├── components/sections/
│   ├── AIQuerySection.tsx      # NEW
│   ├── CompareSection.tsx      # NEW
│   ├── InsightsSection.tsx     # NEW
│   └── ReportsSection.tsx      # NEW
├── components/ui/
│   ├── ai-chat.tsx             # NEW
│   ├── comparison-chart.tsx    # NEW
│   └── insight-card.tsx        # NEW
├── lib/
│   ├── mongodb.ts              # NEW
│   ├── gemini.ts               # NEW
│   └── social/
│       ├── instagram.ts        # NEW
│       └── twitter.ts          # NEW
└── types/index.ts              # NEW
```

---

## 📊 MongoDB Collections

1. **posts** - Social media posts with metrics (likes, comments, shares, reach)
2. **analytics** - Aggregated daily analytics snapshots
3. **insights** - AI-generated insights cache
4. **queries** - AI query history

---

## 📋 Task Breakdown

### Phase 2: Backend (Priority P0-P1)
| Task | Description | Agent |
|------|-------------|-------|
| 2.1 | MongoDB connection setup | backend-specialist |
| 2.2 | Instagram/Twitter API integration | backend-specialist |
| 2.3 | Gemini AI service | backend-specialist |
| 2.4 | All API routes | backend-specialist |

### Phase 3: Core Features (Priority P1-P2)
| Task | Description | Agent |
|------|-------------|-------|
| 3.1 | Unified Performance Dashboard | frontend-specialist |
| 3.2 | Cross-Format Comparison | frontend-specialist |
| 3.3 | AI Natural Language Query | frontend + backend |
| 3.4 | Automated Insights Panel | frontend-specialist |
| 3.5 | Exportable Reports (PDF/CSV) | frontend-specialist |

### Phase 4: UI/UX (Priority P2)
| Task | Description | Agent |
|------|-------------|-------|
| 4.1 | Premium design polish | frontend-specialist |
| 4.2 | Interactive chart enhancements | frontend-specialist |
| 4.3 | Mobile responsiveness | frontend-specialist |

### Phase 5: Verification (Priority P3)
| Task | Description | Agent |
|------|-------------|-------|
| 5.1 | Integration testing | backend-specialist |
| 5.2 | Performance optimization | frontend-specialist |

---

## 🗺️ PS Requirements → Codebase Mapping

| Requirement | Existing | Action |
|-------------|----------|--------|
| Unified dashboard | `OverviewSection.tsx` | Enhance with real data |
| Cross-format comparison | None | **NEW** `CompareSection.tsx` |
| AI query interface | None | **NEW** `AIQuerySection.tsx` |
| Automated insights | Anomaly card | Enhance + expand |
| Exportable reports | JSON/CSV export | Add PDF, enhance |

---

## ⚡ Environment Setup

```env
# .env.local
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=AIzaSy...
META_ACCESS_TOKEN=     # User to obtain
TWITTER_BEARER_TOKEN=  # User to obtain
```

---

## ✅ Phase X: Verification

| Check | Command/Action |
|-------|----------------|
| Lint | `npm run lint` |
| Build | `npm run build` |
| MongoDB | API returns data |
| AI Query | "Best post?" works |
| Export | PDF/CSV download |
| Mobile | 320px responsive |

---

## 🏆 Winning Edge

1. **AI Chat** - Conversational analytics (high innovation)
2. **Smart Recommendations** - Proactive suggestions
3. **Viral Analysis** - Pattern detection
4. **Predictive Timing** - ML-based best posting time

---

> **Status:** Ready for implementation  
> **Created:** February 5, 2026
