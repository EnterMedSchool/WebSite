import { atom } from 'recoil';
import { user } from '../types';

const authAtom = atom<user | null>({
  key: 'auth',
  default: null,
});

export default authAtom;
