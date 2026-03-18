# method 1: building staging infrastructure with claude code

a real-world session analysis — deploying per-branch staging for a production app on DigitalOcean.

---

## what peter does well

### gives full context upfront
the session started with a complete implementation plan: directory structure, port allocation scheme, nginx templates, docker compose config, cron jobs, and the exact files to create/modify. this is the single highest-leverage thing you can do with claude code. the more complete the plan, the less claude has to guess, and the fewer wrong turns it takes.

### tests incrementally and reports results honestly
instead of asking "does it work?" peter tested each piece — deployed, hit the URL, screenshotted the result, and reported exactly what failed ("banner works but auth doesn't", "sign in worked! new problem no hosts?"). screenshots are particularly effective because they remove ambiguity about what the user is seeing vs what the logs say.

### lets claude debug with access to the real system
peter's setup gives claude SSH access to the production droplet, which means claude can check logs, curl endpoints, inspect docker containers, and verify database contents directly. this is dramatically faster than the alternative (user runs commands, pastes output, waits for analysis, repeats). if you're building infrastructure, giving claude access to the actual systems is a force multiplier.

### stays out of the way during implementation, intervenes at decision points
peter didn't micromanage the file creation — he let claude write all the scripts, templates, and configs in one pass. but when a real decision came up (root SSH access, whether to add dtcmvp-app now or later), he engaged. this is the right balance: delegate execution, own decisions.

### uses existing institutional knowledge
the CLAUDE.md file, memory system, and prior conversation context meant claude already knew the deployment patterns, server IPs, auth architecture, and team norms. this eliminated 15+ minutes of "how does your system work?" questions that would otherwise start every session.

---

## what could work better

### commit and branch hygiene before deploying
the session hit a snag when local files got reverted (likely a git checkout or IDE revert) and a deploy accidentally ran against production from main instead of the test branch. a quick `git status` / `git branch` check before running deploy commands would catch this. a possible habit: always run `git branch` before `./deploy.sh --staging` to confirm you're where you think you are.

### flag when you're about to leave claude's working context
the files were reverted between turns without explanation. claude didn't know why and had to re-add the changes. if you're switching branches, resetting files, or letting a linter run — a quick heads up ("i reverted those files, re-add them") saves a round trip of claude discovering the change, investigating, and re-applying.

### separate "fix the running env" from "fix the scripts for next time"
several times we needed to both patch the live staging env AND fix the underlying scripts. these are two different tasks that can get tangled. a pattern that works well: "fix the live env first so i can test, then update the scripts" — stated explicitly so claude knows the priority order.

### the plan was almost perfect — one gap
the plan didn't account for how the frontend constructs API URLs (`NEXT_PUBLIC_API_URL` + `/api/partners`), which caused the `/api/api/` double-prefix bug. when the staging architecture changes how routing works (single domain with path-based routing vs separate subdomains), it's worth calling out "here's how the frontend builds URLs today" in the plan so claude can catch these mismatches before they hit production.

---

## patterns worth stealing

### the "plan then build" workflow
write the full plan in a conversation, exit plan mode, then hand the plan to claude as the implementation prompt. this is how this session worked and it's the most reliable pattern for complex infra work. the plan becomes the contract — claude can refer back to it, and you can hold claude accountable to it.

### screenshot-driven debugging
every bug in this session was reported with a screenshot. claude can read screenshots. "it shows no hosts" + screenshot is 10x more useful than "it's not working" because claude can see the URL bar, the page state, error messages, and UI context all at once.

### building for debuggability from the start
the CLAUDE.md rule "always add logging to key stages" paid off here — the staging-deploy script logs every step with timestamps, which made it trivial to identify where things went wrong (ports empty, db filename wrong, path doubled).

### using memory to avoid repeating yourself
the memory system stores auth architecture, deploy SOPs, database locations, and team norms. this means peter never had to re-explain how supabase auth works or where the databases live — claude already knew. if you find yourself explaining the same thing twice across sessions, save it to memory.

---

## key takeaways for new claude code users

1. **the quality of your plan determines the quality of claude's output.** vague instructions → vague results. specific file paths, exact configs, and clear success criteria → working code on first pass.

2. **give claude access to the systems it's building for.** SSH, database access, API keys — the more claude can verify its own work, the fewer round trips you need.

3. **test early and report failures with evidence.** don't wait until everything is "done" to test. deploy after each phase, screenshot what you see, and let claude iterate.

4. **own the decisions, delegate the execution.** you decide the architecture. claude writes the scripts. you decide whether to add dtcmvp-app now. claude implements whatever you choose.

5. **your CLAUDE.md and memory files are your most valuable assets.** they compound over time. every session that adds context makes the next session faster.
