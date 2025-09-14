'use client'

import { useState } from 'react'
import { Navigation } from "/Users/owenakers/Desktop/Stringr/stringr/apps/web/components/layout/navigation"

const demoConversations = [
  {
    id: '1',
    name: 'Alex Johnson',
    initials: 'AJ',
    avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=34d399&color=fff',
    lastMessage: "Thanks! I'll drop off my racquet tomorrow.",
    unread: 2,
    subtitle: 'College Player',
    messages: [
      { fromMe: false, text: 'Hi! Could you string my racket by tonight?' },
      { fromMe: true, text: "Yes, it will be an extra $5!" },
      { fromMe: false, text: 'Cool! Thanks agian!' },
    ],
  },
  {
    id: '2',
    name: 'Taylor Smith',
    initials: 'TS',
    avatar: 'https://ui-avatars.com/api/?name=Taylor+Smith&background=34d399&color=fff',
    lastMessage: 'What tension do you recommend?',
    unread: 0,
    subtitle: 'Stringing Consultation',
    messages: [
      { fromMe: false, text: 'What tension do you recommend?' },
      { fromMe: true, text: 'I’d suggest 54 lbs for your style.' },
    ],
  },
  {
    id: '3',
    name: 'Jordan Lee',
    initials: 'JL',
    avatar: 'https://ui-avatars.com/api/?name=Jordan+Lee&background=34d399&color=fff',
    lastMessage: 'See you at the courts!',
    unread: 1,
    subtitle: 'Doubles Specialist 😁',
    messages: [
      { fromMe: true, text: 'Looking forward to doubles practice!' },
      { fromMe: false, text: 'See you at the courts!' },
    ],
  },
]

function MessagesSidebar({ conversations, onSelect, activeId }: any) {
  return (
    <div className="w-80 border-r bg-white flex flex-col rounded-l-lg">
      <div className="p-4 border-b">
        <input
          placeholder="Search..."
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((c: any) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`flex items-center gap-3 p-4 w-full text-left hover:bg-gray-50 ${
              activeId === c.id ? 'bg-green-50 border-l-4 border-green-500' : ''
            }`}
          >
            <img
              src={c.avatar}
              alt={c.initials}
              className="w-10 h-10 rounded-full object-cover"
            />
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

function ChatWindow({ conversation }: any) {
  return (
    <div className="flex-1 flex flex-col bg-white rounded-r-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <img
            src={conversation.avatar}
            alt={conversation.initials}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-medium">{conversation.name}</p>
            <p className="text-sm text-gray-500">{conversation.subtitle}</p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg">⋮</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {conversation.messages.map((msg: any, i: number) => (
          <div
            key={i}
            className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg text-sm shadow ${
                msg.fromMe
                  ? 'bg-green-500 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
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

export default function MessagesPage() {
  const [activeId, setActiveId] = useState(demoConversations[0].id)
  const active = demoConversations.find((c) => c.id === activeId)!

  return (
    <div className="flex flex-col min-h-screen">
      {/* Keep the global header */}
      <Navigation />

      {/* Messages layout */}
      <div className="flex flex-1 p-4 bg-gray-50">
        <div className="flex flex-1 bg-white rounded-lg shadow overflow-hidden">
          <MessagesSidebar
            conversations={demoConversations}
            onSelect={setActiveId}
            activeId={activeId}
          />
          <ChatWindow conversation={active} />
        </div>
      </div>
    </div>
  )
}
