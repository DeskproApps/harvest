// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import * as React from "react";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import type {
  HTMLAttributes,
  ReactNode,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { usePopper } from "react-popper";
import * as S from "./styles";
import type {
  DropdownItemMeta,
  DropdownItemType,
  DropdownProps,
  DropdownTargetProps,
  DropdownValueType,
} from "./types";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import { dpNameProp, mergeRefs, notEmpty } from "./utility";
import styled from "styled-components";
import ChevronRightIcon from "@heroicons/react/outline/ChevronRightIcon";
import {
  AnyIcon,
  Icon,
  IconButton,
  Input,
  Layers,
  Portal,
  Spinner,
  Stack,
  TabBar,
  ThemeColorKey,
  isAnyIcon,
  isIconProps,
} from "@deskpro/deskpro-ui";
import { throttle } from "lodash";
import { Infinite } from "../Infinite/Infinite";

/**
 * @public
 */
export const DropdownTrigger = styled.div`
  cursor: pointer;
  user-select: none;
`;

/**
 * @public
 */
export type DropdownRenderOptionsProps<T = string> = {
  handleSelectOption: (value: DropdownValueType<T>) => void;
  activeItem: DropdownValueType<T> | null;
  activeSubItem: string | null;
  setActiveSubItem: (item: string | null) => void;
  fetchMoreText: ReactNode;
  autoscrollText: ReactNode;
  selectedIcon: AnyIcon;
  externalLinkIcon: AnyIcon;
  hasSelectedItems: boolean;
  hasExpandableItems: boolean;
  hideIcons?: boolean;
  iconColumnWidth?: number;
  openChildrenOnMouseOver?: boolean;
  layer?: keyof Layers;
  setActiveValueIndex: (value: number | "createNew") => void;
  valueOptions: DropdownValueType<T>[];
  openSubmenuOnButtonHover?: boolean;
};
/**
 * @public
 */
export function dropdownRenderOptions<T = string>({
  handleSelectOption,
  activeItem,
  activeSubItem,
  setActiveSubItem,
  fetchMoreText,
  autoscrollText,
  selectedIcon,
  externalLinkIcon,
  hasSelectedItems,
  hasExpandableItems,
  hideIcons,
  iconColumnWidth,
  openChildrenOnMouseOver,
  layer,
  setActiveValueIndex,
  valueOptions,
  openSubmenuOnButtonHover,
}: DropdownRenderOptionsProps<T>): (
  value: DropdownItemType<T>,
  index: number,
  array: DropdownItemType<T>[]
) => JSX.Element | null {
  return (opt, index) => {
    switch (opt.type) {
      case "value":
        return (
          <DropdownItem<T>
            active={activeItem?.key === opt.key}
            onSelect={handleSelectOption}
            onSelectIcon={opt.onClickIcon}
            onClickSubItem={opt.onClickSubItem}
            key={opt.key}
            value={opt}
            meta={{ active: false, input: "" }}
            activeSubItem={activeSubItem}
            setActiveSubItem={setActiveSubItem}
            hideIcons={hideIcons}
            iconColumnWidth={iconColumnWidth}
            fetchMoreText={fetchMoreText}
            autoscrollText={autoscrollText}
            selectedIcon={selectedIcon}
            externalLinkIcon={externalLinkIcon}
            openChildrenOnMouseOver={openChildrenOnMouseOver}
            hasSelectedItems={hasSelectedItems}
            hasExpandableItems={hasExpandableItems}
            setActiveValueIndex={setActiveValueIndex}
            valueOptions={valueOptions}
            layer={layer}
            openSubmenuOnButtonHover={openSubmenuOnButtonHover}
          />
        );
      case "header":
        return (
          <S.DropdownHeaderItem key={`header${index}`}>
            {opt.label}
          </S.DropdownHeaderItem>
        );
      case "divider":
        return <S.DropdownDividerItem key={`divider${index}`} />;
      default:
        return null;
    }
  };
}

