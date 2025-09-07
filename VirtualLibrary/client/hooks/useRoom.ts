import request from '../request';

const useRoom = () => {
  const joinHandler = async (sessionId: string, participantId: string) => {
    try {
      await request.patch(`/sessions/join/${sessionId}`, {
        participantId,
      });
    } catch (error) {
      console.log(error);
    }
  };
  const leaveHandler = async (sessionId: string, participantId: string) => {
    try {
      await request.patch(`/sessions/leave/${sessionId}`, {
        participantId,
      });
    } catch (error) {
      console.log(error);
    }
  };
  const createTask = async (body: any) => {
    try {
      const { data } = await request.post(`/tasks/`, body);
      return data?.data?.data;
    } catch (error) {
      console.log(error);
    }
  };
  const updateTask = async (id: any, body: any) => {
    try {
      const { data } = await request.patch(`/tasks/${id}`, body);
      return data?.data?.data;
    } catch (error) {
      console.log(error);
    }
  };
  const deleteTask = async (id: any) => {
    try {
      const { data } = await request.delete(`/tasks/${id}`);
      return data?.data?.data;
    } catch (error) {
      console.log(error);
    }
  };

  return { joinHandler, leaveHandler, createTask, updateTask, deleteTask };
};

export default useRoom;
