import { redirect } from "next/navigation";

/**
 * `/search` is where people type when they want to search, and where external
 * links point. The storefront's results live on /shop, which already has the
 * filters, sorting and pagination a results page needs — so this forwards
 * rather than duplicating them.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const term = typeof params.q === "string" ? params.q.trim() : "";
  redirect(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
}
