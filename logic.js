
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { glob } from 'glob';

// Environment & Constants
const HOME = process.env.TEST_HOME || os.homedir();
export const REPO_ROOT = process.cwd();
export const AGENTS_ROOT = path.join(REPO_ROOT, 'agents');
export const SKILLS_ROOT = path.join(REPO_ROOT, 'skills');
export const SCHEMAS_DIR = path.join(REPO_ROOT, 'schemas');

// --- Schema Registry & Platform System ---

class SchemaRegistry {
    constructor() {
        this.platforms = {};
        this.loaded = false;
    }

    async load() {
        if (this.loaded) return;
        if (!await fs.pathExists(SCHEMAS_DIR)) return;

        const files = await fs.readdir(SCHEMAS_DIR);
        for (const file of files) {
            if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                try {
                    const content = await fs.readFile(path.join(SCHEMAS_DIR, file), 'utf8');
                    const schema = yaml.load(content);
                    if (schema.name) {
                        this.platforms[schema.name] = schema;
                    }
                } catch (e) {
                    console.error(`Failed to load schema ${file}:`, e);
                }
            }
        }
        this.loaded = true;
    }

    getPlatform(name) {
        return this.platforms[name];
    }

    getAllPlatforms() {
        return Object.values(this.platforms);
    }
}

export const registry = new SchemaRegistry();

// Helper: Expand Tilde in paths
function expandPath(p) {
    if (!p) return p;
    if (p.startsWith('~/')) {
        return path.join(HOME, p.slice(2));
    }
    return p;
}

const PLATFORM_ALIASES = {
    claude: 'claude_code',
    kilocode: 'kilo_code',
    copilot: 'github_copilot'
};

const PLATFORM_REVERSE_ALIASES = {
    claude_code: 'claude',
    kilo_code: 'kilocode',
    github_copilot: 'copilot'
};

function normalizePlatformName(name) {
    return PLATFORM_ALIASES[name] || name;
}

function toLegacyPlatformName(name) {
    return PLATFORM_REVERSE_ALIASES[name] || name;
}

function platformSupports(schema, feature) {
    return Array.isArray(schema?.features) && schema.features.includes(feature);
}

async function getPlatformSchema(platformName) {
    await registry.load();
    const normalized = normalizePlatformName(platformName);
    const schema = registry.getPlatform(normalized);
    if (!schema) throw new Error(`Unknown platform: ${platformName}`);
    return { schema, normalized };
}

// --- Detection Logic ---

export async function detectPlatforms() {
    await registry.load();
    const detected = {};

    for (const platform of registry.getAllPlatforms()) {
        let isDetected = false;
        // Check global detection paths
        if (platform.target_detection && platform.target_detection.paths) {
            for (const rawPath of platform.target_detection.paths) {
                const p = expandPath(rawPath);
                if (await fs.pathExists(p)) {
                    isDetected = true;
                    break;
                }
            }
        }
        // Always return the platform key, value is boolean detected status
        // But for UI "available platforms", we might just return the object if detected?
        // UI expects object keys to be platform names.
        if (isDetected) {
            detected[toLegacyPlatformName(platform.name)] = true;
        }
    }
    return detected; // { opencode: true, claude_code: true }
}

export async function loadConfig() {
    // Minimal config loader (if needed for language)
    return { language: 'zh' };
}

export async function detectProjectRoot() {
    // Simple detection: check for .git or specific platform project files
    // This logic can stay hardcoded or be generic if schemas defined "project_root_indicators"
    // For now, assume CWD
    return process.cwd();
}


// --- Legacy Support & Constants ---

export const PROJECT_LEVEL_PATHS = {
    opencode: 'opencode.json',
    kilocode: '.vscode/mcp.json'
};

// Generate PLATFORM_PATHS from Registry (for legacy UI or other consumers)
// Note: This is an async getter in concept, but variable must be synchronous.
// We'll export a Proxy or empty object, but best to rely on functions.
// index.js imports it. We can try to emulate it.
// Assuming detectPlatforms logic uses registry, we don't need PLATFORM_PATHS for detection in index.js anymore 
// because we updated index.js to use registry? No, we updated detectPlatforms.
// BUT index.js imports PLATFORM_PATHS line 10.
export const PLATFORM_PATHS = new Proxy({}, {
    get: (target, prop) => {
        // Fallback for legacy static access? 
        // It's irrelevant if detectPlatforms is refactored.
        // But we need to export it to satisfy import.
        return [];
    }
});

