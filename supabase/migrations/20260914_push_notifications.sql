-- ==============================================================================
-- MIGRATION: REAL PUSH NOTIFICATIONS FOR PRANATA GATRA
-- Platform: Supabase PostgreSQL (Idempotent & Safe)
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- 2. TABLE: push_tokens
-- Stores Expo Push Tokens per user, supporting multiple devices per user,
-- preventing duplicates, and ensuring strict RLS.
create table if not exists public.push_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    token text not null unique,
    device_type text not null default 'android' check (device_type in ('android', 'ios', 'web')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Indexes for push_tokens
create index if not exists idx_push_tokens_user_id on public.push_tokens(user_id);
create index if not exists idx_push_tokens_token on public.push_tokens(token);

-- Enable RLS on push_tokens
alter table public.push_tokens enable row level security;

-- Drop existing policies if any to ensure idempotency
drop policy if exists "Users can view their own push tokens" on public.push_tokens;
drop policy if exists "Users can insert their own push tokens" on public.push_tokens;
drop policy if exists "Users can update their own push tokens" on public.push_tokens;
drop policy if exists "Users can delete their own push tokens" on public.push_tokens;

-- RLS Policies for push_tokens
create policy "Users can view their own push tokens"
    on public.push_tokens for select
    using (auth.uid() = user_id);

create policy "Users can insert their own push tokens"
    on public.push_tokens for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own push tokens"
    on public.push_tokens for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own push tokens"
    on public.push_tokens for delete
    using (auth.uid() = user_id);


-- 3. FUNCTION: register_push_token (Idempotent Token Upsert)
-- Ensures tokens are assigned to the currently authenticated user without duplicates.
create or replace function public.register_push_token(
    p_token text,
    p_device_type text default 'android'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        return jsonb_build_object('success', false, 'error', 'Unauthorized');
    end if;

    insert into public.push_tokens (user_id, token, device_type, updated_at)
    values (v_user_id, p_token, p_device_type, now())
    on conflict (token) do update
    set user_id = v_user_id,
        device_type = excluded.device_type,
        updated_at = now();

    return jsonb_build_object('success', true, 'token', p_token);
end;
$$;


-- 4. FUNCTION: unregister_push_token
-- Safely removes a push token on logout.
create or replace function public.unregister_push_token(
    p_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        return jsonb_build_object('success', false, 'error', 'Unauthorized');
    end if;

    delete from public.push_tokens
    where token = p_token and user_id = v_user_id;

    return jsonb_build_object('success', true);
end;
$$;


-- 5. TABLE: notification_logs (Anti-Duplicate / Idempotency)
-- Records notifications sent to users to prevent repeated/duplicate notifications.
create table if not exists public.notification_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    notification_type text not null,
    reference_id text not null,
    metadata jsonb default '{}'::jsonb,
    sent_at timestamptz not null default now(),
    constraint unique_user_notification_log unique(user_id, notification_type, reference_id)
);

create index if not exists idx_notification_logs_user_ref on public.notification_logs(user_id, notification_type, reference_id);

alter table public.notification_logs enable row level security;

drop policy if exists "Users can view their own notification logs" on public.notification_logs;
create policy "Users can view their own notification logs"
    on public.notification_logs for select
    using (auth.uid() = user_id);


-- 6. FUNCTION: get_upcoming_task_reminders
-- Returns pending tasks due within the next 24 hours that haven't received a reminder.
create or replace function public.get_upcoming_task_reminders()
returns table (
    task_id uuid,
    task_title text,
    task_deadline timestamptz,
    recipient_user_id uuid,
    workspace_id uuid,
    workspace_name text
)
language sql
security definer
set search_path = public
as $$
    select
        t.id as task_id,
        t.title as task_title,
        t.deadline::timestamptz as task_deadline,
        t.assigned_to as recipient_user_id,
        t.workspace_id as workspace_id,
        w.name as workspace_name
    from public.tasks t
    join public.workspaces w on w.id = t.workspace_id
    where t.deadline is not null
      and t.deadline::timestamptz >= now()
      and t.deadline::timestamptz <= (now() + interval '24 hours')
      and t.status != 'completed'
      and t.assigned_to is not null
      and not exists (
          select 1
          from public.notification_logs nl
          where nl.user_id = t.assigned_to
            and nl.notification_type = 'task_reminder'
            and nl.reference_id = t.id::text
      );
$$;


-- 7. FUNCTION: get_upcoming_schedule_reminders
-- Returns class schedules starting today within reminder window that haven't received a reminder.
create or replace function public.get_upcoming_schedule_reminders()
returns table (
    schedule_id uuid,
    subject_name text,
    start_time text,
    room text,
    lecturer text,
    workspace_id uuid,
    recipient_user_id uuid,
    reference_key text
)
language sql
security definer
set search_path = public
as $$
    select
        s.id as schedule_id,
        sub.name as subject_name,
        s.start_time as start_time,
        sub.room as room,
        sub.lecturer as lecturer,
        s.workspace_id as workspace_id,
        wm.user_id as recipient_user_id,
        (s.id::text || '_' || current_date::text) as reference_key
    from public.schedules s
    join public.subjects sub on sub.id = s.subject_id
    join public.workspace_members wm on wm.workspace_id = s.workspace_id
    where s.start_date::date = current_date
      and coalesce(s.reminder_enabled, true) = true
      and not exists (
          select 1
          from public.notification_logs nl
          where nl.user_id = wm.user_id
            and nl.notification_type = 'schedule_reminder'
            and nl.reference_id = (s.id::text || '_' || current_date::text)
      );
$$;
