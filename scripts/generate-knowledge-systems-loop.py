import json
#!/usr/bin/env python3
"""Deterministic generator for the gh-54 knowledge-systems lifecycle figure.

Emits:
  public/images/editorial/knowledge-systems-loop.svg  (rendered figure, ~1280x760)
  public/downloads/knowledge-systems-loop.excalidraw  (genuine editable source)

Layout grammar: strong central governed-markdown layer; the query path flows
left -> center -> down -> left to answers; two distinct closing paths that make
governance durable return to extraction/the layer: a dashed scheduled-refresh
loop carrying changed sources and lapsed review dates, and a conflict branch
holding two disagreeing sources for human resolution. Short labels only.
"""

BASE = "https://excalidraw.com"
VIEW_BG = "#fbfaf5"
FRESH = 1798700000000


class El:
    _n = 0

    def __init__(self, kind, **kw):
        El._n += 1
        self.seed = 1000 + El._n * 137 % 80000
        self.kind = kind
        self.kw = kw

    def to_dict(self):
        e = {
            "type": self.kind,
            "x": self.kw.get("x", 0),
            "y": self.kw.get("y", 0),
            "width": self.kw.get("w", 0),
            "height": self.kw.get("h", 0),
            "angle": 0,
            "strokeColor": self.kw.get("stroke", "#172033"),
            "backgroundColor": self.kw.get("bg", "transparent"),
            "fillStyle": "solid",
            "strokeWidth": self.kw.get("sw", 2),
            "strokeStyle": self.kw.get("ss", "solid"),
            "roughness": 1,
            "opacity": 100,
            "groupIds": [],
            "frameId": None,
            "roundness": {"type": 3} if self.kind in ("rectangle", "diamond") else None,
            "seed": self.seed,
            "version": 1,
            "versionNonce": self.seed * 3 % 100000,
            "isDeleted": False,
            "boundElements": self.kw.get("bound", []),
            "updated": FRESH,
            "link": None,
            "locked": False,
        }
        if self.kind == "text":
            e.update(
                fontSize=self.kw.get("fs", 16),
                fontFamily=1,
                textAlign=self.kw.get("align", "left"),
                verticalAlign="top",
                containerId=None,
                originalText=self.kw["text"],
                autoResize=True,
                lineHeight=1.25,
                baseline=self.kw.get("fs", 16),
            )
        if self.kind == "arrow":
            e.update(
                points=self.kw["points"],
                lastCommittedPoint=None,
                startBinding=None,
                endBinding=None,
                startArrowhead=None,
                endArrowhead="arrow" if self.kw.get("end", True) else None,
                elbowed=False,
            )
            e.pop("roundness", None)
        return e


def box(x, y, w, h, bg, stroke, sw=3):
    return El("rectangle", x=x, y=y, w=w, h=h, bg=bg, stroke=stroke, sw=sw)


def text(x, y, s, fs=16, stroke="#172033", align="left"):
    return El("text", x=x, y=y, text=s, fs=fs, stroke=stroke, align=align)


def arrow(x, y, points, stroke="#172033", sw=3, ss="solid"):
    return El("arrow", x=x, y=y, points=points, stroke=stroke, sw=sw, ss=ss)


elements = [
    # Title
    text(56, 40, "The knowledge systems loop", 30),
    text(56, 86, "Two closing paths make it durable", 17, "#64748b"),

    # 1. Changed sources
    box(56, 150, 218, 92, "#fff4e0", "#b45309"),
    text(74, 172, "Changed sources", 18),
    text(74, 200, "files · email · decks", 14, "#475569"),
    text(74, 220, "review debt surfaces", 14, "#475569"),

    # 2. Extraction
    box(400, 150, 218, 92, "#e7f0ff", "#4f6fad"),
    text(418, 172, "Extraction", 18),
    text(418, 200, "entities · dates", 14, "#475569"),
    text(418, 220, "provenance attached", 14, "#475569"),

    # 3. Governed markdown layer — dominant central box
    box(744, 118, 320, 156, "#dcf5ea", "#0d7a55", sw=4),
    text(764, 142, "Governed markdown", 22),
    text(764, 174, "one version per fact", 14, "#475569"),
    text(764, 194, "named owner · review date", 14, "#475569"),
    text(764, 214, "the only queryable truth", 14, "#475569"),
    text(764, 236, "indexed by qmd", 14, "#475569"),

    # 4. Conflict branch — diamond, holds two disagreeing sources
    El("diamond", x=1044, y=372, w=200, h=104, bg="#fff1f2", stroke="#b91c1c", sw=3),
    text(1082, 404, "Conflict?", 18, "#b91c1c"),
    text(1100, 430, "two sources", 13, "#7f1d1d"),
    text(1100, 448, "human decides", 13, "#7f1d1d"),

    # 5. Answers out — traceable
    box(84, 560, 248, 96, "#e7f0ff", "#4f6fad"),
    text(102, 584, "Traceable answers", 18),
    text(102, 612, "file · date · provenance", 14, "#475569"),
    text(102, 632, "auditable after the fact", 14, "#475569"),

    # 6. Refresh loop label box (dashed) — the maintenance close
    box(560, 560, 240, 96, "transparent", "#6d28d9", sw=2),
    text(578, 584, "Scheduled refresh", 18, "#6d28d9"),
    text(578, 612, "weekly scan", 14, "#475569"),
    text(578, 632, "lapsed dates queue re-entry", 14, "#475569"),
]

