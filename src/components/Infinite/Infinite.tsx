// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import {
  Button,
  OverlayButton,
  Spinner,
  SpinnerSize,
  Stack,
  StackProps,
} from "@deskpro/deskpro-ui";
import {
  faAngleDoubleDown,
  faAngleDoubleUp,
} from "@fortawesome/free-solid-svg-icons";
import type { Property } from "csstype";
import * as React from "react";
import {
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ResizeObserver from "react-resize-observer";
import { useTheme } from "styled-components";
import { match } from "ts-pattern";
import { useDebouncedCallback } from "use-debounce";
import { dpNameProp } from "../Dropdown/utility";
import { Observed } from "./styles";

/**
 * @public
 */
export type InfiniteScrollStatus =
  | "loading" // use when query is loading
  | "hasNextPage" //use when more pages available to fetch
  | "end" // use when no more pages to fetch
  | "end-with-force"; // same as end but adds a button that will fetch more to get any new items that have been added

const useInView = <T extends HTMLElement>() => {
  const [ref, setRef] = useState<T | null>(null);
  const [inView, setInView] = useState(false);
  const visibilityOptions: IntersectionObserverInit = useMemo(
    () => ({
      root: null,
      threshold: [0, 1],
    }),
    []
  );

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          setInView(entry.isIntersecting);
        }),
      visibilityOptions
    );
    observer.observe(ref);
    return () => {
      setInView(false);
      observer.disconnect();
    };
  }, [ref, visibilityOptions]);

  return useMemo(() => ({ ref: setRef, inView }), [inView]);
};

/**
 * @public
 */
export interface InfiniteProps {
  children?: ReactNode;
  /** Control this list direction. Effects scrolling, vertical alignment and the trigger position for fetching more items  */
  reverse?: boolean;
  /** Whether to render the Scroll To Start button */
  anchor?: boolean;
  onFetchMore?: () => void;
  onFetchMoreStart?: () => void;
  /** The status of the query that loads more items at the END of the page */
  status?: InfiniteScrollStatus;
  /** The status of the query that loads more items at the START of the page */
  startStatus?: InfiniteScrollStatus;

  maxHeight?: Property.MaxHeight;
  /** Used in <Dropdown /> to hide suboptions on scroll */
  scrollSideEffect?: (event: React.UIEvent<HTMLElement, UIEvent>) => void;
  width?: string;
  /** Align the list, you probably want flex-end if the list is reversed so it aligns to the bottom of the viewport */
  justify?: StackProps["justify"];
  fetchMoreText: ReactNode;
  autoscrollText: ReactNode;
  scrollRef?: RefObject<HTMLDivElement>;
  onResize?: () => void;
  onJumpToStart?: () => void;
  spinnerSize?: SpinnerSize;
}

