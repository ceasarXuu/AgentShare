#!/bin/bash

# AgentShare Universal Deployment Script
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
# ---------------------------------------------------------

# Global Variables
VERSION="1.0.0"
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
AGENTS_ROOT="$REPO_ROOT/agents"

# 全局变量
OPENCODE_DIR=""
CLAUDE_CODE_DIR=""
declare -a OPENCODE_AGENTS
declare -a CLAUDE_CODE_AGENTS
declare -a PROJECT_AGENTS
USE_GUM=false

# Multi-language Text Resources
LANG_CHOICE="en" # Default to English, will be set by select_language
# 使用格式: text_${lang}_${key}

# 英文文本
text_en_lang_select_title="Language Selection"
text_en_lang_select_prompt="Please select your language:"
text_en_lang_english="English"
text_en_lang_chinese="简体中文 (Simplified Chinese)"
text_en_header_title="AgentShare"
text_en_gum_installed="gum is installed"
text_en_gum_not_installed="gum not detected. gum provides better interactive experience"
text_en_gum_install_prompt="Install gum automatically?"
text_en_gum_installing="Installing gum..."
text_en_gum_using_brew="Using Homebrew to install..."
text_en_gum_no_brew="Homebrew not detected. Please install Homebrew first"
text_en_gum_visit_brew="Visit https://brew.sh to install Homebrew"
text_en_gum_using_apt="Using apt to install..."
text_en_gum_using_yum="Using yum to install..."
text_en_gum_using_pacman="Using pacman to install..."
text_en_gum_unknown_os="Unknown operating system, please install gum manually"
text_en_gum_visit_github="Visit https://github.com/charmbracelet/gum for installation instructions"
text_en_gum_install_success="gum installed successfully"
text_en_gum_install_failed="gum installation failed"
text_en_gum_skip_install="Skipping installation, using traditional interface"
text_en_check_deps="Checking system dependencies..."
text_en_nodejs_installed="Node.js is installed"
text_en_nodejs_not_installed="Node.js is not installed"
text_en_opencode_installed="OpenCode CLI is installed"
text_en_opencode_not_installed="OpenCode CLI is not installed"
text_en_detect_platforms="Detecting platforms..."
text_en_opencode_detected="OpenCode:"
text_en_claude_code_detected="Claude Code:"
text_en_github_copilot_detected="GitHub Copilot (VS Code):"
text_en_not_detected="Not detected"
text_en_env_not_found="Root directory .env not found"
text_en_create_env_prompt="Create .env from .env.example?"
text_en_env_created="Created .env, please fill in API keys"
text_en_env_exists=".env file exists"
text_en_dashboard_title="System Overview"
text_en_installed_agents="Installed Agents"
text_en_project_agents="Project Agents"
text_en_none="(none)"
text_en_menu_deploy="Deploy Agent (Project → Platform)"
text_en_menu_extract="Extract Agent (Platform → Project)"
text_en_menu_uninstall="Uninstall Agent (Remove from Platform)"
text_en_menu_exit="Exit"
text_en_menu_prompt="Please select an operation (↑↓ select, Enter confirm)"
text_en_menu_select_operation="Please select an operation:"
text_en_exit="Exit"
text_en_invalid_choice="Invalid choice"
text_en_no_project_agents="No agents available for deployment in project"
text_en_select_agent_deploy="Select agent to deploy"
text_en_select_agent_extract="Select agent to extract"
text_en_back="Back"
text_en_select_target="Select deployment target"
text_en_confirm_deploy="Confirm deployment of %s to %s?"
text_en_both_platforms="Both platforms"
text_en_all_platforms="All platforms"
text_en_press_enter="Press Enter to continue..."
text_en_select_source_platform="Select source platform"
text_en_no_opencode_agents="No agents installed in OpenCode"
text_en_no_claude_agents="No agents installed in Claude Code"
text_en_no_copilot_agents="No agents installed in GitHub Copilot (VS Code)"
text_en_extracting_agent="Extracting Agent: %s (from %s)"
text_en_agent_exists_overwrite="Agent '%s' already exists, overwrite?"
text_en_overwrite="Overwrite"
text_en_settings="Settings"
text_en_change_language="Change Language"

text_en_uninstall="Uninstall"
text_en_uninstall_confirm="Are you sure you want to uninstall %s from %s? This operation cannot be undone."

text_en_cancel="Cancel"
text_en_extract_complete="Extraction complete: %s"
text_en_extract_agent_def="Extracted agent definition"
text_en_extract_agent_def_official="Extracted agent definition (official)"
text_en_extract_config="Extracted configuration file"
text_en_extract_skills="Extracted %s Skills"
text_en_extract_workflows="Extracted %s Workflows"
text_en_extract_docs="Extracted documentation"
text_en_extract_claude_agent="Extracted Claude Code agent definition"
text_en_extract_copilot_agent="Extracted GitHub Copilot agent definition"
text_en_readme_created="Created README.md"
text_en_deploying_agent="Deploying Agent: %s"
text_en_deploy_complete="%s deployment complete!"
text_en_deploy_to_opencode="Deploying to OpenCode: %s"
text_en_deploy_to_claude_code="Deploying to Claude Code: %s"
text_en_deploy_to_github_copilot="Deploying to GitHub Copilot (VS Code): %s"
text_en_opencode_not_detected="OpenCode not detected, skipping"
text_en_claude_code_not_detected="Claude Code not detected, skipping"
text_en_github_copilot_not_detected="VS Code Copilot agents dir (.github/agents) not found, creating..."
text_en_deployed_config="Deployed configuration: %s"
text_en_deployed_agent_def="Deployed agent definition"
text_en_deployed_skills="Deployed %s Skills"
text_en_deployed_workflows="Deployed %s Workflows"
text_en_deployed_docs="Deployed documentation"
text_en_created_project_link="Created project link"
text_en_restart_required="⚠️  Please restart %s for changes to take effect"
text_en_restart_all="Please restart the following applications:"
text_en_select_agent_mode="Select agent mode for OpenCode:"
text_en_mode_primary="Primary Agent (main conversation)"
text_en_mode_subagent="Subagent (specialized task)"

