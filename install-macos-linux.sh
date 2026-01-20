#!/bin/bash

# AgentShare 安装脚本
# 支持 macOS 和 Linux 系统
# 安装后可使用 agentshare 命令全局启动

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENTSHARE_SCRIPT="$SCRIPT_DIR/AgentShare.sh"

# 打印 Header
print_header() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║          AgentShare 安装程序 (macOS/Linux)                ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# 检查操作系统
check_os() {
    echo -e "${BLUE}🔍 检测操作系统...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS_TYPE="macos"
        echo -e "${GREEN}✅ 检测到 macOS${NC}"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS_TYPE="linux"
        echo -e "${GREEN}✅ 检测到 Linux${NC}"
    else
        echo -e "${RED}❌ 不支持的操作系统: $OSTYPE${NC}"
        echo -e "${YELLOW}   本脚本仅支持 macOS 和 Linux${NC}"
        exit 1
    fi
    echo ""
}

# 检查环境 (Node.js)
check_environment() {
    echo -e "${BLUE}🔍 检查运行环境...${NC}"
    
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✅ Node.js 已安装 ($(node -v))${NC}"
    else
        echo -e "${YELLOW}⚠️  Node.js 未检测到${NC}"
        echo -e "${YELLOW}   AgentShare 需要 Node.js环境运行。请尽快安装。${NC}"
    fi

    if command -v npm &> /dev/null; then
        echo -e "${GREEN}✅ npm 已安装 ($(npm -v))${NC}"
    else
        echo -e "${YELLOW}⚠️  npm 未检测到${NC}"
    fi
    echo ""
}

# 检查 AgentShare.sh 是否存在
check_agentshare_script() {
    echo -e "${BLUE}🔍 检查 AgentShare.sh...${NC}"
    
    if [ ! -f "$AGENTSHARE_SCRIPT" ]; then
        echo -e "${RED}❌ 未找到 AgentShare.sh${NC}"
        echo -e "${YELLOW}   请确保在 AgentShare 项目根目录运行此脚本${NC}"
        exit 1
    fi
    
    # 确保脚本有执行权限
    chmod +x "$AGENTSHARE_SCRIPT"
    echo -e "${GREEN}✅ AgentShare.sh 已找到${NC}"
    echo ""
}

# 确定安装路径
determine_install_path() {
    echo -e "${BLUE}📁 确定安装路径...${NC}"
    
    # 优先使用 /usr/local/bin (macOS 和大多数 Linux 发行版)
    if [ -d "/usr/local/bin" ] && [ -w "/usr/local/bin" ]; then
        INSTALL_DIR="/usr/local/bin"
        NEED_SUDO=false
    elif [ -d "/usr/local/bin" ]; then
        INSTALL_DIR="/usr/local/bin"
        NEED_SUDO=true
    # 备选: ~/.local/bin (用户级安装)
    elif [ -d "$HOME/.local/bin" ]; then
        INSTALL_DIR="$HOME/.local/bin"
        NEED_SUDO=false
    else
        # 创建 ~/.local/bin
        mkdir -p "$HOME/.local/bin"
        INSTALL_DIR="$HOME/.local/bin"
        NEED_SUDO=false
        
        echo -e "${YELLOW}⚠️  已创建 $HOME/.local/bin${NC}"
        echo -e "${YELLOW}   请确保此目录在 PATH 中${NC}"
    fi
    
    echo -e "${GREEN}✅ 安装目录: $INSTALL_DIR${NC}"
    if [ "$NEED_SUDO" = true ]; then
        echo -e "${YELLOW}   需要 sudo 权限${NC}"
    fi
    echo ""
}

# 创建启动脚本
create_launcher() {
    local launcher_path="$INSTALL_DIR/agentshare"
    
    echo -e "${BLUE}📝 创建启动脚本...${NC}"
    
    # 创建临时文件
    local temp_launcher="/tmp/agentshare_launcher.sh"
    
    cat > "$temp_launcher" << 'EOF'
#!/bin/bash

# AgentShare 全局启动脚本
# 自动查找并执行 AgentShare.sh

# 脚本安装时的路径
AGENTSHARE_SCRIPT="__AGENTSHARE_PATH__"

# 检查脚本是否存在
if [ ! -f "$AGENTSHARE_SCRIPT" ]; then
    echo "错误: 未找到 AgentShare.sh"
    echo "预期路径: $AGENTSHARE_SCRIPT"
    echo ""
    echo "请重新运行安装脚本或手动指定路径:"
    echo "  AGENTSHARE_PATH=/path/to/AgentShare.sh agentshare"
    exit 1
fi

# 执行 AgentShare.sh，传递所有参数
exec "$AGENTSHARE_SCRIPT" "$@"
EOF

    # 替换路径占位符
    sed -i.bak "s|__AGENTSHARE_PATH__|$AGENTSHARE_SCRIPT|g" "$temp_launcher"
    rm -f "$temp_launcher.bak"
    
    # 安装启动脚本
    if [ "$NEED_SUDO" = true ]; then
        sudo mv "$temp_launcher" "$launcher_path"
        sudo chmod +x "$launcher_path"
    else
        mv "$temp_launcher" "$launcher_path"
        chmod +x "$launcher_path"
    fi
    
    echo -e "${GREEN}✅ 启动脚本已创建: $launcher_path${NC}"
    echo ""
}

