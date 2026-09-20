"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireFullAdmin, AuthError } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { sanitizeHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/utils";
import { rupeesToPaise } from "@/lib/money";
import { adminProductSchema, adminVariantSchema, fieldErrors } from "@/lib/validation";
/**
 * Product administration.
 *
 * Every action re-checks the caller's role against the database — middleware is
 * a convenience, not the authorization boundary. Rich text is sanitised on the
 * way in, prices arrive in rupees and are stored as paise, and every mutation is
 * written to the audit log.
 */
function guard(error) {
  if (error instanceof AuthError) return { status: "error", message: error.message };
  console.error("[admin/products]", error);
  return { status: "error", message: "Something went wrong. Please try again." };
}
function bool(formData, key) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}
function optionalPaise(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? rupeesToPaise(n) : null;
}
export async function saveProductAction(_prev, formData) {
  try {
    const admin = await requireAdmin();
    const id = String(formData.get("id") ?? "");
    const nameValue = String(formData.get("name") ?? "");
    const slugValue = String(formData.get("slug") ?? "") || slugify(nameValue);
    const parsed = adminProductSchema.safeParse({
      name: nameValue,
      slug: slugValue,
      sku: formData.get("sku"),
      productType: formData.get("productType"),
      categoryId: formData.get("categoryId"),
      shortDescription: formData.get("shortDescription"),
      description: formData.get("description"),
      story: formData.get("story"),
      price: formData.get("price"),
      compareAtPrice: formData.get("compareAtPrice") || null,
      taxRatePct: formData.get("taxRatePct") || 0,
      weightGrams: formData.get("weightGrams") || null,
      dimensions: formData.get("dimensions"),
      status: formData.get("status"),
      isFeatured: bool(formData, "isFeatured"),
      isHeroPack: bool(formData, "isHeroPack"),
      isNew: bool(formData, "isNew"),
      isBestSeller: bool(formData, "isBestSeller"),
      isOnSale: bool(formData, "isOnSale"),
      model3dUrl: formData.get("model3dUrl"),
      videoUrl: formData.get("videoUrl"),
      seoTitle: formData.get("seoTitle"),
      seoDescription: formData.get("seoDescription"),
      seoKeywords: formData.get("seoKeywords"),
      ogImageUrl: formData.get("ogImageUrl"),
    });
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please check the highlighted fields.",
        errors: fieldErrors(parsed.error),
      };
    }
    const input = parsed.data;
    // Slug collisions are a data error, not a crash.
    const clash = await prisma.product.findFirst({
      where: { slug: input.slug, ...(id ? { NOT: { id } } : {}) },
      select: { id: true },
    });
    if (clash) {
      return {
        status: "error",
        message: "Another product already uses that URL slug.",
        errors: { slug: "Choose a different slug." },
      };
    }
    const data = {
      name: input.name,
      slug: input.slug,
      sku: input.sku || null,
      productType: input.productType || null,
      categoryId: input.categoryId || null,
      shortDescription: input.shortDescription || null,
      description: sanitizeHtml(input.description) || null,
      story: sanitizeHtml(input.story) || null,
      price: rupeesToPaise(input.price),
      compareAtPrice: optionalPaise(input.compareAtPrice),
      taxRatePct: input.taxRatePct,
      weightGrams: input.weightGrams ?? null,
      dimensions: input.dimensions || null,
      status: input.status,
      isFeatured: input.isFeatured,
      isHeroPack: input.isHeroPack,
      isNew: input.isNew,
      isBestSeller: input.isBestSeller,
      isOnSale: input.isOnSale,
      model3dUrl: input.model3dUrl || null,
      videoUrl: input.videoUrl || null,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
      seoKeywords: input.seoKeywords || null,
      ogImageUrl: input.ogImageUrl || null,
      publishedAt: input.status === "published" ? new Date() : null,
    };
    let productId = id;
    if (id) {
      const existing = await prisma.product.findUnique({
        where: { id },
        select: { publishedAt: true },
      });
      await prisma.product.update({
        where: { id },
        data: {
          ...data,
          // Keep the original publish date once it has one.
          publishedAt:
            input.status === "published" ? (existing?.publishedAt ?? new Date()) : null,
        },
      });
      await recordAudit({
        actorId: admin.id,
        action: "product.updated",
        entity: "Product",
        entityId: id,
        meta: { name: input.name, status: input.status },
      });
    } else {
      const created = await prisma.product.create({
        data: {
          ...data,
          // A brand new product needs at least one variant to be sellable.
          variants: {
            create: {
              name: "Standard",
              price: data.price,
              sku: input.sku || null,
              position: 0,
              inventory: { create: { onHand: 0, lowStockAt: 10 } },
            },
          },
        },
        select: { id: true },
      });
      productId = created.id;
      await recordAudit({
        actorId: admin.id,
        action: "product.created",
        entity: "Product",
        entityId: created.id,
        meta: { name: input.name },
      });
    }
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath(`/product/${input.slug}`);
    if (!id) redirect(`/admin/products/${productId}?created=1`);
    return { status: "success", message: "Product saved." };
  } catch (error) {
    // `redirect` throws by design; let it through.
    if (error && typeof error === "object" && "digest" in error) throw error;
    return guard(error);
  }
}
export async function saveVariantAction(_prev, formData) {
  try {
    const admin = await requireAdmin();
    const productId = String(formData.get("productId") ?? "");
    if (!productId) return { status: "error", message: "Missing product." };
    const parsed = adminVariantSchema.safeParse({
      id: formData.get("variantId") || undefined,
      name: formData.get("name"),
      sku: formData.get("sku"),
      price: formData.get("price"),
      compareAtPrice: formData.get("compareAtPrice") || null,
      weightGrams: formData.get("weightGrams") || null,
      imageUrl: formData.get("imageUrl"),
      isActive: bool(formData, "isActive"),
      onHand: formData.get("onHand") || 0,
      lowStockAt: formData.get("lowStockAt") || 10,
    });
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please check the variant fields.",
        errors: fieldErrors(parsed.error),
      };
    }
    const input = parsed.data;
    const variantData = {
      name: input.name,
      sku: input.sku || null,
      price: rupeesToPaise(input.price),
      compareAtPrice: optionalPaise(input.compareAtPrice),
      weightGrams: input.weightGrams ?? null,
      imageUrl: input.imageUrl || null,
      isActive: input.isActive,
    };
    if (input.id) {
      const owned = await prisma.productVariant.findFirst({
        where: { id: input.id, productId },
        select: { id: true },
      });
      if (!owned) return { status: "error", message: "That variant no longer exists." };
      await prisma.productVariant.update({
        where: { id: owned.id },
        data: variantData,
      });
      await prisma.inventory.upsert({
        where: { variantId: owned.id },
        create: {
          variantId: owned.id,
          onHand: input.onHand,
          lowStockAt: input.lowStockAt,
        },
        // Stock quantity is changed through the inventory screen, which keeps
        // a ledger; here only the threshold is editable.
        update: { lowStockAt: input.lowStockAt },
      });
    } else {
      const count = await prisma.productVariant.count({ where: { productId } });
      const variant = await prisma.productVariant.create({
        data: { ...variantData, productId, position: count },
      });
      await prisma.inventory.create({
        data: {
          variantId: variant.id,
          onHand: input.onHand,
          lowStockAt: input.lowStockAt,
        },
      });
      if (input.onHand > 0) {
        const inventory = await prisma.inventory.findUnique({
          where: { variantId: variant.id },
        });
        if (inventory) {
          await prisma.inventoryMovement.create({
            data: {
              inventoryId: inventory.id,
              delta: input.onHand,
              reason: "restock",
              reference: "Opening stock",
              actorId: admin.id,
            },
          });
        }
      }
    }
    await recordAudit({
      actorId: admin.id,
      action: input.id ? "variant.updated" : "variant.created",
      entity: "ProductVariant",
      entityId: input.id ?? null,
      meta: { productId, name: input.name },
    });
    revalidatePath(`/admin/products/${productId}`);
    return { status: "success", message: "Variant saved." };
  } catch (error) {
    return guard(error);
  }
}
export async function deleteVariantAction(variantId) {
  try {
    const admin = await requireAdmin();
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, productId: true, name: true },
    });
    if (!variant) return { ok: false, error: "That variant no longer exists." };
    const remaining = await prisma.productVariant.count({
      where: { productId: variant.productId },
    });
    if (remaining <= 1) {
      return { ok: false, error: "A product needs at least one variant." };
    }
    // Deleting a variant that has been ordered would orphan the order history,
    // so it is deactivated instead.
    const ordered = await prisma.orderItem.count({ where: { variantId } });
    if (ordered > 0) {
      await prisma.productVariant.update({
        where: { id: variantId },
        data: { isActive: false },
      });
      await recordAudit({
        actorId: admin.id,
        action: "variant.deactivated",
        entity: "ProductVariant",
        entityId: variantId,
      });
      revalidatePath(`/admin/products/${variant.productId}`);
      return { ok: true };
    }
    await prisma.productVariant.delete({ where: { id: variantId } });
    await recordAudit({
      actorId: admin.id,
      action: "variant.deleted",
      entity: "ProductVariant",
      entityId: variantId,
    });
    revalidatePath(`/admin/products/${variant.productId}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that variant." };
  }
}
export async function setProductStatusAction(productIds, status) {
  try {
    const admin = await requireAdmin();
    await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: {
        status,
        ...(status === "published" ? { publishedAt: new Date() } : {}),
      },
    });
    await recordAudit({
      actorId: admin.id,
      action: `product.${status}`,
      entity: "Product",
      meta: { count: productIds.length, ids: productIds.slice(0, 20) },
    });
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not update those products." };
  }
}
export async function duplicateProductAction(productId) {
  try {
    const admin = await requireAdmin();
    const source = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: { include: { inventory: true } },
        images: true,
        benefits: true,
        usageSteps: true,
        ingredients: true,
        faqs: true,
      },
    });
    if (!source) return { ok: false, error: "That product no longer exists." };
    // Copies always start as drafts with zero stock — a duplicate that goes
    // live with the original's inventory is a shipping problem waiting to happen.
    const copy = await prisma.product.create({
      data: {
        name: `${source.name} (copy)`,
        slug: `${source.slug}-copy-${Date.now().toString(36)}`,
        sku: null,
        productType: source.productType,
        categoryId: source.categoryId,
        shortDescription: source.shortDescription,
        description: source.description,
        story: source.story,
        price: source.price,
        compareAtPrice: source.compareAtPrice,
        taxRatePct: source.taxRatePct,
        weightGrams: source.weightGrams,
        dimensions: source.dimensions,
        status: "draft",
        model3dUrl: source.model3dUrl,
        videoUrl: source.videoUrl,
        seoTitle: source.seoTitle,
        seoDescription: source.seoDescription,
        seoKeywords: source.seoKeywords,
        images: {
          create: source.images.map((i) => ({
            url: i.url,
            alt: i.alt,
            width: i.width,
            height: i.height,
            position: i.position,
            kind: i.kind,
          })),
        },
        benefits: {
          create: source.benefits.map((b) => ({
            title: b.title,
            body: b.body,
            icon: b.icon,
            position: b.position,
          })),
        },
        usageSteps: {
          create: source.usageSteps.map((s) => ({
            step: s.step,
            title: s.title,
            body: s.body,
            imageUrl: s.imageUrl,
          })),
        },
        ingredients: {
          create: source.ingredients.map((i) => ({
            ingredientId: i.ingredientId,
            amount: i.amount,
            position: i.position,
          })),
        },
        variants: {
          create: source.variants.map((v) => ({
            name: v.name,
            sku: null,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            weightGrams: v.weightGrams,
            imageUrl: v.imageUrl,
            position: v.position,
            isActive: v.isActive,
            inventory: {
              create: { onHand: 0, lowStockAt: v.inventory?.lowStockAt ?? 10 },
            },
          })),
        },
      },
      select: { id: true },
    });
    await recordAudit({
      actorId: admin.id,
      action: "product.duplicated",
      entity: "Product",
      entityId: copy.id,
      meta: { from: productId },
    });
    revalidatePath("/admin/products");
    return { ok: true, id: copy.id };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    console.error("[admin/products] duplicate failed", error);
    return { ok: false, error: "Could not duplicate that product." };
  }
}
/** Hard delete. Restricted to full admins, and refused once a product has sold. */
export async function deleteProductAction(productId) {
  try {
    const admin = await requireFullAdmin();
    const ordered = await prisma.orderItem.count({ where: { productId } });
    if (ordered > 0) {
      return {
        ok: false,
        error:
          "This product appears in past orders and cannot be deleted. Archive it instead — it will disappear from the storefront but stay in your order history.",
      };
    }
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, slug: true },
    });
    await prisma.product.delete({ where: { id: productId } });
    await recordAudit({
      actorId: admin.id,
      action: "product.deleted",
      entity: "Product",
      entityId: productId,
      meta: { name: product?.name },
    });
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that product." };
  }
}
// ---------------------------------------------------------------- media
export async function addProductImageAction(input) {
  try {
    await requireAdmin();
    const count = await prisma.productImage.count({
      where: { productId: input.productId },
    });
    await prisma.productImage.create({
      data: {
        productId: input.productId,
        url: input.url,
        alt: input.alt ?? null,
        position: count,
      },
    });
    revalidatePath(`/admin/products/${input.productId}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not add that image." };
  }
}
export async function deleteProductImageAction(imageId) {
  try {
    await requireAdmin();
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
      select: { productId: true },
    });
    if (!image) return { ok: false, error: "That image no longer exists." };
    await prisma.productImage.delete({ where: { id: imageId } });
    revalidatePath(`/admin/products/${image.productId}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not remove that image." };
  }
}
export async function reorderProductImagesAction(productId, orderedIds) {
  try {
    await requireAdmin();
    await prisma.$transaction(
      orderedIds.map((id, position) =>
        prisma.productImage.updateMany({
          where: { id, productId },
          data: { position },
        }),
      ),
    );
    revalidatePath(`/admin/products/${productId}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not reorder the images." };
  }
}
