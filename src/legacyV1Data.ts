import type { DocPage } from "./data";

// Synchronized from the legacy polytron-doc playback module.
export const legacyV1Docs: DocPage[] = [
  {
    "id": "v1-playback",
    "title": "概览",
    "route": "/zh/docs/v1/playback",
    "category": "回放",
    "status": "Published",
    "owner": "产品运营",
    "updatedAt": "2026-07-07",
    "version": "V1",
    "readingTime": 1,
    "summary": "在日常安防管理中，用户通常会从实时监控或通知详情进入历史录像查看流程。回放模块支持用户按照相机、日期、时间范围和录像类型等条件查找录像，并提供网格布局、列表布局和播放器控制等查看方式。用户可以在多路回放画面中对比不同相机的视频，也可以通过列表快速定位具体录像文件，并对关键时间段进行裁剪和导出。\n\n该模块适用于事件复盘、警报核查、视频取证、异常行为确认、设备运行追溯和历史记录归档等场景，是从“实时查看”进入“历史追溯”的核心功能入口。",
    "tags": [
      "回放",
      "概览",
      "中文",
      "V1"
    ],
    "contentHtml": "<h2>模块能力</h2><ul><li><p><strong>历史检索</strong><br>支持按相机、日期、时间范围、录像类型等条件定位历史录像。用户可根据事件发生时间或警报记录中的时间信息快速筛选目标录像，减少在大量录像文件中逐条查找的时间成本。</p></li><li><p><strong>按相机检索</strong><br>用户可选择指定相机查看对应历史录像，适用于核查某个固定区域、通道、出入口或重点点位的历史画面。若事件涉及多个相机，也可分别选择相关相机进行对比查看。</p></li><li><p><strong>按日期与时间检索</strong><br>支持用户选择具体日期和时间段进行录像查询。系统会根据所选时间范围加载对应录像数据，并在时间轴或列表中展示可播放片段，便于用户快速定位事件前后画面。</p></li><li><p><strong>按录像类型检索</strong><br>支持按照录像类型筛选历史文件，例如连续录像、事件录像、快照或警报关联录像等。用户可根据核查目的选择合适类型，提高检索效率。</p></li><li><p><strong>多画面查看</strong><br>支持通过网格布局同时查看多路相机回放画面，适合事件经过多个区域、需要多角度比对或查看同一时间段不同相机画面的场景。</p></li><li><p><strong>列表查看</strong><br>支持以列表形式展示录像文件，用户可查看相机 ID、位置、录像类型、开始时间、结束时间、时长和下载入口等信息。列表方式适合批量查找、筛选和管理录像资源。</p></li><li><p><strong>列表下载</strong><br>用户可在录像列表中选择单个或多个录像文件进行下载，适用于证据保存、事件归档、外部复盘或提交给相关人员查看的场景。</p></li><li><p><strong>播放器控制</strong><br>支持上一段、下一段、后退、暂停、播放和倍速播放等操作，帮助用户精准控制录像播放过程。用户可根据事件发生节奏选择正常播放、快速浏览或反复查看关键片段。</p></li><li><p><strong>时间轴定位</strong><br>支持通过时间轴查看全天录像分布情况，并快速跳转到指定时间点。时间轴可帮助用户识别有录像和无录像的时间段，提高历史视频定位效率。</p></li><li><p><strong>裁剪导出</strong><br>支持选择指定时间范围导出所需视频片段。用户可只导出事件发生前后关键时段，避免导出过长视频，提高文件使用效率和证据整理效率。</p></li><li><p><strong>录像下载</strong><br>支持将完整录像文件或裁剪后的片段下载到本地，用于后续存档、取证、汇报或问题分析。</p></li><li><p><strong>回放与警报关联</strong><br>回放模块可与通知中心和警报详情联动。当用户查看警报记录时，可根据警报发生时间快速跳转到对应录像片段，辅助判断事件真实性和处理结果。</p></li></ul><h2>快速导览</h2><ul><li><p><a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"/zh/docs/v1/playback/grid-layout\">回放录像</a></p></li><li><p><a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"/zh/docs/v1/playback/list-layout\">回放列表</a></p></li><li><p><a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"/zh/docs/v1/playback/player-controls\">播放器控件</a></p></li></ul><h2>使用建议</h2><p>在进行事件复盘时，建议先从通知详情或警报时间中确认关键时间点，再进入回放模块按相机和日期进行检索。若事件涉及多个区域，可使用网格布局同时查看多路相机画面，辅助还原事件经过。</p><p>需要导出证据时，应先确认事件发生的准确时间范围，再进行裁剪导出。建议只导出事件发生前后一段关键视频，避免导出过长录像文件，减少存储占用和传输成本。</p><p>当回放画面加载缓慢或无法播放时，可检查相机是否在该时间段内正常在线、录像计划是否启用、磁盘存储是否正常，以及当前用户是否具备查看和下载该相机录像的权限。</p><h2>界面示例</h2><img src=\"/media/polytron-one/uploads/20260624081937-in0278-Playback_1.png\" alt=\"Playback 1\" title=\"Playback 1\">",
    "mediaAssets": [
      {
        "id": "playback-overview",
        "type": "video",
        "title": "回放操作演示",
        "url": "/media/polytron-one/playback-overview.mp4",
        "caption": "回放操作演示"
      },
      {
        "id": "image-20260624081937-in0278",
        "type": "image",
        "title": "Playback 1",
        "url": "/media/polytron-one/uploads/20260624081937-in0278-Playback_1.png",
        "caption": "Playback 1"
      }
    ],
    "sections": [
      {
        "id": "模块能力",
        "heading": "模块能力",
        "body": "历史检索：按相机、日期、录像类型等条件定位录像。 多画面回看：通过网格布局同时查看多路相机回放。 列表下载：通过列表布局选择单个或多个录像文件下载。 播放控制：支持上一段、下一段、后退、暂停和倍速播放。 裁剪导出：选择时间范围后导出所需视频片段。"
      },
      {
        "id": "快速导览",
        "heading": "快速导览",
        "body": "网格布局 列表布局 播放器控件"
      },
      {
        "id": "使用建议",
        "heading": "使用建议",
        "body": "事件复盘时，建议先在通知详情或警报时间中确认关键时间点，再进入回放模块按相机和日期检索。需要导出证据时，应优先裁剪准确时间范围，避免导出过长视频。"
      }
    ]
  },
  {
    "id": "v1-playback-grid-layout",
    "title": "回放录像",
    "route": "/zh/docs/v1/playback/grid-layout",
    "category": "回放",
    "status": "Published",
    "owner": "产品运营",
    "updatedAt": "2026-07-07",
    "version": "V1",
    "readingTime": 1,
    "summary": "回放录像用于查看指定相机在指定时间段内的历史视频画面，帮助用户进行事件核查、异常行为确认、现场情况追溯和录像证据留存。用户可通过选择相机、切换视图模式、拖动时间轴、控制播放进度、调整播放倍速和导出视频片段等方式，快速定位并回看目标录像内容。",
    "tags": [
      "回放",
      "网格布局",
      "中文",
      "V1"
    ],
    "contentHtml": "<h2>概览</h2><p>该页面主要用于历史视频核查、事件回溯和警报复盘。当发生警报事件、异常行为或需要追溯现场情况时，用户可以进入回放录像页面，按照相机、日期、时间范围和录像类型查找对应历史视频。系统会根据用户选择的条件加载录像数据，并在回放画布中展示视频画面，便于用户查看事件发生前后的视频证据。</p><h2>功能说明</h2><ul><li><p><strong>回放画面查看</strong><br>支持在回放画布中播放选中相机的历史录像，并展示相机名称、画面时间、录像画面内容和相关标识信息。用户可通过该画面核查指定时间点的现场情况，判断事件发生过程和异常行为细节。</p></li><li><p><strong>视图模式切换</strong><br>支持在网格模式和列表模式之间切换。网格模式适合多路相机同步回放和多角度事件复盘；列表模式适合查看录像文件清单、筛选录像资源、核对录像时间和下载录像文件。</p></li><li><p><strong>相机选择</strong><br>支持从右侧相机列表中选择需要回放的相机。用户可通过加减按钮控制相机是否加入当前回放画布，从而灵活配置需要查看的视频画面。</p></li><li><p><strong>相机搜索</strong><br>支持通过关键词搜索目标相机，例如相机编号、IP 地址、名称或安装位置，便于用户在相机数量较多的情况下快速定位目标设备。</p></li><li><p><strong>相机分组展示</strong><br>支持按照办公区、楼层、区域或分组结构展示相机列表。用户可展开对应分组，按空间位置查找相机，提高设备选择和录像检索效率。</p></li><li><p><strong>回放画布展示</strong><br>支持将选中的相机录像加载到回放画布中进行播放。画布中可显示相机名称、录像时间、画面标识和播放状态，便于用户确认当前回放内容来源。</p></li><li><p><strong>时间轴控制</strong><br>页面底部提供 0–24 小时时间轴，蓝色区段表示该时间范围内存在录像数据。用户可拖动时间指针快速跳转至指定时间点，减少手动查找录像片段的时间。</p></li><li><p><strong>录像时间定位</strong><br>支持通过时间轴刻度识别录像起止范围，帮助用户区分有录像和无录像的时间段。该功能适合在事件发生时间较明确时快速定位关键画面。</p></li><li><p><strong>播放控制</strong><br>支持播放、暂停、上一段、下一段、快进、快退等基础播放控制，便于用户精准查看录像内容。用户可反复查看关键片段，确认事件发生前后的画面变化。</p></li><li><p><strong>倍速播放</strong><br>支持切换不同播放倍速，例如 x1、x3、x5。正常倍速适合细看关键画面，高倍速适合快速浏览长时间录像，提高历史视频排查效率。</p></li><li><p><strong>片段导出</strong><br>支持导出指定时间范围内的录像片段，用于事件取证、视频留档、问题复盘或后续分析。用户可根据事件发生时间裁剪关键片段，避免导出过长视频。</p></li><li><p><strong>录像下载</strong><br>支持下载完整录像或导出的录像片段，便于用户进行本地存档、汇报提交、证据保存或外部系统使用。</p></li><li><p><strong>日期选择</strong><br>支持切换录像日期。系统会根据所选日期刷新对应相机的录像时间轴和可播放片段，便于用户查找不同日期下的历史视频。</p></li><li><p><strong>刷新录像数据</strong><br>支持重新加载当前相机的录像数据、时间轴状态和播放画面。当出现视频加载异常、录像数据更新或时间轴未刷新时，可通过刷新操作重新获取数据。</p></li><li><p><strong>全屏查看</strong><br>支持将回放画面切换为全屏模式，适合查看视频细节、进行事件复盘或在大屏环境中展示录像内容。</p></li><li><p><strong>回放与警报关联</strong><br>回放录像可与通知中心和警报详情联动。当用户从警报记录进入回放时，可根据警报发生时间快速定位对应录像片段，辅助判断警报真实性和处理结果。</p></li></ul><h2>使用场景</h2><ul><li><p><strong>事件复盘</strong><br>当发生警报事件、异常行为或安全事件后，用户可通过回放录像查看事件发生前后的现场画面，还原事件过程。</p></li><li><p><strong>视频取证</strong><br>当需要保留事件证据时，用户可定位关键时间段并导出录像片段，用于内部复盘、安防取证或后续处理。</p></li><li><p><strong>异常行为确认</strong><br>当通知中心出现人员徘徊、越界、摔倒、未授权进入等事件时，用户可通过回放录像确认事件是否真实发生。</p></li><li><p><strong>多相机对比查看</strong><br>当事件涉及多个区域或多个相机时，用户可通过网格回放同时查看多路视频，辅助判断目标移动路径和事件影响范围。</p></li><li><p><strong>录像完整性检查</strong><br>用户可通过时间轴查看指定相机在一天内的录像分布，判断录像计划是否正常执行，以及是否存在录像缺失情况。</p></li></ul><h2>使用建议</h2><p>在进行事件复盘时，建议先从通知详情、警报时间或事件记录中确认关键时间点，再进入回放录像页面按相机和日期进行检索。若事件涉及多个区域，可使用网格布局同时查看多路相机画面，辅助还原事件经过。</p><p>需要导出证据时，应先确认事件发生的准确时间范围，再进行裁剪导出。建议只导出事件发生前后一段关键视频，避免导出过长录像文件，减少存储占用和传输成本。</p><p>当回放画面加载缓慢或无法播放时，应优先检查相机在该时间段是否在线、录像计划是否启用、磁盘存储是否正常，以及当前用户是否具备查看和下载该相机录像的权限。如果时间轴无录像数据，也需要确认该相机在对应日期是否配置录像规则。</p><h2>界面示例</h2><img src=\"/media/polytron-one/uploads/20260624092432-03gd1a-Playback_2.png\" alt=\"Playback 2\" title=\"Playback 2\">",
    "mediaAssets": [
      {
        "id": "playback-grid-layout-playback-overview",
        "type": "video",
        "title": "回放网格操作演示",
        "url": "/media/polytron-one/playback-overview.mp4",
        "caption": "回放网格操作演示"
      },
      {
        "id": "image-20260624092432-03gd1a",
        "type": "image",
        "title": "Playback 2",
        "url": "/media/polytron-one/uploads/20260624092432-03gd1a-Playback_2.png",
        "caption": "Playback 2"
      }
    ],
    "sections": [
      {
        "id": "概览",
        "heading": "概览",
        "body": "网格布局适合多路相机同时查看回放。"
      },
      {
        "id": "功能说明",
        "heading": "功能说明",
        "body": "切换布局：在网格视图和列表视图之间切换。 搜索相机：按 ID 或名称过滤相机。 移除相机：从回放网格中移除相机。 添加相机：选择相机并分配到网格。 相机树状结构列表：从系统相机结构中选择设备。 选择日期：查看指定日期录像。 裁剪并导出视频：选择时间范围并导出到本地。 全屏模式：扩展播放器视图。"
      }
    ]
  },
  {
    "id": "v1-playback-list-layout",
    "title": "回放列表",
    "route": "/zh/docs/v1/playback/list-layout",
    "category": "回放",
    "status": "Published",
    "owner": "产品运营",
    "updatedAt": "2026-07-07",
    "version": "V1",
    "readingTime": 1,
    "summary": "回放列表用于集中展示系统已生成的历史录像记录，帮助用户按相机、位置、日期时间、录像类型等条件快速检索目标视频片段。该页面通常用于历史录像查找、事件回溯、视频取证和录像下载管理，是用户从大量录像资源中定位目标视频的重要入口。",
    "tags": [
      "回放",
      "列表布局",
      "中文",
      "V1"
    ],
    "contentHtml": "<h2>概览</h2><p>用户可通过搜索、筛选、视图切换、单选、多选、全选和下载等功能，对历史录像进行统一查看和管理。列表模式适合查看录像的详细字段信息，例如相机 ID、安装位置、录像类型、开始时间、结束时间和视频时长；网格模式则适合快速浏览录像缩略图，帮助用户通过画面内容判断目标录像是否符合需求。</p><p>该页面主要服务于安防事件复盘、警报视频查找、历史记录归档和录像证据导出等场景。用户可先通过筛选条件缩小录像范围，再选择单个或多个录像文件进行下载，提升录像查找和证据整理效率。</p><h2>功能说明</h2><ul><li><p><strong>录像列表查看</strong><br>支持以列表形式展示历史录像记录，包括相机 ID、位置、录像类型、开始时间、结束时间、视频时长及下载入口等信息。用户可通过列表快速核对录像所属相机、发生位置和时间范围，判断该录像是否与目标事件匹配。</p></li><li><p><strong>录像搜索</strong><br>支持通过关键词搜索录像记录，例如相机 ID、相机名称、IP 地址、安装位置或相关描述信息。该功能适合在录像数量较多时快速定位目标设备或目标区域，减少逐条查找的操作成本。</p></li><li><p><strong>录像筛选</strong><br>支持按日期范围、时间范围和录像类型进行筛选。用户可根据事件发生时间或警报记录中的时间信息，快速查找指定时间段内的录像数据，提高历史视频检索效率。</p></li><li><p><strong>录像类型筛选</strong><br>支持按录像类型查找视频，例如全部录像、连续录像、快照、警报关联录像或其他系统定义的录像类型。用户可根据实际需求选择对应类型，避免在无关录像中反复查找。</p></li><li><p><strong>列表 / 网格视图切换</strong><br>支持在列表模式和网格模式之间切换。列表模式适合查看详细字段和进行批量管理；网格模式适合通过视频缩略图快速判断画面内容，适用于快速浏览录像资源的场景。</p></li><li><p><strong>录像缩略图预览</strong><br>每条录像记录可展示视频缩略图或首帧画面，帮助用户快速判断录像内容是否包含目标区域、目标人员、目标车辆或相关事件画面，从而提高查找效率。</p></li><li><p><strong>单条录像选择</strong><br>支持勾选单条录像记录，用于对指定录像进行下载、查看或后续操作。用户可根据列表中的时间、位置、相机 ID 和视频时长确认目标录像后再执行操作。</p></li><li><p><strong>批量选择录像</strong><br>支持一次选择多条录像记录，便于用户对多个时间段、多个相机或多个事件相关视频进行统一处理。该功能适合事件取证、批量归档和多片段下载场景。</p></li><li><p><strong>全选录像</strong><br>支持对当前列表页中的录像进行全选操作，适用于需要批量导出或集中下载当前筛选结果的场景。全选范围建议仅作用于当前页或当前筛选结果，避免用户误选过多录像文件。</p></li><li><p><strong>单条录像下载</strong><br>支持点击单条录像右侧的下载按钮，下载该条录像对应的视频文件。该功能适用于用户只需要保存某一个指定时间段录像的场景。</p></li><li><p><strong>批量下载视频</strong><br>支持对已选中的多条录像进行批量下载，提升多段录像取证和归档效率。批量下载前，系统应提示所选文件数量和下载格式，避免用户误操作。</p></li><li><p><strong>下载格式选择</strong><br>支持选择不同下载格式，例如 WebP、MP4、JPG 等，以满足不同使用需求。MP4 适合保存完整视频证据，JPG 适合保存关键截图，WebP 可用于轻量化图片保存或外部系统展示。</p></li><li><p><strong>分页浏览</strong><br>当录像记录较多时，页面支持分页查看。用户可通过页码切换浏览更多历史录像，避免一次性加载过多数据影响页面性能。</p></li><li><p><strong>录像信息核查</strong><br>用户可通过列表中的时间、位置、相机 ID、录像类型和录像时长核对目标视频片段，确保下载或查看的录像与目标事件一致，减少误下载和重复查找。</p></li><li><p><strong>下载入口管理</strong><br>每条录像记录提供独立下载入口，方便用户直接获取对应录像文件。对于已选择多条记录的情况，页面可提供统一下载按钮，提高批量操作效率。</p></li><li><p><strong>检索结果管理</strong><br>当用户完成搜索或筛选后，列表应展示符合条件的录像结果，并保留当前筛选条件，方便用户继续查看、选择和下载。若无符合条件的录像，应显示空状态提示。</p></li></ul><h2>使用场景</h2><ul><li><p><strong>历史录像检索</strong><br>用户需要查找某个相机在指定时间段内的历史录像时，可通过搜索和筛选快速定位目标视频。</p></li><li><p><strong>警报事件复盘</strong><br>当通知中心或警报详情中出现异常事件时，用户可根据警报时间、位置和相机信息，在回放列表中查找对应录像进行复盘。</p></li><li><p><strong>视频证据下载</strong><br>当需要保存事件证据时，用户可勾选相关录像记录，并下载为指定格式，用于后续归档、上报或分析。</p></li><li><p><strong>多相机录像整理</strong><br>如果同一事件涉及多个相机，用户可通过批量选择和下载功能，一次性导出多个相关录像片段。</p></li><li><p><strong>录像资源核查</strong><br>运维人员可通过回放列表核查录像是否按计划生成，确认指定相机在指定时间段内是否存在录像记录。</p></li></ul><h2>使用建议</h2><p>在查找目标录像时，建议先明确事件发生时间、相机位置和录像类型，再使用搜索与筛选功能缩小范围。若已知相机 ID 或具体位置，可优先使用关键词搜索；若只知道事件大致时间，可通过日期范围和时间范围进行筛选。</p><p>需要下载证据时，建议先通过录像缩略图、开始时间、结束时间和视频时长确认录像是否正确，再进行单条或批量下载。对于较长录像，建议优先裁剪或选择关键时间段，避免下载过大的视频文件。</p><p>当录像记录较多时，建议使用列表模式核对详细信息；当需要快速判断画面内容时，可切换为网格模式浏览缩略图。若筛选后无录像结果，应检查相机是否在线、录像计划是否启用、所选日期是否正确，以及当前账号是否具备查看该相机录像的权限。</p><h2>界面示例</h2><img src=\"/media/polytron-one/uploads/20260624091141-63br3j-playback_list.png\" alt=\"playback list\" title=\"playback list\">",
    "mediaAssets": [
      {
        "id": "playback-list-layout-playback-overview",
        "type": "video",
        "title": "回放列表操作演示",
        "url": "/media/polytron-one/playback-overview.mp4",
        "caption": "回放列表操作演示"
      },
      {
        "id": "image-20260624091141-63br3j",
        "type": "image",
        "title": "playback list",
        "url": "/media/polytron-one/uploads/20260624091141-63br3j-playback_list.png",
        "caption": "playback list"
      }
    ],
    "sections": [
      {
        "id": "概览",
        "heading": "概览",
        "body": "列表布局适合按条件检索并下载录像。"
      },
      {
        "id": "功能说明",
        "heading": "功能说明",
        "body": "按相机 ID 搜索。 按日期范围和录像类型筛选。 全选当前页面视频。 选择单个视频。 批量下载所选视频。 下载单个视频。 分页浏览回放结果。"
      }
    ]
  },
  {
    "id": "v1-playback-player-controls",
    "title": "播放器控件",
    "route": "/zh/docs/v1/playback/player-controls",
    "category": "回放",
    "status": "Published",
    "owner": "产品运营",
    "updatedAt": "2026-07-07",
    "version": "V1",
    "readingTime": 1,
    "summary": "播放器控件用于控制回放录像的播放、暂停、时间定位、倍速切换、片段导出、录像下载、刷新和全屏查看等操作。用户可通过播放器控件快速定位目标录像时间点，并结合底部时间轴查看录像分布情况，对历史视频进行精准回看和事件核查。",
    "tags": [
      "回放",
      "播放器控件",
      "中文",
      "V1"
    ],
    "contentHtml": "<h2>概览</h2><p>播放器控件用于控制回放录像的播放、暂停、时间定位、倍速切换、片段导出、录像下载、刷新和全屏查看等操作。用户可通过播放器控件快速定位目标录像时间点，并结合底部时间轴查看录像分布情况，对历史视频进行精准回看和事件核查。</p><h2>功能说明</h2><ul><li><p><strong>日期选择</strong><br>支持选择需要查看的录像日期。用户切换日期后，系统会根据所选日期重新加载对应相机的录像数据、时间轴状态和可播放片段，便于查看不同日期下的历史视频。</p></li><li><p><strong>录像下载</strong><br>支持下载当前选中的录像内容，用于视频留档、事件取证、内部复盘或后续分析。下载前，用户应确认相机、日期和时间段是否与目标事件一致，避免下载错误录像。</p></li><li><p><strong>片段导出</strong><br>支持截取并导出指定时间范围内的录像片段。用户可通过时间轴定位事件发生前后的关键时间段，只导出有效视频内容，减少文件体积，提高证据整理和传输效率。</p></li><li><p><strong>上一段 / 后退控制</strong><br>支持向前跳转到上一段录像或前一个时间节点，便于用户回看事件发生前的画面。该功能适合用于查看异常事件出现前的人员行为、环境变化或设备状态。</p></li><li><p><strong>播放 / 暂停</strong><br>支持控制当前录像的播放状态。播放中可暂停查看关键画面，暂停后可继续播放。该功能适用于用户需要仔细确认某一帧画面、人员动作或事件细节的场景。</p></li><li><p><strong>下一段 / 前进控制</strong><br>支持向后跳转到下一段录像或后一个时间节点，便于用户快速查看事件后续发展过程。例如查看人员离开路径、异常行为结束时间或现场处置过程。</p></li><li><p><strong>倍速播放</strong><br>支持切换不同播放速度，例如 x1、x3、x5。正常倍速适合查看关键细节，高倍速适合快速浏览长时间录像，提高排查效率。用户可根据事件复杂程度选择合适倍速。</p></li><li><p><strong>时间轴控制</strong><br>底部时间轴按 0–24 小时展示全天录像分布情况。蓝色区段表示该时间范围内存在录像数据，空白区段表示当前时间范围内无录像或未生成录像。用户可拖动时间指针快速定位到指定时间点。</p></li><li><p><strong>录像时间定位</strong><br>支持通过时间轴刻度查看当前播放时间，并根据录像片段分布判断有录像和无录像的时间范围。该功能适合在已知事件时间点的情况下快速定位对应视频片段。</p></li><li><p><strong>刷新录像数据</strong><br>支持重新加载当前相机的录像数据、时间轴状态和播放画面。当视频加载异常、时间轴未更新、录像数据刚生成或系统数据发生变化时，可通过刷新操作重新获取最新录像信息。</p></li><li><p><strong>全屏查看</strong><br>支持将回放画面切换为全屏模式，便于用户查看视频细节。全屏模式适合事件复盘、画面核查、会议展示或需要放大查看人员、物品、车辆等细节的场景。</p></li><li><p><strong>网格 / 列表模式切换</strong><br>支持在网格模式和列表模式之间切换。网格模式适合多路相机同步回放，便于多角度查看事件经过；列表模式适合查看录像文件清单、筛选录像资源和进行下载管理。</p></li><li><p><strong>播放进度识别</strong><br>播放过程中，系统应在时间轴上显示当前播放位置，帮助用户判断视频正在播放的具体时间点。用户可结合时间轴和视频画面快速确认事件发生的前后顺序。</p></li><li><p><strong>录像片段状态识别</strong><br>系统应通过时间轴区段展示录像数据是否存在，帮助用户判断指定时间段是否可回放。若某个时间段无录像数据，用户应进一步检查相机在线状态、录像计划和存储配置。</p></li></ul><h2>使用建议</h2><p>进行事件复盘时，建议先确认事件发生的相机、日期和大致时间，再通过时间轴快速定位目标片段。若事件时间不完全明确，可先使用倍速播放快速浏览，再在关键画面处暂停并细看。</p><p>需要导出视频证据时，建议只选择事件发生前后一段关键时间范围，避免导出过长录像造成文件过大、下载耗时或后续查阅不便。若视频用于正式留档，应同时记录相机名称、录像时间、导出时间和操作人员信息。</p><p>当播放器无法正常播放时，应优先检查当前时间段是否存在录像数据、相机是否在线、录像计划是否启用、磁盘存储是否正常，以及当前账号是否具备查看和下载该相机录像的权限。</p><h2>界面示例</h2><img src=\"/media/polytron-one/uploads/20260624091402-njfsll-Playback_control.png\" alt=\"Playback control\" title=\"Playback control\">",
    "mediaAssets": [
      {
        "id": "playback-player-controls-playback-overview",
        "type": "video",
        "title": "回放播放器演示",
        "url": "/media/polytron-one/playback-overview.mp4",
        "caption": "回放播放器演示"
      },
      {
        "id": "image-20260624091402-njfsll",
        "type": "image",
        "title": "Playback control",
        "url": "/media/polytron-one/uploads/20260624091402-njfsll-Playback_control.png",
        "caption": "Playback control"
      }
    ],
    "sections": [
      {
        "id": "概览",
        "heading": "概览",
        "body": "播放器控件用于精确查看回放录像。"
      },
      {
        "id": "功能说明",
        "heading": "功能说明",
        "body": "上一个录像：跳转到上一个回放文件，通常以 15 分钟为间隔。 倒回 15 秒：播放位置向后移动 15 秒。 播放/暂停：开始或暂停播放。 下一个录像：跳转到下一个回放文件。 播放速度：支持 1 倍、3 倍、5 倍。"
      }
    ]
  },
  {
    "id": "en-v1-playback",
    "title": "Overview",
    "route": "/en/docs/v1/playback",
    "category": "Playback",
    "status": "Published",
    "owner": "Product operations",
    "updatedAt": "2026-07-07",
    "version": "V1",
    "readingTime": 1,
    "summary": "In daily security management, users usually enter the historical video viewing process from real-time monitoring or notification details. The playback module supports users to search for videos based on conditions such as camera, date, time range, and recording type, and provides viewing methods such as grid layout, list layout, and player control. Users can compare videos from different cameras in multi-channel playback screens, quickly locate specific video files through lists, and crop and export key time periods.\n\nThis module is suitable for scenarios such as event review, alarm verification, video forensics, abnormal behavior confirmation, equipment operation tracing, and historical record archiving. It is the core functional entrance from \"real-time viewing\" to \"history tracing\".",
    "tags": [
      "Playback",
      "Overview",
      "English",
      "V1"
    ],
    "contentHtml": "<h2>Module Capabilities</h2><ul><li><p><strong>History search</strong><br>Supports locating historical recordings by camera, date, time range, recording type and other conditions. Users can quickly filter target videos based on event occurrence time or time information in alarm records, reducing the time cost of searching one by one in a large number of video files.</p></li><li><p><strong>Search by camera</strong><br>Users can choose to specify a camera to view the corresponding historical video, which is suitable for checking historical footage of a fixed area, passage, entrance or key point. If the incident involves multiple cameras, you can also select the relevant cameras for comparison.</p></li><li><p><strong>Search by date and time</strong><br>Support users to select specific dates and time periods for video query. The system will load the corresponding recording data according to the selected time range, and display the playable clips in the timeline or list, allowing users to quickly locate the scenes before and after the event.</p></li><li><p><strong>Search by video type</strong><br>Supports filtering historical files based on recording type, such as continuous recording, event recording, snapshot or alarm-related recording, etc. Users can select the appropriate type according to the verification purpose to improve search efficiency.</p></li><li><p><strong>Multi-screen viewing</strong><br>Supports simultaneous viewing of playback images from multiple cameras through grid layout, which is suitable for scenarios where events pass through multiple areas, multi-angle comparisons are required, or images from different cameras at the same time period are viewed.</p></li><li><p><strong>List view</strong><br>Supports displaying video files in list form, and users can view information such as camera ID, location, recording type, start time, end time, duration, and download entry. List mode is suitable for batch search, filtering and management of recording resources.</p></li><li><p><strong>List download</strong><br>Users can select single or multiple video files in the video list for download, which is suitable for scenarios such as evidence preservation, event archiving, external review, or submission to relevant personnel for review.</p></li><li><p><strong>Player controls</strong><br>Supports operations such as previous segment, next segment, rewind, pause, playback and double-speed playback, helping users accurately control the video playback process. Users can choose to play normally, browse quickly or view key clips repeatedly according to the rhythm of events.</p></li><li><p><strong>Timeline positioning</strong><br>Supports viewing the distribution of recordings throughout the day through the timeline and quickly jumping to a specified time point. The timeline can help users identify the time periods with and without recording, and improve the efficiency of historical video positioning.</p></li><li><p><strong>Crop export</strong><br>Supports selecting a specified time range to export required video clips. Users can export only the key periods before and after the incident to avoid exporting too long videos and improve the efficiency of file usage and evidence collection.</p></li><li><p><strong>Video download</strong><br>Supports downloading complete video files or trimmed clips to the local computer for subsequent archiving, evidence collection, reporting or problem analysis.</p></li><li><p><strong>Replay and alarm association</strong><br>The playback module can be linked with the notification center and alarm details. When users view the alarm record, they can quickly jump to the corresponding video clip based on the time when the alarm occurred to help determine the authenticity of the event and the processing results.</p></li></ul><h2>Quick Guide</h2><ul><li><p><a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"/en/docs/v1/playback/grid-layout\">Playback Recordings</a></p></li><li><p><a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"/en/docs/v1/playback/list-layout\">Playback List</a></p></li><li><p><a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"/en/docs/v1/playback/player-controls\">Player Controls</a></p></li></ul><h2>Usage Suggestions</h2><p>When reviewing an event, it is recommended to first confirm the key time points from the notification details or alarm time, and then enter the playback module to search by camera and date. If the incident involves multiple areas, you can use the grid layout to view multiple camera images at the same time to help restore the incident process.</p><p>When you need to export evidence, you should first confirm the accurate time range of the event before cropping and exporting. It is recommended to export only a key video before and after the incident to avoid exporting long video files and reduce storage usage and transmission costs.</p><p>When the playback screen loads slowly or cannot be played, you can check whether the camera is online normally during the time period, whether the recording plan is enabled, whether the disk storage is normal, and whether the current user has the permission to view and download the camera recordings.</p><h2>Interface Example</h2><img src=\"/media/polytron-one/uploads/en/20260702061419-x0ce3s-Playback1.png\" alt=\"Playback1\">",
    "mediaAssets": [
      {
        "id": "image-20260702061419-x0ce3s",
        "type": "image",
        "title": "Playback1",
        "url": "/media/polytron-one/uploads/en/20260702061419-x0ce3s-Playback1.png",
        "caption": "Playback1"
      }
    ],
    "sections": [
      {
        "id": "module-capabilities",
        "heading": "Module Capabilities",
        "body": "History search: Locate videos by camera, date, video type and other conditions. Multi-screen playback: View multi-channel camera playback at the same time through grid layout. List download: Select single or multiple video files to download through the list layout. Playback control: Supports previous paragraph, next paragraph, rewind, pause and double-speed playback. Crop export: Export the desired video clip after selecting the time range."
      },
      {
        "id": "quick-tour",
        "heading": "Quick Guide",
        "body": "Grid layout List layout Player controls"
      },
      {
        "id": "usage-suggestions",
        "heading": "Usage Suggestions",
        "body": "When reviewing an event, it is recommended to first confirm the key time points in the notification details or alarm time, and then enter the playback module to search by camera and date. When you need to export evidence, you should give priority to cropping the accurate time range to avoid exporting too long videos."
      }
    ]
  },
  {
    "id": "en-v1-playback-grid-layout",
    "title": "Playback Recordings",
    "route": "/en/docs/v1/playback/grid-layout",
    "category": "Playback",
    "status": "Published",
    "owner": "Product operations",
    "updatedAt": "2026-07-07",
    "version": "V1",
    "readingTime": 1,
    "summary": "Playback video is used to view historical video footage from a designated camera within a designated time period, helping users conduct event verification, abnormal behavior confirmation, on-site situation tracing, and video evidence retention. Users can quickly locate and review target recording content by selecting a camera, switching view modes, dragging the timeline, controlling playback progress, adjusting playback speed, and exporting video clips.",
    "tags": [
      "Playback",
      "Grid Layout",
      "English",
      "V1"
    ],
    "contentHtml": "<h2>Overview</h2><p>This page is mainly used for historical video verification, event review, and alarm review. When an alarm event, abnormal behavior occurs or the on-site situation needs to be traced, the user can enter the playback recording page and search for the corresponding historical video according to the camera, date, time range and recording type. The system will load the video data according to the conditions selected by the user and display the video footage in the playback canvas, making it easier for users to view video evidence before and after the incident.</p><h2>Function Description</h2><ul><li><p><strong>View playback screen</strong><br>Supports playing the historical recordings of the selected camera in the playback canvas, and displays the camera name, screen time, video content and related identification information. Users can use this screen to check the on-site situation at the specified time point and determine the incident process and abnormal behavior details.</p></li><li><p><strong>View mode switch</strong><br>Supports switching between grid mode and list mode. Grid mode is suitable for simultaneous playback of multiple cameras and multi-angle event review; list mode is suitable for viewing the list of video files, filtering video resources, checking recording time and downloading video files.</p></li><li><p><strong>Camera selection</strong><br>Supports selecting the camera to be played back from the camera list on the right. Users can use the plus and minus buttons to control whether the camera is added to the current playback canvas, thereby flexibly configuring the video images to be viewed.</p></li><li><p><strong>Camera search</strong><br>Supports searching for target cameras by keywords, such as camera number, IP address, name or installation location, allowing users to quickly locate the target device when there are a large number of cameras.</p></li><li><p><strong>Camera group display</strong><br>Supports displaying the camera list according to office area, floor, area or group structure. Users can expand corresponding groups and search for cameras by spatial location, improving the efficiency of equipment selection and video retrieval.</p></li><li><p><strong>Playback canvas display</strong><br>Supports loading selected camera recordings into the playback canvas for playback. The camera name, recording time, screen logo and playback status can be displayed on the canvas to facilitate users to confirm the source of the current playback content.</p></li><li><p><strong>Timeline control</strong><br>The 0–24 hour timeline is provided at the bottom of the page, and the blue section indicates that recording data exists within this time range. Users can drag the time pointer to quickly jump to a specified time point, reducing the time of manually searching for video clips.</p></li><li><p><strong>Recording time positioning</strong><br>Supports identifying the start and end range of recording through the timeline scale, helping users distinguish between periods with and without recording. This function is suitable for quickly locating key images when the time of event occurrence is relatively clear.</p></li><li><p><strong>Playback controls</strong><br>It supports basic playback controls such as play, pause, previous segment, next segment, fast forward, and rewind, making it easy for users to accurately view the video content. Users can view key clips repeatedly to confirm the changes in the scene before and after the event.</p></li><li><p><strong>Play at double speed</strong><br>Support switching different playback speeds, such as x1, x3, x5. The normal speed is suitable for viewing key scenes in detail, while the high speed is suitable for quickly browsing long-term recordings to improve the efficiency of historical video troubleshooting.</p></li><li><p><strong>Clip export</strong><br>Supports exporting video clips within a specified time range for incident forensics, video archiving, problem review or subsequent analysis. Users can crop key clips according to the time of the event to avoid exporting too long videos.</p></li><li><p><strong>Video download</strong><br>Supports downloading of complete videos or exported video clips, which is convenient for users to archive locally, submit reports, save evidence, or use external systems.</p></li><li><p><strong>date selection</strong><br>Support switching recording date. The system will refresh the recording timeline and playable clips of the corresponding camera based on the selected date, making it easier for users to find historical videos on different dates.</p></li><li><p><strong>Refresh video data</strong><br>Supports reloading the current camera's recording data, timeline status and playback screen. When a video loading exception occurs, the recording data is updated, or the timeline is not refreshed, the data can be reacquired through the refresh operation.</p></li><li><p><strong>View full screen</strong><br>Supports switching the playback screen to full-screen mode, suitable for viewing video details, reviewing events, or displaying video content in a large-screen environment.</p></li><li><p><strong>Replay and alarm association</strong><br>Video playback can be linked to the notification center and alarm details. When the user enters the playback from the alarm record, the corresponding video clip can be quickly located according to the time when the alarm occurred to assist in judging the authenticity of the alarm and the processing result.</p></li></ul><h2>Usage Scenarios</h2><ul><li><p><strong>Event review</strong><br>When an alarm event, abnormal behavior or security incident occurs, users can view the live footage before and after the event by playing back the video and restore the event process.</p></li><li><p><strong>Video forensics</strong><br>When event evidence needs to be preserved, users can locate key time periods and export video clips for internal review, security evidence collection, or subsequent processing.</p></li><li><p><strong>Abnormal behavior confirmation</strong><br>When incidents such as wandering, crossing boundaries, falling, or unauthorized entry occur in the notification center, users can play back the video to confirm whether the incident actually occurred.</p></li><li><p><strong>Compare multiple cameras</strong><br>When an incident involves multiple areas or multiple cameras, users can view multiple videos at the same time through grid playback to help determine the target movement path and the impact scope of the incident.</p></li><li><p><strong>Video integrity check</strong><br>Users can view the distribution of recordings from specified cameras within a day through the timeline, and determine whether the recording plan is being executed normally and whether there are missing recordings.</p></li></ul><h2>Usage Suggestions</h2><p>When reviewing an event, it is recommended to first confirm the key time points from the notification details, alarm time or event records, and then enter the playback recording page to search by camera and date. If the incident involves multiple areas, you can use the grid layout to view multiple camera images at the same time to help restore the incident process.</p><p>When you need to export evidence, you should first confirm the accurate time range of the event before cropping and exporting. It is recommended to export only a key video before and after the incident to avoid exporting long video files and reduce storage usage and transmission costs.</p><p>When the playback screen loads slowly or cannot be played, you should first check whether the camera is online during that time period, whether the recording plan is enabled, whether the disk storage is normal, and whether the current user has the permission to view and download the camera's recordings. If there is no recording data in the timeline, you also need to confirm whether the camera has recording rules configured on the corresponding date.</p><h2>Interface Example</h2><img src=\"/media/polytron-one/uploads/en/20260702061502-pvdjah-Playback1.png\" alt=\"Playback1\">",
    "mediaAssets": [
      {
        "id": "image-20260702061502-pvdjah",
        "type": "image",
        "title": "Playback1",
        "url": "/media/polytron-one/uploads/en/20260702061502-pvdjah-Playback1.png",
        "caption": "Playback1"
      }
    ],
    "sections": [
      {
        "id": "overview",
        "heading": "Overview",
        "body": "The grid layout is suitable for multiple cameras to view playback at the same time."
      },
      {
        "id": "function-description",
        "heading": "Function Description",
        "body": "Switch layout: Switch between grid view and list view. Search cameras: Filter cameras by ID or name. Remove Camera: Removes the camera from the playback grid. Add camera: Select a camera and assign it to the grid. Camera tree list: Select a device from the system camera structure. Select date: View the recording on the specified date. Crop and export video: Select a time range and export to local. Full screen mode: Expand the player view."
      }
    ]
  },
  {
    "id": "en-v1-playback-list-layout",
    "title": "Playback List",
    "route": "/en/docs/v1/playback/list-layout",
    "category": "Playback",
    "status": "Published",
    "owner": "Product operations",
    "updatedAt": "2026-07-07",
    "version": "V1",
    "readingTime": 1,
    "summary": "The playback list is used to centrally display the historical video records generated by the system, helping users quickly retrieve target video clips based on camera, location, date and time, video type and other conditions. This page is usually used for historical video search, event review, video forensics and video download management. It is an important entrance for users to locate target videos from a large number of video resources.",
    "tags": [
      "Playback",
      "List Layout",
      "English",
      "V1"
    ],
    "contentHtml": "<h2>Overview</h2><p>Users can uniformly view and manage historical recordings through functions such as search, filtering, view switching, single selection, multiple selection, all selection, and download. List mode is suitable for viewing detailed field information of recordings, such as camera ID, installation location, recording type, start time, end time and video duration; grid mode is suitable for quickly browsing recording thumbnails to help users judge whether the target recording meets their needs through the screen content.</p><p>This page mainly serves scenarios such as security event review, alarm video search, historical record archiving, and video evidence export. Users can first narrow down the scope of recordings by filtering conditions, and then select single or multiple video files for download, improving the efficiency of video search and evidence collection.</p><h2>Function Description</h2><ul><li><p><strong>View video list</strong><br>Supports displaying historical recording records in list form, including camera ID, location, recording type, start time, end time, video duration, download entry and other information. Users can quickly check the camera to which the video belongs, location and time range through the list to determine whether the video matches the target event.</p></li><li><p><strong>Video search</strong><br>Supports searching video records by keywords, such as camera ID, camera name, IP address, installation location or related description information. This function is suitable for quickly locating the target device or target area when there are a large number of recordings, reducing the operation cost of searching one by one.</p></li><li><p><strong>Video filtering</strong><br>Supports filtering by date range, time range and recording type. Users can quickly search for video data within a specified time period based on the event time or time information in the alarm record, improving the efficiency of historical video retrieval.</p></li><li><p><strong>Video type filter</strong><br>Supports searching for videos by recording type, such as all recordings, continuous recordings, snapshots, alarm-related recordings or other system-defined recording types. Users can select the corresponding type according to actual needs to avoid repeated searches in irrelevant videos.</p></li><li><p><strong>List/grid view switching</strong><br>Supports switching between list mode and grid mode. List mode is suitable for viewing detailed fields and batch management; grid mode is suitable for quickly judging the content of the screen through video thumbnails, and is suitable for quickly browsing video resources.</p></li><li><p><strong>Video thumbnail preview</strong><br>Each video record can display a video thumbnail or first frame, helping users quickly determine whether the video content contains the target area, target person, target vehicle or related event footage, thus improving search efficiency.</p></li><li><p><strong>Single video selection</strong><br>Supports checking a single video record for downloading, viewing or subsequent operations on the specified video. Users can confirm the target recording based on the time, location, camera ID and video duration in the list before performing operations.</p></li><li><p><strong>Select videos in batches</strong><br>Supports the selection of multiple recording records at one time, allowing users to process videos related to multiple time periods, multiple cameras or multiple events in a unified manner. This function is suitable for event forensics, batch archiving and multi-clip download scenarios.</p></li><li><p><strong>Select all videos</strong><br>Supports the selection operation of all recordings in the current list page, which is suitable for scenarios where batch export or centralized download of current filtering results is required. The full selection range is recommended to only be applied to the current page or current filter results to prevent users from accidentally selecting too many video files.</p></li><li><p><strong>Single video download</strong><br>Supports clicking the download button on the right side of a single video to download the video file corresponding to the video. This function is suitable for scenarios where users only need to save recordings of a specified period of time.</p></li><li><p><strong>Download videos in batches</strong><br>Supports batch downloading of multiple selected videos to improve the efficiency of multi-segment video evidence collection and archiving. Before batch downloading, the system should prompt the number of selected files and download format to avoid user misoperation.</p></li><li><p><strong>Download format selection</strong><br>Supports the selection of different download formats, such as WebP, MP4, JPG, etc., to meet different usage needs. MP4 is suitable for saving complete video evidence, JPG is suitable for saving key screenshots, and WebP can be used for lightweight image storage or external system display.</p></li><li><p><strong>Browse in pages</strong><br>When there are many video records, the page supports paged viewing. Users can browse more historical recordings by switching page numbers to avoid loading too much data at once and affecting page performance.</p></li><li><p><strong>Video information verification</strong><br>Users can check the target video clip through the time, location, camera ID, recording type and recording duration in the list to ensure that the downloaded or viewed recording is consistent with the target event, reducing mistaken downloads and repeated searches.</p></li><li><p><strong>Download portal management</strong><br>Each video record provides an independent download entrance to facilitate users to directly obtain the corresponding video files. For situations where multiple records have been selected, the page can provide a unified download button to improve batch operation efficiency.</p></li><li><p><strong>Search results management</strong><br>After the user completes the search or filtering, the list should display the video results that meet the conditions and retain the current filtering conditions to facilitate the user to continue viewing, selecting and downloading. If there is no video that meets the conditions, an empty status prompt should be displayed.</p></li></ul><h2>Usage Scenarios</h2><ul><li><p><strong>Historical video retrieval</strong><br>When users need to find historical recordings from a certain camera within a specified time period, they can quickly locate the target video by searching and filtering.</p></li><li><p><strong>Alarm event review</strong><br>When an abnormal event occurs in the notification center or alarm details, users can search for the corresponding video in the playback list for review based on the alarm time, location and Camera Information.</p></li><li><p><strong>Video evidence download</strong><br>When event evidence needs to be saved, users can check the relevant video records and download them to the specified format for subsequent archiving, reporting or analysis.</p></li><li><p><strong>Multi-camera video organization</strong><br>If the same incident involves multiple cameras, users can export multiple related video clips at once through the batch selection and download functions.</p></li><li><p><strong>Video resource verification</strong><br>Operation and maintenance personnel can use the playback list to check whether the recording is generated as planned and whether the specified camera has recording records within the specified time period.</p></li></ul><h2>Usage Suggestions</h2><p>When looking for target recordings, it is recommended to first clarify the time of the event, camera location and recording type, and then use the search and filter functions to narrow the scope. If you know the camera ID or specific location, you can use keyword search first; if you only know the approximate time of the event, you can filter by date range and time range.</p><p>When you need to download evidence, it is recommended to first confirm whether the recording is correct through the video thumbnail, start time, end time and video duration, and then download it individually or in batches. For longer videos, it is recommended to give priority to cropping or selecting key time periods to avoid downloading excessively large video files.</p><p>When there are a lot of video records, it is recommended to use list mode to check detailed information; when you need to quickly judge the content of the screen, you can switch to grid mode to browse thumbnails. If there are no recording results after filtering, you should check whether the camera is online, whether the recording plan is enabled, whether the selected date is correct, and whether the current account has the permission to view the camera's recordings.</p><p></p>\n\n<h2>Interface Example</h2><figure><img src=\"/media/polytron-one/uploads/en/20260702061653-7s4bpq-playback_list.png\" alt=\"playback list\"></figure>",
    "mediaAssets": [
      {
        "id": "image-20260702061653-7s4bpq",
        "type": "image",
        "title": "playback list",
        "url": "/media/polytron-one/uploads/en/20260702061653-7s4bpq-playback_list.png",
        "caption": "playback list"
      }
    ],
    "sections": [
      {
        "id": "overview",
        "heading": "Overview",
        "body": "The list layout is suitable for retrieving and downloading videos by conditions."
      },
      {
        "id": "function-description",
        "heading": "Function Description",
        "body": "Search by camera ID. Filter by date range and recording type. Select all videos on the current page. Select a single video. Batch download selected videos. Download a single video. Browse playback results in pages."
      }
    ]
  },
  {
    "id": "en-v1-playback-player-controls",
    "title": "Player Controls",
    "route": "/en/docs/v1/playback/player-controls",
    "category": "Playback",
    "status": "Published",
    "owner": "Product operations",
    "updatedAt": "2026-07-07",
    "version": "V1",
    "readingTime": 1,
    "summary": "The player control is used to control the playback, pause, time positioning, double-speed switching, clip export, video download, refresh and full-screen viewing of the playback video. Users can quickly locate the target recording time point through the player control, view the distribution of recordings based on the bottom timeline, and conduct accurate review and event verification of historical videos.",
    "tags": [
      "Playback",
      "Player Controls",
      "English",
      "V1"
    ],
    "contentHtml": "<h2>Overview</h2><p>The player control is used to control the playback, pause, time positioning, double-speed switching, clip export, video download, refresh and full-screen viewing of the playback video. Users can quickly locate the target recording time point through the player control, view the distribution of recordings based on the bottom timeline, and conduct accurate review and event verification of historical videos.</p><h2>Function Description</h2><ul><li><p><strong>date selection</strong><br>Supports selecting the recording date to be viewed. After the user switches dates, the system will reload the corresponding camera's recording data, timeline status, and playable clips based on the selected date, making it easy to view historical videos on different dates.</p></li><li><p><strong>Video download</strong><br>Supports downloading the currently selected video content for video archiving, event forensics, internal review or subsequent analysis. Before downloading, users should confirm whether the camera, date and time period are consistent with the target event to avoid downloading wrong videos.</p></li><li><p><strong>Clip export</strong><br>Supports intercepting and exporting video clips within a specified time range. Users can locate the key time periods before and after the event through the timeline, export only valid video content, reduce file size, and improve the efficiency of evidence collection and transmission.</p></li><li><p><strong>Previous paragraph/back control</strong><br>It supports jumping forward to the previous video or the previous time node, making it easier for users to review the scene before the incident. This function is suitable for viewing human behavior, environmental changes or equipment status before abnormal events occur.</p></li><li><p><strong>play/pause</strong><br>Supports controlling the playback status of the current video. You can pause to view key images during playback, and continue playing after pausing. This function is suitable for scenes where users need to carefully confirm the details of a certain frame, person's actions or events.</p></li><li><p><strong>Next paragraph / Forward control</strong><br>It supports jumping backward to the next video or the next time node, allowing users to quickly view the subsequent development process of the event. For example, view the path people leave, the end time of abnormal behavior, or the on-site disposal process.</p></li><li><p><strong>Play at double speed</strong><br>Support switching different playback speeds, such as x1, x3, x5. Normal speed is suitable for viewing key details, while high speed is suitable for quickly browsing long-term recordings to improve troubleshooting efficiency. Users can select the appropriate speed based on the complexity of the event.</p></li><li><p><strong>Timeline control</strong><br>The bottom timeline shows the distribution of recordings throughout the day from 0 to 24 hours. The blue section indicates that there is recording data in the time range, and the blank section indicates that there is no recording or no recording is generated in the current time range. Users can drag the time pointer to quickly locate the specified time point.</p></li><li><p><strong>Recording time positioning</strong><br>Supports viewing the current playback time through the timeline scale, and judging the time range with and without recording based on the distribution of video clips. This function is suitable for quickly locating corresponding video clips when the time point of the event is known.</p></li><li><p><strong>Refresh video data</strong><br>Supports reloading the current camera's recording data, timeline status and playback screen. When the video loads abnormally, the timeline is not updated, the recording data has just been generated, or the system data changes, you can re-obtain the latest recording information through the refresh operation.</p></li><li><p><strong>View full screen</strong><br>Supports switching the playback screen to full-screen mode to facilitate users to view video details. The full-screen mode is suitable for event review, screen review, conference presentation, or scenes where you need to zoom in to view details such as people, objects, vehicles, etc.</p></li><li><p><strong>Grid/list mode switching</strong><br>Supports switching between grid mode and list mode. Grid mode is suitable for synchronous playback of multiple cameras, making it easy to view events from multiple angles; list mode is suitable for viewing video file lists, filtering video resources, and download management.</p></li><li><p><strong>Playback progress recognition</strong><br>During playback, the system should display the current playback position on the timeline to help users determine the specific time point at which the video is playing. Users can quickly confirm the sequence of events by combining the timeline and video footage.</p></li><li><p><strong>Video clip status recognition</strong><br>The system should display whether the recording data exists through the timeline section to help users determine whether the specified time period can be played back. If there is no recording data in a certain period of time, the user should further check the camera online status, recording plan and storage configuration.</p></li></ul><h2>Usage Suggestions</h2><p>When reviewing an incident, it is recommended to first confirm the camera, date and approximate time of the incident, and then quickly locate the target clip through the timeline. If the time of the event is not completely clear, you can first use double-speed playback to quickly browse, then pause at the key scene and take a closer look.</p><p>When you need to export video evidence, it is recommended to only select a key time range before and after the incident to avoid exporting too long videos, which may cause excessive file size, time-consuming downloading, or inconvenience for subsequent review. If the video is used for official archiving, the camera name, recording time, export time and operator information should also be recorded.</p><p>When the player cannot play normally, you should first check whether there is recording data in the current time period, whether the camera is online, whether the recording plan is enabled, whether the disk storage is normal, and whether the current account has the permission to view and download the camera recordings.</p><h2>Interface Example</h2><img src=\"/media/polytron-one/uploads/en/20260702061727-h5lval-Playback_player.png\" alt=\"Playback player\" title=\"Playback player\">",
    "mediaAssets": [
      {
        "id": "image-20260702061727-h5lval",
        "type": "image",
        "title": "Playback player",
        "url": "/media/polytron-one/uploads/en/20260702061727-h5lval-Playback_player.png",
        "caption": "Playback player"
      }
    ],
    "sections": [
      {
        "id": "overview",
        "heading": "Overview",
        "body": "Player controls for precise viewing of playback footage."
      },
      {
        "id": "function-description",
        "heading": "Function Description",
        "body": "Previous recording: Jump to the previous playback file, usually at intervals of 15 minutes. Rewind 15 seconds: The playback position moves backward 15 seconds. Play/Pause: Start or pause playback. Next video: Jump to the next playback file. Playback speed: supports 1x, 3x, 5x."
      }
    ]
  }
];