function getNextItem<T>(
  options: DropdownValueType<T>[],
  currentIndex: "createNew" | number | undefined,
  direction: "up" | "down",
  hasCreateNewOption: boolean
): number | "createNew" {
  if (currentIndex === undefined) {
    return 0;
  }

  if (options.length === 0) {
    if (hasCreateNewOption) {
      return "createNew";
    }
    return 0;
  }

  const maxIndex = options.length - 1;

  if (currentIndex === "createNew") {
    switch (direction) {
      case "down":
        return 0;
      case "up":
        return maxIndex;
    }
  }

  switch (direction) {
    case "down":
      if (currentIndex >= maxIndex) {
        if (hasCreateNewOption) {
          return "createNew";
        }

        return 0;
      }
      return currentIndex + 1;
    case "up":
      if (currentIndex === 0) {
        if (hasCreateNewOption) {
          return "createNew";
        }
        return maxIndex;
      }

      return currentIndex - 1;

    default:
      return 0;
  }
}

function getItemByKey<T>(
  options: DropdownValueType<T>[],
  key: string
): number | "createNew" {
  const index = options.findIndex((option) => option.key === key);
  return index === -1 ? "createNew" : index;
}

const minimumDropdownWidth = 236;

/**
 * Wraps around any child to upgrade it to a dropdown component. If used in the
 * render props style you get access to some of the internal state of the dropdown
 * including the input props used for search
 * @public
 * @example
 * ```
 * const options = [
 *  {type: "header", label: "Header"},
 *  {type: "value", key: "1", label: "Value"}
 * ];
 *
 * function handleOnSelect(value: DropdownValueType) {}
 *
 * // as children
 * <Dropdown options={options} onSelectOption={handleOnSelect}>
 *  <button>click here</button>
 * </Dropdown>
 *
 * // as render props with controlled input
 * <Dropdown options={options} onSelectOption={handleOnSelect}>
 *  {({searchInputProps}) =>
 *    <input {...searchInputProps}/>
 *  }
 * </Dropdown>
 * ```
 */
export function Dropdown<
  T,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TargetRef extends HTMLElement = any
