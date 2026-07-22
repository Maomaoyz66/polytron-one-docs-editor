import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_REPO = "Maomaoyz66/polytron-one-docs-editor";
const DEFAULT_BRANCH = "main";
const DATA_PATH = "src/data.ts";
const MEDIA_UPLOAD_PATH = "public/media/polytron-one/uploads";
const MEDIA_PUBLIC_PATH = "/media/polytron-one/uploads";
const DOC_LOCALES = new Set(["zh", "en"]);
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MEDIA_EXTENSIONS = {
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "video/x-m4v": ".m4v",
};

export class PublishConflictError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PublishConflictError";
    this.statusCode = 409;
    this.details = details;
  }
}

export function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "POST, OPTIONS, GET");
  res.setHeader("access-control-allow-headers", "content-type, authorization");
  res.end(JSON.stringify(data, null, 2));
}

export function getConfig() {
  const repo = process.env.GITHUB_REPO || DEFAULT_REPO;
  const branch = process.env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const productionUrl = process.env.PRODUCTION_DOCS_URL || "https://polytron-one-docs.vercel.app/docs";
  const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL || "";
  const token = process.env.GITHUB_TOKEN || "";
  const editorPassword = process.env.EDITOR_PASSWORD || "";
  const editorSessionSecret = process.env.EDITOR_SESSION_SECRET || editorPassword;

  return {
    branch,
    deployHookUrl,
    editorPassword,
    editorSessionSecret,
    productionUrl,
    repo,
    token,
  };
}

export function getMissingConfig(config = getConfig()) {
  return [
    !config.token ? "GITHUB_TOKEN" : "",
    !config.repo ? "GITHUB_REPO" : "",
    !config.branch ? "GITHUB_BRANCH" : "",
    !config.editorPassword ? "EDITOR_PASSWORD" : "",
  ].filter(Boolean);
}

