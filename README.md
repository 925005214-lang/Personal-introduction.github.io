# 手语识别系统 - 项目展示页

这是一个手语识别项目的个人展示网页，包含自我介绍、Demo演示、项目思路等内容。

## 功能特点

- 左侧导航栏：自我介绍 / Demo演示 / 其他
- 自我介绍：姓名、性别、年龄、学院、学号、参与项目原因
- Demo演示：支持视频上传（拖拽或点击），视频通过 IndexedDB 持久化存储（刷新不丢失）
- 模拟手语识别功能，展示识别结果与置信度
- 项目思路分步说明
- 响应式设计，支持移动端

## 技术栈

- 原生 HTML + CSS + JavaScript
- IndexedDB 本地持久化存储
- CSS 渐变、动画、Flexbox/Grid 布局

## 部署到 GitHub Pages

### 方式一：通过 GitHub 网页端

1. 在 GitHub 上创建一个新仓库（如 `sign-language-demo`）
2. 将本目录所有文件推送到该仓库的 `main` 分支
3. 进入仓库 Settings → Pages
4. Source 选择 `Deploy from a branch`
5. Branch 选择 `main`，目录选择 `/ (root)`
6. 点击 Save，等待几分钟即可访问

### 方式二：通过命令行

```bash
git init
git add .
git commit -m "初始化手语识别项目展示页"
git branch -M main
git remote add origin https://github.com/你的用户名/sign-language-demo.git
git push -u origin main
```

然后在 GitHub 仓库 Settings → Pages 中开启即可。
