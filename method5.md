# debugging calendar disconnections and migrating off cal.com's gcal integration

a real session analysis — investigating why google calendar credentials were getting revoked, discovering the root cause was our own monitoring, then building a complete replacement for cal.com's calendar event creation in a single session.

---

## what works well

### 1. you question the ai's confidence level

when i suggested the disconnection was caused by aggressive API polling, you pushed back: "how confident are you that's the cause? is this just an educated guess?" this forced me to be honest (it was an educated guess) and acknowledge the holes in my theory. you did it again when i said google might be rate-limiting: "why would it target hers and not the other 79?" — a simple question that exposed that my explanation didn't actually hold up. this keeps the ai from confidently leading you down the wrong path.

### 2. you think about phased rollout before the ai does

when i proposed flipping `areCalendarEventsEnabled` to false, your immediate response was "we'll have to do some tests in mirror mode first." you also caught the transition problem: "what happens to older bookings that need to reschedule after we switch?" the ai was ready to flip the switch; you made sure there was a safe path to get there. this is the difference between building something that works in theory and building something that works in production.

### 3. you cross-check the ai's work against reality

after i said the 4 adopted reschedules were clean, you went and checked the actual calendar. found that my PST time conversions were wrong (i forgot about DST) and that the Tempo/Kevin booking had a duplicate i hadn't caught. the ai can read logs and databases but it can't open your google calendar. your willingness to verify instead of trust is what caught real issues.

### 4. you connect dots across systems the ai doesn't see

"feedback links have different logic" — you flagged this right before we would have shipped a version that silently broke feedback link bookings. the ai saw the code but didn't think about the different booking flow. "can we use meetings@ for feedback links now?" — you immediately saw the implication of removing the FIFO limit that the ai didn't surface. your knowledge of the business logic catches gaps that pure code analysis misses.

### 5. you keep the scope tight and practical

"do we even need the admin onboarding flow? we're not connecting their calendar." one question that eliminated 315 lines of code. you consistently asked "do we need this?" before building, which is the opposite of how most people work with ai (they ask the ai to build more, not less). the session could have ended with mirror mode as a permanent feature; instead you pushed to simplify.

### 6. you use screenshots as bug reports

the partners search bug, the duplicate calendar events, the gcal auto-accept issue — all communicated via screenshots. this is faster and more precise than describing what you see. it removes ambiguity and gives the ai exact context about what the user is experiencing vs what the code thinks is happening.

---

## what could work better

### 1. let the ai run the credential audit before forming theories

early in the session, we spent time discussing whether FIFO eviction was the cause, whether caching was involved, and what the 100-token limit meant. if we'd run the audit script first (which took ~2 minutes), we would have known immediately that we were at 80/100 (not 99/100) and that there were no orphaned duplicates. data first, theories second.

### 2. flag known system differences earlier

the feedback link booking flow being different from regular bookings was flagged late — after we'd already deployed the switch. if you have a mental list of "things that work differently" (feedback links, brand users, override bookings, etc.), surfacing those before a major change lets the ai account for them in the initial implementation rather than patching after.

### 3. test the exact transition scenario before flipping

we tested mirror mode (new bookings create events correctly) but didn't test a reschedule-of-pre-switch-booking until after going live. this was the scenario that produced the duplicate. a 5-minute test — book through peter, flip the switch, reschedule — would have caught the title mismatch issue before real users hit it.

---

## patterns for others building with claude code

### give the ai access to production systems
this session would have taken 3x longer without SSH access to the DO droplet. checking logs, querying the database, running the credential audit, verifying gcal events — all done directly by the ai. if your security model allows it, this is the single biggest time-saver.

### use the ai for investigation, not just implementation
the most valuable part of this session wasn't writing code — it was the credential audit that counted 99 tokens across 113 hosts, the API call analysis that found 5,400 unnecessary calls in 3 hours, and the forensic logging that will help debug the next disconnection. the ai is good at building things but it's equally good at answering "what's actually happening?"

### push back when the ai is guessing
the ai will present hypotheses as likely explanations. "google rate-limited the token" sounds reasonable but was probably wrong. when you ask "how confident are you?" or "why would X and not Y?", the ai recalibrates and gives you a more honest assessment. this is especially important for debugging where confidence and correctness are different things.

### think about the migration path, not just the end state
the end state (our own gcal events, no meetings@ requirement, simplified onboarding) was clear early in the session. most of the work was the migration: mirror mode for testing, transition handling for pre-switch bookings, fuzzy title matching for Cal.com's different formats, feedback link edge cases. when you ask the ai to build a feature, also ask "how do we get from here to there without breaking what's live?"

### keep documentation as part of the work, not after
updating app-context.md and the infra skill at the end of the session means the next person (or ai) working on this code starts with accurate context. if this hadn't been done, the next session would start with docs that say "dual-calendar setup" and "connect meetings@dtcmvp.com" — completely wrong for the new system.

### verify the ai's output against the real world
logs, databases, and code can all say one thing while the user sees another. the duplicate calendar event wasn't in any error log — it only showed up when peter checked the actual google calendar. the PST/PDT time confusion wasn't a code bug — it was a display error in the ai's output. trust but verify.