export function getPublishStatus() {
  const config = getConfig();
  const missing = getMissingConfig(config);

  return {
    ok: true,
    endpoint: "/api/publish-docs",
    productionUrl: config.productionUrl,
    remote: {
      connected: missing.length === 0,
      target: config.deployHookUrl
        ? "github-content-api+vercel-deploy-hook"
        : "github-content-api",
      missing,
    },
    auth: {
      required: true,
      configured: Boolean(config.editorPassword),
    },
  };
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function signSession(expiresAt, secret) {
  return createHmac("sha256", secret).update(String(expiresAt)).digest("base64url");
}

export function createEditorSession(password) {
  const config = getConfig();
  if (!config.editorPassword) {
    throw new Error("编辑器登录密码尚未配置：EDITOR_PASSWORD");
  }

  if (!safeCompare(password, config.editorPassword)) {
    throw new Error("密码不正确");
  }

  const expiresAt = Date.now() + SESSION_TTL_MS;
  return {
    expiresAt,
    token: `${expiresAt}.${signSession(expiresAt, config.editorSessionSecret)}`,
  };
}

export function verifyEditorSession(req) {
  const config = getConfig();
  if (!config.editorPassword) return false;

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const [expiresAtRaw, signature] = token.split(".");
  const expiresAt = Number(expiresAtRaw);

  if (!expiresAt || !signature || Date.now() > expiresAt) return false;

  const expectedSignature = signSession(expiresAt, config.editorSessionSecret);
  return safeCompare(signature, expectedSignature);
}

export function requireEditorSession(req, res) {
  const config = getConfig();
  if (!config.editorPassword) {
    sendJson(res, 500, {
      ok: false,
      error: "编辑器登录密码尚未配置：EDITOR_PASSWORD",
      missing: ["EDITOR_PASSWORD"],
    });
    return false;
  }

  if (!verifyEditorSession(req)) {
    sendJson(res, 401, {
      ok: false,
      error: "请先登录编辑器",
    });
    return false;
  }

  return true;
}

export async function readRequestJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function parseInitialDocsFromSource(source) {
  const marker = "export const initialDocs: DocPage[] = ";
  const start = source.indexOf(marker);
  if (start === -1) return [];

  const jsonStart = start + marker.length;
  const jsonEnd = source.lastIndexOf("\n];");
  if (jsonEnd === -1 || jsonEnd < jsonStart) return [];

  return JSON.parse(source.slice(jsonStart, jsonEnd + 2));
}

function hashText(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function docsSourceSignature(docs) {
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

function getPublishSourceConflict(existingDocs, payload) {
  const clientSignature = String(payload.sourceSignature || "");
  const currentSignature = docsSourceSignature(existingDocs);

  if (!clientSignature) {
    return {
      reason: "missing-client-signature",
      clientSignature: "",
      currentSignature,
    };
  }

  if (clientSignature === currentSignature) return null;

  return {
    reason: "stale-client-signature",
    clientSignature,
    currentSignature,
  };
}

function isLegacyMediaSection(section) {
  const id = String(section?.id || "");
  const heading = String(section?.heading || "").replace(/\s+/g, "").trim();

  return (
    id === "interface-examples" ||
    id === "demo-videos" ||
    heading === "界面示例" ||
    heading === "演示视频"
  );
}

function cleanSectionsForSource(doc) {
  const sections = Array.isArray(doc.sections) ? doc.sections : [];

  if (!String(doc.contentHtml || "").trim()) return sections;
  return sections.filter((section) => !isLegacyMediaSection(section));
}

function cleanMediaAssetsForSource(doc) {
  if (!Array.isArray(doc.mediaAssets)) return undefined;

  return doc.mediaAssets.map((asset) => ({
    id: asset.id,
    type: asset.type,
    title: asset.title,
    url: asset.url,
    ...(asset.caption ? { caption: asset.caption } : {}),
  }));
}

function cleanDocForSource(doc, publishedAt) {
  const cleaned = {
    id: doc.id,
    title: doc.title,
    route: doc.route,
    category: doc.category,
    status: "Published",
    owner: doc.owner,
    updatedAt: String(publishedAt || new Date().toISOString()).slice(0, 10),
    version: doc.version,
    readingTime: doc.readingTime,
    summary: doc.summary,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    coverImage: doc.coverImage,
    contentHtml: doc.contentHtml,
    mediaAssets: cleanMediaAssetsForSource(doc),
    sections: cleanSectionsForSource(doc),
  };

  return Object.fromEntries(Object.entries(cleaned).filter(([, value]) => value !== undefined));
}

function buildDataModule(docs) {
  const categories = Array.from(
    new Set(docs.map((doc) => doc.category).filter((category) => typeof category === "string"))
  );

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

export const categories = ${JSON.stringify(categories, null, 2)};

export const initialDocs: DocPage[] = ${JSON.stringify(docs, null, 2)};
`;
}

async function githubRequest(config, path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${config.token}`,
      "content-type": "application/json",
      "user-agent": "polytron-doc-publisher",
      "x-github-api-version": "2022-11-28",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body}`);
  }

  return response.json();
}

async function readDataSource(config) {
  const encodedPath = DATA_PATH.split("/").map(encodeURIComponent).join("/");
  const result = await githubRequest(
    config,
    `/repos/${config.repo}/contents/${encodedPath}?ref=${encodeURIComponent(config.branch)}`
  );

  return {
    sha: result.sha,
    source: Buffer.from(String(result.content || ""), "base64").toString("utf8"),
  };
}

async function writeDataSource(config, source, sha, message) {
  const encodedPath = DATA_PATH.split("/").map(encodeURIComponent).join("/");

  return githubRequest(config, `/repos/${config.repo}/contents/${encodedPath}`, {
    method: "PUT",
    body: JSON.stringify({
      branch: config.branch,
      content: Buffer.from(source, "utf8").toString("base64"),
      message,
      sha,
    }),
  });
}

function sanitizeFileBase(value) {
  return String(value || "media")
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "media";
}

function mediaTypeFromContentType(contentType) {
  if (String(contentType).startsWith("image/")) return "image";
  if (String(contentType).startsWith("video/")) return "video";
  return "";
}

function mediaTypeFromExtension(extension) {
  if ([".avif", ".gif", ".jpg", ".png", ".webp"].includes(extension)) return "image";
  if ([".m4v", ".mov", ".mp4", ".webm"].includes(extension)) return "video";
  return "";
}

function localeFromUploadPayload(payload) {
  const requestedLocale = String(payload.locale || "").toLowerCase();
  if (DOC_LOCALES.has(requestedLocale)) return requestedLocale;

  const route = String(payload.route || "");
  if (route === "/en/docs" || route.startsWith("/en/docs/")) return "en";
  return "zh";
}

function extensionForUpload(fileName, contentType) {
  const fromType = MEDIA_EXTENSIONS[String(contentType).toLowerCase()];
  if (fromType) return fromType;

  const match = String(fileName || "").toLowerCase().match(/\.(avif|gif|jpe?g|m4v|mov|mp4|png|webp)$/);
  return match ? `.${match[1] === "jpeg" ? "jpg" : match[1]}` : "";
}

function buildUploadAsset(payload) {
  const contentType = String(payload.contentType || "").toLowerCase();
  const extension = extensionForUpload(payload.fileName, contentType);
  const mediaType = mediaTypeFromContentType(contentType) || mediaTypeFromExtension(extension);

  if (!mediaType || !extension) {
    throw new Error("仅支持图片或视频文件。");
  }

  const dataBase64 = String(payload.dataBase64 || "").replace(/^data:[^,]+,/, "");
  if (!dataBase64) {
    throw new Error("文件内容为空。");
  }

  const originalName = String(payload.fileName || mediaType);
  const safeBase = sanitizeFileBase(originalName);
  const locale = localeFromUploadPayload(payload);
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8);
  const fileName = `${stamp}-${random}-${safeBase}${extension}`;
  const uploadPath = `${MEDIA_UPLOAD_PATH}/${locale}/${fileName}`;
  const url = `${MEDIA_PUBLIC_PATH}/${locale}/${fileName}`;
  const title = safeBase.replace(/[-_]+/g, " ").trim() || (mediaType === "image" ? "界面示例" : "演示视频");

  return {
    asset: {
      id: `${mediaType}-${stamp}-${random}`,
      type: mediaType,
      title,
      url,
      caption: title,
    },
    contentType,
    dataBase64,
    fileName,
    uploadPath,
    url,
  };
}

function uploadPreviewUrl(upload, config) {
  if (upload.asset.type !== "image") return undefined;

  return `data:${upload.contentType};base64,${upload.dataBase64}#polytron-src=${encodeURIComponent(
    upload.url
  )}`;
}

export async function uploadMediaToGithub(payload) {
  const config = getConfig();
  const missing = getMissingConfig(config);
  if (missing.length) {
    throw new Error(`缺少线上发布配置：${missing.join(", ")}`);
  }

  const upload = buildUploadAsset(payload);
  const encodedPath = upload.uploadPath.split("/").map(encodeURIComponent).join("/");
  const message = `Upload media ${upload.fileName}`;
  const result = await githubRequest(config, `/repos/${config.repo}/contents/${encodedPath}`, {
    method: "PUT",
    body: JSON.stringify({
      branch: config.branch,
      content: upload.dataBase64,
      message,
    }),
  });

  return {
    ok: true,
    asset: {
      ...upload.asset,
      previewUrl: uploadPreviewUrl(upload, config),
    },
    commitUrl: result.commit?.html_url,
    path: upload.uploadPath,
    previewUrl: uploadPreviewUrl(upload, config),
    url: upload.url,
  };
}

export async function syncDocsToGithub(publishedDocs, payload) {
  const config = getConfig();
  const missing = getMissingConfig(config);
  if (missing.length) {
    throw new Error(`缺少线上发布配置：${missing.join(", ")}`);
  }

  const { sha, source } = await readDataSource(config);
  const existingDocs = parseInitialDocsFromSource(source);
  const sourceConflict = getPublishSourceConflict(existingDocs, payload);
  const incomingDocs = publishedDocs.map((doc) => cleanDocForSource(doc, payload.publishedAt));
  const incomingById = new Map(incomingDocs.map((doc) => [doc.id, doc]));
  const shouldReplaceAllDocs = payload.scope === "all" && !sourceConflict;
  const mergedDocs =
    shouldReplaceAllDocs || !existingDocs.length
      ? incomingDocs
      : existingDocs.map((doc) => incomingById.get(doc.id) ?? doc);

  if (!shouldReplaceAllDocs) {
    for (const doc of incomingDocs) {
      if (!mergedDocs.some((existing) => existing.id === doc.id)) {
        mergedDocs.push(doc);
      }
    }
  }

  const nextSource = buildDataModule(mergedDocs);
  if (nextSource === source) {
    return {
      ok: true,
      changed: false,
      pushed: false,
      sourceConflict,
      message: "文档内容没有变化。",
    };
  }

  const commitMessage = `Publish docs ${String(payload.publishedAt || new Date().toISOString())}`;
  const result = await writeDataSource(config, nextSource, sha, commitMessage);

  return {
    ok: true,
    changed: true,
    pushed: true,
    sourceConflict,
    commitUrl: result.commit?.html_url,
    message: "文档内容已写回 GitHub。",
  };
}

export async function triggerDeployHook() {
  const { deployHookUrl } = getConfig();
  if (!deployHookUrl) {
    return {
      connected: true,
      target: "github-content-api",
      ok: true,
      message: "已写回 GitHub；Vercel 会根据 Git 提交自动部署。",
    };
  }

  const response = await fetch(deployHookUrl, { method: "POST" });
  return {
    connected: true,
    target: "github-content-api+vercel-deploy-hook",
    ok: response.ok,
    status: response.status,
    message: response.ok ? "已写回 GitHub，并触发 Vercel 重新部署。" : await response.text(),
  };
}
