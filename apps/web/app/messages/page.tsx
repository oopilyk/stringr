'use client'

import { useState, useRef, useEffect } from 'react'
import { Navigation } from '@/components/layout/navigation'
import { MessageSquare, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@rally-strings/ui'

const demoConversations = [
  {
    id: '1',
    name: 'Alex Johnson',
    lastMessage: 'Thanks! I’ll drop off my racquet tomorrow.',
    messages: [
      { fromMe: false, text: 'Hey Alex, your string job is ready!' },
      { fromMe: true, text: 'Thanks! I’ll drop off my racquet tomorrow.' },
    ],
  },
  {
    id: '2',
    name: 'Taylor Smith',
    lastMessage: 'What tension do you recommend?',
    messages: [
      { fromMe: false, text: 'What tension do you recommend?' },
      { fromMe: true, text: 'I’d suggest 54 lbs for your style.' },
    ],
  },
  {
    id: '3',
    name: 'Jordan Lee',
    lastMessage: 'See you at the courts!',
    messages: [
      { fromMe: true, text: 'See you at the courts!' },
    ],
  },
]

export default function MessagesPage() {
  const [conversations, setConversations] = useState(demoConversations)
  const [selectedId, setSelectedId] = useState(demoConversations[0].id)
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selected = conversations.find(c => c.id === selectedId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages])

  const handleSend = () => {
    if (!newMessage.trim() || !selected) return

    const updated = conversations.map(c =>
      c.id === selected.id
        ? {
            ...c,
            lastMessage: newMessage,
            messages: [...c.messages, { fromMe: true, text: newMessage }],
          }
        : c
    )
    setConversations(updated)
    setNewMessage('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-lg text-gray-600">View and reply to your conversations.</p>
        </div>

        <div className="flex bg-white rounded-lg shadow overflow-hidden h-[600px]">
          {/* Conversation List */}
          <div className="w-1/3 border-r bg-gray-50 overflow-y-auto">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left px-4 py-4 border-b hover:bg-primary/5 transition ${
                  selectedId === conv.id ? 'bg-primary/10' : ''
                }`}
              >
                <div className="font-semibold text-gray-900">{conv.name}</div>
                <div className="text-sm text-gray-500 truncate">{conv.lastMessage}</div>
              </button>
            ))}
          </div>

          {/* Conversation View */}
          <div className="flex-1 flex flex-col">
            <Card className="flex-1 rounded-none border-0">
              <CardHeader className="border-b">
                <CardTitle>{selected?.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selected?.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`px-4 py-2 rounded-lg max-w-xs ${
                          msg.fromMe
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t p-4 flex items-center space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSend()
                    }}
                  />
                  <Button onClick={handleSend} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4 mr-1" />
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
