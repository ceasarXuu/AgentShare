// index.js
import React, { useState, useEffect } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import SelectInput from "ink-select-input";
import path2 from "path";
import fs from "fs-extra";
import path from "path";
import os from "os";
import {
  REPO_ROOT, AGENTS_ROOT, SKILLS_ROOT, PLATFORM_PATHS, PROJECT_LEVEL_PATHS,
  detectProjectRoot, scanProjectAgents, scanAgents, detectPlatforms, scanInstalledAgents,
  checkAgentExists, checkAgentExistsInProject, deployAgent, deployAgentToProject,
  extractAgent, extractAgentFromProject, uninstallAgent, uninstallAgentFromProject,
  scanProjectSkills, scanPlatformSkills, deploySkill, extractSkill, uninstallSkill, registry
} from "./logic.js";
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
    home_installed_platforms: "\u{1F4CA} Installed Platforms Overview",
    home_global_agents: "Global Agents",
    home_global_skills: "Global Skills",
    home_project_agents: "Project Agents",
    home_project_skills: "Project Skills",
    home_no_platforms: "  (No platforms detected)",
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
    agent_all: "\u{1F9F9} All Agents",
    skill_all: "\u{1F9F9} All Skills",
    deploying_to_all: "\u{1F680} Deploying %s to all platforms...",
    deploying_to_all_project: "\u{1F680} Deploying %s to all platforms (project)...",
    success_deploy_all: "\u2705 Successfully deployed %s to all platforms",
    success_deploy_all_project: "\u2705 Successfully deployed %s to all platforms (project)",
    // Confirmation
    confirm_deploy_title: "\u26A0\uFE0F Conflict Detected",
    confirm_deploy_message: "Agent '%s' already exists on %s. Do you want to overwrite it?",
    confirm_yes: "Yes, Overwrite",
    confirm_no: "No, Cancel",
    // V2.0 Skills
    mode_select_title: "Welcome to AgentShare v2.0",
    mode_select_prompt: "Please select management mode:",
    mode_agent: "🤖 Agent Management",
    mode_skill: "🛠️  Skills Management",
    skill_dashboard_title: "Skills Management Dashboard",
    project_skills: "📦 Skills in Repository",
    no_skills: "  (None)",
    menu_deploy_skill: "Deploy Skill (Project → Platform)",
    menu_extract_skill: "Extract Skill (Platform → Project)",
    menu_uninstall_skill: "Uninstall Skill",
    deploy_select_skill: "Select Skill to Deploy:",
    extract_select_skill: "Select Skill to Extract:",
    uninstall_select_skill: "Select Skill to Uninstall:",
    deploying_skill: "🚀 Deploying Skill %s to %s...",
    success_deploy_skill: "✅ Successfully deployed Skill %s",
    platform_global_config: "Global Config",
    platform_project_config: "Project Config"
  },
  zh: {
    title: "AgentShare 智能部署工具",
    installed_agents: "\u{1F4E6} \u5DF2\u5B89\u88C5\u7684 Agents",
    project_agents: "\u{1F4C1} AgentShare\u4ED3\u5E93\u4E2D\u7684 Agents",
    home_installed_platforms: "\u{1F4CA} \u5DF2\u5B89\u88C5\u5E73\u53F0\u6982\u89C8",
    home_global_agents: "\u5168\u5C40 Agents",
    home_global_skills: "\u5168\u5C40 Skills",
    home_project_agents: "\u9879\u76EE Agents",
    home_project_skills: "\u9879\u76EE Skills",
    home_no_platforms: "  (\u672A\u68C0\u6D4B\u5230\u5DF2\u5B89\u88C5\u5E73\u53F0)",
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
    agent_all: "\u{1F9F9} \u6240\u6709 Agents",
    skill_all: "\u{1F9F9} \u6240\u6709 Skills",
    deploying_to_all: "\u{1F680} \u6B63\u5728\u90E8\u7F72 %s \u5230\u6240\u6709\u5E73\u53F0...",
    deploying_to_all_project: "\u{1F680} \u6B63\u5728\u90E8\u7F72 %s \u5230\u6240\u6709\u5E73\u53F0 (\u9879\u76EE)...",
    success_deploy_all: "\u2705 \u6210\u529F\u90E8\u7F72 %s \u5230\u6240\u6709\u5E73\u53F0",
    success_deploy_all_project: "\u2705 \u6210\u529F\u90E8\u7F72 %s \u5230\u6240\u6709\u5E73\u53F0 (\u9879\u76EE)",
    // Confirmation
    confirm_deploy_title: "\u26A0\uFE0F \u51B2\u7A81\u68C0\u6D4B",
    confirm_deploy_message: "Agent '%s' \u5DF2\u5B58\u5728\u4E8E %s\u3002\u662F\u5426\u8986\u76D6\uFF1F",
    confirm_yes: "\u662F\uFF0C\u8986\u76D6",
    confirm_no: "\u5426\uFF0C\u53D6\u6D88",
    // V2.0 Skills
    mode_select_title: "欢迎使用 AgentShare v2.0",
    mode_select_prompt: "请选择管理模式：",
    mode_agent: "🤖 Agent 管理",
    mode_skill: "🛠️  Skills 管理",
    skill_dashboard_title: "Skills 管理控制台",
    project_skills: "📦 仓库中的 Skills",
    no_skills: "  (无)",
    menu_deploy_skill: "部署 Skill (项目 → 平台)",
    menu_extract_skill: "提取 Skill (平台 → 项目)",
    menu_uninstall_skill: "卸载 Skill",
    deploy_select_skill: "选择要部署的 Skill:",
    extract_select_skill: "选择要提取的 Skill:",
    uninstall_select_skill: "选择要卸载的 Skill:",
    deploying_skill: "🚀 正在部署 Skill %s 到 %s...",
    success_deploy_skill: "✅ 成功部署 Skill %s",
    platform_global_config: "全局配置",
    platform_project_config: "项目配置"
  }
};
function getText(key, lang = "zh", ...args) {
  const s = STRINGS[lang]?.[key] || STRINGS[lang === "zh" ? "en" : "zh"]?.[key] || key;
  if (args.length > 0) {
    return args.reduce((acc, current) => acc.replace("%s", current), s);
  }
  return s;
}
function getSelectLimit() {
  const rows = process.stdout && Number.isFinite(process.stdout.rows) ? process.stdout.rows : 24;
  const candidate = Math.floor(rows - 12);
  if (candidate < 6) return 6;
  if (candidate > 20) return 20;
  return candidate;
}
var Header = ({ lang }) => /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", alignItems: "center", marginBottom: 1, borderStyle: "double", borderColor: "magenta", paddingX: 2 }, /* @__PURE__ */ React.createElement(Text, { color: "magenta", bold: true }, getText("title", lang)));
var Dashboard = ({ installed, projectInstalled, projectAgents, projectRoot, platforms = {}, lang }) => {
  const projectName = projectRoot ? path2.basename(projectRoot) : null;
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginBottom: 1, width: "100%" }, /* @__PURE__ */ React.createElement(Box, { flexDirection: "row", gap: 2, width: "100%" }, /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", flexGrow: 1, borderStyle: "round", borderColor: "magenta", paddingX: 1 }, /* @__PURE__ */ React.createElement(Text, { bold: true }, getText("global_installed_agents", lang)), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginTop: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "green" }, "OpenCode CLI:"), installed.opencode.length > 0 ? installed.opencode.map((a) => /* @__PURE__ */ React.createElement(Text, { key: a }, "  \u2022 ", a)) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_agents", lang)), /* @__PURE__ */ React.createElement(Text, { color: "green", marginTop: 1 }, "Claude Code:"), installed.claude.length > 0 ? installed.claude.map((a) => /* @__PURE__ */ React.createElement(Text, { key: a }, "  \u2022 ", a)) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_agents", lang)), platforms.kilocode && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "green", marginTop: 1 }, "Kilo Code Plugin (VS Code):"), installed.kilocode.length > 0 ? installed.kilocode.map((a) => /* @__PURE__ */ React.createElement(Text, { key: a }, "  \u2022 ", a)) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_agents", lang))), /* @__PURE__ */ React.createElement(Text, { color: "green", marginTop: 1 }, "GitHub Copilot:"), installed.copilot.length > 0 ? installed.copilot.map((a) => /* @__PURE__ */ React.createElement(Text, { key: a }, "  \u2022 ", a)) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_agents", lang)))), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", flexGrow: 1, borderStyle: "round", borderColor: "cyan", paddingX: 1 }, /* @__PURE__ */ React.createElement(Text, { bold: true }, getText("project_installed_agents", lang)), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginTop: 1 }, projectRoot ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "green" }, "OpenCode CLI:"), projectInstalled.opencode.length > 0 ? projectInstalled.opencode.map((a) => /* @__PURE__ */ React.createElement(Text, { key: a }, "  \u2022 ", a)) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_agents", lang)), /* @__PURE__ */ React.createElement(Text, { color: "green", marginTop: 1 }, "Claude Code:"), projectInstalled.claude.length > 0 ? projectInstalled.claude.map((a) => /* @__PURE__ */ React.createElement(Text, { key: a }, "  \u2022 ", a)) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_agents", lang)), /* @__PURE__ */ React.createElement(Text, { color: "green", marginTop: 1 }, "GitHub Copilot:"), projectInstalled.copilot.length > 0 ? projectInstalled.copilot.map((a) => /* @__PURE__ */ React.createElement(Text, { key: a }, "  \u2022 ", a)) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_agents", lang))) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("project_root_not_detected", lang)))), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", flexGrow: 1, borderStyle: "round", borderColor: "magenta", paddingX: 1 }, /* @__PURE__ */ React.createElement(Text, { bold: true }, getText("project_agents", lang)), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginTop: 1 }, projectAgents.length > 0 ? projectAgents.map((a) => /* @__PURE__ */ React.createElement(Text, { key: a }, "  \u2022 ", a)) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_agents", lang))))), projectRoot && /* @__PURE__ */ React.createElement(Box, { marginTop: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "yellow" }, getText("project_root_detected", lang, projectName))));
};
Dashboard = ({ platformSummaries = [], projectRoot, lang }) => {
  const projectName = projectRoot ? path2.basename(projectRoot) : null;
  const labelWidth = 14;
  const columnWidth = labelWidth + 6;
  const padLabel = (text) => text.padEnd(labelWidth, " ");
  const renderCounts = (agentLabel, agentValue, skillLabel, skillValue, agentColor, skillColor) => /* @__PURE__ */ React.createElement(Box, { flexDirection: "row", marginLeft: 2 }, /* @__PURE__ */ React.createElement(Box, { width: columnWidth }, /* @__PURE__ */ React.createElement(Text, { color: agentColor }, padLabel(agentLabel)), /* @__PURE__ */ React.createElement(Text, { color: agentColor }, String(agentValue))), /* @__PURE__ */ React.createElement(Box, { width: columnWidth }, /* @__PURE__ */ React.createElement(Text, { color: skillColor }, padLabel(skillLabel)), /* @__PURE__ */ React.createElement(Text, { color: skillColor }, String(skillValue))));
  const rows = platformSummaries.map((p) => /* @__PURE__ */ React.createElement(Box, { key: p.id, flexDirection: "column", marginBottom: 1 }, /* @__PURE__ */ React.createElement(Text, { bold: true, color: "green" }, p.displayName), renderCounts(getText("home_global_agents", lang), p.globalAgents, getText("home_global_skills", lang), p.globalSkills, "cyan", "cyan"), projectRoot ? renderCounts(getText("home_project_agents", lang), p.projectAgents, getText("home_project_skills", lang), p.projectSkills, "yellow", "yellow") : null));
  const list = platformSummaries.length > 0 ? rows : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("home_no_platforms", lang));
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginBottom: 1, width: "100%" }, /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", flexGrow: 1, borderStyle: "round", borderColor: "magenta", paddingX: 1 }, /* @__PURE__ */ React.createElement(Text, { bold: true }, getText("home_installed_platforms", lang)), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginTop: 1 }, list)), projectRoot && /* @__PURE__ */ React.createElement(Box, { marginTop: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "yellow" }, getText("project_root_detected", lang, projectName))));
};
var MessageLog = ({ message }) => {
  if (!message) return null;
  return /* @__PURE__ */ React.createElement(Box, { borderStyle: "single", borderColor: "magenta", paddingX: 1, marginBottom: 1, justifyContent: "center", width: "100%" }, /* @__PURE__ */ React.createElement(Text, null, message));
};
// --- V2.0 Components ---

