export function ChatWindow({ conversation }) {
  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <img src={conversation.avatar} alt="" className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-medium">{conversation.name}</p>
            <p className="text-sm text-gray-500">{conversation.subtitle}</p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg">⋮</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {conversation.messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg text-sm shadow ${
                msg.fromMe
                  ? "bg-green-500 text-white rounded-br-none"
                  : "bg-gray-100 text-gray-800 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t flex items-center gap-2">
        <input
          placeholder="Your message..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
          Send
        </button>
      </div>
    </div>
  )
}
