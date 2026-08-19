import { BlurTint, BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, ViewProps, ViewStyle } from "react-native";

interface GlassCardProps extends ViewProps {
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  tint?: BlurTint;
}

export default function GlassCard({
  children,
  style,
  intensity = 45,
  tint = "dark",
  ...props
}: GlassCardProps) {
  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[styles.container, style]}
      {...props}
    >
      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 0.08)",
          "rgba(255, 255, 255, 0)",
          "rgba(255, 255, 255, 0)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glareEffect}
      />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.25)",
    borderLeftColor: "rgba(255, 255, 255, 0.12)",
    borderRightColor: "rgba(255, 255, 255, 0.02)",
    borderBottomColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
  },
  glareEffect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
