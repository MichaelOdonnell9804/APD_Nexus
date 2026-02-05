'use client';

import { Button } from '@/components/ui/button';

interface FileRowActionsProps {
  fileId: string;
  currentName: string;
  currentTags: string[];
}

export function FileRowActions({ fileId, currentName, currentTags }: FileRowActionsProps) {
  const downloadFile = async () => {
    const res = await fetch('/api/files/download-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId })
    });
    const payload = await res.json();
    if (res.ok && payload.signed_url) {
      window.open(payload.signed_url, '_blank');
    }
  };

  const renameFile = async () => {
    const next = window.prompt('New file name', currentName);
    if (!next) return;
    await fetch('/api/files/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, name: next })
    });
    window.location.reload();
  };

  const tagFile = async () => {
    const next = window.prompt('Tags (comma separated)', currentTags.join(', '));
    if (next === null) return;
    const tags = next
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    await fetch('/api/files/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, tags })
    });
    window.location.reload();
  };

  const deleteFile = async () => {
    const confirmDelete = window.confirm('Soft delete this file?');
    if (!confirmDelete) return;
    await fetch('/api/files/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, deleted: true })
    });
    window.location.reload();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={downloadFile}>
        Download
      </Button>
      <Button variant="ghost" size="sm" onClick={renameFile}>
        Rename
      </Button>
      <Button variant="ghost" size="sm" onClick={tagFile}>
        Tag
      </Button>
      <Button variant="ghost" size="sm" onClick={deleteFile}>
        Delete
      </Button>
    </div>
  );
}
