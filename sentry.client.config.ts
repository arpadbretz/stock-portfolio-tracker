import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    debug: false,
    beforeSend(event) {
        // Scrub email addresses from the message/exception
        if (event.message) {
            event.message = event.message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]');
        }
        if (event.user) {
            delete event.user.email;
        }
        return event;
    },
});
