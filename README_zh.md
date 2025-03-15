# MD-Tauri

简体中文 | [English](README.md)

一个使用 Tauri 和 Vue 3 构建的现代化 Markdown 编辑器，为 Markdown 编辑和预览提供流畅的桌面体验。

## 特性

- 🚀 使用 Tauri + Vue 3 构建，实现最佳桌面性能
- 📝 实时 Markdown 预览
- 🎨 代码语法高亮支持
- 📊 Mermaid 图表支持
- 🧮 数学公式渲染
- 🖼️ 多种图片上传选项
- 💾 草稿自动保存
- 🎯 自定义主题和 CSS 样式
- 📤 导入/导出功能

## 安装包

### MacOS

[MD Tauri v1.0.0](https://github.com/CrazyMrYan/md-tauri/releases/tag/v1.0.0-beta.1#:~:text=md%2Dtauri_1.0.0_aarch64.dmg)

## 预览效果截图

![应用默认](./public/assets/images/Snipaste_2025-03-07_14-10-08.png)

![应用黑暗主题](./public/assets/images/Snipaste_2025-03-07_14-11-26.png)

![自定义效果主题](./public/assets/images/Snipaste_2025-03-07_14-12-20.png)

![图床配置](./public/assets/images/Snipaste_2025-03-07_14-12-58.png)

![支持VuePress](./public/assets/images/Snipaste_2025-03-07_14-16-31.png)

## 开发设置

### 环境要求

- Node.js >= 20
- Rust (Tauri 所需)
- Git

### 安装

```bash
# 克隆仓库
git clone [your-repo-url]
cd md-tauri

# 安装依赖
npm install
```

### 开发命令

```bash
# 启动开发服务器
npm run tauri:dev

# 构建生产版本
npm run tauri:build

# 运行网页版本（不含 Tauri）
npm run dev:web

# 代码检查
npm run lint
```

## 构建

构建生产版本：

```bash
npm run tauri:build
```

这将在 `src-tauri/target/release` 目录下创建对应平台的可执行文件。

## 技术栈

- Tauri
- Vue 3
- TypeScript
- Vite
- TailwindCSS
- CodeMirror
- Marked
- Mermaid
- 等等...

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m '添加一些很棒的特性'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 开源协议

本项目采用 [MIT 协议](LICENSE) 开源。
