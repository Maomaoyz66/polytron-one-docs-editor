import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { mergeAttributes, Node as TiptapNode } from "@tiptap/core";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  CircleDashed,
  Code,
  Copy,
  Download,
  Eraser,
  Eye,
  FileText,
  FilePlus2,
  FolderPlus,
  Globe2,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Layers,
  Languages,
  Link2,
  List,
  ListFilter,
  ListOrdered,
  Lock,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Quote,
  Redo2,
  RefreshCw,
  Save,
  Search,
  Send,
  Server,
  Strikethrough,
  Trash2,
  Undo2,
  Unlink,
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  DragEvent as ReactDragEvent,
  FormEvent,
  MouseEvent,
  SyntheticEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { categories, DocMediaAsset, DocPage, DocStatus, initialDocs } from "./data";
import type { DocSection } from "./data";
import { legacyV1Docs } from "./legacyV1Data";

const STORAGE_KEY = "polytron-doc-admin-state-v7";
const STORAGE_SOURCE_KEY = "polytron-doc-admin-source-signature-v1";
const STORAGE_SOURCE_DOCS_KEY = "polytron-doc-admin-source-docs-v1";
const SELECTED_DOC_KEY = "polytron-doc-admin-selected-doc-v1";
const PUBLISH_CONFIG_KEY = "polytron-doc-admin-publish-config-v1";
const EDITOR_AUTH_KEY = "polytron-doc-editor-auth-v1";
const PRODUCTION_DOCS_URL = "https://polytron-one-docs.vercel.app/docs";
const MEDIA_AVAILABILITY_TIMEOUT_MS = 300000;
const MEDIA_AVAILABILITY_POLL_MS = 3000;
const MEDIA_LOAD_RETRY_LIMIT = 120;
const MEDIA_LOAD_RETRY_DELAY_MS = 3000;
const MAX_IMAGE_UPLOAD_BYTES = Math.floor(3.2 * 1024 * 1024);
const MAX_VIDEO_UPLOAD_BYTES = Math.floor(3.2 * 1024 * 1024);
const DEFAULT_DOC_LOCALE: DocLocale = "zh";
const docLocales: Array<{ code: DocLocale; label: string; shortLabel: string }> = [
  { code: "zh", label: "中文", shortLabel: "中" },
  { code: "en", label: "English", shortLabel: "EN" },
];
const DOC_LOCALE_KEY = "polytron-doc-admin-locale-v1";
const PUBLIC_LOCALE_KEY = "polytron-doc-public-locale-v1";

type Toast = {
  tone: "good" | "warn";
  text: string;
};

type OversizedMediaFile = {
  limit: number;
  name: string;
  size: number;
  type: MediaType;
};

type UploadLimitDialogState = {
  acceptedCount: number;
  files: OversizedMediaFile[];
};

type LightboxImage = {
  alt: string;
  src: string;
};

type ChecklistItem = {
  label: string;
  ok: boolean;
};

type MediaType = DocMediaAsset["type"];

type UploadedMediaAsset = DocMediaAsset & {
  previewUrl?: string;
};

type VisibleMediaAsset = DocMediaAsset & {
  source: "saved" | "document";
  previewUrl?: string;
};

type CleanEditorHtmlOptions = {
  keepTemporaryMedia?: boolean;
  locale?: DocLocale;
  preserveUploadPreviewUrls?: boolean;
};

type MediaDraft = {
  title: string;
  url: string;
  caption: string;
};

type MediaDrafts = Record<MediaType, MediaDraft>;

type PublishScope = "current" | "all";
type DocLocale = "zh" | "en";
type PublicDocVersion = "v1" | "v2";

const PUBLIC_V2_RETURN_ROUTE_KEY = "polytron-doc-public-v2-return-route-v1";
const PUBLIC_V1_LANDING_ROUTE_KEY = "polytron-doc-public-v1-landing-route-v1";
const publicDocVersions: Array<{ code: PublicDocVersion; label: string }> = [
  { code: "v1", label: "V1" },
  { code: "v2", label: "V2" },
];

type PublishConfig = {
  endpoint: string;
  token: string;
  scope: PublishScope;
};

type LinkDialogState = {
  href: string;
  route: string;
  selection: {
    from: number;
    to: number;
  };
};

type NavigationCard = {
  id: string;
  title: string;
  description: string;
  route: string;
  image: string;
};

type NavigationCardSection = {
  heading: string;
  cards: NavigationCard[];
};

type PublishResponse = {
  ok?: boolean;
  previewUrl?: string;
  productionUrl?: string;
  sourceSync?: {
    changed?: boolean;
    ok?: boolean;
    message?: string;
    pushed?: boolean;
  };
  remote?: {
    connected?: boolean;
    ok?: boolean;
    message?: string;
    target?: string;
  };
};

type PublishPayload = {
  action: "publish-docs" | "auto-save-uploaded-media";
  docs: ReturnType<typeof buildPublishedDoc>[];
  locale?: DocLocale;
  publishedAt: string;
  scope: PublishScope;
  source: "polytron-doc-editor";
  sourceSignature: string;
};

type MediaUploadResponse = {
  ok?: boolean;
  asset?: UploadedMediaAsset;
  error?: string;
  previewUrl?: string;
  remote?: {
    connected?: boolean;
    ok?: boolean;
    message?: string;
  };
  sourceSync?: {
    ok?: boolean;
    message?: string;
  };
};

type PublishStatus = {
  ok?: boolean;
  endpoint?: string;
  productionUrl?: string;
  remote?: {
    connected?: boolean;
    target?: string;
    missing?: string[];
  };
  auth?: {
    required?: boolean;
    configured?: boolean;
  };
};

type EditorSession = {
  token: string;
  expiresAt: number;
};

function getDefaultPublishEndpoint() {
  const host = window.location.hostname;
  const isLocalPage = isLocalHostname(host);
  const envEndpoint = (import.meta as unknown as { env?: Record<string, string | undefined> })
    .env?.VITE_PUBLISH_ENDPOINT;

  if (envEndpoint?.trim()) {
    const endpoint = envEndpoint.trim();
    if (isLocalPage || !isLocalPublishEndpoint(endpoint)) return endpoint;
  }

  if (isLocalPage) {
    return "http://127.0.0.1:8787/api/publish-docs";
  }

  return new URL("/api/publish-docs", window.location.origin).toString();
}

function isLocalHostname(hostname: string) {
  return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
}

function isLocalPublishEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return isLocalHostname(url.hostname);
  } catch {
    return false;
  }
}

function normalizePublishEndpointForCurrentHost(endpoint: string) {
  const trimmed = endpoint.trim();
  if (!trimmed) return getDefaultPublishEndpoint();

  return !isLocalHostname(window.location.hostname) && isLocalPublishEndpoint(trimmed)
    ? getDefaultPublishEndpoint()
    : trimmed;
}

function getPublishStatusEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    url.pathname = "/api/publish-status";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function getMediaUploadEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    url.pathname = "/api/upload-media";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function dragDataHasFiles(dataTransfer: DataTransfer | null | undefined) {
  if (!dataTransfer) return false;
  if (dataTransfer.files?.length) return true;

  return Array.from(dataTransfer.types ?? []).some((type) => type.toLowerCase() === "files");
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function mediaUrlWithCacheKey(url: string, key: string) {
  const value = url.trim();
  if (!value) return value;
  if (value.startsWith("blob:") || value.startsWith("data:")) return value;

  try {
    const parsed = new URL(value, window.location.origin);
    parsed.searchParams.set("v", key);

    if (/^https?:\/\//i.test(value)) return parsed.toString();
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return value;
  }
}

function mediaUrlWithoutCacheKey(url: string) {
  const value = url.trim();
  if (!value) return value;
  if (value.startsWith("blob:") || value.startsWith("data:")) return value;

  try {
    const parsed = new URL(value, window.location.origin);
    parsed.searchParams.delete("v");

    if (/^https?:\/\//i.test(value)) return parsed.toString();
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return value.replace(/([?&])v=[^&#]*&?/i, "$1").replace(/[?&]$/, "");
  }
}

function cacheSafeMediaUrl(url: string) {
  const value = url.trim();
  if (!value) return value;

  try {
    const parsed = new URL(value, window.location.origin);
    if (!parsed.pathname.includes("/media/polytron-one/uploads/")) return value;
    if (parsed.searchParams.has("v")) return value;

    return mediaUrlWithCacheKey(value, "editor");
  } catch {
    return value;
  }
}

function retryUploadedImageLoad(image: HTMLImageElement) {
  const currentSource = image.currentSrc || image.getAttribute("src") || "";
  const publicSource = normalizeUploadPreviewUrl(mediaUrlWithoutCacheKey(currentSource));
  if (!publicSource.includes("/media/polytron-one/uploads/")) return;

  const retries = Number(image.dataset.mediaRetryCount || "0");
  if (retries >= MEDIA_LOAD_RETRY_LIMIT) return;

  const originalSource = image.dataset.mediaOriginalSrc || publicSource;
  image.dataset.mediaOriginalSrc = originalSource;
  image.dataset.mediaRetryCount = String(retries + 1);

  window.setTimeout(() => {
    image.src = mediaUrlWithCacheKey(originalSource, `${Date.now()}-${retries + 1}`);
  }, retries === 0 ? 120 : MEDIA_LOAD_RETRY_DELAY_MS);
}

function refreshBrokenUploadedImages(root: ParentNode | null) {
  if (!root) return;

  root.querySelectorAll('img[src*="/media/polytron-one/uploads/"]').forEach((image) => {
    if (!(image instanceof HTMLImageElement)) return;
    if (!image.complete || image.naturalWidth > 0) return;

    delete image.dataset.mediaRetryCount;
    retryUploadedImageLoad(image);
  });
}

function isTemporaryMediaUrl(url?: string | null) {
  const value = String(url || "").trim();
  if (normalizeUploadPreviewUrl(value) !== value) return false;
  return value.startsWith("blob:") || value.startsWith("data:");
}

function htmlHasTemporaryMedia(html: string) {
  if (!html.trim()) return false;
  if (typeof document === "undefined") {
    return /\b(?:src|data-src)=["']blob:/i.test(html);
  }

  const template = document.createElement("template");
  template.innerHTML = html;
  const sources = [
    ...Array.from(template.content.querySelectorAll("[src]")).map(
      (element) => element.getAttribute("src") ?? ""
    ),
    ...Array.from(template.content.querySelectorAll("figure[data-src]")).map(
      (element) => element.getAttribute("data-src") ?? ""
    ),
  ];

  return sources.some((source) => isTemporaryMediaUrl(source));
}

async function isMediaUrlReachable(url: string) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(mediaUrlWithCacheKey(url, String(Date.now())), {
      cache: "no-store",
      method: "HEAD",
      signal: controller.signal,
    });

    if (response.ok) return true;
    if (![403, 405].includes(response.status)) return false;

    const retry = await fetch(mediaUrlWithCacheKey(url, String(Date.now())), {
      cache: "no-store",
      headers: { Range: "bytes=0-0" },
      method: "GET",
      signal: controller.signal,
    });

    return retry.ok || retry.status === 206;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

async function waitForMediaUrl(url: string) {
  const deadline = Date.now() + MEDIA_AVAILABILITY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (await isMediaUrlReachable(url)) return;
    await sleep(MEDIA_AVAILABILITY_POLL_MS);
  }

  throw new Error("媒体已上传，但线上文件还没发布完成，请稍后刷新后再试");
}

function lightboxImageFromTarget(target: EventTarget | null): LightboxImage | null {
  if (!(target instanceof Element)) return null;

  const image = target.closest("img");
  if (!(image instanceof HTMLImageElement)) return null;
  if (image.closest('figure[data-media-type="video"]')) return null;

  const src = image.currentSrc || image.getAttribute("src") || "";
  if (!src.trim()) return null;

  return {
    alt: image.getAttribute("alt") || image.getAttribute("title") || "图片预览",
    src,
  };
}

function mediaTypeForFile(file: File): MediaType | null {
  if (file.type.startsWith("image/") && file.type !== "image/svg+xml") return "image";
  if (file.type.startsWith("video/")) return "video";

  if (/\.(avif|gif|jpe?g|png|webp)$/i.test(file.name)) return "image";
  if (/\.(m4v|mov|mp4|webm)$/i.test(file.name)) return "video";

  return null;
}

function mediaUploadLimitFor(type: MediaType) {
  return type === "image" ? MAX_IMAGE_UPLOAD_BYTES : MAX_VIDEO_UPLOAD_BYTES;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateMediaFiles(files: File[]) {
  const accepted: File[] = [];
  const oversized: OversizedMediaFile[] = [];
  const unsupported: File[] = [];

  files.forEach((file) => {
    const type = mediaTypeForFile(file);
    if (!type) {
      unsupported.push(file);
      return;
    }

    const limit = mediaUploadLimitFor(type);
    if (file.size > limit) {
      oversized.push({
        limit,
        name: file.name,
        size: file.size,
        type,
      });
      return;
    }

    accepted.push(file);
  });

  return { accepted, oversized, unsupported };
}

function contentTypeForFile(file: File) {
  if (file.type) return file.type;

  if (/\.(avif)$/i.test(file.name)) return "image/avif";
  if (/\.(gif)$/i.test(file.name)) return "image/gif";
  if (/\.(jpe?g)$/i.test(file.name)) return "image/jpeg";
  if (/\.(png)$/i.test(file.name)) return "image/png";
  if (/\.(webp)$/i.test(file.name)) return "image/webp";
  if (/\.(mov)$/i.test(file.name)) return "video/quicktime";
  if (/\.(m4v)$/i.test(file.name)) return "video/x-m4v";
  if (/\.(mp4)$/i.test(file.name)) return "video/mp4";
  if (/\.(webm)$/i.test(file.name)) return "video/webm";

  return "application/octet-stream";
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

async function readPublishError(response: Response) {
  const message = await response.text();
  if (!message) return `HTTP ${response.status}`;

  try {
    const parsed = JSON.parse(message) as { error?: string; message?: string };
    return parsed.error || parsed.message || message;
  } catch {
    return message;
  }
}

function isLocalHost() {
  return window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
}

function readEditorSession() {
  try {
    const raw = window.localStorage.getItem(EDITOR_AUTH_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as EditorSession;
    if (!session.token || !session.expiresAt || Date.now() >= session.expiresAt) {
      window.localStorage.removeItem(EDITOR_AUTH_KEY);
      return null;
    }

    return session;
  } catch {
    window.localStorage.removeItem(EDITOR_AUTH_KEY);
    return null;
  }
}

function saveEditorSession(session: EditorSession) {
  window.localStorage.setItem(EDITOR_AUTH_KEY, JSON.stringify(session));
}

function clearEditorSession() {
  window.localStorage.removeItem(EDITOR_AUTH_KEY);
}

const statusLabels: Record<DocStatus, string> = {
  Published: "已发布",
  Review: "待审核",
  Draft: "草稿",
};

const mediaTypeLabels: Record<MediaType, string> = {
  image: "界面示例",
  video: "演示视频",
};

const VIDEO_SECTION_ID = "demo-videos";
const IMAGE_SECTION_ID = "interface-examples";
const VIDEO_SECTION_HEADING = "\u6f14\u793a\u89c6\u9891";
const IMAGE_SECTION_HEADING = "\u754c\u9762\u793a\u4f8b";
const EN_VIDEO_SECTION_HEADING = "Demo Video";
const EN_IMAGE_SECTION_HEADING = "Interface Example";
const VIDEO_SECTION_HEADINGS = [
  VIDEO_SECTION_HEADING,
  EN_VIDEO_SECTION_HEADING,
  "Demo Videos",
  "Video Demo",
  "Video Demos",
];
const IMAGE_SECTION_HEADINGS = [
  IMAGE_SECTION_HEADING,
  EN_IMAGE_SECTION_HEADING,
  "Interface Examples",
];

const emptyMediaDraft: MediaDraft = {
  title: "",
  url: "",
  caption: "",
};

const emptyMediaDrafts = (): MediaDrafts => ({
  image: { ...emptyMediaDraft },
  video: { ...emptyMediaDraft },
});

const unverifiedMediaUrlPattern = /(?:_next\/image|_next\/static\/media\/)/i;

function hasUnverifiedMediaUrl(value?: string) {
  return Boolean(value && unverifiedMediaUrlPattern.test(value));
}

function normalizedMediaHeading(value?: string | null) {
  return (value ?? "").replace(/\s+/g, "").trim().toLowerCase();
}

function localizedMediaHeading(type: MediaType, locale: DocLocale) {
  if (type === "video") {
    return locale === "en" ? EN_VIDEO_SECTION_HEADING : VIDEO_SECTION_HEADING;
  }

  return locale === "en" ? EN_IMAGE_SECTION_HEADING : IMAGE_SECTION_HEADING;
}

function mediaSectionRank(section: Pick<DocSection, "id" | "heading">) {
  const heading = normalizedMediaHeading(section.heading);

  if (
    section.id === VIDEO_SECTION_ID ||
    VIDEO_SECTION_HEADINGS.some((candidate) => normalizedMediaHeading(candidate) === heading)
  ) {
    return 0;
  }
  if (
    section.id === IMAGE_SECTION_ID ||
    IMAGE_SECTION_HEADINGS.some((candidate) => normalizedMediaHeading(candidate) === heading)
  ) {
    return 1;
  }

  return null;
}

function mediaHeadingRankFromText(value?: string | null) {
  const heading = normalizedMediaHeading(value);

  if (VIDEO_SECTION_HEADINGS.some((candidate) => normalizedMediaHeading(candidate) === heading)) {
    return 0;
  }
  if (IMAGE_SECTION_HEADINGS.some((candidate) => normalizedMediaHeading(candidate) === heading)) {
    return 1;
  }

  return null;
}

function orderDocSections(sections: DocSection[]) {
  const firstMediaIndex = sections.findIndex((section) => mediaSectionRank(section) !== null);

  if (firstMediaIndex < 0) return sections;

  const mediaSections = sections
    .filter((section) => mediaSectionRank(section) !== null)
    .sort((a, b) => (mediaSectionRank(a) ?? 0) - (mediaSectionRank(b) ?? 0));
  const before = sections
    .slice(0, firstMediaIndex)
    .filter((section) => mediaSectionRank(section) === null);
  const after = sections
    .slice(firstMediaIndex)
    .filter((section) => mediaSectionRank(section) === null);

  return [...before, ...mediaSections, ...after];
}

function headingMediaRank(node: ChildNode) {
  if (!(node instanceof HTMLElement) || node.tagName !== "H2") return null;

  return mediaHeadingRankFromText(node.textContent);
}

function isEmptyMediaNode(node: ChildNode) {
  if (node.nodeType === Node.TEXT_NODE) {
    return !node.textContent?.trim();
  }

  if (!(node instanceof HTMLElement)) return false;

  return (
    node.tagName === "P" &&
    !node.querySelector("img, video, figure") &&
    !normalizeCaptionText(node.textContent)
  );
}

function htmlHasMediaHeading(html: string, heading: string) {
  if (!html.trim()) return false;
  const expectedRank = mediaHeadingRankFromText(heading);
  const expectedHeading = normalizedMediaHeading(heading);

  if (typeof document === "undefined") {
    return expectedRank === null
      ? new RegExp(`<h2[^>]*>\\s*${heading}\\s*<\\/h2>`, "i").test(html)
      : [...VIDEO_SECTION_HEADINGS, ...IMAGE_SECTION_HEADINGS]
          .filter((candidate) => mediaHeadingRankFromText(candidate) === expectedRank)
          .some((candidate) => new RegExp(`<h2[^>]*>\\s*${candidate}\\s*<\\/h2>`, "i").test(html));
  }

  const template = document.createElement("template");
  template.innerHTML = html;

  return Array.from(template.content.querySelectorAll("h2")).some((node) => {
    const nodeRank = mediaHeadingRankFromText(node.textContent);
    if (expectedRank !== null) return nodeRank === expectedRank;

    return normalizedMediaHeading(node.textContent) === expectedHeading;
  });
}

function normalizeMediaHeadingsHtml(html: string, locale?: DocLocale) {
  if (!html.trim() || !locale) return html;

  if (typeof document === "undefined") {
    const replaceHeading = (value: string, type: MediaType) =>
      value.replace(
        new RegExp(
          `<h2([^>]*)>\\s*(?:${
            type === "video"
              ? VIDEO_SECTION_HEADINGS.join("|")
              : IMAGE_SECTION_HEADINGS.join("|")
          })\\s*<\\/h2>`,
          "gi"
        ),
        `<h2$1>${localizedMediaHeading(type, locale)}</h2>`
      );

    return replaceHeading(replaceHeading(html, "video"), "image");
  }

  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll("h2").forEach((heading) => {
    const rank = mediaHeadingRankFromText(heading.textContent);
    if (rank === 0) heading.textContent = localizedMediaHeading("video", locale);
    if (rank === 1) heading.textContent = localizedMediaHeading("image", locale);
  });

  return template.innerHTML;
}

function fragmentHasMediaHeading(fragment: DocumentFragment, type: MediaType) {
  const expectedRank = type === "video" ? 0 : 1;

  return Array.from(fragment.querySelectorAll("h2")).some(
    (heading) => mediaHeadingRankFromText(heading.textContent) === expectedRank
  );
}

function firstMediaElementInFragment(fragment: DocumentFragment, type: MediaType) {
  const selector = type === "video" ? 'figure[data-media-type="video"]' : "img[src]";

  return Array.from(fragment.querySelectorAll(selector)).find((element) => {
    if (type === "image" && element.closest('figure[data-media-type="video"]')) return false;

    return true;
  });
}

function topLevelNodeInFragment(fragment: DocumentFragment, node: Node) {
  let current = node;

  while (current.parentNode && current.parentNode !== fragment) {
    current = current.parentNode;
  }

  return current.parentNode === fragment ? current : node;
}

function ensureMediaHeadingsHtml(html: string, locale?: DocLocale) {
  if (!html.trim() || typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;
  const headingLocale = locale ?? DEFAULT_DOC_LOCALE;

  (["video", "image"] as const).forEach((type) => {
    if (fragmentHasMediaHeading(template.content, type)) return;

    const mediaElement = firstMediaElementInFragment(template.content, type);
    if (!mediaElement) return;

    const heading = document.createElement("h2");
    heading.textContent = localizedMediaHeading(type, headingLocale);
    template.content.insertBefore(
      heading,
      topLevelNodeInFragment(template.content, mediaElement)
    );
  });

  return template.innerHTML;
}

function orderMediaSectionsInFragment(fragment: DocumentFragment) {
  const sections: Array<{ rank: number | null; nodes: ChildNode[] }> = [];
  let current: { rank: number | null; nodes: ChildNode[] } | null = null;

  Array.from(fragment.childNodes).forEach((node) => {
    if (node instanceof HTMLElement && node.tagName === "H2") {
      current = { rank: headingMediaRank(node), nodes: [node] };
      sections.push(current);
      return;
    }

    if (!current) {
      current = { rank: null, nodes: [node] };
      sections.push(current);
      return;
    }

    current.nodes.push(node);
  });

  if (!sections.some((section) => section.rank !== null)) return false;

  const mediaByRank = new Map<number, ChildNode[]>();
  sections
    .filter((section) => section.rank !== null)
    .forEach((section) => {
      const rank = section.rank ?? 0;
      const bodyNodes = section.nodes.slice(1).filter((node) => !isEmptyMediaNode(node));
      const existingNodes = mediaByRank.get(rank);

      if (!bodyNodes.length) {
        if (!existingNodes) mediaByRank.set(rank, [section.nodes[0]]);
        return;
      }

      if (existingNodes) {
        existingNodes.push(...bodyNodes);
      } else {
        mediaByRank.set(rank, [section.nodes[0], ...bodyNodes]);
      }
    });
  const mediaSections = Array.from(mediaByRank.entries())
    .sort(([leftRank], [rightRank]) => leftRank - rightRank)
    .map(([, nodes]) => nodes);
  const orderedFragment = document.createDocumentFragment();
  let insertedMedia = false;

  sections.forEach((section) => {
    if (section.rank !== null) {
      if (!insertedMedia && mediaSections.length) {
        mediaSections.forEach((mediaSection) => {
          mediaSection.forEach((node) => orderedFragment.appendChild(node));
        });
        insertedMedia = true;
      }
      return;
    }

    section.nodes.forEach((node) => orderedFragment.appendChild(node));
  });

  while (fragment.firstChild) {
    fragment.removeChild(fragment.firstChild);
  }

  Array.from(orderedFragment.childNodes).forEach((node) => fragment.appendChild(node));
  return true;
}

function orderMediaSectionBodyHtml(html: string) {
  if (!html || typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;
  orderMediaSectionsInFragment(template.content);

  return template.innerHTML;
}

function stripMediaBoundaryCommentsHtml(html: string) {
  if (!html) return html;

  return html.replace(/<!--\s*polytron-media-(?:start|end)\s*-->/g, "");
}

function orderMediaSectionsHtml(html: string) {
  if (!html || typeof document === "undefined") return html;

  return orderMediaSectionBodyHtml(stripMediaBoundaryCommentsHtml(html));
}

function removeMediaNode(node: Element) {
  const figure = node.closest("figure");
  if (figure && figure.getAttribute("data-media-type") !== "video") {
    figure.remove();
    return;
  }

  const parent = node.parentElement;
  if (parent?.tagName === "P" && parent.children.length === 1) {
    parent.remove();
    return;
  }

  node.remove();
}

function dedupeMediaHtml(html: string) {
  if (!html.trim() || typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;
  const seenImages = new Set<string>();
  const seenVideos = new Set<string>();

  template.content.querySelectorAll('figure[data-media-type="video"]').forEach((figure) => {
    const source =
      figure.getAttribute("data-src") ?? figure.querySelector("video")?.getAttribute("src");
    const key = source ? normalizeMediaUrl(source).trim().toLowerCase() : "";
    if (!key) return;

    if (seenVideos.has(key)) {
      figure.remove();
      return;
    }

    seenVideos.add(key);
  });

  template.content.querySelectorAll("img[src]").forEach((image) => {
    if (image.closest('figure[data-media-type="video"]')) return;

    const source = image.getAttribute("src");
    const key = source ? normalizeMediaUrl(source).trim().toLowerCase() : "";
    if (!key) return;

    if (seenImages.has(key)) {
      removeMediaNode(image);
      return;
    }

    seenImages.add(key);
  });

  return template.innerHTML;
}

function stripTemporaryMediaHtml(html: string) {
  if (!html.trim() || typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll('figure[data-media-type="video"]').forEach((figure) => {
    const source =
      figure.getAttribute("data-src") ?? figure.querySelector("video")?.getAttribute("src");
    if (isTemporaryMediaUrl(source)) figure.remove();
  });

  template.content.querySelectorAll("img[src]").forEach((image) => {
    if (image.closest('figure[data-media-type="video"]')) return;
    if (isTemporaryMediaUrl(image.getAttribute("src"))) removeMediaNode(image);
  });

  removeEmptyMediaHeading(template.content, VIDEO_SECTION_HEADING, 'figure[data-media-type="video"]');
  removeEmptyMediaHeading(template.content, IMAGE_SECTION_HEADING, "img[src]");

  return template.innerHTML;
}

function stripUnverifiedMediaHtml(html?: string) {
  if (!html || !hasUnverifiedMediaUrl(html)) return html;

  return html
    .replace(/\n?<!-- -->\n<h2>(?:媒体资源|界面示例|Interface Example|Interface Examples)<\/h2>[\s\S]*$/g, "")
    .replace(
      /\n?<figure\b[^>]*(?:_next\/image|_next\/static\/media\/)[\s\S]*?<\/figure>/gi,
      ""
    )
    .replace(
      /\n?<p><img\b[^>]*(?:_next\/image|_next\/static\/media\/)[^>]*><\/p>/gi,
      ""
    )
    .replace(
      /\n?<img\b[^>]*(?:_next\/image|_next\/static\/media\/)[^>]*>/gi,
      ""
    )
    .trim();
}

function stripUnverifiedDocMedia(doc: DocPage): DocPage {
  const mediaAssets = doc.mediaAssets?.filter((asset) => !hasUnverifiedMediaUrl(asset.url));

  return {
    ...doc,
    coverImage: hasUnverifiedMediaUrl(doc.coverImage) ? undefined : doc.coverImage,
    contentHtml: stripUnverifiedMediaHtml(doc.contentHtml),
    mediaAssets: mediaAssets?.length ? mediaAssets : undefined,
    sections: doc.sections
      .filter(
        (section) =>
          !hasUnverifiedMediaUrl(section.media?.url) &&
          section.heading !== "媒体资源" &&
          section.heading !== "界面示例"
      )
      .map((section) => ({ ...section })),
  };
}


const VideoEmbed = TiptapNode.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) =>
          element.querySelector("video")?.getAttribute("src") ??
          element.getAttribute("data-src") ??
          "",
        renderHTML: (attributes) => ({ "data-src": attributes.src }),
      },
      title: {
        default: "演示视频",
        parseHTML: (element) => element.getAttribute("data-title") ?? "演示视频",
        renderHTML: (attributes) => ({ "data-title": attributes.title }),
      },
      caption: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-caption") ??
          element.querySelector("figcaption")?.textContent ??
          "",
        renderHTML: (attributes) => ({ "data-caption": attributes.caption }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-media-type="video"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const title = node.attrs.title || "演示视频";
    const caption = node.attrs.caption || title;

    return [
      "figure",
      mergeAttributes(HTMLAttributes, {
        "data-media-type": "video",
        class: "video-module",
      }),
      ["video", { src: node.attrs.src, controls: "true", preload: "metadata" }],
      ["figcaption", caption],
    ];
  },
});

const NavigationLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      cardId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-card-id"),
        renderHTML: (attributes) =>
          attributes.cardId ? { "data-card-id": attributes.cardId } : {},
      },
      cardImage: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-card-image"),
        renderHTML: (attributes) =>
          attributes.cardImage ? { "data-card-image": attributes.cardImage } : {},
      },
    };
  },
});

const statusOptions: Array<DocStatus | "All"> = [
  "All",
  "Published",
  "Review",
  "Draft",
];

const statusFilterLabels: Record<DocStatus | "All", string> = {
  All: "全部",
  Published: "已发布",
  Review: "待审核",
  Draft: "草稿",
};

const localeLabels: Record<DocLocale, string> = {
  zh: "中文",
  en: "English",
};

function isDocLocale(value: string | null | undefined): value is DocLocale {
  return value === "zh" || value === "en";
}

function routeLocale(route: string): DocLocale {
  const normalized = normalizeRoute(route);
  if (normalized === "/en/docs" || normalized.startsWith("/en/docs/")) return "en";
  return "zh";
}

function routeBase(route: string) {
  const normalized = normalizeRoute(route);
  if (normalized === "/zh/docs" || normalized === "/en/docs") return "/docs";
  if (normalized.startsWith("/zh/docs/") || normalized.startsWith("/en/docs/")) {
    return normalized.slice(3);
  }
  if (normalized.startsWith("/docs")) return normalized;
  return "/docs";
}

function routeForLocale(route: string, locale: DocLocale) {
  const baseRoute = routeBase(route);
  return `/${locale}${baseRoute}`;
}

function v1RouteBaseForV2(route: string) {
  const baseRoute = routeBase(route);
  if (baseRoute === "/docs/v1" || baseRoute.startsWith("/docs/v1/")) return baseRoute;
  return baseRoute.replace(/^\/docs(?=\/|$)/, "/docs/v1");
}

function v2RouteBaseForV1(route: string) {
  return routeBase(route).replace(/^\/docs\/v1(?=\/|$)/, "/docs");
}

const legacyV1RouteBases = new Set(legacyV1Docs.map((doc) => routeBase(doc.route)));

function nearestLegacyV1Route(route: string) {
  let candidate = v1RouteBaseForV2(route);

  while (candidate === "/docs/v1" || candidate.startsWith("/docs/v1/")) {
    if (legacyV1RouteBases.has(candidate)) return candidate;
    if (candidate === "/docs/v1") break;
    candidate = candidate.slice(0, candidate.lastIndexOf("/"));
  }

  return "/docs/v1";
}

function localeFromPath(pathname: string): DocLocale {
  return routeLocale(pathname);
}

function docBaseId(doc: Pick<DocPage, "id">) {
  return doc.id.replace(/^(?:zh|en)-/, "");
}

function localizedDocId(doc: Pick<DocPage, "id">, locale: DocLocale) {
  const baseId = docBaseId(doc);
  return locale === "zh" ? baseId : `${locale}-${baseId}`;
}

function localizedDocCopy(doc: DocPage, locale: DocLocale): DocPage {
  return {
    ...doc,
    id: localizedDocId(doc, locale),
    route: routeForLocale(doc.route, locale),
    status: locale === "en" && routeLocale(doc.route) !== "en" ? "Draft" : doc.status,
    tags: Array.from(new Set([...(doc.tags ?? []), localeLabels[locale]])),
  };
}

function initialDocsForEditor(sourceDocs: DocPage[]) {
  const zhSourceDocs = sourceDocs.filter((doc) => routeLocale(doc.route) !== "en");
  const enSourceDocs = sourceDocs.filter((doc) => routeLocale(doc.route) === "en");
  const enByBaseRoute = new Map(enSourceDocs.map((doc) => [routeBase(doc.route), doc]));
  const usedEnRoutes = new Set<string>();
  const zhDocs = zhSourceDocs.map((doc) => localizedDocCopy(doc, "zh"));
  const enDocs = zhSourceDocs.map((doc) => {
    const baseRoute = routeBase(doc.route);
    const existing = enByBaseRoute.get(baseRoute);
    if (existing) {
      usedEnRoutes.add(baseRoute);
      return localizedDocCopy(existing, "en");
    }
    return localizedDocCopy(doc, "en");
  });

  enSourceDocs.forEach((doc) => {
    const baseRoute = routeBase(doc.route);
    if (!usedEnRoutes.has(baseRoute)) {
      enDocs.push(localizedDocCopy(doc, "en"));
    }
  });

  return [...zhDocs, ...enDocs];
}

function docsForLocale(docs: DocPage[], locale: DocLocale) {
  return docs.filter((doc) => routeLocale(doc.route) === locale);
}

function matchingDocInLocale(doc: DocPage, docs: DocPage[], locale: DocLocale) {
  const baseRoute = routeBase(doc.route);
  return (
    docs.find((item) => routeLocale(item.route) === locale && routeBase(item.route) === baseRoute) ??
    docsForLocale(docs, locale)[0]
  );
}

type TextReplacement = {
  from: string;
  to: string;
};

const zhTerminologyReplacements: TextReplacement[] = [
  {
    from: String.fromCharCode(0x6444, 0x50cf, 0x5934),
    to: String.fromCharCode(0x76f8, 0x673a),
  },
  {
    from: String.fromCharCode(0x544a, 0x8b66),
    to: String.fromCharCode(0x8b66, 0x62a5),
  },
  {
    from: String.fromCharCode(0x7a7a, 0x95f4, 0x65f6, 0x95f4),
    to: String.fromCharCode(0x505c, 0x7559, 0x65f6, 0x95f4, 0x68c0, 0x6d4b),
  },
  {
    from: String.fromCharCode(0x4e2d, 0x5173, 0x952e),
    to: String.fromCharCode(0x4e2d, 0x7ea7),
  },
];

const enTerminologyReplacements: TextReplacement[] = [
  { from: ["space", "time"].join(" "), to: "dwell time detection" },
  {
    from: ["pending", "critical", "critical", "confirmed"].join(", "),
    to: ["pending", "critical", "medium", "confirmed"].join(", "),
  },
];

function replaceTerminologyText(value: string, replacements: TextReplacement[]) {
  return replacements.reduce((nextValue, replacement) => {
    if (!replacement.from || !nextValue.includes(replacement.from)) return nextValue;
    return nextValue.split(replacement.from).join(replacement.to);
  }, value);
}

function replaceOptionalTerminologyText(
  value: string | undefined,
  replacements: TextReplacement[]
) {
  return value ? replaceTerminologyText(value, replacements) : value;
}

function normalizeDocTerminology(doc: DocPage): DocPage {
  const replacements =
    routeLocale(doc.route) === "en" ? enTerminologyReplacements : zhTerminologyReplacements;

  return {
    ...doc,
    title: replaceTerminologyText(doc.title, replacements),
    category: replaceTerminologyText(doc.category, replacements),
    summary: replaceTerminologyText(doc.summary, replacements),
    tags: (doc.tags ?? []).map((tag) => replaceTerminologyText(tag, replacements)),
    contentHtml: replaceOptionalTerminologyText(doc.contentHtml, replacements),
    mediaAssets: doc.mediaAssets?.map((asset) => ({
      ...asset,
      title: replaceTerminologyText(asset.title, replacements),
      caption: replaceOptionalTerminologyText(asset.caption, replacements),
    })),
    sections: (doc.sections ?? []).map((section) => ({
      ...section,
      heading: replaceTerminologyText(section.heading, replacements),
      body: replaceTerminologyText(section.body, replacements),
      media: section.media
        ? {
            ...section.media,
            label: replaceTerminologyText(section.media.label, replacements),
          }
        : section.media,
    })),
  };
}

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function docsSourceSignature(docs: DocPage[]) {
  return hashText(
    JSON.stringify(
      docs.map((doc) => ({
        id: doc.id,
        route: doc.route,
        title: doc.title,
        category: doc.category,
        status: doc.status,
        updatedAt: doc.updatedAt,
        summary: doc.summary,
        contentHtml: doc.contentHtml,
        sections: doc.sections,
        mediaAssets: doc.mediaAssets,
      }))
    )
  );
}

const SOURCE_DOCS_SIGNATURE = docsSourceSignature(initialDocs);
const initialEditorDocs = initialDocsForEditor(initialDocs);
const EDITOR_DOCS_SIGNATURE = docsSourceSignature(initialEditorDocs);

function docsStorageFingerprint(docs: DocPage[]) {
  return hashText(JSON.stringify(docs.map(canonicalDocForCompare)));
}

function docEditableFingerprint(doc: DocPage) {
  const cleanedDoc = canonicalDocForCompare(doc);

  return hashText(
    JSON.stringify({
      id: cleanedDoc.id,
      title: cleanedDoc.title,
      route: cleanedDoc.route,
      category: cleanedDoc.category,
      owner: cleanedDoc.owner,
      readingTime: cleanedDoc.readingTime,
      summary: cleanedDoc.summary,
      tags: cleanedDoc.tags,
      coverImage: cleanedDoc.coverImage,
      contentHtml: cleanedDoc.contentHtml,
      mediaAssets: cleanedDoc.mediaAssets,
      sections: cleanedDoc.sections,
    })
  );
}

function docComparableMediaUrls(doc: DocPage) {
  const urls = new Set<string>();

  (doc.mediaAssets ?? []).forEach((asset) => {
    const url = comparableMediaUrl(asset.url);
    if (url && !url.startsWith("data:")) urls.add(url);
  });

  const html = doc.contentHtml ?? "";
  const attributePattern = /\b(?:src|data-src)=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(html))) {
    const url = comparableMediaUrl(match[1] ?? "");
    if (url && !url.startsWith("data:")) urls.add(url);
  }

  return urls;
}

