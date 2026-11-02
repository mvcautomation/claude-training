# Claude Code 101: Building Real Software with AI

*A markdown copy of [course.similearnai.com](https://course.similearnai.com), exported November 2, 2026. Quiz answers are marked (correct).*

A framework for people who've never used AI to build software, based on how real teams ship real products to real customers.

### What You'll Learn

This is not a tool tutorial. It's a framework for a new kind of working relationship, one where you bring judgment, context, and direction while AI handles implementation at superhuman speed.

Two parts. Part 1 (12 chapters, about 45 minutes) gets you working with Claude and set up. Part 2 (10 chapters, about 45 minutes) teaches you to hand Claude whole pieces of work: why big context, swarms and loops changed what one person can do, then kickoffs, unattended builds, reviewer agents, and keeping a live app healthy. 66 quizzes to make it stick.

#### What's New (updated October 26, 2026)

Already partway through? Here's what changed.

- Ch 1: a new story: one builder rebuilt a game for web, iPhone and Android in about three hours
- Ch 2: two more things only you can do: "Taste" and "The Doors Only a Human Can Open"
- Ch 3: new section: "It Grades Its Own Homework Generously"
- Ch 4: new section: "Correct with a Conviction, Not Just a No" (and typos are fine)
- Ch 5: new sections on skills that improve after every failure, and on hooks
- Ch 6: the workflow is now six phases, adding "Check" and "Play and Adjust"
- Ch 7: new section: "Start Fresh More Often Than Feels Natural"
- Ch 8: new Rule 6: "Ask What Wasn't Proven", with a real outage story
- Ch 9: three new traps (8 to 10)
- Ch 10: a new story about reusing work across projects
- Ch 11: new sections: "The Commands That Can't Be Undone" and worktrees
- Ch 12: the starter kit now has seven skills. Download it again to get them
- Part 2 (Ch 13 to 22): all new. Why big context, swarms and loops changed the work, then kickoffs, artifacts, unattended runs, reviewer agents, parallel sessions, watching a live app, hosting, and a capstone

#### Part 1: Working with Claude

- The mindset shift: you're running a team, not using a tool
- What you bring: the human contributions AI can't replace
- How Claude actually works: a plain-english look under the hood
- Talking to AI: how specificity changes everything
- The three layers of memory: how AI remembers
- The workflow: kick off, plan, build, check, play and adjust, document
- Managing context: protect working memory, never lose your work
- Debugging with AI: when things go wrong
- Common mistakes: the traps everyone falls into
- The investment that compounds: building your scaffolding
- GitHub essentials: commits, pushing, repos, and staying safe
- Environment setup: install your tools and create your first repo

#### Part 2: Shipping with a Crew

- Why this changed everything: a huge working memory, swarms of agents, and loops
- The kickoff brief: start a build so Claude can keep going without you
- Artifacts: review by looking, decide with a tap
- Unattended work and loops: what keeps running when you close the laptop
- Adversarial agents: a second Claude that tries to break it
- Adversarial prompting: questions that make Claude argue against itself
- Parallel sessions: more than one Claude at a time, and when not to
- Watching production: find out it's broken before users do
- Where your app lives: Vercel, a home server, a rented server, or a container
- Capstone: ship something, start to finish


---

## Chapter 1: The Mindset Shift

*You're not using a tool, you're running a team*

The biggest mistake new users make is treating AI like a search engine. Type a question, get an answer, done.

The teams that actually ship software with AI treat it differently. They treat it like hiring a brilliant junior engineer who has amnesia between shifts.

This engineer shows up every day ready to work. They know every programming language. They can read any codebase in seconds. But they don't remember what you told them yesterday unless you wrote it down somewhere they can find it.

### Set the Collaboration Style

One thing the best teams do that others skip: they tell the AI *how* they want to work, not just *what* to build. "I want this to be a conversation first. Explore ideas with me before committing to a plan." Or "just execute this, I've already decided." The AI defaults to whatever mode it's in. Telling it how you want to engage changes the quality of the whole interaction.

> **Mental model: The Orchestra Conductor**
>
> Building software with AI is like conducting an orchestra. You don't play every instrument (you couldn't, and you don't need to) but you choose the piece (what to build), set the tempo (when to ship), bring in the right sections at the right time (which capabilities to invoke), listen for wrong notes (verify the output), and keep everyone on the same page (documentation). The musicians are world-class. Your job is to make sure they're playing the same song.

### Your Actual Job

Your job isn't to write code. It's to be the person who:

1. **knows what to build**: product direction
2. **knows what matters**: business context
3. **knows what's fragile**: production awareness
4. **verifies what actually happened**: quality control

> **From the field**
>
> A startup team needed to migrate their task management system from a local server to a shared cloud server, adding multi-user support along the way. The human never wrote a line of code. They described what they wanted ("port the whole thing over to the cloud server"), provided context the AI couldn't infer ("my teammate doesn't have a local copy of the repo"), and caught gaps the AI missed ("does it search DMs too?"). The migration shipped in one session.
>
> *The human's contribution wasn't code. It was direction, context, and quality control.*

> **From the field**
>
> A builder had an old browser game: hide-and-seek on a map, played on phones. In about three hours of their own time, spread over one evening and the next morning, Claude rebuilt the game server, wrote native iPhone and Android versions, tested them against each other with scripted bot players on simulators, and prepared both app store submissions. The builder's messages were short. They said what to keep ("keep the always-on meter"), what they believed ("multiplayer by default is a strong conviction of mine"), and which option to pick when Claude laid out choices.
>
> *The builder spent about three hours. The speed came from clear direction and stated convictions.*

**Check your understanding:** What's the primary role of the human when building software with AI?

- Writing the code and reviewing it line by line
- Telling the AI exactly which functions and variables to use
- **Providing direction, context, and verification (correct)**
- Debugging every error message yourself before asking the AI

*Why:* The most effective humans focus on what the AI can't do: deciding what to build, providing business context, catching things the AI can't see, and verifying the actual results.

**Check your understanding:** Why is AI compared to "a brilliant junior engineer with amnesia"?

- Because it makes a lot of mistakes
- **Because it's highly capable but forgets everything between conversations unless you write things down (correct)**
- Because it needs constant supervision on every line of code
- Because it's slow and needs hand-holding

*Why:* The AI is genuinely capable. It knows every language and can read codebases instantly. The "amnesia" is the key insight: without persistent context (rules, skills, memory), every conversation starts from zero.

**Check your understanding:** In the orchestra metaphor, what does "listening for wrong notes" represent?

- Reading every line of code the AI writes
- Running the test suite
- **Verifying the AI's output against reality, checking the actual results (correct)**
- Asking the AI to explain its code

*Why:* A conductor doesn't read sheet music for every instrument. They listen to the actual sound. Similarly, you verify by checking real results: loading the page, querying the database, testing on your phone. Not by reading every line of code.


---

## Chapter 2: The Things Only You Can Do

*What you bring to the collaboration that AI cannot replace*

### 1. Direction

The AI can build anything. It cannot decide *what* to build. That's you.

> **Mental model: The Restaurant Kitchen**
>
> You're the head chef deciding the menu. The AI is the entire kitchen staff. They can execute any recipe brilliantly, but if you say "make something good," you'll get something random. If you say "make a mushroom risotto, the rice is in the third pantry, and the customer is lactose intolerant," you'll get exactly what you need.

### 2. Context

The AI can read every file in your codebase. What it can't see: who your customers are, which systems are fragile, what your team tried last month that didn't work, why that weird workaround exists, or that the CEO is demoing this to investors on Thursday.

### 3. Judgment

The AI will confidently present guesses as conclusions. It might tell you "the database is rate-limiting" when someone actually unplugged the ethernet cable.

> **Mental model: The GPS**
>
> AI is like a GPS that's usually right but sometimes confidently drives you into a lake. Your job is to look out the window. When the AI says "the issue is X," ask: "how confident are you?" (makes it admit when it is guessing), "why X but not Y?" (tests the logic), and "what would prove you wrong?" (reveals blind spots).

### 4. Risk Awareness

The AI optimizes for completing the task. You optimize for not destroying what's already working. You're the one who says "what happens to the 47 existing bookings when we make this change?"

### 5. Verification

The most dangerous phrase in AI-assisted development: **"it looks like it worked."**

> **From the field**
>
> A team's data scraper ran for 3 straight days, reporting success each time. Zero records collected. The API had silently returned empty results when credits ran out. No error, no warning, just "success" with nothing inside.
>
> *Verification means checking the actual output, not just the exit code. Query the database. Open the calendar. Load the page on your phone.*

### 6. Taste

Claude can make something that works. Whether it feels right is your call. In one app build, the first version worked end to end within half an hour, and the builder's first reaction was "kinda boring and cold." The next several rounds were all taste: warmer colors, drawings that fit, a candle on the table that looked too romantic for a friends' get-together. None of that shows up in a test. It shows up when a person holds the phone.

### 7. The Doors Only a Human Can Open

Some steps need a real person by design: creating an Apple or Google developer account, agreeing to a contract, entering a payment card, filling in privacy forms in a store console, and publishing an Android app's first production release. Claude can tell you exactly what to click, and can often do everything around it, but it can't open those doors for you. Knowing which steps are yours keeps a project from stalling while Claude waits.

**Check your understanding:** A data pipeline reports "completed successfully" three days in a row. What should you do?

- Trust the success message. If it says it worked, it worked
- **Check the actual output data to confirm records were collected (correct)**
- Wait for users to report problems
- Rewrite the pipeline from scratch to be safe

*Why:* "Success" only means the process didn't crash. It doesn't guarantee the output is correct. Always verify the actual results, not just the status code.

**Check your understanding:** Which of these is something the AI CANNOT do, no matter how good it gets?

- Write code in any programming language
- Read and understand your entire codebase
- **Know that your CEO is demoing the product to investors on Thursday (correct)**
- Debug a complex multi-step error

*Why:* The AI can read code, write code, and debug, but it can't know your business context unless you tell it. Deadlines, stakeholder expectations, team dynamics, and customer sensitivities are all invisible to the AI.

**Check your understanding:** The AI proposes a database migration. What question best demonstrates "risk awareness"?

- "which SQL dialect should we use?"
- "can you make it run faster?"
- **"what happens to the 4,700 existing records during the migration? can we roll back?" (correct)**
- "can you add better variable names?"

*Why:* Risk awareness means thinking about what could go wrong with existing data and live systems. The AI optimizes for completing the task; you optimize for not breaking what's already working.


---

## Chapter 3: How Claude Actually Works

*A plain-english look under the hood, and why it matters*

You don't need to understand how an engine works to drive a car. But knowing it needs oil, overheats, and won't run on water makes you a much safer driver. Same with Claude. Here's what's actually happening under the hood, in plain english, and the three things it means for how you work.

### It's a Prediction Machine, Not a Fact Lookup

Claude was trained by reading an enormous slice of the internet, books, and code, and learning to do one thing astonishingly well: predict what comes next. That's it. When you ask it something, it isn't looking up an answer in a database. It's generating the most plausible continuation, a little at a time, based on patterns it learned.

Most of the time the most plausible continuation IS the correct answer, because true things are what showed up most in its training. But not always, and that gap is where everything else in this chapter comes from.

> **Mental model: The World's Most Well-Read Autocomplete**
>
> Your phone's autocomplete guesses your next word from the texts you've sent. Claude does the same thing, but having read more than any human ever could. That's why it sounds so fluent, and why it will sometimes finish a sentence with something that simply isn't true, just as confidently as it states a fact.

### Why It "Makes Things Up"

Here's the key: Claude has no built-in alarm that goes off when it doesn't know something. It doesn't pause and ask itself "do I actually know this?" It just produces the most natural-sounding answer. When it genuinely knows, that answer is right. When it doesn't, it produces a confident, plausible guess anyway: a made-up citation, a function that doesn't exist, a date that's slightly wrong. This is called a *hallucination*, and it looks exactly as confident as a real answer.

> **Mental model: The Exam with No Penalty for Guessing**
>
> Imagine a test where a blank answer scores zero but a wrong guess might get lucky. The smart move is to always guess, never leave it blank. AI was effectively trained under those rules, so when it's unsure, it guesses rather than admits it doesn't know. Newer models are better at saying "I'm not sure," but the instinct to produce a confident answer is baked deep.

**what this means for you:** you can't verify everything. That's exhausting, and it cancels out the speed that made the AI worth using in the first place. The real skill is knowing *when* the risk of a made-up answer is high, and spending your attention there.

### Where Hallucinations Hide (and Where They Don't)

Before trusting an answer, ask yourself one question: **is this something discussed widely and accurately in text on the internet?**

**low risk**: popular programming languages, well-documented tools, established facts. These showed up thousands of times in training, so the "most plausible answer" is almost always the right one. You rarely need to second-guess Claude on how a common React feature works.

**high risk**: anything niche or barely written about, anything highly debated or subjective, anything newer than the model's training cutoff, and above all, *anything specific to you*: your codebase, your data, your private setup. The model never saw those, so whatever it says about them is a guess dressed up as a fact.

### For Your Own Code, Make It Look Instead of Guess

Your codebase was never in Claude's training, so "what does our code actually do?" is exactly where it's most tempted to assume. Two habits kill most of these hallucinations:

1. **tell it not to guess.** "don't make assumptions, go read the actual files and use tool calls when you're unsure what's really there."
2. **check afterward.** if an answer comes back suspiciously fast, ask: "did you actually check that, or answer from assumption?" It's a surprisingly reliable way to catch a confident guess.

> **a great CLAUDE.md rule:** "accuracy is more important than completion." It pushes back on the model's instinct to hand you a finished-looking answer, and gives it permission to say "I'm not sure" or go check, instead of guessing to seem helpful.

### Why It's Weirdly Bad at Counting and Math

Claude can explain advanced calculus but might miscount the letters in a word or botch a simple multiplication. Two reasons:

**it doesn't see individual digits the way you do.** Text gets chopped into chunks called "tokens" before Claude ever sees it. A number like 1,000,000 might reach Claude as a couple of clumps rather than seven separate digits, so carrying and place-value get garbled.

**it has no scratch paper.** When it answers "in its head," it's predicting the answer directly, with nowhere to work out the steps. Force it to show its working (or better, have it write a quick script) and accuracy jumps, because now the computer does real arithmetic instead of the model guessing the result.

> **the takeaway:** for anything that has to be exactly right (totals, large datasets, precise counts) ask Claude to write a script and run it, rather than working it out inside the conversation. Let the computer calculate; let Claude orchestrate.

### Why It Knows So Much About Code but So Little About Itself

Ask Claude about React and it's an expert. Millions of code examples, docs, and discussions were in its training. Ask it about its own version, its exact settings, or what it can do today, and it often gets it wrong. Two reasons: very little is written about the AI itself compared to popular tools, and more importantly, **it can't look inward.** Claude can't read its own wiring. It only knows what was written about AI in general. Asking Claude about Claude is like asking someone to describe their own brain cells firing.

**what this means for you:** don't trust the AI's claims about itself: which model it is, what its limits are, when its knowledge ends. Check the actual documentation instead.

> **From the field**
>
> A user asked an AI assistant for the documentation link to a software feature. It produced a clean, official-looking URL with total confidence. The link 404'd. The page had never existed. The AI had generated the most plausible-looking URL from the pattern of real ones, not retrieved a real address. Ten minutes were lost before the user realized the source itself was invented.
>
> *A confident answer and a correct answer look identical. The only way to tell them apart is to check.*

#### How Claude Actually Works

- It predicts the most plausible next words. It's not looking up facts in a database
- It has no "I don't know" alarm, so it can produce confident, made-up answers (hallucinations)
- Verify facts, numbers, and "this exists" claims against reality
- It's bad at exact math because text is chopped into tokens and it has no scratch paper
- For precise counts or big datasets, have it write and run a script
- It knows tools like React deeply but can't reliably describe itself. Check the docs

### It Grades Its Own Homework Generously

The same instinct that makes Claude finish a sentence confidently makes it report its own work confidently. It can report "dark mode works" while a drawing on that very screen is broken. It checked what it thought to check and filled the gaps with the most plausible story: that the rest is fine too.

Two fixes, both covered later in the course: ask it to list what it did *not* prove, and have a separate agent, one that didn't build the thing, look for problems.

**Check your understanding:** Claude gives you a confident answer with a specific citation, but you've never heard of the source. What's the safest assumption?

- **It might be a hallucination. Claude can generate plausible but invented details, so verify the source before trusting it (correct)**
- If Claude included a citation, the source is definitely real
- Claude never makes up citations
- The source is real but probably just outdated

*Why:* Claude predicts plausible text and has no built-in alarm for "I don't know." A confident answer and a correct one look identical. Always verify facts and sources against reality.

**Check your understanding:** You need Claude to add up 4,000 rows of sales data and get an exact total. What's the most reliable approach?

- Ask Claude to add them up carefully in the conversation
- **Ask Claude to write and run a script that does the calculation (correct)**
- Ask Claude to double-check its mental math twice
- Trust the total. Claude is good at math

*Why:* Claude does precise arithmetic poorly because text is split into tokens (so digits get garbled) and it has no scratch paper when answering directly. For anything that must be exact, have it write a script: the computer calculates, Claude orchestrates.

**Check your understanding:** Why does Claude know a huge amount about a tool like React but often get details about itself wrong?

- **Tons was written about React in its training, but little about the AI itself, and it can't look inward at its own wiring (correct)**
- Claude is deliberately programmed to hide information about itself
- React is simply a less complex topic than Claude
- Claude refuses to answer any questions about itself

*Why:* Claude only knows what was written about AI in general; it can't introspect its own settings or limits. Don't trust its self-reports about which model it is or what it can do. Check the actual documentation.


---

## Chapter 4: How Specificity Changes Everything

*The quality of your input determines the quality of AI's output*

This is the single highest-leverage skill you can develop. The difference between a vague request and a specific one is the difference between a 20-minute rabbit hole and a correct answer on the first try.

| Vague | Specific |
|---|---|
| "fix the login" | "users on mobile Safari get a white screen after entering their OTP. console shows a CORS error. started after yesterday's deploy." |
| Prescriptive | Outcome-focused |
|---|---|
| "create a React component with useState hooks and a Postgres table" | "we need to notify readers when content they've already read gets updated, without spoiling parts they haven't reached yet" |

### The Pattern

Describe **outcomes**, not implementations. Let the AI propose the architecture, then steer it. You say "what," the AI figures out "how."

But when something specific matters to you ("use console logging, PM2 logs are terrible") correct immediately.

> **Mental model: The Architect and the Builder**
>
> You don't tell the builder which nails to use. You tell them you want a door that locks, a window that faces south, and a floor that holds a piano. But if you know the soil is clay and the builder doesn't, you speak up.

### When to Explore vs. When to Specify

Specificity is king when you know what you want. But sometimes you don't, and that's where a different approach shines.

**when you know the system well:** front-load requirements. Every requirement discovered after building costs a round trip. One team didn't mention "it needs to work in DMs" until after the feature was deployed. One sentence upfront saves three commit-push-deploy cycles.

**when you're exploring unfamiliar territory:** start with curiosity. "what does the roster discovery script do?" before "add tier 2 to the roster discovery script." Understanding the existing system first produces better designs and catches issues the AI would miss if it just started coding.

> **Mental model: The Doctor's Visit**
>
> If you know you broke your arm, tell the doctor "I broke my arm." Don't make them guess. But if you have a mysterious pain, don't walk in saying "prescribe me antibiotics." Describe the symptoms and let the doctor investigate. Same with AI: specify when you know, explore when you don't.

### Ask, Don't Just Tell

Here's a habit that changes everything, and almost nobody does it: instead of telling Claude what to build, ask it what it thinks first. Left to its own devices, AI leans toward being a "yes-man." You ask for something, it builds exactly that, even when there's a far better approach or a serious flaw you didn't spot. It's trained to be agreeable, not to tell you what you need to hear. You have to invite the pushback.

Compare these two openings:

| Telling | Asking |
|---|---|
| "build me a task management app with these features." | "i'm thinking of building a task app. here's what i want to be different: [list]. what am i missing? has this been done? what would you push back on? what valuable features am i not thinking of?" |

The second version puts Claude in advisor mode instead of order-taker mode. You'll catch flaws before you've built them, discover features you hadn't considered, and sometimes learn the whole idea needs rethinking, all before a line of code gets written.

This matters most for big, hard-to-reverse decisions: what to build, which approach to take, how to structure something. For "rename this variable," just tell it. The skill is knowing when the stakes are worth a conversation.

> **handy trick:** when Claude fires a pile of questions at you at once and you lose track of which is which, just say "ask me one question at a time" or "number all your questions so i can answer by number." It puts the friction back on Claude instead of you.

### You Shape What's Probable

Remember from the last chapter: Claude produces the *most probable* response. **You control what's probable** by how you ask. The framing of your request decides the shape of what comes back.

Same plan, three framings, three different shapes:

**"what do you think of this plan?"**: leans agreeable. A soft question makes a soft, reassuring answer the most probable one.

**"be brutally honest and tear this apart"**: over-corrects. It will manufacture pushback to fit the frame, sometimes inventing problems that aren't real. (though if you have to err one way, this usually beats the yes-man trap.)

**"tell me where this is solid and where i'm off"**: the healthiest shape: encouraging where it's deserved, calling out faulty logic where it's real.

> **Mental model: The Constant Question**
>
> Make this a habit every time you talk to an AI: **"what's the healthiest shape for the response i actually need (not the one i want) and how do i ask so that becomes the most probable answer?"** That single question, asked before you hit enter, upgrades everything the AI hands back to you.

### Correct with a Conviction, Not Just a "No"

When Claude recommends something you disagree with, a bare "no" fixes one decision. A "no" with the belief behind it fixes every later decision that belief touches.

| Bare no | No with a conviction |
|---|---|
| "no, keep the meter." | "no, keep the always-on meter. in play testing the hider had the advantage. and building software costs almost nothing now, so i want long-term fixes, not quick patches." |

One builder's message like the second one overturned three of Claude's recommendations at once, each for a stated reason. Claude then applied the same principle to choices nobody had discussed yet.

**And don't worry about polish.** Typos, lowercase and voice dictation are fine. Claude reads intent well. What makes a prompt good is the information in it, not the wording.

**Check your understanding:** You want the AI to build a notification system. Which request will get the best result?

- "build a notification system"
- "create a webhook endpoint that sends emails using SendGrid with a PostgreSQL queue table"
- **"notify users via email when a document they've commented on gets edited. batch notifications so they don't get spammed. we have about 200 active users." (correct)**
- "make it so users get alerts"

*Why:* The best request describes the outcome (what users experience), provides constraints (batching, user count), and lets the AI choose the implementation.

**Check your understanding:** You want balanced feedback on a plan you're personally attached to. Which framing is most likely to get it?

- "what do you think of this plan?"
- "be brutally honest and tear this plan apart"
- **"tell me where this plan is solid and where i'm off" (correct)**
- "this plan is good, right?"

*Why:* Claude returns the most probable response, and your framing shapes what's probable. A soft question gets a soft, agreeable answer; "brutally honest" can over-correct and manufacture problems that aren't real. Asking for both what's solid and what's off makes balanced feedback the most likely shape. Ask for the response you need, not the one you want.

**Check your understanding:** A team deployed a feature, then realized it also needed to work in DMs. What should they have done differently?

- Written a complete specification document before starting
- **Mentioned known requirements as a rough bullet list before the AI started building (correct)**
- Tested the feature for a week before deploying
- Let the AI figure out all the requirements on its own

*Why:* You don't need a perfect spec. Just dump your mental model as a quick bullet list. "needs to work in channels, DMs, and group messages" takes 5 seconds to type and saves hours of rework.


---

## Chapter 5: The Three Layers of AI Memory

*How to stop re-explaining everything every conversation*

Out of the box, AI forgets everything between conversations. Production teams solve this with three layers of persistent context.

### Layer 1: The Rules File, "How We Do Things Here"

A file the AI reads at the start of every conversation. Short, opinionated, non-negotiable. Your team's constitution.

> **Mental model: The Employee Handbook**
>
> Every company has norms. Don't force push to main. Always add logging. Commit after every change. You wouldn't re-explain these to a returning employee every morning. You'd point them to the handbook.

### Layer 2: Skills, "Here's Everything About X"

Documents that give AI specialist-level knowledge about specific domains. When you mention "deploy" or "database issue," the relevant skill loads automatically.

> **Mental model: The Specialist's Brain**
>
> When you visit a cardiologist, you don't explain what a heart is. The specialist already knows the anatomy, common problems, and standard treatments. They just need YOUR symptoms.

> **you might hear about "MCPs":** another way to plug Claude into outside tools and data. They're powerful, but a skill is often simpler when you want your own notes and gotchas sitting right next to the instructions. Start with skills.

### Layer 3: Memory, "What We Learned Last Time"

After you discover that a certain API silently fails, or that a deploy script overwrites changes unless you push first, you write it down. Memory stores these learnings so the AI doesn't repeat mistakes.

> **From the field**
>
> A team kept their AI configuration in a shared git repository. When one person improved a skill document (adding a missing deployment step that had caused an outage), the other team member got the fix on their next git pull. One 5-minute documentation update prevented a class of errors permanently.
>
> *Documentation for the AI pays back more than code. A 30-minute skill doc saves 15 minutes per conversation, forever.*

### Skills Get Better Every Time Something Goes Wrong

The best skills are checklists that grow. One builder kept a skill for submitting apps to the App Store. Every rejection, from any of their apps, became a new line in it: the missing privacy file, the debug switch left in, the "block user" button Apple requires for apps where people see each other's posts. A new app now gets audited against every past rejection before it's submitted.

### One More Layer: Hooks, for Rules That Must Never Slip

Rules, skills and memory are all things Claude *reads*. Most of the time it follows them. A **hook** is different: a small script the computer runs automatically at a set moment, such as before a command runs or when Claude finishes a turn. Claude can't forget a hook, because the computer runs it, not Claude.

Use hooks sparingly, for the few rules where "usually" isn't good enough: block a force push, run the tests before anything is submitted, send a notification when a long job finishes. You don't write them yourself. Ask Claude: "make a hook that blocks X."

**Check your understanding:** You've explained your deployment process to the AI three times across three conversations. What should you do?

- Keep explaining it. It only takes a minute
- Create a bash alias so you can deploy without the AI
- **Write it into a skill or rules file so the AI knows it automatically (correct)**
- Simplify the deployment so there's nothing to explain

*Why:* If you're saying the same thing every conversation, it belongs in persistent context. The time investment pays back across every future session.

**Check your understanding:** What's the difference between a "rules file" and a "skill"?

- Rules files are longer and more detailed than skills
- **Rules files set universal standards (always loaded); skills provide domain-specific expertise (loaded on demand) (correct)**
- Skills are for coding and rules are for project management
- There's no real difference. They're interchangeable

*Why:* Rules files are your constitution: short, universal, always active. Skills are specialist knowledge: detailed, domain-specific, loaded when relevant. "always commit your changes" is a rule. "here's how to deploy to our DigitalOcean server" is a skill.

**Check your understanding:** A teammate shares their AI configuration via git so you both benefit from improvements. Which memory layer does this relate to?

- Rules only. Git is for rules files
- Memory only. Git tracks learnings
- **All three layers. Rules, skills, and memory can all be version-controlled and shared (correct)**
- None. AI configuration shouldn't be in git

*Why:* Version-controlling your entire AI configuration means every improvement (a new skill, a corrected rule, a documented gotcha) benefits the whole team on their next git pull. This is one of the highest-leverage patterns observed in production teams.


---

## Chapter 6: The Workflow

*Kick off → plan → build → check → play and adjust → document*

### Phase 1: Kick Off

Say what you want and who it's for, in your own words. Add what you already believe (the things that aren't up for debate), what Claude may do without asking, and what "done for now" means. The AI automatically loads your rules, relevant skills, and memory. The starter kit's `/kickoff` skill walks you through this in a few minutes.

