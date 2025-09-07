export interface IValues {
  title?: string;
  description?: string;
}

const createRoomValidation = (values: IValues) => {
  const errors: IValues = {};
  if (!values.title?.trim()) {
    errors.title = 'Title is required!';
  } else if (!values.description?.trim()) {
    errors.description = 'Description is required!';
  }
  return errors;
};

export default createRoomValidation;
