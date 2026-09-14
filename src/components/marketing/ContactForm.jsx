"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input, Textarea, Select, FormMessage } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { contactAction } from "@/app/actions/marketing";
const INITIAL = { status: "idle" };
const TOPICS = [
  { value: "order", label: "An order" },
  { value: "product", label: "A product question" },
  { value: "distributor", label: "Becoming a distributor" },
  { value: "bulk", label: "Bulk or wholesale" },
  { value: "other", label: "Something else" },
];
export function ContactForm({ defaultTopic, defaultMessage }) {
  const [state, action] = useActionState(contactAction, INITIAL);
  if (state.status === "success") {
    return (
      <div className="border border-emerald-400/30 bg-emerald-500/8 p-8">
        <h2 className="text-title text-cream-50">Message sent</h2>
        <p className="mt-4 leading-relaxed text-leaf-200">{state.message}</p>
      </div>
    );
  }
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  return (
    <form action={action} className="grid gap-6">
      {state.status === "error" && !Object.keys(errors).length ? (
        <FormMessage>{state.message}</FormMessage>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          label="Your name"
          name="name"
          required
          autoComplete="name"
          error={errors.name}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          error={errors.email}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          label="Phone (optional)"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
        />
        <Select
          label="What's this about?"
          name="topic"
          options={TOPICS}
          defaultValue={defaultTopic ?? "order"}
        />
      </div>

      <Textarea
        label="Message"
        name="message"
        required
        rows={7}
        defaultValue={defaultMessage}
        placeholder="Tell us what you need. If it's about an order, include the order number."
        error={errors.message}
      />

      <Submit />

      <p className="text-xs leading-relaxed text-cream-400">
        We use what you send here only to answer you. Nothing is added to a marketing
        list unless you ask.
      </p>
    </form>
  );
}
function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="justify-self-start"
      loading={pending}
      magnetic
    >
      Send message
    </Button>
  );
}
