---
description: 完整的商业机会调研流程 (10-15天)
---

# 完整商业机会调研工作流

本工作流遵循 kuko 的 7 阶段调研方法论,适用于需要深度分析的产品机会研究。

## 前置准备

1. 明确研究目标和时间线
2. 准备研究数据库: `sqlite3 research_data.db`
3. 设置必要的环境变量 (GITHUB_TOKEN, BRAVE_API_KEY)
4. 创建研究输出目录: `mkdir -p research_output`

## 前置检查: 好生意评估 (新增)

**建议先完成快速评估**:
- 使用 `/good-business-assessment` 工作流 (30分钟)
- 确保通过三道防火墙
- 快速评估得分 ≥ 20

**如果是已评估项目**: 确认已有"好生意评估报告",了解核心风险点和优化方向

## 阶段 1: 痛点发现 (Day 1-3)

### 步骤 1.1: 信源选择与筛选
- 使用 `SKILLS/source-vetting/SKILL.md` 评估信源可信度
- 优先级: Reddit > X.com > YouTube > 行业论坛
- 目标: 识别至少 10 个高质量信源

### 步骤 1.2: 执行多源检索
使用 `SKILLS/search-strategy/SKILL.md` 执行搜索:
```
1. 广泛探索: 发现 unknown unknowns
2. 痛点深挖: 验证痛点的广度和深度
3. 负面情绪检索: 用户愤怒时最诚实
4. Excel 替代检索: 发现工具类机会
```

工具使用:
- Brave Search: 执行初步搜索
- Playwright: 抓取 Reddit、X 等平台的动态内容
- Fetch: 获取静态网页内容

### 步骤 1.3: 记录用户原话
- 目标: 收集 100+ 条用户原话
- 使用 SQLite 存储: 
  ```sql
  CREATE TABLE user_quotes (
    id INTEGER PRIMARY KEY,
    source TEXT,
    quote TEXT,
    url TEXT,
    date TEXT,
    upvotes INTEGER,
    category TEXT
  );
  ```

### 步骤 1.4: 痛点聚类与评分
使用 `SKILLS/pain-validation/SKILL.md`:
- 执行聚类分析
- 频率统计
- 痛点严重程度评分 (频率 × 强度 × 付费意愿)
- 目标: 识别 5-10 个核心痛点

**阶段输出**: `research_output/phase1_pain_discovery.md`

---

## 阶段 2: 市场验证 (Day 4-6)

### 步骤 2.1: TAM/SAM/SOM 估算
使用 `SKILLS/market-sizing/SKILL.md`:
- TAM (Total Addressable Market): 理论市场规模
- SAM (Serviceable Available Market): 可服务市场
- SOM (Serviceable Obtainable Market): 实际可获得市场

### 步骤 2.2: 三场景规划
- 乐观场景 (30% 概率)
- 基础场景 (50% 概率)
- 悲观场景 (20% 概率)

### 步骤 2.3: 竞品收入估算
工具使用:
- GitHub Search: 查找开源竞品
- Brave Search: 搜索 "app name revenue estimate"
- Playwright: 抓取 App Store 排名和评论数

### 步骤 2.4: 用户付费意愿验证
- 搜索 "willing to pay for [feature]"
- 分析现有竞品的定价策略
- 评估价格敏感度

**阶段输出**: `research_output/phase2_market_validation.md`

---

## 阶段 3: 竞品深挖 (Day 7-8)

### 步骤 3.1: 竞品识别与分层
使用 `SKILLS/competitive-gap-analysis/SKILL.md`:
- 直接竞品 (同类产品)
- 间接竞品 (替代方案)
- 潜在竞品 (可能进入者)

### 步骤 3.2: 功能-定价-体验矩阵
创建对比表格:
| 竞品 | 核心功能 | 定价 | 用户体验评分 | 差异化点 |
|------|---------|------|-------------|---------|
| A    | ...     | ... | ...         | ...     |