>({
  children,
  options,
  stickyHeaderOptions,
  stickyFooterOptions,

  inputValue,
  searchPlaceholder,
  placement = "bottom-start",
  showInternalSearch = false,
  isLoading = false,
  usePortal = true,
  closeOnSelect = true,
  isOpen: isOpenProp,
  renderCreateNewOption,
  onCreateNewOption,
  hideIcons,
  iconColumnWidth,
  containerWidth,
  containerHeight,
  containerRef,

  onSelectOption,
  onInputChange,
  onFetchMore,
  onClear,
  onClose,
  onOpen,
  optionsRenderer,
  onInputReturn,
  tabProps,
  disabled,
  fetchMoreText,
  autoscrollText,
  externalLinkIcon,
  selectedIcon,
  layer = "popover",
  containerMaxHeight,
  openChildrenOnMouseOver,
  isSubItemDropdown,
  openSubmenuOnButtonHover,
}: DropdownProps<T, TargetRef>): JSX.Element {
  const stickyHeaderValueOptions = useMemo(
    () =>
      (stickyHeaderOptions ?? []).filter(
        (opt): opt is DropdownValueType<T> => opt.type === "value"
      ),
    [stickyHeaderOptions]
  );
  const valueOptions = useMemo(
    () =>
      (options ?? []).filter(
        (opt): opt is DropdownValueType<T> => opt.type === "value"
      ),
    [options]
  );
  const stickyFooterValueOptions = useMemo(
    () =>
      (stickyFooterOptions ?? []).filter(
        (opt): opt is DropdownValueType<T> => opt.type === "value"
      ),
    [stickyFooterOptions]
  );
  const allValueOptions = useMemo(
    () => [
      ...stickyHeaderValueOptions,
      ...valueOptions,
      ...(stickyFooterValueOptions ?? []),
    ],
    [stickyFooterValueOptions, stickyHeaderValueOptions, valueOptions]
  );

  const hasSelectedItems = useMemo(
    () => allValueOptions.some((item) => item.selected),
    [allValueOptions]
  );

  const hasExpandableItems = useMemo(
    () => allValueOptions.some((item) => (item.subItems?.length ?? 0) > 0),
    [allValueOptions]
  );

  const hasCreateNewOption = !!renderCreateNewOption;

  const [isOpenState, setIsOpenState] = useState(false);
  const [activeValueIndex, setActiveValueIndex] = useState<
    number | "createNew" | undefined
  >(() => {
    if (allValueOptions.length === 0 && hasCreateNewOption) {
      return "createNew";
    }
    return 0;
  });

  useEffect(() => {
    if (allValueOptions.length === 0 && hasCreateNewOption) {
      setActiveValueIndex("createNew");
    }
  }, [hasCreateNewOption, allValueOptions.length]);

  const [activeSubItem, setActiveSubItem] = useState<string | null>(null);

  const activeDropdownItem =
    (activeValueIndex !== undefined && activeValueIndex !== "createNew"
      ? allValueOptions[activeValueIndex]
      : null) ?? null;

  const isOpen = isOpenProp ?? isOpenState;

  const handleOpen = useCallback(() => {
    if (!disabled) {
      onOpen?.();
      setIsOpenState(true);
    }
  }, [disabled, onOpen]);

  type Cause = "select" | "user" | "createNew";

  const handleClose = useCallback(
    (cause?: Cause) => {
      function close() {
        setIsOpenState(false);
        onClose?.();
        setActiveValueIndex(0);
        setActiveSubItem(null);
      }

      if (cause === "select") {
        if (closeOnSelect) {
          close();
        }
        return;
      }

      close();
    },
    [closeOnSelect, onClose]
  );

  const targetRef = useRef<TargetRef>(null);
  const inputSearchRef = useRef<HTMLInputElement>(null);

  const dropdownRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handler(event: MouseEvent | TouchEvent) {
      if (window.document.activeElement === inputSearchRef.current) {
        return;
      }

      if (
        isHtmlNode(dropdownRef.current) &&
        dropdownRef.current.contains(event.target as Node)
      ) {
        return;
      }

      if (
        isHtmlNode(targetRef.current) &&
        targetRef.current.contains(event.target as Node)
      ) {
        return;
      }

      if (
        isHtmlNode(inputSearchRef.current) &&
        inputSearchRef.current.contains(event.target as Node)
      ) {
        return;
      }
      handleClose();
    }

    document.addEventListener("click", handler);
    return () => {
      document.removeEventListener("click", handler);
    };
  }, [handleClose, isOpen]);

  useEffect(() => {
    if (isOpen && disabled) {
      handleClose();
    }
  }, [isOpen, disabled, handleClose]);

  useEffect(() => {
    // This is to handle the case where the dropdown is open and the url changes.
    // There was a bug where the dropdown remained open when people clicked on the back button
    // and we want it to close when the url changes.
    function handler() {
      handleClose();
    }

    window.addEventListener("hashchange", handler);

    return () => {
      window.removeEventListener("hashchange", handler);
    };
  }, [handleClose]);

  useEffect(
    () => {
      if (isOpen) {
        if (inputSearchRef.current && showInternalSearch) {
          inputSearchRef.current?.focus({
            preventScroll: true,
          });
        } else {
          // FirstListItem will be null if not options in the list
          const firstListItem =
            dropdownRef.current?.querySelector('a[role="listitem"]');
          const createNewItem = dropdownRef.current?.querySelector(
            '[data-dp-name="dropdown-create-new"]'
          );

          // Auto focus first list item so keyboard events work for sub items.
          // NB: this will steal focus from the search input on arrow right
          ((firstListItem ?? createNewItem) as HTMLElement)?.focus();
        }
      }
    },
    // Trigger focus when switching tabs
    [isOpen, showInternalSearch, tabProps?.activeTabIndex]
  );

  useEffect(() => {
    function handler(event: KeyboardEvent) {
      if (event.key === "Escape" || event.keyCode === 27) {
        handleClose();
      }
    }

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleClose]);

  const [referenceElement, setReferenceElement] = useState<null | Element>(
    null
  );
  const [popperElement, setPopperElement] = useState<null | HTMLElement>(null);
  const { styles, attributes, update } = usePopper(
    referenceElement,
    popperElement,
    {
      placement,
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [isSubItemDropdown ? -8 : 0, 2],
          },
        },
      ],
    }
  );

  // Force Popper to recalculate the placement whenever the options change
  useEffect(() => {
    update && update();
  }, [update, options, stickyHeaderOptions, stickyFooterOptions]);

  const handleOnClick = useCallback(() => {
    isOpen ? handleClose() : handleOpen();
  }, [handleClose, handleOpen, isOpen]);

  const handleCreateNew = useCallback(() => {
    onCreateNewOption?.();
    handleClose("createNew");
  }, [handleClose, onCreateNewOption]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scrollToItem = useCallback(
    // we throttle the scrolling so we arent scrolling to every item when up/down is
    // held down otherwise the active item will go off page and also causes lag
    throttle(
      (activeIndex: number | "createNew") => {
        dropdownRef.current
          ?.querySelector(
            activeIndex === "createNew"
              ? '[data-dp-name="dropdown-create-new"]'
              : `a[role="listitem"]:nth-of-type(${activeIndex + 1})`
          )
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      },
      175,
      { trailing: true, leading: true }
    ),
    []
  );

  const setActiveIndexAndScrollToItem = useCallback(
    (activeIndex: number | "createNew") => {
      setActiveValueIndex(activeIndex);
      scrollToItem(activeIndex);
    },
    [scrollToItem]
  );

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      const key = e.key;
      if (!isOpen) return;

      switch (key) {
        case "ArrowUp":
          e.preventDefault();
          if (!activeSubItem) {
            const nextItem = getNextItem(
              allValueOptions,
              activeValueIndex,
              "up",
              hasCreateNewOption
            );
            setActiveIndexAndScrollToItem(nextItem);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (!activeSubItem) {
            const nextItem = getNextItem(
              allValueOptions,
              activeValueIndex,
              "down",
              hasCreateNewOption
            );
            setActiveIndexAndScrollToItem(nextItem);
          }
          break;
        case "Enter": {
          if (activeSubItem) return;
          if (activeValueIndex === undefined) return;
          if (activeValueIndex === "createNew") {
            handleCreateNew?.();
            break;
          }
          const option = allValueOptions[activeValueIndex];

          if (option) {
            // Prevent click from bubbling because it will cause the onclick on the dropdown trigger to fire
            // which will cause the dropdown to close even if closeOnSelect=false
            // e.preventDefault();
            onSelectOption?.(option);
            handleClose("select");
          } else if (onInputReturn && inputValue && inputValue.length > 0) {
            onInputReturn?.(inputValue);
            handleClose();
          }
          break;
        }
        case "ArrowRight":
          e.preventDefault();
          if (typeof activeValueIndex === "number" && !activeSubItem) {
            const subItems = allValueOptions[activeValueIndex].subItems;
            if (subItems?.length) {
              setActiveSubItem(allValueOptions[activeValueIndex].key);
            }
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (activeSubItem) {
            if (showInternalSearch) {
              // Refocus the search input
              inputSearchRef.current?.focus({
                preventScroll: true,
              });
            } else {
              // Refocus the parent item
              typeof activeValueIndex === "number" &&
                (
                  dropdownRef.current?.querySelectorAll(
                    'a[role="listitem"]'
                  ) as NodeListOf<HTMLElement>
                )?.[activeValueIndex]?.focus();
            }
            setActiveSubItem(null);
          }
          break;
      }
    },
    [
      isOpen,
      activeSubItem,
      activeValueIndex,
      allValueOptions,
      hasCreateNewOption,
      setActiveIndexAndScrollToItem,
      onInputReturn,
      inputValue,
      handleCreateNew,
      onSelectOption,
      handleClose,
      showInternalSearch,
    ]
  );

  useEffect(() => {
    // Make first value option active when searching
    if (valueOptions.length) {
      setActiveIndexAndScrollToItem(stickyHeaderValueOptions.length);
    } else {
      if (hasCreateNewOption) {
        setActiveValueIndex("createNew");
      } else {
        setActiveValueIndex(undefined);
      }
    }
    // Only run on inputValue change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const handleSelectOption = useCallback(
    (value: DropdownValueType<T>) => {
      onSelectOption?.(value);
      handleClose("select");
    },
    [handleClose, onSelectOption]
  );

  const handleCreateNewMouseEnter = useCallback(() => {
    setActiveValueIndex("createNew");
  }, []);

  // width of input or set minimum width - 236px
  const refWidth = useMemo(() => {
    if (
      referenceElement?.scrollWidth &&
      referenceElement.scrollWidth > minimumDropdownWidth
    ) {
      return referenceElement.scrollWidth;
    } else return minimumDropdownWidth;
  }, [referenceElement?.scrollWidth]);

  const innerDropdownContent = (
    <>
      {optionsRenderer &&
        optionsRenderer(
          options,
          handleSelectOption,
          activeDropdownItem,
          activeSubItem,
          setActiveSubItem,
          hideIcons
        )}
      {!optionsRenderer && options.length > 0 && (
        <Infinite
          maxHeight={containerHeight || containerMaxHeight ? undefined : "40vh"}
          onFetchMore={onFetchMore}
          anchor={false}
          scrollSideEffect={() => setActiveSubItem(null)}
          fetchMoreText={fetchMoreText}
          autoscrollText={autoscrollText}
        >
          {options.map(
            dropdownRenderOptions({
              handleSelectOption,
              activeItem: activeDropdownItem,
              activeSubItem,
              setActiveSubItem,
              fetchMoreText,
              autoscrollText,
              selectedIcon,
              externalLinkIcon,
              hasSelectedItems,
              hasExpandableItems,
              hideIcons,
              iconColumnWidth,
              openChildrenOnMouseOver,
              setActiveValueIndex,
              valueOptions: allValueOptions,
              layer,
              openSubmenuOnButtonHover,
            })
          )}
        </Infinite>
      )}
      {isLoading && <Spinner />}
    </>
  );

  const dropdown = (
    <S.DropdownContainer
      role="list"
      layer={layer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "spring", mass: 0.5 }}
      onKeyDownCapture={handleKeyDown}
      data-testid="dropdown-container"
      ref={mergeRefs(setPopperElement, dropdownRef, containerRef ?? null)}
      style={styles.popper}
      containerWidth={containerWidth || refWidth}
      containerHeight={containerHeight}
      containerMaxHeight={containerMaxHeight}
      {...attributes.popper}
    >
      {stickyHeaderOptions && (
        <>
          {stickyHeaderOptions.map(
            dropdownRenderOptions({
              handleSelectOption,
              activeItem: activeDropdownItem,
              activeSubItem,
              setActiveSubItem,
              fetchMoreText,
              autoscrollText,
              selectedIcon,
              externalLinkIcon,
              hasSelectedItems,
              hasExpandableItems,
              hideIcons,
              iconColumnWidth,
              openChildrenOnMouseOver,
              setActiveValueIndex,
              valueOptions: allValueOptions,
              layer,
            })
          )}
          <S.DropdownDividerItem />
        </>
      )}
      {showInternalSearch && (
        <S.DropdownInternalSearchInputContainer>
          <Input
            inputsize="small"
            leftIcon={{ icon: faSearch as AnyIcon, themeColor: "cyan100" }}
            rightIcon={
              <IconButton
                aria-label="clear"
                minimal
                icon={faTimes as AnyIcon}
                onClick={() => {
                  onInputChange?.("");
                  inputSearchRef.current?.focus();
                }}
              />
            }
            value={inputValue}
            onChange={(event) => onInputChange?.(event.target.value)}
            ref={inputSearchRef}
            placeholder={searchPlaceholder}
          />
        </S.DropdownInternalSearchInputContainer>
      )}
      {tabProps && (
        <Stack vertical padding="6px 8px" style={{ overflow: "scroll" }}>
          <TabBar
            type="tab"
            tabs={tabProps.tabs}
            onClickTab={(e) => {
              // Auto focus first list item so keyboard events work
              (
                dropdownRef.current?.querySelector(
                  'a[role="listitem"]'
                ) as HTMLElement
              )?.focus();
              tabProps.onTabChange(e);
            }}
            activeIndex={tabProps.activeTabIndex}
            containerStyles={{
              padding: "0 8px",
              justifyContent: "flex-start",
              gap: 5,
            }}
            style={{ overflow: "scroll" }}
          />
        </Stack>
      )}
      {innerDropdownContent}
      {stickyFooterOptions && (
        <>
          <S.DropdownDividerItem />
          {stickyFooterOptions.map(
            dropdownRenderOptions({
              handleSelectOption,
              activeItem: activeDropdownItem,
              activeSubItem,
              setActiveSubItem,
              fetchMoreText,
              autoscrollText,
              selectedIcon,
              externalLinkIcon,
              hasSelectedItems,
              hasExpandableItems,
              hideIcons,
              iconColumnWidth,
              openChildrenOnMouseOver,
              setActiveValueIndex,
              valueOptions: allValueOptions,
              layer,
            })
          )}
        </>
      )}
      {hasCreateNewOption && (
        <>
          <S.DropdownDividerItem />
          <div
            style={{ display: "contents" }}
            tabIndex={0}
            {...dpNameProp("dropdown-create-new")}
          >
            {renderCreateNewOption(
              activeValueIndex === "createNew",
              handleCreateNew,
              handleCreateNewMouseEnter
            )}
          </div>
        </>
      )}
    </S.DropdownContainer>
  );

  const targetProps: DropdownTargetProps<TargetRef> = {
    active: isOpen,
    targetProps: {
      onClick: handleOnClick,
      ...styles.reference,
      ...attributes.reference,
      onKeyDown: handleKeyDown,
    } as HTMLAttributes<HTMLElement>,
    targetRef: mergeRefs(setReferenceElement, targetRef),

    inputRef: mergeRefs(setReferenceElement, inputSearchRef),
    inputProps: {
      value: inputValue,
      onFocus: handleOpen,
      onChange: (event) => onInputChange?.(event.target.value),
      placeholder: searchPlaceholder,
      onKeyDown: handleKeyDown,
    },
    handleOnClear: onClear,
  };

  return (
    <>
      {typeof children === "function" ? children(targetProps) : children}

      {isOpen && (usePortal ? <Portal>{dropdown}</Portal> : dropdown)}
    </>
  );
}

