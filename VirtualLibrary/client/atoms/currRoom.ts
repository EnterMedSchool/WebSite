import { atom } from 'recoil';
import { room } from '../types';

const roomAtom = atom<room | any>({
  key: 'room',
  default: {},
});
export default roomAtom;
