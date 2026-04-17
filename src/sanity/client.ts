import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "we7gfbcr",
  dataset: "production",
  apiVersion: "2026-04-17",
  useCdn: false,
});