# Sprint 4 Fix Checklist

  ## Blocker Fixes

  - Implement backend POST /api/generate-certificate.
  - Return a real PDF response from backend, not frontend-only jsPDF generation.
  - Ensure certificate includes:
      - active domain
      - selected model
      - 6 metrics
      - bias findings
      - checklist status
  - Validate certificate for at least 3 different domains.
  - Measure and keep certificate generation time under 10s.

  ## Bias Logic

  - Update fairness threshold logic in backend/ml/main.py.
  - Sprint rule must be:
      - hidden at <= 10 pp
      - visible at > 10 pp
  - Remove conflicting > 15 pp / > 8 pp behavior if it changes Sprint 4 acceptance behavior.
  - Add an exact edge-case test for:
      - 10 pp gap
      - 11 pp gap

  ## Step 6 Explainability

  - Change caution banner color from red to amber.
  - Keep the what-if/info banner blue.
  - Replace generic clinical sense-check text logic with explicit domain-specific mappings.
  - Add domain-specific clinical sense-check content for all 20 domains.
  - Make sure feature labels shown to users are clinical display names, not raw database names.
  - Re-check that no snake_case or raw column names appear in Step 6 UI.

  ## Patient Selector + Waterfall

  - Keep exactly 3 test patients visible in selector.
  - Confirm waterfall bars use:
      - red for risk
      - green for safe
  - Ensure labels are plain-language clinical labels.

  ## Step 7 Ethics & Bias

  - Add visible checklist completion progress.
  - Show a clear progress indicator such as:
      - 2 of 8 completed
      - or a progress bar
  - Keep exactly 8 checklist items.
  - Keep exactly 2 items pre-checked on load.
  - Confirm all checklist items toggle correctly.

  ## Training Representation

  - Make training vs. real population warning threshold-driven.
  - Show amber warning only when any group gap is > 15 pp.
  - Do not show a permanent static warning.
  - Use measurable group comparison logic in code.

  ## Failure Case Studies

  - Keep 3 cards only:
      - 1 red failure
      - 1 amber near-miss
      - 1 green prevention
  - Change the current blue prevention card to green.

  ## Domain Coverage

  - Verify Steps 6 and 7 update correctly across all 20 domains.
  - Test at least multiple representative domains manually before final demo.
  - Add a domain mapping table/source so this behavior is explicit and maintainable.

  ## QA / Evidence

  - Keep the new acceptance suite:
      - /tmp/HealthML-ai_implementation/tests/e2e/sprint4_acceptance.spec.ts:1
  - Re-run QA after fixes.
  - Save screenshots/logs from failed and passed cases.
  - Attach evidence to final Sprint 4 report.
  - Update Word report after rerun:
      - /tmp/HealthML-ai_implementation/SPRINT4_QA_REVIEW.docx:1

  ## Final Re-test Gate

  Sprint 4 should not be presented as complete until these are all true:

  - full Steps 1–7 flow passes
  - certificate endpoint works
  - bias threshold matches >10 pp
  - checklist progress is visible
  - representation warning is threshold-driven
  - prevention card is green
  - Step 6 sense-check is explicit for all 20 domains

