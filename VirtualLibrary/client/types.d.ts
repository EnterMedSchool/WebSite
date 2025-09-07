export interface user {
  _id: string;
  name: string;
  username: string;
  email: string;
  photo: string;
  googleId: string;
  secret?: string;
  active?: boolean;
}
export interface room {
  _id: string;
  title: string;
  description: string;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
  token: string;
  totalJoin: number;
  link: string;
  user: string;
}
export interface message {
  _id?: string;
  sender: {
    _id?: string;
    name?: string;
    photo?: string;
  };
  session?: string;
  message?: string;
}

export interface ITasks {
  _id: string;
  title: string;
  tasks: {
    _id: string;
    name: string;
    isCompleted: boolean;
  }[];
  user: {
    _id: string | undefined;
    photo: string | null | undefined;
    name: string | null | undefined;
  };
  session: string;
}
