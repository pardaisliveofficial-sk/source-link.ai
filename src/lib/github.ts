import { ExtractedFile, FileDiff, GitHubRepo } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Standard fetch wrapper with standard GitHub headers
 */
async function githubRequest(endpoint: string, token: string, options: RequestInit = {}) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_BASE}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorMsg = `GitHub API error: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.message) {
        errorMsg = errData.message;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Validates token and returns GitHub User Profile
 */
export async function getGitHubUser(token: string) {
  return githubRequest('/user', token);
}

/**
 * Fetches user repositories sorted by last updated
 */
export async function getUserRepos(token: string): Promise<GitHubRepo[]> {
  const data = await githubRequest('/user/repos?sort=updated&per_page=100&type=all', token);
  return data.map((r: any) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    owner: {
      login: r.owner.login,
      avatar_url: r.owner.avatar_url,
    },
    private: r.private,
    html_url: r.html_url,
    default_branch: r.default_branch || 'main',
    description: r.description || '',
    updated_at: r.updated_at
  }));
}

/**
 * Creates a new GitHub repository
 */
export async function createRepository(
  token: string,
  name: string,
  isPrivate: boolean = false,
  description: string = 'Created with GitSync Studio'
): Promise<GitHubRepo> {
  const data = await githubRequest('/user/repos', token, {
    method: 'POST',
    body: JSON.stringify({
      name,
      private: isPrivate,
      description,
      auto_init: true // creates an initial commit with README so main branch exists
    })
  });

  return {
    id: data.id,
    name: data.name,
    full_name: data.full_name,
    owner: {
      login: data.owner.login,
      avatar_url: data.owner.avatar_url,
    },
    private: data.private,
    html_url: data.html_url,
    default_branch: data.default_branch || 'main',
    description: data.description || '',
    updated_at: data.updated_at
  };
}

/**
 * Fetches recursive remote file tree for a branch
 */
export async function getRepoTree(token: string, owner: string, repo: string, branch: string = 'main') {
  try {
    // 1. Get branch reference
    const refData = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${branch}`, token);
    const commitSha = refData.object.sha;

    // 2. Get commit object to get tree SHA
    const commitData = await githubRequest(`/repos/${owner}/${repo}/git/commits/${commitSha}`, token);
    const treeSha = commitData.tree.sha;

    // 3. Get tree recursively
    const treeData = await githubRequest(`/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`, token);
    
    // Return array of items { path, mode, type, sha, size, url }
    return {
      commitSha,
      treeSha,
      tree: treeData.tree || []
    };
  } catch (err: any) {
    if (err.message.includes('404') || err.message.includes('Git Repository is empty')) {
      return { commitSha: null, treeSha: null, tree: [] };
    }
    throw err;
  }
}

/**
 * Fetches content of a specific remote file
 */
export async function getRemoteFileContent(token: string, owner: string, repo: string, path: string, ref: string = 'main') {
  try {
    const data = await githubRequest(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`, token);
    if (data.content && data.encoding === 'base64') {
      // Decode UTF-8 string from base64 safely
      const binaryString = atob(data.content.replace(/\n/g, ''));
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    }
    return '';
  } catch {
    return null;
  }
}

/**
 * Computes line-by-line additions and deletions
 */
export function calculateLineDiffStats(oldText: string = '', newText: string = '') {
  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];

  let additions = 0;
  let deletions = 0;

  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  for (const line of newLines) {
    if (!oldSet.has(line)) additions++;
  }
  for (const line of oldLines) {
    if (!newSet.has(line)) deletions++;
  }

  return { additions, deletions };
}

/**
 * Checks if remote branch HEAD commit SHA has changed since initial diff calculation
 */
export async function checkRemoteConflict(
  token: string,
  owner: string,
  repo: string,
  branch: string = 'main',
  initialHeadSha: string | null
): Promise<{ hasConflict: boolean; currentHeadSha: string | null }> {
  try {
    const refData = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${branch}`, token);
    const currentHeadSha = refData.object.sha;
    if (initialHeadSha && currentHeadSha !== initialHeadSha) {
      return { hasConflict: true, currentHeadSha };
    }
    return { hasConflict: false, currentHeadSha };
  } catch {
    return { hasConflict: false, currentHeadSha: null };
  }
}

/**
 * Diffs local extracted ZIP files against remote GitHub repository tree
 */
