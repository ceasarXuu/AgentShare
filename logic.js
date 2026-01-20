
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export const REPO_ROOT = process.cwd();
export const AGENTS_ROOT = path.join(REPO_ROOT, 'agents');

// Platform paths
export const PLATFORM_PATHS = {
    opencode: [
        path.join(os.homedir(), '.config/opencode'),
        path.join(os.homedir(), '.opencode'),
        path.join(os.homedir(), 'Library/Application Support/OpenCode'),
    ],
    claude: [
        path.join(os.homedir(), '.claude'),
        path.join(os.homedir(), '.config/claude'),
        path.join(os.homedir(), 'Library/Application Support/Claude'),
    ],
    kilocode: [
        path.join(os.homedir(), 'Library/Application Support/Code/User/globalStorage/kilocode.kilo-code/settings'),
    ],
    copilot: [
        os.platform() === 'darwin'
            ? path.join(os.homedir(), 'Library/Application Support/Code/User/prompts')
            : path.join(os.homedir(), '.config/Code/User/prompts'),
    ],
};

// Project-level paths for each platform
export const PROJECT_LEVEL_PATHS = {
    opencode: {
        agents: '.opencode/agents',
        config: '.opencode/opencode.json',
    },
    claude: {
        agents: '.claude/agents',
        settings: '.claude/settings.json',
    },
    copilot: {
        agents: '.github/agents',
        instructions: '.github/copilot-instructions.md',
    },
    kilocode: {
        agents: '.kilocodemodes',
    },
};

// Detect project root by looking for common project markers
export async function detectProjectRoot(startDir = process.cwd()) {
    const markers = ['.git', 'package.json', 'Cargo.toml', 'go.mod', 'pom.xml', 'build.gradle', '.opencode', '.claude', '.github', '.kilocodemodes'];
    let currentDir = startDir;

    while (currentDir !== path.dirname(currentDir)) { // Not at filesystem root
        for (const marker of markers) {
            if (await fs.pathExists(path.join(currentDir, marker))) {
                return currentDir;
            }
        }
        currentDir = path.dirname(currentDir);
    }
    return null;
}

// Scan project-level installed agents
export async function scanProjectAgents(projectRoot) {
    if (!projectRoot) return { opencode: [], claude: [], copilot: [] };

    const agents = {
        opencode: [],
        claude: [],
        kilocode: [],
        copilot: [],
    };

    // OpenCode project agents
    const opencodeAgentsDir = path.join(projectRoot, PROJECT_LEVEL_PATHS.opencode.agents);
    if (await fs.pathExists(opencodeAgentsDir)) {
        agents.opencode = await scanAgents(opencodeAgentsDir);
    }

    // Claude project agents
    const claudeAgentsDir = path.join(projectRoot, PROJECT_LEVEL_PATHS.claude.agents);
    if (await fs.pathExists(claudeAgentsDir)) {
        agents.claude = await scanAgents(claudeAgentsDir);
    }

    // Copilot project agents
    const copilotAgentsDir = path.join(projectRoot, PROJECT_LEVEL_PATHS.copilot.agents);
    if (await fs.pathExists(copilotAgentsDir)) {
        const files = await fs.readdir(copilotAgentsDir);
        agents.copilot = files
            .filter(f => f.endsWith('.agent.md'))
            .map(f => f.replace('.agent.md', ''));
    }

    // Kilo Code project agents
    const kilocodeYaml = path.join(projectRoot, PROJECT_LEVEL_PATHS.kilocode.agents);
    if (await fs.pathExists(kilocodeYaml)) {
        try {
            const content = await fs.readFile(kilocodeYaml, 'utf8');
            const slugs = [];
            const regex = /slug:\s*([a-zA-Z0-9-]+)/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                slugs.push(match[1]);
            }
            agents.kilocode = slugs;
        } catch (e) { /* ignore */ }
    }

    return agents;
}