var ModeSelectionScreen = ({ onSelect, lang }) => /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", alignItems: "center", justifyContent: "center", height: 15, borderStyle: "double", borderColor: "cyan", padding: 2 }, /* @__PURE__ */ React.createElement(Text, { color: "cyan", bold: true, marginBottom: 1 }, getText("mode_select_title", lang)), /* @__PURE__ */ React.createElement(Text, { marginBottom: 2 }, getText("mode_select_prompt", lang)), /* @__PURE__ */ React.createElement(SelectInput, {
  items: [
    { label: getText("mode_agent", lang), value: "agent" },
    { label: getText("mode_skill", lang), value: "skill" }
  ],
  limit: getSelectLimit(),
  onSelect
}));


var SkillsDashboard = ({ projectSkills, globalSkills, projectConfigSkills, projectRoot, lang }) => {
  const projectName = projectRoot ? path.basename(projectRoot) : null;
  const allPlatforms = registry.getAllPlatforms();
  const skillPlatforms = allPlatforms.filter((plt) => Array.isArray(plt.features) && plt.features.includes("skills"));

  const renderList = (list) => {
    if (!list || list.length === 0) return /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("no_skills", lang));
    return list.map(s => /* @__PURE__ */ React.createElement(Text, { key: s }, "  \u2022 ", s));
  };

  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginBottom: 1, width: "100%" },
    /* @__PURE__ */ React.createElement(Text, { color: "cyan", bold: true, alignSelf: "center", marginBottom: 1 }, getText("skill_dashboard_title", lang)),
    /* @__PURE__ */ React.createElement(Box, { flexDirection: "row", gap: 2, width: "100%" },
        /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", flexGrow: 1, borderStyle: "round", borderColor: "blue", paddingX: 1 },
            /* @__PURE__ */ React.createElement(Text, { bold: true }, getText("platform_global_config", lang)),
            /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginTop: 1 },
    skillPlatforms.map(plt => {
      const skills = globalSkills[plt.name];
      // Only render if platform has global config capability (check logic or just check if skills array exists)
      // If skills is undefined, maybe it wasn't scanned or not supported.
      if (!skills) return null;
      return /* @__PURE__ */ React.createElement(React.Fragment, { key: plt.name },
                        /* @__PURE__ */ React.createElement(Text, { color: "green", marginTop: 1 }, plt.display_name + ":"),
        renderList(skills)
      );
    })
  )
  ),
        /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", flexGrow: 1, borderStyle: "round", borderColor: "green", paddingX: 1 },
            /* @__PURE__ */ React.createElement(Text, { bold: true }, getText("platform_project_config", lang)),
    projectRoot ? /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginTop: 1 },
      skillPlatforms.map(plt => {
        const skills = projectConfigSkills[plt.name];
        if (!skills) return null;
        return /* @__PURE__ */ React.createElement(React.Fragment, { key: plt.name },
                        /* @__PURE__ */ React.createElement(Text, { color: "green", marginTop: 1 }, plt.display_name + ":"),
          renderList(skills)
        );
      })
    ) : /* @__PURE__ */ React.createElement(Text, { color: "gray" }, getText("project_root_not_detected", lang))
  ),
        /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", flexGrow: 1, borderStyle: "round", borderColor: "magenta", paddingX: 1 },
            /* @__PURE__ */ React.createElement(Text, { bold: true }, getText("project_skills", lang)),
            /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginTop: 1 }, renderList(projectSkills))
  )
  ),
    projectRoot && /* @__PURE__ */ React.createElement(Box, { marginTop: 1 }, /* @__PURE__ */ React.createElement(Text, { color: "yellow" }, getText("project_root_detected", lang, projectName)))
  );
};


