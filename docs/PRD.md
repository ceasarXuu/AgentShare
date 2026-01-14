# 项目背景
- 创建一个商业机会研究员 Agent，主要目标是通过各种能力组合来探索当下最值得开发的 App/软件产品


# 研究员主要组成部分
- Agent：基于 Claude 
- Browser Plugin: 给 Agent 在浏览器中检索、获取信息的能力，通过开源 MCP 实现：https://github.com/hangwin/mcp-chrome
- 工具集约束：规定研究员能用哪些 tools 


# 模型备选
> 探索阶段先不使用很贵的模型，以跑通为前提

- deepseek-r1 : (openrouter) 
    - openrouter API ：deepseek/deepseek-r1-0528:free
    - APIKEY : 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
- deepseek-v3.2 : (deepseek) 
    - deepseek 官方 API
    - APIKEY : sk-4e36520a0c6e46cb864d1f98b6d55138
- gemini-3-flash-preview
    - google/gemini-3-flash-preview
    - APIKEY : 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