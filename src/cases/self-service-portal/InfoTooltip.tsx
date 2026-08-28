import { type ReactNode, useId, useMemo, useState } from "react";
import { InfoIcon } from "@/cases/self-service-portal/icons/Info";
import { Tooltip } from "@/cases/self-service-portal/Tooltip";

export type InfoTooltipProps = {
  /** Accessible name for the trigger button. */
  label: string;
  children: ReactNode;
};

/** A help affordance: a real button that reveals its children in the shared
    tooltip on hover, keyboard focus or click. */
export function InfoTooltip({ label, children }: InfoTooltipProps) {
  const contentId = useId();
  const [isOpen, setIsOpen] = useState(false);

  const content = useMemo(
    () => (
      <div id={contentId} role="tooltip" className="ssp-info-tooltip">
        {children}
      </div>
    ),
    [contentId, children],
  );

  return (
    <Tooltip toggleOnClick={true} onOpenChange={setIsOpen} content={content}>
      <button
        type="button"
        className="ssp-info-icon-btn"
        aria-label={label}
        aria-describedby={contentId}
        aria-expanded={isOpen}
      >
        <InfoIcon size={15} />
      </button>
    </Tooltip>
  );
}
