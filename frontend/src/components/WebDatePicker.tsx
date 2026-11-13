import React, { forwardRef, useEffect, useState } from "react";
import { Platform } from "react-native";
import DatePicker from "react-datepicker";
import { CalendarDays } from "lucide-react-native";
import { color, field, focus, fontFamily, radius, space, type } from "../theme";
import { ICON_STROKE, iconSize, withAlpha } from "../ui";

// Import CSS for react-datepicker (warning is harmless - falls back to file-based resolution)
// This warning occurs because react-datepicker doesn't export the CSS path in package.json exports
// but it still works correctly via file-based resolution
if (Platform.OS === "web") {
  // Use require to avoid TypeScript/module resolution issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("react-datepicker/dist/react-datepicker.css");
}

interface WebDateInputProps {
  value: Date;
  onChange: (date: Date) => void;
  maxDate?: Date;
  /** Selected day. Default color.accent. */
  accentColor?: string;
  /** Field background. Default color.surfaceRaised. */
  backgroundColor?: string;
  /** Field text. Default color.text. */
  textColor?: string;
}

// Custom input component: the 52px form field [7A]
interface CustomInputProps {
  value?: string;
  onClick?: () => void;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  displayDate: string;
  open: boolean;
}

const CustomInput = forwardRef<HTMLDivElement, CustomInputProps>(
  ({ onClick, accentColor, backgroundColor, textColor, displayDate, open }, ref) => (
    <div
      ref={ref}
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: space.md,
        minHeight: field.height,
        paddingLeft: space.lg,
        paddingRight: space.lg,
        borderRadius: radius.field,
        border: `${focus.width}px solid ${open ? accentColor : "transparent"}`,
        backgroundColor,
        cursor: "pointer",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <span
        style={{
          fontFamily: fontFamily.sans,
          fontSize: type.body.fontSize,
          lineHeight: `${type.body.lineHeight}px`,
          color: textColor,
        }}
      >
        {displayDate}
      </span>
      <CalendarDays size={iconSize.md} color={color.textMuted} strokeWidth={ICON_STROKE} />
    </div>
  )
);

CustomInput.displayName = "CustomInput";

/** Scopes the popup theme to this picker; see buildPopupCss. */
const CALENDAR_CLASS = "amori-datepicker";
/** Calendar day cell edge, px. */
const DAY = space.xxl + space.xs;

/**
 * The react-datepicker popup themed from tokens [7A]: a dark `surface` panel with a
 * hairline outline (flat: no shadow [4B]), Figtree text, the serif month title,
 * and an amber selected day with onAccent text. Built at runtime from token values.
 */
