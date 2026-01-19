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
LANG_CHOICE="zh"  # 默认语言：zh=中文, en=英文

# 多语言文本定义
declare -A TEXT_EN TEXT_ZH

# 英文文本
TEXT_EN[lang_select_title]="Language Selection"
TEXT_EN[lang_select_prompt]="Please select your language:"
TEXT_EN[lang_english]="English"
TEXT_EN[lang_chinese]="简体中文 (Simplified Chinese)"
TEXT_EN[header_title]="NBAgents Deployment Tool"
TEXT_EN[gum_installed]="gum is installed"
TEXT_EN[gum_not_installed]="gum not detected. gum provides better interactive experience"
TEXT_EN[gum_install_prompt]="Install gum automatically?"
TEXT_EN[gum_installing]="Installing gum..."
TEXT_EN[gum_using_brew]="Using Homebrew to install..."
TEXT_EN[gum_no_brew]="Homebrew not detected. Please install Homebrew first"
TEXT_EN[gum_visit_brew]="Visit https://brew.sh to install Homebrew"
TEXT_EN[gum_using_apt]="Using apt to install..."
TEXT_EN[gum_using_yum]="Using yum to install..."
TEXT_EN[gum_using_pacman]="Using pacman to install..."
TEXT_EN[gum_unknown_os]="Unknown operating system, please install gum manually"
TEXT_EN[gum_visit_github]="Visit https://github.com/charmbracelet/gum for installation instructions"
TEXT_EN[gum_install_success]="gum installed successfully"
TEXT_EN[gum_install_failed]="gum installation failed"
TEXT_EN[gum_skip_install]="Skipping installation, using traditional interface"
TEXT_EN[check_deps]="Checking system dependencies..."
TEXT_EN[nodejs_installed]="Node.js is installed"
TEXT_EN[nodejs_not_installed]="Node.js is not installed"
TEXT_EN[opencode_installed]="OpenCode CLI is installed"
TEXT_EN[opencode_not_installed]="OpenCode CLI is not installed"
TEXT_EN[detect_platforms]="Detecting platforms..."
TEXT_EN[opencode_detected]="OpenCode:"
TEXT_EN[claude_detected]="Claude Code:"
TEXT_EN[not_detected]="Not detected"
TEXT_EN[env_not_found]="Root directory .env not found"
TEXT_EN[create_env_prompt]="Create .env from .env.example?"
TEXT_EN[env_created]="Created .env, please fill in API keys"
TEXT_EN[env_exists]=".env file exists"
TEXT_EN[dashboard_title]="System Overview"
TEXT_EN[installed_agents]="Installed Agents"
TEXT_EN[project_agents]="Project Agents"
TEXT_EN[none]="(none)"
TEXT_EN[menu_deploy]="Deploy Agent (Project → Platform)"
TEXT_EN[menu_extract]="Extract Agent (Platform → Project)"
TEXT_EN[menu_exit]="Exit"
TEXT_EN[menu_prompt]="Please select an operation (↑↓ select, Enter confirm)"
TEXT_EN[menu_select_operation]="Please select an operation:"
TEXT_EN[exit]="Exit"
TEXT_EN[invalid_choice]="Invalid choice"
TEXT_EN[no_project_agents]="No agents available for deployment in project"
TEXT_EN[select_agent_deploy]="Select agent to deploy"
TEXT_EN[select_agent_extract]="Select agent to extract"
TEXT_EN[back]="Back"
TEXT_EN[select_target]="Select deployment target"
TEXT_EN[confirm_deploy]="Confirm deployment of %s to %s?"
TEXT_EN[both_platforms]="Both platforms"
TEXT_EN[press_enter]="Press Enter to continue..."
TEXT_EN[select_source_platform]="Select source platform"
TEXT_EN[no_opencode_agents]="No agents installed in OpenCode"
TEXT_EN[no_claude_agents]="No agents installed in Claude Code"
TEXT_EN[extracting_agent]="Extracting Agent: %s (from %s)"
TEXT_EN[agent_exists_overwrite]="Agent '%s' already exists, overwrite?"
TEXT_EN[extract_complete]="Extraction complete: %s"
TEXT_EN[extract_agent_def]="Extracted agent definition"
TEXT_EN[extract_agent_def_official]="Extracted agent definition (official)"
TEXT_EN[extract_config]="Extracted configuration file"
TEXT_EN[extract_skills]="Extracted %s Skills"
TEXT_EN[extract_workflows]="Extracted %s Workflows"
TEXT_EN[extract_docs]="Extracted documentation"
TEXT_EN[extract_claude_agent]="Extracted Claude agent definition"
TEXT_EN[readme_created]="Created README.md"
TEXT_EN[deploying_agent]="Deploying Agent: %s"
TEXT_EN[deploy_complete]="%s deployment complete!"
TEXT_EN[deploy_to_opencode]="Deploying to OpenCode: %s"
TEXT_EN[deploy_to_claude]="Deploying to Claude Code: %s"
TEXT_EN[opencode_not_detected]="OpenCode not detected, skipping"
TEXT_EN[claude_not_detected]="Claude Code not detected, skipping"
TEXT_EN[deployed_config]="Deployed configuration: %s"
TEXT_EN[deployed_agent_def]="Deployed agent definition"
TEXT_EN[deployed_skills]="Deployed %s Skills"
TEXT_EN[deployed_workflows]="Deployed %s Workflows"
TEXT_EN[deployed_docs]="Deployed documentation"
TEXT_EN[created_project_link]="Created project link"

