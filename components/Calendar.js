import React from 'react';
import FullCalendar from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';

export default function Calendar({
  events,
  handleDateClick,
  handleEventClick,
  renderEventContent,
  selectAllow,
  users,
}) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      slotMinWidth={30}
      slotMaxWidth={60}
      eventOverlap={true}
      initialView="todayWeek"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: ''
      }}
      views={{
        todayWeek: {
          type: 'timeGrid',
          duration: { days: 7 },
          buttonText: '今日から1週間',
          visibleRange: function (currentDate) {
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            const end = new Date(start);
            end.setDate(end.getDate() + 7);
            return { start, end };
          }
        }
      }}
      selectable={true}
      selectAllow={selectAllow}
      dateClick={handleDateClick}
      events={events}
      eventClick={handleEventClick}
      displayEventTime={false}
      height="auto"
      aspectRatio={1.5}
      contentHeight="auto"
      locale="ja"
      allDaySlot={false}
      slotDuration="01:00:00"
      snapDuration="01:00:00"
      selectMinDuration="01:00:00"
      selectMaxDuration="01:00:00"
      eventContent={renderEventContent}
      eventClassNames={(arg) => {
        if (arg.event.title === 'GROUP') {
          return 'group-event';
        } else {
          return 'custom-event';
        }
      }}
    />
  );
}