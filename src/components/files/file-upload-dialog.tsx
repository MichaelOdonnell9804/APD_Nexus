'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FileUploadDialogProps {
  projectId?: string | null;
  fileId?: string;
}

export function FileUploadDialog({ projectId, fileId }: FileUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const file = formData.get('file') as File | null;
      const tags = String(formData.get('tags') || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      if (!file) {
        setError('Select a file.');
        setIsUploading(false);
        return;
      }

      const res = await fetch('/api/files/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          name: file.name,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          tags,
          project_id: projectId ?? null,
          folder_path: '/'
        })
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to create upload URL');
      }

      const uploadRes = await fetch(payload.signed_url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: file
      });

      if (!uploadRes.ok) {
        throw new Error('Upload failed.');
      }

      setOpen(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={fileId ? 'outline' : 'default'}>{fileId ? 'New version' : 'Upload file'}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fileId ? 'Upload new version' : 'Upload file'}</DialogTitle>
          <DialogDescription>Files are stored in Supabase Storage with signed URLs.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpload} className="space-y-4">
          <Input type="file" name="file" required />
          {!fileId ? <Input type="text" name="tags" placeholder="tags (comma separated)" /> : null}
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <Button type="submit" disabled={isUploading}>
            {isUploading ? 'Uploading…' : 'Upload'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
