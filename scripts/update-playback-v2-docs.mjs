import fs from "node:fs";

const dataPath = new URL("../src/data.ts", import.meta.url);
const source = fs.readFileSync(dataPath, "utf8");
const marker = "export const initialDocs: DocPage[] = ";
const markerIndex = source.indexOf(marker);

if (markerIndex < 0) throw new Error("initialDocs marker not found");

const arrayStart = source.indexOf("[", markerIndex + marker.length);
let arrayEnd = -1;
let depth = 0;
let inString = false;
let escaped = false;

for (let index = arrayStart; index < source.length; index += 1) {
  const char = source[index];
  if (inString) {
    if (escaped) escaped = false;
    else if (char === "\\") escaped = true;
    else if (char === '"') inString = false;
    continue;
  }
  if (char === '"') inString = true;
  else if (char === "[") depth += 1;
  else if (char === "]") {
    depth -= 1;
    if (depth === 0) {
      arrayEnd = index;
      break;
    }
  }
}

if (arrayEnd < 0) throw new Error("initialDocs array end not found");

const docs = JSON.parse(source.slice(arrayStart, arrayEnd + 1));
const mediaBase = "/media/polytron-one/playback-v2";

const figure = (file, alt) =>
  `<figure><img src="${mediaBase}/${file}" alt="${alt}"></figure>`;

const list = (items) =>
  `<ul>${items.map(([title, body]) => `<li><p><strong>${title}</strong><br>${body}</p></li>`).join("")}</ul>`;

const steps = (items) =>
  `<ol>${items.map(([title, body]) => `<li><p><strong>${title}</strong>：${body}</p></li>`).join("")}</ol>`;

const enSteps = (items) =>
  `<ol>${items.map(([title, body]) => `<li><p><strong>${title}</strong>: ${body}</p></li>`).join("")}</ol>`;

const assets = (prefix, entries) =>
  entries.map(([file, title, caption], index) => ({
    id: `${prefix}-${index + 1}`,
    type: "image",
    title,
    url: `${mediaBase}/${file}`,
    caption,
  }));

