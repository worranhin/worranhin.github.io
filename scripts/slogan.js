hexo.extend.filter.register('theme_inject', function (injects) {
  injects.bodyEnd.file('slogan', 'source/_inject/slogan.ejs', {}, {}, -1);
});