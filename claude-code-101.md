# claude code 101 — a framework for building real software with AI

*synthesized from observed patterns across production teams using claude code to ship real products to real customers.*

---

## who this is for

you've never used AI to build software before. maybe you're technical, maybe you're not. either way, you're about to work alongside an AI that can write code, run commands, debug production systems, and deploy changes — but only if you know how to collaborate with it.

this isn't a tool manual. it's a framework for a new kind of working relationship.

---

## the core insight: you're not "using a tool" — you're running a team

the biggest mistake new users make is treating AI like autocomplete or a search engine. type a question, get an answer, done.

the teams that ship real software with claude code treat it more like hiring a very fast, very knowledgeable junior engineer who has amnesia between shifts. they show up every day ready to work, they know every programming language, they can read any codebase in seconds — but they don't remember what you told them yesterday unless you wrote it down somewhere they can find it.

your job isn't to write code. your job is to be the person who:
- **knows what to build** (product direction)
- **knows what matters** (business context)
- **knows what's fragile** (production awareness)
- **verifies what actually happened** (quality control)

the AI's job is everything else: writing the code, running the commands, debugging the errors, deploying the changes.

---

## the five things you bring to the collaboration

### 1. direction — "what are we building and why?"

the AI can build anything. it cannot decide what to build. that's you.

**the restaurant kitchen metaphor:** you're the head chef deciding the menu. the AI is the entire kitchen staff — prep cooks, line cooks, dishwashers. they can execute any recipe brilliantly, but if you say "make something good," you'll get something random. if you say "make a mushroom risotto, the rice is in the third pantry, and the customer is lactose intolerant," you'll get exactly what you need.

**what this looks like in practice:**
- "we need a signup flow that emails users a notification when content they've already read gets updated" (good — describes the outcome)
- "create a React component with useState hooks and a Postgres table" (less good — prescribes implementation before the AI understands the problem)

describe outcomes, not implementations. let the AI propose the architecture, then steer it.

### 2. context — "here's what you can't see from the code"

the AI can read every file in your codebase. what it can't see:
- who your customers are and what they care about
- which systems are fragile and which are robust
- what your team tried last month that didn't work
- why that weird workaround exists in the billing code
- that your co-founder is about to demo this to investors on thursday

this context changes everything about how the AI should approach a task.

**the new employee metaphor:** imagine onboarding someone brilliant who's never worked at your company. you'd tell them "don't touch the legacy billing module — it looks simple but it's load-bearing for 200 customers" and "the CEO checks the dashboard every morning at 8am, so don't deploy between 7 and 9." you'd give them the same context you give the AI.

### 3. judgment — "is this actually right?"

the AI will confidently present hypotheses as conclusions. it will tell you "the database is probably rate-limiting because of too many connections" when the real issue is that someone unplugged the ethernet cable.

**the GPS metaphor:** AI is like a GPS that's usually right but sometimes confidently drives you into a lake. your job is to look out the window. when the AI says "the issue is X," ask:
- "how confident are you?" (forces honesty)
- "why would it affect X but not Y?" (tests the logic)
- "what evidence would prove you wrong?" (reveals blind spots)

teams that ship reliable software push back on AI guesses. they verify database contents directly instead of trusting the AI's interpretation. they check the actual calendar instead of believing the logs. they screenshot what they see on their phone and send it to the AI because "the UI looks broken" and "the API returned a 500 error" are two different problems.

### 4. risk awareness — "what could go wrong?"

the AI optimizes for completing the task. you optimize for not destroying what's already working.

**the surgery metaphor:** the AI is an incredibly fast surgeon who can perform any operation. but it doesn't feel pain when the patient flinches. you're the one who says "wait — we need to test this on staging before we flip the switch on production" or "what happens to the 47 bookings that were created before this change?"

questions that prevent disasters:
- "what happens to existing data when we make this change?"
- "can we roll this back if it breaks?"
- "does this affect the other thing that depends on this?"
- "should we test this on one user before rolling it out to everyone?"

### 5. verification — "prove it actually works"

the most dangerous phrase in AI-assisted development is "it looks like it worked."

**the pilot metaphor:** after a pilot programs the autopilot, they don't take a nap. they monitor the instruments, cross-check with visual references, and verify the plane is actually going where it should. the autopilot is good — but "good" and "infallible" are different words.

**three things that "worked" but didn't (real examples):**
- a data scraper ran for 3 days, reported success each time, but collected zero records because the API silently returned empty results when credits ran out
- a background process started "successfully" but crashed 1 second later — the exit code was 0 because the crash happened after the launch confirmation
- a calendar integration created events correctly but put them at the wrong time because the AI confused PST and PDT

verification means checking the actual output, not just the exit code. query the database. open the calendar. check the email. load the page on your phone.

---

## the three layers of AI memory

out of the box, the AI forgets everything between conversations. that's fine for asking questions. it's useless for building software over weeks and months.

production teams solve this with three layers:

### layer 1: the rules file (CLAUDE.md) — "how we do things here"

**the employee handbook metaphor:** every company has norms. don't use `git push --force`. always add logging. commit after every change. don't change the approach without asking first. these go in a file that the AI reads at the start of every conversation.

this file is short, opinionated, and non-negotiable. it's the stuff that would get a human engineer a talking-to if they violated it.

**what goes here:**
- safety rails (what never to do)
- coding standards (logging, error handling, commit habits)
- troubleshooting philosophy (investigate before suggesting, fix root causes)
- team norms (notify the team before touching shared code)

### layer 2: skills — "here's everything about X"

