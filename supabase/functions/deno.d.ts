// TypeScript declarations for Supabase Edge Functions (Deno Runtime)
// Enables VS Code and TypeScript to resolve Deno globals and URL imports without errors.

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
  };

  export function serve(
    handler: (req: Request) => Promise<Response> | Response
  ): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2.45.4' {
  export * from '@supabase/supabase-js';
}
