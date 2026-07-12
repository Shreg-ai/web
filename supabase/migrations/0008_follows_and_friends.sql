-- Follows: one-directional, no approval needed (Instagram-style).
create table public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_no_self_follow check (follower_id != followee_id)
);

alter table public.follows enable row level security;

create policy "Anyone can view follows"
  on public.follows for select
  using (true);

create policy "Users can follow as themselves"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow their own follows"
  on public.follows for delete
  using (auth.uid() = follower_id);

create index follows_follower_idx on public.follows (follower_id);
create index follows_followee_idx on public.follows (followee_id);

-- Friend requests: mutual, requires acceptance (Facebook-style). A row with
-- status 'accepted' represents an active friendship; 'pending' is an
-- outstanding request from requester_id to recipient_id.
create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friend_requests_no_self check (requester_id != recipient_id),
  constraint friend_requests_unique_pair unique (requester_id, recipient_id)
);

alter table public.friend_requests enable row level security;

create policy "Participants can view their friend requests"
  on public.friend_requests for select
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "Users can send friend requests as themselves"
  on public.friend_requests for insert
  with check (auth.uid() = requester_id);

create policy "Recipient can respond to a pending request"
  on public.friend_requests for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

create policy "Participants can delete a request or friendship"
  on public.friend_requests for delete
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

create index friend_requests_requester_idx on public.friend_requests (requester_id);
create index friend_requests_recipient_idx on public.friend_requests (recipient_id);
