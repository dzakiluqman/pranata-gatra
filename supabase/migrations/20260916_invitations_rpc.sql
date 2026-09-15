-- ==============================================================================
-- MIGRATION: WORKSPACE INVITATION ACCEPT & DECLINE RPC FUNCTIONS
-- Platform: Supabase PostgreSQL
-- ==============================================================================

-- 1. FUNCTION: accept_workspace_invitation
-- Allows authenticated invitees to securely join the workspace without RLS blocks.
create or replace function public.accept_workspace_invitation(
    p_invitation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_user_email text;
    v_invitation record;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        return jsonb_build_object('success', false, 'error', 'Unauthorized');
    end if;

    -- Ambil email user dari auth.users
    select email into v_user_email from auth.users where id = v_user_id;

    -- Ambil data undangan
    select * into v_invitation
    from public.workspace_invitations
    where id = p_invitation_id
      and status = 'pending';

    if not found then
        return jsonb_build_object('success', false, 'error', 'Undangan tidak ditemukan atau sudah tidak berlaku.');
    end if;

    -- Verifikasi bahwa email penerima cocok dengan user yang login (case-insensitive)
    if lower(v_invitation.invitee_email) != lower(v_user_email) then
        return jsonb_build_object('success', false, 'error', 'Email undangan tidak cocok dengan akun Anda.');
    end if;

    -- Masukkan atau perbarui anggota di workspace_members
    insert into public.workspace_members (
        workspace_id,
        user_id,
        role,
        joined_at
    )
    values (
        v_invitation.workspace_id,
        v_user_id,
        coalesce(v_invitation.role, 'member'),
        now()
    )
    on conflict (workspace_id, user_id)
    do update set
        role = excluded.role,
        joined_at = now();

    -- Perbarui status undangan menjadi accepted
    update public.workspace_invitations
    set status = 'accepted',
        accepted_at = now()
    where id = v_invitation.id;

    return jsonb_build_object('success', true, 'workspace_id', v_invitation.workspace_id);
end;
$$;


-- 2. FUNCTION: decline_workspace_invitation
-- Allows authenticated invitees to decline their invitation securely.
create or replace function public.decline_workspace_invitation(
    p_invitation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_user_email text;
    v_invitation record;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        return jsonb_build_object('success', false, 'error', 'Unauthorized');
    end if;

    select email into v_user_email from auth.users where id = v_user_id;

    select * into v_invitation
    from public.workspace_invitations
    where id = p_invitation_id
      and status = 'pending';

    if not found then
        return jsonb_build_object('success', false, 'error', 'Undangan tidak ditemukan atau sudah diproses.');
    end if;

    if lower(v_invitation.invitee_email) != lower(v_user_email) then
        return jsonb_build_object('success', false, 'error', 'Email undangan tidak cocok dengan akun Anda.');
    end if;

    update public.workspace_invitations
    set status = 'declined'
    where id = v_invitation.id;

    return jsonb_build_object('success', true);
end;
$$;


-- 3. RLS POLICIES FOR INVITEE ACCESS TO workspace_invitations
-- Memastikan invitee dapat melihat dan mengupdate status undangan miliknya sendiri
alter table public.workspace_invitations enable row level security;

drop policy if exists "Invitees can view invitations sent to their email" on public.workspace_invitations;
create policy "Invitees can view invitations sent to their email"
    on public.workspace_invitations for select
    using (
        lower(invitee_email) = lower(auth.jwt() ->> 'email')
        or auth.uid() = inviter_id
    );

drop policy if exists "Invitees can update status of invitations sent to their email" on public.workspace_invitations;
create policy "Invitees can update status of invitations sent to their email"
    on public.workspace_invitations for update
    using (
        lower(invitee_email) = lower(auth.jwt() ->> 'email')
        or auth.uid() = inviter_id
    )
    with check (
        lower(invitee_email) = lower(auth.jwt() ->> 'email')
        or auth.uid() = inviter_id
    );
