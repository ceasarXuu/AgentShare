# NBAgents Design and Development Specification

This document defines the standard specification for building new Agents in the `NBAgents` project. All newly created Agents should follow this structure to ensure compatibility with the project's automated deployment script (`deploy.sh`) and multi-Agent architecture.

## 1. Directory Structure Specification

Each Agent must have its own subdirectory under the `agents/` directory.

Recommended structure:

```text
agents/
└── <AgentName>/                 # Agent root directory (use PascalCase, e.g., kuko)
    ├── README.md                # [Required] Unified documentation
    ├── opencode/                # [Required] OpenCode platform configuration
    │   ├── agent.md             # Agent definition (formerly <agent_name>.md)
    │   └── config.json          # OpenCode config (formerly opencode.json)
    ├── claude/                  # [Optional] Claude Code platform configuration
    │   └── agent.md             # Claude Agent definition (formerly CLAUDE.md)
    ├── shared/                  # [Required] Shared resources
    │   ├── SKILLS/              # Skills module directory
    │   │   └── <skill-name>/
    │   │       └── SKILL.md
    │   ├── workflows/           # Workflow definitions
    │   │   └── <workflow>.md
    │   └── docs/                # Documentation
    └── data/                    # [Optional] Default data or database storage
```

## 2. Core File Details

### 2.1 opencode.json (Environment Configuration)

Each Agent must include an independent `opencode.json` to define the tools (MCP Servers) and UI settings required for that Agent's runtime.

**Key Rules**:
- **MCP Tools**: Configure the `mcp` field according to the Agent's requirements.
- **Database Path**: If using `sqlite`, `--db-path` must point to a path within the Agent's directory (e.g., `/Users/xuzhang/NBAgents/agents/<AgentName>/data/research_data.db`) to avoid conflicts with other Agents.

**Example Template**:
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

### 2.2 <agent_name>.md (Agent Definition)

This is the Agent's "soul", defining its system prompt, mode, and model used.

**Metadata Header (Frontmatter)**:
```markdown
---
name: <AgentName>
description: A one-sentence description of the Agent's core value
mode: primary  # Usually set to primary
model: openrouter/anthropic/claude-sonnet-4 # Or other models
temperature: 0.7
---

# Agent Name

## Core Capabilities
...
```

**Key Content**:
- **Core Role Definition**: Who you are, what your goals are.
- **Tools/Skills Reference**: Explicitly list the tools it can use and point to the correct paths (e.g., `agents/<AgentName>/SKILLS/`).

### 2.3 README.md (Documentation)

Documentation should be self-contained, no longer split into DEPLOY/USAGE.

**Required Sections**:
- **Introduction**: What the Agent does.
- **Quick Start**: Guide users to deploy using `./deploy.sh` from the root directory.
- **Configuration**: Explain required environment variables (e.g., `.env`).
- **Usage Guide**: Common command examples.

## 3. Skills and Workflows (Development Specification)

### 3.1 SKILLS
- Encapsulate complex task logic as Skills.
- Each Skill has its own folder containing `SKILL.md`.
- **Path References**: When referencing other files in Agent definitions or within Skills, always use **absolute paths relative to the project root** (e.g., `agents/<AgentName>/SKILLS/xxx`) to ensure OpenCode can index correctly.

### 3.2 Workflows
- Define multi-step standard operating procedures (SOPs).
- Store in `.agent/workflows/`.
- File format is Markdown, describing each step in detail.

## 4. Deployment Integration

This project uses the root directory's `deploy.sh` for unified deployment.

**Compatibility Requirements**:
As long as your Agent follows the above directory structure (located under `agents/`, contains `opencode.json` and `*.md` definition files), `deploy.sh` will automatically recognize and support one-click deployment without modifying any scaffolding code.

## 5. Recommended Development Process

1.  **Create Directory**: `mkdir agents/MyNewAgent`
2.  **Copy Template**: Copy `opencode.json` and structure from `agents/kuko` as a starting point.
3.  **Customize Definition**: Write `mynewagent.md`, defining role and Prompt.
4.  **Add Capabilities**: Gradually add SKILLS and Workflows.
5.  **Local Testing**: Run `./deploy.sh` to deploy and test.
