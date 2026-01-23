
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { fileURLToPath } from 'url';

// Mock Environment
const TEST_DIR = path.join(process.cwd(), 'temp_test_env');
const REPO_ROOT = process.cwd();
process.env.TEST_HOME = TEST_DIR; // Override Home for logic.js

// Import logic AFTER setting env var
// Note: In ESM, imports happen before execution usually, but logic.js reads env at module level.
// If logic.js reads process.env.TEST_HOME at top level, updates here might be too late if imported statically at top.
// However, since we are running this script, we can set env before dynamic import.
// Let's use dynamic import.

// Setup Test Environment
async function setup() {
    console.log('Setup Test Environment...');
    await fs.remove(TEST_DIR);
    await fs.ensureDir(TEST_DIR);

    const openCodeRoot = path.join(TEST_DIR, '.config/opencode');
    await fs.ensureDir(openCodeRoot);
    const claudeRoot = path.join(TEST_DIR, 'Library/Application Support/Claude');
    await fs.ensureDir(claudeRoot);
    const copilotRoot = path.join(TEST_DIR, 'Library/Application Support/Code/User/prompts');
    await fs.ensureDir(copilotRoot);

    const projectRoot = path.join(TEST_DIR, 'project');
    await fs.ensureDir(projectRoot);

    const skillDir = path.join(TEST_DIR, 'project/skills/test-skill');
    await fs.ensureDir(skillDir);
    const skillDoc = `---
name: test-skill
description: A test skill
---

# Test Skill
`;
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), skillDoc);

    const agentDir = path.join(TEST_DIR, 'project/agents/test-agent');
    await fs.ensureDir(agentDir);
    const agentDoc = `---
name: test-agent
description: A test agent
---

You are a test agent.
`;
    await fs.writeFile(path.join(agentDir, 'agent.md'), agentDoc);

    return projectRoot;
}

