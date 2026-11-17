import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import { handleRpc } from "../lib/core.mts";

export default async (req: Request) => {
  const store = getStore({ name: "rt09", consistency: "strong" });
  return handleRpc(req, store as never, {
    adminUsername: Netlify.env.get("ADMIN_USERNAME"),
    adminPassword: Netlify.env.get("ADMIN_PASSWORD"),
    cloudinaryCloud: Netlify.env.get("CLOUDINARY_CLOUD_NAME"),
    cloudinaryKey: Netlify.env.get("CLOUDINARY_API_KEY"),
    cloudinarySecret: Netlify.env.get("CLOUDINARY_API_SECRET"),
  });
};

export const config: Config = {
  method: "POST",
  rateLimit: {
    windowLimit: 120,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
