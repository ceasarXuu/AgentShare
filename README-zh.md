# AgentShare - 多智能体系统

[English Docs](README.md)

## AgentShare 部署工具

AgentShare 智能部署工具 - 提供跨平台 Agent/Skill 管理能力，使用 Node.js + Ink 提供现代化 TUI 体验。

### 功能特性

- 🔍 **平台探测**: 基于 schemas 定义的路径探测已安装的平台
- 📊 **概览面板**: 按平台展示全局/项目的 Agent 与 Skill 数量
- 📦 **Agent 管理**: 部署/提取/卸载 Agents（以平台 schema 能力为准）
- 🛠️  **Skill 管理**: 部署/提取/卸载 Skills（以平台 schema 能力为准）
- 🔧 **MCP 同步**: 部署 Agent 时写入 MCP 配置（平台支持时）
- 🎨 **现代化 UI**: 使用 Ink 提供流畅的交互界面
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
   - 将仓库中的 Agents 部署到支持 Agents 的平台（以 schemas 定义为准）
   - 支持同时部署到多个平台
   - 平台支持时同步写入 MCP 配置

2. **提取 Agent (平台 → 项目)**
   - 从平台提取 Agent 定义回仓库

3. **卸载 Agent**
   - 从平台移除 Agent（以平台 schema 能力为准）

4. **Skill 管理**
   - 在支持 Skills 的平台上部署/提取/卸载 Skills
   - 支持全局 scope 与项目 scope（平台提供 project_paths 时）

---

该项目托管了多个专用的 AI Agent。目前的 Agent 列表如下：

## 可用的 Agents

### 1. [kuko](agents/kuko/agent.md)
**商业机会研究员**
面向独立开发者与小团队，目标是在有限时间内快速找到当下最值得做的 App/软件产品方向，并把机会从"想法"推进到"可验证的方案"。

---

## 目录结构

- `agents/`: Agent 定义（中立标准）
  - `<agent_name>/agent.md`: Agent 定义文件（Markdown + frontmatter）
  - `<agent_name>/docs/`: 可选文档
  - `<agent_name>/workflows/`: 可选 workflows
- `skills/`: 可复用 Skills（每个 skill 都包含 `SKILL.md`）
- `schemas/`: 平台 schemas（路径探测、输出定义、能力声明）

---

## 快速开始

### 使用 kuko
1. 安装并运行 AgentShare：`agentshare`
2. 选择 **Agent 管理** → **部署 Agent** 并选择 `kuko`
3. 选择目标平台与 scope（平台支持时可选全局/项目）

---

## API 密钥配置说明

### 需要配置的 API 密钥

如果你使用需要鉴权的 MCP Server，请在平台读取的环境中配置以下环境变量：

1. **GITHUB_TOKEN** - 用于 GitHub MCP 工具
2. **BRAVE_API_KEY** - 用于 Brave Search MCP 工具

### 本仓库不负责配置的密钥

以下 AI 模型的 API 密钥通常由平台（例如 OpenCode/Claude Code）统一管理，而不是由本仓库配置：

- ❌ ANTHROPIC_API_KEY (Claude 模型)
- ❌ OPENAI_API_KEY (GPT 模型)
- ❌ GEMINI_API_KEY (Gemini 模型)

---

## 为什么需要 MCP 工具密钥?

### MCP 工具 vs AI 模型

