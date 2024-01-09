import styled from "styled-components";
import { motion } from "framer-motion";
import { Icon, IconButton, Layers } from "@deskpro/deskpro-ui";
import { dpNameProp } from "./utility";

/**
 * @public
 */
export const DropdownContainer = styled(motion.div).attrs(
  dpNameProp("Dropdown")
)<{
  containerWidth?: number;
  containerHeight?: number;
  layer: keyof Layers;
  containerMaxHeight?: string | number;
}>`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.white};
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
  z-index: ${({ theme, layer }) => theme.layers[layer]};
  outline: none;
  padding-top: 5px;
  padding-bottom: 5px;
  // TODO: allow menu contents to define width
  // TODO: set min width based on ref of input trigger
  width: ${({ containerWidth }) => containerWidth ?? 200}px;
  ${({ containerHeight }) =>
    containerHeight ? `height: ${containerHeight}px;` : ""}
  ${({ containerMaxHeight }) =>
    containerMaxHeight ? `max-height: ${containerMaxHeight}px;` : ""}
  user-select: none;
`;

/**
 * @public
 */
export const DropdownDividerItem = styled.div`
  width: 100%;
  border-top: 1px solid ${({ theme }) => theme.colors.grey10};
  margin-top: 5px;
  margin-bottom: 5px;
`;

/**
 * @public
 */
export const DropdownHeaderItem = styled.div`
  font-family: ${({ theme }) => theme.fonts.inter};
  font-size: 12px;
  font-weight: 500;
  padding-top: 8px;
  padding-bottom: 5px;
  padding-left: 15px;
  line-height: 110%;
  user-select: none;
  padding-right: 15px;
`;

interface DropdownItemLayoutProps {
  hasExpandableItems?: boolean;
  disabled?: boolean;
  active?: boolean;
}

/**
 * @public
 */
export const DropdownItemLayout = styled.a<DropdownItemLayoutProps>`
  transition: background-color 0.1s ease-in-out;
  outline: none;
  padding-left: 15px;
  padding-right: ${({ hasExpandableItems }) =>
    hasExpandableItems ? "5px" : "15px"};
  display: flex;
  user-select: none;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  background-color: ${({ theme, active }) =>
    active ? theme.colors.brandShade40 : ""};
  &:active {
    background-color: ${({ theme }) => theme.colors.brandShade40};
  }
  font-size: 12px;
  font-family: ${({ theme }) => theme.fonts.inter};
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  position: relative;
  opacity: ${({ disabled }) => (disabled ? "0.5" : "1")};
  text-decoration: none;
`;
export const CreateNewItemLayout = styled(DropdownItemLayout)`
  div {
    color: ${({ theme }) => theme.colors.cyan100};
  }
`;

export const HiddenIcon = styled(Icon)<{ $visible: boolean }>`
  visibility: ${({ $visible }) => ($visible ? "visible" : "hidden")};
`;

export const ExpandButton = styled(IconButton)<{ $visible: boolean }>`
  visibility: ${({ $visible }) => ($visible ? "visible" : "hidden")};
  padding: 0;
  flex-shrink: 0;
  && svg {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.grey100};
  }
`;
export const DropDownLabel = styled.div<{
  selected?: boolean;
  hasSubItems?: boolean;
}>`
  width: ${({ hasSubItems }) => (hasSubItems ? "calc(100% - 30px)" : "100%")};
  color: ${({ theme, selected }) =>
    selected ? theme.colors.brandPrimary : theme.colors.grey100};
  font-weight: ${({ selected }) => (selected ? 500 : 400)};
  display: flex;
  align-items: center;
  padding-right: 10px;
  padding-top: 5px;
  padding-bottom: 5px;
  gap: 6px;
  user-select: none;
  .resetButton & {
    color: ${({ theme }) => theme.colors.grey100};
    font-size: 12px;
  }

  min-height: 36px;
`;

export const DropdownIcon = styled.div<{ iconColumnWidth?: number }>`
  padding-right: 5px;
  width: ${({ iconColumnWidth }) =>
    (iconColumnWidth ? iconColumnWidth : 24) + "px"};
  min-width: ${({ iconColumnWidth }) =>
    (iconColumnWidth ? iconColumnWidth : 24) + "px"};

  .resetButton & {
    color: ${({ theme }) => theme.colors.grey40};
  }
`;

/**
 * @public
 */
export const DropdownInternalSearchInputContainer = styled.div`
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
`;
