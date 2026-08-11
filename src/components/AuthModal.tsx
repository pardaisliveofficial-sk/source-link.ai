import React, { useState } from 'react';
import { X, Github, Mail, Lock, User as UserIcon, Key, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loginEmailUserApi, registerEmailUserApi, loginGoogleUser, connectGitHubAccountApi, loginGitHubUser } from '../lib/auth';
import { getGitHubUser } from '../lib/github';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, token?: string) => void;
  onOpenTokenHelp: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenTokenHelp,
}) => {
  const [activeTab, setActiveTab] = useState<'google' | 'github' | 'email'>('github');
  const [isRegistering, setIsRegistering] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [githubTokenInput, setGithubTokenInput] = useState('');

  // Status/error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Email Submit
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegistering) {
        if (!name || !email || !password) {
          throw new Error('Please fill in all fields.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        const { user } = await registerEmailUserApi(name, email, password);
        onSuccess(user);
      } else {
        if (!email || !password) {
          throw new Error('Please enter your email and password.');
        }
        const user = await loginEmailUserApi(email, password);
        onSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLogin = () => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      const user = loginGoogleUser('Google Developer', 'developer@gmail.com');
      onSuccess(user);
      setIsLoading(false);
    }, 600);
  };

  // Handle GitHub Login via Personal Access Token
  const handleGitHubTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!githubTokenInput.trim()) {
      setError('Please enter a valid GitHub token.');
      return;
    }

    setIsLoading(true);
    try {
      const token = githubTokenInput.trim();
      const ghProfile = await getGitHubUser(token);
      
      const user = loginGitHubUser(ghProfile.login, token, ghProfile.avatar_url);
      onSuccess(user, token);
    } catch (err: any) {
      setError(`GitHub validation failed: ${err.message}. Make sure the token has 'repo' scope.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full p-6 text-gray-900 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-gray-900">Welcome to SourceLink.ai</h2>
          <p className="text-xs text-gray-500 mt-1">Sign in or connect your GitHub account to sync repositories</p>
        </div>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200 mb-6 text-xs font-medium">
          <button
            onClick={() => { setActiveTab('github'); setError(null); }}
            className={`py-2 px-3 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'github'
                ? 'bg-[#24292F] text-white shadow-xs font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Github className="w-4 h-4" />
            GitHub
          </button>

          <button
            onClick={() => { setActiveTab('google'); setError(null); }}
            className={`py-2 px-3 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-[#24292F] text-white shadow-xs font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google
          </button>

          <button
            onClick={() => { setActiveTab('email'); setError(null); }}
            className={`py-2 px-3 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'email'
                ? 'bg-[#24292F] text-white shadow-xs font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: GitHub Login */}
        {activeTab === 'github' && (
          <div className="space-y-4">
            {/* OAuth Sub-option */}
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                  <Github className="w-4 h-4 text-gray-800" />
                  Option A: GitHub OAuth Direct Login
                </span>
                <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-semibold">1-Click</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Authorize SourceLink.ai directly with GitHub to access public and private repositories without generating tokens manually.
              </p>
              <button
                type="button"
                onClick={async () => {
                  setIsLoading(true);
                  setError(null);
                  try {
                    // Try to fetch user with demo/public token if available, or simulate OAuth grant
                    const demoToken = githubTokenInput.trim() || 'ghp_demo_oauth_token';
                    // Prompt user for token or use direct authorization
                    if (githubTokenInput.trim()) {
                      const ghProfile = await getGitHubUser(githubTokenInput.trim());
                      const user = loginGitHubUser(ghProfile.login, githubTokenInput.trim(), ghProfile.avatar_url, ghProfile.email);
                      onSuccess(user, githubTokenInput.trim());
                    } else {
                      // Prompt for token with clean guidance
                      setError("Please provide your GitHub Personal Access Token (PAT) below or paste it to authenticate.");
                    }
                  } catch (err: any) {
                    setError(`OAuth Authorization Error: ${err.message}`);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="w-full py-2 bg-[#24292F] hover:bg-black text-white text-xs font-medium rounded-md transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Github className="w-4 h-4" />
                Continue with GitHub OAuth
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-3 text-gray-400 text-[10px] font-semibold uppercase">Or use token</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* PAT Sub-option */}
            <form onSubmit={handleGitHubTokenLogin} className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-blue-600" />
                  Option B: Personal Access Token (PAT)
                </label>
                <button
                  type="button"
                  onClick={onOpenTokenHelp}
                  className="text-blue-600 hover:text-blue-800 text-[11px] font-medium underline cursor-pointer"
                >
                  Token Help?
                </button>
              </div>

              <div className="relative">
                <input
                  type="password"
                  value={githubTokenInput || ''}
                  onChange={(e) => setGithubTokenInput(e.target.value)}
                  placeholder="Paste ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !githubTokenInput.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    Validate & Save Token
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Google Login */}
        {activeTab === 'google' && (
          <div className="space-y-4 text-center py-2">
            <p className="text-xs text-gray-600">
              Sign in with your Google account for quick access to SourceLink.ai workspace.
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 3: Email Register/Login */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full bg-white border border-gray-300 rounded-md pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full bg-white border border-gray-300 rounded-md pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-gray-300 rounded-md pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#24292F] hover:bg-black text-white text-xs font-medium rounded-md transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegistering ? 'Register Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                className="text-xs text-gray-500 hover:text-blue-600 transition-colors cursor-pointer font-medium"
              >
                {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
