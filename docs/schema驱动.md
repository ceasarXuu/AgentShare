# Schema 驱动方案

## 目标
以平台 schema 作为唯一的输出生成规则，使 Agent/Skill 的部署、提取、扫描、卸载具备一致的配置与行为。

## 核心概念
- Schema：描述平台的路径、格式、能力、scope 与输出模板
- Registry：加载所有 schema，并提供统一的查询与能力判断
- Adapter：将中立标准转换为平台目标格式的执行器

## Schema 文件结构建议
每个平台一个 YAML 文件，放置在 schemas/：
- name：平台标识（全局唯一）
- display_name：展示名
- target_detection：平台安装探测路径
- requires_restart：部署后是否需要重启
- outputs：各类输出项定义
- project_paths：项目级路径定义
- features：支持的能力集合

## outputs 规范
输出项分为两类：
1) 文件类输出（agent_definition、skill_config）
2) 目录类输出（skills、workflows、docs）

字段建议：
- target：目标路径（可含模板变量）
- format：json / markdown_with_frontmatter / directory
- key：当格式为 json 时的根节点 key
- include_body / frontmatter：用于 markdown 生成
- template：可选模板字符串
- optional：是否可缺省

## Scope 解析规则
支持两类 scope：
- global：面向用户目录（如 ~/.config/、~/.claude/）
- project：面向仓库内路径（如 .opencode/、.claude/）

解析优先级：
1) project_paths 中显式定义
2) outputs.target 的相对路径拼接 projectRoot
3) 若缺失则视为不支持

## 中立标准到平台输出的映射流程
1) 读取中立标准（agents/、skills/）
2) 根据 schema 解析目标路径与格式
3) 生成平台目标文件或目录
4) 校验目标格式与可读性
5) 记录变更与结果

## 平台能力声明（features）
建议集合：
- agents
- skills
- workflows
- mcps
- docs

能力未声明的功能必须视为不支持，避免“假实现”。

## 版本与兼容策略
- schema 版本号与平台版本绑定
- 规则变更必须记录在 schema 文件中
- 在 schema 层标记 deprecated 输出，避免破坏旧平台
- 新字段只能追加，不允许静默修改已有语义
- 支持多版本并存，采用明确优先级解析

## 可扩展性与长期维护
- schema 必须允许扩展字段，但不影响已有解析
- 平台能力变化通过 features 与 outputs 明确声明
- 平台私有能力不进入中立标准，只在 schema 中实现
- 未声明能力必须显式为“不支持”，不做兜底

## 验证策略
- 每个平台给出最小可验证样例
- 严禁使用模拟数据或占位实现
- 失败时应显式标记“功能实际未完成”

## 真实环境验证清单
- 使用真实平台安装目录与真实项目目录
- 验证检测路径、输出路径、格式、权限与覆盖优先级
- 覆盖 deploy / scan / extract / uninstall 的全流程
- 记录验证环境、时间与结果证据

## 平台验证矩阵与结果记录
| 平台 | Scope | agents | skills | mcps | 路径/格式/权限/覆盖 | 结果 | 证据 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OpenCode | global + project | 需要 | 需要 | 需要 | 需要 | 待验证 | 待补充 |
| Claude Code | global + project | 需要 | 需要 | 需要 | 需要 | 待验证 | 待补充 |
| Kilo Code | global + project | 不支持 | 需要 | 需要 | 需要 | 待验证 | 待补充 |
| GitHub Copilot | global + project | 需要 | 需要 | 需要 | 需要 | 待验证 | 待补充 |

## 参考链接
- OpenCode Config：<https://opencode.ai/docs/config/>
- OpenCode Agents：<https://opencode.ai/docs/agents/>
- OpenCode Skills：<https://opencode.ai/docs/skills>
- Claude Code Settings：<https://code.claude.com/docs/en/settings>
- Claude Code Skills：<https://code.claude.com/docs/en/skills>
- Kilo Code Skills：<https://kilo.ai/docs/agent-behavior/skills>
- Copilot Agent Skills：<https://code.visualstudio.com/docs/copilot/customization/agent-skills>
