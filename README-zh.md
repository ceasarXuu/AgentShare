# NBAgents - 多智能体系统

该项目托管了多个专用的 AI Agent。目前的 Agent 列表如下：

## 可用的 Agents

### 1. [kuko](agents/kuko/README.md)
**商业机会研究员**
面向独立开发者与小团队，目标是在有限时间内快速找到当下最值得做的 App/软件产品方向，并把机会从"想法"推进到"可验证的方案"。

---

## 目录结构

- `agents/`: 存放所有 Agent 的目录
  - `kuko/`: 商业机会研究员 Agent
    - `opencode/`: OpenCode 平台配置
    - `claude/`: Claude Code 平台配置
    - `shared/`: 共享资源 (Skills, Workflows, Docs)

---

## 快速开始

### 使用 kuko
1. 确保已安装 OpenCode。
2. 配置 `.env` 文件（参考 `agents/kuko/.env.example`）。
3. 选择 kuko Agent 并开始对话。

---

## API 密钥配置说明

### 需要配置的 API 密钥

只需要配置 **2 个** MCP 工具的 API 密钥:

1. **GITHUB_TOKEN** - 用于 GitHub MCP 工具
2. **BRAVE_API_KEY** - 用于 Brave Search MCP 工具

### 不需要配置的 API 密钥

以下 AI 模型的 API 密钥**不需要**在 `.env` 中配置,因为它们由 OpenCode/Claude Code 统一管理:

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

### 1. 创建 .env 文件

```bash
cd agents/kuko
cp .env.example .env
```

### 2. 编辑 .env 文件

```bash
# 使用你喜欢的编辑器
vim .env
# 或
code .env
# 或
open -e .env
```

### 3. 填入密钥

只需要填入这两个:

```bash
GITHUB_TOKEN=ghp_your_actual_github_token_here
BRAVE_API_KEY=BSA_your_actual_brave_api_key_here
```

**不需要**填入这些(注释掉或删除):

```bash
# ANTHROPIC_API_KEY=...  # ← 不需要
# OPENAI_API_KEY=...     # ← 不需要
# GEMINI_API_KEY=...     # ← 不需要
```

### 4. 加载环境变量

```bash
source .env
```

### 5. 验证配置

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
- **检查**: 确保 `.env` 文件在 `.gitignore` 中,不会被提交到 Git

---

## 安全最佳实践

1. **不要提交到 Git**
   - `.env` 已在 `.gitignore` 中
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

# 2. 确认 .env 文件存在
ls -la .env

# 3. 重新加载环境变量
source .env

# 4. 检查密钥格式
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

- [AGENT_SPEC_zh.md](AGENT_SPEC_zh.md) - Agent 设计与开发规范
- [agents/kuko/README.md](agents/kuko/README.md) - kuko Agent 文档
