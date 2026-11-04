"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { publishAll } from "@/cms/actions";

/** Global bar: "N unpublished changes · Publish all". */
export default function PublishAll({ count }: { count: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  if (!count && !message) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-ink text-ivory lg:left-64">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-10">
        <span role="status" className={`text-sm ${message && !message.ok ? "text-champagne" : ""}`}>
          {message?.text ?? `${count} unpublished change${count === 1 ? "" : "s"}`}
        </span>
        {count > 0 && (
          <button
            type="button"
            disabled={pending}
            className="btn btn-gold min-h-10 px-6"
            onClick={() =>
              start(async () => {
                const res = await publishAll();
                setMessage(res.ok ? { ok: true, text: `Published ${res.published} change${res.published === 1 ? "" : "s"}.` } : { ok: false, text: res.error });
                router.refresh();
              })
            }
          >
            <span>{pending ? "Publishing…" : "Publish all"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