// --- Legacy Agent Functions (Stubs/Adapters) ---

export async function checkAgentExists(agentName, platform) {
    try {
        const { targetTemplate } = await resolveAgentDefinitionTarget(platform, 'global');
        const targetPath = targetTemplate.replace('{agent_name}', agentName);
        return await fs.pathExists(targetPath);
    } catch (e) {
        return false;
    }
}

export async function checkAgentExistsInProject(agentName, platform, projectRoot) {
    try {
        const { targetTemplate } = await resolveAgentDefinitionTarget(platform, 'project', projectRoot);
        const targetPath = targetTemplate.replace('{agent_name}', agentName);
        return await fs.pathExists(targetPath);
    } catch (e) {
        return false;
    }
}

export async function deployAgentToProject(agentName, platform, projectRoot) {
    await deployAgent(agentName, platform, 'project', projectRoot);
}

export async function extractAgent(agentName, platform) {
    const { targetTemplate, schema, agentDef, normalized } = await resolveAgentDefinitionTarget(platform, 'global');
    const targetPath = targetTemplate.replace('{agent_name}', agentName);
    if (!await fs.pathExists(targetPath)) throw new Error(`Agent ${agentName} not found`);
    const content = await fs.readFile(targetPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);
    if (!frontmatter) throw new Error('Agent frontmatter missing');
    const neutralFrontmatter = buildNeutralFrontmatterFromPlatform(frontmatter, schema, normalized, agentName);
    const output = buildAgentMarkdown(neutralFrontmatter, body, true);
    const agentDir = path.join(REPO_ROOT, 'agents', agentName);
    await fs.ensureDir(agentDir);
    await fs.writeFile(path.join(agentDir, 'agent.md'), output);
}

export async function extractAgentFromProject(agentName, platform, projectRoot) {
    const { targetTemplate, schema, agentDef, normalized } = await resolveAgentDefinitionTarget(platform, 'project', projectRoot);
    const targetPath = targetTemplate.replace('{agent_name}', agentName);
    if (!await fs.pathExists(targetPath)) throw new Error(`Agent ${agentName} not found`);
    const content = await fs.readFile(targetPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);
    if (!frontmatter) throw new Error('Agent frontmatter missing');
    const neutralFrontmatter = buildNeutralFrontmatterFromPlatform(frontmatter, schema, normalized, agentName);
    const output = buildAgentMarkdown(neutralFrontmatter, body, true);
    const agentDir = path.join(projectRoot, 'agents', agentName);
    await fs.ensureDir(agentDir);
    await fs.writeFile(path.join(agentDir, 'agent.md'), output);
}

export async function uninstallAgent(agentName, platform) {
    try {
        const { targetTemplate } = await resolveAgentDefinitionTarget(platform, 'global');
        const targetPath = targetTemplate.replace('{agent_name}', agentName);
        if (await fs.pathExists(targetPath)) {
            await fs.remove(targetPath);
        }
        const agentPath = path.join(REPO_ROOT, 'agents', agentName, 'agent.md');
        if (await fs.pathExists(agentPath)) {
            const content = await fs.readFile(agentPath, 'utf8');
            const { frontmatter } = parseFrontmatter(content);
            if (frontmatter) {
                await removeMcps(frontmatter, platform, 'global', REPO_ROOT);
            }
        }
    } catch (e) {
        throw e;
    }
}

export async function uninstallAgentFromProject(agentName, platform, projectRoot) {
    try {
        const { targetTemplate } = await resolveAgentDefinitionTarget(platform, 'project', projectRoot);
        const targetPath = targetTemplate.replace('{agent_name}', agentName);
        if (await fs.pathExists(targetPath)) {
            await fs.remove(targetPath);
        }
        const agentPath = path.join(projectRoot, 'agents', agentName, 'agent.md');
        if (await fs.pathExists(agentPath)) {
            const content = await fs.readFile(agentPath, 'utf8');
            const { frontmatter } = parseFrontmatter(content);
            if (frontmatter) {
                await removeMcps(frontmatter, platform, 'project', projectRoot);
            }
        }
    } catch (e) {
        throw e;
    }
}

