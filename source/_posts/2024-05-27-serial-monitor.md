---
title: Vscode Serial Monitor 的显示失误
date: 2024-05-27 20:37:03
tags: ["vscode", "工具", "嵌入式", "AI"]
---
今天调试程序的时候遇见一个问题，就是在 Arduino 框架下写的 stm32 串口通讯程序不能发送 0x7f 以上的数值，这有点奇怪。代码如下：

```cpp
Serial.write(0xff);  // （任何大于 0x7f 的数）输出结果为 fffd
```

这其实能看出来有点诡异，因为 0x7f 应该就是 ascii 码的最大值，不能输出比这大的数，感觉是遇到了一些奇怪的机制。在 Bing 中稍微搜索了一下，好像也没看到类似的问题。于是去质问 Perplexity，诶，竟然就真的问出来了。

> Based on the provided search results, when sending values greater than 0x7F (127 in decimal) over serial using Serial.write() in Arduino, you may encounter an issue where the values are displayed incorrectly, often as "fffd", in the serial monitor or terminal.
> This behavior is not an issue with the Serial.write() function itself, but rather with how the serial monitor or terminal interprets and displays the received bytes.

他说这不是 Arduino 本身的问题，而是串口监视器的问题，他还附上了一个 Github issue 的链接 ( https://github.com/microsoft/vscode-serial-monitor/issues/139 )。这个就是 vscode 串行监视器的仓库，在这个 issue 里就有人提出了一样的问题，也有人给出了一个解决了问题的版本。装上那个版本试了试，确实就可以了。

这个故事告诉我们，面对一些疑难杂症时，将问题尽可能描述清楚，AI 小助手还真能帮上忙呢。