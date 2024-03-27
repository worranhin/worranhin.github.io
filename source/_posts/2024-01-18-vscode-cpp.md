---
title: vscode-cpp
date: 2024-01-18 14:24:08
tags: [vscode, cpp, 工具]
---

今天在实验室的新电脑上又遇到了 vscode 的 c/c++ 没有类型提示的问题。记得之前也遇过几次这个问题，但不记得怎么解决了。搞了一上午，终于解决了，现在有必要记录一下，以免下次又遇到这个鬼问题。

一开始想到的就是**重装**，重装扩展，重装 vscode，再把 `.code` 文件删掉，把 `settings.json` 的目录也删掉，都还是解决不了问题。

搞了一圈，发现问题应该主要就是没有编译器环境。回到扩展页面看[这个 MSVC 的教程](https://code.visualstudio.com/docs/cpp/config-msvc) ，按它说的装好了，却还是有问题。选也选不了。于是又试了试 [Mingw 的这个教程](https://code.visualstudio.com/docs/cpp/config-mingw) ，这下终于正常了，正常地报错了，报的是头文件的错，说是 `#include errors detected. Please update your includePath.`，这个倒简单了，[上网一搜](https://zhuanlan.zhihu.com/p/616798432)就知道去哪找 `includePath` 了。但更新完 `includePath` 后还是有点问题，`include` 了头文件，正文里的东西还是报错，但编译却没问题。于是打开 `configuration UI` 更改 `Compiler Path` 为 gcc 就好了。

![Compiler Path 截图](ScreenShot.jpg)

说起来这么简单的东西竟然搞了这么久，难受。