import { useCallback, useEffect, useState } from 'react';

import { workspaceMemberService } from '../services/workspaceMemberService';
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
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkspace = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getWorkspaceById(workspaceId);
      setWorkspace(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to fetch workspace.'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setError(null);
        const data = await getWorkspaceById(workspaceId);
        if (isMounted) {
          setWorkspace(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error('Failed to fetch workspace.'),
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  const editWorkspace = async (input: UpdateWorkspaceInput) => {
    const updated = await updateWorkspace(workspaceId, input);
    setWorkspace(updated);
    return updated;
  };

  const removeWorkspace = async () => {
    await deleteWorkspace(workspaceId);
    setWorkspace(null);
  };

  const leaveWorkspace = async () => {
    await workspaceMemberService.leaveWorkspace(workspaceId);
    setWorkspace(null);
  };

  return {
    workspace,
    isLoading,
    error,
    refresh: fetchWorkspace,
    editWorkspace,
    removeWorkspace,
    leaveWorkspace,
  };
}