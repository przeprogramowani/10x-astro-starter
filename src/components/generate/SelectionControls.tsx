import { Button } from "@/components/ui/button";

interface SelectionControlsProps {
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export default function SelectionControls({ onSelectAll, onDeselectAll }: SelectionControlsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" onClick={onSelectAll}>
        Zaznacz wszystkie
      </Button>
      <Button variant="secondary" size="sm" onClick={onDeselectAll}>
        Odznacz wszystkie
      </Button>
    </div>
  );
}
