declare module 'next-pwa' {
    import { NextConfig } from 'next';

    export default function withPWA(config: {
        dest?: string;
        disable?: boolean;
        register?: boolean;
        scope?: string;
        sw?: string;
        skipWaiting?: boolean;
        runtimeCaching?: any[];
        publicExcludes?: string[];
        buildExcludes?: string[];
        fallbacks?: {
            [key: string]: string;
        };
        cacheOnFrontEndNav?: boolean;
        reloadOnOnline?: boolean;
        customWorkerDir?: string;
        subdomainPrefix?: string;
    }): (nextConfig: NextConfig) => NextConfig;
}
