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
│       └── skills/             # commit, update-docs (ch7), brainstorm (ch4) — each a SKILL.md
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

### Chapter Structure (12 chapters + hero)

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
| 12 | Environment Setup | Desktop-app-first 5-step flow: install Claude desktop app (claude.com/download), make a Projects folder, download+unzip the starter template (`app/starter-template.zip`), open a session via Code tab → local → folder, then the first-repo assignment. Manual/let-claude step types only (no terminal "command" steps). |

Note: ch3 and ch7 are the two newest chapters. ch7 is intentionally written without em dashes (testing Peter's no-em-dash-in-public-copy preference); the rest of the course uses em dashes as its house voice. This inconsistency is known/unresolved — Peter chose to leave it for now.

### JavaScript Architecture
- `TOTAL_CHAPTERS = 12`, `TOTAL_QUIZZES = 36`
- `goTo(n)` — navigates to chapter n, updates progress, saves to localStorage
- `updateNav()` — updates progress bar and chapter dot navigation (right sidebar)
- Quiz handling via event listeners on `.quiz-option` buttons, answers stored in `quizAnswers` object
- `copyCmd(btn)` — copies terminal command/prompt text to clipboard
- `switchPlatform(group, platform, tab)` — toggles Mac/Windows content sections
- Score card (`#final-score`) renders on chapter 10 showing quiz accuracy

### Quiz ID Convention
- Format: `{chapter}{letter}` — e.g., `9a`, `9b`, `9c`
- 3 quizzes per chapter, 36 total (chapters 1-12, letters a-c)
- Quiz state persists in localStorage across sessions

### Navigation
- **"☰ chapters" TOC menu** in the top-left nav (`openTOC()`/`closeTOC()`/`buildTOC()`) opens a left drawer listing all chapters (0-12) with current-chapter highlight + visited checkmarks. Works on mobile (primary jump method there) and desktop. Closes on item click, backdrop click, or Esc. Titles live in the `chapterTitles` array.
- Chapter dots on right sidebar (hidden on mobile <900px) — quick-jump on desktop
- Each chapter has prev/next buttons at bottom
- Chapter 12 "next" links back to hero (start over)
- Progress bar in fixed top nav shows chapters visited; `.nav-title` hidden <600px to make room for the TOC button

## How to Add a New Chapter

1. Increment `TOTAL_CHAPTERS` and `TOTAL_QUIZZES` (if adding quizzes) in the `<script>` block
2. Add a label to the `labels` array in `updateNav()`
3. Add a `<div class="chapter" id="chapter-N">` block before `</div><!-- /main -->`
4. Use `data-quiz="Na"`, `data-quiz="Nb"`, `data-quiz="Nc"` for quiz IDs
5. Update the previous chapter's "next" nav button to point to the new chapter
6. Update the new chapter's "next" nav to point appropriately (or back to 0)
7. Update the hero page chapter count text and chapter list
8. If moving the final score card, ensure it's in the last chapter and `updateFinalScore()` checks for the correct chapter number
9. Update `score-total` display to match new `TOTAL_QUIZZES`

## Recent Changes

- Expanded from 10 to 12 chapters by inserting two new chapters and renumbering everything after them (chapter IDs, `goTo()` nav, `data-quiz` IDs, `labels` array, hero list, counts). localStorage key bumped `v2`→`v3` since renumbered quiz IDs would mismatch old saved progress.
  - **New Ch3 — How Claude Actually Works**: plain-english mechanics with three practical takeaways (it bluffs → verify; it can't count → use scripts; it can't introspect → check docs). Metaphors: well-read autocomplete, exam-with-no-penalty-for-guessing. 3 quizzes (3a-c).
  - **New Ch7 — Managing Context**: context window as finite working memory (desk vs filing cabinet), subagents, the cost of losing hard-won knowledge, capture-before-clear habit (the `/update-docs` pattern) with the two-question discriminator (unrecoverable→save fact; expensive→save pointer). 3 quizzes (7a-c). Written em-dash-free on purpose (see note above).
  - Smaller revisions: Ch4 gained an "ask, don't tell" section + numbered-questions tip; Ch5 gained an MCP-vs-skills parenthetical; Ch6 phase-2 reworded so "plan" reads as a conversation not a formal mode; Ch12 gained an aside that Claude Code also runs as a desktop app / in VS Code / on web.
- Added Chapter 9 (GitHub Essentials): crash course covering commits, push/pull dangers (force push horror story), repos, solo workflow (push to main), team workflow (feature branches + PRs)
- Added Chapter 10 (Environment Setup): 8-step guided walkthrough with color-coded step types (manual/command/let-claude-do-it), Mac/Windows platform toggles, copy-to-clipboard on all commands and prompts, final assignment to create first GitHub repo
- Both chapters include 3 quizzes each and follow the existing design system