### Phase 2: Plan

For anything beyond a simple fix, ask the AI to lay out its approach before it starts. You review it, not for code quality, but for missing requirements, edge cases, and things the AI doesn't know. This is just a conversation; you don't need a special "mode" for it. Talk it through, steer it, and only then say "go."

> **Mental model: The Blueprint Review**
>
> You're the building owner reviewing the architect's blueprints. You don't need to know how to calculate load-bearing requirements, but you do need to say "there's no bathroom on this floor" and "the front door opens into a wall."

### Phase 3: Build

The AI writes code, creates files, runs commands, deploys. Check in at milestones, not after every line. Stay available for questions. Correct mistakes early.

### Phase 4: Check

Claude can test a great deal itself now: it can click through your app in a simulator, load your site in a browser, and run scripted test players. Ask it to, and ask what it did not prove. For anything important, have a second agent that didn't build it look for problems (Part 2 covers this).

### Phase 5: Play and Adjust

Now you use it, on your own phone, as a real user would. This is where most of the good ideas come from. You can't imagine everything you'll want before you've held the thing, and you shouldn't try. In one app build, a whole onboarding redesign, a better way to pick times, and a contact search all came from the builder simply using the app. Touch it, play with it, tell Claude what felt wrong, and go around again.

> **Mental model: The Test Kitchen**
>
> A chef doesn't finalize a menu on paper. They cook the dish, taste it, add salt, cook it again. The recipe on paper was a starting point. Your first plan is the same: a good starting point that gets better each time you taste the result.

