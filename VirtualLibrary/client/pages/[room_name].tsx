import { useEffect } from 'react';
import { GetServerSideProps } from 'next';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import toast from 'react-hot-toast';
import request from '../request';
import Participants from '../components/Participants/Participants';
import RoomTimer from '../components/RoomTimer/RoomTimer';
import CreatorDescription from '../components/CreatorDescription/CreatorDescription';
import RoomChat from '../components/RoomChat/RoomChat';
import TaskList from '../components/TaskList/TaskList';
import LoginToJoin from '../components/Modals/LoginToJoin';
import authAtom from '../atoms/authAtoms';
import roomAtom from '../atoms/currRoom';
import tasksAtom from '../atoms/roomAtoms/tasksAtom';
import chatAtom from '../atoms/roomAtoms/chatAtom';
import participantsAtom from '../atoms/roomAtoms/participantsAtom';
import useRoom from '../hooks/useRoom';
import { message, user } from '../types';
import socket from '../utils/socket';
import isMobile from '../utils/isMobile';

const Room = ({
  room,
  tasks,
  messages,
}: {
  room: any;
  tasks: any;
  messages: message[];
}) => {
  const setParticipants = useSetRecoilState(participantsAtom);
  const setRoom = useSetRecoilState(roomAtom);
  const setTasks = useSetRecoilState(tasksAtom);
  const setMessages = useSetRecoilState(chatAtom);
  const { joinHandler, leaveHandler } = useRoom();

  const auth: any = useRecoilValue(authAtom);
  const { data: session } = useSession();
  useEffect(() => {
    setRoom(room);
    setTasks(tasks);
    setMessages(messages);
  }, [room, tasks, messages, setRoom, setTasks, setMessages]);
  // working on the socket.io
  const unloadFunction = () => {
    socket.emit('leave', auth, room._id);
    leaveHandler(room._id, auth._id);
  };
  // user is load the room
  const loadFunction = () => {
    socket.emit('join', auth, room._id);
    joinHandler(room._id, auth._id);
  };
  const visibilityChangeHandler = () => {
    if (isMobile() && document.visibilityState === 'hidden') {
      // call unload function
      unloadFunction();
    } else if (isMobile() && document.visibilityState === 'visible') {
      loadFunction();
    }
  };
  useEffect(() => {
    if (auth) {
      // this user is joined
      loadFunction();
      setParticipants(room.participants);

      // another user is jointed
      socket.on('join', (participant) => {
        // if not add them
        setParticipants((state) => [...state, participant]);
        const msg =
          participant?._id === auth?._id
            ? 'You join the room'
            : `${participant?.name} join the room`;
        toast(msg, {
          position: 'bottom-center',
        });
      });
      socket.on('leave', (participant) => {
        if (participant?._id !== auth?._id) {
          toast(`${participant?.name} leave the room`, {
            position: 'bottom-center',
          });
        }
        setParticipants((state) =>
          state.filter((par: user) => par._id !== participant?._id)
        );
      });
      window.addEventListener('beforeunload', unloadFunction);
      // for mobile closing or changing the tab
      window.addEventListener('visibilitychange', visibilityChangeHandler);
    }

    return () => {
      if (auth) {
        socket.emit('leave', auth, room._id);
        socket.off('join');
        socket.off('leave');
        leaveHandler(room._id, auth._id);
        window.removeEventListener('visibilitychange', visibilityChangeHandler);
        window.removeEventListener('beforeunload', unloadFunction);
      }
    };
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setParticipants, auth, room?._id, room?.participants]);

  if (room?.message)
    return <h3 className="text-center text-4xl mt-5">{room?.message}</h3>;
  return (
    <>
      <section className="p-6">
        <div className="flex gap-3 mb-6 justify-between">
          <Participants />
          <RoomTimer room={room} />

          <CreatorDescription />
        </div>
        <div className="flex gap-3">
          <RoomChat />
          <TaskList />
        </div>
      </section>
      {!session && <LoginToJoin room={room} />}
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  let props = {};
  const room_name = context.params?.room_name;
  try {
    //Fetch room
    const { data } = await request.get(`/sessions/${room_name}`);
    const room = data.data.data;
    // fetch tasks
    const { data: tasksData } = await request.get(`/tasks?session=${room._id}`);
    const tasks = tasksData.data.data;
    // fetch messages
    const { data: msgData } = await request.get(
      `/messages?sort=createdAt&session=${room?._id}`
    );
    const messages = msgData.data.data;
    props = {
      room,
      tasks,
      messages,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      props = {
        room: error?.response.data,
        tasks: [],
        messages: [],
      };
    }
  }

  // console.log(props);
  return {
    props,
  };
};
export default Room;
