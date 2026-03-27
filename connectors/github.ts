/**
 * GitHub Connector
 * 
 * Enterprise GitHub integration for repository management,
 * pull request automation, and CI/CD workflow triggers.
 * Supports OAuth2, PAT, and GitHub App authentication.
 * 
 * @module connectors/github
 * @version 1.0.0
 */

import type { Connector, ConnectorConfig, OperationResult } from '../src/types';

// ============================================
// Type Definitions
// ============================================

export interface GitHubConfig extends ConnectorConfig {
  /** GitHub API base URL (default: https://api.github.com) */
  baseUrl?: string;
  /** Authentication configuration */
  auth: {
    type: 'pat' | 'oauth2' | 'github-app';
    /** Personal Access Token (for PAT auth) */
    token?: string;
    /** OAuth2 config */
    clientId?: string;
    clientSecret?: string;
    /** GitHub App config */
    appId?: string;
    privateKey?: string;
    installationId?: string;
  };
  /** Default repository (owner/repo) */
  defaultRepo?: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
    type: 'User' | 'Organization';
  };
  description: string | null;
  private: boolean;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics?: string[];
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  user: GitHubUser;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  milestone: GitHubMilestone | null;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  draft: boolean;
  merged: boolean;
  user: GitHubUser;
  head: {
    ref: string;
    sha: string;
    repo: GitHubRepository;
  };
  base: {
    ref: string;
    sha: string;
    repo: GitHubRepository;
  };
  assignees: GitHubUser[];
  reviewers: GitHubUser[];
  labels: GitHubLabel[];
  mergeable: boolean | null;
  mergeable_state: string;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
  html_url: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Bot' | 'Organization';
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface GitHubMilestone {
  id: number;
  number: number;
  title: string;
  description: string | null;
  state: 'open' | 'closed';
  due_on: string | null;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
  assets: Array<{
    id: number;
    name: string;
    browser_download_url: string;
    size: number;
  }>;
}

export interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: 'active' | 'disabled' | 'disabled_manually' | 'disabled_fork';
  badge_url: string;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
  html_url: string;
  head_branch: string;
  head_sha: string;
  event: string;
  workflow_id: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Connector Definition
// ============================================

