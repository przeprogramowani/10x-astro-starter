/**
 * Character counter component with color coding
 * Shows current count vs max limit with visual feedback
 */

interface CharacterCounterProps {
  count: number;
  max: number;
}

export default function CharacterCounter({ count, max }: CharacterCounterProps) {
  const isOverLimit = count > max;
  const colorClass = isOverLimit ? 'text-red-600' : 'text-green-600';

  return (
    <span className={`text-sm text-muted-foreground ${colorClass}`}>
      {count} / {max}
    </span>
  );
}
