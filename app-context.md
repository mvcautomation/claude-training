# app-context.md — claude-training

## What This Project Is

An interactive web-based training course that teaches people how to use Claude Code to build real software. The course is aimed at non-traditional developers (startup operators, product people) who use Claude Code as their primary development tool.

## Repo Structure

```
claude-training/
├── app/
│   ├── index.html              # The entire course — single-page app, no build step
│   └── starter-template.zip    # Downloadable in ch12; built from starter-template/.claude
├── starter-template/
│   └── .claude/                # Source for the zip — generic CLAUDE.md + 3 skills
│       ├── CLAUDE.md           # Beginner safety rails (normal case, NOT dtcmvp lowercase)
│       └── skills/             # commit, update-docs, brainstorm, kickoff, adversarial-review, hosting, watch-production (each a short SKILL.md)
├── claude-code-101.md       # Source markdown for the conceptual content
├── method0.md - method6.md  # Supplementary methodology docs (dtcmvp team workflows)
└── app-context.md           # This file

# Rebuild the zip after editing starter-template/.claude:
#   cd starter-template && rm -f ../app/starter-template.zip && zip -r -X ../app/starter-template.zip .claude -x '*.DS_Store'
```

## The App (app/index.html)

A self-contained single HTML file with no dependencies or build process. Open it directly in a browser.

### Tech Stack
- Pure HTML/CSS/JS — no frameworks, no bundler
- Fonts: Space Grotesk + Space Mono (loaded via Google Fonts CDN)
- Progress saved to localStorage (`cc101-progress-v3`)

### Design System
- Dark theme: `--bg: #0a0e1a`, `--card: #131820`
- Accent colors: `--green: #7bed9f` (primary), `--blue: #1e90ff`, `--orange: #ffa502`, `--coral: #ff6348`
- Monospace elements use `Space Mono`, body uses `Space Grotesk`

### Content Components (CSS classes)
- `.content-block` — standard text section with `h3` heading
- `.metaphor` — green-gradient callout box with lightbulb icon, used for mental models
- `.story` — blue left-bordered box for real-world anecdotes, has `.lesson` span for takeaway
- `.comparison` — 2-column grid with `.comparison-bad` (red border) and `.comparison-good` (green border)
- `.quiz` — interactive multiple choice with `data-quiz="XY"` ID (X=chapter, Y=a/b/c), `data-correct="true"` on correct option, `.quiz-explanation` revealed after answer
- `.key-points` — green-headed summary list with arrow bullets
- `.setup-step` — step card with numbered circle (`.setup-step-num`), title, and badge (`.setup-badge`), color-coded by type: `.manual` (orange), `.command` (green), `.claude` (blue)
- `.cmd-block` — terminal command with copy-to-clipboard button
- `.setup-prompt-block` — italic prompt text (what to tell Claude) with copy button
- `.platform-tabs` / `.platform-content` — Mac/Windows toggle sections
- `.setup-note` — blue info callout box
- `.setup-legend` — color-coded legend for step types

### Chapter Structure (hero + Part 1: ch1-12 + Part 2: ch13-22)

