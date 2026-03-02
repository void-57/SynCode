import { createContext, useState, useRef, useEffect } from "react";
import io from "socket.io-client";
export const RoomContext = createContext(null);

export const RoomProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [code, setCode] = useState("");
  const [lang, setLang] = useState("js");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const s = io("http://localhost:3000", { autoConnect: false });
    setSocket(s);
    s.on("initialState", ({ users: u, code: c, lang: l }) => {
      setUsers(u || []);
      setCode(c || "");
      setLang(l || "js");
    });
    s.on("userJoined", (u) => setUsers(u || []));
    s.on("codeUpdate", (c) => setCode(c));
    s.on("langUpdate", ({ language }) => setLang(language));

    return () => {
      s.off("initialState");
      s.off("userJoined");
      s.off("codeUpdate");
      s.off("langUpdate");
      s.disconnect();
    };
  }, []);

  const joinRoom = (rId, name) => {
    setRoomId(rId);
    setUserName(name);
    setJoined(true);
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join_room", { roomId: rId, userName: name });
  };
  const leaveRoom = () => {
    if (socket && roomId) {
      socket.emit("leave_room", { roomId });
    }
    setJoined(false);
    setUsers([]);
    setCode("");
    setLang("js");
    setRoomId("");
    setUserName("");
  };
  const sendCode = (c) => {
    setCode(c);
    socket.emit("codeChange", { roomId, code: c });
  };
  const sendLang = (l) => {
    setLang(l);
    socket.emit("langChange", { roomId, language: l });
  };

  return (
    <RoomContext.Provider
      value={{
        socket,
        joined,
        setJoined,
        roomId,
        setRoomId,
        userName,
        setUserName,
        code,
        setCode,
        lang,
        setLang,
        users,
        setUsers,
        joinRoom,
        leaveRoom,
        sendCode,
        sendLang,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
