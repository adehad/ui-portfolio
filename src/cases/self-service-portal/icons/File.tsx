/** Repo glyph for the options in the Repo Name select. currentColor so it takes
    the select's themed text colour. */
export function FileIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6Z"
        fill="currentColor"
      />
      <path d="M13 2v6h6" fill="none" stroke="var(--ssp-header-bkg)" strokeWidth="1.5" />
    </svg>
  );
}
