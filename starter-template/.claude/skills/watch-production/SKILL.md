---
name: watch-production
description: Set up an automatic daily check that the live app still works and alerts the user when it doesn't. Use after a first launch, after a production outage, or when the user asks to monitor, watch, or health-check an app.
---

# Watch Production

A success message is not proof that users can still use the app. Set up a scheduled check that does what a user does.

Make sure the user decides about:

1. **The critical path**: the two or three things that must always work (sign in, book, pay, load the main screen).
2. **How often** to check, and **where alerts go** (email, Slack, text). Only alert on failure.
3. **Where the check runs**: a cloud scheduled task keeps running with the laptop closed; a session `/loop` does not. A cloud task works from a GitHub repo and can only reach allowed sites, so add the app's domain to its environment's network access.
4. **Test accounts and data** the check can use without touching real users or sending real messages to real people.
5. **Vendor limits**: credits, quotas or billing that can run out silently (SMS, AI APIs, email). Alert before they hit zero.
6. **What to do when it fails**: alert only, or also open a task with the logs attached.

Then build the check, run it once by hand to prove it catches a failure, and schedule it.
