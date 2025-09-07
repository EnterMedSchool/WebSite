import type { NextPage } from 'next';
import { useSetRecoilState, useRecoilValue } from 'recoil';
import CreateRoom from '../components/Modals/CreateRoom';
import Rooms from '../components/Rooms/Rooms';
import Ghost from '../components/UI/Buttons/Ghost';
import Primary from '../components/UI/Buttons/Primary';
import createRoomAtom from '../atoms/createRoomAtom';
import Pagination from '../components/Pagination/Pagination';
import useRooms from '../hooks/useRooms';
import authAtom from '../atoms/authAtoms';

const Home: NextPage = () => {
  const auth = useRecoilValue(authAtom);
  const setCreateRoom = useSetRecoilState(createRoomAtom);
  const { totalRooms, limit, rooms, errorMsg, loading, onPaginate } =
    useRooms();
  const showCreateRoomModal = () => {
    setCreateRoom(true);
  };
  const lastJoinDisabled = !auth || !auth?.lastJoinLink;

  return (
    <section className="py-9">
      <CreateRoom />
      <h1 className=" text-7xl font-bold text-center">
        Choose a virtual study room or <br /> create one!
      </h1>
      <div className="flex gap-2 justify-center align-center my-10">
        <Primary onClick={showCreateRoomModal}>Create a room</Primary>
        <Ghost disabled={lastJoinDisabled} link={auth?.lastJoinLink}>
          Join last one
        </Ghost>
      </div>
      <Rooms rooms={rooms} errorMsg={errorMsg} loading={loading} />
      {totalRooms > limit && (
        <div className="mt-10 flex justify-end">
          <Pagination
            onPageChange={onPaginate}
            itemsPerPage={limit}
            totalItems={totalRooms}
          />
        </div>
      )}
    </section>
  );
};

export default Home;
