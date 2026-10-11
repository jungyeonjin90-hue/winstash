// Sentry for the Node.js server runtime (loaded from instrumentation.ts).
import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./lib/sentryOptions";

Sentry.init(sentryOptions);
