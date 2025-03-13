// src/components/CommunicationPanel.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../state/gameStore';
import useGameTime from '../hooks/useGameTime';

const CommunicationPanel = () => {
  const [activeTab, setActiveTab] = useState('nurse');
  const [message, setMessage] = useState('');
  const chatEndRef = useRef(null);
  
  const attendingChat = useGameStore(state => state.attendingChat);
  const nurseChat = useGameStore(state => state.nurseChat);
  const consultAttending = useGameStore(state => state.consultAttending);
  const communicateWithNurse = useGameStore(state => state.communicateWithNurse);
  const isLoading = useGameStore(state => state.isLoading);
  
  const { formatGameTime } = useGameTime();
  
  // Automatically scroll to the bottom when messages are added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [attendingChat, nurseChat]);
  
  // Handle sending a message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    
    if (activeTab === 'attending') {
      consultAttending(message);
    } else {
      communicateWithNurse(message);
    }
    
    setMessage('');
  };
  
  // Render a message bubble
  const renderMessage = (msg, isUser) => {
    return (
      <div 
        key={`${msg.sender}-${msg.timestamp.getTime()}`} 
        className={`mb-3 flex ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div 
          className={`max-w-[75%] rounded-lg px-3 py-2 ${
            isUser 
              ? 'bg-blue-500 text-white rounded-br-none' 
              : msg.feedback === 'COMPLIMENT'
                ? 'bg-green-100 text-green-800 rounded-bl-none'
                : msg.feedback === 'CRITICISM'
                  ? 'bg-red-100 text-red-800 rounded-bl-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
          <div className="text-xs mt-1 opacity-70 text-right">
            {formatGameTime(msg.timestamp)}
          </div>
        </div>
      </div>
    );
  };
  
  // Get messages for the active tab
  const activeMessages = activeTab === 'attending' ? attendingChat : nurseChat;
  
  return (
    <div className="communication-panel bg-white rounded-lg shadow">
      {/* Tabs for switching between attending and nurse */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-3 font-medium text-sm focus:outline-none ${
            activeTab === 'nurse' 
              ? 'border-b-2 border-green-500 text-green-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('nurse')}
        >
          Nurse Chat
        </button>
        <button
          className={`flex-1 py-3 font-medium text-sm focus:outline-none ${
            activeTab === 'attending' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('attending')}
        >
          Attending Chat
        </button>
      </div>
      
      {/* Message area */}
      <div className="p-4 h-64 overflow-y-auto bg-gray-50">
        {activeMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center">
              {activeTab === 'attending' 
                ? 'No messages with the attending physician yet. Send a message to consult.' 
                : 'No messages with the nurse yet. Send a message to communicate.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeMessages.map((msg) => renderMessage(msg, msg.sender === 'resident'))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={`Message ${activeTab === 'attending' ? 'attending' : 'nurse'}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded font-medium text-white ${
              isLoading || !message.trim() 
                ? 'bg-gray-300 cursor-not-allowed' 
                : activeTab === 'attending' 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-green-600 hover:bg-green-700'
            }`}
            disabled={isLoading || !message.trim()}
          >
            Send
          </button>
        </div>
        
        {/* Helper text */}
        <div className="mt-2 text-xs text-gray-500">
          {activeTab === 'attending' 
            ? 'Consult the attending physician for clinical guidance or treatment decisions.' 
            : 'Communicate with the nurse for updates on patient status or to request assistance.'}
        </div>
      </form>
    </div>
  );
};

export default CommunicationPanel;
