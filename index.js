// index.js
import React, { useState, useEffect } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import SelectInput from "ink-select-input";
import path2 from "path";
import fs from "fs-extra";
import path from "path";
import os from "os";
var REPO_ROOT = process.cwd();
var AGENTS_ROOT = path.join(REPO_ROOT, "agents");
var PLATFORM_PATHS = {
  opencode: [
    path.join(os.homedir(), ".config/opencode"),
    path.join(os.homedir(), ".opencode"),
    path.join(os.homedir(), "Library/Application Support/OpenCode")
  ],
  claude: [
    path.join(os.homedir(), ".claude"),
    path.join(os.homedir(), ".config/claude"),
    path.join(os.homedir(), "Library/Application Support/Claude")
  ],
  kilocode: [
    path.join(os.homedir(), "Library/Application Support/Code/User/globalStorage/kilocode.kilo-code/settings")
  ],
  copilot: [
    os.platform() === "darwin" ? path.join(os.homedir(), "Library/Application Support/Code/User/prompts") : path.join(os.homedir(), ".config/Code/User/prompts")
  ]
};
var PROJECT_LEVEL_PATHS = {
  opencode: {
    agents: ".opencode/agents",
    config: ".opencode/opencode.json"
  },
  claude: {
    agents: ".claude/agents",
    settings: ".claude/settings.json"
  },
  copilot: {
    agents: ".github/agents",
    instructions: ".github/copilot-instructions.md"
  }
};
async function detectProjectRoot(startDir = process.cwd()) {
  const markers = [".git", "package.json", "Cargo.toml", "go.mod", "pom.xml", "build.gradle", ".opencode", ".claude", ".github"];
  let currentDir = startDir;
  while (currentDir !== path.dirname(currentDir)) {
    for (const marker of markers) {
      if (await fs.pathExists(path.join(currentDir, marker))) {
        return currentDir;
      }
    }
    currentDir = path.dirname(currentDir);
  }
  return null;
}
async function scanProjectAgents(projectRoot) {
  if (!projectRoot) return { opencode: [], claude: [], copilot: [] };
  const agents = {
    opencode: [],
    claude: [],
    copilot: []
  };
  const opencodeAgentsDir = path.join(projectRoot, PROJECT_LEVEL_PATHS.opencode.agents);
  if (await fs.pathExists(opencodeAgentsDir)) {
    agents.opencode = await scanAgents(opencodeAgentsDir);
  }
  const claudeAgentsDir = path.join(projectRoot, PROJECT_LEVEL_PATHS.claude.agents);
  if (await fs.pathExists(claudeAgentsDir)) {
    agents.claude = await scanAgents(claudeAgentsDir);
  }
  const copilotAgentsDir = path.join(projectRoot, PROJECT_LEVEL_PATHS.copilot.agents);
  if (await fs.pathExists(copilotAgentsDir)) {
    const files = await fs.readdir(copilotAgentsDir);
    agents.copilot = files.filter((f) => f.endsWith(".agent.md")).map((f) => f.replace(".agent.md", ""));
  }
  return agents;
}
async function scanAgents(dir) {
  if (!await fs.pathExists(dir)) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter((dirent) => dirent.isDirectory() || dirent.name.endsWith(".md")).map((dirent) => dirent.name.replace(/\.md$/, "").replace(/\.agent$/, ""));
}
async function detectPlatforms() {
  const result = {};
  for (const [key, paths] of Object.entries(PLATFORM_PATHS)) {
    for (const p of paths) {
      if (await fs.pathExists(p)) {
        result[key] = p;
        break;
      }
    }
  }
  return result;
}
async function scanInstalledAgents(platforms) {
  const agents = {
    opencode: [],
    claude: [],
    kilocode: [],
    copilot: []
  };
  if (platforms.opencode) {
    const official = await scanAgents(path.join(platforms.opencode, "agent"));
    const user = await scanAgents(path.join(platforms.opencode, "agents"));
    agents.opencode = [.../* @__PURE__ */ new Set([...official, ...user])];
  }
  if (platforms.claude) {
    agents.claude = await scanAgents(path.join(platforms.claude, "agents"));
  }
  if (platforms.kilocode) {
    try {
      const yamlFile = path.join(platforms.kilocode, "custom_modes.yaml");
      if (await fs.pathExists(yamlFile)) {
        const content = await fs.readFile(yamlFile, "utf8");
        const slugs = [];
        const regex = /slug:\s*([a-zA-Z0-9-]+)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          slugs.push(match[1]);
        }
        agents.kilocode = slugs;
      } else {
        agents.kilocode = [];
      }
    } catch (e) {
      agents.kilocode = [];
    }
  }
  if (platforms.copilot) {
    const files = await fs.readdir(platforms.copilot);
    agents.copilot = files.filter((f) => f.endsWith(".agent.md")).map((f) => f.replace(".agent.md", ""));
  }
  return agents;
}
async function checkAgentExists(agentName, targetPlatform, platforms) {
  const targetDir = platforms[targetPlatform];
  if (!targetDir) return false;
  if (targetPlatform === "opencode") {
    const agentFile = path.join(targetDir, "agents", `${agentName}.md`);
    return await fs.pathExists(agentFile);
  } else if (targetPlatform === "claude") {
    const agentFile = path.join(targetDir, "agents", `${agentName}.md`);
    return await fs.pathExists(agentFile);
  } else if (targetPlatform === "kilocode") {
    const yamlFile = path.join(targetDir, "custom_modes.yaml");
    if (!await fs.pathExists(yamlFile)) return false;
    const content = await fs.readFile(yamlFile, "utf8");
    return content.includes(`slug: ${agentName}`);
  } else if (targetPlatform === "copilot") {
    const agentFile = path.join(targetDir, `${agentName}.agent.md`);
    return await fs.pathExists(agentFile);
  }
  return false;
}
async function checkAgentExistsInProject(agentName, targetPlatform, projectRoot) {
  if (!projectRoot) return false;
  const projectPaths = PROJECT_LEVEL_PATHS[targetPlatform];
  if (!projectPaths) return false;
  const targetAgentsDir = path.join(projectRoot, projectPaths.agents);
  if (targetPlatform === "opencode" || targetPlatform === "claude") {
    const agentFile = path.join(targetAgentsDir, `${agentName}.md`);
    return await fs.pathExists(agentFile);
  } else if (targetPlatform === "copilot") {
    const agentFile = path.join(targetAgentsDir, `${agentName}.agent.md`);
    return await fs.pathExists(agentFile);
  }
  return false;
}
async function deployAgent(agentName, targetPlatform, platforms) {
  const agentSource = path.join(AGENTS_ROOT, agentName);
  const targetDir = platforms[targetPlatform];
  if (!targetDir) {
    throw new Error(`${targetPlatform} not installed`);
  }
  const srcFile = path.join(agentSource, "agent.md");
  if (!await fs.pathExists(srcFile)) {
    throw new Error(`Agent definition not found: ${srcFile}`);
  }
  if (targetPlatform === "opencode") {
    const configSrc = path.join(agentSource, "config.json");
    if (await fs.pathExists(configSrc)) {
      const config = await fs.readJson(configSrc);
      delete config.model;
      await fs.writeJson(path.join(targetDir, "opencode.json"), config);
    } else {
      const defaultConfig = {
        temperature: 0.7,
        max_tokens: 4096
      };
      await fs.writeJson(path.join(targetDir, "opencode.json"), defaultConfig);
    }
    await fs.ensureDir(path.join(targetDir, "agents"));
    let content = await fs.readFile(srcFile, "utf8");
    if (!content.includes("mode:")) {
      content = content.replace(/^---/, "---\nmode: primary");
    }
    content = content.replace(/^model:.*\n/m, "");
    await fs.writeFile(path.join(targetDir, "agents", `${agentName}.md`), content);
    const skillsSrc = path.join(agentSource, "skills");
    if (await fs.pathExists(skillsSrc)) {
      await fs.copy(skillsSrc, path.join(targetDir, "skills"));
    }
    const workflowsSrc = path.join(agentSource, "workflows");
    if (await fs.pathExists(workflowsSrc)) {
      await fs.copy(workflowsSrc, path.join(targetDir, "workflows"));
    }
  } else if (targetPlatform === "claude") {
    await fs.ensureDir(path.join(targetDir, "agents"));
    await fs.copy(srcFile, path.join(targetDir, "agents", `${agentName}.md`));
  } else if (targetPlatform === "kilocode") {
    const yamlFile = path.join(targetDir, "custom_modes.yaml");
    let yamlContent = "";
    if (await fs.pathExists(yamlFile)) {
      yamlContent = await fs.readFile(yamlFile, "utf8");
    } else {
      yamlContent = "customModes:\n";
    }
    const srcContent = await fs.readFile(srcFile, "utf8");
    const nameMatch = srcContent.match(/name:\s*(.*)/);
    const descMatch = srcContent.match(/description:\s*(.*)/);
    const name = nameMatch ? nameMatch[1].trim() : agentName;
    const description = descMatch ? descMatch[1].trim() : `Agent ${agentName}`;
    const systemPrompt = srcContent.replace(/---[\s\S]*?---/, "").trim();
    const newEntry = `  - slug: ${agentName}
    name: ${name}
    roleDefinition: ${systemPrompt.replace(/\n/g, "\\n")}
    description: ${description}
    groups:
      - read
      - edit
      - browser
      - command
      - mcp
    source: global
`;
    if (yamlContent.includes(`slug: ${agentName}`)) {
      const blockRegex = new RegExp(`^  - slug: ${agentName}[\\s\\S]*?(?=^  - slug:|$)`, "m");
      if (blockRegex.test(yamlContent)) {
        yamlContent = yamlContent.replace(blockRegex, newEntry);
      } else {
        yamlContent += "\n" + newEntry;
      }
    } else {
      yamlContent += "\n" + newEntry;
    }
    await fs.ensureDir(path.dirname(yamlFile));
    await fs.writeFile(yamlFile, yamlContent);
  } else if (targetPlatform === "copilot") {
    await fs.copy(srcFile, path.join(targetDir, `${agentName}.agent.md`));
  }
}
async function extractAgent(agentName, sourcePlatform, platforms) {
  const targetDir = path.join(AGENTS_ROOT, agentName);
  const sourceBase = platforms[sourcePlatform];
  if (!sourceBase) {
    throw new Error(`${sourcePlatform} not installed`);
  }
  await fs.ensureDir(targetDir);
  if (sourcePlatform === "opencode") {
    const configSrc = path.join(sourceBase, "opencode.json");
    if (await fs.pathExists(configSrc)) {
      await fs.copy(configSrc, path.join(targetDir, "config.json"));
    }
    const agentSrc = path.join(sourceBase, "agents", `${agentName}.md`);
    if (await fs.pathExists(agentSrc)) {
      await fs.copy(agentSrc, path.join(targetDir, "agent.md"));
    }
    const skillsSrc = path.join(sourceBase, "skills");
    if (await fs.pathExists(skillsSrc)) {
      await fs.ensureDir(path.join(targetDir, "skills"));
      await fs.copy(skillsSrc, path.join(targetDir, "skills"));
    }
    const workflowsSrc = path.join(sourceBase, "workflows");
    if (await fs.pathExists(workflowsSrc)) {
      await fs.ensureDir(path.join(targetDir, "workflows"));
      await fs.copy(workflowsSrc, path.join(targetDir, "workflows"));
    }
  } else if (sourcePlatform === "kilocode") {
    const yamlFile = path.join(sourceBase, "custom_modes.yaml");
    if (await fs.pathExists(yamlFile)) {
      const content = await fs.readFile(yamlFile, "utf8");
      const blockRegex = new RegExp(`^  - slug: ${agentName}([\\s\\S]*?)(?=^  - slug:|$)`, "m");
      const match = content.match(blockRegex);
      if (match) {
        const block = match[0];
        const nameMatch = block.match(/name:\s*(.*)/);
        const descMatch = block.match(/description:\s*(.*)/);
        const roleMatch = block.match(/roleDefinition:\s*(.*)/);
        const name = nameMatch ? nameMatch[1].trim() : agentName;
        const description = descMatch ? descMatch[1].trim() : "";
        let roleDefinition = roleMatch ? roleMatch[1].trim() : "";
        roleDefinition = roleDefinition.replace(/\\n/g, "\n");
        const markdown = `---
name: ${name}
description: ${description}
---

${roleDefinition}
`;
        await fs.writeFile(path.join(targetDir, "agent.md"), markdown);
      }
    }
  } else if (sourcePlatform === "claude") {
    const agentSrc = path.join(sourceBase, "agents", `${agentName}.md`);
    if (await fs.pathExists(agentSrc)) {
      await fs.copy(agentSrc, path.join(targetDir, "agent.md"));
    }
  } else if (sourcePlatform === "copilot") {
    const agentSrc = path.join(sourceBase, `${agentName}.agent.md`);
    if (await fs.pathExists(agentSrc)) {
      await fs.copy(agentSrc, path.join(targetDir, "agent.md"));
    }
  }
}
async function uninstallAgent(agentName, targetPlatform, platforms) {
  const targetBase = platforms[targetPlatform];
  if (!targetBase) throw new Error(`${targetPlatform} not installed`);
  if (targetPlatform === "opencode") {
    const agentFile = path.join(targetBase, "agents", `${agentName}.md`);
    if (await fs.pathExists(agentFile)) {
      await fs.remove(agentFile);
    }
    const agentSource = path.join(AGENTS_ROOT, agentName);
    if (await fs.pathExists(agentSource)) {
      const skillsSrc = path.join(agentSource, "skills");
      if (await fs.pathExists(skillsSrc)) {
        const skills = await fs.readdir(skillsSrc);
        const targetSkillsDir = path.join(targetBase, "skills");
        if (await fs.pathExists(targetSkillsDir)) {
          for (const skill of skills) {
            try {
              await fs.remove(path.join(targetSkillsDir, skill));
            } catch (e) {
            }
          }
        }
      }
      const workflowsSrc = path.join(agentSource, "workflows");
      if (await fs.pathExists(workflowsSrc)) {
        const workflows = await fs.readdir(workflowsSrc);
        const targetWorkflowsDir = path.join(targetBase, "workflows");
        if (await fs.pathExists(targetWorkflowsDir)) {
          for (const workflow of workflows) {
            try {
              await fs.remove(path.join(targetWorkflowsDir, workflow));
            } catch (e) {
            }
          }
        }
      }
    }
  } else if (targetPlatform === "claude") {
    const agentFile = path.join(targetBase, "agents", `${agentName}.md`);
    if (await fs.pathExists(agentFile)) {
      await fs.remove(agentFile);
    }
  } else if (targetPlatform === "kilocode") {
    const yamlFile = path.join(targetBase, "custom_modes.yaml");
    if (await fs.pathExists(yamlFile)) {
      let content = await fs.readFile(yamlFile, "utf8");
      const blockRegex = new RegExp(`^  - slug: ${agentName}[\\s\\S]*?(?=^  - slug:|$)`, "m");
      if (blockRegex.test(content)) {
        content = content.replace(blockRegex, "");
        content = content.replace(/\n\n\n/g, "\n\n");
        await fs.writeFile(yamlFile, content);
      }
    }
  } else if (targetPlatform === "copilot") {
    const agentFile = path.join(targetBase, `${agentName}.agent.md`);
    if (await fs.pathExists(agentFile)) {
      await fs.remove(agentFile);
    }
  }
}
async function deployAgentToProject(agentName, targetPlatform, projectRoot) {
  if (!projectRoot) {
    throw new Error("Project root not detected");
  }
  const agentSource = path.join(AGENTS_ROOT, agentName);
  const projectPaths = PROJECT_LEVEL_PATHS[targetPlatform];
  if (!projectPaths) {
    throw new Error(`Unknown platform: ${targetPlatform}`);
  }
  const targetAgentsDir = path.join(projectRoot, projectPaths.agents);
  await fs.ensureDir(targetAgentsDir);
  const srcFile = path.join(agentSource, "agent.md");
  if (!await fs.pathExists(srcFile)) {
    throw new Error(`Agent definition not found: ${srcFile}`);
  }
  if (targetPlatform === "opencode") {
    let content = await fs.readFile(srcFile, "utf8");
    if (!content.includes("mode:")) {
      content = content.replace(/^---/, "---\nmode: primary");
    }
    content = content.replace(/^model:.*\n/m, "");
    await fs.writeFile(path.join(targetAgentsDir, `${agentName}.md`), content);
    const skillsSrc = path.join(agentSource, "skills");
    if (await fs.pathExists(skillsSrc)) {
      const skillsTarget = path.join(path.dirname(targetAgentsDir), "skills");
      await fs.ensureDir(skillsTarget);
      await fs.copy(skillsSrc, skillsTarget);
    }
    const workflowsSrc = path.join(agentSource, "workflows");
    if (await fs.pathExists(workflowsSrc)) {
      const workflowsTarget = path.join(path.dirname(targetAgentsDir), "workflows");
      await fs.ensureDir(workflowsTarget);
      await fs.copy(workflowsSrc, workflowsTarget);
    }
  } else if (targetPlatform === "claude") {
    await fs.copy(srcFile, path.join(targetAgentsDir, `${agentName}.md`));
  } else if (targetPlatform === "copilot") {
    await fs.copy(srcFile, path.join(targetAgentsDir, `${agentName}.agent.md`));
  }
}
async function extractAgentFromProject(agentName, sourcePlatform, projectRoot) {
  if (!projectRoot) {
    throw new Error("Project root not detected");
  }
  const targetDir = path.join(AGENTS_ROOT, agentName);
  const projectPaths = PROJECT_LEVEL_PATHS[sourcePlatform];
  if (!projectPaths) {
    throw new Error(`Unknown platform: ${sourcePlatform}`);
  }
  await fs.ensureDir(targetDir);
  const sourceAgentsDir = path.join(projectRoot, projectPaths.agents);
  if (sourcePlatform === "opencode") {
    const configSrc = path.join(sourceAgentsDir, "..", "opencode.json");
    const projectOpencodeDir = path.dirname(sourceAgentsDir);
    const configSrcFile = path.join(projectOpencodeDir, "opencode.json");
    if (await fs.pathExists(configSrcFile)) {
      await fs.copy(configSrcFile, path.join(targetDir, "config.json"));
    }
    const agentSrc = path.join(sourceAgentsDir, `${agentName}.md`);
    if (await fs.pathExists(agentSrc)) {
      await fs.copy(agentSrc, path.join(targetDir, "agent.md"));
    }
    const skillsSrc = path.join(projectOpencodeDir, "skills");
    if (await fs.pathExists(skillsSrc)) {
      await fs.ensureDir(path.join(targetDir, "skills"));
      await fs.copy(skillsSrc, path.join(targetDir, "skills"));
    }
    const workflowsSrc = path.join(projectOpencodeDir, "workflows");
    if (await fs.pathExists(workflowsSrc)) {
      await fs.ensureDir(path.join(targetDir, "workflows"));
      await fs.copy(workflowsSrc, path.join(targetDir, "workflows"));
    }
  } else if (sourcePlatform === "claude") {
    const agentSrc = path.join(sourceAgentsDir, `${agentName}.md`);
    if (await fs.pathExists(agentSrc)) {
      await fs.copy(agentSrc, path.join(targetDir, "agent.md"));
    }
  } else if (sourcePlatform === "copilot") {
    const agentSrc = path.join(sourceAgentsDir, `${agentName}.agent.md`);
    if (await fs.pathExists(agentSrc)) {
      await fs.copy(agentSrc, path.join(targetDir, "agent.md"));
    }
  }
}
async function uninstallAgentFromProject(agentName, targetPlatform, projectRoot) {
  if (!projectRoot) {
    throw new Error("Project root not detected");
  }
  const projectPaths = PROJECT_LEVEL_PATHS[targetPlatform];
  if (!projectPaths) {
    throw new Error(`Unknown platform: ${targetPlatform}`);
  }
  const agentsDir = path.join(projectRoot, projectPaths.agents);
  if (targetPlatform === "opencode") {
    const agentFile = path.join(agentsDir, `${agentName}.md`);
    if (await fs.pathExists(agentFile)) {
      await fs.remove(agentFile);
    }
    const agentSource = path.join(AGENTS_ROOT, agentName);
    if (await fs.pathExists(agentSource)) {
      const projectOpencodeDir = path.dirname(agentsDir);
      const skillsSrc = path.join(agentSource, "skills");
      if (await fs.pathExists(skillsSrc)) {
        const skills = await fs.readdir(skillsSrc);
        const targetSkillsDir = path.join(projectOpencodeDir, "skills");
        if (await fs.pathExists(targetSkillsDir)) {
          for (const skill of skills) {
            try {
              await fs.remove(path.join(targetSkillsDir, skill));
            } catch (e) {
            }
          }
        }
      }
      const workflowsSrc = path.join(agentSource, "workflows");
      if (await fs.pathExists(workflowsSrc)) {
        const workflows = await fs.readdir(workflowsSrc);
        const targetWorkflowsDir = path.join(projectOpencodeDir, "workflows");
        if (await fs.pathExists(targetWorkflowsDir)) {
          for (const workflow of workflows) {
            try {
              await fs.remove(path.join(targetWorkflowsDir, workflow));
            } catch (e) {
            }
          }
        }
      }
    }
  } else if (targetPlatform === "claude") {
    const agentFile = path.join(agentsDir, `${agentName}.md`);
    if (await fs.pathExists(agentFile)) {
      await fs.remove(agentFile);
    }
  } else if (targetPlatform === "copilot") {
    const agentFile = path.join(agentsDir, `${agentName}.agent.md`);
    if (await fs.pathExists(agentFile)) {
      await fs.remove(agentFile);
    }
  }
}
var CONFIG_DIR = path.join(os.homedir(), ".config", "agentshare");
var CONFIG_FILE_JSON = path.join(CONFIG_DIR, "config.json");
var CONFIG_FILE_LEGACY = path.join(CONFIG_DIR, "config");
async function loadConfig() {
  try {
    if (await fs.pathExists(CONFIG_FILE_JSON)) {
      return await fs.readJson(CONFIG_FILE_JSON);
    }
    if (await fs.pathExists(CONFIG_FILE_LEGACY)) {
      const content = await fs.readFile(CONFIG_FILE_LEGACY, "utf8");
      const match = content.match(/^LANGUAGE=(.*)$/m);
      if (match) {
        const lang = match[1].trim();
        const config = { language: lang };
        await saveConfig(config);
        return config;
      }
    }
  } catch (e) {
  }
  return { language: null };
}
async function saveConfig(config) {
  await fs.ensureDir(CONFIG_DIR);
  await fs.writeJson(CONFIG_FILE_JSON, config);
}
var STRINGS = {
  en: {
    title: "AgentShare Intelligent Deployment Tool",
    installed_agents: "\u{1F4E6} Installed Agents",
    project_agents: "\u{1F4C1} Agents in Repository",
    no_agents: "  (None)",
    menu_prompt: "Please select an operation:",
    menu_deploy: "Deploy Agent (Project \u2192 Platform)",
    menu_extract: "Extract Agent (Platform \u2192 Project)",
    menu_uninstall: "Uninstall Agent (Remove from Platform)",
    menu_settings: "Settings",
    menu_exit: "Exit",
    menu_back: "Back",
    deploy_select_agent: "Select Agent to Deploy:",
    deploy_select_platform: "Select Target Platform:",
    extract_select_platform: "Select Source Platform:",
    extract_select_agent: "Select Agent to Extract:",
    uninstall_select_platform: "Select Platform:",
    uninstall_select_agent: "Select Agent to Uninstall:",
    settings_language: "Switch Language",
    deploying: "\u{1F680} Deploying %s to %s...",
    extracting: "\u{1F680} Extracting %s from %s...",
    uninstalling: "\u{1F5D1} Uninstalling %s from %s...",
    success_deploy: "\u2705 Successfully deployed %s to %s",
    success_extract: "\u2705 Successfully extracted %s",
    success_uninstall: "\u2705 Successfully uninstalled %s",
    error_prefix: "\u274C Error: ",
    feature_not_impl: "Feature not implemented",
    platform_not_installed: "%s not installed",
    // Language Selection
    lang_select_title: "Language Selection",
    lang_select_prompt: "Please select your language:",
    lang_english: "English",
    lang_chinese: "\u7B80\u4F53\u4E2D\u6587",
    // Project-level related
    scope_select: "Select Scope:",
    scope_global: "\u{1F310} Global",
    scope_project: "\u{1F4C2} Project",
    project_installed_agents: "\u{1F4E6} Installed Project Agents",
    global_installed_agents: "\u{1F310} Installed Global Agents",
    project_root_detected: "\u{1F4C1} Current Project Path: %s",
    project_root_not_detected: "\u26A0\uFE0F No project root detected",
    deploying_to_project: "\u{1F680} Deploying %s to %s (project)...",
    extracting_from_project: "\u{1F680} Extracting %s from %s (project)...",
    uninstalling_from_project: "\u{1F5D1} Uninstalling %s from %s (project)...",
    success_deploy_project: "\u2705 Successfully deployed %s to %s (project)",
    success_extract_project: "\u2705 Successfully extracted %s (project)",
    success_uninstall_project: "\u2705 Successfully uninstalled %s (project)",
    platform_all: "\u{1F30D} All Platforms",
    deploying_to_all: "\u{1F680} Deploying %s to all platforms...",
    deploying_to_all_project: "\u{1F680} Deploying %s to all platforms (project)...",
    success_deploy_all: "\u2705 Successfully deployed %s to all platforms",
    success_deploy_all_project: "\u2705 Successfully deployed %s to all platforms (project)",
    // Confirmation
    confirm_deploy_title: "\u26A0\uFE0F Conflict Detected",
    confirm_deploy_message: "Agent '%s' already exists on %s. Do you want to overwrite it?",
    confirm_yes: "Yes, Overwrite",
    confirm_no: "No, Cancel"
  },
  zh: {
    title: "AgentShare \u667A\u80FD\u90E8\u7F72\u5DE5\u5177",
    installed_agents: "\u{1F4E6} \u5DF2\u5B89\u88C5\u7684 Agents",
    project_agents: "\u{1F4C1} AgentShare\u4ED3\u5E93\u4E2D\u7684 Agents",
    no_agents: "  (\u65E0)",
    menu_prompt: "\u8BF7\u9009\u62E9\u64CD\u4F5C:",
    menu_deploy: "\u90E8\u7F72 Agent (AgentShare \u2192 \u4F60\u7684 AI \u5DE5\u5177)",
    menu_extract: "\u63D0\u53D6 Agent (\u4F60\u7684 AI \u5DE5\u5177 \u2192 AgentShare)",
    menu_uninstall: "\u5378\u8F7D Agent (\u4ECE\u4F60\u7684 AI \u5DE5\u5177\u79FB\u9664)",
    menu_settings: "\u8BBE\u7F6E",
    menu_exit: "\u9000\u51FA",
    menu_back: "\u8FD4\u56DE",
    deploy_select_agent: "\u9009\u62E9\u8981\u90E8\u7F72\u7684 Agent:",
    deploy_select_platform: "\u9009\u62E9\u90E8\u7F72\u76EE\u6807:",
    extract_select_platform: "\u9009\u62E9\u6765\u6E90\u5E73\u53F0:",
    extract_select_agent: "\u9009\u62E9\u8981\u63D0\u53D6\u7684 Agent:",
    uninstall_select_platform: "\u9009\u62E9\u5E73\u53F0:",
    uninstall_select_agent: "\u9009\u62E9\u8981\u5378\u8F7D\u7684 Agent:",
    settings_language: "\u5207\u6362\u8BED\u8A00",
    deploying: "\u{1F680} \u6B63\u5728\u90E8\u7F72 %s \u5230 %s...",
    extracting: "\u{1F680} \u6B63\u5728\u4ECE %s \u63D0\u53D6 %s...",
    uninstalling: "\u{1F5D1} \u6B63\u5728\u4ECE %s \u5378\u8F7D %s...",
    success_deploy: "\u2705 \u6210\u529F\u90E8\u7F72 %s \u5230 %s",
    success_extract: "\u2705 \u6210\u529F\u63D0\u53D6 %s",
    success_uninstall: "\u2705 \u6210\u529F\u5378\u8F7D %s",
    error_prefix: "\u274C \u9519\u8BEF: ",
    feature_not_impl: "\u529F\u80FD\u672A\u5B9E\u73B0",
    platform_not_installed: "%s \u672A\u5B89\u88C5",
    // Language Selection
    lang_select_title: "\u8BED\u8A00\u9009\u62E9",
    lang_select_prompt: "\u8BF7\u9009\u62E9\u60A8\u7684\u8BED\u8A00\uFF1A",
    lang_english: "English",
    lang_chinese: "\u7B80\u4F53\u4E2D\u6587",
    // Project-level related
    scope_select: "\u9009\u62E9\u8303\u56F4:",
    scope_global: "\u{1F310} \u5168\u5C40",
    scope_project: "\u{1F4C2} \u9879\u76EE",
    project_installed_agents: "\u{1F4E6} \u5DF2\u5B89\u88C5\u7684\u9879\u76EE\u7EA7 Agents",
    global_installed_agents: "\u{1F310} \u5DF2\u5B89\u88C5\u7684\u5168\u5C40 Agents",
    project_root_detected: "\u{1F4C1} \u5F53\u524D\u9879\u76EE\u8DEF\u5F84: %s",
    project_root_not_detected: "\u26A0\uFE0F \u672A\u68C0\u6D4B\u5230\u9879\u76EE\u6839\u76EE\u5F55",
    deploying_to_project: "\u{1F680} \u6B63\u5728\u90E8\u7F72 %s \u5230 %s (\u9879\u76EE)...",
    extracting_from_project: "\u{1F680} \u6B63\u5728\u4ECE %s \u63D0\u53D6 %s (\u9879\u76EE)...",
    uninstalling_from_project: "\u{1F5D1} \u6B63\u5728\u4ECE %s \u5378\u8F7D %s (\u9879\u76EE)...",
    success_deploy_project: "\u2705 \u6210\u529F\u90E8\u7F72 %s \u5230 %s (\u9879\u76EE)",
    success_extract_project: "\u2705 \u6210\u529F\u63D0\u53D6 %s (\u9879\u76EE)",
    success_uninstall_project: "\u2705 \u6210\u529F\u5378\u8F7D %s (\u9879\u76EE)",
    platform_all: "\u{1F30D} \u6240\u6709\u5E73\u53F0",
    deploying_to_all: "\u{1F680} \u6B63\u5728\u90E8\u7F72 %s \u5230\u6240\u6709\u5E73\u53F0...",
    deploying_to_all_project: "\u{1F680} \u6B63\u5728\u90E8\u7F72 %s \u5230\u6240\u6709\u5E73\u53F0 (\u9879\u76EE)...",
    success_deploy_all: "\u2705 \u6210\u529F\u90E8\u7F72 %s \u5230\u6240\u6709\u5E73\u53F0",
    success_deploy_all_project: "\u2705 \u6210\u529F\u90E8\u7F72 %s \u5230\u6240\u6709\u5E73\u53F0 (\u9879\u76EE)",
    // Confirmation
    confirm_deploy_title: "\u26A0\uFE0F \u51B2\u7A81\u68C0\u6D4B",
    confirm_deploy_message: "Agent '%s' \u5DF2\u5B58\u5728\u4E8E %s\u3002\u662F\u5426\u8986\u76D6\uFF1F",
    confirm_yes: "\u662F\uFF0C\u8986\u76D6",
    confirm_no: "\u5426\uFF0C\u53D6\u6D88"
  }
};
function getText(key, lang = "zh", ...args) {
  const s = STRINGS[lang]?.[key] || STRINGS[lang === "zh" ? "en" : "zh"]?.[key] || key;
  if (args.length > 0) {
    return args.reduce((acc, current) => acc.replace("%s", current), s);
  }
  return s;
}
var Header = ({ lang }) => /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", alignItems: "center", marginBottom: 1, borderStyle: "double", borderColor: "magenta", paddingX: 2 }, /* @__PURE__ */ React.createElement(Text, { color: "magenta", bold: true }, getText("title", lang)));
var Dashboard = ({ installed, projectInstalled, projectAgents, projectRoot, platforms = {}, lang }) => {
  const projectName = projectRoot ? path2.basename(projectRoot) : null;
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginBottom: 1, width: "100%" }, /* @__PURE__ */ React.createElement(Box, { flexDirection: "row", gap: 2, width: "100%" }, /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", flexGrow: 1, borderStyle: "round", borderColor: "magenta", paddingX: 1 }, /* @__PURE__ */ React.createElement(Text, { bold: true }, getText("global_installed_agents", lang)), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginTop: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "green" }, "OpenCode CLI:"), installed.opencode.length > 0 ? installed.opencode.map((a) => /* @__PURE__ */ React.createElement(Text, { key: a }, "  \u2022 ", a)) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_agents", lang)), /* @__PURE__ */ React.createElement(Text, { color: "green", marginTop: 1 }, "Claude Code:"), installed.claude.length > 0 ? installed.claude.map((a) => /* @__PURE__ */ React.createElement(Text, { key: a }, "  \u2022 ", a)) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_agents", lang)), platforms.kilocode && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "green", marginTop: 1 }, "Kilo Code Plugin (VS Code):"), installed.kilocode.length > 0 ? installed.kilocode.map((a) => /* @__PURE__ */ React.createElement(Text, { key: a }, "  \u2022 ", a)) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_agents", lang))), /* @__PURE__ */ React.createElement(Text, { color: "green", marginTop: 1 }, "GitHub Copilot:"), installed.copilot.length > 0 ? installed.copilot.map((a) => /* @__PURE__ */ React.createElement(Text, { key: a }, "  \u2022 ", a)) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_agents", lang)))), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", flexGrow: 1, borderStyle: "round", borderColor: "cyan", paddingX: 1 }, /* @__PURE__ */ React.createElement(Text, { bold: true }, getText("project_installed_agents", lang)), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginTop: 1 }, projectRoot ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "green" }, "OpenCode CLI:"), projectInstalled.opencode.length > 0 ? projectInstalled.opencode.map((a) => /* @__PURE__ */ React.createElement(Text, { key: a }, "  \u2022 ", a)) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_agents", lang)), /* @__PURE__ */ React.createElement(Text, { color: "green", marginTop: 1 }, "Claude Code:"), projectInstalled.claude.length > 0 ? projectInstalled.claude.map((a) => /* @__PURE__ */ React.createElement(Text, { key: a }, "  \u2022 ", a)) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_agents", lang)), /* @__PURE__ */ React.createElement(Text, { color: "green", marginTop: 1 }, "GitHub Copilot:"), projectInstalled.copilot.length > 0 ? projectInstalled.copilot.map((a) => /* @__PURE__ */ React.createElement(Text, { key: a }, "  \u2022 ", a)) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_agents", lang))) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("project_root_not_detected", lang)))), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", flexGrow: 1, borderStyle: "round", borderColor: "magenta", paddingX: 1 }, /* @__PURE__ */ React.createElement(Text, { bold: true }, getText("project_agents", lang)), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginTop: 1 }, projectAgents.length > 0 ? projectAgents.map((a) => /* @__PURE__ */ React.createElement(Text, { key: a }, "  \u2022 ", a)) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_agents", lang))))), projectRoot && /* @__PURE__ */ React.createElement(Box, { marginTop: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "yellow" }, getText("project_root_detected", lang, projectName))));
};
var MessageLog = ({ message }) => {
  if (!message) return null;
  return /* @__PURE__ */ React.createElement(Box, { borderStyle: "single", borderColor: "magenta", paddingX: 1, marginBottom: 1, justifyContent: "center", width: "100%" }, /* @__PURE__ */ React.createElement(Text, null, message));
};
var App = () => {
  const { exit } = useApp();
  const [lang, setLang] = useState("zh");
  const [isLangSelected, setIsLangSelected] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");
  const [platforms, setPlatforms] = useState({ opencode: null, claude: null, kilocode: null, copilot: null });
  const [installedAgents, setInstalledAgents] = useState({ opencode: [], claude: [], kilocode: [], copilot: [] });
  const [projectAgents, setProjectAgents] = useState([]);
  const [projectInstalledAgents, setProjectInstalledAgents] = useState({ opencode: [], claude: [], kilocode: [], copilot: [] });
  const [projectRoot, setProjectRoot] = useState(null);
  const [message, setMessage] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedScope, setSelectedScope] = useState(null);
  const [confirmationQueue, setConfirmationQueue] = useState([]);
  const [deployResults, setDeployResults] = useState([]);
  const refreshData = async () => {
    const config = await loadConfig();
    if (config.language) {
      setLang(config.language);
      setIsLangSelected(true);
    } else {
    }
    const p = await detectPlatforms();
    setPlatforms(p);
    setInstalledAgents(await scanInstalledAgents(p));
    setProjectAgents(await scanAgents(AGENTS_ROOT));
    const pRoot = await detectProjectRoot();
    setProjectRoot(pRoot);
    if (pRoot) {
      setProjectInstalledAgents(await scanProjectAgents(pRoot));
    }
  };
  useEffect(() => {
    refreshData();
  }, [message]);
  const changeLanguage = async (newLang) => {
    setLang(newLang);
    await saveConfig({ language: newLang });
    setIsLangSelected(true);
    setActiveTab("menu");
  };
  useInput((input, key) => {
    if (key.escape) {
      if (activeTab === "deploy_select_agent") setActiveTab("menu");
      else if (activeTab === "deploy_select_platform") setActiveTab("deploy_select_agent");
      else if (activeTab === "deploy_select_scope") setActiveTab("deploy_select_platform");
      else if (activeTab === "extract_select_platform") setActiveTab("menu");
      else if (activeTab === "extract_select_scope") setActiveTab("extract_select_platform");
      else if (activeTab === "extract_select_agent") setActiveTab("extract_select_scope");
      else if (activeTab === "uninstall_select_platform") setActiveTab("menu");
      else if (activeTab === "uninstall_select_scope") setActiveTab("uninstall_select_platform");
      else if (activeTab === "uninstall_select_agent") setActiveTab("uninstall_select_scope");
      else if (activeTab === "settings_menu") setActiveTab("menu");
      else if (activeTab === "settings_language") setActiveTab("settings_menu");
    }
  });
  const handleMenuSelect = (item) => {
    if (item.value === "exit") {
      exit();
    } else if (item.value === "deploy") {
      setActiveTab("deploy_select_agent");
    } else if (item.value === "extract") {
      setActiveTab("extract_select_platform");
    } else if (item.value === "uninstall") {
      setActiveTab("uninstall_select_platform");
    } else if (item.value === "settings") {
      setActiveTab("settings_menu");
    }
  };
  const handleDeploySelectAgent = (item) => {
    if (item.value === "back") {
      setActiveTab("menu");
    } else {
      setSelectedAgent(item.value);
      setActiveTab("deploy_select_platform");
    }
  };
  const handleDeploySelectPlatform = (item) => {
    if (item.value === "back") {
      setActiveTab("deploy_select_agent");
    } else {
      setSelectedPlatform(item.value);
      setActiveTab("deploy_select_scope");
    }
  };
  const handleDeploySelectScope = async (item) => {
    if (item.value === "back") {
      setActiveTab("deploy_select_platform");
    } else if (item.value === "global") {
      if (selectedPlatform === "all") {
        const allPlatforms = ["opencode", "claude", "kilocode", "copilot"];
        const newQueue = [];
        const safeToDeploy = [];
        for (const p of allPlatforms) {
          if (await checkAgentExists(selectedAgent, p, platforms)) {
            newQueue.push({ agent: selectedAgent, platform: p, scope: "global" });
          } else {
            safeToDeploy.push({ agent: selectedAgent, platform: p, scope: "global" });
          }
        }
        if (newQueue.length > 0) {
          setConfirmationQueue(newQueue);
          for (const task of safeToDeploy) {
            await executeDeployGlobal(task.platform, true);
          }
          setActiveTab("deploy_confirm");
          return;
        }
        executeDeployGlobal("all");
      } else {
        if (await checkAgentExists(selectedAgent, selectedPlatform, platforms)) {
          setConfirmationQueue([{ agent: selectedAgent, platform: selectedPlatform, scope: "global" }]);
          setActiveTab("deploy_confirm");
          return;
        }
        executeDeployGlobal(selectedPlatform);
      }
    } else if (item.value === "project") {
      if (!projectRoot) {
        setMessage(getText("project_root_not_detected", lang));
        setActiveTab("menu");
        return;
      }
      if (selectedPlatform === "all") {
        const allPlatforms = ["opencode", "claude", "kilocode", "copilot"];
        const newQueue = [];
        const safeToDeploy = [];
        for (const p of allPlatforms) {
          if (await checkAgentExistsInProject(selectedAgent, p, projectRoot)) {
            newQueue.push({ agent: selectedAgent, platform: p, scope: "project" });
          } else {
            safeToDeploy.push({ agent: selectedAgent, platform: p, scope: "project" });
          }
        }
        if (newQueue.length > 0) {
          setConfirmationQueue(newQueue);
          for (const task of safeToDeploy) {
            await executeDeployProject(task.platform, true);
          }
          setActiveTab("deploy_confirm");
          return;
        }
        executeDeployProject("all");
      } else {
        if (await checkAgentExistsInProject(selectedAgent, selectedPlatform, projectRoot)) {
          setConfirmationQueue([{ agent: selectedAgent, platform: selectedPlatform, scope: "project" }]);
          setActiveTab("deploy_confirm");
          return;
        }
        executeDeployProject(selectedPlatform);
      }
    }
  };
  const executeDeployGlobal = async (platform, silent = false) => {
    if (platform === "all") {
      setMessage(getText("deploying_to_all", lang, selectedAgent));
      const allPlatforms = ["opencode", "claude", "kilocode", "copilot"];
      let successCount = 0;
      let errors = [];
      for (const p of allPlatforms) {
        try {
          await deployAgent(selectedAgent, p, platforms);
          successCount++;
        } catch (e) {
          errors.push(`${p}: ${e.message}`);
        }
      }
      if (errors.length === 0) {
        setMessage(getText("success_deploy_all", lang, selectedAgent));
      } else {
        setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
      }
      if (silent) await refreshData();
    } else {
      if (!silent) {
        const platformLabel = platform === "opencode" ? "OpenCode CLI" : platform === "claude" ? "Claude Code" : platform === "kilocode" ? "Kilo Code Plugin (VS Code)" : "GitHub Copilot";
        setMessage(getText("deploying", lang, selectedAgent, platformLabel));
      }
      try {
        await deployAgent(selectedAgent, platform, platforms);
        if (!silent) {
          const platformLabel = platform === "opencode" ? "OpenCode CLI" : platform === "claude" ? "Claude Code" : platform === "kilocode" ? "Kilo Code Plugin (VS Code)" : "GitHub Copilot";
          setMessage(getText("success_deploy", lang, selectedAgent, platformLabel));
        } else {
          await refreshData();
        }
      } catch (e) {
        if (silent) {
        } else {
          setMessage(getText("error_prefix", lang) + e.message);
        }
      }
    }
    if (!silent) setActiveTab("menu");
  };
  const executeDeployProject = async (platform, silent = false) => {
    if (platform === "all") {
      setMessage(getText("deploying_to_all_project", lang, selectedAgent));
      const allPlatforms = ["opencode", "claude", "kilocode", "copilot"];
      let successCount = 0;
      let errors = [];
      for (const p of allPlatforms) {
        try {
          await deployAgentToProject(selectedAgent, p, projectRoot);
          successCount++;
        } catch (e) {
          errors.push(`${p}: ${e.message}`);
        }
      }
      if (errors.length === 0) {
        setMessage(getText("success_deploy_all_project", lang, selectedAgent));
      } else {
        setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
      }
      if (silent) await refreshData();
    } else {
      if (!silent) {
        const platformLabel = platform === "opencode" ? "OpenCode CLI" : platform === "claude" ? "Claude Code" : platform === "kilocode" ? "Kilo Code Plugin (VS Code)" : "GitHub Copilot";
        setMessage(getText("deploying_to_project", lang, selectedAgent, platformLabel));
      }
      try {
        await deployAgentToProject(selectedAgent, platform, projectRoot);
        if (!silent) {
          const platformLabel = platform === "opencode" ? "OpenCode CLI" : platform === "claude" ? "Claude Code" : platform === "kilocode" ? "Kilo Code Plugin (VS Code)" : "GitHub Copilot";
          setMessage(getText("success_deploy_project", lang, selectedAgent, platformLabel));
        } else {
          await refreshData();
        }
      } catch (e) {
        if (!silent) setMessage(getText("error_prefix", lang) + e.message);
      }
    }
    if (!silent) setActiveTab("menu");
  };
  const handleDeployConfirm = async (item) => {
    const currentTask = confirmationQueue[0];
    if (item.value === "yes") {
      if (currentTask.scope === "global") {
        await executeDeployGlobal(currentTask.platform, true);
      } else {
        await executeDeployProject(currentTask.platform, true);
      }
    } else {
    }
    const remaining = confirmationQueue.slice(1);
    setConfirmationQueue(remaining);
    if (remaining.length === 0) {
      setActiveTab("menu");
    }
  };
  const handleExtractSelectPlatform = (item) => {
    if (item.value === "back") setActiveTab("menu");
    else {
      setSelectedPlatform(item.value);
      setActiveTab("extract_select_scope");
    }
  };
  const handleExtractSelectScope = (item) => {
    if (item.value === "back") {
      setActiveTab("extract_select_platform");
    } else {
      setSelectedScope(item.value);
      setActiveTab("extract_select_agent");
    }
  };
  const handleExtractSelectAgent = async (item) => {
    if (item.value === "back") setActiveTab("extract_select_scope");
    else {
      if (selectedScope === "global") {
        setMessage(getText("extracting", lang, item.value, selectedPlatform));
        try {
          await extractAgent(item.value, selectedPlatform, platforms);
          setMessage(getText("success_extract", lang, item.value));
        } catch (e) {
          setMessage(getText("error_prefix", lang) + e.message);
        }
      } else {
        if (!projectRoot) {
          setMessage(getText("project_root_not_detected", lang));
          setActiveTab("menu");
          return;
        }
        setMessage(getText("extracting_from_project", lang, item.value, selectedPlatform));
        try {
          await extractAgentFromProject(item.value, selectedPlatform, projectRoot);
          setMessage(getText("success_extract_project", lang, item.value));
        } catch (e) {
          setMessage(getText("error_prefix", lang) + e.message);
        }
      }
      setActiveTab("menu");
    }
  };
  const handleUninstallSelectPlatform = (item) => {
    if (item.value === "back") setActiveTab("menu");
    else {
      setSelectedPlatform(item.value);
      setActiveTab("uninstall_select_scope");
    }
  };
  const handleUninstallSelectScope = (item) => {
    if (item.value === "back") {
      setActiveTab("uninstall_select_platform");
    } else {
      setSelectedScope(item.value);
      setActiveTab("uninstall_select_agent");
    }
  };
  const handleUninstallSelectAgent = async (item) => {
    if (item.value === "back") setActiveTab("uninstall_select_scope");
    else {
      if (selectedScope === "global") {
        setMessage(getText("uninstalling", lang, item.value, selectedPlatform));
        try {
          await uninstallAgent(item.value, selectedPlatform, platforms);
          setMessage(getText("success_uninstall", lang, item.value));
        } catch (e) {
          setMessage(getText("error_prefix", lang) + e.message);
        }
      } else {
        if (!projectRoot) {
          setMessage(getText("project_root_not_detected", lang));
          setActiveTab("menu");
          return;
        }
        setMessage(getText("uninstalling_from_project", lang, item.value, selectedPlatform));
        try {
          await uninstallAgentFromProject(item.value, selectedPlatform, projectRoot);
          setMessage(getText("success_uninstall_project", lang, item.value));
        } catch (e) {
          setMessage(getText("error_prefix", lang) + e.message);
        }
      }
      setActiveTab("menu");
    }
  };
  const handleSettingsSelect = (item) => {
    if (item.value === "back") setActiveTab("menu");
    else if (item.value === "language") setActiveTab("settings_language");
  };
  const handleSettingsLanguageSelect = (item) => {
    if (item.value === "back") setActiveTab("settings_menu");
    else {
      changeLanguage(item.value);
    }
  };
  const handleStartupLangSelect = (item) => {
    changeLanguage(item.value);
  };
  const menuItems = [
    { label: getText("menu_deploy", lang), value: "deploy" },
    { label: getText("menu_extract", lang), value: "extract" },
    { label: getText("menu_uninstall", lang), value: "uninstall" },
    { label: getText("menu_settings", lang), value: "settings" },
    { label: getText("menu_exit", lang), value: "exit" }
  ];
  const deployAgentItems = [...projectAgents.map((a) => ({ label: a, value: a })), { label: getText("menu_back", lang), value: "back" }];
  const deployPlatformItems = [
    { label: getText("platform_all", lang), value: "all" },
    { label: "OpenCode CLI", value: "opencode" },
    { label: "Claude Code", value: "claude" },
    { label: "Kilo Code Plugin (VS Code)", value: "kilocode" },
    { label: "GitHub Copilot", value: "copilot" },
    { label: getText("menu_back", lang), value: "back" }
  ];
  const platformItems = [
    { label: "OpenCode CLI", value: "opencode" },
    { label: "Claude Code", value: "claude" },
    { label: "Kilo Code Plugin (VS Code)", value: "kilocode" },
    { label: "GitHub Copilot", value: "copilot" },
    { label: getText("menu_back", lang), value: "back" }
  ];
  const settingsMenuItems = [
    { label: getText("settings_language", lang), value: "language" },
    { label: getText("menu_back", lang), value: "back" }
  ];
  const settingsLanguageItems = [
    { label: "English", value: "en" },
    { label: "\u7B80\u4F53\u4E2D\u6587", value: "zh" },
    { label: getText("menu_back", lang), value: "back" }
  ];
  const startupLangItems = [{ label: "English", value: "en" }, { label: "\u7B80\u4F53\u4E2D\u6587", value: "zh" }];
  const scopeItems = [
    { label: getText("scope_global", lang), value: "global" },
    { label: getText("scope_project", lang), value: "project" },
    { label: getText("menu_back", lang), value: "back" }
  ];
  const getPlatformAgents = (p) => {
    if (!p) return [];
    return installedAgents[p] || [];
  };
  const getProjectPlatformAgents = (p) => {
    if (!p || !projectRoot) return [];
    return projectInstalledAgents[p] || [];
  };
  if (!isLangSelected) {
    return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", alignItems: "center", justifyContent: "center", height: 15, borderStyle: "double", borderColor: "magenta", padding: 1 }, /* @__PURE__ */ React.createElement(Text, { bold: true, color: "magenta", marginBottom: 1 }, getText("lang_select_title", lang)), /* @__PURE__ */ React.createElement(Text, { color: "cyan", marginBottom: 1 }, getText("lang_select_prompt", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: startupLangItems, onSelect: handleStartupLangSelect }));
  }
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", padding: 1 }, /* @__PURE__ */ React.createElement(Header, { lang }), /* @__PURE__ */ React.createElement(Dashboard, { installed: installedAgents, projectInstalled: projectInstalledAgents, projectAgents, projectRoot, platforms, lang }), /* @__PURE__ */ React.createElement(MessageLog, { message }), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginTop: 1 }, activeTab === "menu" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("menu_prompt", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: menuItems, onSelect: handleMenuSelect })), activeTab === "deploy_select_agent" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("deploy_select_agent", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: deployAgentItems, onSelect: handleDeploySelectAgent })), activeTab === "deploy_select_platform" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("deploy_select_platform", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: deployPlatformItems, onSelect: handleDeploySelectPlatform })), activeTab === "deploy_select_scope" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("scope_select", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: scopeItems, onSelect: handleDeploySelectScope })), activeTab === "deploy_confirm" && confirmationQueue.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "red", bold: true }, getText("confirm_deploy_title", lang)), /* @__PURE__ */ React.createElement(Text, { color: "yellow", marginBottom: 1 }, getText("confirm_deploy_message", lang, confirmationQueue[0].agent, confirmationQueue[0].platform === "all" ? getText("platform_all", lang) : confirmationQueue[0].platform)), /* @__PURE__ */ React.createElement(SelectInput, {
    items: [
      { label: getText("confirm_yes", lang), value: "yes" },
      { label: getText("confirm_no", lang), value: "no" }
    ],
    onSelect: handleDeployConfirm
  })), activeTab === "extract_select_platform" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("extract_select_platform", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: platformItems, onSelect: handleExtractSelectPlatform })), activeTab === "extract_select_scope" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("scope_select", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: scopeItems, onSelect: handleExtractSelectScope })), activeTab === "extract_select_agent" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("extract_select_agent", lang)), /* @__PURE__ */ React.createElement(SelectInput, {
    items: [
      ...(selectedScope === "global" ? getPlatformAgents(selectedPlatform) : getProjectPlatformAgents(selectedPlatform)).map((a) => ({ label: a, value: a })),
      { label: getText("menu_back", lang), value: "back" }
    ],
    onSelect: handleExtractSelectAgent
  })), activeTab === "uninstall_select_platform" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("uninstall_select_platform", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: platformItems, onSelect: handleUninstallSelectPlatform })), activeTab === "uninstall_select_scope" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("scope_select", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: scopeItems, onSelect: handleUninstallSelectScope })), activeTab === "uninstall_select_agent" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("uninstall_select_agent", lang)), /* @__PURE__ */ React.createElement(SelectInput, {
    items: [
      ...(selectedScope === "global" ? getPlatformAgents(selectedPlatform) : getProjectPlatformAgents(selectedPlatform)).map((a) => ({ label: a, value: a })),
      { label: getText("menu_back", lang), value: "back" }
    ],
    onSelect: handleUninstallSelectAgent
  })), activeTab === "settings_menu" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("menu_settings", lang), ":"), /* @__PURE__ */ React.createElement(SelectInput, { items: settingsMenuItems, onSelect: handleSettingsSelect })), activeTab === "settings_language" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("settings_language", lang), ":"), /* @__PURE__ */ React.createElement(SelectInput, { items: settingsLanguageItems, onSelect: handleSettingsLanguageSelect }))));
};
process.on("exit", () => {
  process.stdout.write("\x1B[2J\x1B[3J\x1B[H");
});
process.stdout.write("\x1B[2J\x1B[3J\x1B[H");
render(/* @__PURE__ */ React.createElement(App, null));
