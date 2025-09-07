import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRecoilState } from 'recoil';
import { FiMoon, FiSun } from 'react-icons/fi';
import GoogleLogin from '../GoogleLogin/GoogleLogin';
import themeAtom from '../../atoms/themeAtom';

const Header = () => {
  const [theme, setTheme] = useRecoilState(themeAtom);
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.className = newTheme;
  };
  return (
    <header className="bg-bg-secondary py-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <a className="text-3xl font-bold ">BeBetter</a>
        </Link>
        <ul className=" list-none flex items-center">
          <li className="mr-5 cursor-pointer" onClick={toggleTheme}>
            {theme === 'light' ? (
              <span className=" flex items-center">
                Dark <FiMoon className="ml-2" />
              </span>
            ) : (
              <span className=" flex items-center">
                Light <FiSun className="ml-2" />
              </span>
            )}
          </li>
          <li className="mr-5">
            <Link href="/leaderboard">
              <a className="text-xl hover:underline">Leaderboard</a>
            </Link>
          </li>
          <li className="mr-5">
            <Link href="/statistics">
              <a className="text-xl hover:underline">My statistics</a>
            </Link>
          </li>
          <li>
            <GoogleLogin />
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;
