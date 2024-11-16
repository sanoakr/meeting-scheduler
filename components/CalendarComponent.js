import React from 'react';
import FullCalendar from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Card } from 'react-bootstrap';

const CalendarComponent = ({
  events,
  handleDateClick,
  handleEventClick,
  renderEventContent,
  selectAllow,
  users,
  version,
  setName, // 追加
}) => (
  <>
    <Card>
      <Card.Body style={{ padding: '0.5rem' }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="todayWeek" // カスタムビューを初期表示に設定
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '', // 追加のボタンは不要
          }}
          views={{
            todayWeek: {
              type: 'timeGrid',
              duration: { days: 7 },
              buttonText: '今週',
              visibleRange: (currentDate) => {
                const startDate = new Date(currentDate);
                const day = startDate.getDay(); // 曜日を取得（0:日曜, 6:土曜）
                startDate.setDate(startDate.getDate() - day); // 日曜にセット
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 7); // 1週間後を計算
                return { start: startDate, end: endDate };
              },
            },
          }}
          slotMinWidth={30} // スロットの最小幅を設定
          slotMaxWidth={60} // スロットの最大幅を設定
          eventOverlap={true} // イベントの重なりを許可
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
              return 'group-event'; // カスタムクラスを追加
            } else {
              return 'custom-event';
            }
          }}
        />
        {/* ユーザー一覧を表示 */}
        <div className="mt-4">
          <div className="d-flex flex-wrap">
            {users.map(([userName, color], index) => (
              <div
                key={index}
                className="mb-2 me-2 px-3 py-1 rounded"
                style={{ backgroundColor: color, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%' }}
                onClick={() => setName(userName)} // 修正：名前をセットする
              >
                <span>{userName.charAt(0).toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </Card.Body>
    </Card>
    <div className="text-end mt-2" style={{ fontSize: '0.8rem', color: '#6c757d' }}>
      ver. {version}
    </div>
  </>
);

export default CalendarComponent;