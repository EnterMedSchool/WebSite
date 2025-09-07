import React, { useEffect, useState } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import Tasks from './Tasks';
import authAtom from '../../atoms/authAtoms';
import tasksAtom from '../../atoms/roomAtoms/tasksAtom';
import participantsAtom from '../../atoms/roomAtoms/participantsAtom';
import { ITasks } from '../../types';
import TasksOther from './TasksOther';
import socket from '../../utils/socket';
import MyAvatar from '../Avatar/Avatar';
import useRoom from '../../hooks/useRoom';
import roomAtom from '../../atoms/currRoom';

const TaskList = () => {
  const participants = useRecoilValue(participantsAtom);
  const [tasks, setTasks] = useRecoilState(tasksAtom);
  const room = useRecoilValue(roomAtom);
  const auth = useRecoilValue(authAtom);
  const [myTasks, setMyTasks] = useState<ITasks[]>([]);
  const [myTaskList, setMyTaskList] = useState<ITasks | null>(null);
  const [frontTaskIndex, setFrontTaskIndex] = useState(0);
  const { createTask, deleteTask } = useRoom();
  // set my task
  useEffect(() => {
    // filtered  out my tasks
    const filteredMyTasks = tasks.filter(
      (task) => task?.user?._id === auth?._id
    );
    setMyTasks(filteredMyTasks);
    if (filteredMyTasks.length) {
      setMyTaskList(filteredMyTasks[0]);
    }
  }, [tasks, auth]);

  useEffect(() => {
    if (myTasks.length) {
      setMyTaskList(myTasks[frontTaskIndex]);
    } else {
      setMyTaskList(null);
    }
  }, [frontTaskIndex, myTasks]);

  // update my tasks list array when front task list updated
  useEffect(() => {
    if (myTaskList)
      setMyTasks((state) =>
        !state.length
          ? [myTaskList]
          : state.map((task) =>
              task._id === myTaskList._id ? myTaskList : task
            )
      );
  }, [myTaskList]);

  // side effect for socket.io
  useEffect(() => {
    socket.on('task', (newTask) => {
      // find task
      const findIndex = tasks.findIndex((ts) => ts._id === newTask?._id);
      // if index is found replace task with latest
      if (findIndex > -1) {
        setTasks((state) =>
          state.map((ts) => {
            if (ts?._id === newTask?._id) return newTask;
            return ts;
          })
        );
      } else {
        /// add the new task
        setTasks((state) => [newTask, ...state]);
      }
    });
    socket.on('delete', (taskId) => {
      setTasks((state) => state.filter((ts) => taskId !== ts._id));
    });

    return () => {
      socket.off('task');
    };
  }, [setTasks, tasks]);
  /// filtered task based on current participants
  const filteredTask: ITasks[] = [];
  tasks.forEach((tas) => {
    // task user is in the participants array
    const findIndex = participants.findIndex((pr) => pr._id === tas?.user?._id);
    if (findIndex > -1) {
      filteredTask.push(tas);
    }
  });

  const frontTaskIndexHandler = (type: string | number) => {
    /// if type number directly set it
    if (typeof type === 'number') return setFrontTaskIndex(type);
    // if there is no tasks
    if (!myTasks.length) return setFrontTaskIndex(0);
    const updatedIndex =
      type === 'next'
        ? frontTaskIndex + 1 === myTasks.length
          ? 0
          : frontTaskIndex + 1
        : frontTaskIndex + 1 === 1
        ? myTasks.length - 1
        : frontTaskIndex - 1;
    setFrontTaskIndex(updatedIndex);
  };
  const addNewTaskCardHandler = async () => {
    const body = {
      title: 'Enter title',
      tasks: [],
      user: auth?._id,
      session: room?._id,
    };

    const newTask = await createTask(body);
    setMyTaskList(newTask);
    setMyTasks((state) => [newTask, ...state]);
    socket.emit('task', newTask, room?._id);
  };
  const deleteCard = async () => {
    const deleteTaskId = myTaskList?._id;
    const findIndex = myTasks.findIndex((task) => task._id === deleteTaskId);
    setMyTasks((state) => state.filter((task) => task._id !== deleteTaskId));
    if (findIndex + 1 === myTasks.length) {
      frontTaskIndexHandler(0);
    } else {
      frontTaskIndexHandler(findIndex);
    }

    socket.emit('delete', deleteTaskId, room?._id);
    await deleteTask(deleteTaskId);
  };
  // struct other tasks
  // hash map ids
  const ids: any[] = [];
  // array of array other tasks
  const otherTask: any[] = [];
  filteredTask
    .filter((t: any) => t?.user?._id !== auth?._id)
    .forEach((task) => {
      // it's hashing or not
      if (!ids.includes(task.user._id || '')) {
        ids.push(task.user._id);
        const userTasks = tasks.filter((tsk) => tsk.user._id === task.user._id);
        otherTask.push(userTasks);
      }
    });

  return (
    <div
      className="h-[600px] border-gray-light flex-[60%] 
    shadow rounded-md border p-4 overflow-y-auto"
    >
      <h1 className="text-3xl mb-4">Task</h1>
      <div className="flex flex-wrap gap-7">
        <div className="flex-[48%] grow-0">
          <h2 className="flex gap-2 items-center mb-6">
            <MyAvatar
              size={'40'}
              name={auth?.name || ''}
              src={auth?.photo || ''}
            />
            <span>{auth?.name}</span>
          </h2>
          <button
            onClick={addNewTaskCardHandler}
            className="border rounded-md bg-secondary mb-3 py-1 px-3"
          >
            Add card
          </button>
          <Tasks
            deleteCard={deleteCard}
            setMyTaskList={setMyTaskList}
            tasks={myTaskList}
          />
          {myTasks.length > 0 ? (
            <div className=" text-gray justify-center items-center flex gap-3 mt-3">
              <button
                onClick={frontTaskIndexHandler.bind(null, 'prev')}
                className="cursor-pointer"
              >
                &lt;
              </button>
              {frontTaskIndex + 1}/{myTasks.length}
              <button
                onClick={frontTaskIndexHandler.bind(null, 'next')}
                className="cursor-pointer"
              >
                &gt;
              </button>
            </div>
          ) : null}
        </div>
        {otherTask.map((task: ITasks[], i) => (
          <TasksOther key={i} tasks={task} />
        ))}
      </div>
    </div>
  );
};

export default TaskList;
