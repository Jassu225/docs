/**
 * Where each internal command, script and subagent lives, so a reader can go
 * straight from a mention to its source.
 */
const KS = 'https://github.com/Jassu225/ks/blob/main/plugins/ks';

export const refs: Record<string, string> = {
  // Scripts
  'ks-start-ticket': `${KS}/scripts/ks-start-ticket.ts`,
  'claude-ks': `${KS}/scripts/claude-ks`,
  linear: `${KS}/scripts/linear-cli.ts`,
  slack: `${KS}/scripts/slack-cli.ts`,
  grain: `${KS}/scripts/grain-cli.ts`,

  // Skills
  '/ks:project-manager': `${KS}/commands/project-manager.md`,
  '/ks:user-context-generator': `${KS}/commands/user-context-generator.md`,
  '/ks:research_codebase': `${KS}/commands/research_codebase.md`,
  '/ks:create_plan': `${KS}/commands/create_plan.md`,
  '/ks:implement-plan': `${KS}/commands/implement-plan.md`,
  '/ks:create_pr': `${KS}/commands/create_pr.md`,
  '/ks:create_handoff': `${KS}/commands/create_handoff.md`,
  '/ks:linear': `${KS}/commands/linear.md`,
  '/ks:slack': `${KS}/commands/slack.md`,
  '/ks:grain-cli': `${KS}/skills/grain-cli/SKILL.md`,

  // Research subagents
  'codebase-locator': `${KS}/agents/codebase-locator.md`,
  'codebase-analyzer': `${KS}/agents/codebase-analyzer.md`,
  'codebase-pattern-finder': `${KS}/agents/codebase-pattern-finder.md`,

  // External
  '@linear/sdk': 'https://www.npmjs.com/package/@linear/sdk',
  crv: 'https://github.com/HUANGCHIHHUNGLeo/claude-real-video',
  'git worktree': 'https://git-scm.com/docs/git-worktree',
};