// Controls the scroll when the data changes and for user wheel events
function useScrollControl(
  lastFetchDirection: null | "top" | "bottom",
  scrollRef?: RefObject<HTMLDivElement>,
  reverse?: boolean,
  anchor?: boolean,
  scrollSideEffect?: (event: React.UIEvent<HTMLElement, UIEvent>) => void,
  topStatus?: InfiniteScrollStatus
) {
  const firstMount = useRef(true);

  // Used to check if the scroll should be forced to the edges on data updates
  const shouldAttachScroll = useRef(true);
  const [isAttached, setIsAttached] = useState(true);
  const lastKnownScrollOffset = useRef<number>();

  // Forces the scrollbar to the top or bottom on first render
  useEffect(() => {
    if (scrollRef?.current && shouldAttachScroll.current) {
      if (reverse) {
        scrollRef.current.scrollTo({
          top:
            scrollRef.current.scrollHeight - scrollRef.current.clientHeight - 4,
        });
      } else {
        scrollRef?.current.scrollTo({ top: 4 });
      }
    }
  }, [reverse, scrollRef]);

  // this will update the scroll position when a fetch has been made while scrolling up
  // this is to stop the page jumping once a request has been made
  const setScrollTo = useCallback(() => {
    if (
      !shouldAttachScroll.current &&
      typeof lastKnownScrollOffset.current === "number" &&
      lastFetchDirection === "top" &&
      topStatus !== "end" &&
      topStatus !== "end-with-force"
    ) {
      // set position using saved offset
      scrollRef?.current?.scrollTo({
        top: Math.abs(
          lastKnownScrollOffset.current -
            (scrollRef?.current?.scrollHeight -
              scrollRef?.current?.clientHeight)
        ),
      });
    }
    // save current position offset
    if (scrollRef?.current) {
      lastKnownScrollOffset.current = Math.abs(
        scrollRef?.current.scrollTop -
          (scrollRef?.current.scrollHeight - scrollRef?.current.clientHeight)
      );
    }
  }, [lastFetchDirection, scrollRef, topStatus]);

  // On render will force the scroll bar to the top or bottom, unless detached
  useLayoutEffect(() => {
    if (firstMount.current || !anchor) {
      firstMount.current = false;
      return;
    }

    if (!scrollRef?.current) return;

    setScrollTo();
  });
  const debouncedSetIsAttached = useDebouncedCallback(
    () => {
      if (
        typeof lastKnownScrollOffset.current === "number" &&
        scrollRef?.current
      ) {
        if (
          shouldAttachScroll.current !== isAttached &&
          lastKnownScrollOffset.current > 300
        ) {
          setIsAttached(shouldAttachScroll.current);
        } else if (
          shouldAttachScroll.current !== isAttached &&
          lastKnownScrollOffset.current <= 10
        ) {
          setIsAttached(shouldAttachScroll.current);
        }
      }
    },
    100,
    { trailing: true, leading: true }
  );

  // On scroll events will attach or detach the scroll position from the top or bottom
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLElement, UIEvent>) => {
      if (
        scrollRef?.current &&
        !isAttached &&
        scrollRef.current.scrollTop + scrollRef.current.offsetHeight >
          scrollRef.current.scrollHeight - 2
      ) {
        setIsAttached(true);
      }
      if (!scrollRef?.current) {
        scrollSideEffect?.(event);
        return;
      }

      if (reverse) {
        if (
          scrollRef.current.scrollTop <
          scrollRef.current.scrollHeight - scrollRef.current.clientHeight
        ) {
          shouldAttachScroll.current = false;
        } else {
          shouldAttachScroll.current = true;
        }
      } else {
        if (scrollRef.current.scrollTop > 0) {
          shouldAttachScroll.current = false;
        } else {
          shouldAttachScroll.current = true;
        }
      }

      setScrollTo();
      scrollSideEffect?.(event);

      debouncedSetIsAttached();
    },
    [
      scrollRef,
      isAttached,
      reverse,
      setScrollTo,
      scrollSideEffect,
      debouncedSetIsAttached,
    ]
  );

  const reAttach = useCallback(() => {
    shouldAttachScroll.current = true;
    setIsAttached(true);

    if (scrollRef?.current) {
      if (reverse) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight });
      } else {
        scrollRef.current.scrollTo(0, 0);
      }
    }
  }, [scrollRef, reverse]);

  // if scrolled to top or bottom move  so not to trigger another fetch
  if (
    scrollRef?.current &&
    scrollRef.current.scrollTop >
      scrollRef.current.scrollHeight - scrollRef.current.clientHeight
  ) {
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight - scrollRef.current.clientHeight - 4,
    });
  } else if (
    scrollRef?.current &&
    scrollRef.current.scrollTop === 0 &&
    topStatus === "hasNextPage"
  ) {
    scrollRef?.current.scrollTo({ top: 4 });
  }

  return {
    ref: scrollRef,
    handleScroll,
    isAttached,
    reAttach,
  };
}

type EndOfScrollProps = {
  status?: InfiniteScrollStatus;
  fetchMoreText: React.ReactNode;
  fetchMore?: () => void;
  spinnerSize?: SpinnerSize;
};
const EndOfScroll = ({
  status,
  fetchMoreText,
  fetchMore,
  spinnerSize,
}: EndOfScrollProps) =>
  match({ status, hasFetchMore: !!fetchMore })
    .with({ hasFetchMore: false }, () => null)
    .with({ status: "loading" }, { status: "hasNextPage" }, () => (
      <Stack
        justify="center"
        align="center"
        padding={5}
        style={{ minHeight: 60, margin: "-1px 0" }}
      >
        <Spinner size={spinnerSize} />
      </Stack>
    ))
    .with({ status: "end-with-force", hasFetchMore: true }, () => (
      <Stack justify="center" align="center" padding={5}>
        <Button intent="tertiary" onClick={fetchMore} text={fetchMoreText} />
      </Stack>
    ))
    .otherwise(() => null);

