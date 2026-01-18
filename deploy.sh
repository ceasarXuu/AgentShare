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
        
        # 1. 复制 Agent 专属配置 opencode.json
        if [ -f "$agent_dir/opencode.json" ]; then
            cp "$agent_dir/opencode.json" "$opencode_dir/opencode.json"
            echo -e "${GREEN}✅ 已部署 Agent 专属配置: opencode.json${NC}"
        else
            echo -e "${YELLOW}⚠️  该 Agent 没有 opencode.json，将使用 OpenCode 默认配置或保留现有配置${NC}"
        fi

        # 2. 复制 Agent 定义
        mkdir -p "$opencode_dir/agents"
        # 查找 agent 定义文件 (.md)，通常是 agent_name.md 或 nbresearcher.md
        # 这里假设定义文件可能不再叫 nbresearcher.md，而是通用名或在特定位置
        # 根据之前的结构，文件在 agent_dir/nbresearcher.md
        # 我们尝试查找 *.md 但排除 README 等
        local agent_def=$(find "$agent_dir" -maxdepth 1 -name "*.md" | grep -v "README" | grep -v "USAGE" | grep -v "DEPLOY" | head -n 1)
        
        if [ -n "$agent_def" ]; then
            local def_name=$(basename "$agent_def")
            cp "$agent_def" "$opencode_dir/agents/$def_name"
            echo -e "${GREEN}✅ 已部署 Agent 定义: $def_name${NC}"
        else
            echo -e "${YELLOW}⚠️  未找到 Agent 定义文件 (.md)${NC}"
        fi

        # 3. 部署 Skills
        if [ -d "$agent_dir/SKILLS" ]; then
            mkdir -p "$opencode_dir/skills"
            cp -r "$agent_dir/SKILLS/"* "$opencode_dir/skills/"
            local count=$(ls "$agent_dir/SKILLS" | wc -l | tr -d ' ')
            echo -e "${GREEN}✅ 已部署 $count 个 Skills${NC}"
        fi

        # 4. 部署 Workflows
        if [ -d "$agent_dir/.agent/workflows" ]; then
            mkdir -p "$opencode_dir/workflows"
            cp -r "$agent_dir/.agent/workflows/"* "$opencode_dir/workflows/"
            local count=$(ls "$agent_dir/.agent/workflows" | wc -l | tr -d ' ')
            echo -e "${GREEN}✅ 已部署 $count 个 Workflows${NC}"
        fi
        
        # 5. 部署 Docs (可选，视具体 Agent 而定)
        if [ -d "$agent_dir/docs" ]; then
            # 使用 agent 名作为文档目录前缀，避免冲突
            local target_docs="$opencode_dir/${agent_name/ /_}_docs"
            mkdir -p "$target_docs"
            cp -r "$agent_dir/docs/"* "$target_docs/"
            echo -e "${GREEN}✅ 已部署文档到 $target_docs${NC}"
        fi

        # 6. 创建项目链接
        mkdir -p "$opencode_dir/projects"
        if [ ! -L "$opencode_dir/projects/$agent_name" ]; then
            ln -s "$agent_dir" "$opencode_dir/projects/$agent_name"
            echo -e "${GREEN}✅ 已创建项目链接${NC}"
        fi

    else
        echo -e "${YELLOW}⚠️  未检测到 OpenCode 配置目录，跳过 OpenCode 部署${NC}"
    fi

    # Claude Code 部署 (通过 CLAUDE.md)
    # 只要 CLAUDE.md 在 Agent 目录下，Claude Code 打开该目录即可识别
    if [ -f "$agent_dir/CLAUDE.md" ]; then
        echo -e "${GREEN}✅ 发现 CLAUDE.md，Claude Code 可直接使用此目录: $agent_dir${NC}"
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
