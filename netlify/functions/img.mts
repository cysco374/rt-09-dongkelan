import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import { getGaleriImage } from "../lib/core.mts";

// GET /api/img/<id>?v=<versi> -> foto galeri (publik, di-cache lama karena URL berversi)
export default async (req: Request) => {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const store = getStore({ name: "rt09", consistency: "strong" });
  const img = await getGaleriImage(store as never, id);
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(img.data, {
    headers: {
      "content-type": img.ct,
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
};

export const config: Config = {
  method: "GET",
  rateLimit: {
    windowLimit: 300,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