# 中文文本
TEXT_ZH[lang_select_title]="语言选择"
TEXT_ZH[lang_select_prompt]="请选择您的语言："
TEXT_ZH[lang_english]="English"
TEXT_ZH[lang_chinese]="简体中文"
TEXT_ZH[header_title]="NBAgents 智能部署工具"
TEXT_ZH[gum_installed]="gum 已安装"
TEXT_ZH[gum_not_installed]="检测到 gum 未安装，gum 可提供更好的交互体验"
TEXT_ZH[gum_install_prompt]="是否自动安装 gum?"
TEXT_ZH[gum_installing]="正在安装 gum..."
TEXT_ZH[gum_using_brew]="使用 Homebrew 安装..."
TEXT_ZH[gum_no_brew]="未检测到 Homebrew，请先安装 Homebrew"
TEXT_ZH[gum_visit_brew]="访问 https://brew.sh 安装 Homebrew"
TEXT_ZH[gum_using_apt]="使用 apt 安装..."
TEXT_ZH[gum_using_yum]="使用 yum 安装..."
TEXT_ZH[gum_using_pacman]="使用 pacman 安装..."
TEXT_ZH[gum_unknown_os]="未识别的操作系统，请手动安装 gum"
TEXT_ZH[gum_visit_github]="访问 https://github.com/charmbracelet/gum 查看安装说明"
TEXT_ZH[gum_install_success]="gum 安装成功"
TEXT_ZH[gum_install_failed]="gum 安装失败"
TEXT_ZH[gum_skip_install]="跳过安装，将使用传统界面"
TEXT_ZH[check_deps]="检查系统依赖..."
TEXT_ZH[nodejs_installed]="Node.js 已安装"
TEXT_ZH[nodejs_not_installed]="Node.js 未安装"
TEXT_ZH[opencode_installed]="OpenCode CLI 已安装"
TEXT_ZH[opencode_not_installed]="OpenCode CLI 未安装"
TEXT_ZH[detect_platforms]="检测平台..."
TEXT_ZH[opencode_detected]="OpenCode:"
TEXT_ZH[claude_detected]="Claude Code:"
TEXT_ZH[not_detected]="未检测到"
TEXT_ZH[env_not_found]="根目录 .env 不存在"
TEXT_ZH[create_env_prompt]="是否从 .env.example 创建 .env?"
TEXT_ZH[env_created]="已创建 .env，请务必填写 API 密钥"
TEXT_ZH[env_exists]=".env 文件已存在"
TEXT_ZH[dashboard_title]="系统概览"
TEXT_ZH[installed_agents]="已安装的 Agents"
TEXT_ZH[project_agents]="项目中的 Agents"
TEXT_ZH[none]="(无)"
TEXT_ZH[menu_deploy]="部署 Agent (项目 → 平台)"
TEXT_ZH[menu_extract]="提取 Agent (平台 → 项目)"
TEXT_ZH[menu_exit]="退出"
TEXT_ZH[menu_prompt]="请选择操作 (↑↓ 选择，Enter 确认)"
TEXT_ZH[menu_select_operation]="请选择操作:"
TEXT_ZH[exit]="退出"
TEXT_ZH[invalid_choice]="无效选择"
TEXT_ZH[no_project_agents]="项目中没有可部署的 Agent"
TEXT_ZH[select_agent_deploy]="选择要部署的 Agent"
TEXT_ZH[select_agent_extract]="选择要提取的 Agent"
TEXT_ZH[back]="返回"
TEXT_ZH[select_target]="选择部署目标"
TEXT_ZH[confirm_deploy]="确认部署 %s 到 %s?"
TEXT_ZH[both_platforms]="两者都部署"
TEXT_ZH[press_enter]="按 Enter 继续..."
TEXT_ZH[select_source_platform]="选择来源平台"
TEXT_ZH[no_opencode_agents]="OpenCode 中没有已安装的 Agent"
TEXT_ZH[no_claude_agents]="Claude Code 中没有已安装的 Agent"
TEXT_ZH[extracting_agent]="提取 Agent: %s (从 %s)"
TEXT_ZH[agent_exists_overwrite]="Agent '%s' 已存在，是否覆盖?"
TEXT_ZH[extract_complete]="提取完成: %s"
TEXT_ZH[extract_agent_def]="已提取 Agent 定义"
TEXT_ZH[extract_agent_def_official]="已提取 Agent 定义 (官方)"
TEXT_ZH[extract_config]="已提取配置文件"
TEXT_ZH[extract_skills]="已提取 %s 个 Skills"
TEXT_ZH[extract_workflows]="已提取 %s 个 Workflows"
TEXT_ZH[extract_docs]="已提取文档"
TEXT_ZH[extract_claude_agent]="已提取 Claude Agent 定义"
TEXT_ZH[readme_created]="已创建 README.md"
TEXT_ZH[deploying_agent]="开始部署 Agent: %s"
TEXT_ZH[deploy_complete]="%s 部署完成!"
TEXT_ZH[deploy_to_opencode]="部署到 OpenCode: %s"
TEXT_ZH[deploy_to_claude]="部署到 Claude Code: %s"
TEXT_ZH[opencode_not_detected]="未检测到 OpenCode，跳过"
TEXT_ZH[claude_not_detected]="未检测到 Claude Code，跳过"
TEXT_ZH[deployed_config]="已部署配置: %s"
TEXT_ZH[deployed_agent_def]="已部署 Agent 定义"
TEXT_ZH[deployed_skills]="已部署 %s 个 Skills"
TEXT_ZH[deployed_workflows]="已部署 %s 个 Workflows"
TEXT_ZH[deployed_docs]="已部署文档"
TEXT_ZH[created_project_link]="已创建项目链接"

