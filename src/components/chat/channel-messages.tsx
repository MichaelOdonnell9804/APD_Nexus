'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Markdown } from '@/components/markdown/markdown';
import { cn } from '@/lib/utils';

const EMOJI_OPTIONS = ['👍', '✅', '🧪', '📌', '👀'];

interface Reaction {
  emoji: string;
  user_id: string;
}

interface MessageItem {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  reply_to_id: string | null;
  thread_root_id: string | null;
  is_pinned: boolean;
  profiles: { full_name: string | null } | null;
  message_reactions: Reaction[];
}

interface ChannelMessagesProps {
  channelId: string;
  currentUserId: string;
  initialMessages: MessageItem[];
}

export function ChannelMessages({ channelId, currentUserId, initialMessages }: ChannelMessagesProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const normalize = (message: MessageItem | any): MessageItem => ({
    ...message,
    profiles: Array.isArray(message.profiles) ? message.profiles[0] ?? null : message.profiles ?? null,
    message_reactions: message.message_reactions ?? []
  });
  const [messages, setMessages] = useState<MessageItem[]>(() => initialMessages.map(normalize));
  const [composerValue, setComposerValue] = useState('');
  const [replyTarget, setReplyTarget] = useState<MessageItem | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select(
              'id, body, created_at, user_id, reply_to_id, thread_root_id, is_pinned, profiles(full_name), message_reactions(emoji, user_id)'
            )
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => {
              if (prev.some((msg) => msg.id === data.id)) return prev;
              return [...prev, normalize(data)].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, supabase]);

  const grouped = useMemo(() => {
    return messages;
  }, [messages]);

  const handleReaction = async (message: MessageItem, emoji: string) => {
    const existing = message.message_reactions.find(
      (reaction) => reaction.user_id === currentUserId && reaction.emoji === emoji
    );

    if (existing) {
      await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', message.id)
        .eq('user_id', currentUserId)
        .eq('emoji', emoji);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id
            ? {
                ...msg,
                message_reactions: msg.message_reactions.filter(
                  (reaction) => !(reaction.user_id === currentUserId && reaction.emoji === emoji)
                )
              }
            : msg
        )
      );
      return;
    }

    await supabase.from('message_reactions').insert({
      message_id: message.id,
      user_id: currentUserId,
      emoji
    });

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === message.id
          ? {
              ...msg,
              message_reactions: [...msg.message_reactions, { emoji, user_id: currentUserId }]
            }
          : msg
      )
    );
  };

  const handleSend = async () => {
    const body = composerValue.trim();
    if (!body) return;

    const replyToId = replyTarget?.id ?? null;
    const threadRootId = replyTarget?.thread_root_id ?? replyTarget?.id ?? null;

    setComposerValue('');
    setReplyTarget(null);

    await supabase.from('messages').insert({
      channel_id: channelId,
      user_id: currentUserId,
      body,
      reply_to_id: replyToId,
      thread_root_id: threadRootId
    });
  };

  const togglePin = async (message: MessageItem) => {
    const nextPinned = !message.is_pinned;
    await supabase.from('messages').update({ is_pinned: nextPinned }).eq('id', message.id);
    setMessages((prev) =>
      prev.map((msg) => (msg.id === message.id ? { ...msg, is_pinned: nextPinned } : msg))
    );
  };

  const renderReactions = (message: MessageItem) => {
    const counts = message.message_reactions.reduce<Record<string, number>>((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] ?? 0) + 1;
      return acc;
    }, {});

    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {EMOJI_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            className={cn(
              'rounded-full border px-2 py-0.5 text-xs transition-colors',
              counts[emoji] ? 'border-primary text-primary' : 'border-muted-foreground text-muted-foreground'
            )}
            onClick={() => handleReaction(message, emoji)}
          >
            {emoji} {counts[emoji] ?? 0}
          </button>
        ))}
      </div>
    );
  };

  const formatMentions = (body: string) =>
    body.replace(/(^|\s)@([\w.-]+)/g, '$1**@$2**');

  const loadMore = async () => {
    if (messages.length === 0) return;
    setIsLoadingMore(true);
    const oldest = messages[0];
    const { data } = await supabase
      .from('messages')
      .select(
        'id, body, created_at, user_id, reply_to_id, thread_root_id, is_pinned, profiles(full_name), message_reactions(emoji, user_id)'
      )
      .eq('channel_id', channelId)
      .lt('created_at', oldest.created_at)
      .order('created_at', { ascending: true })
      .limit(50);

    if (data && data.length > 0) {
      setMessages((prev) => [...data.map(normalize), ...prev]);
    }
    setIsLoadingMore(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-4 rounded-md border bg-card p-4">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading…' : 'Load older'}
          </Button>
        </div>
        {grouped.length > 0 ? (
          grouped.map((message) => (
            <div
              key={message.id}
              className={cn(
                'rounded-md border p-3 text-sm',
                message.reply_to_id ? 'ml-6 border-dashed bg-muted/50' : 'bg-background',
                message.is_pinned ? 'border-primary/50 bg-primary/5' : null
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{message.profiles?.full_name || 'Member'}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => togglePin(message)}>
                    {message.is_pinned ? 'Unpin' : 'Pin'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setReplyTarget(message)}>
                    Reply
                  </Button>
                </div>
              </div>
              <div className="mt-2">
                <Markdown content={formatMentions(message.body)} />
              </div>
              {renderReactions(message)}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        )}
      </div>

      <div className="rounded-md border bg-card p-4">
        {replyTarget ? (
          <div className="mb-2 text-xs text-muted-foreground">
            Replying to {replyTarget.profiles?.full_name || 'member'} •{' '}
            <button className="underline" onClick={() => setReplyTarget(null)}>
              Cancel
            </button>
          </div>
        ) : null}
        <div className="flex gap-2">
          <Input
            value={composerValue}
            onChange={(event) => setComposerValue(event.target.value)}
            placeholder="Write a message with markdown or LaTeX..."
          />
          <Button onClick={handleSend}>Send</Button>
        </div>
      </div>
    </div>
  );
}
