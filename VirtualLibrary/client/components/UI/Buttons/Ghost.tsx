import Link from 'next/link';
import React from 'react';
import Spinner from '../../UI/Spinner/Spinner';
interface IProps {
  children: React.ReactNode;
  disabled?: boolean;
  processing?: boolean;
  onClick?: () => void;
  link?: string;
}

const Ghost = ({ children, onClick, disabled, processing, link }: IProps) => {
  if (link)
    return (
      <Link href={link}>
        <a>
          <button
            type="button"
            disabled={disabled}
            className="py-2 relative disabled:opacity-50 disabled:cursor-default px-3 border-2 border-slate-300 rounded-md cursor-pointer"
          >
            {processing && <Spinner />}
            {children}
          </button>
        </a>
      </Link>
    );

  return (
    <button
      onClick={onClick}
      type="button"
      disabled={disabled}
      className="py-2 relative disabled:opacity-50 disabled:cursor-default px-3 border-2 border-slate-300 rounded-md cursor-pointer"
    >
      {processing && <Spinner />}
      {children}
    </button>
  );
};

export default Ghost;
