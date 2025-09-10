# web-mo - Vue 3 + TypeScript + Vite

一个基于 Vue 3 + TypeScript + Vite 的现代化 Web 应用项目。

## 🚀 快速开始

### 开发环境

```bash
npm install
npm run dev
```

### 构建部署

```bash
# 开发构建
npm run build

# 生产构建（无类型检查）
npm run build:no-check

# 生产构建（带类型检查）
npm run build:prod
```

## 📦 GitHub Actions 自动化

本项目配置了完整的 CI/CD 流程：

- **CI 检查**: 推送到 `main`/`develop` 分支时自动运行类型检查和构建测试
- **GitHub Pages 部署**: 推送到 `main` 分支时自动部署到 GitHub Pages
- **版本发布**: 创建 tag (如 `v1.0.0`) 时自动创建 Release 包

### 启用 GitHub Pages

1. 进入仓库设置 → Pages
2. 选择 "GitHub Actions" 作为部署源
3. 推送代码到 `main` 分支即可自动部署

详细配置说明请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)
