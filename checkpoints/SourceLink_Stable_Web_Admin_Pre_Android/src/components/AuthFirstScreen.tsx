import React, { useState } from 'react';
import { 
  GitBranch, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Key, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Github, 
  Sparkles,
  Zap,
  Smartphone,
  ExternalLink,
  FileText
} from 'lucide-react';
import { loginEmailUserApi, registerEmailUserApi, connectGitHubAccountApi, loginGoogleUser } from '../lib/auth';
import { getGitHubUser } from '../lib/github';
import { User } from '../types';

interface AuthFirstScreenProps {
  onAuthSuccess: (user: User, token?: string) => void;
  onViewTerms: () => void;
  onViewPrivacy: () => void;
}

export const AuthFirstScreen: React.FC<AuthFirstScreenProps> = ({
  onAuthSuccess,
  onViewTerms,
  onViewPrivacy
}) => {
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [githubTokenInput, setGithubTokenInput] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [useGithubToken, setUseGithubToken] = useState(false);

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle Email & Password Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (authMode === 'signup' && !acceptedTerms) {
      setError('You must accept the Terms of Service and Privacy Policy to create an account.');
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (!email.trim()) throw new Error('Please enter a valid email address.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters long.');

        const result = await registerEmailUserApi(name.trim(), email.trim(), password);
        setSuccessMsg('Account created successfully! Proceeding to email verification...');
        
        setTimeout(() => {
          onAuthSuccess(result.user);
        }, 600);
      } else {
        if (!email.trim() || !password) throw new Error('Please enter your email and password.');

        const user = await loginEmailUserApi(email.trim(), password);
        setSuccessMsg(`Welcome back, ${user.name || user.email}!`);
        
        setTimeout(() => {
          onAuthSuccess(user, user.githubToken);
        }, 600);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle GitHub Direct PAT Sign-In
  const handleGithubTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!githubTokenInput.trim()) {
      setError('Please enter a valid GitHub Personal Access Token.');
      return;
    }

    setIsLoading(true);
    try {
      const token = githubTokenInput.trim();
      const ghProfile = await getGitHubUser(token);
      const userEmail = email.trim() || `${ghProfile.login}@users.noreply.github.com`;

      const user = await connectGitHubAccountApi(userEmail, token, ghProfile.login).catch(() => {
        return {
          id: 'usr_' + Date.now(),
          name: ghProfile.login,
          email: userEmail,
          authProvider: 'email' as const,
          githubToken: token,
          githubUsername: ghProfile.login,
          emailVerified: true
        };
      });

      setSuccessMsg(`Authenticated as GitHub user @${ghProfile.login}`);
      setTimeout(() => {
        onAuthSuccess(user, token);
      }, 600);
    } catch (err: any) {
      setError(`GitHub validation failed: ${err.message}. Ensure token has 'repo' permission.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      
      {/* Subtle Ambient Background Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-indigo-600/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10 flex-1 flex flex-col justify-center">
        
        {/* Brand Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <GitBranch className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">SourceLink<span className="text-blue-500">.ai</span></span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {authMode === 'signup' ? 'Create Your SourceLink Account' : 'Sign In to SourceLink.ai'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Automated ZIP Code Export Sync Engine & AST-Level GitHub Deployment Platform.
          </p>
        </div>

        {/* Central Auth Box */}
        <div className="max-w-md mx-auto w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative">
          
          {/* Tabs: Sign Up vs Log In */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account (Sign Up)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In (Log In)
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!useGithubToken ? (
            /* Email / Password Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required={authMode === 'signup'}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              {authMode === 'signup' && (
                <div className="pt-1">
                  <label className="flex items-start gap-2 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      I agree to the{' '}
                      <button type="button" onClick={onViewTerms} className="text-blue-400 hover:underline">
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button type="button" onClick={onViewPrivacy} className="text-blue-400 hover:underline">
                        Privacy Policy
                      </button>
                      . Your credentials remain strictly encrypted and persistent.
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Processing...' : authMode === 'signup' ? 'Create Account & Verify Email' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          ) : (
            /* GitHub Token Direct Connect Form */
            <form onSubmit={handleGithubTokenSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">GitHub Personal Access Token (PAT)</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={githubTokenInput}
                    onChange={(e) => setGithubTokenInput(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Requires classic token or fine-grained token with 'repo' scope.</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Github className="w-4 h-4" />
                <span>{isLoading ? 'Validating Token...' : 'Authenticate with GitHub Token'}</span>
              </button>
            </form>
          )}

          {/* Alternative Connection Options */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setUseGithubToken(!useGithubToken)}
              className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Github className="w-3.5 h-3.5" />
              <span>{useGithubToken ? 'Use Email & Password' : 'Sign In with GitHub PAT Token'}</span>
            </button>
          </div>

          {/* Security Banner */}
          <div className="mt-6 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Persistent session — stays logged in until you choose to log out.</span>
          </div>

        </div>

        {/* Feature Highlights beneath Auth Box */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-center">
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-xs">
            <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="font-bold text-white block">AST Incremental Diffs</span>
            <span className="text-slate-400 text-[11px]">Compare ZIP exports against branch head SHA</span>
          </div>
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="font-bold text-white block">In-Memory Engine</span>
            <span className="text-slate-400 text-[11px]">Zero raw code saved on backend servers</span>
          </div>
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-xs">
            <Smartphone className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <span className="font-bold text-white block">Cross-Platform Sync</span>
            <span className="text-slate-400 text-[11px]">Web browser & Native Android APK/AAB</span>
          </div>
        </div>

      </div>

      {/* Footer Legal & Support */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 px-4 relative z-10 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 SourceLink.ai — Enterprise Code Sync Platform</span>
          <div className="flex items-center gap-4">
            <button onClick={onViewTerms} className="hover:text-slate-300 transition underline cursor-pointer">
              Terms of Service
            </button>
            <button onClick={onViewPrivacy} className="hover:text-slate-300 transition underline cursor-pointer">
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
