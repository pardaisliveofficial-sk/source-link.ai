import React, { useState, useEffect } from 'react';
import { GitFork, Plus, ExternalLink, Lock, Globe, Search, RefreshCw, FolderGit2, Check, AlertCircle } from 'lucide-react';
import { getUserRepos, createRepository } from '../lib/github';
import { GitHubRepo, User } from '../types';
import { GitHubAccountSwitcher } from './GitHubAccountSwitcher';

interface RepoSelectorProps {
  user?: User | null;
  githubToken: string | null;
  selectedRepo: GitHubRepo | null;
  targetBranch: string;
  onSelectRepo: (repo: GitHubRepo) => void;
  onChangeBranch: (branch: string) => void;
  onOpenAuth: () => void;
  onSwitchAccount?: (accountId: string) => void;
  onOpenAddModal?: () => void;
  onRemoveAccount?: (accountId: string) => void;
}

export const RepoSelector: React.FC<RepoSelectorProps> = ({
  user,
  githubToken,
  selectedRepo,
  targetBranch,
  onSelectRepo,
  onChangeBranch,
  onOpenAuth,
  onSwitchAccount,
  onOpenAddModal,
  onRemoveAccount
}) => {
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // New repo form
  const [newRepoName, setNewRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch repositories when token exists
  const fetchRepos = async () => {
    if (!githubToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserRepos(githubToken);
      setRepos(data);
    } catch (err: any) {
      setError(`Failed to load repositories: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (githubToken) {
      fetchRepos();
    }
  }, [githubToken]);

  const handleCreateRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken) {
      onOpenAuth();
      return;
    }
    if (!newRepoName.trim()) {
      setError('Please enter a repository name.');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const newRepo = await createRepository(
        githubToken,
        newRepoName.trim(),
        isPrivate,
        description.trim() || 'Created with GitSync Studio'
      );
      setRepos([newRepo, ...repos]);
      onSelectRepo(newRepo);
      setNewRepoName('');
      setDescription('');
      setActiveTab('existing');
    } catch (err: any) {
      setError(`Repository creation failed: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredRepos = repos.filter(
    r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">2. Select or Create GitHub Repo</h3>
            <p className="text-xs text-gray-500">Destination repository for diff pushing</p>
          </div>
        </div>

        {/* Account Switcher or GitHub Link */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onSwitchAccount && onOpenAddModal && githubToken && (
            <GitHubAccountSwitcher
              user={user || null}
              activeToken={githubToken}
              activeUsername={user?.githubUsername}
              onSwitchAccount={onSwitchAccount}
              onOpenAddModal={onOpenAddModal}
              onRemoveAccount={onRemoveAccount}
              variant="light"
            />
          )}

          {selectedRepo && (
            <a
              href={selectedRepo.html_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline font-medium"
            >
              Open on GitHub <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {!githubToken ? (
        /* Token required state */
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-center space-y-3">
          <p className="text-xs text-gray-600">
            Connect your GitHub token to view your existing repositories or create a new one.
          </p>
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 bg-[#24292F] hover:bg-black text-white text-xs font-medium rounded-md transition-colors shadow-xs cursor-pointer"
          >
            Connect GitHub Token
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Currently Selected Card */}
          {selectedRepo && (
            <div className="bg-gray-50 border border-blue-200 rounded-lg p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
                  <GitFork className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900 truncate">{selectedRepo.full_name}</span>
                    {selectedRepo.private ? (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-[10px] rounded flex items-center gap-1 font-semibold">
                        <Lock className="w-2.5 h-2.5" /> Private
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-800 border border-green-200 text-[10px] rounded flex items-center gap-1 font-semibold">
                        <Globe className="w-2.5 h-2.5" /> Public
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                    <span>Branch:</span>
                    <input
                      type="text"
                      value={targetBranch || ''}
                      onChange={(e) => onChangeBranch(e.target.value)}
                      placeholder="main"
                      className="bg-white border border-gray-300 px-2 py-0.5 rounded text-xs text-blue-700 font-mono w-24 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => fetchRepos()}
                className="p-2 text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 rounded-md transition-colors cursor-pointer"
                title="Refresh Repositories"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            <button
              onClick={() => setActiveTab('existing')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'existing'
                  ? 'bg-[#24292F] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Select Existing Repo ({repos.length})
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'new'
                  ? 'bg-[#24292F] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Plus className="w-3 h-3" /> Create New Repo
            </button>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab 1: Select Existing */}
          {activeTab === 'existing' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search repositories..."
                  className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              {isLoading ? (
                <div className="py-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Loading your GitHub repositories...
                </div>
              ) : filteredRepos.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No matching repositories found.</p>
              ) : (
                <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {filteredRepos.map((r) => {
                    const isSelected = selectedRepo?.id === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => onSelectRepo(r)}
                        className={`w-full text-left p-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-between border ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-950 font-semibold'
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-800'
                        }`}
                      >
                        <div className="truncate min-w-0 pr-2">
                          <div className="font-semibold text-xs flex items-center gap-1.5 truncate">
                            {r.full_name}
                            {r.private && <Lock className="w-3 h-3 text-amber-600 shrink-0" />}
                          </div>
                          {r.description && (
                            <p className="text-[10px] text-gray-500 truncate mt-0.5">{r.description}</p>
                          )}
                        </div>

                        {isSelected && (
                          <span className="p-1 bg-blue-600 text-white rounded-full shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Create New Repo */}
          {activeTab === 'new' && (
            <form onSubmit={handleCreateRepo} className="space-y-3 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Repository Name</label>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="e.g. my-awesome-project"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short project description..."
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-gray-700 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={!isPrivate}
                    onChange={() => setIsPrivate(false)}
                    className="accent-blue-600"
                  />
                  <Globe className="w-3.5 h-3.5 text-green-600" /> Public
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={isPrivate}
                    onChange={() => setIsPrivate(true)}
                    className="accent-blue-600"
                  />
                  <Lock className="w-3.5 h-3.5 text-amber-600" /> Private
                </label>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full mt-2 py-2 bg-[#24292F] hover:bg-black text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isCreating ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Create & Connect Repository
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      )}

    </div>
  );
};
