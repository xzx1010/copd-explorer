# 外部项目参考

本目录记录本项目调研过的开源项目与可借鉴方向。由于当前环境无法稳定下载 GitHub ZIP/克隆仓库，暂不把第三方完整源码复制进本项目；避免产生不必要的体积、许可证和供应链风险。

## 优先级 1：直接影响当前产品

### OpenSeadragon

- 仓库：https://github.com/openseadragon/openseadragon
- 官网：https://openseadragon.github.io/
- 许可证：BSD-3-Clause（以仓库 LICENSE.txt 为准）
- 借鉴点：高分辨率图像的缩放、平移、视口坐标系、瓦片图加载。
- 对当前项目的用途：未来替换 `frontend/src/components/slide/SlideViewer.tsx` 的手写缩放/拖拽逻辑，保留现有 Annotation/Anchor 层作为上层教学交互。

## 优先级 2：架构参考，不直接引入

### OHIF Viewers

- 仓库：https://github.com/OHIF/Viewers
- 借鉴点：React 扩展机制、医学影像工具栏、DICOM 数据源抽象和零足迹浏览器模式。
- 判断：功能和依赖规模明显超过 COPD 教学 MVP，暂不整仓引入。

### caMicroscope

- 仓库：https://github.com/camicroscope/caMicroscope
- 借鉴点：数字病理切片查看、标注/标记数据模型、服务端资源组织方式。
- 判断：适合后续接入真实全视野切片时参考，暂不复制其后端和数据库。

### QuPath

- 仓库：https://github.com/qupath/qupath
- 借鉴点：病理图像分析工作流、标注语义和导出数据组织。
- 判断：桌面端研究工具，不作为本项目运行时依赖。

## 采用原则

1. 优先使用可在浏览器直接运行的轻量库，不把完整医学影像平台带入 MVP。
2. 引入第三方代码前先确认许可证、包体积、浏览器兼容性和维护状态。
3. 静态部署默认使用本地内容和 Mock AI；真实 API 仅作为可选配置。

