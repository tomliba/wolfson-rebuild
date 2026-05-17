# Bugs Fixed

| # | Test | APP or TEST bug | Problem | File | Fix |
|---|------|-----------------|---------|------|-----|
| 1 | login with correct password | TEST | browser.newContext() inherits storageState from config, so fresh context is pre-authenticated | tests/full-suite.spec.js | Added storageState:undefined to all newContext() calls for unauthenticated tests |
| 2 | login with wrong password | TEST | Same as #1 | tests/full-suite.spec.js | Same fix |
| 3 | direct access to / when logged out | TEST | Same as #1 | tests/full-suite.spec.js | Same fix |
| 4 | task completion toggle | TEST | lucide-react 0.475 renamed CheckCircle2 class from lucide-check-circle-2 to lucide-circle-check | tests/full-suite.spec.js | Updated selector to svg.lucide-circle-check |
