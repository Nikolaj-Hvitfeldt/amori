import React, { forwardRef, useEffect } from "react";
import { Platform } from "react-native";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface WebDateInputProps {
  value: Date;
  onChange: (date: Date) => void;
  maxDate?: Date;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

// Custom input component that looks like our app's style
interface CustomInputProps {
  value?: string;
  onClick?: () => void;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  displayDate: string;
}

const CustomInput = forwardRef<HTMLDivElement, CustomInputProps>(
  ({ onClick, accentColor, backgroundColor, textColor, displayDate }, ref) => (
    <div
      ref={ref}
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px",
        borderRadius: "16px",
        border: `2px solid ${accentColor}60`,
        backgroundColor: backgroundColor,
        cursor: "pointer",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <span
        style={{
          fontSize: "17px",
          fontWeight: 500,
          color: textColor,
        }}
      >
        {displayDate}
      </span>
      <span style={{ fontSize: "20px" }}>📅</span>
    </div>
  )
);

CustomInput.displayName = "CustomInput";

/**
 * Customizable date picker for web using react-datepicker
 * Colors match the respective screen themes
 */
export default function WebDateInput({
  value,
  onChange,
  maxDate = new Date(),
  accentColor = "#FF6B9D",
  backgroundColor = "#1e293b",
  textColor = "#fff",
}: WebDateInputProps) {
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

  // Generate dynamic CSS for the datepicker based on accent color
  // Using dark background for good contrast, accent color for highlights
  const dynamicStyles = `
    .react-datepicker-popper {
      z-index: 9999 !important;
    }
    .react-datepicker-wrapper,
    .react-datepicker__input-container {
      width: 100%;
    }
    .react-datepicker {
      border: none !important;
      background-color: transparent !important;
    }
    .custom-datepicker-${accentColor.replace("#", "")} {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #1a1a2e !important;
      border: 2px solid ${accentColor} !important;
      border-radius: 16px !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5) !important;
      overflow: hidden;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker {
      background-color: #1a1a2e !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__month-container {
      background-color: #1a1a2e;
      float: none;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__header {
      background-color: #252542;
      border-bottom: 1px solid ${accentColor}60;
      padding: 12px;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__current-month {
      color: ${accentColor};
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__day-names {
      margin-top: 8px;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__day-name {
      color: #9ca3af;
      font-size: 12px;
      font-weight: 600;
      width: 36px;
      margin: 2px;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__month {
      margin: 8px;
      background-color: #1a1a2e;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__day {
      color: #e5e7eb;
      width: 36px;
      height: 36px;
      line-height: 36px;
      margin: 2px;
      border-radius: 50%;
      font-size: 14px;
      font-weight: 500;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__day:hover {
      background-color: ${accentColor}50;
      color: #fff;
      border-radius: 50%;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__day--selected {
      background-color: ${accentColor} !important;
      color: #fff !important;
      font-weight: 600;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__day--keyboard-selected {
      background-color: ${accentColor}70;
      color: #fff;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__day--today {
      font-weight: 700;
      border: 2px solid ${accentColor};
      color: ${accentColor};
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__day--disabled {
      color: #4b5563 !important;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__day--outside-month {
      color: #6b7280;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__navigation {
      top: 14px;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__navigation-icon::before {
      border-color: ${accentColor};
      border-width: 2px 2px 0 0;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__navigation:hover *::before {
      border-color: #fff;
    }
    .custom-datepicker-${accentColor.replace("#", "")} .react-datepicker__triangle {
      display: none;
    }
  `;

  return (
    <div style={{ width: "100%" }}>
      <style>{dynamicStyles}</style>
      <DatePicker
        selected={value}
        onChange={handleChange}
        maxDate={maxDate}
        customInput={
          <CustomInput
            accentColor={accentColor}
            backgroundColor={backgroundColor}
            textColor={textColor}
            displayDate={displayDate}
          />
        }
        calendarClassName={`custom-datepicker-${accentColor.replace("#", "")}`}
        popperPlacement="bottom-start"
        showPopperArrow={false}
        portalId="datepicker-portal-root"
      />
    </div>
  );
}