| ID | Chapter | Content |
|----|---------|---------|
| 0 | Hero/landing | Intro, chapter list, "start learning" button |
| 1 | The Mindset Shift | You're running a team, not using a tool |
| 2 | What You Bring | 5 irreplaceable human contributions |
| 3 | How Claude Actually Works | Plain-english: prediction/hallucination, tokenization+no-scratchpad (use scripts for math), can't introspect itself |
| 4 | Talking to AI | How specificity changes everything + "ask, don't tell" (anti-sycophancy) + numbered-questions tip + "you shape what's probable" (framing steers the response shape; the "constant question" mental model). Quiz 4b is on framing, not specificity. |
| 5 | Three Layers of Memory | CLAUDE.md, skills, memory system (+ MCP-vs-skills parenthetical) |
| 6 | The Workflow | Orient, plan (as conversation, not a "mode"), build, verify, document |
| 7 | Managing Context | Context window as working memory, compaction, subagents ("delegate the exploration, keep the answer"), capture-before-clear /update-docs habit + two-question discriminator |
| 8 | Debugging with AI | Data first, push back on confidence |
| 9 | Common Mistakes | 7 traps teams fall into |
| 10 | The Investment That Compounds | Why scaffolding matters more than code |
| 11 | GitHub Essentials | Commits, push/pull, repos, solo vs team workflows |
| 12 | Environment Setup (end of Part 1; next button goes to 13) | Desktop-app-first 5-step flow: install Claude desktop app (claude.com/download), make a Projects folder, download+unzip the starter template (`app/starter-template.zip`), open a session via Code tab → local → folder, then the first-repo assignment. Manual/let-claude step types only (no terminal "command" steps). |
| 13 | Why This Changed Everything | 1M-token context (hold the whole problem), swarms (parallel building, fresh-eyed review, and reading huge messy data to answer broad judgment questions where search/RAG has nothing to match), loops (you stop being the bottleneck across many projects; hospital rounds) |
| 14 | The Kickoff Brief | Goal, convictions, look and feel, standing permissions, stop condition, blocked-decision default. Kickoff is a starting point; touch, play, adjust is expected |
| 15 | Artifacts: Review by Looking | Decision cards, one republished page per session, screenshots over descriptions |
| 16 | Unattended Work and Loops | /loop vs desktop scheduled vs cloud scheduled tasks (what survives a closed laptop), stop conditions, cost |
| 17 | Adversarial Agents | Code reviewer, persona testers, rule checker; /code-review, /adversarial-review; make review a gate |
| 18 | Adversarial Prompting | Questions that make Claude argue against itself ("what did you not prove?") |
| 19 | Parallel Sessions | Only once the app's shape is settled; worktrees, shared checklists, direct session messages |
| 20 | Watching Production | Scheduled checks of the critical path, alerts on failure only, vendor credit alerts |
| 21 | Where Your App Lives | Vercel vs home server + Cloudflare Tunnel vs droplet vs short-lived container |
| 22 | Capstone: Ship Something | Six-step build using the kit; holds the final score card |

Writing style: standard English capitalization (Title Case for headers/subtitles-as-titles/TOC/chapter labels, sentence case for body, quizzes, and callouts; proper nouns capitalized) and NO em dashes anywhere. The earlier dtcmvp-style all-lowercase + em-dash voice was fully removed (Peter: "the lowercase thing is dtcmvp brand only"). Keep new content in this same standard-English, em-dash-free style. Literal text inside `<code>`, `.cmd-block`, and `.setup-prompt-block` (commands, filenames, example prompts) is intentionally left in casual lowercase.

### JavaScript Architecture
- `TOTAL_CHAPTERS = 22`, `TOTAL_QUIZZES = 66`. Progress key is `cc101-progress-v4`; v3 saves are migrated on load (Part 2 chapter numbers and quiz IDs shifted up one when ch13 was inserted)
- `goTo(n)` — navigates to chapter n, updates progress, saves to localStorage
- `updateNav()` — updates progress bar and chapter dot navigation (right sidebar)
- Quiz handling via event listeners on `.quiz-option` buttons, answers stored in `quizAnswers` object
- `copyCmd(btn)` — copies terminal command/prompt text to clipboard
- `switchPlatform(group, platform, tab)` — toggles Mac/Windows content sections
- Score card (`#final-score`) renders on the last chapter (22) showing quiz accuracy; `updateFinalScore()` gates on `currentChapter === TOTAL_CHAPTERS`

### Quiz ID Convention
- Format: `{chapter}{letter}` — e.g., `9a`, `9b`, `9c`
- 3 quizzes per chapter, 66 total (chapters 1-22, letters a-c)
- Quiz state persists in localStorage across sessions

