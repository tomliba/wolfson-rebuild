# Auto-Recovery Instructions
After ANY auto-compact or context reset, do this IMMEDIATELY:
1. Read this file
2. Read wolfson_rebuild/TEST_TRACKER.md for current batch status
3. Read wolfson_rebuild/BUGS_FIXED.md for what's already been fixed
4. Find the next PENDING batch in TEST_TRACKER.md
5. Continue the protocol below from that batch

# Protocol
- cd wolfson_rebuild
- npm run build, then start server
- Run one batch at a time: npx playwright test -g "GROUP" 
  --reporter=json > tests/batchN.json 2>&1
- Read batchN.json for failures ONLY (ignore passes)
- For each failure: determine APP BUG or TEST BUG, fix, re-run 
  that one test to tests/single.json, verify, max 3 retries
- AFTER EACH BATCH: update TEST_TRACKER.md and BUGS_FIXED.md 
  BEFORE moving to the next batch. This is mandatory.
- ALL test output to files, NEVER inline
- Never use em dashes
- When all batches DONE: write FINAL_REPORT.md, clean test data