# 检查 PATH
check_path() {
    echo -e "${BLUE}🔍 检查 PATH 配置...${NC}"
    
    if echo "$PATH" | grep -q "$INSTALL_DIR"; then
        echo -e "${GREEN}✅ $INSTALL_DIR 已在 PATH 中${NC}"
    else
        echo -e "${YELLOW}⚠️  $INSTALL_DIR 不在 PATH 中${NC}"
        echo ""
        echo -e "${YELLOW}请将以下内容添加到您的 shell 配置文件:${NC}"
        
        # 检测 shell 类型
        if [ -n "$ZSH_VERSION" ]; then
            SHELL_CONFIG="~/.zshrc"
        elif [ -n "$BASH_VERSION" ]; then
            SHELL_CONFIG="~/.bashrc"
        else
            SHELL_CONFIG="~/.profile"
        fi
        
        echo -e "${CYAN}export PATH=\"$INSTALL_DIR:\$PATH\"${NC}"
        echo ""
        echo -e "${YELLOW}添加到: $SHELL_CONFIG${NC}"
        echo ""
        
        read -p "是否自动添加到 $SHELL_CONFIG? (Y/n) " add_path
        if [[ -z "$add_path" || "$add_path" =~ ^[Yy]$ ]]; then
            # 展开 ~ 为实际路径
            local config_file="${SHELL_CONFIG/#\~/$HOME}"
            echo "" >> "$config_file"
            echo "# AgentShare PATH" >> "$config_file"
            echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> "$config_file"
            echo -e "${GREEN}✅ 已添加到 $SHELL_CONFIG${NC}"
            echo -e "${YELLOW}   请运行 'source $SHELL_CONFIG' 或重启终端${NC}"
        fi
    fi
    echo ""
}

# 测试安装
test_installation() {
    echo -e "${BLUE}🧪 测试安装...${NC}"
    
    if command -v agentshare &> /dev/null; then
        echo -e "${GREEN}✅ agentshare 命令可用${NC}"
        echo ""
        echo -e "${CYAN}运行以下命令启动 AgentShare:${NC}"
        echo -e "${GREEN}  agentshare${NC}"
    else
        echo -e "${YELLOW}⚠️  agentshare 命令暂不可用${NC}"
        echo -e "${YELLOW}   请重启终端或运行: source ~/.zshrc (或 ~/.bashrc)${NC}"
        echo ""
        echo -e "${CYAN}然后运行:${NC}"
        echo -e "${GREEN}  agentshare${NC}"
    fi
    echo ""
}

# 显示安装摘要
show_summary() {
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}                      安装完成!${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}✅ AgentShare 已成功安装${NC}"
    echo ""
    echo -e "${BLUE}安装信息:${NC}"
    echo -e "  • 脚本位置: ${CYAN}$AGENTSHARE_SCRIPT${NC}"
    echo -e "  • 启动器位置: ${CYAN}$INSTALL_DIR/agentshare${NC}"
    echo -e "  • 操作系统: ${CYAN}$OS_TYPE${NC}"
    echo ""
    echo -e "${BLUE}使用方法:${NC}"
    echo -e "  ${GREEN}agentshare${NC}          # 启动 AgentShare"
    echo -e "  ${GREEN}agentshare --help${NC}   # 查看帮助 (如果支持)"
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
}

# 卸载函数
show_uninstall_info() {
    echo ""
    echo -e "${BLUE}如需卸载，请运行:${NC}"
    if [ "$NEED_SUDO" = true ]; then
        echo -e "${YELLOW}  sudo rm $INSTALL_DIR/agentshare${NC}"
    else
        echo -e "${YELLOW}  rm $INSTALL_DIR/agentshare${NC}"
    fi
    echo ""
}

# 主流程
main() {
    print_header
    check_os
    check_environment
    check_agentshare_script
    determine_install_path
    create_launcher
    check_path
    test_installation
    show_summary
    show_uninstall_info
}

main
