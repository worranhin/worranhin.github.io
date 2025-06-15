---
title: 在 WinUI3 应用中使用 Matlab 导出共享库的问题
date: 2025-06-15 12:43:40
tags: [WinUI3, Matlab, MSIX]
---

## 背景

近期，需要为项目写一个集成工业控制上位机软件，其中有一个机器人的运动学逆解依赖了 Matlab 的导出库。基于这个导出库函数包装了一个求解器类，编写单元测试后，实测能正常运行。

但是在 WinUI3 写的图形界面中引用这个库时，却报出了如下错误：

> DllNotFoundException: Unable to load DLL 'mclmcrrt23_2.dll' or one of its dependencies: 找不到指定的模块。 (0x8007007E)

很明显，这是找不到 DLL 了，但是经确认这个 dll 是在 Matlab Runtime 安装目录下的一个子目录下，且这个目录也都在系统的 PATH 环境变量中。正常的话不应该会找不到的喵。为了进一步验证，我将这个文件直接丢到运行目录下，同样也是会报出这个错误。

## 解决方案

由于这个东西在单元测试都能正常加载，在 WinUI 项目中就不行，这就非常可疑。所以猜测是 WinUI 项目的一些配置问题。所以打开 WinUI 项目的属性，翻阅了一下。发现有个 MSIX Packaging 的选项非常可疑，这个选项默认是启用的状态。我试着把它关闭之后，再编译运行，结果竟然就可以正常运行了。

## 可能的原因

### MSIX

要知道这个东西为什么会有影响，那就要先去了解一下，这个 MSIX 是个什么东西。参考[微软关于 MSIX 的文档](https://learn.microsoft.com/en-us/windows/msix/overview)，MSIX 就是 Windows 的新一代软件打包格式，具有稳定、快速等这样那样的有点，看上去没什么可疑的地方。但是在文档的 HighLights 下提到了 Package Support Framework(PSF) 用于修复一些运行时问题。那么继续点进这个[链接](https://learn.microsoft.com/en-us/windows/msix/psf/package-support-framework-overview)就发现，其中一个问题就是找不到 DLL。

> Here are some common examples where you can find the Package Support Framework useful:
> - Your app can't find some DLLs when launched. You may need to set your current working directory. You can learn about the required current working directory in the original shortcut before you converted to MSIX.
> - The app writes into the install folder. You will typically see it by "Access Denied" errors in Process Monitor.
> - Your app needs to pass parameters to the executable on launch. You can learn more how PSF can help by going here and learn more about the available configurations here.

继续往下看，就会发现这个 PSF 有一个 Dynamic Library Fixup，这似乎就是用于解决找不到 DLL 的问题的。但是，这是真的很麻烦啊，Matlab runtime 有这么多 dll，难道还要一个个去重映射吗。更何况我们的项目确实也没必要使用到 MSIX 喵。所以直接禁用 MSIX 是可行的。


但说到底，为什么使用 MSIX 会导致如上问题呢。原因似乎是 MSIX 软件会运行在一个类似沙盒的容器中，可能访问不到系统的环境变量 PATH，而导致运行时找不到 MATLAB 所需的 DLL 文件。
可以参考这篇帖子：[Access SDK outside of MSIX application](https://techcommunity.microsoft.com/discussions/msix-discussions/access-sdk-outside-of-msix-application/2039170)，以及关于打包与不打包的的优缺点的[文档](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/)。


