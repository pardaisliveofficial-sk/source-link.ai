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

import { getStoredUser, setStoredUser, getStoredGitHubToken, setStoredGitHubToken } from './lib/auth';
import { computeDiffsWithGitHub, pushChangesToGitHub } from './lib/github';
import { User, ExtractedFile, FileDiff, GitHubRepo, SyncLog } from './types';
import { ZipExtractionResult } from './lib/zipExtractor';
import { Sparkles, ArrowRight, Github, FolderTree, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function App() {
  // Application State
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

    setSyncLogs([newLog, ...syncLogs]);
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
    showToast(`Signed in as ${authenticatedUser.name}`);
  };

  const handleLogout = () => {
    setUser(null);
    setGithubToken(null);
    setStoredUser(null);
    setStoredGitHubToken(null);
    setSelectedRepo(null);
    showToast('Logged out');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-200 ${
          toastMessage.type === 'success'
            ? 'bg-white border-green-200 text-green-800'
            : 'bg-white border-red-200 text-red-800'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Sparkles className="w-4 h-4 text-red-500" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <Header
        user={user}
        githubToken={githubToken}
        githubUsername={user?.githubUsername}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenTokenHelp={() => setIsTokenHelpOpen(true)}
        onOpenSyncLogs={() => setIsSyncLogsOpen(true)}
        onLogout={handleLogout}
      />

      {/* Hero Intro Bar */}
      <div className="bg-white border-b border-gray-200 py-6 px-4 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
              GitHub Smart Code Sync
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                Delta Engine
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
              Upload any source code <strong className="text-gray-800 font-semibold">.ZIP file</strong>. The app automatically extracts the code, compares changes against your GitHub repository, and pushes <strong className="text-blue-600 font-semibold">only modified/added files</strong>!
            </p>
          </div>

          {!githubToken && (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-4 py-2.5 bg-[#24292F] hover:bg-black text-white font-medium text-xs rounded-md shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Github className="w-4 h-4" /> Connect GitHub
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        
        {/* Step 1 & 2 Grid: ZIP Upload & GitHub Repo Picker */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ZipUploader
            onFilesExtracted={handleFilesExtracted}
            isExtracting={isExtracting}
            extractedCount={extractedFiles ? extractedFiles.size : 0}
            currentZipName={zipName}
            extractionMeta={extractionMeta}
          />

          <RepoSelector
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
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        </div>

        {/* Step 3: Smart Diff & Target Push Panel */}
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

        {/* Step 4: Live Code Editor Workspace */}
        <CodeWorkspace
          files={extractedFiles}
          selectedPath={inspectorPath}
          onSelectPath={(p) => setInspectorPath(p)}
          onUpdateFileContent={handleUpdateFileContent}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-5 px-4 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>SourceLink.ai — Powered by GitHub API v3 & Smart Code Sync Engine</p>
          <p className="flex items-center gap-1.5 text-gray-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-green-600" /> Secure in-memory extraction & OAuth / PAT auth
          </p>
        </div>
      </footer>

      {/* Modals */}
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

    </div>
  );
}
