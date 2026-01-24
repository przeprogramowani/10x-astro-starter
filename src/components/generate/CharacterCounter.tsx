interface CharacterCounterProps {
  count: number;
  max: number;
}

export default function CharacterCounter({ count, max }: CharacterCounterProps) {
  const isValid = count >= 1000 && count <= max;
  const colorClass = isValid ? "text-green-600" : "text-red-600";

  return (
    <span className={`text-sm ${colorClass} mt-1 block`} aria-live="polite">
      {count} / {max}
    </span>
  );
}
