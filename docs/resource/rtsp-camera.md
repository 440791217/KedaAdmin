# RTSP 摄像头拍照标注

本版本接入完整 RTSP 地址，支持地址内的用户名和密码。连接字段统一放在设备新建/编辑表单中，一次保存设备资料和连接配置。新增 `sop_device_connection.rtsp_url` 原样保存完整地址（仅去除首尾空格），原有分字段配置仍可读取。设备资料与地址同事务提交；保存后前后端均从数据库回读确认，不以表单值或测试取图成功作为保存成功的依据。列表和只读详情不展示认证信息，编辑输入框直接显示完整地址。

## 部署

已有数据库先执行 `SOP_MySQL/resource-module-v1/migrations/003_rtsp_address.sql`（可重复执行），再重启后端。新建数据库使用最新建表脚本。

在运行 Java 后端的机器上准备 FFmpeg，确认该机器可以访问摄像头网络。FFmpeg 必须包含 RTSP 输入及 MJPEG 编码支持。

Windows 启动后端前可设置：

```powershell
$env:SOP_CAMERA_FFMPEG = 'D:\tools\ffmpeg\bin\ffmpeg.exe'
$env:SOP_CAMERA_TIMEOUT_SECONDS = '10'
$env:SOP_CAMERA_MAX_PROCESSES = '4'
```

如果 FFmpeg 已在后端进程的 PATH 中，第一项可以不设置。路径是可执行文件路径，不包含命令参数。重新启动后端并构建/刷新前端。

预览采用后端 FFmpeg 拉 RTSP/TCP、输出每秒 5 张 JPEG 的方式，无需额外的媒体服务器。截图保持原始视频尺寸；预览为观察构图使用，不代表摄像头的原始帧率。协议与管道说明见 [FFmpeg 协议文档](https://ffmpeg.org/ffmpeg-protocols.html) 和 [image2pipe 文档](https://ffmpeg.org/ffmpeg-formats.html#image2_002c-image2pipe)。

如使用 Nginx，预览 `/resource/device/{id}/stream` 需要关闭代理缓冲，并将读取超时设置为至少 60 秒。后端已经发送 `X-Accel-Buffering: no`。预览使用请求头中的 Bearer Token，地址中不携带登录令牌。

## 使用

1. 设备管理中选择摄像头规格、绑定工位，将连接方式设为网络、协议设为 RTSP。
2. 填写完整地址，例如 `rtsp://192.168.1.100:554/live?channel=1&subtype=0`。也支持 `rtsp://用户名:密码@主机:端口/路径`，省略端口时使用 554。密码中的 @、#、空格等特殊字符需URL编码。
3. 点击“测试连接并取图”，看到实际截图后保存设备。测试不保存配置。
4. 从绑定该工位的任务进入制作页面，选择步骤，点击“工位摄像头”。无工位上下文的独立 SOP 制作入口会提示先关联工位。
5. 选择摄像头、拍照、确认“用于当前步骤”。每次拍照新增独立底图，已有图片和标注保留。
6. 在新底图上添加指引或检测区域，保存草稿。截图上传失败时照片保留，可再次确认上传。

## 接口和限制

- `POST /resource/device/connection/test`：测试表单中的连接配置，要求 `resource:manage`，返回 JPEG。
- `GET /resource/device/{id}/preview`：测试已保存配置，要求 `resource:manage`，返回 JPEG（替代旧的占位 JSON 响应）。
- `GET /resource/device/{id}/stream`：连续 multipart JPEG，要求 `resource:use`；每次最多约 45 秒，页面自动续接。
- `POST /resource/device/{id}/snapshot`：原始尺寸 JPEG，要求 `resource:use`；随后复用既有 SOP 图片上传接口加入当前步骤。
- 停用的设备、规格、所属工位，未启用的连接及非 RTSP 摄像头均不能取图。
- 单张图片上限 5 MiB，上传还沿用现有 8192 像素边长和 1600 万像素限制。高分辨率设备可选择合适的子码流。
- FFmpeg 缺失返回明确配置提示；离线、认证失败、无法解码、超时返回取图失败提示。默认最多 4 个并发 FFmpeg 进程。
- 关闭/切换预览会取消读取，后端在断流写入或期限到达时释放进程。摄像头断线后显示错误，可手动重连。

本次自动测试覆盖地址解析、权限、禁用状态、取图超时、进程释放、流数据分段解析、拍照重试，以及截图上传到步骤后保存并重新读取标注。自动测试使用模拟摄像头输出；真实地址连通、FFmpeg 编解码和现场网络仍需部署后测试。



