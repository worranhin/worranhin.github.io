---
title: Jekyll 中改变图片尺寸
---

在写博客时有时因为图片太大，想要改变图片的大小，但是又不想嵌入 *html*。于是上网查了一下，很快啊，就有解决方法了。

<!-- more -->

[这篇文章][ref1]说到，只要在图片后添加 `{:}` 即可。示例如下：

```
![image](path/to/image.png){:width="50%"}
![image](path/to/image.png){:width="100px" height="200px"}
```

-------------
> 2023-04-08 更新

Hexo 不支持这个语法，我的天哪！🥹

[ref1]:https://www.seanosier.com/2021/03/19/resize-images-in-jekyll-markdown/#:~:text=To%20resize%20an%20image%20in%20Jekyll%20Markdown%20without,Go%20in%20the%20Curly%20Braces%2C%20After%20the%20%3A