# Self-Service Portal

Rebuild of the Create Project page from the internal self-service portal. It requests a GitLab
group and repository, and optionally a Jenkins pipeline on top of them.

## The layout

Requesting User, Type and Destination share the top row, which `CreateFormShell` builds from a
Requesting User column, a Type column and an optional `extraTopColumn`. Every column is
`flex: 1 1 0; min-width: 0`, so a column can shrink and a multi-select that wraps its chips grows
downward instead of widening the row. The client, the group cascade, Repo Name and the route
preview each take a full-width row, which is what lets a long path read in one line. The members
row is three even columns.

## Destination and the cascade

`destination` is one enum, not a stack of booleans, because a repo lives in exactly one tree. Each
destination is a separate root, so switching it serves a different group list and clears the
client. Choosing CCSM asks for confirmation first.

`GroupCascade` renders one box per committed level plus a trailing empty one. Picking a folder or
typing a name spawns the next box; picking a deep search result on the first box fills the whole
ancestor chain at once by walking `parentId` links up to the client.

The cascade owns the visible level state and mirrors it into `cascadeLevels` on the form. The two
resync only when `GroupCascade` remounts, so anything that clears `CLIENT_ID` or `cascadeLevels`
has to change one of its remount keys, which are the destination, `CLIENT_ID` and `CLIENT_NAME`.

## The sparkle

`SparklePen` draws a masked field of drifting, twinkling four-point stars behind whatever it wraps,
marking a value that does not exist yet. Three things trigger it:

- a `CreateSelect` value the user typed rather than picked from the fetched options,
- a `GroupCascade` level whose `id` is `null`,
- a `RoutePreview` segment the Jenkins probe reports as absent.

Twenty stars on a form control, nine on an inline route segment. Each carries its own position,
orbit duration, phase, alpha, size, transform origin and twinkle timing. The star path comes from
`adehad/cv web/_static/contact.js`.

`filter: hue-rotate(calc(var(--ssp-spark-i, 0) * 47deg))` shifts each instance, so two sparkling
segments side by side read as separate marks. `transform-box: fill-box` on the star path pivots the
twinkle on the star rather than on the orbit origin the outer element rotates around. The host also
carries a `color-mix` glow in `--ssp-spark`, which anchors the stars to the control they belong to
when several pens stack.

`--ssp-spark` is gold in the light theme and cyan in the dark one.

Reduced motion drops both animations and keeps the glow. It is read in JavaScript through
`matchMedia` so the resulting class can be asserted, with the media query as a fallback.

### Two changes the source does not have

The source spawns the field from `Math.random()`. Here the randomness comes from a small seeded
generator keyed on `seedKey`, so a rebuild lays the same stars in the same places. Chromatic
compares pixels, and a field that respawned per build would diff on every run.

The overlay is absolutely positioned, but an absolutely positioned box still counts toward the
scrollable overflow of its ancestors, and the field is wider than the control it marks. `.ssp-root`
carries `overflow-x: clip`, which drops that contribution without becoming a scroll container, so a
select menu still opens past the bottom edge. `.ssp-root` also carries `isolation: isolate`: the
overlay sits at `z-index: -1`, and without a stacking context there it paints behind the page
background rather than behind the control. The context has to be on `.ssp-root` and not on the
overlay's own host, because a host that formed one would trap the select menu's z-index inside it
and let the next control's opaque background paint over the open menu.

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

`SparklePen.scss` is the one stylesheet that does not nest under `.ssp-root`. Its classes are all
prefixed, and the component has to work wherever it is mounted, including the isolated story.

## Namespace

`ssp-`, on everything, because neither system scopes anything:

- Class names: `ssp-root`, `ssp-post-form`, `ssp-form-control`, `ssp-row`, `ssp-col`,
  `ssp-destination-selector`, `ssp-group-cascade`, `ssp-route-preview`, `ssp-sparkle-host`,
  `ssp-particle-pen`, `ssp-user-select`.
- Theme classes: `ssp-light-theme`, `ssp-dark-theme`.
- Custom properties: `--ssp-bkg`, `--ssp-spark`, `--ssp-error-color`, and the per-star
  `--ssp-x`, `--ssp-duration`, `--ssp-twinkle-delay` and the rest. A custom property is global
  whichever selector declares it.
- localStorage keys: `ssp-dark-mode`, `ssp-userId`. The source uses `dark-mode` and `userId`; one
  origin serves every story here, so the keys are prefixed like everything else.

The source passes react-select `classNames` naming a `user-select` class and two `border-*` colour
utilities, none of which exist in its own stylesheets. Left alone, Tailwind would scan this case's
`.tsx` and mint a real red-border utility, putting a red border on a focused dropdown the source
never had. They are `ssp-user-select`, `ssp-user-select-focused` and `ssp-user-select-disabled`
here.

## Where the theme class goes

