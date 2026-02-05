'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SearchBar({ initialQuery }: { initialQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery ?? searchParams.get('q') ?? '');

  return (
    <form
      className="flex w-full max-w-xl items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const next = query.trim();
        router.push(next ? `/search?q=${encodeURIComponent(next)}` : '/search');
      }}
    >
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search messages, notes, files, announcements"
      />
      <Button type="submit" variant="secondary">
        Search
      </Button>
    </form>
  );
}
