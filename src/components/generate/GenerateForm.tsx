import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CharacterCounter from './CharacterCounter';

interface GenerateFormProps {
  onSubmit: (inputText: string) => Promise<void>;
  isLoading: boolean;
}

export default function GenerateForm({ onSubmit, isLoading }: GenerateFormProps) {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const characterCount = inputText.length;
  const isValid = characterCount >= 1000 && characterCount <= 10000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) {
      setError('Tekst musi mieć między 1000 a 10000 znaków');
      return;
    }
    
    setError(null);
    await onSubmit(inputText);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="input-text">
          Wklej tekst do wygenerowania fiszek
        </Label>
        <Textarea
          id="input-text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
          className="min-h-[200px] w-full lg:w-3/5"
          placeholder="Wklej tutaj tekst (1000-10000 znaków)..."
        />
        <CharacterCounter count={characterCount} max={10000} />
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
      
      <Button type="submit" disabled={!isValid || isLoading}>
        {isLoading ? 'Generuję...' : 'Generuj'}
      </Button>
    </form>
  );
}