function sourceDocCoversStoredMedia(storedDoc: DocPage, sourceDoc: DocPage) {
  const sourceUrls = docComparableMediaUrls(sourceDoc);

  return Array.from(docComparableMediaUrls(storedDoc)).every((url) => sourceUrls.has(url));
}

function shouldRefreshStoredDocFromSource(storedDoc: DocPage, sourceDoc?: DocPage) {
  if (!sourceDoc || storedDoc.status !== "Published") return false;
  if (!sourceDocCoversStoredMedia(storedDoc, sourceDoc)) return false;

  return docEditableFingerprint(storedDoc) !== docEditableFingerprint(sourceDoc);
}

function parseStoredDocs(raw: string | null) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as DocPage[];
    if (!Array.isArray(parsed) || !parsed.length) return null;
    return parsed.map(cleanDoc);
  } catch {
    return null;
  }
}

function readStoredSourceDocs() {
  return parseStoredDocs(window.localStorage.getItem(STORAGE_SOURCE_DOCS_KEY));
}

function writeStoredDocs(docs: DocPage[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(docs.map(compactDocForStorage)));
    window.localStorage.setItem(STORAGE_SOURCE_KEY, EDITOR_DOCS_SIGNATURE);
    window.localStorage.setItem(STORAGE_SOURCE_DOCS_KEY, JSON.stringify(cloneDocs(initialEditorDocs)));
    return true;
  } catch {
    // Storage can fail in private browsing or when the browser quota is full.
    return false;
  }
}

function mergeStoredDocsWithCurrentSource(
  storedDocs: DocPage[],
  previousSourceDocs: DocPage[] | null
) {
  if (!previousSourceDocs?.length) {
    const merged = cloneDocs(storedDocs);
    const seen = new Set(merged.map((doc) => doc.id));

    initialEditorDocs.forEach((doc) => {
      if (!seen.has(doc.id)) {
        merged.push(cleanDoc(doc));
      }
    });

    return merged;
  }

  const storedById = new Map(storedDocs.map((doc) => [doc.id, cleanDoc(doc)]));
  const previousById = new Map(previousSourceDocs.map((doc) => [doc.id, cleanDoc(doc)]));
  const merged = initialEditorDocs.map((sourceDoc) => {
    const storedDoc = storedById.get(sourceDoc.id);
    if (storedDoc && isKnownStaleSourceDoc(storedDoc)) return cleanDoc(sourceDoc);
    if (storedDoc && shouldRefreshStoredDocFromSource(storedDoc, sourceDoc)) {
      return cleanDoc(sourceDoc);
    }

    const previousDoc = previousById.get(sourceDoc.id);
    const hasLocalChanges =
      storedDoc &&
      (!previousDoc ||
        docEditableFingerprint(storedDoc) !== docEditableFingerprint(previousDoc));

    if (!hasLocalChanges) return cleanDoc(sourceDoc);

    const repairedDoc = repairDocMediaFromSource(storedDoc, sourceDoc);
    if (repairedDoc.category === sourceDoc.category) return repairedDoc;

    const tags = repairedDoc.tags.map((tag) =>
      tag === repairedDoc.category ? sourceDoc.category : tag
    );

    return cleanDoc({
      ...repairedDoc,
      category: sourceDoc.category,
      tags: tags.includes(sourceDoc.category) ? tags : [sourceDoc.category, ...tags],
    });
  });
  const currentIds = new Set(initialEditorDocs.map((doc) => doc.id));

  storedDocs.forEach((storedDoc) => {
    if (currentIds.has(storedDoc.id)) return;

    const previousDoc = previousById.get(storedDoc.id);
    if (
      !previousDoc ||
      docEditableFingerprint(storedDoc) !== docEditableFingerprint(previousDoc)
    ) {
      merged.push(cleanDoc(storedDoc));
    }
  });

  return merged;
}

function isKnownStaleSourceDoc(doc: DocPage) {
  if (doc.id !== "cameras-recording-schedule") return false;

  const html = doc.contentHtml ?? "";
  const staleRecordingPlanIntro = String.fromCharCode(
    0x5f55,
    0x50cf,
    0x8ba1,
    0x5212,
    0x7528,
    0x4e8e,
    0x4e3a,
    0x6444,
    0x50cf,
    0x5934,
    0x8bbe,
    0x7f6e,
    0x5f55,
    0x5236,
    0x7b56,
    0x7565,
  );
  const recordingTimeConfig = String.fromCharCode(0x5f55, 0x50cf, 0x65f6, 0x95f4, 0x914d, 0x7f6e);
  return html.includes(staleRecordingPlanIntro) && !html.includes(recordingTimeConfig);
}

function readStoredDocs() {
  try {
    const parsed = parseStoredDocs(window.localStorage.getItem(STORAGE_KEY));
    if (!parsed) {
      return cloneDocs(initialEditorDocs);
    }
    const storedSourceSignature = window.localStorage.getItem(STORAGE_SOURCE_KEY);
    if (storedSourceSignature !== EDITOR_DOCS_SIGNATURE) {
      const hasLocalChanges =
        !storedSourceSignature || docsSourceSignature(parsed) !== storedSourceSignature;
      const nextDocs = hasLocalChanges
        ? mergeStoredDocsWithCurrentSource(parsed, readStoredSourceDocs())
        : cloneDocs(initialEditorDocs);

      writeStoredDocs(nextDocs);
      return nextDocs;
    }

    const sourceById = new Map(initialEditorDocs.map((doc) => [doc.id, doc]));
    const cleaned = parsed.map((doc) => {
      const storedDoc = cleanDoc(doc);
      const sourceDoc = sourceById.get(storedDoc.id);

      if (sourceDoc && shouldRefreshStoredDocFromSource(storedDoc, sourceDoc)) {
        return cleanDoc(sourceDoc);
      }

      return repairDocMediaFromSource(storedDoc, sourceDoc);
    });
    writeStoredDocs(cleaned);
    return cleaned;
  } catch {
    return cloneDocs(initialEditorDocs);
  }
}

function readStoredSelectedDocId(docs: DocPage[]) {
  try {
    const storedId = window.localStorage.getItem(SELECTED_DOC_KEY);
    if (storedId && docs.some((doc) => doc.id === storedId)) {
      return storedId;
    }
  } catch {
    // Fall through to the first available document.
  }

  return docs[0]?.id ?? initialEditorDocs[0].id;
}

function readStoredEditorLocale(): DocLocale {
  try {
    const storedLocale = window.localStorage.getItem(DOC_LOCALE_KEY);
    if (isDocLocale(storedLocale)) return storedLocale;
  } catch {
    // Fall through to the default locale.
  }

  return DEFAULT_DOC_LOCALE;
}

