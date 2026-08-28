import type { Preview } from "@storybook/react-vite";
// Imported here rather than from globals.css: Tailwind's postcss plugin inlines an
// @import from node_modules without rebasing its relative url(), so the woff files
// are never emitted and 404 in a static build.
import "@fontsource/open-sans/latin-300.css";
import "@fontsource/open-sans/latin-400.css";
import "@fontsource/open-sans/latin-600.css";
import "../src/styles/globals.css";

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: "fullscreen",
  },
};

export default preview;
