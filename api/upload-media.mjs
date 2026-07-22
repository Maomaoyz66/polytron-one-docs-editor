import {
  getConfig,
  getMissingConfig,
  readRequestJson,
  requireEditorSession,
  sendJson,
  triggerDeployHook,
  uploadMediaToGithub,
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
        error: `缺少线上上传配置：${missing.join(", ")}`,
        missing,
      });
      return;
    }

    const payload = await readRequestJson(req);
    const upload = await uploadMediaToGithub(payload);
    const remote = await triggerDeployHook();

    sendJson(res, 200, {
      ...upload,
      remote,
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown upload error",
    });
  }
}