# 获取文本的辅助函数
get_text() {
    local key="$1"
    shift
    local text=""
    
    if [ "$LANG_CHOICE" = "en" ]; then
        text="${TEXT_EN[$key]}"
    else
        text="${TEXT_ZH[$key]}"
    fi
    
    # 支持参数替换 (使用 printf 格式)
    if [ $# -gt 0 ]; then
        printf "$text" "$@"
    else
        echo "$text"
    fi
}

# 检测 gum
if command -v gum &> /dev/null; then
    USE_GUM=true
fi

# 语言选择
select_language() {
    clear
    if [ "$USE_GUM" = true ]; then
        # 使用 gum 选择语言
        gum style \
            --foreground 212 \
            --border-foreground 212 \
            --border double \
            --align center \
            --width 50 \
            --margin "1 2" \
            --padding "1 4" \
            "Language Selection / 语言选择"
        
        echo ""
        choice=$(gum choose \
            "English" \
            "简体中文" \
            --cursor.foreground="212" \
            --selected.foreground="212" \
            --header="Please select your language / 请选择您的语言")
        
        if [ "$choice" = "English" ]; then
            LANG_CHOICE="en"
        else
            LANG_CHOICE="zh"
        fi
    else
        # 传统选择菜单
        echo "════════════════════════════════════════════════════════════"
        echo "         Language Selection / 语言选择"
        echo "════════════════════════════════════════════════════════════"
        echo ""
        echo "Please select your language / 请选择您的语言:"
        select choice in "English" "简体中文"; do
            if [ "$choice" = "English" ]; then
                LANG_CHOICE="en"
            else
                LANG_CHOICE="zh"
            fi
            break
        done
    fi
}

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
            "$(get_text header_title)"
    else
        echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${BLUE}║            $(get_text header_title)                          ║${NC}"
        echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
    fi
}

