# 软考刷题系统 H5 端

软考（计算机技术与软件专业技术资格考试）刷题系统移动端网页版。

## 技术栈

- Vue 3 + TypeScript
- Vite 5
- Vant 4（UI 组件库，自动导入）
- Pinia（状态管理）
- Vue Router 4
- Axios（HTTP 请求）
- KaTeX（公式渲染）
- Sass

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产包
npm run build

# 代码检查
npm run lint
```

## 设计规范

- 主色：紫色渐变 #6366F1 → #8B5CF6
- 圆角：16px / 12px / 8px 三级体系
- 阴影：4 级阴影系统
- 毛玻璃：backdrop-filter: blur(20px)

## 目录结构

```
src/
├── api/            # API 接口封装
├── components/     # 通用组件
├── layouts/        # 布局组件
├── router/         # 路由
├── stores/         # Pinia 状态
├── styles/         # 样式
├── utils/          # 工具函数
└── views/          # 页面
    ├── auth/       # 认证
    ├── home/       # 首页
    ├── chapter/    # 章节练习
    ├── quiz/       # 做题/解析/报告
    ├── wrong/      # 错题本
    ├── stats/      # 数据统计
    ├── mine/       # 用户中心
    ├── vip/        # 会员中心
    ├── practice/   # 练习（真题/模拟/每日/复习/案例）
    ├── user/       # 用户（笔记/记录/设置）
    └── subject/    # 科目选择
```

## 环境变量

复制 `.env.example` 为 `.env` 并配置后端地址：

```
VITE_API_BASE_URL=/api
```
