# ui-portfolio

Standalone rebuilds of UI work. Each piece of work gets a directory under `src/cases/` and a set of
Storybook stories. The stories keep the same titles on the `before` and `after` branches, so the two
builds can be diffed against each other.

## Branch model

- `config` holds tooling and shared setup only. No demo content.
- `before` is cut from `config` and holds the original design.
- `after` is cut from `before` and holds the reworked design.

Tooling changes go on `config` and are merged forward into `before`, then into `after`.

A demo exists at the same story title on both `before` and `after`, and renders differently on
each. The branch carries the design state, so the title must never say which state it is. Chromatic
diffs the two builds by walking git ancestry from `after` back to `before`, and it can only pair a
story with its counterpart when the story ID is identical on both sides. Renaming a story on one
branch alone breaks that pairing.

## Running

Bun is the package manager. Do not use npm, pnpm or yarn.

```sh
bun install
bun run dev              # Storybook on http://localhost:6006
bun run build-storybook  # static build into storybook-static/
bun run lint             # oxlint, warnings fail
bun run fmt              # oxfmt
bun run test             # vitest
bun run typecheck        # tsc
```

## Layout

```
src/
  cases/                 one directory per rebuilt piece of work
  components/shared/     components used by two or more cases
  styles/globals.css     Tailwind entry and the @theme tokens
.storybook/
```

Tailwind v4 is configured in CSS. Every theme token lives in the `@theme` block of
`src/styles/globals.css`. There is no `tailwind.config.js`.

## Story titles

Numeric prefix, page first, so cases sort above shared parts:

```
01 Case Study Viewer/Passcode Gate
01 Case Study Viewer/The Eye
02 Self-Service Portal/Create
03 Components/Video Player
```

Every one of those titles appears on both `before` and `after`, spelled the same way. Do not add a
Before or After segment. Do not group by atoms, molecules or organisms.
