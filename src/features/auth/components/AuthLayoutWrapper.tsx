import React, { PropsWithChildren } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

interface AuthLayoutWrapperProps extends PropsWithChildren {
  topFlex?: number;
}

export default function AuthLayoutWrapper({
  children,
}: AuthLayoutWrapperProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top White Area with Logo */}
      <View
        style={[
          styles.topHeader,
          {
            paddingTop: insets.top + 16,
          },
        ]}
      >
        <Image
          source={require("../../../../assets/images/pranata-auth-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Bottom Black Card Area */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.bottomCardContainer}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: Math.max(insets.bottom, 24) + 16,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topHeader: {
    height: "32%",
    minHeight: 180,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 220,
    height: 80,
  },
  keyboardView: {
    flex: 1,
  },
  bottomCardContainer: {
    flex: 1,
    backgroundColor: "#000000",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: "hidden",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
});
