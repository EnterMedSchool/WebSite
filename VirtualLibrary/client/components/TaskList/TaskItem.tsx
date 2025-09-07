import React, { useState } from 'react';
import { GoTrashcan } from 'react-icons/go';
interface IProps {
  task: {
    _id: string;
    name: string;
    isCompleted: boolean;
  };
  onRemove?: () => void;
  toggleTaskCompleted?: () => void;
}
const TaskItem = ({ task, onRemove, toggleTaskCompleted }: IProps) => {
  const [showMore, setShowMore] = useState(false);
  // decide show all or less
  let content = task.name.slice(0, 200) + (task.name.length > 200 ? '...' : '');
  if (showMore) content = task.name;
  return (
    <li className="p-2  border-b flex items-center gap-2 ">
      <input
        type="checkbox"
        checked={task.isCompleted}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onChange={toggleTaskCompleted || (() => {})}
      />
      <span
        className={`${task.isCompleted && 'line-through'} flex-1 break-all`}
      >
        {content}
        {task.name.length > 200 && (
          <span
            onClick={() => setShowMore((state) => !state)}
            className="text-sm ml-2 text-gray cursor-pointer hover:underline"
          >
            {showMore ? 'show less' : 'show more'}
          </span>
        )}
      </span>
      {onRemove && (
        <GoTrashcan
          onClick={onRemove}
          className="cursor-pointer text-red-400 ml-auto"
        />
      )}
    </li>
  );
};

export default TaskItem;
