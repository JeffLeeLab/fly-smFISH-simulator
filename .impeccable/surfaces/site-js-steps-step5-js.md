---
version: 1
slug: "site-js-steps-step5-js"
primary_target: "site/js/steps/step5.js"
related_targets: ["site/js/map.js","site/css/app.css"]
---

# Step 5: Target & probe design

Scope: the step 5 screen (#/<case>/step-5), every case. Visitor mode: Operate. A final-year group at a 1280×720 laptop picks two probe regions on a real FlyBase transcript map, may write predictions for that pair, and opens the results. Results stay one click away (predictions are optional); the map drawing is in scope; the "features" field is removed (from step 5 and the notebook drawer).

## Direction contract

THESIS: Step 5 is a workbench like steps 3, 4 and 6: the transcript map is the figure; the pair, Show results and predictions are notes beside it, read top to bottom. It refuses the stacked full-width page where instruction, slot row, map and predictions each float on their own.

OWN-WORLD: The Annotated Specimen (DESIGN.md): ivory ground, ivory-field sheets on hairlines, 3px corners, no shadows; sans for controls, mono for region IDs and lengths; green and magenta inks only for smFISH 1 and 2; clay only on Show results.

STORY: Read the gene card. Hover a region: its bracket and band preview the channel the click would fill. Click two; they land in the side-by-side slots. Show results now, or jot predictions for this pair first.

FIRST VIEWPORT: 1280×720. Gene card full width. Left ~700px: map header (title, isoforms, scale toggle), the map drawn at its real pixel width, legend box, then the help link. Right pane 292px under a hairline: "Your pair", one-line instruction, smFISH 1 and smFISH 2 side by side (dot, name, × on top; ID and length below; the next slot outlined in its ink), Swap, full-width Show results; Predictions start below and scroll in the pane.

FORM: Workbench notebook, #3 of 7 on the ranked list; seed key b3fd5741.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