/**
 * @public
 */
export interface DropdownItemProps<T = unknown> {
  onSelect?: (value: DropdownValueType<T>) => void;
  onSelectIcon?: (value: T) => void;
  onClickSubItem?: (value: DropdownValueType<T>) => void;
  value: DropdownValueType<T>;
  meta: DropdownItemMeta;
  customLabelRender?: ReactNode;
  active?: boolean;
  activeSubItem?: string | null;
  setActiveSubItem?: (item: string | null) => void;
  hideIcons?: boolean;
  iconColumnWidth?: number;
  externalLinkIcon: AnyIcon;
  selectedIcon: AnyIcon;
  fetchMoreText: ReactNode;
  autoscrollText: ReactNode;
  openChildrenOnMouseOver?: boolean;
  hasSelectedItems: boolean;
  hasExpandableItems: boolean;
  layer?: keyof Layers;
  setActiveValueIndex: (value: number | "createNew") => void;
  valueOptions: DropdownValueType<T>[];
  openSubmenuOnButtonHover?: boolean;
}

/**
 * @public
 */
export function DropdownItem<T = unknown>({
  value,
  active,
  onSelect,
  onSelectIcon,
  onClickSubItem,
  activeSubItem,
  setActiveSubItem,
  hideIcons,
  iconColumnWidth,
  fetchMoreText,
  autoscrollText,
  selectedIcon,
  externalLinkIcon,
  openChildrenOnMouseOver,
  hasSelectedItems,
  hasExpandableItems,
  layer,
  setActiveValueIndex,
  valueOptions,
  openSubmenuOnButtonHover = false,
}: DropdownItemProps<T>): JSX.Element {
  const hasSubItems = (value.subItems?.length ?? 0) > 0;
  const handleOnClick = (e: ReactMouseEvent<HTMLElement>) => {
    // Prevent click from bubbling because it will cause the onclick on the dropdown trigger to fire
    // which will cause the dropdown to close even if closeOnSelect=false
    e.stopPropagation();
    e.preventDefault();
    if (value.disabled) {
      return;
    }
    if (value.subItems && value.openSubmenuOnSelect) {
      setActiveSubItem?.(value.key);
      onClickSubItem?.(value);
    } else {
      onSelect?.(value);
    }
  };

  const onMouseEnter = useCallback(() => {
    setActiveValueIndex(getItemByKey(valueOptions, value.key));
    if (openChildrenOnMouseOver && hasSubItems) {
      setActiveSubItem?.(value.key);
    } else {
      setActiveSubItem?.(null);
    }
  }, [
    hasSubItems,
    openChildrenOnMouseOver,
    setActiveSubItem,
    setActiveValueIndex,
    value.key,
    valueOptions,
  ]);

  return (
    <Dropdown<T, HTMLAnchorElement>
      isOpen={activeSubItem === value.key}
      options={value.subItems ?? []}
      placement="right-start"
      onSelectOption={onSelect}
      onFetchMore={value.onFetchMoreSubItems}
      fetchMoreText={fetchMoreText}
      autoscrollText={autoscrollText}
      externalLinkIcon={externalLinkIcon}
      selectedIcon={selectedIcon}
      hideIcons={hideIcons}
      layer={layer}
      isSubItemDropdown
      {...value.subItemsDropdownOptions}
    >
      {({ targetProps, targetRef }: DropdownTargetProps<HTMLAnchorElement>) => (
        <S.DropdownItemLayout
          role="listitem"
          ref={targetRef}
          {...targetProps}
          data-testid="dropdown-value"
          active={active}
          onKeyDownCapture={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          tabIndex={0}
          href={value.href}
          rel={value.href ? "noreferrer noopener" : undefined}
          target={value.href ? "_blank" : undefined}
          onClick={value.href ? undefined : handleOnClick}
          disabled={value.disabled}
          hasExpandableItems={hasExpandableItems}
          onMouseEnter={onMouseEnter}
          {...dpNameProp(`dropDownLabel.${value.label}`)}
        >
          <S.DropDownLabel selected={value.selected} hasSubItems={hasSubItems}>
            {!hideIcons && (
              <S.DropdownIcon
                iconColumnWidth={iconColumnWidth}
                onClick={
                  value.icon && onSelectIcon
                    ? (e) => {
                        e.stopPropagation();
                        onSelectIcon(value.value);
                      }
                    : undefined
                }
              >
                {isAnyIcon(value.icon) ? (
                  <Icon icon={value.icon} />
                ) : isIconProps(value.icon) ? (
                  <Icon {...value.icon} />
                ) : (
                  value.icon
                )}
              </S.DropdownIcon>
            )}
            {value.label}
          </S.DropDownLabel>
          {hasSelectedItems && (
            <S.HiddenIcon
              {...dpNameProp(`dropdownItemCheck`)}
              $visible={!!value.selected}
              icon={selectedIcon}
            />
          )}
          {value.href && value.showHrefIcon && (
            <Icon
              {...dpNameProp(`dropdownItemLink`)}
              icon={externalLinkIcon}
              themeColor="cyan100"
            />
          )}
          {hasExpandableItems && (
            <S.ExpandButton
              aria-label="expand"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveSubItem?.(value.key);
                onClickSubItem?.(value);
              }}
              onMouseEnter={
                openSubmenuOnButtonHover
                  ? () => {
                      setActiveSubItem?.(value.key);
                      onClickSubItem?.(value);
                    }
                  : undefined
              }
              icon={ChevronRightIcon}
              intent="minimal"
              $visible={hasSubItems}
            />
          )}
        </S.DropdownItemLayout>
      )}
    </Dropdown>
  );
}

/**
 * @public
 */
export interface CreateNewOptionProps {
  text?: ReactNode;
  icon: AnyIcon;
  onClick: () => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  resetButton?: boolean;
  iconColor?: ThemeColorKey;
  active: boolean;
}

/**
 * @public
 */
export const CreateNewOption = ({
  text,
  icon,
  onClick,
  onMouseEnter,
  resetButton,
  iconColor,
  active,
}: CreateNewOptionProps): JSX.Element => {
  return (
    <S.CreateNewItemLayout
      active={active}
      className={resetButton ? "resetButton" : ""}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <S.DropDownLabel selected={active}>
        <S.DropdownIcon>
          <Icon themeColor={iconColor} icon={icon} />
        </S.DropdownIcon>
        {text}
      </S.DropDownLabel>
    </S.CreateNewItemLayout>
  );
};

function isHtmlNode(node: unknown): node is HTMLElement {
  return (
    typeof node === "object" && notEmpty(node) && node instanceof HTMLElement
  );
}
