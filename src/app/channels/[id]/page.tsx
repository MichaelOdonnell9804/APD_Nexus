import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { ChannelMessages } from '@/components/chat/channel-messages';

export default async function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { data: channel } = await supabase
    .from('channels')
    .select('id, name, project_id, projects(slug, title)')
    .eq('id', id)
    .single();

  if (!channel) {
    notFound();
  }

  const project = Array.isArray(channel.projects) ? channel.projects[0] : channel.projects;

  const { data: messages } = await supabase
    .from('messages')
    .select(
      'id, body, created_at, user_id, reply_to_id, thread_root_id, is_pinned, profiles(full_name), message_reactions(emoji, user_id)'
    )
    .eq('channel_id', channel.id)
    .order('created_at', { ascending: true })
    .limit(50);

  const initialMessages = (messages ?? []).map((message) => ({
    ...message,
    profiles: Array.isArray(message.profiles) ? message.profiles[0] ?? null : message.profiles ?? null
  }));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          {channel.project_id ? (
            <Link href={`/projects/${project?.slug}`} className="underline">
              {project?.title}
            </Link>
          ) : (
            'Org channel'
          )}
        </p>
        <h1 className="text-2xl font-semibold">#{channel.name}</h1>
      </div>
      <ChannelMessages
        channelId={channel.id}
        currentUserId={profile.user_id}
        initialMessages={initialMessages}
      />
    </div>
  );
}
