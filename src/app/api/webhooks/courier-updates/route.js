import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { applyTrackingUpdate } from "@/lib/shipping";
/**
 * Tracking updates pushed by Shiprocket (Panel → Settings → API → Webhooks).
 *
 * The path avoids "shiprocket", "sr" and "kr" because Shiprocket rejects
 * webhook URLs containing them. Requests must carry the security token set
 * in the panel as `x-api-key`, matching SHIPROCKET_WEBHOOK_TOKEN. Shiprocket
 * expects a 200 for every delivery, so anything we cannot match is logged
 * and acknowledged rather than refused.
 */
function tokenMatches(received) {
  const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  if (!expected) return true;
  const a = Buffer.from(String(received ?? ""));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  if (!tokenMatches(request.headers.get("x-api-key"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }
  const awb = body?.awb ? String(body.awb) : null;
  if (!awb) return NextResponse.json({ ok: true });
  try {
    const activities = (Array.isArray(body.scans) ? body.scans : []).map((scan) => ({
      date: scan.date,
      activity: scan.activity,
      location: scan.location,
      status: scan["sr-status-label"] && scan["sr-status-label"] !== "NA" ? scan["sr-status-label"] : scan.status,
    }));
    const order = await prisma.order.findFirst({ where: { trackingNumber: awb } });
    if (order) {
      await applyTrackingUpdate(order, {
        currentStatus: body.current_status || body.shipment_status,
        etd: body.etd,
        courierName: body.courier_name,
        activities,
      });
    } else {
      // A return's tracking only updates its status.
      const returning = await prisma.order.findFirst({ where: { returnAwb: awb } });
      if (returning) {
        await prisma.order.update({
          where: { id: returning.id },
          data: { returnStatus: String(body.current_status || body.shipment_status || returning.returnStatus) },
        });
      } else {
        console.warn(`[courier-updates] no order for AWB ${awb}`);
      }
    }
  } catch (error) {
    console.error("[courier-updates]", error);
  }
  return NextResponse.json({ ok: true });
}
