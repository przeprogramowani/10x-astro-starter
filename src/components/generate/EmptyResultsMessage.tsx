import { AlertCircle } from "lucide-react";

export default function EmptyResultsMessage() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">Nie udało się wygenerować fiszek</h3>
      <p className="text-muted-foreground">Spróbuj z innym tekstem lub zmień długość wejścia</p>
    </div>
  );
}
