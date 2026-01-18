# NBResearcher - 商业机会研究员 Agent

> 面向独立开发者与小团队,快速找到最值得做的 App/软件产品方向

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📋 项目简介

NBResearcher 是一个基于 AI 的商业机会研究员 Agent,专注于移动应用市场调研和产品机会分析。它能够:

- 🔍 **多源信息检索**: 自动从 Reddit、X、YouTube、App Store 等平台收集用户反馈
- 📊 **数据驱动分析**: 痛点聚类、市场规模估算、竞品分析
- 📝 **结构化输出**: 生成专业的研究报告和 MVP 建议
- ⚡ **快速验证**: 1-3 天快速判断产品想法,或 10-15 天完整调研

## 🎯 核心原则

1. **只相信行为,不相信观点** - 搜索量、付费行为、真实吐槽 > 媒体报道
2. **三角验证法则** - 任何结论必须有 3 个独立来源支撑
3. **自下而上建模** - 从具体可执行路径推导,而非从宏大市场倒推

---

## 🚀 快速开始

### 1. 部署 Agent

本项目使用通用的部署脚本。请在 **项目根目录** (`NBAgents/`) 运行：

```bash
./deploy.sh
```

根据提示选择 `NBResearcher` (输入对应数字)。脚本会自动：
- 部署 `opencode.json` (包含 Agent 专属配置) 到 OpenCode。
- 部署 Agent 定义、Skills 和工作流。

**手动部署 (备选)**:
如果无法使用脚本，可手动将 `opencode.json` 复制到 config 目录，并将 `nbresearcher.md` 复制到 agents 目录。

### 2. 配置环境

在使用前，您需要配置必要的 API 密钥。在 `NBAgents` 根目录创建 `.env` 文件：

```bash
# GitHub 访问令牌 (必需，用于搜索开源项目)
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"

# Brave Search API 密钥 (必需，用于联网搜索)
# 获取方式: https://brave.com/search/api/
export BRAVE_API_KEY="BSAxxxxxxxxxxxx"

# 可选: 其他 AI 模型密钥 (Anthropic/OpenAI 等)
```

然后加载环境变量：
```bash
source .env
```

---

## 💡 使用指南

### 方式 1: OpenCode (推荐)

启动 OpenCode 后：

- **选择 Agent**: 输入 `/agent` 并选择 `NBResearcher`。
- **直接指定**: 输入 `/agent NBResearcher`。

**常用指令**:
```bash
# 检查 Skills 状态
请列出所有可用的 Skills

# 开始研究
我想研究 [产品想法],请帮我分析市场机会。
```

### 方式 2: Claude Code

在终端运行：
```bash
claude --agent nbresearcher
```

---

## 📊 工作流与 Skills

### 核心工作流

NBResearcher 提供了 3 个标准工作流：

1.  **快速验证 (1-3天)**: 适用于快速判断想法可行性。
    *   *指令*: `请使用快速验证工作流分析 [产品想法]`
2.  **完整调研 (10-15天)**: 深度分析，包含痛点发现、市场验证、竞品深挖等 5 个阶段。
    *   *指令*: `请使用完整调研工作流对 [产品想法] 进行深度研究`
3.  **竞品分析**: 专注于竞品格局、功能对比和定价策略。
    *   *指令*: `请使用竞品分析工作流分析 [产品类别]`

### 核心 Skills (部分)

Agent 内置了 20+ 个专业技能模块：

*   **🔍 信息获取**: `web-scraping` (网页抓取), `search-strategy` (搜索策略优化)
*   **📈 市场分析**: `data-analysis` (数据分析), `market-sizing` (市场规模估算), `trend-analysis` (趋势分析)
*   **⚔️ 竞品研究**: `competitive-gap-analysis` (竞品差距分析), `competitor-tracking` (竞品监控)
*   **📝 输出**: `report-generation` (报告生成), `decision-and-mvp` (MVP 定义)

---

## 📁 项目结构

```
NBResearcher/
├── opencode.json           # Agent 专属 OpenCode 配置
├── docs/                   # 方法论文档与报告模板
├── SKILLS/                 # 20+ 个技能模块源码
├── .agent/workflows/       # 工作流定义文件 (.md)
├── nbresearcher.md         # Agent 定义文件
├── README.md               # 本文件
└── ...
```

---

## 🔧 常见问题

**Q: MCP 工具无法连接?**
A: 检查 `opencode.json` 配置是否生效，确认 `.env` 中 `GITHUB_TOKEN` 和 `BRAVE_API_KEY` 已正确设置。

**Q: 数据库在哪里?**
A: 默认位于 `agents/NBResearcher/data/research_data.db`。

**Q: 如何自定义配置?**
A: 修改本目录下的 `opencode.json`，然后重新运行根目录的 `./deploy.sh`。

---

## 📄 许可证

本项目采用 MIT 许可证。
