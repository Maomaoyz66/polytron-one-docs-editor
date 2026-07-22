import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const publishRoot = path.join(projectRoot, "published");
const mediaUploadRoot = path.join(projectRoot, "public", "media", "polytron-one", "uploads");
const mediaUploadPublicPath = "/media/polytron-one/uploads";
const docLocales = new Set(["zh", "en"]);
const execFileAsync = promisify(execFile);
const mediaExtensions = {
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

class PublishConflictError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PublishConflictError";
    this.statusCode = 409;
    this.details = details;
  }
}

loadLocalEnv(path.join(projectRoot, ".env"));

const port = Number(process.env.PUBLISH_SERVER_PORT || 8787);
const productionDocsUrl = process.env.PRODUCTION_DOCS_URL || "https://polytron-one-docs.vercel.app/docs";
const remotePublishEndpoint = process.env.REMOTE_PUBLISH_ENDPOINT || "";
const vercelDeployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL || "";

function loadLocalEnv(filePath) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function getPublishStatus() {
  const target = remotePublishEndpoint
    ? "remote-publish-endpoint"
    : vercelDeployHookUrl
      ? "vercel-deploy-hook"
      : "local-only";

  return {
    ok: true,
    endpoint: `http://127.0.0.1:${port}/api/publish-docs`,
    productionUrl: productionDocsUrl,
    remote: {
      connected: Boolean(remotePublishEndpoint || vercelDeployHookUrl),
      target,
    },
  };
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS, GET",
    "access-control-allow-headers": "content-type, authorization",
  });
  res.end(body);
}

function sanitizeSegment(segment) {
  return segment.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^-+|-+$/g, "") || "doc";
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
  if (docLocales.has(requestedLocale)) return requestedLocale;

  const route = String(payload.route || "");
  if (route === "/en/docs" || route.startsWith("/en/docs/")) return "en";
  return "zh";
}

function extensionForUpload(fileName, contentType) {
  const fromType = mediaExtensions[String(contentType).toLowerCase()];
  if (fromType) return fromType;

  const match = String(fileName || "").toLowerCase().match(/\.(avif|gif|jpe?g|m4v|mov|mp4|png|webp)$/);
  return match ? `.${match[1] === "jpeg" ? "jpg" : match[1]}` : "";
}

function buildUploadAsset(payload) {
  const contentType = String(payload.contentType || "").toLowerCase();
  const extension = extensionForUpload(payload.fileName, contentType);
  const mediaType = mediaTypeFromContentType(contentType) || mediaTypeFromExtension(extension);

  if (!mediaType || !extension) {
    throw new Error("Only image or video files are supported.");
  }

  const dataBase64 = String(payload.dataBase64 || "").replace(/^data:[^,]+,/, "");
  if (!dataBase64) {
    throw new Error("File content is empty.");
  }

  const safeBase = sanitizeFileBase(payload.fileName || mediaType);
  const locale = localeFromUploadPayload(payload);
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8);
  const fileName = `${stamp}-${random}-${safeBase}${extension}`;
  const url = `${mediaUploadPublicPath}/${locale}/${fileName}`;
  const title = safeBase.replace(/[-_]+/g, " ").trim() || (mediaType === "image" ? "界面示例" : "演示视频");

  return {
    asset: {
      id: `${mediaType}-${stamp}-${random}`,
      type: mediaType,
      title,
      url,
      caption: title,
    },
    buffer: Buffer.from(dataBase64, "base64"),
    contentType,
    fileName,
    relativePath: path.join("public", "media", "polytron-one", "uploads", locale, fileName),
    url,
  };
}

function uploadPreviewDataUrl(upload) {
  if (upload.asset.type !== "image") return undefined;

  return `data:${upload.contentType};base64,${upload.buffer.toString(
    "base64"
  )}#polytron-src=${encodeURIComponent(upload.url)}`;
}

function routeToPath(route) {
  return route
    .split("/")
    .filter(Boolean)
    .map(sanitizeSegment);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 90 * 1024 * 1024) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function writeDocFiles(releaseDir, doc) {
  const parts = routeToPath(doc.route || doc.id || "doc");
  const docDir = path.join(releaseDir, ...parts);
  await mkdir(docDir, { recursive: true });

  await writeFile(path.join(docDir, "index.html"), doc.previewHtml || "", "utf8");
  await writeFile(path.join(docDir, "content.md"), doc.markdown || "", "utf8");
  await writeFile(path.join(docDir, "doc.json"), JSON.stringify(doc, null, 2), "utf8");

  return {
    id: doc.id,
    title: doc.title,
    route: doc.route,
    html: `/${parts.join("/")}/index.html`,
    markdown: `/${parts.join("/")}/content.md`,
    json: `/${parts.join("/")}/doc.json`,
  };
}

