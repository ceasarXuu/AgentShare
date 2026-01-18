# NBAgents 设计与开发规范

本文档定义了在 `NBAgents` 项目中构建新 Agent 的标准规范。所有新创建的 Agent 均应遵循此结构，以确保与项目的自动化部署脚本 (`deploy.sh`) 和多 Agent 架构兼容。

## 1. 目录结构规范

每个 Agent 必须在 `agents/` 目录下拥有独立的子目录。

推荐结构：

```text
agents/
└── <AgentName>/                 # Agent 根目录 (使用 PascalCase，如 NBResearcher)
    ├── opencode.json            # [必需] Agent 专属环境配置
    ├── <agent_name>.md          # [必需] Agent 定义文件 (使用小写，如 nbresearcher.md)
    ├── README.md                # [必需] 统一文档 (包含介绍、使用、部署说明)
    ├── SKILLS/                  # [可选] 技能模块目录
    │   └── <skill-name>/
    │       └── SKILL.md
    ├── .agent/                  # [可选] Agent 配置目录
    │   └── workflows/           # 工作流定义
    │       └── <workflow>.md
    ├── docs/                    # [可选] 额外文档或模板
    └── data/                    # [可选] 默认数据或数据库存放目录
```

## 2. 核心文件详解

### 2.1 opencode.json (环境配置)

每个 Agent 必须包含独立的 `opencode.json`，用于定义该 Agent 运行时所需的工具 (MCP Servers) 和 UI 设置。

**关键规则**:
- **MCP 工具**: 根据 Agent 需求配置 `mcp` 字段。
- **数据库路径**: 如果使用 `sqlite`，`--db-path` 必须指向该 Agent 目录下的路径 (例如 `/Users/xuzhang/NBAgents/agents/<AgentName>/data/research_data.db`)，避免与其他 Agent 冲突。

**示例模板**:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "theme": "dark",
  "mcp": {
    "filesystem": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "/Users/username"]
    }
  }
}
```

### 2.2 <agent_name>.md (Agent 定义)

这是 Agent 的“灵魂”，定义了它的系统提示词 (System Prompt)、模式和使用的模型。

**元数据头 (Frontmatter)**:
```markdown
---
name: <AgentName>
description: 一句话描述 Agent 的核心价值
mode: primary  # 通常设为 primary
model: openrouter/anthropic/claude-sonnet-4 # 或其他模型
temperature: 0.7
---

# Agent 名称

## 核心能力
...
```

**关键内容**:
- **核心角色定义**: 你是谁，你的目标是什么。
- **工具/Skills 引用**: 明确列出它可以使用的工具，并指向正确的路径 (例如 `agents/<AgentName>/SKILLS/`)。

### 2.3 README.md (文档)

文档应自包含，不再拆分为 DEPLOY/USAGE。

**必需章节**:
- **简介**: Agent 是做什么的。
- **快速开始**: 引导用户使用根目录的 `./deploy.sh` 进行部署。
- **配置**: 说明需要的环境变量 (如 `.env`)。
- **使用指南**: 常用指令示例。

## 3. 技能与工作流 (开发规范)

### 3.1 SKILLS (技能)
- 将复杂的任务逻辑封装为 Skill。
- 每个 Skill 独立文件夹，包含 `SKILL.md`。
- **路径引用**: 在 Agent 定义或 Skill 内部引用其他文件时，务必使用**相对项目根目录的绝对路径** (例如 `agents/<AgentName>/SKILLS/xxx`)，以确保 OpenCode 能正确索引。

### 3.2 Workflows (工作流)
- 定义多步骤的标准作业程序 (SOP)。
- 存放在 `.agent/workflows/` 下。
- 文件格式为 Markdown，详细描述每一步的操作。

## 4. 部署集成

本项目使用根目录的 `deploy.sh` 进行统一部署。

**兼容性要求**:
只要您的 Agent 遵循上述目录结构（位于 `agents/` 下，包含 `opencode.json` 和 `*.md` 定义文件），`deploy.sh` 将自动识别并支持一键部署，无需修改任何脚手架代码。

## 5. 开发流程建议

1.  **创建目录**: `mkdir agents/MyNewAgent`
2.  **复制模板**: 从 `agents/NBResearcher` 复制 `opencode.json` 和结构作为起点。
3.  **定制定义**: 编写 `mynewagent.md`，定义角色和 Prompt。
4.  **添加能力**: 逐步添加 SKILLS 和 Workflows。
5.  **本地测试**: 运行 `./deploy.sh` 部署并测试。