# 中文文本
text_zh_lang_select_title="语言选择"
text_zh_lang_select_prompt="请选择您的语言："
text_zh_lang_english="English"
text_zh_lang_chinese="简体中文"
text_zh_header_title="AgentShare 智能部署工具"
text_zh_gum_installed="gum 已安装"
text_zh_gum_not_installed="检测到 gum 未安装，gum 可提供更好的交互体验"
text_zh_gum_install_prompt="是否自动安装 gum?"
text_zh_gum_installing="正在安装 gum..."
text_zh_gum_using_brew="使用 Homebrew 安装..."
text_zh_gum_no_brew="未检测到 Homebrew，请先安装 Homebrew"
text_zh_gum_visit_brew="访问 https://brew.sh 安装 Homebrew"
text_zh_gum_using_apt="使用 apt 安装..."
text_zh_gum_using_yum="使用 yum 安装..."
text_zh_gum_using_pacman="使用 pacman 安装..."
text_zh_gum_unknown_os="未识别的操作系统，请手动安装 gum"
text_zh_gum_visit_github="访问 https://github.com/charmbracelet/gum 查看安装说明"
text_zh_gum_install_success="gum 安装成功"
text_zh_gum_install_failed="gum 安装失败"
text_zh_gum_skip_install="跳过安装，将使用传统界面"
text_zh_check_deps="检查系统依赖..."
text_zh_nodejs_installed="Node.js 已安装"
text_zh_nodejs_not_installed="Node.js 未安装"
text_zh_opencode_installed="OpenCode CLI 已安装"
text_zh_opencode_not_installed="OpenCode CLI 未安装"
text_zh_detect_platforms="检测平台..."
text_zh_opencode_detected="OpenCode:"
text_zh_claude_code_detected="Claude Code:"
text_zh_github_copilot_detected="GitHub Copilot (VS Code):"
text_zh_not_detected="未检测到"
text_zh_env_not_found="根目录 .env 不存在"
text_zh_create_env_prompt="是否从 .env.example 创建 .env?"
text_zh_env_created="已创建 .env，请务必填写 API 密钥"
text_zh_env_exists=".env 文件已存在"
text_zh_dashboard_title="系统概览"
text_zh_installed_agents="已安装的 Agents"
text_zh_project_agents="项目中的 Agents"
text_zh_none="(无)"
text_zh_menu_deploy="部署 Agent (项目 → 平台)"
text_zh_menu_extract="提取 Agent (平台 → 项目)"
text_zh_menu_uninstall="卸载 Agent (从平台移除)"
text_zh_menu_exit="退出"
text_zh_menu_prompt="请选择操作 (↑↓ 选择，Enter 确认)"
text_zh_menu_select_operation="请选择操作:"
text_zh_exit="退出"
text_zh_invalid_choice="无效选择"
text_zh_no_project_agents="项目中没有可部署的 Agent"
text_zh_select_agent_deploy="选择要部署的 Agent"
text_zh_select_agent_extract="选择要提取的 Agent"
text_zh_back="返回"
text_zh_select_target="选择部署目标"
text_zh_confirm_deploy="确认部署 %s 到 %s?"
text_zh_both_platforms="两者都部署"
text_zh_all_platforms="所有平台"
text_zh_press_enter="按 Enter 继续..."
text_zh_select_source_platform="选择来源平台"
text_zh_settings="设置"
text_zh_change_language="切换语言"

text_zh_no_opencode_agents="OpenCode 中没有已安装的 Agent"
text_zh_no_claude_agents="Claude Code 中没有已安装的 Agent"
text_zh_no_copilot_agents="GitHub Copilot (VS Code) 中没有已安装的 Agent"
text_zh_uninstall="确认卸载"
text_zh_uninstall_confirm="确定要从 %s 卸载 %s 吗？该操作不可恢复！"

