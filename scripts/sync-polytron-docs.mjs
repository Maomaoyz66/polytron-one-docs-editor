import * as cheerio from "cheerio";
import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { promisify } from "node:util";

const BASE_URL = "https://polytron-one-docs.vercel.app";
const execFileAsync = promisify(execFile);

const pages = [
  { id: "overview", route: "/docs", category: "平台总览", owner: "产品运营", status: "Published" },
  { id: "auth-overview", route: "/docs/auth", category: "认证", owner: "产品运营", status: "Published" },
  { id: "auth-login", route: "/docs/auth/login", category: "认证", owner: "产品运营", status: "Published" },
  { id: "auth-forgot-password", route: "/docs/auth/forgot-password", category: "认证", owner: "客服支持", status: "Review" },
  { id: "home-overview", route: "/docs/home", category: "首页", owner: "产品运营", status: "Published" },
  { id: "home-system-info", route: "/docs/home/system-info", category: "首页", owner: "运维团队", status: "Published" },
  { id: "home-alarm-overview", route: "/docs/home/alarm-overview", category: "首页", owner: "安防主管", status: "Published" },
  { id: "home-camera-info", route: "/docs/home/camera-info", category: "首页", owner: "运维团队", status: "Published" },
  { id: "home-top-menu", route: "/docs/home/top-menu", category: "首页", owner: "产品运营", status: "Draft" },
  { id: "live-view-overview", route: "/docs/live-view", category: "实时视图", owner: "产品运营", status: "Published" },
  { id: "live-camera-selection", route: "/docs/live-view/camera-selection", category: "实时视图", owner: "安防主管", status: "Published" },
  { id: "live-grid", route: "/docs/live-view/grid", category: "实时视图", owner: "产品运营", status: "Published" },
  { id: "live-controls", route: "/docs/live-view/controls", category: "实时视图", owner: "产品运营", status: "Published" },
  { id: "live-ptz-control", route: "/docs/live-view/ptz-control", category: "实时视图", owner: "设备工程", status: "Review" },
  { id: "live-tabs", route: "/docs/live-view/tabs", category: "实时视图", owner: "产品运营", status: "Draft" },
  { id: "live-360-panel", route: "/docs/live-view/polytron-360-panel", category: "实时视图", owner: "设备工程", status: "Review" },
  { id: "playback", route: "/docs/playback", category: "回放", owner: "产品运营", status: "Published" },
  { id: "alarm-trigger", route: "/docs/alarm-trigger", category: "警报", owner: "安防主管", status: "Published" },
  { id: "cameras", route: "/docs/cameras", category: "摄像头", owner: "运维团队", status: "Published" },
  { id: "notifications", route: "/docs/notifications", category: "通知", owner: "产品运营", status: "Review" },
  { id: "settings", route: "/docs/settings", category: "设置", owner: "管理员", status: "Draft" },
];

const categories = [
  "平台总览",
  "认证",
  "首页",
  "实时视图",
  "回放",
  "警报",
  "摄像头",
  "通知",
  "设置",
];

