import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Github, 
  Key, 
  LogOut, 
  User as UserIcon, 
  History, 
  Sparkles, 
  FolderGit2, 
  Activity, 
  CreditCard, 
  Settings, 
  ShieldCheck, 
  Layout, 
  Menu, 
  X,
  Smartphone
} from 'lucide-react';
import { MainViewTab, User, APPROVED_ADMIN_EMAILS } from '../types';
import { isNativeApp } from '../lib/capacitor';

interface HeaderProps {
  user: User | null;
  githubToken: string | null;
  githubUsername?: string;
  currentTab: MainViewTab;
  onNavigateTab: (tab: MainViewTab) => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onOpenTokenHelp: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  githubToken,
  githubUsername,
  currentTab,
  onNavigateTab,
  onOpenAuth,
  onOpenTokenHelp,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAndroidApp = isNativeApp();

  const isAdminUser = Boolean(user && user.email && APPROVED_ADMIN_EMAILS.includes(user.email.toLowerCase().trim()));

  const navItems: { id: MainViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'workspace', label: 'Studio Workspace', icon: <Layout className="w-4 h-4" /> },
    { id: 'repos', label: 'Repositories', icon: <FolderGit2 className="w-4 h-4" /> },
    { id: 'history', label: 'Sync History', icon: <History className="w-4 h-4" /> },
    { id: 'usage', label: 'Usage', icon: <Activity className="w-4 h-4" /> },
    { id: 'pricing', label: 'SaaS Plans', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ...(isAdminUser || currentTab === 'admin'
      ? [{ id: 'admin' as MainViewTab, label: 'Admin', icon: <ShieldCheck className="w-4 h-4" /> }]
      : [])
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Platform Badge */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('landing')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 group-hover:bg-blue-500 transition">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-white tracking-tight">SourceLink.ai</span>
                  {isAndroidApp ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> Android
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> SaaS
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block">GitHub Smart Code Sync Platform</p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigateTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Status Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* GitHub Token Status Badge */}
            {githubToken ? (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="truncate max-w-[110px]">{githubUsername || 'Connected'}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Connect PAT</span>
              </button>
            )}

            {/* Token Help Icon */}
            <button
              type="button"
              onClick={onOpenTokenHelp}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="GitHub Token Setup Help"
            >
              <Key className="w-4 h-4" />
            </button>

            {/* Auth User Menu / Login */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <button
                  type="button"
                  onClick={() => onNavigateTab('settings')}
                  className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full border border-slate-700 object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span className="hidden md:inline text-xs font-bold text-slate-200 truncate max-w-[90px]">{user.name}</span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                  title="Logout Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-4 space-y-1">
          {navItems.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigateTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
