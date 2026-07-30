import type { DocPage } from "./data";

export const legacyV1Docs: DocPage[] = [
  {
    id: "v1-playback-player-controls",
    title: "播放器控件",
    route: "/zh/docs/v1/playback/player-controls",
    category: "回放",
    status: "Published",
    owner: "产品运营",
    updatedAt: "2026-07-07",
    version: "V1",
    readingTime: 1,
    summary:
      "播放器控件用于控制回放录像的播放、暂停、时间定位、倍速切换、片段导出、录像下载、刷新和全屏查看等操作。用户可通过播放器控件快速定位目标录像时间点，并结合底部时间轴查看录像分布情况，对历史视频进行精准回看和事件核查。",
    tags: ["回放", "播放器控件", "V1", "中文"],
    contentHtml:
      '<h2>概览</h2><p>播放器控件用于控制回放录像的播放、暂停、时间定位、倍速切换、片段导出、录像下载、刷新和全屏查看等操作。用户可通过播放器控件快速定位目标录像时间点，并结合底部时间轴查看录像分布情况，对历史视频进行精准回看和事件核查。</p><h2>功能说明</h2><ul><li><p><strong>日期选择</strong><br>支持选择需要查看的录像日期。用户切换日期后，系统会根据所选日期重新加载对应相机的录像数据、时间轴状态和可播放片段，便于查看不同日期下的历史视频。</p></li><li><p><strong>录像下载</strong><br>支持下载当前选中的录像内容，用于视频留档、事件取证、内部复盘或后续分析。下载前，用户应确认相机、日期和时间段是否与目标事件一致，避免下载错误录像。</p></li><li><p><strong>片段导出</strong><br>支持截取并导出指定时间范围内的录像片段。用户可通过时间轴定位事件发生前后的关键时间段，只导出有效视频内容，减少文件体积，提高证据整理和传输效率。</p></li><li><p><strong>上一段 / 后退控制</strong><br>支持向前跳转到上一段录像或前一个时间节点，便于用户回看事件发生前的画面。该功能适合用于查看异常事件出现前的人员行为、环境变化或设备状态。</p></li><li><p><strong>播放 / 暂停</strong><br>支持控制当前录像的播放状态。播放中可暂停查看关键画面，暂停后可继续播放。该功能适用于用户需要仔细确认某一帧画面、人员动作或事件细节的场景。</p></li><li><p><strong>下一段 / 前进控制</strong><br>支持向后跳转到下一段录像或后一个时间节点，便于用户快速查看事件后续发展过程。例如查看人员离开路径、异常行为结束时间或现场处置过程。</p></li><li><p><strong>倍速播放</strong><br>支持切换不同播放速度，例如 x1、x3、x5。正常倍速适合查看关键细节，高倍速适合快速浏览长时间录像，提高排查效率。用户可根据事件复杂程度选择合适倍速。</p></li><li><p><strong>时间轴控制</strong><br>底部时间轴按 0–24 小时展示全天录像分布情况。蓝色区段表示该时间范围内存在录像数据，空白区段表示当前时间范围内无录像或未生成录像。用户可拖动时间指针快速定位到指定时间点。</p></li><li><p><strong>录像时间定位</strong><br>支持通过时间轴刻度查看当前播放时间，并根据录像片段分布判断有录像和无录像的时间范围。该功能适合在已知事件时间点的情况下快速定位对应视频片段。</p></li><li><p><strong>刷新录像数据</strong><br>支持重新加载当前相机的录像数据、时间轴状态和播放画面。当视频加载异常、时间轴未更新、录像数据刚生成或系统数据发生变化时，可通过刷新操作重新获取最新录像信息。</p></li><li><p><strong>全屏查看</strong><br>支持将回放画面切换为全屏模式，便于用户查看视频细节。全屏模式适合事件复盘、画面核查、会议展示或需要放大查看人员、物品、车辆等细节的场景。</p></li><li><p><strong>网格 / 列表模式切换</strong><br>支持在网格模式和列表模式之间切换。网格模式适合多路相机同步回放，便于多角度查看事件经过；列表模式适合查看录像文件清单、筛选录像资源和进行下载管理。</p></li><li><p><strong>播放进度识别</strong><br>播放过程中，系统应在时间轴上显示当前播放位置，帮助用户判断视频正在播放的具体时间点。用户可结合时间轴和视频画面快速确认事件发生的前后顺序。</p></li><li><p><strong>录像片段状态识别</strong><br>系统应通过时间轴区段展示录像数据是否存在，帮助用户判断指定时间段是否可回放。若某个时间段无录像数据，用户应进一步检查相机在线状态、录像计划和存储配置。</p></li></ul><h2>使用建议</h2><p>进行事件复盘时，建议先确认事件发生的相机、日期和大致时间，再通过时间轴快速定位目标片段。若事件时间不完全明确，可先使用倍速播放快速浏览，再在关键画面处暂停并细看。</p><p>需要导出视频证据时，建议只选择事件发生前后一段关键时间范围，避免导出过长录像造成文件过大、下载耗时或后续查阅不便。若视频用于正式留档，应同时记录相机名称、录像时间、导出时间和操作人员信息。</p><p>当播放器无法正常播放时，应优先检查当前时间段是否存在录像数据、相机是否在线、录像计划是否启用、磁盘存储是否正常，以及当前账号是否具备查看和下载该相机录像的权限。</p><h2>界面示例</h2><img src="/media/polytron-one/uploads/20260624091402-njfsll-Playback_control.png" alt="Playback control" title="Playback control">',
    mediaAssets: [
      {
        id: "v1-playback-player-controls-video",
        type: "video",
        title: "回放播放器演示",
        url: "/media/polytron-one/playback-overview.mp4",
        caption: "回放播放器演示",
      },
      {
        id: "v1-playback-player-controls-image",
        type: "image",
        title: "Playback control",
        url: "/media/polytron-one/uploads/20260624091402-njfsll-Playback_control.png",
        caption: "Playback control",
      },
    ],
    sections: [
      {
        id: "overview",
        heading: "概览",
        body: "播放器控件用于精确查看回放录像。",
      },
      {
        id: "function-description",
        heading: "功能说明",
        body: "包括日期选择、录像下载、片段导出、播放与暂停、前后跳转、倍速播放、时间轴定位、刷新和全屏查看。",
      },
    ],
  },
  {
    id: "en-v1-playback-player-controls",
    title: "Player Controls",
    route: "/en/docs/v1/playback/player-controls",
    category: "Playback",
    status: "Published",
    owner: "Product operations",
    updatedAt: "2026-07-07",
    version: "V1",
    readingTime: 1,
    summary:
      "Player controls support playback, pause, time positioning, speed switching, clip export, recording download, refresh, and full-screen viewing. Users can quickly locate a target recording time and use the bottom timeline to review historical footage and verify events.",
    tags: ["Playback", "Player Controls", "V1", "English"],
    contentHtml:
      "<h2>Overview</h2><p>Player controls support playback, pause, time positioning, speed switching, clip export, recording download, refresh, and full-screen viewing. Users can quickly locate a target recording time and use the bottom timeline to review historical footage and verify events.</p><h2>Function Description</h2><ul><li><p><strong>Date selection</strong><br>Select the recording date to review. After the date changes, the system reloads the matching camera recordings, timeline state, and playable clips.</p></li><li><p><strong>Recording download</strong><br>Download the selected recording for archiving, evidence collection, internal review, or later analysis. Confirm the camera, date, and time range before downloading.</p></li><li><p><strong>Clip export</strong><br>Export a selected time range from the recording. Use the timeline to keep only the relevant period before and after an event.</p></li><li><p><strong>Previous segment / rewind</strong><br>Move to the previous recording segment or earlier time point to review activity before the event.</p></li><li><p><strong>Play / pause</strong><br>Start or pause the current recording. Pause at a key frame when closer inspection is needed.</p></li><li><p><strong>Next segment / forward</strong><br>Move to the next recording segment or later time point to review what happened after the event.</p></li><li><p><strong>Playback speed</strong><br>Switch between speeds such as x1, x3, and x5. Use normal speed for detail and higher speed for scanning longer recordings.</p></li><li><p><strong>Timeline control</strong><br>The bottom timeline shows recording availability across 0–24 hours. Blue sections contain recording data; blank sections indicate no available recording. Drag the playhead to a specific time.</p></li><li><p><strong>Recording time positioning</strong><br>Use the scale and clip distribution to identify the current playback time and locate known event times quickly.</p></li><li><p><strong>Refresh recording data</strong><br>Reload the selected camera recording, timeline, and player when data has changed or the player has not updated.</p></li><li><p><strong>Full-screen view</strong><br>Open playback in full screen to inspect people, objects, vehicles, and other visual details.</p></li><li><p><strong>Grid / list mode</strong><br>Switch between a multi-camera grid and a recording list. Grid mode supports multi-angle review; list mode supports filtering and download management.</p></li><li><p><strong>Playback position</strong><br>The timeline indicates the current playback position so users can relate the displayed video to the precise event time.</p></li><li><p><strong>Recording availability</strong><br>Timeline segments indicate whether a time range can be played. If data is missing, check camera connectivity, recording schedules, and storage settings.</p></li></ul><h2>Usage Suggestions</h2><p>For event review, first confirm the camera, date, and approximate event time, and then locate the target clip on the timeline. If the time is uncertain, scan at a higher speed and pause at key moments.</p><p>When exporting evidence, select only the relevant period around the event. For formal archiving, record the camera name, recording time, export time, and operator.</p><p>If playback does not work, check recording availability for the selected time, camera connectivity, recording schedules, storage status, and account permissions.</p><h2>Interface Example</h2><img src=\"/media/polytron-one/uploads/en/20260702061727-h5lval-Playback_player.png\" alt=\"Playback player\" title=\"Playback player\">",
    mediaAssets: [
      {
        id: "en-v1-playback-player-controls-image",
        type: "image",
        title: "Playback player",
        url: "/media/polytron-one/uploads/en/20260702061727-h5lval-Playback_player.png",
        caption: "Playback player",
      },
    ],
    sections: [
      {
        id: "overview",
        heading: "Overview",
        body: "Player controls support precise review of historical recordings.",
      },
      {
        id: "function-description",
        heading: "Function Description",
        body: "Date selection, download, clip export, playback controls, speed selection, timeline positioning, refresh, and full-screen viewing.",
      },
    ],
  },
];
