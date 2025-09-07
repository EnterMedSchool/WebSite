import React from 'react';
import MyAvatar from '../Avatar/Avatar';
import { useSession } from 'next-auth/react';

const CreatorDescription = () => {
  const { data: session } = useSession();
  return (
    <div className="flex basis-[300px] justify-center p-4 border border-gray-light rounded-md shadow-md">
      <MyAvatar name="Naeem Hasan" />
      <h3 className="text-3xl mb-3 ml-3">{session?.user?.name}</h3>
    </div>
  );
};

export default CreatorDescription;
