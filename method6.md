# method 6: debugging a production scraper with claude code

a real-world session analysis — investigating a nightly LinkedIn scraper on DigitalOcean, adding credit exhaustion alerts, backfilling missing data, and navigating Docker/PM2/env var gotchas.

---

## what peter does well

### starts with a specific question, not a vague task

"can you check if we updated so that 403 out of credit errors send a slack message tagging sean and jake?" — this is a question with a clear yes/no answer. it points claude at exactly the right file and the right behavior to verify. claude didn't have to explore the whole codebase; it could go straight to the scraper, search for 403/slack handling, and give a direct answer. compare this to "can you check the scraper is working" — that would've triggered a broader, slower investigation.

### delegates infrastructure knowledge to the skill system

peter didn't explain where the scraper lives, how to SSH into DO, or how PM2 works inside Docker. the `/dtcmvp-infra` skill loaded all of that context automatically. this is the payoff of investing in skill docs: every future conversation starts at full speed instead of re-explaining the architecture. the skill even included the exact `docker exec` commands for checking scraper logs, which claude used verbatim.

### corrects scope quickly

"actually tag sean and peter instead" — one sentence, no explanation needed. when claude asked if it needed member IDs, peter provided them immediately with the mapping (peter: U09FG6T7N84, sean: U07BGPDCFP1, jacob: U09PDQRNVEZ). no back-and-forth, no ambiguity. fast corrections like this keep momentum.

### follows up on results instead of assuming success

"there's half as many posts as there usually are. did it do a full backfill or is there a gap?" — peter didn't just see the scraper run and move on. he checked the actual output against his expectations. this caught a real problem: the scraper used a 24h window by default, so it only grabbed one day of posts instead of backfilling the 3-day gap. without this follow-up, the gap would have persisted silently.

### challenges the AI's assumptions with evidence

when claude said the backfill was running, peter came back with a screenshot: "this was yesterday on the 17th. so it should have posts from 16-17. did that just not work?" — he wasn't guessing. he had the terminal output showing exactly when the run was kicked off. this forced claude to dig deeper and discover the real issue (scraper completed with 0 posts because Apify returned empty data instead of an error code).

### knows when to stop

"that's ok let's let the friday run catch it" — after the backfill recovered most of the gap, peter recognized that chasing 100% coverage immediately wasn't worth the extra Apify cost. the friday full-TAM sweep would handle it naturally. knowing when a 90% fix is good enough is underrated. many sessions go long because both sides keep polishing.

---

## what could work better

### verify the first run before walking away

the initial backfill command (`docker exec -d`) ran detached, and nobody checked if it actually started. it silently crashed on startup due to a missing `database_schema.sql` file (wrong working directory). peter came back later asking "can you check on it?" only to find the process had died immediately. a quick `sleep 3 && ps aux | grep scraper` after the exec would have caught this in seconds instead of losing time.

a good habit: any time you kick something off in the background, immediately verify it's actually running. `docker exec -d` and `nohup` are both fire-and-forget — they don't tell you if the process died 1 second later.

### ask claude to run it attached first for one-off jobs

PM2 cron jobs have their working directory, env vars, and log routing configured. `docker exec -d` has none of that. this session hit three separate issues from running the scraper manually: wrong working directory (`database_schema.sql` not found), missing env var (`SCRAPER_DB_PATH` defaulting to a relative path that created an empty DB), and a Slack channel that didn't resolve. running it attached the first time would have surfaced all three immediately instead of discovering them one at a time across multiple attempts.

### flag known environment differences early

peter likely knew the scraper runs via PM2 cron nightly, but when asking claude to "run it to catch up," neither side paused to ask "does running it manually via docker exec match how PM2 runs it?" the answer was no — PM2 sets `cwd` and environment variables that `docker exec` doesn't. stating "it normally runs via PM2 with these env vars" upfront would have saved 3 failed attempts.

---

## patterns worth noting for other claude code users

### the silent failure problem

the most interesting bug in this session wasn't a crash — it was Apify returning HTTP 200 with empty data when credits were exhausted. the scraper "completed successfully" three days in a row with 0 posts. no error, no alert, no indication anything was wrong. the 403 check claude added first wouldn't have caught it.

the lesson: don't just check for errors. check for suspiciously successful results. the empty batch detection (3 consecutive batches with 0 posts → alert and halt) is a pattern worth copying for any scraper or data pipeline. "the API said everything was fine" is sometimes the most dangerous failure mode.

### production debugging requires production access

this session would have been impossible without SSH access to the DO droplet. claude checked PM2 logs, queried SQLite directly, inspected the scraping_runs table, compared post counts by day, verified processes were running, and examined log files — all on the live system. if peter had to run each command manually and paste the output, this would have taken 3x as long. giving claude direct access to production (with appropriate guardrails like the CLAUDE.md restrictions) is what makes infrastructure debugging fast.

### the cost of "it looks like it worked"

three separate times in this session, something appeared to work but didn't:
1. the scraper "completed" for 3 days with 0 posts (Apify credit exhaustion)
2. the first backfill command succeeded (exit code 0) but the process died immediately
3. the second backfill attempt ran but connected to an empty database (wrong env var)

each one required digging one layer deeper than the surface result. the pattern for claude code users: always verify the actual output, not just the exit code. `echo "started successfully"` means nothing if the process crashes 1 second later.

### manual runs vs cron runs are different environments

PM2, Docker, cron, and systemd all set up different environments (working directory, env vars, PATH, user context). a script that works perfectly under PM2 may fail under `docker exec` because PM2 sets `cwd: "/app/scraper"` and passes `SCRAPER_DB_PATH` from the ecosystem config. when running production scripts manually for one-off tasks, always check what environment the normal execution path provides and replicate it.
