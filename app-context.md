# app-context.md — claude-training

## What This Project Is

An interactive web-based training course that teaches people how to use Claude Code to build real software. The course is aimed at non-traditional developers (startup operators, product people) who use Claude Code as their primary development tool.

## Repo Structure

```
claude-training/
├── app/
│   └── index.html          # The entire course — single-page app, no build step
├── claude-code-101.md       # Source markdown for the conceptual content
├── method0.md - method6.md  # Supplementary methodology docs (dtcmvp team workflows)
└── app-context.md           # This file
```

## The App (app/index.html)

A self-contained single HTML file with no dependencies or build process. Open it directly in a browser.

### Tech Stack
- Pure HTML/CSS/JS — no frameworks, no bundler
- Fonts: Space Grotesk + Space Mono (loaded via Google Fonts CDN)
- Progress saved to localStorage (`cc101-progress-v2`)

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

### Chapter Structure (10 chapters + hero)

| ID | Chapter | Content |
|----|---------|---------|
| 0 | Hero/landing | Intro, chapter list, "start learning" button |
| 1 | The Mindset Shift | You're running a team, not using a tool |
| 2 | What You Bring | 5 irreplaceable human contributions |
| 3 | Talking to AI | How specificity changes everything |
| 4 | Three Layers of Memory | CLAUDE.md, skills, memory system |
| 5 | The Workflow | Orient, plan, build, verify, document |
| 6 | Debugging with AI | Data first, push back on confidence |
| 7 | Common Mistakes | 7 traps teams fall into |
| 8 | The Investment That Compounds | Why scaffolding matters more than code |
| 9 | GitHub Essentials | Commits, push/pull, repos, solo vs team workflows |
| 10 | Environment Setup | 8-step walkthrough: VS Code, Claude Code, agent swarms, Chrome ext, CLAUDE.md, skills, GitHub CLI, first repo assignment |

### JavaScript Architecture
- `TOTAL_CHAPTERS = 10`, `TOTAL_QUIZZES = 30`
- `goTo(n)` — navigates to chapter n, updates progress, saves to localStorage
- `updateNav()` — updates progress bar and chapter dot navigation (right sidebar)
- Quiz handling via event listeners on `.quiz-option` buttons, answers stored in `quizAnswers` object
- `copyCmd(btn)` — copies terminal command/prompt text to clipboard
- `switchPlatform(group, platform, tab)` — toggles Mac/Windows content sections
- Score card (`#final-score`) renders on chapter 10 showing quiz accuracy

### Quiz ID Convention
- Format: `{chapter}{letter}` — e.g., `9a`, `9b`, `9c`
- 3 quizzes per chapter, 30 total (chapters 1-10, letters a-c)
- Quiz state persists in localStorage across sessions

### Navigation
- Chapter dots on right sidebar (hidden on mobile <900px)
- Each chapter has prev/next buttons at bottom
- Chapter 10 "next" links back to hero (start over)
- Progress bar in fixed top nav shows chapters visited

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

- Added Chapter 9 (GitHub Essentials): crash course covering commits, push/pull dangers (force push horror story), repos, solo workflow (push to main), team workflow (feature branches + PRs)
- Added Chapter 10 (Environment Setup): 8-step guided walkthrough with color-coded step types (manual/command/let-claude-do-it), Mac/Windows platform toggles, copy-to-clipboard on all commands and prompts, final assignment to create first GitHub repo
- Both chapters include 3 quizzes each and follow the existing design system
