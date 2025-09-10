# 部署配置说明

本项目已配置了完整的 GitHub Actions CI/CD 流程，包含以下工作流：

## 工作流概述

### 1. CI 工作流 (`.github/workflows/ci.yml`)

- **触发条件**: 推送到 `main`/`develop` 分支或创建 PR
- **功能**: 代码质量检查、类型检查、构建测试
- **Node.js 版本**: 18, 20 (矩阵构建)

### 2. GitHub Pages 部署 (`.github/workflows/deploy-pages.yml`)

- **触发条件**: 推送到 `main` 分支或手动触发
- **功能**: 构建并部署到 GitHub Pages
- **URL**: `https://[username].github.io/web-mo/`

### 3. 发布工作流 (`.github/workflows/release.yml`)

- **触发条件**: 创建 release 或推送 tag (如 `v1.0.0`)
- **功能**: 创建发布包 (tar.gz 和 zip)，生成构建信息

### 4. 完整构建部署 (`.github/workflows/build-and-deploy.yml`)

- **触发条件**: 推送、PR、手动触发
- **功能**: 完整的 CI/CD 流程，包含构建、测试、部署、发布

## 使用方法

### 启用 GitHub Pages

1. 进入仓库设置 → Pages
2. 选择 "GitHub Actions" 作为源
3. 推送代码到 `main` 分支即可自动部署

### 创建发布版本

```bash
# 创建并推送标签
git tag v1.0.0
git push origin v1.0.0

# 或在 GitHub 网页上创建 Release
```

### 手动触发部署

在 GitHub 仓库的 Actions 页面可以手动触发工作流

## 本地开发

### 开发环境

```bash
npm install
npm run dev
```

### 构建测试

```bash
# 开发构建
npm run build

# 生产构建
npm run build:prod

# 类型检查
npm run type-check

# 预览构建结果
npm run preview
```

### 服务器运行

```bash
# 启动后端服务器
npm run server

# 开发模式（自动重启）
npm run server:dev
```

## 配置说明

### Vite 配置优化

- **基础路径**: 生产环境自动设置为 `/web-mo/`
- **代码分割**: 自动分离 vendor、monaco、utils 等模块
- **构建优化**: 启用压缩，禁用 sourcemap

### 环境变量

- `NODE_ENV=production`: 生产环境构建
- GitHub Pages 部署时会自动设置正确的基础路径

## 故障排除

### 常见问题

1. **GitHub Pages 404**: 检查仓库设置中的 Pages 配置
2. **构建失败**: 检查 Node.js 版本兼容性
3. **资源路径错误**: 确认 `base` 配置正确

### 调试方法

- 查看 GitHub Actions 日志
- 本地运行 `npm run build:prod` 测试
- 使用 `npm run preview` 预览构建结果

## 文件结构

```
.github/
├── workflows/
│   ├── ci.yml                 # 持续集成
│   ├── deploy-pages.yml       # GitHub Pages 部署
│   ├── release.yml           # 发布管理
│   └── build-and-deploy.yml  # 完整 CI/CD
```

## 依赖说明

- **构建**: Vite + Vue 3 + TypeScript
- **部署**: GitHub Actions + GitHub Pages
- **发布**: 自动创建 tar.gz 和 zip 包
