import React from 'react';
import { user } from '../../types';
import MyAvatar from '../Avatar/Avatar';
interface IProps {
  participant: user;
}

const Participant = ({ participant }: IProps) => {
  return (
    <li className=" flex items-center">
      <span className="mr-2">
        <MyAvatar name="Naeem Hasan" src={participant.photo} />
      </span>
      <h3 className="text-xl">{participant.name}</h3>
    </li>
  );
};

export default Participant;