var App = () => {
  const { exit } = useApp();
  const ALL_ITEMS_VALUE = "__all__";
  const [lang, setLang] = useState("zh");
  const [mode, setMode] = useState("select");
  const [isLangSelected, setIsLangSelected] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");
  const [platforms, setPlatforms] = useState({ opencode: null, claude: null, kilocode: null, copilot: null });
  const [installedAgents, setInstalledAgents] = useState({ opencode: [], claude: [], kilocode: [], copilot: [] });
  const [projectAgents, setProjectAgents] = useState([]);
  const [projectInstalledAgents, setProjectInstalledAgents] = useState({ opencode: [], claude: [], kilocode: [], copilot: [] });
  // Skills State
  const [projectSkills, setProjectSkills] = useState([]);
  // Dynamic State: Map<platformName, string[]>
  const [globalSkills, setGlobalSkills] = useState({});
  const [projectConfigSkills, setProjectConfigSkills] = useState({});

  // Load registry on mount
  useEffect(() => {
    import('./logic.js').then(m => m.registry.load());
  }, []);

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
    // p is { opencode: true, claude_code: true, ... }
    setPlatforms(p);

    // Legacy Agent Scan (Mocked in logic.js for now)
    setInstalledAgents(await scanInstalledAgents(p));
    setProjectAgents(await scanAgents(AGENTS_ROOT));
    const pRoot = await detectProjectRoot();
    setProjectRoot(pRoot);
    if (pRoot) {
      setProjectInstalledAgents(await scanProjectAgents(pRoot));
    }

    // Dynamic Skills Scan
    setProjectSkills(await scanProjectSkills(pRoot));

    const { registry } = await import('./logic.js');
    const allPlatforms = registry.getAllPlatforms();
    const skillPlatforms = allPlatforms.filter((plt) => Array.isArray(plt.features) && plt.features.includes("skills"));

    const newGlobalSkills = {};
    const newProjectConfigSkills = {};

    for (const plt of skillPlatforms) {
      // Global Scan
      newGlobalSkills[plt.name] = await scanPlatformSkills(plt.name, 'global');

      // Project Scan
      if (pRoot) {
        newProjectConfigSkills[plt.name] = await scanPlatformSkills(plt.name, 'project', pRoot);
      }
    }

    setGlobalSkills(newGlobalSkills);
    setProjectConfigSkills(newProjectConfigSkills);
  };
  useEffect(() => {
    refreshData();
  }, [message]);
  const changeLanguage = async (newLang) => {
    setLang(newLang);
    await saveConfig({ language: newLang });
    setIsLangSelected(true);
    setActiveTab(mode === "settings" ? "settings_menu" : "menu");
  };
  useInput((input, key) => {
    if (key.escape) {
      if (mode !== 'select' && activeTab === 'menu') {
        setMode('select');
        return;
      }
      if (activeTab === "deploy_select_agent") setActiveTab("menu");
      else if (activeTab === "deploy_select_platform") setActiveTab("deploy_select_agent");
      else if (activeTab === "deploy_select_scope") setActiveTab("deploy_select_platform");
      else if (activeTab === "extract_select_platform") setActiveTab("menu");
      else if (activeTab === "extract_select_scope") setActiveTab("extract_select_platform");
      else if (activeTab === "extract_select_agent") setActiveTab("extract_select_scope");
      else if (activeTab === "uninstall_select_platform") setActiveTab("menu");
      else if (activeTab === "uninstall_select_scope") setActiveTab("uninstall_select_platform");
      else if (activeTab === "uninstall_select_agent") setActiveTab("uninstall_select_scope");
      else if (activeTab === "settings_menu") {
        if (mode === "settings") {
          setMode("select");
        } else {
          setActiveTab("menu");
        }
      }
      // Skill Tabs
      else if (activeTab === "deploy_select_skill") setActiveTab("menu");
      else if (activeTab === "uninstall_select_skill") setActiveTab("menu");
    }
  });

  const handleModeSelect = (item) => {
    if (item.value === "settings") {
      setMode("settings");
      setActiveTab("settings_menu");
      return;
    }
    if (item.value === "exit") {
      exit();
      return;
    }
    setMode(item.value);
    setActiveTab("menu");
  };
  const handleMenuSelect = (item) => {
    if (item.value === "exit") {
      exit();
    } else if (item.value === "deploy") {
      setActiveTab("deploy_select_agent");
    } else if (item.value === "extract") {
      setActiveTab("extract_select_platform");
    } else if (item.value === "uninstall") {
      setActiveTab("uninstall_select_platform");
    } else if (item.value === "back") {
      setMode("select");
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
      if (mode === "skill") {
        if (selectedPlatform === "all") {
          await executeDeployGlobal("all");
        } else {
          await executeDeployGlobal(selectedPlatform);
        }
        return;
      }
      if (selectedPlatform === "all") {
        const allPlatforms = getDeployPlatformsForScope("global");
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
      if (mode === "skill") {
        if (!projectRoot) {
          setMessage(getText("project_root_not_detected", lang));
          setActiveTab("menu");
          return;
        }
        if (selectedPlatform === "all") {
          await executeDeployProject("all");
        } else {
          await executeDeployProject(selectedPlatform);
        }
        return;
      }
      if (!projectRoot) {
        setMessage(getText("project_root_not_detected", lang));
        setActiveTab("menu");
        return;
      }
      if (selectedPlatform === "all") {
        const allPlatforms = getDeployPlatformsForScope("project");
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
    if (mode === 'skill') {
      if (platform === "all") {
        const platformsToDeploy = getDeployPlatformsForScope("global");
        let errors = [];
        for (const p of platformsToDeploy) {
          try {
            await deploySkill(selectedAgent, p, 'global', projectRoot);
          } catch (e) { errors.push(`${p}: ${e.message}`); }
        }
        if (errors.length === 0) setMessage(getText("success_deploy_all", lang, selectedAgent));
        else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
        if (silent) await refreshData();
      } else {
        if (!silent) setMessage(getText("deploying_skill", lang, selectedAgent, platform));
        try {
          await deploySkill(selectedAgent, platform, 'global', projectRoot);
          if (!silent) {
            setMessage(getText("success_deploy_skill", lang, selectedAgent));
            await refreshData();
          }
        } catch (e) {
          if (!silent) setMessage(getText("error_prefix", lang) + e.message);
        }
      }
      if (!silent) setActiveTab("menu");
      return;
    }

    if (platform === "all") {
      setMessage(getText("deploying_to_all", lang, selectedAgent));
      const allPlatforms = getDeployPlatformsForScope("global");
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
    if (mode === 'skill') {
      if (platform === "all") {
        const platformsToDeploy = getDeployPlatformsForScope("project");
        let errors = [];
        for (const p of platformsToDeploy) {
          try {
            await deploySkill(selectedAgent, p, 'project', projectRoot);
          } catch (e) { errors.push(`${p}: ${e.message}`); }
        }
        if (errors.length === 0) setMessage(getText("success_deploy_all", lang, selectedAgent));
        else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
        if (silent) await refreshData();
      } else {
        if (!silent) setMessage(getText("deploying_skill", lang, selectedAgent, platform));
        try {
          await deploySkill(selectedAgent, platform, 'project', projectRoot);
          if (!silent) {
            setMessage(getText("success_deploy_skill", lang, selectedAgent));
            await refreshData();
          }
        } catch (e) {
          if (!silent) setMessage(getText("error_prefix", lang) + e.message);
        }
      }
      if (!silent) setActiveTab("menu");
      return;
    }
    // Agent logic
    if (platform === "all") {
      setMessage(getText("deploying_to_all_project", lang, selectedAgent));
      const allPlatforms = getDeployPlatformsForScope("project");
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
      const platformsToRun = selectedPlatform === "all" ? getDeployPlatformsForScope(selectedScope) : [selectedPlatform];
      if (mode === "skill") {
        let errors = [];
        if (selectedScope === "global") {
          if (item.value === ALL_ITEMS_VALUE) {
            setMessage(getText("extracting", lang, getText("skill_all", lang), selectedPlatform === "all" ? getText("platform_all", lang) : selectedPlatform));
            const extracted = new Set();
            for (const p of platformsToRun) {
              const existing = getPlatformSkills(p, "global");
              for (const skillName of existing) {
                if (extracted.has(skillName)) continue;
                try {
                  await extractSkill(skillName, p, "global", projectRoot || undefined);
                  extracted.add(skillName);
                } catch (e) {
                  errors.push(`${p}/${skillName}: ${e.message}`);
                }
              }
            }
            if (errors.length === 0) setMessage(getText("success_extract", lang, getText("skill_all", lang)));
            else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
            setActiveTab("menu");
            return;
          }
          setMessage(getText("extracting", lang, item.value, selectedPlatform === "all" ? getText("platform_all", lang) : selectedPlatform));
          for (const p of platformsToRun) {
            const existing = getPlatformSkills(p, "global");
            if (!existing.includes(item.value)) continue;
            try {
              await extractSkill(item.value, p, "global", projectRoot || undefined);
            } catch (e) {
              errors.push(`${p}: ${e.message}`);
            }
          }
          if (errors.length === 0) setMessage(getText("success_extract", lang, item.value));
          else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
        } else {
          if (!projectRoot) {
            setMessage(getText("project_root_not_detected", lang));
            setActiveTab("menu");
            return;
          }
          if (item.value === ALL_ITEMS_VALUE) {
            setMessage(getText("extracting_from_project", lang, getText("skill_all", lang), selectedPlatform === "all" ? getText("platform_all", lang) : selectedPlatform));
            const extracted = new Set();
            for (const p of platformsToRun) {
              const existing = getPlatformSkills(p, "project");
              for (const skillName of existing) {
                if (extracted.has(skillName)) continue;
                try {
                  await extractSkill(skillName, p, "project", projectRoot);
                  extracted.add(skillName);
                } catch (e) {
                  errors.push(`${p}/${skillName}: ${e.message}`);
                }
              }
            }
            if (errors.length === 0) setMessage(getText("success_extract_project", lang, getText("skill_all", lang)));
            else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
            setActiveTab("menu");
            return;
          }
          setMessage(getText("extracting_from_project", lang, item.value, selectedPlatform === "all" ? getText("platform_all", lang) : selectedPlatform));
          for (const p of platformsToRun) {
            const existing = getPlatformSkills(p, "project");
            if (!existing.includes(item.value)) continue;
            try {
              await extractSkill(item.value, p, "project", projectRoot);
            } catch (e) {
              errors.push(`${p}: ${e.message}`);
            }
          }
          if (errors.length === 0) setMessage(getText("success_extract_project", lang, item.value));
          else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
        }
        setActiveTab("menu");
        return;
      }
      let errors = [];
      if (selectedScope === "global") {
        if (item.value === ALL_ITEMS_VALUE) {
          setMessage(getText("extracting", lang, getText("agent_all", lang), selectedPlatform === "all" ? getText("platform_all", lang) : selectedPlatform));
          const extracted = new Set();
          for (const p of platformsToRun) {
            const existing = getPlatformAgents(p);
            for (const agentName of existing) {
              if (extracted.has(agentName)) continue;
              try {
                await extractAgent(agentName, p, platforms);
                extracted.add(agentName);
              } catch (e) {
                errors.push(`${p}/${agentName}: ${e.message}`);
              }
            }
          }
          if (errors.length === 0) setMessage(getText("success_extract", lang, getText("agent_all", lang)));
          else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
          setActiveTab("menu");
          return;
        }
        setMessage(getText("extracting", lang, item.value, selectedPlatform === "all" ? getText("platform_all", lang) : selectedPlatform));
        for (const p of platformsToRun) {
          const existing = getPlatformAgents(p);
          if (!existing.includes(item.value)) continue;
          try {
            await extractAgent(item.value, p, platforms);
          } catch (e) {
            errors.push(`${p}: ${e.message}`);
          }
        }
        if (errors.length === 0) setMessage(getText("success_extract", lang, item.value));
        else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
      } else {
        if (!projectRoot) {
          setMessage(getText("project_root_not_detected", lang));
          setActiveTab("menu");
          return;
        }
        if (item.value === ALL_ITEMS_VALUE) {
          setMessage(getText("extracting_from_project", lang, getText("agent_all", lang), selectedPlatform === "all" ? getText("platform_all", lang) : selectedPlatform));
          const extracted = new Set();
          for (const p of platformsToRun) {
            const existing = getProjectPlatformAgents(p);
            for (const agentName of existing) {
              if (extracted.has(agentName)) continue;
              try {
                await extractAgentFromProject(agentName, p, projectRoot);
                extracted.add(agentName);
              } catch (e) {
                errors.push(`${p}/${agentName}: ${e.message}`);
              }
            }
          }
          if (errors.length === 0) setMessage(getText("success_extract_project", lang, getText("agent_all", lang)));
          else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
          setActiveTab("menu");
          return;
        }
        setMessage(getText("extracting_from_project", lang, item.value, selectedPlatform === "all" ? getText("platform_all", lang) : selectedPlatform));
        for (const p of platformsToRun) {
          const existing = getProjectPlatformAgents(p);
          if (!existing.includes(item.value)) continue;
          try {
            await extractAgentFromProject(item.value, p, projectRoot);
          } catch (e) {
            errors.push(`${p}: ${e.message}`);
          }
        }
        if (errors.length === 0) setMessage(getText("success_extract_project", lang, item.value));
        else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
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
      const platformsToRun = selectedPlatform === "all" ? getDeployPlatformsForScope(selectedScope) : [selectedPlatform];
      if (mode === "skill") {
        let errors = [];
        if (selectedScope === "global") {
          if (item.value === ALL_ITEMS_VALUE) {
            setMessage(getText("uninstalling", lang, getText("skill_all", lang), selectedPlatform === "all" ? getText("platform_all", lang) : selectedPlatform));
            for (const p of platformsToRun) {
              const existing = getPlatformSkills(p, "global");
              for (const skillName of existing) {
                try {
                  await uninstallSkill(skillName, p, "global", projectRoot || undefined);
                } catch (e) {
                  errors.push(`${p}/${skillName}: ${e.message}`);
                }
              }
            }
            if (errors.length === 0) setMessage(getText("success_uninstall", lang, getText("skill_all", lang)));
            else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
            setActiveTab("menu");
            return;
          }
          setMessage(getText("uninstalling", lang, item.value, selectedPlatform === "all" ? getText("platform_all", lang) : selectedPlatform));
          for (const p of platformsToRun) {
            const existing = getPlatformSkills(p, "global");
            if (!existing.includes(item.value)) continue;
            try {
              await uninstallSkill(item.value, p, "global", projectRoot || undefined);
            } catch (e) {
              errors.push(`${p}: ${e.message}`);
            }
          }
          if (errors.length === 0) setMessage(getText("success_uninstall", lang, item.value));
          else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
        } else {
          if (!projectRoot) {
            setMessage(getText("project_root_not_detected", lang));
            setActiveTab("menu");
            return;
          }
          if (item.value === ALL_ITEMS_VALUE) {
            setMessage(getText("uninstalling_from_project", lang, getText("skill_all", lang), selectedPlatform === "all" ? getText("platform_all", lang) : selectedPlatform));
            for (const p of platformsToRun) {
              const existing = getPlatformSkills(p, "project");
              for (const skillName of existing) {
                try {
                  await uninstallSkill(skillName, p, "project", projectRoot);
                } catch (e) {
                  errors.push(`${p}/${skillName}: ${e.message}`);
                }
              }
            }
            if (errors.length === 0) setMessage(getText("success_uninstall_project", lang, getText("skill_all", lang)));
            else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
            setActiveTab("menu");
            return;
          }
          setMessage(getText("uninstalling_from_project", lang, item.value, selectedPlatform === "all" ? getText("platform_all", lang) : selectedPlatform));
          for (const p of platformsToRun) {
            const existing = getPlatformSkills(p, "project");
            if (!existing.includes(item.value)) continue;
            try {
              await uninstallSkill(item.value, p, "project", projectRoot);
            } catch (e) {
              errors.push(`${p}: ${e.message}`);
            }
          }
          if (errors.length === 0) setMessage(getText("success_uninstall_project", lang, item.value));
          else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
        }
        setActiveTab("menu");
        return;
      }
      let errors = [];
      if (selectedScope === "global") {
        if (item.value === ALL_ITEMS_VALUE) {
          setMessage(getText("uninstalling", lang, getText("agent_all", lang), selectedPlatform === "all" ? getText("platform_all", lang) : selectedPlatform));
          for (const p of platformsToRun) {
            const existing = getPlatformAgents(p);
            for (const agentName of existing) {
              try {
                await uninstallAgent(agentName, p, platforms);
              } catch (e) {
                errors.push(`${p}/${agentName}: ${e.message}`);
              }
            }
          }
          if (errors.length === 0) setMessage(getText("success_uninstall", lang, getText("agent_all", lang)));
          else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
          setActiveTab("menu");
          return;
        }
        setMessage(getText("uninstalling", lang, item.value, selectedPlatform === "all" ? getText("platform_all", lang) : selectedPlatform));
        for (const p of platformsToRun) {
          const existing = getPlatformAgents(p);
          if (!existing.includes(item.value)) continue;
          try {
            await uninstallAgent(item.value, p, platforms);
          } catch (e) {
            errors.push(`${p}: ${e.message}`);
          }
        }
        if (errors.length === 0) setMessage(getText("success_uninstall", lang, item.value));
        else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
      } else {
        if (!projectRoot) {
          setMessage(getText("project_root_not_detected", lang));
          setActiveTab("menu");
          return;
        }
        if (item.value === ALL_ITEMS_VALUE) {
          setMessage(getText("uninstalling_from_project", lang, getText("agent_all", lang), selectedPlatform === "all" ? getText("platform_all", lang) : selectedPlatform));
          for (const p of platformsToRun) {
            const existing = getProjectPlatformAgents(p);
            for (const agentName of existing) {
              try {
                await uninstallAgentFromProject(agentName, p, projectRoot);
              } catch (e) {
                errors.push(`${p}/${agentName}: ${e.message}`);
              }
            }
          }
          if (errors.length === 0) setMessage(getText("success_uninstall_project", lang, getText("agent_all", lang)));
          else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
          setActiveTab("menu");
          return;
        }
        setMessage(getText("uninstalling_from_project", lang, item.value, selectedPlatform === "all" ? getText("platform_all", lang) : selectedPlatform));
        for (const p of platformsToRun) {
          const existing = getProjectPlatformAgents(p);
          if (!existing.includes(item.value)) continue;
          try {
            await uninstallAgentFromProject(item.value, p, projectRoot);
          } catch (e) {
            errors.push(`${p}: ${e.message}`);
          }
        }
        if (errors.length === 0) setMessage(getText("success_uninstall_project", lang, item.value));
        else setMessage(`${getText("error_prefix", lang)}${errors.join("; ")}`);
      }
      setActiveTab("menu");
    }
  };
  const handleSettingsSelect = (item) => {
    if (item.value === "back") {
      if (mode === "settings") {
        setMode("select");
      } else {
        setActiveTab("menu");
      }
    }
    else {
      changeLanguage(item.value);
    }
  };
  const handleStartupLangSelect = (item) => {
    changeLanguage(item.value);
  };

  // --- Skills Handlers ---
  const handleSkillMenuSelect = (item) => {
    if (item.value === "exit") exit();
    else if (item.value === "deploy") setActiveTab("deploy_select_skill");
    else if (item.value === "extract") setActiveTab("extract_select_platform");
    else if (item.value === "uninstall") setActiveTab("uninstall_select_platform");
    else if (item.value === "back") setMode("select");
  };

  const handleDeploySelectSkill = (item) => {
    if (item.value === 'back') setActiveTab('menu');
    else {
      // Deploy Skill Flow
      // For simplicity in V1 of Skills, let's just deploy to ALL supported global platforms?
      // Or ask for platform?
      // Document says: "Deploy Skill: Project Skill -> Platform Config"
      // Let's implement a simple direct deploy for now or ask platform.
      // Let's ask Platform. reuse handleDeploySelectPlatform? 
      // Reusing state variables might be conflicting. 
      // Let's use setSelectedAgent for Skill Name (reuse var or add new one?)
      // Reuse selectedAgent for skillName for simplicity, or add selectedSkill.
      setSelectedAgent(item.value); // Reusing variable to save lines
      setActiveTab("deploy_select_platform");
    }
  };

  // We reuse handleDeploySelectPlatform and Scope... 
  // But executeDeploy needs to know if it's agent or skill.
  // We can verify `mode` in executeDeploy?

  const executeDeploySkill = async (skillName, platform, scope) => {
    setMessage(getText("deploying_skill", lang, skillName, platform));
    try {
      await deploySkill(skillName, platform, scope, projectRoot);
      setMessage(getText("success_deploy_skill", lang, skillName));
      await refreshData();
    } catch (e) {
      setMessage(getText("error_prefix", lang) + e.message);
    }
    setActiveTab("menu");
  };
  const toLegacyPlatformName = (name) => {
    if (name === "claude_code") return "claude";
    if (name === "kilo_code") return "kilocode";
    if (name === "kilo_code_vscode") return "kilocode";
    if (name === "github_copilot") return "copilot";
    return name;
  };
  const toSchemaPlatformName = (name) => {
    if (name === "claude") return "claude_code";
    if (name === "kilocode") return "kilo_code_vscode";
    if (name === "copilot") return "github_copilot";
    return name;
  };
  const isProjectScopeSupported = (schema, outputKey, projectPathKey) => {
    if (!schema) return false;
    if (schema.project_paths && schema.project_paths[projectPathKey]) return true;
    const target = schema.outputs && schema.outputs[outputKey] ? schema.outputs[outputKey].target : null;
    if (!target) return false;
    if (target.startsWith("~/")) return false;
    if (path.isAbsolute(target)) return false;
    return true;
  };
  const isAgentProjectScopeSupported = (schema) => {
    return isProjectScopeSupported(schema, "agent_definition", "agents") || isProjectScopeSupported(schema, "custom_modes", "custom_modes");
  };
  const getDeployPlatformsForScope = (scope) => {
    const base = mode === "skill" ? skillPlatforms : agentPlatforms;
    const filtered = scope === "project"
      ? base.filter((plt) => {
        if (mode === "skill") return isProjectScopeSupported(plt, "skills", "skills");
        return isAgentProjectScopeSupported(plt);
      })
      : base;
    return filtered.map((plt) => toLegacyPlatformName(plt.name));
  };
  const getPlatformSortOrder = (plt) => {
    const raw = plt ? plt.sort_order : void 0;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string") {
      const n = Number(raw.trim());
      if (Number.isFinite(n)) return n;
    }
    return Number.POSITIVE_INFINITY;
  };
  const allPlatforms = [...registry.getAllPlatforms()].sort((a, b) => {
    const ai = getPlatformSortOrder(a);
    const bi = getPlatformSortOrder(b);
    if (ai !== bi) return ai - bi;
    const an = (a.name || "").toLowerCase();
    const bn = (b.name || "").toLowerCase();
    return an.localeCompare(bn);
  });
  const agentPlatforms = allPlatforms.filter((plt) => Array.isArray(plt.features) && plt.features.includes("agents"));
  const skillPlatforms = allPlatforms.filter((plt) => Array.isArray(plt.features) && plt.features.includes("skills"));
  const deployPlatforms = mode === "skill" ? skillPlatforms : agentPlatforms;
  const platformSummaries = allPlatforms.map((plt) => {
    const legacyName = toLegacyPlatformName(plt.name);
    if (!platforms || !platforms[legacyName]) return null;
    const globalAgentsCount = Array.isArray(installedAgents[legacyName]) ? installedAgents[legacyName].length : 0;
    const projectAgentsCount = Array.isArray(projectInstalledAgents[legacyName]) ? projectInstalledAgents[legacyName].length : 0;
    const globalSkillsList = globalSkills[plt.name];
    const projectSkillsList = projectConfigSkills[plt.name];
    const globalSkillsCount = Array.isArray(globalSkillsList) ? globalSkillsList.length : 0;
    const projectSkillsCount = Array.isArray(projectSkillsList) ? projectSkillsList.length : 0;
    return {
      id: plt.name,
      name: plt.name,
      displayName: plt.display_name || plt.name,
      globalAgents: globalAgentsCount,
      projectAgents: projectAgentsCount,
      globalSkills: globalSkillsCount,
      projectSkills: projectSkillsCount
    };
  }).filter(Boolean);
  const menuItems = [
    { label: getText("menu_deploy", lang), value: "deploy" },
    { label: getText("menu_extract", lang), value: "extract" },
    { label: getText("menu_uninstall", lang), value: "uninstall" },
    { label: getText("menu_back", lang), value: "back" },
    { label: getText("menu_exit", lang), value: "exit" },
  ];
  const skillMenuItems = [
    { label: getText("menu_deploy_skill", lang), value: "deploy" },
    { label: getText("menu_extract_skill", lang), value: "extract" },
    { label: getText("menu_uninstall_skill", lang), value: "uninstall" },
    { label: getText("menu_back", lang), value: "back" },
    { label: getText("menu_exit", lang), value: "exit" },
  ];
  const deployAgentItems = [...projectAgents.map((a) => ({ label: a, value: a })), { label: getText("menu_back", lang), value: "back" }];
  const deploySkillItems = [...projectSkills.map((a) => ({ label: a, value: a })), { label: getText("menu_back", lang), value: "back" }];

  const deployPlatformItems = [
    { label: getText("platform_all", lang), value: "all" },
    ...deployPlatforms.map((plt) => ({ label: plt.display_name || plt.name, value: toLegacyPlatformName(plt.name) })),
    { label: getText("menu_back", lang), value: "back" }
  ];
  const platformItems = [
    { label: getText("platform_all", lang), value: "all" },
    ...deployPlatforms.map((plt) => ({ label: plt.display_name || plt.name, value: toLegacyPlatformName(plt.name) })),
    { label: getText("menu_back", lang), value: "back" }
  ];
  const settingsMenuItems = [
    { label: lang === "en" ? "切换为中文" : "Change to English", value: lang === "en" ? "zh" : "en" },
    { label: getText("menu_back", lang), value: "back" }
  ];
  const startupLangItems = [{ label: "English", value: "en" }, { label: "\u7B80\u4F53\u4E2D\u6587", value: "zh" }];
  const isProjectScopeAvailable = () => {
    if (!selectedPlatform || selectedPlatform === "all") return true;
    const schema = allPlatforms.find((plt) => plt.name === toSchemaPlatformName(selectedPlatform));
    if (mode === "skill") return isProjectScopeSupported(schema, "skills", "skills");
    return isAgentProjectScopeSupported(schema);
  };
  const getScopeItems = () => {
    const items = [{ label: getText("scope_global", lang), value: "global" }];
    if (isProjectScopeAvailable()) {
      items.push({ label: getText("scope_project", lang), value: "project" });
    }
    items.push({ label: getText("menu_back", lang), value: "back" });
    return items;
  };
  const getPlatformAgents = (p) => {
    if (!p) return [];
    return installedAgents[p] || [];
  };
  const getProjectPlatformAgents = (p) => {
    if (!p || !projectRoot) return [];
    return projectInstalledAgents[p] || [];
  };
  const getPlatformSkills = (p, scope) => {
    if (!p) return [];
    const key = toSchemaPlatformName(p);
    if (scope === "project") {
      return projectConfigSkills[key] || [];
    }
    return globalSkills[key] || [];
  };
  const getExtractSelectItems = () => {
    const items = (() => {
      if (selectedPlatform === "all") {
        const platformsToRun = getDeployPlatformsForScope(selectedScope);
        const seen = new Set();
        const result = [];
        for (const p of platformsToRun) {
          const list = mode === "skill"
            ? getPlatformSkills(p, selectedScope)
            : selectedScope === "global"
              ? getPlatformAgents(p)
              : getProjectPlatformAgents(p);
          for (const name of list) {
            if (seen.has(name)) continue;
            seen.add(name);
            result.push(name);
          }
        }
        return result;
      }
      return mode === "skill"
        ? getPlatformSkills(selectedPlatform, selectedScope)
        : selectedScope === "global"
          ? getPlatformAgents(selectedPlatform)
          : getProjectPlatformAgents(selectedPlatform);
    })();
    const allLabelKey = mode === "skill" ? "skill_all" : "agent_all";
    const allItem = items.length > 0 ? [{ label: getText(allLabelKey, lang), value: ALL_ITEMS_VALUE }] : [];
    return [...allItem, ...items.map((a) => ({ label: a, value: a })), { label: getText("menu_back", lang), value: "back" }];
  };
  const getUninstallSelectItems = () => {
    const items = (() => {
      if (selectedPlatform === "all") {
        const platformsToRun = getDeployPlatformsForScope(selectedScope);
        const seen = new Set();
        const result = [];
        for (const p of platformsToRun) {
          const list = mode === "skill"
            ? getPlatformSkills(p, selectedScope)
            : selectedScope === "global"
              ? getPlatformAgents(p)
              : getProjectPlatformAgents(p);
          for (const name of list) {
            if (seen.has(name)) continue;
            seen.add(name);
            result.push(name);
          }
        }
        return result;
      }
      return mode === "skill"
        ? getPlatformSkills(selectedPlatform, selectedScope)
        : selectedScope === "global"
          ? getPlatformAgents(selectedPlatform)
          : getProjectPlatformAgents(selectedPlatform);
    })();
    const allLabelKey = mode === "skill" ? "skill_all" : "agent_all";
    const allItem = items.length > 0 ? [{ label: getText(allLabelKey, lang), value: ALL_ITEMS_VALUE }] : [];
    return [...allItem, ...items.map((a) => ({ label: a, value: a })), { label: getText("menu_back", lang), value: "back" }];
  };
  const extractSelectLabel = mode === "skill"
    ? getText("extract_select_skill", lang)
    : getText("extract_select_agent", lang);
  const uninstallSelectLabel = mode === "skill"
    ? getText("uninstall_select_skill", lang)
    : getText("uninstall_select_agent", lang);
  if (!isLangSelected) {
    return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", alignItems: "center", justifyContent: "center", height: 15, borderStyle: "double", borderColor: "magenta", padding: 1 }, /* @__PURE__ */ React.createElement(Text, { bold: true, color: "magenta", marginBottom: 1 }, getText("lang_select_title", lang)), /* @__PURE__ */ React.createElement(Text, { color: "cyan", marginBottom: 1 }, getText("lang_select_prompt", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: startupLangItems, limit: getSelectLimit(), onSelect: handleStartupLangSelect }));
  }

  // V2.0 Render Logic
  if (mode === 'select') {
    return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", padding: 1 },
        /* @__PURE__ */ React.createElement(Header, { lang }),
        /* @__PURE__ */ React.createElement(Dashboard, { platformSummaries, projectRoot, lang }),
        /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginTop: 1 },
          /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("mode_select_prompt", lang)),
          /* @__PURE__ */ React.createElement(SelectInput, {
            items: [
              { label: getText("mode_agent", lang), value: "agent" },
              { label: getText("mode_skill", lang), value: "skill" },
              { label: getText("menu_settings", lang), value: "settings" },
              { label: getText("menu_exit", lang), value: "exit" }
            ],
            limit: getSelectLimit(),
            onSelect: handleModeSelect
          })
        ),
        /* @__PURE__ */ React.createElement(MessageLog, { message })
    );
  }

  // Dashboard Props
  const dashboard = mode === 'skill'
    ? /* @__PURE__ */ React.createElement(SkillsDashboard, { projectSkills, globalSkills, projectConfigSkills, projectRoot, platforms, lang })
    : /* @__PURE__ */ React.createElement(Dashboard, { platformSummaries, projectRoot, lang });

  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", padding: 1 }, /* @__PURE__ */ React.createElement(Header, { lang }), dashboard, /* @__PURE__ */ React.createElement(MessageLog, { message }), /* @__PURE__ */ React.createElement(Box, { flexDirection: "column", marginTop: 1 },
    activeTab === "menu" && mode === 'agent' && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("menu_prompt", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: menuItems, limit: getSelectLimit(), onSelect: handleMenuSelect })),
    activeTab === "menu" && mode === 'skill' && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("menu_prompt", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: skillMenuItems, limit: getSelectLimit(), onSelect: handleSkillMenuSelect })),

    activeTab === "deploy_select_agent" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("deploy_select_agent", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: deployAgentItems, limit: getSelectLimit(), onSelect: handleDeploySelectAgent })),

    // Skill specific
    activeTab === "deploy_select_skill" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("deploy_select_skill", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: deploySkillItems, limit: getSelectLimit(), onSelect: handleDeploySelectSkill })),

    activeTab === "deploy_select_platform" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("deploy_select_platform", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: deployPlatformItems, limit: getSelectLimit(), onSelect: handleDeploySelectPlatform })), activeTab === "deploy_select_scope" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("scope_select", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: getScopeItems(), limit: getSelectLimit(), onSelect: handleDeploySelectScope })),

    activeTab === "deploy_confirm" && confirmationQueue.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "red", bold: true }, getText("confirm_deploy_title", lang)), /* @__PURE__ */ React.createElement(Text, { color: "yellow", marginBottom: 1 }, getText("confirm_deploy_message", lang, confirmationQueue[0].agent, confirmationQueue[0].platform === "all" ? getText("platform_all", lang) : confirmationQueue[0].platform)), /* @__PURE__ */ React.createElement(SelectInput, {
      items: [
        { label: getText("confirm_yes", lang), value: "yes" },
        { label: getText("confirm_no", lang), value: "no" }
      ],
      limit: getSelectLimit(),
      onSelect: handleDeployConfirm
    })), activeTab === "extract_select_platform" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("extract_select_platform", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: platformItems, limit: getSelectLimit(), onSelect: handleExtractSelectPlatform })), activeTab === "extract_select_scope" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("scope_select", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: getScopeItems(), limit: getSelectLimit(), onSelect: handleExtractSelectScope })), activeTab === "extract_select_agent" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, extractSelectLabel), /* @__PURE__ */ React.createElement(SelectInput, {
      items: getExtractSelectItems(),
      limit: getSelectLimit(),
      onSelect: handleExtractSelectAgent
    })), activeTab === "uninstall_select_platform" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("uninstall_select_platform", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: platformItems, limit: getSelectLimit(), onSelect: handleUninstallSelectPlatform })), activeTab === "uninstall_select_scope" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("scope_select", lang)), /* @__PURE__ */ React.createElement(SelectInput, { items: getScopeItems(), limit: getSelectLimit(), onSelect: handleUninstallSelectScope })), activeTab === "uninstall_select_agent" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, uninstallSelectLabel), /* @__PURE__ */ React.createElement(SelectInput, {
      items: getUninstallSelectItems(),
      limit: getSelectLimit(),
      onSelect: handleUninstallSelectAgent
    })), activeTab === "settings_menu" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { color: "cyan" }, getText("menu_settings", lang), ":"), /* @__PURE__ */ React.createElement(SelectInput, { items: settingsMenuItems, limit: getSelectLimit(), onSelect: handleSettingsSelect }))));
};
process.on("exit", () => {
  process.stdout.write("\x1B[2J\x1B[3J\x1B[H");
});
process.stdout.write("\x1B[2J\x1B[3J\x1B[H");
render(/* @__PURE__ */ React.createElement(App, null));
