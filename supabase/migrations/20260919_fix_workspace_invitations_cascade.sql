-- ==============================================================================
-- MIGRATION: FIX WORKSPACE INVITATIONS, CASCADE DELETE, MEMBERSHIP & LEAVE
-- Platform: Supabase PostgreSQL (Idempotent & Safe)
-- ==============================================================================

-- 1. CLEANUP DUPLICATE MEMBERS & ADD UNIQUE CONSTRAINT ON workspace_members
-- Hapus duplikat anggota jika ada sebelum menambahkan constraint unique
delete from public.workspace_members a using public.workspace_members b
where a.id < b.id
  and a.workspace_id = b.workspace_id
  and a.user_id = b.user_id;

alter table public.workspace_members
drop constraint if exists unique_workspace_member;

alter table public.workspace_members
drop constraint if exists workspace_members_workspace_id_user_id_key;

alter table public.workspace_members
add constraint unique_workspace_member unique (workspace_id, user_id);

create index if not exists idx_workspace_members_user_id on public.workspace_members(user_id);
create index if not exists idx_workspace_members_workspace_id on public.workspace_members(workspace_id);


-- 2. SECURE & IDEMPOTENT RPC: accept_workspace_invitation
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
    v_existing_member record;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        return jsonb_build_object('success', false, 'error', 'Unauthorized: User is not authenticated.');
    end if;

    -- Ambil email user secara komprehensif (JWT email -> auth.users -> public.profiles)
    v_user_email := lower(trim(coalesce(
        auth.jwt() ->> 'email',
        (select email from auth.users where id = v_user_id),
        (select email from public.profiles where id = v_user_id),
        ''
    )));

    if v_user_email = '' then
        return jsonb_build_object('success', false, 'error', 'Email pengguna tidak ditemukan.');
    end if;

    -- Ambil data undangan berdasarkan ID
    select * into v_invitation
    from public.workspace_invitations
    where id = p_invitation_id;

    if not found then
        return jsonb_build_object('success', false, 'error', 'Undangan tidak ditemukan atau sudah tidak berlaku.');
    end if;

    -- Verifikasi bahwa email penerima cocok dengan user yang login (case-insensitive & trimmed)
    if lower(trim(v_invitation.invitee_email)) != v_user_email then
        return jsonb_build_object('success', false, 'error', 'Email undangan tidak cocok dengan akun Anda.');
    end if;

    -- Cek apakah sudah pernah diterima sebelumnya (Idempotency)
    select * into v_existing_member
    from public.workspace_members
    where workspace_id = v_invitation.workspace_id
      and user_id = v_user_id;

    if v_invitation.status = 'accepted' and found then
        return jsonb_build_object(
            'success', true,
            'workspace_id', v_invitation.workspace_id,
            'message', 'Undangan sudah diterima sebelumnya.'
        );
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
        coalesce(v_invitation.role, 'editor'),
        now()
    )
    on conflict (workspace_id, user_id)
    do update set
        role = coalesce(excluded.role, public.workspace_members.role),
        joined_at = now();

    -- Perbarui status undangan menjadi accepted
    update public.workspace_invitations
    set status = 'accepted',
        accepted_at = now()
    where id = v_invitation.id;

    return jsonb_build_object(
        'success', true,
        'workspace_id', v_invitation.workspace_id
    );
end;
$$;


