# NBAgents - Multi-Agent System

## AgentShare 部署工具

NBAgents 智能部署工具 - 支持 Agent 扫描、部署和提取功能，使用 Node.js + Ink 提供现代化 TUI 体验。

### 功能特性

- 🔍 **自动扫描**: 检测 OpenCode 和 Claude Code 已安装的 Agents
- 📦 **智能部署**: 将项目中的 Agents 部署到不同平台
- 📥 **提取功能**: 从平台提取 Agents 到项目
- 🎨 **现代化 UI**: 使用 Ink 提供流畅的交互界面
- ⚡️ **Clean Mode**: 自动清理屏幕，保持终端整洁
- 🌐 **多语言支持**: 内置英文和简体中文支持 (Startup Selection)

### 快速开始

#### 方式一：全局安装 (推荐)

运行安装脚本，将 `agentshare` 命令添加到系统 PATH：

```bash
./install-macos-linux.sh
```

安装完成后，您可以在任何位置使用：

```bash
agentshare
```

#### 方式二：Windows 安装 (PowerShell)

确保安装了 Git (Git Bash)。在 PowerShell 中运行：

```powershell
.\install-windows.ps1
```

这将创建 `agentshare` 命令并自动配置必要的环境。

#### 方式三：直接运行

如果不想全局安装，可以直接运行：

```bash
./AgentShare.sh
```

### 安装脚本功能

`install-macos-linux.sh` 会自动完成以下操作：

1. ✅ 检测操作系统 (macOS/Linux)
2. ✅ 检查 Node.js 环境
3. ✅ 验证 AgentShare.sh 存在
4. ✅ 创建全局启动脚本
5. ✅ 安装到 `/usr/local/bin` 或 `~/.local/bin`
6. ✅ 配置 PATH 环境变量
7. ✅ 测试安装是否成功

### 卸载

如果需要卸载，只需删除启动脚本：

```bash
# 如果安装在 /usr/local/bin
sudo rm /usr/local/bin/agentshare

# 如果安装在 ~/.local/bin
rm ~/.local/bin/agentshare
```

### 主要功能

1. **部署 Agent (项目 → 平台)**
   - 将项目中的 Agents 部署到 OpenCode 或 Claude Code
   - 支持同时部署到多个平台
   - 自动复制配置、Skills、Workflows 等

2. **提取 Agent (平台 → 项目)**
   - 从 OpenCode 或 Claude Code 提取已安装的 Agents
   - 保留完整的目录结构
   - 自动生成 README

---

## Available Agents

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