function buildIndexHtml(payload, docs) {
  const items = docs
    .map(
      (doc) =>
        `<li><a href=".${doc.html}">${escapeHtml(doc.title || doc.route)}</a><span>${escapeHtml(
          doc.route || ""
        )}</span></li>`
    )
    .join("");

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>POLYTRON 文档发布</title>
    <style>
      body { margin: 0; font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif; color: #15201d; background: #f4f6f4; }
      main { max-width: 920px; margin: 0 auto; padding: 44px 24px; }
      h1 { margin: 0 0 10px; font-size: 34px; }
      p { color: #66736d; line-height: 1.7; }
      ul { display: grid; gap: 10px; padding: 0; list-style: none; }
      li { display: flex; justify-content: space-between; gap: 16px; padding: 14px; border: 1px solid #dfe5df; border-radius: 8px; background: #fff; }
      a { color: #087a74; font-weight: 800; text-decoration: none; }
      span { color: #66736d; font-size: 13px; }
    </style>
  </head>
  <body>
    <main>
      <h1>POLYTRON 文档发布</h1>
      <p>发布时间：${escapeHtml(payload.publishedAt || new Date().toISOString())}</p>
      <ul>${items}</ul>
    </main>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".md")) return "text/markdown; charset=utf-8";
  return "application/octet-stream";
}

function parseInitialDocsFromSource() {
  const dataPath = path.join(projectRoot, "src", "data.ts");
  if (!existsSync(dataPath)) return [];

  const source = readFileSync(dataPath, "utf8");
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

async function runGit(args) {
  return execFileAsync("git", args, {
    cwd: projectRoot,
    maxBuffer: 10 * 1024 * 1024,
  });
}

async function hasSourceChanges() {
  try {
    await runGit(["diff", "--quiet", "--", "src/data.ts"]);
    return false;
  } catch (error) {
    return true;
  }
}

async function syncDocsToSource(publishedDocs, payload, releaseId) {
  const dataPath = path.join(projectRoot, "src", "data.ts");
  const existingDocs = parseInitialDocsFromSource();
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

  await writeFile(dataPath, buildDataModule(mergedDocs), "utf8");

  if (!(await hasSourceChanges())) {
    return {
      ok: true,
      changed: false,
      pushed: false,
      sourceConflict,
      message: "No source changes to push.",
    };
  }

  await runGit(["add", "src/data.ts"]);
  await runGit(["commit", "-m", `Publish docs ${releaseId}`]);
  await runGit(["push"]);

  return {
    ok: true,
    changed: true,
    pushed: true,
    sourceConflict,
    message: "Updated docs source and pushed to GitHub.",
  };
}

async function servePublishedFile(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const relative = decodeURIComponent(url.pathname.replace(/^\/published\/?/, ""));
  const resolved = path.resolve(publishRoot, relative || "latest.json");

  if (!resolved.startsWith(path.resolve(publishRoot))) {
    sendJson(res, 403, { ok: false, error: "Forbidden" });
    return;
  }

  if (!existsSync(resolved)) {
    sendJson(res, 404, { ok: false, error: "Not found" });
    return;
  }

  const data = await readFile(resolved);
  res.writeHead(200, {
    "content-type": contentType(resolved),
    "access-control-allow-origin": "*",
  });
  res.end(data);
}

async function handlePublish(req, res) {
  const raw = await readBody(req);
  const payload = JSON.parse(raw);
  const docs = Array.isArray(payload.docs) ? payload.docs : [];

  if (!docs.length) {
    sendJson(res, 400, { ok: false, error: "No docs provided" });
    return;
  }

  const releaseId = new Date().toISOString().replace(/[:.]/g, "-");
  const releaseDir = path.join(publishRoot, releaseId);
  await mkdir(releaseDir, { recursive: true });

  const writtenDocs = [];
  for (const doc of docs) {
    writtenDocs.push(await writeDocFiles(releaseDir, doc));
  }

  await writeFile(path.join(releaseDir, "publish-package.json"), JSON.stringify(payload, null, 2), "utf8");
  await writeFile(path.join(releaseDir, "index.html"), buildIndexHtml(payload, writtenDocs), "utf8");

  let sourceSync;
  try {
    sourceSync = await syncDocsToSource(docs, payload, releaseId);
  } catch (error) {
    if (error?.statusCode === 409) {
      sendJson(res, 409, {
        ok: false,
        error: error.message,
        details: error.details,
      });
      return;
    }

    sourceSync = {
      ok: false,
      changed: false,
      pushed: false,
      message: error instanceof Error ? error.message : "GitHub source sync failed.",
    };
  }

  const remote = sourceSync.ok
    ? await triggerRemotePublish(payload)
    : {
        connected: Boolean(remotePublishEndpoint || vercelDeployHookUrl),
        target: "source-sync",
        ok: false,
        message: `GitHub source sync failed: ${sourceSync.message}`,
      };
  const latest = {
    ok: true,
    releaseId,
    publishedAt: payload.publishedAt || new Date().toISOString(),
    docCount: writtenDocs.length,
    docs: writtenDocs,
    previewUrl: `http://127.0.0.1:${port}/published/${releaseId}/index.html`,
    productionUrl: productionDocsUrl,
    sourceSync,
    remote,
  };
  await writeFile(path.join(publishRoot, "latest.json"), JSON.stringify(latest, null, 2), "utf8");

  sendJson(res, 200, latest);
}

async function handleMediaUpload(req, res) {
  const raw = await readBody(req);
  const payload = JSON.parse(raw);
  const upload = buildUploadAsset(payload);

  const targetPath = path.join(projectRoot, upload.relativePath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, upload.buffer);

  let sourceSync;
  try {
    await runGit(["add", upload.relativePath]);
    await runGit(["commit", "-m", `Upload media ${upload.fileName}`]);
    await runGit(["push"]);
    sourceSync = {
      ok: true,
      changed: true,
      pushed: true,
      message: "Uploaded media source and pushed to GitHub.",
    };
  } catch (error) {
    sourceSync = {
      ok: false,
      changed: true,
      pushed: false,
      message: error instanceof Error ? error.message : "GitHub media sync failed.",
    };
  }

  const remote = sourceSync.ok
    ? await triggerRemotePublish({ source: "polytron-doc-editor", action: "upload-media" })
    : {
        connected: Boolean(remotePublishEndpoint || vercelDeployHookUrl),
        target: "source-sync",
        ok: false,
        message: `GitHub media sync failed: ${sourceSync.message}`,
      };

  sendJson(res, 200, {
    ok: true,
    asset: {
      ...upload.asset,
      previewUrl: uploadPreviewDataUrl(upload),
    },
    path: upload.relativePath.replace(/\\/g, "/"),
    previewUrl: uploadPreviewDataUrl(upload),
    sourceSync,
    remote,
    url: upload.url,
  });
}

async function triggerRemotePublish(payload) {
  if (remotePublishEndpoint) {
    try {
      const response = await fetch(remotePublishEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      return {
        connected: true,
        target: "remote-publish-endpoint",
        ok: response.ok,
        status: response.status,
        message: response.ok
          ? "Production publish endpoint accepted the update."
          : await response.text(),
      };
    } catch (error) {
      return {
        connected: true,
        target: "remote-publish-endpoint",
        ok: false,
        message: error instanceof Error ? error.message : "Remote publish failed.",
      };
    }
  }

  if (vercelDeployHookUrl) {
    try {
      const response = await fetch(vercelDeployHookUrl, { method: "POST" });

      return {
        connected: true,
        target: "vercel-deploy-hook",
        ok: response.ok,
        status: response.status,
        message: response.ok
          ? "Vercel deploy hook triggered. The live site updates after Vercel finishes building from its connected source."
          : await response.text(),
      };
    } catch (error) {
      return {
        connected: true,
        target: "vercel-deploy-hook",
        ok: false,
        message: error instanceof Error ? error.message : "Vercel deploy hook failed.",
      };
    }
  }

  return {
    connected: false,
    ok: false,
    productionUrl: productionDocsUrl,
    message:
      "Production publishing is not connected. Set REMOTE_PUBLISH_ENDPOINT or VERCEL_DEPLOY_HOOK_URL on the publish server.",
  };
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      sendJson(res, 204, {});
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "POST" && url.pathname === "/api/publish-docs") {
      await handlePublish(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/upload-media") {
      await handleMediaUpload(req, res);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/publish-status") {
      sendJson(res, 200, getPublishStatus());
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/published")) {
      await servePublishedFile(req, res);
      return;
    }

    if (req.method === "GET" && url.pathname === "/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 404, { ok: false, error: "Not found" });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Publish server ready: http://127.0.0.1:${port}/api/publish-docs`);
});
