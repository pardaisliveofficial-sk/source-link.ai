import React, { useState } from 'react';
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
  Smartphone,
  ChevronRight
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
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Logo & Platform Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('landing')}
              className="flex items-center gap-2 text-left cursor-pointer group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 group-hover:bg-blue-500 transition">
                <GitBranch className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">SourceLink.ai</span>
                {isAndroidApp ? (
                  <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                    <Smartphone className="w-2.5 h-2.5" /> App
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> SaaS
                  </span>
                )}
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

          {/* Desktop Right Header Controls (lg+) */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {/* GitHub Token Status Badge */}
            {githubToken ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="truncate max-w-[110px]">{githubUsername || 'Connected'}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Connect PAT</span>
              </button>
            )}

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
                    <img src={user.avatarUrl} alt={user.name || 'User'} className="w-7 h-7 rounded-full border border-slate-700 object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {(user.name || user.email || 'U').charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[90px]">{user.name || user.email}</span>
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
              <div className="flex items-center gap-1">
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
          </div>

          {/* Mobile Bar Right Controls (< lg) - GUARANTEED FIT NO OVERFLOW */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            {/* Quick PAT indicator on mobile */}
            {githubToken ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-medium">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="truncate max-w-[55px]">{githubUsername || 'PAT'}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-md text-[10px] font-semibold transition"
              >
                <Key className="w-3 h-3 text-amber-400 shrink-0" />
                <span>PAT</span>
              </button>
            )}

            {/* 3-Line Menu Trigger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition cursor-pointer flex items-center justify-center border border-slate-700 active:scale-95"
              aria-label="Open Navigation & Settings Menu"
            >
              <Menu className="w-5 h-5 text-slate-200" />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Overlay Menu - FULL ACCESS TO ALL OPTIONS */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/98 text-white flex flex-col p-4 overflow-y-auto animate-in fade-in duration-200">
          
          {/* Mobile Drawer Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-base text-white tracking-tight">SourceLink.ai</span>
                <p className="text-[10px] text-slate-400">Mobile Menu & Settings</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
              aria-label="Close Menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Account & Logout Banner */}
          <div className="mt-4 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            {user ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name || 'User'} className="w-9 h-9 rounded-full border border-slate-700 object-cover shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {(user.name || user.email || 'U').charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user.name || 'User'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-200">Guest User</p>
                  <p className="text-[10px] text-slate-400">Log in to sync repositories</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth('login');
                      setMobileMenuOpen(false);
                    }}
                    className="px-3 py-1.5 bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg"
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth('signup');
                      setMobileMenuOpen(false);
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}

            {/* GitHub PAT Connection Card inside Drawer */}
            <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px]">GitHub PAT:</span>
                {githubToken ? (
                  <span className="text-emerald-400 font-medium text-[11px]">Connected</span>
                ) : (
                  <span className="text-amber-400 font-medium text-[11px]">Not Connected</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  onOpenTokenHelp();
                  setMobileMenuOpen(false);
                }}
                className="text-[11px] text-blue-400 hover:underline font-medium"
              >
                PAT Setup Help
              </button>
            </div>
          </div>

          {/* Navigation Items inside Mobile Drawer */}
          <div className="mt-4 flex-1 space-y-1.5">
            <p className="px-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Navigation Menu</p>
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
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              );
            })}
          </div>

          {/* Logout Action at Bottom of Drawer */}
          {user && (
            <div className="mt-4 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of SourceLink.ai</span>
              </button>
            </div>
          )}

          {/* Drawer Footer */}
          <div className="mt-4 text-center text-[11px] text-slate-500">
            SourceLink.ai &bull; Android App & SaaS Workspace
          </div>

        </div>
      )}
    </header>
  );
};

