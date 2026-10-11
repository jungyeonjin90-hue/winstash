// Sentry in the browser. No Sentry replay: PostHog already records sessions.
import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./lib/sentryOptions";

Sentry.init(sentryOptions);
