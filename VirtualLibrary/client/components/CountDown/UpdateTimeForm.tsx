import React, { useState } from 'react';
import { IRender } from './CountDown';
interface IProps {
  timerEditHandler: (timerObj: IRender) => void;
}

const UpdateTimeForm = ({ timerEditHandler }: IProps) => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hours && !minutes && !seconds) return;
    const timerObj = {
      hours,
      minutes,
      seconds,
    };
    timerEditHandler(timerObj);
  };
  return (
    <form onSubmit={onSubmit} className="flex gap-3 items-center">
      <input
        className="border rounded bg-transparent w-20 p-1"
        type="number"
        placeholder="Hours"
        value={hours}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setHours(+e.target.value)
        }
      />
      <input
        className="border rounded bg-transparent w-20 p-1"
        type="number"
        placeholder="Minutes"
        value={minutes}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setMinutes(+e.target.value)
        }
      />
      <input
        className="border rounded bg-transparent w-20 p-1"
        type="number"
        placeholder="Seconds"
        value={seconds}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSeconds(+e.target.value)
        }
      />
      <button type="submit" className=" rounded p-1 bg-primary cursor-pointer">
        Update
      </button>
    </form>
  );
};

export default UpdateTimeForm;
