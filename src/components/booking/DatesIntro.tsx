/** Heading for the first booking step. Shared by the wizard and the server-rendered placeholder on /book. */
export default function DatesIntro() {
  return (
    <header>
      <h1 className="display mb-2 text-[clamp(36px,3.4vw,52px)]">
        When will you <em>arrive?</em>
      </h1>
      <p className="text-[15px] leading-[1.8] text-muted">Choose your dates and party. Nothing is charged — our team confirms availability with you directly.</p>
    </header>
  );
}
