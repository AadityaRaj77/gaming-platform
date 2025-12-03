import { useState } from "react";

const ChatInput = ({ onSend, disabled }) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="flex items-center gap-2 border-t border-purple-700/40 p-3 bg-[#0b0b14]">
      <input
        className="flex-1 bg-black border border-purple-700/40 rounded px-3 py-2 text-sm text-white focus:outline-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder="Type your message..."
        disabled={disabled}
      />
      <button
        className="px-4 py-2 bg-linear-to-r from-violet-600 to-red-600 text-white text-sm rounded disabled:opacity-40"
        onClick={handleSend}
        disabled={disabled}
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;
