# Manual-led walkthrough

Scope: new user compares a province; returning user runs the example and exports evidence; edge-case user checks a small boundary and finds the limit explanation. Clean Playwright contexts at 1280×900 and 390×900, Thai and English, 100 ms network latency and 1.5 MB/s download, console and failed-request capture. Script: `npm run test:manual`. Local report: `test-results/manual-walkthrough.json`. Simulated personas, not recruited users.

## Findings

- First-time, finding the entry point (questions 1–3), severity 2, S: old guide led with system/methodology details. Added three named tasks, matching control labels, numbered actions, success checkpoints and a screen diagram.
- Returning, reaching help without losing work (question 2), severity 2, S: Guide hidden on phone and opened in the same tab. Guide is now visible and opens separately. Existing inputs stay in the original tab.
- Returning, loading the example (question 4), severity 2, S: on slow Wi-Fi the next step could precede completion. Added loading feedback and disabled Calculate during example loading. Guide names the boundary confirmation to wait for.
- Edge-case, understanding a dash (questions 1 and 4), severity 2, S: resolution, empty coverage and absent flux could be confused. Added a troubleshooting table with distinct actions and links to expandable file-format/method references.

All three scenarios completed in both languages and widths. No page errors or failed requests in the local walkthrough. Existing broader browser suite covers drawing, geometry validation, language state and preserved inputs. Patterns: lead with the user's task, match the visible controls, make completion observable, preserve work while reading help.
