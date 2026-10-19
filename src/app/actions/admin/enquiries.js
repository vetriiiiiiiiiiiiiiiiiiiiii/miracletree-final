"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireFullAdmin, AuthError } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
const ID = /^[0-9a-fA-F]{24}$/;
/** Marks a contact-form enquiry handled, or back to new. */
export async function setEnquiryStatusAction(id, status) {
  try {
    const admin = await requireAdmin();
    if (!ID.test(id) || !["new", "handled"].includes(status))
      return { ok: false, error: "Invalid request." };
    await prisma.enquiry.update({
      where: { id },
      data: { status, handledAt: status === "handled" ? new Date() : null },
    });
    await recordAudit({ actorId: admin.id, action: `enquiry.${status}`, entity: "Enquiry", entityId: id });
    revalidatePath("/admin/enquiries");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not update that enquiry." };
  }
}
/** Deletes an enquiry for good (full admins only). */
export async function deleteEnquiryAction(id) {
  try {
    const admin = await requireFullAdmin();
    if (!ID.test(id)) return { ok: false, error: "Invalid request." };
    await prisma.enquiry.delete({ where: { id } });
    await recordAudit({ actorId: admin.id, action: "enquiry.deleted", entity: "Enquiry", entityId: id });
    revalidatePath("/admin/enquiries");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that enquiry." };
  }
}
