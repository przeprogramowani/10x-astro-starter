import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SuggestedCardDTO } from "@/types";

interface CardSuggestionItemProps {
  card: SuggestedCardDTO;
  index: number;
  isSelected: boolean;
  onSelectionChange: (index: number, selected: boolean) => void;
}

export default function CardSuggestionItem({ card, index, isSelected, onSelectionChange }: CardSuggestionItemProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onSelectionChange(index, checked as boolean)}
        className="mt-1"
      />
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>{card.front}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{card.back}</p>
        </CardContent>
      </Card>
    </div>
  );
}