# 自动安装 gum
install_gum() {
    echo -e "${BLUE}🔧 $(get_text gum_installing)${NC}"
    
    # 检测操作系统
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo -e "${BLUE}   $(get_text gum_using_brew)${NC}"
            brew install gum
        else
            echo -e "${RED}❌ $(get_text gum_no_brew)${NC}"
            echo -e "${YELLOW}   $(get_text gum_visit_brew)${NC}"
            return 1
        fi
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        # Windows (Git Bash)
        echo -e "${YELLOW}⚠️  Windows 环境检测${NC}"
        echo -e "${YELLOW}   请使用项目根目录下的 install-windows.ps1 安装 gum${NC}"
        echo -e "${BLUE}   PowerShell: .\\install-windows.ps1${NC}"
        return 1
    elif [[ -f /etc/debian_version ]]; then
        # Debian/Ubuntu
        echo -e "${BLUE}   $(get_text gum_using_apt)${NC}"
        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://repo.charm.sh/apt/gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/charm.gpg
        echo "deb [signed-by=/etc/apt/keyrings/charm.gpg] https://repo.charm.sh/apt/ * *" | sudo tee /etc/apt/sources.list.d/charm.list
        sudo apt update && sudo apt install -y gum
    elif [[ -f /etc/redhat-release ]]; then
        # RHEL/CentOS/Fedora
        echo -e "${BLUE}   $(get_text gum_using_yum)${NC}"
        echo '[charm]
name=Charm
baseurl=https://repo.charm.sh/yum/
enabled=1
gpgcheck=1
gpgkey=https://repo.charm.sh/yum/gpg.key' | sudo tee /etc/yum.repos.d/charm.repo
        sudo yum install -y gum
    elif [[ -f /etc/arch-release ]]; then
        # Arch Linux
        echo -e "${BLUE}   $(get_text gum_using_pacman)${NC}"
        sudo pacman -S --noconfirm gum
    else
        echo -e "${YELLOW}⚠️  $(get_text gum_unknown_os)${NC}"
        echo -e "${YELLOW}   $(get_text gum_visit_github)${NC}"
        return 1
    fi
    
    # 验证安装
    if command -v gum &> /dev/null; then
        echo -e "${GREEN}✅ $(get_text gum_install_success)${NC}"
        USE_GUM=true
        return 0
    else
        echo -e "${RED}❌ $(get_text gum_install_failed)${NC}"
        return 1
    fi
}

# 检查依赖
check_dependencies() {
    # 检查并自动安装 gum
    if [ "$USE_GUM" = false ]; then
        echo -e "${YELLOW}💡 $(get_text gum_not_installed)${NC}"
        read -p "$(get_text gum_install_prompt) (Y/n) " install_choice
        if [[ -z "$install_choice" || "$install_choice" =~ ^[Yy]$ ]]; then
            install_gum
        else
            echo -e "${YELLOW}   $(get_text gum_skip_install)${NC}"
        fi
        echo ""
    else
        echo -e "${GREEN}✅ $(get_text gum_installed)${NC}"
    fi
    
    echo -e "${BLUE}ℹ️  $(get_text check_deps)${NC}"
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✅ $(get_text nodejs_installed)${NC}"
    else
        echo -e "${RED}❌ $(get_text nodejs_not_installed)${NC}"
        exit 1
    fi
    if command -v opencode &> /dev/null; then
        echo -e "${GREEN}✅ $(get_text opencode_installed)${NC}"
    else
        echo -e "${YELLOW}⚠️  $(get_text opencode_not_installed)${NC}"
    fi
    echo ""
}

