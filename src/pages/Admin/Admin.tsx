import styled from "styled-components";
import {
  LoadingSpinner,
  useDeskproAppEvents,
  useInitialisedDeskproAppClient,
} from "@deskpro/app-sdk";
import { H1, P5 } from "@deskpro/deskpro-ui";
import { Fragment, useEffect, useMemo, useState } from "react";
import { DropdownSelect } from "../../components/DropdownSelect/DropdownSelect";
import { ISettings } from "../../types/settings";

const exampleTicket = [
  { fieldName: "id", label: "ID", value: "436" },
  {
    fieldName: "permalinkUrl",
    label: "PermalinkUrl",
    value: "https://www.deskprodemo.comapp#/t/ticket/436",
  },
  {
    fieldName: "subject",
    label: "Subject",
    value: "A Ticket Subject",
  },
  { fieldName: "status", label: "status", value: "awaiting_agent" },
  {
    fieldName: "creationSystem",
    label: "Creation System",
    value: "web.person.portal",
  },
  {
    fieldName: "primaryUser.id",
    label: "Primary User ID",
    value: "1081",
  },
  {
    fieldName: "primaryUser.email",
    label: "Primary User Email",
    value: "uokon@example.org",
  },
  {
    fieldName: "primaryUser.firstName",
    label: "Primary User First Name",
    value: "Moshe",
  },
  {
    fieldName: "primaryUser.lastName",
    label: "Primary User Last Name",
    value: "Rempel",
  },
  {
    fieldName: "primaryUser.displayName",
    label: "Primary User Display Name",
    value: "Moshe Rempel",
  },
  {
    fieldName: "primaryUser.language",
    label: "Primary User Language",
    value: "English",
  },
  {
    fieldName: "primaryUser.locale",
    label: "Primary User Locale",
    value: "en-US",
  },
  {
    fieldName: "organization.id",
    label: "Organization ID",
    value: "1",
  },
  {
    fieldName: "organization.name",
    label: "Organization Name",
    value: "Best Org Ever",
  },
];

const harvestFields = [
  {
    value: "app_name",
    key: "App Name",
  },
  {
    value: "external_item_name",
    key: "External Item Name",
  },
  {
    value: "external_group_name",
    key: "External Group Name",
  },
  {
    value: "default_project_code",
    key: "Default Project Code",
  },
  {
    value: "default_project_name",
    key: "Default Project Name",
  },
];

type DeskproData = {
  fieldName: string;
  label: string;
  order?: number;
  value: string;
};

const Table = Object.assign(styled.table`
  border: none;
  border-collapse: collapse;
  border-spacing: 0;
  background: transparent;
  margin: 0;
  padding: 0;
  width: calc(100% - 2px);

  th, td {
    margin: 0;
    padding: 0;
    border: none;
    font-weight: normal;
    text-align: left;
    vertical-align: top;
  }
`, {
  Head: styled.th``,
  Row: styled.tr``,
  Cell: styled.td``,
});

export const Admin = () => {
  const [settings, setSettings] = useState<ISettings | null>(null);
  const [customFields, setCustomFields] = useState<DeskproData[]>([]);
  const [data, setData] = useState<DeskproData[]>([]);

  useDeskproAppEvents(
    {
      onAdminSettingsChange: (e) => {
        !settings && setSettings(JSON.parse(e.field_mapping ?? "{}"));
      },
      onReady: (context) => {
        setCustomFields(
          (
            context as unknown as {
              customFields: {
                ticket: { id: string; title: string; description: string }[];
              };
            }
          ).customFields.ticket.map((e) => ({
            fieldName: "customFields.field," + e.id + ".value",
            label: `${e.id} - ${e.title}`,
            value: e.description,
          }))
        );
      },
    },
    [settings]
  );

  useInitialisedDeskproAppClient(
    (client) => {
      settings && client.setAdminSetting(JSON.stringify(settings));
    },
    [settings]
  );

  useEffect(() => setData([...exampleTicket, ...customFields]), [customFields]);

  const setSettingsDropdown = (
    deskproField: { key: string; value: string },
    harvestField: { key: string; value: string }
  ) => {
    if (!settings) return;

    const settingsField = settings[harvestField.value as keyof ISettings];

    const field = settingsField?.find((e) => e.value === deskproField.value);

    if (field) {
      setSettings({
        ...settings,
        [harvestField.value]: settingsField
          ?.filter((e) => e.value !== deskproField.value)
          .map((e) => ({
            ...e,
            order:
              e.order && e.order > (field.order ?? 0) ? e.order - 1 : e.order,
          })),
      });

      return;
    }

    const maxValue = Math.max(
      ...(settingsField?.length ? settingsField : [{ order: 0 }]).map(
        (e) => e.order ?? 0
      )
    );

    setSettings({
      ...settings,
      [harvestField.value]: [
        ...(settings[harvestField.value as keyof ISettings] ?? []),
        { value: deskproField.value, order: maxValue + 1 },
      ],
    });
  };

  const fields = useMemo(
    () => {
      if (!settings) return;

      const maxOrderValue = Math.max(
        ...Object.values(settings).flatMap((e) =>
          e.map((e: { order: number }) => e.order ?? 0)
        )
      );

      return harvestFields.map((harvestField) => (
        <Fragment key={harvestField.key}>
          <Table.Cell><P5>{harvestField.key}</P5></Table.Cell>
          <Table.Cell>
            <DropdownSelect
              data={data
                .sort((a, b) => {
                  const orderA =
                    settings[harvestField.value as keyof ISettings]?.find(
                      (e) => e.value === a.fieldName
                    )?.order ?? maxOrderValue + 1;

                  const orderB =
                    settings[harvestField.value as keyof ISettings]?.find(
                      (e) => e.value === b.fieldName
                    )?.order ?? maxOrderValue + 1;

                  return orderA - orderB;
                })
                .map((e) => ({
                  key: e.label,
                  value: e.fieldName,
                }))}
              multiple
              onChange={(e) => setSettingsDropdown(e, harvestField)}
              value={settings[harvestField.value as keyof ISettings]?.map(
                (e) => e.value
              )}
            />
          </Table.Cell>
        </Fragment>
      ));
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, settings]
  );

  if (!settings) return <LoadingSpinner />;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "50% 50%",
        columnGap: "7px",
        rowGap: "5px",
        whiteSpace: "nowrap",
        alignItems: "center",
        height: "450px",
      }}
    >
      <H1>Harvest Column Name</H1>
      <H1>Map from field in Deskpro</H1>
      {fields}
    </div>
  );
};
