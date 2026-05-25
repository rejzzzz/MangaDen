/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { AuthUser } from "./lib/auth-client";

declare global {
    namespace App {
        interface Locals {
            user: AuthUser | null;
        }
    }
}
