import "@deskpro/deskpro-ui/dist/deskpro-ui.css";
import "@deskpro/deskpro-ui/dist/deskpro-custom-icons.css";
import { DeskproAppProvider } from "@deskpro/app-sdk";
import { Main } from "./pages/Main";
import { Admin } from "./pages/Admin/Admin";
import { HashRouter, Route, Routes } from "react-router-dom";

function App() {
  return (
    <DeskproAppProvider>
      <HashRouter>
        <Routes>
          <Route path="/">
            <Route index element={<Main />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </HashRouter>
    </DeskproAppProvider>
  );
}

export default App;
