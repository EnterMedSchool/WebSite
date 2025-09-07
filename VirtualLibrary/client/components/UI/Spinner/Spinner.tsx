import React from 'react';
interface IProps {
  w?: number;
}

const Spinner = ({ w = 20 }: IProps) => {
  return (
    <div className="lds-ring" style={{ width: `${w}px`, height: `${w}px` }}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

export default Spinner;
