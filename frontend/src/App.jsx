
import "./App.css";
import { useState } from "react";
import JoinRoom from "./components/JoinRoom";
import { useContext } from "react";
import { RoomContext } from "./context/Room";
import EditorView from "./components/EditorView";


function App() {
  const room = useContext(RoomContext);
  
  if (!room.joined) {
    return <JoinRoom />;
  }

  return <EditorView />;
}

export default App;
