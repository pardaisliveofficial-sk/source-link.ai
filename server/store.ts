import fs from 'fs';
import path from 'path';
import { Firestore } from '@google-cloud/firestore';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

export interface DbSchema {
  users: Record<string, any>;
  syncLogs: Record<string, any[]>;
  userUsage: Record<string, any>;
  adminUsers: Record<string, any>;
  adminSessions: Record<string, any>;
  userOverrides: Record<string, any>;
  adminAuditLogs: any[];
  verificationCodes: Record<string, string>;
  plans: Record<string, any>;
  discounts: Record<string, any>;
  systemSettings: any;
}

// AUTHORIZED ADMINISTRATORS ALLOWLIST
export const APPROVED_ADMIN_EMAILS = [
  'saifkhokhar657@gmail.com',
  'sa098086@gmail.com',
  'pardaisliveofficial@gmail.com',
  'janejahan84@gmail.com',
  'admin@sourcelink.ai',
  'dark330angel@gmail.com'
];

export function isAllowedAdmin(email: string): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return APPROVED_ADMIN_EMAILS.includes(clean) || clean === 'admin@sourcelink.ai';
}

// Initial state seed
const DEFAULT_PLANS: Record<string, any> = {
  free: {
    id: 'free',
    name: 'Free Developer',
    price: '$0',
    monthlyPrice: 0,
    yearlyPrice: 0,
    syncsPerMonth: 15,
    maxZipSizeMb: 25,
    reposLimit: 5,
    storageLimitMb: 100,
    features: [
      '15 Sync Operations / month',
      '25MB ZIP upload file size limit',
      'Line-by-Line Unified Visual Diff',
      'GitHub PAT & OAuth Support',
      'Android App Ready'
    ],
    popular: false,
    badge: 'Free',
    description: 'Essential tools for individual builders & simple syncs',
    enabled: true,
    visibility: 'public'
  },
  pro: {
    id: 'pro',
    name: 'Pro SaaS Builder',
    price: '$19',
    monthlyPrice: 19,
    yearlyPrice: 190,
    syncsPerMonth: 250,
    maxZipSizeMb: 100,
    reposLimit: 50,
    storageLimitMb: 2000,
    features: [
      '250 Sync Operations / month',
      '100MB ZIP upload file size limit',
      'Side-by-Side Visual Diff Inspector',
      'Priority GitHub OAuth Integration',
      'Sync History & Commit Audit Logs',
      'Branch Conflict Auto-Guard'
    ],
    popular: true,
    badge: 'Recommended',
    description: 'For active developers & full-stack creator workflows',
    enabled: true,
    visibility: 'public'
  },
  business: {
    id: 'business',
    name: 'Business & Teams',
    price: '$49',
    monthlyPrice: 49,
    yearlyPrice: 490,
    syncsPerMonth: 9999,
    maxZipSizeMb: 500,
    reposLimit: 999,
    storageLimitMb: 10000,
    features: [
      'Unlimited Code Syncs',
      '500MB ZIP file size limit',
      'Multi-User Admin Usage Dashboard',
      'Team Collaboration & Audit Logging',
      '24/7 Priority Support SLA',
      'Custom Webhooks & Branch Protection'
    ],
    popular: false,
    badge: 'Enterprise',
    description: 'For organizations & multi-developer teams',
    enabled: true,
    visibility: 'public'
  }
};

const DEFAULT_DISCOUNTS: Record<string, any> = {
  SAVE20: {
    id: 'dsc_save20',
    code: 'SAVE20',
    discountType: 'percentage',
    amount: 20,
    applicablePlans: ['pro', 'business'],
    startDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    usageLimit: 100,
    timesUsed: 14,
    enabled: true,
    description: '20% off Pro & Business SaaS plans'
  }
};

const DEFAULT_SYSTEM_SETTINGS = {
  appName: 'SourceLink.ai',
  supportEmail: 'support@sourcelink.ai',
  websiteUrl: 'https://sourcelinkai.soulverseapps.com',
  defaultPlan: 'free',
  trialDaysDefault: 14,
  maintenanceMode: false,
  appIconUrl: '/icon-192.png'
};

