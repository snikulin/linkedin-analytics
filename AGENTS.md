# AGENTS Configuration and Documentation

This document contains all information about the agents used in the `linkedin-analytics` repo, including how to run them and the conventions we follow for commit messages.

## Commit Convention
We adopt the **Conventional Commits** specification. Every commit message should follow the format:

```
<type>[optional scope]: <subject>
```

* **Type** – One of the following:
  * `feat` – a new feature
  * `fix` – a bug fix
  * `docs` – documentation changes
  * `style` – code formatting or stylistic changes (no functional impact)
  * `refactor` – refactoring code that does not add features or fix bugs
  * `perf` – performance improvements
  * `test` – adding or modifying tests
  * `chore` – tooling or build updates
* **Scope** – optional, denoting the part of the code the change affects.
* **Subject** – a short, imperative description.

Example:

```
feat(upload): add CSV file parsing support
```

Following this convention enables automated changelogs, semantic‑versioning, and smoother reviews.

## Using devenv (Recommended)

```
devenv shell
bun install
bun run dev
```

The rest of the repo documentation (build, deployment, etc.) is available in `README.md` and other dedicated docs.