// --- Agent Logic (Legacy/Schema-Hybrid) ---

export async function scanAgents(dir) {
    if (!await fs.pathExists(dir)) return [];
    const items = await fs.readdir(dir);
    const agents = [];
    for (const item of items) {
        const fullPath = path.join(dir, item);
        if ((await fs.stat(fullPath)).isDirectory()) {
            if (await fs.pathExists(path.join(fullPath, 'agent.md'))) {
                agents.push(item);
            }
        }
    }
    return agents;
}

export async function scanInstalledAgents(platforms) {
    await registry.load();
    const result = { opencode: [], claude: [], kilocode: [], copilot: [] };
    for (const platform of registry.getAllPlatforms()) {
        const legacyName = toLegacyPlatformName(platform.name);
        if (platforms && !platforms[legacyName]) continue;
        try {
            const { targetTemplate } = await resolveAgentDefinitionTarget(platform.name, 'global');
            const pattern = targetTemplate.replace('{agent_name}', '*');
            const baseTemplate = path.basename(targetTemplate);
            const regex = new RegExp('^' + baseTemplate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\{agent_name\\}', '(.+)') + '$');
            const files = await glob(pattern, { nodir: true });
            const names = files.map(f => {
                const m = path.basename(f).match(regex);
                return m ? m[1] : null;
            }).filter(Boolean);
            result[legacyName] = names;
        } catch (e) {
            result[legacyName] = [];
        }
    }
    return result;
}

export async function scanProjectAgents(projectRoot) {
    await registry.load();
    const result = { opencode: [], claude: [], kilocode: [], copilot: [] };
    if (!projectRoot) return result;
    for (const platform of registry.getAllPlatforms()) {
        const legacyName = toLegacyPlatformName(platform.name);
        try {
            const { targetTemplate } = await resolveAgentDefinitionTarget(platform.name, 'project', projectRoot);
            const pattern = targetTemplate.replace('{agent_name}', '*');
            const baseTemplate = path.basename(targetTemplate);
            const regex = new RegExp('^' + baseTemplate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\{agent_name\\}', '(.+)') + '$');
            const files = await glob(pattern, { nodir: true });
            const names = files.map(f => {
                const m = path.basename(f).match(regex);
                return m ? m[1] : null;
            }).filter(Boolean);
            result[legacyName] = names;
        } catch (e) {
            result[legacyName] = [];
        }
    }
    return result;
}

export async function deployAgent(agentName, platformName, scope, projectRoot) {
    const actualScope = typeof scope === 'string' ? scope : 'global';
    const root = projectRoot || REPO_ROOT;
    const agentPath = path.join(root, 'agents', agentName, 'agent.md');
    if (!await fs.pathExists(agentPath)) throw new Error(`Agent not found: ${agentPath}`);
    const content = await fs.readFile(agentPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);
    if (!frontmatter) throw new Error('Agent frontmatter missing');
    if (!frontmatter.name || frontmatter.name !== agentName) {
        throw new Error(`Agent frontmatter name mismatch: ${agentName}`);
    }
    const { targetTemplate, schema, agentDef, normalized } = await resolveAgentDefinitionTarget(platformName, actualScope, root);
    const outputFrontmatter = buildAgentFrontmatter(frontmatter, schema, normalized);
    const output = buildAgentMarkdown(outputFrontmatter, agentDef.include_body ? body : '', agentDef.include_body);
    const targetPath = targetTemplate.replace('{agent_name}', agentName);
    await fs.ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, output);
    await applyMcps(frontmatter, platformName, actualScope, root);
}

// --- Skill Logic (Fully Schema Driven) ---

export async function scanProjectSkills(projectRoot) {
    if (!projectRoot) return [];
    const skillsDir = path.join(projectRoot, 'skills');
    if (!await fs.pathExists(skillsDir)) return [];
    const items = await fs.readdir(skillsDir);
    const skills = [];
    for (const item of items) {
        if ((await fs.stat(path.join(skillsDir, item))).isDirectory()) {
            if (await fs.pathExists(path.join(skillsDir, item, 'SKILL.md'))) {
                skills.push(item);
            }
        }
    }
    return skills;
}

function parseFrontmatter(content) {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    if (!match) {
        return { frontmatter: null, body: content };
    }
    const data = yaml.load(match[1]) || {};
    const body = content.slice(match[0].length);
    return { frontmatter: data, body };
}

function getByPath(obj, pathValue) {
    if (!obj || !pathValue) return undefined;
    const parts = pathValue.split('.');
    let current = obj;
    for (const part of parts) {
        if (current && Object.prototype.hasOwnProperty.call(current, part)) {
            current = current[part];
        } else {
            return undefined;
        }
    }
    return current;
}

function setByPath(obj, pathValue, value) {
    const parts = pathValue.split('.');
    let current = obj;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
            current[part] = value;
        } else {
            if (!current[part] || typeof current[part] !== 'object') {
                current[part] = {};
            }
            current = current[part];
        }
    }
}