async function runTests() {
    const projectRoot = await setup();

    // Dynamic Import logic.js to ensure env var is read
    const {
        scanProjectSkills, scanPlatformSkills, deploySkill, extractSkill, uninstallSkill, deployAgent, uninstallAgent
    } = await import('../logic.js');
    const resolveClaudeRoot = async () => {
        const claudeCandidates = [
            path.join(TEST_DIR, '.claude'),
            path.join(TEST_DIR, '.config/claude'),
            path.join(TEST_DIR, 'Library/Application Support/Claude')
        ];
        for (const candidate of claudeCandidates) {
            if (await fs.pathExists(candidate)) {
                return candidate;
            }
        }
        return null;
    };

    console.log('--- Test 1: Scan Project Skills ---');
    const skills = await scanProjectSkills(projectRoot);
    console.log('Skills found:', skills);
    if (skills.includes('test-skill')) console.log('✅ PASS');
    else console.error('❌ FAIL');

    console.log('\n--- Test 2: Deploy Skill to OpenCode Global ---');
    await deploySkill('test-skill', 'opencode', 'global', projectRoot);
    const ocGlobalSkill = path.join(TEST_DIR, '.config/opencode/skills/test-skill/SKILL.md');
    if (await fs.pathExists(ocGlobalSkill)) {
        console.log('✅ PASS: Skill copied to OpenCode global');
    } else {
        console.error('❌ FAIL: Skill not copied to OpenCode global');
    }

    console.log('\n--- Test 3: Deploy Skill to Copilot Global ---');
    await deploySkill('test-skill', 'copilot', 'global', projectRoot);
    const copilotGlobalSkill = path.join(TEST_DIR, '.copilot/skills/test-skill/SKILL.md');
    if (await fs.pathExists(copilotGlobalSkill)) {
        console.log('✅ PASS: Skill copied to Copilot global');
    } else {
        console.error('❌ FAIL: Skill not copied to Copilot global');
    }

    console.log('\n--- Test 4: Deploy Skill to VS Code Project ---');
    await deploySkill('test-skill', 'kilocode', 'project', projectRoot);
    const kiloProjectSkill = path.join(projectRoot, '.kilocode/skills/test-skill/SKILL.md');
    if (await fs.pathExists(kiloProjectSkill)) {
        console.log('✅ PASS: Skill copied to Kilo Code project');
    } else {
        console.error('❌ FAIL: Skill not copied to Kilo Code project');
    }

    console.log('\n--- Test 5: Verify Installed Skills Scan ---');
    const globalOcSkills = await scanPlatformSkills('opencode', 'global');
    if (globalOcSkills.includes('test-skill')) console.log('✅ PASS: OpenCode Global Scan');
    else console.error('❌ FAIL: OpenCode Global Scan');

    const globalCopilotSkills = await scanPlatformSkills('copilot', 'global');
    if (globalCopilotSkills.includes('test-skill')) console.log('✅ PASS: Copilot Global Scan');
    else console.error('❌ FAIL: Copilot Global Scan');

    const projectKiloSkills = await scanPlatformSkills('kilocode', 'project', projectRoot);
    if (projectKiloSkills.includes('test-skill')) console.log('✅ PASS: Kilo Code Project Scan');
    else console.error('❌ FAIL: Kilo Code Project Scan');

    console.log('\n--- Test 6: Uninstall Skill from OpenCode Global ---');
    await uninstallSkill('test-skill', 'opencode', 'global');
    if (!await fs.pathExists(path.join(TEST_DIR, '.config/opencode/skills/test-skill'))) {
        console.log('✅ PASS: Uninstalled');
    } else {
        console.error('❌ FAIL: Still present');
    }

    console.log('\n--- Test 7: Uninstall Skill from Copilot Global ---');
    await uninstallSkill('test-skill', 'copilot', 'global');
    if (!await fs.pathExists(path.join(TEST_DIR, '.copilot/skills/test-skill'))) {
        console.log('✅ PASS: Uninstalled');
    } else {
        console.error('❌ FAIL: Still present');
    }

    console.log('\n--- Test 8: Extract Skill (Simulated) ---');
    const claudeSkillDir = path.join(TEST_DIR, '.claude/skills/extracted-skill');
    await fs.ensureDir(claudeSkillDir);
    await fs.writeFile(path.join(claudeSkillDir, 'SKILL.md'), `---
name: extracted-skill
description: Extracted skill
---

# Extracted Skill
`);

    // Extract
    await extractSkill('extracted-skill', 'claude', 'global', projectRoot);
    const extractedSkillDoc = path.join(projectRoot, 'skills', 'extracted-skill', 'SKILL.md');
    if (await fs.pathExists(extractedSkillDoc)) {
        const content = await fs.readFile(extractedSkillDoc, 'utf8');
        if (content.includes('name: extracted-skill')) console.log('✅ PASS: Extracted successfully');
        else console.error('❌ FAIL: Content mismatch', content);
    } else {
        console.error('❌ FAIL: File not created');
    }
    const claudeRoot = await resolveClaudeRoot();

    console.log('\n--- Test 9: Deploy Agent to OpenCode Global ---');
    await deployAgent('test-agent', 'opencode', 'global', projectRoot);
    const ocGlobalAgent = path.join(TEST_DIR, '.config/opencode/agents/test-agent.md');
    if (await fs.pathExists(ocGlobalAgent)) {
        console.log('✅ PASS: Agent copied to OpenCode global');
    } else {
        console.error('❌ FAIL: Agent not copied to OpenCode global');
    }

    console.log('\n--- Test 10: Deploy Agent to Claude Global ---');
    await deployAgent('test-agent', 'claude', 'global', projectRoot);
    const claudeGlobalAgent = claudeRoot ? path.join(claudeRoot, 'agents/test-agent.md') : null;
    if (claudeGlobalAgent && await fs.pathExists(claudeGlobalAgent)) {
        console.log('✅ PASS: Agent copied to Claude global');
    } else {
        console.error('❌ FAIL: Agent not copied to Claude global');
    }

    console.log('\n--- Test 11: Deploy Agent to Copilot Global ---');
    await deployAgent('test-agent', 'copilot', 'global', projectRoot);
    const copilotGlobalAgent = path.join(TEST_DIR, 'Library/Application Support/Code/User/prompts/test-agent.agent.md');
    if (await fs.pathExists(copilotGlobalAgent)) {
        console.log('✅ PASS: Agent copied to Copilot global');
    } else {
        console.error('❌ FAIL: Agent not copied to Copilot global');
    }

    console.log('\n--- Test 12: Uninstall Agent from OpenCode Global ---');
    await uninstallAgent('test-agent', 'opencode');
    if (!await fs.pathExists(ocGlobalAgent)) {
        console.log('✅ PASS: Uninstalled');
    } else {
        console.error('❌ FAIL: Still present');
    }

    console.log('\n--- Test 13: Uninstall Agent from Claude Global ---');
    await uninstallAgent('test-agent', 'claude');
    if (!await fs.pathExists(claudeGlobalAgent)) {
        console.log('✅ PASS: Uninstalled');
    } else {
        console.error('❌ FAIL: Still present');
    }

    console.log('\n--- Test 14: Uninstall Agent from Copilot Global ---');
    await uninstallAgent('test-agent', 'copilot');
    if (!await fs.pathExists(copilotGlobalAgent)) {
        console.log('✅ PASS: Uninstalled');
    } else {
        console.error('❌ FAIL: Still present');
    }

    // Cleanup
    await fs.remove(TEST_DIR);
    console.log('\n✅ All Tests Completed.');
}

runTests().catch(console.error);