const SAMPLE_USERS = [
  { id: 'usr_dev1', name: 'John Dev', email: 'john.dev@example.com', password: 'password123', authProvider: 'email', plan: 'free', status: 'active', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), lastLoginAt: new Date().toISOString(), githubUsername: 'johndev' },
  { id: 'usr_pro1', name: 'Sarah Tech', email: 'sarah@startup.io', password: 'password123', authProvider: 'github', plan: 'pro', status: 'active', createdAt: new Date(Date.now() - 8 * 86400000).toISOString(), lastLoginAt: new Date().toISOString(), githubUsername: 'sarahtech' },
  { id: 'usr_biz1', name: 'Alex Enterprise', email: 'alex@corp.com', password: 'password123', authProvider: 'email', plan: 'business', status: 'active', createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), lastLoginAt: new Date().toISOString(), githubUsername: 'alexcorp' }
];

export class PersistentDatabase {
  private data: DbSchema;
  private firestore: Firestore | null = null;
  private firestoreEnabled: boolean = false;

  constructor() {
    this.data = this.loadFromDisk();
    this.initFirestore();
    this.ensureAdminAccountsAndSeeds();
  }

  private initFirestore(): void {
    try {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || process.env.FIRESTORE_PROJECT_ID;
      if (projectId || process.env.NODE_ENV === 'production') {
        this.firestore = new Firestore({
          projectId: projectId || undefined
        });
        this.firestoreEnabled = true;
        console.log('[Store] Google Cloud Firestore storage driver initialized.');
        this.syncFromFirestore();
      }
    } catch (err) {
      console.warn('[Store] Firestore initialization deferred or unavailable, utilizing persistent disk store:', err);
    }
  }

  private async syncFromFirestore(): Promise<void> {
    if (!this.firestore) return;
    try {
      const collections = [
        'users', 'syncLogs', 'userUsage', 'adminUsers',
        'adminSessions', 'userOverrides', 'verificationCodes',
        'plans', 'discounts', 'systemSettings'
      ];

      for (const colName of collections) {
        const snapshot = await this.firestore.collection(colName).get();
        if (!snapshot.empty) {
          if (colName === 'systemSettings') {
            const doc = snapshot.docs[0];
            if (doc) this.data.systemSettings = doc.data();
          } else {
            snapshot.docs.forEach((doc) => {
              (this.data as any)[colName][doc.id] = doc.data();
            });
          }
        }
      }

      const auditSnapshot = await this.firestore.collection('adminAuditLogs').orderBy('timestamp', 'desc').limit(500).get();
      if (!auditSnapshot.empty) {
        this.data.adminAuditLogs = auditSnapshot.docs.map(d => d.data());
      }

      this.saveToDisk();
      console.log('[Store] Synchronized state successfully from Cloud Firestore.');
    } catch (err) {
      console.warn('[Store] Sync from Firestore skipped (offline or missing credentials):', (err as Error).message);
    }
  }

  private async saveToFirestore(collection: string, id: string, payload: any): Promise<void> {
    if (!this.firestore || !this.firestoreEnabled) return;
    try {
      await this.firestore.collection(collection).doc(id).set(payload, { merge: true });
    } catch (err) {
      console.warn(`[Store] Firestore async save failed for ${collection}/${id}:`, (err as Error).message);
    }
  }

  private async deleteFromFirestore(collection: string, id: string): Promise<void> {
    if (!this.firestore || !this.firestoreEnabled) return;
    try {
      await this.firestore.collection(collection).doc(id).delete();
    } catch (err) {
      console.warn(`[Store] Firestore async delete failed for ${collection}/${id}:`, (err as Error).message);
    }
  }

