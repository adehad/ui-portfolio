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

## Building one case

The repo holds work for more than one client in a single deployable, so a link to the whole
Storybook shows every case to whoever opens it. `SHOWCASE` narrows a build to one case, which lets
a single build carry a single case:

```sh
SHOWCASE=case-study-viewer bun run build-storybook
```

The value is a directory name under `src/cases/`. A name that is not one fails the build and lists
the ones that are, rather than quietly emitting an empty Storybook. With no `SHOWCASE` set the
build carries everything.

The narrowing is by directory, so a story whose title sits outside its case's own group, such as
`03 Components/Sparkle Pen`, still ships with the case whose directory holds it.

### What a filtered build carries

`SHOWCASE=X` narrows both halves of the build:

- stories, to the ones under `src/cases/X/`
- static files, to the ones under `public/X/`, served at the URLs a full build serves them at

A case need not own a directory under `public/`. One that does not gets a build with no static
files at all, rather than a build falling back to the whole of `public/`.

Check a build rather than trusting it:

```sh
bun run check:showcase                    # every case, each into a throwaway build
bun run check:showcase case-study-viewer  # one case
```

The check builds with `SHOWCASE` set, walks every file the build emitted, and fails on any whose
path or bytes name another case. Pass `--dir` to scan a build you already have instead of making
one:

```sh
bun run check:showcase self-service-portal --dir storybook-static
```

What it does not cover:

- A client named inside a case rather than by a case directory name. The check matches directory
  names, so a client's name written into a story's own copy goes straight past it.
- Code two cases share, such as `src/components/shared/`. That ships in every build by design.
- The comparison page, which is deployed on its own and is in no Storybook build.
- Anything outside the build directory: git history, whatever else the host serves, and the story
  IDs in a link.

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

## Comparing the two builds

`tools/compare/index.html` loads one story ID into two iframes, one per deployment, and wipes
between them with a slider. Onion mode cross-fades instead. The picker covers every story that
exists on both branches, which is what identical story IDs across the two branches buys.

It belongs to neither Storybook, so it is a third artefact deployed beside the two, not a file
inside them. It sits outside `public/` because everything under `public/` is copied into every
build, which would put a page naming every case into a build meant to carry one. Deploy the
directory as its own static site:

```sh
bunx serve tools/compare
```

Any static host serves it; it is one file and needs no build step.

Neither deployment URL is baked in. The page carries a `CONFIG` block at the top of its script,
and both are overridable per link with `?before=` and `?after=`, or typed into the URLs panel on
the page. A URL that is not reachable is reported on the page rather than left as a blank frame.

`CONFIG.stories` names every case, and `SHOWCASE` does not narrow it. Narrowing the picker in the
browser would hide the names while still shipping them, which is the assurance without the
substance, so keep the deployment where only you can reach it. To walk one client through their
own before and after, deploy a copy whose `CONFIG.stories` holds only their stories.

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
