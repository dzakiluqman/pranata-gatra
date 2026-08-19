import { supabase } from '@/lib/supabase';

import type {
    CreateWorkspaceInput,
    UpdateWorkspaceInput,
    Workspace,
} from '../types/workspace.types';

type WorkspaceRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from('workspaces')
    .select(
      `
        id,
        owner_id,
        name,
        description,
        created_at,
        updated_at
      `,
    )
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data as WorkspaceRow[]).map(mapWorkspace);
}

export async function getWorkspaceById(
  workspaceId: string,
): Promise<Workspace> {
  const { data, error } = await supabase
    .from('workspaces')
    .select(
      `
        id,
        owner_id,
        name,
        description,
        created_at,
        updated_at
      `,
    )
    .eq('id', workspaceId)
    .single();

  if (error) {
    throw error;
  }

  return mapWorkspace(data as WorkspaceRow);
}

export async function createWorkspace(
  input: CreateWorkspaceInput,
): Promise<Workspace> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('User is not authenticated.');
  }

  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      owner_id: user.id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
    })
    .select(
      `
        id,
        owner_id,
        name,
        description,
        created_at,
        updated_at
      `,
    )
    .single();

  if (error) {
    throw error;
  }

  return mapWorkspace(data as WorkspaceRow);
}

export async function updateWorkspace(
  workspaceId: string,
  input: UpdateWorkspaceInput,
): Promise<Workspace> {
  const payload: Record<string, string | null> = {};

  if (input.name !== undefined) {
    payload.name = input.name.trim();
  }

  if (input.description !== undefined) {
    payload.description = input.description?.trim() || null;
  }

  const { data, error } = await supabase
    .from('workspaces')
    .update(payload)
    .eq('id', workspaceId)
    .select(
      `
        id,
        owner_id,
        name,
        description,
        created_at,
        updated_at
      `,
    )
    .single();

  if (error) {
    throw error;
  }

  return mapWorkspace(data as WorkspaceRow);
}

export async function deleteWorkspace(
  workspaceId: string,
): Promise<void> {
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId);

  if (error) {
    throw error;
  }
}