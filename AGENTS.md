# 项目背景
- 创建一个商业机会研究员 Agent，主要目标是通过各种能力组合来探索当下最值得开发的 App/软件产品

# 研究员主要组成部分
- Agent： 基于 Claude Agent SDK 开发
- Browser Plugin: 给 Agent 在浏览器中检索、获取信息的能力，通过开源 MCP 实现：https://github.com/hangwin/mcp-chrome
- 工具集约束：规定研究员能用哪些 tools

# Tech Stack

- **Primary Language**: TypeScript (Node.js)
- **Framework**: Claude Agent SDK
- **Package Manager**: npm (or pnpm/yarn - to be determined)
- **Testing**: Jest or Vitest (TBD)
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Build Tool**: tsc or esbuild (TBD)

## Model Configuration
Available models for the agent:
- **deepseek-r1**: OpenRouter API (free tier for exploration)
- **deepseek-v3.2**: DeepSeek official API
- **gemini-3-flash-preview**: Google API via OpenRouter

**🚨 CRITICAL SECURITY NOTE**: API keys are currently exposed in docs/PRD.md. These must be rotated immediately and moved to environment variables.


# Development Setup

## Prerequisites
- Node.js 18+ (recommended LTS)
- npm or pnpm

## Initial Setup
```bash
npm install
```

## Environment Variables
Create a `.env` file based on `.env.example` (if exists). Never commit `.env` files.

Example `.env`:
```
OPENROUTER_API_KEY=your_key_here
DEEPSEEK_API_KEY=your_key_here
```

**Security Alert**: Never commit API keys or secrets. The PRD.md currently contains exposed API keys - these should be rotated immediately and moved to environment variables.


# Build/Lint/Test Commands

## Common npm scripts (expected)
```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "npm run lint -- --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "typecheck": "tsc --noEmit"
  }
}
```

## Running a single test
```bash
npm test -- --testPathPattern=filename
# or using jest directly
npx jest path/to/testfile.test.ts
```

## Type Checking
```bash
npm run typecheck
# or
npx tsc --noEmit
```

## Linting
```bash
npm run lint
```

## Auto-fix lint issues
```bash
npm run lint:fix
```

## Formatting
```bash
npm run format
```

## Build for production
```bash
npm run build
```

## Development mode with hot reload
```bash
npm run dev
```


# Code Style Guidelines

## TypeScript
- Use strict mode (`"strict": true` in tsconfig.json)
- Explicitly define return types for functions (except simple arrow functions)
- Use `interface` for object definitions, `type` for unions, intersections, and aliases
- Prefer `const` over `let`; avoid `var`
- Use `readonly` for immutable properties

## Imports
- Group imports in order: external modules, internal modules, relative imports
- Use absolute imports via path aliases (configured in tsconfig)
- Example:
```typescript
import { Agent } from '@claude/agent-sdk';
import { someUtil } from '@/utils';
import { LocalType } from './types';
```

## Naming Conventions
- **Variables**: camelCase
- **Functions**: camelCase
- **Classes**: PascalCase
- **Interfaces**: PascalCase (prefix 'I' not required)
- **Constants**: UPPER_SNAKE_CASE for global constants, camelCase for module-level
- **Files**: kebab-case for filenames (e.g., `user-service.ts`)
- **Test files**: `*.test.ts` or `*.spec.ts`

## Error Handling
- Use `try/catch` for async operations
- Throw meaningful error objects (not strings)
- Consider using `Result` pattern for functions that can fail
- Log errors with appropriate context

## Async/Await
- Prefer `async/await` over raw Promises
- Avoid `async` without `await` (unless intentional)
- Handle promise rejections with `catch` or top-level error handlers

## Comments
- Use JSDoc for public APIs
- Include `@param`, `@returns`, `@throws` where helpful
- Avoid obvious comments; let code speak for itself
- Use `// TODO:` for temporary workarounds

## Formatting Rules
- 2-space indentation
- Semicolons required
- Single quotes for strings
- Trailing commas in multiline objects/arrays
- Max line length: 100 characters