export const githubConnector: Connector<GitHubConfig> = {
  name: 'github',
  version: '1.0.0',
  description: 'GitHub integration for repository management, PR automation, and CI/CD workflows',
  
  auth: {
    type: 'oauth2',
    grantType: 'authorization_code',
    scopes: [
      'repo',
      'workflow',
      'write:packages',
      'read:packages',
      'delete:packages',
      'admin:org',
      'gist',
      'notifications',
      'user',
      'read:discussion',
      'write:discussion'
    ],
    tokenUrl: 'https://github.com/login/oauth/access_token',
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    docs: 'https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps'
  },

  rateLimits: {
    tier: 'graphql',
    requestsPerMinute: 5000, // REST API
    concurrentRequests: 20
  },

  retry: {
    maxAttempts: 3,
    backoff: 'exponential',
    baseDelayMs: 1000,
    retryOn: [429, 500, 502, 503, 504]
  },

  // ============================================
  // Operations
  // ============================================

  operations: {
    // ----------------------------------------
    // Repository Operations
    // ----------------------------------------

    getRepository: {
      name: 'getRepository',
      description: 'Get repository details',

      input: {
        type: 'object',
        required: ['owner', 'repo'],
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' }
        }
      },

      output: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          full_name: { type: 'string' },
          description: { type: 'string' },
          private: { type: 'boolean' },
          default_branch: { type: 'string' },
          stargazers_count: { type: 'number' },
          open_issues_count: { type: 'number' }
        }
      }
    },

    listRepositories: {
      name: 'listRepositories',
      description: 'List repositories for authenticated user or org',

      input: {
        type: 'object',
        properties: {
          org: { type: 'string', description: 'Organization name (optional)' },
          type: { 
            type: 'string', 
            enum: ['all', 'owner', 'public', 'private', 'member'],
            default: 'all'
          },
          sort: { 
            type: 'string', 
            enum: ['created', 'updated', 'pushed', 'full_name'],
            default: 'updated'
          },
          per_page: { type: 'number', default: 30 }
        }
      },

      output: {
        type: 'object',
        properties: {
          items: { 
            type: 'array',
            items: { $ref: '#/components/schemas/GitHubRepository' }
          }
        }
      }
    },

    // ----------------------------------------
    // Issue Operations
    // ----------------------------------------

    createIssue: {
      name: 'createIssue',
      description: 'Create a new issue',

      input: {
        type: 'object',
        required: ['owner', 'repo', 'title'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          labels: { 
            type: 'array',
            items: { type: 'string' }
          },
          assignees: {
            type: 'array',
            items: { type: 'string' }
          },
          milestone: { type: 'number' }
        }
      },

      output: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          number: { type: 'number' },
          html_url: { type: 'string' }
        }
      },

      examples: [
        {
          name: 'Create bug report',
          input: {
            owner: 'myorg',
            repo: 'myproject',
            title: 'Bug: Login fails on Safari',
            body: '## Description\nLogin button does not respond...\n\n## Steps to Reproduce\n1. Open Safari\n2. Navigate to login page\n3. Click login button',
            labels: ['bug', 'browser:safari']
          }
        }
      ]
    },

    getIssue: {
      name: 'getIssue',
      description: 'Get issue details',

      input: {
        type: 'object',
        required: ['owner', 'repo', 'issueNumber'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          issueNumber: { type: 'number' }
        }
      },

      output: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          number: { type: 'number' },
          title: { type: 'string' },
          body: { type: 'string' },
          state: { type: 'string' },
          labels: { type: 'array' }
        }
      }
    },

    updateIssue: {
      name: 'updateIssue',
      description: 'Update an existing issue',

      input: {
        type: 'object',
        required: ['owner', 'repo', 'issueNumber'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          issueNumber: { type: 'number' },
          title: { type: 'string' },
          body: { type: 'string' },
          state: { type: 'string', enum: ['open', 'closed'] },
          labels: { type: 'array', items: { type: 'string' } },
          assignees: { type: 'array', items: { type: 'string' } }
        }
      },

      output: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          number: { type: 'number' }
        }
      }
    },

    listIssues: {
      name: 'listIssues',
      description: 'List repository issues with filters',

      input: {
        type: 'object',
        required: ['owner', 'repo'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
          labels: { type: 'string', description: 'Comma-separated label names' },
          assignee: { type: 'string' },
          since: { type: 'string', format: 'date-time' },
          sort: { type: 'string', enum: ['created', 'updated', 'comments'], default: 'created' },
          direction: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      },

      output: {
        type: 'object',
        properties: {
          items: { 
            type: 'array',
            items: { $ref: '#/components/schemas/GitHubIssue' }
          }
        }
      }
    },

    // ----------------------------------------
    // Pull Request Operations
    // ----------------------------------------

    createPullRequest: {
      name: 'createPullRequest',
      description: 'Create a pull request',

      input: {
        type: 'object',
        required: ['owner', 'repo', 'title', 'head', 'base'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          head: { type: 'string', description: 'Branch name to merge from' },
          base: { type: 'string', description: 'Branch name to merge into' },
          draft: { type: 'boolean', default: false },
          maintainer_can_modify: { type: 'boolean', default: true }
        }
      },

      output: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          number: { type: 'number' },
          html_url: { type: 'string' },
          draft: { type: 'boolean' }
        }
      },

      examples: [
        {
          name: 'Create feature PR',
          input: {
            owner: 'myorg',
            repo: 'myproject',
            title: 'feat: Add user authentication',
            body: '## Changes\n- Added OAuth2 login\n- Implemented session management\n\n## Testing\n- [ ] Unit tests pass\n- [ ] Integration tests pass',
            head: 'feature/auth',
            base: 'main'
          }
        }
      ]
    },

    getPullRequest: {
      name: 'getPullRequest',
      description: 'Get pull request details',

      input: {
        type: 'object',
        required: ['owner', 'repo', 'pullNumber'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          pullNumber: { type: 'number' }
        }
      },

      output: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          number: { type: 'number' },
          title: { type: 'string' },
          state: { type: 'string' },
          merged: { type: 'boolean' },
          mergeable: { type: 'boolean' },
          additions: { type: 'number' },
          deletions: { type: 'number' }
        }
      }
    },

    mergePullRequest: {
      name: 'mergePullRequest',
      description: 'Merge a pull request',

      input: {
        type: 'object',
        required: ['owner', 'repo', 'pullNumber'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          pullNumber: { type: 'number' },
          commit_title: { type: 'string' },
          commit_message: { type: 'string' },
          merge_method: { 
            type: 'string', 
            enum: ['merge', 'squash', 'rebase'],
            default: 'squash'
          }
        }
      },

      output: {
        type: 'object',
        properties: {
          merged: { type: 'boolean' },
          message: { type: 'string' },
          sha: { type: 'string' }
        }
      }
    },

    listPullRequests: {
      name: 'listPullRequests',
      description: 'List repository pull requests',

      input: {
        type: 'object',
        required: ['owner', 'repo'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
          head: { type: 'string', description: 'Filter by head branch (owner:branch)' },
          base: { type: 'string', description: 'Filter by base branch' },
          sort: { type: 'string', enum: ['created', 'updated', 'popularity'], default: 'created' },
          direction: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        }
      },

      output: {
        type: 'object',
        properties: {
          items: { 
            type: 'array',
            items: { $ref: '#/components/schemas/GitHubPullRequest' }
          }
        }
      }
    },

    createReview: {
      name: 'createReview',
      description: 'Create a PR review',

      input: {
        type: 'object',
        required: ['owner', 'repo', 'pullNumber', 'event'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          pullNumber: { type: 'number' },
          commit_id: { type: 'string' },
          body: { type: 'string' },
          event: { 
            type: 'string', 
            enum: ['APPROVE', 'REQUEST_CHANGES', 'COMMENT'] 
          },
          comments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string' },
                position: { type: 'number' },
                body: { type: 'string' }
              }
            }
          }
        }
      },

      output: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          state: { type: 'string' }
        }
      }
    },

    // ----------------------------------------
    // Branch Operations
    // ----------------------------------------

    createBranch: {
      name: 'createBranch',
      description: 'Create a new branch',

      input: {
        type: 'object',
        required: ['owner', 'repo', 'ref', 'sha'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          ref: { type: 'string', description: 'New branch name (refs/heads/name)' },
          sha: { type: 'string', description: 'SHA of commit to branch from' }
        }
      },

      output: {
        type: 'object',
        properties: {
          ref: { type: 'string' },
          sha: { type: 'string' }
        }
      }
    },

    listBranches: {
      name: 'listBranches',
      description: 'List repository branches',

      input: {
        type: 'object',
        required: ['owner', 'repo'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          protected: { type: 'boolean' }
        }
      },

      output: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                commit: { type: 'object' },
                protected: { type: 'boolean' }
              }
            }
          }
        }
      }
    },

    // ----------------------------------------
    // Release Operations
    // ----------------------------------------

    createRelease: {
      name: 'createRelease',
      description: 'Create a new release',

      input: {
        type: 'object',
        required: ['owner', 'repo', 'tag_name'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          tag_name: { type: 'string' },
          target_commitish: { type: 'string', default: 'main' },
          name: { type: 'string' },
          body: { type: 'string' },
          draft: { type: 'boolean', default: false },
          prerelease: { type: 'boolean', default: false },
          generate_release_notes: { type: 'boolean', default: true }
        }
      },

      output: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          tag_name: { type: 'string' },
          html_url: { type: 'string' },
          upload_url: { type: 'string' }
        }
      },

      examples: [
        {
          name: 'Create version release',
          input: {
            owner: 'myorg',
            repo: 'myproject',
            tag_name: 'v1.2.0',
            name: 'Version 1.2.0',
            body: '## New Features\n- Feature A\n- Feature B\n\n## Bug Fixes\n- Fix for #123',
            generate_release_notes: true
          }
        }
      ]
    },

    // ----------------------------------------
    // Workflow (Actions) Operations
    // ----------------------------------------

    listWorkflows: {
      name: 'listWorkflows',
      description: 'List GitHub Actions workflows',

      input: {
        type: 'object',
        required: ['owner', 'repo'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' }
        }
      },

      output: {
        type: 'object',
        properties: {
          workflows: { 
            type: 'array',
            items: { $ref: '#/components/schemas/GitHubWorkflow' }
          }
        }
      }
    },

    triggerWorkflow: {
      name: 'triggerWorkflow',
      description: 'Trigger a workflow dispatch event',

      input: {
        type: 'object',
        required: ['owner', 'repo', 'workflow_id', 'ref'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          workflow_id: { type: 'string', description: 'Workflow file name or ID' },
          ref: { type: 'string', description: 'Branch or tag name' },
          inputs: { type: 'object', description: 'Workflow inputs' }
        }
      },

      output: {
        type: 'object',
        properties: {}
      }
    },

    listWorkflowRuns: {
      name: 'listWorkflowRuns',
      description: 'List workflow runs',

      input: {
        type: 'object',
        required: ['owner', 'repo'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          workflow_id: { type: 'string' },
          status: { type: 'string', enum: ['queued', 'in_progress', 'completed'] },
          conclusion: { type: 'string' }
        }
      },

      output: {
        type: 'object',
        properties: {
          workflow_runs: { 
            type: 'array',
            items: { $ref: '#/components/schemas/GitHubWorkflowRun' }
          }
        }
      }
    },

    // ----------------------------------------
    // Comment Operations
    // ----------------------------------------

    createIssueComment: {
      name: 'createIssueComment',
      description: 'Add a comment to an issue or PR',

      input: {
        type: 'object',
        required: ['owner', 'repo', 'issueNumber', 'body'],
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          issueNumber: { type: 'number', description: 'Issue or PR number' },
          body: { type: 'string' }
        }
      },

      output: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          html_url: { type: 'string' }
        }
      }
    }
  },

  // ============================================
  // Events (Webhooks)
  // ============================================

  events: {
    push: {
      name: 'push',
      description: 'Triggered on push to repository',
      schema: {
        type: 'object',
        properties: {
          ref: { type: 'string' },
          before: { type: 'string' },
          after: { type: 'string' },
          repository: { $ref: '#/components/schemas/GitHubRepository' },
          sender: { $ref: '#/components/schemas/GitHubUser' },
          commits: { type: 'array' }
        }
      }
    },

    pull_request: {
      name: 'pull_request',
      description: 'Triggered on PR events',
      schema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['opened', 'closed', 'reopened', 'synchronize', 'edited', 'review_requested'] },
          number: { type: 'number' },
          pull_request: { $ref: '#/components/schemas/GitHubPullRequest' },
          repository: { $ref: '#/components/schemas/GitHubRepository' },
          sender: { $ref: '#/components/schemas/GitHubUser' }
        }
      }
    },

    issues: {
      name: 'issues',
      description: 'Triggered on issue events',
      schema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['opened', 'closed', 'reopened', 'edited', 'labeled', 'unlabeled', 'assigned'] },
          issue: { $ref: '#/components/schemas/GitHubIssue' },
          repository: { $ref: '#/components/schemas/GitHubRepository' },
          sender: { $ref: '#/components/schemas/GitHubUser' }
        }
      }
    },

    release: {
      name: 'release',
      description: 'Triggered on release events',
      schema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['published', 'unpublished', 'created', 'deleted', 'prereleased', 'released'] },
          release: { $ref: '#/components/schemas/GitHubRelease' },
          repository: { $ref: '#/components/schemas/GitHubRepository' },
          sender: { $ref: '#/components/schemas/GitHubUser' }
        }
      }
    },

    workflow_run: {
      name: 'workflow_run',
      description: 'Triggered on workflow run events',
      schema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['completed', 'requested', 'in_progress'] },
          workflow_run: { $ref: '#/components/schemas/GitHubWorkflowRun' },
          repository: { $ref: '#/components/schemas/GitHubRepository' },
          sender: { $ref: '#/components/schemas/GitHubUser' }
        }
      }
    },

    check_run: {
      name: 'check_run',
      description: 'Triggered on check run events',
      schema: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          check_run: { type: 'object' },
          repository: { $ref: '#/components/schemas/GitHubRepository' }
        }
      }
    }
  },

  // ============================================
  // Constraints
  // ============================================

  constraints: [
    {
      type: 'rate-limit',
      description: 'GitHub API rate limits',
      config: { 
        authenticated: 5000,
        unauthenticated: 60
      }
    },
    {
      type: 'branch-protection',
      description: 'Cannot force push to protected branches',
      config: { enforceProtection: true }
    },
    {
      type: 'required-status-checks',
      description: 'PR must pass status checks before merge',
      config: { enforceChecks: true }
    }
  ],

  // ============================================
  // Helper Methods
  // ============================================

  helpers: {
    /**
     * Parse repository from full name
     */
    parseRepo(fullName: string): { owner: string; repo: string } {
      const [owner, repo] = fullName.split('/');
      return { owner, repo };
    },

    /**
     * Build PR body template
     */
    buildPRBody(options: {
      summary: string;
      changes: string[];
      testing?: string[];
      breaking?: boolean;
      closes?: number[];
    }): string {
      const sections: string[] = [`## Summary\n\n${options.summary}`];

      if (options.changes.length > 0) {
        sections.push('## Changes\n\n' + options.changes.map(c => `- ${c}`).join('\n'));
      }

      if (options.testing?.length) {
        sections.push('## Testing\n\n' + options.testing.map(t => `- [ ] ${t}`).join('\n'));
      }

      if (options.breaking) {
        sections.push('## ⚠️ Breaking Changes\n\nThis PR contains breaking changes. Please review carefully.');
      }

      if (options.closes?.length) {
        sections.push('\n\n' + options.closes.map(n => `Closes #${n}`).join('\n'));
      }

      return sections.join('\n\n');
    },

    /**
     * Generate changelog from commits
     */
    generateChangelog(commits: Array<{ message: string; sha: string }>): string {
      const features: string[] = [];
      const fixes: string[] = [];
      const others: string[] = [];

      for (const commit of commits) {
        const firstLine = commit.message.split('\n')[0];
        if (firstLine.startsWith('feat:') || firstLine.startsWith('feat(')) {
          features.push(`- ${firstLine.replace(/^feat(\([^)]+\))?:\s*/, '')} (${commit.sha.slice(0, 7)})`);
        } else if (firstLine.startsWith('fix:') || firstLine.startsWith('fix(')) {
          fixes.push(`- ${firstLine.replace(/^fix(\([^)]+\))?:\s*/, '')} (${commit.sha.slice(0, 7)})`);
        } else {
          others.push(`- ${firstLine} (${commit.sha.slice(0, 7)})`);
        }
      }

      const sections: string[] = [];
      if (features.length > 0) {
        sections.push('## Features\n\n' + features.join('\n'));
      }
      if (fixes.length > 0) {
        sections.push('## Bug Fixes\n\n' + fixes.join('\n'));
      }
      if (others.length > 0) {
        sections.push('## Other Changes\n\n' + others.join('\n'));
      }

      return sections.join('\n\n');
    },

    /**
     * Format PR for Slack notification
     */
    formatPRForSlack(pr: GitHubPullRequest): string {
      const statusEmoji = pr.merged ? '🟣' : pr.state === 'closed' ? '🔴' : pr.draft ? '⚪' : '🟢';
      return `${statusEmoji} [${pr.base.repo.full_name}#${pr.number}] ${pr.title}
Author: @${pr.user.login}
Branch: ${pr.head.ref} → ${pr.base.ref}
Changes: +${pr.additions} -${pr.deletions}
${pr.html_url}`;
    }
  }
};

