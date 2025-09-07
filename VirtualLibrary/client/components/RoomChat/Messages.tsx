import React, { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import Message from './Message';
import chatAtom from '../../atoms/roomAtoms/chatAtom';
import authAtom from '../../atoms/authAtoms';
import { message } from '../../types';

const Messages = () => {
  const messages = useRecoilValue(chatAtom);
  const auth = useRecoilValue(authAtom);

  useEffect(() => {
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer)
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, [messages]);

  return (
    <ul
      id="messages-container"
      className="h-[500px] p-4 overflow-y-auto flex flex-col gap-4"
    >
      {messages.map((message: message, i) => (
        <Message
          key={i}
          sender={message.sender._id === auth?._id}
          message={message}
        />
      ))}
    </ul>
  );
};

export default Messages;
