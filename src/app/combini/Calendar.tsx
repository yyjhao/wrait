"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import styles from "./Calendar.module.css"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={`${styles.calendar} ${className ?? ""}`}
      classNames={{
        chevron: styles.chevron,
        weekdays: styles.weekdays,
        weekday: styles.weekday,
        week: styles.week,
        today: styles.today,
        selected: styles.selected,
        range_middle: styles.range_middle,
        range_end: styles.range_end,
        outside: styles.outside,
        nav: styles.nav,
        months: styles.months,
        month: styles.month,
        month_grid: styles.month_grid,
        month_caption: styles.month_caption,
        hidden: styles.hidden,
        footer: styles.footer,
        disabled: styles.disabled,
        day: styles.day, // the cell around day button
        day_button: styles.day_button, // the day button
        cell: styles.cell,
        caption_label: styles.caption_label,
        button_previous: styles.button_previous,
        button_next: styles.button_next,
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
