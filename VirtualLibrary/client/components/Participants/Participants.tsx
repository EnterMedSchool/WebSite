import React from 'react';
import { useRecoilValue } from 'recoil';
import Participant from './Participant';
import participantsAtom from '../../atoms/roomAtoms/participantsAtom';
import { user } from '../../types';

const Participants = () => {
  const participants = useRecoilValue(participantsAtom);
  const filteredParicipants: any[] = [];
  participants.forEach((par) => {
    const findIndex = filteredParicipants.findIndex((p) => p._id === par._id);
    if (findIndex === -1) {
      filteredParicipants.push(par);
    }
  });
  return (
    <div className="shadow rounded-md border-gray-light border basis-[300px]">
      <h1 className="mb-3 bg-bg-secondary p-4 text-2xl">
        Participants ({filteredParicipants?.length})
      </h1>
      <ul className="p-4 list-none flex flex-col gap-4 overflow-y-auto max-h-[200px]">
        {filteredParicipants?.map((participant: user) => (
          <Participant participant={participant} key={participant?._id} />
        ))}
      </ul>
    </div>
  );
};

export default Participants;
