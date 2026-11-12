# 3code

3code 是一个基于 [Herdr](https://herdr.dev/) 的开发工作台布局。它把终端、Agent、文件浏览和 Git 操作组合在同一个窗口中，并在原生 Herdr 功能上增加项目模板、文本搜索和 AI 提交说明等能力。

本项目基于此前远程仓库 [AkaraChen/2code](https://github.com/AkaraChen/2code) 的 Herdr 版本修改，保留其 Git 历史，并在此基础上扩展工作台功能。原始基线提交为 [`3be336e`](https://github.com/AkaraChen/2code/commit/3be336e1)。当前仓库不包含旧版 Tauri 桌面应用。

## 安装

先安装并启动 [Herdr](https://herdr.dev/download/)，然后在本仓库目录执行：

```sh
./scripts/install.sh
herdr-app do layout.switch --name 2code
```

安装脚本会将布局、mod 和主题复制到 `~/.config/herdr-app`，并执行 `herdr-app check`。当前内部布局与 mod 仍使用 `2code` 标识，因此切换布局时使用上面的名称。再次运行脚本可以更新已安装的文件。

## 功能

- **工作区与 Agent**：使用 Herdr 原生 Spaces 和 Agents 列表，Agent 可以按工作区分组。列表显示运行中的 Agent，不包含已关闭的聊天历史。
- **文件与编辑器**：浏览文件树、打开文件标签、编辑和保存文本，支持 Markdown 预览、图片和文件名搜索。
- **项目文本搜索**：使用 `⌘ Shift F` 搜索已保存的文件内容，显示路径、行号和高亮结果。需要安装 `rg`（ripgrep）；搜索遵循忽略规则，最多显示 200 条结果，跳过超过 1 MB 的文件。点击结果打开文件，暂不自动跳转到匹配行。
- **Git**：按已暂存和未暂存分组查看文件，通过 `+` / `−` 暂存或取消暂存，查看 diff 和历史。提交使用当前暂存区；拉取使用 `git pull --ff-only`。
- **Git 操作菜单**：提供抓取、拉取、推送、全部暂存或取消暂存、提交全部、修改或撤销上一次提交，以及常用分支操作。执行结果和错误会显示在菜单中。
- **AI 提交说明**：在项目设置的 AI 页面填写 OpenAI 兼容的 API 地址、模型、密钥和提交规范提示词，根据已暂存的变更生成可编辑的提交摘要和描述。提交仍需手动确认。
- **终端模板**：为项目或全局配置命令，从右上角运行按钮或新终端菜单启动。
- **布局与主题**：文件 / Git 面板可切换到工作区左侧或右侧；提供 2code 和参考 [Vitesse](https://github.com/antfu/vscode-theme-vitesse) 配色的明暗主题。

AI 密钥以明文保存在 Herdr 本机数据目录 `~/.config/herdr-app/data/2code-ai/`，不会保存在项目仓库中。点击生成时，已暂存变更的 diff 会发送到你配置的服务，请留意提交内容中是否包含敏感信息。

## 快捷键

| macOS | Linux / Windows | 功能 |
| --- | --- | --- |
| `⌘ T` | `Ctrl Shift T` | 新建终端 |
| `⌘ K` | `Ctrl Shift K` | 按文件名查找 |
| `⌘ Shift F` | — | 搜索项目文件内容 |
| `⌘ S` | `Ctrl S` | 保存当前文件 |
| `⌘ G` | `Ctrl Shift G` | 打开 diff 窗口 |
| `⌘ E` | `Ctrl Shift E` | 显示或隐藏文件 / Git 面板 |

快捷键由 `keys.json` 提供；安装脚本只补充尚未设置的绑定，不覆盖你已有的按键设置。

## 项目配置

在项目主工作区根目录创建 `2code.json`：

```json
{
  "init_script": ["nvm use"],
  "terminal_templates": [
    { "name": "开发服务器", "cwd": "apps/web", "commands": ["bun dev"] }
  ]
}
```

`init_script` 会在 2code 打开的新终端中先执行；模板的 `cwd` 相对于当前 worktree 根目录。全局终端模板保存在 `~/2code/2code.json`。

设置界面仍保留 `setup_script` 和 `teardown_script` 字段，但目前使用 Herdr 原生 worktree 操作时不会自动执行这两个脚本。

## 目录

| 路径 | 说明 |
| --- | --- |
| `layouts/` | Herdr 工作台布局 |
| `mods/2code/` | 工作台 mod、界面组件与共享逻辑 |
| `themes/` | 明暗主题 |
| `keys.json` | 布局快捷键 |
| `scripts/install.sh` | 安装与检查脚本 |
| `RECIPE.md` | 布局与实现说明 |
| `website/` | 原项目的独立 Next.js 网站 |

## 致谢与许可

- 项目基于 [AkaraChen/2code](https://github.com/AkaraChen/2code) 的 Herdr 版本。
- 文件树和 Git 变更面板部分代码源自 Herdr 自带 mod，遵循 Apache-2.0；详细说明见 [NOTICE](mods/2code/NOTICE) 和 [LICENSE-Herdr.txt](mods/2code/LICENSE-Herdr.txt)。
- 使用的 Lucide 和 Material Icon Theme 图标及其许可证位于 `mods/2code/icons/`。