# 检测平台
detect_platforms() {
    echo -e "${BLUE}🔍 $(get_text detect_platforms)${NC}"
    
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
        echo -e "${GREEN}  ✅ $(get_text opencode_detected) $OPENCODE_DIR${NC}"
    else
        echo -e "${YELLOW}  ⚠️  $(get_text opencode_detected) $(get_text not_detected)${NC}"
    fi
    
    if [ -n "$CLAUDE_DIR" ]; then
        echo -e "${GREEN}  ✅ $(get_text claude_detected) $CLAUDE_DIR${NC}"
    else
        echo -e "${YELLOW}  ⚠️  $(get_text claude_detected) $(get_text not_detected)${NC}"
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
            "$(echo -e "📦 $(get_text installed_agents)\n\n  OpenCode:\n$(for agent in "${OPENCODE_AGENTS[@]}"; do echo "    • $agent"; done)\n$([ ${#OPENCODE_AGENTS[@]} -eq 0 ] && echo "    $(get_text none)")\n\n  Claude Code:\n$(for agent in "${CLAUDE_AGENTS[@]}"; do echo "    • $agent"; done)\n$([ ${#CLAUDE_AGENTS[@]} -eq 0 ] && echo "    $(get_text none)")")"
        
        gum style \
            --border rounded \
            --border-foreground 212 \
            --padding "1 2" \
            --margin "1 0" \
            "$(echo -e "📁 $(get_text project_agents)\n\n$(for agent in "${PROJECT_AGENTS[@]}"; do echo "  • $agent"; done)\n$([ ${#PROJECT_AGENTS[@]} -eq 0 ] && echo "  $(get_text none)")")"
    else
        # 传统显示
        echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
        echo -e "${CYAN}                         $(get_text dashboard_title)${NC}"
        echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
        echo ""
        
        echo -e "${BLUE}📦 $(get_text installed_agents):${NC}"
        echo -e "  ${GREEN}OpenCode:${NC}"
        if [ ${#OPENCODE_AGENTS[@]} -gt 0 ]; then
            for agent in "${OPENCODE_AGENTS[@]}"; do
                echo -e "    - $agent"
            done
        else
            echo -e "    ${YELLOW}$(get_text none)${NC}"
        fi
        
        echo -e "  ${GREEN}Claude Code:${NC}"
        if [ ${#CLAUDE_AGENTS[@]} -gt 0 ]; then
            for agent in "${CLAUDE_AGENTS[@]}"; do
                echo -e "    - $agent"
            done
        else
            echo -e "    ${YELLOW}$(get_text none)${NC}"
        fi
        echo ""
        
        echo -e "${BLUE}📁 $(get_text project_agents):${NC}"
        if [ ${#PROJECT_AGENTS[@]} -gt 0 ]; then
            for agent in "${PROJECT_AGENTS[@]}"; do
                echo -e "  - ${GREEN}$agent${NC}"
            done
        else
            echo -e "  ${YELLOW}$(get_text none)${NC}"
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
            "$(get_text menu_deploy)" \
            "$(get_text menu_extract)" \
            "$(get_text menu_exit)" \
            --header="$(get_text menu_prompt)" \
            --cursor.foreground="212" \
            --selected.foreground="212" \
            --header.foreground="99")
    else
        echo -e "${GREEN}$(get_text menu_select_operation)${NC}"
        select choice in "$(get_text menu_deploy)" "$(get_text menu_extract)" "$(get_text menu_exit)"; do
            break
        done
    fi
    
    case "$choice" in
        "$(get_text menu_deploy)")
            deploy_agent_menu
            ;;
        "$(get_text menu_extract)")
            extract_agent_menu
            ;;
        "$(get_text menu_exit)")
            echo "$(get_text exit)"
            exit 0
            ;;
        *)
            echo "$(get_text invalid_choice)"
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
                "⚠️  $(get_text no_project_agents)"
            sleep 2
        else
            echo -e "${YELLOW}⚠️  $(get_text no_project_agents)${NC}"
        fi
        main_menu
        return
    fi
    
    if [ "$USE_GUM" = true ]; then
        agent=$(gum choose "${PROJECT_AGENTS[@]}" "$(get_text back)" \
            --header="$(get_text select_agent_deploy)" \
            --cursor.foreground="212" \
            --selected.foreground="212")
    else
        echo -e "${GREEN}$(get_text select_agent_deploy):${NC}"
        select agent in "${PROJECT_AGENTS[@]}" "$(get_text back)"; do
            break
        done
    fi
    
    if [ "$agent" == "$(get_text back)" ] || [ -z "$agent" ]; then
        main_menu
        return
    fi
    
    # 选择部署目标
    if [ "$USE_GUM" = true ]; then
        target=$(gum choose \
            "OpenCode" \
            "Claude Code" \
            "$(get_text both_platforms)" \
            --header="$(get_text select_target)" \
            --cursor.foreground="212")
        
        if gum confirm "$(get_text confirm_deploy "$agent" "$target")"; then
            deploy_agent "$agent" "$AGENTS_ROOT/$agent" "$target"
        fi
    else
        echo -e "${GREEN}$(get_text select_target):${NC}"
        select target in "OpenCode" "Claude Code" "$(get_text both_platforms)"; do
            break
        done
        
        read -p "$(get_text confirm_deploy "$agent" "$target") (y/N) " confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            deploy_agent "$agent" "$AGENTS_ROOT/$agent" "$target"
        fi
    fi
    
    if [ "$USE_GUM" = true ]; then
        gum input --placeholder="$(get_text press_enter)" > /dev/null
    else
        read -p "$(get_text press_enter)"
    fi
    main_menu
}

# 提取 Agent 菜单
extract_agent_menu() {
    if [ "$USE_GUM" = true ]; then
        platform=$(gum choose "OpenCode" "Claude Code" "$(get_text back)" \
            --header="$(get_text select_source_platform)" \
            --cursor.foreground="212")
    else
        echo -e "${GREEN}$(get_text select_source_platform):${NC}"
        select platform in "OpenCode" "Claude Code" "$(get_text back)"; do
            break
        done
    fi
    
    case $platform in
        "OpenCode")
            if [ ${#OPENCODE_AGENTS[@]} -eq 0 ]; then
                if [ "$USE_GUM" = true ]; then
                    gum style --foreground 212 "⚠️  $(get_text no_opencode_agents)"
                    sleep 2
                else
                    echo -e "${YELLOW}⚠️  $(get_text no_opencode_agents)${NC}"
                fi
                extract_agent_menu
                return
            fi
            extract_from_platform "opencode" "${OPENCODE_AGENTS[@]}"
            ;;
        "Claude Code")
            if [ ${#CLAUDE_AGENTS[@]} -eq 0 ]; then
                if [ "$USE_GUM" = true ]; then
                    gum style --foreground 212 "⚠️  $(get_text no_claude_agents)"
                    sleep 2
                else
                    echo -e "${YELLOW}⚠️  $(get_text no_claude_agents)${NC}"
                fi
                extract_agent_menu
                return
            fi
            extract_from_platform "claude" "${CLAUDE_AGENTS[@]}"
            ;;
        "$(get_text back)")
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
        agent_name=$(gum choose "${available_agents[@]}" "$(get_text back)" \
            --header="$(get_text select_agent_extract)" \
            --cursor.foreground="212")
    else
        echo -e "${GREEN}$(get_text select_agent_extract):${NC}"
        select agent_name in "${available_agents[@]}" "$(get_text back)"; do
            break
        done
    fi
    
    if [ "$agent_name" == "$(get_text back)" ] || [ -z "$agent_name" ]; then
        extract_agent_menu
        return
    fi
    
    # 移除 [官方] 标签
    agent_name="${agent_name% \[官方\]}"
    
    extract_agent "$agent_name" "$platform"
    
    if [ "$USE_GUM" = true ]; then
        gum input --placeholder="$(get_text press_enter)" > /dev/null
    else
        read -p "$(get_text press_enter)"
    fi
    main_menu
}

# 提取 Agent
extract_agent() {
    local agent_name="$1"
    local platform="$2"
    local target_dir="$AGENTS_ROOT/$agent_name"
    
    if [ "$USE_GUM" = true ]; then
        gum style --foreground 212 "$(get_text extracting_agent "$agent_name" "$platform")"
    else
        echo -e "${BLUE}$(get_text extracting_agent "$agent_name" "$platform")${NC}"
    fi
    
    # 检查是否已存在
    if [ -d "$target_dir" ]; then
        if [ "$USE_GUM" = true ]; then
            if ! gum confirm "$(get_text agent_exists_overwrite "$agent_name")"; then
                return
            fi
        else
            read -p "$(get_text agent_exists_overwrite "$agent_name") (y/N) " ans
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
            "✅ $(get_text extract_complete "$target_dir")"
    else
        echo -e "${GREEN}✅ $(get_text extract_complete "$target_dir")${NC}"
    fi
}

# 从 OpenCode 提取
extract_from_opencode() {
    local agent_name="$1"
    local target_dir="$2"
    
    # 复制 Agent 定义
    if [ -f "$OPENCODE_DIR/agents/$agent_name.md" ]; then
        cp "$OPENCODE_DIR/agents/$agent_name.md" "$target_dir/opencode/agent.md"
        echo -e "${GREEN}  ✅ $(get_text extract_agent_def)${NC}"
    elif [ -f "$OPENCODE_DIR/agent/$agent_name.md" ]; then
        cp "$OPENCODE_DIR/agent/$agent_name.md" "$target_dir/opencode/agent.md"
        echo -e "${GREEN}  ✅ $(get_text extract_agent_def_official)${NC}"
    fi
    
    # 复制配置文件
    if [ -f "$OPENCODE_DIR/opencode.json" ]; then
        cp "$OPENCODE_DIR/opencode.json" "$target_dir/opencode/config.json"
        echo -e "${GREEN}  ✅ $(get_text extract_config)${NC}"
    fi
    
    # 复制 Skills
    if [ -d "$OPENCODE_DIR/skills" ]; then
        cp -r "$OPENCODE_DIR/skills"/* "$target_dir/shared/SKILLS/" 2>/dev/null || true
        local count=$(ls -A "$target_dir/shared/SKILLS" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$count" -gt 0 ]; then
            echo -e "${GREEN}  ✅ $(get_text extract_skills "$count")${NC}"
        fi
    fi
    
    # 复制 Workflows
    if [ -d "$OPENCODE_DIR/workflows" ]; then
        cp -r "$OPENCODE_DIR/workflows"/* "$target_dir/shared/workflows/" 2>/dev/null || true
        local count=$(ls -A "$target_dir/shared/workflows" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$count" -gt 0 ]; then
            echo -e "${GREEN}  ✅ $(get_text extract_workflows "$count")${NC}"
        fi
    fi
    
    # 复制 Docs
    local docs_dir=$(find "$OPENCODE_DIR" -maxdepth 1 -type d -name "*_docs" | head -n 1)
    if [ -n "$docs_dir" ]; then
        cp -r "$docs_dir"/* "$target_dir/shared/docs/" 2>/dev/null || true
        echo -e "${GREEN}  ✅ $(get_text extract_docs)${NC}"
    fi
}

# 从 Claude Code 提取
extract_from_claude() {
    local agent_name="$1"
    local target_dir="$2"
    
    # 复制 Agent 定义
    if [ -f "$CLAUDE_DIR/agents/$agent_name.md" ]; then
        cp "$CLAUDE_DIR/agents/$agent_name.md" "$target_dir/claude/agent.md"
        echo -e "${GREEN}  ✅ $(get_text extract_claude_agent)${NC}"
    fi
    
    # 复制配置文件（如果有）
    if [ -f "$CLAUDE_DIR/${agent_name}_config.json" ]; then
        cp "$CLAUDE_DIR/${agent_name}_config.json" "$target_dir/opencode/config.json"
        echo -e "${GREEN}  ✅ $(get_text extract_config)${NC}"
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

    echo -e "${GREEN}  ✅ $(get_text readme_created)${NC}"
}

# 部署 Agent
deploy_agent() {
    local agent_name="$1"
    local agent_dir="$2"
    local target="$3"
    
    if [ "$USE_GUM" = true ]; then
        gum spin --spinner dot --title "$(get_text deploying_agent "$agent_name")" -- sleep 0.5
    fi
    
    echo -e "${BLUE}🚀 $(get_text deploying_agent "$agent_name")${NC}"
    
    # 根据目标部署
    case "$target" in
        "OpenCode")
            deploy_to_opencode "$agent_name" "$agent_dir"
            ;;
        "Claude Code")
            deploy_to_claude "$agent_name" "$agent_dir"
            ;;
        "$(get_text both_platforms)")
            deploy_to_opencode "$agent_name" "$agent_dir"
            deploy_to_claude "$agent_name" "$agent_dir"
            ;;
        # 兼容旧逻辑
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
            "🎉 $(get_text deploy_complete "$agent_name")"
    else
        echo ""
        echo -e "${GREEN}🎉 $(get_text deploy_complete "$agent_name")${NC}"
        echo ""
    fi
}

# 部署到 OpenCode
deploy_to_opencode() {
    local agent_name="$1"
    local agent_dir="$2"
    
    if [ -z "$OPENCODE_DIR" ]; then
        echo -e "${YELLOW}⚠️  $(get_text opencode_not_detected)${NC}"
        return
    fi
    
    echo -e "${BLUE}ℹ️  $(get_text deploy_to_opencode "$OPENCODE_DIR")${NC}"
    
    # 1. 复制配置
    if [ -f "$agent_dir/opencode/config.json" ]; then
        cp "$agent_dir/opencode/config.json" "$OPENCODE_DIR/opencode.json"
        echo -e "${GREEN}✅ $(get_text deployed_config "config.json")${NC}"
    elif [ -f "$agent_dir/opencode.json" ]; then
        cp "$agent_dir/opencode.json" "$OPENCODE_DIR/opencode.json"
        echo -e "${GREEN}✅ $(get_text deployed_config "opencode.json")${NC}"
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
        echo -e "${GREEN}✅ $(get_text deployed_agent_def)${NC}"
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
        echo -e "${GREEN}✅ $(get_text deployed_skills "$count")${NC}"
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
        echo -e "${GREEN}✅ $(get_text deployed_workflows "$count")${NC}"
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
        echo -e "${GREEN}✅ $(get_text deployed_docs)${NC}"
    fi

    # 6. 创建项目链接
    mkdir -p "$OPENCODE_DIR/projects"
    if [ ! -L "$OPENCODE_DIR/projects/$agent_name" ]; then
        ln -s "$agent_dir" "$OPENCODE_DIR/projects/$agent_name"
        echo -e "${GREEN}✅ $(get_text created_project_link)${NC}"
    fi
}

# 部署到 Claude Code
deploy_to_claude() {
    local agent_name="$1"
    local agent_dir="$2"
    
    if [ -z "$CLAUDE_DIR" ]; then
        echo -e "${YELLOW}⚠️  $(get_text claude_not_detected)${NC}"
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
        echo -e "${BLUE}ℹ️  $(get_text deploy_to_claude "$CLAUDE_DIR")${NC}"
        
        mkdir -p "$CLAUDE_DIR/agents"
        cp "$claude_def" "$CLAUDE_DIR/agents/${agent_name}.md"
        echo -e "${GREEN}✅ $(get_text deployed_agent_def)${NC}"
        
        local opencode_conf=""
        if [ -f "$agent_dir/opencode/config.json" ]; then
            opencode_conf="$agent_dir/opencode/config.json"
        elif [ -f "$agent_dir/opencode.json" ]; then
            opencode_conf="$agent_dir/opencode.json"
        fi
        
        if [ -n "$opencode_conf" ]; then
            cp "$opencode_conf" "$CLAUDE_DIR/${agent_name}_config.json"
            echo -e "${GREEN}✅ $(get_text deployed_config "config")${NC}"
        fi
        
        mkdir -p "$CLAUDE_DIR/projects"
        if [ ! -L "$CLAUDE_DIR/projects/$agent_name" ]; then
            ln -s "$agent_dir" "$CLAUDE_DIR/projects/$agent_name"
            echo -e "${GREEN}✅ $(get_text created_project_link)${NC}"
        fi
    fi
}

# 环境变量检查
check_env() {
    if [ ! -f "$REPO_ROOT/.env" ]; then
        echo -e "${YELLOW}⚠️  $(get_text env_not_found)${NC}"
        if [ -f "$REPO_ROOT/.env.example" ]; then
            read -p "$(get_text create_env_prompt) (Y/n) " ans
            if [[ -z "$ans" || "$ans" =~ ^[Yy]$ ]]; then
                cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
                echo -e "${GREEN}✅ $(get_text env_created)${NC}"
            fi
        fi
    else
        echo -e "${GREEN}✅ $(get_text env_exists)${NC}"
    fi
    echo ""
}

# 主流程
main() {
    select_language
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