async function resolveDetectedPlatformRoot(schema) {
    const paths = schema.target_detection?.paths || [];
    for (const rawPath of paths) {
        const p = expandPath(rawPath);
        if (await fs.pathExists(p)) {
            const stat = await fs.stat(p);
            return stat.isFile() ? path.dirname(p) : p;
        }
    }
    return null;
}

async function resolveAgentDefinitionTarget(platformName, scope, projectRoot) {
    const { schema, normalized } = await getPlatformSchema(platformName);
    if (!platformSupports(schema, 'agents')) {
        throw new Error(`Platform ${platformName} does not support agents`);
    }
    const agentDef = schema.outputs?.agent_definition;
    if (!agentDef) throw new Error(`Platform ${platformName} does not support agents`);

    let targetTemplate;
    if (scope === 'global') {
        targetTemplate = expandPath(agentDef.target);
        if (!path.isAbsolute(targetTemplate)) {
            const root = await resolveDetectedPlatformRoot(schema);
            if (!root) throw new Error(`Platform ${platformName} not detected`);
            targetTemplate = path.join(root, targetTemplate);
        }
    } else if (scope === 'project') {
        if (!projectRoot) throw new Error("Project root required for project scope");
        if (schema.project_paths && schema.project_paths.agents) {
            targetTemplate = path.join(projectRoot, schema.project_paths.agents, path.basename(agentDef.target));
        } else {
            targetTemplate = expandPath(agentDef.target);
            if (path.isAbsolute(targetTemplate)) {
                throw new Error(`Platform ${platformName} does not support project-scoped agents`);
            }
            targetTemplate = path.join(projectRoot, targetTemplate);
        }
    }

    return { targetTemplate, schema, agentDef, normalized };
}

function buildAgentFrontmatter(frontmatter, schema, platformName) {
    const agentDef = schema.outputs?.agent_definition;
    const fields = agentDef?.frontmatter || [];
    const exclude = agentDef?.exclude_fields || [];
    const result = {};
    for (const item of fields) {
        if (typeof item === 'string') {
            if (exclude.includes(item)) continue;
            const value = frontmatter[item];
            if (value !== undefined) result[item] = value;
        } else if (item && typeof item === 'object') {
            const [key, pathValue] = Object.entries(item)[0];
            if (exclude.includes(key)) continue;
            const value = getByPath(frontmatter, pathValue.replace('platforms.' + platformName, `platforms.${platformName}`));
            if (value !== undefined) result[key] = value;
        }
    }
    if (!result.name) throw new Error('Agent name missing');
    if (!result.description) throw new Error('Agent description missing');
    return result;
}

