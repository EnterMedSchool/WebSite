import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Formik } from 'formik';
import toast from 'react-hot-toast';
import Backdrop from '../UI/Backdrop/Backdrop';
import Ghost from '../UI/Buttons/Ghost';
import Primary from '../UI/Buttons/Primary';
import LoginFirst from '../LoginFirst/LoginFirst';
import createRoomAtom from '../../atoms/createRoomAtom';
import createRoomValidation, {
  IValues,
} from '../../utils/createRoomValidation';
import request from '../../request';

const CreateRoom = () => {
  const { data: session } = useSession();
  const { push } = useRouter();
  const initialValues = {
    title: '',
    description: '',
  };
  const [open, setState] = useRecoilState(createRoomAtom);
  const onClose = () => setState(false);
  useEffect(() => setState(false), [setState]);
  const createRoom = async (
    values: IValues,
    { setSubmitting }: { setSubmitting: any }
  ) => {
    try {
      setSubmitting(true);
      const { data } = await request.post('/sessions', values, {
        headers: { email: session?.user?.email },
      });
      setSubmitting(false);
      push(data.data.data.link);
    } catch (error) {
      setSubmitting(false);
      const message = error?.response?.data?.message;
      toast.error(message);
    }
  };

  return (
    <Backdrop onClick={onClose} open={open}>
      <div className="min-w-[500px] animate-fadeInAndScale shadow-sm bg-bg-secondary p-8 rounded-sm">
        {session ? (
          <Formik
            initialValues={{ ...initialValues }}
            validate={createRoomValidation}
            onSubmit={createRoom}
          >
            {({
              values,
              errors,
              handleChange,
              touched,
              handleSubmit,
              isSubmitting,
            }) => (
              <form onSubmit={handleSubmit}>
                <h2 className="text-3xl mb-6">Create Room</h2>
                <div className="mb-4 flex flex-col">
                  <label className="mb-3">Title</label>
                  <input
                    type="text"
                    name="title"
                    onChange={handleChange}
                    value={values.title}
                    placeholder="Title"
                    className="p-2 rounded-sm border-none bg-bg-primary"
                  />
                  {errors.title && touched.title && (
                    <span className="text-red-400 mt-2">{errors.title}</span>
                  )}
                </div>

                <div className="mb-4 flex flex-col">
                  <label className="mb-3">Description</label>
                  <textarea
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                    placeholder="Description"
                    className="p-4 rounded-sm border-none bg-bg-primary"
                  />
                  {errors.description && touched.description && (
                    <span className="text-red-400 mt-2">
                      {errors.description}
                    </span>
                  )}
                </div>
                <div className="flex gap-3 mt-10">
                  <Primary
                    processing={isSubmitting}
                    disabled={isSubmitting}
                    type="submit"
                  >
                    Create
                  </Primary>
                  <Ghost onClick={onClose}>Cancel</Ghost>
                </div>
              </form>
            )}
          </Formik>
        ) : (
          <LoginFirst />
        )}
      </div>
    </Backdrop>
  );
};

export default CreateRoom;