// Scan for Agents in a directory
export async function scanAgents(dir) {
    if (!await fs.pathExists(dir)) return [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
        .filter(dirent => dirent.isDirectory() || dirent.name.endsWith('.md'))
        .map(dirent => dirent.name.replace(/\.md$/, '').replace(/\.agent$/, ''));
}

// Detect installed platforms
export async function detectPlatforms() {
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

// Scan installed agents from detected platforms
export async function scanInstalledAgents(platforms) {
    const agents = {
        opencode: [],
        claude: [],
        kilocode: [],
        copilot: [],
    };

    if (platforms.opencode) {
        // Official agents
        const official = await scanAgents(path.join(platforms.opencode, 'agent'));
        // User agents
        const user = await scanAgents(path.join(platforms.opencode, 'agents'));
        agents.opencode = [...new Set([...official, ...user])];
    }

    if (platforms.claude) {
        agents.claude = await scanAgents(path.join(platforms.claude, 'agents'));
    }

    if (platforms.kilocode) {
        try {
            const yamlFile = path.join(platforms.kilocode, 'custom_modes.yaml');
            if (await fs.pathExists(yamlFile)) {
                const content = await fs.readFile(yamlFile, 'utf8');
                // Simple regex extraction for slugs
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
        agents.copilot = files
            .filter(f => f.endsWith('.agent.md'))
            .map(f => f.replace('.agent.md', ''));
    }

    return agents;
}

// Check if Agent exists on Platform
export async function checkAgentExists(agentName, targetPlatform, platforms) {
    const targetDir = platforms[targetPlatform];
    if (!targetDir) return false;

    if (targetPlatform === 'opencode') {
        const agentFile = path.join(targetDir, 'agents', `${agentName}.md`);
        return await fs.pathExists(agentFile);
    } else if (targetPlatform === 'claude') {
        const agentFile = path.join(targetDir, 'agents', `${agentName}.md`);
        return await fs.pathExists(agentFile);
    } else if (targetPlatform === 'kilocode') {
        const yamlFile = path.join(targetDir, 'custom_modes.yaml');
        if (!await fs.pathExists(yamlFile)) return false;
        const content = await fs.readFile(yamlFile, 'utf8');
        return content.includes(`slug: ${agentName}`);
    } else if (targetPlatform === 'copilot') {
        const agentFile = path.join(targetDir, `${agentName}.agent.md`);
        return await fs.pathExists(agentFile);
    }
    return false;
}

// Check if Agent exists in Project
export async function checkAgentExistsInProject(agentName, targetPlatform, projectRoot) {
    if (!projectRoot) return false;
    const projectPaths = PROJECT_LEVEL_PATHS[targetPlatform];
    if (!projectPaths) return false;

    const targetAgentsDir = path.join(projectRoot, projectPaths.agents);

    if (targetPlatform === 'opencode' || targetPlatform === 'claude') {
        const agentFile = path.join(targetAgentsDir, `${agentName}.md`);
        return await fs.pathExists(agentFile);
    } else if (targetPlatform === 'copilot') {
        const agentFile = path.join(targetAgentsDir, `${agentName}.agent.md`);
        return await fs.pathExists(agentFile);
    } else if (targetPlatform === 'kilocode') {
        const yamlFile = path.join(projectRoot, projectPaths.agents);
        if (await fs.pathExists(yamlFile)) {
            const content = await fs.readFile(yamlFile, 'utf8');
            return content.includes(`slug: ${agentName}`);
        }
    }
    return false;
}


// Deploy Agent
export async function deployAgent(agentName, targetPlatform, platforms) {
    const agentSource = path.join(AGENTS_ROOT, agentName);
    const targetDir = platforms[targetPlatform];

    if (!targetDir) {
        throw new Error(`${targetPlatform} not installed`);
    }

    const srcFile = path.join(agentSource, 'agent.md');
    if (!await fs.pathExists(srcFile)) {
        // Fallback for migration safety? Maybe not needed if we enforce single source.
        // But let's check legacy paths just in case during transition, or strict fail?
        // Let's stick to strict single source as requested.
        // Actually, let's allow basic fallback if srcFile missing but subdirs exist? 
        // No, user wants single source.
        throw new Error(`Agent definition not found: ${srcFile}`);
    }

    if (targetPlatform === 'opencode') {
        // 1. Config - Generate from Frontmatter (Not implemented fully yet, strict 1:1 for now)
        // Ideally we parse YAML frontmatter here to generate opencode.json.
        // For now, we assume agent.md covers the agent definition.
        // If we want to support config.json generation, we need to extract it from agent.md.

        // Check if there is an explicit config.json in the source root (optional sidecar)
        // OR just rely on defaults/existing config.
        const configSrc = path.join(agentSource, 'config.json');
        if (await fs.pathExists(configSrc)) {
            const config = await fs.readJson(configSrc);
            delete config.model;
            await fs.writeJson(path.join(targetDir, 'opencode.json'), config);
        } else {
            // Generate default config if missing (e.g. deployed from Claude)
            const defaultConfig = {
                temperature: 0.7,
                max_tokens: 4096
            };
            await fs.writeJson(path.join(targetDir, 'opencode.json'), defaultConfig);
        }

        // 2. Agent Def
        await fs.ensureDir(path.join(targetDir, 'agents'));
        let content = await fs.readFile(srcFile, 'utf8');
        if (!content.includes('mode:')) {
            content = content.replace(/^---/, '---\nmode: primary');
        }
        content = content.replace(/^model:.*\n/m, '');
        await fs.writeFile(path.join(targetDir, 'agents', `${agentName}.md`), content);

        // 3. Skills
        const skillsSrc = path.join(agentSource, 'skills');
        if (await fs.pathExists(skillsSrc)) {
            await fs.copy(skillsSrc, path.join(targetDir, 'skills'));
        }

        // 4. Workflows
        const workflowsSrc = path.join(agentSource, 'workflows');
        if (await fs.pathExists(workflowsSrc)) {
            await fs.copy(workflowsSrc, path.join(targetDir, 'workflows'));
        }
    } else if (targetPlatform === 'claude') {
        await fs.ensureDir(path.join(targetDir, 'agents'));
        await fs.copy(srcFile, path.join(targetDir, 'agents', `${agentName}.md`));
    } else if (targetPlatform === 'kilocode') {
        const yamlFile = path.join(targetDir, 'custom_modes.yaml');
        let yamlContent = '';
        if (await fs.pathExists(yamlFile)) {
            yamlContent = await fs.readFile(yamlFile, 'utf8');
        } else {
            yamlContent = 'customModes:\n';
        }

        // Read Source Agent
        const srcContent = await fs.readFile(srcFile, 'utf8');

        // Extract metadata from Frontmatter (simple regex)
        const nameMatch = srcContent.match(/name:\s*(.*)/);
        const descMatch = srcContent.match(/description:\s*(.*)/);

        const name = nameMatch ? nameMatch[1].trim() : agentName;
        const description = descMatch ? descMatch[1].trim() : `Agent ${agentName}`;

        // Extract System Prompt (content after frontmatter)
        const systemPrompt = srcContent.replace(/---[\s\S]*?---/, '').trim();

        // Construct YAML Entry
        const newEntry = `  - slug: ${agentName}
    name: ${name}
    roleDefinition: ${systemPrompt.replace(/\n/g, '\\n')}
    description: ${description}
    groups:
      - read
      - edit
      - browser
      - command
      - mcp
    source: global
`;

        // Check if exists and replace or append
        if (yamlContent.includes(`slug: ${agentName}`)) {
            // Simple replace is hard with regex multiline, so let's try to remove old block first?
            // Actually, for a simple implementation without a parser, we can append if not exists, 
            // BUT user wants overwrite support. 
            // A robust regex to find the block:
            // Find "  - slug: agentName" until next "  - slug:" or end of file.
            const blockRegex = new RegExp(`^  - slug: ${agentName}[\\s\\S]*?(?=^  - slug:|$)`, 'm');
            if (blockRegex.test(yamlContent)) {
                yamlContent = yamlContent.replace(blockRegex, newEntry);
            } else {
                // If indenting is different?
                // Fallback: This regex assumes strict formatting. 
                // Given the risk, let's just append invalidating old one? No.
                // Kilo Code might handle duplicates? Unlikely.

                // Let's refine the regex to catch indentation variation if possible, 
                // but for now strict 2-space assumption based on user provided snippet.
                yamlContent += '\n' + newEntry;
            }
        } else {
            yamlContent += '\n' + newEntry;
        }

        await fs.ensureDir(path.dirname(yamlFile));
        await fs.writeFile(yamlFile, yamlContent);

    } else if (targetPlatform === 'copilot') {
        await fs.copy(srcFile, path.join(targetDir, `${agentName}.agent.md`));
    }
}

// Extract Agent (Platform -> Project)
export async function extractAgent(agentName, sourcePlatform, platforms) {
    const targetDir = path.join(AGENTS_ROOT, agentName);
    const sourceBase = platforms[sourcePlatform];

    if (!sourceBase) {
        throw new Error(`${sourcePlatform} not installed`);
    }

    // Ensure project agent dir
    await fs.ensureDir(targetDir);

    if (sourcePlatform === 'opencode') {
        // 1. Config -> Sidecar config.json
        const configSrc = path.join(sourceBase, 'opencode.json');
        if (await fs.pathExists(configSrc)) {
            // We can rename it to config.json in root for neutrality? 
            // Or keep it opencode.json? User wants "Single agent.md".
            // If config info is strictly opencode specific, maybe we merge into agent.md text?
            // Since we lack a YAML parser library here in standard imports (unless we add 'js-yaml'), 
            // let's just copy it as config.json for now to allow data preservation.
            // OR, better: The user wants "neutral". 
            // Let's assume the agent.md from OpenCode is the master.

            await fs.copy(configSrc, path.join(targetDir, 'config.json'));
        }

        // 2. Agent Def
        const agentSrc = path.join(sourceBase, 'agents', `${agentName}.md`);
        if (await fs.pathExists(agentSrc)) {
            await fs.copy(agentSrc, path.join(targetDir, 'agent.md'));
        }

        // 3. Skills
        const skillsSrc = path.join(sourceBase, 'skills');
        if (await fs.pathExists(skillsSrc)) {
            await fs.ensureDir(path.join(targetDir, 'skills'));
            await fs.copy(skillsSrc, path.join(targetDir, 'skills'));
        }

        // 4. Workflows
        const workflowsSrc = path.join(sourceBase, 'workflows');
        if (await fs.pathExists(workflowsSrc)) {
            await fs.ensureDir(path.join(targetDir, 'workflows'));
            await fs.copy(workflowsSrc, path.join(targetDir, 'workflows'));
        }

    } else if (sourcePlatform === 'kilocode') {
        const yamlFile = path.join(sourceBase, 'custom_modes.yaml');
        if (await fs.pathExists(yamlFile)) {
            const content = await fs.readFile(yamlFile, 'utf8');

            // Regex to extract block
            const blockRegex = new RegExp(`^  - slug: ${agentName}([\\s\\S]*?)(?=^  - slug:|$)`, 'm');
            const match = content.match(blockRegex);

            if (match) {
                const block = match[0];

                // Extract fields
                const nameMatch = block.match(/name:\s*(.*)/);
                const descMatch = block.match(/description:\s*(.*)/);
                const roleMatch = block.match(/roleDefinition:\s*(.*)/);

                const name = nameMatch ? nameMatch[1].trim() : agentName;
                const description = descMatch ? descMatch[1].trim() : '';
                let roleDefinition = roleMatch ? roleMatch[1].trim() : '';

                // Handle newlines in roleDefinition if escaped
                roleDefinition = roleDefinition.replace(/\\n/g, '\n');

                // Construct Markdown
                const markdown = `---
name: ${name}
description: ${description}
---

${roleDefinition}
`;
                await fs.writeFile(path.join(targetDir, 'agent.md'), markdown);
            }
        }
    } else if (sourcePlatform === 'claude') {
        const agentSrc = path.join(sourceBase, 'agents', `${agentName}.md`);
        if (await fs.pathExists(agentSrc)) {
            await fs.copy(agentSrc, path.join(targetDir, 'agent.md'));
        }
    } else if (sourcePlatform === 'copilot') {
        const agentSrc = path.join(sourceBase, `${agentName}.agent.md`);
        if (await fs.pathExists(agentSrc)) {
            await fs.copy(agentSrc, path.join(targetDir, 'agent.md'));
        }
    }
}

// Uninstall Agent (Remove from Platform)
export async function uninstallAgent(agentName, targetPlatform, platforms) {
    const targetBase = platforms[targetPlatform];
    if (!targetBase) throw new Error(`${targetPlatform} not installed`);

    if (targetPlatform === 'opencode') {
        const agentFile = path.join(targetBase, 'agents', `${agentName}.md`);
        if (await fs.pathExists(agentFile)) {
            await fs.remove(agentFile);
        }

        // Safe cleanup of skills/workflows
        const agentSource = path.join(AGENTS_ROOT, agentName);
        if (await fs.pathExists(agentSource)) {
            // Cleanup Skills
            const skillsSrc = path.join(agentSource, 'skills');
            if (await fs.pathExists(skillsSrc)) {
                const skills = await fs.readdir(skillsSrc);
                const targetSkillsDir = path.join(targetBase, 'skills');
                if (await fs.pathExists(targetSkillsDir)) {
                    for (const skill of skills) {
                        try {
                            await fs.remove(path.join(targetSkillsDir, skill));
                        } catch (e) { /* ignore */ }
                    }
                }
            }

            // Cleanup Workflows
            const workflowsSrc = path.join(agentSource, 'workflows');
            if (await fs.pathExists(workflowsSrc)) {
                const workflows = await fs.readdir(workflowsSrc);
                const targetWorkflowsDir = path.join(targetBase, 'workflows');
                if (await fs.pathExists(targetWorkflowsDir)) {
                    for (const workflow of workflows) {
                        try {
                            await fs.remove(path.join(targetWorkflowsDir, workflow));
                        } catch (e) { /* ignore */ }
                    }
                }
            }
        }

    } else if (targetPlatform === 'claude') {
        const agentFile = path.join(targetBase, 'agents', `${agentName}.md`);
        if (await fs.pathExists(agentFile)) {
            await fs.remove(agentFile);
        }
    } else if (targetPlatform === 'kilocode') {
        const yamlFile = path.join(targetBase, 'custom_modes.yaml');
        if (await fs.pathExists(yamlFile)) {
            let content = await fs.readFile(yamlFile, 'utf8');
            const blockRegex = new RegExp(`^  - slug: ${agentName}[\\s\\S]*?(?=^  - slug:|$)`, 'm');
            if (blockRegex.test(content)) {
                // Remove the block and any leading/trailing newline issues if possible
                content = content.replace(blockRegex, '');
                // Clean up potential double newlines
                content = content.replace(/\n\n\n/g, '\n\n');
                await fs.writeFile(yamlFile, content);
            }
        }
    } else if (targetPlatform === 'copilot') {
        const agentFile = path.join(targetBase, `${agentName}.agent.md`);
        if (await fs.pathExists(agentFile)) {
            await fs.remove(agentFile);
        }
    }

}

// Deploy Agent to Project (Project Agent Source -> Project Platform Dir)
export async function deployAgentToProject(agentName, targetPlatform, projectRoot) {
    if (!projectRoot) {
        throw new Error('Project root not detected');
    }

    const agentSource = path.join(AGENTS_ROOT, agentName);
    const projectPaths = PROJECT_LEVEL_PATHS[targetPlatform];

    if (!projectPaths) {
        throw new Error(`Unknown platform: ${targetPlatform}`);
    }

    const targetAgentsDir = path.join(projectRoot, projectPaths.agents);
    await fs.ensureDir(targetAgentsDir);

    const srcFile = path.join(agentSource, 'agent.md');
    if (!await fs.pathExists(srcFile)) {
        throw new Error(`Agent definition not found: ${srcFile}`);
    }

    if (targetPlatform === 'opencode') {
        let content = await fs.readFile(srcFile, 'utf8');
        if (!content.includes('mode:')) {
            content = content.replace(/^---/, '---\nmode: primary');
        }
        content = content.replace(/^model:.*\n/m, '');
        await fs.writeFile(path.join(targetAgentsDir, `${agentName}.md`), content);

        // 3. Skills (Project Level)
        const skillsSrc = path.join(agentSource, 'skills');
        if (await fs.pathExists(skillsSrc)) {
            const skillsTarget = path.join(path.dirname(targetAgentsDir), 'skills');
            await fs.ensureDir(skillsTarget);
            await fs.copy(skillsSrc, skillsTarget);
        }

        // 4. Workflows (Project Level)
        const workflowsSrc = path.join(agentSource, 'workflows');
        if (await fs.pathExists(workflowsSrc)) {
            const workflowsTarget = path.join(path.dirname(targetAgentsDir), 'workflows');
            await fs.ensureDir(workflowsTarget);
            await fs.copy(workflowsSrc, workflowsTarget);
        }
    } else if (targetPlatform === 'claude') {
        await fs.copy(srcFile, path.join(targetAgentsDir, `${agentName}.md`));
    } else if (targetPlatform === 'copilot') {
        await fs.copy(srcFile, path.join(targetAgentsDir, `${agentName}.agent.md`));
    } else if (targetPlatform === 'kilocode') {
        const yamlFile = path.join(projectRoot, projectPaths.agents);
        let yamlContent = '';
        if (await fs.pathExists(yamlFile)) {
            yamlContent = await fs.readFile(yamlFile, 'utf8');
        } else {
            yamlContent = 'customModes:\n';
        }

        // Read Source Agent
        const srcContent = await fs.readFile(srcFile, 'utf8');

        // Extract metadata
        const nameMatch = srcContent.match(/name:\s*(.*)/);
        const descMatch = srcContent.match(/description:\s*(.*)/);

        const name = nameMatch ? nameMatch[1].trim() : agentName;
        const description = descMatch ? descMatch[1].trim() : `Agent ${agentName}`;

        // Extract System Prompt
        const systemPrompt = srcContent.replace(/---[\s\S]*?---/, '').trim();

        // Construct YAML Entry (Source: project)
        const newEntry = `  - slug: ${agentName}
    name: ${name}
    roleDefinition: ${systemPrompt.replace(/\n/g, '\\n')}
    description: ${description}
    groups:
      - read
      - edit
      - browser
      - command
      - mcp
    source: project
`;

        if (yamlContent.includes(`slug: ${agentName}`)) {
            const blockRegex = new RegExp(`^  - slug: ${agentName}[\\s\\S]*?(?=^  - slug:|$)`, 'm');
            if (blockRegex.test(yamlContent)) {
                yamlContent = yamlContent.replace(blockRegex, newEntry);
            } else {
                yamlContent += '\n' + newEntry;
            }
        } else {
            yamlContent += '\n' + newEntry;
        }

        await fs.writeFile(yamlFile, yamlContent);
    }
}

// Extract Agent from Project (Project Platform Dir -> Project Agent Source)
export async function extractAgentFromProject(agentName, sourcePlatform, projectRoot) {
    if (!projectRoot) {
        throw new Error('Project root not detected');
    }

    const targetDir = path.join(AGENTS_ROOT, agentName);
    const projectPaths = PROJECT_LEVEL_PATHS[sourcePlatform];

    if (!projectPaths) {
        throw new Error(`Unknown platform: ${sourcePlatform}`);
    }

    await fs.ensureDir(targetDir);
    const sourceAgentsDir = path.join(projectRoot, projectPaths.agents);

    if (sourcePlatform === 'opencode') {
        const configSrc = path.join(sourceAgentsDir, '..', 'opencode.json'); // Check path logic: project agents are in .opencode/agents, config is .opencode/opencode.json?
        // Wait, PROJECT_LEVEL_PATHS.opencode.agents = '.opencode/agents'
        // PROJECT_LEVEL_PATHS.opencode.config = '.opencode/opencode.json'
        // So config is in sibling of agents dir's parent? No.
        // sourceAgentsDir = projectRoot/.opencode/agents
        // config is projectRoot/.opencode/opencode.json
        // So path.dirname(sourceAgentsDir) is .opencode
        // path.join(..., 'opencode.json') is correct.

        const projectOpencodeDir = path.dirname(sourceAgentsDir);
        const configSrcFile = path.join(projectOpencodeDir, 'opencode.json');

        if (await fs.pathExists(configSrcFile)) {
            await fs.copy(configSrcFile, path.join(targetDir, 'config.json'));
        }

        const agentSrc = path.join(sourceAgentsDir, `${agentName}.md`);
        if (await fs.pathExists(agentSrc)) {
            await fs.copy(agentSrc, path.join(targetDir, 'agent.md'));
        }

        // Extract skills and workflows from project root (.opencode/skills, .opencode/workflows)
        // projectOpencodeDir is already defined above

        const skillsSrc = path.join(projectOpencodeDir, 'skills');
        if (await fs.pathExists(skillsSrc)) {
            await fs.ensureDir(path.join(targetDir, 'skills'));
            await fs.copy(skillsSrc, path.join(targetDir, 'skills'));
        }

        const workflowsSrc = path.join(projectOpencodeDir, 'workflows');
        if (await fs.pathExists(workflowsSrc)) {
            await fs.ensureDir(path.join(targetDir, 'workflows'));
            await fs.copy(workflowsSrc, path.join(targetDir, 'workflows'));
        }
    } else if (sourcePlatform === 'claude') {
        const agentSrc = path.join(sourceAgentsDir, `${agentName}.md`);
        if (await fs.pathExists(agentSrc)) {
            await fs.copy(agentSrc, path.join(targetDir, 'agent.md'));
        }
    } else if (sourcePlatform === 'copilot') {
        const agentSrc = path.join(sourceAgentsDir, `${agentName}.agent.md`);
        if (await fs.pathExists(agentSrc)) {
            await fs.copy(agentSrc, path.join(targetDir, 'agent.md'));
        }
    } else if (sourcePlatform === 'kilocode') {
        const yamlFile = path.join(projectRoot, projectPaths.agents);
        if (await fs.pathExists(yamlFile)) {
            const content = await fs.readFile(yamlFile, 'utf8');

            // Regex to extract block
            const blockRegex = new RegExp(`^  - slug: ${agentName}([\\s\\S]*?)(?=^  - slug:|$)`, 'm');
            const match = content.match(blockRegex);

            if (match) {
                const block = match[0];

                // Extract fields
                const nameMatch = block.match(/name:\s*(.*)/);
                const descMatch = block.match(/description:\s*(.*)/);
                const roleMatch = block.match(/roleDefinition:\s*(.*)/);

                const name = nameMatch ? nameMatch[1].trim() : agentName;
                const description = descMatch ? descMatch[1].trim() : '';
                let roleDefinition = roleMatch ? roleMatch[1].trim() : '';

                roleDefinition = roleDefinition.replace(/\\n/g, '\n');

                const markdown = `---
name: ${name}
description: ${description}
---

${roleDefinition}
`;
                await fs.writeFile(path.join(targetDir, 'agent.md'), markdown);
            }
        }
    }
}

// Uninstall Agent from Project (Remove from Project Platform Dir)
export async function uninstallAgentFromProject(agentName, targetPlatform, projectRoot) {
    if (!projectRoot) {
        throw new Error('Project root not detected');
    }

    const projectPaths = PROJECT_LEVEL_PATHS[targetPlatform];
    if (!projectPaths) {
        throw new Error(`Unknown platform: ${targetPlatform}`);
    }

    const agentsDir = path.join(projectRoot, projectPaths.agents);

    if (targetPlatform === 'opencode') {
        const agentFile = path.join(agentsDir, `${agentName}.md`);
        if (await fs.pathExists(agentFile)) {
            await fs.remove(agentFile);
        }

        // Safe cleanup of skills/workflows
        const agentSource = path.join(AGENTS_ROOT, agentName);
        if (await fs.pathExists(agentSource)) {
            // Project root contains .opencode/skills, .opencode/workflows (implied by file structure)
            // logic.js PROJECT_LEVEL_PATHS.opencode.agents = '.opencode/agents'
            // So platform root in project is dirname(agentsDir) => .opencode/
            const projectOpencodeDir = path.dirname(agentsDir);

            // Cleanup Skills
            const skillsSrc = path.join(agentSource, 'skills');
            if (await fs.pathExists(skillsSrc)) {
                const skills = await fs.readdir(skillsSrc);
                const targetSkillsDir = path.join(projectOpencodeDir, 'skills');
                if (await fs.pathExists(targetSkillsDir)) {
                    for (const skill of skills) {
                        try {
                            await fs.remove(path.join(targetSkillsDir, skill));
                        } catch (e) { /* ignore */ }
                    }
                }
            }

            // Cleanup Workflows
            const workflowsSrc = path.join(agentSource, 'workflows');
            if (await fs.pathExists(workflowsSrc)) {
                const workflows = await fs.readdir(workflowsSrc);
                const targetWorkflowsDir = path.join(projectOpencodeDir, 'workflows');
                if (await fs.pathExists(targetWorkflowsDir)) {
                    for (const workflow of workflows) {
                        try {
                            await fs.remove(path.join(targetWorkflowsDir, workflow));
                        } catch (e) { /* ignore */ }
                    }
                }
            }
        }

    } else if (targetPlatform === 'claude') {
        const agentFile = path.join(agentsDir, `${agentName}.md`);
        if (await fs.pathExists(agentFile)) {
            await fs.remove(agentFile);
        }
    } else if (targetPlatform === 'copilot') {
        const agentFile = path.join(agentsDir, `${agentName}.agent.md`);
        if (await fs.pathExists(agentFile)) {
            await fs.remove(agentFile);
        }
    } else if (targetPlatform === 'kilocode') {
        const yamlFile = path.join(projectRoot, projectPaths.agents);
        if (await fs.pathExists(yamlFile)) {
            let content = await fs.readFile(yamlFile, 'utf8');
            const blockRegex = new RegExp(`^  - slug: ${agentName}[\\s\\S]*?(?=^  - slug:|$)`, 'm');
            if (blockRegex.test(content)) {
                content = content.replace(blockRegex, '');
                content = content.replace(/\n\n\n/g, '\n\n');
                await fs.writeFile(yamlFile, content);
            }
        }
    }
}

// Config Logic
const CONFIG_DIR = path.join(os.homedir(), '.config', 'agentshare');
const CONFIG_FILE_JSON = path.join(CONFIG_DIR, 'config.json');
const CONFIG_FILE_LEGACY = path.join(CONFIG_DIR, 'config');

export async function loadConfig() {
    try {
        // Try JSON first
        if (await fs.pathExists(CONFIG_FILE_JSON)) {
            return await fs.readJson(CONFIG_FILE_JSON);
        }

        // Try Legacy Config
        if (await fs.pathExists(CONFIG_FILE_LEGACY)) {
            const content = await fs.readFile(CONFIG_FILE_LEGACY, 'utf8');
            const match = content.match(/^LANGUAGE=(.*)$/m);
            if (match) {
                const lang = match[1].trim();
                // Migrate to JSON immediately for future use
                const config = { language: lang };
                await saveConfig(config);
                return config;
            }
        }
    } catch (e) {
        // ignore
    }
    return { language: null }; // No config found => force selection
}

export async function saveConfig(config) {
    await fs.ensureDir(CONFIG_DIR);
    await fs.writeJson(CONFIG_FILE_JSON, config);
}

// i18n Strings
export const STRINGS = {
    en: {
        title: "AgentShare Intelligent Deployment Tool",
        installed_agents: "📦 Installed Agents",
        project_agents: "📁 Agents in Repository",
        no_agents: "  (None)",
        menu_prompt: "Please select an operation:",
        menu_deploy: "Deploy Agent (Project → Platform)",
        menu_extract: "Extract Agent (Platform → Project)",
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
        deploying: "🚀 Deploying %s to %s...",
        extracting: "🚀 Extracting %s from %s...",
        uninstalling: "🗑 Uninstalling %s from %s...",
        success_deploy: "✅ Successfully deployed %s to %s",
        success_extract: "✅ Successfully extracted %s",
        success_uninstall: "✅ Successfully uninstalled %s",
        error_prefix: "❌ Error: ",
        feature_not_impl: "Feature not implemented",
        platform_not_installed: "%s not installed",

        // Language Selection
        lang_select_title: "Language Selection",
        lang_select_prompt: "Please select your language:",
        lang_english: "English",
        lang_chinese: "简体中文",

        // Project-level related
        scope_select: "Select Scope:",
        scope_global: "🌐 Global",
        scope_project: "📂 Project",
        project_installed_agents: "📦 Installed Project Agents",
        global_installed_agents: "🌐 Installed Global Agents",
        project_root_detected: "📁 Current Project Path: %s",
        project_root_not_detected: "⚠️ No project root detected",
        deploying_to_project: "🚀 Deploying %s to %s (project)...",
        extracting_from_project: "🚀 Extracting %s from %s (project)...",
        uninstalling_from_project: "🗑 Uninstalling %s from %s (project)...",
        success_deploy_project: "✅ Successfully deployed %s to %s (project)",
        success_extract_project: "✅ Successfully extracted %s (project)",
        success_uninstall_project: "✅ Successfully uninstalled %s (project)",
        platform_all: "🌍 All Platforms",
        deploying_to_all: "🚀 Deploying %s to all platforms...",
        deploying_to_all_project: "🚀 Deploying %s to all platforms (project)...",
        success_deploy_all: "✅ Successfully deployed %s to all platforms",
        success_deploy_all_project: "✅ Successfully deployed %s to all platforms (project)",

        // Confirmation
        confirm_deploy_title: "⚠️ Conflict Detected",
        confirm_deploy_message: "Agent '%s' already exists on %s. Do you want to overwrite it?",
        confirm_yes: "Yes, Overwrite",
        confirm_no: "No, Cancel"
    },
    zh: {
        title: "AgentShare 智能部署工具",
        installed_agents: "📦 已安装的 Agents",
        project_agents: "📁 AgentShare仓库中的 Agents",
        no_agents: "  (无)",
        menu_prompt: "请选择操作:",
        menu_deploy: "部署 Agent (AgentShare → 你的 AI 工具)",
        menu_extract: "提取 Agent (你的 AI 工具 → AgentShare)",
        menu_uninstall: "卸载 Agent (从你的 AI 工具移除)",
        menu_settings: "设置",
        menu_exit: "退出",
        menu_back: "返回",
        deploy_select_agent: "选择要部署的 Agent:",
        deploy_select_platform: "选择部署目标:",
        extract_select_platform: "选择来源平台:",
        extract_select_agent: "选择要提取的 Agent:",
        uninstall_select_platform: "选择平台:",
        uninstall_select_agent: "选择要卸载的 Agent:",
        settings_language: "切换语言",
        deploying: "🚀 正在部署 %s 到 %s...",
        extracting: "🚀 正在从 %s 提取 %s...",
        uninstalling: "🗑 正在从 %s 卸载 %s...",
        success_deploy: "✅ 成功部署 %s 到 %s",
        success_extract: "✅ 成功提取 %s",
        success_uninstall: "✅ 成功卸载 %s",
        error_prefix: "❌ 错误: ",
        feature_not_impl: "功能未实现",
        platform_not_installed: "%s 未安装",

        // Language Selection
        lang_select_title: "语言选择",
        lang_select_prompt: "请选择您的语言：",
        lang_english: "English",
        lang_chinese: "简体中文",

        // Project-level related
        scope_select: "选择范围:",
        scope_global: "🌐 全局",
        scope_project: "📂 项目",
        project_installed_agents: "📦 已安装的项目级 Agents",
        global_installed_agents: "🌐 已安装的全局 Agents",
        project_root_detected: "📁 当前项目路径: %s",
        project_root_not_detected: "⚠️ 未检测到项目根目录",
        deploying_to_project: "🚀 正在部署 %s 到 %s (项目)...",
        extracting_from_project: "🚀 正在从 %s 提取 %s (项目)...",
        uninstalling_from_project: "🗑 正在从 %s 卸载 %s (项目)...",
        success_deploy_project: "✅ 成功部署 %s 到 %s (项目)",
        success_extract_project: "✅ 成功提取 %s (项目)",
        success_uninstall_project: "✅ 成功卸载 %s (项目)",
        platform_all: "🌍 所有平台",
        deploying_to_all: "🚀 正在部署 %s 到所有平台...",
        deploying_to_all_project: "🚀 正在部署 %s 到所有平台 (项目)...",
        success_deploy_all: "✅ 成功部署 %s 到所有平台",
        success_deploy_all_project: "✅ 成功部署 %s 到所有平台 (项目)",

        // Confirmation
        confirm_deploy_title: "⚠️ 冲突检测",
        confirm_deploy_message: "Agent '%s' 已存在于 %s。是否覆盖？",
        confirm_yes: "是，覆盖",
        confirm_no: "否，取消"
    }
};

export function getText(key, lang = 'zh', ...args) {
    const s = STRINGS[lang]?.[key] || STRINGS[lang === 'zh' ? 'en' : 'zh']?.[key] || key;
    if (args.length > 0) {
        return args.reduce((acc, current) => acc.replace('%s', current), s);
    }
    return s;
}
