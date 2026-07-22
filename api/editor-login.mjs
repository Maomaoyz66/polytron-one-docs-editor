import { createEditorSession, readRequestJson, sendJson } from "./_publish-utils.mjs";

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
    const payload = await readRequestJson(req);
    const session = createEditorSession(String(payload.password || ""));

    sendJson(res, 200, {
      ok: true,
      ...session,
    });
  } catch (error) {
    sendJson(res, 401, {
      ok: false,
      error: error instanceof Error ? error.message : "登录失败",
    });
  }
}
