import { atom } from 'recoil';
import { user } from '../../types';

const participantsAtom = atom<user[]>({
  key: 'participants',
  default: [],
});

export default participantsAtom;
