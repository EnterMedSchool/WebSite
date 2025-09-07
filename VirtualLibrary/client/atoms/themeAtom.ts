import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';
const { persistAtom } = recoilPersist({
  key: 'theme-percist',
});
const themeAtom = atom({
  key: 'theme',
  default: 'light',
  effects_UNSTABLE: [persistAtom],
});

export default themeAtom;
