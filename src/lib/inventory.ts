import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

type Tx = Prisma.TransactionClient | PrismaClient;

/**
 * Stock lifecycle.
 *
 * Three states, and every order moves through them in order:
 *   reserve  — order placed. `reserved` rises; `onHand` is untouched, so the
 *              units stop being sellable without pretending they have shipped.
 *   commit   — order dispatched. `onHand` and `reserved` both fall.
 *   release  — order cancelled or payment failed. `reserved` falls back.
 *
 * Every transition writes an InventoryMovement, so the ledger explains the
 * current number rather than just asserting it.
 */

export type StockLine = { variantId: string; quantity: number };

export async function reserveStock(
  tx: Tx,
  lines: StockLine[],
  reference: string,
  actorId?: string | null,
): Promise<void> {
  for (const line of lines) {
    const inventory = await tx.inventory.findUnique({
      where: { variantId: line.variantId },
    });
    if (!inventory || !inventory.trackInventory) continue;

    const available = inventory.onHand - inventory.reserved;
    if (available < line.quantity) {
      throw new InsufficientStockError(line.variantId, Math.max(0, available));
    }

    await tx.inventory.update({
      where: { id: inventory.id },
      data: { reserved: { increment: line.quantity } },
    });
    await tx.inventoryMovement.create({
      data: {
        inventoryId: inventory.id,
        delta: -line.quantity,
        reason: "reservation",
        reference,
        actorId: actorId ?? null,
      },
    });
  }
}

export async function releaseStock(
  tx: Tx,
  lines: StockLine[],
  reference: string,
  actorId?: string | null,
): Promise<void> {
  for (const line of lines) {
    const inventory = await tx.inventory.findUnique({
      where: { variantId: line.variantId },
    });
    if (!inventory || !inventory.trackInventory) continue;

    await tx.inventory.update({
      where: { id: inventory.id },
      // Clamped so a double-release can never drive `reserved` negative.
      data: { reserved: Math.max(0, inventory.reserved - line.quantity) },
    });
    await tx.inventoryMovement.create({
      data: {
        inventoryId: inventory.id,
        delta: line.quantity,
        reason: "release",
        reference,
        actorId: actorId ?? null,
      },
    });
  }
}

export async function commitStock(
  tx: Tx,
  lines: StockLine[],
  reference: string,
  actorId?: string | null,
): Promise<void> {
  for (const line of lines) {
    const inventory = await tx.inventory.findUnique({
      where: { variantId: line.variantId },
    });
    if (!inventory || !inventory.trackInventory) continue;

    await tx.inventory.update({
      where: { id: inventory.id },
      data: {
        onHand: Math.max(0, inventory.onHand - line.quantity),
        reserved: Math.max(0, inventory.reserved - line.quantity),
      },
    });
    await tx.inventoryMovement.create({
      data: {
        inventoryId: inventory.id,
        delta: -line.quantity,
        reason: "sale",
        reference,
        actorId: actorId ?? null,
      },
    });
  }
}

/** Manual adjustment from the admin inventory screen. */
export async function adjustStock(input: {
  variantId: string;
  delta: number;
  reason: "restock" | "adjustment";
  reference?: string | null;
  actorId: string;
}): Promise<{ onHand: number }> {
  const inventory = await prisma.inventory.upsert({
    where: { variantId: input.variantId },
    create: { variantId: input.variantId, onHand: Math.max(0, input.delta) },
    update: {},
  });

  const next = Math.max(0, inventory.onHand + input.delta);

  const updated = await prisma.inventory.update({
    where: { id: inventory.id },
    data: { onHand: next },
  });

  await prisma.inventoryMovement.create({
    data: {
      inventoryId: inventory.id,
      delta: input.delta,
      reason: input.reason,
      reference: input.reference ?? null,
      actorId: input.actorId,
    },
  });

  return { onHand: updated.onHand };
}

export class InsufficientStockError extends Error {
  constructor(
    readonly variantId: string,
    readonly available: number,
  ) {
    super(
      available > 0
        ? `Only ${available} left in stock.`
        : "That item has just sold out.",
    );
    this.name = "InsufficientStockError";
  }
}

/** Sequential, human-readable, and unique: MT-YYMM-0001. */
export async function nextOrderNumber(): Promise<string> {
  const now = new Date();
  const prefix = `MT-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;

  const last = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  const sequence = last ? Number(last.orderNumber.split("-")[2] ?? 0) + 1 : 1;
  return `${prefix}-${String(sequence).padStart(4, "0")}`;
}
