import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { ChannelMessages } from '@/components/chat/channel-messages';

export default async function ChannelPage({ params }: { params: { id: string } }) {
  const { profile } = await requireProfile();
  const supabase = createSupabaseServerClient();

  const { data: channel } = await supabase
    .from('channels')
    .select('id, name, project_id, projects(slug, title)')
    .eq('id', params.id)
    .single();

  if (!channel) {
    notFound();
  }

  const { data: messages } = await supabase
    .from('messages')
    .select(
      'id, body, created_at, user_id, reply_to_id, thread_root_id, is_pinned, profiles(full_name), message_reactions(emoji, user_id)'
    )
    .eq('channel_id', channel.id)
    .order('created_at', { ascending: true })
    .limit(50);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          {channel.project_id ? (
            <Link href={`/projects/${channel.projects?.slug}`} className="underline">
              {channel.projects?.title}
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
        initialMessages={messages ?? []}
      />
    </div>
  );
}