-- 3. SECURE RPC: leave_workspace (Non-owners can leave, owners cannot)
create or replace function public.leave_workspace(
    p_workspace_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_is_owner boolean;
    v_is_member boolean;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        return jsonb_build_object('success', false, 'error', 'Unauthorized: User is not authenticated.');
    end if;

    -- Periksa apakah user adalah owner
    select (owner_id = v_user_id) into v_is_owner
    from public.workspaces
    where id = p_workspace_id;

    if v_is_owner then
        return jsonb_build_object('success', false, 'error', 'Owner tidak dapat keluar dari workspace miliknya sendiri. Gunakan opsi Hapus Workspace.');
    end if;

    -- Periksa keanggotaan
    select exists (
        select 1 from public.workspace_members
        where workspace_id = p_workspace_id
          and user_id = v_user_id
    ) into v_is_member;

    if not v_is_member then
        return jsonb_build_object('success', false, 'error', 'Anda bukan anggota dari workspace ini.');
    end if;

    -- Hapus membership user
    delete from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = v_user_id;

    return jsonb_build_object('success', true, 'workspace_id', p_workspace_id);
end;
$$;


-- 4. RLS POLICIES FOR workspace_members (MEMBERSHIP & LEAVE)
alter table public.workspace_members enable row level security;

drop policy if exists "Members and owners can view workspace members" on public.workspace_members;
create policy "Members and owners can view workspace members"
    on public.workspace_members for select
    using (
        auth.uid() = user_id
        or auth.uid() in (select owner_id from public.workspaces where id = workspace_id)
        or exists (
            select 1 from public.workspace_members wm
            where wm.workspace_id = public.workspace_members.workspace_id
              and wm.user_id = auth.uid()
        )
    );

drop policy if exists "Workspace owners can insert members" on public.workspace_members;
create policy "Workspace owners can insert members"
    on public.workspace_members for insert
    with check (
        auth.uid() in (select owner_id from public.workspaces where id = workspace_id)
        or auth.uid() = user_id
    );

drop policy if exists "Workspace owners can update members" on public.workspace_members;
create policy "Workspace owners can update members"
    on public.workspace_members for update
    using (
        auth.uid() in (select owner_id from public.workspaces where id = workspace_id)
    );

drop policy if exists "Owners can remove members or members can leave" on public.workspace_members;
create policy "Owners can remove members or members can leave"
    on public.workspace_members for delete
    using (
        auth.uid() = user_id
        or auth.uid() in (select owner_id from public.workspaces where id = workspace_id)
    );


-- 5. RLS POLICIES FOR workspace_invitations
alter table public.workspace_invitations enable row level security;

drop policy if exists "Invitees and owners can view invitations" on public.workspace_invitations;
create policy "Invitees and owners can view invitations"
    on public.workspace_invitations for select
    using (
        lower(trim(invitee_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
        or auth.uid() = inviter_id
        or auth.uid() in (select owner_id from public.workspaces where id = workspace_id)
    );

drop policy if exists "Invitees and owners can update invitations" on public.workspace_invitations;
create policy "Invitees and owners can update invitations"
    on public.workspace_invitations for update
    using (
        lower(trim(invitee_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
        or auth.uid() = inviter_id
        or auth.uid() in (select owner_id from public.workspaces where id = workspace_id)
    );


-- 6. FOREIGN KEY CONSTRAINTS WITH ON DELETE CASCADE FOR WORKSPACE CHILD TABLES
-- Tasks cascade
do $$
begin
    if exists (
        select 1 from information_schema.table_constraints
        where constraint_name = 'tasks_workspace_id_fkey' and table_name = 'tasks'
    ) then
        alter table public.tasks drop constraint tasks_workspace_id_fkey;
    end if;
    alter table public.tasks
        add constraint tasks_workspace_id_fkey
        foreign key (workspace_id) references public.workspaces(id)
        on delete cascade;
exception when others then
    null;
end $$;

-- Subjects cascade
do $$
begin
    if exists (
        select 1 from information_schema.table_constraints
        where constraint_name = 'subjects_workspace_id_fkey' and table_name = 'subjects'
    ) then
        alter table public.subjects drop constraint subjects_workspace_id_fkey;
    end if;
    alter table public.subjects
        add constraint subjects_workspace_id_fkey
        foreign key (workspace_id) references public.workspaces(id)
        on delete cascade;
exception when others then
    null;
end $$;

-- Subject Schedules cascade
do $$
begin
    if exists (
        select 1 from information_schema.table_constraints
        where constraint_name = 'subject_schedules_workspace_id_fkey' and table_name = 'subject_schedules'
    ) then
        alter table public.subject_schedules drop constraint subject_schedules_workspace_id_fkey;
    end if;
    alter table public.subject_schedules
        add constraint subject_schedules_workspace_id_fkey
        foreign key (workspace_id) references public.workspaces(id)
        on delete cascade;
exception when others then
    null;
end $$;

-- Workspace Members cascade
do $$
begin
    if exists (
        select 1 from information_schema.table_constraints
        where constraint_name = 'workspace_members_workspace_id_fkey' and table_name = 'workspace_members'
    ) then
        alter table public.workspace_members drop constraint workspace_members_workspace_id_fkey;
    end if;
    alter table public.workspace_members
        add constraint workspace_members_workspace_id_fkey
        foreign key (workspace_id) references public.workspaces(id)
        on delete cascade;
exception when others then
    null;
end $$;

-- Workspace Invitations cascade
do $$
begin
    if exists (
        select 1 from information_schema.table_constraints
        where constraint_name = 'workspace_invitations_workspace_id_fkey' and table_name = 'workspace_invitations'
    ) then
        alter table public.workspace_invitations drop constraint workspace_invitations_workspace_id_fkey;
    end if;
    alter table public.workspace_invitations
        add constraint workspace_invitations_workspace_id_fkey
        foreign key (workspace_id) references public.workspaces(id)
        on delete cascade;
exception when others then
    null;
end $$;


-- 7. DATABASE TRIGGER: VALIDATE TASK ASSIGNEE BELONGS TO WORKSPACE
create or replace function public.validate_task_assignee_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_is_owner boolean;
    v_is_member boolean;
begin
    if NEW.assigned_to is null then
        return NEW;
    end if;

    -- Periksa apakah assignee adalah pemilik workspace
    select exists (
        select 1 from public.workspaces
        where id = NEW.workspace_id and owner_id = NEW.assigned_to
    ) into v_is_owner;

    if v_is_owner then
        return NEW;
    end if;

    -- Periksa apakah assignee adalah member workspace
    select exists (
        select 1 from public.workspace_members
        where workspace_id = NEW.workspace_id and user_id = NEW.assigned_to
    ) into v_is_member;

    if not v_is_member then
        raise exception 'Assignee % bukan merupakan anggota atau pemilik dari workspace %.', NEW.assigned_to, NEW.workspace_id;
    end if;

    return NEW;
end;
$$;

drop trigger if exists trg_validate_task_assignee on public.tasks;
create trigger trg_validate_task_assignee
    before insert or update of assigned_to, workspace_id
    on public.tasks
    for each row
    execute function public.validate_task_assignee_membership();
