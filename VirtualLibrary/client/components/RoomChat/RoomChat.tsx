import React from 'react';
import Messages from './Messages';
import MessageInput from './MessageInput';

const RoomChat = () => {
  return (
    <div className="shadow flex-[20%] border-gray-light rounded-md border">
      <h2 className="p-4 mb-3 text-lg py-3 bg-bg-secondary">Room Chat</h2>
      <Messages />
      <MessageInput />
    </div>
  );
};

export default RoomChat;
