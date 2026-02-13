/// <reference types="astro/client" />

import type { Env } from './lib/types';

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
