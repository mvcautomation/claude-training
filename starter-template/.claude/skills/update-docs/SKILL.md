---
name: update-docs
description: Capture what would be lost if this conversation ended — decisions, dead-ends, and hard-won knowledge — and save it where a fresh session can find it. Use before clearing or compacting a long session, or when the user says "update docs" or "save what we learned".
---

# Update Docs

Before context is lost, capture what a fresh Claude couldn't easily rediscover.

When invoked:

1. Review the conversation and ask: what did we learn or decide that a fresh session could NOT cheaply rediscover from the code, or that would cost real time to figure out again?
   - **Truly unrecoverable** (the *why* behind a decision, approaches we ruled out, a constraint nobody wrote down) → save the fact itself.
   - **Recoverable but expensive** → it's often enough to save a pointer: "the answer is in X, regenerate it by doing Y."
   - **Skip** anything cheaply rediscoverable (file structure, what the code does, git history).

2. Route each item to the right home:
   - A standing rule or preference → `CLAUDE.md`
   - A repeatable how-to → a new skill in `.claude/skills/`
   - A project note or current state → a notes/context doc in the project

3. Show the user exactly what you're about to write and where, then save it.