## Skill Development
- Skills are located in `SKILLS/` directory with versioned subdirectories (`V1/`, `V2/`, etc.)
- Each skill must include a `SKILL.md` file with frontmatter:
  ```yaml
  ---
  name: skill-name
  description: Brief description of the skill's purpose
  ---
  ```
- Skills should be modular, reusable, and follow established patterns
- Use consistent Chinese-English naming based on skill context


# Git & Commit Conventions

## Branch Naming
- `feature/` for new features
- `fix/` for bug fixes
- `docs/` for documentation
- `refactor/` for code refactoring
- `chore/` for maintenance tasks

## Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(agent): add browser plugin integration

- Implement MCP Chrome integration
- Add navigation and screenshot capabilities
- Update agent configuration

Closes #123
```

## Pull Requests
- PR title should follow commit convention
- Description should include context, changes, and testing steps
- Link related issues
- Ensure all tests pass and linting checks succeed


# Security Best Practices

1. **Never commit secrets** (API keys, passwords, tokens)
2. Use environment variables via `.env` files (add `.env` to `.gitignore`)
3. Rotate any exposed keys immediately (check PRD.md for currently exposed keys)
4. Validate and sanitize user inputs
5. Keep dependencies updated (run `npm audit` regularly)
6. Use HTTPS for all external requests


# Agent-Specific Guidelines

## Tool Development
- Tools should be stateless and idempotent when possible
- Include comprehensive error handling
- Provide clear documentation for each tool
- Follow MCP specifications for browser tools

## Skill Implementation
- Skills are located in `SKILLS/` directory
- Each skill should have a `SKILL.md` with clear instructions
- Skills should be modular and reusable

## Testing Agent Behavior
- Mock external API calls
- Test tool interactions in isolation
- Simulate browser interactions with headless Chrome


# Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Run development server | `npm run dev` |
| Run all tests | `npm test` |
| Run single test | `npx jest path/to/testfile.test.ts` |
| Lint code | `npm run lint` |
| Fix lint issues | `npm run lint:fix` |
| Type check | `npm run typecheck` |
| Format code | `npm run format` |
| Build project | `npm run build` |
| Check for vulnerabilities | `npm audit` |


# Git & Commit Conventions

## Branch Naming
- `feature/` for new features
- `fix/` for bug fixes
- `docs/` for documentation
- `refactor/` for code refactoring
- `chore/` for maintenance tasks

## Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(agent): add browser plugin integration

- Implement MCP Chrome integration
- Add navigation and screenshot capabilities
- Update agent configuration

Closes #123
```

## Pull Requests
- PR title should follow commit convention
- Description should include context, changes, and testing steps
- Link related issues
- Ensure all tests pass and linting checks succeed


# Security Best Practices

1. **Never commit secrets** (API keys, passwords, tokens)
2. Use environment variables via `.env` files (add `.env` to `.gitignore`)
3. Rotate any exposed keys immediately (check PRD.md for currently exposed keys)
4. Validate and sanitize user inputs
5. Keep dependencies updated (run `npm audit` regularly)
6. Use HTTPS for all external requests


# Agent-Specific Guidelines

## Tool Development
- Tools should be stateless and idempotent when possible
- Include comprehensive error handling
- Provide clear documentation for each tool
- Follow MCP specifications for browser tools

## Skill Implementation
- Skills are located in `SKILLS/` directory
- Each skill should have a `SKILL.md` with clear instructions
- Skills should be modular and reusable

## Testing Agent Behavior
- Mock external API calls
- Test tool interactions in isolation
- Simulate browser interactions with headless Chrome


# Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Run development server | `npm run dev` |
| Run all tests | `npm test` |
| Run single test | `npx jest path/to/testfile.test.ts` |
| Lint code | `npm run lint` |
| Fix lint issues | `npm run lint:fix` |
| Type check | `npm run typecheck` |
| Format code | `npm run format` |
| Build project | `npm run build` |
| Check for vulnerabilities | `npm audit` |


# Notes for AI Agents

- Always run `npm run lint` and `npm run typecheck` after making changes
- Follow existing code patterns in the repository
- When adding new dependencies, consider size and security implications
- Update documentation when changing APIs
- If uncertain about code style, refer to this document

---

*This file will be used by agentic coding assistants to understand project conventions and execute tasks effectively.*