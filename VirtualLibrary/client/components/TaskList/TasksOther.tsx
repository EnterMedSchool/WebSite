import React, { useEffect, useState } from 'react';
import { GoFile } from 'react-icons/go';

import TaskItem from './TaskItem';
import { ITasks } from '../../types';

import MyAvatar from '../Avatar/Avatar';
import socket from '../../utils/socket';

interface IProps {
  tasks: ITasks[];
  setMyTaskList?: any;
}

const TasksOther = ({ tasks }: IProps) => {
  const [currFrontIndex, setCurrFrontIndex] = useState(0);
  const [currFrontTask, setCurrFrontTask] = useState(tasks[currFrontIndex]);

  useEffect(() => {
    setCurrFrontTask(tasks[currFrontIndex]);
  }, [currFrontIndex, tasks]);
  useEffect(() => {
    socket.on('delete', (taskId) => {
      const findIndex = tasks.findIndex((tsk) => tsk._id === taskId);
      if (currFrontIndex + 1 === tasks.length) {
        setCurrFrontIndex(0);
      } else {
        setCurrFrontIndex(findIndex);
      }
    });
  }, [tasks, currFrontIndex]);

  const frontTaskIndexHandler = (type: string | number) => {
    const updatedIndex =
      type === 'next'
        ? currFrontIndex + 1 === tasks.length
          ? 0
          : currFrontIndex + 1
        : currFrontIndex + 1 === 1
        ? tasks.length - 1
        : currFrontIndex - 1;
    setCurrFrontIndex(updatedIndex);
  };
  return (
    <div className=" flex-[48%] grow-0 ">
      <h2 className="flex gap-2 items-center mb-6">
        <MyAvatar
          size={'40'}
          name={currFrontTask?.user?.name || ''}
          src={currFrontTask?.user?.photo || ''}
        />
        <span>{currFrontTask?.user?.name}</span>
      </h2>
      <div className="shadow-md border border-slate-200 rounded-sm">
        <h1 className="p-2 border-b text-xl flex justify-between items-center text-white font-bold bg-primary">
          {currFrontTask?.title || 'Enter title'}
        </h1>

        <ul className="h-[280px] overflow-y-auto">
          {!currFrontTask?.tasks?.length && (
            <li className="h-full w-full flex flex-col items-center justify-center">
              <GoFile className="text-[50px]" />
              <h3 className="mt-2 font-bold text-2xl">No tasks yet! </h3>
            </li>
          )}

          {currFrontTask?.tasks?.map((task) => (
            <TaskItem key={task._id} task={task} />
          ))}
        </ul>
      </div>
      <div className=" text-gray justify-center items-center flex gap-3 mt-3">
        <button
          onClick={frontTaskIndexHandler.bind(null, 'prev')}
          className="cursor-pointer"
        >
          &lt;
        </button>
        {currFrontIndex + 1}/{tasks.length}
        <button
          onClick={frontTaskIndexHandler.bind(null, 'next')}
          className="cursor-pointer"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default TasksOther;
