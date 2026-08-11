export const APPROVED_ADMIN_EMAILS = [
  'saifkhokhar657@gmail.com',
  'sa098086@gmail.com',
  'pardaisliveofficial@gmail.com',
  'janejahan84@gmail.com'
];

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  authProvider: 'google' | 'github' | 'email';
  githubToken?: string;
  githubUsername?: string;
  plan?: 'free' | 'pro' | 'business' | string;
  createdAt?: string;
  status?: 'active' | 'suspended';
  lastLoginAt?: string;
  emailVerified?: boolean;
}

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: string;
  lastLoginAt?: string;
}

export interface PlanConfig {
  id: string;
  name: string;
  price: string;
  monthlyPrice: number;
  yearlyPrice: number;
  syncsPerMonth: number;
  maxZipSizeMb: number;
  reposLimit: number;
  storageLimitMb: number;
  features: string[];
  popular?: boolean;
  description: string;
  badge?: string;
  enabled: boolean;
  visibility: 'public' | 'hidden' | 'private';
}

export interface DiscountCoupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  amount: number;
  applicablePlans: string[];
  startDate: string;
  expiryDate: string;
  usageLimit: number;
  timesUsed: number;
  enabled: boolean;
  description: string;
}

export interface UserPlanOverride {
  userId: string;
  userEmail: string;
  plan: string;
  planSource: 'ADMIN_OVERRIDE' | 'SUBSCRIPTION';
  grantedByAdminId: string;
  grantedByAdminEmail: string;
  startDate: string;
  expiryDate: string;
  reason: string;
  isTrial?: boolean;
}

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  plan: string;
  planSource?: 'ADMIN_OVERRIDE' | 'SUBSCRIPTION';
  status: 'active' | 'suspended';
  syncsCount: number;
  maxSyncs: number;
  maxZipSizeMb: number;
  storageUsageMb: number;
  createdAt: string;
  lastLoginAt?: string;
  githubConnected: boolean;
  githubUsername?: string;
  overrideExpiry?: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  freeUsers: number;
  proUsers: number;
  businessUsers: number;
  suspendedUsers: number;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  currentStorageUsageMb: number;
  monthlySyncUsageTotal: number;
  revenueEstMonthly: number;
  systemHealth: {
    apiStatus: string;
    databaseStatus: string;
    githubApiStatus: string;
    storageStatus: string;
  };
}

export interface PlanInfo {
  id: 'free' | 'pro' | 'business' | string;
  name: string;
  price: string;
  period: string;
  syncsPerMonth: number | 'Unlimited';
  maxZipSizeMb: number;
  reposLimit: number | 'Unlimited';
  features: string[];
  popular?: boolean;
  badge?: string;
  description?: string;
}

export interface UsageStats {
  plan: 'free' | 'pro' | 'business' | string;
  syncsUsed: number;
  syncsLimit: number;
  maxZipSizeMb: number;
  reposLimit: number;
  planSource?: 'ADMIN_OVERRIDE' | 'SUBSCRIPTION';
  overrideExpiry?: string;
}

export type MainViewTab = 
  | 'landing' 
  | 'workspace' 
  | 'repos' 
  | 'history' 
  | 'pricing' 
  | 'usage' 
  | 'settings' 
  | 'admin'
  | 'privacy' 
  | 'terms' 
  | 'support';

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
