import { getPublishStatus, sendJson } from "./_publish-utils.mjs";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  sendJson(res, 200, getPublishStatus());
}
