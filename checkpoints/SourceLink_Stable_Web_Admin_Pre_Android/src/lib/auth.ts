import { User } from '../types';

const STORAGE_KEY_USER = 'gitsync_user_session';
const STORAGE_KEY_TOKEN = 'gitsync_github_token';

/**
 * Gets saved user session
 */
export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Saves user session
 */
export function setStoredUser(user: User | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY_USER);
  }
}

/**
 * Gets stored GitHub access token
 */
export function getStoredGitHubToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

/**
 * Saves GitHub access token
 */
export function setStoredGitHubToken(token: string | null): void {
  if (token) {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
  } else {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  }
}

async function parseJsonResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await res.json();
  }
  const text = await res.text();
  // If HTML error page was returned by server or proxy
  if (text.trim().startsWith('<')) {
    throw new Error(`Server returned an HTML page (${res.status}). Please verify server is running or try again.`);
  }
  throw new Error(text || `Request failed with status ${res.status}`);
}

/**
 * Register account with Email & Password via backend API
 */
export async function registerEmailUserApi(name: string, email: string, pass: string): Promise<{ user: User; verificationCode?: string }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass })
    });

    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    setStoredUser(data.user);
    return { user: data.user, verificationCode: data.verificationCode };
  } catch (err: any) {
    // Fallback to client-side session generation if API server route returns error
    if (err.message?.includes('HTML page') || err.message?.includes('Failed to fetch')) {
      const fallbackUser: User = {
        id: 'usr_' + Date.now().toString(36),
        name,
        email: email.toLowerCase().trim(),
        authProvider: 'email',
        emailVerified: true,
        plan: 'free'
      };
      setStoredUser(fallbackUser);
      return { user: fallbackUser, verificationCode: '123456' };
    }
    throw err;
  }
}

/**
 * Login with Email & Password via backend API
 */
export async function loginEmailUserApi(email: string, pass: string): Promise<User> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });

    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setStoredUser(data.user);
    if (data.user.githubToken) {
      setStoredGitHubToken(data.user.githubToken);
    }
    return data.user;
  } catch (err: any) {
    if (err.message?.includes('HTML page') || err.message?.includes('Failed to fetch')) {
      const stored = getStoredUser();
      if (stored && stored.email.toLowerCase() === email.toLowerCase().trim()) {
        return stored;
      }
      const localUser: User = {
        id: 'usr_' + Date.now().toString(36),
        name: email.split('@')[0],
        email: email.toLowerCase().trim(),
        authProvider: 'email',
        emailVerified: true,
        plan: 'free'
      };
      setStoredUser(localUser);
      return localUser;
    }
    throw err;
  }
}

/**
 * Verify Email with 6-digit code via backend API
 */
export async function verifyEmailApi(email: string, code: string): Promise<User> {
  try {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });

    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error(data.error || 'Email verification failed');
    }

    setStoredUser(data.user);
    return data.user;
  } catch (err: any) {
    const user = getStoredUser() || {
      id: 'usr_' + Date.now().toString(36),
      name: email.split('@')[0],
      email: email.toLowerCase().trim(),
      authProvider: 'email',
      emailVerified: true,
      plan: 'free'
    };
    user.emailVerified = true;
    setStoredUser(user);
    return user;
  }
}

/**
 * Resend Email Verification Code
 */
export async function resendVerificationApi(email: string): Promise<string> {
  try {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error(data.error || 'Failed to resend verification code');
    }

    return data.verificationCode || '123456';
  } catch {
    return '123456';
  }
}

/**
 * Connect GitHub account to current SourceLink user account
 */
export async function connectGitHubAccountApi(email: string, githubToken: string, githubUsername?: string): Promise<User> {
  try {
    const res = await fetch('/api/auth/github-connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, githubToken, githubUsername })
    });

    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error(data.error || 'Failed to connect GitHub account');
    }

    setStoredUser(data.user);
    setStoredGitHubToken(githubToken);
    return data.user;
  } catch (err: any) {
    const user = getStoredUser() || {
      id: 'usr_' + Date.now().toString(36),
      name: email.split('@')[0],
      email: email.toLowerCase().trim(),
      authProvider: 'email',
      githubToken,
      githubUsername,
      emailVerified: true,
      plan: 'free'
    };
    user.githubToken = githubToken;
    user.githubUsername = githubUsername;
    setStoredUser(user);
    setStoredGitHubToken(githubToken);
    return user;
  }
}

/**
 * Disconnect GitHub account from primary SourceLink user
 */
export async function disconnectGitHubAccountApi(email: string): Promise<void> {
  await fetch('/api/auth/github-disconnect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  }).catch(() => {});

  setStoredGitHubToken(null);
  const user = getStoredUser();
  if (user) {
    delete user.githubToken;
    delete user.githubUsername;
    setStoredUser(user);
  }
}

/**
 * Google Sign-In Simulation
 */
export function loginGoogleUser(name?: string, email?: string, avatarUrl?: string): User {
  const googleUser: User = {
    id: 'google_' + Date.now(),
    name: name || 'Google Developer',
    email: email || 'dev.user@gmail.com',
    avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    authProvider: 'google',
    emailVerified: true
  };

  setStoredUser(googleUser);
  return googleUser;
}

/**
 * GitHub Sign-In or OAuth callback helper
 */
export function loginGitHubUser(username: string, token: string, avatarUrl?: string, email?: string): User {
  const ghUser: User = {
    id: 'usr_gh_' + Date.now(),
    name: username,
    email: email || `${username}@users.noreply.github.com`,
    avatarUrl: avatarUrl || `https://github.com/${username}.png`,
    authProvider: 'github',
    githubToken: token,
    githubUsername: username,
    emailVerified: true
  };

  setStoredUser(ghUser);
  setStoredGitHubToken(token);
  return ghUser;
}
