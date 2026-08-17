import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { TokenHelpModal } from './components/TokenHelpModal';
import { ZipUploader } from './components/ZipUploader';
import { RepoSelector } from './components/RepoSelector';
import { DiffViewer } from './components/DiffViewer';
import { CodeWorkspace } from './components/CodeWorkspace';
import { SyncLogs } from './components/SyncLogs';
import { PushConfirmModal } from './components/PushConfirmModal';
import { LandingPage } from './components/LandingPage';
import { PricingView } from './components/PricingView';
import { AccountSettings } from './components/AccountSettings';
import { UsageView } from './components/UsageView';
import { LegalViews } from './components/LegalViews';
import { AdminView } from './components/AdminView';
import { EmailVerificationView } from './components/EmailVerificationView';
import { AuthFirstScreen } from './components/AuthFirstScreen';
import { AddGitHubAccountModal } from './components/AddGitHubAccountModal';
import { AppletPreviewView } from './components/AppletPreviewView';

import { getStoredUser, setStoredUser, getStoredGitHubToken, setStoredGitHubToken, loginGitHubUser, switchGitHubAccountApi, removeGitHubAccountApi } from './lib/auth';
import { computeDiffsWithGitHub, pushChangesToGitHub } from './lib/github';
import { User, ExtractedFile, FileDiff, GitHubRepo, SyncLog, MainViewTab } from './types';
import { ZipExtractionResult } from './lib/zipExtractor';
import { setupAndroidBackButton } from './lib/capacitor';
import { apiFetch } from './lib/api';
import { syncPublicAppConfig, getCachedAppIconUrl } from './lib/appConfig';
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight, UploadCloud, GitBranch, FolderGit2, ChevronLeft, ChevronRight, Layers, LayoutGrid, FileCode, GitCompare, FileArchive } from 'lucide-react';

