import { useEffect } from 'react';
import request from '../request';
import { useRecoilState } from 'recoil';
import authAtom from '../atoms/authAtoms';
import { user } from '../types';

const useAuth = () => {
  const [auth, setAuth]: [auth: user, setAuth: any] = useRecoilState(authAtom);
  useEffect(() => {
    const getAuth = async () => {
      try {
        const { data } = await request.get('/users/me');
        // console.log(data?.data?.data);
        setAuth(data?.data?.data);
      } catch (error) {
        // console.log(error);
        setAuth(null);
      }
    };
    if (!auth) getAuth();
  }, [auth, setAuth]);

  return { auth };
};

export default useAuth;