/**
 * Will render a scrollbar container that uses an intersection observer to watch for when
 * the container has scrolled to the top or bottom.
 * @public
 */
export function Infinite({
  children,
  reverse = false,
  anchor = false,
  onFetchMore,
  onFetchMoreStart,
  status,
  startStatus,
  scrollSideEffect,
  width,
  fetchMoreText,
  autoscrollText,
  scrollRef,
  justify,
  onResize,
  onJumpToStart,
  spinnerSize,
}: InfiniteProps) {
  const dualDirection = !!onFetchMoreStart;
  const [lastFetchDirection, setLastFetchDirection] = useState<
    null | "top" | "bottom"
  >(null);
  const topFetch = useMemo(
    () => (reverse ? onFetchMore : onFetchMoreStart),
    [onFetchMore, onFetchMoreStart, reverse]
  );
  const bottomFetch = useMemo(
    () => (reverse ? onFetchMoreStart : onFetchMore),
    [onFetchMore, onFetchMoreStart, reverse]
  );
  const topStatus = useMemo(
    () => (reverse ? status : startStatus),
    [reverse, startStatus, status]
  );
  const bottomStatus = useMemo(
    () => (reverse ? startStatus : status),
    [reverse, startStatus, status]
  );
  const { isAttached, reAttach } = useScrollControl(
    lastFetchDirection,
    scrollRef,
    reverse,
    anchor,
    scrollSideEffect,
    topStatus
  );
  const { inView: topInView, ref: topRef } = useInView();
  const { inView: bottomInView, ref: bottomRef } = useInView();
  useEffect(() => {
    setLastFetchDirection("top");
    if (topInView && topStatus !== "loading") {
      if (topFetch && (!topStatus || topStatus !== "end")) {
        topFetch();
      }
    }
  }, [
    onFetchMore,
    onFetchMoreStart,
    reverse,
    startStatus,
    status,
    topFetch,
    topInView,
    topStatus,
  ]);

  useEffect(() => {
    setLastFetchDirection("bottom");
    if (bottomInView && bottomStatus !== "loading") {
      if (bottomFetch && (!bottomStatus || bottomStatus !== "end")) {
        bottomFetch();
      }
    }
  }, [
    bottomFetch,
    bottomInView,
    bottomStatus,
    onFetchMore,
    onFetchMoreStart,
    reverse,
    topStatus,
    status,
  ]);
  const { colors } = useTheme();

  return (
    <Stack
      {...dpNameProp("Infinite")}
      style={{
        position: "relative",
        overflow: "scroll",
        overflowX: "hidden",
        width,
      }}
      justify={justify}
      align="stretch"
      vertical
    >
      <ResizeObserver onResize={onResize} />
      <Observed ref={reverse || dualDirection ? topRef : undefined} />
      <EndOfScroll
        status={reverse ? status : startStatus}
        fetchMoreText={fetchMoreText}
        fetchMore={reverse ? onFetchMore : onFetchMoreStart}
        spinnerSize={spinnerSize}
      />
      {children}
      <EndOfScroll
        status={reverse ? startStatus : status}
        fetchMoreText={fetchMoreText}
        fetchMore={reverse ? onFetchMoreStart : onFetchMore}
        spinnerSize={spinnerSize}
      />
      <Observed ref={!reverse || dualDirection ? bottomRef : undefined} />
      {anchor && !isAttached && (
        <OverlayButton
          placement={reverse ? "middle-bottom" : "middle-top"}
          text={autoscrollText}
          onClick={() => {
            reAttach();
            onJumpToStart?.();
          }}
          icon={{
            icon: reverse ? faAngleDoubleDown : faAngleDoubleUp,
            size: 14,
          }}
          rightIcon={{
            icon: reverse ? faAngleDoubleDown : faAngleDoubleUp,
            size: 14,
          }}
          style={{ color: colors.brandShade100 }}
        />
      )}
    </Stack>
  );
}
