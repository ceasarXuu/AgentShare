#!/bin/bash

# NBAgents Universal Deployment Script
# 自动检测 agents 目录下的所有 Agent，并支持交互式选择部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
AGENTS_ROOT="$REPO_ROOT/agents"

# 打印 Header
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            NBAgents 通用部署脚本                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查依赖
check_dependencies() {
    echo -e "${BLUE}ℹ️  检查系统依赖...${NC}"
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✅ Node.js 已安装${NC}"
    else
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi
    if command -v opencode &> /dev/null; then
        echo -e "${GREEN}✅ OpenCode CLI 已安装${NC}"
    else
        echo -e "${YELLOW}⚠️  OpenCode CLI 未安装${NC}"
    fi
    echo ""
}

# 交互式选择 Agent
select_agent() {
    echo -e "${BLUE}🔍 扫描可用的 Agents...${NC}"
    
    # 获取 agents 目录下的子目录列表
    local agents=()
    if [ -d "$AGENTS_ROOT" ]; then
        for d in "$AGENTS_ROOT"/*; do
            if [ -d "$d" ]; then
                agents+=("$(basename "$d")")
            fi
        done
    else
        echo -e "${RED}❌ 找不到 agents 目录: $AGENTS_ROOT${NC}"
        exit 1
    fi

    if [ ${#agents[@]} -eq 0 ]; then
        echo -e "${RED}❌ 未找到任何 Agent${NC}"
        exit 1
    fi

    echo -e "${GREEN}请选择要部署的 Agent (输入数字):${NC}"
    select agent_name in "${agents[@]}" "退出"; do
        if [ "$agent_name" == "退出" ]; then
            echo "退出部署"
            exit 0
        elif [ -n "$agent_name" ]; then
            echo -e "您选择了: ${GREEN}$agent_name${NC}"
            SELECTED_AGENT="$agent_name"
            AGENT_DIR="$AGENTS_ROOT/$agent_name"
            break
        else
            echo "无效选择，请重试"
        fi
    done
    echo ""
}

# 部署逻辑 (复用并通用化之前的逻辑)
deploy_agent() {
    local agent_name="$1"
    local agent_dir="$2"
    
    echo -e "${BLUE}🚀 开始部署 Agent: $agent_name${NC}"
    
    # 检测 OpenCode 路径
    local opencode_dir=""
    if [ -d "$HOME/.config/opencode" ]; then
        opencode_dir="$HOME/.config/opencode"
    elif [ -d "$HOME/.opencode" ]; then
        opencode_dir="$HOME/.opencode"
    elif [ -d "$HOME/Library/Application Support/OpenCode" ]; then
        opencode_dir="$HOME/Library/Application Support/OpenCode"
    fi

    if [ -n "$opencode_dir" ]; then
        echo -e "${BLUE}ℹ️  部署到 OpenCode: $opencode_dir${NC}"
        
        # 1. 复制 Agent 专属配置
        if [ -f "$agent_dir/opencode/config.json" ]; then
            cp "$agent_dir/opencode/config.json" "$opencode_dir/opencode.json"
            echo -e "${GREEN}✅ 已部署 Agent 专属配置: config.json${NC}"
        elif [ -f "$agent_dir/opencode.json" ]; then
            # 向后兼容
            cp "$agent_dir/opencode.json" "$opencode_dir/opencode.json"
            echo -e "${GREEN}✅ 已部署 Agent 专属配置: opencode.json (旧结构)${NC}"
        else
            echo -e "${YELLOW}⚠️  该 Agent 没有配置文件，将使用 OpenCode 默认配置${NC}"
        fi

        # 2. 复制 Agent 定义
        mkdir -p "$opencode_dir/agents"
        local agent_def=""
        if [ -f "$agent_dir/opencode/agent.md" ]; then
            agent_def="$agent_dir/opencode/agent.md"
        else
            # 向后兼容: 查找根目录下的主要 md 文件
            agent_def=$(find "$agent_dir" -maxdepth 1 -name "*.md" | grep -v "README" | grep -v "USAGE" | grep -v "DEPLOY" | grep -v "CLAUDE" | head -n 1)
        fi
        
        if [ -n "$agent_def" ]; then
            # 无论原名是什么，我们都用 agent_name.md 命名部署后的文件，或者保持原名？
            # 保持一致性，使用 agent_name.md
            cp "$agent_def" "$opencode_dir/agents/${agent_name}.md"
            echo -e "${GREEN}✅ 已部署 Agent 定义: ${agent_name}.md${NC}"
        else
            echo -e "${YELLOW}⚠️  未找到 Agent 定义文件 (.md)${NC}"
        fi

        # 3. 部署 Skills (从 shared/SKILLS 或 SKILLS)
        local skills_src=""
        if [ -d "$agent_dir/shared/SKILLS" ]; then
            skills_src="$agent_dir/shared/SKILLS"
        elif [ -d "$agent_dir/SKILLS" ]; then
            skills_src="$agent_dir/SKILLS"
        fi

        if [ -n "$skills_src" ]; then
            mkdir -p "$opencode_dir/skills"
            cp -r "$skills_src/"* "$opencode_dir/skills/"
            local count=$(ls "$skills_src" | wc -l | tr -d ' ')
            echo -e "${GREEN}✅ 已部署 $count 个 Skills${NC}"
        fi

        # 4. 部署 Workflows (从 shared/workflows 或 .agent/workflows)
        local workflows_src=""
        if [ -d "$agent_dir/shared/workflows" ]; then
            workflows_src="$agent_dir/shared/workflows"
        elif [ -d "$agent_dir/.agent/workflows" ]; then
            workflows_src="$agent_dir/.agent/workflows"
        fi

        if [ -n "$workflows_src" ]; then
            mkdir -p "$opencode_dir/workflows"
            cp -r "$workflows_src/"* "$opencode_dir/workflows/"
            local count=$(ls "$workflows_src" | wc -l | tr -d ' ')
            echo -e "${GREEN}✅ 已部署 $count 个 Workflows${NC}"
        fi
        
        # 5. 部署 Docs (从 shared/docs 或 docs)
        local docs_src=""
        if [ -d "$agent_dir/shared/docs" ]; then
            docs_src="$agent_dir/shared/docs"
        elif [ -d "$agent_dir/docs" ]; then
            docs_src="$agent_dir/docs"
        fi

        if [ -n "$docs_src" ]; then
            local target_docs="$opencode_dir/${agent_name/ /_}_docs"
            mkdir -p "$target_docs"
            cp -r "$docs_src/"* "$target_docs/"
            echo -e "${GREEN}✅ 已部署文档到 $target_docs${NC}"
        fi

        # 6. 创建项目链接
        mkdir -p "$opencode_dir/projects"
        if [ ! -L "$opencode_dir/projects/$agent_name" ]; then
            ln -s "$agent_dir" "$opencode_dir/projects/$agent_name"
            echo -e "${GREEN}✅ 已创建 OpenCode 项目链接${NC}"
        fi

    else
        echo -e "${YELLOW}⚠️  未检测到 OpenCode 配置目录，跳过 OpenCode 部署${NC}"
    fi

    # Claude Code 自动部署
    local claude_config_dir=""
    if [ -d "$HOME/.claude" ]; then
        claude_config_dir="$HOME/.claude"
    elif [ -d "$HOME/.config/claude" ]; then
        claude_config_dir="$HOME/.config/claude"
    elif [ -d "$HOME/Library/Application Support/Claude" ]; then
        claude_config_dir="$HOME/Library/Application Support/Claude"
    fi

    # 检测 Claude 定义文件
    local claude_def=""
    if [ -f "$agent_dir/claude/agent.md" ]; then
        claude_def="$agent_dir/claude/agent.md"
    elif [ -f "$agent_dir/CLAUDE.md" ]; then
        claude_def="$agent_dir/CLAUDE.md"
    fi

    if [ -n "$claude_def" ]; then
        if [ -n "$claude_config_dir" ]; then
            echo ""
            echo -e "${BLUE}ℹ️  部署到 Claude Code: $claude_config_dir${NC}"
            
            # 创建 Claude agents 目录
            mkdir -p "$claude_config_dir/agents"
            
            # 复制为 agent 定义文件
            cp "$claude_def" "$claude_config_dir/agents/${agent_name}.md"
            echo -e "${GREEN}✅ 已部署 Claude Agent 定义: ${agent_name}.md${NC}"
            
            # 如果有 opencode 配置，也复制到 Claude (作为备用)
            local opencode_conf=""
            if [ -f "$agent_dir/opencode/config.json" ]; then
                opencode_conf="$agent_dir/opencode/config.json"
            elif [ -f "$agent_dir/opencode.json" ]; then
                opencode_conf="$agent_dir/opencode.json"
            fi
            
            if [ -n "$opencode_conf" ]; then
                cp "$opencode_conf" "$claude_config_dir/${agent_name}_config.json"
                echo -e "${GREEN}✅ 已部署 Claude 配置: ${agent_name}_config.json${NC}"
            fi
            
            # 创建项目符号链接
            mkdir -p "$claude_config_dir/projects"
            if [ ! -L "$claude_config_dir/projects/$agent_name" ]; then
                ln -s "$agent_dir" "$claude_config_dir/projects/$agent_name"
                echo -e "${GREEN}✅ 已创建 Claude 项目链接${NC}"
            fi
        else
            echo ""
            echo -e "${YELLOW}⚠️  发现 Claude 定义文件但未找到 Claude Code 配置目录${NC}"
            echo -e "${BLUE}ℹ️  Claude Code 可直接打开此目录: $agent_dir${NC}"
        fi
    fi
    
    echo ""
    echo -e "${GREEN}🎉 $agent_name 部署完成!${NC}"
    echo ""
}

# 环境变量检查
check_env() {
    if [ ! -f "$REPO_ROOT/.env" ]; then
        echo -e "${YELLOW}⚠️  根目录 .env 不存在${NC}"
        if [ -f "$REPO_ROOT/.env.example" ]; then
            read -p "是否从 .env.example 创建 .env? (Y/n) " ans
            if [[ -z "$ans" || "$ans" =~ ^[Yy]$ ]]; then
                cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
                echo -e "${GREEN}✅ 已创建 .env，请务必填写 API 密钥${NC}"
            fi
        fi
    else
        echo -e "${GREEN}✅ .env 文件已存在${NC}"
    fi
    echo ""
}

# 主流程
main() {
    check_dependencies
    check_env
    select_agent
    deploy_agent "$SELECTED_AGENT" "$AGENT_DIR"
}

main