**the specialist's brain metaphor:** when you go to a cardiologist, you don't start by explaining what a heart is. the specialist already knows the anatomy, the common problems, and the standard treatments. they just need to know YOUR symptoms.

skills are documents that give the AI specialist-level knowledge about specific domains: your infrastructure, your deployment process, your API integrations, your business workflows. when you mention "deploy" or "calendar integration," the relevant skill loads automatically and the AI instantly knows your server IPs, SSH credentials, Docker commands, and deployment SOPs.

**what goes in a skill:**
- exact commands for common operations (copy-paste ready)
- architecture diagrams and system maps
- API reference with auth details and gotchas
- step-by-step checklists for complex processes
- known bugs and workarounds

### layer 3: memory — "what we learned last time"

**the team wiki metaphor:** after you discover that "Airtable's FIND formula silently fails on linked records" or "the deploy script uses rsync so you MUST push to git first," you write it down. memory is where these learnings live so the AI doesn't make the same mistake twice.

memory stores: who you are, what you're working on, corrections the AI received, and architectural decisions that aren't obvious from the code.

---

## the workflow: how a real session works

### phase 1: orient

the AI loads your rules file, relevant skills, and memory automatically. within the first few seconds of a conversation, it already knows your infrastructure, your coding standards, and who you are. no re-explaining needed.

**what you do:** state what you want to accomplish. be specific. "the webhook server is returning 500 errors on the /booking endpoint" is better than "something's broken."

### phase 2: plan

for anything beyond a simple fix, the AI proposes a plan. you review it.

**the blueprint review metaphor:** you're the building owner reviewing the architect's blueprints. you don't need to know how to calculate load-bearing requirements — but you do need to say "there's no bathroom on this floor" and "the front door opens into a wall."

**what you do:** look for missing requirements, edge cases, and things the AI doesn't know about your system. "what about the mobile app that also calls this endpoint?" or "that database has 4 million rows — will this query be fast enough?"

### phase 3: build

the AI writes code, creates files, runs commands, and deploys changes. you don't need to watch every keystroke.

**the construction site metaphor:** you hired the crew. you approved the blueprints. you don't need to hold every nail. check in at milestones — "the foundation is done" and "the framing is up" — not after every hammer swing.

**what you do:** stay available for questions. provide context the AI can't infer ("the config file is in an unusual location because we moved it last week"). correct mistakes as soon as you see them — it's cheaper to fix direction early than to rebuild later.

### phase 4: verify

this is where most people drop the ball. the AI says "done" and you say "great." then three days later a customer reports a bug.

**what you do:**
- test the actual feature on a real device
- check the database for correct data
- verify the deployment is live and serving the right version
- test the edge cases: what happens with no data? with 10,000 rows? on mobile? when the network is slow?

### phase 5: document

update the skill docs and memory with what you learned. the AI helped you discover that "PM2 needs `--update-env` to pick up .env changes" — write that down so neither of you has to discover it again.

---

## common mistakes (and how to avoid them)

### mistake 1: being too vague

**bad:** "fix the login"
**good:** "users on mobile Safari are getting a white screen after entering their email OTP. the console shows a CORS error. this started after we deployed yesterday."

the more specific your description, the fewer wrong turns the AI takes. include: what you expected, what actually happened, when it started, and what changed recently.

### mistake 2: not pushing back

the AI sounds confident even when it's guessing. if you accept every suggestion without questioning it, you'll end up fixing the wrong problem half the time.

**develop the reflex:** when the AI says "the issue is probably X," ask "what makes you think so?" or "what else could cause this?" one extra question can save an hour of debugging the wrong thing.

### mistake 3: skipping verification

"the AI said it works" is not verification. verification means YOU confirmed the result with YOUR eyes on the ACTUAL system. query the database. load the page. check the email. open the calendar.

### mistake 4: re-explaining everything every session

if you find yourself saying the same things every conversation — "our database is at this path" or "always use this deployment script" — you're not using the memory system. write it down once. let the AI read it every time.

### mistake 5: micromanaging implementation

you don't need to specify which React hooks to use or how to structure the SQL query. describe the outcome you want and let the AI figure out the implementation. intervene at decision points (architecture, tradeoffs, business rules), not at every line of code.

### mistake 6: trying to specify everything upfront

you can't predict every edge case before building. the best workflow is: build the core feature, test it, discover what's missing, iterate. real requirements emerge from real usage. "what about users who dismiss the modal?" is a question you'll ask after seeing the modal, not before.

---

## the investment that compounds

the teams that get the most value from AI-assisted development are the ones that invest in their scaffolding:

- **a well-maintained rules file** means every conversation starts with good habits
- **comprehensive skills** mean the AI operates at expert level from the first message
- **clean memory** means discoveries are never lost
- **version-controlled configs** mean team improvements benefit everyone

this is the counterintuitive part: the time spent writing documentation for the AI pays back more than the time spent writing code. a 30-minute skill doc saves 15 minutes per conversation, forever. after 20 conversations, that's 5 hours saved. after 100, it's 25 hours.

the teams that write the best skills debug the fastest, ship the most reliably, and onboard new collaborators — human or AI — with the least friction.

---

## one last metaphor

building software with AI is like conducting an orchestra. you don't play every instrument — you couldn't, and you don't need to. but you need to:
- choose the piece (what to build)
- set the tempo (when to ship)
- bring in the right sections at the right time (which skills to invoke)
- listen for wrong notes (verify the output)
- keep everyone on the same page (documentation)

the musicians are world-class. your job is to make sure they're playing the same song.

---

*this framework will evolve. the best practices of today will be the defaults of tomorrow. what matters is starting — and writing down what you learn along the way.*
