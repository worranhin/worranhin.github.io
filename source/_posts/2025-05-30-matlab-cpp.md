---
title: 在 C++ 中使用 Matlab 导出 dll 时遇到的一些问题
date: 2025-05-30 21:54:41
tags: [cpp, DLL, Matlab]
---

最近在重构课题组的一些控制代码，有一个机器人的控制涉及到了 Matlab 导出的 C++ 共享库，而配置这个东西真多坑啊，于是有了本文。

## 前提

首先要使用 Matlab 共享库的前提条件是要安装对应的 [Matlab Runtime](https://ww2.mathworks.cn/help/compiler/install-the-matlab-runtime.html)。

其次，我手上有的是一个 `.h` 头文件，一个 `.lib` 导入库文件，一个 `.dll` 文件，和一个 `.ctf` 文件。那么就是常规的那些配置了。配置好包含路径、库路径后编译一下，发现链接有问题，于是根据头文件的提示把 `mclmcrrt.lib` 也加入进来，链接就没问题了。

## 库初始化的问题

编译和链接都没问题了，那么就开始调试了，下面是一个最小的流程：
```cpp
int main()
{
    auto ok = mclInitializeApplication(nullptr, 0); // 初始化 matlab 库
    if (!ok)
        throw std::runtime_error("Fail to initialize Matlab dll.");

    ok = invPosMainAnyPlace2ndOffsetInitialize();  // 初始化自定义库
    if (!ok)
        throw std::runtime_error("Fail to initialize inv solver lib.");

    auto result = invPosMainAnyPlace2ndOffset(/* 函数的参数 */);  // 调用函数
    // 处理结果

    invPosMainAnyPlace2ndOffsetTerminate();  // 终止自定义库
    ok = mclTerminateApplication();  // 终止 matlab 库
    if (!ok)
        std::cerr << "Fail to terminate matlab dll.";
}
```

然而，运行 `invPosMainAnyPlace2ndOffsetInitialize()` 的时候返回值为 `false` 也就是说不能完成用户库的初始化。在网上找了一通没有结果，然后想起还有个 `.ctf` 文件，于是将他丢到可执行文件下的目录里，欸，然后就好了。

## 访问冲突错误

但是这时候又遇到了另一个问题，那就是在运行 `invPosMainAnyPlace2ndOffsetInitialize()` 的时候，会报出接连几个访问冲突的错误，像下面这样：

> 0x000000006C518598 (jvm.dll)处(位于 TestIndustrialController.exe 中)引发的异常: 0xC0000005: 写入位置 0x0000018E77F30580 时发生访问冲突。

但与此同时，初始化的结果又为 `true` 然后后面的函数功能也正常。另外，如果不开调试模式运行，它也没有什么异常的地方，也不报错了。但是调试的时候就很不方便也很不爽。于是又是上网进行一通查找，最后在一个 [Stack Overflow 用户](https://cloud.tencent.com/developer/ask/sof/114327358)找到了解决方法。

解决的方法就是修改 `mclInitializeApplication()` 的调用参数，如下：
```cpp
const char* args[] = { "-nojvm" };
const int count = sizeof(args) / sizeof(args[0]);
auto ok = mclInitializeApplication(args, count);
```
其实应该就是禁用 jvm 的意思吧。到这里才发现那些个错误大部分都是由 `jvm.dll` 发出的，也正因此可以通过禁用 jvm 来解决问题。

然后，我又找到[这个函数的文档](https://ww2.mathworks.cn/help/compiler_sdk/cxx/mclinitializeapplication.html#mw_c3d0bbd0-f7f9-4775-92b0-0665f81359cc)看了一下，它的声明如下：
```cpp
bool mclInitializeApplication(const char **options, int count)
```
其中第一个参数是 C 风格的字符串数组，第二个参数是数组的大小，也就是说，上面提到的解决方案的第二个参数应该为 `1` 才对，于是修改如下：
```cpp
const char* args[] = { "-nojvm" };
auto ok = mclInitializeApplication(args, 1);
```

经测试，修改后的代码也没有问题，但是更严谨，免得后面又出什么问题。不过奇怪的是，在文档中指出，`-nojvm` 在 Linux 平台有效，但我明明是在 Windows 10 和 Visual Studio 2022 上跑的，这个选项却也生效了。

## 最后

Whatever，至此问题都处理完了。下班！