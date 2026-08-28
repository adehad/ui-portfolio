# Case Study Viewer

Rebuild of the shared passcode gate from the CDP case study viewer.

## Demo passcode

`1234`. Its SHA-256 hash is baked into `passcode.ts` so the story needs no environment setup. The
hashing path is the real one, not a string comparison.

## Token prefix

Tailwind v4 flattens every `@theme` block in the bundle into a single namespace, so tokens are not
scoped to a case. Every token in `tokens.css` carries a `cdp-` segment directly after its Tailwind
namespace, and every custom utility starts with `cdp-`:

    --color-cdp-grey          ->  bg-cdp-grey
    --shadow-cdp-neu-raised   ->  shadow-cdp-neu-raised
    --font-cdp-sans           ->  font-cdp-sans
    @utility cdp-root

A later case picks its own segment and the two sets sit side by side.

`tokens.css` is pulled in by `src/styles/globals.css`, which is the Tailwind entry point. The values
stay here so the branch diff shows the design language moving.

## Fonts

The design uses Open Sans, self-hosted through @fontsource at weights 300, 400 and 600. The faces are
served from the same origin, so builds stay offline and deterministic. Arial stays in the stack as a
fallback.

## Deviation from the source

The eye toggle ships as an inline `EyeIcon` component rather than an `<img>`. The source SVG hard
codes its fill, which an `<img>` cannot recolour, and the icon has to sit legibly on more than one
background.
