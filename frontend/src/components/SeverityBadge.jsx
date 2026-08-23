export default function SeverityBadge({ severity }) {
  if (!severity) return null;
  const upper = severity.toUpperCase();
  const lower = upper.toLowerCase();

  return (
    <span className={`severity-pill ${lower}`}>
      <span>●</span> {upper}
    </span>
  );
}
