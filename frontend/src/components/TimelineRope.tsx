import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import {
  ROPE_COLOR,
  ROPE_COLOR_DARK,
  ROPE_COLOR_LIGHT,
  GOLD,
} from "../constants/theme";
import {
  ROPE_WIDTH,
  ROPE_CENTER_OFFSET,
  TIMELINE_ROPE_EXTENSION_TOP,
  TIMELINE_ROPE_GAP_BOTTOM,
  JUMP_RING_SIZE,
  JUMP_RING_CENTER_OFFSET,
  JUMP_RING_BOTTOM_OFFSET,
  CHARM_LOOP_SIZE,
  CHARM_HEART_SIZE,
  CHARM_CONTAINER_WIDTH,
  CHARM_CONTAINER_HEIGHT,
  CHARM_BOTTOM_OFFSET,
} from "../constants/spacing";

export default function TimelineRope() {
  return (
    <View style={styles.timelineLine}>
      {/* Base golden rope */}
      <View style={styles.timelineLineDecoration} />
      {/* Rope texture overlay */}
      <View style={styles.timelineRopeTexture} />
      {/* Shine/highlight for 3D effect */}
      <View style={styles.ropeShine} />

      {/* Jump ring connecting rope to charm */}
      <View style={styles.jumpRing}>
        {/* Small opening detail (jewelry feature) */}
        <View style={styles.jumpRingOpening} />
      </View>

      {/* Golden heart charm hanging at the end of the rope */}
      <View style={styles.ropeCharm}>
        {/* Small loop connecting heart to rope */}
        <View style={styles.charmLoop} />
        {/* Golden heart charm */}
        <View style={styles.heartCharm}>
          <Text style={styles.heartEmoji}>💛</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timelineLine: {
    position: "absolute",
    left: "50%",
    marginLeft: ROPE_CENTER_OFFSET,
    top: -TIMELINE_ROPE_EXTENSION_TOP,
    bottom: TIMELINE_ROPE_GAP_BOTTOM,
    width: ROPE_WIDTH,
    zIndex: 0, // Behind cards - visible between cards, hidden inside cards
  },
  timelineLineDecoration: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: ROPE_WIDTH,
    backgroundColor: ROPE_COLOR,
    opacity: 0.95,
    ...Platform.select({
      ios: {
        shadowColor: ROPE_COLOR,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        backgroundImage: `
          repeating-linear-gradient(
            45deg,
            ${ROPE_COLOR} 0px,
            ${ROPE_COLOR} 2px,
            ${ROPE_COLOR_DARK} 2px,
            ${ROPE_COLOR_DARK} 4px,
            ${ROPE_COLOR} 4px,
            ${ROPE_COLOR} 6px,
            ${ROPE_COLOR_LIGHT} 6px,
            ${ROPE_COLOR_LIGHT} 8px
          )
        `,
        boxShadow: `
          inset -1px 0 2px rgba(184, 134, 11, 0.7),
          inset 1px 0 2px rgba(255, 255, 255, 0.5),
          inset 0 -1px 2px rgba(184, 134, 11, 0.5),
          inset 0 1px 2px rgba(255, 255, 255, 0.4),
          0 0 6px rgba(255, 215, 0, 0.4),
          0 0 12px rgba(255, 215, 0, 0.2)
        `,
      },
    }),
  },
  timelineRopeTexture: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: ROPE_WIDTH,
    backgroundColor: "transparent",
    ...Platform.select({
      web: {
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 1px,
            rgba(184, 134, 11, 0.4) 1px,
            rgba(184, 134, 11, 0.4) 2px,
            transparent 2px,
            transparent 3px
          ),
          repeating-linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.1) 0px,
            rgba(255, 255, 255, 0.1) 1px,
            transparent 1px,
            transparent 2px
          )
        `,
        opacity: 0.6,
      },
      default: {
        opacity: 0.2,
        backgroundColor: "rgba(184, 134, 11, 0.3)",
      },
    }),
  },
  ropeShine: {
    position: "absolute",
    left: 1,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    opacity: 0.6,
  },
  jumpRing: {
    position: "absolute",
    left: "50%",
    marginLeft: JUMP_RING_CENTER_OFFSET,
    bottom: JUMP_RING_BOTTOM_OFFSET,
    width: JUMP_RING_SIZE,
    height: JUMP_RING_SIZE,
    borderRadius: JUMP_RING_SIZE / 2,
    borderWidth: 2,
    borderColor: GOLD,
    backgroundColor: "transparent",
    zIndex: 1,
    ...Platform.select({
      web: {
        boxShadow: `
          0 0 2px rgba(255, 215, 0, 0.8),
          inset 0 0 4px rgba(184, 134, 11, 0.5),
          inset 1px 1px 2px rgba(255, 255, 255, 0.3)
        `,
      },
      ios: {
        shadowColor: GOLD,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  jumpRingOpening: {
    position: "absolute",
    right: -1,
    top: 4,
    width: 2,
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 1,
  },
  ropeCharm: {
    position: "absolute",
    left: "50%",
    marginLeft: -CHARM_CONTAINER_WIDTH / 2,
    bottom: CHARM_BOTTOM_OFFSET,
    width: CHARM_CONTAINER_WIDTH,
    height: CHARM_CONTAINER_HEIGHT,
    zIndex: 2,
    alignItems: "center",
  },
  charmLoop: {
    position: "absolute",
    top: 0,
    left: 12,
    width: CHARM_LOOP_SIZE,
    height: CHARM_LOOP_SIZE,
    borderRadius: CHARM_LOOP_SIZE / 2,
    borderWidth: 2,
    borderColor: GOLD,
    backgroundColor: "#FFA500",
    zIndex: 1,
    ...Platform.select({
      web: {
        boxShadow: "inset 0 0 3px rgba(184, 134, 11, 0.7)",
      },
    }),
  },
  heartCharm: {
    position: "absolute",
    top: 10,
    left: 0,
    width: CHARM_HEART_SIZE,
    height: CHARM_HEART_SIZE,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: GOLD,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        filter: "drop-shadow(0 2px 8px rgba(255, 215, 0, 0.6))",
      },
    }),
  },
  heartEmoji: {
    fontSize: 32,
    ...Platform.select({
      web: {
        textShadow: "0px 0px 6px rgba(255, 215, 0, 0.8)",
      } as any,
      default: {
        textShadowColor: "rgba(255, 215, 0, 0.8)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
    }),
  },
});
