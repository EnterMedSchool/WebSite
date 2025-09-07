import React from 'react';
import { Button } from '../GoogleLogin/GoogleLogin';

const LoginFirst = () => {
  return (
    <div className="flex justify-center flex-col items-center">
      <h3 className="text-2xl mb-4">Please, Login first</h3>
      <Button />
    </div>
  );
};

export default LoginFirst;
