import { atom } from 'recoil';
import { message } from '../../types';

const chatAtom = atom<message[]>({
  key: 'chat',
  default: [], //messages
});

export default chatAtom;
