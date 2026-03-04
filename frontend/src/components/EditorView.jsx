import { useContext, useEffect, useState } from "react";
import { RoomContext } from "../context/Room";
import Editor from "@monaco-editor/react";

const UserListItem = ({ user, isDark }) => (
  <li
    className={`group flex items-center justify-between p-2 border border-transparent cursor-default transition-all duration-150 ${isDark ? "hover:bg-[#333] hover:border-[#555]" : "hover:bg-white hover:border-black"}`}
  >
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 flex items-center justify-center font-bold text-sm border font-mono-custom transition-all duration-150 hover:bg-[#FF3300] hover:text-white ${isDark ? "border-[#555] bg-[#333] text-gray-200" : "border-black bg-[#e5e7eb] text-black"}`}
      >
        {user && user.name ? user.name.charAt(0).toUpperCase() : "?"}
      </div>
      <div>
        <div
          className={`font-bold text-sm leading-none ${isDark ? "text-gray-200" : "text-black"}`}
        >
          {user && user.name ? user.name : "Unknown"}
        </div>
        <div
          className={`font-mono-custom text-[10px] uppercase ${isDark ? "text-gray-400" : "text-gray-500"}`}
        >
          {user && user.role ? user.role : ""}
        </div>
      </div>
    </div>
    <div
      className={`w-2 h-2 rounded-full ${(user && user.status) === "online" ? "bg-green-500" : "bg-yellow-500"}`}
    />
  </li>
);

const EditorView = () => {
  const room = useContext(RoomContext);
  const { roomId } = room;
  const { socket } = room;
  const [isDark, setIsDark] = useState(true);
  const { code, setCode } = room;
  const { lang, setLang } = room;
  const [activeTab, setActiveTab] = useState("editor");
  const [copied, setCopied] = useState(false);
  const { users, setUsers } = room;
  const [typingUsers, setTypingUsers] = useState([]);
  const [output, setOutput] = useState("");
  const [version, setVersion] = useState("*"); //accepting all versions
  const [isRunning, setIsRunning] = useState(false);
  const [stdin, setStdin] = useState("");
  const [consoleTab, setConsoleTab] = useState("output");
  useEffect(() => {
    if (!socket) return;

    socket.on("initialState", ({ users: u, code: c, lang: l }) => {
      setUsers(u || []);
      setCode(c || "// write your code here");
      setLang(l || "js");
    });

    socket.on("userJoined", (updatedUsers) => {
      setUsers(updatedUsers);
    });

    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });

    socket.on("langUpdate", ({ language }) => {
      setLang(language);
    });

    socket.on("userStartedTyping", ({ userName }) => {
      setTypingUsers((prev) =>
        prev.includes(userName) ? prev : [...prev, userName],
      );
    });

    socket.on("userStoppedTyping", ({ userName }) => {
      setTypingUsers((prev) => prev.filter((name) => name !== userName));
    });

    socket.on("codeResponse", (output) => {
      setOutput(output);
      setIsRunning(false);
    });

    return () => {
      socket.off("initialState");
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("langUpdate");
      socket.off("userStartedTyping");
      socket.off("userStoppedTyping");
      socket.off("codeResponse");
    };
  }, [socket]);
  const toggleDark = () => setIsDark((d) => !d);

  const handleCopy = () => {
    navigator.clipboard.writeText(room.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runCode = () => {
    setIsRunning(true);
    setOutput("");
    socket.emit("compileCode", { roomId, lang, code, version, stdin });
  };

  const handleCodeChange = (value) => {
    const newCode = value ?? "";
    setCode(newCode);
    socket.emit("codeChange", {
      roomId: room.roomId,
      code: newCode,
    });
    socket.emit("startTyping", {
      roomId: room.roomId,
      userName: room.userName,
    });

    clearTimeout(typingTimeout);
    var typingTimeout = setTimeout(() => {
      socket.emit("stopTyping", {
        roomId: room.roomId,
        userName: room.userName,
      });
    }, 2000);
  };
  const langOptions = [
    "JavaScript",
    "TypeScript",
    "Python",
    "Go",
    "Rust",
    "Java",
    "C++",
    "C",
    "Ruby",
  ];
  const langValues = ["js", "ts", "py", "go", "rs", "java", "cpp", "c", "rb"];

  const getMonacoLanguage = (l) => {
    switch (l) {
      case "js":
        return "javascript";
      case "ts":
        return "typescript";
      case "py":
        return "python";
      case "rs":
        return "rust";
      case "c":
        return "c";
      case "rb":
        return "ruby";
      default:
        return l;
    }
  };

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden ${isDark ? "bg-[#1a1a1a]" : "bg-[#F2F2F2]"}`}
    >
      <header
        className={`flex justify-between items-center h-12 md:h-14 px-4 md:px-6 shrink-0 z-20 relative border-b-2 ${
          isDark
            ? "bg-[#1a1a1a] border-[#333] text-[#F2F2F2]"
            : "bg-white border-black text-[#121212]"
        }`}
      >
        <div className="flex items-center gap-2 md:gap-6">
          <div
            className={`font-display font-bold text-xl md:text-2xl uppercase tracking-[-0.05em] ${isDark ? "text-[#F2F2F2]" : "text-[#121212]"}`}
          >
            Syn<span className="text-[#FF3300]">Code</span>
          </div>
          <div
            className={`flex h-6 md:h-8 px-2 md:px-3 items-center gap-1 md:gap-2 border md:border-2 ${
              isDark
                ? "bg-[#2a2a2a] border-[#444]"
                : "bg-[#F2F2F2] border-black"
            }`}
          >
            <label
              className={`hidden md:block font-mono-custom text-[10px] uppercase tracking-widest ${isDark ? "text-[#666]" : "text-gray-500"}`}
            >
              Lang
            </label>
            <div className="relative flex items-center h-full w-16 md:w-32">
              <select
                value={lang}
                onChange={(e) => {
                  setLang(e.target.value);
                  socket.emit("langChange", {
                    roomId: room.roomId,
                    language: e.target.value,
                  });
                }}
                className="absolute inset-0 w-full h-full bg-transparent font-mono-custom text-[11px] md:text-[14px] text-[#FF3300] font-bold border-none outline-none cursor-pointer appearance-none pr-3 md:pr-5"
              >
                {/* On mobile show shorthand, on desktop show full name */}
                {langValues.map((v, i) => (
                  <option
                    key={v}
                    value={v}
                    className={
                      isDark
                        ? "bg-[#1a1a1a] text-[#F2F2F2]"
                        : "bg-[#F2F2F2] text-[#121212]"
                    }
                  >
                    {v.toUpperCase()} {}
                  </option>
                ))}
              </select>
              <div className="flex absolute inset-y-0 right-0 items-center pointer-events-none">
                <svg
                  className="w-2.5 h-2.5 md:w-3 md:h-3 text-[#FF3300]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDark}
            className={`px-2 md:px-3 py-1 md:py-1.5 font-mono-custom text-xs font-bold uppercase transition-all cursor-pointer duration-150 border md:border-2 ${
              isDark
                ? "border-[#444] text-[#ccc] hover:bg-[#F2F2F2] hover:text-[#121212]"
                : "border-black text-[#121212] hover:bg-[#121212] hover:text-white"
            } bg-transparent`}
          >
            {isDark ? "☾" : "☀︎"}
          </button>
          <button
            onClick={() => room.leaveRoom()}
            className={`px-2 md:px-3 py-1 md:py-1.5 font-mono-custom text-[10px] md:text-xs font-bold uppercase transition-all cursor-pointer duration-150 border md:border-2 ${
              isDark
                ? "border-red-900/50 text-[#FF3300] hover:bg-[#FF3300] hover:text-white"
                : "border-red-200 text-[#FF3300] hover:bg-[#FF3300] hover:text-white"
            } bg-transparent`}
          >
            <span className="hidden md:inline">Disconnect</span>
            <span className="md:hidden">Exit</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden flex-col md:flex-row">
        <section
          id="editor-section"
          className={`flex-1 relative flex-col ${activeTab === "editor" ? "flex" : "hidden md:flex"} ${
            isDark ? "bg-[#1e1e1e]" : "bg-white"
          }`}
        >
          {/* Collab / Status Bar */}
          <div
            className={`h-8 flex px-4 items-center justify-between shrink-0 w-full z-10 font-mono-custom text-[10px] border-b ${isDark ? "bg-[#1a1a1a] text-[#aaa] border-[#333]" : "bg-gray-100 text-gray-500 border-gray-200"}`}
          >
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-[#FF3300] mr-2 animate-pulse" />
              {typingUsers.length > 0 ? (
                <span>
                  {typingUsers.join(", ")}{" "}
                  {typingUsers.length === 1 ? "is" : "are"} typing...
                </span>
              ) : (
                <span className="opacity-50 tracking-widest uppercase">
                  Editor Ready
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <Editor
              height="80%"
              language={getMonacoLanguage(lang)}
              theme={isDark ? "vs-dark" : "light"}
              value={code}
              onChange={handleCodeChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "monospace",
                scrollBeyondLastLine: false,
                smoothScrolling: true,
              }}
            />
          </div>

          {/* Console Panel */}
          <div
            className={`shrink-0 flex flex-col border-t-2 h-40 md:h-48 ${isDark ? "border-[#333] bg-[#0d0d0d]" : "border-black bg-[#1a1a1a]"}`}
          >
            {/* Console Header */}
            <div
              className={`flex flex-wrap items-center justify-between px-3 md:px-4 py-1.5 md:h-10 shrink-0 border-b gap-y-1 ${isDark ? "border-[#333]" : "border-[#333]"}`}
            >
              <div className="flex items-center gap-2">
                <span className="hidden md:inline font-mono-custom text-[11px] font-bold uppercase tracking-widest text-[#aaa]">
                  Console
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${isRunning ? "bg-yellow-400 animate-pulse" : "bg-green-500"}`}
                />
                <span
                  className={`font-mono-custom text-[10px] uppercase tracking-widest ${isRunning ? "text-yellow-400" : "text-green-500"}`}
                >
                  {isRunning ? "Running" : "Ready"}
                </span>
                <div className="flex items-center gap-1 ml-1">
                  {["output", "input"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setConsoleTab(tab)}
                      className={`px-2 py-0.5 font-mono-custom text-[10px] uppercase tracking-widest cursor-pointer border transition-colors duration-150 bg-transparent ${
                        consoleTab === tab
                          ? "border-[#FF3300] text-[#FF3300]"
                          : "border-[#444] text-[#555] hover:text-[#aaa] hover:border-[#666]"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className="flex items-center gap-1 px-2.5 py-1 font-mono-custom text-[10px] md:text-[11px] font-bold uppercase tracking-widest bg-[#FF3300] text-white border-none cursor-pointer hover:bg-[#cc2900] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3 2.5l10 5.5-10 5.5V2.5z" />
                  </svg>
                  Run
                </button>
                <button
                  onClick={() => { setOutput(""); setStdin(""); }}
                  className={`px-2.5 py-1 font-mono-custom text-[10px] md:text-[11px] font-bold uppercase tracking-widest cursor-pointer border transition-colors duration-150 bg-transparent ${isDark ? "border-[#444] text-[#aaa] hover:border-[#888] hover:text-white" : "border-[#555] text-[#aaa] hover:border-[#aaa] hover:text-white"}`}
                >
                  Clear
                </button>
              </div>
            </div>
            {/* Console Output / Input */}
            <div className="flex-1 overflow-y-auto">
              {consoleTab === "output" ? (
                <div className="px-3 md:px-4 py-2 md:py-3 h-full">
                  {output ? (
                    <pre className="font-mono-custom text-[11px] md:text-[12px] text-[#e0e0e0] whitespace-pre-wrap m-0">
                      {output}
                    </pre>
                  ) : (
                    <span className="font-mono-custom text-[11px] md:text-[12px] text-[#444] italic">
                      // Output will appear here after running your code
                    </span>
                  )}
                </div>
              ) : (
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter program input (stdin) here..."
                  className="w-full h-full bg-transparent font-mono-custom text-[11px] md:text-[12px] text-[#e0e0e0] placeholder-[#444] resize-none outline-none px-3 md:px-4 py-2 md:py-3 border-none"
                  spellCheck={false}
                />
              )}
            </div>
          </div>
        </section>

        {/* Desktop aside */}
        <aside
          className={`hidden md:flex flex-col shrink-0 w-72 border-l-2 ${
            isDark ? "bg-[#1a1a1a] border-[#333]" : "bg-gray-100 border-black"
          }`}
        >
          <div
            className={`p-6 border-b-2 ${
              isDark ? "border-[#333] bg-[#141414]" : "border-black bg-white"
            }`}
          >
            <label
              className={`font-mono-custom text-[10px] uppercase tracking-widest mb-1 block ${
                isDark ? "text-[#666]" : "text-gray-500"
              }`}
            >
              Room Code
            </label>
            <div className="flex items-center justify-between gap-6">
              <div
                className={`font-display font-bold text-[2.5rem] tracking-[-0.05em] mr-4 ${
                  isDark ? "text-[#F2F2F2]" : "text-[#121212]"
                }`}
              >
                {room.roomId}
              </div>
              <button
                onClick={handleCopy}
                className={`px-3 py-1.5 font-mono-custom text-xs font-bold uppercase transition-all cursor-pointer duration-150 border-2 ${copied ? "bg-[#FF3300] border-[#FF3300] text-white" : isDark ? "border-[#444] text-[#ccc] hover:bg-[#F2F2F2] hover:text-[#121212]" : "border-black text-[#121212] hover:bg-[#121212] hover:text-white"}`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div
            className={`p-6 border-b-2 flex items-center justify-between ${
              isDark ? "border-[#333] bg-[#141414]" : "border-black bg-white"
            }`}
          >
            <label
              className={`font-mono-custom text-[10px] uppercase tracking-widest ${
                isDark ? "text-[#666]" : "text-gray-500"
              }`}
            >
              People Online
            </label>
            <span
              className={`font-mono-custom text-[10px] px-2 py-1 rounded-full ${
                isDark ? "bg-[#333] text-gray-300" : "bg-gray-200 text-gray-700"
              }`}
            >
              {users.length}
            </span>
          </div>
          <div
            className={`flex-1 p-6 overflow-y-auto ${
              isDark ? "bg-[#1a1a1a]" : "bg-transparent"
            }`}
          >
            <ul className="list-none p-0 m-0 space-y-3">
              {users.map((u, i) => (
                <UserListItem key={i} user={u} isDark={isDark} />
              ))}
            </ul>
          </div>
        </aside>

        {/* Mobile collab panel */}
        <div
          className={`flex-col flex-1 overflow-hidden md:hidden ${
            activeTab === "collab" ? "flex" : "hidden"
          } ${isDark ? "bg-[#1a1a1a]" : "bg-gray-100"}`}
        >
          <div
            className={`p-5 border-b-2 ${isDark ? "bg-[#141414] border-[#333]" : "bg-white border-black"}`}
          >
            <label
              className={`font-mono-custom text-[10px] uppercase tracking-widest mb-1 block ${isDark ? "text-[#666]" : "text-gray-500"}`}
            >
              Active Channel
            </label>
            <div className="flex items-center justify-between gap-6 w-full">
              <div
                className={`font-display font-bold text-[2.5rem] tracking-[-0.05em] mr-4 truncate ${
                  isDark ? "text-[#F2F2F2]" : "text-[#121212]"
                }`}
              >
                {room.roomId}
              </div>
              <button
                onClick={handleCopy}
                className={`shrink-0 px-3 py-1.5 font-mono-custom text-xs font-bold cursor-pointer uppercase transition-all duration-150 border-2 ${copied ? "bg-[#FF3300] border-[#FF3300] text-white" : isDark ? "border-[#444] text-[#ccc] hover:bg-[#F2F2F2] hover:text-[#121212]" : "border-black text-[#121212] hover:bg-[#121212] hover:text-white"}`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div
            className={`p-5 border-b-2 flex items-center justify-between ${isDark ? "bg-[#141414] border-[#333]" : "bg-white border-black"}`}
          >
            <label
              className={`font-mono-custom text-[10px] uppercase tracking-widest ${isDark ? "text-[#666]" : "text-gray-500"}`}
            >
              People Online
            </label>
            <span
              className={`font-mono-custom text-[10px] px-2 py-1 rounded-full ${isDark ? "bg-[#333] text-gray-300" : "bg-gray-200 text-gray-700"}`}
            >
              {users.length}
            </span>
          </div>
          <div
            className={`flex-1 p-5 overflow-y-auto ${isDark ? "bg-[#1a1a1a]" : "bg-transparent"}`}
          >
            <ul className="list-none p-0 m-0 space-y-3">
              {users.map((u, i) => (
                <UserListItem key={i} user={u} isDark={isDark} />
              ))}
            </ul>
          </div>
        </div>

        {/* Mobile settings panel */}
        <div
          className={`flex-col flex-1 overflow-hidden md:hidden ${
            activeTab === "channel" ? "flex" : "hidden"
          } ${isDark ? "bg-[#1a1a1a]" : "bg-gray-100"}`}
        >
          <div
            className={`p-5 border-b-2 ${isDark ? "bg-[#141414] border-[#333]" : "bg-white border-black"}`}
          >
            <label
              className={`font-mono-custom text-[10px] uppercase tracking-widest mb-2 block ${isDark ? "text-[#666]" : "text-gray-500"}`}
            >
              Language
            </label>
            <div className="relative w-full">
              <select
                value={lang}
                onChange={(e) => {
                  setLang(e.target.value);
                  socket.emit("langChange", {
                    roomId: room.roomId,
                    language: e.target.value,
                  });
                }}
                className={`border-2 font-mono-custom text-[14px] text-[#FF3300] font-bold py-2 px-3 w-full outline-none cursor-pointer appearance-none ${isDark ? "bg-[#2a2a2a] border-[#444]" : "bg-[#F2F2F2] border-black"}`}
              >
                {langValues.map((v, i) => (
                  <option
                    key={v}
                    value={v}
                    className={
                      isDark ? "bg-[#1a1a1a] text-white" : "bg-white text-black"
                    }
                  >
                    {langOptions[i]}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-[#FF3300]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div
            className={`p-5 border-b-2 flex items-center justify-between ${isDark ? "bg-[#141414] border-[#333]" : "bg-white border-black"}`}
          >
            <span
              className={`font-mono-custom text-xs uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Dark Mode
            </span>
            <button
              onClick={toggleDark}
              className={`border-2 py-1.5 px-3 font-mono-custom text-xs font-bold uppercase cursor-pointer bg-transparent transition-all duration-150 ${isDark ? "border-[#444] text-[#ccc] hover:bg-[#F2F2F2] hover:text-[#121212]" : "border-black text-[#121212] hover:bg-[#121212] hover:text-white"}`}
            >
              {isDark ? "☾" : "☀︎"}
            </button>
          </div>
          <div
            className={`p-5 mt-auto ${isDark ? "bg-[#1a1a1a]" : "bg-gray-100"}`}
          >
            <button
              onClick={() => room.leaveRoom()}
              className={`font-display font-bold uppercase w-full border-2 text-lg tracking-widest p-4 cursor-pointer transition-colors duration-150 hover:bg-[#FF3300] hover:text-white hover:border-[#FF3300] ${isDark ? "bg-[#333] border-[#444] text-white" : "bg-[#121212] border-black text-white"}`}
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Mobile tab bar */}
        <nav
          className={`shrink-0 border-t-2 flex md:hidden w-full pb-safe ${isDark ? "bg-[#1a1a1a] border-[#333]" : "bg-white border-black"}`}
        >
          {[
            { id: "editor", icon: "⌨", label: "Editor" },
            { id: "collab", icon: "👥", label: "Collab" },
            { id: "channel", icon: "⚙", label: "Settings" },
          ].map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 font-mono-custom text-xs uppercase tracking-widest border-none flex-col justify-center items-center cursor-pointer transition-all duration-150 ${
                i > 0
                  ? isDark
                    ? "border-l-2 border-[#333]"
                    : "border-l-2 border-black"
                  : ""
              } ${
                activeTab === tab.id
                  ? isDark
                    ? "bg-[#141414] text-[#FF3300] shadow-[inset_0_2px_0_0_#FF3300]"
                    : "bg-white text-[#FF3300] shadow-[inset_0_2px_0_0_#FF3300]"
                  : isDark
                    ? "bg-[#141414] text-gray-500 hover:text-white"
                    : "bg-white text-gray-500 hover:text-black"
              }`}
            >
              <div className="text-base mb-0.5">{tab.icon}</div>
              {tab.label}
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};
export default EditorView;
