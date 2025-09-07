import React, { useState, useRef, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { HiLink, HiOutlineShare, HiOutlinePencilAlt } from 'react-icons/hi';
import { FaRegSave } from 'react-icons/fa';
import request from '../../request';

import { room } from '../../types';
import CountDown from '../CountDown/CountDown';
import toast from 'react-hot-toast';
import authAtom from '../../atoms/authAtoms';
interface IProps {
  room: room;
}

const RoomTimer = ({ room }: IProps) => {
  const auth = useRecoilValue(authAtom);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const [showEdit, setShowEdit] = useState(false);
  const origin = window.location.origin;
  const link = origin + room.link;
  const [linkInput, setLinkInput] = useState(link);
  useEffect(() => {
    if (showEdit) {
      linkInputRef?.current?.focus();
    }
  }, [showEdit]);
  const showEditInput = () => {
    setShowEdit(true);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value.includes(origin + '/')) {
      return setLinkInput(origin + '/');
    }
    setLinkInput(e?.target?.value);
  };
  const onEditLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    //validation
    if (!linkInput.replace(origin + '/', '').trim()) {
      toast.error('Invalid link!');
      linkInputRef?.current?.focus();
      return;
    }
    const toastId = toast.loading('Link updating...');
    try {
      await request.patch(`/sessions/${room._id}`, {
        link: linkInput.trim().replace(origin, ''),
      });
      setShowEdit(false);
      toast.dismiss(toastId);
      toast.success('Link updated successfully!');
    } catch (error) {
      const msg = error?.response?.data?.message || 'something went wrong';
      toast.dismiss(toastId);
      if (msg.includes('E11000 duplicate key error')) {
        return toast.error('This link already taken, try another!');
      }
      toast.error(msg);
      // console.log(msg);
    }
  };

  return (
    <div className="flex-1 flex justify-center p-4 flex-col border border-gray-light rounded-md shadow-md">
      <h3 className="text-3xl mb-3">{room.title}</h3>
      <CountDown />
      <div className="my-3 flex text-xl gap-2">
        <span className="py-1 px-2 bg-gray">
          <HiLink />
        </span>
        {showEdit ? (
          <form onSubmit={onEditLinkSubmit} className="flex-1">
            <input
              onBlur={onEditLinkSubmit}
              onChange={onInputChange}
              type="text"
              value={linkInput}
              className="bg-transparent w-full"
              ref={linkInputRef}
            />
          </form>
        ) : (
          <p>{linkInput}</p>
        )}

        {showEdit ? (
          <button>
            <FaRegSave />
          </button>
        ) : auth?._id === room?.user ? (
          <button onClick={showEditInput} className="cursor-pointer">
            <HiOutlinePencilAlt />
          </button>
        ) : null}
        <CopyToClipboard
          text={linkInput}
          onCopy={() => toast.success('Link copied!')}
        >
          <button className="cursor-pointer">
            <HiOutlineShare />
          </button>
        </CopyToClipboard>
      </div>
    </div>
  );
};

export default RoomTimer;
