import React, { useRef } from "react";
import { Platform } from "react-native";

interface WebDateInputProps {
  value: Date;
  onChange: (date: Date) => void;
  maxDate?: Date;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

/**
 * Date picker for web styled to match the app's design
 * Clicking anywhere on the field opens the date picker
 */
export default function WebDateInput({
  value,
  onChange,
  maxDate = new Date(),
  accentColor = "#FF6B9D",
  backgroundColor = "#1e293b",
  textColor = "#fff",
}: WebDateInputProps) {
  // Only render on web
  if (Platform.OS !== "web") {
    return null;
  }

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Format date for HTML date input (yyyy-mm-dd)
  const formatForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Format date for display
  const displayValue = value.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const maxDateStr = formatForInput(maxDate);

  const handleChange = (event: any) => {
    const dateStr = event.target?.value;
    if (dateStr) {
      const [year, month, day] = dateStr.split("-").map(Number);
      const newDate = new Date(year, month - 1, day);
      if (!isNaN(newDate.getTime())) {
        onChange(newDate);
      }
    }
  };

  const openPicker = () => {
    if (inputRef.current) {
      // Try showPicker() first (modern browsers)
      if (typeof inputRef.current.showPicker === "function") {
        try {
          inputRef.current.showPicker();
        } catch {
          // Fallback: focus and click
          inputRef.current.focus();
          inputRef.current.click();
        }
      } else {
        // Fallback for older browsers
        inputRef.current.focus();
        inputRef.current.click();
      }
    }
  };

  return (
    <div
      onClick={openPicker}
      style={{
        position: "relative",
        width: "100%",
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
      }}
    >
      <span
        style={{
          fontSize: "17px",
          fontWeight: 500,
          color: textColor,
        }}
      >
        {displayValue}
      </span>
      <span style={{ fontSize: "20px" }}>📅</span>
      {/* Hidden date input with accent color for picker styling */}
      <input
        ref={inputRef}
        type="date"
        value={formatForInput(value)}
        max={maxDateStr}
        onChange={handleChange}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          cursor: "pointer",
          pointerEvents: "none",
          // These properties can influence the date picker appearance in some browsers
          accentColor: accentColor,
          colorScheme: "dark",
        }}
      />
    </div>
  );
}
