import type * as React from "react";
import type {
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  Ref,
} from "react";
import type { Placement } from "@popperjs/core";
import {
  AnyIcon,
  IconProps,
  Layers,
  TabBarItemType,
} from "@deskpro/deskpro-ui";

/**
 * @public
 */
export interface DropdownValueType<OriginalValue> {
  /** Unique identifier for the option */
  key: string;
  /** Text label for the option*/
  label: React.ReactNode;
  /** Discriminated union literal */
  type: "value";
  /** Show option as disabled*/
  disabled?: boolean;
  /** Description to render */
  description?: string;
  /** Icon to render */
  icon?: AnyIcon | IconProps | JSX.Element | null;
  /** Show option as selected  */
  selected?: boolean;
  /** Link to render - changes behavior to open link in new browser tab */
  href?: string;
  /** Sub options to render */
  subItems?: DropdownItemType<OriginalValue>[];
  onClickIcon?: (value: unknown) => void;
  /** Callback fired on clicking the sub menu arrow icon **/
  onClickSubItem?: (value: unknown) => void;
  /** The underlying data related to the option, for the convenience of the user */
  value: OriginalValue;
  /** The default behaviour will only open submenu on clicking th right arrow icon, this will make the whole item
   * clickable, overriding the onSelect behaviour
   */
  openSubmenuOnSelect?: boolean;
  /** Callback fired to handle fetch more scrolling for sub items  */
  onFetchMoreSubItems?: () => void;
  /** Whether to show icon when a href is provided default is true */
  showHrefIcon?: boolean;
}

/**
 * @public
 */
export interface DropdownHeaderType {
  type: "header";
  label: React.ReactNode;
  childLabels?: string[];
}

/**
 * @public
 */
export interface DropdownDivider {
  type: "divider";
}

/**
 * @public
 */
export type DropdownItemType<T = unknown> =
  | DropdownValueType<T>
  | DropdownHeaderType
  | DropdownDivider;

/**
 * @public
 */
export interface DropdownTargetProps<TargetRef extends HTMLElement> {
  targetProps: HTMLAttributes<HTMLElement>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  targetRef: Ref<TargetRef>;

  inputProps: InputHTMLAttributes<HTMLInputElement>;
  inputRef: Ref<HTMLInputElement>;
  handleOnClear?: () => void;
  active: boolean;
}

/**
 * @public
 */
export interface DropdownItemMeta {
  /** Whether to render as an "active" element */
  active: boolean;
  /** The current search input */
  input: string;
}

/**
 * @public
 */
export interface DropdownTabProps {
  tabs: TabBarItemType[];
  activeTabIndex: number;
  onTabChange: (index: number) => void;
}

/**
 * @public
 */
export interface DropdownProps<T, TargetRef extends HTMLElement> {
  /** List of options to render */
  options: DropdownItemType<T>[];
  /** Control over whether the dropdown is open - default uncontrolled */
  isOpen?: boolean;
  /** List of options to render as sticky options at the head of any of the normal
   * options
   */
  stickyHeaderOptions?: DropdownItemType<T>[];
  /** List of options to render as sticky options at the foot of any of the normal
   * options
   */
  stickyFooterOptions?: DropdownItemType<T>[];

  /** PoppperJS placement option. Defaults to "bottom-start" */
  placement?: Placement;
  /** Wether to render the dropdown in a portal. Default true */
  usePortal?: boolean;
  /** The input value to render in the search box */
  inputValue?: string;
  /** Show a loading indicator */
  isLoading?: boolean;
  /** Show an internal search input for filtering options. The Dropdown does not
   * do any filtering itself
   */
  showInternalSearch?: boolean;
  /** Whether to disable the dropdown */
  disabled?: boolean;
  /** Whether subitems are rendered in an expanding or non-expanding style */
  expandingDrillDown?: boolean;
  /** Placeholder for search input box */
  searchPlaceholder?: string;
  /** Whether the dropdown should close on selections. default true */
  closeOnSelect?: boolean;
  /** Whether to hide item's icon for the whole list */
  hideIcons?: boolean;

