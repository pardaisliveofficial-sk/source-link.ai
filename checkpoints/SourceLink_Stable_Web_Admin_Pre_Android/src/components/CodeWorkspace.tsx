import React, { useState } from 'react';
import { Code, Save, FileText, Folder, Check, Edit3, Sparkles } from 'lucide-react';
import { ExtractedFile } from '../types';

interface CodeWorkspaceProps {
  files: Map<string, ExtractedFile>;
  selectedPath: string | null;
  onSelectPath: (path: string) => void;
  onUpdateFileContent: (path: string, newContent: string) => void;
}

export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({
  files,
  selectedPath,
  onSelectPath,
  onUpdateFileContent,
}) => {
  const [editedContent, setEditedContent] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);

  const isMap = files && typeof files.values === 'function' && typeof files.get === 'function';
  const activePath = selectedPath || (isMap && files.size > 0 ? Array.from(files.keys())[0] : null);
  const activeFile = activePath && isMap ? files.get(activePath) : null;

  React.useEffect(() => {
    if (activeFile && !activeFile.isBinary) {
      setEditedContent(activeFile.content);
      setIsSaved(false);
    }
  }, [activePath, activeFile]);

  const handleSave = () => {
    if (activePath && activeFile) {
      onUpdateFileContent(activePath, editedContent);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const fileList: ExtractedFile[] = isMap ? Array.from(files.values()) : [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              4. Live Code Editor & Workspace
            </h3>
            <p className="text-xs text-gray-500">Inspect or edit source code in real-time before syncing</p>
          </div>
        </div>

        {activeFile && !activeFile.isBinary && (
          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 bg-[#24292F] hover:bg-black text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Save className="w-3.5 h-3.5" />}
            {isSaved ? 'Saved & Marked Modified!' : 'Save Changes'}
          </button>
        )}
      </div>

      {files.size === 0 ? (
        <div className="py-10 text-center text-xs text-gray-500 bg-gray-50/60 rounded-lg border border-gray-200">
          Upload a ZIP file above to inspect and edit code files here.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* File Tree List */}
          <div className="lg:col-span-4 bg-gray-50 border border-gray-200 rounded-lg p-2 max-h-96 overflow-y-auto custom-scrollbar">
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider font-bold text-gray-500 border-b border-gray-200 mb-1 flex items-center justify-between">
              <span>Files Tree</span>
              <span className="font-mono">{fileList.length} items</span>
            </div>

            <div className="space-y-0.5">
              {fileList.map((file) => {
                const isSelected = activePath === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => onSelectPath(file.path)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-mono truncate flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-bold border border-blue-300'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{file.path}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor Area */}
          <div className="lg:col-span-8 bg-gray-900 border border-gray-800 rounded-lg p-3 flex flex-col font-mono text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-gray-300 text-[11px]">
              <span className="font-bold text-white truncate max-w-[300px]">
                {activeFile ? activeFile.path : 'Select a file'}
              </span>
              <span className="text-[10px] text-gray-400">
                {activeFile ? `${activeFile.size} bytes` : ''}
              </span>
            </div>

            {!activeFile ? (
              <p className="text-gray-500 text-center py-12 font-sans">Select a file from the list to view or edit code.</p>
            ) : activeFile.isBinary ? (
              <div className="py-12 text-center text-amber-400 font-sans space-y-1">
                <p className="font-bold text-sm">Binary File</p>
                <p className="text-xs text-gray-400">Binary files cannot be edited in the browser editor.</p>
              </div>
            ) : (
              <div className="relative flex-1">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-80 bg-gray-950 text-emerald-300 p-3 rounded-md border border-gray-800 focus:outline-none focus:border-blue-600 font-mono text-xs leading-relaxed resize-none custom-scrollbar"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