  private loadFromDisk(): DbSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return {
          users: parsed.users || {},
          syncLogs: parsed.syncLogs || {},
          userUsage: parsed.userUsage || {},
          adminUsers: parsed.adminUsers || {},
          adminSessions: parsed.adminSessions || {},
          userOverrides: parsed.userOverrides || {},
          adminAuditLogs: Array.isArray(parsed.adminAuditLogs) ? parsed.adminAuditLogs : [],
          verificationCodes: parsed.verificationCodes || {},
          plans: parsed.plans || DEFAULT_PLANS,
          discounts: parsed.discounts || DEFAULT_DISCOUNTS,
          systemSettings: parsed.systemSettings || DEFAULT_SYSTEM_SETTINGS
        };
      }
    } catch (err) {
      console.error('Error loading persistent database from disk, creating fresh DB:', err);
    }

    // Default Fresh Data
    const initialUsers: Record<string, any> = {};
    const initialUsage: Record<string, any> = {};

    SAMPLE_USERS.forEach(u => {
      initialUsers[u.email] = u;
      initialUsage[u.id] = {
        syncsCount: u.plan === 'business' ? 38 : u.plan === 'pro' ? 14 : 3,
        lastReset: new Date().toISOString(),
        plan: u.plan
      };
    });

    const fresh: DbSchema = {
      users: initialUsers,
      syncLogs: {},
      userUsage: initialUsage,
      adminUsers: {},
      adminSessions: {},
      userOverrides: {},
      adminAuditLogs: [],
      verificationCodes: {},
      plans: DEFAULT_PLANS,
      discounts: DEFAULT_DISCOUNTS,
      systemSettings: DEFAULT_SYSTEM_SETTINGS
    };

    return fresh;
  }

  public saveToDisk(): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error saving persistent database to disk:', err);
    }
  }

  private ensureAdminAccountsAndSeeds(): void {
    let mutated = false;

    APPROVED_ADMIN_EMAILS.forEach((email, idx) => {
      const emailKey = email.toLowerCase().trim();
      const defaultPwd = (emailKey === 'admin@sourcelink.ai' || emailKey === 'dark330angel@gmail.com') ? 'AdminPassword123!' : 'password123';
      if (!this.data.adminUsers[emailKey]) {
        this.data.adminUsers[emailKey] = {
          id: `adm_${idx + 1}`,
          name: emailKey.split('@')[0],
          email: emailKey,
          password: defaultPwd,
          role: 'SUPER_ADMIN',
          createdAt: new Date().toISOString()
        };
        mutated = true;
      }

      if (!this.data.users[emailKey]) {
        this.data.users[emailKey] = {
          id: `usr_adm_${idx + 1}`,
          name: emailKey.split('@')[0],
          email: emailKey,
          password: defaultPwd,
          authProvider: 'email',
          plan: 'business',
          status: 'active',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
        mutated = true;
      }
    });

    if (mutated) {
      this.saveToDisk();
    }
  }

  // Getters for DB references with auto-save capability
  public get raw(): DbSchema {
    return this.data;
  }

  // Map-like helper methods for Users
  public getUser(email: string): any {
    return this.data.users[email.toLowerCase().trim()];
  }

  public setUser(email: string, user: any): void {
    const key = email.toLowerCase().trim();
    this.data.users[key] = user;
    this.saveToDisk();
    this.saveToFirestore('users', key, user);
  }

  public deleteUser(email: string): void {
    const key = email.toLowerCase().trim();
    delete this.data.users[key];
    this.saveToDisk();
    this.deleteFromFirestore('users', key);
  }

  public getAllUsers(): any[] {
    return Object.values(this.data.users);
  }

  // Usage Helpers
  public getUserUsage(userId: string): any {
    return this.data.userUsage[userId];
  }

  public setUserUsage(userId: string, usage: any): void {
    this.data.userUsage[userId] = usage;
    this.saveToDisk();
    this.saveToFirestore('userUsage', userId, usage);
  }

  public deleteUserUsage(userId: string): void {
    delete this.data.userUsage[userId];
    this.saveToDisk();
    this.deleteFromFirestore('userUsage', userId);
  }

  // Sync Logs Helpers
  public getSyncLogs(userId: string): any[] {
    return this.data.syncLogs[userId] || [];
  }

  public addSyncLog(userId: string, log: any): void {
    if (!this.data.syncLogs[userId]) {
      this.data.syncLogs[userId] = [];
    }
    this.data.syncLogs[userId].unshift(log);
    this.saveToDisk();
    this.saveToFirestore('syncLogs', userId, { logs: this.data.syncLogs[userId] });
  }

  public deleteSyncLogs(userId: string): void {
    delete this.data.syncLogs[userId];
    this.saveToDisk();
    this.deleteFromFirestore('syncLogs', userId);
  }

  // Verification Code Helpers
  public getVerificationCode(email: string): string | undefined {
    return this.data.verificationCodes[email.toLowerCase().trim()];
  }

  public setVerificationCode(email: string, code: string): void {
    const key = email.toLowerCase().trim();
    this.data.verificationCodes[key] = code;
    this.saveToDisk();
    this.saveToFirestore('verificationCodes', key, { code });
  }

  // Admin User Helpers
  public getAdminUser(email: string): any {
    return this.data.adminUsers[email.toLowerCase().trim()];
  }

  public setAdminUser(email: string, admin: any): void {
    const key = email.toLowerCase().trim();
    if (!isAllowedAdmin(key)) {
      throw new Error(`Unauthorized: ${key} is not an allowed administrator.`);
    }
    this.data.adminUsers[key] = admin;
    this.saveToDisk();
    this.saveToFirestore('adminUsers', key, admin);
  }

  // Admin Session Helpers
  public getAdminSession(token: string): any {
    return this.data.adminSessions[token];
  }

  public setAdminSession(token: string, session: any): void {
    this.data.adminSessions[token] = session;
    this.saveToDisk();
    this.saveToFirestore('adminSessions', token, session);
  }

  public deleteAdminSession(token: string): void {
    delete this.data.adminSessions[token];
    this.saveToDisk();
    this.deleteFromFirestore('adminSessions', token);
  }

  // User Overrides Helpers
  public getUserOverride(userId: string): any {
    return this.data.userOverrides[userId];
  }

  public setUserOverride(userId: string, override: any): void {
    this.data.userOverrides[userId] = override;
    this.saveToDisk();
    this.saveToFirestore('userOverrides', userId, override);
  }

  public deleteUserOverride(userId: string): void {
    delete this.data.userOverrides[userId];
    this.saveToDisk();
    this.deleteFromFirestore('userOverrides', userId);
  }

  // Audit Logs Helpers
  public getAuditLogs(): any[] {
    return this.data.adminAuditLogs;
  }

  public addAuditLog(log: any): void {
    this.data.adminAuditLogs.unshift(log);
    this.saveToDisk();
    this.saveToFirestore('adminAuditLogs', log.id || `aud_${Date.now()}`, log);
  }

  // Plans Helpers
  public getPlans(): Record<string, any> {
    return this.data.plans;
  }

  public getPlan(planId: string): any {
    return this.data.plans[planId];
  }

  public setPlan(planId: string, plan: any): void {
    this.data.plans[planId] = plan;
    this.saveToDisk();
    this.saveToFirestore('plans', planId, plan);
  }

  // Discounts Helpers
  public getDiscounts(): Record<string, any> {
    return this.data.discounts;
  }

  public getDiscount(code: string): any {
    return this.data.discounts[code.toUpperCase().trim()];
  }

  public setDiscount(code: string, discount: any): void {
    const key = code.toUpperCase().trim();
    this.data.discounts[key] = discount;
    this.saveToDisk();
    this.saveToFirestore('discounts', key, discount);
  }

  // System Settings Helpers
  public getSystemSettings(): any {
    return this.data.systemSettings;
  }

  public setSystemSettings(settings: any): void {
    this.data.systemSettings = { ...this.data.systemSettings, ...settings };
    this.saveToDisk();
    this.saveToFirestore('systemSettings', 'global', this.data.systemSettings);
  }
}

export const db = new PersistentDatabase();
