# SYSTEM CHECK PROTOCOL

MANDATORY BEFORE ANY CHANGE

1. Confirm current working directory
2. List top-level project structure
3. Inspect docker compose services
4. Check running containers
5. Inspect port 3000 ownership
6. Inspect local node/nest/python listeners
7. Curl backend health endpoint
8. Determine whether runtime authority is Docker or local
9. Report findings
10. Only then propose implementation commands

DECISION RULE
If both Docker and local are contenders for same port, stop and enforce single authority first.
