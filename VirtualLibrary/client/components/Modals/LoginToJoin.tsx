import React from 'react';
import { signIn } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';
import MyAvatar from '../Avatar/Avatar';

const LoginToJoin = ({ room }: { room: any }) => {
  return (
    <div
      className="flex items-center fixed top-0 left-0 
    w-full h-screen z-50 justify-center backdrop-blur-sm"
    >
      <div className="p-6 rounded-3xl max-w-[500px] z-[51] bg-primary text-white">
        <h3 className="font-bold text-4xl mb-3">Welcome to {room.title}</h3>
        <h3 className="font-bold text-4xl mb-3">People studying:</h3>
        <ul className="flex mb-3 items-center">
          <li>
            <MyAvatar name="Naeem Hasan" />
          </li>
          <li className="ml-[-10px]">
            <MyAvatar name="Naeem Hasan" />
          </li>
          <li className="ml-[-10px]">
            <MyAvatar name="Naeem Hasan" />
          </li>
          <li className="font-bold text-md ml-4">+6</li>
        </ul>
        <h3 className="font-bold text-3xl mb-4">To join:</h3>
        <div className="flex justify-center">
          <button
            onClick={() =>
              signIn('google', {
                callbackUrl: `http://localhost:3000/${room.link}`,
                redirect: true,
              })
            }
          >
            <FcGoogle size={30} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default LoginToJoin;
