import React, { useState } from 'react';
import { GoKebabVertical } from 'react-icons/go';
import { GoFile } from 'react-icons/go';
import { useRecoilValue } from 'recoil';
import TaskItem from './TaskItem';
import { ITasks } from '../../types';
import useRoom from '../../hooks/useRoom';
import authAtom from '../../atoms/authAtoms';
import roomAtom from '../../atoms/currRoom';
import socket from '../../utils/socket';

interface IProps {
  tasks: ITasks | null;
  setMyTaskList?: any;
  deleteCard: () => void;
}
// interface tasks {
//   _id: string;
//   name: string;
//   isCompleted: boolean;
// }
// const getId = (tasks: tasks[] | undefined) => {
//   if (!tasks?.length) return '1';
//   const id =
//     tasks?.reduce((acc, curr) => {
//       if (+curr._id > acc) return +curr._id;
//       return acc;
//     }, 0) + 1;

//   return `${id}`;
// };

const Tasks = ({ tasks, setMyTaskList, deleteCard }: IProps) => {
  const auth = useRecoilValue(authAtom);
  const room = useRecoilValue(roomAtom);
  const { createTask, updateTask } = useRoom();
  const [showEditTitleInput, setShowEditTitleInput] = useState(false);
  const [title, setTitle] = useState(tasks?.title || 'Enter title');
  const [taskInput, setTaskInput] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput?.trim()) return alert("Task name can't be empty!");
    const newTask = {
      name: taskInput,
      isCompleted: false,
    };
    let newTasks;

    if (tasks?._id) {
      const body = {
        tasks: [newTask, ...tasks.tasks],
      };
      newTasks = await updateTask(tasks._id, body);
    } else {
      const body = {
        title: 'Enter title',
        tasks: [newTask],
        user: auth?._id,
        session: room?._id,
      };
      newTasks = await createTask(body);
    }
    setMyTaskList(newTasks);
    socket.emit('task', newTasks, room?._id);

    setTaskInput('');
  };
  const removeTask = async (id: string) => {
    const updatedTaskArr = tasks?.tasks.filter((task) => task._id !== id);
    setMyTaskList((state: ITasks) => ({
      ...state,
      tasks: updatedTaskArr,
    }));
    const updatedTasks = await updateTask(tasks?._id, {
      tasks: updatedTaskArr,
    });
    socket.emit('task', updatedTasks, room?._id);
  };

  const updateTitle = async () => {
    let newTask;

    if (tasks?._id) {
      const body = {
        title,
      };
      newTask = await updateTask(tasks._id, body);
    } else {
      const body = {
        title,
        tasks: [],
        user: auth?._id,
        session: room?._id,
      };
      newTask = await createTask(body);
    }
    setMyTaskList(newTask);
    socket.emit('task', newTask, room?._id);
    setShowEditTitleInput(false);
  };

  const clearAlltask = async () => {
    setMyTaskList((state: ITasks) => ({ ...state, tasks: [] }));
    setShowOptions(false);
    const updatedTask = await updateTask(tasks?._id, { tasks: [] });
    socket.emit('task', updatedTask, room?._id);
  };

  const toggleTaskCompleted = async (id: string) => {
    setMyTaskList((state: ITasks) => ({
      ...state,
      tasks: state.tasks.map((t) => {
        if (t._id === id) {
          return { ...t, isCompleted: !t.isCompleted };
        }
        return { ...t };
      }),
    }));
    const updatedTaskArr = tasks?.tasks.map((t) => {
      if (t._id === id) {
        return { ...t, isCompleted: !t.isCompleted };
      }
      return { ...t };
    });

    const updatedTask = await updateTask(tasks?._id, { tasks: updatedTaskArr });
    socket.emit('task', updatedTask, room?._id);
  };

  return (
    <div className=" flex-[48%] grow-0 ">
      <div className="shadow-md border border-slate-200 rounded-sm">
        <h1 className="p-2 border-b flex justify-between items-center bg-primary">
          {showEditTitleInput ? (
            <input
              onBlur={updateTitle}
              className="bg-secondary flex-1"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              autoFocus
            />
          ) : (
            <span
              onClick={() => {
                setShowEditTitleInput(true);
                setTitle(tasks?.title);
              }}
              className="font-bold text-xl flex-1 cursor-text text-white"
            >
              {tasks?.title || 'Enter title'}
            </span>
          )}
          {tasks && (
            <div className="text-xl relative">
              <GoKebabVertical
                onClick={() => setShowOptions((state) => !state)}
                className="cursor-pointer"
              />
              {showOptions && (
                <ul className="py-2 absolute w-[200px] z-50 bg-bg-secondary rounded-sm shadow-xl top-8">
                  <li
                    onClick={clearAlltask}
                    className="p-2 text-sm cursor-pointer hover:bg-slate-500"
                  >
                    Clear all task
                  </li>
                  <li
                    onClick={() => {
                      setShowOptions((state) => !state);
                      deleteCard();
                    }}
                    className="p-2 text-sm cursor-pointer hover:bg-slate-500"
                  >
                    Delete card
                  </li>
                </ul>
              )}
            </div>
          )}
        </h1>

        <ul className="h-[280px] overflow-y-auto">
          {!tasks?.tasks?.length && (
            <li className="h-full w-full flex flex-col items-center justify-center">
              <GoFile className="text-[50px]" />
              <h3 className="mt-2 font-bold text-2xl">No tasks yet! </h3>
            </li>
          )}

          {tasks?.tasks?.map((task) => (
            <TaskItem
              onRemove={() => removeTask(task._id)}
              key={task._id}
              task={task}
              toggleTaskCompleted={() => toggleTaskCompleted(task._id)}
            />
          ))}
        </ul>
        <form onSubmit={addTask}>
          <input
            type="text"
            className="w-full bg-secondary p-1 "
            placeholder="What's next?"
            value={taskInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTaskInput(e.target?.value)
            }
          />
        </form>
      </div>
    </div>
  );
};

export default Tasks;
