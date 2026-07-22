import {
  getConfig,
  getMissingConfig,
  readRequestJson,
  requireEditorSession,
  sendJson,
  syncDocsToGithub,
  triggerDeployHook,
} from "./_publish-utils.mjs";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  try {
    if (!requireEditorSession(req, res)) return;

    const config = getConfig();
    const missing = getMissingConfig(config);
    if (missing.length) {
      sendJson(res, 500, {
        ok: false,
        error: `缺少线上发布配置：${missing.join(", ")}`,
        missing,
      });
      return;
    }

    const payload = await readRequestJson(req);
    const docs = Array.isArray(payload.docs) ? payload.docs : [];
    if (!docs.length) {
      sendJson(res, 400, { ok: false, error: "No docs provided" });
      return;
    }

    const sourceSync = await syncDocsToGithub(docs, payload);
    const remote = await triggerDeployHook();

    sendJson(res, 200, {
      ok: true,
      publishedAt: payload.publishedAt || new Date().toISOString(),
      docCount: docs.length,
      productionUrl: config.productionUrl,
      sourceSync,
      remote,
    });
  } catch (error) {
    sendJson(res, error?.statusCode || 500, {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown publish error",
      details: error?.details,
    });
  }
}