The app puts `light-theme` or `dark-theme` on `document.body` from an effect in `ThemeWrapper`.
Storybook's preview iframe has one body shared by every story, and the docs page mounts several
stories into it at once, so a body class would leak across cases and outlive the story that set it.
`ThemeWrapper` renders the class on its own `<div class="ssp-root">` instead, and the stylesheets
nest everything under `.ssp-root`. Nothing in this case can reach a sibling case's DOM.

`ThemeWrapper` also holds the only copy of the dark-mode state and publishes it through
`ThemeContext`. At the source ref this rebuild follows, `ThemePicker` reads the context but
`PostForm` still calls its own hook against the same key, so `PostForm`'s copy never updates and
the one react-select colour that reads `isDarkMode` rather than a custom property goes stale after
a toggle. Everything here reads the context, because a visibly broken toggle would read as our bug.

## react-select and the theme

`getSelectStyles` writes `var(--ssp-*)` into the inline style objects react-select generates, so a
theme change repaints the control, the menu and the chips with no re-render. `isDarkMode` is only
needed for the single-value hover colour, which the source picks in JavaScript.

## The form

TanStack Form, through a `createFormHook` factory that binds `UserSelect`, `CreateSelect` and
`BuildTypeCheckbox` as field components and a submit footer as a form component. Validation is one
`onChange` function over the whole value, which is what lets the client field's label follow the
destination.

`react-perf/jsx-no-new-object-as-prop` and its array and JSX siblings are fatal here, so every
option list, style object and slotted element is either memoised or a module constant. That is why
`getSelectStyles` is a module rather than an inline object, and why the help affordances are
module-level elements.

## Names, groups and hosts

Every person in the dropdowns comes from `@faker-js/faker` seeded with `20240922` in `users.ts`,
which fixes the roster at 24 people across rebuilds. `groups.ts` uses the same seed for the group
tree, its repos and the Jenkins folders. Chromatic compares pixels, so a roster or a tree that
regenerated would read as a design change. `users.test.ts` pins the first three names and asserts
every address ends `@example.invalid`; `groups.test.ts` pins the tree shape and the probe result.

The tree is 13 top-level groups across the three destinations, two or three levels deep, with repos
on every group below the top. `descendantsOf` carries the `parentId` links the cascade walks.

`probeJenkinsExists` stands in for the read-only existence probe. Every group that exists in GitLab
has a Jenkins folder, but only the first repo of each group has a job, so a complete route usually
still has one segment that will be created, and the one that does not is what makes the all-exists
submit guard reachable. A segment only counts as existing when every ancestor does, so the first
missing level marks itself and everything below it.

The root paths in `destinations.ts` are stand-ins. The source names a real internal GitLab group.

Nothing here reaches the network.

## The two stories

`GroupCascade` reports an empty resolution on mount, which writes four fields and so runs the form
validator before anything is touched. The required-field errors are therefore on screen from the
first paint.

`Default` drives past that with a `play` function: it ticks Jenkins, picks the client and the first
cascade level from the seeded tree, types a repo name the tree does not hold, and picks an owner.
That clears every error and leaves three sparkles up, on the repo control and on its GitLab and
Jenkins route segments. Chromatic snapshots once `play` resolves, so the captured frame is the
filled form rather than the empty one.

`Empty Form` has no such interaction, and is where the validation behaviour stays demonstrable.

The names the `play` function picks are fixtures from `groups.ts` and `users.ts`, both seeded, so
they are the same on every build.

## Trimmed from the source

- The network. `EndPoints`, axios and react-query are gone. The fetch hooks are plain functions
  over the seeded fixture, so there is no debounce on the Jenkins probe and no pending state on the
  route preview. Submit prints the request body it would have posted and resets the form.
- `AtlassianForm` and the Jira and Confluence path. The `before` branch has no equivalent, so it
  would land in the branch diff as pure addition. `CcsmCheckbox` goes with it: the redesign
  replaced it with the destination selector, and the Atlassian form was its only caller.
- `BuildingBanner`, which polls a build-status subsystem. A static banner shows the outcome.
- `FetchErrorBanner`, which reports a failed picker fetch. There is no fetch to fail.
- The router. `type` is a prop rather than `useLocation().state?.name`, and there is no build
  progress in the URL.

## Corrections the toolchain forced

- `UserSelect` and the cascade boxes associate their label through `htmlFor` and `inputId` rather
  than wrapping the control. `jsx-a11y/label-has-associated-control` cannot see the input
  react-select renders, and the label beside a help button has to point at the select rather than
  at the button.
- Render props are passed as JSX children, not as a `children` attribute, for
  `react/no-children-prop`.
- The blocked-submit message is an `<output>`, for `jsx-a11y/prefer-tag-over-role`.
- The CCSM notice sits in the flow rather than fixed to the top of the viewport, where it would
  cover Storybook's canvas rather than the app's own header.