text_zh_extracting_agent="提取 Agent: %s (从 %s)"
text_zh_agent_exists_overwrite="Agent '%s' 已存在，是否覆盖?"
text_zh_overwrite="覆盖"
text_zh_cancel="取消"
text_zh_extract_complete="提取完成: %s"
text_zh_extract_agent_def="已提取 Agent 定义"
text_zh_extract_agent_def_official="已提取 Agent 定义 (官方)"
text_zh_extract_config="已提取配置文件"
text_zh_extract_skills="已提取 %s 个 Skills"
text_zh_extract_workflows="已提取 %s 个 Workflows"
text_zh_extract_docs="已提取文档"
text_zh_extract_claude_agent="已提取 Claude Code Agent 定义"
text_zh_extract_copilot_agent="已提取 GitHub Copilot Agent 定义"
text_zh_readme_created="已创建 README.md"
text_zh_deploying_agent="开始部署 Agent: %s"
text_zh_deploy_complete="%s 部署完成!"
text_zh_deploy_to_opencode="部署到 OpenCode: %s"
text_zh_deploy_to_claude_code="部署到 Claude Code: %s"
text_zh_deploy_to_github_copilot="部署到 GitHub Copilot (VS Code): %s"
text_zh_opencode_not_detected="未检测到 OpenCode，跳过"
text_zh_claude_code_not_detected="未检测到 Claude Code，跳过"
text_zh_github_copilot_not_detected="未找到 .github/agents 目录，将自动创建..."
text_zh_deployed_config="已部署配置: %s"
text_zh_deployed_agent_def="已部署 Agent 定义"
text_zh_deployed_skills="已部署 %s 个 Skills"
text_zh_deployed_workflows="已部署 %s 个 Workflows"
text_zh_deployed_docs="已部署文档"
text_zh_created_project_link="已创建项目链接"
text_zh_restart_required="⚠️  请重启 %s 以使更改生效"
text_zh_restart_all="请重启以下应用程序："
text_zh_select_agent_mode="选择 OpenCode Agent 模式："
text_zh_mode_primary="主 Agent (主对话)"
text_zh_mode_subagent="子 Agent (专门任务)"

# 获取文本的辅助函数 (Bash 3 兼容)
get_text() {
    local key="$1"
    shift
    local var_name="text_${LANG_CHOICE}_${key}"
    local text="${!var_name}"
    
    # 支持参数替换 (使用 printf 格式)
    if [ $# -gt 0 ]; then
        printf "$text" "$@"
    else
        echo "$text"
    fi
}

# 确认覆盖
confirm_overwrite() {
    local name="$1"
    
    if [ "$USE_GUM" = true ]; then
        if ! gum confirm "$(get_text agent_exists_overwrite "$name")" --default=false --affirmative="$(get_text overwrite)" --negative="$(get_text cancel)"; then
            return 1
        fi
    else
        read -p "$(get_text agent_exists_overwrite "$name") (y/N) " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    return 0
}

# 检测 gum
if command -v gum &> /dev/null; then
    USE_GUM=true
fi


# 配置文件
CONFIG_DIR="$HOME/.config/agentshare"
CONFIG_FILE="$CONFIG_DIR/config"

# 加载配置
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        if grep -q "^LANGUAGE=" "$CONFIG_FILE"; then
            LANGUAGE=$(grep "^LANGUAGE=" "$CONFIG_FILE" | cut -d'=' -f2)
        fi
    fi
}

# 保存配置
save_config() {
    local key="$1"
    local value="$2"
    
    mkdir -p "$CONFIG_DIR"
    
    if [ ! -f "$CONFIG_FILE" ]; then
        touch "$CONFIG_FILE"
    fi
    
    if grep -q "^$key=" "$CONFIG_FILE"; then
        # MacOS sed
        sed -i '' "s/^$key=.*/$key=$value/" "$CONFIG_FILE"
    else
        echo "$key=$value" >> "$CONFIG_FILE"
    fi
}