const specs = {
  playback: {
    title: "概览",
    summary:
      "回放模块将智能搜索与历史录像播放整合到同一工作台。用户可以用文字、语音或附件描述目标，限定全部相机或当前视图、选择日期时间和匹配阈值，再从搜索结果直接进入单画面、多画面或时间轴回放。",
    tags: ["回放", "智能搜索", "中文"],
    contentHtml:
      "<h2>工作台概览</h2>" +
      "<p>回放页面由搜索条件区、结果列表、相机回放区和时间轴控制区组成。用户可以先描述要查找的人、行为或场景，再从命中结果定位相机和时间点，并在同一页面继续查看历史录像、比较多个相机、裁剪或下载片段。</p>" +
      "<p>推荐工作路径为“描述目标—限定范围—选择日期—检查结果—加载相机—回放核查—裁剪导出”。搜索结果与回放画面保持联动，减少在搜索页、相机页和录像页之间反复切换。</p>" +
      "<h2>核心功能</h2>" +
      list([
        ["多方式搜索入口", "搜索栏提供文字输入，并保留语音和附件入口；可通过左侧类型按钮切换当前支持的搜索方式。具体可用方式以项目部署为准。"],
        ["搜索范围", "支持在全部相机中搜索，或只搜索当前回放视图中已经加载的相机。"],
        ["日期与时间范围", "可通过日历和时间选择器限定检索区间，适合根据事件发生时间缩小范围。"],
        ["相机选择", "从分组树中按区域和楼层选择相机，支持逐台增减、自动选择、清空以及查看剩余可选数量。"],
        ["匹配阈值", "通过 Match (%) 滑杆或数值设置控制结果匹配度；阈值越高，结果通常越严格。"],
        ["结果列表", "结果展示缩略图、相机地址、位置、时间和置信度，并支持最新/最早排序、分页和清理结果。"],
        ["回放视图", "支持单画面、四画面和九画面布局。Grid 用于并排查看录像；Timeline 将搜索命中结果按时间排列，便于顺序核查。"],
        ["时间轴与取证", "底部时间轴显示有录像的区段，并提供播放、跳转、倍速、刷新、全屏、裁剪和下载入口。"],
      ]) +
      "<h2>推荐操作流程</h2>" +
      steps([
        ["输入目标", "用简短、可观察的描述输入人员、衣着、动作或场景，例如“穿红色上衣的人”。"],
        ["限定范围", "选择全部相机或当前视图，并设定日期时间；需要多画面对照时先添加目标相机。"],
        ["设置匹配度", "从中等阈值开始搜索，再根据结果数量逐步提高或降低阈值。"],
        ["核对结果", "检查缩略图、相机、地点、时间和置信度，点击结果进入对应录像。"],
        ["回放与导出", "在网格中对照录像，或在 Timeline 中按时间查看命中结果，最后裁剪并下载必要片段。"],
      ]) +
      "<h2>界面示例</h2>" +
      figure("playback-overview-zh.png", "回放功能概览"),
    mediaAssets: assets("playback-v2-overview", [
      ["playback-overview-zh.png", "回放功能概览", "回放工作台核心功能与操作入口"],
    ]),
    sections: [
      { id: "工作台概览", heading: "工作台概览", body: "搜索与历史回放位于同一工作台。" },
      { id: "核心功能", heading: "核心功能", body: "搜索、范围、日期、相机、结果、视图和时间轴。" },
      { id: "推荐操作流程", heading: "推荐操作流程", body: "从描述目标到回放导出。" },
      { id: "界面示例", heading: "界面示例", body: "产品界面示例。" },
    ],
  },
  "playback-grid-layout": {
    title: "搜索与多画面回放",
    summary:
      "搜索与多画面回放页面用于同时限定搜索范围、选择相机并在单画面、四画面或九画面中核查历史录像。",
    tags: ["回放", "多画面", "相机选择"],
    contentHtml:
      "<h2>功能介绍</h2><p>多画面工作区将相机选择、智能搜索结果和历史录像放在同一页面。用户可从右侧相机树加载设备，也可以先搜索目标，再把结果对应的相机加入当前视图进行对照。</p>" +
      "<h2>相机与布局</h2>" +
      list([
        ["分组选择相机", "相机选择抽屉按区域、楼层和设备组织资源，可搜索相机，并通过加减按钮控制每台相机的选择数量。"],
        ["自动选择与清空", "Auto Select 用于快速填充可用窗口，Clear All 用于移除当前选择；顶部会提示还能选择多少台相机。"],
        ["单/四/九画面", "布局按钮分别切换单画面、四画面和九画面。空窗口显示加号，可继续添加相机。"],
        ["当前视图搜索", "选择 Cameras in Current View 后，只在已加载到回放网格的相机中执行搜索，适合缩小跨镜头核查范围。"],
        ["窗口操作", "选中的窗口以边框标识，并提供移除和全屏入口；Clear All Cameras 可一次清空回放画面。"],
        ["Grid / Timeline", "Grid 适合并排核查录像；Timeline 将搜索命中结果按时间排列，选择节点后可查看该结果的详情与画面。"],
      ]) +
      "<h2>操作建议</h2><p>先根据事件位置选择相机，再使用当前视图搜索，可减少无关结果。需要查看单台相机细节时切换单画面；需要对照相邻区域时使用四画面；只有在屏幕和网络资源允许时使用九画面。</p>" +
      "<h2>界面示例</h2>" +
      figure("playback-search-multiview-zh.png", "搜索与多画面回放"),
    mediaAssets: assets("playback-v2-grid", [
      ["playback-search-multiview-zh.png", "搜索与多画面回放", "相机选择、布局切换与多画面核查"],
    ]),
    sections: [
      { id: "功能介绍", heading: "功能介绍", body: "搜索、相机和回放位于同一工作区。" },
      { id: "相机与布局", heading: "相机与布局", body: "相机树、自动选择和单四九画面。" },
      { id: "操作建议", heading: "操作建议", body: "按场景选择合适布局。" },
      { id: "界面示例", heading: "界面示例", body: "多画面界面。" },
    ],
  },
  "playback-list-layout": {
    title: "智能搜索结果",
    summary:
      "智能搜索结果列表展示匹配录像的缩略图、相机、位置、时间和置信度，并可直接打开结果、排序、分页或清理列表。",
    tags: ["回放", "智能搜索", "结果列表"],
    contentHtml:
      "<h2>功能介绍</h2><p>左侧结果区用于承接语义搜索命中项。每条结果与右侧回放区域联动，点击后可定位对应相机和录像时间，并继续进行单画面或多画面核查。</p>" +
      "<h2>结果字段与操作</h2>" +
      list([
        ["结果数量", "Search Results 后显示当前命中数量；无匹配时显示 No results found 空状态。"],
        ["结果信息", "每条记录包含缩略图、相机 IP 或名称、位置、发生时间和 Confidence 置信度。"],
        ["排序与分页", "支持按 Newest 或 Oldest 排序，并使用底部分页浏览更多结果。"],
        ["结果预览", "点击缩略图上的播放入口可打开结果预览，在弹窗中核对片段、时长和置信度。"],
        ["加载状态", "缩略图尚未加载时显示占位图；占位图不代表录像不存在，应等待加载或重新查询。"],
        ["清理结果", "结果区提供清理入口，用于移除当前结果列表；修改关键词、范围或时间后应重新执行搜索。"],
        ["结果联动", "选中结果后，右侧播放器显示关联录像，时间轴定位到对应时刻。"],
      ]) +
      "<h2>搜索建议</h2><p>描述应聚焦画面中可以观察到的特征，例如衣着颜色、人员动作、车辆类型或具体行为。结果过多时提高匹配阈值或缩短日期范围；结果过少时降低阈值、扩大相机范围，并减少描述中的非视觉条件。</p>" +
      "<h2>界面示例</h2>" +
      figure("playback-smart-results-zh.png", "智能搜索结果"),
    mediaAssets: assets("playback-v2-results", [
      ["playback-smart-results-zh.png", "智能搜索结果", "结果字段、预览、排序与联动说明"],
    ]),
    sections: [
      { id: "功能介绍", heading: "功能介绍", body: "结果列表与右侧回放联动。" },
      { id: "结果字段与操作", heading: "结果字段与操作", body: "数量、字段、预览、排序和分页。" },
      { id: "搜索建议", heading: "搜索建议", body: "优化描述、范围和阈值。" },
      { id: "界面示例", heading: "界面示例", body: "结果列表状态。" },
    ],
  },
  "playback-player-controls": {
    title: "时间轴视图",
    summary:
      "时间轴视图是回放模块中与 Grid 并列的页面展示模式。它把智能搜索命中结果显示在横向时间线上，选择节点后在页面主体查看对应事件信息、置信度、文字描述和检测标注画面。",
    tags: ["回放", "时间轴视图", "搜索结果"],
    contentHtml:
      "<h2>功能定位</h2><p>回放页面右上角提供 Grid 与 Timeline 两种展示方式。Grid 用于以单画面或多画面网格查看录像；Timeline 用于将智能搜索命中结果按时间节点展示，并在同一页面集中查看所选结果的详细信息。切换到 Timeline 后，页面主体会采用图示中的结果详情与横向节点布局，而不是播放器组件内部的录像进度轴。</p>" +
      "<h2>页面组成</h2>" +
      list([
        ["Grid / Timeline 切换", "通过页面右上角切换两种回放结果展示方式。Timeline 是完整页面模式，不是单个播放器控件。"],
        ["搜索条件区", "保留文字、语音或附件搜索入口，并可限定全部相机或当前视图、日期时间和匹配条件。"],
        ["搜索结果列表", "左侧结果列表展示缩略图、相机、位置、时间和置信度；选择结果后更新右侧详情。"],
        ["结果详情", "页面主体展示当前结果名称、发生时间、Confidence 置信度和 AI 生成的事件描述。"],
        ["检测画面", "右侧显示对应结果画面，并保留目标框、检测类型等标注，便于核查搜索命中是否准确。"],
        ["横向结果时间线", "页面底部用节点展示多个命中结果。每个节点可标注时间和位置或名称，用户可选择节点切换当前详情。"],
        ["横向浏览", "结果较多时可使用底部滚动条继续查看时间线中的其他节点。"],
      ]) +
      "<h2>操作流程</h2>" +
      steps([
        ["执行搜索", "输入可观察的目标或事件描述，并限定相机与日期时间范围。"],
        ["切换 Timeline", "在页面右上角选择 Timeline，进入时间轴展示模式。"],
        ["选择节点", "在页面底部点击目标时间节点，切换当前搜索结果。"],
        ["核对详情", "检查时间、位置、置信度、文字描述和带标注画面。"],
        ["继续核查", "需要多画面对照时切回 Grid；需要留存录像时再进入相应结果的回放或导出操作。"],
      ]) +
      "<h2>与录像进度轴的区别</h2><p><strong>Timeline 时间轴视图</strong>是整个回放页面的结果展示方式，节点代表智能搜索命中结果；<strong>播放器录像进度轴</strong>属于 Grid 播放器控制区域，用于表示录像区段和当前播放位置。两者用途不同，不应混为同一功能。</p>" +
      "<h2>界面示例</h2>" +
      figure("playback-timeline-view-zh.png", "回放模块的 Timeline 时间轴视图"),
    mediaAssets: assets("playback-v2-timeline-view", [
      ["playback-timeline-view-zh.png", "时间轴视图", "以横向节点展示智能搜索结果的完整页面"],
    ]),
    sections: [
      { id: "功能定位", heading: "功能定位", body: "Timeline 是与 Grid 并列的整页展示模式。" },
      { id: "页面组成", heading: "页面组成", body: "搜索、结果详情、检测画面和横向时间节点。" },
      { id: "操作流程", heading: "操作流程", body: "从搜索到节点切换和详情核对。" },
      { id: "与录像进度轴的区别", heading: "与录像进度轴的区别", body: "区分结果展示模式与播放器控件。" },
      { id: "界面示例", heading: "界面示例", body: "Timeline 时间轴视图页面。" },
    ],
  },
  "en-playback": {
    title: "Overview",
    summary:
      "The Playback workspace combines intelligent search and historical video review. Users can describe a target with text, voice, or an attachment, limit the camera scope and time range, set a match threshold, and open the results directly in single-camera, multi-camera, or timeline playback.",
    tags: ["Playback", "Intelligent Search", "English"],
    contentHtml:
      "<h2>Workspace Overview</h2><p>The Playback page brings the search criteria, result list, camera playback area, and timeline controls into one workspace. A user can describe a person, action, or scene, inspect matched results, and continue reviewing, comparing, clipping, or downloading the related recordings without changing modules.</p><p>The recommended path is: describe the target, limit the scope, select the date, inspect results, load cameras, review playback, and export the required clip.</p>" +
      "<h2>Core Capabilities</h2>" +
      list([
        ["Multiple search inputs", "The search bar supports text and exposes voice and attachment entries. Available input types depend on the project deployment."],
        ["Search scope", "Search across all cameras or only the cameras currently loaded in the playback view."],
        ["Date and time range", "Use the calendar and time selector to narrow the retrieval window."],
        ["Camera selection", "Select cameras from a hierarchy by site and floor, add or remove devices, auto-select, or clear the selection."],
        ["Match threshold", "Use the Match (%) slider or value to make the results broader or more selective."],
        ["Result list", "Results include a thumbnail, camera, location, timestamp, and confidence, with sorting and pagination."],
        ["Playback views", "Use single, four, or nine-camera layouts. Grid compares recordings side by side; Timeline arranges matched search results by time."],
        ["Timeline and evidence", "Review recording segments and use playback, speed, refresh, fullscreen, clipping, and download controls."],
      ]) +
      "<h2>Recommended Workflow</h2>" +
      enSteps([
        ["Describe the target", "Use a short, visually observable description, such as ‘a person wearing red’."],
        ["Limit the scope", "Choose all cameras or the current view, select the date and time, and load relevant cameras when comparison is needed."],
        ["Set the threshold", "Start with a medium confidence threshold, then adjust it based on the number and quality of results."],
        ["Inspect results", "Check the thumbnail, camera, location, time, and confidence, then open the relevant recording."],
        ["Review and export", "Compare recordings in Grid or review matched results chronologically in Timeline, then clip and download only the necessary evidence."],
      ]) +
      "<h2>Interface Examples</h2>" +
      figure("playback-overview-en.png", "Playback feature overview"),
    mediaAssets: assets("en-playback-v2-overview", [
      ["playback-overview-en.png", "Playback Overview", "Core Playback capabilities and controls"],
    ]),
    sections: [
      { id: "workspace-overview", heading: "Workspace Overview", body: "Search and playback in one workspace." },
      { id: "core-capabilities", heading: "Core Capabilities", body: "Search, scope, results, views, and timeline." },
      { id: "recommended-workflow", heading: "Recommended Workflow", body: "From target description to evidence export." },
      { id: "interface-examples", heading: "Interface Examples", body: "Product interface examples." },
    ],
  },
  "en-playback-grid-layout": {
    title: "Search & Multi-camera Playback",
    summary:
      "Use the same workspace to limit the search scope, select cameras, and review historical recordings in single, four, or nine-camera layouts.",
    tags: ["Playback", "Multi-camera", "Camera Selection"],
    contentHtml:
      "<h2>Overview</h2><p>The multi-camera workspace keeps camera selection, intelligent search results, and historical playback together. Cameras can be loaded from the hierarchy or added after a relevant result is found.</p>" +
      "<h2>Cameras and Layouts</h2>" +
      list([
        ["Hierarchical camera selection", "Browse cameras by site and floor, search for a device, and use the plus or minus controls to change the selection."],
        ["Auto Select and Clear All", "Auto Select fills available panes, while Clear All removes the current selection. The header shows the remaining capacity."],
        ["Single, four, and nine panes", "Use the layout buttons to change the number of playback panes. Empty panes show an add entry."],
        ["Search in the current view", "Limit intelligent search to the cameras already loaded in the playback grid."],
        ["Pane actions", "The selected pane is highlighted and provides remove and fullscreen actions. Clear All Cameras resets the workspace."],
        ["Grid and Timeline", "Grid is intended for side-by-side comparison. Timeline arranges matched search results by time; selecting a node opens the corresponding details and frame."],
      ]) +
      "<h2>Recommendations</h2><p>Select cameras near the incident area first, then search within the current view to reduce irrelevant results. Use a single pane for detail, four panes for nearby-camera comparison, and nine panes only when the display and network capacity allow it.</p>" +
      "<h2>Interface Examples</h2>" +
      figure("playback-search-multiview-en.png", "Search and multi-view playback"),
    mediaAssets: assets("en-playback-v2-grid", [
      ["playback-search-multiview-en.png", "Search & Multi-View Playback", "Camera selection, layout switching, and multi-view review"],
    ]),
    sections: [
      { id: "overview", heading: "Overview", body: "Search, cameras, and playback share one workspace." },
      { id: "cameras-and-layouts", heading: "Cameras and Layouts", body: "Camera hierarchy and single, four, or nine panes." },
      { id: "recommendations", heading: "Recommendations", body: "Choose a layout for the investigation task." },
      { id: "interface-examples", heading: "Interface Examples", body: "Current multi-camera interface." },
    ],
  },
  "en-playback-list-layout": {
    title: "Intelligent Search Results",
    summary:
      "The intelligent result list shows the thumbnail, camera, location, timestamp, and confidence for matched recordings, with direct preview, sorting, pagination, and result cleanup.",
    tags: ["Playback", "Intelligent Search", "Results"],
    contentHtml:
      "<h2>Overview</h2><p>The result panel receives semantic search matches and stays connected to the playback area. Selecting a result loads the related camera and recording time for further review.</p>" +
      "<h2>Result Fields and Actions</h2>" +
      list([
        ["Result count", "Search Results displays the current number of matches. No results found is shown when nothing matches."],
        ["Result details", "Each item can include a thumbnail, camera IP or name, location, timestamp, and Confidence value."],
        ["Sort and pagination", "Sort by Newest or Oldest and use the pagination control to browse more results."],
        ["Result preview", "Open the play entry on a thumbnail to review the matched clip, duration, and confidence in a modal."],
        ["Loading state", "A placeholder may be shown while a thumbnail is loading. It does not by itself mean that the recording is missing."],
        ["Clear results", "Clear the current list before changing the prompt, scope, or date and running a new search."],
        ["Playback linkage", "Selecting a result opens the related recording and positions the timeline near the matched time."],
      ]) +
      "<h2>Search Guidance</h2><p>Describe features that can be observed in the image, such as clothing color, a person’s action, a vehicle type, or a specific behavior. Raise the match threshold or shorten the date range when there are too many results. Lower the threshold, expand the camera scope, or simplify the prompt when there are too few.</p>" +
      "<h2>Interface Examples</h2>" +
      figure("playback-smart-results-en.png", "Smart search results"),
    mediaAssets: assets("en-playback-v2-results", [
      ["playback-smart-results-en.png", "Smart Search Results", "Result fields, preview, sorting, and playback linkage"],
    ]),
    sections: [
      { id: "overview", heading: "Overview", body: "Results are linked to playback." },
      { id: "result-fields-and-actions", heading: "Result Fields and Actions", body: "Details, preview, sorting, and pagination." },
      { id: "search-guidance", heading: "Search Guidance", body: "Improve the prompt, scope, and threshold." },
      { id: "interface-examples", heading: "Interface Examples", body: "Current result states." },
    ],
  },
  "en-playback-player-controls": {
    title: "Timeline View",
    summary:
      "Timeline is a page-level Playback view alongside Grid. It presents intelligent-search matches as horizontal time nodes and shows the selected result's event details, confidence, description, and annotated frame.",
    tags: ["Playback", "Timeline View", "Search Results"],
    contentHtml:
      "<h2>Purpose</h2><p>The Playback page provides Grid and Timeline modes in the upper-right corner. Grid displays recordings in single-camera or multi-camera panes. Timeline presents intelligent-search matches as time nodes and places the selected result's details in the main page area. This is a complete page view, not the recording progress bar inside a video player.</p>" +
      "<h2>Page Structure</h2>" +
      list([
        ["Grid / Timeline switch", "Use the upper-right control to change the Playback presentation. Timeline is a page mode, not an individual player control."],
        ["Search criteria", "Keep the text, voice, or attachment search entry and limit the camera scope, date-time range, and match conditions."],
        ["Result list", "The left panel shows the thumbnail, camera, location, timestamp, and confidence. Selecting an item updates the detail area."],
        ["Result details", "The main area shows the result name, event time, Confidence value, and AI-generated description."],
        ["Annotated frame", "The right side displays the matching frame with the detection label and target annotation for verification."],
        ["Horizontal result timeline", "Nodes at the bottom represent matched results and can show a time and location or name. Select a node to change the active result."],
        ["Horizontal navigation", "Use the bottom scrollbar to browse additional nodes when the result timeline extends beyond the visible width."],
      ]) +
      "<h2>Workflow</h2>" +
      enSteps([
        ["Run a search", "Describe an observable target or event and limit the camera and date-time scope."],
        ["Select Timeline", "Choose Timeline in the upper-right corner to open the time-node presentation."],
        ["Choose a node", "Select the required time node at the bottom of the page."],
        ["Verify the result", "Review the time, location, confidence, description, and annotated frame."],
        ["Continue the investigation", "Return to Grid for multi-camera comparison, or open the relevant recording and export workflow when evidence is required."],
      ]) +
      "<h2>Difference from the Recording Progress Bar</h2><p><strong>Timeline view</strong> is the page-level presentation for intelligent-search results, and its nodes represent matched results. The <strong>recording progress bar</strong> belongs to a Grid player and indicates recorded segments and the current playback position. They are separate functions.</p>" +
      "<h2>Interface Example</h2>" +
      figure("playback-timeline-view-en.png", "Playback Timeline view"),
    mediaAssets: assets("en-playback-v2-timeline-view", [
      ["playback-timeline-view-en.png", "Timeline View", "Full-page intelligent-search results presented as horizontal time nodes"],
    ]),
    sections: [
      { id: "purpose", heading: "Purpose", body: "Timeline is a page-level presentation alongside Grid." },
      { id: "page-structure", heading: "Page Structure", body: "Search, details, annotated frame, and horizontal result nodes." },
      { id: "workflow", heading: "Workflow", body: "Search, switch views, choose a node, and verify the result." },
      { id: "difference-from-progress-bar", heading: "Difference from the Recording Progress Bar", body: "Separate the result view from the player control." },
      { id: "interface-example", heading: "Interface Example", body: "Timeline view page." },
    ],
  },
};

for (const [id, spec] of Object.entries(specs)) {
  const doc = docs.find((candidate) => candidate.id === id);
  if (!doc) throw new Error(`Document not found: ${id}`);
  Object.assign(doc, spec, {
    updatedAt: "2026-07-20",
    version: "11.0",
    readingTime: 5,
  });
}

const updated = `${source.slice(0, arrayStart)}${JSON.stringify(docs, null, 2)}${source.slice(arrayEnd + 1)}`;
fs.writeFileSync(dataPath, updated, "utf8");
console.log(`Updated ${Object.keys(specs).length} playback documents.`);
