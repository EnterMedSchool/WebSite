import { atom } from 'recoil';
const createRoomAtom = atom({
  key: 'create-room',
  default: false,
});

export default createRoomAtom;
