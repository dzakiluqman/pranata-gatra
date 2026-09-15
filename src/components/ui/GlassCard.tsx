import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { COLORS } from '@/constants/theme';

export interface GlassCardProps extends ViewProps {
  style?: ViewStyle | ViewStyle[];
}

export function GlassCard({
  children,
  style,
  ...props
}: GlassCardProps) {
  return (
    <View style={[styles.container, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
  },
});

export default GlassCard;

