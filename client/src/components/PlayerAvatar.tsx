import { getAvatarUrl } from '../utils/avatar';

export const PlayerAvatar = ({ username }: { username: string }) => (
  <img
    src={getAvatarUrl(username)}
    alt={username}
    className="w-12 h-12 rounded-full border-2 border-yellow-600"
  />
);
