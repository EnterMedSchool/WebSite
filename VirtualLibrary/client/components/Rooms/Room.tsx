import React from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useSetRecoilState } from 'recoil';
import { room } from '../../types';
import request from '../../request';
import Primary from '../UI/Buttons/Primary';
import authAtom from '../../atoms/authAtoms';

interface IProps {
  room: room;
}

const Room = ({ room }: IProps) => {
  const { data: session } = useSession();
  const { push } = useRouter();
  const setAuth = useSetRecoilState(authAtom);

  const joinHandler = async () => {
    try {
      const { data } = await request.patch(
        '/users/updateMe',
        {
          lastJoinLink: room.link,
        },
        { headers: { email: session?.user?.email } }
      );
      setAuth(data.data.user);
    } catch (error) {
      console.log(error);
    }
    push(room.link);
  };
  return (
    <li
      className="rounded-md shadow-lg duration-200  
           border border-slate-300  p-7 flex flex-col justify-center items-center"
    >
      <h3 className="text-2xl">{room.title}</h3>
      {/* <span className="mb-2">20:00</span> */}

      <Primary onClick={joinHandler}>Join</Primary>
    </li>
  );
};

export default Room;