function buildPopupCss(accentColor: string): string {
  const c = `.${CALENDAR_CLASS}`;
  return `
    .react-datepicker-popper { z-index: 9999 !important; }
    .react-datepicker-wrapper,
    .react-datepicker__input-container { width: 100%; }
    ${c} {
      font-family: ${fontFamily.sans}, sans-serif;
      background-color: ${color.surface} !important;
      color: ${color.text};
      border: 1px solid ${color.outline} !important;
      border-radius: ${radius.field}px !important;
      box-shadow: none !important;
      overflow: hidden;
    }
    ${c} .react-datepicker__month-container { background-color: ${color.surface}; float: none; }
    ${c} .react-datepicker__header {
      background-color: ${color.surfaceRaised};
      border-bottom: 1px solid ${color.hairline};
      border-radius: 0 !important;
      padding: ${space.md}px;
    }
    ${c} .react-datepicker__current-month {
      font-family: ${fontFamily.serif}, serif;
      font-weight: 400;
      font-size: ${type.title.fontSize - space.xs}px;
      color: ${color.text};
      margin-bottom: ${space.sm}px;
    }
    ${c} .react-datepicker__day-names { margin-top: ${space.sm}px; }
    ${c} .react-datepicker__day-name {
      font-family: ${fontFamily.sansMedium}, sans-serif;
      font-size: ${type.caption.fontSize}px;
      color: ${color.textMuted};
      width: ${DAY}px;
      margin: 2px;
    }
    ${c} .react-datepicker__month { margin: ${space.sm}px; background-color: ${color.surface}; }
    ${c} .react-datepicker__day {
      color: ${color.text};
      width: ${DAY}px;
      height: ${DAY}px;
      line-height: ${DAY}px;
      margin: 2px;
      border-radius: ${radius.pill}px;
      font-size: ${type.body.fontSize - 2}px;
    }
    ${c} .react-datepicker__day:hover { background-color: ${color.outline}; color: ${color.text}; border-radius: ${radius.pill}px; }
    ${c} .react-datepicker__day--keyboard-selected { background-color: ${withAlpha(accentColor, 0.3)}; color: ${color.text}; }
    ${c} .react-datepicker__day--today { font-weight: 600; box-shadow: inset 0 0 0 1px ${color.textMuted}; }
    ${c} .react-datepicker__day--selected,
    ${c} .react-datepicker__day--selected:hover {
      background-color: ${accentColor} !important;
      color: ${color.onAccent} !important;
      font-weight: 600;
    }
    ${c} .react-datepicker__day--disabled,
    ${c} .react-datepicker__day--disabled:hover {
      color: ${color.textMuted} !important;
      opacity: 0.4;
      background-color: transparent;
    }
    ${c} .react-datepicker__day--outside-month { color: ${color.textMuted}; }
    ${c} .react-datepicker__navigation { top: ${space.md + 2}px; }
    ${c} .react-datepicker__navigation-icon::before { border-color: ${color.textMuted}; border-width: 2px 2px 0 0; }
    ${c} .react-datepicker__navigation:hover *::before { border-color: ${color.text}; }
    ${c} .react-datepicker__navigation:focus-visible {
      outline: ${focus.width}px solid ${color.accent};
      outline-offset: ${focus.offset}px;
    }
    ${c} .react-datepicker__triangle { display: none; }
  `;
}

/**
 * Date field for web using react-datepicker [7A]: a 52px Figtree field on
 * surfaceRaised with a Lucide calendar icon, and a token-themed popup.
 */
export default function WebDateInput({
  value,
  onChange,
  maxDate = new Date(),
  accentColor = color.accent,
  backgroundColor = color.surfaceRaised,
  textColor = color.text,
}: WebDateInputProps) {
  const [open, setOpen] = useState(false);

  // Create portal container at document body level
  useEffect(() => {
    if (Platform.OS === "web") {
      const win = globalThis as any;
      if (win.document) {
        let portal = win.document.getElementById("datepicker-portal-root");
        if (!portal) {
          portal = win.document.createElement("div");
          portal.id = "datepicker-portal-root";
          portal.style.position = "fixed";
          portal.style.top = "0";
          portal.style.left = "0";
          portal.style.zIndex = "999999";
          win.document.body.appendChild(portal);
        }
      }
    }
  }, []);

  // Only render on web
  if (Platform.OS !== "web") {
    return null;
  }

  // Format date for display
  const displayDate = value.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleChange = (date: Date | null) => {
    if (date) {
      onChange(date);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <style>{buildPopupCss(accentColor)}</style>
      <DatePicker
        selected={value}
        onChange={handleChange}
        maxDate={maxDate}
        onCalendarOpen={() => setOpen(true)}
        onCalendarClose={() => setOpen(false)}
        customInput={
          <CustomInput
            accentColor={accentColor}
            backgroundColor={backgroundColor}
            textColor={textColor}
            displayDate={displayDate}
            open={open}
          />
        }
        calendarClassName={CALENDAR_CLASS}
        popperPlacement="bottom-start"
        showPopperArrow={false}
        portalId="datepicker-portal-root"
      />
    </div>
  );
}
