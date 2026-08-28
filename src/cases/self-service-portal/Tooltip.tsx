import {
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  /** Also open on keyboard focus, and latch open on a click. While latched the
      tooltip closes on an outside click or Escape, per the WAI-ARIA pattern. */
  toggleOnClick?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** How much clear space to leave between the tooltip and the viewport edge. */
const VIEWPORT_MARGIN = 8;

const CONTAINER_STYLE: CSSProperties = { position: "relative", display: "inline-block" };

export function Tooltip({ content, children, toggleOnClick, onOpenChange }: TooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isOpen = isHovered || isPinned || isFocused;
  const tooltipRef = useRef<HTMLDivElement>(null);
  /** Trigger plus popup, so an outside click can be told from a click on either. */
  const containerRef = useRef<HTMLDivElement>(null);
  /** Horizontal nudge on top of the centred base position. The base CSS only
      centres the box under its trigger, so a trigger near an edge would clip. */
  const [shiftX, setShiftX] = useState(0);

  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!isOpen || !el) {
      setShiftX(0);
      return;
    }

    const clamp = () => {
      const rect = el.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      setShiftX((prev) => {
        // Strip the current nudge to recover the centred baseline, then clamp
        // from that, so re-running cannot oscillate.
        const baseLeft = rect.left - prev;
        const baseRight = rect.right - prev;
        if (baseLeft < VIEWPORT_MARGIN) return VIEWPORT_MARGIN - baseLeft;
        if (baseRight > viewportWidth - VIEWPORT_MARGIN) {
          return viewportWidth - VIEWPORT_MARGIN - baseRight;
        }
        return 0;
      });
    };

    clamp();
    const observer = new ResizeObserver(clamp);
    observer.observe(el);
    window.addEventListener("resize", clamp);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", clamp);
    };
  }, [isOpen]);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (!isPinned) return;
    // mousedown rather than click, so it lands before the trigger's own handler.
    const onPointerDown = (event: globalThis.MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsPinned(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPinned(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isPinned]);

  const popupStyle = useMemo(
    () => ({ transform: `translateX(calc(-50% + ${shiftX}px))` }),
    [shiftX],
  );

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (toggleOnClick) setIsPinned((pinned) => !pinned);
    event.stopPropagation();
  };

  return (
    <div
      ref={containerRef}
      // The interactive element is the trigger this wraps. The wrapper only
      // catches the hover and the click that pins the tooltip open.
      role="presentation"
      style={CONTAINER_STYLE}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onFocus={toggleOnClick ? () => setIsFocused(true) : undefined}
      onBlur={toggleOnClick ? () => setIsFocused(false) : undefined}
    >
      {children}
      {isOpen ? (
        <div
          ref={tooltipRef}
          className="ssp-tooltip-wrapper"
          role="presentation"
          style={popupStyle}
          // A click inside the body must not reach the trigger's toggle, or the
          // tooltip would close while it is being read.
          onClick={(event) => event.stopPropagation()}
        >
          {content}
        </div>
      ) : null}
    </div>
  );
}
