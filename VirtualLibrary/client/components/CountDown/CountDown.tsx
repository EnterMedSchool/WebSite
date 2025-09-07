import React, { useState, useEffect } from 'react';
import { FaPencilAlt } from 'react-icons/fa';
import { useRecoilValue } from 'recoil';
import Countdown, { zeroPad } from 'react-countdown';
import Countdown2 from 'react-countdown';
import UpdateTimeForm from './UpdateTimeForm';
import moment from 'moment';
import authAtom from '../../atoms/authAtoms';
import roomAtom from '../../atoms/currRoom';
import socket from '../../utils/socket';
import request from '../../request';

export interface IRender {
  hours: number;
  minutes: number;
  seconds: number;
  completed?: boolean;
}

const CountDown = () => {
  const auth = useRecoilValue(authAtom);
  const room = useRecoilValue(roomAtom);
  const isCreator = auth?._id === room?.user;

  const [shareTime, setShareTime] = useState(
    room?.sharedTime || moment().format()
  );
  const [privateTime, setPrivateTime] = useState(
    room?.privateTime || moment().format()
  );
  const [timerName, setTimerName] = useState('share');
  const [shareTimerIndex, setShareTimerIndex] = useState(100);
  const [privateTimerIndex, setPrivateTimerIndex] = useState(200);
  const [showUpdateFrom, setShowUpdateForm] = useState(false);
  // const [currentShareTime, setCurrentShareTime] = useState({});
  useEffect(() => {
    setShareTime(room?.sharedTime);
    setShareTimerIndex((state) => state + 1);
    socket.on('tick', (tick) => {
      setShareTime(formatTime(tick));
      setShareTimerIndex((state) => state + 1);
    });

    return () => {
      socket.off('tick');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreator, room]);
  const rendererShare = ({ hours, minutes, seconds, completed }: IRender) => {
    if (completed) {
      // Render a completed state
      // setShareTimerIndex((state) => state + 1);
      // setShareTime((state) => state);
      return <h1 className="text-4xl font-bold">00:00:00</h1>;
    } else {
      // Render a countdown
      return (
        <h1 className="text-4xl font-bold">
          {zeroPad(hours)}:{zeroPad(minutes)}:{zeroPad(seconds)}
        </h1>
      );
    }
  };
  const rendererPrivate = ({ hours, minutes, seconds, completed }: IRender) => {
    if (completed) {
      // Render a completed state
      // setPrivateTimerIndex((state) => state + 1);
      // setPrivateTime((state) => state);
      return <h1 className="text-4xl font-bold">00:00:00</h1>;
    } else {
      // Render a countdown
      return (
        <h1 className="text-4xl font-bold">
          {zeroPad(hours)}:{zeroPad(minutes)}:{zeroPad(seconds)}
        </h1>
      );
    }
  };

  const formatTime = (timer: IRender) =>
    moment()
      .add(timer.hours, 'hour')
      .add(timer.minutes, 'minutes')
      .add(timer.seconds, 'seconds')
      .format();

  const changeTimerNameHandler = (name: string) => setTimerName(name);
  const toggleUpdateInputHandler = () => setShowUpdateForm((state) => !state);
  const timerEditHandler = async (timerObj: IRender) => {
    if (timerName === 'share') {
      if (isCreator) socket.emit('tick', timerObj, room?._id);
      setShareTime(formatTime(timerObj));
      setShareTimerIndex((state) => state + 1);
      await request.patch(`/sessions/${room._id}`, {
        sharedTime: formatTime(timerObj),
      });
    } else {
      setPrivateTime(formatTime(timerObj));
      setPrivateTimerIndex((state) => state + 1);
    }
    setShowUpdateForm(false);
  };
  // const resetHandler = () => {
  //   if (timerName === 'share') {
  //     setShareTimerIndex((state) => state + 1);
  //   } else {
  //     setPrivateTimerIndex((state) => state + 1);
  //   }
  // };

  return (
    <div className="my-4">
      <div className="flex gap-2 mb-3">
        <button
          onClick={changeTimerNameHandler.bind(null, 'share')}
          className={`py-1 px-3 duration-300 shadow border rounded-md ${
            timerName === 'share' && 'bg-primary border-transparent'
          }`}
        >
          Share
        </button>
        <button
          onClick={changeTimerNameHandler.bind(null, 'private')}
          className={`py-1 px-3 duration-300 shadow border rounded-md ${
            timerName === 'private' && 'bg-primary border-transparent'
          }`}
        >
          Private
        </button>
      </div>
      {showUpdateFrom ? (
        <UpdateTimeForm timerEditHandler={timerEditHandler} />
      ) : (
        <div className="flex gap-4 relative">
          <div className="w-[150px] h-[20px]">
            <div
              className={`absolute left-0 top-0 ${
                timerName !== 'share' && 'hidden'
              }`}
            >
              <Countdown
                key={shareTimerIndex}
                date={shareTime}
                renderer={rendererShare}
                // onTick={onTickHandlerShare}
              />
            </div>
            <div
              className={`absolute left-0 top-0 ${
                timerName !== 'private' && 'hidden'
              }`}
            >
              <Countdown2
                key={privateTimerIndex}
                date={privateTime}
                renderer={rendererPrivate}
                // onTick={onTickHandlerPrivate}
              />
            </div>
          </div>

          {(isCreator || timerName === 'private') && (
            <button
              onClick={toggleUpdateInputHandler}
              className="cursor-pointer"
            >
              <FaPencilAlt />
            </button>
          )}

          {/* <button onClick={resetHandler} className="cursor-pointer">
            <FaUndoAlt />
          </button> */}
        </div>
      )}
    </div>
  );
};

export default CountDown;
