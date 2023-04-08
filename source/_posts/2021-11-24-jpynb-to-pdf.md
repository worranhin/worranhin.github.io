---
title: 'jupyter notebook 导出 pdf 不显示中文的解决方案'
author: 'Hin'
date: 2021-11-24 13:21:00+08
---


## 前言

当我需要把 jupyter notebook 的内容导出为 pdf 格式时，非常欣喜地发现菜单里有熟悉的 pdf 。

![菜单](menu.png)

然而，下载后发现中文全都显示不出来。

## 解决方案一

上网一搜，轻松地发现了[这个方法](https://www.jianshu.com/p/6b84a9631f8a)。概括地说，就是先下载 LaTex 文件（如果没装 LaTex ，还要先安装 [MiKTex](https://miktex.org/download) 工具），然后再开头`\documentclass[11pt]{article}` 的后面加上如下代码：

```latex
	\usepackage{fontspec, xunicode, xltxtra}

	\setmainfont{Microsoft YaHei}

	\usepackage{ctex}`
```

然后再渲染出 pdf 文件。麻烦吗？我也觉得。主要是每次都要改。

## 解决方案二

我经过一番摸索，又发现了另一个较为简单的方法。在刚刚导出 pdf 的菜单里有个 Print Preview 。点一下它，会出现另一个适合打印的输出页面，这时候在浏览器的菜单中找到打印的选项，出现如下界面：

![打印界面](print.png)

在右侧选择 Microsoft Print to PDF ，就能保存pdf 文件了。

## 对比

下面是两种方案的输出效果对比。

![方案一效果](solu1.png)

![方案二效果](solu2.png)

可以看出方案一输出的结果会更好看，而方案二则是比较方便，实际应用时可以按需选择。

