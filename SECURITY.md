# Security Policy

## Overview

Vitumer is a **frontend-only** web app. There is no backend server, database, or server-side API in this repository.

- Session data and timer state are stored in the browser (`localStorage`).
- Optional AI features use **OpenRouter** with a user-provided API key (OAuth PKCE).
- API keys never go to a Vitumer server (there isn't one) — only to OpenRouter from the user's browser.

### How the OpenRouter key is stored

| Mode | At rest | When unlocked |
|------|---------|----------------|
| **Session only** | nothing persisted | plaintext in `sessionStorage` (this tab) |
| **Passkey vault** | AES-GCM ciphertext in `localStorage`, key from WebAuthn PRF | plaintext in `sessionStorage` until the tab closes |

Passkey vault protects against disk / `localStorage` dumps and casual inspection. It does **not** protect against XSS after unlock (scripts on this origin can read the session key).

## Reporting a Vulnerability

If you discover a security issue, please **open a private report** via [GitHub Security Advisories](https://github.com/jplucinski/vitumer/security/advisories/new). Do not open a public issue for sensitive findings.

Include:

- Description of the issue and potential impact
- Steps to reproduce
- Affected URLs or components (if applicable)

## Scope Notes

| In scope | Out of scope |
|----------|--------------|
| XSS, open redirects, insecure localStorage handling | OpenRouter API security (third-party) |
| OAuth callback / PKCE flow bugs | User's own API key exposure on shared devices |
| Passkey / WebAuthn PRF vault bugs | Issues requiring physical access to the device |
| PWA / service worker misconfiguration | |

## Best Practices for Users

- Treat your OpenRouter API key like a password — don't share it.
- Prefer **Lock with passkey** on a personal device; use **session only** on shared computers.
- Unlock only when you need AI features; close the tab when done on a shared machine.
- Review connected apps at [openrouter.ai](https://openrouter.ai) regularly.
