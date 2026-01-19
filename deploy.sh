#!/bin/bash

# NBAgents Universal Deployment Script
# 支持 Agent 扫描、部署和提取功能
# 使用 gum 提供现代化 TUI 体验

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目根目录
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
AGENTS_ROOT="$REPO_ROOT/agents"

# 全局变量
OPENCODE_DIR=""
CLAUDE_DIR=""
declare -a OPENCODE_AGENTS
declare -a CLAUDE_AGENTS
declare -a PROJECT_AGENTS
USE_GUM=false

# 检测 gum
if command -v gum &> /dev/null; then
    USE_GUM=true
fi

# 打印 Header
print_header() {
    clear
    if [ "$USE_GUM" = true ]; then
        gum style \
            --foreground 212 \
            --border-foreground 212 \
            --border double \
            --align center \
            --width 60 \
            --margin "1 2" \
            --padding "1 4" \
            "NBAgents 智能部署工具"
    else
        echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${BLUE}║            NBAgents 智能部署工具                          ║${NC}"
        echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
    fi
}

# 检查依赖
check_dependencies() {
    if [ "$USE_GUM" = false ]; then
        echo -e "${YELLOW}💡 提示: 安装 gum 可获得更好的交互体验${NC}"
        echo -e "${YELLOW}   macOS: brew install gum${NC}"
        echo ""
    fi
    
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

# 检测平台
detect_platforms() {
    echo -e "${BLUE}🔍 检测平台...${NC}"
    
    # 检测 OpenCode
    if [ -d "$HOME/.config/opencode" ]; then
        OPENCODE_DIR="$HOME/.config/opencode"
    elif [ -d "$HOME/.opencode" ]; then
        OPENCODE_DIR="$HOME/.opencode"
    elif [ -d "$HOME/Library/Application Support/OpenCode" ]; then
        OPENCODE_DIR="$HOME/Library/Application Support/OpenCode"
    fi
    
    # 检测 Claude Code
    if [ -d "$HOME/.claude" ]; then
        CLAUDE_DIR="$HOME/.claude"
    elif [ -d "$HOME/.config/claude" ]; then
        CLAUDE_DIR="$HOME/.config/claude"
    elif [ -d "$HOME/Library/Application Support/Claude" ]; then
        CLAUDE_DIR="$HOME/Library/Application Support/Claude"
    fi
    
    # 显示检测结果
    if [ -n "$OPENCODE_DIR" ]; then
        echo -e "${GREEN}  ✅ OpenCode: $OPENCODE_DIR${NC}"
    else
        echo -e "${YELLOW}  ⚠️  OpenCode: 未检测到${NC}"
    fi
    
    if [ -n "$CLAUDE_DIR" ]; then
        echo -e "${GREEN}  ✅ Claude Code: $CLAUDE_DIR${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Claude Code: 未检测到${NC}"
    fi
    
    echo ""
}

# 扫描已安装的 Agents
scan_installed_agents() {
    # 扫描 OpenCode Agents（官方 + 用户自定义）
    OPENCODE_AGENTS=()
    if [ -n "$OPENCODE_DIR" ]; then
        # 扫描官方 Agents (agent/ 目录)
        if [ -d "$OPENCODE_DIR/agent" ]; then
            for agent_file in "$OPENCODE_DIR/agent"/*.md; do
                if [ -f "$agent_file" ]; then
                    agent_name=$(basename "$agent_file" .md)
                    OPENCODE_AGENTS+=("$agent_name [官方]")
                fi
            done
        fi
        
        # 扫描用户自定义 Agents (agents/ 目录)
        if [ -d "$OPENCODE_DIR/agents" ]; then
            for agent_file in "$OPENCODE_DIR/agents"/*.md; do
                if [ -f "$agent_file" ]; then
                    agent_name=$(basename "$agent_file" .md)
                    OPENCODE_AGENTS+=("$agent_name")
                fi
            done
        fi
    fi
    
    # 扫描 Claude Code Agents
    CLAUDE_AGENTS=()
    if [ -n "$CLAUDE_DIR" ] && [ -d "$CLAUDE_DIR/agents" ]; then
        for agent_file in "$CLAUDE_DIR/agents"/*.md; do
            if [ -f "$agent_file" ]; then
                agent_name=$(basename "$agent_file" .md)
                CLAUDE_AGENTS+=("$agent_name")
            fi
        done
    fi
}

# 扫描项目中的 Agents
scan_project_agents() {
    PROJECT_AGENTS=()
    if [ -d "$AGENTS_ROOT" ]; then
        for d in "$AGENTS_ROOT"/*; do
            if [ -d "$d" ]; then
                PROJECT_AGENTS+=($(basename "$d"))
            fi
        done
    fi
}

# 显示仪表板
display_dashboard() {
    if [ "$USE_GUM" = true ]; then
        # 使用 gum 显示仪表板
        gum style \
            --border rounded \
            --border-foreground 212 \
            --padding "1 2" \
            --margin "1 0" \
            "$(echo -e "📦 已安装的 Agents\n\n  OpenCode:\n$(for agent in "${OPENCODE_AGENTS[@]}"; do echo "    • $agent"; done)\n$([ ${#OPENCODE_AGENTS[@]} -eq 0 ] && echo "    (无)")\n\n  Claude Code:\n$(for agent in "${CLAUDE_AGENTS[@]}"; do echo "    • $agent"; done)\n$([ ${#CLAUDE_AGENTS[@]} -eq 0 ] && echo "    (无)")")"
        
        gum style \
            --border rounded \
            --border-foreground 212 \
            --padding "1 2" \
            --margin "1 0" \
            "$(echo -e "📁 项目中的 Agents\n\n$(for agent in "${PROJECT_AGENTS[@]}"; do echo "  • $agent"; done)\n$([ ${#PROJECT_AGENTS[@]} -eq 0 ] && echo "  (无)")")"
    else
        # 传统显示
        echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
        echo -e "${CYAN}                         系统概览${NC}"
        echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
        echo ""
        
        echo -e "${BLUE}📦 已安装的 Agents:${NC}"
        echo -e "  ${GREEN}OpenCode:${NC}"
        if [ ${#OPENCODE_AGENTS[@]} -gt 0 ]; then
            for agent in "${OPENCODE_AGENTS[@]}"; do
                echo -e "    - $agent"
            done
        else
            echo -e "    ${YELLOW}(无)${NC}"
        fi
        
        echo -e "  ${GREEN}Claude Code:${NC}"
        if [ ${#CLAUDE_AGENTS[@]} -gt 0 ]; then
            for agent in "${CLAUDE_AGENTS[@]}"; do
                echo -e "    - $agent"
            done
        else
            echo -e "    ${YELLOW}(无)${NC}"
        fi
        echo ""
        
        echo -e "${BLUE}📁 项目中的 Agents:${NC}"
        if [ ${#PROJECT_AGENTS[@]} -gt 0 ]; then
            for agent in "${PROJECT_AGENTS[@]}"; do
                echo -e "  - ${GREEN}$agent${NC}"
            done
        else
            echo -e "  ${YELLOW}(无)${NC}"
        fi
        echo ""
        
        echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
        echo ""
    fi
}

# 主菜单
main_menu() {
    if [ "$USE_GUM" = true ]; then
        choice=$(gum choose \
            "部署 Agent (项目 → 平台)" \
            "提取 Agent (平台 → 项目)" \
            "退出" \
            --header="请选择操作 (↑↓ 选择，Enter 确认)" \
            --cursor.foreground="212" \
            --selected.foreground="212" \
            --header.foreground="99")
    else
        echo -e "${GREEN}请选择操作:${NC}"
        select choice in "部署 Agent (项目 → 平台)" "提取 Agent (平台 → 项目)" "退出"; do
            break
        done
    fi
    
    case "$choice" in
        "部署 Agent (项目 → 平台)")
            deploy_agent_menu
            ;;
        "提取 Agent (平台 → 项目)")
            extract_agent_menu
            ;;
        "退出")
            echo "退出"
            exit 0
            ;;
        *)
            echo "无效选择"
            main_menu
            ;;
    esac
}

# 部署 Agent 菜单
deploy_agent_menu() {
    if [ ${#PROJECT_AGENTS[@]} -eq 0 ]; then
        if [ "$USE_GUM" = true ]; then
            gum style \
                --foreground 212 \
                --border-foreground 212 \
                --border double \
                --padding "1 2" \
                --margin "1 0" \
                "⚠️  项目中没有可部署的 Agent"
            sleep 2
        else
            echo -e "${YELLOW}⚠️  项目中没有可部署的 Agent${NC}"
        fi
        main_menu
        return
    fi
    
    if [ "$USE_GUM" = true ]; then
        agent=$(gum choose "${PROJECT_AGENTS[@]}" "返回" \
            --header="选择要部署的 Agent" \
            --cursor.foreground="212" \
            --selected.foreground="212")
    else
        echo -e "${GREEN}请选择要部署的 Agent:${NC}"
        select agent in "${PROJECT_AGENTS[@]}" "返回"; do
            break
        done
    fi
    
    if [ "$agent" == "返回" ] || [ -z "$agent" ]; then
        main_menu
        return
    fi
    
    # 选择部署目标
    if [ "$USE_GUM" = true ]; then
        target=$(gum choose \
            "OpenCode" \
            "Claude Code" \
            "两者都部署" \
            --header="选择部署目标" \
            --cursor.foreground="212")
        
        if gum confirm "确认部署 $agent 到 $target?"; then
            deploy_agent "$agent" "$AGENTS_ROOT/$agent" "$target"
        fi
    else
        echo -e "${GREEN}选择部署目标:${NC}"
        select target in "OpenCode" "Claude Code" "两者都部署"; do
            break
        done
        
        read -p "确认部署 $agent 到 $target? (y/N) " confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            deploy_agent "$agent" "$AGENTS_ROOT/$agent" "$target"
        fi
    fi
    
    if [ "$USE_GUM" = true ]; then
        gum input --placeholder="按 Enter 继续..." > /dev/null
    else
        read -p "按 Enter 继续..."
    fi
    main_menu
}

# 提取 Agent 菜单
extract_agent_menu() {
    if [ "$USE_GUM" = true ]; then
        platform=$(gum choose "OpenCode" "Claude Code" "返回" \
            --header="选择来源平台" \
            --cursor.foreground="212")
    else
        echo -e "${GREEN}请选择来源平台:${NC}"
        select platform in "OpenCode" "Claude Code" "返回"; do
            break
        done
    fi
    
    case $platform in
        "OpenCode")
            if [ ${#OPENCODE_AGENTS[@]} -eq 0 ]; then
                if [ "$USE_GUM" = true ]; then
                    gum style --foreground 212 "⚠️  OpenCode 中没有已安装的 Agent"
                    sleep 2
                else
                    echo -e "${YELLOW}⚠️  OpenCode 中没有已安装的 Agent${NC}"
                fi
                extract_agent_menu
                return
            fi
            extract_from_platform "opencode" "${OPENCODE_AGENTS[@]}"
            ;;
        "Claude Code")
            if [ ${#CLAUDE_AGENTS[@]} -eq 0 ]; then
                if [ "$USE_GUM" = true ]; then
                    gum style --foreground 212 "⚠️  Claude Code 中没有已安装的 Agent"
                    sleep 2
                else
                    echo -e "${YELLOW}⚠️  Claude Code 中没有已安装的 Agent${NC}"
                fi
                extract_agent_menu
                return
            fi
            extract_from_platform "claude" "${CLAUDE_AGENTS[@]}"
            ;;
        "返回")
            main_menu
            return
            ;;
    esac
}

# 从平台提取 Agent
extract_from_platform() {
    local platform="$1"
    shift
    local available_agents=("$@")
    
    if [ "$USE_GUM" = true ]; then
        agent_name=$(gum choose "${available_agents[@]}" "返回" \
            --header="选择要提取的 Agent" \
            --cursor.foreground="212")
    else
        echo -e "${GREEN}请选择要提取的 Agent:${NC}"
        select agent_name in "${available_agents[@]}" "返回"; do
            break
        done
    fi
    
    if [ "$agent_name" == "返回" ] || [ -z "$agent_name" ]; then
        extract_agent_menu
        return
    fi
    
    # 移除 [官方] 标签
    agent_name="${agent_name% \[官方\]}"
    
    extract_agent "$agent_name" "$platform"
    
    if [ "$USE_GUM" = true ]; then
        gum input --placeholder="按 Enter 继续..." > /dev/null
    else
        read -p "按 Enter 继续..."
    fi
    main_menu
}

# 提取 Agent
extract_agent() {
    local agent_name="$1"
    local platform="$2"
    local target_dir="$AGENTS_ROOT/$agent_name"
    
    if [ "$USE_GUM" = true ]; then
        gum style --foreground 212 "📥 提取 Agent: $agent_name (从 $platform)"
    else
        echo -e "${BLUE}📥 提取 Agent: $agent_name (从 $platform)${NC}"
    fi
    
    # 检查是否已存在
    if [ -d "$target_dir" ]; then
        if [ "$USE_GUM" = true ]; then
            if ! gum confirm "Agent '$agent_name' 已存在，是否覆盖?"; then
                return
            fi
        else
            read -p "Agent '$agent_name' 已存在，是否覆盖? (y/N) " ans
            if [[ ! "$ans" =~ ^[Yy]$ ]]; then
                return
            fi
        fi
        rm -rf "$target_dir"
    fi
    
    # 创建目录结构
    mkdir -p "$target_dir"/{opencode,claude,shared/{SKILLS,workflows,docs},data}
    
    # 从不同平台提取
    if [ "$platform" == "opencode" ]; then
        extract_from_opencode "$agent_name" "$target_dir"
    elif [ "$platform" == "claude" ]; then
        extract_from_claude "$agent_name" "$target_dir"
    fi
    
    # 创建基础 README
    create_agent_readme "$agent_name" "$target_dir"
    
    if [ "$USE_GUM" = true ]; then
        gum style \
            --foreground 212 \
            --border-foreground 212 \
            --border rounded \
            --padding "1 2" \
            "✅ 提取完成: $target_dir"
    else
        echo -e "${GREEN}✅ 提取完成: $target_dir${NC}"
    fi
}

# 从 OpenCode 提取
extract_from_opencode() {
    local agent_name="$1"
    local target_dir="$2"
    
    # 复制 Agent 定义
    if [ -f "$OPENCODE_DIR/agents/$agent_name.md" ]; then
        cp "$OPENCODE_DIR/agents/$agent_name.md" "$target_dir/opencode/agent.md"
        echo -e "${GREEN}  ✅ 已提取 Agent 定义${NC}"
    elif [ -f "$OPENCODE_DIR/agent/$agent_name.md" ]; then
        cp "$OPENCODE_DIR/agent/$agent_name.md" "$target_dir/opencode/agent.md"
        echo -e "${GREEN}  ✅ 已提取 Agent 定义 (官方)${NC}"
    fi
    
    # 复制配置文件
    if [ -f "$OPENCODE_DIR/opencode.json" ]; then
        cp "$OPENCODE_DIR/opencode.json" "$target_dir/opencode/config.json"
        echo -e "${GREEN}  ✅ 已提取配置文件${NC}"
    fi
    
    # 复制 Skills
    if [ -d "$OPENCODE_DIR/skills" ]; then
        cp -r "$OPENCODE_DIR/skills"/* "$target_dir/shared/SKILLS/" 2>/dev/null || true
        local count=$(ls -A "$target_dir/shared/SKILLS" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$count" -gt 0 ]; then
            echo -e "${GREEN}  ✅ 已提取 $count 个 Skills${NC}"
        fi
    fi
    
    # 复制 Workflows
    if [ -d "$OPENCODE_DIR/workflows" ]; then
        cp -r "$OPENCODE_DIR/workflows"/* "$target_dir/shared/workflows/" 2>/dev/null || true
        local count=$(ls -A "$target_dir/shared/workflows" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$count" -gt 0 ]; then
            echo -e "${GREEN}  ✅ 已提取 $count 个 Workflows${NC}"
        fi
    fi
    
    # 复制 Docs
    local docs_dir=$(find "$OPENCODE_DIR" -maxdepth 1 -type d -name "*_docs" | head -n 1)
    if [ -n "$docs_dir" ]; then
        cp -r "$docs_dir"/* "$target_dir/shared/docs/" 2>/dev/null || true
        echo -e "${GREEN}  ✅ 已提取文档${NC}"
    fi
}

# 从 Claude Code 提取
extract_from_claude() {
    local agent_name="$1"
    local target_dir="$2"
    
    # 复制 Agent 定义
    if [ -f "$CLAUDE_DIR/agents/$agent_name.md" ]; then
        cp "$CLAUDE_DIR/agents/$agent_name.md" "$target_dir/claude/agent.md"
        echo -e "${GREEN}  ✅ 已提取 Claude Agent 定义${NC}"
    fi
    
    # 复制配置文件（如果有）
    if [ -f "$CLAUDE_DIR/${agent_name}_config.json" ]; then
        cp "$CLAUDE_DIR/${agent_name}_config.json" "$target_dir/opencode/config.json"
        echo -e "${GREEN}  ✅ 已提取配置文件${NC}"
    fi
}

# 创建基础 README
create_agent_readme() {
    local agent_name="$1"
    local target_dir="$2"
    local readme_file="$target_dir/README.md"
    
    cat > "$readme_file" <<EOF
# $agent_name

> Agent 从平台提取，请根据需要补充说明

## 简介

此 Agent 从平台自动提取。

## 部署

在项目根目录运行：

\`\`\`bash
./deploy.sh
\`\`\`

选择 "$agent_name" 进行部署。

## 许可证

MIT
EOF

    echo -e "${GREEN}  ✅ 已创建 README.md${NC}"
}

# 部署 Agent
deploy_agent() {
    local agent_name="$1"
    local agent_dir="$2"
    local target="$3"
    
    if [ "$USE_GUM" = true ]; then
        gum spin --spinner dot --title "正在部署 $agent_name..." -- sleep 0.5
    fi
    
    echo -e "${BLUE}🚀 开始部署 Agent: $agent_name${NC}"
    
    # 根据目标部署
    case "$target" in
        "OpenCode")
            deploy_to_opencode "$agent_name" "$agent_dir"
            ;;
        "Claude Code")
            deploy_to_claude "$agent_name" "$agent_dir"
            ;;
        "两者都部署")
            deploy_to_opencode "$agent_name" "$agent_dir"
            deploy_to_claude "$agent_name" "$agent_dir"
            ;;
    esac
    
    if [ "$USE_GUM" = true ]; then
        gum style \
            --foreground 212 \
            --border-foreground 212 \
            --border rounded \
            --padding "1 2" \
            "🎉 $agent_name 部署完成!"
    else
        echo ""
        echo -e "${GREEN}🎉 $agent_name 部署完成!${NC}"
        echo ""
    fi
}

# 部署到 OpenCode
deploy_to_opencode() {
    local agent_name="$1"
    local agent_dir="$2"
    
    if [ -z "$OPENCODE_DIR" ]; then
        echo -e "${YELLOW}⚠️  未检测到 OpenCode，跳过${NC}"
        return
    fi
    
    echo -e "${BLUE}ℹ️  部署到 OpenCode: $OPENCODE_DIR${NC}"
    
    # 1. 复制配置
    if [ -f "$agent_dir/opencode/config.json" ]; then
        cp "$agent_dir/opencode/config.json" "$OPENCODE_DIR/opencode.json"
        echo -e "${GREEN}✅ 已部署配置: config.json${NC}"
    elif [ -f "$agent_dir/opencode.json" ]; then
        cp "$agent_dir/opencode.json" "$OPENCODE_DIR/opencode.json"
        echo -e "${GREEN}✅ 已部署配置: opencode.json${NC}"
    fi

    # 2. 复制 Agent 定义
    mkdir -p "$OPENCODE_DIR/agents"
    local agent_def=""
    if [ -f "$agent_dir/opencode/agent.md" ]; then
        agent_def="$agent_dir/opencode/agent.md"
    else
        agent_def=$(find "$agent_dir" -maxdepth 1 -name "*.md" | grep -v "README" | head -n 1)
    fi
    
    if [ -n "$agent_def" ]; then
        cp "$agent_def" "$OPENCODE_DIR/agents/${agent_name}.md"
        echo -e "${GREEN}✅ 已部署 Agent 定义${NC}"
    fi

    # 3. 部署 Skills
    local skills_src=""
    if [ -d "$agent_dir/shared/SKILLS" ]; then
        skills_src="$agent_dir/shared/SKILLS"
    elif [ -d "$agent_dir/SKILLS" ]; then
        skills_src="$agent_dir/SKILLS"
    fi

    if [ -n "$skills_src" ]; then
        mkdir -p "$OPENCODE_DIR/skills"
        cp -r "$skills_src/"* "$OPENCODE_DIR/skills/"
        local count=$(ls "$skills_src" | wc -l | tr -d ' ')
        echo -e "${GREEN}✅ 已部署 $count 个 Skills${NC}"
    fi

    # 4. 部署 Workflows
    local workflows_src=""
    if [ -d "$agent_dir/shared/workflows" ]; then
        workflows_src="$agent_dir/shared/workflows"
    elif [ -d "$agent_dir/.agent/workflows" ]; then
        workflows_src="$agent_dir/.agent/workflows"
    fi

    if [ -n "$workflows_src" ]; then
        mkdir -p "$OPENCODE_DIR/workflows"
        cp -r "$workflows_src/"* "$OPENCODE_DIR/workflows/"
        local count=$(ls "$workflows_src" | wc -l | tr -d ' ')
        echo -e "${GREEN}✅ 已部署 $count 个 Workflows${NC}"
    fi
    
    # 5. 部署 Docs
    local docs_src=""
    if [ -d "$agent_dir/shared/docs" ]; then
        docs_src="$agent_dir/shared/docs"
    elif [ -d "$agent_dir/docs" ]; then
        docs_src="$agent_dir/docs"
    fi

    if [ -n "$docs_src" ]; then
        local target_docs="$OPENCODE_DIR/${agent_name/ /_}_docs"
        mkdir -p "$target_docs"
        cp -r "$docs_src/"* "$target_docs/"
        echo -e "${GREEN}✅ 已部署文档${NC}"
    fi

    # 6. 创建项目链接
    mkdir -p "$OPENCODE_DIR/projects"
    if [ ! -L "$OPENCODE_DIR/projects/$agent_name" ]; then
        ln -s "$agent_dir" "$OPENCODE_DIR/projects/$agent_name"
        echo -e "${GREEN}✅ 已创建项目链接${NC}"
    fi
}

# 部署到 Claude Code
deploy_to_claude() {
    local agent_name="$1"
    local agent_dir="$2"
    
    if [ -z "$CLAUDE_DIR" ]; then
        echo -e "${YELLOW}⚠️  未检测到 Claude Code，跳过${NC}"
        return
    fi
    
    local claude_def=""
    if [ -f "$agent_dir/claude/agent.md" ]; then
        claude_def="$agent_dir/claude/agent.md"
    elif [ -f "$agent_dir/CLAUDE.md" ]; then
        claude_def="$agent_dir/CLAUDE.md"
    fi

    if [ -n "$claude_def" ]; then
        echo ""
        echo -e "${BLUE}ℹ️  部署到 Claude Code: $CLAUDE_DIR${NC}"
        
        mkdir -p "$CLAUDE_DIR/agents"
        cp "$claude_def" "$CLAUDE_DIR/agents/${agent_name}.md"
        echo -e "${GREEN}✅ 已部署 Agent 定义${NC}"
        
        local opencode_conf=""
        if [ -f "$agent_dir/opencode/config.json" ]; then
            opencode_conf="$agent_dir/opencode/config.json"
        elif [ -f "$agent_dir/opencode.json" ]; then
            opencode_conf="$agent_dir/opencode.json"
        fi
        
        if [ -n "$opencode_conf" ]; then
            cp "$opencode_conf" "$CLAUDE_DIR/${agent_name}_config.json"
            echo -e "${GREEN}✅ 已部署配置${NC}"
        fi
        
        mkdir -p "$CLAUDE_DIR/projects"
        if [ ! -L "$CLAUDE_DIR/projects/$agent_name" ]; then
            ln -s "$agent_dir" "$CLAUDE_DIR/projects/$agent_name"
            echo -e "${GREEN}✅ 已创建项目链接${NC}"
        fi
    fi
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
    print_header
    check_dependencies
    check_env
    detect_platforms
    scan_installed_agents
    scan_project_agents
    display_dashboard
    main_menu
}

main
