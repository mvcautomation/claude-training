"""Export the course (app/index.html) to one markdown file.

Usage: python3 scripts/export-md.py [out.md]   (default: course.md at repo root)
Re-run after any course edit so the markdown copy (also kept as a doc in SchoolMVP HQ) stays in sync.
"""
import re, sys, html
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "app" / "index.html"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "course.md"

SKIP_CLASSES = {"chapter-nav", "score-card", "platform-tabs", "setup-legend", "hero-btn", "quiz-label", "setup-badge", "setup-step-num"}


class MD(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []          # finished blocks
        self.buf = ""          # current inline text
        self.stack = []        # (tag, classes)
        self.skip = 0
        self.list_stack = []   # 'ul' or ['ol', n]
        self.quote = 0         # blockquote depth (metaphor/story/note)
        self.quiz = None       # {'q':, 'opts': [], 'exp':}
        self.opt_correct = None
        self.cmp = None        # comparison rows

    def classes(self, attrs):
        return set((dict(attrs).get("class") or "").split())

    def flush(self, prefix=""):
        text = re.sub(r"[ \t\r\n]+", " ", self.buf).strip()
        self.buf = ""
        if not text:
            return
        if self.quote:
            prefix = "> " + prefix
        self.out.append(prefix + text)

    def handle_starttag(self, tag, attrs):
        cls = self.classes(attrs)
        self.stack.append((tag, cls))
        if self.skip or cls & SKIP_CLASSES or tag in ("script", "style", "button") and "quiz-option" not in cls:
            self.skip += 1
            return
        if tag == "div" and "platform-content" in cls:
            plat = dict(attrs).get("data-platform", "")
            self.flush(); self.out.append(("> " if self.quote else "") + f"**{plat.capitalize()}:**")
        if tag == "div" and ({"metaphor", "story", "setup-note"} & cls):
            self.flush(); self.quote += 1
            label = {"metaphor": "Mental model", "story": "From the field", "setup-note": ""}
            for k, v in label.items():
                if k in cls and v:
                    self.out.append("> **" + v + "**")
        if tag == "div" and "quiz" in cls:
            self.flush(); self.quiz = {"q": "", "opts": [], "exp": ""}
        if tag == "button" and "quiz-option" in cls:
            self.opt_correct = dict(attrs).get("data-correct") == "true"
        if tag == "div" and "comparison" in cls:
            self.flush(); self.cmp = []
        if tag in ("h1", "h2", "h3", "h4", "p", "li") or (tag == "div" and cls & {"chapter-title", "chapter-subtitle", "chapter-number", "setup-step-title", "lesson", "metaphor-label", "story-label", "comparison-label"}):
            self.flush()
        if tag == "ul":
            self.flush(); self.list_stack.append("ul")
        if tag == "ol":
            self.flush(); self.list_stack.append(["ol", int(dict(attrs).get("start", 1))])
        if tag == "strong" or tag == "b":
            self.buf += "**"
        if tag == "em" or tag == "i":
            self.buf += "*"
        if tag == "code":
            self.buf += "`"
        if tag == "br":
            self.buf += " "

    def handle_endtag(self, tag):
        if not self.stack:
            return
        t, cls = self.stack.pop()
        if self.skip:
            self.skip -= 1 if (cls & SKIP_CLASSES or t in ("script", "style") or (t == "button" and "quiz-option" not in cls) or self.skip > 0) else 0
            return
        if t in ("strong", "b"):
            self.buf += "**"
        elif t in ("em", "i"):
            self.buf += "*"
        elif t == "code":
            self.buf += "`"
        if self.quiz is not None:
            if t == "div" and "quiz-question" in cls:
                self.quiz["q"] = self._take()
            elif t == "button" and "quiz-option" in cls:
                self.quiz["opts"].append((self._take(), self.opt_correct))
            elif t == "div" and "quiz-explanation" in cls:
                self.quiz["exp"] = self._take()
            elif t == "div" and "quiz" in cls:
                q = self.quiz; self.quiz = None
                self.out.append(f"**Check your understanding:** {q['q']}")
                for o, ok in q["opts"]:
                    self.out.append(f"- {'**' if ok else ''}{o}{' (correct)**' if ok else ''}")
                self.out.append(f"*Why:* {q['exp']}")
            return
        if self.cmp is not None:
            if t == "div" and "comparison-label" in cls:
                self.cmp.append([self._take(), ""])
            elif t == "p" and self.cmp:
                self.cmp[-1][1] += self._take() + " "
            elif t == "div" and "comparison" in cls:
                rows = self.cmp; self.cmp = None
                self.out.append(("> " if self.quote else "") + "| " + " | ".join(r[0].capitalize() for r in rows) + " |")
                self.out.append(("> " if self.quote else "") + "|" + "---|" * len(rows))
                self.out.append(("> " if self.quote else "") + "| " + " | ".join(r[1].strip() for r in rows) + " |")
            return
        if t == "div" and "chapter-number" in cls:
            self._num = self._take()
        elif t == "div" and "chapter-title" in cls:
            self.out.append(f"## {self._num}: {self._take()}")
        elif t == "div" and "chapter-subtitle" in cls:
            self.out.append(f"*{self._take()}*")
        elif t in ("metaphor-label", "story-label"):
            self._take()
        elif t == "div" and cls & {"metaphor-label", "story-label"}:
            self._take()
        elif t == "h1":
            self.flush("# ")
        elif t == "h2":
            self.flush("## ")
        elif t == "h3":
            self.flush("### ")
        elif t == "h4":
            self.flush("**" if self.quote else "#### ")
            if self.quote and self.out and not self.out[-1].endswith("**"):
                self.out[-1] += "**"
        elif t == "div" and "setup-step-title" in cls:
            self.flush("#### Step: ")
        elif t == "p" and "lesson" in cls or (t == "div" and "lesson" in cls):
            self.buf = "*" + self.buf.strip() + "*"; self.flush()
        elif t == "p":
            self.flush()
        elif t == "li":
            top = self.list_stack[-1] if self.list_stack else "ul"
            if isinstance(top, list):
                self.flush(f"{top[1]}. "); top[1] += 1
            else:
                self.flush("- ")
        elif t in ("ul", "ol"):
            self.flush()
            if self.list_stack:
                self.list_stack.pop()
        elif t == "div" and ({"metaphor", "story", "setup-note"} & cls):
            self.flush(); self.quote -= 1; self.out.append("")
        elif t == "div":
            self.flush()

    def _take(self):
        s = re.sub(r"\s+", " ", self.buf).strip(); self.buf = ""; return s

    def handle_data(self, data):
        if not self.skip:
            self.buf += data


src = SRC.read_text()
main = src[src.index('<div class="main">'):src.index("</div><!-- /main -->")]
main = re.sub(r"<!--.*?-->", "", main, flags=re.S)
p = MD(); p._num = ""
p.feed(main)
p.flush()

def kind(l):
    if l.startswith("> "): return "quote"
    if l.startswith("- ") or re.match(r"\d+\. ", l): return "list"
    if l.startswith("|"): return "table"
    return "para"

# merge "> **Mental model**" + "> **Title**" into one heading line
merged = []
for l in p.out:
    if merged and merged[-1] in ("> **Mental model**", "> **From the field**") and l.startswith("> **") and l.endswith("**") and merged[-1] == "> **Mental model**":
        merged[-1] = "> **Mental model: " + l[4:]
        continue
    merged.append(l)

lines = []
for l in merged:
    if not l.strip():
        if lines and lines[-1] != "": lines.append("")
        continue
    if lines and lines[-1] != "":
        prev, cur = kind(lines[-1]), kind(l)
        if cur == "quote" and prev == "quote":
            lines.append(">")
        elif cur != prev or cur == "para":
            lines.append("")
    lines.append(l)
    if l.startswith("#"):
        lines.append("")
md = "\n".join(lines)
md = re.sub(r"\n{3,}", "\n\n", md)
md = md.replace("# Building Real Software with AI", "# Claude Code 101: Building Real Software with AI", 1)
md = md.replace(" Tap a chapter to jump to it.", "")
md = md.replace("**Win:**", "**Windows:**")
md = md.replace("⬇ download starter-template.zip", "[Download starter-template.zip](https://course.similearnai.com/starter-template.zip)")
import datetime
md = md.replace("# Claude Code 101: Building Real Software with AI", "# Claude Code 101: Building Real Software with AI\n\n*A markdown copy of [course.similearnai.com](https://course.similearnai.com), exported " + datetime.date.today().strftime("%B %-d, %Y") + ". Quiz answers are marked (correct).*", 1)
md = re.sub(r"\n(## Chapter|## Part 2)", r"\n\n---\n\n\1", md)
OUT.write_text(md.strip() + "\n")
print(f"wrote {OUT} ({len(md.split())} words)")
