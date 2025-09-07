import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import request from '../request';
import Rooms from '../components/Rooms/Rooms';

const MyRooms = () => {
  const { push } = useRouter();
  const { data: session } = useSession();
  const [rooms, setRooms]: [rooms: any, setRooms: any] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const getMyRooms = async () => {
      setLoading(true);
      try {
        const { data } = await request.get(`/sessions/my-sessions`, {
          headers: { email: session?.user?.email },
        });
        setLoading(false);
        setRooms(data.data.data);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          setRooms(error.response?.data);
          setLoading(false);
        }
      }
    };
    getMyRooms();
  }, [session?.user?.email]);
  if (rooms?.message) return <h3>{rooms.message}</h3>;
  if (!session) push('/');
  return (
    <section>
      <h2 className="text-3xl text-center my-5">My Rooms</h2>
      <Rooms rooms={rooms} loading={loading} errorMsg={rooms?.message} />
    </section>
  );
};

export default MyRooms;
