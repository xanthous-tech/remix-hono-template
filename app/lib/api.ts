import { hc } from 'hono/client';

import type { MainAPI } from '@/api';

export const apiClient = hc<MainAPI>('/api');
