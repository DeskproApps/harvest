import {
  LoadingSpinner,
  useDeskproLatestAppContext,
  useInitialisedDeskproAppClient,
} from "@deskpro/app-sdk";
import { useEffect, useMemo } from "react";
import { ticketAccessor } from "../utils/utils";
import { ContextData, ContextSettings } from "../types/context";

/*
    Note: the following page component contains example code, please remove the contents of this component before you
    develop your app. For more information, please refer to our apps
    guides @see https://support.deskpro.com/en-US/guides/developers/anatomy-of-an-app
*/
export const Main = () => {
  const { context } = useDeskproLatestAppContext<ContextData, ContextSettings>();
  useInitialisedDeskproAppClient((client) => {
    client.registerElement("refresh", {
      type: "refresh_button",
    });
  });

  useEffect(() => {
    window.addEventListener("message", function (event) {
      if (event.origin != "https://platform.harvestapp.com") {
        return;
      }

      if (event.data.type == "frame:resize") {
        (document.querySelector("iframe") as HTMLIFrameElement).style.height =
          event.data.value + "px";
      }
    });
  });

  const urlSearchParams = useMemo(
    () =>
      new URLSearchParams(
        context?.settings && context.data
          ? {
              app_name: "DeskproApp",
              external_item_id: context?.data.ticket.id,
              permalink: window.location.href,
              ...ticketAccessor(
                context?.data.ticket,
                JSON.parse(context?.settings.field_mapping ?? "{}")
              ),
            }
          : {}
      ).toString(),
    [context]
  );

  if (!context) return <LoadingSpinner />;

  return (
    <iframe
      style={{ width: "100%", height: "100%" }}
      frameBorder="0"
      src={`https://platform.harvestapp.com/platform/timer?${urlSearchParams}`}
    ></iframe>
  );
};
