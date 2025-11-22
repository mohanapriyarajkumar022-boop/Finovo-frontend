// src/App.jsx - FIXED VERSION WITH PROPER ROUTING
import React, { useState, useEffect, lazy, Suspense, useCallback, useMemo } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";

// Core components
import AuthPage from "./pages/AuthPage.jsx";
import Sidebar from "./Sidebar.jsx";
import AppWrapper from "./Components/AppWrapper";
import { SettingsProvider } from "./context/SettingsContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { TwoFactorProvider } from "./context/TwoFactorContext";

import "./App.css";

// Performance Optimizations
const LAZY_LOADING_RETRY_DELAY = 1000;
const MAX_RETRY_ATTEMPTS = 2;

// Enhanced Lazy Loading
const lazyWithRetry = (componentImport, retries = MAX_RETRY_ATTEMPTS) => {
  return lazy(async () => {
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const component = await componentImport();
        return component;
      } catch (error) {
        lastError = error;
        console.warn(`Lazy loading attempt ${attempt + 1} failed:`, error);
        
        if (attempt < retries) {
          const delay = LAZY_LOADING_RETRY_DELAY * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    
    throw lastError;
  });
};

// Lazy components
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard.jsx"));
const Expenditure = lazyWithRetry(() => import("./pages/Expenditure.jsx"));
const Settings = lazyWithRetry(() => import("./pages/Settings.jsx"));
const Income = lazyWithRetry(() => import("./pages/Incomepage.jsx"));
const MonthPage = lazyWithRetry(() => import("./pages/MonthPage.jsx"));
const SmartBorrowForm = lazyWithRetry(() => import("./pages/SmartBorrowForm.jsx"));
const TaxPage = lazyWithRetry(() => import("./pages/TaxPage.jsx"));
const Investment = lazyWithRetry(() => import("./pages/Investment.jsx"));
const ProfitLossPage = lazyWithRetry(() => import("./pages/ProfitLossPage.jsx"));
const ProjectModule = lazyWithRetry(() => import("./pages/ProjectModule.jsx"));
const AssetManagement = lazyWithRetry(() => import("./pages/AssetManagement.jsx"));
const AddAssetForm = lazyWithRetry(() => import("./Components/assets/AddAssetForm.jsx"));
const AssetDetails = lazyWithRetry(() => import("./Components/assets/AssetDetails.jsx"));

// Enhanced Loading Component
const EnhancedLoader = ({ message = "Loading...", progress = null, size = "medium" }) => {
  const { theme } = useTheme();
  
  const sizes = {
    small: "h-8 w-8",
    medium: "h-16 w-16",
    large: "h-24 w-24"
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="text-center">
        <div className="relative inline-block mb-4">
          <div 
            className={`rounded-full border-t-4 border-b-4 animate-spin ${
              sizes[size]
            } ${
              theme === 'dark' 
                ? 'border-white border-opacity-30' 
                : 'border-gray-600'
            }`}
          ></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className={`h-2 w-2 rounded-full animate-ping ${
              theme === 'dark' ? 'bg-white' : 'bg-gray-600'
            }`}></div>
          </div>
        </div>
        <div className="max-w-md">
          <p className={`font-medium text-lg mb-1 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>{message}</p>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>Please wait while we load the content...</p>
          {progress !== null && (
            <div className={`w-48 rounded-full h-2 mt-4 mx-auto ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className={`h-2 rounded-full transition-all duration-300 ease-out ${
                  theme === 'dark' ? 'bg-white' : 'bg-blue-600'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Route-based loading component
const RouteLoader = ({ routeName }) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    let mounted = true;
    let progressInterval;

    const simulateProgress = () => {
      setProgress(prev => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        const increment = prev < 50 ? 15 : 5;
        return Math.min(prev + increment, 85);
      });
    };

    progressInterval = setInterval(simulateProgress, 200);

    return () => {
      mounted = false;
      clearInterval(progressInterval);
    };
  }, []);

  const displayName = routeName ? routeName.charAt(0).toUpperCase() + routeName.slice(1) : 'Page';

  return (
    <EnhancedLoader 
      message={`Loading ${displayName}...`}
      progress={progress}
    />
  );
};

// Session Management
const sessionManager = {
  getSession: () => {
    try {
      const savedSession = localStorage.getItem("userSession");
      if (savedSession) {
        return JSON.parse(savedSession);
      }
      return null;
    } catch (error) {
      console.error("Failed to parse session:", error);
      return null;
    }
  },

  saveSession: (session) => {
    try {
      localStorage.setItem("userSession", JSON.stringify(session));
      return true;
    } catch (error) {
      console.error("Failed to save session:", error);
      return false;
    }
  },

  clearSession: () => {
    try {
      localStorage.removeItem("userSession");
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      return true;
    } catch (error) {
      console.error("Failed to clear session:", error);
      return false;
    }
  },

  isValidSession: () => {
    const session = sessionManager.getSession();
    return session && session.token && session.user && session.user.id;
  }
};

// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  
  if (!sessionManager.isValidSession()) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// PublicRoute component (redirect to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  if (sessionManager.isValidSession()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// 404 Component - MATCHING YOUR DESIGN
const NotFoundPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  
  const suggestedRoutes = [
    { path: '/dashboard', label: 'Dashboard', description: 'Overview' },
    { path: '/expenditure', label: 'Expenditure', description: 'Spending' },
    { path: '/income', label: 'Income', description: 'Earnings' },
    { path: '/projects', label: 'Projects', description: 'Manage Projects' },
    { path: '/assets', label: 'Asset Management', description: 'Manage your assets' },
  ];
  
  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full p-8 rounded-2xl text-center ${
        theme === 'dark' 
          ? 'bg-gray-800 text-white' 
          : 'bg-white text-gray-800 shadow-lg'
      }`}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
          <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
          <p className="text-gray-500">
            The page <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{location.pathname}</span> doesn't exist.
          </p>
        </div>

        {/* Suggested Pages - MATCHING YOUR DESIGN */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Suggested Pages</h3>
          <div className="space-y-3">
            {suggestedRoutes.map((route, index) => (
              <div 
                key={route.path}
                className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => navigate(route.path)}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                  index % 2 === 0 
                    ? 'border-gray-400' 
                    : 'border-green-500 bg-green-500'
                }`}>
                  {index % 2 === 0 ? (
                    <span className="text-xs">○</span>
                  ) : (
                    <span className="text-white text-xs">✓</span>
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium">{route.label}</div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>{route.description}</div>
                </div>
                <div className="text-gray-400">→</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => navigate(-1)}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Go Back
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// Session Persistence Hook
const useSessionPersistence = () => {
  const [userSession, setUserSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeSession = () => {
      try {
        if (sessionManager.isValidSession()) {
          const savedSession = sessionManager.getSession();
          setUserSession(savedSession);
        }
      } catch (error) {
        console.error("Failed to initialize session:", error);
        sessionManager.clearSession();
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  const setSession = useCallback((session) => {
    if (session === null) {
      sessionManager.clearSession();
      setUserSession(null);
    } else {
      const success = sessionManager.saveSession(session);
      if (success) {
        setUserSession(session);
      }
    }
  }, []);

  const clearSession = useCallback(() => {
    sessionManager.clearSession();
    setUserSession(null);
  }, []);

  return { 
    userSession, 
    setUserSession: setSession, 
    clearSession,
    loadingSession: loading 
  };
};

// Theme Wrapper Component
const ThemeWrapper = ({ children }) => {
  const { theme } = useTheme();
  
  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' 
          ? 'dark:bg-gray-900 dark:text-white' 
          : 'bg-gray-50 text-gray-900'
      }`}>
        {children}
      </div>
    </div>
  );
};

// MainLayout component
const MainLayout = ({ userSession, setUserSession, clearSession, loadingSession }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/';

  const handleLoginSuccess = useCallback((userData) => {
    setUserSession(userData);
  }, [setUserSession]);

  const handleLogout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  if (loadingSession) {
    return (
      <ThemeWrapper>
        <EnhancedLoader message="Loading..." size="large" />
      </ThemeWrapper>
    );
  }

  return (
    <ThemeWrapper>
      <AppWrapper>
        <div className="App flex min-h-screen">
          {/* Show sidebar only when authenticated and not on auth pages */}
          {sessionManager.isValidSession() && !isAuthPage && (
            <Sidebar userSession={userSession} onLogout={handleLogout} />
          )}

          <main className={`flex-1 transition-all duration-300 ${
            sessionManager.isValidSession() && !isAuthPage ? 'ml-[60px]' : ''
          }`}>
            <Suspense fallback={<RouteLoader routeName={location.pathname.split('/').pop()} />}>
              <Routes>
                {/* Auth Routes */}
                <Route 
                  path="/" 
                  element={
                    <PublicRoute>
                      <AuthPage onLoginSuccess={handleLoginSuccess} />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <AuthPage onLoginSuccess={handleLoginSuccess} />
                    </PublicRoute>
                  } 
                />

                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard userSession={userSession} onLogout={handleLogout} />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/expenditure" 
                  element={
                    <ProtectedRoute>
                      <Expenditure userSession={userSession} />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/income" 
                  element={
                    <ProtectedRoute>
                      <Income userSession={userSession} />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/projects" 
                  element={
                    <ProtectedRoute>
                      <ProjectModule userSession={userSession} />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/assets" 
                  element={
                    <ProtectedRoute>
                      <AssetManagement userSession={userSession} />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/assets/add" 
                  element={
                    <ProtectedRoute>
                      <AddAssetForm userSession={userSession} />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/assets/:id" 
                  element={
                    <ProtectedRoute>
                      <AssetDetails userSession={userSession} />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings userSession={userSession} />
                    </ProtectedRoute>
                  } 
                />

                {/* Additional routes */}
                <Route path="/monthly-bills" element={<ProtectedRoute><MonthPage /></ProtectedRoute>} />
                <Route path="/smart-borrow" element={<ProtectedRoute><SmartBorrowForm /></ProtectedRoute>} />
                <Route path="/tax" element={<ProtectedRoute><TaxPage /></ProtectedRoute>} />
                <Route path="/investment" element={<ProtectedRoute><Investment /></ProtectedRoute>} />
                <Route path="/profitloss" element={<ProtectedRoute><ProfitLossPage /></ProtectedRoute>} />

                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </AppWrapper>
    </ThemeWrapper>
  );
};

// Main App Component
function App() {
  const { userSession, setUserSession, clearSession, loadingSession } = useSessionPersistence();

  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <SettingsProvider>
            <TwoFactorProvider>
              <MainLayout
                userSession={userSession}
                setUserSession={setUserSession}
                clearSession={clearSession}
                loadingSession={loadingSession}
              />
            </TwoFactorProvider>
          </SettingsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;