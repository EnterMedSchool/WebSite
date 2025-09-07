import { io } from 'socket.io-client';
import { BASE_URL } from '.';

const socket = io(BASE_URL, {
  withCredentials: true,
  transports: ['websocket'],
  upgrade: false,
  closeOnBeforeunload: false,
});

export default socket;
