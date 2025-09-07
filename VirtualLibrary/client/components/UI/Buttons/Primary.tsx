import React from 'react';
import Spinner from '../Spinner/Spinner';
interface IProps {
  children: React.ReactNode;
  disabled?: boolean;
  processing?: boolean;
  onClick?: () => void;
  type?: 'submit' | 'reset' | 'button';
}

const Primary = ({
  children,
  onClick,
  disabled,
  processing,
  type = 'button',
}: IProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="py-2 relative disabled:bg-primary-100 text-white px-3 bg-primary rounded-md cursor-pointer"
    >
      {processing && <Spinner />}

      {children}
    </button>
  );
};

export default Primary;
