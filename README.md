# NBAgents - Multi-Agent System

This project hosts multiple specialized AI Agents. Current agent list:

## Available Agents

### 1. [kuko](agents/kuko/README.md)
**Business Opportunity Researcher**
Designed for independent developers and small teams to quickly identify the most valuable App/software product directions worth pursuing, and advance opportunities from "ideas" to "verifiable solutions" within limited time.

---

## Project Structure

- `agents/`: Directory for all agents
  - `kuko/`: Business Opportunity Researcher Agent
    - `opencode/`: OpenCode configuration
    - `claude/`: Claude Code configuration
    - `shared/`: Shared resources (Skills, Workflows, Docs)

---

## Quick Start

### Using kuko
1. Ensure OpenCode is installed.
2. Configure the `.env` file (refer to `agents/kuko/.env.example`).
3. Select the kuko Agent and start chatting.

---

## API Key Configuration

### Required API Keys

You only need to configure **2** MCP tool API keys:

1. **GITHUB_TOKEN** - For GitHub MCP tool
2. **BRAVE_API_KEY** - For Brave Search MCP tool

### Not Required in .env

The following AI model API keys are **NOT** needed in your `.env` file, as they are managed by OpenCode/Claude Code:

- ❌ ANTHROPIC_API_KEY (Claude models)
- ❌ OPENAI_API_KEY (GPT models)
- ❌ GEMINI_API_KEY (Gemini models)

---

## Why MCP Tool Keys Are Needed

### MCP Tools vs AI Models

```
┌─────────────────────────────────────────────────────────┐
│                        kuko Agent                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  AI Models (Managed by Platform)                        │
│  ├─ Claude (Anthropic)  ← OpenCode/Claude Code managed │
│  ├─ GPT (OpenAI)        ← OpenCode/Claude Code managed │
│  └─ Gemini (Google)     ← OpenCode/Claude Code managed │
│                                                          │
│  MCP Tools (Require Independent Configuration)          │
│  ├─ GitHub MCP          ← Requires GITHUB_TOKEN         │
│  ├─ Brave Search MCP    ← Requires BRAVE_API_KEY        │
│  ├─ Playwright MCP      ← No key required               │
│  ├─ Fetch MCP           ← No key required               │
│  ├─ SQLite MCP          ← No key required               │
│  └─ Filesystem MCP      ← No key required               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Specific Use Cases

**GitHub MCP** (requires GITHUB_TOKEN):
- Search open-source projects
- Analyze competitor tech stacks
- Review code implementations
- Assess technical feasibility

**Brave Search MCP** (requires BRAVE_API_KEY):
- Perform web searches
- Collect market information
- Find user discussions
- Obtain trend data

---

## How to Obtain API Keys

### 1. GitHub Token

**Steps**:
1. Visit https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Set name: `kuko Agent`
4. Select permissions:
   - ✅ `public_repo` (access public repositories)
   - For private repos, select `repo`
5. Click "Generate token"
6. Copy the generated token (shown only once!)

**Example**:
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Brave Search API Key

**Steps**:
1. Visit https://brave.com/search/api/
2. Click "Get Started" or "Sign Up"
3. Create an account and log in
4. Find your API Key in the Dashboard
5. Copy the API Key

**Example**:
```
BSAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Free Tier**:
- 2,000 free queries per month
- Usually sufficient for research purposes

---

## Configuration Steps

### 1. Create .env File

```bash
cd agents/kuko
cp .env.example .env
```

### 2. Edit .env File

```bash
# Use your preferred editor
vim .env
# or
code .env
# or
open -e .env
```

### 3. Add Your Keys

Only fill in these two:

```bash
GITHUB_TOKEN=ghp_your_actual_github_token_here
BRAVE_API_KEY=BSA_your_actual_brave_api_key_here
```

**Do NOT** include these (comment out or delete):

```bash
# ANTHROPIC_API_KEY=...  # ← Not needed
# OPENAI_API_KEY=...     # ← Not needed
# GEMINI_API_KEY=...     # ← Not needed
```

### 4. Load Environment Variables

```bash
source .env
```

### 5. Verify Configuration

```bash
echo $GITHUB_TOKEN    # Should display your token
echo $BRAVE_API_KEY   # Should display your API key
```

---

## FAQ

### Q1: Why don't AI model keys need to be configured?

**A**: OpenCode and Claude Code already manage AI model API keys at the platform level. Once configured in the platform, all Agents can use them directly without needing to reconfigure for each project.

### Q2: What if I want to use a different search engine?

**A**: You can replace Brave Search MCP with other search MCPs, such as:
- Google Search MCP (requires Google API Key)
- Bing Search MCP (requires Bing API Key)
- DuckDuckGo MCP (usually doesn't require API Key)

### Q3: What permissions should I set for GitHub Token?

**A**: 
- **Minimum**: `public_repo` (access public repositories only)
- **Recommended**: `public_repo` is sufficient for most research scenarios
- **Extended**: Only need `repo` if analyzing private repositories

### Q4: Is the Brave Search free tier sufficient?

**A**: 
- Free tier: 2,000 queries/month
- One complete research: ~50-100 searches
- Conclusion: Usually sufficient for personal research

### Q5: What if my keys are leaked?

**A**: 
- **GitHub Token**: Immediately delete the old token at https://github.com/settings/tokens and generate a new one
- **Brave API Key**: Regenerate in the Brave Dashboard
- **Check**: Ensure `.env` is in `.gitignore` and won't be committed to Git

---

## Security Best Practices

1. **Don't Commit to Git**
   - `.env` is already in `.gitignore`
   - Don't hardcode keys in code

2. **Regular Rotation**
   - Recommend changing keys every 3-6 months
   - Especially GitHub Token

3. **Principle of Least Privilege**
   - Only grant necessary permissions
   - Prefer `public_repo` for GitHub Token

4. **Monitor Usage**
   - Regularly check GitHub Token usage
   - Monitor Brave Search API call counts

---

## Troubleshooting

### Issue: MCP Tools Not Working

**Checklist**:
```bash
# 1. Confirm environment variables are loaded
echo $GITHUB_TOKEN
echo $BRAVE_API_KEY

# 2. Confirm .env file exists
ls -la .env

# 3. Reload environment variables
source .env

# 4. Check key format
# GitHub Token should start with ghp_
# Brave API Key should start with BSA
```

### Issue: GitHub MCP Returns 401 Unauthorized

**Cause**: Invalid GitHub Token or insufficient permissions

**Solution**:
1. Check if token was copied correctly
2. Confirm token hasn't expired
3. Regenerate token

### Issue: Brave Search Quota Exceeded

**Cause**: Exceeded free tier (2,000/month)

**Solution**:
1. Wait for next month's reset
2. Upgrade to paid plan
3. Use alternative search MCP

---

## Related Documentation

- [AGENT_SPEC_en.md](AGENT_SPEC_en.md) - Agent Design and Development Specification
- [agents/kuko/README.md](agents/kuko/README.md) - kuko Agent Documentation
