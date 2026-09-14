/** Product types, kept in one place so the filter labels and seed data agree. */
export const PRODUCT_TYPE_OPTIONS = [
  { label: "Powders & mixes", value: "mix" },
  { label: "Tablets & capsules", value: "supplement" },
  { label: "Teas", value: "tea" },
  { label: "Snacks & bars", value: "snack" },
  { label: "Oils & skin", value: "oil" },
];
export function buildFilterGroups(categories, collections, ingredients) {
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
    collections: collections.map((c) => ({ label: c.name, value: c.slug })),
  };
}
export function countActiveFilters(params) {
  const keys = [
    "category",
    "type",
    "ingredient",
    "collection",
    "availability",
    "offers",
  ];
  let count = keys.filter((key) => Boolean(params[key])).length;
  if (params.min || params.max) count += 1;
  return count;
}
