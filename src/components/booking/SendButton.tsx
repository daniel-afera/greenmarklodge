import { Arrow } from "@/components/ui/ButtonLink";

export default function SendButton({ sending, label = "Send request" }: { sending: boolean; label?: string }) {
  return (
    <button type="submit" disabled={sending} className="btn btn-ink">
      {sending && <span className="h-3.5 w-3.5 animate-[spin_.8s_linear_infinite] rounded-full border border-current border-t-transparent" aria-hidden="true" />}
      <span>{sending ? "Sending…" : label}</span>
      {!sending && <Arrow />}
    </button>
  );
}
