import { useCallback, useEffect, useState } from 'react';

import {
    deleteWorkspace,
    getWorkspaceById,
    updateWorkspace,
} from '../services/workspaceService';

import type {
    UpdateWorkspaceInput,
    Workspace,
} from '../types/workspace.types';

export function useWorkspace(workspaceId: string) {
  const [workspace, setWorkspace] =
    useState<Workspace | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<Error | null>(null);

  const fetchWorkspace = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data =
        await getWorkspaceById(workspaceId);

      setWorkspace(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error(
              'Failed to fetch workspace.',
            ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const editWorkspace = async (
    input: UpdateWorkspaceInput,
  ) => {
    const updated =
      await updateWorkspace(
        workspaceId,
        input,
      );

    setWorkspace(updated);

    return updated;
  };

  const removeWorkspace = async () => {
    await deleteWorkspace(workspaceId);

    setWorkspace(null);
  };

  return {
    workspace,
    isLoading,
    error,
    refresh: fetchWorkspace,
    editWorkspace,
    removeWorkspace,
  };
}