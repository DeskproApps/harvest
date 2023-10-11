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

  useDeskproAppEvents(
    {
      onAdminSettingsChange: (e) => {
        !settings && setSettings(JSON.parse(e.field_mapping ?? "{}"));
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
    harvestField: { key: string; value: string },
    deskproField: { label: string; value: string; fieldName: string }
  ) => {
    if (!settings) return;

    const foundFieldUsingValue = Object.entries(settings).find(
      (e) => e[1] === deskproField.value
    );

    if (foundFieldUsingValue) {
      setSettings({
        ...settings,
        [harvestField.value]: deskproField.fieldName,
        [foundFieldUsingValue[0]]: null,
      });
    } else {
      setSettings({
        ...settings,
        [harvestField.value]: deskproField.fieldName,
      });
    }
  };

  if (!settings) return <LoadingSpinner />;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "35% 35% 30%",
        columnGap: "7px",
        rowGap: "5px",
        whiteSpace: "nowrap",
        alignItems: "center",
      }}
    >
      <H1>Column Name</H1>
      <H1>Example Data</H1>
      <H1>Map to field in Harvest</H1>
      {exampleTicket.map((field) => (
        <>
          <H4>{field.label}</H4>
          <H4
            style={{
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {field.value}
          </H4>
          <DropdownSelect
            data={harvestFields}
            onChange={(e) => setSettingsDropdown(e, field)}
            value={
              Object.entries(settings).find(
                (e) => e[1] === field.fieldName
              )?.[0] || undefined
            }
          />
        </>
      ))}
    </div>
  );
};
