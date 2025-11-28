import { Platform } from "react-native";

/**
 * Generate platform-specific box shadow styles
 */
export const getBoxShadow = (
  shadowColor: string,
  shadowOffset: { width: number; height: number },
  shadowOpacity: number,
  shadowRadius: number
) => {
  if (Platform.OS === "web") {
    const color = shadowColor.startsWith("#")
      ? shadowColor +
        Math.round(shadowOpacity * 255)
          .toString(16)
          .padStart(2, "0")
      : shadowColor;
    return {
      boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px 0px ${color}`,
    } as any;
  }
  return {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
  };
};

/**
 * Generate platform-specific text shadow styles
 */
export const getTextShadow = (
  textShadowColor: string,
  textShadowOffset: { width: number; height: number },
  textShadowRadius: number
) => {
  return Platform.select({
    web: {
      textShadow: `${textShadowOffset.width}px ${textShadowOffset.height}px ${textShadowRadius}px ${textShadowColor}`,
    } as any,
    default: {
      textShadowColor,
      textShadowOffset,
      textShadowRadius,
    },
  });
};

