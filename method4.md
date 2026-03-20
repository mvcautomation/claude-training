# method 4: designing and shipping a production feature end-to-end

based on a real session: adding tier 2 contact discovery to a monthly apollo roster script, fixing a broken cron scheduler, and beginning to design a client-facing contact discovery feature.

---

## what peter does well

### 1. starts with curiosity, not a spec

the session opened with "find the monthly apollo run that gets the top 10 contacts" — not "add tier 2 to the roster discovery script." peter wanted to understand the existing system before deciding what to change. then: "i'm curious what it would look like to get a 2nd tier." this exploratory framing gives the ai room to explain trade-offs instead of just executing a predetermined plan.

this matters because the ai often knows things about the codebase the user has forgotten or never knew. starting with "what do we have?" before "change it to X" surfaces information that shapes better decisions.

### 2. challenges assumptions at every level

when i said the cron would fire "in about 3 hours," peter immediately caught that 1am PST on the 15th was 20+ hours ago. when i proposed a sleep-based workaround for PM2's cron limitation, peter didn't just accept it — "does a sleep get interrupted by deploys? why isn't there just some way to schedule it for the 15th whether there's a deploy or not?" this pushed us from a hacky fix to a proper solution (system crontab).

the pattern: peter doesn't just review the code — he stress-tests the assumptions behind the code. "what if we don't deploy for days?" is the kind of question that catches production failures before they happen.

### 3. makes naming decisions that matter

"added 'TAM Discovery Tier' so it's clear what it's for" — a small thing, but it shows peter thinks about how data will be interpreted by someone who doesn't have this conversation's context. naming an airtable field "Discovery Tier" is technically fine; naming it "TAM Discovery Tier" means anyone browsing the contacts table immediately understands what it is.

### 4. asks the questions the ai should have asked

"is that a dry run or live run?" — i had triggered a live run without explicitly confirming peter wanted that. "any t1 contacts from last run drop off/got replaced?" — a question about data integrity that the feature design should have addressed. "how many new tier 2 contacts were there?" — wanting to verify the feature actually did what it was supposed to in production, not just that it ran without errors.

### 5. knows when to stop planning and ship

after the tier 2 logic was done and the cron fix was in place, peter didn't ask for more tests or edge case analysis. "sure" — deploy it, trigger it, watch the logs. the feature was well-understood, the guard rails were in place (dedup, budget limits, dry-run mode), and waiting longer wouldn't reduce risk. this bias toward shipping with good-enough safety nets is why things actually get built.

### 6. sets the collaboration style explicitly

"i like planning to be more of a conversation first rather than everything i say you update a plan and i have to approve/deny/modify every time." this is high-value meta-communication. it tells the ai how to engage — conversationally, exploring ideas together — rather than falling into a rigid plan-approve-execute loop that slows down creative thinking.

---

## what could work better

### 1. confirming destructive-ish actions before they happen

i triggered a live `--force` run against production without asking "dry run first or go live?" the results were fine — the script has good guard rails — but the pattern of deploying new code and immediately running it live against 3,000 companies is worth a beat of confirmation. a quick "want me to do a dry run with --limit 5 first?" would have been the safer default.

### 2. stating the full scope earlier

the session evolved organically: tier 2 → cron fix → entrypoint refactor → client-facing feature design. each step made sense, but the cron issue was only discovered because we happened to check the logs. if peter had started with "i want to add tier 2 AND make sure this thing actually runs reliably every month," the cron fix would have been part of the original plan instead of a mid-session discovery.

this is the natural tension between exploratory sessions (which peter prefers and which produce better results) and upfront planning (which catches more issues in one pass). it's not a problem to fix — just a trade-off to be aware of.

### 3. flagging what's already been done in airtable

peter created the "TAM Discovery Tier" field in airtable manually, then told me the name after the fact. i had already written code referencing "Discovery Tier." this was a one-line fix, but the pattern scales poorly — if the ai is writing code that references external systems (airtable fields, slack channels, stripe products), sharing the exact names/IDs before the ai writes the code eliminates a round of corrections.

---

## patterns worth stealing

### the "curiosity → conversation → conviction → code" flow

this session followed a natural arc:
1. **curiosity**: "what does the roster discovery do?"
2. **conversation**: "what would tier 2 look like? what about credits?"
3. **conviction**: "let's do it — go as far as credits allow, same campaigns"
4. **code**: implement, deploy, verify in production

most people skip steps 1-2 and go straight to "build me X." the conversation phase is where peter and the ai aligned on credit strategy, campaign routing, and tier semantics — decisions that would have been wrong guesses if skipped.

### production verification as part of the feature

peter didn't consider the feature done when the code compiled or even when it deployed. he watched the live logs, checked T1 vs T2 counts, asked about contacts that might have dropped off, and verified the credit usage. the feature was done when production data confirmed it worked correctly. this is a mindset shift from "it deploys = it works" to "the data is right = it works."

### catching infrastructure rot while building features

the broken cron was unrelated to the tier 2 feature — it had been silently failing for a month. peter caught it because he asked "did it already run?" instead of just deploying the new code. this habit of checking the current state of the system before modifying it surfaces problems that would otherwise compound silently.

### using the ai for ops, not just code

peter used claude to SSH into servers, check PM2 status, read logs, trigger runs, and verify deployments. the ai wasn't just a code generator — it was an operator. this is under-utilized by most claude code users who treat it as an editor. if you give the ai access to your infrastructure, it can close the loop from code → deploy → verify without you context-switching.

---

## key takeaways for new claude code users

1. **start with "what do we have?" not "build me X."** understanding the existing system before modifying it produces better designs and catches issues the ai would miss if it just started coding.

2. **challenge the ai's assumptions about infrastructure.** the ai will propose solutions that work in theory but fail in your specific environment. "what if PM2 doesn't restart?" and "what if we don't deploy for a week?" are the questions that find real bugs.

3. **set the collaboration style you want.** if you want a conversation, say so. if you want a plan, use plan mode. the ai defaults to whatever mode it's in — telling it how you want to work changes the quality of the interaction.

4. **verify features with production data, not just clean deploys.** a feature that compiles, deploys, and runs without errors can still produce wrong data. check the actual output.

5. **name things for the person who doesn't have your context.** "TAM Discovery Tier" is better than "Discovery Tier" because six months from now nobody will remember what "discovery" referred to.

6. **use the ai as an operator, not just a coder.** let it SSH, check logs, run queries, trigger jobs. the value multiplies when the ai can verify its own work against the real system.
