import React from 'react';
import DurationPicker from 'react-duration-picker';

interface IProps {
  show?: boolean;
}

const MyDurationPicker = ({ show }: IProps) => {
  const onChange = (duration: DurationPicker.Duration) => {
    const { hours, minutes, seconds } = duration;
    console.log(hours, minutes, seconds);
  };
  if (!show) return null;
  return (
    <DurationPicker
      onChange={onChange}
      initialDuration={{ hours: 1, minutes: 2, seconds: 3 }}
      maxHours={5}
    />
  );
};

export default MyDurationPicker;
