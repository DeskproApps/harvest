import * as React from "react";
import { useRef, useLayoutEffect } from "react";
import * as S from "./styles";
import { dpNameProp } from "../../utils/dpName";

interface ObservedProps {
  /** Handler for when the component intersects with the viewport */
  onIntersect: () => void;
}

/**
 * Component that positions absolutely to the top or bottom of the container
 * and emits an event if it intersects with the view port using `IntersectionObserver`
 */
export function ObservedDiv({ onIntersect }: ObservedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const callback = useRef(onIntersect);

  useLayoutEffect(() => {
    callback.current = onIntersect;
  }, [onIntersect]);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        callback.current();
      }
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return <S.Observed {...dpNameProp("ObservedDiv")} data-testid="observer" ref={ref} />;
}
