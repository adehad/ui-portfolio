# Self-Service Portal

Rebuild of the Create Project page from the internal self-service portal. It requests a GitLab
subgroup and repository, and optionally a Jenkins pipeline on top of them.

## Styling: SCSS, not Tailwind

The source app is SCSS with CSS custom properties, so this case is too. Porting the stylesheets
across keeps the values the source actually shipped instead of the nearest Tailwind equivalent.
Vite compiles `.scss` once `sass` is installed, which it is; there is no plugin and no Vite config
entry for it.

The two systems share one Storybook and do not collide:

- Tailwind's `@source "../"` scan skips `.scss` entirely. Only `.tsx`, `.ts` and the like are read
  for class candidates, so nothing in these stylesheets can conjure a Tailwind utility.
- `.oxlintrc.json` tells `better-tailwindcss/no-unknown-classes` to ignore `^ssp-`. Every class in
  this case is a real SCSS class the linter has no way to resolve from the Tailwind entry point.

## Namespace

`ssp-`, on everything, because neither system scopes anything:

- Class names: `ssp-root`, `ssp-post-form`, `ssp-form-control`, `ssp-row`, `ssp-col`,
  `ssp-form-buttons`, `ssp-readable`, `ssp-theme-icon`, `ssp-user-select`.
- Theme classes: `ssp-light-theme`, `ssp-dark-theme`.
- Custom properties: `--ssp-bkg`, `--ssp-font-color`, `--ssp-header-bkg` and the rest. A custom
  property is global whichever selector declares it.
- localStorage keys: `ssp-dark-mode`, `ssp-userId`. The source uses `dark-mode` and `userId`; one
  origin serves every story here, so the keys are prefixed like everything else.

The source passes react-select `classNames` of `user-select border-red-600` and
`border-grey-300`, which match nothing in its own stylesheets. Left as they were, Tailwind would
scan this case's `.tsx` and mint a real `.border-red-600`, putting a red border on a focused
dropdown that the source never had. They are `ssp-user-select`, `ssp-user-select-focused` and
`ssp-user-select-disabled` here.

## Where the theme class goes

The app puts `light-theme` or `dark-theme` on `document.body` from an effect in `ThemeWrapper`.
Storybook's preview iframe has one body shared by every story, and the docs page mounts several
stories into it at once, so a body class would leak across cases and outlive the story that set it.
`ThemeWrapper` renders the class on its own `<div class="ssp-root">` instead, and the stylesheets
nest everything under `.ssp-root`. Nothing in this case can reach a sibling case's DOM.

`ThemeWrapper` also holds the only copy of the dark-mode state and publishes it through
`ThemeContext`. In the source, `ThemeWrapper`, `ThemePicker` and `PostForm` each call their own
hook against the same key, so `PostForm`'s copy never updates and the one react-select colour that
reads `isDarkMode` rather than a custom property goes stale after a toggle.

## react-select and the theme

`getSelectStyles` writes `var(--ssp-*)` into the inline style objects react-select generates, so a
theme change repaints the control, the menu and the chips with no re-render. `isDarkMode` is only
needed for the single-value hover colour, which the source picks in JavaScript.

## Names and hosts

Every person in the dropdowns comes from `@faker-js/faker` seeded with `20240922` in `users.ts`,
which fixes the roster at 24 people across rebuilds. Chromatic compares pixels, so a roster that
regenerated would read as a design change. `users.test.ts` pins the first three names and asserts
every address ends `@example.invalid`.

## Trimmed from the source

- The network. `EndPoints`, axios and react-query are gone. Submit prints the request body it would
  have posted and resets the form.
- `BuildingBanner`, which polls a build-status subsystem. A static banner shows the outcome.
- The router. `type` is a prop rather than `useLocation().state?.name`.
- A commented-out `IS_CCSM` checkbox. It renders nothing, and commented-out code is not carried
  here.
