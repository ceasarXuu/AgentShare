# AgentShare v2.0 产品规划

## 1. 愿景 & 核心变更
**目标**: 将 **Skills (MCP 工具/脚本)** 提升为与 Agent 平级的一等公民。
**理由**: Skills 通常可以在多个 Agent 之间复用。独立管理 Skills 可以实现更好的复用性、原子化更新以及更清晰的项目结构。

## 2. 用户体验 (TUI 流程)

### 新的启动画面
运行 `agentshare` 后，用户将看到顶层模式选择：

```text
┌────────────────────────────────────────────────────────┐
│               AgentShare v2.0                          │
│                                                        │
│  欢迎！请选择管理模式：                                  │
│                                                        │
│  > 🤖 Agent 管理 (Agent Management)                    │
│  > 🛠️ Skills 管理 (Skills Management)                  │
│                                                        │
│  (使用方向键选择，回车确认)                              │
└────────────────────────────────────────────────────────┘
```

### 模式 A: Agent 管理 (现有功能)
*   保留所有现有功能（部署、提取、卸载 Agent）。
*   **变更**: 默认不再自动部署嵌套在 Agent 内部的 skills，而是通过**引用**的方式关联全局 `skills/` 目录中的内容。

### 模式 B: Skills 管理 (新增)
*   **仪表盘 (Dashboard)**:
    *   显示 **项目 Skills** (位于 `skills/` 目录)。
    *   显示 **平台已安装 Skills** (解析 OpenCode/Claude/VSCode 的配置文件)。
*   **操作 (Actions)**:
    *   **部署 Skill**: 项目 Skill → 平台配置 (例如：写入 `claude_desktop_config.json`)。
    *   **提取 Skill**: 平台配置 → 项目 Skill (提取配置，如果是本地脚本则提取源码)。
    *   **卸载 Skill**: 从平台配置中移除。

## 3. 目录结构变更

**当前 (v1.0)**:
```text
project_root/
  agents/
    agent_a/
      agent.md
      skills/       <-- Skills 隐藏在 Agent 内部
        my_skill/
```

**提案 (v2.0)**:
```text
project_root/
  agents/
    agent_a/
      agent.md      <-- 通过名称引用 Skills
  skills/           <-- 新的顶层目录
    browser_tool/   <-- 独立的 Skill 包
      skill.yaml    <-- 定义文件 (名称, 命令, 参数, 环境变量)
      src/          <-- 源代码 (如果是本地脚本)
      README.md
    search_tool/
      skill.yaml
```

## 4. 技术实现方案

### A. Skill 定义标准 (`skill.yaml`)
我们需要一种标准方式来定义 Skill，以便将其部署到任何平台 (OpenCode, Claude 等)。
草案结构：
```yaml
name: "brave-search"
description: "网络搜索能力"
type: "mcp"
target_platforms: ["opencode", "claude", "kilocode"]
source:
  type: "stdio"
  command: "npx"
  args: ["-y", "@modelcontextprotocol/server-brave-search"]
env:
  - "BRAVE_API_KEY"
```

### B. Agent-Skill 关系策略 (**已确认：引用模式**)

**共享 Skills (引用模式 - 推荐)**
   - **位置**: `project_root/skills/<skill_name>/`
   - **定义**: Agent 的 `agent.md` (元数据) 中列出依赖项。
   - **示例**:
     ```yaml
     # agent.md frontmatter (头部信息)
     name: kuko
     dependencies:
       - brave-search  # 引用全局 skill
       - github-tool   # 引用全局 skill
     ```
   - **部署逻辑**: 当部署 'kuko' 时，AgentShare 会自动检查 'brave-search' 是否已安装。如果没有，会提示用户先部署该 Skill。

*(备注：传统的“内嵌模式”即在 agent 目录下存放 skills 文件夹的方式仍可作为一种特殊情况支持，但不再作为首选推荐。)*

### C. 逻辑层更新 (`logic.js`)
1.  **`scanProjectSkills()`**: 扫描 `skills/` 目录下的 `skill.yaml` 文件。
2.  **`scanPlatformSkills(platform)`**: 扫描各平台已安装的 Skills。
3.  **`deploySkill(skillName, platform, scope)`**: 根据作用域部署到对应配置文件。

#### 平台配置详情 (Research Findings)

| 平台 | 作用域 (Scope) | 配置文件路径 | 配置格式 (Key) |
| :--- | :--- | :--- | :--- |
| **Claude** | Global | `~/Library/Application Support/Claude/claude_desktop_config.json` | `mcpServers` |
| **Claude** | Project | *(暂不支持/不常用)* | - |
| **OpenCode** | Global | `~/.config/opencode/opencode.json` | `mcp` |
| **OpenCode** | Project | `project_root/opencode.json` | `mcp` |
| **VS Code** | Global | VS Code User Settings (TBD) | `mcpServers` (需确认插件支持) |
| **VS Code** | Project | `project_root/.vscode/mcp.json` | `mcpServers` |

**主要差异点**：
- **OpenCode**: 使用 `mcp` 作为键名，支持 JSON/JSONC。
- **Claude/VS Code**: 通常使用 `mcpServers` 作为键名。
- **路径差异**: Claude Desktop 主要是全局配置；OpenCode 和 VS Code 支持项目级配置。

### D. UI 更新 (`index.js`)
1.  **状态管理**: 增加 `activeMode` ('agent' | 'skill')。
2.  **组件**:
    *   `ModeSelectionScreen`: 新的入口页面。
    *   `SkillsDashboard`: 类似于 Agent Dashboard，但是专用于 Skills。

## 5. 迁移策略
*   **向后兼容**: v2.0 应仍能识别旧版 Agent 结构。
*   **迁移工具**: 提供选项将现有 Agent 内嵌的 skills “提取并移动”到全局 `skills/` 目录。

## 6. 下一步 (开发阶段)
1.  [ ] 重构 `index.js` 以支持顶层菜单。
2.  [ ] 定义并实现 `skill.yaml` Schema 解析。
3.  [ ] 实现 `skills/` 目录扫描逻辑。
4.  [ ] 实现 Claude/OpenCode/Kilo Code 的 MCP 配置解析器。
