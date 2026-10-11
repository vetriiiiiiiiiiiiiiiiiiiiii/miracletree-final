/** Product types, kept in one place so the filter labels and seed data agree. */
export const PRODUCT_TYPE_OPTIONS = [
  { label: "Powders & mixes", value: "mix" },
  { label: "Tablets & capsules", value: "supplement" },
  { label: "Teas", value: "tea" },
  { label: "Snacks & bars", value: "snack" },
  { label: "Oils & skin", value: "oil" },
];

export async function getProductTypes(prismaClient) {
  try {
    const db = prismaClient || (await import("@/lib/prisma")).prisma;
    const [deletedSetting, customSetting] = await Promise.all([
      db.siteSetting.findUnique({ where: { key: "deleted_product_types" } }),
      db.siteSetting.findUnique({ where: { key: "custom_product_types" } }),
    ]);
    let deleted = [];
    let custom = [];
    if (deletedSetting?.value) {
      try {
        deleted = JSON.parse(deletedSetting.value);
      } catch {}
    }
    if (customSetting?.value) {
      try {
        custom = JSON.parse(customSetting.value);
      } catch {}
    }
    const combined = [...PRODUCT_TYPE_OPTIONS, ...custom];
    const uniqueMap = new Map();
    for (const item of combined) {
      if (!deleted.includes(item.value) && !uniqueMap.has(item.value)) {
        uniqueMap.set(item.value, item);
      }
    }
    return Array.from(uniqueMap.values());
  } catch {
    return PRODUCT_TYPE_OPTIONS;
  }
}
export function buildFilterGroups(categories, ingredients) {
  return {
    categories: categories.map((c) => ({
      label: c.name,
      value: c.slug,
      count: c._count.products,
    })),
    types: PRODUCT_TYPE_OPTIONS,
    ingredients: ingredients
      .filter((i) => i._count.products > 0)
      .map((i) => ({ label: i.name, value: i.slug, count: i._count.products })),
  };
}
export function countActiveFilters(params) {
  const keys = ["category", "type", "ingredient", "availability", "offers"];
  let count = keys.filter((key) => Boolean(params[key])).length;
  if (params.min || params.max) count += 1;
  return count;
}
