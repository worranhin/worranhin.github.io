---
title: 'git: 让分支 a 忽略分支 b 删除文件的操作'
author: Hin
date: 2022-04-13 21:30:00+08
tag: Git
---

在 git 的使用中，有时会遇到一种情况——在一个长期分支 a 中含有某个文件，而在另一个长期分支 b 中却没有。在之后只有 a 会从 b 合并修改。最好的方法当然是从 b 中新建一些 a 该有的文件，但如果一开始只有 a ，而不得不通过删除操作产生 b 呢？考虑下面一种情况：

a 分支有 foo.md, no_in_b.md 两个文件，而在 b 分支中不想要 no_in_b.md。我们不得不在 b 分支中删除 no_in_b.md 并提交。这时执行 `git log` 会有删除 not_in_b.md 的记录。

```shell
PS D:\Documents\merge-ours-demo> git log --pretty=oneline
c6e8aa93da45da5129aafe78bd99772af39df8e4 (HEAD -> b) delete not_in_b.md
4162012db692750ec018679c7a3bd868e8a311f5 (a) add foo.md and not_in_b.md
```

这时我想要在 b 中修改 foo.md。

```shell
PS D:\Documents\merge-ours-demo> git log --pretty=oneline
e5c57fbbd8625cf120af1612a9de5c8482c9a6af (HEAD -> b) do some change
c6e8aa93da45da5129aafe78bd99772af39df8e4 delete not_in_b.md
4162012db692750ec018679c7a3bd868e8a311f5 (a) add foo.md and not_in_b.md
```

然后合并至 a 中。

```shell
PS D:\Documents\merge-ours-demo> git checkout a
Switched to branch 'a'
PS D:\Documents\merge-ours-demo> git merge b
Updating 4162012..e5c57fb
Fast-forward
 foo.md      | 3 ++-
 not_in_b.md | 1 -
 2 files changed, 2 insertions(+), 2 deletions(-)
 delete mode 100644 not_in_b.md
 ```

not_in_b.md 被不出意外地删除了，但我并不想这样。先回退至 merge 之前吧。

```shell
PS D:\Documents\merge-ours-demo> git reset --hard HEAD^^
HEAD is now at 4162012 add foo.md and not_in_b.md
```

找找 b 删除 not_in_b.md 的一次 commit。

```shell
PS D:\Documents\merge-ours-demo> git checkout b
Switched to branch 'b'
PS D:\Documents\merge-ours-demo> git log --pretty=oneline
e5c57fbbd8625cf120af1612a9de5c8482c9a6af (HEAD -> b) do some change
c6e8aa93da45da5129aafe78bd99772af39df8e4 delete not_in_b.md
4162012db692750ec018679c7a3bd868e8a311f5 (a) add foo.md and not_in_b.md
```

可以看到我们就是在 c6e8aa93 的提交中删除了 not_in_b.md。让我们回到 a 分支中先假装合并这次 commit。

```shell
PS D:\Documents\merge-ours-demo> git checkout a
Switched to branch 'a'
PS D:\Documents\merge-ours-demo> git merge -s ours c6e8aa93
Merge made by the 'ours' strategy.
```

好了现在我们已经假装合并了删除 not_in_b.md 的commit。让我们检查一下 not_in_b.md 还在不在。

```shell
PS D:\Documents\merge-ours-demo> dir

    目录: D:\Documents\merge-ours-demo

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         2022/4/13     21:08             12 foo.md
-a----         2022/4/13     21:07             40 not_in_b.md
```

可以看到我们的 not_in_b.md 还在这里。有意思哦~ 再 log 一下我们的记录。

```shell
PS D:\Documents\merge-ours-demo> git log --pretty=oneline
9da6a2f428ac42ccf54d7fc513e93c0112dbbcb2 (HEAD -> a) Merge commit 'c6e8aa93' into a
c6e8aa93da45da5129aafe78bd99772af39df8e4 delete not_in_b.md
4162012db692750ec018679c7a3bd868e8a311f5 (a) add foo.md and not_in_b.md
```

发现在 delete not_in_b.md 之上多了个 merge 的记录。

然后再合并我们真正想要的 b 中作出的修改。

```shell
PS D:\Documents\merge-ours-demo> git merge b
Merge made by the 'recursive' strategy.
 foo.md | 3 ++-
 1 file changed, 2 insertions(+), 1 deletion(-)
```

成功合并了。再检查一下 not_in_b.md 还在吗？

```shell
PS D:\Documents\merge-ours-demo> dir

    目录: D:\Documents\merge-ours-demo

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         2022/4/13     21:17             29 foo.md
-a----         2022/4/13     21:07             40 not_in_b.md
```

还在！这发生了什么？让我们 log 一下看看。

```
PS D:\Documents\merge-ours-demo> git log --pretty=oneline
b2fc4fc90f7e19bbf8dc1c155bd944068311df00 (HEAD -> a) Merge branch 'b' into a
9da6a2f428ac42ccf54d7fc513e93c0112dbbcb2 Merge commit 'c6e8aa93' into a
e5c57fbbd8625cf120af1612a9de5c8482c9a6af (b) do some change
c6e8aa93da45da5129aafe78bd99772af39df8e4 delete not_in_b.md
4162012db692750ec018679c7a3bd868e8a311f5 (a) add foo.md and not_in_b.md
```

跟合并前对比发现在 delete not_in_b.md 后追加了我们想要的 do some change。最顶上多了个 merge 的记录。

其实奥秘就在这条语句中 `git merge -s ours c6e8aa93`。这条语句会做一次假的合并，它会记录提交，而并不在意合入的分支，只会将当前分支的内容当作合并结果。

更详细的介绍可以参考[git book 的这篇教程](https://git-scm.com/book/zh/v2/Git-%E5%B7%A5%E5%85%B7-%E9%AB%98%E7%BA%A7%E5%90%88%E5%B9%B6#_%E6%88%91%E4%BB%AC%E7%9A%84%E6%88%96%E4%BB%96%E4%BB%AC%E7%9A%84%E5%81%8F%E5%A5%BD)。