  /** The width of the column in which icons are rendered */
  iconColumnWidth?: number;

  /** Add in custom width to the dropdown options container */
  containerWidth?: number;
  /** Add in custom height to the dropdown options container */
  containerHeight?: number;
  /** Add in custom max height to the dropdown options container */
  containerMaxHeight?: string | number;

  /** Event handler for when the "active" item changes via keyboard events */
  onActiveOptionChange?: (item: DropdownValueType<T> | null) => void;
  /** Event handler for when the "clear" event is triggered for the search input */
  onClear?: () => void;
  /** Event handler for when an option is selected */
  onSelectOption?: (item: DropdownValueType<T>) => void;
  /** Event handler for when the search input value changes */
  onInputChange?: (input: string) => void;
  /** Event handler for when the user requests more options.
   *  For use with paginated options */
  onFetchMore?: () => void;
  /** Event handler for when the dropdown closes */
  onClose?: () => void;
  /** Event handler for when the dropdown opens */
  onOpen?: () => void;

  /** The target for the dropdown. Either a normal ReactNode or a render
   * prop with additional state from the dropdown */
  children:
    | ((props: DropdownTargetProps<TargetRef>) => JSX.Element)
    | JSX.Element;
  /** Tag to use for the wrapper element, default div */
  renderItem?: (
    item: DropdownValueType<T>,
    meta: DropdownItemMeta
  ) => JSX.Element;
  /** Override the rendering of dropdown labels within dropdown options */
  renderLabel?: (
    item: DropdownValueType<T>,
    meta: DropdownItemMeta
  ) => JSX.Element;
  /** Override the rendering of menu container */
  renderMenu?: () => JSX.Element;
  /** Override the rendering of divider elements in the list of options*/
  renderDivider?: () => JSX.Element;
  /** Override the rendering of header elements in the list of options */
  renderHeader?: (item: DropdownHeaderType) => JSX.Element;
  /** Override the rendering of the sticky header in the list of options */
  renderStickyHeader?: ReactNode;
  /** Override the rendering of the sticky footer in the list of options */
  renderStickyFooter?: ReactNode;
  /** Override the rendering of the internal search input*/
  renderInternalSearch?: (
    props: InputHTMLAttributes<HTMLInputElement>
  ) => JSX.Element;
  /** Render the create new option - no default implementation and renders as a
   * sticky footer above the normal sticky footer
   */
  onCreateNewOption?: () => void;
  renderCreateNewOption?: (
    active: boolean,
    onSelect: () => void,
    handleCreateNewMouseEnter: (e: React.MouseEvent) => void
  ) => ReactNode;
  /** Override the rendering of the contents of the dropdown container */
  optionsRenderer?: (
    options: DropdownItemType<T>[],
    handleSelectOption: (value: DropdownValueType<T>) => void,
    activeItem: DropdownValueType<T> | null,
    activeSubItem: string | null,
    setActiveSubItem: React.Dispatch<React.SetStateAction<string | null>>,
    hideIcons: boolean | undefined
  ) => ReactNode;
  /** Props for rendering tabs within the dropdown */
  tabProps?: DropdownTabProps;
  /** The text to show for the fetch more button */
  fetchMoreText: ReactNode;
  /** The text to show for the autoscroll button */
  autoscrollText: ReactNode;
  externalLinkIcon: AnyIcon;
  selectedIcon: AnyIcon;
  /** Event handler that returns input value after enter has been pressed */
  onInputReturn?: (inputValue: string) => void;
  /** The zIndex Layer that the dropdown will be rendered at. Defaults to: popover */
  layer?: keyof Layers;
  /** Display items children on hover */
  openChildrenOnMouseOver?: boolean;
}
