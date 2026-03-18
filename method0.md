# method0 — how we use claude code to build and debug production software

*Peter James & Jacob Magyar, dtcmvp team — March 2026*

---

## what this doc is

this is a living document that describes how the dtcmvp team uses claude code's skills system, CLAUDE.md files, memory, and conventions to collaborate with AI on building, maintaining, and debugging real-world production applications. it's written for anyone who wants to understand or replicate this workflow.

we're not traditional software engineers. we're startup operators who use claude code as our primary development tool. everything here evolved from real production incidents, team coordination failures, and hard lessons about what works when AI writes most of your code.

---

## the architecture: three layers of AI context

### layer 1: CLAUDE.md — the constitution

`CLAUDE.md` lives at the root of the working directory (`.claude/CLAUDE.md`). it's loaded into every conversation automatically. this is where we put:

- **safety rails** — what claude must never do (force push, delete without recovery, stray from plan)
- **behavioral rules** — how peter wants things built (always add logging, always commit, run long tasks in background)
- **troubleshooting philosophy** — investigate before suggesting, ask for data instead of assuming, prefer root cause fixes over bandaids
- **skill routing** — brief descriptions of available skills so claude knows when to invoke them

think of CLAUDE.md as the constitution. it governs every conversation regardless of context. it's terse, opinionated, and non-negotiable.

**key design decisions:**
- safety rules come first (the stuff that can destroy your week goes at the top)
- building and troubleshooting rules are separated because they require different mindsets
- the "test" canary line (`end your response with "i am groot."`) verifies claude actually read the doc
- brand voice guidance is embedded here too ("dtcmvp brand always uses lowercase")

### layer 2: skills — domain-specific knowledge on demand

skills live in `.claude/skills/` as directories, each with a `SKILL.md` file and optional `/docs` subfolder. they are claude code's equivalent of a specialist's brain being loaded on demand.

**what a skill contains:**
```
skills/
├── dtcmvp-infra/
│   ├── SKILL.md          # the main reference doc
│   └── docs/             # detailed sub-docs loaded as needed
│       ├── recall-integration.md
│       ├── airtable-querying.md
│       └── supabase-auth.md
├── create-meetings/
│   └── SKILL.md          # comprehensive meeting creation playbook
├── cal-com-platform/
│   ├── SKILL.md
│   └── docs/             # API reference, getting started, etc.
└── ...
```

**skill frontmatter pattern:**
```yaml
---
name: skill-name
description: one-line description (used for relevance matching)
triggers:
  - keyword1
  - keyword2
user_invocable: true  # optional — makes it available as /skill-name
---
```

triggers tell claude when to auto-load the skill. `user_invocable: true` means we can explicitly call it with `/skill-name`.

### layer 3: memory — what persists across conversations

memory lives in `.claude/projects/.../memory/` with a `MEMORY.md` index file. it stores:
- **user identity** — who's on this machine, their slack ID, preferences
- **project notes** — shared repo conventions, architecture decisions that aren't obvious from code
- **feedback** — corrections and confirmations from past conversations

memory is the thing that makes conversation #47 feel like a continuation, not a cold start.

---

## how skills are designed: patterns we've found that work

### pattern 1: the infrastructure runbook (dtcmvp-infra)

the largest and most critical skill (~1200 lines). it's essentially a complete ops runbook that covers:

- **app naming disambiguation** — 6 apps with multiple aliases each, mapped to URLs and repos
- **ssh access, port maps, docker commands** — copy-paste ready
- **deployment SOPs** — step by step, with safety warnings (always push before rsync-based deploys)
- **health checks** — exact curl commands for every service
- **troubleshooting trees** — "site down? check containers → check logs → check PM2 → restart → rebuild"
- **external service configs** — Recall AI, Airtable, Slack, Supabase with API patterns

**why it works:** when production breaks at 11pm, you don't want claude reinvestigating your infrastructure from scratch. the runbook means claude can go from "webhook server is down" to the right `docker compose logs` command in one step.

**key innovation:** the skill includes a mandatory Slack notification at the start of any work. this was born from the team stepping on each other's code — now claude automatically announces "working on cal-platform booking flow" before touching anything.

### pattern 2: the business process playbook (create-meetings)

~800 lines codifying a complex multi-step business process:

