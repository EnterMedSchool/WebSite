import React from 'react';
interface IProps {
  children: React.ReactNode;
  open: boolean;
  onClick?: () => void;
}

const Backdrop = ({ children, open, onClick }: IProps) => {
  const clickHandler = (e: React.SyntheticEvent) => {
    if (e.target?.classList?.contains('backdrop')) onClick();
  };
  return (
    <div
      onClick={clickHandler}
      className={`fixed backdrop ${
        open ? 'flex' : 'hidden'
      } justify-center items-center top-0 left-0 w-full h-full z-[1000] bg-[rgba(0,0,0,.3)]`}
    >
      {children}
    </div>
  );
};

export default Backdrop;
