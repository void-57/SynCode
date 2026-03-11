import React, { useState, useEffect, useRef, useContext } from "react";
import { RoomContext } from "../context/Room";
import { FaGithub } from "react-icons/fa";

const UserItem = ({ user, isDark }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <li
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group flex items-center justify-between p-2 border transition-all cursor-default ${hovered ? (isDark ? "bg-[#2a2a2a] border-black" : "bg-white border-black") : "bg-transparent border-transparent"}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 flex items-center justify-center font-bold font-mono text-sm border border-black transition-colors ${hovered ? "bg-[#FF3300] text-white" : isDark ? "bg-[#333] text-[#ccc]" : "bg-[#e5e7eb] text-black"}`}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div
            className={`font-bold text-sm leading-none ${isDark ? "text-[#eee]" : "text-black"}`}
          >
            {user.name}
          </div>
          <div className="font-mono-custom uppercase text-[10px] text-[#6b7280]">
            {user.role}
          </div>
        </div>
      </div>
      <div
        className={`w-2 h-2 rounded-full ${user.status === "online" ? "bg-[#22c55e]" : "bg-[#eab308]"}`}
      />
    </li>
  );
};

const JoinRoom = () => {
  const room = useContext(RoomContext);
  const [isDark, setIsDark] = useState(true);
  const [connectState, setConnectState] = useState("READY");
  const [isConnecting, setIsConnecting] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [nameError, setNameError] = useState("");
  const [roomError, setRoomError] = useState("");

  useEffect(() => {
    if (room.joined) {
      setConnectState("CONNECTED");
    }
  }, [room.joined]);

  const toggleDark = () => setIsDark((prev) => !prev);
  const handleNameChange = (e) => {
    const val = e.target.value.replace(/\s/g, "");
    if (val.length > 10) {
      setNameError("Max 10 characters");
      room.setUserName(val.slice(0, 10));
    } else {
      setNameError("");
      room.setUserName(val);
    }
  };

  const handleRoomChange = (e) => {
    const val = e.target.value.replace(/\s/g, "");
    if (val.length > 8) {
      setRoomError("Max 8 characters");
      room.setRoomId(val.slice(0, 8));
    } else {
      setRoomError("");
      room.setRoomId(val);
    }
  };

  const joinRoom = () => {
    let valid = true;
    if (!room.userName) {
      setNameError("Name is required");
      valid = false;
    }
    if (!room.roomId) {
      setRoomError("Room code is required");
      valid = false;
    }
    if (!valid || isConnecting) return;
    if (room.roomId && room.userName && !isConnecting) {
      setIsConnecting(true);
      setConnectState("CONNECTING");

      const steps = [
        "INITIALIZING WS CLIENT...",
        "NEGOTIATING ROOM ID...",
        "SYNCING DOCUMENT STATE...",
        "ESTABLISHING PEERS...",
      ];

      let stepIndex = 0;
      setLoadingText(steps[0]);

      const interval = setInterval(() => {
        stepIndex++;
        if (stepIndex <= steps.length - 1) {
          setLoadingText(steps[stepIndex]);
        }
      }, 500);

      setTimeout(() => {
        clearInterval(interval);
        setConnectState("CONNECTED");

        setTimeout(() => {
          room.joinRoom(room.roomId, room.userName);
        }, 500);
      }, 2000);
    }
  };
  return (
    <div
      className={`flex flex-col min-h-screen w-full relative transition-colors duration-200 overflow-hidden ${
        isDark ? "bg-[#1a1a1a] text-white" : "bg-white text-black"
      }`}
    >
      <div className="absolute top-0 right-0 w-full md:w-[60%] h-full pointer-events-none overflow-hidden flex items-center justify-end z-0">
        <div
          className="absolute inset-0 transition-opacity duration-1000 pointer-events-none"
          style={{
            background: isDark
              ? "radial-gradient(circle at 70% 50%, rgba(255, 51, 0, 0.05) 0%, transparent 70%)"
              : "radial-gradient(circle at 70% 50%, rgba(255, 51, 0, 0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.15] md:opacity-[0.2]"
          style={{
            backgroundImage: `radial-gradient(circle at center, ${isDark ? "#ffffff" : "#000000"} 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 80%)",
            maskImage: "linear-gradient(to right, transparent, black 80%)",
          }}
        />
        <pre
          className={`font-mono-custom text-[8px] md:text-sm md:font-bold opacity-[0.03] md:opacity-[0.04] whitespace-pre select-none tracking-widest leading-loose transform rotate-[-4deg] scale-[1.5] translate-x-1/4 translate-y-12 transition-colors ${isDark ? "text-white" : "text-black"}`}
        >
          {`// [SYSTEM] initializing virtual DOM...
import { createPeerConnection } from '@syncode/net';
import { EditorState } from 'prosemirror-state';

async function bootstrap() {
  const peer = await createPeerConnection({
    iceServers: [ { urls: 'stun:stun.l.google.com:19302' } ],
    latency: 'low'
  });
  
  peer.on('stream', (packet) => {
    processIncomingBuffer(packet);
    updateReplicationState();
  });

  return peer.mount();
}`}
        </pre>
      </div>
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <a
          href="https://github.com/void-57"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center px-3 py-1.5 border-2 rounded transition-all ${
            isDark
              ? "border-[#444] text-[#ccc] bg-transparent hover:bg-white hover:text-black"
              : "border-black text-black bg-transparent hover:bg-black hover:text-white"
          }`}
          aria-label="GitHub Profile"
        >
          <FaGithub size={16} />
        </a>
        <button
          onClick={toggleDark}
          className={`px-3 py-1.5 text-xs font-bold border-2 rounded transition-all cursor-pointer ${
            isDark
              ? "border-[#444] text-[#ccc] bg-transparent hover:bg-white hover:text-black"
              : "border-black text-black bg-transparent hover:bg-black hover:text-white"
          }`}
        >
          {isDark ? "☾" : "☀︎"}
        </button>
      </div>

      <div className="grow flex flex-col justify-center px-8 md:px-16 lg:px-24 z-10 relative">
        <div className="mb-4 flex items-center gap-4">
          <span className="px-2 py-1 font-mono-custom text-xs uppercase tracking-widest bg-[#121212] text-white">
            System v1.0
          </span>
          <span
            className={`font-mono-custom text-xs uppercase tracking-widest transition-colors ${connectState === "CONNECTED" ? "text-[#22c55e]" : connectState === "CONNECTING" ? "animate-pulse text-[#eab308]" : "animate-pulse text-[#FF3300]"}`}
          >
            ● {connectState}
          </span>
        </div>

        <h1 className="font-display font-bold tracking-tighter uppercase select-none text-[18vw] leading-[0.8]">
          Syn<span className="text-[#FF3300]">code</span>
        </h1>

        <p className="font-mono-custom text-lg md:text-xl mt-4 max-w-2xl pl-6 py-2 border-l-4 border-[#FF3300]">
          Realtime collaborative development environment.
          <br />
          Establish secure connection to proceed.
        </p>
      </div>

      <div
        className={`h-auto md:h-32 flex flex-col md:flex-row items-stretch border-t-2 border-black min-h-32 ${
          isDark ? "bg-[#121212] text-white" : "bg-gray-100 text-black"
        }`}
      >
        <div className="md:hidden overflow-hidden border-t-2 border-b-2 border-black bg-[#FF3300] text-white py-2">
          <div className="marquee-track font-mono-custom text-[11px]">
            {[
              "◆ REALTIME CODE",
              "—",
              "WS CONNECTION",
              "—",
              "LIVE CURSORS",
              "—",
              "SYNCHRONIZING",
              "—",
              "◆ REALTIME CODE",
              "—",
              "WS CONNECTION",
              "—",
              "LIVE CURSORS",
              "—",
              "SYNCHRONIZING",
              "—",
            ].map((t, i) => (
              <span
                key={i}
                className={`px-4 ${t === "—" ? "opacity-40" : "opacity-100"}`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center transition-colors group border-b border-[#1f2937] hover:bg-[#111827] duration-200 focus-within:border-[#FF3300] bg-[#141414] text-white">
          <label className="font-mono-custom text-[11px] text-[#6b7280] group-focus-within:text-[#FF3300] uppercase tracking-[0.15em] block mb-2">
            Name
          </label>
          <input
            type="text"
            value={room.userName}
            onChange={handleNameChange}
            placeholder="void57"
            className="font-mono-custom bg-transparent text-[1.5rem] text-white border-none outline-none w-full placeholder-[#4b5563]"
          />
          {nameError && (
            <span className="font-mono-custom text-[10px] text-[#FF3300] uppercase tracking-widest mt-1">
              {nameError}
            </span>
          )}
        </div>

        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center transition-colors border-b border-[#1f2937] hover:bg-[#111827] duration-200 focus-within:border-[#FF3300] group bg-[#141414] text-white">
          <label className="font-mono-custom text-[11px] text-[#6b7280] group-focus-within:text-[#FF3300] uppercase tracking-[0.15em] block mb-2">
            Room Code
          </label>
          <div className="flex items-center">
            <span className="mr-2 text-[#4b5563] font-mono-custom">#</span>
            <input
              type="text"
              value={room.roomId}
              onChange={handleRoomChange}
              placeholder="180301"
              className="font-mono-custom bg-transparent text-[1.5rem] text-white border-none outline-none w-full placeholder-[#4b5563]"
            />
          </div>
          {roomError && (
            <span className="font-mono-custom text-[10px] text-[#FF3300] uppercase tracking-widest mt-1">
              {roomError}
            </span>
          )}
        </div>

        <button
          onClick={joinRoom}
          disabled={isConnecting}
          className={`w-full py-6 md:w-64 flex items-center justify-center gap-4 group transition-all cursor-pointer duration-300 text-white font-bold uppercase ${
            room.joined || isConnecting
              ? "bg-[#cc2900] cursor-not-allowed"
              : "bg-[#FF3300] hover:bg-white hover:text-[#121212]"
          }`}
        >
          {isConnecting ? (
            <div className="flex items-center gap-3 font-mono-custom text-[10px] md:text-xs tracking-widest px-4 w-full justify-center">
              <svg
                className="animate-spin h-4 w-4 text-white shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-left w-36 md:w-44 truncate">
                {loadingText}
              </span>
            </div>
          ) : (
            <>
              <span className="font-display text-[1.5rem] tracking-widest">
                Connect
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 transform group-hover:translate-x-1 transition-transform shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default JoinRoom;
