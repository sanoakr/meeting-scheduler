import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import FullCalendar from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Container, Row, Col, Button, Alert, Card, Form, Badge } from 'react-bootstrap';
import { getApiUrl } from '../../utils/api';

export default function GroupPage() {
  const router = useRouter();
  const { id } = router.query;
  const [groupName, setGroupName] = useState('');
  const [name, setName] = useState('');
  const [events, setEvents] = useState([]);
  const [results, setResults] = useState([]);
  const [isCopied, setIsCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState('');
  const [isGroupMode, setIsGroupMode] = useState(false); // 追加

  // クライアントサイドでのみ URL を設定（修正）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      setPageUrl(`${window.location.origin}${basePath}${router.asPath}`);
    }
  }, [router.asPath]);

  // APIエンドポイントのベースパスを設定
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  // ユーザー名に基づいて背景色を生成
  const getColorByUserName = (name) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
      '#D4A5A5', '#9B59B6', '#3498DB', '#1ABC9C', '#F1C40F',
      '#E74C3C', '#2ECC71', '#E67E22', '#7F8C8D', '#C0392B',
      '#8E44AD', '#F39C12', '#16A085', '#D35400', '#27AE60',
      '#2980B9', '#E84393', '#6C5CE7', '#00B894', '#00CEC9',
      '#FD79A8', '#6C5CE7', '#FDA7DF', '#A8E6CF', '#DCEDC1',
      '#FFD3B6', '#FF8B94', '#B83B5E', '#6A2C70', '#08D9D6'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // 日付フォーマット用ヘルパー関数
  const formatDateWithWeekday = (dateString) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString('ja-JP', options);
  };

  const formatTime = (dateString) => {
    const options = {
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleTimeString('ja-JP', options);
  };

  // グループ名を取得（修正）
  useEffect(() => {
    if (id) {
      fetch(getApiUrl(`/api/group/${id}`))
        .then((res) => res.json())
        .then((data) => {
          if (data.name) {
            setGroupName(data.name);
          } else {
            console.error('グループ名が取得できませんでした:', data.error);
          }
        })
        .catch((error) => console.error('Error fetching group name:', error));
    }
  }, [id, basePath]);

  // 候補日データを取得し、色を割り当てる（修正）
  useEffect(() => {
    if (id) {
      fetch(getApiUrl(`/api/group/${id}/candidates`))
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const coloredEvents = data.map(event => {
              let eventStyle = {
                backgroundColor: getColorByUserName(event.title || 'Unknown User'),
                textColor: '#fff',
              };

              // 'GROUP' ユーザーの場合のスタイルを調整
              if (event.title === 'GROUP') {
                eventStyle = {
                  backgroundColor: 'rgba(255, 165, 0, 0.5)', // 半透明のオレンジ色
                  borderColor: 'orange',
                  textColor: '', // テキストは表示しない
                  display: 'background',
                };
              }

              return {
                ...event,
                ...eventStyle,
              };
            });
            setEvents(coloredEvents);
          } else {
            console.warn('予期しないデータ形式:', data);
            setEvents([]);
          }
        })
        .catch((error) => console.error('Error fetching candidates:', error));
    }
  }, [id, basePath]);

  // 最終候補日データを取得（修正）
  useEffect(() => {
    if (id) {
      fetch(getApiUrl(`/api/group/${id}/results`))
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setResults(data);
          } else {
            console.warn('予期しないデータ形式:', data);
            setResults([]);
          }
        })
        .catch((error) => console.error('Error fetching results:', error));
    }
  }, [id, events, basePath]);

  // URL をクリップボードにコピー
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(pageUrl)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((error) => console.error('URLのコピーに失敗しました:', error));
  };

  // グループイベントの存在確認関数を追加（useEffect の前に配置）
  const hasGroupEventAt = (time) => {
    return events.some(event => 
      event.title === 'GROUP' && 
      new Date(event.start).getTime() === time.getTime()
    );
  };

  // GROUP イベントの存在確認関数を追加
  const hasAnyGroupEvents = () => {
    return events.some(event => event.title === 'GROUP');
  };

  // 日付クリック時の処理（修正済み）
  const handleDateClick = async (clickInfo) => {
    console.log('Date clicked:', clickInfo.start, clickInfo.end); // デバッグ用ログ
    let currentName = isGroupMode ? 'GROUP' : name;

    if (!currentName.trim()) {
      alert('名前を入力してください');
      return;
    }

    const start = clickInfo.date;
    const end = new Date(start);
    end.setHours(end.getHours() + 1); // 1時間後を終了時間とする

    // グループモードでない場合の制御を修正
    if (!isGroupMode) {
      const hasGroup = hasGroupEventAt(start);
      const noGroupEvents = !hasAnyGroupEvents();

      // GROUP イベントが存在しない場合はどのスロットでも選択可能
      if (!hasGroup && !noGroupEvents) {
        alert('グループの候補時間として設定されていない時間帯は選択できません');
        return;
      }
    }

    // 選択された期間が1時間かどうかを確認
    const duration = (end - start) / (1000 * 60 * 60); // 時間単位で計算
    if (duration !== 1) {
      alert('候補日は1時間単位で選択してください');
      return;
    }

    // 同じユーザーが同じ時間帯に既にイベントを持っているか確認
    const existingEvent = events.find(e =>
      e.title === currentName &&
      new Date(e.start).getTime() === start.getTime() &&
      new Date(e.end).getTime() === end.getTime()
    );

    if (existingEvent) {
      // イベントを削除する
      if (confirm('この時間帯の自分のイベントを削除しますか？')) {
        const eventId = parseInt(existingEvent.id);
        try {
          const res = await fetch(`${basePath}/api/group/${id}/candidates`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId }),
          });

          if (res.ok) {
            setEvents(events.filter(e => e.id !== existingEvent.id));
          } else {
            const errorData = await res.json();
            alert(`エラー: ${errorData.error}`);
          }
        } catch (err) {
          alert('イベントの削除中にエラーが発生しました');
          console.error('Error deleting event:', err);
        }
      }
    } else {
      // イベントを追加する
      try {
        const res = await fetch(`${basePath}/api/group/${id}/candidates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start, end, name: currentName }),
        });

        if (res.ok) {
          const data = await res.json();
          // ユーザーごとの色を��定
          let newEventStyle = {
            backgroundColor: getColorByUserName(currentName),
            textColor: '#fff',
          };

          if (currentName === 'GROUP') {
            newEventStyle = {
              backgroundColor: 'rgba(255, 165, 0, 0.5)', // 半透明のオレンジ色
              borderColor: 'orange',
              textColor: '',
              display: 'background',
            };
          }

          const newEvent = {
            ...data,
            ...newEventStyle,
          };
          setEvents([...events, newEvent]);
        } else {
          const errorData = await res.json();
          alert(`エラー: ${errorData.error}`);
        }
      } catch (err) {
        alert('イベントの追加中にエラーが発生しました');
        console.error('Error adding event:', err);
      }
    }
  };

  // イベントクリック時の処理（修正済み）
  const handleEventClick = async (clickInfo) => {
    if (!name.trim() && !isGroupMode) {
      alert('イベントを操作するには、まず名前を入力してください。');
      return; // 名前が未入力の場合、処理を中断
    }

    let currentName = isGroupMode ? 'GROUP' : name;
    const event = clickInfo.event;
    const eventStart = event.start;
    const eventEnd = event.end;

    // グループモードでない場合の制御を修正
    if (!isGroupMode) {
      const hasGroup = hasGroupEventAt(eventStart);
      const noGroupEvents = !hasAnyGroupEvents();

      // GROUP イベントが存在しない場合はどのスロットでも操作可能
      if (!hasGroup && !noGroupEvents) {
        alert('グループの候補時間として設定されていない時間帯は選択できません');
        return;
      }
    }

    // 同じ時間帯に自分のイベントがあるか確認
    const existingEvent = events.find(e =>
      e.title === currentName &&
      new Date(e.start).getTime() === eventStart.getTime() &&
      new Date(e.end).getTime() === eventEnd.getTime()
    );

    if (existingEvent) {
      // 自分のイベントがある場合、削除する
      if (confirm('この時間帯の自分のイベントを削除しますか？')) {
        const eventId = parseInt(existingEvent.id);
        try {
          const res = await fetch(`${basePath}/api/group/${id}/candidates`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId }),
          });

          if (res.ok) {
            // カレンダーからイベントを削除
            const calendarApi = clickInfo.view.calendar;
            const eventToRemove = calendarApi.getEventById(existingEvent.id);
            if (eventToRemove) {
              eventToRemove.remove();
            }
            setEvents(events.filter(e => e.id !== existingEvent.id));
          } else {
            const errorData = await res.json();
            alert(`エラー: ${errorData.error}`);
          }
        } catch (err) {
          alert('イベントの削除中にエラーが発生しました');
          console.error('Error deleting event:', err);
        }
      }
    } else {
      // 自分のイベントがない場合、追加する
      try {
        const res = await fetch(`${basePath}/api/group/${id}/candidates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: currentName,
            start: eventStart,
            end: eventEnd,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          // ユーザーごとの色を設定
          let newEventStyle = {
            backgroundColor: getColorByUserName(currentName),
            textColor: '#fff',
          };

          if (currentName === 'GROUP') {
            newEventStyle = {
              backgroundColor: 'rgba(255, 165, 0, 0.5)', // 半透明のオレンジ色
              borderColor: 'orange',
              textColor: '',
              display: 'background',
            };
          }

          const newEvent = {
            ...data,
            ...newEventStyle,
          };
          setEvents([...events, newEvent]);
        } else {
          const errorData = await res.json();
          alert(`エラー: ${errorData.error}`);
        }
      } catch (err) {
        alert('イベントの追加中にエラーが発生しました');
        console.error('Error adding event:', err);
      }
    }
  };

  // カスタムイベントレンダリング関数
  function renderEventContent(eventInfo) {
    if (eventInfo.event.title === 'GROUP') {
      // 'GROUP' イベントの場合は何も表示しない
      return null;
    }
    const firstChar = eventInfo.event.title.charAt(0).toUpperCase();
    return (
      <div className="event-circle">
        {firstChar}
      </div>
    );
  }

  // FullCalendar の選択を許可する関数
  const selectAllow = (selectInfo) => {
    const { start, end } = selectInfo;
    const duration = (end - start) / (1000 * 60 * 60); // 時間単位で計算
    return duration === 1;
  };

  // 候補日の最大人数を計算
  const maxCount = results.length > 0 ? Math.max(...results.map(r => r._count.id)) : 0;

  // ユーザー一覧を抽出
  const usersMap = new Map();
  events.forEach(event => {
    if (event.title && event.backgroundColor && event.title !== 'GROUP') {
      usersMap.set(event.title, event.backgroundColor);
    }
  });
  const users = Array.from(usersMap.entries()); // [ユーザー名, 色] の配列

  // ユーザー一覧を取得する関数を追加
  const getUsersForTimeSlot = (startTime) => {
    return events
      .filter(event => 
        new Date(event.start).getTime() === new Date(startTime).getTime() &&
        event.title !== 'GROUP'
      )
      .map(event => ({
        name: event.title,
        color: event.backgroundColor
      }));
  };

  return (
    <Container className="mt-5">
      {/* グループ名とURL */}
      <Row className="mb-4">
        <Col>
          <h1 className="text-center mb-3">{groupName || 'グループ名が設定されていません'}</h1>
          <div className="text-center">
            {pageUrl && (
              <Button variant="link" onClick={handleCopyUrl} style={{ textDecoration: 'underline' }}>
                {pageUrl}
              </Button>
            )}
            {isCopied && <Alert variant="success" className="mt-2">URLをコピーしました！</Alert>}
          </div>
        </Col>
      </Row>

      {/* カレンダーとサイドバー */}
      <Row>
        {/* カレンダー */}
        <Col md={8} className="mb-4 px-2">
          <Card>
            <Card.Body style={{ padding: '0.5rem' }}>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                slotMinWidth={30} // スロットの最小幅を設定
                slotMaxWidth={60} // スロットの最大幅を設定
                eventOverlap={true} // イベントの重なりを許可
                initialView="todayWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: '' // 「今週」ボタンを削除
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
                selectAllow={selectAllow} // 選択許可関数を追加
                dateClick={handleDateClick} // 修正済みのハンドラを使用
                events={events}
                eventClick={handleEventClick} // 修正済みのハンドラを使用
                displayEventTime={false} // 時間表示を無効化
                height="auto" // 高さを自動調整
                aspectRatio={1.5} // 幅と高さの比率を調整
                contentHeight="auto" // コンテンツに合わせて高さを調整
                locale="ja"
                allDaySlot={false}
                slotDuration="01:00:00" // 1時間単位
                snapDuration="01:00:00"  // スナップを1時間単位に
                selectMinDuration="01:00:00" // 選択の最小時間を1時間に
                selectMaxDuration="01:00:00" // 選択の最大時間を1時間に
                eventContent={renderEventContent} // カスタムイベントレンダリング
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
                      style={{ backgroundColor: color, cursor: 'pointer' }}
                      onClick={() => setName(userName)}
                    >
                      <span>{userName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* サイドバー */}
        <Col md={4}>
          {/* ユーザー名入力とグループ候補設定 */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">ユーザ名を入力してください</h5>
              {!isGroupMode && (
                <Form>
                  <Form.Group controlId="userName">
                    <Form.Control
                      type="text"
                      placeholder="名前を入力"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Form.Group>
                </Form>
              )}
              <Form.Check
                type="switch"
                id="group-mode-switch"
                label="グループ候補設定"
                checked={isGroupMode}
                onChange={(e) => {
                  setIsGroupMode(e.target.checked);
                  if (e.target.checked) {
                    setName('GROUP');
                  } else {
                    setName('');
                  }
                }}
                className="mt-3"
              />
            </Card.Body>
          </Card>

          {/* 最終候補日 */}
          <Card>
            <Card.Body>
              <h5 className="mb-3">最終候補日</h5>
              <ul className="list-unstyled">
                {results.map((result, index) => {
                  const isMax = result._count.id === maxCount;
                  const users = getUsersForTimeSlot(result.startDateTime);
                  return (
                    <React.Fragment key={index}>
                      <li className={`mb-2 d-flex justify-content-between align-items-center p-2 rounded ${isMax ? 'bg-warning text-dark' : ''}`}>
                        <span>
                          {formatDateWithWeekday(result.startDateTime)} - {formatTime(result.endDateTime)}
                        </span>
                        <span>
                          {result._count.id}人
                          {isMax && <Badge bg="secondary" className="ms-2">最も多い</Badge>}
                        </span>
                      </li>
                      {isMax && users.length > 0 && (
                        <li className="ms-3 mb-3">
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {users.map((user, userIndex) => (
                              <span
                                key={userIndex}
                                className="px-2 py-1 rounded"
                                style={{ 
                                  backgroundColor: user.color,
                                  color: '#fff',
                                  fontSize: '0.9rem'
                                }}
                              >
                                {user.name}
                              </span>
                            ))}
                          </div>
                        </li>
                      )}
                    </React.Fragment>
                  );
                })}
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

    </Container>
  );
}
