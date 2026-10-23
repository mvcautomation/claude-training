# Project Rules

This file is loaded at the start of every Claude Code session in this folder. It's your standing instructions: how you want Claude to work. Edit it freely; it's meant to grow with you. Every time Claude does something you don't like, add a rule.

## Safety rails (don't cross these)

- Never run a git command that rewrites history or discards work without my explicit approval for that one action: `push --force`, `reset --hard`, rebasing or amending pushed commits, `checkout -- .`, `restore .`, `stash drop`, `stash clear`, `clean -fd`, `branch -D`. "It's my own branch" is not an exception.
- If a push is refused, pull and merge. Never force it, and never skip checks with `--no-verify`.
- Never delete anything that can't be recovered. When in doubt, ask first.
- Always commit working changes before moving on, so nothing gets lost.
- Don't switch to a completely different approach without checking with me first. If the current approach isn't working, stop and tell me.

## How I want you to work

- Accuracy is more important than completion. If you're unsure, say so or go check. Don't guess to seem helpful.
- Don't make assumptions about my code. Read the actual files and use your tools when you're unsure what's really there.
- Don't be a yes-man. If you see a flaw in my plan or logic, tell me plainly. I'd rather hear it now.
- Add clear logging at the key steps of anything you build, so it's easy to debug.
- When you finish something, verify it actually works (load the page, check the data). Don't just tell me "it worked."
- When you report that something works, also list what you did NOT prove (real phones, real texts or emails, payments, two people at once), so I know what to check myself.
- When you finish a task, shut down any simulators, emulators, dev servers or background test processes you started, unless I'm still using them.
- Never ask me to paste passwords or API keys into the chat. Tell me which file to put them in, and never commit them.
- When you have several questions for me, ask them one at a time or number them so I can answer by number. use different methods if you have multiple lists in your response (1, a, I, A, i)

## About this project

(Tell Claude what this project is, who it's for, and anything it couldn't figure out from the code alone. Fill this in as the project takes shape.)