function absoluteUrl(value) {
  if (!value) return "";
  const normalized = value.replaceAll("&amp;", "&");
  return new URL(normalized, BASE_URL).toString();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanupAttributes($, root) {
  root.find("*").each((_, element) => {
    const tag = element.tagName?.toLowerCase();
    const attrs = element.attribs ?? {};
    const keep = new Set();

    if (tag === "a") keep.add("href");
    if (tag === "img") {
      keep.add("src");
      keep.add("alt");
      keep.add("title");
    }
    if (tag === "figure") {
      keep.add("data-media-type");
      keep.add("data-src");
      keep.add("data-title");
      keep.add("data-caption");
    }
    if (tag === "video") {
      keep.add("src");
      keep.add("controls");
      keep.add("preload");
    }

    Object.keys(attrs).forEach((name) => {
      if (!keep.has(name)) $(element).removeAttr(name);
    });

    if (tag === "a") {
      const href = $(element).attr("href");
      if (href) $(element).attr("href", absoluteUrl(href));
    }
  });
}

function transformMedia($, prose, pageTitle, summary) {
  const assets = [];
  const seen = new Set();

  prose.find("img").each((_, image) => {
    const img = $(image);
    const src = absoluteUrl(img.attr("src"));
    const alt = (img.attr("alt") || `${pageTitle}界面示例`).trim();

    if (!src) return;
    img.attr("src", src);
    img.attr("alt", alt);

    if (!seen.has(`image:${src}`)) {
      assets.push({
        id: `${slugify(pageTitle)}-image-${assets.length + 1}`,
        type: "image",
        title: alt,
        url: src,
        caption: alt,
      });
      seen.add(`image:${src}`);
    }
  });

  prose.find("video").each((_, video) => {
    const videoNode = $(video);
    const source = videoNode.find("source").first().attr("src") || videoNode.attr("src");
    const src = absoluteUrl(source);
    if (!src) return;

    const title =
      videoNode.closest("div").prevAll("h3").first().text().trim() ||
      videoNode.prevAll("h3").first().text().trim() ||
      "演示视频";
    const caption = title === "演示视频" ? `${pageTitle}演示视频` : title;

    const figureHtml = `<figure data-media-type="video" data-src="${escapeHtml(
      src
    )}" data-title="${escapeHtml(caption)}" data-caption="${escapeHtml(
      caption
    )}"><video src="${escapeHtml(
      src
    )}" controls="true" preload="metadata"></video><figcaption>${escapeHtml(
      caption
    )}</figcaption></figure>`;

    const wrapper = videoNode.closest("div.not-prose");
    if (wrapper.length) wrapper.replaceWith(figureHtml);
    else videoNode.replaceWith(figureHtml);

    if (!seen.has(`video:${src}`)) {
      assets.push({
        id: `${slugify(pageTitle)}-video-${assets.length + 1}`,
        type: "video",
        title: caption,
        url: src,
        caption: summary,
      });
      seen.add(`video:${src}`);
    }
  });

  return assets;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function collectSections($, prose) {
  const sections = [];
  let current = null;

  prose.children().each((_, element) => {
    const tag = element.tagName?.toLowerCase();
    const text = $(element).text().replace(/\s+/g, " ").trim();

    if (tag === "h2") {
      if (current) sections.push(current);
      current = {
        id: slugify(text || `section-${sections.length + 1}`),
        heading: text || `章节 ${sections.length + 1}`,
        body: "",
      };
      return;
    }

    if (!current || !text) return;
    current.body = [current.body, text].filter(Boolean).join("\n");
  });

  if (current) sections.push(current);
  return sections.length
    ? sections
    : [
        {
          id: "content",
          heading: "正文",
          body: prose.text().replace(/\s+/g, " ").trim(),
        },
      ];
}

function estimateReadingTime(text) {
  const compact = text.replace(/\s+/g, "");
  return Math.max(1, Math.ceil(compact.length / 450));
}

function tagsFor(page, title) {
  const tags = [page.category];
  title
    .split(/[｜|,，、\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .forEach((tag) => tags.push(tag));
  return Array.from(new Set(tags)).slice(0, 4);
}

async function fetchDoc(page) {
  const html = await fetchHtml(`${BASE_URL}${page.route}`);
  const $ = cheerio.load(html, { decodeEntities: false });
  const article = $("#nd-page");
  const prose = article.find("div.prose").first();
  const title = article.find("h1").first().text().trim() || page.route;
  const summary =
    article.find("h1").first().next("p").text().trim() ||
    $(`meta[name="description"]`).attr("content") ||
    "";

  prose.find("script, style").remove();
  const mediaAssets = transformMedia($, prose, title, summary);
  cleanupAttributes($, prose);

  const contentHtml = prose.html()?.trim() || `<p>${escapeHtml(summary)}</p>`;
  const sections = collectSections($, prose);
  const coverImage = mediaAssets.find((asset) => asset.type === "image")?.url;
  const text = prose.text().replace(/\s+/g, " ").trim();

  return {
    id: page.id,
    title,
    route: page.route,
    category: page.category,
    status: page.status,
    owner: page.owner,
    updatedAt: "2026-06-19",
    version: page.status === "Draft" ? "0.9" : "1.0",
    readingTime: estimateReadingTime(text),
    summary,
    tags: tagsFor(page, title),
    ...(coverImage ? { coverImage } : {}),
    contentHtml,
    ...(mediaAssets.length ? { mediaAssets } : {}),
    sections,
  };
}

async function fetchHtml(url, attempts = 4) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const escapedUrl = url.replace(/'/g, "''");
    const command = `$ProgressPreference='SilentlyContinue'; $content=(Invoke-WebRequest -Uri '${escapedUrl}' -UseBasicParsing).Content; [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))`;

    try {
      const { stdout } = await execFileAsync(
        "powershell.exe",
        ["-NoProfile", "-Command", command],
        {
          encoding: "utf8",
          maxBuffer: 50 * 1024 * 1024,
        },
      );
      return Buffer.from(stdout.trim(), "base64").toString("utf8");
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
      }
    }
  }

  throw lastError;
}

function typeHeader() {
  return `export type DocStatus = "Published" | "Review" | "Draft";

export type DocSection = {
  id: string;
  heading: string;
  body: string;
  media?: {
    label: string;
    url: string;
  };
};

export type DocMediaAsset = {
  id: string;
  type: "image" | "video";
  title: string;
  url: string;
  caption?: string;
};

export type DocPage = {
  id: string;
  title: string;
  route: string;
  category: string;
  status: DocStatus;
  owner: string;
  updatedAt: string;
  version: string;
  readingTime: number;
  summary: string;
  tags: string[];
  coverImage?: string;
  contentHtml?: string;
  mediaAssets?: DocMediaAsset[];
  sections: DocSection[];
};

`;
}

const docs = [];
for (const page of pages) {
  console.log(`Syncing ${page.route}`);
  docs.push(await fetchDoc(page));
}

const output = `${typeHeader()}export const categories = ${JSON.stringify(
  categories,
  null,
  2
)};

export const initialDocs: DocPage[] = ${JSON.stringify(docs, null, 2)};
`;

await writeFile("src/data.ts", output, "utf8");

const mediaCount = docs.reduce((count, doc) => count + (doc.mediaAssets?.length ?? 0), 0);
const videoCount = docs.reduce(
  (count, doc) => count + (doc.mediaAssets?.filter((asset) => asset.type === "video").length ?? 0),
  0
);

console.log(`Synced ${docs.length} docs, ${mediaCount} media assets, ${videoCount} videos.`);
