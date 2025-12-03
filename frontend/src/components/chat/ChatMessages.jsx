import { useEffect, useRef } from "react";

const ChatMessages = ({ messages }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0f0f1a]">
      {messages.map((msg) => (
        <div key={msg.id} className="text-sm">
          <span className="font-semibold text-violet-300">
            {msg.sender.username}
          </span>
          <span className="mx-1 text-white">:</span>
          <span className="text-white">{msg.content}</span>
          <div className="text-[10px] text-white">
            {new Date(msg.createdAt).toLocaleTimeString()}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessages;
