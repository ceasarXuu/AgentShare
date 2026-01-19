## 部署脚本优化任务

- [x] 优化 deploy.sh 逻辑：
  - [x] 启动后先扫描用户本地的 opencode 和 claude code 的安装路径
  - [x] 打印已安装的 Agent 列表展示给用户
  - [x] 询问用户接下来的操作：
    - (1) 部署 Agent：将当前项目中的 Agent 部署到本地的 opencode 和 claude code
    - (2) 提取 Agent：将用户已安装的 Agent 按照 AgentShare 规范复制到当前项目，实现跨平台共享 


## 多系统平台支持扩展
- [x] 支持 windows 安装本项目


## 新增卸载功能
- [x] 支持从各平台已安装的 Agent 中选择卸载（删除对应的配置文件），注意二次提醒用户该操作不可恢复



## 多 Agent 平台支持
- VS Code IDE
  - [ ] IDE 中的 github copilot 入口支持


- TRAE IDE（海外版，不是 TRAE CN）
  - [ ] TRAE Agent 入口支持
  - [ ] IDE 中的 opencode  插件 Agent 支持
  - [ ] IDE 中的 cline 插件 Agent 支持
  - [ ] IDE 中的 kilo code 插件 Agent 支持
