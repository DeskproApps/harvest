import {
  LoadingSpinner,
  useDeskproAppEvents,
  useInitialisedDeskproAppClient,
} from "@deskpro/app-sdk";
import { H1, H4 } from "@deskpro/deskpro-ui";
import { useState } from "react";
import { ISettings } from "../../types/settings";
import { DropdownSelect } from "../../components/DropdownSelect/DropdownSelect";

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

export const Admin = () => {
  const [settings, setSettings] = useState<ISettings | null>(null);
  const [customFields, setCustomFields] = useState<
    {
      fieldName: string;
      label: string;
      value: string;
    }[]
  >([]);

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

  const setSettingsDropdown = (
    deskproField: { key: string; value: string },
    harvestField: { key: string; value: string }
  ) => {
    if (!settings) return;

    const foundFieldUsingValue = Object.entries(settings).find(
      (e) => e[1] === deskproField.value
    );

    if (foundFieldUsingValue) {
      setSettings({
        ...settings,
        [harvestField.value]: deskproField.value,
        [foundFieldUsingValue[0]]: null,
      });
    } else {
      setSettings({
        ...settings,
        [harvestField.value]: deskproField.value,
      });
    }
  };

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
      }}
    >
      <H1>Harvest Column Name</H1>
      <H1>Map from field in Deskpro</H1>
      {harvestFields.map((harvestField) => (
        <>
          <H4>{harvestField.key}</H4>
          <DropdownSelect
            data={[...exampleTicket, ...customFields].map((e) => ({
              key: e.label,
              value: e.fieldName,
            }))}
            onChange={(e) => setSettingsDropdown(e, harvestField)}
            value={settings[harvestField.value as keyof ISettings]}
          />
        </>
      ))}
    </div>
  );
};
