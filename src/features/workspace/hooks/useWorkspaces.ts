import { useCallback, useEffect, useState } from 'react';

import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaces,
  updateWorkspace,
} from '../services/workspaceService';

import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  Workspace,
} from '../types/workspace.types';

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to fetch workspaces.'),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setError(null);
        const data = await getWorkspaces();
        if (isMounted) {
          setWorkspaces(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error('Failed to fetch workspaces.'),
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
  }, []);

  const addWorkspace = async (input: CreateWorkspaceInput) => {
    const workspace = await createWorkspace(input);

    setWorkspaces((current) => [
      workspace,
      ...current,
    ]);

    return workspace;
  };

  const editWorkspace = async (
    workspaceId: string,
    input: UpdateWorkspaceInput,
  ) => {
    const workspace = await updateWorkspace(
      workspaceId,
      input,
    );

    setWorkspaces((current) =>
      current.map((item) =>
        item.id === workspace.id
          ? workspace
          : item,
      ),
    );

    return workspace;
  };

  const removeWorkspace = async (workspaceId: string) => {
    await deleteWorkspace(workspaceId);

    setWorkspaces((current) =>
      current.filter(
        (item) => item.id !== workspaceId,
      ),
    );
  };

  return {
    workspaces,
    isLoading,
    error,
    refresh: fetchWorkspaces,
    addWorkspace,
    editWorkspace,
    removeWorkspace,
  };
}