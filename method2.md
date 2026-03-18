# how peter collaborates with claude code — a pattern analysis

based on a real session: migrating a slack-based task manager from a local mac mini to a shared digitalocean server, adding multi-user support, and building a reaction sync system.

---

## what works well

### 1. you let the ai drive implementation, but you steer direction

you don't micromanage code. you describe what you want at a high level ("port the whole thing over to DO") and let me figure out the files, the config, the deployment steps. but when something matters to you — like "use console logging, pm2 logs are awful" — you course-correct immediately. this is the right ratio. the ai is fast at implementation details; you're better at knowing what actually works in your environment.

### 2. you catch what the ai misses

multiple times in this session you caught things i would have shipped without:
- "does it search DMs too?" — i hadn't included im/mpim in the channel types
- "do you need to update the skill doc too?" — i would have forgotten
- "jake's claude is still using mac mini" — you understood the propagation problem (shared repo needs git pull) before i did

this is a skill. you're not just reviewing code — you're thinking about the full system: who uses it, how they access it, what state they're working from.

### 3. you give real-time context the ai can't infer

"he doesn't have a local copy of Master" — one sentence that completely changed my debugging direction. "it's a partner channel but the bot is not in it" — saved me from chasing server-side bugs when the issue was slack app config. the ai can read code but it can't see your slack admin panel or know what's on jake's machine.

### 4. you use skills and memory as infrastructure

your `.claude/` repo with shared skills, the memory system for user identity, the CLAUDE.md conventions — these aren't afterthoughts. they're how you make the ai useful across sessions and across team members. most people don't invest in this scaffolding and end up re-explaining context every conversation.

### 5. you push back on bad answers without overthinking it

"jake's claude is saying the handler hasn't been pushed yet?" — you didn't panic or start debugging. you just reported what you saw and let me figure out that jake's claude was wrong. "oof is that always going to take ~minutes?" — you flagged the UX problem immediately. no tolerance for slow tools.

---

## what could work better

### 1. share secrets through env files, not chat

you pasted a slack bot token directly in the conversation. for a trusted local tool this is low risk, but it's a habit worth breaking — conversation logs can persist in unexpected places. better pattern: "the token is in /path/to/.env under SLACK_TASK_BOT_TOKEN" and let the ai read it.

### 2. front-load constraints before the ai starts building

the DM support, the "anyone can pin jake's emoji" clarification, the "sync should run every time we query" — these all came up after i'd already built or deployed something. each one required another commit-push-deploy cycle. if you'd said upfront "it needs to work in DMs, anyone can assign tasks to anyone, and it should sync on every query" i could have built all of that in the first pass.

this isn't a criticism — it's how real building works, you discover requirements as you go. but when you have a mental model of the full feature, dumping it early saves cycles. even a rough bullet list helps.

### 3. name the problem before asking for a solution

"can we also have that be part of the flow" — i knew what you meant because of context, but in a fresh conversation or with a different ai, this would be ambiguous. compare: "the reaction sync should run automatically before querying tasks in the task-manager skill." specific requests get better first-attempt results.

### 4. let the ai fail before intervening

when the slack events weren't coming through for jake, you were quick to provide context ("it's the same workspace as me", "the bot is not in the channel"). this was helpful here because the problem was outside the codebase. but in pure code debugging, sometimes letting the ai flail for a minute produces better results — it explores paths you wouldn't think to suggest, and it learns the codebase topology in the process.

---

## patterns worth teaching others

### the "test it, then tell me what you see" loop

the most productive debugging pattern in this session: i'd make a change and deploy, you'd have jake test, then report what happened. no speculation. real data. this is faster than either of us theorizing.

### using the ai as a deployment pipeline

you didn't ssh into DO yourself once. you let me do every git add, commit, push, deploy.sh, and log check. this is the right call — it's tedious work that's easy to get wrong, and the ai can do it reliably while you focus on the actual problem.

### building for your team, not just yourself

the whole session was about making a personal tool work for two people. you thought about: how does jake's claude know it's jake? how does the skill doc need to change? does jake need to pull the repo? this team-awareness is what separates a useful tool from a personal hack.

### the ".claude repo" pattern

keeping your claude code configuration (skills, hooks, settings) in its own git repo that team members share is genuinely clever. it means when one person improves a skill, everyone benefits on next pull. jake added the slack deep links section and you immediately had it too.

---

## tl;dr

you're good at this. you treat the ai as a capable junior engineer — you give it direction, let it execute, review its work, and catch the things it can't see. the main optimization is front-loading requirements and keeping secrets out of chat. the infrastructure you've built around claude code (shared skills, memory, team conventions) is what makes the collaboration compound over time instead of resetting every session.
