# NBResearcher - 商业机会研究员 Agent

## 项目概述

这是一个专注于移动应用市场调研和产品机会分析的 AI Agent 项目。目标是帮助独立开发者和小团队在有限时间内快速找到最值得开发的 App/软件产品方向。

## 核心原则

1. **只相信行为,不相信观点** - 搜索量、付费行为、真实吐槽 > 媒体报道、专家预测
2. **三角验证法则** - 任何结论必须有3个独立来源支撑  
3. **自下而上建模** - 从具体可执行路径推导,而非从宏大市场倒推

## 项目结构

```
NBResearcher/
├── docs/                      # 文档和方法论
│   ├── PRD.md                # 产品需求文档
│   ├── 调研方法论.md          # 完整的7阶段调研方法论
│   ├── 信源.md               # 信息源列表
│   └── 报告模板/             # 研究报告模板
├── SKILLS/                   # 专业技能模块(14个)
│   ├── research-sop/         # 端到端调研SOP
│   ├── search-strategy/      # 搜索策略
│   ├── pain-validation/      # 痛点验证
│   ├── competitive-gap-analysis/  # 竞品分析
│   ├── market-sizing/        # 市场规模估算
│   └── ...                   # 更多技能
├── .agent/workflows/         # 工作流定义
├── .opencode/               # OpenCode 配置
│   └── agents/              # Agent 定义
├── opencode.json            # OpenCode 主配置
└── CLAUDE.md               # 本文件
```

## 推荐工作流

### 完整调研流程 (10-15天)
使用 `.agent/workflows/research-workflow.md` 执行完整的市场调研:
1. 痛点发现 (Day 1-3)
2. 市场验证 (Day 4-6)
3. 竞品深挖 (Day 7-8)
4. 可行性评估 (Day 9-11)
5. 最终决策 (Day 12-15)

### 快速验证流程 (1-3天)
使用 `.agent/workflows/quick-validation.md` 快速验证产品想法:
- 痛点快速验证
- 市场规模粗估
- 竞品扫描
- Go/No-Go 决策

### 竞品分析流程
使用 `.agent/workflows/competitor-analysis.md` 深度分析竞品:
- 功能矩阵构建
- 定价策略分析
- 用户反馈收集
- 差异化机会识别

## 可用的 MCP 工具

### 浏览器自动化 - Playwright
```bash
# 用于抓取 Reddit、X、YouTube 等动态内容
# 示例: 抓取 Reddit 讨论
使用 Playwright 访问 https://reddit.com/r/iPhone 并抓取关于电池焦虑的讨论
```

### GitHub 搜索
```bash
# 用于搜索开源项目和分析技术栈
# 需要设置环境变量: GITHUB_TOKEN
# 示例: 搜索电池管理相关项目
在 GitHub 上搜索 iOS battery management 相关的开源项目
```

### 网络搜索 - Brave Search
```bash
# 用于执行网络搜索
# 需要设置环境变量: BRAVE_API_KEY
# 示例: 搜索市场趋势
使用 Brave Search 搜索 "iOS battery anxiety 2025"
```

### HTTP 请求 - Fetch
```bash
# 用于获取网页内容
# 示例: 获取 App Store 页面
使用 Fetch 获取特定 App 的 App Store 页面内容
```

### 数据库 - SQLite
```bash
# 用于存储和查询研究数据
# 数据库位置: /Users/xuzhang/NBResearcher/research_data.db
# 示例: 存储竞品数据
将竞品信息存储到 SQLite 数据库中
```

## 环境变量配置

在使用前,请设置以下环境变量:

### MCP 工具 API 密钥 (必需)

这些密钥用于 MCP 工具,**不是给 AI 模型用的**。AI 模型的 API 密钥由 OpenCode/Claude Code 统一管理。

