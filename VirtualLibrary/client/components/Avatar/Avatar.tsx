import Avatar, { ReactAvatarProps } from 'react-avatar';

const MyAvatar = ({ size = '50', src, name }: ReactAvatarProps) => {
  return <Avatar round size={size} src={src} name={name} />;
};

export default MyAvatar;
