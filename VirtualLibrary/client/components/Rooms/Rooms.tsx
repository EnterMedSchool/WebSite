import React from 'react';

import Spinner from '../UI/Spinner/Spinner';
import { room } from '../../types';

import Room from './Room';

interface IProps {
  rooms: room[];
  loading?: boolean;
  errorMsg?: string;
}

const Rooms = ({ rooms, loading, errorMsg }: IProps) => {
  if (errorMsg)
    return <h3 className="text-center text-2xl text-red-200">{errorMsg}</h3>;
  if (loading)
    return (
      <div className="flex justify-center mt-10">
        <Spinner w={100} />
      </div>
    );
  return (
    <ul className=" list-none gap-3 flex flex-wrap justify-center">
      {rooms.map((room: room) => (
        <Room key={room._id} room={room} />
      ))}
    </ul>
  );
};

export default Rooms;
