import React, { useEffect, useRef } from 'react';
import { useSetRecoilState, useRecoilValue } from 'recoil';
import { FaPaperPlane } from 'react-icons/fa';
import chatAtom from '../../atoms/roomAtoms/chatAtom';
import socket from '../../utils/socket';
import roomAtom from '../../atoms/currRoom';
import authAtom from '../../atoms/authAtoms';
import request from '../../request';

const MessageInput = () => {
  const room = useRecoilValue(roomAtom);
  const auth = useRecoilValue(authAtom);
  const inputRef = useRef<HTMLInputElement>(null);
  const setMessage = useSetRecoilState(chatAtom);
  useEffect(() => {
    socket.on('message', (message) => {
      setMessage((state) => [...state, message]);
    });
    return () => {
      socket.off('message');
    };
  }, [setMessage]);

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef?.current?.value;
    if (!value?.trim()) return;
    const message = {
      message: value,
      session: room._id,
      sender: {
        name: auth?.name,
        photo: auth?.photo,
        _id: auth?._id,
      },
    };
    socket.emit('message', message, room?._id);
    setMessage((state) => [...state, message]);
    if (inputRef.current) inputRef.current.value = '';
    const body = {
      message: value,
      session: room._id,
      sender: auth?._id,
    };
    await request.post('/messages', body);
  };
  return (
    <form onSubmit={onSubmitHandler}>
      <div className="relative">
        <input
          ref={inputRef}
          className="p-2 w-full bg-bg-secondary"
          placeholder="Message"
        />
        <FaPaperPlane className="absolute right-5 top-3 text-col-text" />
      </div>
    </form>
  );
};

export default MessageInput;
