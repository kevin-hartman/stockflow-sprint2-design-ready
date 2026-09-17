# navigator-review (navigator) – sonnet

## Prompt

```
REVIEW the implementation of story S2-stock-by-location-table now that ALL its tests are green, the whole story in one pass. Judge the story's diff against the context pack: layer boundaries, naming, cross-cutting concerns, the required NFRs, and (for UI) design-token + IA adherence. RUBRIC (pre-extracted; judge against THIS) :: layer=E2E | required NFRs, NFR-R1-migration-data-survival; NFR-R2-no-negative-no-overcommit | design-token groups, typography, colors, spacing, radius, shadows, breakpoints, app_icon, components. The rubric above is pre-extracted from <PROJECT_ROOT>/.consort/features/F1-stock-visibility/architecture.md, <PROJECT_ROOT>/.consort/nfrs.md, and <PROJECT_ROOT>/.consort/design/design-guide.md, open those full files ONLY if you need more detail than it carries (do not re-read them by default). LAYOUT (place/judge code at THESE paths, do not scan for them) :: boundary=app/routes (react) | service=app/services | repository=app/repositories | models=app/models. RUN/REACHABILITY :: python project – source under app/. To confirm the app boots or is reachable, run `uv run uvicorn app.main:app` and GET the health path over HTTP. Reachability is an HTTP response, never just an import succeeding. Write ONE verdict for the whole story to <PROJECT_ROOT>/.consort/cycles/F1-stock-visibility/S2-stock-by-location-table/review-verdict.json as {"refactor": <bool>, "notes": "<why>"}, refactor:true only if a concrete improvement is warranted; otherwise refactor:false. Do NOT change tests. Be terse: produce ONLY the required artifact file(s) on disk, then stop with at most a one-line confirmation. Do NOT print a plan, a summary of what you did, rationale, tables, or restate the artifacts to stdout, that output is wasted latency. The files on disk are the deliverable, not your prose.
```

## Tools used

- Bash {"command":"git diff main...HEAD --name-only 2>/dev/null | head -50","description":"List changed files in story branch"}
- Bash {"command":"./scripts/lk consort-layering-clean --architecture .consort/features/F1-stock-visibility/architecture.json 2>&1 | tail -20","description":"Run layering clean gate"}
- Bash {"command":"./scripts/lk consort-ux-clean --project-dir . 2>&1 | tail -20","description":"Run UX clean gate"}
- Bash {"command":"git diff main...HEAD -- client/src/ 2>/dev/null | grep \"^+++ \" | head -20","description":"List client files changed in S2"}
- Bash {"command":"git log main..HEAD --oneline 2>/dev/null | head -10","description":"Show commits in story branch"}
- Bash {"command":"cat client/src/pages/HomePage.tsx 2>/dev/null | head -80","description":"Read HomePage component"}
- Bash {"command":"cat client/src/App.tsx 2>/dev/null","description":"Read App.tsx"}
- Bash {"command":"grep -n \"db.commit\\|db.add\\|db.query\\|session.execute\" app/services/stock_service.py 2>/dev/null","description":"Check service ORM violations"}
- Bash {"command":"ls client/src/pages/ 2>/dev/null","description":"List pages"}
- Write {"file_path":"<PROJECT_ROOT>/.consort/cycles/F1-stock-visibility/S2-stock-by-location-table/review-verdict.json","content":"{ \"refactor\": true, \"notes\": \"consort-layering-clean FAILED: app/services/stock_service.py lines 35 and 56 call db.commit() directly — ORM commit must move into the repository layer (architecture.md §ORM-containment); only the repository may touch the session. Additionally, a duplicated 6-line block in app/routes/stock.py should be extracted to a shared helper (DRY). Move commit calls into stock_repository and delegate from the service; consolidate the duplicated route helper.\" }\n"}

## Final reasoning

Verdict written: `refactor: true`.
