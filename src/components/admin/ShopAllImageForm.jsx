"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Card } from "@/components/admin/ui";
import { FormMessage } from "@/components/ui/Field";
import { ImageField } from "@/components/admin/ImageField";
import { saveSettingsAction } from "@/app/actions/admin/content";
/**
 * The picture in the homepage's "Shop all" circle. It belongs to no
 * category, so it is kept as a site setting (home.shopAllImage); without
 * one the circle shows a grid icon.
 */
export function ShopAllImageForm({ value }) {
  const [state, action] = useActionState(saveSettingsAction, { status: "idle" });
  return (
    <Card
      title="“Shop all” circle"
      description="The first circle in the homepage's Shop by category row. A lifestyle shot of the range works best; leave it empty for the grid icon."
    >
      <form action={action} className="grid gap-4">
        {state.status === "success" ? <FormMessage tone="success">Saved.</FormMessage> : null}
        {state.status === "error" ? <FormMessage>{state.message}</FormMessage> : null}
        <ImageField
          name="home.shopAllImage"
          label="Image"
          folder="categories"
          aspect="aspect-square"
          defaultValue={value ?? ""}
        />
        <div>
          <Save />
        </div>
      </form>
    </Card>
  );
}
function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-emerald-500 px-6 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-on-accent transition-colors hover:bg-emerald-400 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}
