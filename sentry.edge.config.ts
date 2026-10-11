// Sentry for the Edge runtime (loaded from instrumentation.ts).
import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./lib/sentryOptions";

Sentry.init(sentryOptions);