function buildNeutralFrontmatterFromPlatform(frontmatter, schema, platformName, agentName) {
    const agentDef = schema.outputs?.agent_definition;
    const fields = agentDef?.frontmatter || [];
    const result = {};
    for (const item of fields) {
        if (typeof item === 'string') {
            const value = frontmatter[item];
            if (value !== undefined) result[item] = value;
        } else if (item && typeof item === 'object') {
            const [key, pathValue] = Object.entries(item)[0];
            const value = frontmatter[key];
            if (value !== undefined) {
                setByPath(result, pathValue, value);
            }
        }
    }
    if (!result.name) result.name = agentName;
    if (!result.description) throw new Error('Agent description missing');
    return result;
}

function buildAgentMarkdown(frontmatter, body, includeBody = true) {
    const yamlText = yaml.dump(frontmatter);
    if (!includeBody) return `---\n${yamlText}---\n`;
    return `---\n${yamlText}---\n\n${body || ''}`.trimEnd() + '\n';
}

async function resolveMcpConfigTarget(platformName, scope, projectRoot) {
    const { schema } = await getPlatformSchema(platformName);
    if (!platformSupports(schema, 'mcps')) {
        throw new Error(`Platform ${platformName} does not support mcps`);
    }
    const configDef = schema.outputs?.skill_config;
    if (!configDef) throw new Error(`Platform ${platformName} does not support mcps`);

    let targetPath;
    if (scope === 'global') {
        targetPath = expandPath(configDef.target);
        if (!path.isAbsolute(targetPath)) {
            const root = await resolveDetectedPlatformRoot(schema);
            if (!root) throw new Error(`Platform ${platformName} not detected`);
            targetPath = path.join(root, targetPath);
        }
    } else if (scope === 'project') {
        if (!projectRoot) throw new Error("Project root required for project scope");
        if (schema.project_paths && schema.project_paths.config) {
            targetPath = path.join(projectRoot, schema.project_paths.config);
        } else {
            const candidate = expandPath(configDef.target);
            if (path.isAbsolute(candidate)) {
                throw new Error(`Platform ${platformName} does not support project-scoped mcps`);
            }
            targetPath = path.join(projectRoot, candidate);
        }
    }
    return { targetPath, configDef };
}

function buildMcpEntries(frontmatter) {
    const entries = {};
    for (const [name, mcp] of Object.entries(frontmatter.mcps || {})) {
        if (mcp && mcp.enabled === false) continue;
        const command = Array.isArray(mcp?.command) ? mcp.command[0] : mcp?.command;
        const args = Array.isArray(mcp?.command) ? mcp.command.slice(1) : (mcp?.args || []);
        entries[name] = {
            command,
            args,
            env: mcp?.env || {}
        };
    }
    return entries;
}

async function applyMcps(frontmatter, platformName, scope, projectRoot) {
    if (!frontmatter?.mcps) return;
    const resolved = await resolveMcpConfigTarget(platformName, scope, projectRoot);
    const { targetPath, configDef } = resolved;
    const key = configDef.key || 'mcpServers';
    const entries = buildMcpEntries(frontmatter);
    let config = {};
    let hasExisting = false;
    if (await fs.pathExists(targetPath)) {
        try {
            config = await fs.readJson(targetPath);
            hasExisting = true;
        } catch (e) {
            config = {};
        }
    }
    if (!hasExisting && configDef.template) {
        const payload = configDef.template.replace('{mcps}', JSON.stringify(entries, null, 2));
        await fs.ensureDir(path.dirname(targetPath));
        await fs.writeFile(targetPath, payload);
        return;
    }
    if (!config[key]) config[key] = {};
    for (const [name, value] of Object.entries(entries)) {
        config[key][name] = value;
    }
    await fs.ensureDir(path.dirname(targetPath));
    await fs.writeJson(targetPath, config, { spaces: 2 });
}

async function removeMcps(frontmatter, platformName, scope, projectRoot) {
    if (!frontmatter?.mcps) return;
    const resolved = await resolveMcpConfigTarget(platformName, scope, projectRoot);
    const { targetPath, configDef } = resolved;
    if (!await fs.pathExists(targetPath)) return;
    let config = {};
    try { config = await fs.readJson(targetPath); } catch (e) { return; }
    const key = configDef.key || 'mcpServers';
    if (!config[key]) return;
    for (const name of Object.keys(frontmatter.mcps)) {
        delete config[key][name];
    }
    await fs.writeJson(targetPath, config, { spaces: 2 });
}

