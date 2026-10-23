---
name: adversarial-review
description: Run an independent review of finished work before it ships, using separate agents whose only job is to find problems. Use before a deploy, a release, an App Store or Play submission, a merge, or when the user says "review this", "check this before we ship", or "adversarial".
---

# Adversarial Review

You wrote the work, so you are the wrong one to grade it. Hand it to reviewers that did not build it.

1. Make sure the user decides what this review covers: code only, the product experience, or both, and whether anything (like store guidelines or a writing style) must be checked against.
2. Spawn separate subagents, each with one job and no stake in the work:
   - **Code reviewer**: bugs, security holes, data loss, things that break existing users. Use `/code-review` where available: with no target it only covers unpushed changes, so pass a range (such as `HEAD~10..HEAD`) for work already pushed. `/code-review ultra` compares a branch to main and costs usage credits after a few free runs; offer it for big changes.
   - **Persona testers**: a first-time user, and whoever judges the work (an App Store reviewer, a customer, a cheating player). Each tries to get stuck or break it.
   - **Rule checker**: if the project has written rules (CLAUDE.md, a style guide, store guidelines), check the work against them.
3. Have each finding verified before reporting it. Drop anything that does not hold up.
4. Report to the user: confirmed problems, most serious first, with a recommended fix for each.
5. End with a **not proven** list: what nobody actually tested (real devices, real SMS or email delivery, payments, two people at once, slow networks). The user checks those by hand.

Do not ship until the user has seen this report.
