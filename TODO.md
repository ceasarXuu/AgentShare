## 部署脚本优化任务

- [x] 优化 deploy.sh 逻辑：
  - [x] 启动后先扫描用户本地的 opencode 和 claude code 的安装路径
  - [x] 打印已安装的 Agent 列表展示给用户
  - [x] 询问用户接下来的操作：
    - (1) 部署 Agent：将当前项目中的 Agent 部署到本地的 opencode 和 claude code
    - (2) 提取 Agent：将用户已安装的 Agent 按照 AgentShare 规范复制到当前项目，实现跨平台共享 