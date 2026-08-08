import { User } from '../types';

const STORAGE_KEY_USER = 'gitsync_user_session';
const STORAGE_KEY_TOKEN = 'gitsync_github_token';
const STORAGE_KEY_USERS_DB = 'gitsync_users_db';

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

/**
 * Register account with Email & Password
 */
export function registerEmailUser(name: string, email: string, pass: string): User {
  const usersRaw = localStorage.getItem(STORAGE_KEY_USERS_DB) || '[]';
  const users = JSON.parse(usersRaw);

  const existing = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const newUser: User = {
    id: 'user_' + Date.now(),
    name,
    email,
    authProvider: 'email'
  };

  users.push({ ...newUser, pass });
  localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

  setStoredUser(newUser);
  return newUser;
}

/**
 * Login with Email & Password
 */
export function loginEmailUser(email: string, pass: string): User {
  const usersRaw = localStorage.getItem(STORAGE_KEY_USERS_DB) || '[]';
  const users = JSON.parse(usersRaw);

  const found = users.find(
    (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.pass === pass
  );

  if (!found) {
    throw new Error('Invalid email or password.');
  }

  const user: User = {
    id: found.id,
    name: found.name,
    email: found.email,
    authProvider: 'email',
    githubToken: found.githubToken
  };

  setStoredUser(user);
  return user;
}

/**
 * Google Sign-In Simulation / OAuth Session
 */
export function loginGoogleUser(name?: string, email?: string, avatarUrl?: string): User {
  const googleUser: User = {
    id: 'google_' + Date.now(),
    name: name || 'Google Developer',
    email: email || 'dev.user@gmail.com',
    avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    authProvider: 'google'
  };

  setStoredUser(googleUser);
  return googleUser;
}

/**
 * GitHub Sign-In with Personal Access Token or OAuth profile
 */
export function loginGitHubUser(username: string, token: string, avatarUrl?: string, email?: string): User {
  const ghUser: User = {
    id: 'github_' + Date.now(),
    name: username,
    email: email || `${username}@users.noreply.github.com`,
    avatarUrl: avatarUrl || `https://github.com/${username}.png`,
    authProvider: 'github',
    githubToken: token,
    githubUsername: username
  };

  setStoredUser(ghUser);
  setStoredGitHubToken(token);
  return ghUser;
}
