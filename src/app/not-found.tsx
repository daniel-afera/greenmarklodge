import ButtonLink from "@/components/ui/ButtonLink";

export default function NotFound() {
  return (
    <section className="flex min-h-svh flex-col items-center justify-center gap-8 bg-ink px-6 text-center text-ivory">
      <span className="eyebrow text-bronze-light">404</span>
      <h1 className="display text-[clamp(48px,7vw,110px)]">
        This path leads <em>into the mist</em>
      </h1>
      <ButtonLink href="/" variant="light">
        Return to the lodge
      </ButtonLink>
    </section>
  );
}
