# 📊 Expense Tracker - Advanced React Application

A modern, high-performance, and deeply optimized **Expense Tracker** application built with React and Vite. The platform features robust state management, real-time Firebase syncing, business point-of-sale integration, advanced data visualization, and an extremely responsive, premium UI.

## 🚀 Key Architectural Features
This project has undergone a complete structural refactoring and architectural upgrade:
- **Clean Architecture**: Deeply modularized directory structure following React enterprise best practices (`src/hooks`, `src/pages`, `src/components/ui`).
- **Custom Hooks (DRY)**: Extensive logic, side effects, and state manipulation have been stripped from the main entry points and encapsulated into focused, reusable custom hooks (`useTransactions`, `useCategories`, `usePOSSync`, `useLentMoney`, `useAuth`).
- **Extreme Performance Optimization**: 
  - Implementation of `React.lazy()` and `Suspense` for aggressive route-level code splitting. Tab components are lazily loaded on demand.
  - Aggressive use of `useMemo()` to prevent recalculation of derived state objects (e.g. Chart data formatting, total balance reductions).
  - Implementation of `useCallback()` to prevent recreation of expensive context handler functions, mitigating unnecessary re-renders in deep component trees.

## 📁 Scalable Folder Structure
```text
expense-tracker/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images and global styling assets
│   ├── components/
│   │   ├── ui/             # Reusable, generic UI components
│   │   └── Login.jsx       # Authentication UI
│   ├── hooks/              # Extracted Business Logic Layer
│   │   ├── useAuth.js
│   │   ├── useCategories.js
│   │   ├── useLentMoney.js
│   │   ├── usePOSSync.js
│   │   └── useTransactions.js
│   ├── pages/              # Lazy-loaded Application Views (Tabs)
│   │   ├── DashboardTab.jsx
│   │   ├── AddExpenseTab.jsx
│   │   ├── IncomeTab.jsx
│   │   ├── HistoryTab.jsx
│   │   ├── CategoriesTab.jsx
│   │   └── MoneyLentTab.jsx
│   ├── utils/              # Utility & Helper functions
│   │   ├── formatters.js
│   │   ├── icons.js
│   │   ├── posSync.js
│   │   └── sounds.js
│   ├── App.jsx             # Main Application Root & Router
│   ├── firebase.js         # Firebase Configuration
│   ├── main.jsx            # React Entry Point
│   └── index.css           # Global Tailwind CSS Styles
```

## 🛠 Tech Stack
- **Frontend Framework**: React 18
- **Build Tool**: Vite (Lightning fast HMR & optimized production builds)
- **Styling**: Tailwind CSS (Utility-first CSS)
- **Database/Backend**: Firebase Firestore & Firebase Auth
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Charts**: Recharts (Custom built visualizations)

## 💻 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expense-tracker
   ```

2. **Install Dependencies**
   Ensure you have Node.js installed, then run:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the Development Server**
   Start the blazing-fast Vite dev server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## 🤝 Contributing
Maintain the strict architectural boundaries. Ensure any new data fetching or heavy business logic is implemented via custom hooks in the `src/hooks/` directory, and any new views are lazy-loaded within `App.jsx`.