### Phase 6: Document

Update your skill docs and memory with what you learned. The next conversation starts with accurate context instead of stale docs.

> **From the field**
>
> A team migrating off a third-party calendar integration followed the workflow: kicked off (credentials kept getting revoked), planned (a phased migration with "mirror mode" testing), built (replaced it piece by piece), checked and played with it (opened Google Calendar by hand and caught a daylight-saving time bug), and documented (updated the infrastructure skill). The migration shipped cleanly because every phase got its due attention.
>
> *Using the real calendar caught a time zone bug no test would have found. The document phase prevented the next developer from reading stale docs.*

**Check your understanding:** The AI just finished building a booking system and says "deployment complete." What's the most important next step?

- Ask the AI to write unit tests
- Start building the next feature while context is fresh
- **Make a real booking on a real device and verify the data end-to-end (correct)**
- Update the documentation first

*Why:* Verification comes before documentation. Test the critical path with real data on a real device. The gap between "code looks right" and "it works end-to-end" is where most bugs live.

**Check your understanding:** During the "plan" phase, what should you be looking for?

- Syntax errors in the proposed code
- Whether the AI chose the right programming language
- **Missing requirements, edge cases, and things the AI doesn't know about your system (correct)**
- Whether the plan uses best practices

*Why:* You're the building owner, not the architect. You don't review load-bearing calculations. You catch "there's no bathroom on this floor." Look for gaps in business logic, missing edge cases, and systems the AI doesn't know about.

**Check your understanding:** Why is the "document" phase important even though the code itself is documentation?

- Because code comments make debugging easier
- **Because the AI's skill docs and memory need to reflect the new reality so the next conversation starts with accurate context (correct)**
- Because managers need documentation for compliance
- Because the AI can't read code

*Why:* If you change how deployment works but don't update the skill doc, the next session starts with stale instructions. Documentation for the AI is as important as the code change itself.


---

## Chapter 7: Managing Context (and Never Losing Your Work)

*Your AI has a limited working memory. Protect it, and capture what can't be rediscovered.*

Every conversation with Claude happens inside a "context window": a limited amount of working memory that holds everything said so far. It is not infinite. As a conversation grows, the window fills up, and at some point the oldest details get summarized or dropped to make room. This is called *compaction*.

And when you start a fresh conversation, or clear the current one, the slate is wiped completely. Anything that lived only in that chat is gone.

### Working Memory Is Not Storage

Think of the context window as the AI's desk, not its filing cabinet. A desk holds what you're actively working on, and it has limited surface area. Pile on too much and older papers slide off the edge. The filing cabinet (your CLAUDE.md, skills, and memory from chapter 5) is permanent storage that survives between sessions. The desk does not.

> **Mental model: The Cluttered Desk**
>
> Picture a brilliant assistant with a small desk. While you work together, everything sits in front of them and they're sharp. But the desk only fits so much. When it overflows, they sweep older papers into the bin so they can keep working. Nothing you said is safe long-term unless it made it into the filing cabinet. Your job is to keep the desk clear of clutter, and to file the important things before they get swept away.

### Subagents: Borrow a Second Desk

Some tasks generate enormous mess: reading forty files to answer one question, searching an entire codebase, sifting through pages of logs. If Claude does that work in your main conversation, all that noise lands on the shared desk and crowds out everything else you care about.

A **subagent** is a separate worker with its own desk. You hand it the messy job. It reads the forty files on its own surface, works out the answer, and hands you back a short summary. The clutter stayed on its desk, not yours, so your main conversation stays clean and focused.

> **Mental model: The Research Assistant**
>
> You don't read forty documents yourself and try to hold them all in your head. You ask an assistant to read them and bring you a one-page memo. You get the conclusion; they absorbed the volume. Subagents are how Claude keeps the main thread sharp while still doing heavy lifting underneath. The lesson in one line: **delegate the exploration, keep the answer.**

### The Expensive Part: Losing What You Can't Rediscover

Here's the fear that catches people off guard. You spend two hours working through a hard problem with Claude. You make decisions, rule out three approaches that didn't pan out, and uncover a weird constraint nobody ever wrote down. Then the conversation ends, or compacts, or you clear it to start something new. A fresh Claude shows up with none of it.

Some of that loss is cheap. The AI can re-read your code, re-check git history, and re-explore your file structure in seconds. But some of it is *expensive or impossible* to recover: *why* you chose this approach, the three dead-ends you already ruled out, the constraint that lives in one person's head and nowhere else. Rediscovering that can cost hours, or it may be gone for good.