### Navigation
- **"☰ chapters" TOC menu** in the top-left nav (`openTOC()`/`closeTOC()`/`buildTOC()`) opens a left drawer listing all chapters (0-12) with current-chapter highlight + visited checkmarks. Works on mobile (primary jump method there) and desktop. Closes on item click, backdrop click, or Esc. Titles live in the `chapterTitles` array.
- Chapter dots on right sidebar (hidden on mobile <900px) — quick-jump on desktop
- Each chapter has prev/next buttons at bottom
- Chapter 12 "next" links back to hero (start over)
- Progress bar in fixed top nav shows chapters visited; `.nav-title` hidden <600px to make room for the TOC button

## How to Add a New Chapter

1. Increment `TOTAL_CHAPTERS` and `TOTAL_QUIZZES` (if adding quizzes) in the `<script>` block
2. Add a label to BOTH the `labels` array (dot tooltips, in `updateNav()`) and the `chapterTitles` array (TOC drawer) — keep them Title Case
3. Add a `<div class="chapter" id="chapter-N">` block before `</div><!-- /main -->`
4. Use `data-quiz="Na"`, `data-quiz="Nb"`, `data-quiz="Nc"` for quiz IDs
5. Update the previous chapter's "next" nav button to point to the new chapter
6. Update the new chapter's "next" nav to point appropriately (or back to 0)
7. Update the hero page chapter count text and chapter list
8. If moving the final score card, ensure it's in the last chapter and `updateFinalScore()` checks for the correct chapter number
9. Update `score-total` display to match new `TOTAL_QUIZZES`

## Current state / open items
_Last updated: 2026-10-23_

- **Two-part course (2026-10-23).** Part 1 (ch1-12) is the original course plus real-world stories from Peter's builds (Hiders Seekers, Long Time No See, Treadmill, Apprentices, anonymized as "a builder"), taste and human-only steps (ch2), hooks (ch5), the six-phase workflow with "play and adjust" (ch6), one session per release (ch7), "what wasn't proven" (ch8), new traps (ch9), and an expanded irreversible-git-commands section plus worktrees (ch11). Part 2 (ch13-21) is new. 63 quizzes. TOC shows Part headers (`.toc-part`).
- **Peter's positions the course must keep** (from his 2026-10-23 review): hands-on "touch, play, adjust" is part of building, not a failed kickoff; parallel sessions (second platform, promo video) wait until the app's shape is settled; git dangers stay in full; keep varied metaphors and add real examples alongside them.
- **Feature facts in Part 2 are dated "checked October 2026".** Re-verify loops, scheduled tasks, /code-review, artifacts and hosting limits against code.claude.com and provider pages before each cohort.
- **Starter template:** `starter-template/.claude/` is the **source of truth** (CLAUDE.md + seven skills: commit, update-docs, brainstorm, kickoff, adversarial-review, hosting, watch-production; all em-dash-free). Skills are deliberately short: they make sure the user decides on things rather than teaching facts the agent already knows. Don't name a skill `review` (collides with the built-in /review alias). `app/starter-template.zip` is built from it with the command in the Repo Structure block above. Do NOT edit inside `app/.claude/` — an unzip-and-edit-there workflow caused drift earlier (that stray dir has been removed).
- **Preview/dev server:** served via the `claude-training` config in the repo-root `.claude/launch.json` (`npx http-server claude-training/app -p 8099`). Static file, so any local HTTP server over `app/` works.
- **Watch-outs for future edits:** (1) ch12's desktop-app steps describe a specific UI flow (Code tab → start new session → local → select folder) provided by Peter — re-verify if the desktop app UI changes. (2) When adding/removing chapters, update BOTH nav arrays (`labels` + `chapterTitles`) and the localStorage key if quiz IDs shift. (3) Keep literal command/prompt text in `<code>`/`.cmd-block`/`.setup-prompt-block` in casual lowercase; everything else is standard English.
