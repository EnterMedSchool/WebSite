import { atom } from 'recoil';
import { ITasks } from '../../types';

const tasksAtom = atom<ITasks[]>({
  key: 'tasks',
  default: [],
});

export default tasksAtom;
