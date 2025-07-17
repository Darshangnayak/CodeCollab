import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";
import { v4 as uuidv4 } from "uuid";
import { Toaster, toast } from "react-hot-toast";

const socket = io("http://localhost:5000"); // Ensure this matches your server URL

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Start coding here...");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [output, setOutput] = useState("");
  // Removed 'version' state as it's not dynamic in the UI and can be hardcoded or managed by the language selector if needed
  // For now, let's keep it simple and assume the server uses a default/latest version for the chosen language.
  // If specific versions are needed, you'd add a selector for them in the UI and pass it.

  // Ref to store the latest code to prevent stale closures in socket events
  const codeRef = useRef(code);
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Socket.io event listeners
  useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });

    socket.on("codeupdate", (updatedCode) => {
      // Only update code if it's different from current to avoid unnecessary re-renders
      if (codeRef.current !== updatedCode) {
        setCode(updatedCode);
      }
    });

    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 10)}${user.length > 10 ? "..." : ""} is typing...`);
      // Clear typing indicator after a short delay
      const typingTimeout = setTimeout(() => setTyping(""), 2000);
      return () => clearTimeout(typingTimeout); // Cleanup on re-render or component unmount
    });

    socket.on("languageupdate", (newLanguage) => {
      setLanguage(newLanguage);
      toast.success(`Language changed to ${newLanguage}`);
    });

    socket.on("codeResponse", (response) => {
      setOutput(response.output || "No output available");
    });

    // Cleanup function for socket listeners
    return () => {
      socket.off("userJoined");
      socket.off("codeupdate");
      socket.off("userTyping");
      socket.off("languageupdate");
      socket.off("codeResponse");
    };
  }, []); // Empty dependency array ensures these are set up once on mount

  // Handle leaving room when tab/window is closed
  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const joinRoom = () => {
    if (!roomId || !userName) {
      toast.error("Username and Room ID are required!");
    } else {
      socket.emit("join", { roomId, userName });
      setJoined(true);
      toast.success("Joined the room successfully!");
    }
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("// Start coding here...");
    setLanguage("javascript");
    setUsers([]);
    setOutput(""); // Clear output on leaving room
    toast("Left the room.", { icon: '👋' });
  };

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidv4();
    setRoomId(id);
    toast.success("Created a new room! Copy the ID.");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success("Room ID copied to clipboard!");
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("codechange", { roomId, code: newCode });
    socket.emit("typing", { roomId, userName });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languagechange", { roomId, language: newLanguage });
  };

  const runCode = () => {
    // You might want to map language to a default version for piston API or let the API pick
    // For simplicity, using a common version for now. Piston API often defaults to latest.
    let version = "*"; // Piston API often uses '*' for latest stable or a specific version like '1.8.0' for Python.
    if (language === 'javascript') version = '18.15.0'; // Example Node.js version
    else if (language === 'python') version = '3.10.0'; // Example Python version
    else if (language === 'c') version = '10.2.0'; // Example GCC version
    else if (language === 'java') version = '15.0.2'; // Example Java version

    socket.emit("compilecode", { code, roomId, language, version });
    toast('Compiling code...', { icon: '⚙️' });
  };

  if (!joined) {
    return (
      <div className="join-container">
        <Toaster position="top-center" />
        <div className="join-form">
          <img src="/phasemajor.jpg" alt="CodeCollab Logo" /> {/* Updated path for public folder */}
          <h1>Welcome to CodeCollab</h1>
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <p className="create-room-text">
            &nbsp;If you don't have an invite, <a href="#" onClick={createNewRoom}>create a new room</a>
          </p>
          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page">
      <Toaster position="top-center" />
      <div className="sidebar">
        <div className="sidebar-header">
          <img src="/phasemajor.jpg" alt="CodeCollab Logo" className="sidebar-logo" />
          <h2 className="room-id-display">Room ID: {roomId.slice(0, 8)}...</h2>
          <button onClick={copyRoomId} className="btn btn-copy">
            Copy ID
          </button>
        </div>

        <div className="users-panel">
          <h3>Users in Room:</h3>
          <ul className="users-list">
            {users.map((user, index) => (
              <li key={index}>
                <span className="user-avatar">{user.charAt(0).toUpperCase()}</span>
                {user}
              </li>
            ))}
          </ul>
          <p className="typing-indicator">{typing}</p>
        </div>

        <div className="controls-panel">
          <select
            className="language-selector"
            value={language}
            onChange={handleLanguageChange}
          >
            <option value="javascript">JavaScript</option>
            <option value="c">C</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
          </select>
          <button className="btn btn-run" onClick={runCode}>
            Run Code
          </button>
          <button className="btn btn-leave" onClick={leaveRoom}>
            Leave Room
          </button>
        </div>
      </div>

      <div className="editor-and-output">
        <Editor
          height="calc(100% - 200px - 20px)" 
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 16, // Slightly larger font for better readability
            scrollBeyondLastLine: false,
            // Additional options for a cleaner look
            lineNumbers: "on",
            wordWrap: "on",
            // readOnly: false, // Set to true to make editor read-only
          }}
        />
        <div className="output-area">
          <h3>Output:</h3>
          <textarea
            className="output-console"
            value={output}
            readOnly
            placeholder="Output will appear here..."
          />
        </div>
      </div>
    </div>
  );
};

export default App;