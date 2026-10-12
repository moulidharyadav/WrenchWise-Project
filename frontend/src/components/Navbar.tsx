import React, { useState } from 'react';
import {
  Cpu,
  Bell,
  Search,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { AuthUser } from '../types';

interface NavbarProps {
  systemHealthy: boolean;
  activeRole: string;
  setActiveRole: (r: string) => void;
  onSearchSelect?: (term: string) => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  systemHealthy,
  activeRole,
  setActiveRole,
  onSearchSelect,
  notificationCount = 3,
  onOpenNotifications,
  currentUser,
  onLogout
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    document.documentElement.classList.toggle('dark');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() && onSearchSelect) {
      onSearchSelect(searchTerm);
    }
  };

  return (
    <header className="border-b border-sky-950/60 bg-navy-900/90 backdrop-blur-md sticky top-0 z-50 px-4 py-2.5">
      <div className="w-full flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        {/* Left Section */}
        <div className="flex items-center gap-3 shrink-0">
          {/* 1. WRENCH WISE AI BANKING logo and brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-600/30 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-sm shadow-sky-500/10 shrink-0">
              <Cpu className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight whitespace-nowrap flex items-center gap-1.5">
              <span>WRENCH WISE</span>
              <span className="text-sky-400 font-normal">AI BANKING</span>
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block shrink-0" />

          {/* 2. Backend Online status indicator */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${
              systemHealthy
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                systemHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="whitespace-nowrap">{systemHealthy ? 'BACKEND ONLINE' : 'DISCONNECTED'}</span>
          </div>

          {/* 3. User role selector */}
          <select
            value={activeRole}
            onChange={(e) => setActiveRole(e.target.value)}
            className="hidden sm:block bg-navy-950/90 border border-slate-700/60 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none cursor-pointer focus:border-sky-400 shrink-0"
          >
            <option value="CUSTOMER">Retail Customer</option>
            <option value="RELATIONSHIP_MANAGER">Relationship Manager</option>
            <option value="COMPLIANCE_OFFICER">Chief Compliance Officer</option>
            <option value="SYSTEM_ADMIN">Platform SRE</option>
          </select>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2.5 shrink-0 ml-auto">
          {/* 6. Global search */}
          <div className="w-44 md:w-56 shrink-0">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search accounts, txns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-navy-950/90 border border-slate-700/60 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 outline-none focus:border-sky-400 placeholder-slate-500 transition"
              />
            </form>
          </div>

          {/* 7. Notifications icon with badge */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-lg bg-navy-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5 text-slate-300" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-[8px] font-bold text-white flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* 8. Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-navy-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            title="Toggle Theme"
          >
            {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-sky-400" />}
          </button>

          {/* 9. Logged-in username and verified role */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800 shrink-0">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-white leading-none whitespace-nowrap">
                  {currentUser.username}
                </span>
                <span className="text-[10px] font-mono text-sky-400 leading-none mt-0.5 whitespace-nowrap">
                  {currentUser.role}
                </span>
              </div>

              {/* 10. Sign Out button */}
              <button
                id="sign-out-button"
                onClick={onLogout}
                className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-100 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                title="Sign Out of Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline whitespace-nowrap">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
