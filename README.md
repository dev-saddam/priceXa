# PriceXa - Multi-Tenant Competitor Price & Stock Monitoring Intelligence Platform

Inspired by modern price intelligence platforms like [Pricefy.io](https://pricefy.io), **PriceXa** is a high-performance Next.js application designed to track competitor pricing, stock availability, and margin opportunities across e-commerce domains.

---

## 🌟 Core Features

### 1. Multi-Tenant Brand Workspaces
- **Isolated Brand Data**: Each brand/store registers its own workspace with custom currency (`$`, `€`, `£`, `₹`), SKU catalog, competitor list, and alert rules.
- **Brand Switcher**: Easily switch between registered brand profiles (e.g., *Apex Athletics*, *Aura Soundworks*, *Lumina Skin Labs*).
- **New Brand Onboarding**: Multi-step brand registration with industry specification and subscription tier selection.

### 2. Product Catalog & Bulk CSV Import
- **Comprehensive Fields**: Track `name`, `brand`, `code` (SKU/barcode), `category`, `mrp` (catalog price), `currentPrice`, `costPrice`, `stockStatus`, and `productUrl`.
- **Bulk CSV Uploader**: Drag & drop or browse `.csv` files. Includes auto-detection of column headers and row previewing.
- **Downloadable Template**: One-click sample CSV generation for quick formatting.
- **Inline Price Editor**: Adjust your selling prices directly within the catalog table.
- **Export Catalog**: Export current active catalog data to CSV at any time.

### 3. Competitor Store Discovery & Title Auto-Matcher
- **Store Directory**: Register competitor stores (Amazon, Walmart, Target, Dick's Sporting Goods, Best Buy, or custom domains).
- **Title-Based Auto-Matching**: Queries competitor stores using the product's title and keywords. Automatically calculates match confidence (e.g., 98%), extracts competitor price and stock status.
- **Manual URL Linking**: Link specific competitor product URLs with custom overrides.
- **Verification Workflow**: Confirm or reject matches to ensure high catalog integrity.

### 4. Twice-a-Day Scheduled Monitoring & Crawler Engine
- **Configured Dual Slots**: Runs automated scans twice every 24 hours (08:00 AM & 08:00 PM local time).
- **Instant Scan Trigger**: On-demand crawler execution with simulated rotating residential proxy pool and headless DOM parsing.
- **Detailed Execution Logs**: Review terminal traces for each crawl batch, showing proxy routing, price deltas, and stock transitions.

### 5. Smart Alert Rules & In-App Notification Center
- **Condition Builder**:
  - *Competitor Under-Cut Alert* (when competitor is cheaper by > X%).
  - *Price Below MRP Warning* (MAP/MSRP compliance protection).
  - *Sudden Price Drop* (when price drops by > $X).
  - *Competitor Out of Stock* (arbitrage opportunity to raise prices or increase margin).
  - *Stock Restocked Notification*.
- **Quick Repricing Actions**: 1-click "Match Price" button in alert feeds that immediately aligns your selling price with the competitor.

### 6. Super Admin Dashboard (SaaS Platform Management)
- **Financial Metrics**: Real-time Monthly Recurring Revenue (MRR), Annual Run Rate (ARR), total active brands, and monitored SKUs.
- **Brand Tenants Directory**: Oversee all brands, change their subscription tiers (Starter, Growth, Enterprise), update billing statuses, and impersonate/view tenant accounts.
- **Subscription Plan Editor**: Manage monthly/yearly prices, SKU limits, competitor quotas, and crawling frequencies.
- **Crawler Proxy Health**: Monitor residential proxy pool health (99.8%), anti-bot bypass rate (99.1%), and average scrape latency.

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+` or `v20+`
- npm `v10+`

### Installation & Run
```bash
# Clone or navigate to the directory
cd /d/PriceXa

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001` if port 3000 is occupied).

### Production Build
```bash
npm run build
npm run start
```

---

## 🛠️ Technology Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 & custom glassmorphism design tokens
- **Icons**: Lucide React
- **State & Storage**: React Context with LocalStorage persistence