> **From the field**
>
> A builder spent an afternoon with Claude untangling why a payment webhook fired twice. They tried three fixes that failed, then found the real cause: a retry setting buried deep in a third-party dashboard. Satisfied, they closed the chat and moved on. A week later the bug came back in a slightly different form. The new conversation had no memory of the three failed fixes or the dashboard setting, so they paid for the entire investigation a second time.
>
> *The code was always rediscoverable. The hard-won knowledge (what didn't work, and the one setting that did) was not. That's exactly what should have been written down before the chat closed.*

### The Habit That Saves You: Capture Before You Clear

Before you end a meaningful session, compact, or start fresh, run one simple check. Ask Claude: *"what did we learn or decide here that a fresh you couldn't easily rediscover, or that would cost real time to figure out again?"* Then save the answers where they belong.

Many teams build this into a reusable skill (often called something like `/update-docs`) so it runs the same way every time: review the session, surface what matters, and file each piece into the right layer of memory.

### Two Questions Decide What to Save

1. **is it truly unrecoverable?** The *why* behind a decision, the approaches you rejected, a business constraint nobody documented. Save the **fact itself**.
2. **is it recoverable but expensive?** Something a fresh agent *could* work out, but only after burning lots of time and tokens exploring. Sometimes save the fact; often it's enough to save a **pointer**: "the answer lives in X, regenerate it by doing Y."

Then route each piece to the right home, using the three layers from chapter 5: a standing rule goes in your CLAUDE.md, a how-to-do-X procedure goes in a skill, a one-off learning or preference goes in memory, and session-specific project state goes in a project doc.

> **do this before you lose it, not after.** Capture while the knowledge is still on the desk. Once the chat is cleared or compacted, you're trying to remember what you've already forgotten.

#### Protecting Context

- The context window is working memory, not storage: it fills up and old details drop
- Your CLAUDE.md, skills, and memory are the permanent filing cabinet
- Hand heavy, messy jobs to subagents: delegate the exploration, keep the answer
- Code is cheap to rediscover; decisions, dead-ends, and hidden constraints are not
- Before you clear or compact, ask "what would a fresh you fail to rediscover?"
- Save the fact when it's unrecoverable, a pointer when it's just expensive
- File each learning into the right layer: rules, skills, memory, or project docs

### Start Fresh More Often Than Feels Natural

It's tempting to keep one conversation open for a project's whole life, because it "knows everything." It doesn't. A conversation that has been compacted four times holds four summaries of summaries, and details blur with each one. One builder kept a single session going for two months across an app's launch and four releases. By the end they were asking it "am I using Plivo? I forget" (Plivo was one of two text-message providers they had tried), and it couldn't reliably say either. A guess one part of the conversation had made ("these don't sync on purpose, for privacy") had hardened into a rule nobody decided.

**A good rhythm:** one session per feature or release. Before you close it, capture what matters (the habit above). Then the next session starts by reading your project doc, and it knows more than the old session did, because the doc holds decisions while the old session only held summaries.

**Check your understanding:** You've been working with Claude for two hours and notice it seems to have "forgotten" something you discussed early on. What most likely happened?

- **The context window filled up, so older details were compacted (summarized or dropped) to make room (correct)**
- Claude is malfunctioning and should be restarted
- The information was saved to memory but loaded incorrectly
- You need to upgrade to a larger AI model

*Why:* The context window is finite working memory. As a long conversation grows, the oldest details get summarized or dropped. The fix isn't a bigger model. It's capturing important things in permanent storage (CLAUDE.md, skills, memory) before they slide off the desk.

**Check your understanding:** You ask Claude how a feature works, and answering means reading through 40 files. Why is it better for Claude to send a subagent to do this?

- **The subagent absorbs all 40 files on its own desk and hands back just the answer, keeping your main conversation clean (correct)**
- Subagents are faster because they skip reading most of the files
- Subagents are smarter than the main AI
- It isn't better. The main conversation should always do the work itself

*Why:* Delegate the exploration, keep the answer. The subagent burns its own working memory on the messy reading and returns a short summary. Your main conversation stays focused instead of getting buried in 40 files of detail.

**Check your understanding:** After a long debugging session, you're about to start a fresh conversation. Which of these is MOST important to write down first?

- The structure of your project's folders
- **The two approaches you tried that didn't work, and the obscure setting that finally fixed it (correct)**
- The names of the files Claude edited
- The exact commands Claude ran, which are already in your terminal history

*Why:* A fresh agent can re-read your folders, files, and git history in seconds. What it cannot recover is the hard-won knowledge: the dead-ends you already ruled out and the non-obvious fix. Always save what can't be cheaply rediscovered.


---

## Chapter 8: Debugging with AI

*Data first, theories second, and always push back*

Debugging is where AI collaboration shines brightest, and where it can go most wrong. The AI can investigate logs, query databases, and propose fixes faster than any human. But it can also confidently lead you down the wrong path for 45 minutes.

### Rule 1: Data Before Theories

Don't let the AI theorize about what might be wrong. Have it look at what IS wrong. Check the logs first. Query the database. Hit the health endpoint.

### Rule 2: Push Back on Confidence

The AI will present hypotheses as conclusions. "the issue is probably X" sounds authoritative. It might be wrong.

> **From the field**
>
> When Google Calendar credentials kept getting revoked, the AI suggested "aggressive API polling rate-limiting." The human asked: "how confident are you?" The AI admitted it was guessing. Then: "why would it target one user and not the other 79?" A simple question that exposed the theory didn't hold. The actual cause was their own monitoring script accidentally disconnecting credentials.
>
> *Two questions ("how confident?" and "why this and not that?") saved hours of debugging the wrong thing.*

### Rule 3: Check Current State Before Changing Anything

Before modifying a system, ask "is it even working right now?" One team discovered their monthly script had been silently failing for a month, not because they went looking for problems, but because they asked "did it already run?" before deploying new code. This habit of checking current state before modifying it catches infrastructure rot that would otherwise compound silently.

### Rule 4: Give AI Access to the Real System

Teams that give AI access to their servers debug far faster. Instead of "run this, paste output, wait, repeat," the AI checks logs and queries databases directly.

### Rule 5: Screenshots Are Underrated

The AI can read screenshots. "it shows no data" + screenshot is far more useful than "it's not working" because the AI sees the URL, page state, and error messages simultaneously.

### Rule 6: Ask What Wasn't Proven

When Claude reports that something works, ask: "what did you not prove?" Common gaps: it tested on one device when the bug only appears with two people, it used a test mode that doesn't send real text messages, or it couldn't see the on-screen keyboard covering a button.

> **From the field**
>
> An app's phone sign-in was tested overnight and reported as "verified end to end." The test ran in the text-message provider's sandbox mode, where no real message is sent. After launch, the provider turned out to need an expensive plan for real messages, and sign-in broke for real users. Nobody noticed for about two weeks, until the builder hit an error by chance.
>
> *"Verified" meant "verified in sandbox." Ask what wasn't proven, and set up a daily check of the live app (Part 2 shows how).*

**Check your understanding:** The AI says "the 500 error is probably caused by a database connection timeout." What's the best response?

- "ok, increase the timeout to 60 seconds"
- **"what evidence points to a timeout? can you check the actual error in the logs?" (correct)**
- "let's rewrite the database connection code to be more robust"
- "restart the database server"

*Why:* Before accepting any theory, ask for evidence. "probably" means the AI is guessing. Checking the actual error log takes 10 seconds and tells you exactly what happened.

**Check your understanding:** Why is giving the AI SSH access to your server such a time-saver for debugging?

- Because the AI can fix problems without your involvement
- **Because the AI can directly check logs, query databases, and verify endpoints instead of you copying and pasting output back and forth (correct)**
- Because it's more secure than sharing log files
- Because the AI needs root access to debug properly

*Why:* The copy-paste debugging loop (run command → copy output → paste into chat → wait for analysis → repeat) is the biggest time sink. Direct access lets the AI explore the problem space the way a human engineer would: following leads, checking related systems, and verifying hypotheses in real-time.

**Check your understanding:** A UI bug appears on your phone. What's the most effective way to report it to the AI?

- "the page looks wrong on mobile"
- Describe the CSS properties you think are wrong
- **Send a screenshot. The AI can see the URL, layout, error messages, and page state all at once (correct)**
- Paste the entire page's HTML source

*Why:* Screenshots are the highest-bandwidth communication channel for UI bugs. The AI sees everything a human would see (the URL bar, the broken layout, any error messages, the device context) in one glance. Worth a thousand words of description.


---

## Chapter 9: The Traps Everyone Falls Into

*Mistakes observed across real teams, and how to avoid them*

### Trap 1: Being Too Vague

"fix the login" → AI investigates 15 possible issues. "mobile Safari shows white screen after OTP entry, CORS error in console, started after yesterday's deploy" → AI goes straight to the answer.

### Trap 2: Not Pushing Back

The AI sounds confident even when guessing. Develop the reflex: "what makes you think so?"

### Trap 3: "It Said It Worked"

Not verification. An exit code of 0 means the process didn't crash, not that it did the right thing.

### Trap 4: Re-explaining Everything

If you're saying the same things every conversation, write it into a rules file or skill document once.

### Trap 5: Micromanaging Code

Describe the outcome. Intervene at decision points (architecture, tradeoffs, business rules) not at every line.

### Trap 6: Naming Things for Yourself Instead of the Future

"Discovery Tier" makes sense today. "TAM Discovery Tier" makes sense six months from now when nobody remembers what "discovery" referred to. Name database fields, variables, and features for the person who doesn't have your current context.

### Trap 7: Trying to Predict Everything Upfront

Build the core, test it, discover what's missing, iterate. Real requirements emerge from real usage.

> **Mental model: The Pottery Wheel**
>
> You don't design a perfect vase on paper and then execute. You throw clay, shape it, see how it looks, adjust. The first pass gives you the form. Iterations give you the art. Software works the same way.

### Trap 8: A Guess That Becomes a Rule

Claude infers something ("this is probably private on purpose"), writes it into a doc, and a later session treats it as a decision. When something feels like an odd constraint, ask: "is this a real requirement, or one a Claude session assumed?"

### Trap 9: Accepting a Blocker That Sounds Official

"We need the company developer account first" cost one team twelve days. When they finally asked "is there no way to ship this sooner?", it shipped the same evening on an account they already had. Before you wait on anything outside your control, ask: "what's the fastest path if I accept some tradeoff?"

### Trap 10: Pasting Passwords and Keys into the Chat

Anything in the conversation can be repeated in summaries and logs. Put keys in the project's environment file (a `.env` file that git is told to ignore, so it never reaches GitHub) and never in a message.

**Check your understanding:** You've asked the AI to deploy a change. It responds "deployment complete, all services healthy." What should you NOT do?

- **Move on to the next task without checking anything (correct)**
- Load the page in your browser to see if the change is visible
- Ask the AI to show you the deployment logs
- Test the specific feature that was changed

*Why:* Never take "deployment complete" at face value. Load the page, test the feature, check the data. The other three options are all good verification steps.

**Check your understanding:** The AI suggests a completely different technical approach than what you originally discussed. What should you do?

- Always go with the AI's suggestion. It knows more about code
- Always reject it. You should stick to the original plan
- **Ask why it changed approach, and whether the original approach was tried first (correct)**
- Let it do both approaches and pick the one that works

*Why:* AI can silently switch approaches when the first one hits a snag, which can lead to rabbit holes. Ask why. There might be a good reason, or the AI might have given up too early. The best teams insist on trying the original approach first.

**Check your understanding:** Which is the better development approach?

- Write a complete specification for every feature and edge case before building anything
- **Build the core feature, test it, then discover and handle edge cases through iteration (correct)**
- Let the AI decide the scope and edge cases
- Build everything at once to avoid multiple deploy cycles

*Why:* Like the pottery wheel: throw the clay first, then shape it. Build the core, see how it actually works, and THEN handle edge cases. "what about users who dismiss the modal?" is a question you ask after seeing the modal, not before.


---

## Chapter 10: The Investment That Compounds

*Why the scaffolding matters more than the code*

Here's the counterintuitive truth: the time spent writing documentation for the AI pays back more than the time spent writing code.

A 30-minute skill document saves 15 minutes per conversation. After 20 conversations, that's 5 hours saved. After 100, it's 25 hours. And quality goes up too: the AI makes fewer mistakes with complete context.

> **Mental model: Compound Interest**
>
> Your skills and rules files are like a savings account that earns compound interest. Every investment (a new skill, a corrected rule, a documented gotcha) makes every future conversation faster and more reliable. Teams that invest early have dramatically higher "AI ROI" six months in.

### What to Build First

1. **a rules file**: your non-negotiable standards. 15 minutes. Used every conversation.
2. **an infrastructure skill**: server addresses, SSH commands, deployment steps. The most-used skill.
3. **memory entries**: who you are, what you're working on, gotchas you've discovered.
4. **process skills**: complex multi-step workflows that would take 20 minutes to re-explain.

### The Meta-Lesson

Skills are living documentation that happens to be executable. The rules file is a team agreement that happens to be enforced by AI. Memory is institutional knowledge that happens to persist across sessions.

The teams that write the best skills debug the fastest, ship the most reliably, and onboard new collaborators (human or AI) with the least friction.

#### Your Action Items

- Write a rules file with your top 5 non-negotiable standards
- Document your most common workflow as a skill
- Next time you re-explain something, save it to memory instead
- Describe outcomes, not implementations
- Always verify the actual output. Never trust "it worked"
- Push back when the AI sounds confident but might be guessing
- Front-load requirements as bullet lists before the AI starts building

> **From the field**
>
> The first time one builder submitted an iPhone app, getting through Apple's console took days of clicking. Along the way Claude wrote a small script that talks to Apple's systems directly, and the builder saved the steps as a skill. On a later app, the same steps took minutes: Claude reused the script, created the store listing, uploaded screenshots and sent the build to review. A similar script made the Android store just as quick.
>
> *Every hard step you save once is a fast step in every future project.*

**Check your understanding:** What's the highest-leverage thing you can do to improve your AI collaboration over time?

- Learn to code so you can review every line the AI writes
- Use the AI only for simple tasks to avoid mistakes
- **Invest in your scaffolding: rules, skills, and memory that compound over time (correct)**
- Switch AI tools frequently to find the best one

*Why:* The scaffolding is compound interest for AI collaboration. Every investment makes every future session faster and more reliable.

**Check your understanding:** What should you build FIRST when starting with AI-assisted development?

- **A rules file with your non-negotiable standards. It takes 15 minutes and is used every conversation (correct)**
- A complete library of skills covering every system
- Automated testing infrastructure
- A custom AI model fine-tuned on your codebase

*Why:* Start small. A rules file is 15 minutes and immediately impacts every conversation. Skills and memory grow organically as you work. Don't try to document everything upfront; document what you find yourself repeating.

**Check your understanding:** What does "skills are living documentation that happens to be executable" mean?

- Skills contain runnable code scripts
- Skills are generated automatically from your codebase
- **Skills document your systems in a way the AI actively uses to make decisions and take actions. They're not just reference docs, they shape behavior (correct)**
- Skills replace the need for traditional documentation

*Why:* Traditional docs sit in a wiki and hope someone reads them. Skill docs are read by the AI at the moment of action. They directly influence what commands get run, what safety checks get performed, and what patterns get followed. Documentation that shapes behavior, not just records information.


---

## Chapter 11: GitHub Essentials

*Commits, pushing, repos, and how not to destroy your work*

Before you start building with Claude, you need to understand the tool that keeps your work safe: git and GitHub. Claude will handle most git commands for you, but you need to understand what's happening, because when things go wrong with git, they can go *very* wrong.

This chapter is a crash course. Not everything about git, just the parts that matter when you're building with AI.

### Commits: Saving Your Progress

A commit is a snapshot of your project at a specific moment. Think of it like hitting "save" in a video game. You can always go back to that exact point.

Every commit has a message that describes what changed and why. Good commit messages are short and specific:

| Vague | Specific |
|---|---|
| "fixed stuff" "updates" "work in progress" | "fix login redirect loop on mobile Safari" "add email notification for updated content" "remove deprecated auth middleware" |

**how often should you commit?** Every time you finish a logical unit of work. Added a feature? Commit. Fixed a bug? Commit. Refactored a function? Commit. If Claude just built something that works, tell it to commit before moving to the next thing. Small, frequent commits mean you can undo one change without losing everything else.

> **rule of thumb:** if you'd be upset losing the work you just did, you should have committed it already. Tell Claude: "commit after every working change."

### Push and Pull: Syncing with GitHub

**push** sends your local commits up to GitHub. Until you push, your work only exists on your machine. If your laptop dies, it's gone.

**pull** downloads changes from GitHub to your local machine. This is how you get updates that others (or you from another machine) have pushed.

The normal flow is simple: commit your work, push it up. But there's a dangerous command that can ruin your day.

> **From the field**
>
> A developer had two weeks of work on a branch. Their AI assistant hit a merge conflict and, trying to be helpful, ran `git push --force`. Force push doesn't merge. It *overwrites* whatever is on GitHub with whatever is on your machine. The developer's teammate had pushed changes to the same branch that morning. Those changes were instantly and silently erased. No warning, no confirmation, no undo. Two days of their teammate's work, gone.
>
> *Force push rewrites history. It doesn't ask permission. It doesn't check if someone else pushed first. It just overwrites. This is why your CLAUDE.md should always include: "NEVER force push without explicit approval."*

**the safe approach:** always tell Claude to use the safest route that prevents irreversible loss. A normal `git push` will fail if there are conflicts, and that's a *good* thing. It means git is protecting you. If a push fails, ask Claude to pull first, resolve conflicts, and then push normally.

> **add this to your CLAUDE.md:** "never use force push or rewrite git history without specific approval from the user. always prefer the safest approach that prevents irreversible data loss."

### Repos: One Project, One Repo

A repository (repo) is a folder that git tracks. It contains your project's code, history, and configuration. The rule is simple: **one repo per project.**

Don't put multiple unrelated projects in one repo. Don't split one project across multiple repos (unless you have a very good reason). One project, one repo, one source of truth.

When you create a repo on GitHub, it lives in two places: your local machine (where you work) and GitHub (where it's backed up and shared). Commits save locally, pushes sync to GitHub.

### Working Solo: Keep It Simple

When you're the only person on a project, the workflow is straightforward:

1. write code (or have Claude write it)
2. commit with a clear message
3. push to main
4. repeat

**pushing directly to main is fine when you're solo.** There's nobody else to conflict with, and the overhead of branches and pull requests slows you down for no benefit. Just commit often and push regularly so your work is backed up.

> **Mental model: The Notebook**
>
> Working solo on main is like writing in a personal notebook. You don't need a formal review process to write in your own notebook. You just write. The important thing is that you're writing (committing) frequently and keeping a copy somewhere safe (pushing to GitHub).

### Working with a Team: Branches and Pull Requests

When multiple people work on the same repo, pushing directly to main is a recipe for disaster. Instead, teams use **feature branches** and **pull requests**.

**feature branches:** instead of working on main, you create a branch, a parallel copy of the code. You make your changes there, isolated from everyone else. The naming convention is descriptive: `feature/add-notifications`, `fix/login-redirect`, `refactor/auth-middleware`.

**pull requests (PRs):** when your branch is ready, you open a pull request on GitHub. This is a formal proposal to merge your changes into main. Teammates can review the code, leave comments, request changes, and ultimately approve it. Only after approval does the code get merged into main.

| Solo workflow | Team workflow |
|---|---|
| work → commit → push to main simple, fast, no overhead fine when you're the only one | branch → work → commit → push branch → open PR → review → merge more steps, but prevents conflicts and catches bugs before they hit main |

Claude can handle all of this for you. "create a feature branch called add-notifications, build the feature, commit, push, and open a PR." Claude will do every step. But you need to understand the flow so you can tell Claude which workflow to use and catch it if it tries to push directly to main on a team project.

### The Commands That Can't Be Undone

Force push is the famous one, but it has relatives. Each of these can destroy work with no undo, and an AI trying to be helpful will sometimes reach for them when something gets stuck:

- `git push --force`: overwrites what's on GitHub with your copy.
- `git reset --hard`: throws away uncommitted changes on your machine, and can drop commits too.
- `git rebase` or `git commit --amend` on commits you already pushed: rewrites shared history, so everyone else's copy stops matching.
- `git checkout -- .` and `git restore .`: discard every uncommitted change in the project.
- `git stash drop` and `git stash clear`: delete work you set aside.
- `git clean -fd` and `git branch -D`: delete files and branches outright.
- `--no-verify`: skips the safety checks a project set up on purpose.

The rule in your CLAUDE.md should cover all of them: **never run anything that rewrites history or deletes work without asking me first, every time.** "It's my own branch" and "nothing will be lost" are not exceptions. When a push is refused, pull and merge.

### Worktrees: When Two Claudes Work on One Project

Once you run more than one Claude session on the same project (Part 2 covers when), they can trip over each other's half-finished changes. A **worktree** gives each session its own copy of the project on its own branch, all linked to one repo. Each session commits in its own space, and you merge the finished work back. This is also where "solo means push straight to main" stops being true: even working alone, two sessions are a team.

**Check your understanding:** How often should you commit your work?

- Once at the end of the day
- Only when a feature is completely finished
- **After every logical unit of work: a feature, a bug fix, a refactor (correct)**
- Every time you save a file

*Why:* Commit at logical checkpoints. Each commit should represent one coherent change. This way you can undo one thing without losing everything else. Too few commits means losing large chunks of work; too many clutters the history with meaningless snapshots.

**Check your understanding:** Claude hits a merge conflict and suggests running `git push --force`. What should you do?

- Let it run. Claude knows what it's doing
- Say yes, but only if it's your own branch
- **Stop it and ask Claude to pull first, resolve the conflict, and push normally (correct)**
- Delete the branch and start over

*Why:* Force push overwrites remote history. Any commits others pushed (or you pushed from another machine) are erased without warning. A normal push failing on conflict is git *protecting* you. Pull, resolve, push normally. This is exactly the kind of rule that belongs in your CLAUDE.md.

**Check your understanding:** You're working on a team project. What's the right way to add a new feature?

- Commit and push directly to main. It's faster
- **Create a feature branch, build the feature, push the branch, and open a pull request for review (correct)**
- Work locally and email the code to your teammates
- Create a new repo for each feature

*Why:* On a team, feature branches and pull requests keep main stable. Everyone works in isolation, then merges through a review process. This prevents conflicts, catches bugs before they hit production, and creates a clear history of who changed what and why.

#### Git Survival Rules

- Commit after every working change: small, frequent snapshots
- Push regularly. Until it's on GitHub, it only exists on your machine
- Never force push. Tell Claude this is a hard rule
- One repo per project. Keep it clean
- Solo? Push to main. Team? Feature branches + pull requests
- If a push fails, that's git protecting you. Pull, resolve, push normally


---

## Chapter 12: Environment Setup

*Install your tools, configure Claude, and create your first repo*

Now it's time to get your hands dirty. This is simpler than it used to be: install one app, make a folder, drop in a starter template, and open your first session. Five steps and you're building.

Each step is labeled so you know whether to do it yourself or let Claude handle it.

> we use the **Claude desktop app** here, the simplest way in. (Claude Code also runs in a terminal and inside VS Code once you're comfortable; the desktop app is the easiest place to start.)

#### Step: Install the Claude desktop app

The desktop app is the one tool you need. It includes Claude Code (the part that writes files and runs commands for you) built right in. No terminal setup required.

Go to `claude.com/download` and grab the build for your computer:

**Mac:**

Download the Mac version, open the downloaded file, and drag the Claude icon into your Applications folder. Open it and sign in with your Anthropic account.

**Windows:**

Download the Windows installer, run it, and accept the defaults. Launch Claude and sign in with your Anthropic account.

#### Step: Create a folder for your projects

Pick one home for all your coding projects. This is the folder you'll open with Claude.

**Mac:**

Open **Finder**, go to your **Documents** folder, and create a new folder (right-click → New Folder). Name it something simple like `Projects`.

**Windows:**

Open **File Explorer**, go to your **Documents** folder, and create a new folder (right-click → New → Folder). Name it something simple like `Projects`.

#### Step: Add the starter template

We've put together a starter pack so you don't begin from scratch: a ready-made `CLAUDE.md` with sensible safety rails, plus seven skills that put the lessons from this course into practice: `/commit`, `/update-docs` and `/brainstorm` for everyday work, and `/kickoff`, `/adversarial-review`, `/hosting` and `/watch-production`, which Part 2 explains.

[Download starter-template.zip](https://course.similearnai.com/starter-template.zip)

Move the downloaded zip **into your Projects folder**, then double-click it to unzip. It drops a folder named `.claude` right where it needs to be.

> **don't see the `.claude` folder?** That's normal: folders starting with a dot are hidden. You don't need to see it; Claude finds it automatically. (on Mac you can reveal hidden files with `Cmd + Shift + .` if you're curious.)

#### Step: Open your first session

Inside the Claude desktop app:

1. Go to the **Code** tab
2. Click **start new session**
3. Choose **local**
4. Select your `Projects` folder as the session folder

That's it. Claude automatically loads the `CLAUDE.md` and skills from the template you added. You're ready to build.

> **folder or sub-folder?** opening your whole `Projects` folder means every project shares that starter `CLAUDE.md` and those skills. You can also open one project's sub-folder instead, but a sub-folder won't have the general template unless you copy it in there too. (the rule: Claude only loads the `.claude` folder that lives in the folder you actually open.)

#### Step: Your first project: the assignment

Time to prove the whole setup works. You're going to create a real project and back it up to GitHub, without writing a single line of code or running a single git command yourself.

In your session, paste this prompt:

"create a new project called 'hello-claude' in this folder. initialize a git repo, add a README.md that says this project was scaffolded by Claude, then create a GitHub repo under my account and push everything up."

Claude will make the folder, set up git, write the README, create the repo on GitHub, and push. The first time it touches GitHub it'll walk you through connecting your account. Just follow its prompts.

> **how to verify:** ask Claude to "open the new repo on GitHub in my browser." If you see your `hello-claude` repo with its README, you're fully set up and ready to build.

> **what you just learned:** you didn't write any code or run any git commands. You described an outcome ("make a project and push it to GitHub") and Claude handled the how. That's the core workflow this entire course is about.

**Check your understanding:** Why does the starter template go into your Projects folder?

- **Claude loads the CLAUDE.md and skills from the .claude folder of whatever folder you open as your session, so putting it there makes them active (correct)**
- It has to live in your computer's home folder, where Claude always looks
- It can go anywhere in Documents. Claude searches your whole drive
- It goes inside the Claude app's own settings folder

*Why:* Claude reads CLAUDE.md and skills from the hidden .claude folder inside the folder you open as your session. That's why the template goes in your Projects folder: open a session there and it's automatically active. Open a folder with no .claude and none of it loads.

**Check your understanding:** You open a brand-new project sub-folder as your session, but you only put the starter template in your top-level Projects folder. What happens?

- Claude automatically copies the template into every sub-folder
- **That session won't have the general CLAUDE.md or skills, because they aren't in the folder you opened (correct)**
- The template works everywhere on your computer once it's installed
- Claude refuses to start the session

*Why:* The .claude folder only applies to the folder it lives in. A session opened in a sub-folder with no .claude won't inherit the top-level template. Either open the Projects folder itself, or copy the template into the project sub-folder too.

**Check your understanding:** In the assignment, you create a GitHub repo without writing a single git command yourself. What's the key skill that made that work?

- You memorized the exact git commands ahead of time
- **You described the outcome you wanted and let Claude handle the implementation (correct)**
- You installed every possible tool in advance
- You wrote the code and Claude just reviewed it

*Why:* You said what you wanted ("make a project and push it to GitHub") and Claude figured out the how. That outcome-over-implementation move is the core workflow this whole course is built around.

#### Setup Checklist

- Claude desktop app installed and signed in
- A Projects folder created in Documents
- Starter template unzipped into it (the hidden .claude folder)
- First session opened on your Projects folder via the Code tab
- First project created and pushed to GitHub (the assignment)

That's Part 1. You're set up, and everything so far (rules, skills, memory, the workflow) you can now practice for real. Build something small, then come back for Part 2: handing Claude bigger pieces of work.


---

## Part 2 · Chapter 13: Why This Changed Everything

*A huge working memory, swarms of agents, and loops, and what they do together*

Part 1 taught you to work with Claude one request at a time. Three capabilities changed what one person can do with it. Each removes a limit that used to keep you involved in every step.

### 1. The Desk Got Huge

Chapter 7 compared Claude's working memory to a desk. Recent Claude models in Claude Code have a desk of about 1 million tokens by default, roughly 750,000 words. That's enough to hold an entire app's code across several platforms, plus hours of conversation about it, at the same time.

A model that can see the whole problem stops guessing about the parts it can't see. Change a game rule, and the server, the iPhone app, the Android app and the website all get the same change, because all four are in view.

> **From the field**
>
> A builder rebuilt a multiplayer game across four codebases (server, web, iPhone, Android) in one session. It never had to compact. When the iPhone version needed a physics fix, Claude wrote shared test data that the web, iPhone and Android apps all had to pass, so players moved identically on every device.
>
> *A bigger desk means fewer guesses about the parts that are out of sight.*

> **still not a filing cabinet:** a huge desk makes it tempting to keep one session going for weeks. It still compacts eventually, and summaries of summaries blur decisions. Use the big window to hold a whole problem at once, and start a fresh session for each release, with your docs carrying what was decided.

### 2. Swarms: One Request, Many Workers

Chapter 7 introduced subagents as a way to keep your main conversation tidy. A **swarm** is many subagents working at once, each starting fresh with its own desk. One request gets the work of many, in three ways:

- **Building in parallel.** Ten agents build ten parts of an app at the same time, each in its own copy of the code (ask for worktrees, Chapter 11), and a lead agent fits the parts together.
- **Checking with fresh eyes.** Reviewers that didn't write the code look for what's wrong (Chapter 17).
- **Reading everything to answer a broad question.**

### Why Swarms Beat Search for Broad Questions

The usual way to point AI at a big pile of documents is a search system, often called RAG (short for retrieval-augmented generation). Ahead of time, it cuts every document into short chunks and stores a fingerprint of each chunk's meaning. When you ask a question, it pulls the 5 to 20 chunks whose meaning sits closest to your question and gives the AI only those. It handles different wording well: ask about "delivery dates" and it also finds "we'll ship by the 15th."

Its weakness is that it looks once, at a handful of chunks chosen by how much they resemble your question. That works when you know what you're looking for: "what did we promise Acme about delivery dates?" It can't help when you don't. **Search can only find what you can describe.** It will never bring back a kind of opportunity you didn't think to ask about, because every lookup starts from your description.

A swarm reads instead of looking things up. Split six months of meeting transcripts across dozens of agents. Each reads its share in full, with judgment, and reports what it found in the same format. A final agent merges the reports into categories with examples and counts. The categories come out of the reading: a customer mentioning a second location, a prospect switching to a tool you could integrate with, repeated grumbling about a competitor's pricing. No one had to know those categories existed before asking. One builder ran this over their sales calls and got back kinds of opportunities they would never have thought to search for.

**The rule:** use search when you know what you're looking for. Use a swarm when you don't know what you'll find.

| Search misses most of this | A swarm can |
|---|---|
| "find passages about follow-ups, cross-sells, upsells and objections." Returns the passages that resemble those words, and misses the remark about a second location. | "use a swarm to read every meeting transcript from the past 6 months and identify categories of sales signals from prospects and existing customers: chances to follow up, cross-sell, upsell, handle objections, and anything else you find. give examples and counts for each category." |

> **Mental model: The Card Catalog and the Reading Room**
>
> A library's card catalog finds books whose titles and subjects match what you typed. It can't tell you "which of these 600 letters show the writer was about to change careers," because no catalog card says that. For that you hire twenty readers, give each a stack, and ask them all the same question. Search is the catalog. A swarm is the reading room.

### What Swarms Cost, and When Search Still Wins

- **Cost grows with how much gets read.** Reading thousands of pages uses a lot of your plan's capacity. Save swarms for questions that need judgment across everything, and ask for a smaller, cheaper model such as Haiku for the reading agents.
- **Each agent's summary drops some detail,** and two runs over the same pile can come back a little different. Ask for examples and counts so you can check the findings.
- **Swarms are too slow for a search box.** If many customers will type questions and expect an answer in a blink, across millions of documents, a search index is still the right tool.
- **Claude Code itself doesn't use a search index on your project.** It searches your files directly, reads what it finds, and searches again until it has the answer. For your own projects, you almost never need to build one.

A pattern that combines them: run a swarm once to discover the categories, tag new material against those categories as it comes in, and re-run the swarm now and then to catch new kinds.

### 3. Loops: You Stop Being the Bottleneck

Without a goal, Claude stops when it thinks a turn is done and waits for you, even when the project isn't finished, so your attention sets the pace of every project. With a goal and permission to keep going (Chapter 16), it keeps building, testing and fixing until the finish line is met.

Working with the laptop closed matters less than working on six projects while you look at one. Each session keeps moving toward its own goal. You go from one to the next, making the decisions only you can make, and leave each one working when you go.

> **Mental model: Hospital Rounds**
>
> A doctor doesn't sit by one bed all day. Nurses carry on each patient's care, and the doctor does rounds: visits each bed, makes the calls that need a doctor, and moves on. Each loop is a nurse. You do rounds.

> **From the field**
>
> One builder's first version of a friend get-together app (server, booking page, iPhone app, tested in a simulator, signed and ready for testers) came out of a single 24-minute unattended run. In the same week, other sessions were moving a game through app review, keeping an Android app in step with its iPhone twin, and building a team tool. The builder visited each one for decisions.
>
> *Loops stop spending your attention on waiting.*

### What They Do Together

The big desk lets one agent hold a whole problem. Swarms let many agents split it up and check each other. Loops keep all of it moving without you. Your job moves from typing each next step to three things: setting direction, doing the steps only a human can (signing in to accounts, paying, approving releases), and judging what comes back. The rest of Part 2 teaches each piece of that job.

**Check your understanding:** You want to know what complaints keep coming up across six months of support emails, about 40,000 of them, without knowing in advance what the complaints are. What's the best approach?

- Search the emails for the word "complaint"
- **Use a swarm: split the emails across agents, have each read its share and report themes in the same format, then merge (correct)**
- Read a random ten and guess
- Have one agent read all 800 in a single pass

*Why:* Search can only find what you can describe, and the themes are what you're trying to discover. 40,000 emails won't fit on one desk, and one reader across that many loses track. Many readers on small stacks keep their attention on every email and work at the same time.

**Check your understanding:** You're running five projects at once and every one stalls until you reply. What changes that?

- Reply faster
- Drop to one project
- **Give each session a goal, permission to keep going, and a default for decisions, then visit each for the calls only you can make (correct)**
- Let Claude skip every permission check on everything

*Why:* Loops plus a clear kickoff let each project move without you. You do rounds instead of being the step every project waits on.

**Check your understanding:** Claude's working memory now holds about 750,000 words. Should you keep one session open for your project's whole life?

- Yes, it can hold everything now
- **No. Use the big window to hold a whole problem at once, but start fresh each release and keep decisions in docs (correct)**
- No, sessions can only last an hour
- Yes, as long as you never close the app

*Why:* Even a huge window compacts eventually, and compacted summaries blur what was decided. Docs keep decisions exact; fresh sessions read them.


---

## Part 2 · Chapter 14: The Kickoff Brief

*Start a build so Claude can keep working without stopping to ask*

The last chapter showed what one person can now hand off: a whole first version built while you're at dinner, a review run by agents you never talk to, a check that runs every morning on its own. All of it starts with how you hand the work over.

When Claude stalls in the middle of a long build, the cause is usually small. It needs permission it wasn't given ("can I deploy?"), a choice nobody made ("which name?"), or something only a human can provide ("I need the account ID"). A two-minute kickoff removes most of those stops before they happen.

### What Goes in a Kickoff

1. **The goal**: who it's for and the one thing it must do well.
2. **Your convictions**: what isn't up for debate ("multiplayer only, no bots").
3. **Look and feel**: an app or site you like. Without one, Claude guesses, and you'll likely restyle.
4. **What Claude may do without asking**: commit, deploy, spend up to some amount, message whom.
5. **When to stop**: what "done for this round" means.
6. **What to do when blocked on a choice**: wait for you, or take its own recommendation, note it, and keep going.
7. **What it will need from you**: accounts, keys, approvals it can already see coming.

You don't have to remember the list. The starter kit's `/kickoff` skill asks you about whichever items you skipped.

> **Mental model: The Note for the House-Sitter**
>
> Before a trip you leave a note: the dog eats twice a day, the plumber's number is on the fridge, spend what you need on groceries, call me only if something's on fire. A good note doesn't predict every event. It gives the sitter enough to handle most of them without phoning you, and says what to do with the rest.

### A Kickoff Is a Starting Point, Not a Spec

You will change your mind once you hold the thing. That's how building works, not a sign the kickoff failed. In one app, the builder only thought of phone-number sign-in after using the first version, and onboarding was redesigned twice after playing with it. Those changes were the point of building quickly. The kickoff's job is to get a real first version into your hands fast, so the adjusting can start.

> **From the field**
>
> A team asked Claude to build an internal tool overnight. Hours later it was still waiting for permission to deploy, which the builder thought they had already given. They wrote one standing rule into their project instructions: "deploy without waiting after a clean review." Every later build ran straight through.
>
> *Permission you give once, in writing, is permission you never have to give again at midnight.*

**Check your understanding:** You start an overnight build and come back to find Claude stopped at 11pm asking "should the app be called Hangout or Get-Together?" What kickoff line would have prevented the stall?

- "Use the best name."
- **"If you're blocked on a choice, take your recommendation, note it, and keep going." (correct)**
- "Don't ask me any questions."
- "Work faster."

*Why:* A default for blocked decisions lets Claude keep moving while leaving you a record of what it chose, so you can reverse it in the morning. "Don't ask questions" removes the record too.

**Check your understanding:** After using your app for a day, you realize you want a completely different sign-in method. What does that say about your kickoff?

- It failed. You should have planned sign-in fully up front.
- You should start the project over.
- **Nothing bad. Hands-on use is supposed to change your mind, and getting there quickly was the kickoff's job. (correct)**
- You should stop changing requirements.

*Why:* Touch, play, adjust is part of building. A kickoff exists to get a real version into your hands fast so those discoveries happen early.

**Check your understanding:** Which of these belongs in a kickoff as a standing permission?

- **"Costs under $5 are fine without asking." (correct)**
- "Use React."
- "Be careful."
- "Make it good."

*Why:* A spending ceiling is a concrete permission Claude can act on. "Be careful" and "make it good" give it nothing to decide with, and naming a framework is an implementation choice, not a permission.


---

## Part 2 · Chapter 15: Artifacts: Review by Looking

*Make decisions from pictures and buttons, not walls of text*

Claude can publish a web page from your session, called an **artifact**. It lives at a private link on claude.ai that you can open on your laptop or phone, and Claude updates the same link as work goes on. You can share it when you choose.

This changes how you review. Instead of reading five paragraphs about three design options, you look at three mockups side by side, read one line of recommendation, and tap the matching suggested reply in the app.

### What to Ask For

- **Decision cards**: "put the options on an artifact with mockups, what each costs, and your recommendation."
- **A running log**: one page per session, newest update on top, so you can catch up from your phone.
- **Screenshots, not descriptions**: "show me the screen" beats "the screen now shows."
- **Comparisons as tables**: anything with more than two options.

Ask Claude to republish to the same page each time, so the link stays the same and your artifact gallery becomes an index of everything you have going.

> **Mental model: Paint Swatches**
>
> Nobody picks a wall color from a written description of "a warm, slightly muted green." You hold three swatches against the wall and point. Artifacts are swatches for software decisions.

> **From the field**
>
> During a nine-hour app build, Claude published 43 updates to a single artifact: a plan, then decision cards with drawings, screenshots from the simulator, and comparisons of names. Most of the builder's replies were a single tap on one of the app's suggested replies. They could follow along from their phone while away from the desk.
>
> *The less reading a decision takes, the more decisions you can make in a day.*

> Artifacts need a paid Claude plan and a claude.ai sign-in. Checked October 2026; features in this part change often, so confirm in Claude's docs.

**Check your understanding:** Claude describes three layouts for your home screen in four paragraphs. What's the better request?

- "Pick one for me."
- **"Show the three layouts as mockups side by side on an artifact, with your recommendation." (correct)**
- "Describe them in more detail."
- "Build all three."

*Why:* A visual decision deserves a visual comparison. Mockups take Claude seconds and let you decide in one glance.

**Check your understanding:** Why ask Claude to republish to the same artifact rather than make a new one each time?

- **The link stays the same, so you can keep one tab or bookmark and always see the latest (correct)**
- New artifacts cost extra
- Claude can only make one artifact
- It doesn't matter

*Why:* One stable link per session means you always know where to look, from any device.

**Check your understanding:** Claude says "the login screen now matches the design." What should you ask for?

- Nothing. It said it matches.
- The code for the login screen
- **A screenshot of the login screen next to the design (correct)**
- A longer description

*Why:* Side by side, a mismatch is obvious to you even when Claude missed it.


---

## Part 2 · Chapter 16: Unattended Work and Loops

*Let Claude keep going while you're away, and know what stops it*

Claude can work for hours without you: building, testing, fixing what the tests find, and building again. What lets it do that is mostly the kickoff from the last chapter: permission, a stop condition, and a default for decisions. Two tools keep a run going without stopping, and three scheduling tools differ in one way that matters: **what happens when you close your laptop.**

### Two Tools for a Long Run

- **Auto mode** (in the mode menu under the message box) lets Claude run commands without asking each time. A safety check still blocks risky actions like force pushes. Without it, an unattended run stops at the first command that needs your OK.
- **`/goal`** followed by a finish line, such as `/goal the game plays a full round in two simulators`, keeps Claude working turn after turn until a separate checker agrees the finish line is met.

### Repeating and Scheduled Work

- **`/loop`** repeats a task inside your session on a timer, like "check the deploy every 10 minutes." It stops when the session or computer stops.
- **A desktop scheduled task** runs on your computer on a schedule, only while the app is open and the computer is awake. Use it when the job needs files on your machine.
- **A cloud scheduled task** runs on Anthropic's servers on a schedule, even with your laptop closed. Set it up from the Scheduled page in the desktop app, at claude.ai/code, or with `/schedule`.

> **Mental model: The Slow Cooker**
>
> A slow cooker lets you leave the kitchen for hours, but only if it stays plugged in. Work running in your session is a slow cooker plugged into your laptop: unplug it and dinner stops cooking. A cloud scheduled task is a meal-delivery subscription: it shows up whether you're home or not.

> **From the field**
>
> A builder left a long data-recovery job running in their session and closed their laptop to change locations. The job died with the session. It had to be moved onto a server and started again.
>
> *Before you walk away, ask: "does this need my laptop to stay on?"*

### Every Unattended Run Needs

- **A stop condition**: "until the app runs in the simulator against two players," not just "until done."
- **Permission for what it will hit**: auto mode, plus your written rules for commits, deploys and spending.
- **A plan for blocked decisions**, or the run ends on a question and sits idle until you're back.
- **A way to reach you**: a notification or a message when it finishes or truly needs you.

### Watch the Bill

Long unattended runs and many agents at once use a lot of your plan's capacity. Start with one run on something small, see what it costs, then scale up.

**Check your understanding:** You want a check to run every morning even when your laptop is closed. Which should you use?

- /loop or /goal
- A desktop scheduled task
- **A cloud scheduled task (correct)**
- A very long session

*Why:* Only the cloud version runs without your computer. /loop and /goal stop with the session, and desktop tasks need the app open and the computer awake.

**Check your understanding:** You set a goal at 10pm and come back at 7am to find Claude stopped at 10:40pm asking which of two names to use. What was missing?

- A faster model
- **A rule for what to do when blocked on a decision (correct)**
- More memory
- Nothing, that's how loops work

*Why:* A long run ends on a question unless you've told it what to do with questions. "Take your recommendation and keep going" would have bought you eight hours of work.

**Check your understanding:** Which is the best stop condition for an unattended build?

- "until it's good"
- "for a few hours"
- **"until the game runs in two simulators and a full round plays to the end" (correct)**
- "until you're tired"

*Why:* A stop condition Claude can check for itself lets it know when it's finished, and tells you exactly what you'll find when you come back.


---

## Part 2 · Chapter 17: Adversarial Agents

*Have a second Claude, one that didn't build it, try to break it*

Chapter 3 explained that Claude grades its own work generously. The fix is the same one publishers, hospitals and courts use: a second reviewer whose only job is to find what's wrong, with no stake in the first answer.

In Claude Code that reviewer is a separate agent. It starts fresh, reads the work, and reports problems. Because it didn't write the code, it has no story to protect.

### Three Kinds of Reviewer

- **Code reviewer**: bugs, security holes, data loss, things that break existing users. `/code-review` reviews changes you haven't pushed yet; for work already pushed, name the range, such as `/code-review HEAD~10..HEAD` for the last ten commits. `/code-review ultra` sends a larger team of reviewers in the cloud. It compares a branch to main, so do big changes on a branch; it includes a few free runs, then costs usage credits.
- **Persona tester**: an agent told to be a specific person and get stuck. A first-time user. An App Store reviewer. A player trying to cheat. A customer in a hurry.
- **Rule checker**: compares the work to your written rules, a store's guidelines, or your writing style.

The starter kit's `/adversarial-review` skill runs all three, has each finding double-checked, and ends with a list of what nobody tested.

> **Mental model: The Writer and the Editor**
>
> A writer can't see their own typos because they read what they meant to write. An editor reads what's on the page. The two are equally skilled; what makes the editor useful is that they didn't write it.

> **Mental model: The Second Opinion**
>
> For a big diagnosis you see a second doctor, and you don't show them the first doctor's conclusion. You want their read, not their agreement. Give a reviewer the work, not your theory about it.

> **From the field**
>
> One team ran a review before every deploy of a meeting-notes tool. The reviewers caught that making one call private could erase another meeting's recording, and that tasks were still being filed from calls marked private. On another app, an overnight review found and fixed 19 real bugs before launch. Another app built the same month skipped review and went to Apple without a "block user" feature, which Apple requires for apps where people can see each other's posts. A reviewer playing an App Store reviewer checks for exactly that.
>
> *Make review a step that happens every time something ships, not something you remember to do.*

### Make It Automatic

Put review where you can't skip it: a line in your release skill ("run /adversarial-review before uploading"), or a hook that blocks a submit command until a review has run. A gate you have to remember is a gate you'll forget.

**Check your understanding:** Why is a separate agent better at reviewing than asking the same session "please double-check your work"?

- Separate agents are smarter
- **It didn't build the work, so it reads what's there instead of what was intended (correct)**
- It's faster
- It isn't better

*Why:* The building session already believes its work is right. A fresh reviewer has no story to defend.

**Check your understanding:** You're about to submit a social app to the App Store. Which reviewer persona would most likely catch a rejection?

- A reviewer focused on variable names
- **An agent playing an App Store reviewer, checking against Apple's guidelines (correct)**
- An agent that praises the design
- No reviewer; Apple will tell you

*Why:* Apple's reviewers check guidelines, like requiring a way to block abusive users. An agent playing that role catches the same things days earlier.

**Check your understanding:** What should you give a reviewer agent?

- Your theory of what's probably wrong
- The builder's summary saying everything works
- **The work itself and what to judge it against (correct)**
- Nothing, it figures it out

*Why:* Handing over your conclusion invites agreement. Give it the work and the standard, and let it form its own view.


---

## Part 2 · Chapter 18: Adversarial Prompting

*Questions that make Claude argue against itself*

You don't always need a separate agent. Often the right question in the same conversation is enough to shift Claude from defending its answer to testing it. Chapter 4 showed that your framing decides what's probable. These questions make problems the probable answer.

### Questions Worth Keeping Handy

- **"What did you not prove?"** Gets the list of untested parts.
- **"Argue against your own recommendation."** Brings out the costs it skipped.
- **"Is this a real constraint, or one a Claude session assumed?"** Catches guesses that hardened into rules.
- **"What's the fastest path if I accept some tradeoff?"** Breaks through blockers that sound official.
- **"What would a first-time user get stuck on?"** Puts it in a user's shoes.
- **"Where is this solid and where am I off?"** Balanced feedback on your own idea.
- **"Which of these do you agree with, and which do you push back on?"** For outside advice you don't want applied blindly.

> **Mental model: The Debate Coach**
>
> A debate coach makes students argue the side they disagree with. Not because that side is right, but because you only understand your own position once you've made the best case against it.

> **From the field**
>
> A builder noticed their app kept a list private between two people and asked: "Are we correcting toward a random privacy rule that some Claude session made up, or toward Apple's requirements?" It turned out an earlier session had guessed the privacy reason and written it into the project notes as fact. Because of that guess, commitments one person entered never showed up on the other person's phone, and the app had shipped that way.
>
> *When a constraint feels odd, ask where it came from.*

**Check your understanding:** A friend sends you ten suggestions for your app. What's the best way to bring them to Claude?

- "Implement all of these."
- **"Which of these do you agree with, which do you push back on, and why?" (correct)**
- "Are these good?"
- Don't share them

*Why:* Asking for agreement and pushback item by item gets a judgment, not a to-do list. "Are these good?" invites a yes.

**Check your understanding:** Claude says you must wait for a company developer account before anyone else can install your app. What's the best next question?

- "How long will that take?"
- "OK, let me know when it's ready."
- **"What's the fastest way to get it to them if I accept some tradeoff?" (correct)**
- "Can you hurry?"

*Why:* That question once turned a twelve-day wait into a same-evening release using an account the builder already had.

**Check your understanding:** Claude reports "sign-in verified end to end." Which question is most likely to reveal a hidden gap?

- **"What did you not prove?" (correct)**
- "Great, are you sure?"
- "Can you verify it again?"
- "Did it work?"

*Why:* "Are you sure?" invites another yes. "What did you not prove?" asks for a list, and the list is where gaps like "it ran in sandbox mode" show up.


---

## Part 2 · Chapter 19: Parallel Sessions

*More than one Claude at a time, and when that's a mistake*

You can run several Claude sessions at once: one on the iPhone app, one on the Android app, one on the website. In the desktop app each is a row in the sidebar, and you can view two side by side. Sessions can also message each other.

Parallel work only helps when the pieces don't depend on each other's unfinished decisions.

### Wait Until the Shape Is Settled

Early in a project, almost everything depends on decisions you haven't made yet, because you haven't played with the thing yet. Start an Android version or a promo video then, and it copies a version of the app that's about to change. One builder had a promo video made the same evening as the first version. Within a day the app gained half-hour start times and a new way to pick dates, and the video was out of date.

**Good times to split:** the app's core is settled and you're porting it to a second platform; two features touch different parts of the code; a research question runs while you build.

**Bad times:** you're still deciding what the app is; two sessions would edit the same files; one piece needs the other's result.

> **Mental model: Building Sets for an Unfinished Script**
>
> A film crew can build sets in parallel with rehearsals once the script is locked. If the writers are still rewriting scenes, the crew is building rooms for scenes that will be cut.

### Keep Them Out of Each Other's Way

- Give each session its own **worktree** (Chapter 11), so their changes don't collide.
- Keep a shared checklist file when two sessions must stay in step, like iPhone and Android versions of the same release.
- Let sessions message each other directly rather than relaying through a third.
- Watch shared resources. Two sessions deploying to the same server can undo each other's work.

> **From the field**
>
> Once an app's first release was out, one builder ran its iPhone and Android versions in two sessions. The Android session kept a checklist of every iPhone change and worked through it; the builder could tell it "start on the 1.4 changes" and it picked them up. A third session that tried to relay messages between them only added confusion and was dropped.
>
> *Parallel sessions work best after release, when the target is fixed.*

**Check your understanding:** Your app's first version is an hour old and you're still trying it out. Should you start the Android port in a parallel session?

- Yes, always parallelize as early as possible
- **Not yet. The app's shape will change as you use it, and the port would copy a moving target (correct)**
- Yes, but only on weekends
- Never port to Android

*Why:* Parallel work pays off once the thing being copied is settled. Until then, each change you make means redoing work in the other session.

**Check your understanding:** Two sessions are working in the same project folder and keep overwriting each other's changes. What's the fix?

- **Give each session its own worktree (correct)**
- Tell them to type faster
- Use one session only, forever
- Force push to settle it

*Why:* A worktree gives each session its own copy and branch, linked to one repo, so they never edit the same files at the same moment. And never force push.

**Check your understanding:** Which pair of tasks is the best fit for two parallel sessions?

- Designing the home screen and building the home screen
- **Researching payment providers while building the settings page (correct)**
- Two sessions editing the same login file
- Building a feature and writing its marketing video before it's tested

*Why:* Research and an unrelated feature don't depend on each other. The other pairs either share files or need one result before the other can start.


---

## Part 2 · Chapter 20: Watching Production

*Find out it's broken before your users tell you*

Once real people use your app, "it worked when we tested it" stops being enough. Vendors change prices, credits run out, a server restarts and doesn't come back. The app can be broken for days while every status page says green.

The fix is a small automatic check that does what a user does, once a day or once an hour, and tells you only when it fails.

### What to Decide

- **The critical path**: the two or three things that must always work. Sign in. Book. Pay.
- **Where it runs**: a cloud scheduled task (Chapter 16), so it keeps running with your laptop closed. Cloud tasks work from a GitHub repo and can only reach websites you allow, so add your app's address to the task's allowed sites.
- **Test accounts** it can use without touching real users or sending real messages to real people.
- **Where alerts go**: email, Slack or a text, and only on failure.
- **Vendor limits**: credits and quotas that run out silently. Alert before they hit zero.

The starter kit's `/watch-production` skill walks you through these and sets the check up.

> **Mental model: The Smoke Detector**
>
> You don't sit in each room sniffing for smoke. A detector checks constantly, stays silent while nothing's wrong, and is impossible to ignore when something is.

> **From the field**
>
> An app's phone sign-in broke for real users because the text-message provider required a far more expensive plan than expected. It stayed broken for about two weeks. On another tool, live transcription stopped mid-week when the AI provider's prepaid credits ran out. In both cases, a daily check that signed in or ran one short test would have caught it within a day.
>
> *Test the path a user takes, on a schedule, and alert on failure.*

**Check your understanding:** What should a daily production check actually do?

- Confirm the server responds with "OK"
- **Go through a real user step, like signing in with a test account, and confirm it succeeds (correct)**
- Email you every morning that all is well
- Count the lines of code

*Why:* A server can answer "OK" while sign-in is broken. Only a check that does what users do will catch what users would hit.

**Check your understanding:** Why should alerts go out only on failure?

- **Daily "all good" messages train you to ignore the alerts, including the one that matters (correct)**
- Success messages cost money
- It doesn't matter
- Claude can't send success messages

*Why:* If every message is noise, you'll stop reading them, and the real failure gets swiped away with the rest.

**Check your understanding:** Your app depends on an AI service with prepaid credits. What should the check also watch?

- The service's homepage
- Nothing; credits never run out
- **The remaining balance, with an alert before it reaches zero (correct)**
- The weather

*Why:* Running out of credits fails without warning. An early alert turns an outage into a top-up.


---

## Part 2 · Chapter 21: Where Your App Lives

*Vercel, a home server, a rented server, or a container, and how to choose*

Anything other people use has to run on a computer that's on and reachable. You have four realistic choices. Claude can set up any of them for you; your job is to pick, because each one trades money for something else: uptime, upkeep, or limits.

### The Four Options

- **Vercel** (a hosting service for websites): you push code and it's live. Great for sites and for APIs that answer a request and finish. Limits: each request has a time limit, and there's no disk that keeps files between requests. In October 2026 Vercel added always-on background workers (in beta), but they can't accept connections from users' devices, so a live game server or chat that phones stay connected to still needs another home. The free plan is for personal, non-commercial use.
- **A home server** (a Mac Mini or old laptop) behind a **Cloudflare Tunnel**: Cloudflare's free tool makes a machine at home reachable at your domain without opening your home network (your domain's settings need to be managed by Cloudflare). It costs almost nothing per month and can run anything, all the time. The tradeoffs: it goes down when your power or internet does, the machine must stay awake, backups are your job, and anyone with the link can reach it unless you add a login in front.
- **A droplet** (a small rented Linux server from DigitalOcean, from a few dollars a month): always on, runs anything, sits in a data center. The tradeoff is upkeep: security updates, a firewall, keys for logging in, and backups are yours.
- **A short-lived container**: a fresh, temporary computer in the cloud that starts, runs one job, and is thrown away. Good for jobs that run and exit, like processing an uploaded file. Nothing is kept between runs. Several services offer these; Claude will suggest one that fits.

> **Mental model: Where to Open a Shop**
>
> Vercel is a booth in a managed market: set up in minutes, cleaned for you, but you follow the market's rules, and each customer has to be served within a set time. A home server is selling from your own garage: no rent, but if your power goes out, so does the shop. A droplet is renting a storefront: open all hours, your rules, your repairs. A container is a food truck that parks, serves one rush, and drives off.

### Decide These, Whichever You Pick

- Where the data lives, and how it's backed up.
- Where passwords and keys are stored (the host's settings or an environment file, never git or chat).
- Who owns the domain name, and where it's managed.
- What it costs at the usage you expect, and what users see if it goes down.

The starter kit's `/hosting` skill makes sure each of these comes up before you choose, then sets up your pick step by step. Prices and limits change, so it checks the providers' current pages.

> **From the field**
>
> One builder runs many small apps and services from a single Mac Mini at home, each reached through a Cloudflare Tunnel, with marketing sites on Vercel. A new app's server goes live the same afternoon for no added monthly cost. The tradeoff showed up once: a power outage took several apps down at the same time.
>
> *Cheap hosting is a real option. Choose it knowing what happens when the lights go out.*

**Check your understanding:** Your app is a live multiplayer game: every player's phone stays connected to the server for the whole round. Which option fits worst?

- **Vercel (correct)**
- A droplet
- A home server with a Cloudflare Tunnel
- They're all the same

*Why:* Vercel's request handlers have a time limit, and its new always-on workers can't accept connections from phones. A droplet or home server can hold those connections.

**Check your understanding:** What's the main risk of hosting on a Mac Mini at home?

- It's too expensive
- **It goes down when your home's power or internet does (correct)**
- It can't run websites
- Cloudflare Tunnel costs a lot

*Why:* A home server is cheap and flexible, but it shares your house's power and internet. Decide whether your users can live with that.

**Check your understanding:** You're launching a paid app. Why might Vercel's free plan be the wrong pick?

- It's too slow
- It doesn't support websites
- **The free plan is for personal, non-commercial use (correct)**
- It has no limits

*Why:* A business using Vercel needs a paid plan. Check the current terms before you launch.


---

## Part 2 · Chapter 22: Capstone: Ship Something

*One small project, start to finish, using everything from Part 2*

Pick something small that a real person would use: a sign-up page for an event, a tracker for your kids' chores, a page that answers one question for your customers. Then run the whole loop once. Note the time you start.

#### Step: Kick off

Run `/kickoff` and answer its questions. Include a stop condition, a spending limit, and what to do when blocked.

#### Step: Decide on an artifact

Ask for the main choices (look, name, hosting) as an artifact with mockups and a recommendation. Pick.

#### Step: Let it build unattended

Switch the session to auto mode (the mode menu under the message box) so Claude doesn't stop to ask before each command. Then set a goal, such as `/goal the page works on a phone-sized browser and the sign-up form saves an entry`. Walk away for a while.

#### Step: Review it

Run `/adversarial-review`. Read the confirmed problems and the "not proven" list.

#### Step: Play and adjust

Use it on your own phone. Check the "not proven" items yourself. Tell Claude what felt wrong and go around again, as many times as it takes.

#### Step: Ship, watch, document

Put it live with `/hosting`, send the link to one person who will use it, set up `/watch-production`, and run `/update-docs`. Note the time you finish.

**Check your understanding:** In the capstone, who uses the app on a real phone?

- Nobody; the simulator is enough
- **You do, including the items on the "not proven" list (correct)**
- Only the reviewer agent
- Your first customer

*Why:* Claude tests a lot, but real texts, push notifications and how it feels in the hand are yours to check.

**Check your understanding:** Halfway through, you realize you want a different layout. What do you do?

- **Tell Claude and go around the loop again; adjusting after hands-on use is expected (correct)**
- Start a new project
- Keep the old layout because the kickoff said so
- Rewrite the kickoff from scratch

*Why:* Adjusting after hands-on use is a planned step in the loop.

**Check your understanding:** The review finds a problem, and Claude offers to force push the fix to save time. What do you say?

- Fine, it's a small project
- Fine, it's my own branch
- **No. Commit the fix normally and push; if the push is refused, pull and merge (correct)**
- Delete the repo and start over

*Why:* There's no project small enough for a force push to be safe. A normal commit costs seconds and can't destroy anything.

How long did it take, from kickoff to a live page someone else used? Write that number down. It will shrink every time you go around.
