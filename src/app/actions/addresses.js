"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addressSchema, fieldErrors } from "@/lib/validation";
export async function saveAddressAction(_prev, formData) {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Sign in to continue." };
  const parsed = addressSchema.safeParse({
    label: formData.get("label"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    line1: formData.get("line1"),
    line2: formData.get("line2"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country") || "India",
    phone: formData.get("phone"),
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }
  const id = formData.get("id");
  const data = {
    label: parsed.data.label || null,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName || "",
    line1: parsed.data.line1,
    line2: parsed.data.line2 || null,
    city: parsed.data.city,
    state: parsed.data.state,
    postalCode: parsed.data.postalCode,
    country: parsed.data.country,
    phone: parsed.data.phone,
    isDefault: parsed.data.isDefault,
  };
  if (parsed.data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });
  }
  if (typeof id === "string" && id) {
    // Scoped by userId so an id from another account cannot be edited.
    const owned = await prisma.address.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!owned) return { status: "error", message: "That address no longer exists." };
    await prisma.address.update({ where: { id: owned.id }, data });
  } else {
    const count = await prisma.address.count({ where: { userId: user.id } });
    if (count >= 10) {
      return {
        status: "error",
        message: "You've reached the limit of 10 saved addresses.",
      };
    }
    await prisma.address.create({
      data: { ...data, userId: user.id, isDefault: data.isDefault || count === 0 },
    });
  }
  revalidatePath("/account/addresses");
  return { status: "success", message: "Address saved." };
}
export async function deleteAddressAction(id) {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Sign in to continue." };
  const owned = await prisma.address.findFirst({
    where: { id, userId: user.id },
    select: { id: true, isDefault: true },
  });
  if (!owned) return { status: "error", message: "That address no longer exists." };
  await prisma.address.delete({ where: { id: owned.id } });
  // Promote another address so the account is never left without a default.
  if (owned.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (next) {
      await prisma.address.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }
  revalidatePath("/account/addresses");
  return { status: "success", message: "Address removed." };
}
