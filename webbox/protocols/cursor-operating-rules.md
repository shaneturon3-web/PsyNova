# Cursor Operating Rules (WebBox)

1. Never amend or rewrite baseline commits unless explicitly requested.
2. Verify branch and clean tree before starting each order.
3. Use order numbering and paired output/report artifacts for every execution.
4. Keep planning and control artifacts under `webbox/` only.
5. Do not delete, archive, or rename user files unless explicitly authorized.
6. Treat inventory work as read-only unless task explicitly requests writes.
7. Use `webbox/sandbox/` for temporary transforms and throwaway notes.
8. Do not sync or write to generic external templates unless explicitly configured.
9. Prefer deterministic scripts and logged outputs over manual copy/paste.
10. End every order with:
    - commit hash
    - artifact paths
    - open questions
    - recommended next order
