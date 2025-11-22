// --- START OF FILE Sidebar.jsx (Updated with Assets Module) ---
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  TrendingDown,
  Settings,
  LogOut,
  Calendar,
  Menu,
  Receipt,
  TrendingUp,
  FolderOpen,
  Briefcase,
  User,
  PieChart,
} from "lucide-react";

const Sidebar = ({ userSession, setUserSession }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, page: "/dashboard" },
    { name: "Income", icon: TrendingUp, page: "/income" },
    { name: "Expenditure", icon: TrendingDown, page: "/expenditure" },
    { name: "ProfitLoss", icon: FolderOpen, page: "/profitloss" },
    { name: "Projects", icon: Briefcase, page: "/projects" },
    { name: "Smart Borrow", icon: Wallet, page: "/smart-borrow" },
    { name: "Monthly Bills", icon: Calendar, page: "/monthly-bills" },
    { name: "Investment", icon: TrendingUp, page: "/investment" },
    { name: "Asset Management", icon: PieChart, page: "/assets" }, // NEW: Added Asset Management
    { name: "Tax Center", icon: Receipt, page: "/tax" },
    { name: "Settings", icon: Settings, page: "/settings" },
  ];

  // Storage keys to clear during logout
  const storageKeys = [
    "token", "tenantId", "userData", "userSession", 
    "sessionToken", "userId", "redirectAfterLogin",
    "authToken", "currentUser", "appState"
  ];

  const clearSessionData = () => {
    // Clear all storage
    storageKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Clear global variables
    window.sessionToken = null;
    window.sessionUser = null;
    window.tenantId = null;
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    console.log("🚪 LOGOUT: Starting logout process...");
    setIsLoggingOut(true);

    try {
      // Clear session data immediately
      clearSessionData();
      
      // Update session state
      if (typeof setUserSession === 'function') {
        console.log("🔄 Setting userSession to null");
        setUserSession(null);
      }
      
      // Navigate to login page
      console.log("🚀 Redirecting to login page");
      navigate("/", { replace: true });
      
      // Force reload after a brief delay to ensure clean state
      setTimeout(() => {
        console.log("🔄 Force reloading page");
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Even if there's an error, try to clear data and redirect
      clearSessionData();
      navigate("/", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Get user info for display
  const userName = userSession?.user?.name || userSession?.user?.email || "User";
  const userInitial = userName.charAt(0).toUpperCase();
  const userEmail = userSession?.user?.email || "";

  const isActivePage = (page) => {
    if (page === "/dashboard") {
      return location.pathname === page;
    }
    return location.pathname.startsWith(page);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 left-0 h-full bg-[#0d0b37] text-white shadow-lg flex flex-col transition-all duration-300 z-50`}
      style={{ width: isExpanded || isHovered ? "220px" : "60px" }}
    >
      {/* Header and Toggle Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {isExpanded || isHovered ? (
            <>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {userInitial}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold whitespace-nowrap truncate">FINOVO APP</h1>
                <p className="text-xs text-gray-400 truncate">{userName}</p>
              </div>
            </>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {userInitial}
            </div>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-1 rounded-full hover:bg-gray-600 transition-colors duration-150 ${
            isExpanded ? "ml-auto" : ""
          }`}
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4 space-y-1 px-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = isActivePage(item.page);
            const IconComponent = item.icon;
            
            return (
              <li key={item.name}>
                <Link
                  to={item.page}
                  className={`flex items-center gap-3 p-3 rounded-md transition-all duration-150 ${
                    isActive
                      ? "bg-blue-600 shadow-md border-l-4 border-white text-white"
                      : "hover:bg-gray-700 text-gray-300 hover:text-white"
                  }`}
                  title={!isExpanded && !isHovered ? item.name : ""}
                >
                  <IconComponent size={20} className="flex-shrink-0" />
                  {(isExpanded || isHovered) && (
                    <span className="capitalize whitespace-nowrap truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info Section */}
      {(isExpanded || isHovered) && userSession && (
        <div className="px-3 py-2 border-t border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-400 px-2 py-1">
            <User size={12} />
            <div className="min-w-0 flex-1">
              <div className="truncate" title={userEmail}>{userEmail}</div>
              <div className="flex items-center gap-1 text-green-400">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <div className="p-3 border-t border-gray-700">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`flex items-center gap-3 w-full p-2 rounded-md transition-colors duration-150 ${
            isLoggingOut 
              ? "bg-gray-600 cursor-not-allowed" 
              : "hover:bg-red-600 hover:text-white"
          } ${isExpanded || isHovered ? "justify-start" : "justify-center"}`}
          title={!isExpanded && !isHovered ? "Logout" : ""}
          aria-label="Logout"
        >
          <LogOut size={20} className={`flex-shrink-0 ${isLoggingOut ? "text-gray-400" : "text-red-400"}`} />
          {(isExpanded || isHovered) && (
            <span className={`${isLoggingOut ? "text-gray-400" : "text-white"}`}>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
// --- END OF FILE Sidebar.jsx (Updated with Assets Module) ---