"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Pill } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { deleteEnquiryAction, setEnquiryStatusAction } from "@/app/actions/admin/enquiries";
import { cn } from "@/lib/utils";
const TOPICS = {
  order: "An order",
  product: "Product question",
  distributor: "Becoming a distributor",
  bulk: "Bulk / wholesale",
  other: "Something else",
};
/** Contact-form messages with reply links and a handled toggle. */
export function EnquiryList({ enquiries }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [target, setTarget] = useState(null);
  const run = (id, action) => {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
      setBusyId(null);
      setTarget(null);
      router.refresh();
    });
  };
  return (
    <div className="grid gap-4">
      {error ? <p className="text-sm text-[#e0a19c]">{error}</p> : null}
      {enquiries.map((enquiry) => {
        const busy = pending && busyId === enquiry.id;
        const digits = (enquiry.phone ?? "").replace(/\D/g, "");
        const whatsapp = digits ? `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}` : null;
        const subject = encodeURIComponent(`Re: your message to MiracleTree`);
        return (
          <Card key={enquiry.id} className={cn(enquiry.status === "new" && "border-gold-400/40")}>
            <div className="grid gap-6 lg:grid-cols-[1fr_14rem]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={enquiry.status === "new" ? "warning" : "success"}>
                    {enquiry.status === "new" ? "New" : "Handled"}
                  </Pill>
                  {enquiry.topic ? <Pill tone="info">{TOPICS[enquiry.topic] ?? enquiry.topic}</Pill> : null}
                  <span className="text-xs text-cream-400">{enquiry.createdAt}</span>
                </div>
                <h3 className="mt-3 text-base text-cream-50">{enquiry.name}</h3>
                <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-cream-300">
                  <a href={`mailto:${enquiry.email}?subject=${subject}`} className="underline underline-offset-4 hover:text-cream-50">
                    {enquiry.email}
                  </a>
                  {enquiry.phone ? (
                    <a href={`tel:${enquiry.phone}`} className="underline underline-offset-4 hover:text-cream-50">
                      {enquiry.phone}
                    </a>
                  ) : null}
                </p>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-cream-200">{enquiry.message}</p>
              </div>
              <div className="grid content-start gap-2 lg:border-l lg:border-border-subtle lg:pl-6">
                <a
                  href={`mailto:${enquiry.email}?subject=${subject}`}
                  className="border border-border-strong px-3 py-2 text-center text-[0.68rem] uppercase tracking-[0.12em] text-cream-100 hover:border-gold-400"
                >
                  Reply by email
                </a>
                {whatsapp ? (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-border-strong px-3 py-2 text-center text-[0.68rem] uppercase tracking-[0.12em] text-cream-100 hover:border-gold-400"
                  >
                    WhatsApp
                  </a>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(enquiry.id, () =>
                      setEnquiryStatusAction(enquiry.id, enquiry.status === "new" ? "handled" : "new"),
                    )
                  }
                  className={cn(
                    "px-3 py-2 text-[0.68rem] uppercase tracking-[0.12em] transition-colors disabled:opacity-50",
                    enquiry.status === "new"
                      ? "bg-emerald-500 text-on-accent hover:bg-emerald-400"
                      : "border border-border-subtle text-cream-300 hover:text-cream-50",
                  )}
                >
                  {busy ? "Saving…" : enquiry.status === "new" ? "Mark handled" : "Mark as new"}
                </button>
                <button
                  type="button"
                  onClick={() => setTarget(enquiry)}
                  className="px-3 py-2 text-[0.68rem] uppercase tracking-[0.12em] text-cream-400 hover:text-[#e0a19c]"
                >
                  Delete
                </button>
              </div>
            </div>
          </Card>
        );
      })}
      <ConfirmDialog
        open={Boolean(target)}
        title="Delete this enquiry?"
        message={target ? `The message from ${target.name} will be removed for good.` : ""}
        confirmLabel="Delete"
        destructive
        loading={pending}
        onConfirm={() => target && run(target.id, () => deleteEnquiryAction(target.id))}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
