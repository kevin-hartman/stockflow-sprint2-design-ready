# navigator-reflect (navigator) – sonnet

## Prompt

```
REFLECT on story S3-sku-detail-view BEFORE the build lane: independently critique its spec slice (<PROJECT_ROOT>/.consort/features/F1-stock-visibility/stories/S3-sku-detail-view/story.json + acs/*.json) and its test-list (<PROJECT_ROOT>/.consort/features/F1-stock-visibility/stories/S3-sku-detail-view/test-list-per-story.json) against the architecture (<PROJECT_ROOT>/.consort/features/F1-stock-visibility/architecture.md/.json) + NFRs. RUBRIC (pre-extracted; judge against THIS) :: layer=E2E | required NFRs, NFR-R1-migration-data-survival; NFR-R2-no-negative-no-overcommit | design-token groups, typography, colors, spacing, radius, shadows, breakpoints, app_icon, components. Look ONLY for design-time defects that would waste a build cycle: (1) ACs that contradict each other; (2) an AC with no covering test, or a test that contradicts its AC; (3) an NFR with no fitness test; (4) a test asserting at a layer the architecture forbids; (5) an AC whose declared layer conflicts with the architecture; (6) an untestable/vacuous AC (no observable outcome); (7) a UI-styling test that asserts inline HTML style or raw CSS in the page SOURCE (e.g. a text-align/color/font check inside a style= attr) for a property the design-guide + design-adherence gate govern, instead of the rendered SEAM (the element carries the design-guide class / data-testid): such a test hard-codes the very inline style the design lane then refactors into a token-driven class, so it blocks that refactor (the ui-style-implementation-test smell). Do NOT critique implementation, style, or scope, only buildability + internal consistency of THIS story's artifacts. BE EXHAUSTIVE in this ONE pass: findings[] is multi-valued — run EVERY check against EVERY AC, test-list item, and NFR, and emit a SEPARATE finding for EACH distinct defect (decompose a LEGACY multi-part singular NFR fitness_function into its sub-guarantees and flag every uncovered clause — but an NFR that already declares the ATOMIC fitness_functions ARRAY is coverage-checked DETERMINISTICALLY by checkFitnessClauseCoverage at the test_list gate, so do NOT re-decompose it). Do NOT return one finding at a time: the reflect↔revise loop is bounded and escalates after a few laps, so a piecemeal reflect burns that budget on repeated revise→re-test→reflect laps and can hand the human a still-defective design. Write your verdict to <PROJECT_ROOT>/.consort/features/F1-stock-visibility/stories/S3-sku-detail-view/reflect-verdict.json as {"version":1,"passed":<bool>,"findings":[{"owner":"spec-author"|"test-strategist","detail":"<the defect>"}]}. passed:true with findings:[] when the spec + test-list are consistent + buildable (the common case, do NOT invent defects). Attribute each finding to spec-author (an AC/spec defect) or test-strategist (a test-list/coverage defect). Write ONLY that file; the orchestrator routes any fix deterministically. Be terse: produce ONLY the required artifact file(s) on disk, then stop with at most a one-line confirmation. Do NOT print a plan, a summary of what you did, rationale, tables, or restate the artifacts to stdout, that output is wasted latency. The files on disk are the deliverable, not your prose.
```

## Tools used

- Read {"file_path":"<PROJECT_ROOT>/.consort/features/F1-stock-visibility/stories/S3-sku-detail-view/story.json"}
- Read {"file_path":"<PROJECT_ROOT>/.consort/features/F1-stock-visibility/stories/S3-sku-detail-view/test-list-per-story.json"}
- Bash {"command":"ls <PROJECT_ROOT>/.consort/features/F1-stock-visibility/stories/S3-sku-detail-view/acs/","description":"List AC files for S3-sku-detail-view"}
- Read {"file_path":"<PROJECT_ROOT>/.consort/features/F1-stock-visibility/architecture.md"}
- Read {"file_path":"<PROJECT_ROOT>/.consort/features/F1-stock-visibility/stories/S3-sku-detail-view/acs/AC1-lists-stock-across-locations.json"}
- Read {"file_path":"<PROJECT_ROOT>/.consort/features/F1-stock-visibility/stories/S3-sku-detail-view/acs/AC2-shows-tracking-code.json"}
- Read {"file_path":"<PROJECT_ROOT>/.consort/features/F1-stock-visibility/stories/S3-sku-detail-view/acs/AC3-par-level-not-tracked.json"}
- Read {"file_path":"<PROJECT_ROOT>/.consort/features/F1-stock-visibility/stories/S3-sku-detail-view/acs/AC4-sku-with-no-stock-empty-state.json"}
- Read {"file_path":"<PROJECT_ROOT>/.consort/features/F1-stock-visibility/architecture.json"}
- Bash {"command":"ls <PROJECT_ROOT>/.consort/features/F1-stock-visibility/ && cat <PROJECT_ROOT>/.consort/features/F1-stock-visibility/nfrs.md 2>/dev/null || echo \"NOT FOUND\"","description":"List feature files and check for nfrs.md"}
- Bash {"command":"./scripts/lk consort-cross-story-context --feature F1-stock-visibility --story S3-sku-detail-view 2>&1 | head -100","description":"Run cross-story context check for S3"}
- Read {"file_path":"<PROJECT_ROOT>/.consort/features/F1-stock-visibility/test-list.json"}
- Bash {"command":"ls <PROJECT_ROOT>/.consort/features/F1-stock-visibility/stories/S3-sku-detail-view/","description":"Check existing files in S3 story directory"}
- Write {"file_path":"<PROJECT_ROOT>/.consort/features/F1-stock-visibility/stories/S3-sku-detail-view/reflect-verdict.json","content":"{\n  \"version\": 1,\n  \"passed\": true,\n  \"findings\": []\n}\n"}

## Final reasoning

Verdict written: `passed: true`, no findings.
