import { neon } from "@neondatabase/serverless";
import { handleAdminRequest } from "../../_lib/admin-handler.js";

function getAdminSubRoute(request) {
  const pathname = new URL(request.url).pathname;
  const match = pathname.match(/^\/api\/admin\/?(.*)$/);
  return match && match[1] ? match[1] : "data";
}

export async function onRequest(context) {
  const { request, env } = context;
  const sql = env.DATABASE_URL ? neon(env.DATABASE_URL) : null;
  const subRoute = getAdminSubRoute(request);
  return handleAdminRequest(context, sql, subRoute);
}
