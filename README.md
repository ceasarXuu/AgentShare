# AgentShare - Multi-Agent System

[中文文档](README-zh.md)

## AgentShare Deployment Tool

AgentShare Intelligent Deployment Tool - Supports cross-platform Agent/Skill management with a modern TUI experience using Node.js + Ink.

### Features

- 🔍 **Platform Detection**: Detect installed platforms from schema-defined paths
- 📊 **Overview Dashboard**: Show global/project Agent & Skill counts per platform
- 🤖 **Agent Management**: Deploy/Extract/Uninstall Agents (where supported)
- 🛠️  **Skill Management**: Deploy/Extract/Uninstall Skills (where supported)
- 🔧 **MCP Sync**: Apply MCP server config when deploying Agents (where supported)
- 🎨 **Modern UI**: Smooth interactive interface using Ink
- 🌐 **Multi-language**: Built-in English and Simplified Chinese support (Startup Selection)

### Quick Start

#### Method 1: Global Installation (Recommended)

Run the install script to add `agentshare` command to system PATH:

```bash
./install-macos-linux.sh
```

After installation, you can use it anywhere:

```bash
agentshare
```

#### Method 2: Windows Installation (PowerShell)

Ensure Git (Git Bash) is installed. Run in PowerShell:

```powershell
.\install-windows.ps1
```

This will create `agentshare` command and configure necessary environment.

#### Method 3: Direct Run

If you don't want global installation:

```bash
./AgentShare.sh
```

### Install Script Features

`install-macos-linux.sh` automatically performs:

1. ✅ Detect OS (macOS/Linux)
2. ✅ Check Node.js environment
3. ✅ Verify AgentShare.sh exists
4. ✅ Create global launcher
5. ✅ Install to `/usr/local/bin` or `~/.local/bin`
6. ✅ Configure PATH environment variable
7. ✅ Test installation

### Uninstall

To uninstall, just delete the launcher:

```bash
# If installed in /usr/local/bin
sudo rm /usr/local/bin/agentshare

# If installed in ~/.local/bin
rm ~/.local/bin/agentshare
```

### Main Functions

1. **Deploy Agent (Project → Platform)**
   - Deploy repository Agents to platforms that support Agents (based on schemas)
   - Support simultaneous deployment to multiple platforms
   - Sync MCP server config when supported by the platform

2. **Extract Agent (Platform → Project)**
   - Extract Agent definitions from a platform back into the repository

3. **Uninstall Agent**
   - Remove an Agent from a platform (where supported)

4. **Skill Management**
   - Deploy/Extract/Uninstall Skills to/from platforms that support Skills
   - Support both global scope and project scope (when platform schema provides project paths)

---

## Available Agents

### 1. [kuko](agents/kuko/agent.md)
**Business Opportunity Researcher**
Designed for independent developers and small teams to quickly identify the most valuable App/software product directions worth pursuing, and advance opportunities from "ideas" to "verifiable solutions" within limited time.

---

## Project Structure

- `agents/`: Agent definitions (neutral format)
  - `<agent_name>/agent.md`: Agent definition file (Markdown + frontmatter)
  - `<agent_name>/docs/`: Optional agent docs
  - `<agent_name>/workflows/`: Optional workflows
- `skills/`: Reusable Skills (each skill has a `SKILL.md`)
- `schemas/`: Platform schemas that define detection paths, outputs, and capabilities

---

## Quick Start

### Using kuko
1. Install and run AgentShare: `agentshare`
2. Select **Agent Management** → **Deploy Agent** and choose `kuko`
3. Select the target platform and scope (global/project) where supported

---

## API Key Configuration

### Required API Keys

If you use MCP servers that require credentials, configure these environment variables where your platform reads them:

1. **GITHUB_TOKEN** - For GitHub MCP tool
2. **BRAVE_API_KEY** - For Brave Search MCP tool

### Not Required Here

The following AI model API keys are typically managed by your platform (e.g., OpenCode/Claude Code) rather than this repository:

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

### Set Environment Variables

```bash
export GITHUB_TOKEN=ghp_your_actual_github_token_here
export BRAVE_API_KEY=BSA_your_actual_brave_api_key_here
```

### Verify Configuration

```bash
echo $GITHUB_TOKEN    # Should display your token
echo $BRAVE_API_KEY   # Should display your API key
```

---

## FAQ

### Q1: Why don't AI model keys need to be configured?

**A**: OpenCode and Claude Code already manage AI model API keys at the platform level. Once configured in the platform, all Agents can use them directly without needing to reconfigure for each project. Kilo Code (VS Code Plugin) typically uses your IDE's existing configuration.

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
- **Check**: Ensure keys are not committed to Git and are stored in a secret manager when possible

---

## Security Best Practices

1. **Don't Commit to Git**
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

# 2. Restart the process that runs your platform/CLI if needed
# 3. Check key format
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

- [AGENTS.md](AGENTS.md) - Project background and rules
- [agent.md](agents/kuko/agent.md) - kuko Agent definition
