'use client'

import { useState, useEffect, useRef } from 'react'
import { Navigation } from '@/components/layout/navigation'
import { createClient } from '@/lib/supabase'
import { Loader2, Send, Search } from 'lucide-react'
import { Button } from '@stringerly/ui'

interface ConversationListItem {
  id: string
  otherUser: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  updatedAt: string
}

interface Message {
  id: string
  body: string
  fromMe: boolean
  senderId: string
  createdAt: string
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  if (diffInSeconds < 604800) {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function MessagesSidebar({
  conversations,
  onSelect,
  activeId,
  isLoading
}: {
  conversations: ConversationListItem[]
  onSelect: (id: string) => void
  activeId: string | null
  isLoading: boolean
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = conversations.filter(c =>
    c.otherUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="w-80 bg-gray-50 flex flex-col border-r border-gray-200">
        <div className="p-4 bg-white border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Search"
              className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="w-80 bg-gray-50 flex flex-col border-r border-gray-200">
        <div className="p-4 bg-white border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Search"
              className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-gray-500">No conversations yet.<br />Start messaging someone from their profile!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-gray-50 flex flex-col border-r border-gray-200">
      <div className="p-4 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((c) => {
          const avatarUrl = c.otherUser?.avatar_url || '/default-avatar.png'
          const isActive = activeId === c.id

          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`flex items-center gap-3 p-3 w-full text-left hover:bg-gray-100 transition-colors ${
                isActive ? 'bg-gray-200' : 'bg-white'
              } border-b border-gray-100`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={avatarUrl}
                  alt={c.otherUser?.full_name || 'User'}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {c.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">{c.unreadCount}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-900 truncate">{c.otherUser?.full_name || 'Unknown User'}</p>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatTime(c.lastMessageTime || c.updatedAt)}
                  </span>
                </div>
                <p className={`text-sm truncate ${c.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  {c.lastMessage}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ChatWindow({
  conversationId,
  conversation,
  messages,
  onSendMessage,
  isLoadingMessages
}: {
  conversationId: string
  conversation: ConversationListItem | null
  messages: Message[]
  onSendMessage: (body: string) => Promise<void>
  isLoadingMessages: boolean
}) {
  const [messageInput, setMessageInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
    // Auto-focus input when conversation changes
    inputRef.current?.focus()
  }, [messages, conversationId])

  const handleSend = async () => {
    if (!messageInput.trim() || isSending) return

    setIsSending(true)
    try {
      await onSendMessage(messageInput.trim())
      setMessageInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-gray-500 text-lg font-medium">Select a conversation</p>
          <p className="text-gray-400 text-sm mt-1">Choose a conversation to start messaging</p>
        </div>
      </div>
    )
  }

  const avatarUrl = conversation.otherUser?.avatar_url || '/default-avatar.png'

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = []
  messages.forEach((msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const lastGroup = groupedMessages[groupedMessages.length - 1]
    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(msg)
    } else {
      groupedMessages.push({ date, messages: [msg] })
    }
  })

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header - Apple Messages style */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200 bg-gray-50">
        <img
          src={avatarUrl}
          alt={conversation.otherUser?.full_name || 'User'}
          className="w-10 h-10 rounded-full object-cover mr-3"
        />
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{conversation.otherUser?.full_name || 'Unknown User'}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
      </div>

      {/* Messages - Apple Messages style */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-white">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {groupedMessages.map((group, groupIdx) => (
              <div key={groupIdx}>
                {/* Date divider */}
                <div className="flex items-center justify-center my-4">
                  <div className="px-3 py-1 bg-gray-100 rounded-full">
                    <p className="text-xs text-gray-500 font-medium">{group.date}</p>
                  </div>
                </div>

                {/* Messages for this date */}
                {group.messages.map((msg, idx) => {
                  const showTime = idx === 0 ||
                    (idx > 0 && new Date(msg.createdAt).getTime() - new Date(group.messages[idx - 1].createdAt).getTime() > 300000) // 5 minutes

                  return (
                    <div key={msg.id} className="mb-2">
                      <div className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md ${msg.fromMe ? 'ml-12' : 'mr-12'}`}>
                          <div
                            className={`px-4 py-2 rounded-2xl shadow-sm ${
                              msg.fromMe
                                ? 'bg-blue-500 text-white rounded-br-sm'
                                : 'bg-gray-200 text-gray-900 rounded-bl-sm'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                          </div>
                          {showTime && (
                            <p className={`text-xs text-gray-400 mt-1 ${msg.fromMe ? 'text-right' : 'text-left'}`}>
                              {formatMessageTime(msg.createdAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input - Apple Messages style */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <input
              ref={inputRef}
              placeholder="iMessage"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className="w-full text-sm focus:outline-none disabled:opacity-50 bg-transparent"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!messageInput.trim() || isSending}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              messageInput.trim() && !isSending
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const supabase = createClient()

  // Fetch conversations on mount, then check URL parameter
  useEffect(() => {
    const loadConversations = async () => {
      // Check for conversation parameter in URL first
      const params = new URLSearchParams(window.location.search)
      const conversationParam = params.get('conversation')

      // Initial fetch
      await fetchConversations()

      // If there's a conversation parameter, set it as active
      if (conversationParam) {
        setActiveConversationId(conversationParam)

        // Give a moment for any newly created conversation to be visible
        // Then refetch to ensure we have the latest data
        setTimeout(async () => {
          await fetchConversations()
        }, 500)
      }
    }

    loadConversations()
  }, [])

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId)
    }
  }, [activeConversationId])

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!activeConversationId) return

    const channel = supabase
      .channel(`conversation:${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`
        },
        async (payload) => {
          const newMessage = payload.new as any

          // Get current user to determine if message is from me
          const { data: { user } } = await supabase.auth.getUser()

          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev

            return [
              ...prev,
              {
                id: newMessage.id,
                body: newMessage.body,
                fromMe: newMessage.sender_id === user?.id,
                senderId: newMessage.sender_id,
                createdAt: newMessage.created_at
              }
            ]
          })

          // Refresh conversations to update last message
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConversationId])

  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true)
      const response = await fetch('/api/conversations')
      const data = await response.json()

      if (response.ok) {
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      setIsLoadingMessages(true)
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      const data = await response.json()

      if (response.ok) {
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const handleSendMessage = async (body: string) => {
    if (!activeConversationId) return

    const response = await fetch(`/api/conversations/${activeConversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body })
    })

    if (response.ok) {
      const data = await response.json()
      setMessages((prev) => [...prev, data.message])

      // Refresh conversations to update last message
      fetchConversations()
    } else {
      throw new Error('Failed to send message')
    }
  }

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages layout - Apple Messages style */}
        <div className="flex bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200" style={{ height: 'calc(100vh - 180px)' }}>
          <MessagesSidebar
            conversations={conversations}
            onSelect={setActiveConversationId}
            activeId={activeConversationId}
            isLoading={isLoadingConversations}
          />
          <ChatWindow
            conversationId={activeConversationId || ''}
            conversation={activeConversation}
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoadingMessages={isLoadingMessages}
          />
        </div>
      </div>
    </div>
  )
}
