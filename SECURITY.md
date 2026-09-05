# Security Policy

## Supported Versions

The latest `master` branch and the most recent tagged release receive security updates.

| Version  | Supported          |
| -------- | ------------------ |
| latest   | :white_check_mark: |
| < latest | :x:                |

## Reporting a Vulnerability

**Do not report vulnerabilities via public GitHub issues.**

Open a private advisory at
<https://github.com/NJUPT-SAST/sast-approval-next/security/advisories/new>.

If advisories are unavailable to you, reach the maintainers through the
[NJUPT-SAST](https://github.com/NJUPT-SAST) organisation and prefix the subject with `[security]`.

Include:

- A description of the vulnerability and its impact
- Steps to reproduce
- Affected versions / commit SHA

We aim to acknowledge reports within 7 days and to disclose or patch within 90 days. Critical issues may be fast-tracked.

## Scope notes

This is a browser and desktop client. It holds no server-side secrets.

- Every environment variable is `NEXT_PUBLIC_*` and therefore visible to anyone who opens the app. Nothing secret belongs in `.env.local`.
- The session token lives in `localStorage` under `approval-system-token`, matching the legacy `approval-system` for compatibility.
- The desktop build runs under the CSP in `src-tauri/tauri.conf.json`, whose `connect-src` allow-lists only `self`, the Tauri IPC origins, and `https://approve.sast.fun`.
- Backend and authentication issues belong to the API service, not this repository. Report those to the SAST backend maintainers.