edges = [
    # main query path: changed -> extraction -> layer -> (branch)
    arrow(276, 196, [[0, 0], [122, 0]]),
    arrow(620, 196, [[0, 0], [122, 0]]),
    arrow(1064, 196, [[0, 0], [130, 0]]),          # layer -> conflict diamond entry
    # answers out of the layer, down then left (no crossings: go around left side)
    arrow(886, 276, [[0, 0], [0, 300], [-554, 300], [-554, 0]], sw=3),   # from layer bottom down and left into answers top
    # conflict resolution returns to the layer (human decision closes the branch)
    arrow(1144, 478, [[0, 0], [-240, 180], [-520, 60]], stroke="#b91c1c", ss="dashed"),
    # scheduled refresh: changed sources -> back into extraction (maintenance close)
    arrow(270, 196, [[0, 0], [128, -0]], stroke="#6d28d9", ss="dashed"),
]

# extra maintenance arrow: refresh box -> extraction (dashed, purple)
edges.append(arrow(660, 558, [[0, 0], [-42, -316]], stroke="#6d28d9", ss="dashed"))
# conflict label arrow pointing back up
edges.append(arrow(1000, 300, [[0, 0], [100, 70]], stroke="#b91c1c", ss="dashed"))

elements += edges

# Render SVG
svg = []
svg.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 760" role="img" aria-labelledby="ksT ksD">')
svg.append('<title id="ksT">Knowledge systems lifecycle</title>')
svg.append('<desc id="ksD">Excalidraw-style lifecycle: changed sources flow through extraction into a dominant governed markdown layer; the layer branches into a conflict diamond that holds two disagreeing sources for human resolution, and a dashed scheduled-refresh loop returns lapsed review dates back into extraction; traceable answers flow out. Solid arrows are the query path; dashed purple is maintenance; dashed red is conflict resolution.</desc>')
svg.append('<defs><marker id="aS" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L9,3 L0,6 Z" fill="#172033"/></marker>'
           '<marker id="aP" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L9,3 L0,6 Z" fill="#6d28d9"/></marker>'
           '<marker id="aR" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L9,3 L0,6 Z" fill="#b91c1c"/></marker></defs>')
svg.append('<style>.bx{stroke-width:3;rx:12}.t1{font-family:Cascadia,Segoe UI,sans-serif;font-size:22px;font-weight:700;fill:#172033}'
           '.t2{font-family:Cascadia,Segoe UI,sans-serif;font-size:14px;fill:#475569}.t3{font-family:Cascadia,Segoe UI,sans-serif;font-size:13px;fill:#64748b}</style>')
svg.append(f'<rect width="1280" height="760" fill="{VIEW_BG}"/>')

def rr(x, y, w, h, bg, stroke, sw=3, dash=None, rx=12):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{bg}" stroke="{stroke}" stroke-width="{sw}"{d}/>'

def dt(x, y, cx, cy, w, h, bg, stroke, sw=3, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<polygon points="{cx},{y} {cx+w/2},{cy} {cx},{y+h} {cx-w/2},{cy}" '
            f'fill="{bg}" stroke="{stroke}" stroke-width="{sw}"{d}/>')

