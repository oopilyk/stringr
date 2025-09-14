export function MessagesSidebar({ conversations, onSelect, activeId }) {
  return (
    <div className="w-80 border-r bg-white flex flex-col">
      <div className="p-4 border-b">
        <input
          placeholder="Search..."
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`flex items-center gap-3 p-4 w-full text-left hover:bg-gray-50 ${
              activeId === c.id ? "bg-green-50 border-l-4 border-green-500" : ""
            }`}
          >
            <img src={c.avatar} alt="" className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-gray-500 truncate">{c.lastMessage}</p>
            </div>
            {c.unread > 0 && (
              <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5">
                {c.unread}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