```bash
# GitHub 访问令牌 (必需 - 用于 GitHub MCP)
# 获取: https://github.com/settings/tokens
# 用途: 搜索开源项目、分析竞品技术栈
export GITHUB_TOKEN="your_github_token_here"

# Brave Search API 密钥 (必需 - 用于网络搜索)
# 获取: https://brave.com/search/api/
# 用途: 执行网络搜索、信息检索
export BRAVE_API_KEY="your_brave_api_key_here"
```

### AI 模型 API 密钥 (通常不需要)

OpenCode 和 Claude Code 已经统一管理这些密钥,通常**不需要**在这里配置:

```bash
# ❌ 不需要 - 由 OpenCode/Claude Code 管理
# ANTHROPIC_API_KEY="..."
# OPENAI_API_KEY="..."
# GEMINI_API_KEY="..."
```

### 快速配置

```bash
# 1. 复制示例文件
cp .env.example .env

# 2. 编辑 .env,只需填入 MCP 工具密钥
vim .env  # 或使用其他编辑器

# 3. 加载环境变量
source .env
```

## 常用命令

### 查看可用 Skills
```bash
ls -la SKILLS/
```

### 查看特定 Skill 的说明
```bash
cat SKILLS/research-sop/SKILL.md
```

### 查看调研方法论
```bash
cat docs/调研方法论.md
```

### 初始化研究数据库
```bash
sqlite3 research_data.db < schema.sql
```

## 使用 Skills 的最佳实践

1. **开始前先阅读 Skill**: 使用 `view_file` 工具查看 `SKILLS/*/SKILL.md` 了解详细说明
2. **遵循工作流**: 按照 `.agent/workflows/` 中定义的步骤执行
3. **记录信源**: 所有研究结论必须记录信息来源
4. **三角验证**: 重要结论需要至少3个独立来源支撑
5. **使用模板**: 生成报告时使用 `docs/报告模板/` 中的模板

## 编码规范

- 所有研究报告使用 Markdown 格式
- 文件命名使用小写字母和下划线: `market_research_ios_battery.md`
- 数据文件存储在 `research_output/` 目录
- 临时文件存储在 `temp/` 目录
- 使用 Git 管理版本,敏感信息不提交到仓库

## 质量标准

每次完整调研应达到以下标准:
- ✅ 用户原话 > 100 条
- ✅ 独立信源 > 10 个
- ✅ 痛点识别 > 5 个
- ✅ 交叉验证率 = 100%
- ✅ 竞品分析 > 5 个
- ✅ TAM/SAM/SOM 全部完成

## 快速开始

### 示例 1: 快速验证一个产品想法
```
我想验证一个产品想法: iOS 电池健康焦虑缓解工具。
请使用快速验证流程帮我分析这个机会。
```

### 示例 2: 完整的市场调研
```
请对"护士排班管理 App"进行完整的市场调研,
使用完整调研流程,输出详细的机会评估报告。
```

### 示例 3: 竞品分析
```
请分析 iOS 存储管理工具的竞品格局,
包括功能对比、定价策略和差异化机会。
```

## 注意事项

1. **API 限制**: 注意各个 MCP 工具的 API 调用限制
2. **数据隐私**: 不要在报告中包含个人隐私信息
3. **版权**: 引用内容时注明来源,避免版权问题
4. **时效性**: 优先使用最近12个月内的数据
5. **备份**: 定期备份研究数据和报告

## 故障排除

### MCP 工具无法连接
```bash
# 检查 MCP 服务器状态
npx -y @executeautomation/playwright-mcp-server --help

# 重新安装 MCP 工具
npm cache clean --force
```

### 环境变量未生效
```bash
# 检查环境变量
echo $GITHUB_TOKEN
echo $BRAVE_API_KEY

# 重新加载环境变量
source ~/.zshrc  # 或 ~/.bashrc
```

## 获取帮助

- 查看方法论: `docs/调研方法论.md`
- 查看 Skills: `SKILLS/*/SKILL.md`
- 查看工作流: `.agent/workflows/*.md`
- 查看报告模板: `docs/报告模板/`
