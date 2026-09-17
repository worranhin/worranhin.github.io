---
title: Obsidian Pandoc Reference List 无法引用 Zotero 新文献
date: 2026-09-17 12:15:00
tags:
  - Zotero
  - Obsidian
---

## 前言

之前，我配置了 Zotero（插件：Better BibTeX）+ Obsidian（插件：Zotero Integration + Pandoc Reference List），在 Obsidian 里写 `[@citekey]`，就能引用 Zotero 中的文献，生成参考文献表以及跳转到 Zotero。

但是从某天开始，新加入 Zotero 的文献全部都不被识别，旧文献的 citekey 正常显示，新文献的 `[@citekey]` 就是解析不出来。插件设置里点刷新没反应，而且甚至会导致原本的引用也不渲染了，重启 Zotero 和 Obsidian 都没用。

如今终于忍不了，着手解决一下。

## 问题定位

首先是将问题描述给 [Hermes agent](https://hermes-agent.nousresearch.com/)，让它分析了一波，它发现是 Pandoc Reference List (PRL) 里面的 API 请求出了问题，跟 Better BibTeX (BBT) 暴露的 API 对不上了。其中，它发现 PRL 的 API 请求是：
```
http://127.0.0.1:23119/better-bibtex/export/library?/1/library.json
```
而能正常访问的 BBT API 是：
```
http://127.0.0.1:23119/better-bibtex/export?/library;id:1/library.json
```
也就是说，这是 PRL 的问题。

## 解决方案

同时，通过进一步追问，Hermes agent 也在其 Github 仓库发现了一个类似问题的 [issue](https://github.com/community-archive/obsidian-pandoc-reference-list/issues/151)，同时也有人给出了解决问题的 [PR](https://github.com/community-archive/obsidian-pandoc-reference-list/pull/154)。然而因为这个仓库作者已经不维护了，所以 PR 自然也没有人合并了。当然，也可以直接 clone PR 的分支进行构建，但还是挺麻烦的。

这时候 Hermes 找到了一个有在积极维护的 fork 版本：[PandoCit](https://github.com/Atelier-Recherche/pandocit)。那当然是装下来试试啦。

安装后，在 Zotero 中导出一个持续更新的 bib 文件，在 PandoCit 中指定文件的位置，同时申请了 Zotero 的 Web API 并设置到 PandoCit 中，同步一下，就可以了。

## 小插曲

在校验 Hermes 定位到的问题时，试图在终端中用 `curl` 命令访问上面的两个 API 写法，发现都报出“基础连接已经关闭”的错误，问了 Hermes 才发现，PowerShell 里的 `curl` 是 `Invoke-WebRequest` 的别名，`curl.exe` 才是真的 curl。
