import {
  LoadingSpinner,
  useDeskproLatestAppContext,
  useInitialisedDeskproAppClient,
} from "@deskpro/app-sdk";
import { useEffect } from "react";

/*
    Note: the following page component contains example code, please remove the contents of this component before you
    develop your app. For more information, please refer to our apps
    guides @see https://support.deskpro.com/en-US/guides/developers/anatomy-of-an-app
*/
export const Main = () => {
  const { context } = useDeskproLatestAppContext();
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

  if (!context) return <LoadingSpinner />;

  return (
    <iframe
      style={{ width: "100%", height: "100%" }}
      frameBorder="0"
      src={`https://platform.harvestapp.com/platform/timer?app_name=DeskproApp&external_item_name=${encodeURI(
        context.data.ticket.subject
      )}&permalink=https%3A%2F%2Fexample.com%2Fprojects%2F179%2F1337&external_item_id=1337&default_project_code=q4-projects-cleanup&closable=false&chromeless=true`}
    ></iframe>
  );
};
