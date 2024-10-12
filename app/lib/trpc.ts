import { createTRPCReact } from '@trpc/react-query';

import type { AppRouter } from '@/trpc';
//     👆 **type-only** import

export const trpc = createTRPCReact<AppRouter>();
