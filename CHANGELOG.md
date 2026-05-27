## [1.8.1](https://github.com/TJ-xiong/kun-note/compare/v1.8.0...v1.8.1) (2026-05-27)


### Bug Fixes

* 修复切换笔记后撤销按钮显示其他笔记内容的问题 ([823f351](https://github.com/TJ-xiong/kun-note/commit/823f351cef2e92ffd15879affe6e5ece5fe37d9c))

# [1.8.0](https://github.com/TJ-xiong/kun-note/compare/v1.7.2...v1.8.0) (2026-05-26)


### Features

* 替换 Markdown 编辑器为 TipTap 富文本编辑器 ([6d74865](https://github.com/TJ-xiong/kun-note/commit/6d748657562bcabe3e03a639d08afd96074606c6))

## [1.7.2](https://github.com/TJ-xiong/kun-note/compare/v1.7.1...v1.7.2) (2026-05-15)


### Bug Fixes

* 修复同步状态反馈缺失、返回按钮点击区域过小、本地时钟偏差导致同步错乱 ([a7eb37c](https://github.com/TJ-xiong/kun-note/commit/a7eb37cf2ca1c6d74fed1bf91d3246830c4a304a))

## [1.7.1](https://github.com/TJ-xiong/kun-note/compare/v1.7.0...v1.7.1) (2026-05-11)


### Performance Improvements

* 优化窗口收起/展开动画性能 ([804c18a](https://github.com/TJ-xiong/kun-note/commit/804c18a0e4ed0acada52dbec7a15fb38d82a8ed9))

# [1.7.0](https://github.com/TJ-xiong/kun-note/compare/v1.6.0...v1.7.0) (2026-05-11)


### Bug Fixes

* 修复服务端无变更时本地缺失图片不会同步的问题 ([c9365eb](https://github.com/TJ-xiong/kun-note/commit/c9365eb04d5fc274270a2320468a04926eda8d93))


### Features

* 支持笔记中复制图片到剪贴板 ([bd735a8](https://github.com/TJ-xiong/kun-note/commit/bd735a8083310afbd9a4205ad69a7cd9fcf7cff5))

# [1.6.0](https://github.com/TJ-xiong/kun-note/compare/v1.5.0...v1.6.0) (2026-05-10)


### Features

* 实现客户端和服务端日志持久化 ([4219e53](https://github.com/TJ-xiong/kun-note/commit/4219e53b022862623b1d7180e2c225a31e4b03a1))

# [1.5.0](https://github.com/TJ-xiong/kun-note/compare/v1.4.0...v1.5.0) (2026-05-10)


### Bug Fixes

* 修复图片上传目录路径解析错误 ([bae06a9](https://github.com/TJ-xiong/kun-note/commit/bae06a9138cf6d2f7b1c281623b0b44c68363da2))


### Features

* 实现应用版本显示与自动更新检查功能 ([ac34e3e](https://github.com/TJ-xiong/kun-note/commit/ac34e3ea18bb29b92c3f7bf75c08f2df5471160f))

# [1.4.0](https://github.com/TJ-xiong/kun-note/compare/v1.3.0...v1.4.0) (2026-05-09)


### Features

* 实现笔记图片同步功能 ([b451403](https://github.com/TJ-xiong/kun-note/commit/b451403d3d7fc8d259d2c92b42ef62df4b68e725))

# [1.3.0](https://github.com/TJ-xiong/kun-note/compare/v1.2.0...v1.3.0) (2026-05-09)


### Bug Fixes

* 回收站入口固定在侧边栏底部 ([9d9f082](https://github.com/TJ-xiong/kun-note/commit/9d9f08229af44252766abe69c59411d725a2cc53))


### Features

* 接入版本历史功能到右键菜单 ([4a8b0f2](https://github.com/TJ-xiong/kun-note/commit/4a8b0f26a6ff28390b3e68934e0680336198999e))

# [1.2.0](https://github.com/TJ-xiong/kun-note/compare/v1.1.1...v1.2.0) (2026-05-08)


### Bug Fixes

* 修复 Docker 构建缓存不兼容的问题 ([a687f49](https://github.com/TJ-xiong/kun-note/commit/a687f49ac8e3b700caa6222904cb5c82a658289c))
* 修复 pnpm CI 构建配置 ([6018145](https://github.com/TJ-xiong/kun-note/commit/6018145a6cee87bfbb5b8ae58321826100e36cca))
* 修复多个请求同时 401 时重复刷新 token 的问题 ([9212f45](https://github.com/TJ-xiong/kun-note/commit/9212f458a96e5ea3a685331c03dbf4cfb1f86eff))
* 修复笔记重命名内容丢失 ([f5673d7](https://github.com/TJ-xiong/kun-note/commit/f5673d7a13edccf2f46cc0e6018cb339179040fa))
* 更新 docker-compose 配置 ([e8c403c](https://github.com/TJ-xiong/kun-note/commit/e8c403c18856ec1b1fef4a84a6453d464baee8aa))
* 添加 cryptography 依赖解决 MySQL 认证问题 ([abba907](https://github.com/TJ-xiong/kun-note/commit/abba9073c2f534c8cd2c471b6c2a17601e7e3436))
* 添加数据库连接池配置解决连接丢失问题 ([ed83aef](https://github.com/TJ-xiong/kun-note/commit/ed83aeff9d77f27b070d45e0983eef5c69979769))


### Features

* 实现笔记同步功能 ([fb20ca1](https://github.com/TJ-xiong/kun-note/commit/fb20ca1298423d421fdaf1fbe0e5fc0c537f090b))
* 添加 Docker 构建配置和 GitHub Actions 工作流 ([7b01145](https://github.com/TJ-xiong/kun-note/commit/7b011456592bf185e4fe90a7f8ed1cd672363fcb))

## [1.1.1](https://github.com/TJ-xiong/kun-note/compare/v1.1.0...v1.1.1) (2026-05-07)


### Bug Fixes

* 修复 CI/CD 打包时版本号未同步的问题 ([7b87ae9](https://github.com/TJ-xiong/kun-note/commit/7b87ae9022f8a41e0ad91f9755a0ae3ad678d379))

# [1.1.0](https://github.com/TJ-xiong/kun-note/compare/v1.0.0...v1.1.0) (2026-05-06)


### Features

* 添加单实例锁并修复打包配置 ([5460694](https://github.com/TJ-xiong/kun-note/commit/5460694b9295bac5387c83b8280b54106b42cf41))

# 1.0.0 (2026-05-06)


### Features

* 优化 MarkdownEditor 工具栏 ([c1cbd47](https://github.com/TJ-xiong/kun-note/commit/c1cbd47f86100b266b8847af54de7d802babac73))
* 完善 CI/CD 自动构建与发布流程 ([d4e372d](https://github.com/TJ-xiong/kun-note/commit/d4e372d42171e85bc3e873b83467e380ac28fb73))
* 添加数据库启动检查和自动迁移 ([9a109f3](https://github.com/TJ-xiong/kun-note/commit/9a109f3a0932bb5d1084f695dbfdac4f0a01936d))
* 添加置顶功能、窗口收起延迟配置和排序优化 ([1bd6001](https://github.com/TJ-xiong/kun-note/commit/1bd60012cd9bfabfed956c0f8cf7b2773b4cd76b))
* 重构认证系统和优化设置页面 ([ddaba66](https://github.com/TJ-xiong/kun-note/commit/ddaba661f90cc1953017a86ec0bac3864d9cf2a6))


### Performance Improvements

* 删除冗余功能 ([51f252d](https://github.com/TJ-xiong/kun-note/commit/51f252d606fd9e787d8527998291540aee432737))

# [1.2.0](https://github.com/TJ-xiong/kun-note/compare/v1.1.1...v1.2.0) (2026-05-06)


### Features

* 完善 CI/CD 自动构建与发布流程 ([076a1b2](https://github.com/TJ-xiong/kun-note/commit/076a1b200005b46ad9826bf2267a8854911ae667))

## [1.2.2](https://github.com/TJ-xiong/kun-note/compare/v1.2.1...v1.2.2) (2026-05-06)


### Bug Fixes

* 修复 Build workflow 缺少 release tag 的问题 ([7a4db31](https://github.com/TJ-xiong/kun-note/commit/7a4db31f1ecef4d9ec2a2d63d2816eb1a00ded67))

## [1.2.1](https://github.com/TJ-xiong/kun-note/compare/v1.2.0...v1.2.1) (2026-05-06)


### Bug Fixes

* 修复 Build workflow 未被 Release 触发的问题 ([8b388ee](https://github.com/TJ-xiong/kun-note/commit/8b388ee028e675643ca32e0f9063bed9b0a2ad78))

# [1.2.0](https://github.com/TJ-xiong/kun-note/compare/v1.1.1...v1.2.0) (2026-05-06)


### Features

* 添加手动触发构建功能 ([8e8b0da](https://github.com/TJ-xiong/kun-note/commit/8e8b0dad29440a8eeb77fc6b0d3aade0c83d5216))

## [1.1.1](https://github.com/TJ-xiong/kun-note/compare/v1.1.0...v1.1.1) (2026-05-06)


### Bug Fixes

* 仅构建 Windows 安装包 ([48bad80](https://github.com/TJ-xiong/kun-note/commit/48bad80b7b58f06466d408f83f1587d546db1df8))

# [1.1.0](https://github.com/TJ-xiong/kun-note/compare/v1.0.0...v1.1.0) (2026-05-06)


### Features

* 添加 Electron 应用自动构建工作流 ([e676748](https://github.com/TJ-xiong/kun-note/commit/e6767482f161d4fbd07f1c60c67666e8367d6b48))

# 1.0.0 (2026-05-06)


### Bug Fixes

* 修复 CI 构建缺少 lock 文件的问题 ([b159683](https://github.com/TJ-xiong/kun-note/commit/b1596837cde5e9a2aa7e6ed6654e9735a7198bf2))
* 升级 CI Node.js 版本至 22 以兼容 semantic-release ([797cd65](https://github.com/TJ-xiong/kun-note/commit/797cd655557707d7755e5d6766c330e31e311188))
* 移除 semantic-release 的 npm 发布插件 ([c60a39d](https://github.com/TJ-xiong/kun-note/commit/c60a39d7bb17047770238ed3e780193978bcf548))


### Features

* 优化 MarkdownEditor 工具栏 ([c1cbd47](https://github.com/TJ-xiong/kun-note/commit/c1cbd47f86100b266b8847af54de7d802babac73))
* 添加数据库启动检查和自动迁移 ([9a109f3](https://github.com/TJ-xiong/kun-note/commit/9a109f3a0932bb5d1084f695dbfdac4f0a01936d))
* 添加置顶功能、窗口收起延迟配置和排序优化 ([1bd6001](https://github.com/TJ-xiong/kun-note/commit/1bd60012cd9bfabfed956c0f8cf7b2773b4cd76b))
* 重构认证系统和优化设置页面 ([ddaba66](https://github.com/TJ-xiong/kun-note/commit/ddaba661f90cc1953017a86ec0bac3864d9cf2a6))


### Performance Improvements

* 删除冗余功能 ([51f252d](https://github.com/TJ-xiong/kun-note/commit/51f252d606fd9e787d8527998291540aee432737))