// ============================================
// Export Default
// ============================================

export default githubConnector;

// ============================================
// Usage Examples
// ============================================

/**
 * @example Auto-create issue on alert
 * ```typescript
 * const workflow = defineWorkflow({
 *   name: 'auto-github-issue',
 *   trigger: { type: 'webhook', path: '/alert' },
 *   steps: [
 *     {
 *       id: 'create-issue',
 *       connector: 'github',
 *       operation: 'createIssue',
 *       input: {
 *         owner: 'myorg',
 *         repo: 'myproject',
 *         title: '[Alert] ${input.title}',
 *         body: '## Alert Details\n\n```\n${JSON.stringify(input, null, 2)}\n```',
 *         labels: ['automated', 'alert']
 *       }
 *     }
 *   ]
 * });
 * ```
 * 
 * @example PR automation workflow
 * ```typescript
 * const prWorkflow = defineWorkflow({
 *   name: 'pr-automation',
 *   trigger: {
 *     type: 'webhook',
 *     connector: 'github',
 *     event: 'pull_request',
 *     filter: { action: 'opened' }
 *   },
 *   steps: [
 *     {
 *       id: 'check-pr-size',
 *       connector: 'github',
 *       operation: 'getPullRequest',
 *       input: {
 *         owner: '${trigger.repository.owner.login}',
 *         repo: '${trigger.repository.name}',
 *         pullNumber: '${trigger.number}'
 *       }
 *     },
 *     {
 *       id: 'add-size-label',
 *       connector: 'github',
 *       operation: 'updateIssue',
 *       condition: '${steps.check-pr-size.result.additions > 500}',
 *       input: {
 *         owner: '${trigger.repository.owner.login}',
 *         repo: '${trigger.repository.name}',
 *         issueNumber: '${trigger.number}',
 *         labels: ['size: large']
 *       }
 *     },
 *     {
 *       id: 'notify-slack',
 *       connector: 'slack',
 *       operation: 'sendMessage',
 *       input: {
 *         channel: '#pr-reviews',
 *         text: 'New PR: ${trigger.pull_request.title}\n${trigger.pull_request.html_url}'
 *       }
 *     }
 *   ]
 * });
 * ```
 * 
 * @example Release workflow
 * ```typescript
 * const releaseWorkflow = defineWorkflow({
 *   name: 'create-release',
 *   trigger: { type: 'manual' },
 *   steps: [
 *     {
 *       id: 'create-tag',
 *       connector: 'github',
 *       operation: 'createRef',
 *       input: {
 *         owner: 'myorg',
 *         repo: 'myproject',
 *         ref: 'refs/tags/${input.version}',
 *         sha: '${input.commitSha}'
 *       }
 *     },
 *     {
 *       id: 'create-release',
 *       connector: 'github',
 *       operation: 'createRelease',
 *       input: {
 *         owner: 'myorg',
 *         repo: 'myproject',
 *         tag_name: '${input.version}',
 *         name: 'Release ${input.version}',
 *         body: '${input.changelog}',
 *         generate_release_notes: true
 *       }
 *     },
 *     {
 *       id: 'notify-team',
 *       connector: 'slack',
 *       operation: 'sendMessage',
 *       input: {
 *         channel: '#releases',
 *         text: '🚀 New release: ${steps.create-release.result.html_url}'
 *       }
 *     }
 *   ]
 * });
 * ```
 */
