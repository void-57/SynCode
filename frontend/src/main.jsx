
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { RoomProvider } from "./context/Room.jsx";

createRoot(document.getElementById("root")).render(
  <RoomProvider>
    <App />
  </RoomProvider>,
);
