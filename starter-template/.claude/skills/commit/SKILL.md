---
name: commit
description: Stage all changes, write a clear commit message describing what changed and why, and push to the current branch. Use when the user says "commit", "save my work", or has just finished a working change.
---

# Commit

When invoked:

1. Run `git status` and `git diff` to see what actually changed.
2. Stage all changes (`git add -A`).
3. Write a concise commit message: a short summary line describing *what* changed and *why*: specific, not generic. If there's meaningful detail, add a short body.
4. Commit, then push to the current branch.
5. If the push fails because of a conflict, do NOT force push. Pull first, resolve, then push normally, and tell the user what happened.

Good messages: "fix login redirect on mobile Safari", "add email notification for updated docs".
Bad messages: "updates", "fixed stuff", "wip".
