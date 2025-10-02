// Deno type declarations for Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare function serve(handler: (req: Request) => Promise<Response>): void;

// Module declaration for Deno std lib
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}

// Alternative module declaration for different versions
declare module "https://deno.land/std/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}

// Global serve function declaration (wrapped in module declaration)
declare global {
  function serve(handler: (req: Request) => Promise<Response>): void;
}

export {}; // Make this a module