```
┌─────────────────────────────────────────────────────────┐
│                        kuko Agent                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  AI 模型 (由平台管理)                                     │
│  ├─ Claude (Anthropic)  ← OpenCode/Claude Code 管理     │
│  ├─ GPT (OpenAI)        ← OpenCode/Claude Code 管理     │
│  └─ Gemini (Google)     ← OpenCode/Claude Code 管理     │
│                                                          │
│  MCP 工具 (需要独立配置)                                  │
│  ├─ GitHub MCP          ← 需要 GITHUB_TOKEN             │
│  ├─ Brave Search MCP    ← 需要 BRAVE_API_KEY            │
│  ├─ Playwright MCP      ← 不需要密钥                     │
│  ├─ Fetch MCP           ← 不需要密钥                     │
│  ├─ SQLite MCP          ← 不需要密钥                     │
│  └─ Filesystem MCP      ← 不需要密钥                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 具体用途

**GitHub MCP** (需要 GITHUB_TOKEN):
- 搜索开源项目
- 分析竞品技术栈
- 查看代码实现
- 评估技术可行性

**Brave Search MCP** (需要 BRAVE_API_KEY):
- 执行网络搜索
- 收集市场信息
- 查找用户讨论
- 获取趋势数据

---

## 如何获取 API 密钥

### 1. GitHub Token

**步骤**:
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置名称: `kuko Agent`
4. 选择权限:
   - ✅ `public_repo` (访问公开仓库)
   - 如果需要访问私有仓库,选择 `repo`
5. 点击 "Generate token"
6. 复制生成的 token (只显示一次!)

**示例**:
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Brave Search API Key

**步骤**:
1. 访问 https://brave.com/search/api/
2. 点击 "Get Started" 或 "Sign Up"
3. 创建账户并登录
4. 在 Dashboard 中找到 API Key
5. 复制 API Key

**示例**:
```
BSAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**免费额度**:
- 每月 2,000 次免费查询
- 对于研究用途通常足够

---

## 配置步骤

### 配置环境变量

```bash
export GITHUB_TOKEN=ghp_your_actual_github_token_here
export BRAVE_API_KEY=BSA_your_actual_brave_api_key_here
```

### 验证配置

```bash
echo $GITHUB_TOKEN    # 应该显示你的 token
echo $BRAVE_API_KEY   # 应该显示你的 API key
```

---

## 常见问题

### Q1: 为什么 AI 模型密钥不需要配置?

**A**: OpenCode 和 Claude Code 已经在平台层面统一管理了 AI 模型的 API 密钥。当你在平台中配置好后,所有 Agent 都可以直接使用,不需要在每个项目中重复配置。

### Q2: 如果我想使用其他搜索引擎怎么办?

**A**: 可以替换 Brave Search MCP 为其他搜索 MCP,例如:
- Google Search MCP (需要 Google API Key)
- Bing Search MCP (需要 Bing API Key)
- DuckDuckGo MCP (通常不需要 API Key)

### Q3: GitHub Token 的权限应该设置多大?

**A**: 
- **最小权限**: `public_repo` (只访问公开仓库)
- **推荐权限**: `public_repo` 对大多数研究场景足够
- **扩展权限**: 如果需要分析私有仓库,才需要 `repo`

### Q4: Brave Search 免费额度够用吗?

**A**: 
- 免费额度: 2,000 次/月
- 一次完整调研: 约 50-100 次搜索
- 结论: 对于个人研究通常足够

### Q5: 密钥泄露了怎么办?

**A**: 
- **GitHub Token**: 立即在 https://github.com/settings/tokens 中删除旧 token,生成新的
- **Brave API Key**: 在 Brave Dashboard 中重新生成
- **检查**: 确保密钥没有被提交到 Git，优先使用密钥管理器保存

---

## 安全最佳实践

1. **不要提交到 Git**
   - 不要在代码中硬编码密钥

2. **定期轮换**
   - 建议每 3-6 个月更换一次密钥
   - 特别是 GitHub Token

3. **最小权限原则**
   - 只授予必要的权限
   - GitHub Token 优先使用 `public_repo`

4. **监控使用**
   - 定期检查 GitHub Token 的使用情况
   - 监控 Brave Search 的 API 调用次数

---

## 故障排除

### 问题: MCP 工具无法使用

**检查清单**:
```bash
# 1. 确认环境变量已加载
echo $GITHUB_TOKEN
echo $BRAVE_API_KEY

# 2. 如有需要，重启运行平台/CLI 的进程以重新读取环境变量
# 3. 检查密钥格式
# GitHub Token 应该以 ghp_ 开头
# Brave API Key 应该以 BSA 开头
```

### 问题: GitHub MCP 报错 401 Unauthorized

**原因**: GitHub Token 无效或权限不足

**解决**:
1. 检查 token 是否正确复制
2. 确认 token 未过期
3. 重新生成 token

### 问题: Brave Search 超出配额

**原因**: 超过免费额度 (2,000 次/月)

**解决**:
1. 等待下个月重置
2. 升级到付费计划
3. 使用其他搜索 MCP

---

## 相关文档

- [AGENTS.md](AGENTS.md) - 项目背景与规则
- [agent.md](agents/kuko/agent.md) - kuko Agent 定义
