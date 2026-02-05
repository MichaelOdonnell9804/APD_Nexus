'use client';

import { useState } from 'react';
import { Markdown } from '@/components/markdown/markdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface NoteEditorProps {
  noteId: string;
  initialContent: string;
  onSave: (content: string) => Promise<void>;
}

export function NoteEditor({ noteId, initialContent, onSave }: NoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(content);
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[320px]"
          />
        </div>
        <div className="rounded-md border bg-background p-4">
          <Markdown content={content || 'Start typing to preview markdown.'} />
        </div>
      </div>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  );
}
