import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import { getGaleriImage } from "../lib/core.mts";

// GET /api/img/<id>?v=<versi> -> foto galeri (publik, di-cache lama karena URL berversi)
export default async (req: Request) => {
  const url = new URL(req.url);
  // id dari query (?id=) atau, bila redirect tidak mengisinya, dari segmen terakhir path
  let id = url.searchParams.get("id") ?? "";
  if (!id.startsWith("galeri_")) id = url.pathname.split("/").pop() ?? "";
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
