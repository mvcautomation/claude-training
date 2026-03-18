# method 3: building a reader notification system with claude code

a real-world session analysis — adding signup prompts, paragraph-level read tracking, Vercel Postgres, and Slack-powered change notifications to a Next.js book reader app.

---

## what peter does well

### describes the feature in user terms, not implementation terms
peter described what he wanted from the reader's perspective: "sign ups to be notified about changes to parts they've already read (not spoiling changes for parts they haven't read yet)." he didn't prescribe database schemas or API shapes — he described the outcome. this let claude design the architecture while peter focused on product decisions. the result was a back-and-forth where claude proposed a plan and peter refined it ("can we use paragraph numbers for tracking?" "20+ word changes is major") until the design was right.

### connects existing systems instead of building from scratch
instead of asking for a new notification service, peter pointed to existing infrastructure: "using x-engagement-bot slack setup from there. but channel C0ALB00MEBZ." and "identity synced with heap user identity." this pattern — composing new features from existing pieces — is dramatically faster than greenfield builds because claude already knows how those systems work (from CLAUDE.md and memory) and can wire them together.

### challenges assumptions at the right time
when claude proposed chapter-level tracking, peter pushed back: "seems like bookmarks use paragraph numbers. can we use that for tracking and also for major change signal?" this reframed the entire architecture around paragraph-level granularity — a better design that claude wouldn't have proposed unprompted because it's more complex. the best collaboration happens when the human steers the design and the AI implements it.

### tests on real devices with real accounts
peter didn't just check the console — he signed up as a real user on the production site, scrolled chapters on his phone, and reported exactly what he saw. "he scrolled the whole page twice. no register." this caught a real bug (progress sync was gated on localStorage identity that existed but wasn't being read due to a closure/timing issue) that unit tests would have missed.

### reports bugs precisely, with evidence
every bug report was specific: "peter isn't registered as far enough even though i had him jump to ch 21 to get ahead." then when asked to check localStorage: pasted exact output showing ch5, ch6, ch21 data. no guessing needed — claude could immediately trace the data flow from localStorage → sync function → database and find the gap.

### asks the right follow-up questions
"is there a slack message sent when someone signs up?" — this wasn't in the original spec but was an obvious need. peter caught it immediately after the initial build. this pattern of building the core, then pressure-testing the edges with "what about X?" questions, is more effective than trying to spec everything upfront.

---

## what could work better

### state the full UX flow upfront when multiple prompts interact
the original request mentioned both the share prompt change (move to primes) and the signup prompt (separate, after chapter 3) in the same message, but the relationship between them wasn't explicit. claude initially thought they were the same prompt. peter clarified: "sorry i meant move the share prompt to prime numbers. the sign up prompt is separate." starting with "there are two separate prompts: (1) share prompt on primes, (2) signup prompt after ch3" would have saved a round trip.

### specify "what happens on dismiss" for any modal/prompt
the signup prompt's dismiss behavior was never explicitly defined. does it come back next chapter? does it have a max dismiss count? claude made a judgment call (show every chapter if identity unknown, no dismiss limit) but this is a product decision that could have gone either way. when describing any prompt or modal, include: when it shows, when it stops showing, and what dismiss does.

### flag environment constraints earlier
"the code needed to be run separately" — peter had to clarify that the two localStorage checks needed to be run as separate console commands. small friction like this is unavoidable, but when there's a known constraint about the testing environment (corporate firewall, specific browser, mobile-only repro), mentioning it upfront helps claude tailor its debugging instructions.

---

## patterns worth stealing

### the "here's an existing pattern, use it for this new thing" approach
peter pointed to paragraph bookmarks as the model for read tracking, and x-engagement-bot's Slack setup for notifications. this is high-leverage because claude can read the existing code, understand the pattern, and replicate it for the new feature — matching style, error handling, and conventions automatically.

### build the core, then iterate on edge cases
the session followed a natural flow: core architecture → API routes → client tracking → signup prompt → GitHub Action → then edge cases (Slack on signup, progress sync bug, mobile scroll jank). this is better than trying to spec every edge case in the initial plan because real bugs and missing features only become visible once the core is running.

### use the database as a debugging tool
when progress wasn't syncing, peter didn't try to guess — he asked claude to query the database directly. "how's his progress now?" became a recurring check that made the bug visible (ch21 missing from server despite being in localStorage). if you have database access, use it as ground truth when debugging data flow issues.

### ship then immediately test the critical path
peter signed up, scrolled chapters, pushed content changes, and checked Slack — all within minutes of deploy. this caught the progress sync bug immediately instead of discovering it days later with real readers. for any feature that involves data flowing through multiple systems (client → API → database → GitHub Action → Slack), test the full chain immediately.

### unrelated bugs are fair game during a session
the mobile scroll jank wasn't part of the notification system work, but peter brought it up while testing. claude was already deep in the reader codebase and could diagnose it quickly (overflow-x: hidden on html + preventDefault on margin buttons). sessions where you're already in the right code are the best time to fix adjacent bugs.

---

## key takeaways for new claude code users

1. **describe outcomes, not implementations.** "notify readers about changes to parts they've already read" is better than "create a webhook that diffs markdown files." let claude propose the architecture, then steer it.

2. **point to existing patterns in your codebase.** "use the same approach as X" gives claude a concrete template to follow. it's faster and more consistent than describing the pattern from scratch.

3. **test on production with real data immediately.** the gap between "code looks right" and "it works end-to-end" is where most bugs live. sign up as a real user. scroll real chapters. push real changes.

4. **query your database during debugging.** don't guess where data is or isn't — check. "is the data in localStorage?" and "is the data in Postgres?" are two different questions with two different answers, and the gap between them is usually the bug.

5. **let the session evolve naturally.** start with the core feature, but don't be afraid to fix adjacent bugs, add missing Slack notifications, or refine the UX mid-session. claude has full context — use it while it's hot.

6. **when claude's plan is missing something, say so before building.** "can we use paragraph numbers instead?" saved a rewrite. "is there a slack message on signup?" added a feature in 2 minutes. pushing back during planning is 10x cheaper than pushing back after implementation.
