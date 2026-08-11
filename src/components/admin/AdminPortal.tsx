import React, { useState, useEffect } from 'react';
import { Shield, LayoutDashboard, Users, Layers, Tag, FileText, Settings, LogOut, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboardTab } from './AdminDashboardTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminPlansTab } from './AdminPlansTab';
import { AdminDiscountsTab } from './AdminDiscountsTab';
import { AdminAuditLogsTab } from './AdminAuditLogsTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { apiFetch } from '../../lib/api';

type AdminTab = 'dashboard' | 'users' | 'plans' | 'discounts' | 'audit-logs' | 'settings';

interface AdminPortalProps {
  onBackToApp?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToApp }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sourcelink_admin_token'));
  const [adminUser, setAdminUser] = useState<any | null>(null);
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');

  // Admin Data State
  const [dashboardStats, setDashboardStats] = useState<any | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [plansList, setPlansList] = useState<any[]>([]);
  const [discountsList, setDiscountsList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Validate session on mount
  useEffect(() => {
    if (token) {
      apiFetch('/api/admin/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (!res.ok) throw new Error('Unauthorized');
          return res.json();
        })
        .then((data) => {
          setAdminUser(data.admin);
          setAuthChecking(false);
          fetchAllAdminData(token);
        })
        .catch(() => {
          localStorage.removeItem('sourcelink_admin_token');
          setToken(null);
          setAdminUser(null);
          setAuthChecking(false);
        });
    } else {
      setAuthChecking(false);
    }
  }, [token]);

  const fetchAllAdminData = async (authToken: string) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${authToken}` };

      const [dashRes, usersRes, plansRes, discRes, auditRes, setRes] = await Promise.all([
        apiFetch('/api/admin/dashboard', { headers }),
        apiFetch('/api/admin/users', { headers }),
        apiFetch('/api/admin/plans', { headers }),
        apiFetch('/api/admin/discounts', { headers }),
        apiFetch('/api/admin/audit-logs', { headers }),
        apiFetch('/api/admin/settings', { headers })
      ]);

      if (dashRes.ok) setDashboardStats(await dashRes.json());
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsersList(uData.users || []);
      }
      if (plansRes.ok) {
        const pData = await plansRes.json();
        setPlansList(pData.plans || []);
      }
      if (discRes.ok) {
        const dData = await discRes.json();
        setDiscountsList(dData.discounts || []);
      }
      if (auditRes.ok) {
        const aData = await auditRes.json();
        setAuditLogs(aData.logs || []);
      }
      if (setRes.ok) {
        const sData = await setRes.json();
        setSystemSettings(sData.settings);
        setAdminUsers(sData.admins || []);
      }
    } catch (err) {
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (newToken: string, adminData: any) => {
    setToken(newToken);
    setAdminUser(adminData);
    fetchAllAdminData(newToken);
  };

  const handleLogout = async () => {
    if (token) {
      await apiFetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
    localStorage.removeItem('sourcelink_admin_token');
    setToken(null);
    setAdminUser(null);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span>Verifying admin privileges...</span>
      </div>
    );
  }

  // Render Login Screen if not authenticated
  if (!token || !adminUser) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} onBackToApp={onBackToApp} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Admin Header Branding */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-black text-white text-base">
              <div className="w-8 h-8 bg-purple-950 border border-purple-800 rounded-xl flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <span>SourceLink Admin</span>
            </div>

            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs"
                title="Back to User App"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition ${
                currentTab === 'dashboard' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentTab('users')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition ${
                currentTab === 'users' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Users & Accounts</span>
            </button>

            <button
              onClick={() => setCurrentTab('plans')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition ${
                currentTab === 'plans' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>SaaS Plans</span>
            </button>

            <button
              onClick={() => setCurrentTab('discounts')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition ${
                currentTab === 'discounts' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Coupons & Discounts</span>
            </button>

            <button
              onClick={() => setCurrentTab('audit-logs')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition ${
                currentTab === 'audit-logs' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Audit Logs</span>
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition ${
                currentTab === 'settings' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Admin Footer / Profile */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white">{adminUser.name}</div>
            <div className="text-[10px] text-purple-400 font-mono font-extrabold uppercase">{adminUser.role}</div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-400 rounded-lg cursor-pointer transition"
            title="Sign Out Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {currentTab === 'dashboard' && (
          <AdminDashboardTab
            stats={dashboardStats}
            loading={loading}
            onRefresh={() => fetchAllAdminData(token)}
          />
        )}

        {currentTab === 'users' && (
          <AdminUsersTab
            users={usersList}
            loading={loading}
            onRefresh={() => fetchAllAdminData(token)}
            token={token}
          />
        )}

        {currentTab === 'plans' && (
          <AdminPlansTab
            plans={plansList}
            token={token}
            onRefresh={() => fetchAllAdminData(token)}
          />
        )}

        {currentTab === 'discounts' && (
          <AdminDiscountsTab
            discounts={discountsList}
            token={token}
            onRefresh={() => fetchAllAdminData(token)}
          />
        )}

        {currentTab === 'audit-logs' && (
          <AdminAuditLogsTab logs={auditLogs} />
        )}

        {currentTab === 'settings' && (
          <AdminSettingsTab
            settings={systemSettings}
            admins={adminUsers}
            token={token}
            onRefresh={() => fetchAllAdminData(token)}
          />
        )}
      </main>

    </div>
  );
};
