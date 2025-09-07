import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import request from '../request';
import { room } from '../types';
import authAtom from '../atoms/authAtoms';

interface IState {
  loading: boolean;
  rooms: room[];
  sort: string;
  results: number;
  totalRooms: number;
  errorMsg: string;
  limit: number;
  isCalled: boolean;
  page: number;
}

const useRooms = (query?: any) => {
  const auth = useRecoilValue(authAtom);
  const [state, setState]: [
    state: IState,
    setState: React.Dispatch<React.SetStateAction<any>>
  ] = useState({
    loading: false,
    rooms: [],
    sort: 'latest',
    results: 0,
    totalRooms: 0,
    errorMsg: '',
    limit: 5,
    isCalled: false,
    page: 1,
  });

  useEffect(() => {
    const getRooms = async () => {
      let newQuery =
        query || state.sort === 'latest'
          ? 'sort=-createdAt'
          : 'sort=-totalJoin';
      //remove user session
      if (auth?._id) newQuery += `&user[ne]=${auth._id}`;

      setState((prevState: IState) => ({
        ...prevState,
        loading: true,
        isCalled: true,
      }));
      try {
        const { data } = await request.get(
          `/sessions?limit=${state.limit}&page=${state.page}&${newQuery}`
        );
        setState((prevState: IState) => ({
          ...prevState,
          rooms: data.data.data,
          results: data.results,
          totalRooms: data.totalSessions,
          loading: false,
        }));
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
          setState((prevState: IState) => ({
            ...prevState,
            loading: false,
            errorMsg: error?.response?.data?.message,
          }));
        }
      }
    };
    getRooms();
  }, [query, state.limit, state.sort, auth, state.isCalled, state.page]);

  const changeSort = (sort: string) => {
    setState((prevState: IState) => ({ ...prevState, sort }));
  };
  const onPaginate = (page: number) => {
    setState((state: IState) => ({ ...state, page }));
  };

  return { ...state, changeSort, onPaginate };
};

export default useRooms;
