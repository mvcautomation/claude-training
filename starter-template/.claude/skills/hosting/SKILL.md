---
name: hosting
description: Help the user choose where an app or service will run (Vercel, a home server like a Mac Mini behind a Cloudflare Tunnel, a DigitalOcean droplet, or a short-lived container) and set it up. Use when the user asks where to host, deploy, or put something online, or before the first deploy of a new project.
---

# Hosting

You already know these platforms. This skill makes sure the user hears the tradeoffs before choosing. Check current prices and limits on the providers' sites; they change.

Make sure the user decides about:

1. **What has to run**: pages only, an API that answers requests, something that runs all the time (a bot, a websocket server, a scheduler), or a job that runs and exits.
2. **Commercial or personal**: Vercel's free plan is for non-commercial use.
3. **Vercel** fits sites and request-driven APIs. Bring up its limits before choosing it: functions have a time limit, there's no disk that persists, and no always-on processes.
4. **A home server** (a Mac Mini or old laptop with a Cloudflare Tunnel) costs almost nothing per month. Bring up that it goes down with the home's power or internet, that the machine must stay awake, that backups are the user's job, and that anyone with the link can reach it unless access is restricted.
5. **A droplet** (a small rented Linux server) is cheap per month and always on. Bring up that the user owns the upkeep: security updates, firewall, SSH keys, backups.
6. **A short-lived container** fits jobs that run and exit. Nothing is kept between runs.
7. **Where the data lives** and how it's backed up, whichever host is chosen.
8. **Secrets**: kept in env files or the host's settings, never in git or chat.
9. **Domain and DNS**: who owns the domain and where it's managed.
10. **Cost at expected usage**, and what happens to users if it goes down.

Once decided, set it up step by step, explain each step in plain English, write the setup into the project's docs so it can be rebuilt, and test a deploy end to end.
