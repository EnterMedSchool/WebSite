import React, { useState, useEffect } from 'react';
import { signIn, useSession, signOut } from 'next-auth/react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link';
import MyAvatar from '../Avatar/Avatar';
import authAtom from '../../atoms/authAtoms';
import request from '../../request';

interface IOProps {
  open: boolean;
  toggleOpen: () => void;
}

const Options = ({ open, toggleOpen }: IOProps) => {
  const { data: session } = useSession();
  const setAuth = useSetRecoilState(authAtom);

  const logout = async () => {
    setAuth(null);
    localStorage.removeItem('auth-percist');
    signOut();
  };
  const openClasses =
    'duration-200 ease-out opacity-100 visible shadow list-none absolute top-[60px] left-[-100px] bg-bg-primary w-[150px]  rounded';
  const closeClasses =
    ' duration-300 opacity-0 invisible ease-out shadow list-none absolute top-[100px] left-[-100px] bg-bg-primary w-[150px]  rounded';
  return (
    <ul className={open ? openClasses : closeClasses}>
      <li
        className=" cursor-pointer border-b-2 text-center py-2"
        onClick={toggleOpen}
      >
        {session?.user?.name}
      </li>
      <li
        className=" cursor-pointer border-b-2 text-center py-2"
        onClick={toggleOpen}
      >
        <Link href="/my-rooms">My Rooms</Link>
      </li>
      <li onClick={logout} className=" cursor-pointer text-center py-2">
        Logout
      </li>
    </ul>
  );
};

export const Button = () => {
  const login = async () => {
    signIn('google');
  };
  return (
    <button
      type="button"
      onClick={login}
      className="border-2 border-slate-400 hover:underline  text-xl rounded py-2 px-4 flex items-center"
    >
      <FcGoogle size={30} className="mr-3" /> Continue with Google
    </button>
  );
};

const GoogleLogin = () => {
  const [auth, setAuth] = useRecoilState(authAtom);
  // useAuth();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const toggleOpen = () => setOpen((state) => !state);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await request.get(
          `/users/getMeByEmail?email=${session?.user?.email}`
        );
        // axios.defaults.headers.common['email'] = session?.user?.email || '';
        setAuth(data.data.data);
      } catch (error) {
        console.log(error);
      }
    };
    if (session && !auth) getUser();
  }, [auth, session, setAuth]);

  if (session) {
    return (
      <div className="flex items-center  relative">
        <div onClick={toggleOpen} className=" cursor-pointer">
          <MyAvatar
            name={session.user?.name}
            size={'50'}
            src={session.user?.image}
          />
        </div>
        <Options toggleOpen={toggleOpen} open={open} />
      </div>
    );
  }
  return <Button />;
};

export default GoogleLogin;
