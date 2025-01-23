declare module 'cors' {
  interface CorsRequest {
    origin?: string;
  }

  interface CorsOptions {
    origin?: boolean | string | RegExp | (string | RegExp)[] | CustomOrigin;
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  }

  type CustomOrigin = (
    requestOrigin: string | undefined,
    callback: (err: Error | null, origin?: boolean | string) => void
  ) => void;
}

export {};