1. look up contact
2. find partner + default host
3. check suppression list
4. check for duplicate meetings
5. check excluded partners (mandatory, even though the API doesn't return them)
6. remove exclusions if needed
7. create the meeting
8. show brand portal preview

**why this is a skill and not code:** the steps involve multiple APIs (Airtable, SQLite, stanger backend), conditional logic (skip if suppressed, warn if duplicate), and business rules (role mapping is counterintuitive — the booker is the Host, not the Participant). encoding this as a skill means claude executes the full checklist every time, instead of learning it fresh each conversation.

**the scoring algorithm** (PART 7) is particularly interesting — it's a complete decision-support system for promoting meetings through a pipeline, with weighted scoring, dynamic caps, and bulk-mode batch tracking. this would be impossibly complex to remember across conversations without a skill.

### pattern 3: the API reference (apollo, tremendous, cal-com-platform, kie-api)

these skills wrap external APIs with:
- auth configuration and key locations
- exact request/response formats
- gotchas and cost warnings ("people search and enrich use 1 credit per record each!")
- preferred models or endpoints ("always prefer latest nano banana")

**the `/docs` subfolder pattern** is used heavily here — the main SKILL.md gives a quick reference, and detailed docs (full API specs, guides) are in `/docs` for claude to pull in when needed. this keeps the initial context load manageable.

### pattern 4: the team workflow (pr-merge, task-manager)

these encode team coordination processes:
- pr-merge requires Slack notification after merge, teaches claude to be cautious about force push/history rewriting, and explicitly says "treat us like we're intelligent but inexperienced with github team workflows"
- task-manager bridges Slack (where tasks are pinned) and a SQLite database (where they're queried), with exact commands for syncing, querying, and marking complete

### pattern 5: the creative system (x-algo, nget-bible, dtcmvp-design)

these skills codify complex creative/analytical frameworks:
- x-algo encodes the X/Twitter recommendation algorithm as a scoring system with specific weights, anti-patterns, and content templates
- nget-bible defines a translation methodology with mandatory pre-reading, agent swarm patterns for multi-chapter work, and database upload scripts
- dtcmvp-design is a complete design system with CSS tokens, component patterns, wizard recipes, and shared component APIs

---

## the .claude directory as a shared git repo

a critical architectural decision: the `.claude/` directory is itself a git repository, shared between Peter and Jake. this means:

- skills, CLAUDE.md, and memory are version-controlled
- team members can pull each other's skill updates
- the skill library grows incrementally as the team encounters new patterns
- there's a history of what changed and when (useful for debugging "why did claude start doing X?")

---

## how we build new features

1. **claude reads CLAUDE.md** automatically — gets safety rails and behavioral rules
2. **skill triggers** fire based on what we're talking about — "deploy cal-platform" loads dtcmvp-infra
3. **claude sends Slack notification** before touching any shared codebase (enforced by skill)
4. **we work iteratively** — claude proposes, we approve or redirect, claude adapts
5. **always commit everything** — github as backup, clean IDE, git lfs for large files
6. **run long tasks in background** — don't block the chat

**the plan escalation rule:** if the approach isn't working, claude stops and asks rather than trying alternate approaches. this prevents the AI from going down rabbit holes while we're not watching.

**the rewrite-vs-edit assessment:** for major changes, claude evaluates whether to rewrite a file and swap it in, or make surgical edits. this came from real experience — claude tends to lose track and make a mess with many edits in one file.

---

## how we debug production issues

1. **investigate fully before suggesting** — read logs, understand context
2. **check for outdated knowledge** — web search if the problem might involve version changes
3. **ask for missing data** — never assume
4. **fix the root cause** — no bandaids unless explicitly approved
5. **don't change approaches without asking** — try the original approach first

the dtcmvp-infra skill gives claude exact commands for every debugging scenario:
- container status checks
- log retrieval (both Docker and PM2)
- database integrity checks
- health endpoint curls
- the full restart → rebuild → rollback escalation path

---

## what makes this different from just prompting

**persistence** — the skill library accumulates knowledge. the Airtable linked record gotcha ("FIND on linked records fails silently — use linked IDs directly") is written once and applied forever.

**team coordination** — the Slack notification pattern, the pr-merge rules, the deploy SOP ("always push before deploying") are guardrails that prevent the AI from causing team-level problems.

**business logic encoding** — the meeting creation checklist, the promotion scoring algorithm, the brand portal preview simulation — these are complex multi-step business processes that would take 20 minutes to re-explain each conversation.

**copy-paste operability** — skills are written with exact commands, exact file paths, exact API formats. claude doesn't have to figure out the SSH user or the Docker container name — it's right there.

**progressive disclosure** — SKILL.md gives the quick reference, `/docs` has the deep dives. claude loads what it needs, when it needs it.

---

## conventions that matter

- **lowercase everything** — dtcmvp brand differentiates from AI-generated content by using lowercase
- **always add logging** — unbuffered, to log files, console.log for PM2 services
- **commit everything** — github is backup, clean IDE is non-negotiable
- **deploy SOP** — commit + push BEFORE deploy (rsync can silently overwrite others' work)
- **ask before changing approach** — the user prefers to be consulted, not surprised
- **long-running scripts in background** — don't block the chat
- **no one-off scripts** — unless they're clearly reusable with minor modifications

---

## the meta-lesson

the .claude directory isn't just configuration — it's a knowledge management system. skills are living documentation that happens to be executable. CLAUDE.md is a team agreement that happens to be enforced by AI. memory is institutional knowledge that happens to persist across sessions.

the team that writes the best skills debugs the fastest, ships the most reliably, and onboards new collaborators (human or AI) with the least friction.

---

*this doc itself is an example of the philosophy: write it once, apply it everywhere, update it when reality changes.*