def tx(x, y, s, cls, extra=None):
    ex = f' {extra}' if extra else ''
    return f'<text x="{x}" y="{y}" class="{cls}"{ex}>{s}</text>'

def ln(pts, stroke="#172033", sw=3, dash=None, marker="aS"):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    path = "M " + " L ".join(f"{p[0]},{p[1]}" for p in pts)
    return f'<path d="{path}" fill="none" stroke="{stroke}" stroke-width="{sw}"{d} marker-end="url(#{marker})"/>'

# boxes
svg.append(rr(56, 150, 218, 92, "#fff4e0", "#b45309"))
svg.append(rr(400, 150, 218, 92, "#e7f0ff", "#4f6fad"))
svg.append(rr(744, 118, 320, 156, "#dcf5ea", "#0d7a55", sw=4))
svg.append(rr(84, 560, 248, 96, "#e7f0ff", "#4f6fad"))
svg.append(rr(560, 560, 240, 96, "transparent", "#6d28d9", sw=2, dash="7 5"))
svg.append(dt(1044, 372, 1144, 424, 200, 104, "#fff1f2", "#b91c1c"))

# text (short labels only)
svg += [
    tx(56, 40, "The knowledge systems loop", 't1', extra='style="font-size:30px"'),
    tx(56, 86, "Two closing paths make it durable", "t2"),
    tx(74, 178, "Changed sources", 't1', extra='style="font-size:18px"'),
    tx(74, 204, "files · email · decks", "t2"),
    tx(74, 224, "review debt surfaces", "t2"),
    tx(418, 178, "Extraction", 't1', extra='style="font-size:18px"'),
    tx(418, 204, "entities · dates", "t2"),
    tx(418, 224, "provenance attached", "t2"),
    tx(764, 148, "Governed markdown", 't1', extra='style="font-size:22px"'),
    tx(764, 178, "one version per fact", "t2"),
    tx(764, 198, "named owner · review date", "t2"),
    tx(764, 218, "the only queryable truth", "t2"),
    tx(764, 238, "indexed by qmd", "t2"),
    tx(1082, 412, "Conflict?", 't1', extra='style="font-size:18px;fill:#b91c1c"'),
    tx(1102, 436, "two sources", "t2"),
    tx(1102, 454, "human decides", "t2"),
    tx(102, 588, "Traceable answers", 't1', extra='style="font-size:18px"'),
    tx(102, 614, "file · date · provenance", "t2"),
    tx(102, 634, "auditable after the fact", "t2"),
    tx(578, 588, "Scheduled refresh", 't1', extra='style="font-size:18px;fill:#6d28d9"'),
    tx(578, 614, "weekly scan", "t2"),
    tx(578, 634, "lapsed dates queue re-entry", "t2"),
    tx(56, 730, "Evidence date: 31 Aug 2026 · rajeevg.com rig; business flows anonymised", "t3"),
    tx(56, 750, "Solid = query path · dashed purple = maintenance loop · dashed red = conflict resolution", "t3"),
]

# arrows (query path solid)
svg.append(ln([[276, 196], [398, 196]]))                                  # changed -> extraction
svg.append(ln([[620, 196], [742, 196]]))                                  # extraction -> layer
svg.append(ln([[1066, 196], [1096, 196], [1096, 240], [1144, 240], [1144, 372]]))  # layer -> conflict
svg.append(ln([[886, 276], [886, 610], [340, 610]], marker="aS"))          # layer -> answers
# maintenance loop: refresh box -> extraction (dashed purple, left leg avoids arrows)
svg.append(ln([[558, 596], [340, 596], [340, 290], [400, 244]], stroke="#6d28d9", dash="7 5", marker="aP"))
# conflict resolution back to layer (dashed red)
svg.append(ln([[1000, 430], [1064, 320]], stroke="#b91c1c", dash="6 5", marker="aR"))

svg.append("</svg>")

with open("public/images/editorial/knowledge-systems-loop.svg", "w") as f:
    f.write("\n".join(svg))

# Excalidraw source
doc = {
    "type": "excalidraw",
    "version": 2,
    "source": BASE,
    "appState": {"gridSize": None, "viewBackgroundColor": VIEW_BG},
    "files": {},
    "elements": [e.to_dict() for e in elements],
}
with open("public/downloads/knowledge-systems-loop.excalidraw", "w") as f:
    json.dump(doc, f, indent=1)

print("wrote svg and excalidraw")