# 语言选择
select_language() {
    local force_select="$1"
    
    # 尝试加载配置
    load_config
    if [ -n "$LANGUAGE" ] && [ "$force_select" != "true" ]; then
        LANG_CHOICE="$LANGUAGE"
        return
    fi
    
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
    
    # 保存设置
    LANGUAGE="$LANG_CHOICE"
    save_config "LANGUAGE" "$LANGUAGE"
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
        echo -e "${BLUE}============================================================${NC}"
        printf "${BLUE}%*s${NC}\n" $(( ( 60 + $(echo -n "$(get_text header_title)" | wc -c) ) / 2 )) "$(get_text header_title)"
        echo -e "${BLUE}============================================================${NC}"
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
        CLAUDE_CODE_DIR="$HOME/.claude"
    elif [ -d "$HOME/.config/claude" ]; then
        CLAUDE_CODE_DIR="$HOME/.config/claude"
    elif [ -d "$HOME/Library/Application Support/Claude" ]; then
        CLAUDE_CODE_DIR="$HOME/Library/Application Support/Claude"
    fi
    
    
    # 检测 VS Code Copilot (Code/User/prompts 目录)
    # 根据实际测试，VS Code 将自定义 agents 存储在 prompts 文件夹
    if [[ "$OSTYPE" == "darwin"* ]]; then
        GITHUB_COPILOT_DIR="$HOME/Library/Application Support/Code/User/prompts"
    else
        GITHUB_COPILOT_DIR="$HOME/.config/Code/User/prompts"
    fi



    # Windows 路径增强检测 (Git Bash)
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        if command -v cygpath &> /dev/null; then
            # 获取 APPDATA 路径 (通常是 AppData/Roaming)
            local appdata_roaming=""
            if [ -n "$APPDATA" ]; then
                appdata_roaming=$(cygpath -u "$APPDATA" 2>/dev/null)
            fi
            
            if [ -n "$appdata_roaming" ]; then
                # Windows Code/User/prompts 目录
                GITHUB_COPILOT_DIR="$appdata_roaming/Code/User/prompts"
                
                # OpenCode 检测
                if [ -z "$OPENCODE_DIR" ]; then
                    if [ -d "$appdata_roaming/OpenCode" ]; then
                        OPENCODE_DIR="$appdata_roaming/OpenCode"
                    elif [ -d "$appdata_roaming/opencode" ]; then
                        OPENCODE_DIR="$appdata_roaming/opencode"
                    elif [ -d "$appdata_roaming/Code/User/globalStorage/opencode" ]; then
                        # 假设 OpenCode 作为 VSCode 插件可能是这个路径，待定
                         : 
                    fi
                fi
                
                # Claude Code 检测
                if [ -z "$CLAUDE_CODE_DIR" ]; then
                    if [ -d "$appdata_roaming/Claude" ]; then
                        CLAUDE_CODE_DIR="$appdata_roaming/Claude"
                    elif [ -d "$appdata_roaming/claude" ]; then
                        CLAUDE_CODE_DIR="$appdata_roaming/claude"
                    elif [ -d "$appdata_roaming/Anthropic/Claude" ]; then
                        CLAUDE_CODE_DIR="$appdata_roaming/Anthropic/Claude"
                    fi
                fi
            fi
        fi
    fi
    
    # 显示检测结果
    if [ -n "$OPENCODE_DIR" ]; then
        echo -e "${GREEN}  ✅ $(get_text opencode_detected) $OPENCODE_DIR${NC}"
    else
        echo -e "${YELLOW}  ⚠️  $(get_text opencode_detected) $(get_text not_detected)${NC}"
    fi
    
    if [ -n "$CLAUDE_CODE_DIR" ]; then
        echo -e "${GREEN}  ✅ $(get_text claude_detected) $CLAUDE_CODE_DIR${NC}"
    else
        echo -e "${YELLOW}  ⚠️  $(get_text claude_detected) $(get_text not_detected)${NC}"
    fi
    
    if [ -d "$GITHUB_COPILOT_DIR" ]; then
        echo -e "${GREEN}  ✅ $(get_text copilot_detected) $GITHUB_COPILOT_DIR${NC}"
    else
        echo -e "${YELLOW}  ⚠️  $(get_text copilot_detected) $(get_text not_detected) (target: $GITHUB_COPILOT_DIR)${NC}"
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
    CLAUDE_CODE_AGENTS=()
    if [ -n "$CLAUDE_CODE_DIR" ] && [ -d "$CLAUDE_CODE_DIR/agents" ]; then
        for agent_file in "$CLAUDE_CODE_DIR/agents"/*.md; do
            if [ -f "$agent_file" ]; then
                agent_name=$(basename "$agent_file" .md)
                CLAUDE_CODE_AGENTS+=("$agent_name")
            fi
        done
    fi
    
    # 扫描 VS Code Copilot Agents
    GITHUB_COPILOT_AGENTS=()
    if [ -n "$GITHUB_COPILOT_DIR" ]; then
        for agent_file in "$GITHUB_COPILOT_DIR"/*.agent.md; do
            if [ -f "$agent_file" ]; then
                # 去掉 .agent 前缀
                agent_name=$(basename "$agent_file" .agent.md)
                GITHUB_COPILOT_AGENTS+=("$agent_name")
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
            "$(echo -e "📦 $(get_text installed_agents)\n\n  OpenCode:\n$(for agent in "${OPENCODE_AGENTS[@]}"; do echo "    • $agent"; done)\n$([ ${#OPENCODE_AGENTS[@]} -eq 0 ] && echo "    $(get_text none)")\n\n  Claude Code:\n$(for agent in "${CLAUDE_CODE_AGENTS[@]}"; do echo "    • $agent"; done)\n$([ ${#CLAUDE_CODE_AGENTS[@]} -eq 0 ] && echo "    $(get_text none)")\n\n  GitHub Copilot:\n$(for agent in "${GITHUB_COPILOT_AGENTS[@]}"; do echo "    • $agent"; done)\n$([ ${#GITHUB_COPILOT_AGENTS[@]} -eq 0 ] && echo "    $(get_text none)")")"
        
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
        if [ ${#CLAUDE_CODE_AGENTS[@]} -gt 0 ]; then
            for agent in "${CLAUDE_CODE_AGENTS[@]}"; do
                echo -e "    - $agent"
            done
        else
            echo -e "    ${YELLOW}$(get_text none)${NC}"
        fi

        echo -e "  ${GREEN}GitHub Copilot:${NC}"
        if [ ${#GITHUB_COPILOT_AGENTS[@]} -gt 0 ]; then
            for agent in "${GITHUB_COPILOT_AGENTS[@]}"; do
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
# 设置菜单
settings_menu() {
    if [ "$USE_GUM" = true ]; then
        choice=$(gum choose "$(get_text change_language)" "$(get_text back)" \
            --header="$(get_text settings)" \
            --cursor.foreground="212")
    else
        echo -e "${GREEN}$(get_text settings)${NC}"
        select choice in "$(get_text change_language)" "$(get_text back)"; do
            break
        done
    fi
    
    if [ "$choice" == "$(get_text change_language)" ]; then
        select_language "true"
        main_menu
        return
    fi
    
    main_menu
}

# 主菜单
main_menu() {
    # 刷新数据和界面
    scan_installed_agents
    scan_project_agents
    print_header
    display_dashboard

    if [ "$USE_GUM" = true ]; then
        choice=$(gum choose \
            "$(get_text menu_deploy)" \
            "$(get_text menu_extract)" \
            "$(get_text menu_uninstall)" \
            "$(get_text settings)" \
            "$(get_text menu_exit)" \
            --header="$(get_text menu_prompt)" \
            --cursor.foreground="212" \
            --selected.foreground="212" \
            --header.foreground="99")
    else
        echo -e "${GREEN}$(get_text menu_select_operation)${NC}"
        select choice in "$(get_text menu_deploy)" "$(get_text menu_extract)" "$(get_text menu_uninstall)" "$(get_text settings)" "$(get_text menu_exit)"; do
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
        "$(get_text menu_uninstall)")
            uninstall_agent_menu
            ;;
        "$(get_text settings)")
            settings_menu
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
            "GitHub Copilot (VS Code)" \
            "$(get_text all_platforms)" \
            --header="$(get_text select_target)" \
            --cursor.foreground="212")
        
        if gum confirm "$(get_text confirm_deploy "$agent" "$target")"; then
            deploy_agent "$agent" "$AGENTS_ROOT/$agent" "$target"
        fi
    else
        echo -e "${GREEN}$(get_text select_target):${NC}"
        select target in "OpenCode" "Claude Code" "GitHub Copilot (VS Code)" "$(get_text all_platforms)"; do
            break
        done
        
        read -p "$(get_text confirm_deploy "$agent" "$target") (y/N) " confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            deploy_agent "$agent" "$AGENTS_ROOT/$agent" "$target"
        fi
    fi
    
    main_menu
}

# 提取 Agent 菜单
extract_agent_menu() {
    if [ "$USE_GUM" = true ]; then
        platform=$(gum choose "OpenCode" "Claude Code" "GitHub Copilot (VS Code)" "$(get_text back)" \
            --header="$(get_text select_source_platform)" \
            --cursor.foreground="212")
    else
        echo -e "${GREEN}$(get_text select_source_platform):${NC}"
        select platform in "OpenCode" "Claude Code" "GitHub Copilot (VS Code)" "$(get_text back)"; do
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
            if [ ${#CLAUDE_CODE_AGENTS[@]} -eq 0 ]; then
                if [ "$USE_GUM" = true ]; then
                    gum style --foreground 212 "⚠️  $(get_text no_claude_agents)"
                    sleep 2
                else
                    echo -e "${YELLOW}⚠️  $(get_text no_claude_agents)${NC}"
                fi
                extract_agent_menu
                return
            fi
            extract_from_platform "claude_code" "${CLAUDE_CODE_AGENTS[@]}"
            ;;
        "GitHub Copilot (VS Code)")
            if [ ${#GITHUB_COPILOT_AGENTS[@]} -eq 0 ]; then
                if [ "$USE_GUM" = true ]; then
                    gum style --foreground 212 "⚠️  $(get_text no_copilot_agents)"
                    sleep 2
                else
                    echo -e "${YELLOW}⚠️  $(get_text no_copilot_agents)${NC}"
                fi
                extract_agent_menu
                return
            fi
            extract_from_platform "github_copilot" "${GITHUB_COPILOT_AGENTS[@]}"
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
    
    main_menu
}


# 卸载 Agent 菜单
uninstall_agent_menu() {
    # 选择平台
    local platform=""
    if [ "$USE_GUM" = true ]; then
        platform=$(gum choose "OpenCode" "Claude Code" "GitHub Copilot (VS Code)" "$(get_text back)" \
            --header="$(get_text select_source_platform)" \
            --cursor.foreground="212")
    else
        echo -e "${GREEN}$(get_text select_source_platform):${NC}"
        select platform in "OpenCode" "Claude Code" "GitHub Copilot (VS Code)" "$(get_text back)"; do
            break
        done
    fi
    
    if [ "$platform" == "$(get_text back)" ] || [ -z "$platform" ]; then
        main_menu
        return
    fi
    
    # 获取该平台的已安装 Agents
    local agents=()
    case "$platform" in
        "OpenCode")
            agents=("${OPENCODE_AGENTS[@]}")
            ;;
        "Claude Code")
            agents=("${CLAUDE_CODE_AGENTS[@]}")
            ;;
        "GitHub Copilot (VS Code)")
            agents=("${GITHUB_COPILOT_AGENTS[@]}")
            ;;
    esac
    
    if [ ${#agents[@]} -eq 0 ]; then
        if [ "$USE_GUM" = true ]; then
            gum style --foreground 212 "⚠️  该平台没有已安装的 Agent"
        else
            echo -e "${YELLOW}⚠️  该平台没有已安装的 Agent${NC}"
        fi
        if [ "$USE_GUM" = true ]; then
            gum input --placeholder="$(get_text press_enter)" > /dev/null
        else
            read -p "$(get_text press_enter)"
        fi
        main_menu
        return
    fi
    
    # 选择要卸载的 Agent
    local agent_name=""
    if [ "$USE_GUM" = true ]; then
        agent_name=$(gum choose "${agents[@]}" "$(get_text back)" \
            --header="选择要卸载的 Agent:" \
            --cursor.foreground="212")
    else
        echo -e "${GREEN}选择要卸载的 Agent:${NC}"
        select agent_name in "${agents[@]}" "$(get_text back)"; do
            break
        done
    fi
    
    if [ "$agent_name" == "$(get_text back)" ] || [ -z "$agent_name" ]; then
        uninstall_agent_menu
        return
    fi
    
    # 确认卸载
    local confirm_msg=$(get_text uninstall_confirm "$agent_name" "$platform")
    
    if [ "$USE_GUM" = true ]; then
        if ! gum confirm "$confirm_msg" --default=false --affirmative="$(get_text uninstall)" --negative="$(get_text cancel)"; then
            uninstall_agent_menu
            return
        fi
    else
        read -p "$confirm_msg (y/N) " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            uninstall_agent_menu
            return
        fi
    fi

    
    # 执行卸载
    uninstall_agent "$agent_name" "$platform"
    
    main_menu
}

# 执行卸载
uninstall_agent() {
    local agent_name="$1"
    local platform="$2"
    
    case "$platform" in
        "OpenCode")
            if [ -f "$OPENCODE_DIR/agents/${agent_name}.md" ]; then
                rm -f "$OPENCODE_DIR/agents/${agent_name}.md"
                echo -e "${GREEN}✅ 已从 OpenCode 卸载 $agent_name${NC}"
            fi
            ;;
        "Claude Code")
            if [ -f "$CLAUDE_CODE_DIR/agents/${agent_name}.md" ]; then
                rm -f "$CLAUDE_CODE_DIR/agents/${agent_name}.md"
                echo -e "${GREEN}✅ 已从 Claude Code 卸载 $agent_name${NC}"
            fi
            ;;
        "GitHub Copilot (VS Code)")
            if [ -f "$GITHUB_COPILOT_DIR/${agent_name}.agent.md" ]; then
                rm -f "$GITHUB_COPILOT_DIR/${agent_name}.agent.md"
                echo -e "${GREEN}✅ 已从 GitHub Copilot 卸载 $agent_name${NC}"
            fi
            ;;
    esac
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
        if ! confirm_overwrite "$agent_name"; then
            return
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
    elif [ "$platform" == "copilot" ]; then
        extract_from_copilot "$agent_name" "$target_dir"
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
    if [ -f "$CLAUDE_CODE_DIR/agents/$agent_name.md" ]; then
        cp "$CLAUDE_CODE_DIR/agents/$agent_name.md" "$target_dir/claude/agent.md"
        echo -e "${GREEN}  ✅ $(get_text extract_claude_agent)${NC}"
    fi
    
    # 复制配置文件（如果有）
    if [ -f "$CLAUDE_CODE_DIR/${agent_name}_config.json" ]; then
        cp "$CLAUDE_CODE_DIR/${agent_name}_config.json" "$target_dir/opencode/config.json"
        echo -e "${GREEN}  ✅ $(get_text extract_config)${NC}"
    fi
}

# 从 Copilot 提取
extract_from_copilot() {
    local agent_name="$1"
    local target_dir="$2"
    local source_file="$GITHUB_COPILOT_DIR/$agent_name.agent.md"
    
    if [ -f "$source_file" ]; then
        # 直接复制整个文件作为 opencode/agent.md (结构相似)
        # 或者可以选择去除 frontmatter，但这比较复杂且可能不必要
        cp "$source_file" "$target_dir/opencode/agent.md"
        echo -e "${GREEN}  ✅ $(get_text extract_copilot_agent)${NC}"
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
            deploy_to_claude_code "$agent_name" "$agent_dir"
            ;;
        "GitHub Copilot (VS Code)")
            deploy_to_github_copilot "$agent_name" "$agent_dir"
            ;;
        "$(get_text both_platforms)")
            deploy_to_opencode "$agent_name" "$agent_dir"
            deploy_to_claude_code "$agent_name" "$agent_dir"
            ;;
        "$(get_text all_platforms)")
            deploy_to_opencode "$agent_name" "$agent_dir"
            deploy_to_claude_code "$agent_name" "$agent_dir"
            deploy_to_github_copilot "$agent_name" "$agent_dir"
            ;;
        # 兼容旧逻辑
        "两者都部署")
            deploy_to_opencode "$agent_name" "$agent_dir"
            deploy_to_claude_code "$agent_name" "$agent_dir"
            ;;
    esac
    
    # 显示部署完成消息
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
    
    # 显示重启提示（OpenCode 和 Claude Code 需要重启，VS Code Copilot 不需要）
    local restart_needed=()
    case "$target" in
        "OpenCode")
            restart_needed+=("OpenCode")
            ;;
        "Claude Code")
            restart_needed+=("Claude Code")
            ;;
        "GitHub Copilot (VS Code)")
            # VS Code Copilot 不需要重启
            ;;
        "$(get_text both_platforms)"|"两者都部署")
            restart_needed+=("OpenCode" "Claude Code")
            ;;
        "$(get_text all_platforms)")
            restart_needed+=("OpenCode" "Claude Code")
            # VS Code Copilot 不需要重启，不添加到列表
            ;;
    esac
    
    if [ ${#restart_needed[@]} -gt 0 ]; then
        echo ""
        if [ ${#restart_needed[@]} -eq 1 ]; then
            echo -e "${YELLOW}$(get_text restart_required "${restart_needed[0]}")${NC}"
        else
            echo -e "${YELLOW}$(get_text restart_all)${NC}"
            for app in "${restart_needed[@]}"; do
                echo -e "${YELLOW}  • $app${NC}"
            done
        fi
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
    
    # 冲突检测
    if [ -f "$OPENCODE_DIR/agents/${agent_name}.md" ]; then
        if ! confirm_overwrite "$agent_name (OpenCode)"; then
            echo -e "${YELLOW}🚫 Deployment cancelled.${NC}"
            return
        fi
    fi
    
    # 1. 复制配置 (去除 model 配置，避免无效模型)
    if [ -f "$agent_dir/opencode/config.json" ]; then
        grep -v '"model":' "$agent_dir/opencode/config.json" > "$OPENCODE_DIR/opencode.json"
        echo -e "${GREEN}✅ $(get_text deployed_config "config.json")${NC}"
    elif [ -f "$agent_dir/opencode.json" ]; then
        grep -v '"model":' "$agent_dir/opencode.json" > "$OPENCODE_DIR/opencode.json"
        echo -e "${GREEN}✅ $(get_text deployed_config "config.json")${NC}"
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
        # 询问用户选择 agent 模式
        local agent_mode="primary"
        if [ "$USE_GUM" = true ]; then
            local mode_choice=$(gum choose \
                "$(get_text mode_primary)" \
                "$(get_text mode_subagent)" \
                --header="$(get_text select_agent_mode)")
            if [[ "$mode_choice" == *"$(get_text mode_subagent)"* ]]; then
                agent_mode="subagent"
            fi
        else
            echo ""
            echo "$(get_text select_agent_mode)"
            select mode_choice in "$(get_text mode_primary)" "$(get_text mode_subagent)"; do
                if [ "$mode_choice" = "$(get_text mode_subagent)" ]; then
                    agent_mode="subagent"
                fi
                break
            done
        fi
        
        # 部署 agent 定义，去除 model 配置并设置 mode
        sed -e '/^model:/d' -e "s/^mode:.*/mode: $agent_mode/" "$agent_def" > "$OPENCODE_DIR/agents/${agent_name}.md"
        
        # 如果原文件没有 mode 字段，在 frontmatter 中添加
        if ! grep -q "^mode:" "$agent_def"; then
            # 在 frontmatter 的最后一行（第一个 --- 之后的位置）插入 mode
            sed -i.bak "/^---$/a\\
mode: $agent_mode
" "$OPENCODE_DIR/agents/${agent_name}.md"
            rm -f "$OPENCODE_DIR/agents/${agent_name}.md.bak"
        fi
        
        echo -e "${GREEN}✅ $(get_text deployed_agent_def)${NC}"
    fi

    # 3. 部署 Skills (新结构优先)
    local skills_src=""
    if [ -d "$agent_dir/skills" ]; then
        skills_src="$agent_dir/skills"
    elif [ -d "$agent_dir/shared/SKILLS" ]; then
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

    # 4. 部署 Workflows (新结构优先)
    local workflows_src=""
    if [ -d "$agent_dir/workflows" ]; then
        workflows_src="$agent_dir/workflows"
    elif [ -d "$agent_dir/shared/workflows" ]; then
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
    
    # 5. 部署 Docs (新结构优先)
    local docs_src=""
    if [ -d "$agent_dir/docs" ]; then
        docs_src="$agent_dir/docs"
    elif [ -d "$agent_dir/shared/docs" ]; then
        docs_src="$agent_dir/shared/docs"
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
deploy_to_claude_code() {
    local agent_name="$1"
    local agent_dir="$2"
    
    if [ -z "$CLAUDE_CODE_DIR" ]; then
        echo -e "${YELLOW}⚠️  $(get_text claude_not_detected)${NC}"
        return
    fi
    
    # 新结构：优先使用根目录的 agent.md
    local claude_def=""
    if [ -f "$agent_dir/agent.md" ]; then
        claude_def="$agent_dir/agent.md"
    elif [ -f "$agent_dir/claude/agent.md" ]; then
        claude_def="$agent_dir/claude/agent.md"
    elif [ -f "$agent_dir/CLAUDE.md" ]; then
        claude_def="$agent_dir/CLAUDE.md"
    fi

    if [ -n "$claude_def" ]; then
        echo ""
        echo -e "${BLUE}ℹ️  $(get_text deploy_to_claude_code "$CLAUDE_CODE_DIR")${NC}"
        
        # 冲突检测
        if [ -f "$CLAUDE_CODE_DIR/agents/${agent_name}.md" ]; then
            if ! confirm_overwrite "$agent_name (Claude Code)"; then
                echo -e "${YELLOW}🚫 Deployment cancelled.${NC}"
                return
            fi
        fi
        
        mkdir -p "$CLAUDE_CODE_DIR/agents"
        # Claude Code 需要 frontmatter 中的 model 字段，直接复制
        cp "$claude_def" "$CLAUDE_CODE_DIR/agents/${agent_name}.md"
        echo -e "${GREEN}✅ $(get_text deployed_agent_def)${NC}"
        
        local opencode_conf=""
        if [ -f "$agent_dir/opencode/config.json" ]; then
            opencode_conf="$agent_dir/opencode/config.json"
        elif [ -f "$agent_dir/opencode.json" ]; then
            opencode_conf="$agent_dir/opencode.json"
        fi
        
        if [ -n "$opencode_conf" ]; then
            grep -v '"model":' "$opencode_conf" > "$CLAUDE_CODE_DIR/${agent_name}_config.json"
            echo -e "${GREEN}✅ $(get_text deployed_config "config")${NC}"
        fi
        
        # 部署 Skills
        local skills_src=""
        if [ -d "$agent_dir/skills" ]; then
            skills_src="$agent_dir/skills"
        elif [ -d "$agent_dir/shared/SKILLS" ]; then
            skills_src="$agent_dir/shared/SKILLS"
        elif [ -d "$agent_dir/SKILLS" ]; then
            skills_src="$agent_dir/SKILLS"
        fi

        if [ -n "$skills_src" ]; then
            # 这里的路径是用户指定的 ~/.claude/skills
            local claude_skills_dir="$HOME/.claude/skills"
            mkdir -p "$claude_skills_dir"
            
            # 复制 skills，如果目标已存在，会合并/覆盖
            cp -r "$skills_src/"* "$claude_skills_dir/"
            # echo -e "${GREEN}✅ Deployed skills to $claude_skills_dir${NC}"
        fi

        # 部署 Workflows
        local workflows_src=""
        if [ -d "$agent_dir/workflows" ]; then
            workflows_src="$agent_dir/workflows"
        elif [ -d "$agent_dir/shared/workflows" ]; then
            workflows_src="$agent_dir/shared/workflows"
        elif [ -d "$agent_dir/.agent/workflows" ]; then
            workflows_src="$agent_dir/.agent/workflows"
        fi

        if [ -n "$workflows_src" ]; then
            mkdir -p "$CLAUDE_CODE_DIR/workflows"
            cp -r "$workflows_src/"* "$CLAUDE_CODE_DIR/workflows/"
        fi
        
        mkdir -p "$CLAUDE_CODE_DIR/projects"
        if [ ! -L "$CLAUDE_CODE_DIR/projects/$agent_name" ]; then
            ln -s "$agent_dir" "$CLAUDE_CODE_DIR/projects/$agent_name"
            echo -e "${GREEN}✅ $(get_text created_project_link)${NC}"
        fi
    fi
}

# 部署到 VS Code Copilot
deploy_to_github_copilot() {
    local agent_name="$1"
    local agent_dir="$2"
    
    local target_dir="${GITHUB_COPILOT_DIR:-$GITHUB_COPILOT_DIR_TARGET}"
    
    if [ ! -d "$target_dir" ]; then
        echo -e "${YELLOW}⚠️  $(get_text copilot_not_detected)${NC}"
        mkdir -p "$target_dir"
    fi
    
    echo ""
    echo -e "${BLUE}ℹ️  $(get_text deploy_to_github_copilot "$target_dir")${NC}"
    
    # 新结构：优先使用根目录的 agent.md
    local source_def=""
    if [ -f "$agent_dir/agent.md" ]; then
        source_def="$agent_dir/agent.md"
    elif [ -f "$agent_dir/copilot/agent.md" ]; then
        source_def="$agent_dir/copilot/agent.md"
    elif [ -f "$agent_dir/opencode/agent.md" ]; then
        source_def="$agent_dir/opencode/agent.md"
    elif [ -f "$agent_dir/claude/agent.md" ]; then
        source_def="$agent_dir/claude/agent.md"
    else
        source_def=$(find "$agent_dir" -maxdepth 1 -name "*.md" | grep -v "README" | head -n 1)
    fi
    
    if [ -n "$source_def" ]; then
        local target_file="$target_dir/${agent_name}.agent.md"
        
        # 冲突检测
        if [ -f "$target_file" ]; then
            if ! confirm_overwrite "$agent_name (GitHub Copilot)"; then
                echo -e "${YELLOW}🚫 Deployment cancelled.${NC}"
                return
            fi
        fi
        
        # 如果使用专用的 copilot/agent.md，直接复制
        if [[ "$source_def" == *"/copilot/agent.md" ]]; then
            cp "$source_def" "$target_file"
            echo -e "${GREEN}✅ $(get_text deployed_agent_def)${NC}"
        else
            # 否则动态生成（兼容旧逻辑）
            local description="$agent_name custom agent"
            
            # 写入 YAML Frontmatter
            echo "---" > "$target_file"
            echo "name: $agent_name" >> "$target_file"
            echo "description: $description" >> "$target_file"
            echo "tools: []" >> "$target_file" 
            echo "---" >> "$target_file"
            echo "" >> "$target_file"
            
            # 写入正文 (去除原有的 Frontmatter 以避免冲突)
            awk '
                NR==1 { if ($0 == "---") { in_fm=1 } else { print $0 } }
                NR>1 {
                    if (in_fm) {
                        if ($0 == "---") { in_fm=0 }
                    } else {
                        print $0
                    }
                }
            ' "$source_def" >> "$target_file"
            
            echo -e "${GREEN}✅ $(get_text deployed_agent_def)${NC}"
        fi
        
        # 部署 Skills
        local skills_src=""
        if [ -d "$agent_dir/skills" ]; then
            skills_src="$agent_dir/skills"
        elif [ -d "$agent_dir/shared/SKILLS" ]; then
            skills_src="$agent_dir/shared/SKILLS"
        elif [ -d "$agent_dir/SKILLS" ]; then
            skills_src="$agent_dir/SKILLS"
        fi

        if [ -n "$skills_src" ]; then
            # 这里的路径是用户指定的 ~/.github/skills
            local github_skills_dir="$HOME/.github/skills"
            mkdir -p "$github_skills_dir"
            
            cp -r "$skills_src/"* "$github_skills_dir/"
            # echo -e "${GREEN}✅ Deployed skills to $github_skills_dir${NC}"
        fi
    else
        echo -e "${RED}❌ Agent definition not found, skipping Copilot deployment.${NC}"
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
