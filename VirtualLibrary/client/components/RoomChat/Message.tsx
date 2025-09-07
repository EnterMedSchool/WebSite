import React from 'react';
import { message } from '../../types';
import MyAvatar from '../Avatar/Avatar';
interface IProps {
  sender?: boolean;
  message: message;
}

const Message = ({ sender, message }: IProps) => {
  const classesLi = sender ? 'flex justify-end gap-3' : 'flex gap-3';
  const classesAvatar = sender ? 'order-2' : '';
  const classesP = sender
    ? `ml-1  text-lg p-2 rounded-2xl  bg-primary text-white`
    : 'ml-1 text-lg p-2 rounded-2xl bg-bg-secondary text-col-text';
  return (
    <li className={classesLi}>
      <span className={classesAvatar}>
        <MyAvatar name={message?.sender?.name} src={message?.sender?.photo} />
      </span>

      <p className={classesP}>{message?.message}</p>
    </li>
  );
};

export default Message;