export async function computeDiffsWithGitHub(
  extractedFiles: Map<string, ExtractedFile>,
  token: string,
  owner: string,
  repo: string,
  branch: string = 'main',
  includeDeletions: boolean = false
): Promise<{ diffs: FileDiff[]; remoteHeadSha: string | null }> {
  const { commitSha, tree } = await getRepoTree(token, owner, repo, branch);

  const remoteFileMap = new Map<string, { sha: string; size: number }>();
  for (const item of tree) {
    if (item.type === 'blob') {
      remoteFileMap.set(item.path, { sha: item.sha, size: item.size });
    }
  }

  const diffs: FileDiff[] = [];

  // 1. Process local extracted files
  for (const [path, localFile] of extractedFiles.entries()) {
    const remoteInfo = remoteFileMap.get(path);

    if (!remoteInfo) {
      // File exists locally in ZIP, not on remote -> ADDED
      const stats = localFile.isBinary ? { additions: 0, deletions: 0 } : calculateLineDiffStats('', localFile.content);
      diffs.push({
        path,
        status: 'added',
        localContent: localFile.content,
        remoteContent: '',
        size: localFile.size,
        isBinary: localFile.isBinary,
        additionsCount: stats.additions,
        deletionsCount: 0
      });
    } else {
      // File exists on remote. Fetch remote content if text to perform exact comparison
      let remoteText: string | null = null;
      if (!localFile.isBinary) {
        remoteText = await getRemoteFileContent(token, owner, repo, path, branch);
      }

      const isModified = localFile.isBinary
        ? localFile.size !== remoteInfo.size
        : remoteText !== null && remoteText !== localFile.content;

      if (isModified) {
        const stats = localFile.isBinary
          ? { additions: 0, deletions: 0 }
          : calculateLineDiffStats(remoteText || '', localFile.content);

        diffs.push({
          path,
          status: 'modified',
          localContent: localFile.content,
          remoteContent: remoteText || '',
          size: localFile.size,
          isBinary: localFile.isBinary,
          additionsCount: stats.additions,
          deletionsCount: stats.deletions
        });
      } else {
        diffs.push({
          path,
          status: 'unchanged',
          localContent: localFile.content,
          remoteContent: remoteText || localFile.content,
          size: localFile.size,
          isBinary: localFile.isBinary,
          additionsCount: 0,
          deletionsCount: 0
        });
      }
    }
  }

  // 2. Check for files in remote that were deleted in ZIP (if option enabled)
  if (includeDeletions) {
    for (const [remotePath, remoteInfo] of remoteFileMap.entries()) {
      if (!extractedFiles.has(remotePath)) {
        diffs.push({
          path: remotePath,
          status: 'deleted',
          localContent: '',
          remoteContent: '[File deleted on local]',
          size: remoteInfo.size,
          isBinary: false,
          additionsCount: 0,
          deletionsCount: 10
        });
      }
    }
  }

  return { diffs, remoteHeadSha: commitSha };
}

/**
 * Pushes changed files to GitHub repo atomically using Git Data API
 */
export async function pushChangesToGitHub(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  diffsToPush: FileDiff[],
  commitMessage: string
): Promise<{ commitSha: string; commitUrl: string }> {
  // Only push changed/added/deleted files
  const activeDiffs = diffsToPush.filter(d => d.status !== 'unchanged');
  if (activeDiffs.length === 0) {
    throw new Error('No changed files detected to push.');
  }

  // 1. Get HEAD reference for branch
  let headSha: string | null = null;
  let baseTreeSha: string | null = null;

  try {
    const refData = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${branch}`, token);
    headSha = refData.object.sha;
    const commitData = await githubRequest(`/repos/${owner}/${repo}/git/commits/${headSha}`, token);
    baseTreeSha = commitData.tree.sha;
  } catch {
    // If branch doesn't exist or repo empty, we will create main branch
  }

  // 2. Create Blobs for each changed file
  const treeEntries: Array<{
    path: string;
    mode: string;
    type: string;
    sha?: string | null;
    content?: string;
  }> = [];

  for (const diff of activeDiffs) {
    if (diff.status === 'deleted') {
      // In Git Data API, setting sha to null removes file from tree
      treeEntries.push({
        path: diff.path,
        mode: '100644',
        type: 'blob',
        sha: null
      });
    } else {
      let blobSha: string;

      if (diff.isBinary) {
        // Post base64 blob
        const blobData = await githubRequest(`/repos/${owner}/${repo}/git/blobs`, token, {
          method: 'POST',
          body: JSON.stringify({
            content: diff.localContent || '',
            encoding: 'base64'
          })
        });
        blobSha = blobData.sha;
      } else {
        // Post utf-8 text blob
        const blobData = await githubRequest(`/repos/${owner}/${repo}/git/blobs`, token, {
          method: 'POST',
          body: JSON.stringify({
            content: diff.localContent || '',
            encoding: 'utf-8'
          })
        });
        blobSha = blobData.sha;
      }

      treeEntries.push({
        path: diff.path,
        mode: '100644', // normal file
        type: 'blob',
        sha: blobSha
      });
    }
  }

  // 3. Create a new Tree
  const createTreeBody: any = { tree: treeEntries };
  if (baseTreeSha) {
    createTreeBody.base_tree = baseTreeSha;
  }

  const newTreeData = await githubRequest(`/repos/${owner}/${repo}/git/trees`, token, {
    method: 'POST',
    body: JSON.stringify(createTreeBody)
  });

  // 4. Create a Commit
  const createCommitBody: any = {
    message: commitMessage || `Update files via GitSync Studio (${activeDiffs.length} files)`,
    tree: newTreeData.sha,
    parents: headSha ? [headSha] : []
  };

  const newCommitData = await githubRequest(`/repos/${owner}/${repo}/git/commits`, token, {
    method: 'POST',
    body: JSON.stringify(createCommitBody)
  });

  // 5. Update or Create Branch Ref
  if (headSha) {
    await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, token, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: newCommitData.sha,
        force: false
      })
    });
  } else {
    await githubRequest(`/repos/${owner}/${repo}/git/refs`, token, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: newCommitData.sha
      })
    });
  }

  return {
    commitSha: newCommitData.sha,
    commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitData.sha}`
  };
}