### 步骤 3.3: 用户反馈分析
- 抓取 App Store 1-3 星差评
- 分析用户抱怨的共性
- 识别未被满足的需求

### 步骤 3.4: 功能 Gap 识别
- 列出用户需求清单
- 标记竞品覆盖情况
- 识别最大的 Gap

**阶段输出**: `research_output/phase3_competitive_analysis.md`

---

## 阶段 4: 可行性评估 (Day 9-11)

### 步骤 4.1: 技术可行性
- 评估技术难度 (1-10)
- 识别技术风险
- 估算开发时间

工具使用:
- GitHub Search: 查找相关技术实现
- 评估是否依赖私有 API

### 步骤 4.2: 财务模型
使用 `SKILLS/unit-economics-modeling/SKILL.md`:
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- LTV/CAC Ratio (目标 > 3x)
- Payback Period
- Churn Rate

### 步骤 4.3: 风险评估
使用 `SKILLS/risk-assessment/SKILL.md`:
- 技术风险
- 市场风险
- 监管风险 (App Store 政策)
- 执行风险

### 步骤 4.4: JTBD 分析
使用 `SKILLS/jtbd-root-cause/SKILL.md`:
- 用户真正要完成的任务是什么?
- 5-Why 根因分析
- 深层需求挖掘

**阶段输出**: `research_output/phase4_feasibility_assessment.md`

---

## 阶段 5: 最终决策 (Day 12-15)

### 步骤 5.1: 多方向评分
创建评分矩阵:
| 维度 | 权重 | 评分 (1-10) | 加权分 |
|------|------|------------|--------|
| 市场规模 | 25% | ... | ... |
| 痛点强度 | 20% | ... | ... |
| 竞争程度 | 15% | ... | ... |
| 技术可行性 | 20% | ... | ... |
| 执行能力 | 20% | ... | ... |

### 步骤 5.2: MVP 定义
使用 `SKILLS/decision-and-mvp/SKILL.md`:
- 核心功能清单 (Must-have)
- 次要功能 (Nice-to-have)
- 排除功能 (Not-now)
- MVP 范围界定

### 步骤 5.3: 验证路径设计
- 关键假设列表
- 验证实验设计
- 成功指标定义
- 失败退出条件

### 步骤 5.4: 12 周路线图
- Week 1-2: MVP 开发
- Week 3-4: 内测与迭代
- Week 5-6: 公开测试
- Week 7-8: 数据收集与分析
- Week 9-10: 优化与扩展
- Week 11-12: 增长实验

**阶段输出**: `research_output/phase5_final_decision.md`

---

## 最终报告生成

### 使用报告模板
选择合适的模板:
- 探索性研究: `docs/报告模板/Research Report: Exploration.md`
- 定向研究: `docs/报告模板/Research Report: With a Themed Topic.md`

### 报告结构
1. 执行摘要
2. 研究方法和信源
3. 核心发现
   - 痛点分析
   - 市场规模
   - 竞品格局
4. 机会评估
5. 风险分析
6. MVP 建议
7. 验证路径
8. 下一步行动
9. 附录: 数据来源和参考资料

### 质量自检
- [ ] 用户原话 > 100 条
- [ ] 独立信源 > 10 个
- [ ] 痛点识别 > 5 个
- [ ] 交叉验证率 = 100%
- [ ] 竞品分析 > 5 个
- [ ] TAM/SAM/SOM 全部完成

---

## 工作流完成

最终输出:
- `research_output/final_report.md` - 完整研究报告
- `research_output/mvp_spec.md` - MVP 需求文档
- `research_output/validation_plan.md` - 验证计划
- `research_data.db` - 研究数据库

下一步行动:
1. 与团队评审研究报告
2. 决定 Go/No-Go
3. 如果 Go: 启动 MVP 开发
4. 如果 No-Go: 归档研究,选择下一个方向