function readPublishConfig(): PublishConfig {
  const endpoint = getDefaultPublishEndpoint();

  try {
    const raw = window.localStorage.getItem(PUBLISH_CONFIG_KEY);
    if (!raw) {
      return { endpoint, token: "", scope: "all" };
    }

    const parsed = JSON.parse(raw) as Partial<PublishConfig>;
    return {
      endpoint: normalizePublishEndpointForCurrentHost(parsed.endpoint ?? endpoint),
      token: parsed.token ?? "",
      scope: "all",
    };
  } catch {
    return { endpoint, token: "", scope: "all" };
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function routeSegment(value: string, fallbackPrefix = "page") {
  const segment = value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return segment || createId(fallbackPrefix);
}

function moduleRootRoute(category: string, docs: DocPage[]) {
  const moduleDocs = docs.filter((doc) => doc.category === category);
  const overviewDoc =
    moduleDocs.find((doc) => doc.title === "概览") ??
    moduleDocs.slice().sort((a, b) => a.route.length - b.route.length)[0];

  return overviewDoc?.route ?? `/docs/${routeSegment(category, "module")}`;
}

function moduleRootSegment(category: string, docs: DocPage[]) {
  const route = routeBase(moduleRootRoute(category, docs));
  const match = route.match(/^\/docs(?:\/([^/]+))?/);
  return match?.[1] ?? "";
}

const categoryRouteOrder = Array.from(
  new Set(initialEditorDocs.map((doc) => moduleRootSegment(doc.category, initialEditorDocs)))
);

function moduleCategoryOrder(category: string, docs: DocPage[]) {
  const fixedIndex = categories.indexOf(category);
  if (fixedIndex >= 0) return fixedIndex;

  const routeIndex = categoryRouteOrder.indexOf(moduleRootSegment(category, docs));
  return routeIndex >= 0 ? routeIndex : categories.length;
}

function moduleCategoryNames(docs: DocPage[]) {
  return Array.from(new Set(docs.map((doc) => doc.category))).sort((left, right) => {
    const leftOrder = moduleCategoryOrder(left, docs);
    const rightOrder = moduleCategoryOrder(right, docs);

    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.localeCompare(right, "zh-Hans");
  });
}

function groupDocsByModule(docs: DocPage[]) {
  return moduleCategoryNames(docs).map((category) => ({
    category,
    docs: docs.filter((doc) => doc.category === category),
  }));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function linesToHtml(body: string) {
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return "<p></p>";
  }

  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function normalizeCaptionText(value?: string | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function removeFollowingParagraphIfMatches(
  element: Element,
  labels: Array<string | null | undefined>
) {
  const normalizedLabels = new Set(labels.map(normalizeCaptionText).filter(Boolean));
  const nextElement = element.nextElementSibling;
  const nextText = normalizeCaptionText(nextElement?.textContent);

  if (nextElement?.tagName === "P" && normalizedLabels.has(nextText)) {
    nextElement.remove();
  }
}

function stripMediaCaptionsHtml(html: string) {
  if (!html.trim()) return html;

  if (typeof document === "undefined") {
    return html.replace(/\s*<figcaption\b[\s\S]*?<\/figcaption>/gi, "");
  }

  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll("figure").forEach((figure) => {
    const captions = Array.from(figure.querySelectorAll("figcaption")).map((caption) =>
      normalizeCaptionText(caption.textContent)
    );
    const image = figure.querySelector("img");
    const labels = [
      ...captions,
      figure.getAttribute("data-caption"),
      figure.getAttribute("data-title"),
      image?.getAttribute("alt"),
      image?.getAttribute("title"),
    ];

    figure.querySelectorAll("figcaption").forEach((caption) => caption.remove());
    removeFollowingParagraphIfMatches(figure, labels);

    if (figure.getAttribute("data-media-type") === "video") {
      const source =
        figure.getAttribute("data-src") ?? figure.querySelector("video")?.getAttribute("src");
      const nextElement = figure.nextElementSibling;
      const nextText = normalizeCaptionText(nextElement?.textContent);

      if (
        nextElement?.tagName === "P" &&
        source &&
        nextText.includes(source) &&
        nextText.includes("视频地址")
      ) {
        nextElement.remove();
      }
    }
  });

  template.content.querySelectorAll("img").forEach((image) => {
    const labels = [image.getAttribute("alt"), image.getAttribute("title")];
    const imageBlock =
      image.parentElement?.tagName === "P" &&
      image.parentElement.children.length === 1 &&
      !normalizeCaptionText(image.parentElement.textContent)
        ? image.parentElement
        : image;

    removeFollowingParagraphIfMatches(imageBlock, labels);
  });

  return template.innerHTML;
}

const polytronVideoFilenameAliases: Record<string, string> = {
  "\u81ea\u52a8\u6dfb\u52a0\u76f8\u673a.mp4": "add_camera_auto.mp4",
  "\u624b\u52a8\u6dfb\u52a0\u76f8\u673a.mp4": "add_camera_manel.mp4",
  "\u67e5\u770b\u89c6\u9891\u7247\u6bb5.mp4": "check_video.mp4",
  "\u63a7\u5236\u9762\u677f.mp4": "control_panel.mp4",
  "\u56fe\u50cf\u8bbe\u7f6e.mp4": "image_setting.mp4",
  "\u56de\u653e\u5bab\u683c.mp4": "playback_grid.mp4",
  "\u56de\u653e\u5217\u8868.mp4": "playback_list.mp4",
  "\u5f55\u5236\u89c4\u5219.mp4": "record_rule.mp4",
  "\u9009\u62e9\u76f8\u673a.mp4": "select_camera.mp4",
  "\u6807\u7b7e\u7ba1\u7406.mp4": "tab_management.mp4",
};

function replaceMediaAliasesInText(value: string) {
  return Object.entries(polytronVideoFilenameAliases).reduce((next, [legacyName, canonicalName]) => {
    return next
      .split(legacyName)
      .join(canonicalName)
      .split(encodeURIComponent(legacyName))
      .join(canonicalName);
  }, value);
}

function normalizeUploadPreviewUrl(url: string) {
  const value = url.trim();
  if (!value) return value;

  const previewMarker = "#polytron-src=";
  const previewMarkerIndex = value.indexOf(previewMarker);
  if (value.startsWith("data:") && previewMarkerIndex !== -1) {
    return decodeURIComponent(value.slice(previewMarkerIndex + previewMarker.length));
  }

  try {
    const parsed = new URL(value, window.location.origin);
    if (parsed.hostname !== "raw.githubusercontent.com") return value;

    const match = parsed.pathname.match(
      /^\/[^/]+\/[^/]+\/[^/]+\/public(\/media\/polytron-one\/uploads\/[^?#]+)$/i
    );

    return match ? decodeURI(match[1]) : value;
  } catch {
    return value;
  }
}

function isUploadPreviewMediaUrl(url: string) {
  const value = url.trim();
  if (!value) return false;

  const normalized = normalizeUploadPreviewUrl(value);
  return normalized !== value && normalized.includes("/media/polytron-one/uploads/");
}

function isInlineUploadPreviewUrl(url?: string | null) {
  return String(url || "").trim().startsWith("data:");
}

function normalizeMediaUrl(url: string) {
  const replaced = normalizeUploadPreviewUrl(replaceMediaAliasesInText(url.trim()));

  try {
    const decoded = decodeURI(replaced);
    const match = decoded.match(/^(.*\/)?([^/?#]+)([?#].*)?$/);
    const filename = match?.[2] ?? "";
    const canonicalName = polytronVideoFilenameAliases[filename];

    if (match && canonicalName) {
      return `${match[1] ?? ""}${canonicalName}${match[3] ?? ""}`;
    }
  } catch {
    return replaced;
  }

  return replaced;
}

function normalizeMediaUrlsHtml(html: string, options: CleanEditorHtmlOptions = {}) {
  if (!html.trim()) return html;

  if (typeof document === "undefined") {
    return replaceMediaAliasesInText(html);
  }

  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll("[src]").forEach((element) => {
    const source = element.getAttribute("src");
    if (source) {
      const sourceWithoutCacheKey = mediaUrlWithoutCacheKey(source);
      element.setAttribute(
        "src",
        options.preserveUploadPreviewUrls && isUploadPreviewMediaUrl(sourceWithoutCacheKey)
          ? sourceWithoutCacheKey
          : normalizeMediaUrl(sourceWithoutCacheKey)
      );
    }
  });

  template.content.querySelectorAll("figure[data-src]").forEach((figure) => {
    const source = figure.getAttribute("data-src");
    if (source) {
      const sourceWithoutCacheKey = mediaUrlWithoutCacheKey(source);
      figure.setAttribute(
        "data-src",
        options.preserveUploadPreviewUrls && isUploadPreviewMediaUrl(sourceWithoutCacheKey)
          ? sourceWithoutCacheKey
          : normalizeMediaUrl(sourceWithoutCacheKey)
      );
    }
  });

  return replaceMediaAliasesInText(template.innerHTML);
}

function cleanEditorHtml(html: string, options: CleanEditorHtmlOptions = {}) {
  const withoutMediaBoundaries = stripMediaBoundaryCommentsHtml(html);
  const cleaned = dedupeMediaHtml(
    normalizeMediaUrlsHtml(stripMediaCaptionsHtml(withoutMediaBoundaries), options)
  );
  const withMediaHeadings = ensureMediaHeadingsHtml(
    options.keepTemporaryMedia ? cleaned : stripTemporaryMediaHtml(cleaned),
    options.locale
  );
  const ordered = orderMediaSectionsHtml(
    withMediaHeadings
  );

  return normalizeMediaHeadingsHtml(ordered, options.locale);
}

function comparableMediaUrl(url: string) {
  const value = normalizeMediaUrl(url).trim();
  if (!value) return "";

  try {
    const parsed = new URL(value, window.location.origin);
    parsed.searchParams.delete("v");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`.toLowerCase();
  } catch {
    return value.replace(/([?&])v=[^&#]*&?/i, "$1").replace(/[?&]$/, "").toLowerCase();
  }
}

function isUploadedMediaUrl(url?: string | null) {
  const value = normalizeUploadPreviewUrl(mediaUrlWithoutCacheKey(String(url || "").trim()));
  if (!value) return false;

  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.pathname.includes("/media/polytron-one/uploads/");
  } catch {
    return value.includes("/media/polytron-one/uploads/");
  }
}

function applyUploadPreviewUrlsHtml(html: string, assets?: DocMediaAsset[]) {
  const previewUrls = new Map<string, string>();

  (dedupeMediaAssets(assets) ?? []).forEach((asset) => {
    const previewUrl = (asset as UploadedMediaAsset).previewUrl?.trim();
    if (!previewUrl || !isUploadPreviewMediaUrl(previewUrl)) return;
    if (!isInlineUploadPreviewUrl(previewUrl)) return;

    previewUrls.set(comparableMediaUrl(asset.url), previewUrl);
  });

  if (!html.trim() || !previewUrls.size || typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll("[src]").forEach((element) => {
    const source = element.getAttribute("src");
    if (!source) return;

    const previewUrl = previewUrls.get(comparableMediaUrl(source));
    if (previewUrl) element.setAttribute("src", previewUrl);
  });

  template.content.querySelectorAll("figure[data-src]").forEach((figure) => {
    const source = figure.getAttribute("data-src");
    if (!source) return;

    const previewUrl = previewUrls.get(comparableMediaUrl(source));
    if (!previewUrl) return;

    figure.setAttribute("data-src", previewUrl);
    figure.querySelector("video")?.setAttribute("src", previewUrl);
  });

  return template.innerHTML;
}

function mediaLabelKey(value?: string | null) {
  return normalizeCaptionText(value).toLowerCase();
}

function repairDocMediaFromSource(doc: DocPage, sourceDoc?: DocPage) {
  const sourceAssets = (dedupeMediaAssets(sourceDoc?.mediaAssets) ?? []).filter(
    (asset) => asset.type === "image"
  );

  if (!doc.contentHtml?.trim() || !sourceAssets.length || typeof document === "undefined") {
    return doc;
  }

  const sourceUrls = new Set(sourceAssets.map((asset) => comparableMediaUrl(asset.url)));
  const docImageUrls = new Set(
    (dedupeMediaAssets(doc.mediaAssets) ?? [])
      .filter((asset) => asset.type === "image")
      .map((asset) => comparableMediaUrl(asset.url))
  );
  const sourceAssetsByLabel = new Map<string, DocMediaAsset>();

  sourceAssets.forEach((asset) => {
    [asset.title, asset.caption].forEach((label) => {
      const key = mediaLabelKey(label);
      if (key) sourceAssetsByLabel.set(key, asset);
    });
  });

  const template = document.createElement("template");
  template.innerHTML = doc.contentHtml;
  let changed = false;

  template.content.querySelectorAll("img[src]").forEach((image) => {
    if (image.closest('figure[data-media-type="video"]')) return;

    const source = image.getAttribute("src") ?? "";
    const comparableSource = comparableMediaUrl(source);
    if (
      !source ||
      sourceUrls.has(comparableSource) ||
      docImageUrls.has(comparableSource) ||
      isUploadedMediaUrl(source)
    ) {
      return;
    }

    const labels = [
      image.getAttribute("alt"),
      image.getAttribute("title"),
      image.closest("figure")?.querySelector("figcaption")?.textContent,
    ];
    const replacement = labels
      .map(mediaLabelKey)
      .map((label) => sourceAssetsByLabel.get(label))
      .find(Boolean) ?? (sourceAssets.length === 1 ? sourceAssets[0] : undefined);

    if (!replacement) return;

    image.setAttribute("src", normalizeMediaUrl(replacement.url));
    image.setAttribute("alt", replacement.title);
    image.setAttribute("title", replacement.title);
    changed = true;
  });

  if (!changed) return doc;

  return cleanDoc({
    ...doc,
    contentHtml: template.innerHTML,
    mediaAssets: dedupeMediaAssets([...(doc.mediaAssets ?? []), ...sourceAssets]),
  });
}

function compactInlineUploadPreviewsHtml(html?: string) {
  if (
    !html?.trim() ||
    typeof document === "undefined" ||
    (!html.includes("data:") && !html.includes("raw.githubusercontent.com"))
  ) {
    return html;
  }

  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll("[src]").forEach((element) => {
    const source = element.getAttribute("src");
    if (source && isUploadPreviewMediaUrl(source)) {
      element.setAttribute("src", normalizeUploadPreviewUrl(source ?? ""));
    }
  });

  template.content.querySelectorAll("figure[data-src]").forEach((figure) => {
    const source = figure.getAttribute("data-src");
    if (!source || !isUploadPreviewMediaUrl(source)) return;

    const compactUrl = normalizeUploadPreviewUrl(source ?? "");
    figure.setAttribute("data-src", compactUrl);
    figure.querySelector("video")?.setAttribute("src", compactUrl);
  });

  return template.innerHTML;
}

function compactDocForStorage(doc: DocPage): DocPage {
  const cleanedDoc = cleanDoc({
    ...doc,
    contentHtml: compactInlineUploadPreviewsHtml(doc.contentHtml),
    mediaAssets: doc.mediaAssets?.map((asset) => {
      const nextAsset = { ...asset } as UploadedMediaAsset;
      delete nextAsset.previewUrl;
      return nextAsset;
    }),
  });

  return cleanedDoc;
}

function canonicalDocForCompare(doc: DocPage): DocPage {
  const cleanedDoc = compactDocForStorage(doc);

  return {
    ...cleanedDoc,
    contentHtml: cleanedDoc.contentHtml
      ? cleanEditorHtml(cleanedDoc.contentHtml, { locale: routeLocale(cleanedDoc.route) })
      : cleanedDoc.contentHtml,
    mediaAssets: stripMediaPreviewFields(cleanedDoc.mediaAssets),
  };
}

function htmlHasMediaAsset(html: string, asset: DocMediaAsset) {
  const expected = comparableMediaUrl(asset.url);
  if (!html.trim() || !expected || typeof document === "undefined") {
    return expected ? comparableMediaUrl(html).includes(expected) : false;
  }

  const template = document.createElement("template");
  template.innerHTML = html;
  const sources = [
    ...Array.from(template.content.querySelectorAll("[src]")).map(
      (element) => element.getAttribute("src") ?? ""
    ),
    ...Array.from(template.content.querySelectorAll("figure[data-src]")).map(
      (element) => element.getAttribute("data-src") ?? ""
    ),
  ];

  return sources.some((source) => comparableMediaUrl(source) === expected);
}

function mediaAssetHtml(asset: DocMediaAsset) {
  const url = normalizeMediaUrl(asset.url);
  const title = asset.title || mediaTypeLabels[asset.type];
  const caption = asset.caption || title;

  if (asset.type === "video") {
    return `<figure data-media-type="video" data-src="${escapeHtml(url)}" data-title="${escapeHtml(
      title
    )}" data-caption="${escapeHtml(caption)}"><video src="${escapeHtml(
      url
    )}" controls="true" preload="metadata"></video><figcaption>${escapeHtml(
      caption
    )}</figcaption></figure>`;
  }

  return `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(
    title
  )}" /><figcaption>${escapeHtml(caption)}</figcaption></figure>`;
}

function appendMissingMediaAssetsHtml(
  html: string,
  assets: DocMediaAsset[],
  locale: DocLocale = DEFAULT_DOC_LOCALE
) {
  let nextHtml = html.trim();

  assets.forEach((asset) => {
    if (htmlHasMediaAsset(nextHtml, asset)) return;

    const heading = localizedMediaHeading(asset.type, locale);
    if (!htmlHasMediaHeading(nextHtml, heading)) {
      nextHtml = `${nextHtml}${nextHtml ? "\n" : ""}<h2>${heading}</h2>`;
    }
    nextHtml = `${nextHtml}\n${mediaAssetHtml(asset)}`;
  });

  return nextHtml;
}

function mediaDisplayUrl(asset: UploadedMediaAsset) {
  const previewUrl = asset.previewUrl?.trim();
  if (previewUrl && isInlineUploadPreviewUrl(previewUrl)) return previewUrl;

  return cacheSafeMediaUrl(normalizeMediaUrl(asset.url));
}

function replaceTemporaryMediaUrlHtml(html: string, temporaryUrl: string, asset: UploadedMediaAsset) {
  if (!html.trim() || typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;
  const assetUrl = mediaDisplayUrl(asset);

  if (asset.type === "image") {
    template.content.querySelectorAll("img[src]").forEach((image) => {
      if (image.getAttribute("src") !== temporaryUrl) return;

      image.setAttribute("src", assetUrl);
      image.setAttribute("alt", asset.title);
      image.setAttribute("title", asset.title);
    });
  } else {
    template.content.querySelectorAll('figure[data-media-type="video"]').forEach((figure) => {
      const video = figure.querySelector("video");
      const source = figure.getAttribute("data-src") ?? video?.getAttribute("src");
      if (source !== temporaryUrl) return;

      figure.setAttribute("data-src", assetUrl);
      figure.setAttribute("data-title", asset.title);
      figure.setAttribute("data-caption", asset.caption || asset.title);
      video?.setAttribute("src", assetUrl);
    });
  }

  return template.innerHTML;
}

function removeTemporaryMediaUrlHtml(html: string, temporaryUrl: string) {
  if (!html.trim() || typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll('figure[data-media-type="video"]').forEach((figure) => {
    const source =
      figure.getAttribute("data-src") ?? figure.querySelector("video")?.getAttribute("src");
    if (source === temporaryUrl) figure.remove();
  });

  template.content.querySelectorAll("img[src]").forEach((image) => {
    if (image.closest('figure[data-media-type="video"]')) return;
    if (image.getAttribute("src") === temporaryUrl) removeMediaNode(image);
  });

  return template.innerHTML;
}

function removeEmptyMediaHeading(
  fragment: DocumentFragment,
  headingText: string,
  mediaSelector: string
) {
  const expectedRank = mediaHeadingRankFromText(headingText);
  const expectedHeading = normalizedMediaHeading(headingText);

  Array.from(fragment.querySelectorAll("h2")).forEach((heading) => {
    const matchesHeading =
      expectedRank === null
        ? normalizedMediaHeading(heading.textContent) === expectedHeading
        : mediaHeadingRankFromText(heading.textContent) === expectedRank;
    if (!matchesHeading) return;

    let sibling = heading.nextSibling;
    let hasMedia = false;
    while (sibling) {
      if (sibling instanceof HTMLHeadingElement && sibling.tagName === "H2") break;
      if (
        sibling instanceof Element &&
        (sibling.matches(mediaSelector) || Boolean(sibling.querySelector(mediaSelector)))
      ) {
        hasMedia = true;
        break;
      }
      sibling = sibling.nextSibling;
    }

    if (!hasMedia) heading.remove();
  });
}

function removeMediaAssetFromHtml(html: string, asset: DocMediaAsset) {
  if (!html.trim() || typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;
  const expected = comparableMediaUrl(asset.url);

  if (asset.type === "video") {
    template.content.querySelectorAll('figure[data-media-type="video"]').forEach((figure) => {
      const source =
        figure.getAttribute("data-src") ?? figure.querySelector("video")?.getAttribute("src");
      if (comparableMediaUrl(source ?? "") === expected) figure.remove();
    });
    removeEmptyMediaHeading(template.content, "演示视频", 'figure[data-media-type="video"]');
  } else {
    template.content.querySelectorAll("img[src]").forEach((image) => {
      if (image.closest('figure[data-media-type="video"]')) return;
      if (comparableMediaUrl(image.getAttribute("src") ?? "") === expected) removeMediaNode(image);
    });
    removeEmptyMediaHeading(template.content, "界面示例", "img[src]");
  }

  return template.innerHTML;
}

function dedupeMediaAssets(assets?: DocMediaAsset[]) {
  if (!assets?.length) return undefined;

  const seen = new Set<string>();
  return assets
    .map((asset) => ({
      ...asset,
      url: normalizeMediaUrl(asset.url),
    }))
    .filter((asset) => {
      const key = `${asset.type}:${asset.url.trim().toLowerCase()}`;
      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
}

function mediaAssetsReferencedInHtml(assets: DocMediaAsset[], html: string) {
  if (!html.trim()) return dedupeMediaAssets(assets) ?? [];

  return (dedupeMediaAssets(assets) ?? []).filter((asset) => htmlHasMediaAsset(html, asset));
}

function stripMediaPreviewFields(assets?: DocMediaAsset[]) {
  return assets?.map((asset) => ({
    id: asset.id,
    type: asset.type,
    title: asset.title,
    url: normalizeMediaUrl(asset.url),
    ...(asset.caption ? { caption: asset.caption } : {}),
  }));
}

function dedupeDocSections(sections: DocSection[], options: { dropMediaSections?: boolean } = {}) {
  const seen = new Set<string>();
  return orderDocSections(
    sections.filter((section) => {
      if (options.dropMediaSections && mediaSectionRank(section) !== null) return false;

      const key = JSON.stringify(section);
      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    })
  );
}

function cleanDoc(doc: DocPage): DocPage {
  const normalizedDoc = normalizeDocTerminology(doc);
  const hasContentHtml = Boolean(normalizedDoc.contentHtml?.trim());
  const locale = routeLocale(normalizedDoc.route);
  const contentHtml = normalizedDoc.contentHtml?.trim()
    ? cleanEditorHtml(normalizedDoc.contentHtml, { locale, preserveUploadPreviewUrls: true })
    : normalizedDoc.contentHtml;
  const sections = dedupeDocSections(normalizedDoc.sections ?? [], {
    dropMediaSections: hasContentHtml,
  });

  return stripUnverifiedDocMedia({
    ...normalizedDoc,
    coverImage: normalizedDoc.coverImage
      ? normalizeMediaUrl(normalizedDoc.coverImage)
      : normalizedDoc.coverImage,
    contentHtml,
    mediaAssets: dedupeMediaAssets(normalizedDoc.mediaAssets),
    sections,
  });
}

function cloneDocs(docs: DocPage[]) {
  return (JSON.parse(JSON.stringify(docs)) as DocPage[]).map(cleanDoc);
}

function docToEditorHtml(doc: DocPage, options: CleanEditorHtmlOptions = {}) {
  if (doc.contentHtml?.trim()) {
    const contentHtml = cleanEditorHtml(doc.contentHtml, {
      locale: routeLocale(doc.route),
      ...options,
    });
    return options.preserveUploadPreviewUrls
      ? applyUploadPreviewUrlsHtml(contentHtml, doc.mediaAssets)
      : contentHtml;
  }

  const sectionHtml = orderDocSections(doc.sections)
    .map((section) => {
      const media = section.media?.url
        ? `<figure><img src="${escapeHtml(section.media.url)}" alt="${escapeHtml(
            section.media.label
          )}" /><figcaption>${escapeHtml(section.media.label)}</figcaption></figure>`
        : "";

      return `<h2>${escapeHtml(section.heading)}</h2>${linesToHtml(section.body)}${media}`;
    })
    .join("");

  return cleanEditorHtml(sectionHtml, { locale: routeLocale(doc.route) });
}

function assetKey(type: MediaType, url: string) {
  return `${type}:${url.trim().toLowerCase()}`;
}

function mediaAssetsFor(doc: DocPage): VisibleMediaAsset[] {
  const saved = (dedupeMediaAssets(doc.mediaAssets) ?? []).map((asset) => ({
    ...asset,
    url: normalizeMediaUrl(asset.url),
    source: "saved" as const,
  }));
  const existingKeys = new Set(saved.map((asset) => assetKey(asset.type, asset.url)));
  const discovered: VisibleMediaAsset[] = [];

  if (doc.coverImage && !existingKeys.has(assetKey("image", doc.coverImage))) {
    discovered.push({
      id: `${doc.id}-cover`,
      type: "image",
      title: `${doc.title} 界面示例`,
      url: doc.coverImage,
      caption: doc.summary,
      source: "document",
    });
    existingKeys.add(assetKey("image", doc.coverImage));
  }

  doc.sections.forEach((section) => {
    if (doc.contentHtml?.trim() && mediaSectionRank(section) !== null) return;
    if (!section.media?.url) return;
    const key = assetKey("image", section.media.url);
    if (existingKeys.has(key)) return;

    discovered.push({
      id: `${doc.id}-${section.id}-media`,
      type: "image",
      title: section.media.label || section.heading,
      url: section.media.url,
      caption: section.heading,
      source: "document",
    });
    existingKeys.add(key);
  });

  return [...saved, ...discovered];
}

function linkMark(url: string) {
  return {
    type: "link",
    attrs: {
      href: url,
      target: "_blank",
      rel: "noopener noreferrer nofollow",
      class: null,
    },
  };
}

function productionUrlForDocRoute(route: string) {
  return new URL(normalizeRoute(route), PRODUCTION_DOCS_URL).toString();
}

function docRouteFromLinkHref(href: string | undefined, docs: DocPage[]) {
  const value = href?.trim();
  if (!value) return "";

  const candidates = new Set<string>();
  candidates.add(normalizeRoute(value));

  try {
    const baseUrl = typeof window === "undefined" ? PRODUCTION_DOCS_URL : window.location.origin;
    const parsed = new URL(value, baseUrl);
    candidates.add(normalizeRoute(parsed.pathname));
  } catch {
    // Keep the manually entered value available even if it is not a valid URL yet.
  }

  const directMatch = docs.find((doc) => candidates.has(normalizeRoute(doc.route)));
  if (directMatch) return directMatch.route;

  const candidateBases = new Set(Array.from(candidates).map(routeBase));
  return docs.find((doc) => candidateBases.has(routeBase(doc.route)))?.route ?? "";
}

function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToMarkdown(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<main>${html}</main>`, "text/html");

  const convertInline = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? "";
    }

    if (!(node instanceof HTMLElement)) {
      return "";
    }

    const inner = Array.from(node.childNodes).map(convertInline).join("");

    if (node.tagName === "STRONG" || node.tagName === "B") return `**${inner}**`;
    if (node.tagName === "EM" || node.tagName === "I") return `_${inner}_`;
    if (node.tagName === "S") return `~~${inner}~~`;
    if (node.tagName === "CODE") return `\`${inner}\``;
    if (node.tagName === "A") return `[${inner}](${node.getAttribute("href") ?? ""})`;
    if (node.tagName === "IMG") {
      return `![${node.getAttribute("alt") ?? "image"}](${node.getAttribute("src") ?? ""})`;
    }

    return inner;
  };

  const blockToMarkdown = (node: Element): string => {
    const text = Array.from(node.childNodes).map(convertInline).join("").trim();

    if (node.tagName === "H1") return `# ${text}`;
    if (node.tagName === "H2") return `## ${text}`;
    if (node.tagName === "H3") return `### ${text}`;
    if (node.tagName === "BLOCKQUOTE") return text.split("\n").map((line) => `> ${line}`).join("\n");
    if (node.tagName === "UL") {
      return Array.from(node.children)
        .map((item) => `- ${Array.from(item.childNodes).map(convertInline).join("").trim()}`)
        .join("\n");
    }
    if (node.tagName === "OL") {
      return Array.from(node.children)
        .map(
          (item, index) =>
            `${index + 1}. ${Array.from(item.childNodes).map(convertInline).join("").trim()}`
        )
        .join("\n");
    }
    if (node.tagName === "FIGURE") {
      if (node.getAttribute("data-media-type") === "video") {
        const title = node.getAttribute("data-title") ?? "演示视频";
        const src =
          node.querySelector("video")?.getAttribute("src") ??
          node.getAttribute("data-src") ??
          "";
        const caption =
          node.getAttribute("data-caption") ??
          node.querySelector("figcaption")?.textContent?.trim();

        return caption ? `### ${title}\n\n[${caption}](${src})` : `### ${title}\n\n${src}`;
      }

      const imageNode = node.querySelector("img");
      const caption = node.querySelector("figcaption")?.textContent?.trim();
      const image = imageNode
        ? `![${imageNode.getAttribute("alt") ?? caption ?? "image"}](${
            imageNode.getAttribute("src") ?? ""
          })`
        : "";
      return caption ? `${image}\n_${caption}_` : image;
    }
    if (node.tagName === "IMG") return convertInline(node);
    if (node.tagName === "P") return text;

    return text;
  };

  return Array.from(doc.body.querySelector("main")?.children ?? [])
    .map(blockToMarkdown)
    .filter(Boolean)
    .join("\n\n");
}

function toMarkdown(doc: DocPage) {
  const tags = doc.tags.map((tag) => `#${tag}`).join(" ");
  const body = htmlToMarkdown(docToEditorHtml(doc));

  return `# ${doc.title}

> ${doc.summary}

- 路径：${doc.route}
- 分组：${doc.category}
- 状态：${statusLabels[doc.status]}
- 版本：${doc.version}
- 标签：${tags}

${body}
`;
}

function buildStaticPreviewHtml(doc: DocPage) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(doc.title)}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; color: #37352f; background: #ffffff; font-family: Inter, "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif; }
      main { max-width: 820px; margin: 0 auto; padding: 42px 28px 72px; background: #fff; min-height: 100vh; }
      .meta { display: none; }
      h1 { min-height: 58px; margin: 0 0 10px; overflow-wrap: anywhere; color: #1f1f1f; font-size: 42px; font-weight: 700; line-height: 1.1; letter-spacing: 0; }
      .summary { min-height: 42px; margin: 0 0 28px; color: #37352f; font-size: 16px; line-height: 1.65; }
      h2 { margin: 32px 0 12px; color: #1f1f1f; font-size: 25px; line-height: 1.25; }
      h3 { margin: 22px 0 10px; color: #37352f; font-size: 20px; line-height: 1.3; }
      p, li { color: #37352f; font-size: 16px; line-height: 1.72; }
      p { margin: 10px 0; }
      ul, ol { margin: 12px 0; padding-left: 24px; }
      blockquote { margin: 18px 0; padding: 10px 16px; border-left: 4px solid #087a74; color: #455751; background: #f3f8f6; }
      img { display: block; max-width: 100%; max-height: 420px; height: auto; margin: 18px 0; border-radius: 8px; border: 1px solid #dfe5df; object-fit: contain; }
      figure { margin: 20px 0; }
      figure[data-media-type="video"] { display: grid; gap: 10px; padding: 0; border: 1px solid #dfe5df; border-radius: 8px; background: #f8faf8; overflow: hidden; }
      video { width: 100%; aspect-ratio: 16 / 9; height: auto; border-radius: 0; background: #101817; object-fit: contain; }
      figcaption { display: none; }
      a { color: #030303; font-weight: 500; text-decoration: underline; text-underline-offset: 3px; }
      a:visited { color: #030303; }
    </style>
  </head>
  <body>
    <main>
      <div class="meta">${escapeHtml(doc.category)} · ${escapeHtml(doc.route)} · v${escapeHtml(doc.version)}</div>
      <h1>${escapeHtml(doc.title)}</h1>
      <p class="summary">${escapeHtml(doc.summary)}</p>
      ${docToEditorHtml(doc)}
    </main>
  </body>
</html>`;
}

function buildPublishedDoc(doc: DocPage) {
  const cleanedDoc = cleanDoc(doc);
  const contentHtml = docToEditorHtml(cleanedDoc);
  const mediaAssets = stripMediaPreviewFields(dedupeMediaAssets(cleanedDoc.mediaAssets));
  const hasContentHtml = Boolean(contentHtml.trim());

  return {
    ...cleanedDoc,
    contentHtml,
    sections: dedupeDocSections(cleanedDoc.sections, { dropMediaSections: hasContentHtml }),
    mediaAssets,
    markdown: toMarkdown(cleanedDoc),
    previewHtml: buildStaticPreviewHtml(cleanedDoc),
  };
}

function downloadFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function markEditingStatus(doc: DocPage) {
  return doc.status;
}

function contentText(doc: DocPage) {
  return htmlToText(docToEditorHtml(doc));
}

function checklistFor(doc: DocPage): ChecklistItem[] {
  const html = docToEditorHtml(doc);
  const text = htmlToText(html);

  return [
    { label: "标题", ok: doc.title.trim().length >= 2 },
    { label: "摘要", ok: doc.summary.trim().length >= 18 },
    { label: "路径", ok: routeBase(doc.route).startsWith("/docs") },
    { label: "标签", ok: doc.tags.length >= 2 },
    { label: "小标题", ok: /<h[23][\s>]/i.test(html) },
    { label: "正文", ok: text.length >= 80 },
  ];
}

function readiness(doc: DocPage) {
  const items = checklistFor(doc);
  return Math.round((items.filter((item) => item.ok).length / items.length) * 100);
}

function App() {
  const path = window.location.pathname;
  const host = window.location.hostname;
  const isLocalRoot = (host === "127.0.0.1" || host === "localhost") && path === "/";

  if (path.startsWith("/editor") || isLocalRoot) {
    return <EditorApp />;
  }

  return <PublicDocsApp />;
}

function EditorApp() {
  const [session, setSession] = useState<EditorSession | null>(readEditorSession);
  const localBypass = isLocalHost();

  function handleAuthenticated(nextSession: EditorSession) {
    saveEditorSession(nextSession);
    setSession(nextSession);
  }

  function handleLogout() {
    clearEditorSession();
    setSession(null);
  }

  if (!localBypass && !session) {
    return <EditorLoginScreen onAuthenticated={handleAuthenticated} />;
  }

  return <EditorWorkspace authToken={session?.token ?? ""} onLogout={handleLogout} />;
}

function EditorLoginScreen({
  onAuthenticated,
}: {
  onAuthenticated: (session: EditorSession) => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "编辑器登录 - POLYTRON ONE 文档";
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!password.trim()) {
      setError("请输入编辑器密码");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/editor-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error(await readPublishError(response));
      }

      const session = (await response.json()) as EditorSession & { ok?: boolean };
      if (!session.token || !session.expiresAt) {
        throw new Error("登录响应不可用");
      }

      onAuthenticated({ token: session.token, expiresAt: session.expiresAt });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-mark">
          <Lock size={24} />
        </div>
        <div>
          <h1>编辑器登录</h1>
          <p>请输入管理员密码后进入文档编辑器。</p>
        </div>
        <label>
          编辑器密码
          <input
            autoFocus
            type="password"
            value={password}
            placeholder="输入编辑器密码"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button className="primary-button" disabled={isSubmitting} type="submit">
          <Lock size={16} />
          {isSubmitting ? "登录中" : "进入编辑器"}
        </button>
        <a className="login-doc-link" href="/zh/docs">
          返回公开文档
        </a>
      </form>
    </div>
  );
}

function EditorWorkspace({
  authToken,
  onLogout,
}: {
  authToken: string;
  onLogout: () => void;
}) {
  const [docs, setDocs] = useState<DocPage[]>(readStoredDocs);
  const [editorLocale, setEditorLocale] = useState<DocLocale>(readStoredEditorLocale);
  const [selectedId, setSelectedId] = useState(() => readStoredSelectedDocId(docs));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocStatus | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [mediaDrafts, setMediaDrafts] = useState<MediaDrafts>(emptyMediaDrafts);
  const [publishConfig, setPublishConfig] = useState<PublishConfig>(readPublishConfig);
  const [publishStatus, setPublishStatus] = useState<PublishStatus | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isMediaDragging, setIsMediaDragging] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [pendingMediaUploads, setPendingMediaUploads] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null);
  const [uploadLimitDialog, setUploadLimitDialog] = useState<UploadLimitDialogState | null>(null);
  const [hasPendingDeletions, setHasPendingDeletions] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const docsRef = useRef<DocPage[]>(docs);
  const selectedIdRef = useRef(selectedId);

  useEffect(() => {
    document.title = "POLYTRON 文档编辑器";
  }, []);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    window.localStorage.setItem(SELECTED_DOC_KEY, selectedId);
  }, [selectedId]);

  useEffect(() => {
    docsRef.current = docs;
  }, [docs]);

  useEffect(() => {
    window.localStorage.setItem(DOC_LOCALE_KEY, editorLocale);
  }, [editorLocale]);

  useEffect(() => {
    if (pendingMediaUploads <= 0) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [pendingMediaUploads]);

  const localeDocs = useMemo(() => docsForLocale(docs, editorLocale), [docs, editorLocale]);
  const selectedDoc = useMemo(() => {
    return localeDocs.find((doc) => doc.id === selectedId) ?? localeDocs[0] ?? docs[0];
  }, [docs, localeDocs, selectedId]);

  useEffect(() => {
    if (!localeDocs.length) return;
    if (localeDocs.some((doc) => doc.id === selectedId)) return;

    setSelectedId(localeDocs[0].id);
  }, [localeDocs, selectedId]);

  const isUsingLocalPublish = useMemo(
    () => isLocalPublishEndpoint(publishConfig.endpoint),
    [publishConfig.endpoint]
  );
  const isPublishBackendConnected = Boolean(publishStatus?.remote?.connected);
  const publishConnectionTitle = isPublishBackendConnected
    ? isUsingLocalPublish
      ? "Vercel Hook 已连接"
      : "线上发布接口已连接"
    : isUsingLocalPublish
      ? "当前为本机发布"
      : "线上发布接口待配置";
  const publishConnectionMessage = isPublishBackendConnected
    ? isUsingLocalPublish
      ? `点击发布后会先生成本机发布包，并触发 ${PRODUCTION_DOCS_URL} 的线上重建。`
      : `点击发布后会写回 GitHub，并触发 ${PRODUCTION_DOCS_URL} 的线上更新。`
    : isUsingLocalPublish
      ? `内容会先生成本机预览包；线上 ${PRODUCTION_DOCS_URL} 需要连接 Vercel 后才会同步。`
      : publishStatus?.remote?.missing?.length
        ? `线上 API 已存在，但还缺少配置：${publishStatus.remote.missing.join(", ")}。`
        : "发布会发送到线上 API；如果仍失败，请检查 Vercel 环境变量。";

  useEffect(() => {
    writeStoredDocs(docs);
  }, [docs]);

  useEffect(() => {
    window.localStorage.setItem(PUBLISH_CONFIG_KEY, JSON.stringify(publishConfig));
  }, [publishConfig]);

  useEffect(() => {
    const statusEndpoint = getPublishStatusEndpoint(publishConfig.endpoint);
    if (!statusEndpoint) {
      setPublishStatus(null);
      return;
    }

    let cancelled = false;
    fetch(statusEndpoint)
      .then((response) => (response.ok ? response.json() : null))
      .then((status: PublishStatus | null) => {
        if (!cancelled) setPublishStatus(status);
      })
      .catch(() => {
        if (!cancelled) setPublishStatus(null);
      });

    return () => {
      cancelled = true;
    };
  }, [publishConfig.endpoint]);

  useEffect(() => {
    if (!localeDocs.some((doc) => doc.id === selectedId) && localeDocs[0]) {
      setSelectedId(localeDocs[0].id);
    }
  }, [localeDocs, selectedId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function handleSaveShortcut(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") return;

      event.preventDefault();
      if (event.repeat) return;
      saveDraft();
    }

    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  });

  useEffect(() => {
    function preventBrowserFileOpen(event: DragEvent) {
      if (!dragDataHasFiles(event.dataTransfer)) return;

      event.preventDefault();
      if (event.type === "drop") {
        setIsMediaDragging(false);
      }
    }

    window.addEventListener("dragover", preventBrowserFileOpen);
    window.addEventListener("drop", preventBrowserFileOpen);
    return () => {
      window.removeEventListener("dragover", preventBrowserFileOpen);
      window.removeEventListener("drop", preventBrowserFileOpen);
    };
  }, []);

  const stats = useMemo(() => {
    return {
      total: localeDocs.length,
      published: localeDocs.filter((doc) => doc.status === "Published").length,
      review: localeDocs.filter((doc) => doc.status === "Review").length,
      draft: localeDocs.filter((doc) => doc.status === "Draft").length,
    };
  }, [localeDocs]);
  const editorCategories = useMemo(() => {
    return moduleCategoryNames(localeDocs);
  }, [localeDocs]);

  const filteredDocs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return localeDocs.filter((doc) => {
      const matchesQuery =
        !normalized ||
        [doc.title, doc.route, doc.summary, doc.category, contentText(doc), ...doc.tags]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      const matchesStatus = statusFilter === "All" || doc.status === statusFilter;
      const matchesCategory =
        categoryFilter === "全部" || doc.category === categoryFilter;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, localeDocs, query, statusFilter]);

  const groupedDocs = useMemo(() => {
    return editorCategories
      .map((category) => ({
        category,
        docs: filteredDocs.filter((doc) => doc.category === category),
      }))
      .filter((group) => group.docs.length);
  }, [editorCategories, filteredDocs]);

  const checklist = selectedDoc ? checklistFor(selectedDoc) : [];
  const score = selectedDoc ? readiness(selectedDoc) : 0;
  const mediaAssets = selectedDoc ? mediaAssetsFor(selectedDoc) : [];
  const imageAssets = mediaAssets.filter((asset) => asset.type === "image");
  const videoAssets = mediaAssets.filter((asset) => asset.type === "video");
  const navigationCardSection = useMemo(
    () =>
      selectedDoc ? navigationCardSectionForDoc(selectedDoc, localeDocs) : null,
    [localeDocs, selectedDoc]
  );
  const relatedQueue = localeDocs
    .filter((doc) => doc.status !== "Published")
    .sort((a, b) => readiness(b) - readiness(a))
    .slice(0, 5);

  function showToast(text: string, tone: Toast["tone"] = "good") {
    setToast({ text, tone });
  }

  function updateDoc(patch: Partial<DocPage>) {
    setDocs((current) =>
      current.map((doc) =>
        doc.id === selectedDoc.id ? { ...doc, ...patch, updatedAt: today() } : doc
      )
    );
  }

  function updateCurrentDoc(updater: (doc: DocPage) => DocPage) {
    setDocs((current) =>
      current.map((doc) => (doc.id === selectedDoc.id ? updater(doc) : doc))
    );
  }

  function updateDocById(docId: string, updater: (doc: DocPage) => DocPage) {
    setDocs((current) => current.map((doc) => (doc.id === docId ? updater(doc) : doc)));
  }

  function handleBodyChange(contentHtml: string) {
    const contentHtmlWithPreviews = applyUploadPreviewUrlsHtml(
      contentHtml,
      selectedDoc.mediaAssets
    );

    updateCurrentDoc((doc) => ({
      ...doc,
      contentHtml: cleanEditorHtml(contentHtmlWithPreviews, {
        locale: routeLocale(doc.route),
        preserveUploadPreviewUrls: true,
      }),
      status: markEditingStatus(doc),
      updatedAt: today(),
    }));
  }

  function handleTitleChange(title: string) {
    updateCurrentDoc((doc) => ({
      ...doc,
      title,
      status: markEditingStatus(doc),
      updatedAt: today(),
    }));
  }

  function handleSummaryChange(summary: string) {
    updateCurrentDoc((doc) => ({
      ...doc,
      summary,
      status: markEditingStatus(doc),
      updatedAt: today(),
    }));
  }

  function handleTags(value: string) {
    const tags = value
      .split(/[，,]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    updateCurrentDoc((doc) => ({
      ...doc,
      tags,
      status: markEditingStatus(doc),
      updatedAt: today(),
    }));
  }

  function updatePublishConfig(patch: Partial<PublishConfig>) {
    setPublishConfig((config) => ({
      ...config,
      ...patch,
    }));
  }

  function handleNavigationCardsChange(cards: NavigationCard[]) {
    const sourceHtml =
      editorRef.current?.getHTML() ??
      docToEditorHtml(selectedDoc, { preserveUploadPreviewUrls: true });
    const nextHtml = writeNavigationCardsHtml(sourceHtml, selectedDoc, cards);
    if (nextHtml === sourceHtml) return;

    if (editorRef.current) {
      editorRef.current.commands.setContent(nextHtml, { emitUpdate: true });
      return;
    }

    handleBodyChange(nextHtml);
  }

  function switchEditorLocale(nextLocale: DocLocale) {
    if (nextLocale === editorLocale) return;

    const latestDocs = docsWithCurrentEditorContent(docsRef.current);
    docsRef.current = latestDocs;
    writeStoredDocs(latestDocs);
    setDocs(latestDocs);

    const currentDoc = latestDocs.find((doc) => doc.id === selectedIdRef.current) ?? selectedDoc;
    const nextDoc = matchingDocInLocale(currentDoc, latestDocs, nextLocale);
    setEditorLocale(nextLocale);
    setCategoryFilter("全部");
    setSelectedId(nextDoc?.id ?? docsForLocale(latestDocs, nextLocale)[0]?.id ?? selectedIdRef.current);
  }

  function addUploadedMediaAsset(
    asset: DocMediaAsset,
    options: { docId?: string; insert?: boolean } = {}
  ) {
    const docId = options.docId ?? selectedDoc.id;

    updateDocById(docId, (doc) => {
      const existingAssets = doc.mediaAssets ?? [];
      const alreadyExists = existingAssets.some(
        (item) => assetKey(item.type, item.url) === assetKey(asset.type, asset.url)
      );

      return {
        ...doc,
        mediaAssets: alreadyExists
          ? existingAssets
          : (dedupeMediaAssets([...existingAssets, asset]) ?? []),
        status: markEditingStatus(doc),
        updatedAt: today(),
      };
    });

    if (options.insert !== false && selectedIdRef.current === docId) {
      insertMediaAsset(asset);
    }
  }

  async function uploadMediaFile(file: File, docId: string) {
    const uploadEndpoint = getMediaUploadEndpoint(publishConfig.endpoint.trim());
    const mediaType = mediaTypeForFile(file);
    const targetDoc = docsRef.current.find((doc) => doc.id === docId) ?? selectedDoc;

    if (!uploadEndpoint) {
      throw new Error("上传接口地址不可用");
    }

    if (!mediaType) {
      throw new Error(`不支持的文件类型：${file.name}`);
    }

    const dataBase64 = await fileToBase64(file);
    const response = await fetch(uploadEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken || publishConfig.token.trim()
          ? { Authorization: `Bearer ${authToken || publishConfig.token.trim()}` }
          : {}),
      },
      body: JSON.stringify({
        contentType: contentTypeForFile(file),
        dataBase64,
        docId: targetDoc.id,
        fileName: file.name,
        locale: routeLocale(targetDoc.route),
        route: targetDoc.route,
      }),
    });

    if (!response.ok) {
      throw new Error(await readPublishError(response));
    }

    const result = (await response.json()) as MediaUploadResponse;
    if (!result.ok || !result.asset) {
      throw new Error(result.error || "上传失败");
    }

    return {
      ...result.asset,
      previewUrl: result.asset.previewUrl || result.previewUrl,
    };
  }

  function buildDocWithUploadedMedia(docId: string, uploadedAssets: DocMediaAsset[]) {
    const doc = docsRef.current.find((item) => item.id === docId);
    if (!doc) return null;

    const editorHtml =
      selectedIdRef.current === docId ? editorRef.current?.getHTML() : undefined;
    const contentHtml = cleanEditorHtml(
      appendMissingMediaAssetsHtml(
        editorHtml ?? doc.contentHtml ?? "",
        uploadedAssets,
        routeLocale(doc.route)
      ),
      { locale: routeLocale(doc.route) }
    );
    const mediaAssets = mediaAssetsReferencedInHtml(
      [...(doc.mediaAssets ?? []), ...uploadedAssets],
      contentHtml
    );
    const hasContentHtml = Boolean(contentHtml.trim());

    return {
      ...doc,
      contentHtml,
      mediaAssets,
      sections: dedupeDocSections(doc.sections ?? [], { dropMediaSections: hasContentHtml }),
      status: "Published" as DocStatus,
      updatedAt: today(),
    };
  }

  async function autoSaveUploadedMediaDoc(docId: string, uploadedAssets: DocMediaAsset[]) {
    if (!uploadedAssets.length) return true;

    const endpoint = publishConfig.endpoint.trim();
    if (!endpoint) {
      showToast("图片已上传，但服务器发布接口未配置，无法自动保存正文", "warn");
      return false;
    }

    const targetDoc = buildDocWithUploadedMedia(docId, uploadedAssets);
    if (!targetDoc) {
      showToast("图片已上传，但未找到对应文档，无法自动保存正文", "warn");
      return false;
    }

    if (htmlHasTemporaryMedia(targetDoc.contentHtml ?? "")) {
      showToast("图片还在后台上传，完成后会自动保存到线上", "warn");
      return false;
    }

    const publishedAt = new Date().toISOString();
    const latestDocs = docsRef.current.map((doc) => (doc.id === docId ? targetDoc : doc));
    const payload: PublishPayload = {
      source: "polytron-doc-editor",
      action: "auto-save-uploaded-media",
      scope: "all" as PublishScope,
      publishedAt,
      sourceSignature: SOURCE_DOCS_SIGNATURE,
      docs: latestDocs.map(buildPublishedDoc),
    };

    setIsPublishing(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken || publishConfig.token.trim()
            ? { Authorization: `Bearer ${authToken || publishConfig.token.trim()}` }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readPublishError(response));
      }

      const result = (await response.json().catch(() => ({}))) as PublishResponse;
      const nextDocs = latestDocs.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              status: "Published" as DocStatus,
              updatedAt: today(),
            }
          : doc
      );
      setDocs(nextDocs);
      writeStoredDocs(nextDocs);

      if (result.remote?.ok) {
        showToast("媒体已上传，正在等待线上资源生效");
        try {
          await Promise.all(uploadedAssets.map((asset) => waitForMediaUrl(asset.url)));
        } catch (error) {
          showToast(
            `媒体已上传并保存；线上资源还在发布中：${
              error instanceof Error ? error.message : "请稍后刷新再试"
            }`,
            "warn"
          );
          return false;
        }
        showToast("媒体已上传，并已自动保存到线上");
      } else if (result.remote?.connected) {
        showToast(
          `媒体已上传，正文已保存；线上更新触发失败：${result.remote.message ?? "未知错误"}`,
          "warn"
        );
      } else {
        showToast("媒体已上传，正文已保存；线上更新仍在等待部署", "warn");
      }
      return true;
    } catch (error) {
      showToast(
        `图片已上传，但自动保存正文失败：${
          error instanceof Error ? error.message : "服务器未响应"
        }`,
        "warn"
      );
      return false;
    } finally {
      setIsPublishing(false);
    }
  }

  function replaceTemporaryMediaInEditor(
    temporaryUrl: string,
    asset: UploadedMediaAsset,
    docId: string
  ) {
    const editor = editorRef.current;
    if (!editor || selectedIdRef.current !== docId) return null;

    const replacedHtml = replaceTemporaryMediaUrlHtml(editor.getHTML(), temporaryUrl, asset);
    const targetDoc = docsRef.current.find((doc) => doc.id === docId);
    const nextEditorHtml = orderMediaSectionsHtml(
      appendMissingMediaAssetsHtml(
        replacedHtml,
        [asset],
        routeLocale(targetDoc?.route ?? selectedDoc.route)
      )
    );
    const persistedHtml = cleanEditorHtml(nextEditorHtml, {
      locale: routeLocale(targetDoc?.route ?? selectedDoc.route),
      preserveUploadPreviewUrls: true,
    });
    editor.commands.setContent(nextEditorHtml, { emitUpdate: true });
    updateDocById(docId, (doc) => ({
      ...doc,
      contentHtml: persistedHtml,
      sections: dedupeDocSections(doc.sections ?? [], { dropMediaSections: true }),
      status: markEditingStatus(doc),
      updatedAt: today(),
    }));
    return persistedHtml;
  }

  function removeTemporaryMediaFromEditor(temporaryUrl: string, docId: string) {
    const editor = editorRef.current;
    if (!editor || selectedIdRef.current !== docId) return;

    const targetDoc = docsRef.current.find((doc) => doc.id === docId);
    const nextHtml = cleanEditorHtml(removeTemporaryMediaUrlHtml(editor.getHTML(), temporaryUrl), {
      locale: routeLocale(targetDoc?.route ?? selectedDoc.route),
    });
    editor.commands.setContent(nextHtml, { emitUpdate: true });
  }

  async function uploadMediaWithPreview(file: File, docId: string) {
    const mediaType = mediaTypeForFile(file);
    if (!mediaType) return { ok: false };

    const temporaryUrl = URL.createObjectURL(file);
    const title = file.name.replace(/\.[^.]+$/, "") || mediaTypeLabels[mediaType];
    const temporaryAsset: DocMediaAsset = {
      id: `temporary-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: mediaType,
      title,
      url: temporaryUrl,
      caption: title,
    };

    insertMediaAsset(temporaryAsset, { notify: false });
    let uploadedAsset: UploadedMediaAsset | null = null;

    try {
      const asset = await uploadMediaFile(file, docId);
      uploadedAsset = asset;
      showToast("媒体已上传，正在自动保存");
      replaceTemporaryMediaInEditor(temporaryUrl, asset, docId);
      addUploadedMediaAsset(asset, { docId, insert: false });

      return { ok: true, asset };
    } catch (error) {
      if (uploadedAsset) {
        replaceTemporaryMediaInEditor(temporaryUrl, uploadedAsset, docId);
        addUploadedMediaAsset(uploadedAsset, { docId, insert: false });
        showToast(
          `媒体已上传，但线上图片还在发布中：${
            error instanceof Error ? error.message : "请稍后刷新再试"
          }`,
          "warn"
        );
        return { ok: true, asset: uploadedAsset };
      }

      removeTemporaryMediaFromEditor(temporaryUrl, docId);
      showToast(`上传失败：${error instanceof Error ? error.message : "服务器未响应"}`, "warn");
      return { ok: false };
    } finally {
      URL.revokeObjectURL(temporaryUrl);
    }
  }

  async function uploadDroppedMedia(files: File[]) {
    const { accepted: mediaFiles, oversized, unsupported } = validateMediaFiles(files);

    if (oversized.length) {
      setUploadLimitDialog({
        acceptedCount: mediaFiles.length,
        files: oversized,
      });
    }

    if (unsupported.length) {
      showToast(
        unsupported.length === files.length
          ? "请拖入图片或视频文件"
          : `${unsupported.length} 个文件格式不支持，已跳过`,
        "warn"
      );
    }

    if (!mediaFiles.length) {
      if (!oversized.length && !unsupported.length) {
        showToast("请拖入图片或视频文件", "warn");
      }
      return;
    }

    setIsUploadingMedia(true);
    const docId = selectedDoc.id;
    setPendingMediaUploads((count) => count + mediaFiles.length);
    const uploadTasks = mediaFiles.map(async (file) => {
      try {
        return await uploadMediaWithPreview(file, docId);
      } finally {
        setPendingMediaUploads((count) => Math.max(0, count - 1));
      }
    });

    setIsUploadingMedia(false);
    setIsMediaDragging(false);
    showToast("已插入本地预览，正在后台上传");

    void Promise.all(uploadTasks).then(async (results) => {
      const uploadedAssets = results
        .map((result) => result.asset)
        .filter((asset): asset is DocMediaAsset => Boolean(asset));

      let savedOnline = true;
      if (uploadedAssets.length) {
        savedOnline = await autoSaveUploadedMediaDoc(docId, uploadedAssets);
      }

      if (savedOnline && results.every((result) => result.ok)) {
        showToast("媒体已上传，并已自动保存到线上");
      }
    });
  }

  async function publishToServer() {
    const endpoint = publishConfig.endpoint.trim();
    const sourceDocs = docsRef.current;
    const targetDoc = sourceDocs.find((doc) => doc.id === selectedIdRef.current) ?? selectedDoc;
    const { rawHtml } = currentEditorContentFor(targetDoc);

    if (!endpoint) {
      showToast("请先在右侧填写服务器发布接口地址", "warn");
      return;
    }

    if (pendingMediaUploads > 0 || htmlHasTemporaryMedia(rawHtml)) {
      showToast("图片还在后台上传，完成后再发布到服务器", "warn");
      return;
    }

    const latestDocs = docsWithCurrentEditorContent(sourceDocs);
    writeStoredDocs(latestDocs);
    setDocs(latestDocs);

    const effectiveScope: PublishScope = "all";
    const targetDocs = latestDocs;

    if (!targetDocs.length) {
      showToast("没有可发布的文档", "warn");
      return;
    }

    const publishedAt = new Date().toISOString();
    const payload: PublishPayload = {
      source: "polytron-doc-editor",
      action: "publish-docs",
      scope: effectiveScope,
      publishedAt,
      sourceSignature: SOURCE_DOCS_SIGNATURE,
      docs: targetDocs.map(buildPublishedDoc),
    };

    setIsPublishing(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken || publishConfig.token.trim()
            ? { Authorization: `Bearer ${authToken || publishConfig.token.trim()}` }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readPublishError(response));
      }

      const result = (await response.json().catch(() => ({}))) as PublishResponse;
      const publishedIds = new Set(targetDocs.map((doc) => doc.id));
      setDocs((current) =>
        current.map((doc) =>
          publishedIds.has(doc.id)
            ? {
                ...doc,
                status: "Published",
                updatedAt: today(),
                version: ((Number(doc.version) || 1) + 0.1).toFixed(1),
              }
            : doc
        )
      );
      setHasPendingDeletions(false);
      if (result.remote?.ok) {
        if (result.sourceSync?.changed === false || result.sourceSync?.pushed === false) {
          showToast(
            "服务器已收到发布请求，但检测到文档内容没有变化；线上不会生成新版本",
            "warn"
          );
        } else {
          showToast("已写入线上数据，并已触发线上更新，等 Vercel 构建完成后生效");
        }
      } else if (result.remote?.connected) {
        showToast(`本地发布成功，线上触发失败：${result.remote.message ?? "未知错误"}`, "warn");
      } else {
        showToast("本地发布成功；线上 Vercel 尚未连接", "warn");
      }
    } catch (error) {
      showToast(`发布失败：${error instanceof Error ? error.message : "服务器未响应"}`, "warn");
    } finally {
      setIsPublishing(false);
    }
  }

  function updateMediaDraft(type: MediaType, patch: Partial<MediaDraft>) {
    setMediaDrafts((drafts) => ({
      ...drafts,
      [type]: {
        ...drafts[type],
        ...patch,
      },
    }));
  }

  function addMediaAsset(type: MediaType) {
    const draft = mediaDrafts[type];
    const title = draft.title.trim() || mediaTypeLabels[type];
    const url = normalizeMediaUrl(draft.url);

    if (!url) {
      showToast(`请先填写${mediaTypeLabels[type]}地址`, "warn");
      return;
    }

    const alreadyExists = (selectedDoc.mediaAssets ?? []).some(
      (asset) => assetKey(asset.type, asset.url) === assetKey(type, url)
    );
    if (alreadyExists) {
      showToast(`${mediaTypeLabels[type]}已存在`, "warn");
      return;
    }

    const asset: DocMediaAsset = {
      id: createId(type),
      type,
      title,
      url,
      caption: draft.caption.trim(),
    };

    updateCurrentDoc((doc) => ({
      ...doc,
      mediaAssets: [...(doc.mediaAssets ?? []), asset],
      status: markEditingStatus(doc),
      updatedAt: today(),
    }));
    setMediaDrafts((drafts) => ({
      ...drafts,
      [type]: { ...emptyMediaDraft },
    }));
    showToast(`已添加${mediaTypeLabels[type]}`);
  }

  function removeMediaAsset(assetId: string) {
    const asset = selectedDoc.mediaAssets?.find((item) => item.id === assetId);
    if (!asset) {
      showToast("媒体资源不存在", "warn");
      return;
    }

    const editor = editorRef.current;
    const editorHtml = editor?.getHTML();
    const nextEditorHtml = editorHtml
      ? cleanEditorHtml(removeMediaAssetFromHtml(editorHtml, asset), {
          locale: routeLocale(selectedDoc.route),
          preserveUploadPreviewUrls: true,
        })
      : "";

    if (editor && editorHtml !== nextEditorHtml) {
      editor.commands.setContent(nextEditorHtml, { emitUpdate: false });
    }

    updateCurrentDoc((doc) => {
      const sourceHtml = editorHtml
        ? nextEditorHtml
        : removeMediaAssetFromHtml(doc.contentHtml ?? "", asset);
      const contentHtml = cleanEditorHtml(sourceHtml, {
        locale: routeLocale(doc.route),
        preserveUploadPreviewUrls: true,
      });
      const mediaAssets = (doc.mediaAssets ?? []).filter(
        (item) =>
          item.id !== assetId &&
          assetKey(item.type, item.url) !== assetKey(asset.type, asset.url)
      );

      return {
        ...doc,
        contentHtml,
        mediaAssets: mediaAssets.length ? mediaAssets : undefined,
        sections: dedupeDocSections(doc.sections ?? [], {
          dropMediaSections: Boolean(contentHtml.trim()),
        }),
        status: markEditingStatus(doc),
        updatedAt: today(),
      };
    });
    showToast("已移除媒体");
  }

  function insertMediaAsset(asset: DocMediaAsset, options: { notify?: boolean } = {}) {
    const editor = editorRef.current;
    const assetUrl = normalizeMediaUrl(asset.url);
    const displayUrl = mediaDisplayUrl(asset);
    const currentHtml = editor?.getHTML() ?? selectedDoc.contentHtml ?? "";
    const imageHeadingText = localizedMediaHeading("image", routeLocale(selectedDoc.route));
    const videoHeadingText = localizedMediaHeading("video", routeLocale(selectedDoc.route));
    const imageHeading = {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: imageHeadingText }],
    };
    const videoHeading = {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: videoHeadingText }],
    };

    if (!editor) {
      showToast("编辑器还在加载", "warn");
      return;
    }

    if (asset.type === "image") {
      const content = [
        ...(htmlHasMediaHeading(currentHtml, imageHeadingText) ? [] : [imageHeading]),
        {
          type: "image",
          attrs: {
            src: displayUrl,
            alt: asset.title,
            title: asset.title,
          },
        },
      ];

      editor
        .chain()
        .focus()
        .insertContent(content)
        .run();
    } else {
      const content = [
        ...(htmlHasMediaHeading(currentHtml, videoHeadingText) ? [] : [videoHeading]),
        {
          type: "videoEmbed",
          attrs: {
            src: displayUrl,
            title: asset.title,
            caption: asset.caption || asset.title,
          },
        },
      ];

      editor
        .chain()
        .focus()
        .insertContent(content)
        .run();
    }

    if (options.notify !== false) {
      showToast(`已插入${mediaTypeLabels[asset.type]}`);
    }
  }

  function currentEditorContentFor(doc: DocPage) {
    const editor = editorRef.current;
    const rawHtml = editor?.getHTML() ?? doc.contentHtml ?? "";
    const contentHtml = cleanEditorHtml(applyUploadPreviewUrlsHtml(rawHtml, doc.mediaAssets), {
      locale: routeLocale(doc.route),
      preserveUploadPreviewUrls: true,
    });

    return { contentHtml, rawHtml };
  }

  function docsWithCurrentEditorContent(sourceDocs: DocPage[]) {
    const docId = selectedIdRef.current;
    const targetDoc = sourceDocs.find((doc) => doc.id === docId);
    if (!targetDoc) return sourceDocs;

    const { contentHtml } = currentEditorContentFor(targetDoc);

    return sourceDocs.map((doc) =>
      doc.id === docId
        ? {
            ...doc,
            contentHtml,
            sections: dedupeDocSections(doc.sections ?? [], { dropMediaSections: true }),
            status: markEditingStatus(doc),
            updatedAt: today(),
          }
        : doc
    );
  }

  function saveDraft() {
    const editor = editorRef.current;
    const sourceDocs = docsRef.current;
    const targetDoc = sourceDocs.find((doc) => doc.id === selectedIdRef.current) ?? selectedDoc;
    const { contentHtml, rawHtml } = currentEditorContentFor(targetDoc);

    if (pendingMediaUploads > 0 || htmlHasTemporaryMedia(rawHtml)) {
      showToast("图片还在后台上传，完成后再保存", "warn");
      return;
    }

    if (editor && rawHtml !== contentHtml) {
      editor.commands.setContent(contentHtml, { emitUpdate: false });
    }

    const nextDocs = docsWithCurrentEditorContent(sourceDocs);
    const savedLocally = writeStoredDocs(nextDocs);
    setDocs(nextDocs);
    if (!savedLocally) {
      showToast(
        "保存失败：浏览器本地空间不足，请先发布到服务器或移除重复的大图片",
        "warn"
      );
      return;
    }
    showToast(
      hasPendingDeletions
        ? "已保存到本机；删除需要发布到服务器后才会在线上生效"
        : "已保存"
    );
  }

  function publishDoc() {
    const ready = checklist.every((item) => item.ok);
    if (!ready) {
      updateDoc({ status: "Review" });
      showToast("还有检查项未完成，已放入审核", "warn");
      return;
    }

    const nextVersion = ((Number(selectedDoc.version) || 1) + 0.1).toFixed(1);
    updateDoc({ status: "Published", version: nextVersion });
    showToast("已标记为发布");
  }

  function duplicateDoc() {
    const copy: DocPage = {
      ...cloneDocs([selectedDoc])[0],
      id: createId(selectedDoc.id),
      title: `${selectedDoc.title} 副本`,
      route: `${selectedDoc.route}-copy`,
      status: "Draft",
      updatedAt: today(),
      version: "0.1",
      contentHtml: docToEditorHtml(selectedDoc),
    };
    setDocs((current) => [...current, copy]);
    setSelectedId(copy.id);
    showToast("已复制文档");
  }

  function createModule() {
    const name = window.prompt("输入大模块名称", "新模块");
    const category = name?.trim();
    if (!category) return;

    const route = routeForLocale(`/docs/${routeSegment(category, "module")}`, editorLocale);
    const page: DocPage = {
      id: createId("module"),
      title: "概览",
      route,
      category,
      status: "Draft",
      owner: selectedDoc.owner,
      updatedAt: today(),
      version: "0.1",
      readingTime: 2,
      summary: `补充“${category}”模块的用途、适用对象和主要内容。`,
      tags: [category, "概览"],
      contentHtml:
        "<h2>概览</h2><p>在这里编写这个大模块的说明。</p><h2>页面结构</h2><ul><li><p>补充该模块下的子页面。</p></li></ul>",
      sections: [],
    };

    setDocs((current) => [...current, page]);
    setExpandedModules((current) => ({ ...current, [category]: true }));
    setCategoryFilter("全部");
    setSelectedId(page.id);
    showToast("已新建大模块");
  }

  function createChildDoc(category = selectedDoc.category) {
    const name = window.prompt("输入子页面名称", "新页面");
    const title = name?.trim();
    if (!title) return;

    const baseRoute = moduleRootRoute(category, localeDocs);
    const page: DocPage = {
      id: createId("doc"),
      title,
      route: `${normalizeRoute(baseRoute)}/${routeSegment(title)}`,
      category,
      status: "Draft",
      owner: selectedDoc.owner,
      updatedAt: today(),
      version: "0.1",
      readingTime: 2,
      summary: `补充“${title}”页面的用途、适用对象和主要内容。`,
      tags: [category, title],
      contentHtml:
        "<h2>概览</h2><p>在这里直接编写正文内容。</p><h2>操作流程</h2><ol><li><p>补充第一步。</p></li><li><p>补充第二步。</p></li></ol>",
      sections: [],
    };

    setDocs((current) => [...current, page]);
    setExpandedModules((current) => ({ ...current, [category]: true }));
    setSelectedId(page.id);
    showToast("已新建子页面");
  }

  function createNewDoc() {
    createChildDoc(selectedDoc.category);
  }

  function moveDocWithinModule(docId: string, direction: -1 | 1) {
    setDocs((current) => {
      const doc = current.find((item) => item.id === docId);
      if (!doc) return current;

      const docLocale = routeLocale(doc.route);
      const moduleDocs = current.filter(
        (item) => item.category === doc.category && routeLocale(item.route) === docLocale
      );
      const moduleIndex = moduleDocs.findIndex((item) => item.id === docId);
      const targetModuleIndex = moduleIndex + direction;

      if (moduleIndex < 0 || targetModuleIndex < 0 || targetModuleIndex >= moduleDocs.length) {
        return current;
      }

      const targetId = moduleDocs[targetModuleIndex].id;
      const next = [...current];
      const fromIndex = next.findIndex((item) => item.id === docId);
      const toIndex = next.findIndex((item) => item.id === targetId);
      [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
      return next;
    });

    updatePublishConfig({ scope: "all" });
    showToast(direction < 0 ? "已上移；发布后线上生效" : "已下移；发布后线上生效");
  }

  function toggleModule(category: string) {
    setExpandedModules((current) => ({
      ...current,
      [category]: !(current[category] ?? true),
    }));
  }

  function renameModule(category: string) {
    const nextName = window.prompt("输入新的大模块名称", category)?.trim();
    if (!nextName || nextName === category) return;

    const hasSameName = localeDocs.some((doc) => doc.category === nextName);
    if (hasSameName) {
      showToast("已存在同名大模块", "warn");
      return;
    }

    setDocs((current) =>
      current.map((doc) =>
        doc.category === category && routeLocale(doc.route) === editorLocale
          ? {
              ...doc,
              category: nextName,
              tags: doc.tags.map((tag) => (tag === category ? nextName : tag)),
              status: markEditingStatus(doc),
              updatedAt: today(),
            }
          : doc
      )
    );
    setExpandedModules((current) => {
      const next = { ...current, [nextName]: current[category] ?? true };
      delete next[category];
      return next;
    });
    if (categoryFilter === category) {
      setCategoryFilter(nextName);
    }
    showToast("已重命名大模块；发布后线上生效");
  }

  function deleteDoc(doc: DocPage) {
    if (docs.length <= 1) {
      showToast("至少保留一篇文档", "warn");
      return;
    }

    const confirmed = window.confirm(`确定删除“${doc.title}”吗？删除后请发布到服务器完成同步。`);
    if (!confirmed) return;

    const nextDocs = docs.filter((item) => item.id !== doc.id);
    setDocs(nextDocs);
    setHasPendingDeletions(true);
    updatePublishConfig({ scope: "all" });
    if (selectedDoc.id === doc.id) {
      setSelectedId(docsForLocale(nextDocs, editorLocale)[0]?.id ?? nextDocs[0].id);
    }
    showToast("已删除子页面；请发布整套文档完成同步");
  }

  function deleteModule(category: string) {
    const moduleDocs = localeDocs.filter((doc) => doc.category === category);

    if (moduleDocs.length === docs.length) {
      showToast("至少保留一个模块", "warn");
      return;
    }

    const confirmed = window.confirm(
      `确定删除“${category}”模块及其 ${moduleDocs.length} 个页面吗？删除后请发布到服务器完成同步。`
    );
    if (!confirmed) return;

    const nextDocs = docs.filter(
      (doc) => !(doc.category === category && routeLocale(doc.route) === editorLocale)
    );
    setDocs(nextDocs);
    setHasPendingDeletions(true);
    updatePublishConfig({ scope: "all" });
    setExpandedModules((current) => {
      const next = { ...current };
      delete next[category];
      return next;
    });
    if (selectedDoc.category === category) {
      setSelectedId(docsForLocale(nextDocs, editorLocale)[0]?.id ?? nextDocs[0].id);
    }
    showToast("已删除模块；请发布整套文档完成同步");
  }

  function resetDocs() {
    const fresh = cloneDocs(initialEditorDocs);
    setDocs(fresh);
    setSelectedId(fresh[0].id);
    showToast("已恢复初始文档库");
  }

  function exportAll() {
    downloadFile(
      "polytron-docs-publish-pack.json",
      JSON.stringify(
        docs.map((doc) => ({
          ...doc,
          contentHtml: docToEditorHtml(doc),
          sections: dedupeDocSections(doc.sections, {
            dropMediaSections: Boolean(doc.contentHtml?.trim()),
          }),
        })),
        null,
        2
      ),
      "application/json;charset=utf-8"
    );
    showToast("发布包已导出");
  }

  function exportCurrentMarkdown() {
    downloadFile(
      `${selectedDoc.id}.md`,
      toMarkdown(selectedDoc),
      "text/markdown;charset=utf-8"
    );
    showToast("Markdown 已导出");
  }

  function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as DocPage[];
        if (!Array.isArray(parsed) || !parsed.length) throw new Error("Invalid file");
        const importedDocs = initialDocsForEditor(parsed).map(cleanDoc);
        setDocs(importedDocs);
        setSelectedId(docsForLocale(importedDocs, editorLocale)[0]?.id ?? importedDocs[0].id);
        showToast("文档库已导入");
      } catch {
        showToast("导入文件不可用", "warn");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  if (!selectedDoc) return null;

  return (
    <div className="app-shell notion-editor">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">
            <Layers size={20} />
          </div>
          <div>
            <h1>POLYTRON 文档编辑器</h1>
            <p>{selectedDoc.route}</p>
          </div>
        </div>
        <div className="topbar-actions">
          <label className="language-select editor-language-select">
            <Globe2 size={16} />
            <select
              value={editorLocale}
              onChange={(event) => switchEditorLocale(event.target.value as DocLocale)}
            >
              {docLocales.map((locale) => (
                <option key={locale.code} value={locale.code}>
                  {locale.label}
                </option>
              ))}
            </select>
          </label>
          <button className="ghost-button" onClick={saveDraft}>
            <Save size={16} />
            保存
          </button>
          <button className="ghost-button" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} />
            导入
          </button>
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            onChange={importJson}
          />
          <button className="ghost-button" onClick={exportAll}>
            <Download size={16} />
            发布包
          </button>
          <button className="ghost-button" onClick={exportCurrentMarkdown}>
            <FileText size={16} />
            Markdown
          </button>
          <button className="ghost-button" onClick={() => setIsPreviewOpen(true)}>
            <Eye size={16} />
            预览
          </button>
          <button className="primary-button" disabled={isPublishing} onClick={publishToServer}>
            <Send size={16} />
            {isPublishing ? "发布中" : "发布到服务器"}
          </button>
          {authToken && (
            <button className="secondary-button" onClick={onLogout}>
              <LogOut size={16} />
              退出
            </button>
          )}
        </div>
      </header>

      <main className="workspace rich-layout">
        <aside className="sidebar">
          <div className="search-box">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索文档"
            />
          </div>

          <div className="stat-grid" aria-label="文档状态">
            <div>
              <strong>{stats.total}</strong>
              <span>全部</span>
            </div>
            <div>
              <strong>{stats.published}</strong>
              <span>已发布</span>
            </div>
            <div>
              <strong>{stats.review}</strong>
              <span>待审核</span>
            </div>
            <div>
              <strong>{stats.draft}</strong>
              <span>草稿</span>
            </div>
          </div>

          <div className="module-create-actions">
            <button className="wide-action" onClick={createModule}>
              <FolderPlus size={16} />
              新建大模块
            </button>
            <button className="wide-action subtle" onClick={createNewDoc}>
              <FilePlus2 size={16} />
              新建子页面
            </button>
          </div>

          <div className="filter-block">
            <div className="filter-title">
              <ListFilter size={15} />
              状态
            </div>
            <div className="segmented">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  className={statusFilter === status ? "active" : ""}
                  onClick={() => setStatusFilter(status)}
                >
                  {statusFilterLabels[status]}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-block">
            <div className="filter-title">
              <BookOpen size={15} />
              分组
            </div>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option>全部</option>
              {editorCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>

          <nav className="doc-tree" aria-label="文档目录">
            {groupedDocs.map((group) => (
              <section key={group.category} className="tree-group">
                <div className="module-row">
                  <button className="module-toggle" onClick={() => toggleModule(group.category)}>
                    {(expandedModules[group.category] ?? true) ? (
                      <ChevronDown size={15} />
                    ) : (
                      <ChevronRight size={15} />
                    )}
                    <span>{group.category}</span>
                    <small>{group.docs.length}</small>
                  </button>
                  <button
                    className="module-add"
                    title="添加子页面"
                    onClick={() => createChildDoc(group.category)}
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    className="module-edit"
                    title="重命名大模块"
                    aria-label={`重命名${group.category}模块`}
                    onClick={() => renameModule(group.category)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="module-delete"
                    title="删除模块"
                    aria-label={`删除${group.category}模块`}
                    onClick={() => deleteModule(group.category)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {(expandedModules[group.category] ?? true) && (
                  <div className="tree-children">
                    {group.docs.map((doc, index) => (
                      <div
                        key={doc.id}
                        className={`tree-item ${selectedDoc.id === doc.id ? "selected" : ""}`}
                      >
                        <button className="tree-item-main" onClick={() => setSelectedId(doc.id)}>
                          <span>
                            <strong>{doc.title}</strong>
                            <small>{doc.route}</small>
                          </span>
                          <StatusBadge status={doc.status} />
                        </button>
                        <div className="tree-order-actions" aria-label={`${doc.title}排序`}>
                          <button
                            className="tree-reorder"
                            title="上移"
                            aria-label={`上移${doc.title}`}
                            disabled={index === 0}
                            onClick={() => moveDocWithinModule(doc.id, -1)}
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            className="tree-reorder"
                            title="下移"
                            aria-label={`下移${doc.title}`}
                            disabled={index === group.docs.length - 1}
                            onClick={() => moveDocWithinModule(doc.id, 1)}
                          >
                            <ArrowDown size={13} />
                          </button>
                        </div>
                        <button
                          className="tree-delete"
                          title="删除子页面"
                          aria-label={`删除${doc.title}`}
                          onClick={() => deleteDoc(doc)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </nav>
        </aside>

        <section className="editor-panel rich-editor-panel">
          <div className="editor-headline">
            <input
              className="title-editor"
              value={selectedDoc.title}
              onChange={(event) => handleTitleChange(event.target.value)}
            />
            <textarea
              className="summary-editor"
              value={selectedDoc.summary}
              onChange={(event) => handleSummaryChange(event.target.value)}
            />
            <div className="doc-strip">
              <StatusBadge status={selectedDoc.status} />
              <span>{localeLabels[editorLocale]}</span>
              <span>{selectedDoc.category}</span>
              <span>{selectedDoc.updatedAt}</span>
              <span>v{selectedDoc.version}</span>
            </div>
          </div>

          <RichTextCanvas
            key={selectedDoc.id}
            content={docToEditorHtml(selectedDoc, { preserveUploadPreviewUrls: true })}
            docs={localeDocs}
            isMediaDragging={isMediaDragging}
            isUploadingMedia={isUploadingMedia}
            onChange={handleBodyChange}
            onImageOpen={setLightboxImage}
            onMediaDragChange={setIsMediaDragging}
            onMediaDrop={uploadDroppedMedia}
            onReady={(editor) => {
              editorRef.current = editor;
            }}
          />
        </section>

        <aside className="right-panel inspector-panel">
          <section className="publish-panel">
            <div className="panel-title">
              <CheckCircle2 size={16} />
              发布检查
            </div>
            <div className="readiness">
              <strong>{score}%</strong>
              <div>
                <span>完成度</span>
                <progress max="100" value={score} />
              </div>
            </div>
            <div className="checklist">
              {checklist.map((item) => (
                <div className="check-row" key={item.label}>
                  {item.ok ? (
                    <CheckCircle2 size={16} className="ok" />
                  ) : (
                    <CircleDashed size={16} className="pending" />
                  )}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          {navigationCardSection && (
            <NavigationCardsPanel
              section={navigationCardSection}
              sourceDoc={selectedDoc}
              docs={localeDocs}
              onChange={handleNavigationCardsChange}
            />
          )}

          <MediaManagerPanel
            assets={videoAssets}
            draft={mediaDrafts.video}
            helper="支持 mp4、webm 或可播放的视频地址；添加后可一键插入到正文当前位置。"
            icon={<Video size={16} />}
            kind="video"
            title="演示视频"
            onAdd={() => addMediaAsset("video")}
            onDraftChange={(patch) => updateMediaDraft("video", patch)}
            onInsert={insertMediaAsset}
            onRemove={removeMediaAsset}
          />

          <MediaManagerPanel
            assets={imageAssets}
            draft={mediaDrafts.image}
            icon={<ImagePlus size={16} />}
            kind="image"
            title="界面示例"
            onAdd={() => addMediaAsset("image")}
            onDraftChange={(patch) => updateMediaDraft("image", patch)}
            onInsert={insertMediaAsset}
            onRemove={removeMediaAsset}
          />

          <section className="settings-panel">
            <div className="panel-title">
              <FileText size={16} />
              文档属性
            </div>
            <div className="settings-form">
              <label>
                路径
                <input
                  value={selectedDoc.route}
                  onChange={(event) =>
                    updateCurrentDoc((doc) => ({
                      ...doc,
                      route: routeForLocale(event.target.value, editorLocale),
                      status: markEditingStatus(doc),
                      updatedAt: today(),
                    }))
                  }
                />
              </label>
              <label>
                分组
                <select
                  value={selectedDoc.category}
                  onChange={(event) =>
                    updateCurrentDoc((doc) => ({
                      ...doc,
                      category: event.target.value,
                      status: markEditingStatus(doc),
                      updatedAt: today(),
                    }))
                  }
                >
                  {editorCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label>
                状态
                <select
                  value={selectedDoc.status}
                  onChange={(event) =>
                    updateDoc({ status: event.target.value as DocStatus })
                  }
                >
                  <option value="Draft">草稿</option>
                  <option value="Review">待审核</option>
                  <option value="Published">已发布</option>
                </select>
              </label>
              <label>
                负责人
                <input
                  value={selectedDoc.owner}
                  onChange={(event) => updateDoc({ owner: event.target.value })}
                />
              </label>
              <label>
                标签
                <input
                  value={selectedDoc.tags.join("，")}
                  onChange={(event) => handleTags(event.target.value)}
                />
              </label>
            </div>
            <div className="inspector-actions">
              <button className="secondary-button" onClick={saveDraft}>
                <Save size={16} />
                保存
              </button>
              <button className="secondary-button" onClick={duplicateDoc}>
                <Copy size={16} />
                复制
              </button>
              <button className="icon-button" title="恢复初始文档库" onClick={resetDocs}>
                <RefreshCw size={17} />
              </button>
            </div>
          </section>

          <section className="settings-panel server-panel">
            <div className="panel-title">
              <Server size={16} />
              服务器发布
            </div>
            <div
              className={`publish-connection ${
                isPublishBackendConnected ? "connected" : isUsingLocalPublish ? "local" : "custom"
              }`}
            >
              <Globe2 size={16} />
              <div>
                <strong>{publishConnectionTitle}</strong>
                <span>{publishConnectionMessage}</span>
              </div>
            </div>
            <div className="settings-form">
              <div className="field-block">
                <span>发布接收地址</span>
                <div className="endpoint-row">
                  <input
                    value={publishConfig.endpoint}
                    placeholder="http://127.0.0.1:8787/api/publish-docs"
                    onChange={(event) => updatePublishConfig({ endpoint: event.target.value })}
                  />
                  <button
                    className="icon-button"
                    title="恢复本机发布地址"
                    type="button"
                    onClick={() => updatePublishConfig({ endpoint: getDefaultPublishEndpoint() })}
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                <p className="field-note">
                  {isUsingLocalPublish
                    ? "本机调试时使用本机发布服务；线上编辑器会自动改用线上 API。"
                    : "保持默认即可；线上编辑器会写回 GitHub，并触发 Vercel 更新。"}
                </p>
              </div>
              <label>
                访问令牌
                <input
                  type="password"
                  value={publishConfig.token}
                  placeholder="可选，服务器需要时填写"
                  onChange={(event) => updatePublishConfig({ token: event.target.value })}
                />
              </label>
              <label>
                发布范围
                <input value="整套文档（始终同步编辑器全部内容）" readOnly />
              </label>
              <p className="server-hint">
                {isPublishBackendConnected
                  ? "发布后需要等待 Vercel 完成构建，官网才会看到最新版本。"
                  : "要更新线上文档，需要在 Vercel 项目里新增发布接口，或创建 Deploy Hook 并让线上项目读取最新文档源。"}
              </p>
            </div>
          </section>

          <section className="queue-panel">
            <div className="panel-title">
              <CircleDashed size={16} />
              待处理
            </div>
            <div className="queue-list">
              {relatedQueue.map((doc) => (
                <button key={doc.id} onClick={() => setSelectedId(doc.id)}>
                  <span>
                    <strong>{doc.title}</strong>
                    <small>
                      {readiness(doc)}% · {doc.route}
                    </small>
                  </span>
                  <StatusBadge status={doc.status} />
                </button>
              ))}
              {!relatedQueue.length && <p className="empty-copy">暂无待处理文档</p>}
            </div>
          </section>
        </aside>
      </main>

      {isPreviewOpen && (
        <PreviewDialog
          doc={selectedDoc}
          docs={localeDocs}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      {lightboxImage && (
        <ImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}

      {uploadLimitDialog && (
        <UploadLimitDialog
          dialog={uploadLimitDialog}
          onClose={() => setUploadLimitDialog(null)}
        />
      )}

      {toast && <div className={`toast ${toast.tone}`}>{toast.text}</div>}
    </div>
  );
}

function NavigationCardsPanel({
  section,
  sourceDoc,
  docs,
  onChange,
}: {
  section: NavigationCardSection;
  sourceDoc: DocPage;
  docs: DocPage[];
  onChange: (cards: NavigationCard[]) => void;
}) {
  const excludedRouteBases = new Set(
    NODE_NAV_EXCLUDED_ROUTE_BASES_BY_DOC_ID[sourceDoc.id] ?? []
  );
  const targetDocs = docs.filter(
    (doc) =>
      doc.id !== sourceDoc.id && !excludedRouteBases.has(routeBase(doc.route))
  );
  const unusedTarget = targetDocs.find(
    (doc) =>
      !section.cards.some(
        (card) => normalizeRoute(card.route) === normalizeRoute(doc.route)
      )
  );

  function patchCard(cardId: string, patch: Partial<NavigationCard>) {
    onChange(
      section.cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card))
    );
  }

  function changeCardTarget(card: NavigationCard, nextRoute: string) {
    const previousTarget = docs.find(
      (doc) => normalizeRoute(doc.route) === normalizeRoute(card.route)
    );
    const nextTarget = docs.find(
      (doc) => normalizeRoute(doc.route) === normalizeRoute(nextRoute)
    );
    if (!nextTarget) return;

    patchCard(card.id, {
      route: nextTarget.route,
      title:
        !card.title.trim() || card.title === previousTarget?.title
          ? nextTarget.title
          : card.title,
      description:
        !card.description.trim() || card.description === previousTarget?.summary
          ? nextTarget.summary
          : card.description,
    });
  }

  function addCard() {
    if (!unusedTarget) return;
    onChange([
      ...section.cards,
      {
        id: createId("nav-card"),
        title: unusedTarget.title,
        description: unusedTarget.summary,
        route: unusedTarget.route,
        image: "",
      },
    ]);
  }

  function moveCard(index: number, offset: -1 | 1) {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= section.cards.length) return;
    const nextCards = [...section.cards];
    [nextCards[index], nextCards[nextIndex]] = [nextCards[nextIndex], nextCards[index]];
    onChange(nextCards);
  }

  return (
    <section className="navigation-card-panel">
      <div className="panel-title">
        <Layers size={16} />
        跳转卡片
        <span className="navigation-card-count">{section.cards.length}</span>
      </div>
      <p className="navigation-card-helper">
        管理“{section.heading}”中的卡片。保存或发布时会同步到公开文档。
      </p>
      <div className="navigation-card-list">
        {section.cards.map((card, index) => {
          const imageUrl = navigationCardImageUrl(sourceDoc, card, docs);
          return (
            <article className="navigation-card-editor" key={card.id}>
              <div className="navigation-card-editor-head">
                <span className="navigation-card-thumbnail">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" />
                  ) : (
                    <ImagePlus size={17} />
                  )}
                </span>
                <strong>卡片 {index + 1}</strong>
                <div className="navigation-card-actions">
                  <button
                    type="button"
                    title="上移"
                    disabled={index === 0}
                    onClick={() => moveCard(index, -1)}
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    title="下移"
                    disabled={index === section.cards.length - 1}
                    onClick={() => moveCard(index, 1)}
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    type="button"
                    title="删除卡片"
                    onClick={() =>
                      onChange(section.cards.filter((item) => item.id !== card.id))
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <label>
                跳转页面
                <select
                  value={card.route}
                  onChange={(event) => changeCardTarget(card, event.target.value)}
                >
                  {targetDocs.map((doc) => (
                    <option key={doc.id} value={doc.route}>
                      {doc.category} · {doc.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                标题
                <input
                  value={card.title}
                  onChange={(event) => patchCard(card.id, { title: event.target.value })}
                />
              </label>
              <label>
                描述
                <textarea
                  rows={3}
                  value={card.description}
                  onChange={(event) =>
                    patchCard(card.id, { description: event.target.value })
                  }
                />
              </label>
              <label>
                图片地址
                <input
                  value={card.image}
                  placeholder="留空时自动使用目标页面图片"
                  onChange={(event) => patchCard(card.id, { image: event.target.value })}
                />
              </label>
            </article>
          );
        })}
        {!section.cards.length && (
          <p className="navigation-card-empty">当前没有卡片，可从其他页面新增。</p>
        )}
      </div>
      <button
        className="navigation-card-add"
        type="button"
        disabled={!unusedTarget}
        onClick={addCard}
      >
        <Plus size={14} />
        新增卡片
      </button>
    </section>
  );
}

function normalizeRoute(route: string) {
  if (!route || route === "/") return "/docs";
  return route.replace(/\/+$/, "") || "/docs";
}

function isDocsRoute(pathname: string) {
  const normalizedPath = normalizeRoute(pathname);
  return (
    normalizedPath === "/docs" ||
    normalizedPath.startsWith("/docs/") ||
    normalizedPath === "/zh/docs" ||
    normalizedPath.startsWith("/zh/docs/") ||
    normalizedPath === "/en/docs" ||
    normalizedPath.startsWith("/en/docs/")
  );
}

function docForPath(pathname: string, docs: DocPage[], locale: DocLocale) {
  const normalizedPath = normalizeRoute(pathname);
  const localizedPath = routeForLocale(normalizedPath, locale);
  const basePath = routeBase(normalizedPath);
  return (
    docs.find((doc) => normalizeRoute(doc.route) === localizedPath) ??
    docs.find((doc) => routeBase(doc.route) === basePath) ??
    docs.find((doc) => normalizeRoute(doc.route) === routeForLocale("/docs", locale)) ??
    docs[0]
  );
}

function isDocsHomePath(pathname: string) {
  const normalized = normalizeRoute(pathname);
  return (
    normalized === "/docs" ||
    normalized === "/zh/docs" ||
    normalized === "/en/docs" ||
    normalized === "/docs/v1" ||
    normalized === "/zh/docs/v1" ||
    normalized === "/en/docs/v1"
  );
}

const NODE_NAV_HEADING_PATTERNS: Record<DocLocale, RegExp> = {
  zh: /快速导览|快速指南|功能导航|相关页面|继续阅读/,
  en: /Quick Guide|Quick Navigation|Feature Navigation|Related Pages|Continue Reading/i,
};

const NODE_NAV_EXCLUDED_ROUTE_BASES_BY_DOC_ID: Record<string, string[]> = {
  overview: ["/docs/home", "/docs/alarm-trigger"],
  "en-overview": ["/docs/home", "/docs/alarm-trigger"],
};

const NODE_NAV_CARD_IMAGES_BY_DOC_ID: Record<string, Record<string, string>> = {
  overview: {
    "/docs/auth": "/media/polytron-one/navigation/overview-login.png",
    "/docs/live-view": "/media/polytron-one/navigation/overview-live-view.png",
    "/docs/playback": "/media/polytron-one/navigation/overview-playback.png",
    "/docs/cameras": "/media/polytron-one/navigation/overview-cameras.png",
    "/docs/notifications": "/media/polytron-one/navigation/overview-notifications.png",
    "/docs/settings": "/media/polytron-one/navigation/overview-settings.png",
  },
  "en-overview": {
    "/docs/auth": "/media/polytron-one/navigation/overview-login.png",
    "/docs/live-view": "/media/polytron-one/navigation/overview-live-view.png",
    "/docs/playback": "/media/polytron-one/navigation/overview-playback.png",
    "/docs/cameras": "/media/polytron-one/navigation/overview-cameras.png",
    "/docs/notifications": "/media/polytron-one/navigation/overview-notifications.png",
    "/docs/settings": "/media/polytron-one/navigation/overview-settings.png",
  },
};

function compactNodeCardDescription(value: string, fallback: string, locale: DocLocale) {
  const normalized = (value || fallback).replace(/^[：:·\-—\s]+/, "").replace(/\s+/g, " ").trim();
  const limit = locale === "en" ? 112 : 76;
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 1).replace(/[，、；：,;:\s]+$/, "")}…`;
}

function firstExistingDocImage(doc: DocPage) {
  if (doc.coverImage?.trim()) return doc.coverImage.trim();

  const mediaImage = doc.mediaAssets?.find(
    (asset) => asset.type === "image" && asset.url?.trim()
  )?.url;
  if (mediaImage) return mediaImage;

  const content = document.createElement("template");
  content.innerHTML = docToEditorHtml(doc);
  return content.content.querySelector("img[src]")?.getAttribute("src")?.trim() ?? "";
}

function internalDocRoute(href: string, locale: DocLocale) {
  try {
    const url = new URL(href, window.location.origin);
    const isKnownDocsHost =
      url.origin === window.location.origin || url.hostname === "polytron-doc.vercel.app";
    if (!isKnownDocsHost || !isDocsRoute(url.pathname)) return "";
    return routeForLocale(url.pathname, locale);
  } catch {
    return "";
  }
}

function navigationListsAfterHeading(heading: Element) {
  const lists: Element[] = [];
  let sibling = heading.nextElementSibling;
  while (sibling?.tagName === "UL") {
    lists.push(sibling);
    sibling = sibling.nextElementSibling;
  }
  return lists;
}

function navigationHeadingInTemplate(template: HTMLTemplateElement, locale: DocLocale) {
  const headingPattern = NODE_NAV_HEADING_PATTERNS[locale];
  return Array.from(template.content.querySelectorAll("h2")).find((heading) => {
    const headingText = heading.textContent?.replace(/\s+/g, " ").trim() ?? "";
    return headingPattern.test(headingText);
  });
}

function navigationCardSectionForDoc(
  doc: DocPage,
  docs: DocPage[]
): NavigationCardSection | null {
  const locale = routeLocale(doc.route);
  const template = document.createElement("template");
  template.innerHTML = docToEditorHtml(doc, { preserveUploadPreviewUrls: true });
  const heading = navigationHeadingInTemplate(template, locale);
  if (!heading) return null;

  const lists = navigationListsAfterHeading(heading);
  if (!lists.length) return null;

  const excludedRouteBases = new Set(
    NODE_NAV_EXCLUDED_ROUTE_BASES_BY_DOC_ID[doc.id] ?? []
  );
  const cards: NavigationCard[] = [];

  lists.forEach((list) => {
    list.querySelectorAll(":scope > li").forEach((item) => {
      const sourceAnchor = item.querySelector("a[href]");
      const route = internalDocRoute(sourceAnchor?.getAttribute("href") ?? "", locale);
      const targetDoc = docs.find(
        (candidate) => normalizeRoute(candidate.route) === normalizeRoute(route)
      );
      if (
        !sourceAnchor ||
        !route ||
        !targetDoc ||
        excludedRouteBases.has(routeBase(route))
      ) {
        return;
      }

      const descriptionSource = item.cloneNode(true) as Element;
      descriptionSource.querySelector("a")?.remove();
      const description =
        descriptionSource.textContent
          ?.replace(/^[：:·\-—\s]+/, "")
          .replace(/\s+/g, " ")
          .trim() || targetDoc.summary;

      cards.push({
        id:
          sourceAnchor.getAttribute("data-card-id")?.trim() ||
          `${doc.id}-navigation-${cards.length + 1}`,
        title:
          sourceAnchor.textContent?.replace(/\s+/g, " ").trim() || targetDoc.title,
        description,
        route,
        image: sourceAnchor.getAttribute("data-card-image")?.trim() ?? "",
      });
    });
  });

  return {
    heading: heading.textContent?.replace(/\s+/g, " ").trim() ?? "",
    cards,
  };
}

function writeNavigationCardsHtml(
  html: string,
  doc: DocPage,
  cards: NavigationCard[]
) {
  const locale = routeLocale(doc.route);
  const template = document.createElement("template");
  template.innerHTML = html;
  const heading = navigationHeadingInTemplate(template, locale);
  if (!heading) return html;

  const lists = navigationListsAfterHeading(heading);
  const list = document.createElement("ul");
  list.setAttribute("data-navigation-cards", "true");

  cards.forEach((card) => {
    const item = document.createElement("li");
    const paragraph = document.createElement("p");
    const anchor = document.createElement("a");
    anchor.href = routeForLocale(card.route, locale);
    anchor.textContent = card.title.trim() || card.route;
    anchor.setAttribute("data-card-id", card.id || createId("nav-card"));
    if (card.image.trim()) {
      anchor.setAttribute("data-card-image", card.image.trim());
    }
    paragraph.appendChild(anchor);
    if (card.description.trim()) {
      paragraph.appendChild(
        document.createTextNode(
          `${locale === "en" ? " — " : "："}${card.description.trim()}`
        )
      );
    }
    item.appendChild(paragraph);
    list.appendChild(item);
  });

  if (lists.length) {
    lists[0].replaceWith(list);
    lists.slice(1).forEach((existingList) => existingList.remove());
  } else {
    heading.insertAdjacentElement("afterend", list);
  }

  return template.innerHTML;
}

function navigationCardImageUrl(
  sourceDoc: DocPage,
  card: NavigationCard,
  docs: DocPage[]
) {
  if (card.image.trim()) return card.image.trim();
  const mappedImage =
    NODE_NAV_CARD_IMAGES_BY_DOC_ID[sourceDoc.id]?.[routeBase(card.route)];
  if (mappedImage) return mappedImage;
  const targetDoc = docs.find(
    (candidate) => normalizeRoute(candidate.route) === normalizeRoute(card.route)
  );
  return targetDoc ? firstExistingDocImage(targetDoc) : "";
}

function enhanceNodeNavigation(
  template: HTMLTemplateElement,
  doc: DocPage,
  docs: DocPage[]
) {
  const locale = routeLocale(doc.route);
  const headingPattern = NODE_NAV_HEADING_PATTERNS[locale];
  const isEnglish = locale === "en";
  const excludedRouteBases = new Set(
    NODE_NAV_EXCLUDED_ROUTE_BASES_BY_DOC_ID[doc.id] ?? []
  );
  const cardImagesByRouteBase = NODE_NAV_CARD_IMAGES_BY_DOC_ID[doc.id] ?? {};

  template.content.querySelectorAll("h2").forEach((heading) => {
    const headingText = heading.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (!headingPattern.test(headingText)) return;

    const lists = navigationListsAfterHeading(heading);
    if (!lists.length) return;

    const cards = lists.flatMap((list) =>
      Array.from(list.querySelectorAll(":scope > li")).flatMap((item) => {
        const sourceAnchor = item.querySelector("a[href]");
        const sourceHref = sourceAnchor?.getAttribute("href") ?? "";
        const route = internalDocRoute(sourceHref, locale);
        const targetDoc = docs.find((candidate) => normalizeRoute(candidate.route) === route);
        if (
          !sourceAnchor ||
          !route ||
          !targetDoc ||
          excludedRouteBases.has(routeBase(route))
        ) return [];

        const title = sourceAnchor.textContent?.replace(/\s+/g, " ").trim() || targetDoc.title;
        const descriptionSource = item.cloneNode(true) as Element;
        descriptionSource.querySelector("a")?.remove();
        const description = compactNodeCardDescription(
          descriptionSource.textContent ?? "",
          targetDoc.summary,
          locale
        );

        const image = sourceAnchor.getAttribute("data-card-image")?.trim() ?? "";

        return [{ route, targetDoc, title, description, image }];
      })
    );
    if (!cards.length) return;

    const grid = document.createElement("div");
    grid.className = "docs-node-card-grid";
    grid.setAttribute("aria-label", isEnglish ? `${headingText} page navigation` : `${headingText}页面导航`);

    cards.forEach(({ route, targetDoc, title, description, image: managedImage }) => {
      const card = document.createElement("a");
      card.className = "docs-node-card";
      card.href = route;

      const imageUrl =
        managedImage ||
        cardImagesByRouteBase[routeBase(route)] ||
        firstExistingDocImage(targetDoc);
      if (imageUrl) {
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = isEnglish ? `${title} interface screenshot` : `${title}界面截图`;
        image.loading = "lazy";
        image.decoding = "async";
        card.appendChild(image);
      } else {
        const placeholder = document.createElement("span");
        placeholder.className = "docs-node-card-placeholder";
        placeholder.textContent = isEnglish ? "Interface screenshot to be added" : "待补充界面截图";
        card.appendChild(placeholder);
      }

      const overlay = document.createElement("span");
      overlay.className = "docs-node-card-copy";
      const cardTitle = document.createElement("strong");
      cardTitle.textContent = title;
      const cardDescription = document.createElement("span");
      cardDescription.textContent = description;
      overlay.append(cardTitle, cardDescription);
      card.appendChild(overlay);
      grid.appendChild(card);
    });

    lists[0].replaceWith(grid);
    lists.slice(1).forEach((list) => list.remove());
  });
}

function docContentWithAnchors(doc: DocPage, docs: DocPage[]) {
  const html = docToEditorHtml(doc);
  const template = document.createElement("template");
  template.innerHTML = html;
  enhanceNodeNavigation(template, doc, docs);
  const tocItems: Array<{ id: string; heading: string }> = [];

  template.content.querySelectorAll("h2").forEach((heading, index) => {
    const headingText = heading.textContent?.replace(/\s+/g, " ").trim();
    if (!headingText) return;

    const id = heading.id || `section-${index + 1}`;
    heading.id = id;
    tocItems.push({ id, heading: headingText });
  });

  return {
    html: template.innerHTML,
    tocItems,
  };
}

type SupplementalTocItem = {
  id: string;
  heading: string;
};

const supplementalTocByDocId: Record<string, SupplementalTocItem[]> = {
  overview: [
    { id: "platform-landscape", heading: "平台能力全景" },
    { id: "core-workflow", heading: "核心业务闭环" },
    { id: "reading-paths", heading: "按角色开始使用" },
  ],
  "en-overview": [
    { id: "platform-landscape", heading: "Platform Capability Landscape" },
    { id: "core-workflow", heading: "Core Business Loop" },
    { id: "reading-paths", heading: "Start by Role" },
  ],
  "alarm-trigger": [{ id: "alarm-lifecycle", heading: "警报处理状态流" }],
  "en-alarm-trigger": [{ id: "alarm-lifecycle", heading: "Alarm Handling State Flow" }],
  "alarm-trigger-video-clip": [{ id: "alarm-detail-anatomy", heading: "警报详情解剖图" }],
  "en-alarm-trigger-video-clip": [{ id: "alarm-detail-anatomy", heading: "Alarm Detail Anatomy" }],
  cameras: [{ id: "camera-onboarding", heading: "相机接入与启用流程" }],
  "en-cameras": [{ id: "camera-onboarding", heading: "Camera Onboarding and Activation" }],
  "cameras-camera-management": [{ id: "camera-troubleshooting", heading: "相机异常排查路径" }],
  "en-cameras-camera-management": [{ id: "camera-troubleshooting", heading: "Camera Troubleshooting Path" }],
  "cameras-alarm-settings": [
    { id: "ai-rule-formula", heading: "AI 检测规则构成" },
    { id: "detection-area-guide", heading: "检测区域绘制指南" },
  ],
  "en-cameras-alarm-settings": [
    { id: "ai-rule-formula", heading: "AI Detection Rule Formula" },
    { id: "detection-area-guide", heading: "Detection Area Guide" },
  ],
  "home-overview": [{ id: "dashboard-action-map", heading: "主页指标行动地图" }],
  "en-home-overview": [{ id: "dashboard-action-map", heading: "Dashboard Metric Action Map" }],
  playback: [
    { id: "playback-workflow", heading: "操作流程" },
  ],
  "en-playback": [
    { id: "playback-workflow", heading: "Workflow" },
  ],
  notifications: [{ id: "event-notification-relationship", heading: "事件、警报与通知的关系" }],
  "en-notifications": [{ id: "event-notification-relationship", heading: "Events, Alarms, and Notifications" }],
  settings: [{ id: "permission-matrix", heading: "角色与权限矩阵" }],
  "en-settings": [{ id: "permission-matrix", heading: "Role and Permission Matrix" }],
  "getting-started-checklist": [{ id: "first-use-readiness", heading: "首次使用验收路径" }],
  "en-getting-started-checklist": [{ id: "first-use-readiness", heading: "First-use Acceptance Path" }],
  "system-requirements": [{ id: "compatibility-baseline", heading: "兼容性基线" }],
  "en-system-requirements": [{ id: "compatibility-baseline", heading: "Compatibility Baseline" }],
  "global-troubleshooting": [{ id: "global-troubleshooting-map", heading: "全局排查地图" }],
  "en-global-troubleshooting": [{ id: "global-troubleshooting-map", heading: "Troubleshooting Map" }],
  "alarm-severity-response": [{ id: "severity-response-matrix", heading: "警报等级响应矩阵" }],
  "en-alarm-severity-response": [{ id: "severity-response-matrix", heading: "Alarm Severity Response Matrix" }],
  "status-and-glossary": [{ id: "status-legend", heading: "状态图例" }],
  "en-status-and-glossary": [{ id: "status-legend", heading: "Status Legend" }],
  "playback-export-evidence": [{ id: "evidence-export-workflow", heading: "证据导出工作流" }],
  "en-playback-export-evidence": [{ id: "evidence-export-workflow", heading: "Evidence Export Workflow" }],
  "ui-states": [{ id: "ui-state-guide", heading: "页面状态行动指南" }],
  "en-ui-states": [{ id: "ui-state-guide", heading: "Page-state Action Guide" }],
  "security-retention": [{ id: "security-retention-layers", heading: "安全与保留控制层" }],
  "en-security-retention": [{ id: "security-retention-layers", heading: "Security and Retention Layers" }],
  faq: [{ id: "faq-router", heading: "常见问题快速定位" }],
  "en-faq": [{ id: "faq-router", heading: "FAQ Quick Links" }],
};

function SupplementalArrow() {
  return <span aria-hidden="true" className="supplemental-arrow">→</span>;
}

function OverviewSupplementalVisuals({ isEnglish = false }: { isEnglish?: boolean }) {
  const copy = isEnglish
    ? {
        aria: "POLYTRON ONE product guide diagrams",
        mapKicker: "PRODUCT MAP",
        mapHeading: "Platform Capability Landscape",
        mapIntro: "POLYTRON ONE organizes video ingestion, event handling, evidence, and operational collaboration in one workspace.",
        sourceTitle: "Video sources",
        sourceItems: ["Network cameras", "Existing VMS"],
        coreKicker: "Unified intelligent video foundation",
        capabilities: ["Device management", "Live viewing", "AI detection", "Recording storage", "Alarm center", "Access audit"],
        outputTitle: "Applications and collaboration",
        outputItems: ["Security operations", "Event evidence", "3D / Work orders / Business systems"],
        mapCaption: "Device state, video, detection results, and handling records remain connected in one platform, reducing cross-system lookup and repeated work.",
        workflowKicker: "RECOMMENDED PRACTICE",
        workflowHeading: "Core Business Loop",
        workflowIntro: "Daily operations extend beyond watching video. Detection, verification, response, and traceability form one complete loop.",
        workflow: [
          ["01", "Connect video", "Add and validate cameras"],
          ["02", "Configure rules", "Choose area, schedule, and algorithm"],
          ["03", "Run AI detection", "Continuously analyze live video"],
          ["04", "Create alarm", "Notify the on-duty operator"],
          ["05", "Handle event", "Confirm, comment, or mark false alarm"],
          ["06", "Review and archive", "Retain recordings and audit history"],
        ],
        readingKicker: "READING GUIDE",
        readingHeading: "Start by Role",
        readingIntro: "Choose the shortest path for the role instead of reading every page from the beginning.",
        roles: [
          ["On-duty operator", "Find and handle today's exceptions", "Home inspection → Live View → Notification review → Alarm handling", "/en/docs/home", "Start with Home"],
          ["Investigator", "Reconstruct events and retain evidence", "Notification detail → Alarm clip → Playback → Clip and download", "/en/docs/notifications", "Start with Notifications"],
          ["System administrator", "Connect resources and maintain access", "Camera onboarding → Recording schedule → Detection rules → Users and roles", "/en/docs/cameras", "Start with Cameras"],
        ],
      }
    : {
        aria: "POLYTRON ONE 产品导览图",
        mapKicker: "产品地图",
        mapHeading: "平台能力全景",
        mapIntro: "从视频资源接入到事件处置与业务协同，POLYTRON ONE 将分散的监控能力组织成统一工作台。",
        sourceTitle: "视频资源",
        sourceItems: ["网络摄像机", "现有 VMS"],
        coreKicker: "统一智能视频底座",
        capabilities: ["设备管理", "实时预览", "AI 检测", "录像存储", "警报中心", "权限审计"],
        outputTitle: "应用与协同",
        outputItems: ["安防值守", "事件取证", "3D / 工单 / 业务系统"],
        mapCaption: "设备状态、视频画面、检测结果和处理记录在同一平台内关联，减少跨系统查找与重复操作。",
        workflowKicker: "推荐工作方式",
        workflowHeading: "核心业务闭环",
        workflowIntro: "日常工作不止是查看画面。平台将异常发现、核查、处置和追溯连接成一条完整流程。",
        workflow: [
          ["01", "接入视频", "添加并检查相机"],
          ["02", "配置规则", "选择区域、时间和算法"],
          ["03", "智能检测", "持续分析实时画面"],
          ["04", "触发警报", "通知值班人员核查"],
          ["05", "处置事件", "确认、备注或标记误报"],
          ["06", "回放归档", "保留录像与审计记录"],
        ],
        readingKicker: "阅读指南",
        readingHeading: "按角色开始使用",
        readingIntro: "根据岗位选择最短阅读路径，不需要从头逐页阅读全部文档。",
        roles: [
          ["值班人员", "发现并处理当天异常", "主页巡检 → 实时预览 → 通知核查 → 警报处置", "/zh/docs/home", "从主页开始"],
          ["事件调查人员", "还原经过并保留证据", "通知详情 → 警报片段 → 历史回放 → 裁剪下载", "/zh/docs/notifications", "从通知中心开始"],
          ["系统管理员", "接入资源并维护权限", "相机接入 → 录像计划 → 检测规则 → 用户与角色", "/zh/docs/cameras", "从相机管理开始"],
        ],
      };

  return (
    <section className="docs-supplements" aria-label={copy.aria}>
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{copy.mapKicker}</span>
          <h2 id="platform-landscape">{copy.mapHeading}</h2>
          <p>{copy.mapIntro}</p>
        </div>
        <div className="landscape-diagram" role="img" aria-label={copy.mapHeading}>
          <div className="landscape-column landscape-source">
            <strong>{copy.sourceTitle}</strong>
            {copy.sourceItems.map(item => <span key={item}>{item}</span>)}
            <small>RTSP · ONVIF</small>
          </div>
          <SupplementalArrow />
          <div className="landscape-core">
            <span className="landscape-kicker">{copy.coreKicker}</span>
            <strong>POLYTRON ONE</strong>
            <div className="landscape-capabilities">
              {copy.capabilities.map(item => <span key={item}>{item}</span>)}
            </div>
          </div>
          <SupplementalArrow />
          <div className="landscape-column landscape-output">
            <strong>{copy.outputTitle}</strong>
            {copy.outputItems.map(item => <span key={item}>{item}</span>)}
          </div>
        </div>
        <p className="supplemental-caption">{copy.mapCaption}</p>
      </div>

      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{copy.workflowKicker}</span>
          <h2 id="core-workflow">{copy.workflowHeading}</h2>
          <p>{copy.workflowIntro}</p>
        </div>
        <ol className="workflow-diagram" aria-label={copy.workflowHeading}>
          {copy.workflow.map(([number, title, detail], index) => (
            <li key={number}>
              <span className="workflow-number">{number}</span>
              <strong>{title}</strong>
              <small>{detail}</small>
              {index < 5 && <SupplementalArrow />}
            </li>
          ))}
        </ol>
      </div>

      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{copy.readingKicker}</span>
          <h2 id="reading-paths">{copy.readingHeading}</h2>
          <p>{copy.readingIntro}</p>
        </div>
        <div className="role-paths">
          {copy.roles.map(([label, title, path, href, link]) => (
            <article key={label}>
              <span className="role-label">{label}</span>
              <strong>{title}</strong>
              <p>{path}</p>
              <a href={href}>{link}</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AlarmLifecycleVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const states = isEnglish
    ? [
        ["Alarm created", "The system detects an exception and creates a record"],
        ["Pending verification", "The operator checks the scene and event details"],
        ["Video review", "Review footage before and after the trigger"],
        ["In progress", "Perform the response and add handling notes"],
        ["Close and archive", "Retain the conclusion, evidence, and action history"],
      ]
    : [
        ["新警报", "系统检测到异常并生成记录"],
        ["待确认", "值班人员查看现场与事件信息"],
        ["视频核查", "检查触发前后录像片段"],
        ["处理中", "执行现场处置并添加备注"],
        ["关闭归档", "保存结论、证据和操作记录"],
      ];

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "EVENT MANAGEMENT" : "事件管理"}</span>
          <h2 id="alarm-lifecycle">{isEnglish ? "Alarm Handling State Flow" : "警报处理状态流"}</h2>
          <p>{isEnglish ? "Every alarm needs a clear outcome. Handle verified incidents; mark a false alarm and record the reason when no real risk exists." : "每条警报都应有明确结论。确认真实事件后进入处置；确认无风险时标记误报并记录原因。"}</p>
        </div>
        <ol className="state-flow" aria-label={isEnglish ? "Alarm state flow from creation to archive" : "警报从产生到归档的状态流转"}>
          {states.map(([title, detail], index) => (
            <li key={title}>
              <span>{index + 1}</span>
              <div><strong>{title}</strong><small>{detail}</small></div>
              {index < states.length - 1 && <SupplementalArrow />}
            </li>
          ))}
        </ol>
        <div className="decision-branch">
          <strong>{isEnglish ? "Verification outcome" : "核查结论"}</strong>
          <span><b>{isEnglish ? "Confirmed incident" : "真实事件"}</b> → {isEnglish ? "Set to In progress → Close after response" : "更新为处理中 → 完成处置后关闭"}</span>
          <span><b>{isEnglish ? "False alarm" : "误报事件"}</b> → {isEnglish ? "Mark false alarm → Record reason → Improve the detection rule" : "标记误报 → 填写原因 → 优化检测规则"}</span>
        </div>
      </div>
    </section>
  );
}

function CameraOnboardingVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const steps = isEnglish
    ? [
        ["Add camera", "Enter details manually or discover devices by scan"],
        ["Validate connection", "Confirm network, credentials, and video stream"],
        ["Assign location", "Set name, group, area, and 3D position"],
        ["Recording policy", "Configure schedule and retention requirements"],
        ["AI rules", "Draw areas and set algorithm, threshold, and schedule"],
        ["Enable monitoring", "Verify video and alarms in Live View"],
      ]
    : [
        ["添加相机", "手动填写或扫描发现设备"],
        ["验证连接", "确认网络、凭据与视频流可用"],
        ["归属定位", "设置名称、分组、区域和 3D 点位"],
        ["录像策略", "配置录像排期与保留要求"],
        ["AI 规则", "绘制区域并设置算法、阈值和时间"],
        ["启用监控", "在实时视图验证画面与警报"],
      ];

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "CONFIGURATION PATH" : "配置路径"}</span>
          <h2 id="camera-onboarding">{isEnglish ? "Camera Onboarding and Activation" : "相机接入与启用流程"}</h2>
          <p>{isEnglish ? "Online only confirms connectivity. Recording and AI rule configuration are also required for complete monitoring and traceability." : "“相机在线”只表示连接成功；完成录像与 AI 规则配置后，设备才具备完整的监控和追溯能力。"}</p>
        </div>
        <ol className="onboarding-flow" aria-label={isEnglish ? "Six camera onboarding steps" : "相机接入的六个配置步骤"}>
          {steps.map(([title, detail], index) => (
            <li key={title}>
              <span className="onboarding-index">{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{title}</strong><small>{detail}</small></div>
            </li>
          ))}
        </ol>
        <div className="supplemental-checklist">
          <strong>{isEnglish ? "Pre-launch checks" : "上线前检查"}</strong>
          <span>{isEnglish ? "Video plays" : "画面可播放"}</span><span>{isEnglish ? "Device is online" : "设备状态在线"}</span><span>{isEnglish ? "Recordings follow schedule" : "录像按计划生成"}</span><span>{isEnglish ? "Test event creates an alarm" : "测试事件可触发警报"}</span>
        </div>
      </div>
    </section>
  );
}

function PermissionMatrixVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const rows = isEnglish
    ? [
        ["View Home and authorized cameras", "✓", "✓", "✓"],
        ["Live View and Playback", "✓", "✓", "Authorized only"],
        ["Confirm, comment, and close alarms", "✓", "✓", "—"],
        ["Add cameras and configure detection rules", "✓", "—", "—"],
        ["Manage accounts, roles, and system settings", "✓", "—", "—"],
        ["View and export system logs", "✓", "As required", "—"],
      ]
    : [
        ["查看主页与授权相机", "✓", "✓", "✓"],
        ["实时预览与历史回放", "✓", "✓", "按授权"],
        ["确认、备注和关闭警报", "✓", "✓", "—"],
        ["添加相机与配置检测规则", "✓", "—", "—"],
        ["管理账号、角色和系统参数", "✓", "—", "—"],
        ["查看及导出系统日志", "✓", "按需", "—"],
      ];

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "ACCESS CONTROL" : "访问控制"}</span>
          <h2 id="permission-matrix">{isEnglish ? "Role and Permission Matrix" : "角色与权限矩阵"}</h2>
          <p>{isEnglish ? "This is a recommended least-privilege baseline. Adjust actual access to project duties and camera-resource scope." : "以下为推荐的最小权限基线。实际权限应根据项目职责和相机资源范围进行调整。"}</p>
        </div>
        <div className="matrix-scroll">
          <table className="permission-matrix">
            <thead><tr><th>{isEnglish ? "Capability" : "功能"}</th><th>{isEnglish ? "Administrator" : "管理员"}</th><th>{isEnglish ? "Security operator" : "安保人员"}</th><th>{isEnglish ? "Viewer" : "查看者"}</th></tr></thead>
            <tbody>{rows.map(([name, admin, operator, viewer]) => (
              <tr key={name}><th>{name}</th><td>{admin}</td><td>{operator}</td><td>{viewer}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <p className="supplemental-caption">{isEnglish ? "Configure both feature permission and camera-resource permission so users can see required devices without accessing video beyond their responsibilities." : "建议同时配置“功能权限”和“相机资源权限”，避免用户可以进入页面却看不到设备，或看到超出职责范围的视频资源。"}</p>
      </div>
    </section>
  );
}

function DashboardActionMapVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const metrics = isEnglish
    ? [
        ["Camera availability", "Confirm monitoring coverage", "Availability decreases", "Open Cameras and locate offline devices"],
        ["System resources", "Review CPU, memory, and disk pressure", "Metrics remain high", "Ask operations to inspect services and storage"],
        ["Pending alarms", "Assess the current response workload", "Count keeps increasing", "Open Notifications and handle by severity"],
        ["Recording and storage", "Confirm that recordings can be retained", "Capacity approaches the limit", "Review retention and storage policy"],
      ]
    : [
        ["相机在线率", "确认监控覆盖是否完整", "在线率下降", "进入相机管理定位离线设备"],
        ["系统资源", "观察 CPU、内存和磁盘压力", "指标持续偏高", "联系运维检查服务与存储"],
        ["待处理警报", "判断当前事件处置压力", "数量持续增长", "进入通知中心按等级处理"],
        ["录像与存储", "确认录像可持续保存", "容量接近上限", "检查保留周期与存储策略"],
      ];

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "SHIFT INSPECTION" : "值班巡检"}</span>
          <h2 id="dashboard-action-map">{isEnglish ? "Dashboard Metric Action Map" : "主页指标行动地图"}</h2>
          <p>{isEnglish ? "Home highlights operating conditions. When a metric is abnormal, open the related module to investigate and respond." : "主页用于发现问题。看到异常指标后，应进入对应功能模块完成定位和处理。"}</p>
        </div>
        <div className="metric-action-map" role="img" aria-label={isEnglish ? "Four Home metrics and recommended actions" : "主页四类指标与推荐处理动作"}>
          {metrics.map(([metric, meaning, signal, action], index) => (
            <article key={metric}>
              <span className="metric-icon">{String(index + 1).padStart(2, "0")}</span>
              <strong>{metric}</strong>
              <p>{meaning}</p>
              <div><b>{signal}</b><SupplementalArrow /><span>{action}</span></div>
            </article>
          ))}
        </div>
        <div className="supplemental-checklist">
          <strong>{isEnglish ? "Suggested inspection order" : "建议巡检顺序"}</strong>
          <span>{isEnglish ? "Device availability" : "设备在线状态"}</span><SupplementalArrow /><span>{isEnglish ? "Resources and storage" : "资源与存储"}</span><SupplementalArrow /><span>{isEnglish ? "Pending alarms" : "待处理警报"}</span>
        </div>
      </div>
    </section>
  );
}

function AiRuleAndAreaVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const ruleParts = isEnglish
    ? ["Detection target", "Detection area", "Trigger condition", "Effective schedule", "Linked action"]
    : ["检测对象", "检测区域", "触发条件", "生效时间", "联动动作"];

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "RULE DESIGN" : "规则设计"}</span>
          <h2 id="ai-rule-formula">{isEnglish ? "AI Detection Rule Formula" : "AI 检测规则构成"}</h2>
          <p>{isEnglish ? "An operational rule defines what to detect, where to detect it, when to trigger, and what happens after the trigger." : "一条可执行的规则应同时回答“检测什么、在哪里、何时触发以及触发后做什么”。"}</p>
        </div>
        <div className="rule-formula" role="img" aria-label={isEnglish ? "AI detection rule formula" : "AI 检测规则由检测对象、检测区域、触发条件、生效时间和联动动作组成"}>
          {ruleParts.map((part, index) => (
            <div key={part}>
              <span>{String(index + 1).padStart(2, "0")}</span><strong>{part}</strong>
              {index < ruleParts.length - 1 && <b aria-hidden="true">＋</b>}
            </div>
          ))}
        </div>
        <div className="rule-example">
          <span>{isEnglish ? "Example" : "示例"}</span>
          <strong>{isEnglish ? "Person" : "人员"}</strong><b>＋</b><strong>{isEnglish ? "Restricted area at night" : "夜间禁入区域"}</strong><b>＋</b><strong>{isEnglish ? "Trigger on entry" : "进入即触发"}</strong><b>＋</b><strong>22:00–06:00</strong><b>＋</b><strong>{isEnglish ? "Create alarm and retain recording" : "警报并保存录像"}</strong>
        </div>
      </div>

      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "AREA CONFIGURATION" : "区域配置"}</span>
          <h2 id="detection-area-guide">{isEnglish ? "Detection Area Guide" : "检测区域绘制指南"}</h2>
          <p>{isEnglish ? "Cover the real operational area while excluding lighting changes, reflections, moving vegetation, and unrelated paths." : "区域应覆盖真实业务范围，同时避开灯光变化、反光、树木晃动和无关通道等干扰源。"}</p>
        </div>
        <div className="area-guide">
          <article className="area-example good">
            <img
              className="area-guide-image"
              src="/media/polytron-one/guides/detection-area-recommended.png"
              alt={isEnglish ? "Recommended detection area drawn along the actual travel path" : "沿真实通行路径绘制的推荐检测区域"}
            />
            <div><b>{isEnglish ? "Recommended" : "推荐绘制"}</b><p>{isEnglish ? "Keep the area close to the entrance, cover the full travel path, and avoid image edges." : "区域紧贴入口，完整覆盖人员通行路径，并避开画面边缘。"}</p></div>
          </article>
          <article className="area-example bad">
            <img
              className="area-guide-image"
              src="/media/polytron-one/guides/detection-area-risk.png"
              alt={isEnglish ? "Detection area covering unrelated regions and increasing false-alarm risk" : "覆盖无关区域并增加误报风险的检测区域"}
            />
            <div><b>{isEnglish ? "False-alarm risk" : "容易误报"}</b><p>{isEnglish ? "An area covering the full frame also includes window reflections, background motion, and unrelated people." : "区域覆盖整幅画面，把窗户反光、背景运动和无关人员同时纳入检测。"}</p></div>
          </article>
        </div>
        <div className="supplemental-checklist">
          <strong>{isEnglish ? "Pre-publish test" : "发布前测试"}</strong><span>{isEnglish ? "Target fully enters the area" : "目标完整进入区域"}</span><span>{isEnglish ? "Direction is correct" : "方向设置正确"}</span><span>{isEnglish ? "Schedule is active" : "排期已生效"}</span><span>{isEnglish ? "Run one controlled trigger" : "用真实动作触发一次"}</span>
        </div>
      </div>
    </section>
  );
}

function AlarmDetailAnatomyVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const videoImageUrl = isEnglish
    ? "/media/polytron-one/guides/alarm-detail-anatomy-en.png"
    : "/media/polytron-one/guides/alarm-detail-anatomy-zh.png";
  const callouts = isEnglish
    ? [
        ["01", "Alarm type and severity"], ["02", "Occurrence time and location"], ["03", "Related camera"],
        ["04", "Video before and after trigger"], ["05", "AI detection annotation"], ["06", "State, notes, and actions"],
      ]
    : [
        ["01", "警报类型与等级"], ["02", "发生时间与位置"], ["03", "关联相机"],
        ["04", "触发前后录像"], ["05", "AI 检测标注"], ["06", "状态、备注与处理动作"],
      ];

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "READING THE DETAILS" : "详情阅读"}</span>
          <h2 id="alarm-detail-anatomy">{isEnglish ? "Alarm Detail Anatomy" : "警报详情解剖图"}</h2>
          <p>{isEnglish ? "Confirm the event facts, review the video, then update the state and record the conclusion." : "先确认事件基本信息，再核查录像，最后更新状态并记录结论。"}</p>
        </div>
        <div className="alarm-anatomy">
          <div className="alarm-mockup" aria-hidden="true">
            <div
              className="alarm-video-panel"
              style={{
                backgroundImage: `linear-gradient(0deg, rgba(15, 23, 42, 0.76) 0%, rgba(15, 23, 42, 0.24) 34%, rgba(15, 23, 42, 0) 58%), url(${videoImageUrl})`,
              }}
            ><span>AI</span><b>{isEnglish ? "Event video / Detection box" : "事件录像 / 检测框"}</b><small>−15s　{isEnglish ? "Trigger" : "触发时刻"}　+15s</small></div>
            <div className="alarm-info-panel">
              <span className="mock-priority">{isEnglish ? "HIGH PRIORITY" : "高优先级"}</span>
              <strong>{isEnglish ? "Person entered restricted area" : "人员进入限制区域"}</strong>
              <i /><i /><i />
              <div><button type="button">{isEnglish ? "Mark false alarm" : "标记误报"}</button><button type="button">{isEnglish ? "Confirm handling" : "确认处理"}</button></div>
            </div>
          </div>
          <ol>{callouts.map(([number, label]) => <li key={number}><span>{number}</span><strong>{label}</strong></li>)}</ol>
        </div>
      </div>
    </section>
  );
}

function PlaybackSearchWorkspaceVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const copy = isEnglish
    ? {
        kicker: "FUNCTION OVERVIEW",
        heading: "Unified Search and Playback Workspace",
        intro: "Describe a target, narrow the cameras and time range, inspect the matches, and continue directly into historical playback.",
        query: "A person wearing red clothes",
        scope: "Search scope",
        all: "All cameras",
        current: "Cameras in current view",
        date: "Date & time range",
        results: "Search results",
        newest: "Newest",
        confidence: "Confidence",
        layouts: "Playback layout",
        threshold: "Match 60%",
        controls: ["Download", "Clip", "Play / Pause", "x1 · x2 · x5", "Fullscreen"],
        steps: [
          ["01", "Describe target", "Text, voice, or attachment"],
          ["02", "Limit scope", "Cameras and date range"],
          ["03", "Inspect matches", "Time, location, confidence"],
          ["04", "Review playback", "Grid or Timeline"],
          ["05", "Clip evidence", "Download the required range"],
        ],
      }
    : {
        kicker: "功能说明",
        heading: "搜索与回放一体化工作台",
        intro: "描述目标、限定相机与时间范围、核对命中结果，并在同一页面继续历史录像回放。",
        query: "搜索：穿红色上衣的人",
        scope: "搜索范围",
        all: "全部相机",
        current: "当前视图中的相机",
        date: "日期与时间范围",
        results: "搜索结果",
        newest: "最新优先",
        confidence: "置信度",
        layouts: "回放布局",
        threshold: "匹配度 60%",
        controls: ["下载", "裁剪", "播放 / 暂停", "x1 · x2 · x5", "全屏"],
        steps: [
          ["01", "描述目标", "文字、语音或附件"],
          ["02", "限定范围", "相机与日期时间"],
          ["03", "核对结果", "时间、位置、置信度"],
          ["04", "回放复核", "网格或时间线"],
          ["05", "裁剪取证", "下载必要时间范围"],
        ],
      };

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{copy.kicker}</span>
          <h2 id="playback-search-workspace">{copy.heading}</h2>
          <p>{copy.intro}</p>
        </div>

        <div className="playback-workspace-visual" role="img" aria-label={copy.heading}>
          <aside className="playback-search-visual">
            <div className="playback-search-input"><Video size={15} /><span>{copy.query}</span><Search size={15} /></div>
            <strong>{copy.scope}</strong>
            <div className="playback-scope-option active"><i />{copy.all}</div>
            <div className="playback-scope-option"><i />{copy.current}</div>
            <div className="playback-date-filter">{copy.date}<b>2026-04-13</b></div>
            <div className="playback-results-title"><strong>{copy.results}</strong><span>32</span><small>{copy.newest}</small></div>
            {["192.168.1.45", "192.168.3.112", "192.168.10.67"].map((camera, index) => (
              <div className="playback-result-card" key={camera}>
                <i aria-hidden="true" />
                <div><strong>{camera}</strong><small>Lobby 1F-East · 0{8 + index}:4{1 + index}:32</small><span>{copy.confidence} {92 - index * 14}%</span></div>
              </div>
            ))}
          </aside>

          <div className="playback-main-visual">
            <div className="playback-layout-toolbar">
              <div><small>{copy.layouts}</small><span>1</span><span className="active">4</span><span>9</span></div>
              <b>{copy.threshold}</b>
            </div>
            <div className="playback-mock-grid">
              {["Office 1F-127", "Parking Lot B2", "Lobby 2F-East", "Meeting room-106"].map((label, index) => (
                <div className={index === 0 ? "selected" : ""} key={label}><span>{label}</span><small>20:42:{28 + index}</small></div>
              ))}
            </div>
            <div className="playback-control-strip">
              {copy.controls.map((control) => <span key={control}>{control}</span>)}
            </div>
            <div className="playback-mini-timeline"><i /><i /><i /><b /></div>
          </div>
        </div>

        <div className="supplemental-heading playback-workflow-heading">
          <span>{isEnglish ? "INVESTIGATION PATH" : "推荐路径"}</span>
          <h2 id="playback-workflow">{isEnglish ? "Workflow" : "操作流程"}</h2>
        </div>
        <ol className="playback-workflow-diagram">
          {copy.steps.map(([number, title, detail]) => (
            <li key={number}><span>{number}</span><strong>{title}</strong><small>{detail}</small></li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PlaybackTimelineVisual() {
  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>录像定位</span>
          <h2 id="playback-timeline">录像时间轴图例</h2>
          <p>先根据颜色判断录像是否存在，再拖动播放点定位事件；导出时明确设置裁剪起点和终点。</p>
        </div>
        <div className="timeline-visual" role="img" aria-label="录像时间轴中连续录像、事件录像、无录像区间、警报时刻和裁剪区间的示意">
          <div className="timeline-labels"><span>08:00</span><span>09:00</span><span>10:00</span><span>11:00</span><span>12:00</span></div>
          <div className="timeline-track">
            <i className="recording continuous" /><i className="recording gap" /><i className="recording event" /><i className="recording continuous tail" />
            <span className="clip-start">IN</span><span className="alarm-marker">警报</span><span className="playhead" /><span className="clip-end">OUT</span>
          </div>
          <div className="timeline-legend"><span><i className="continuous" />连续录像</span><span><i className="event" />事件录像</span><span><i className="empty" />无录像</span><span><i className="marker" />当前播放点</span></div>
        </div>
      </div>
    </section>
  );
}

function NotificationRelationshipVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const items = isEnglish
    ? [
        ["AI detection event", "The algorithm identifies an image change that meets a rule"],
        ["Alarm record", "The system retains event type, time, location, and video"],
        ["Notification", "The alarm is brought to the on-duty operator's attention"],
        ["Human response", "Verify, comment, close, or mark a false alarm"],
      ]
    : [
        ["AI 检测事件", "算法识别到符合规则的画面变化"],
        ["警报记录", "系统保存事件类型、时间、位置和录像"],
        ["通知提醒", "把需要关注的警报送达值班人员"],
        ["人工处置", "核查、备注、关闭或标记误报"],
      ];

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "CONCEPT RELATIONSHIP" : "概念关系"}</span>
          <h2 id="event-notification-relationship">{isEnglish ? "Events, Alarms, and Notifications" : "事件、警报与通知的关系"}</h2>
          <p>{isEnglish ? "An alarm is a traceable business record. A notification is the message and entry point that brings that record to the user's attention." : "警报是需要追踪的业务记录；通知是提醒用户关注该记录的入口，两者不是同一个概念。"}</p>
        </div>
        <ol className="relationship-flow">
          {items.map(([title, detail], index) => (
            <li key={title}><span>{index + 1}</span><div><strong>{title}</strong><small>{detail}</small></div>{index < items.length - 1 && <SupplementalArrow />}</li>
          ))}
        </ol>
        <div className="relationship-note"><b>{isEnglish ? "State synchronization: " : "状态同步："}</b>{isEnglish ? "When handling state changes in alarm details, the related notification record and statistics should update accordingly." : "用户在警报详情中更新处理状态后，通知列表中的对应记录和统计数据应同步变化。"}</div>
      </div>
    </section>
  );
}

function CameraTroubleshootingVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const issues = isEnglish
    ? [
        ["Shown as offline", "Check power and network", "Verify IP, port, and credentials", "Test the connection again"],
        ["Online without video", "Check main/substream URLs", "Confirm codec", "Validate browser playback"],
        ["Video without recording", "Check recording schedule", "Confirm storage space", "Review recording-task logs"],
        ["Video without alarms", "Confirm algorithm is enabled", "Review area, threshold, and schedule", "Run one controlled trigger test"],
      ]
    : [
        ["显示离线", "检查供电与网络", "核对 IP、端口和账号", "重新测试连接"],
        ["在线但无画面", "检查主/子码流地址", "确认编码格式", "验证浏览器播放"],
        ["有画面但无录像", "检查录像排期", "确认存储空间", "查看录像任务日志"],
        ["有画面但不报警", "检查算法已启用", "核对区域、阈值和时间", "执行一次真实触发测试"],
      ];

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "FAULT ISOLATION" : "故障定位"}</span>
          <h2 id="camera-troubleshooting">{isEnglish ? "Camera Troubleshooting Path" : "相机异常排查路径"}</h2>
          <p>{isEnglish ? "First determine whether the issue concerns connectivity, playback, recording, or detection. Avoid changing several settings at once." : "先判断异常属于连接、播放、录像还是检测，避免一次修改多个配置导致问题更难定位。"}</p>
        </div>
        <div className="troubleshooting-tree">
          <div className="tree-question">{isEnglish ? "What is wrong with the camera?" : "相机出现什么问题？"}</div>
          <div className="tree-branches">
            {issues.map(([issue, ...checks], index) => (
              <article key={issue}><span>{String(index + 1).padStart(2, "0")}</span><strong>{issue}</strong><ol>{checks.map(check => <li key={check}>{check}</li>)}</ol></article>
            ))}
          </div>
        </div>
        <p className="supplemental-caption">{isEnglish ? "If the camera remains unavailable, record its identifier, occurrence time, error message, and relevant logs before contacting an administrator or operations team." : "仍无法恢复时，请记录相机编号、异常时间、错误提示和相关日志，再联系系统管理员或运维人员。"}</p>
      </div>
    </section>
  );
}

function FirstUseReadinessVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const checks = isEnglish
    ? [
        ["Account access", "Menus and role match the operator's duties"],
        ["Camera playback", "Video, time, and online state are correct"],
        ["Recording playback", "Recorded segments are available and playable"],
        ["Rule trigger", "A controlled test action creates an alarm"],
        ["Notification handling", "Details, notes, and status can be updated"],
        ["Result recorded", "Exceptions and owners are documented"],
      ]
    : [
        ["账号可登录", "菜单与角色符合岗位"],
        ["相机可播放", "画面、时间和在线状态正常"],
        ["录像可回放", "时间轴存在数据并可播放"],
        ["规则可触发", "真实测试动作生成警报"],
        ["通知可处置", "详情、备注和状态可更新"],
        ["结果已记录", "异常项和负责人已明确"],
      ];

  return (
    <section className="docs-supplements docs-supplements-compact">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "OPERATIONAL ACCEPTANCE" : "上线验收"}</span>
          <h2 id="first-use-readiness">{isEnglish ? "First-use Acceptance Path" : "首次使用验收路径"}</h2>
          <p>{isEnglish ? "Complete all six checks in order. Resolve an earlier failure before continuing to alarm and response tests." : "按顺序完成六项验证。前一项未通过时，不建议直接跳到后续警报和处置测试。"}</p>
        </div>
        <ol className="readiness-path">
          {checks.map(([title, detail], index) => (
            <li key={title}><span>{index + 1}</span><div><strong>{title}</strong><small>{detail}</small></div>{index < checks.length - 1 && <SupplementalArrow />}</li>
          ))}
        </ol>
        <div className="readiness-result"><strong>{isEnglish ? "Acceptance criterion" : "验收完成标准"}</strong><span>{isEnglish ? "Complete live viewing, historical review, and the alarm-response loop successfully at least once." : "实时查看、历史追溯和警报闭环三条链路均至少成功执行一次。"}</span></div>
      </div>
    </section>
  );
}

function CompatibilityBaselineVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const rows = isEnglish
    ? [
        ["Client", "Maintained desktop browser", "JavaScript, media playback, local storage, and download permission"],
        ["Network", "Stable camera-platform connectivity", "IP, ports, credentials, RTSP / ONVIF, and firewall policy"],
        ["Video streams", "Main stream and substream validated", "Codec, resolution, frame rate, bit rate, and bandwidth"],
        ["Time sync", "Server, camera, and client use the same time zone", "Alarm, notification, and recording times align"],
        ["Recording storage", "Capacity supports schedule and retention", "Camera count, bit rate, recording duration, and free space"],
      ]
    : [
        ["访问终端", "更新的桌面浏览器", "JavaScript、媒体播放、本地存储和下载权限"],
        ["设备网络", "相机与平台稳定互通", "IP、端口、账号、RTSP / ONVIF 与防火墙策略"],
        ["视频流", "主码流和子码流均可验证", "编码格式、分辨率、帧率、码率与带宽"],
        ["时间同步", "服务器、相机和终端时区一致", "警报、通知和录像时间能够对应"],
        ["录像存储", "容量满足排期与保留周期", "相机数量、码率、录像时长和剩余空间"],
      ];

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "OPERATING ENVIRONMENT" : "运行环境"}</span>
          <h2 id="compatibility-baseline">{isEnglish ? "Compatibility Baseline" : "兼容性基线"}</h2>
          <p>{isEnglish ? "Confirm final values against the deployment. This table identifies the environmental conditions that must be validated." : "项目上线前应根据实际部署填写最终参数。下表用于提示必须验证的环境条件。"}</p>
        </div>
        <div className="matrix-scroll">
          <table className="compatibility-matrix">
            <thead><tr><th>{isEnglish ? "Category" : "类别"}</th><th>{isEnglish ? "Recommended baseline" : "推荐基线"}</th><th>{isEnglish ? "Validate before launch" : "上线前重点验证"}</th></tr></thead>
            <tbody>{rows.map(([category, baseline, verify]) => <tr key={category}><th>{category}</th><td>{baseline}</td><td>{verify}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="supplemental-caption">{isEnglish ? "When a deployment defines browser versions, codecs, or port ranges, use those project values instead of the general guidance." : "如果项目已经确定具体浏览器版本、编码格式或端口范围，应使用项目实际参数替换通用说明。"}</p>
      </div>
    </section>
  );
}

function GlobalTroubleshootingMapVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const issues = isEnglish
    ? [
        ["Cannot sign in", "Account → Password → Account state → Network"],
        ["Page or camera missing", "Feature access → Resource access → Filters"],
        ["No camera image", "Device online → Stream → Codec → Browser"],
        ["No recording", "Date and time → Schedule → Storage → Task logs"],
        ["No alarm", "Algorithm → Region → Threshold → Effective schedule"],
        ["Notifications not updating", "Filters → Auto refresh → Alarm state → Access"],
        ["Playback or export fails", "Recording exists → Clip range → Download access → Disk"],
        ["Still unavailable", "Record time, page, camera ID, error, and logs"],
      ]
    : [
        ["无法登录", "账号 → 密码 → 账号状态 → 网络"],
        ["页面或相机不可见", "功能权限 → 资源权限 → 筛选条件"],
        ["相机无画面", "设备在线 → 视频流 → 编码 → 浏览器"],
        ["没有录像", "日期时间 → 录像排期 → 存储 → 任务日志"],
        ["没有警报", "算法 → 区域 → 阈值 → 生效时间"],
        ["通知不更新", "筛选 → 自动刷新 → 警报状态 → 权限"],
        ["回放或导出失败", "录像存在 → 裁剪范围 → 下载权限 → 磁盘"],
        ["仍无法恢复", "记录时间、页面、相机编号、错误与日志"],
      ];

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "ISSUE ROUTING" : "问题路由"}</span>
          <h2 id="global-troubleshooting-map">{isEnglish ? "Troubleshooting Map" : "全局排查地图"}</h2>
          <p>{isEnglish ? "Choose the closest symptom and check each item in order. Change one setting at a time and retest immediately." : "选择最接近的症状，并按箭头顺序检查。每次只调整一个配置，然后立即复测。"}</p>
        </div>
        <div className="global-troubleshooting-map">
          {issues.map(([issue, path], index) => <article key={issue}><span>{String(index + 1).padStart(2, "0")}</span><strong>{issue}</strong><p>{path}</p></article>)}
        </div>
        <div className="security-note"><strong>{isEnglish ? "Security note" : "安全提醒"}</strong><span>{isEnglish ? "Do not send real passwords, complete stream credentials, or access tokens when reporting an issue." : "反馈问题时不要发送真实密码、完整视频流凭据或访问令牌。"}</span></div>
      </div>
    </section>
  );
}

function SeverityResponseMatrixVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const rows = isEnglish
    ? [
        ["High", "Personal safety, unauthorized entry, critical area, or sustained anomaly", "Verify immediately", "Site lead / Security supervisor", "Record process and result", "高"],
        ["Medium", "On-site confirmation required, expanding impact, or repeated trigger", "Handle with priority", "Shift lead", "Confirm cause and track", "中"],
        ["Low", "General reminder, device change, or operational event", "Handle by queue", "On-duty operator", "Batch review and archive", "低"],
      ]
    : [
        ["高", "人员安全、未授权进入、重点区域或持续异常", "立即核查", "现场负责人 / 安保主管", "记录过程与结果", "高"],
        ["中", "需要现场确认、可能扩大或短时重复触发", "优先处理", "值班负责人", "确认原因并跟踪", "中"],
        ["低", "一般提醒、设备变化或运营类事件", "按队列处理", "当班人员", "批量核查和归档", "低"],
      ];

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "RESPONSE BASELINE" : "处置基线"}</span>
          <h2 id="severity-response-matrix">{isEnglish ? "Alarm Severity Response Matrix" : "警报等级响应矩阵"}</h2>
          <p>{isEnglish ? "This is an operating baseline and does not replace the project service agreement or site emergency procedure." : "这是推荐基线，不替代项目服务等级协议和现场应急制度。"}</p>
        </div>
        <div className="matrix-scroll">
          <table className="severity-matrix">
            <thead><tr><th>{isEnglish ? "Level" : "等级"}</th><th>{isEnglish ? "Typical condition" : "典型条件"}</th><th>{isEnglish ? "Response" : "响应要求"}</th><th>{isEnglish ? "Escalate to" : "建议升级"}</th><th>{isEnglish ? "Record" : "记录要求"}</th></tr></thead>
            <tbody>{rows.map(([level, condition, response, escalation, record, tone]) => <tr key={level}><th><span className={`severity-badge severity-${tone}`}>{level}</span></th><td>{condition}</td><td>{response}</td><td>{escalation}</td><td>{record}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="severity-escalation"><strong>{isEnglish ? "Escalation signals" : "必须升级的信号"}</strong><span>{isEnglish ? "Personal injury" : "人员受伤"}</span><span>{isEnglish ? "Critical facility affected" : "重点设施受影响"}</span><span>{isEnglish ? "Multiple areas" : "多个区域同时发生"}</span><span>{isEnglish ? "Abnormal duration" : "持续时间异常"}</span><span>{isEnglish ? "Cannot verify remotely" : "无法远程确认"}</span></div>
      </div>
    </section>
  );
}

function StatusLegendVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const deviceStates = isEnglish
    ? [["Online", "Platform connection available", "online"], ["Offline", "Cannot connect to device", "offline"], ["Abnormal", "Some capabilities unavailable", "warning"]]
    : [["在线", "平台连接正常", "online"], ["离线", "无法连接设备", "offline"], ["异常", "部分能力不可用", "warning"]];
  const alarmStates = isEnglish
    ? [["Pending", "Awaiting human verification"], ["In progress", "Confirmed and being handled"], ["Closed", "Handled and archived"], ["False alarm", "No real risk; record the cause"]]
    : [["待确认", "尚未人工核查"], ["处理中", "已确认并正在处置"], ["已关闭", "处理完成并归档"], ["误报", "无真实风险，需记录原因"]];

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "QUICK REFERENCE" : "快速识别"}</span>
          <h2 id="status-legend">{isEnglish ? "Status Legend" : "状态图例"}</h2>
          <p>{isEnglish ? "Color supports scanning only. Read the state text, icon, and details before making a decision." : "颜色只用于辅助识别；实际判断应同时阅读状态文字、图标和详情信息。"}</p>
        </div>
        <div className="status-legend-grid">
          <article><strong>{isEnglish ? "Device states" : "设备状态"}</strong><div>{deviceStates.map(([state, detail, tone]) => <span key={state} className={`status-token ${tone}`}><i /> <b>{state}</b><small>{detail}</small></span>)}</div></article>
          <article><strong>{isEnglish ? "Alarm states" : "警报状态"}</strong><div>{alarmStates.map(([state, detail], index) => <span key={state} className={`status-token alarm-${index + 1}`}><i /> <b>{state}</b><small>{detail}</small></span>)}</div></article>
        </div>
        <div className="status-rule"><strong>{isEnglish ? "State flow" : "状态变化原则"}</strong><span>{isEnglish ? "Alarm created" : "系统产生警报"}</span><SupplementalArrow /><span>{isEnglish ? "Human verification" : "人工确认"}</span><SupplementalArrow /><span>{isEnglish ? "Handle or mark false alarm" : "处置或标记误报"}</span><SupplementalArrow /><span>{isEnglish ? "Close and archive" : "关闭归档"}</span></div>
      </div>
    </section>
  );
}

function EvidenceExportWorkflowVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const steps = isEnglish
    ? [
        ["Locate", "Confirm camera and event time"], ["Review", "Inspect before, during, and after"], ["Clip", "Set the IN / OUT range"],
        ["Export", "Confirm permission and destination"], ["Verify", "Check that the file is complete and playable"], ["Register", "Record owner, time, and purpose"],
      ]
    : [
        ["定位", "确认相机与事件时间"], ["核查", "查看事件前中后画面"], ["裁剪", "设置 IN / OUT 范围"],
        ["导出", "确认权限与保存位置"], ["复核", "检查文件可播放且完整"], ["登记", "记录人员、时间和用途"],
      ];

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "EVIDENCE HANDLING" : "证据链路"}</span>
          <h2 id="evidence-export-workflow">{isEnglish ? "Evidence Export Workflow" : "证据导出工作流"}</h2>
          <p>{isEnglish ? "A completed download is not the end of retention. Verify the file and register its source, time range, and storage location." : "导出成功不等于留存完成；还需要复核文件并登记来源、时间范围和保存位置。"}</p>
        </div>
        <ol className="evidence-workflow">
          {steps.map(([title, detail], index) => <li key={title}><span>{index + 1}</span><div><strong>{title}</strong><small>{detail}</small></div>{index < steps.length - 1 && <SupplementalArrow />}</li>)}
        </ol>
        <div className="filename-anatomy">
          <strong>{isEnglish ? "Recommended filename" : "推荐文件名"}</strong>
          <code><span>20260720</span>_<span>143000</span>_<span>Office1F</span>_<span>CAM0460</span>_<span>RestrictedArea</span>_<span>EVT001</span></code>
          <small>{isEnglish ? "Date　Time　Location　Camera　Event type　Event ID" : "日期　时间　位置　相机　事件类型　事件编号"}</small>
        </div>
      </div>
    </section>
  );
}

function UiStateGuideVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const states = isEnglish
    ? [
        ["Loading", "Waiting for data", "If prolonged, check network and system resources", "loading"],
        ["Processing", "A clip, export, or save task is running", "Record the start time and avoid duplicate submission", "processing"],
        ["No data", "Nothing matches the current scope", "Check time, cameras, filters, and permissions", "empty"],
        ["Insufficient permission", "The role cannot access the resource or action", "Ask an administrator to check both permission types", "locked"],
        ["Operation failed", "Connection, input, or service state is invalid", "Retain the message and troubleshoot by type", "failed"],
      ]
    : [
        ["加载中", "等待数据返回", "持续异常时检查网络与系统资源", "loading"],
        ["处理中", "录像片段、导出或保存任务正在执行", "记录开始时间，避免重复提交", "processing"],
        ["暂无数据", "筛选范围内没有可显示内容", "检查时间、相机、筛选和权限", "empty"],
        ["权限不足", "当前角色无法访问资源或操作", "联系管理员检查两类权限", "locked"],
        ["操作失败", "连接、输入或服务状态异常", "保存提示并按类型排查", "failed"],
      ];

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "STATE FEEDBACK" : "状态反馈"}</span>
          <h2 id="ui-state-guide">{isEnglish ? "Page-state Action Guide" : "页面状态行动指南"}</h2>
          <p>{isEnglish ? "Determine whether the page is still processing normally, then choose to wait, adjust the scope, request access, or escalate." : "先判断状态是否仍在正常处理中，再决定等待、调整条件、申请权限或升级问题。"}</p>
        </div>
        <div className="ui-state-guide">
          {states.map(([state, meaning, action, tone]) => <article key={state} className={tone}><span className="ui-state-symbol" aria-hidden="true" /><strong>{state}</strong><p>{meaning}</p><div><b>{isEnglish ? "Next" : "下一步"}</b><span>{action}</span></div></article>)}
        </div>
      </div>
    </section>
  );
}

function SecurityRetentionLayersVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const layers = isEnglish
    ? [
        ["Identity", "Individual accounts, password policy, abnormal sign-ins"],
        ["Access", "Minimum feature access and camera-resource scope"],
        ["Usage", "Shared-terminal locking, sign-out, and operation audit"],
        ["Data", "Recording, alarm, log retention, and secure export"],
        ["Review", "Periodic review of accounts, access, storage, and logs"],
      ]
    : [
        ["身份", "独立账号、密码策略、异常登录"],
        ["权限", "最小功能权限与相机资源范围"],
        ["使用", "共享终端锁屏、退出与操作审计"],
        ["数据", "录像、警报、日志保留与安全导出"],
        ["复核", "定期检查账号、权限、存储和日志"],
      ];

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "DEFENSE IN DEPTH" : "纵深控制"}</span>
          <h2 id="security-retention-layers">{isEnglish ? "Security and Retention Layers" : "安全与保留控制层"}</h2>
          <p>{isEnglish ? "Security depends on identity, access, daily use, data retention, and periodic review working together." : "安全不依赖单一设置，而是由身份、权限、日常使用、数据保留和定期复核共同组成。"}</p>
        </div>
        <ol className="security-layers">
          {layers.map(([title, detail], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{title}</strong><small>{detail}</small></div></li>)}
        </ol>
        <div className="retention-balance"><div><strong>{isEnglish ? "Traceability" : "追溯需求"}</strong><span>{isEnglish ? "Critical evidence remains available through investigation" : "关键事件在调查完成前可用"}</span></div><SupplementalArrow /><div><strong>{isEnglish ? "Storage capacity" : "存储容量"}</strong><span>{isEnglish ? "Assess bit rate, camera count, and retention period" : "根据码率、相机数量和周期评估"}</span></div><SupplementalArrow /><div><strong>{isEnglish ? "Project policy" : "项目制度"}</strong><span>{isEnglish ? "Final periods and approvals follow the deployment policy" : "最终天数与审批流程以项目为准"}</span></div></div>
      </div>
    </section>
  );
}

function FaqRouterVisual({ isEnglish = false }: { isEnglish?: boolean }) {
  const routes = isEnglish
    ? [
        ["Login or access", "Account, password, menu, or camera visibility", "/en/docs/troubleshooting"],
        ["No camera image", "Online state, stream, codec, and browser", "/en/docs/cameras/camera-management"],
        ["Recording and export", "Empty timeline, clipping, or download failure", "/en/docs/playback/export-evidence"],
        ["AI does not alarm", "Algorithm, region, threshold, and effective schedule", "/en/docs/cameras/alarm-settings"],
        ["Notification missing", "Filters, auto refresh, state, and access", "/en/docs/notifications"],
        ["Security and retention", "Accounts, shared terminals, export, and retention", "/en/docs/settings/security-retention"],
      ]
    : [
        ["登录或权限", "账号、密码、菜单或相机不可见", "/zh/docs/troubleshooting"],
        ["相机无画面", "在线状态、视频流、编码与浏览器", "/zh/docs/cameras/camera-management"],
        ["录像与导出", "时间轴无数据、裁剪或下载失败", "/zh/docs/playback/export-evidence"],
        ["AI 不报警", "算法、区域、阈值和生效时间", "/zh/docs/cameras/alarm-settings"],
        ["通知不可见", "筛选、自动刷新、状态和权限", "/zh/docs/notifications"],
        ["安全与保留", "账号、共享终端、导出和存储周期", "/zh/docs/settings/security-retention"],
      ];

  return (
    <section className="docs-supplements">
      <div className="supplemental-section">
        <div className="supplemental-heading">
          <span>{isEnglish ? "ISSUE NAVIGATION" : "问题导航"}</span>
          <h2 id="faq-router">{isEnglish ? "FAQ Quick Links" : "常见问题快速定位"}</h2>
          <p>{isEnglish ? "Choose an issue type to open the relevant guide. Concise answers to frequent questions remain below." : "选择问题类型进入对应详细文档；页面下方保留了高频问题的简明答案。"}</p>
        </div>
        <div className="faq-router">
          {routes.map(([title, detail, href], index) => <a href={href} key={title}><span>{String(index + 1).padStart(2, "0")}</span><strong>{title}</strong><p>{detail}</p><b>{isEnglish ? "View guidance →" : "查看详细说明 →"}</b></a>)}
        </div>
      </div>
    </section>
  );
}

function SupplementalVisuals({ doc }: { doc: DocPage }) {
  if (doc.id === "overview") return <OverviewSupplementalVisuals />;
  if (doc.id === "en-overview") return <OverviewSupplementalVisuals isEnglish />;
  if (doc.id === "home-overview") return <DashboardActionMapVisual />;
  if (doc.id === "en-home-overview") return <DashboardActionMapVisual isEnglish />;
  if (doc.id === "alarm-trigger") return <AlarmLifecycleVisual />;
  if (doc.id === "en-alarm-trigger") return <AlarmLifecycleVisual isEnglish />;
  if (doc.id === "alarm-trigger-video-clip") return <AlarmDetailAnatomyVisual />;
  if (doc.id === "en-alarm-trigger-video-clip") return <AlarmDetailAnatomyVisual isEnglish />;
  if (doc.id === "cameras") return <CameraOnboardingVisual />;
  if (doc.id === "en-cameras") return <CameraOnboardingVisual isEnglish />;
  if (doc.id === "cameras-camera-management") return <CameraTroubleshootingVisual />;
  if (doc.id === "en-cameras-camera-management") return <CameraTroubleshootingVisual isEnglish />;
  if (doc.id === "cameras-alarm-settings") return <AiRuleAndAreaVisual />;
  if (doc.id === "en-cameras-alarm-settings") return <AiRuleAndAreaVisual isEnglish />;
  if (doc.id === "notifications") return <NotificationRelationshipVisual />;
  if (doc.id === "en-notifications") return <NotificationRelationshipVisual isEnglish />;
  if (doc.id === "settings") return <PermissionMatrixVisual />;
  if (doc.id === "en-settings") return <PermissionMatrixVisual isEnglish />;
  if (doc.id === "getting-started-checklist") return <FirstUseReadinessVisual />;
  if (doc.id === "en-getting-started-checklist") return <FirstUseReadinessVisual isEnglish />;
  if (doc.id === "system-requirements") return <CompatibilityBaselineVisual />;
  if (doc.id === "en-system-requirements") return <CompatibilityBaselineVisual isEnglish />;
  if (doc.id === "global-troubleshooting") return <GlobalTroubleshootingMapVisual />;
  if (doc.id === "en-global-troubleshooting") return <GlobalTroubleshootingMapVisual isEnglish />;
  if (doc.id === "alarm-severity-response") return <SeverityResponseMatrixVisual />;
  if (doc.id === "en-alarm-severity-response") return <SeverityResponseMatrixVisual isEnglish />;
  if (doc.id === "status-and-glossary") return <StatusLegendVisual />;
  if (doc.id === "en-status-and-glossary") return <StatusLegendVisual isEnglish />;
  if (doc.id === "playback-export-evidence") return <EvidenceExportWorkflowVisual />;
  if (doc.id === "en-playback-export-evidence") return <EvidenceExportWorkflowVisual isEnglish />;
  if (doc.id === "ui-states") return <UiStateGuideVisual />;
  if (doc.id === "en-ui-states") return <UiStateGuideVisual isEnglish />;
  if (doc.id === "security-retention") return <SecurityRetentionLayersVisual />;
  if (doc.id === "en-security-retention") return <SecurityRetentionLayersVisual isEnglish />;
  if (doc.id === "faq") return <FaqRouterVisual />;
  if (doc.id === "en-faq") return <FaqRouterVisual isEnglish />;
  return null;
}

function PublicDocsApp() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const currentLocale = localeFromPath(currentPath);
  const currentBaseRoute = routeBase(currentPath);
  const currentVersion: PublicDocVersion =
    currentBaseRoute === "/docs/v1" || currentBaseRoute.startsWith("/docs/v1/")
      ? "v1"
      : "v2";
  const publicDocs = docsForLocale(
    currentVersion === "v1" ? legacyV1Docs : initialEditorDocs,
    currentLocale
  );
  const selectedDoc = docForPath(currentPath, publicDocs, currentLocale);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches,
  );
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null);
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const [isVersionMenuOpen, setIsVersionMenuOpen] = useState(false);
  const versionMenuRef = useRef<HTMLDivElement>(null);
  const [expandedNavGroups, setExpandedNavGroups] = useState<Set<string>>(
    () => new Set([selectedDoc.category])
  );
  const groupedDocs = groupDocsByModule(publicDocs);
  const publicCopy =
    currentLocale === "en"
      ? {
          brandSubtitle: "Product Documentation",
          searchPlaceholder: "Search features",
          tocLabel: "On this page",
          sidebarToggleOpen: "Expand sidebar",
          sidebarToggleClose: "Collapse sidebar",
          sidebarSearch: "Open search",
          versionMenuLabel: "Documentation version",
        }
      : {
          brandSubtitle: "功能说明文档",
          searchPlaceholder: "搜索功能",
          tocLabel: "本页目录",
          sidebarToggleOpen: "展开左侧菜单",
          sidebarToggleClose: "收起左侧菜单",
          sidebarSearch: "打开搜索",
          versionMenuLabel: "文档版本",
        };
  const activeLocale = docLocales.find((locale) => locale.code === currentLocale) ?? docLocales[0];
  const brandRoute =
    currentVersion === "v1"
      ? routeForLocale("/docs/v1", currentLocale)
      : routeForLocale("/docs", currentLocale);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleGroups = groupedDocs
    .map((group) => {
      const docs = normalizedQuery
        ? group.docs.filter((doc) =>
            [group.category, doc.title, doc.summary, doc.route]
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery)
          )
        : group.docs;

      return { ...group, docs };
    })
    .filter((group) => group.docs.length || group.category.toLowerCase().includes(normalizedQuery));
  useEffect(() => {
    document.title = `${selectedDoc.title} - POLYTRON ONE 文档`;
  }, [selectedDoc.title]);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (isDocsHomePath(currentPath)) return;

    setExpandedNavGroups((current) => {
      if (current.has(selectedDoc.category)) return current;

      return new Set([selectedDoc.category]);
    });
  }, [currentPath, selectedDoc.category]);

  useEffect(() => {
    if (!isSidebarCollapsed && shouldFocusSearch) {
      searchInputRef.current?.focus();
      setShouldFocusSearch(false);
    }
  }, [isSidebarCollapsed, shouldFocusSearch]);

  useEffect(() => {
    if (!isLanguageMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!languageMenuRef.current?.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsLanguageMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLanguageMenuOpen]);

  useEffect(() => {
    if (!isVersionMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!versionMenuRef.current?.contains(event.target as Node)) {
        setIsVersionMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsVersionMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVersionMenuOpen]);

  const { html: anchoredContent, tocItems } = docContentWithAnchors(selectedDoc, publicDocs);
  const supplementalTocItems = supplementalTocByDocId[selectedDoc.id] ?? [];
  const docsContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers = [350, 1800, 5000].map((delay) =>
      window.setTimeout(() => refreshBrokenUploadedImages(docsContentRef.current), delay)
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [anchoredContent]);

  const navigateToDoc = (route: string) => {
    const normalizedRoute = normalizeRoute(route);
    if (normalizeRoute(window.location.pathname) !== normalizedRoute) {
      window.history.pushState(null, "", normalizedRoute);
    }
    setCurrentPath(normalizedRoute);
  };

  const switchPublicLocale = (nextLocale: DocLocale) => {
    if (nextLocale === currentLocale) return;

    try {
      window.localStorage.setItem(PUBLIC_LOCALE_KEY, nextLocale);
    } catch {
      // Ignore storage failures; route still carries the selected language.
    }

    const nextRoute = routeForLocale(selectedDoc.route, nextLocale);
    navigateToDoc(nextRoute);
  };
  const routeForPublicVersion = (nextVersion: PublicDocVersion) => {
    if (nextVersion === currentVersion) return normalizeRoute(currentPath);

    if (nextVersion === "v1") {
      return routeForLocale(nearestLegacyV1Route(currentPath), currentLocale);
    }

    let savedV2Route = "";
    let savedV1LandingRoute = "";
    try {
      savedV2Route = window.sessionStorage.getItem(PUBLIC_V2_RETURN_ROUTE_KEY) ?? "";
      savedV1LandingRoute =
        window.sessionStorage.getItem(PUBLIC_V1_LANDING_ROUTE_KEY) ?? "";
    } catch {
      // Use the V2 playback page when browser storage is unavailable.
    }

    const normalizedSavedRoute = normalizeRoute(savedV2Route);
    const savedV2BaseRoute = routeBase(normalizedSavedRoute);
    const canRestoreSavedRoute =
      Boolean(savedV2Route) &&
      isDocsRoute(normalizedSavedRoute) &&
      savedV2BaseRoute !== "/docs/v1" &&
      !savedV2BaseRoute.startsWith("/docs/v1/");
    const v1BaseRoute = routeBase(currentPath);
    const isStillOnLandingRoute =
      Boolean(savedV1LandingRoute) &&
      routeBase(savedV1LandingRoute) === v1BaseRoute;
    const directV2Route = v2RouteBaseForV1(v1BaseRoute);
    const v2Route =
      canRestoreSavedRoute && isStillOnLandingRoute ? normalizedSavedRoute : directV2Route;

    return routeForLocale(v2Route, currentLocale);
  };
  const handleDocLinkClick = (event: MouseEvent<HTMLElement>, route: string) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    navigateToDoc(route);
  };
  const handlePublicVersionClick = (
    event: MouseEvent<HTMLAnchorElement>,
    nextVersion: PublicDocVersion
  ) => {
    setIsVersionMenuOpen(false);
    if (nextVersion === currentVersion) {
      event.preventDefault();
      return;
    }

    if (currentVersion === "v2" && nextVersion === "v1") {
      const v1LandingRoute = routeForPublicVersion(nextVersion);
      try {
        window.sessionStorage.setItem(PUBLIC_V2_RETURN_ROUTE_KEY, normalizeRoute(currentPath));
        window.sessionStorage.setItem(
          PUBLIC_V1_LANDING_ROUTE_KEY,
          normalizeRoute(v1LandingRoute)
        );
      } catch {
        // The V1 page remains reachable even when browser storage is unavailable.
      }
    }

    const nextRoute = routeForPublicVersion(nextVersion);
    if (currentVersion === "v1" && nextVersion === "v2") {
      try {
        window.sessionStorage.removeItem(PUBLIC_V2_RETURN_ROUTE_KEY);
        window.sessionStorage.removeItem(PUBLIC_V1_LANDING_ROUTE_KEY);
      } catch {
        // Version switching does not depend on clearing browser storage.
      }
    }

    handleDocLinkClick(event, nextRoute);
  };
  const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    const image = lightboxImageFromTarget(target);
    if (image) {
      event.preventDefault();
      setLightboxImage(image);
      return;
    }

    if (!(target instanceof Element)) return;

    const anchor = target.closest("a");
    const href = anchor?.getAttribute("href");
    if (!href || href.startsWith("#")) return;

    try {
      const url = new URL(href, window.location.origin);
      const isDocsLink =
        isDocsRoute(url.pathname) &&
        (url.origin === window.location.origin || url.hostname === "polytron-doc.vercel.app");

      if (isDocsLink) {
        const targetRoute =
          routeLocale(url.pathname) === currentLocale && url.pathname.startsWith(`/${currentLocale}/`)
            ? url.pathname
            : routeForLocale(url.pathname, currentLocale);
        handleDocLinkClick(event, targetRoute);
      }
    } catch {
      // Keep unusual links on their native browser behavior.
    }
  };
  const toggleNavGroup = (category: string) => {
    setExpandedNavGroups((current) => {
      const next = new Set(current);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };
  const sidebarToggleLabel = isSidebarCollapsed
    ? publicCopy.sidebarToggleOpen
    : publicCopy.sidebarToggleClose;
  const sidebarSearchLabel = publicCopy.sidebarSearch;
  const openSidebarSearch = () => {
    setShouldFocusSearch(true);
    setIsSidebarCollapsed(false);
  };

  return (
    <div className="docs-shell">
      <main className={`docs-layout ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <aside className={`docs-sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
          {isSidebarCollapsed ? (
            <div className="docs-sidebar-collapsed-actions">
              <button
                aria-expanded={false}
                aria-label={sidebarToggleLabel}
                className="docs-sidebar-icon-button"
                onClick={() => setIsSidebarCollapsed(false)}
                title={sidebarToggleLabel}
                type="button"
              >
                <PanelLeftOpen size={18} />
              </button>
              <button
                aria-label={sidebarSearchLabel}
                className="docs-sidebar-icon-button"
                onClick={openSidebarSearch}
                title={sidebarSearchLabel}
                type="button"
              >
                <Search size={18} />
              </button>
            </div>
          ) : (
            <div className="docs-sidebar-inner">
              <div className="docs-sidebar-header">
                <div className="docs-brand-block">
                  <div className="docs-brand-title-row">
                    <a
                      className="docs-brand"
                      href={brandRoute}
                      onClick={(event) => handleDocLinkClick(event, brandRoute)}
                    >
                      <strong>POLYTRON ONE</strong>
                    </a>
                    <div className="docs-version-select" ref={versionMenuRef}>
                      <button
                        aria-expanded={isVersionMenuOpen}
                        aria-haspopup="listbox"
                        aria-label={publicCopy.versionMenuLabel}
                        className="docs-version-button"
                        onClick={() => {
                          setIsLanguageMenuOpen(false);
                          setIsVersionMenuOpen((open) => !open);
                        }}
                        type="button"
                      >
                        <span>{currentVersion.toUpperCase()}</span>
                        <ChevronDown size={13} strokeWidth={1.8} />
                      </button>
                      {isVersionMenuOpen && (
                        <div
                          aria-label={publicCopy.versionMenuLabel}
                          className="docs-version-menu"
                          role="listbox"
                        >
                          <span className="docs-version-menu-title">
                            {publicCopy.versionMenuLabel}
                          </span>
                          {publicDocVersions.map((version) => (
                            <a
                              aria-selected={currentVersion === version.code}
                              className={`docs-version-option ${
                                currentVersion === version.code ? "active" : ""
                              }`}
                              href={routeForPublicVersion(version.code)}
                              key={version.code}
                              onClick={(event) =>
                                handlePublicVersionClick(event, version.code)
                              }
                              role="option"
                            >
                              {version.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <a
                    className="docs-brand-subtitle"
                    href={brandRoute}
                    onClick={(event) => handleDocLinkClick(event, brandRoute)}
                  >
                    {publicCopy.brandSubtitle}
                  </a>
                </div>
                <button
                  aria-expanded
                  aria-label={sidebarToggleLabel}
                  className="docs-sidebar-icon-button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  title={sidebarToggleLabel}
                  type="button"
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>

              <label className="docs-search">
                <Search size={17} />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={publicCopy.searchPlaceholder}
                />
                <kbd>Ctrl</kbd>
                <kbd>K</kbd>
              </label>

              <nav className="docs-nav" aria-label="文档导航">
              {visibleGroups.map((group) => {
                  const isExpanded = normalizedQuery
                    ? true
                    : expandedNavGroups.has(group.category);

                  return (
                    <section className="docs-nav-group" key={group.category}>
                      <button
                        aria-expanded={isExpanded}
                        className={`docs-nav-heading ${
                          selectedDoc.category === group.category ? "active" : ""
                        }`}
                        onClick={() => toggleNavGroup(group.category)}
                        type="button"
                      >
                        <span>{group.category}</span>
                        <ChevronRight className="docs-nav-chevron" size={15} />
                      </button>

                      <div
                        aria-hidden={!isExpanded}
                        className={`docs-nav-children ${isExpanded ? "is-expanded" : ""}`}
                      >
                        <div className="docs-nav-children-inner">
                          {group.docs.map((doc) => (
                            <a
                              className={`docs-nav-link ${
                                normalizeRoute(doc.route) === normalizeRoute(selectedDoc.route)
                                  ? "active"
                                  : ""
                              }`}
                              href={doc.route}
                              key={doc.id}
                              onClick={(event) => handleDocLinkClick(event, doc.route)}
                            >
                              {doc.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    </section>
                  );
                })}
              </nav>
              <div className="docs-language-select" ref={languageMenuRef}>
                {isLanguageMenuOpen && (
                  <div className="docs-language-menu" role="listbox" aria-label="Choose a language">
                    <span className="docs-language-menu-title">Choose a language</span>
                    {docLocales.map((locale) => (
                      <button
                        aria-selected={currentLocale === locale.code}
                        className={`docs-language-option ${
                          currentLocale === locale.code ? "active" : ""
                        }`}
                        key={locale.code}
                        onClick={() => {
                          setIsLanguageMenuOpen(false);
                          switchPublicLocale(locale.code);
                        }}
                        role="option"
                        type="button"
                      >
                        {locale.label}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  aria-expanded={isLanguageMenuOpen}
                  aria-haspopup="listbox"
                  className="docs-language-button"
                  onClick={() => {
                    setIsVersionMenuOpen(false);
                    setIsLanguageMenuOpen((open) => !open);
                  }}
                  type="button"
                >
                  <Languages size={16} strokeWidth={1.8} />
                  <span>{activeLocale.label}</span>
                  <ChevronDown size={15} strokeWidth={1.8} />
                </button>
              </div>
            </div>
          )}
        </aside>

        <article className="docs-article" id="nd-page">
          <div className="docs-breadcrumb">
            <a
              href={moduleRootRoute(selectedDoc.category, publicDocs)}
              onClick={(event) =>
                handleDocLinkClick(event, moduleRootRoute(selectedDoc.category, publicDocs))
              }
            >
              {selectedDoc.category}
            </a>
            {!isDocsHomePath(selectedDoc.route) && (
              <>
                <ChevronRight size={14} />
                <span>{selectedDoc.title}</span>
              </>
            )}
          </div>
          <h1>{selectedDoc.title}</h1>
          <p className="docs-summary">{selectedDoc.summary}</p>
          <SupplementalVisuals doc={selectedDoc} />
          <div
            ref={docsContentRef}
            className="docs-content rich-document"
            dangerouslySetInnerHTML={{ __html: anchoredContent }}
            onClick={handleContentClick}
            onErrorCapture={handleUploadedImageError}
          />
        </article>

        <aside className="docs-toc" aria-label="当前页面目录">
          <div className="docs-toc-title">
            <List size={16} />
            <strong>{publicCopy.tocLabel}</strong>
          </div>
          {supplementalTocItems.map((section) => (
            <a href={`#${section.id}`} key={section.id}>
              {section.heading}
            </a>
          ))}
          {tocItems.map((section) => (
            <a href={`#${section.id}`} key={section.id}>
              {section.heading}
            </a>
          ))}
        </aside>
      </main>
      {lightboxImage && (
        <ImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  );
}

function PreviewDialog({
  doc,
  docs,
  onClose,
}: {
  doc: DocPage;
  docs: DocPage[];
  onClose: () => void;
}) {
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null);
  const previewContent = useMemo(() => docContentWithAnchors(doc, docs).html, [doc, docs]);
  const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
    const image = lightboxImageFromTarget(event.target);
    if (!image) return;

    event.preventDefault();
    setLightboxImage(image);
  };

  return (
    <div className="preview-overlay" role="dialog" aria-modal="true">
      <div className="preview-dialog">
        <div className="preview-dialog-head">
          <div>
            <span>发布预览</span>
            <strong>{doc.title}</strong>
          </div>
          <div className="preview-dialog-actions">
            <a
              className="secondary-button"
              href={`data:text/html;charset=utf-8,${encodeURIComponent(
                buildStaticPreviewHtml(doc)
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              <Globe2 size={16} />
              新窗口
            </a>
            <button className="icon-button" title="关闭预览" onClick={onClose}>
              <X size={17} />
            </button>
          </div>
        </div>
        <article className="preview-page">
          <div className="preview-page-meta">
            {doc.category} · {doc.route} · v{doc.version}
          </div>
          <h1>{doc.title}</h1>
          <p className="preview-page-summary">{doc.summary}</p>
          <SupplementalVisuals doc={doc} />
          <div
            className="preview-page-content rich-document"
            dangerouslySetInnerHTML={{
              __html: previewContent,
            }}
            onClick={handleContentClick}
            onErrorCapture={handleUploadedImageError}
          />
        </article>
      </div>
      {lightboxImage && (
        <ImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  );
}

function UploadLimitDialog({
  dialog,
  onClose,
}: {
  dialog: UploadLimitDialogState;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  const message =
    dialog.acceptedCount > 0
      ? "以下文件已跳过，其他文件会继续上传。"
      : "以下文件已跳过，请压缩后重新上传。";

  return (
    <div
      aria-modal="true"
      className="upload-limit-overlay"
      onClick={handleBackdropClick}
      role="dialog"
    >
      <section className="upload-limit-dialog">
        <div className="upload-limit-head">
          <span className="upload-limit-icon">
            <AlertTriangle size={22} />
          </span>
          <div>
            <span>上传文件过大</span>
            <strong>请压缩后再上传</strong>
          </div>
          <button className="icon-button" onClick={onClose} title="关闭" type="button">
            <X size={17} />
          </button>
        </div>
        <p>{message}</p>
        <div className="upload-limit-list">
          {dialog.files.map((file) => (
            <div className="upload-limit-file" key={`${file.name}-${file.size}`}>
              <strong>{file.name}</strong>
              <span>
                当前 {formatFileSize(file.size)}，上限 {formatFileSize(file.limit)}
              </span>
            </div>
          ))}
        </div>
        <button className="primary-button" onClick={onClose} type="button">
          知道了
        </button>
      </section>
    </div>
  );
}

function ImageLightbox({
  image,
  onClose,
}: {
  image: LightboxImage;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div
      aria-label={image.alt}
      aria-modal="true"
      className="image-lightbox"
      onClick={handleBackdropClick}
      role="dialog"
    >
      <button className="image-lightbox-close" onClick={onClose} title="关闭预览" type="button">
        <X size={20} />
      </button>
      <img src={image.src} alt={image.alt} />
    </div>
  );
}

function handleUploadedImageError(event: SyntheticEvent<Element>) {
  if (event.target instanceof HTMLImageElement) {
    retryUploadedImageLoad(event.target);
  }
}

function RichTextCanvas({
  content,
  docs,
  isMediaDragging,
  isUploadingMedia,
  onChange,
  onImageOpen,
  onMediaDragChange,
  onMediaDrop,
  onReady,
}: {
  content: string;
  docs: DocPage[];
  isMediaDragging: boolean;
  isUploadingMedia: boolean;
  onChange: (html: string) => void;
  onImageOpen: (image: LightboxImage) => void;
  onMediaDragChange: (active: boolean) => void;
  onMediaDrop: (files: File[]) => void;
  onReady: (editor: Editor | null) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        link: false,
      }),
      NavigationLink.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Image.configure({
        allowBase64: true,
      }),
      VideoEmbed,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "开始编辑文档内容...",
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "rich-document",
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getHTML());
    },
  });

  useEffect(() => {
    onReady(editor);
    return () => onReady(null);
  }, [editor, onReady]);

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers = [350, 1800, 5000].map((delay) =>
      window.setTimeout(() => refreshBrokenUploadedImages(canvasRef.current), delay)
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [content, editor]);

  function dragHasFiles(event: ReactDragEvent<HTMLDivElement>) {
    return dragDataHasFiles(event.dataTransfer);
  }

  function handleDragEnter(event: ReactDragEvent<HTMLDivElement>) {
    if (!dragHasFiles(event)) return;

    event.preventDefault();
    event.stopPropagation();
    onMediaDragChange(true);
  }

  function handleDragOver(event: ReactDragEvent<HTMLDivElement>) {
    if (!dragHasFiles(event)) return;

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    onMediaDragChange(true);
  }

  function handleDragLeave(event: ReactDragEvent<HTMLDivElement>) {
    if (
      event.currentTarget.contains(event.relatedTarget as Node | null) ||
      isUploadingMedia
    ) {
      return;
    }

    onMediaDragChange(false);
  }

  function handleDrop(event: ReactDragEvent<HTMLDivElement>) {
    if (!dragHasFiles(event)) return;

    event.preventDefault();
    event.stopPropagation();
    onMediaDragChange(false);
    onMediaDrop(Array.from(event.dataTransfer.files));
  }

  function handleContentClick(event: MouseEvent<HTMLDivElement>) {
    const image = lightboxImageFromTarget(event.target);
    if (!image) return;

    event.preventDefault();
    event.stopPropagation();
    onImageOpen(image);
  }

  return (
    <div
      ref={canvasRef}
      className={`rich-canvas ${isMediaDragging || isUploadingMedia ? "media-drop-active" : ""}`}
      onClickCapture={handleContentClick}
      onDragEnterCapture={handleDragEnter}
      onDragLeaveCapture={handleDragLeave}
      onDragOverCapture={handleDragOver}
      onDropCapture={handleDrop}
      onErrorCapture={handleUploadedImageError}
    >
      <EditorToolbar docs={docs} editor={editor} />
      <div className="paper-shell">
        <EditorContent editor={editor} />
      </div>
      {(isMediaDragging || isUploadingMedia) && (
        <div className="media-drop-overlay">
          <Upload size={22} />
          <strong>{isUploadingMedia ? "正在上传媒体" : "松开即可上传并插入"}</strong>
          <span>支持图片、mp4、webm、mov</span>
        </div>
      )}
    </div>
  );
}

function MediaManagerPanel({
  assets,
  draft,
  helper,
  icon,
  kind,
  title,
  onAdd,
  onDraftChange,
  onInsert,
  onRemove,
}: {
  assets: VisibleMediaAsset[];
  draft: MediaDraft;
  helper?: string;
  icon: React.ReactNode;
  kind: MediaType;
  title: string;
  onAdd: () => void;
  onDraftChange: (patch: Partial<MediaDraft>) => void;
  onInsert: (asset: DocMediaAsset) => void;
  onRemove: (assetId: string) => void;
}) {
  const urlLabel = kind === "image" ? "图片地址" : "视频地址";
  const emptyText = kind === "video" ? "暂无演示视频" : "暂无界面示例";

  return (
    <section className={`media-panel ${kind === "video" ? "video-manager" : ""}`}>
      <div className="panel-title">
        {icon}
        {title}
      </div>
      {helper && <p className="media-helper">{helper}</p>}
      <div className="media-list">
        {assets.map((asset) => (
          <article className="media-card" key={asset.id}>
            <div className="media-thumb">
              {asset.type === "image" ? (
                <img
                  src={mediaDisplayUrl(asset)}
                  alt={asset.title}
                  onError={handleUploadedImageError}
                />
              ) : (
                <Video size={24} />
              )}
            </div>
            <div className="media-card-body">
              <strong>{asset.title}</strong>
              <small>{asset.caption || asset.url}</small>
              <div className="media-card-actions">
                <button onClick={() => onInsert(asset)}>插入</button>
                {asset.source === "saved" && (
                  <button onClick={() => onRemove(asset.id)}>移除</button>
                )}
              </div>
            </div>
          </article>
        ))}
        {!assets.length && <p className="empty-copy">{emptyText}</p>}
      </div>
      <div className="media-form">
        <label>
          标题
          <input
            placeholder={kind === "image" ? "例如：登录界面" : "例如：登录流程演示"}
            value={draft.title}
            onChange={(event) => onDraftChange({ title: event.target.value })}
          />
        </label>
        <label>
          {urlLabel}
          <input
            placeholder={kind === "image" ? "https://.../image.png" : "https://.../demo.mp4"}
            value={draft.url}
            onChange={(event) => onDraftChange({ url: event.target.value })}
          />
        </label>
        <label>
          说明
          <input
            placeholder={kind === "image" ? "补充这张图展示什么" : "补充这段视频演示什么"}
            value={draft.caption}
            onChange={(event) => onDraftChange({ caption: event.target.value })}
          />
        </label>
        <button className="wide-action" onClick={onAdd}>
          <Plus size={16} />
          添加{title}
        </button>
      </div>
    </section>
  );
}

function EditorToolbar({ docs, editor }: { docs: DocPage[]; editor: Editor | null }) {
  const [linkDialog, setLinkDialog] = useState<LinkDialogState | null>(null);
  const docLinkGroups = useMemo(
    () =>
      moduleCategoryNames(docs).map((category) => ({
        category,
        docs: docs.filter((doc) => doc.category === category),
      })),
    [docs]
  );

  if (!editor) {
    return <div className="rich-toolbar" />;
  }

  const activeEditor = editor;

  function openLinkDialog() {
    const previous = activeEditor.getAttributes("link").href as string | undefined;
    const route = docRouteFromLinkHref(previous, docs);
    const selection = activeEditor.state.selection;
    setLinkDialog({
      href: previous ?? "",
      route,
      selection: {
        from: selection.from,
        to: selection.to,
      },
    });
  }

  function updateLinkDialogRoute(route: string) {
    setLinkDialog((current) => {
      if (!current) return current;
      return {
        ...current,
        route,
        href: route ? productionUrlForDocRoute(route) : current.href,
      };
    });
  }

  function updateLinkDialogHref(href: string) {
    setLinkDialog((current) => {
      if (!current) return current;
      return {
        ...current,
        href,
        route: docRouteFromLinkHref(href, docs),
      };
    });
  }

  function applyLinkDialog() {
    if (!linkDialog) return;

    const chain = activeEditor
      .chain()
      .focus()
      .setTextSelection(linkDialog.selection)
      .extendMarkRange("link");
    const href = linkDialog.href.trim();

    if (!href) {
      chain.unsetLink().run();
    } else {
      chain.setLink({ href }).run();
    }

    setLinkDialog(null);
  }

  function closeLinkDialog() {
    setLinkDialog(null);
    activeEditor.chain().focus().run();
  }

  function addImage() {
    const url = window.prompt("输入图片地址", "https://");
    if (!url?.trim()) return;
    activeEditor.chain().focus().setImage({ src: url.trim(), alt: "文档图片" }).run();
  }

  return (
    <div className="rich-toolbar">
      <div className="tool-group">
        <ToolButton
          label="正文"
          active={activeEditor.isActive("paragraph")}
          onClick={() => activeEditor.chain().focus().setParagraph().run()}
        >
          正文
        </ToolButton>
        <ToolButton
          label="二级标题"
          active={activeEditor.isActive("heading", { level: 2 })}
          onClick={() => activeEditor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={17} />
        </ToolButton>
        <ToolButton
          label="三级标题"
          active={activeEditor.isActive("heading", { level: 3 })}
          onClick={() => activeEditor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={17} />
        </ToolButton>
      </div>

      <div className="tool-group">
        <ToolButton
          label="加粗"
          active={activeEditor.isActive("bold")}
          onClick={() => activeEditor.chain().focus().toggleBold().run()}
        >
          <Bold size={17} />
        </ToolButton>
        <ToolButton
          label="斜体"
          active={activeEditor.isActive("italic")}
          onClick={() => activeEditor.chain().focus().toggleItalic().run()}
        >
          <Italic size={17} />
        </ToolButton>
        <ToolButton
          label="删除线"
          active={activeEditor.isActive("strike")}
          onClick={() => activeEditor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={17} />
        </ToolButton>
        <ToolButton
          label="行内代码"
          active={activeEditor.isActive("code")}
          onClick={() => activeEditor.chain().focus().toggleCode().run()}
        >
          <Code size={17} />
        </ToolButton>
      </div>

      <div className="tool-group">
        <ToolButton
          label="无序列表"
          active={activeEditor.isActive("bulletList")}
          onClick={() => activeEditor.chain().focus().toggleBulletList().run()}
        >
          <List size={17} />
        </ToolButton>
        <ToolButton
          label="有序列表"
          active={activeEditor.isActive("orderedList")}
          onClick={() => activeEditor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={17} />
        </ToolButton>
        <ToolButton
          label="引用"
          active={activeEditor.isActive("blockquote")}
          onClick={() => activeEditor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={17} />
        </ToolButton>
      </div>

      <div className="tool-group">
        <ToolButton
          label="左对齐"
          active={activeEditor.isActive({ textAlign: "left" })}
          onClick={() => activeEditor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft size={17} />
        </ToolButton>
        <ToolButton
          label="居中"
          active={activeEditor.isActive({ textAlign: "center" })}
          onClick={() => activeEditor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter size={17} />
        </ToolButton>
        <ToolButton
          label="右对齐"
          active={activeEditor.isActive({ textAlign: "right" })}
          onClick={() => activeEditor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight size={17} />
        </ToolButton>
      </div>

      <div className="tool-group">
        <ToolButton label="链接" active={activeEditor.isActive("link")} onClick={openLinkDialog}>
          <Link2 size={17} />
        </ToolButton>
        <ToolButton
          label="取消链接"
          onClick={() => activeEditor.chain().focus().extendMarkRange("link").unsetLink().run()}
        >
          <Unlink size={17} />
        </ToolButton>
        <ToolButton label="图片" onClick={addImage}>
          <ImagePlus size={17} />
        </ToolButton>
      </div>

      {linkDialog && (
        <div
          className="link-dialog"
          role="dialog"
          aria-label="编辑链接"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeLinkDialog();
            }

            if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
              event.preventDefault();
              applyLinkDialog();
            }
          }}
        >
          <label>
            内部页面
            <select
              value={linkDialog.route}
              onChange={(event) => updateLinkDialogRoute(event.target.value)}
            >
              <option value="">手动输入或外部链接</option>
              {docLinkGroups.map((group) => (
                <optgroup key={group.category} label={group.category}>
                  {group.docs.map((doc) => (
                    <option key={doc.id} value={doc.route}>
                      {doc.title} · {doc.route}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label>
            链接地址
            <input
              value={linkDialog.href}
              placeholder="选择内部页面后自动生成，也可粘贴外部链接"
              onChange={(event) => updateLinkDialogHref(event.target.value)}
            />
          </label>
          <div className="link-dialog-actions">
            <button type="button" onClick={closeLinkDialog}>
              取消
            </button>
            <button type="button" onClick={() => updateLinkDialogHref("")}>
              清空链接
            </button>
            <button type="button" className="primary" onClick={applyLinkDialog}>
              确定
            </button>
          </div>
        </div>
      )}

      <div className="tool-group">
        <ToolButton
          label="撤销"
          onClick={() => activeEditor.chain().focus().undo().run()}
          disabled={!activeEditor.can().undo()}
        >
          <Undo2 size={17} />
        </ToolButton>
        <ToolButton
          label="重做"
          onClick={() => activeEditor.chain().focus().redo().run()}
          disabled={!activeEditor.can().redo()}
        >
          <Redo2 size={17} />
        </ToolButton>
        <ToolButton
          label="清除格式"
          onClick={() => activeEditor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <Eraser size={17} />
        </ToolButton>
      </div>
    </div>
  );
}

function ToolButton({
  active,
  children,
  disabled,
  label,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`tool-button ${active ? "active" : ""}`}
      disabled={disabled}
      title={label}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: DocStatus }) {
  return <span className={`status-badge ${status}`}>{statusLabels[status]}</span>;
}

export default App;
