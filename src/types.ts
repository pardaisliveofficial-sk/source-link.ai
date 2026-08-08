export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  authProvider: 'google' | 'github' | 'email';
  githubToken?: string;
  githubUsername?: string;
}

export interface ExtractedFile {
  path: string; // e.g. "src/App.tsx"
  content: string; // string content for text, or base64 for binary
  isBinary: boolean;
  size: number;
}

export type DiffType = 'added' | 'modified' | 'deleted' | 'unchanged';

export interface FileDiff {
  path: string;
  status: DiffType;
  localContent?: string;
  remoteContent?: string;
  size: number;
  isBinary: boolean;
  additionsCount?: number;
  deletionsCount?: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  html_url: string;
  default_branch: string;
  description?: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  repoFullName: string;
  branch: string;
  commitSha?: string;
  commitMessage: string;
  changedFilesCount: number;
  addedFilesCount: number;
  deletedFilesCount: number;
  timestamp: string;
  commitUrl?: string;
  status: 'success' | 'failed' | 'in_progress';
  details?: string;
}

export interface AppState {
  user: User | null;
  githubToken: string | null;
  selectedRepo: GitHubRepo | null;
  targetBranch: string;
  extractedFiles: Map<string, ExtractedFile>;
  fileDiffs: FileDiff[];
  syncLogs: SyncLog[];
  isExtractingZip: boolean;
  isDiffing: boolean;
  isPushing: boolean;
  zipName: string | null;
}