async function resolveSkillsDirTarget(platformName, scope, projectRoot) {
    const { schema } = await getPlatformSchema(platformName);

    if (!platformSupports(schema, 'skills')) {
        throw new Error(`Platform ${platformName} does not support skills`);
    }

    if (!schema.outputs.skills) {
        throw new Error(`Platform ${platformName} does not support Skills (outputs.skills missing)`);
    }

    const skillsDef = schema.outputs.skills;
    let targetPath;

    if (scope === 'global') {
        targetPath = expandPath(skillsDef.target);
        if (!path.isAbsolute(targetPath)) {
            const root = await resolveDetectedPlatformRoot(schema);
            if (!root) throw new Error(`Platform ${platformName} not detected`);
            targetPath = path.join(root, targetPath);
        }
    } else if (scope === 'project') {
        if (!projectRoot) throw new Error("Project root required for project scope");
        if (schema.project_paths && schema.project_paths.skills) {
            targetPath = path.join(projectRoot, schema.project_paths.skills);
        } else {
            targetPath = expandPath(skillsDef.target);
            if (path.isAbsolute(targetPath)) {
                throw new Error(`Platform ${platformName} does not support project-scoped skills`);
            }
            targetPath = path.join(projectRoot, targetPath);
        }
    }

    return { targetPath, skillsDef };
}

export async function scanPlatformSkills(platformName, scope, projectRoot) {
    try {
        const { schema } = await getPlatformSchema(platformName);
        if (!platformSupports(schema, 'skills')) return null;
        const { targetPath } = await resolveSkillsDirTarget(platformName, scope, projectRoot);
        if (!await fs.pathExists(targetPath)) return [];
        const items = await fs.readdir(targetPath);
        const skills = [];
        for (const item of items) {
            const fullPath = path.join(targetPath, item);
            if ((await fs.stat(fullPath)).isDirectory()) {
                if (await fs.pathExists(path.join(fullPath, 'SKILL.md'))) {
                    skills.push(item);
                }
            }
        }
        return skills;
    } catch (e) {
        // console.warn(`Scan failed for ${platformName} ${scope}: ${e.message}`);
    }
    return [];
}

export async function deploySkill(skillName, platformName, scope, projectRoot = REPO_ROOT) {
    const { targetPath } = await resolveSkillsDirTarget(platformName, scope, projectRoot);
    const skillDir = path.join(projectRoot, 'skills', skillName);
    const skillDocPath = path.join(skillDir, 'SKILL.md');
    if (!await fs.pathExists(skillDocPath)) throw new Error(`Skill definition not found: ${skillDocPath}`);
    const skillContent = await fs.readFile(skillDocPath, 'utf8');
    const { frontmatter } = parseFrontmatter(skillContent);
    if (!frontmatter || frontmatter.name !== skillName) {
        throw new Error(`Skill frontmatter name mismatch: ${skillName}`);
    }
    await fs.ensureDir(targetPath);
    const destDir = path.join(targetPath, skillName);
    await fs.copy(skillDir, destDir, { overwrite: true });
}

export async function extractSkill(skillName, platformName, scope, projectRoot = REPO_ROOT) {
    const { targetPath } = await resolveSkillsDirTarget(platformName, scope, projectRoot);
    const sourceDir = path.join(targetPath, skillName);
    const skillDocPath = path.join(sourceDir, 'SKILL.md');
    if (!await fs.pathExists(skillDocPath)) {
        throw new Error(`Skill ${skillName} not found in ${platformName}`);
    }
    const destDir = path.join(projectRoot, 'skills', skillName);
    await fs.ensureDir(path.dirname(destDir));
    await fs.copy(sourceDir, destDir, { overwrite: true });
}

export async function uninstallSkill(skillName, platformName, scope, projectRoot = REPO_ROOT) {
    const { targetPath } = await resolveSkillsDirTarget(platformName, scope, projectRoot);
    const skillDir = path.join(targetPath, skillName);
    if (await fs.pathExists(skillDir)) {
        await fs.remove(skillDir);
    }
}
