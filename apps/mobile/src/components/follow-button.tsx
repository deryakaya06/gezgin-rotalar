import { StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { useFollow } from '@/hooks/use-follow';

export function FollowButton({ userId, large }: { userId: string; large?: boolean }) {
  const { isFollowing, busy, toggle, isSelf } = useFollow(userId);
  if (isSelf) return null;

  return (
    <Button
      title={isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
      variant={isFollowing ? 'primary' : 'outline'}
      size={large ? 'large' : 'small'}
      onPress={toggle}
      disabled={busy}
      style={large ? styles.large : styles.small}
    />
  );
}

const styles = StyleSheet.create({
  large: { alignSelf: 'stretch' },
  small: { alignSelf: 'flex-start' },
});
