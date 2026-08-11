import React from 'react';
import { 
  GitBranch, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  ArrowRight, 
  Github, 
  Lock, 
  FileCode, 
  RefreshCw,
  HelpCircle,
  Layers,
  Award
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onConnectGitHub: () => void;
  onViewPricing: () => void;
  onViewPrivacy: () => void;
  onViewTerms: () => void;
  onViewSupport: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onConnectGitHub,
  onViewPricing,
  onViewPrivacy,
  onViewTerms,
  onViewSupport
}) => {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>SourceLink.ai v2.0 — Public SaaS & Native Android App</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Sync ZIP Code Exports to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">GitHub Repos</span> Instantly
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
              Eliminate manual file copying and accidental repo overwrites. SourceLink extracts ZIP source files, runs client-side smart AST-level diffs, and pushes selective incremental commits to your GitHub repositories.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch App Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onConnectGitHub}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Github className="w-4 h-4" />
                <span>Connect GitHub Account</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Ephemeral In-Memory Processing</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-400" /> Selective Incremental Pushes</span>
              <span className="flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-blue-400" /> Web + Android Ready</span>
            </div>
          </div>

          {/* Interactive Workflow Visualizer / Demo Preview */}
          <div className="mt-14 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-xl max-w-5xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-semibold text-slate-300">SourceLink.ai — Live Delta Pipeline</span>
              </div>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">Real-time Comparison</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {/* Step 1 */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-blue-400 mb-2">
                  <span>STEP 01</span>
                  <Upload className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">Upload ZIP Export</h4>
                <p className="text-xs text-slate-400 mt-1">Upload any project ZIP export from v0, Cursor, Replit, or local IDE.</p>
                <div className="mt-3 p-2.5 bg-slate-900 rounded border border-slate-800 font-mono text-[11px] text-slate-300 flex items-center justify-between">
                  <span>project_v2_export.zip</span>
                  <span className="text-emerald-400 font-bold">14.2 MB</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-400 mb-2">
                  <span>STEP 02</span>
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">Smart Delta Analysis</h4>
                <p className="text-xs text-slate-400 mt-1">Compares ZIP SHA checksums line-by-line against GitHub branch target.</p>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-mono">
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">+4 Added</span>
                  <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded">~12 Modified</span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded">140 Unchanged</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-400 mb-2">
                  <span>STEP 03</span>
                  <GitBranch className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">Selective Push & Commit</h4>
                <p className="text-xs text-slate-400 mt-1">Select exact files to commit without overwriting unrelated branch changes.</p>
                <div className="mt-3 p-2 bg-blue-950/40 border border-blue-800/60 rounded text-[11px] text-blue-300 flex items-center justify-between font-mono">
                  <span>Commit: Sync 16 modified files</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 border-b border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">Built for Developers, AI Builders & SaaS Teams</h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400">Everything you need to keep your GitHub repositories in sync with generated code exports.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <FileCode className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">ZIP Tree Preservation</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Supports deeply nested folder hierarchies, binary images, assets, and respects root or custom sub-folder structures seamlessly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Selective File Checkbox</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Review line diffs in unified or side-by-side view. Choose to push all changes or select individual files with one click.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Secure OAuth & Tokens</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Connect via official GitHub OAuth or Personal Access Tokens (PAT). Credentials are processed client-side and never saved permanently.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Native Android App</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Fully optimized Capacitor mobile app with file picker support, back-button handling, and responsive touch controls.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Conflict Detection</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Checks remote branch state before committing to prevent destructive race conditions or losing commits made by team members.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Audit & Sync Logs</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Track every sync operation with commit SHAs, file addition counts, deletion metrics, and direct links to GitHub commits.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-20 bg-slate-900/40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">Flexible SaaS Subscription Plans</h2>
          <p className="mt-3 text-slate-400 text-sm max-w-xl mx-auto">Start free and scale as your projects grow with transparent usage limits.</p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
            
            {/* Free */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Free Developer</h3>
                <p className="text-xs text-slate-400 mt-1">For casual builders and students</p>
                <div className="mt-4 text-3xl font-extrabold text-white">$0 <span className="text-xs font-normal text-slate-400">/ month</span></div>
                
                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> 10 Syncs per month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Up to 50MB ZIP uploads</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Unified Line Diff Viewer</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Android App access</li>
                </ul>
              </div>

              <button
                onClick={onGetStarted}
                className="mt-8 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-950/60 to-slate-950 border-2 border-blue-500 relative flex flex-col justify-between shadow-xl shadow-blue-500/10">
              <div className="absolute -top-3 right-6 px-3 py-0.5 bg-blue-600 text-white text-[10px] font-bold tracking-wider uppercase rounded-full">Popular</div>
              <div>
                <h3 className="text-lg font-bold text-white">Pro SaaS Builder</h3>
                <p className="text-xs text-slate-300 mt-1">For full-time developers and creators</p>
                <div className="mt-4 text-3xl font-extrabold text-white">$19 <span className="text-xs font-normal text-slate-400">/ month</span></div>

                <ul className="mt-6 space-y-3 text-xs text-slate-200">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Unlimited Code Syncs</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Up to 200MB ZIP uploads</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Side-by-Side Diff Inspector</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Priority GitHub API Sync</li>
                </ul>
              </div>

              <button
                onClick={onViewPricing}
                className="mt-8 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors cursor-pointer text-center"
              >
                Upgrade to Pro
              </button>
            </div>

            {/* Business */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Business & Teams</h3>
                <p className="text-xs text-slate-400 mt-1">For organizations and agencies</p>
                <div className="mt-4 text-3xl font-extrabold text-white">$49 <span className="text-xs font-normal text-slate-400">/ month</span></div>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> Multi-user Admin Panel</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> Custom GitHub OAuth App</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> Branch Protection Rules Audit</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> Dedicated 24/7 SLA Support</li>
                </ul>
              </div>

              <button
                onClick={onViewPricing}
                className="mt-8 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
              >
                Explore Business Plan
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 border-b border-slate-800 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">Got questions? We've got answers.</p>
          </div>

          <div className="space-y-4 text-left">
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                Does SourceLink permanently store my source code files?
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                No. SourceLink processes all ZIP files in ephemeral memory or client-side JavaScript. Files are extracted, diffed against GitHub, and discarded immediately after the push operation completes.
              </p>
            </div>

            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                Can I use SourceLink on my Android phone or tablet?
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Yes! SourceLink.ai is fully responsive on mobile browsers and includes full Capacitor Android project configuration so you can build and run it directly as a native Android app.
              </p>
            </div>

            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                Will pushing a ZIP overwrite my entire repository?
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                No! SourceLink performs delta comparison. Only the files you select in the diff view are committed to GitHub. Unmodified repository files remain completely untouched.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 text-slate-500 text-xs border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-slate-200 text-sm">SourceLink.ai</span>
            <span>— Smart GitHub Code Sync & SaaS Platform</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <button onClick={onViewPrivacy} className="hover:text-slate-300 transition-colors cursor-pointer">Privacy Policy</button>
            <button onClick={onViewTerms} className="hover:text-slate-300 transition-colors cursor-pointer">Terms of Service</button>
            <button onClick={onViewSupport} className="hover:text-slate-300 transition-colors cursor-pointer">Support & Contact</button>
            <button onClick={onViewPricing} className="hover:text-slate-300 transition-colors cursor-pointer">Pricing</button>
          </div>

          <div>© {new Date().getFullYear()} SourceLink.ai. All rights reserved.</div>
        </div>
      </footer>

    </div>
  );
};