export default function App() {
  // Navigation & SaaS State
  const [currentTab, setCurrentTab] = useState<MainViewTab>('workspace');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [appIconUrl, setAppIconUrl] = useState<string>(getCachedAppIconUrl);
  const [appName, setAppName] = useState<string>('SourceLink.ai');

  // Step-by-Step Workspace Slider State (1: Upload & Repo, 2: Diff & Sync, 3: Code Workspace)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [viewMode, setViewMode] = useState<'step' | 'all'>('step');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Application Core Sync State
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [githubToken, setGithubToken] = useState<string | null>(getStoredGitHubToken);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [targetBranch, setTargetBranch] = useState<string>('main');

  const [extractedFiles, setExtractedFiles] = useState<Map<string, ExtractedFile>>(new Map());
  const [extractionMeta, setExtractionMeta] = useState<ZipExtractionResult | null>(null);
  const [zipName, setZipName] = useState<string | null>(null);
  const [fileDiffs, setFileDiffs] = useState<FileDiff[]>([]);
  const [remoteHeadSha, setRemoteHeadSha] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  // Selected file path for inspection
  const [inspectorPath, setInspectorPath] = useState<string | null>(null);

  // Loading States
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDiffing, setIsDiffing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  // Modal Controls
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isTokenHelpOpen, setIsTokenHelpOpen] = useState(false);
  const [isSyncLogsOpen, setIsSyncLogsOpen] = useState(false);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isAddGitHubModalOpen, setIsAddGitHubModalOpen] = useState(false);

  // Multi-Account GitHub Switcher Handler
  const handleSwitchGitHubAccount = async (accountId: string) => {
    if (!user) return;
    try {
      const updatedUser = await switchGitHubAccountApi(user.email, accountId);
      setUser(updatedUser);
      setStoredUser(updatedUser);

      const activeAccount = updatedUser.githubAccounts?.find(a => a.id === updatedUser.activeGitHubId);
      if (activeAccount) {
        setGithubToken(activeAccount.token);
        setStoredGitHubToken(activeAccount.token);
        showToast(`Switched active GitHub account to @${activeAccount.username}!`);

        // Trigger diff calculation for newly active account
        if (extractedFiles.size > 0 && selectedRepo) {
          handleRunDiff(extractedFiles, activeAccount.token, selectedRepo, targetBranch);
        }
      }
    } catch (err: any) {
      showToast(`Account switch failed: ${err.message}`, 'error');
    }
  };

  // Multi-Account GitHub Remove Handler
  const handleRemoveGitHubAccount = async (accountId: string) => {
    if (!user) return;
    try {
      const updatedUser = await removeGitHubAccountApi(user.email, accountId);
      setUser(updatedUser);
      setStoredUser(updatedUser);

      const activeAccount = updatedUser.githubAccounts?.find(a => a.id === updatedUser.activeGitHubId);
      if (activeAccount) {
        setGithubToken(activeAccount.token);
        setStoredGitHubToken(activeAccount.token);
      } else if (!updatedUser.githubAccounts || updatedUser.githubAccounts.length === 0) {
        setGithubToken(null);
        setStoredGitHubToken('');
      }

      showToast('Removed GitHub account.');
    } catch (err: any) {
      showToast(`Failed to remove account: ${err.message}`, 'error');
    }
  };

  // Multi-Account GitHub Add Success Handler
  const handleAddGitHubAccountSuccess = (updatedUser: User, newActiveToken: string) => {
    setUser(updatedUser);
    setStoredUser(updatedUser);
    setGithubToken(newActiveToken);
    setStoredGitHubToken(newActiveToken);
    setIsAddGitHubModalOpen(false);

    const activeAcc = updatedUser.githubAccounts?.find(a => a.id === updatedUser.activeGitHubId);
    showToast(`Successfully added and connected @${activeAcc?.username || 'GitHub account'}!`);

    if (extractedFiles.size > 0 && selectedRepo) {
      handleRunDiff(extractedFiles, newActiveToken, selectedRepo, targetBranch);
    }
  };

  // Push confirmation modal payload
  const [pushPayload, setPushPayload] = useState<{
    commitMessage: string;
    selectedDiffs: FileDiff[];
  }>({ commitMessage: '', selectedDiffs: [] });

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync Public App System Configuration (Icon & Name) on Mount & Listen for Live Icon Updates
  useEffect(() => {
    syncPublicAppConfig().then((cfg) => {
      if (cfg.appIconUrl) setAppIconUrl(cfg.appIconUrl);
      if (cfg.appName) setAppName(cfg.appName);
    });

    const handleIconChange = (e: any) => {
      if (e.detail?.iconUrl) {
        setAppIconUrl(e.detail.iconUrl);
      }
    };

    window.addEventListener('app_icon_changed', handleIconChange);
    return () => window.removeEventListener('app_icon_changed', handleIconChange);
  }, []);

  // Register Android Hardware Back-Button Listener
  useEffect(() => {
    const cleanup = setupAndroidBackButton(() => {
      if (currentTab !== 'workspace' && currentTab !== 'landing') {
        setCurrentTab('workspace');
      } else if (isPushModalOpen) {
        setIsPushModalOpen(false);
      } else if (isAuthOpen) {
        setIsAuthOpen(false);
      }
    });
    return cleanup;
  }, [currentTab, isPushModalOpen, isAuthOpen]);

  // Handle GitHub OAuth Redirect Parameters & Direct Admin Routing
  useEffect(() => {
    if (window.location.pathname === '/admin' || window.location.hostname.startsWith('admin.')) {
      setCurrentTab('admin');
    }

    const urlParams = new URLSearchParams(window.location.search);
    const oauthStatus = urlParams.get('oauth');
    if (oauthStatus === 'success') {
      const token = urlParams.get('token');
      const username = urlParams.get('username');
      const avatar = urlParams.get('avatar');
      const email = urlParams.get('email');

      if (token && username) {
        const authedUser = loginGitHubUser(username, token, avatar || undefined, email || undefined);
        setUser(authedUser);
        setGithubToken(token);
        showToast(`Authenticated with GitHub as @${username}!`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else if (oauthStatus === 'error') {
      const msg = urlParams.get('message') || 'OAuth Failed';
      showToast(`GitHub OAuth Error: ${msg}`, 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Load initial sync logs from server
    apiFetch('/api/sync/logs')
      .then((res) => res.json())
      .then((data) => {
        if (data.logs) {
          setSyncLogs(data.logs);
        }
      })
      .catch(() => {});
  }, []);

  // Run Diff calculation whenever repo or branch changes or after files extracted
  const handleRunDiff = async (
    filesMap: Map<string, ExtractedFile> = extractedFiles,
    token: string | null = githubToken,
    repo: GitHubRepo | null = selectedRepo,
    branch: string = targetBranch
  ) => {
    if (!token || !repo || filesMap.size === 0) {
      return;
    }

    setIsDiffing(true);
    try {
      const { diffs, remoteHeadSha: headSha } = await computeDiffsWithGitHub(
        filesMap,
        token,
        repo.owner.login,
        repo.name,
        branch
      );
      setFileDiffs(diffs);
      setRemoteHeadSha(headSha);
      showToast(`Diff comparison complete! Detected ${diffs.filter(d => d.status !== 'unchanged').length} changed files.`);
    } catch (err: any) {
      showToast(`Diff analysis error: ${err.message}`, 'error');
    } finally {
      setIsDiffing(false);
    }
  };

  // Handle ZIP extraction completed
  const handleFilesExtracted = (result: ZipExtractionResult, zipFilename: string) => {
    setExtractionMeta(result);
    setExtractedFiles(result.files);
    setZipName(zipFilename);
    showToast(`Extracted ${result.files.size} source files from ${zipFilename}`);

    if (selectedRepo && githubToken) {
      handleRunDiff(result.files, githubToken, selectedRepo, targetBranch);
    }
  };

  // Select Repo
  const handleSelectRepo = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    const branch = repo.default_branch || 'main';
    setTargetBranch(branch);
    showToast(`Connected repository: ${repo.full_name}`);

    if (extractedFiles.size > 0 && githubToken) {
      handleRunDiff(extractedFiles, githubToken, repo, branch);
    }
  };

  // Trigger Push Review Modal
  const handleOpenPushModal = (commitMessage: string, selectedDiffs: FileDiff[]) => {
    setPushPayload({ commitMessage, selectedDiffs });
    setIsPushModalOpen(true);
  };

  // Execute Push Changes
  const handleExecutePush = async (finalMessage: string) => {
    if (!githubToken || !selectedRepo) {
      throw new Error('Please connect a GitHub repository first.');
    }

    const diffsToPush = pushPayload.selectedDiffs;
    const res = await pushChangesToGitHub(
      githubToken,
      selectedRepo.owner.login,
      selectedRepo.name,
      targetBranch,
      diffsToPush,
      finalMessage
    );

    const newLog: SyncLog = {
      id: 'log_' + Date.now(),
      repoFullName: selectedRepo.full_name,
      branch: targetBranch,
      commitSha: res.commitSha,
      commitUrl: res.commitUrl,
      commitMessage: finalMessage,
      changedFilesCount: diffsToPush.length,
      addedFilesCount: diffsToPush.filter(d => d.status === 'added').length,
      deletedFilesCount: diffsToPush.filter(d => d.status === 'deleted').length,
      timestamp: new Date().toLocaleTimeString(),
      status: 'success'
    };

    const updatedLogs = [newLog, ...syncLogs];
    setSyncLogs(updatedLogs);

    // Save log to server API
    apiFetch('/api/sync/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    }).catch(() => {});

    showToast(`Successfully pushed ${diffsToPush.length} files to ${selectedRepo.full_name}!`);

    // Re-calculate diff after push
    handleRunDiff(extractedFiles, githubToken, selectedRepo, targetBranch);

    return res;
  };

  // Update file content in live workspace
  const handleUpdateFileContent = (path: string, newContent: string) => {
    const nextMap = new Map<string, ExtractedFile>(Array.from(extractedFiles.entries()));
    const existing = nextMap.get(path);
    if (existing) {
      nextMap.set(path, {
        ...existing,
        content: newContent,
        size: newContent.length
      });
      setExtractedFiles(nextMap);

      if (selectedRepo && githubToken) {
        handleRunDiff(nextMap, githubToken, selectedRepo, targetBranch);
      }
    }
  };

  const handleAuthSuccess = (authenticatedUser: User, token?: string) => {
    setUser(authenticatedUser);
    setStoredUser(authenticatedUser);

    if (token) {
      setGithubToken(token);
      setStoredGitHubToken(token);
    } else if (authenticatedUser.githubToken) {
      setGithubToken(authenticatedUser.githubToken);
      setStoredGitHubToken(authenticatedUser.githubToken);
    }

    setIsAuthOpen(false);
    if (currentTab === 'landing') {
      setCurrentTab('workspace');
    }
    showToast(`Signed in as ${authenticatedUser.name}`);
  };

  const handleLogout = () => {
    setUser(null);
    setGithubToken(null);
    setStoredUser(null);
    setStoredGitHubToken(null);
    setSelectedRepo(null);
    showToast('Logged out session');
  };

  const handleUpdateGithubToken = (newToken: string) => {
    setGithubToken(newToken);
    setStoredGitHubToken(newToken);
    if (user) {
      const updatedUser = { ...user, githubToken: newToken };
      setUser(updatedUser);
      setStoredUser(updatedUser);
    }
    showToast('Updated GitHub Personal Access Token');
  };

  const handleUpgradePlan = (newPlan: 'free' | 'pro' | 'business') => {
    if (user) {
      const updated = { ...user, plan: newPlan };
      setUser(updated);
      setStoredUser(updated);
    }
    showToast(`Account plan updated to ${newPlan.toUpperCase()}`);
  };

  const handleContinueAsGuest = () => {
    const guestUser: User = {
      id: 'guest-' + Date.now(),
      email: 'guest@sourcelink.ai',
      name: 'Guest Explorer',
      authProvider: 'email',
      plan: 'pro',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      githubAccounts: []
    };
    setUser(guestUser);
    setStoredUser(guestUser);
    setCurrentTab('workspace');
    showToast('Welcome! Exploring SourceLink Studio Workspace.');
  };

  const handleOpenGuestPreview = () => {
    const guestUser: User = {
      id: 'guest-' + Date.now(),
      email: 'guest@sourcelink.ai',
      name: 'Guest Explorer',
      authProvider: 'email',
      plan: 'pro',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      githubAccounts: []
    };
    setUser(guestUser);
    setStoredUser(guestUser);
    setCurrentTab('preview');
    showToast('Welcome! Live Applet Previewer ready.');
  };

  const handleOpenAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white w-full max-w-full overflow-x-hidden min-w-0">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5 duration-200 ${
          toastMessage.type === 'success'
            ? 'bg-slate-900 border-emerald-500/30 text-emerald-300'
            : 'bg-slate-900 border-red-500/30 text-red-300'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4 text-red-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Navigation Header (only rendered when user is logged in or viewing standalone public views) */}
      {(user || currentTab === 'admin' || currentTab === 'privacy' || currentTab === 'terms' || currentTab === 'support') && (
        <Header
          user={user}
          githubToken={githubToken}
          githubUsername={user?.githubUsername}
          currentTab={currentTab}
          appIconUrl={appIconUrl}
          appName={appName}
          onNavigateTab={(tab) => setCurrentTab(tab)}
          onOpenAuth={handleOpenAuthModal}
          onOpenTokenHelp={() => setIsTokenHelpOpen(true)}
          onLogout={handleLogout}
          onSwitchGitHubAccount={handleSwitchGitHubAccount}
          onOpenAddGitHubAccount={() => setIsAddGitHubModalOpen(true)}
          onRemoveGitHubAccount={handleRemoveGitHubAccount}
        />
      )}

      {/* Unauthenticated User: Auth First Screen */}
      {!user && currentTab !== 'admin' && currentTab !== 'privacy' && currentTab !== 'terms' && currentTab !== 'support' ? (
        <AuthFirstScreen
          onAuthSuccess={handleAuthSuccess}
          onViewTerms={() => setCurrentTab('terms')}
          onViewPrivacy={() => setCurrentTab('privacy')}
          onContinueAsGuest={handleContinueAsGuest}
          onOpenLivePreview={handleOpenGuestPreview}
          appIconUrl={appIconUrl}
          appName={appName}
        />
      ) : user && !user.emailVerified && currentTab !== 'landing' ? (
        /* Mandatory Email Verification Barrier */
        <EmailVerificationView
          user={user}
          onVerified={(updatedUser) => {
            setUser(updatedUser);
            setStoredUser(updatedUser);
            showToast('Email address verified! Access unlocked.');
          }}
          onLogout={handleLogout}
        />
      ) : (
        <>
          {/* Main Tab View Rendering */}
          {currentTab === 'landing' && (
            <LandingPage
              onGetStarted={() => setCurrentTab('workspace')}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenAuth={handleOpenAuthModal}
            />
          )}

      {currentTab === 'pricing' && (
        <div className="flex-1 bg-slate-950 py-4">
          <PricingView user={user} onUpgradePlan={handleUpgradePlan} />
        </div>
      )}

      {currentTab === 'settings' && (
        <div className="flex-1 bg-slate-950 py-4 text-gray-900">
          <AccountSettings
            user={user}
            githubToken={githubToken}
            onUpdateGithubToken={handleUpdateGithubToken}
            onLogout={handleLogout}
            onDeleteAccount={() => {
              handleLogout();
              setCurrentTab('landing');
            }}
            onSwitchAccount={handleSwitchGitHubAccount}
            onOpenAddModal={() => setIsAddGitHubModalOpen(true)}
            onRemoveAccount={handleRemoveGitHubAccount}
          />
        </div>
      )}

      {currentTab === 'usage' && (
        <div className="flex-1 bg-slate-950 py-4 text-gray-900">
          <UsageView user={user} onNavigateTab={(tab) => setCurrentTab(tab)} />
        </div>
      )}

      {(currentTab === 'privacy' || currentTab === 'terms' || currentTab === 'support') && (
        <div className="flex-1 bg-slate-950 py-4 text-gray-900">
          <LegalViews view={currentTab} />
        </div>
      )}

      {currentTab === 'admin' && (
        <div className="flex-1 bg-slate-950">
          <AdminView currentUser={user} onNavigateTab={(tab) => setCurrentTab(tab)} />
        </div>
      )}

      {currentTab === 'repos' && (
        <div className="flex-1 bg-slate-950 max-w-5xl mx-auto w-full py-8 px-4 sm:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FolderGit2 className="w-6 h-6 text-blue-400" />
              <span>Connected Repositories</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Select a repository to link with your ZIP source workspace.</p>
          </div>
          <RepoSelector
            user={user}
            githubToken={githubToken}
            selectedRepo={selectedRepo}
            targetBranch={targetBranch}
            onSelectRepo={(repo) => {
              handleSelectRepo(repo);
              setCurrentTab('workspace');
            }}
            onChangeBranch={(b) => setTargetBranch(b)}
            onOpenAuth={() => handleOpenAuthModal('login')}
            onSwitchAccount={handleSwitchGitHubAccount}
            onOpenAddModal={() => setIsAddGitHubModalOpen(true)}
            onRemoveAccount={handleRemoveGitHubAccount}
          />
        </div>
      )}

      {currentTab === 'history' && (
        <div className="flex-1 bg-slate-950 max-w-5xl mx-auto w-full py-8 px-4 sm:px-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Sync Audit Log History</h1>
            <p className="text-xs text-slate-400 mt-1">Timestamped history of selective GitHub commits and tree pushes.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            {syncLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No GitHub synchronization logs recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {syncLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-400 font-mono">{log.repoFullName} ({log.branch})</span>
                      <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-200 font-medium">{log.commitMessage}</p>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-800/80">
                      <span>Changed Files: {log.changedFilesCount} (+{log.addedFilesCount} / -{log.deletedFilesCount})</span>
                      {log.commitUrl && (
                        <a href={log.commitUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          View on GitHub &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {currentTab === 'preview' && (
        <AppletPreviewView
          extractedFiles={extractedFiles}
          onUpdateFileContent={handleUpdateFileContent}
          onFilesExtracted={handleFilesExtracted}
          onNavigateTab={(tab) => setCurrentTab(tab)}
        />
      )}

      {/* Main Studio Workspace Tab */}
      {currentTab === 'workspace' && (
        <div className="flex-1 flex flex-col bg-[#F9FAFB] text-gray-900 min-h-0">
          
          {/* Studio Hero Bar */}
          <div className="bg-white border-b border-gray-200 py-3.5 sm:py-5 px-3 sm:px-6 lg:px-8 shadow-2xs">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <span>GitHub Smart Code Sync</span>
                  <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                    Delta Engine
                  </span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 max-w-2xl hidden sm:block">
                  Upload any source code <strong className="text-gray-800 font-semibold">.ZIP file</strong>. The app extracts code, compares changes against GitHub, and pushes <strong className="text-blue-600 font-semibold">only modified/added files</strong>!
                </p>
              </div>

              {!githubToken && (
                <button
                  type="button"
                  onClick={() => handleOpenAuthModal('login')}
                  className="px-3.5 py-1.5 sm:py-2 bg-[#24292F] hover:bg-black text-white font-medium text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <GitBranch className="w-3.5 h-3.5" /> Connect GitHub PAT
                </button>
              )}
            </div>
          </div>

          {/* Step Navigation Pill Bar */}
          <div className="bg-slate-900 border-b border-slate-800 sticky top-[56px] sm:top-[64px] z-30 shadow-md">
            <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2">
              
              {/* Step Tabs / Pills */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => { setActiveStep(1); setViewMode('step'); }}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    activeStep === 1 && viewMode === 'step'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <FileArchive className="w-3.5 h-3.5 text-blue-300" />
                  <span>1. ZIP & Repo</span>
                  {extractedFiles.size > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveStep(2); setViewMode('step'); }}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    activeStep === 2 && viewMode === 'step'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5 text-amber-300" />
                  <span>2. Diff & Sync</span>
                  {fileDiffs.filter(d => d.status !== 'unchanged').length > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] font-mono rounded-full border border-amber-500/30">
                      {fileDiffs.filter(d => d.status !== 'unchanged').length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveStep(3); setViewMode('step'); }}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    activeStep === 3 && viewMode === 'step'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-emerald-300" />
                  <span>3. Code Editor</span>
                </button>
              </div>

              {/* View Mode Switcher Button */}
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'step' ? 'all' : 'step')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0 border border-slate-700"
                title={viewMode === 'step' ? 'Switch to view all sections on one page' : 'Switch to step-by-step slider'}
              >
                {viewMode === 'step' ? (
                  <>
                    <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Show All</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Step View</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main Content Workspace Slide Stage */}
          <main
            onTouchStart={(e) => {
              setTouchStartX(e.touches[0].clientX);
            }}
            onTouchEnd={(e) => {
              if (touchStartX === null) return;
              const touchEndX = e.changedTouches[0].clientX;
              const diff = touchStartX - touchEndX;
              if (Math.abs(diff) > 50 && viewMode === 'step') {
                if (diff > 0 && activeStep < 3) {
                  setActiveStep((prev) => (prev + 1) as 1 | 2 | 3);
                } else if (diff < 0 && activeStep > 1) {
                  setActiveStep((prev) => (prev - 1) as 1 | 2 | 3);
                }
              }
              setTouchStartX(null);
            }}
            className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-5"
          >
            {/* View Mode: STEP SLIDER */}
            {viewMode === 'step' ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                
                {/* STEP 1: Upload ZIP & Select GitHub Repo */}
                {activeStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <ZipUploader
                        onFilesExtracted={handleFilesExtracted}
                        isExtracting={isExtracting}
                        extractedCount={extractedFiles ? extractedFiles.size : 0}
                        currentZipName={zipName}
                        extractionMeta={extractionMeta}
                        onOpenPreview={() => setCurrentTab('preview')}
                      />

                      <RepoSelector
                        user={user}
                        githubToken={githubToken}
                        selectedRepo={selectedRepo}
                        targetBranch={targetBranch}
                        onSelectRepo={handleSelectRepo}
                        onChangeBranch={(b) => {
                          setTargetBranch(b);
                          if (extractedFiles.size > 0 && githubToken && selectedRepo) {
                            handleRunDiff(extractedFiles, githubToken, selectedRepo, b);
                          }
                        }}
                        onOpenAuth={() => handleOpenAuthModal('login')}
                        onSwitchAccount={handleSwitchGitHubAccount}
                        onOpenAddModal={() => setIsAddGitHubModalOpen(true)}
                        onRemoveAccount={handleRemoveGitHubAccount}
                      />
                    </div>

                    {/* Step 1 Slide Footer */}
                    <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between gap-3">
                      <div className="text-xs text-gray-500 font-medium">
                        Step 1 of 3: <span className="text-gray-900 font-semibold">Upload ZIP & Select Destination Repository</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveStep(2)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                      >
                        <span>Step 2: Compare Diffs</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Smart Diff & Target Push Panel */}
                {activeStep === 2 && (
                  <div className="space-y-4">
                    <DiffViewer
                      diffs={fileDiffs}
                      isDiffing={isDiffing}
                      isPushing={isPushing}
                      selectedRepo={selectedRepo}
                      targetBranch={targetBranch}
                      onRunDiff={() => handleRunDiff()}
                      onOpenPushModal={handleOpenPushModal}
                      onSelectFileForInspector={(p) => setInspectorPath(p)}
                    />

                    {/* Step 2 Slide Footer Navigation */}
                    <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveStep(1)}
                        className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer shrink-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Step 1: Source ZIP</span>
                      </button>

                      <div className="text-xs text-gray-500 font-medium hidden sm:block">
                        Swipe or click to navigate steps
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveStep(3)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer shadow-xs shrink-0"
                      >
                        <span>Step 3: Code Editor</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Live Code Editor Workspace */}
                {activeStep === 3 && (
                  <div className="space-y-4">
                    <CodeWorkspace
                      files={extractedFiles}
                      selectedPath={inspectorPath}
                      onSelectPath={(p) => setInspectorPath(p)}
                      onUpdateFileContent={handleUpdateFileContent}
                      onOpenPreview={() => setCurrentTab('preview')}
                    />

                    {/* Step 3 Slide Footer Navigation */}
                    <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveStep(2)}
                        className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer shrink-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Step 2: Compare Diffs</span>
                      </button>

                      <div className="text-xs text-gray-500 font-medium">
                        Step 3 of 3: <span className="text-gray-900 font-semibold">Live Workspace Editor</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* View Mode: FULL EXPANDED PAGE */
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ZipUploader
                    onFilesExtracted={handleFilesExtracted}
                    isExtracting={isExtracting}
                    extractedCount={extractedFiles ? extractedFiles.size : 0}
                    currentZipName={zipName}
                    extractionMeta={extractionMeta}
                    onOpenPreview={() => setCurrentTab('preview')}
                  />

                  <RepoSelector
                    user={user}
                    githubToken={githubToken}
                    selectedRepo={selectedRepo}
                    targetBranch={targetBranch}
                    onSelectRepo={handleSelectRepo}
                    onChangeBranch={(b) => {
                      setTargetBranch(b);
                      if (extractedFiles.size > 0 && githubToken && selectedRepo) {
                        handleRunDiff(extractedFiles, githubToken, selectedRepo, b);
                      }
                    }}
                    onOpenAuth={() => handleOpenAuthModal('login')}
                    onSwitchAccount={handleSwitchGitHubAccount}
                    onOpenAddModal={() => setIsAddGitHubModalOpen(true)}
                    onRemoveAccount={handleRemoveGitHubAccount}
                  />
                </div>

                <DiffViewer
                  diffs={fileDiffs}
                  isDiffing={isDiffing}
                  isPushing={isPushing}
                  selectedRepo={selectedRepo}
                  targetBranch={targetBranch}
                  onRunDiff={() => handleRunDiff()}
                  onOpenPushModal={handleOpenPushModal}
                  onSelectFileForInspector={(p) => setInspectorPath(p)}
                />

                <CodeWorkspace
                  files={extractedFiles}
                  selectedPath={inspectorPath}
                  onSelectPath={(p) => setInspectorPath(p)}
                  onUpdateFileContent={handleUpdateFileContent}
                  onOpenPreview={() => setCurrentTab('preview')}
                />
              </div>
            )}

          </main>
        </div>
      )}

      {/* Global Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-5 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>SourceLink.ai &copy; {new Date().getFullYear()} — Public SaaS & Android App</p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <button onClick={() => setCurrentTab('privacy')} className="hover:text-white cursor-pointer">Privacy Policy</button>
            <button onClick={() => setCurrentTab('terms')} className="hover:text-white cursor-pointer">Terms of Service</button>
            <button onClick={() => setCurrentTab('support')} className="hover:text-white cursor-pointer">Support</button>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        onOpenTokenHelp={() => {
          setIsAuthOpen(false);
          setIsTokenHelpOpen(true);
        }}
      />

      <TokenHelpModal
        isOpen={isTokenHelpOpen}
        onClose={() => setIsTokenHelpOpen(false)}
      />

      <SyncLogs
        isOpen={isSyncLogsOpen}
        onClose={() => setIsSyncLogsOpen(false)}
        logs={syncLogs}
      />

      <PushConfirmModal
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
        selectedRepo={selectedRepo}
        targetBranch={targetBranch}
        selectedDiffs={pushPayload.selectedDiffs || []}
        defaultCommitMessage={pushPayload.commitMessage || ''}
        onConfirmPush={handleExecutePush}
        githubToken={githubToken}
        initialRemoteHeadSha={remoteHeadSha}
      />

      <AddGitHubAccountModal
        isOpen={isAddGitHubModalOpen}
        user={user}
        onClose={() => setIsAddGitHubModalOpen(false)}
        onSuccess={handleAddGitHubAccountSuccess}
      />

        </>
      )}

    </div>
  );
}
