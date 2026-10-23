---
name: hosting
description: Help the user choose where an app or service will run (Vercel, a home server like a Mac Mini behind a Cloudflare Tunnel, a DigitalOcean droplet, or a short-lived container) and set it up. Use when the user asks where to host, deploy, or put something online, or before the first deploy of a new project.
---

# Hosting

You already know these platforms. This skill makes sure the user hears the tradeoffs before choosing. Check current prices and limits on the providers' sites; they change.

Make sure the user decides about:

1. **What has to run**: pages only, an API that answers requests, something that runs all the time (a bot, a websocket server, a scheduler), or a job that runs and exits.
2. **Commercial or personal**: Vercel's free plan is for non-commercial use.
3. **The options and their tradeoffs**, raised before choosing: Vercel, a home server (such as a Mac Mini) behind a Cloudflare Tunnel, a rented droplet, and a short-lived container. For each, bring up its limits, the upkeep the user takes on, what it costs, and what users see when it goes down. Check current terms; Vercel added always-on workers in October 2026.
4. **Where the data lives** and how it's backed up, whichever host is chosen.
5. **Secrets**: kept in env files or the host's settings, never in git or chat.
6. **Domain and DNS**: who owns the domain and where it's managed.
7. **Cost at expected usage**, and what happens to users if it goes down.

Once decided, set it up step by step, explain each step in plain English, write the setup into the project's docs so it can be rebuilt, and test a deploy end to end.
