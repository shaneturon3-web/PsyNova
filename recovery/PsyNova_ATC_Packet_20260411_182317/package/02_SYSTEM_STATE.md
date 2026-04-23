# CURRENT SYSTEM STATE

PROJECT
PsyNova Virtual Clinic

KNOWN RECOVERED CORE
- backend/src/main.ts exists
- docker-compose.yml exists
- ops/PORT_3000_POLICY.md exists
- ops/session_bootstrap.sh exists
- ops/lunch_autopilot.sh exists
- .cursorrules exists
- project README exists

KNOWN REALITY
- Backend health endpoint was previously confirmed healthy
- Runtime control is not yet deterministic
- Main blocker detected: port 3000 ownership conflict
- Risk: Docker and local runtime may be competing

CURRENT STAGE
Pre-Deployment, late-stage but not deployment-safe

KNOWN GAP CLUSTERS
- Port/runtime discipline
- Single authority for backend execution
- Production deployment path not yet finalized
- Full-stack validation incomplete
- Investor-safe status doc pending

TRUTH STANDARD
Healthy endpoint alone does not equal deployment readiness.
