import { handleAdminRequest } from "../../_lib/admin-handler.js";

/**
 * Jalur khusus Portal Admin.
 * Data & berkas disimpan di Telegraph Cloud — lihat functions/_lib/telegraph.js.
 */

function getAdminSubRoute(request) {
  const pathname = new URL(request.url).pathname;
  const match = pathname.match(/^\/api\/admin\/?(.*)$/);
  return match && match[1] ? match[1] : "data";
}

export async function onRequest(context) {
  return handleAdminRequest(context, getAdminSubRoute(context.request));
}
