import React, { useState } from 'react';
import { Shield, FileText, Send, CheckCircle2, MessageSquare } from 'lucide-react';

interface LegalViewsProps {
  view: 'privacy' | 'terms' | 'support';
}

export const LegalViews: React.FC<LegalViewsProps> = ({ view }) => {
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportEmail || !supportMessage) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSupportName('');
      setSupportEmail('');
      setSupportMessage('');
    }, 4000);
  };

  if (view === 'support') {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Contact & Support</h1>
              <p className="text-xs text-gray-500">Need help with GitHub OAuth, ZIP extraction, or SaaS plans?</p>
            </div>
          </div>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-base">Support Inquiry Submitted!</h3>
              <p className="text-xs text-emerald-700">
                Thank you for reaching out. Our engineering support team will respond to {supportEmail} within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitSupport} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={supportName}
                    onChange={(e) => setSupportName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="developer@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Message or Bug Description *</label>
                <textarea
                  required
                  rows={5}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe your issue or question regarding SourceLink.ai sync operations..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send Support Request</span>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (view === 'terms') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 text-gray-700 text-xs leading-relaxed">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Terms of Service</h1>
              <p className="text-[11px] text-gray-400">Effective Date: August 10, 2026</p>
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-900">1. Acceptance of Terms</h2>
            <p>
              By accessing or using SourceLink.ai ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-900">2. Usage Rights & GitHub Code Sync</h2>
            <p>
              SourceLink.ai processes user-uploaded ZIP archives and interacts directly with GitHub repositories via GitHub REST APIs. You retain full ownership and intellectual property rights over any code uploaded or pushed using our platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-900">3. Ephemeral File Processing</h2>
            <p>
              Uploaded ZIP archives are extracted in volatile memory or temporary isolated processing memory solely for line-by-line diff generation and Git tree construction. SourceLink.ai does NOT store uploaded source ZIP files permanently on servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-900">4. Prohibited Uses</h2>
            <p>
              You agree not to use SourceLink.ai to upload malware, unauthorized proprietary source code belonging to third parties, or engage in API abuse or rate-limit circumvention.
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 text-gray-700 text-xs leading-relaxed">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <Shield className="w-6 h-6 text-emerald-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-[11px] text-gray-400">Effective Date: August 10, 2026</p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900">1. Data We Collect</h2>
          <p>
            We collect basic user account information (Name, Email, Auth Provider) and encrypted GitHub Personal Access Tokens or OAuth session tokens required to access your GitHub repositories.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900">2. How We Handle Your Code</h2>
          <p>
            Your code privacy is paramount. SourceLink.ai processes your uploaded ZIP files strictly in memory to calculate Git blob SHAs and tree diffs. Code is never sold, shared, or trained upon.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900">3. Data Retention & Deletion</h2>
          <p>
            You have total control over your data. You may disconnect your GitHub token or execute a complete account deletion from the Account Settings page at any time, which permanently purges your credentials and sync logs.
          </p>
        </section>
      </div>
    </div>
  );
};
