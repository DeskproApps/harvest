import * as React from "react";
import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Stack } from "../../layout";

import { ObservedDiv } from "./ObservedDiv";
import { Spinner } from "../Spinner";
import { OverlayButton } from "../Button";
import { match } from "ts-pattern";
import { Scrollbar } from "../Scrollbar";
import type { Property } from "csstype";
import { faAngleDoubleDown } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "styled-components";
import { dpNameProp } from "../../utils/dpName";

/**
 * @public
 */
export interface InfiniteTopBottomProps {
  children?: ReactNode;
  /** default false */
  reverse?: boolean;
  /** default false */
  anchor?: boolean;
  onFetchMoreTop?: () => void;
  onFetchMoreBottom?: () => void;
  topStatus?: "loading" | "hasPreviousPage" | "start";
  bottomStatus?: "loading" | "hasNextPage" | "end" | "end-with-force";

  maxHeight?: Property.MaxHeight;
  /** Used in <Dropdown /> to hide suboptions on scroll */
  onReAttach?: () => void;
  newElements?: boolean;
  newElementsText: ReactNode;
  autoscrollText: ReactNode;
  scrollSideEffect?: () => void;
  width?: string;
}

// Controls the scroll when the data changes and for user wheel events
function useScrollControl(
  children: ReactNode,
  reverse?: boolean,
  anchor?: boolean,
  scrollSideEffect?: () => void
) {
  const ref = useRef<HTMLDivElement>(null);
  const firstMount = useRef(true);

  // Used to check if the scroll should be forced to the edges on data updates
  const shouldAttachScroll = useRef(true);
  const [isAttached, setIsAttached] = useState(true);
  const lastKnownScrollOffset = useRef<number>();

  // Forces the scrollbar to the top or bottom on first render
  useEffect(() => {
    if (ref.current && shouldAttachScroll.current) {
      if (reverse) {
        ref.current.scrollTo({ top: ref.current.scrollHeight });
      } else {
        ref.current.scrollTo(0, 0);
      }
    }
  }, [reverse]);

  // On render will force the scroll bar to the top or bottom, unless detached
  useLayoutEffect(() => {
    if (firstMount.current || !anchor) {
      firstMount.current = false;
      return;
    }

    if (!ref.current) return;

    if (shouldAttachScroll.current) {
      if (reverse) {
        ref.current.scrollTo({ top: ref.current.scrollHeight });
      } else {
        ref.current.scrollTo({ top: 0 });
      }
    } else if (typeof lastKnownScrollOffset.current === "number" && reverse) {
      ref.current.scrollTo({
        top: Math.abs(
          lastKnownScrollOffset.current - (ref.current.scrollHeight - ref.current.clientHeight)
        ),
      });
    }
  });
  const debouncedSetIsAttached = useDebouncedCallback(
    () => {
      if (typeof lastKnownScrollOffset.current === "number" && ref.current) {
        if (shouldAttachScroll.current !== isAttached && lastKnownScrollOffset.current > 300) {
          setIsAttached(shouldAttachScroll.current);
        }
      }
    },
    100,
    { trailing: true, leading: true }
  );

  // On scroll events will attach or detach the scroll position from the top or bottom
  const handleScroll = useCallback(() => {
    if (!ref.current) return;

    if (reverse) {
      if (ref.current.scrollTop < ref.current.scrollHeight - ref.current.clientHeight) {
        shouldAttachScroll.current = false;
      } else {
        shouldAttachScroll.current = true;
      }
    } else {
      if (ref.current.scrollTop > 0) {
        shouldAttachScroll.current = false;
      } else {
        shouldAttachScroll.current = true;
      }
    }

    scrollSideEffect?.();

    lastKnownScrollOffset.current = Math.abs(
      ref.current.scrollTop - (ref.current.scrollHeight - ref.current.clientHeight)
    );

    debouncedSetIsAttached();
  }, [debouncedSetIsAttached, reverse, scrollSideEffect]);

  const reAttach = useCallback(() => {
    shouldAttachScroll.current = true;
    setIsAttached(true);

    if (ref.current) {
      if (reverse) {
        ref.current.scrollTo({ top: ref.current.scrollHeight });
      } else {
        ref.current.scrollTo(0, 0);
      }
    }
  }, [reverse]);

  return {
    ref: ref,
    onScroll: handleScroll,
    isAttached,
    reAttach,
  };
}

/**
 * Will render a scrollbar container that uses an intersection observer to watch for when
 * the container has scrolled to the top or bottom.
 * @public
 */
export function InfiniteTopBottom({
  children,
  reverse = false,
  anchor = false,
  onFetchMoreTop,
  onFetchMoreBottom,
  topStatus,
  bottomStatus,
  maxHeight = "100%",
  scrollSideEffect,
  onReAttach,
  newElements,
  newElementsText,
  autoscrollText,
  width,
}: InfiniteTopBottomProps) {
  const { ref, isAttached, onScroll, reAttach } = useScrollControl(
    children,
    reverse,
    anchor,
    scrollSideEffect
  );

  const handleReAttach = useCallback(() => {
    if (onReAttach) {
      onReAttach();
    }
    reAttach();
  }, [onReAttach, reAttach]);

  const handleIntersectTop = useCallback(() => {
    if (onFetchMoreTop && (!topStatus || topStatus !== "start")) {
      onFetchMoreTop();
    }
  }, [onFetchMoreTop, topStatus]);
  const handleIntersectBottom = useCallback(() => {
    if (onFetchMoreBottom && (!bottomStatus || bottomStatus !== "end")) {
      onFetchMoreBottom();
    }
  }, [onFetchMoreBottom, bottomStatus]);
  const theme = useTheme().colors;

  return (
    <Stack
      {...dpNameProp("InfiniteTopBottom")}
      maxHeight="100%"
      style={{
        position: "relative",
        overflow: "hidden",
        height: "100%",
        width,
      }}
      align="stretch"
      vertical
    >
      <Scrollbar
        autoHide
        style={{ maxHeight: maxHeight }}
        scrollableNodeProps={{ ref: ref, onScroll: onScroll }}
      >
        {topStatus && (
          <Stack justify="center" align="center" padding={5}>
            {match(topStatus)
              .with("loading", (): ReactNode => <Spinner />)
              .with("hasPreviousPage", (): ReactNode => <Spinner />)
              .with("start", () => null)
              .exhaustive()}
          </Stack>
        )}
        {<ObservedDiv onIntersect={handleIntersectTop} />}
        {children}
        {<ObservedDiv onIntersect={handleIntersectBottom} />}
        {(bottomStatus === "loading" || bottomStatus === "hasNextPage") && (
          <Stack justify="center" align="center" padding={5}>
            <Spinner />
          </Stack>
        )}
      </Scrollbar>
      {anchor && !isAttached && (
        <OverlayButton
          placement={reverse ? "middle-bottom" : "middle-top"}
          text={newElements ? newElementsText : autoscrollText}
          onClick={handleReAttach}
          icon={{ icon: faAngleDoubleDown, size: 14 }}
          rightIcon={{ icon: faAngleDoubleDown, size: 14 }}
          style={{ color: theme.brandShade100 }}
        />
      )}
    </Stack>
  );
}
