import { useDeskproAppTheme } from "@deskpro/app-sdk";
import {
  AnyIcon,
  DivAsInput,
  Drilldown,
  DropdownTargetProps,
  H1,
  Label,
  Stack,
} from "@deskpro/deskpro-ui";
import {
  faCaretDown,
  faCheck,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";
import { ReactNode, useMemo, useState } from "react";
type Props = {
  data?: {
    key: string;
    value: string | null | number;
  }[];
  onChange: ({ key, value }: { key: string; value: string }) => void;
  title?: string;
  value: string | string[] | null | undefined;
  error?: boolean;
  required?: boolean;
  multiple?: boolean;
};
export const DropdownSelect = ({
  data,
  onChange,
  title,
  value,
  error,
  required,
  multiple,
}: Props) => {
  const [search, setSearch] = useState("");
  const { theme } = useDeskproAppTheme();

  const dataOptions = useMemo(() => {
    return data?.map((dataInList) => ({
      key: dataInList.key,
      label: <Label label={dataInList.key}></Label>,
      value: dataInList.value,
      type: "value" as const,
    }));
  }, [data]) as {
    value: string;
    key: string;
    label: ReactNode;
    type: "value";
  }[];

  const height = 48 * dataOptions.length;

  return (
    <Stack
      vertical
      style={{ marginTop: "5px", color: theme?.colors.grey80, width: "100%" }}
    >
      {title && (
        <Stack>
          <H1>{title}</H1>
          {required && (
            <Stack style={{ color: "red" }}>
              <H1>⠀*</H1>
            </Stack>
          )}
        </Stack>
      )}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
      <Drilldown<any, HTMLDivElement>
        type="flat"
        placement="bottom-start"
        backText="Back"
        emptySearchResultsText="No results found"
        options={dataOptions
          .filter((e) => e.key.includes(search) || e.value.includes(search))
          .map((e) => ({
            ...e,
            parentKey: undefined,
            selected: ["number", "string"].includes(typeof value)
              ? e.value === value
              : value?.includes(e.value),
          }))}
        containerHeight={height}
        showInternalSearch
        onInputChange={(e) => setSearch(e)}
        fetchMoreText={"Fetch more"}
        autoscrollText={"Autoscroll"}
        selectedIcon={faCheck as AnyIcon}
        externalLinkIcon={faExternalLinkAlt as AnyIcon}
        onSelectOption={(option) => {
          onChange(option);
        }}
      >
        {({ targetProps, targetRef }: DropdownTargetProps<HTMLDivElement>) => (
          <DivAsInput
            error={error}
            ref={targetRef}
            {...targetProps}
            variant="inline"
            rightIcon={faCaretDown as AnyIcon}
            placeholder="Select Field"
            style={{ fontWeight: "400 !important" }}
            value={
              multiple
                ? dataOptions
                    .filter((e) => value?.includes(e.value))
                    .reduce(
                      (a, c, i, arr) =>
                        a + `${c.key}${i === arr.length - 1 ? "" : ", "} `,
                      ""
                    )
                : dataOptions.find((e) => e.value == value)?.key
            }
          />
        )}
      </Drilldown>
    </Stack>
  );
};
