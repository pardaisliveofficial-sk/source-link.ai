import React from 'react';
import { X, ExternalLink, Key, CheckCircle2, Copy } from 'lucide-react';

interface TokenHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TokenHelpModal: React.FC<TokenHelpModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const copyUrl = () => {
    navigator.clipboard.writeText('https://github.com/settings/tokens/new?scopes=repo,user&description=SourceLink.ai');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-6 text-gray-900 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">How to Get a GitHub Access Token</h3>
            <p className="text-xs text-gray-500">Personal Access Token (PAT) setup guide</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-gray-700">
          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 space-y-2">
            <p className="font-semibold text-gray-900 flex items-center gap-2 text-xs">
              <span className="w-5 h-5 rounded-full bg-[#24292F] text-white text-xs flex items-center justify-center font-bold">1</span>
              Open GitHub Token Settings
            </p>
            <p className="text-xs text-gray-500">
              Click the button below to go directly to GitHub's token generator with pre-filled scopes.
            </p>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo,user&description=SourceLink.ai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors shadow-xs"
            >
              Open GitHub Token Generator
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 space-y-2">
            <p className="font-semibold text-gray-900 flex items-center gap-2 text-xs">
              <span className="w-5 h-5 rounded-full bg-[#24292F] text-white text-xs flex items-center justify-center font-bold">2</span>
              Select <code className="bg-gray-200 px-1.5 py-0.5 rounded text-blue-700 font-mono text-xs">repo</code> Scope
            </p>
            <p className="text-xs text-gray-500">
              Ensure the <span className="text-blue-600 font-semibold">repo</span> checkbox (Full control of private repositories) is enabled so the app can fetch code diffs and push updates.
            </p>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 space-y-2">
            <p className="font-semibold text-gray-900 flex items-center gap-2 text-xs">
              <span className="w-5 h-5 rounded-full bg-[#24292F] text-white text-xs flex items-center justify-center font-bold">3</span>
              Generate & Copy Token
            </p>
            <p className="text-xs text-gray-500">
              Scroll down, click <strong className="text-gray-900">Generate token</strong>, copy the generated token starting with <code className="bg-gray-200 px-1 py-0.5 rounded text-xs text-amber-800 font-mono">ghp_</code>, and paste it into SourceLink.ai!
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-200">
          <button
            onClick={copyUrl}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors font-medium cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-green-600">URL Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Generator Link</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-md text-xs font-medium transition-colors cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
