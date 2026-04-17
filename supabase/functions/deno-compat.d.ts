declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string): any;
}

declare module "https://esm.sh/@upstash/redis" {
  export class Redis {
    constructor(config: { url: string; token: string });
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<unknown>;
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown, options?: unknown): Promise<unknown>;
  }
}

declare namespace Deno {
  const env: {
    get(key: string): string | undefined;
  };

  function serve(handler: (req: Request) => Response | Promise<Response>): void;
}
