import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loader for flashcard item
 * Displayed while cards are loading
 */
export default function SkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </CardContent>
      <CardFooter className="flex items-center gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-24" />
      </CardFooter>
    </Card>
  );
}
