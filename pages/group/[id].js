// pages/group/[id].js

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import FullCalendar from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Container, Row, Col, Button, Alert, Card, Form, Badge } from 'react-bootstrap';

export default function GroupPage() {
  const router = useRouter();
  const { id } = router.query;
  const [groupName, setGroupName] = useState('');
  const [name, setName] = useState('');
  const [events, setEvents] = useState([]);
  const [results, setResults] = useState([]);
  const [isCopied, setIsCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState('');

  // ユーザー名に基づいて背景色を生成
  const getColorByUserName = (name) => {
    const colors = [
      '#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9', '#BBDEFB',
      '#B3E5FC', '#B2EBF2', '#B2DFDB', '#C8E6C9', '#DCEDC8', '#F0F4C3',
      '#FFF9C4', '#FFECB3', '#FFE0B2', '#FFCCBC',
      // 新しい色を追加
      '#FFAB91', '#FFCC80', '#FFE082', '#FFF59D', '#E6EE9C', '#C5E1A5',
      '#A5D6A7', '#80CBC4', '#80DEEA', '#81D4FA', '#90CAF9', '#9FA8DA',
      '#A5A9E6', '#CE93D8', '#F48FB1', '#FFAB91'
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

  // グループ名を取得
  useEffect(() => {
    if (id) {
      fetch(`/api/group/${id}`)
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
  }, [id]);

  // 候補日データを取得し、色を割り当てる
  useEffect(() => {
    if (id) {
      fetch(`/api/group/${id}/candidates`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const coloredEvents = data.map(event => ({
              ...event,
              backgroundColor: getColorByUserName(event.title || 'Unknown User'),
              textColor: '#fff', // テキスト色を白に設定
            }));
            setEvents(coloredEvents);
          } else {
            console.warn('予期しないデータ形式:', data);
            setEvents([]);
          }
        })
        .catch((error) => console.error('Error fetching candidates:', error));
    }
  }, [id]);

  // 最終候補日データを取得
  useEffect(() => {
    if (id) {
      fetch(`/api/group/${id}/results`)
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
  }, [id, events]);

  // クライアントサイドでのみ URL を設定
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageUrl(window.location.href);
    }
  }, []);

  // URL をクリップボードにコピー
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(pageUrl)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((error) => console.error('URLのコピーに失敗しました:', error));
  };

  // 日付クリック時の処理
  const handleDateClick = async (clickInfo) => {
    console.log('Date clicked:', clickInfo.start, clickInfo.end); // デバッグ用ログ
    if (!name.trim()) {
      alert('名前を入力してください');
      return;
    }

    const start = clickInfo.date;
    const end = new Date(start);
    end.setHours(end.getHours() + 1); // 1時間後を終了時間とする

    // 選択された期間が1時間かどうかを確認
    const duration = (end - start) / (1000 * 60 * 60); // 時間単位で計算
    if (duration !== 1) {
      alert('候補日は1時間単位で選択してください');
      return;
    }

    try {
      const res = await fetch(`/api/group/${id}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end, name }),
      });

      if (res.ok) {
        const data = await res.json();
        // ユーザーごとの色を設定
        const newEvent = {
          ...data,
          backgroundColor: getColorByUserName(name),
          textColor: '#fff',
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
  };

  // イベントクリック時の処理
  const handleEventClick = async (clickInfo) => {
    if (!name.trim()) {
      alert('イベントを操作するには、まず名前を入力してください。');
      return; // 名前が未入力の場合、処理を中断
    }

    const event = clickInfo.event;
    const eventStart = event.start;
    const eventEnd = event.end;

    if (event.title === name) {
      if (confirm(`"${event.title}"のイベントを削除しますか？`)) {
        const eventId = parseInt(event.id);
        try {
          const res = await fetch(`/api/group/${id}/candidates`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId }),
          });

          if (res.ok) {
            event.remove();
            setEvents(events.filter(e => e.id !== event.id));
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
      // 他のユーザーのイベントの場合、同じ時間帯に自分の予定がないか確認して追加
      const hasOwnEvent = events.some(e =>
        e.title === name &&
        new Date(e.start).getTime() === eventStart.getTime() &&
        new Date(e.end).getTime() === eventEnd.getTime()
      );

      if (hasOwnEvent) {
        alert('この時間帯には既に自分の予定があります。');
      } else {
        try {
          const res = await fetch(`/api/group/${id}/candidates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              start: eventStart,
              end: eventEnd,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            // ユーザーごとの色を設定
            const newEvent = {
              ...data,
              backgroundColor: getColorByUserName(name),
              textColor: '#fff',
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
    }
  };

  // カスタムイベントレンダリング関数
  function renderEventContent(eventInfo) {
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
    if (event.title && event.backgroundColor) {
      usersMap.set(event.title, event.backgroundColor);
    }
  });
  const users = Array.from(usersMap.entries()); // [ユーザー名, 色] の配列

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
                dateClick={handleDateClick} // 追加
                events={events}
                eventClick={handleEventClick}
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
                eventClassNames="custom-event" // イベントにカスタムクラスを追加
                eventOverlap={false}
              />
              {/* ユーザー一覧を表示 */}
              <div className="mt-4">
                <h5 className="mb-3">ユーザー一覧</h5>
                <div className="d-flex flex-wrap">
                  {users.map(([userName, color], index) => (
                    <div key={index} className="mb-2 me-2 px-3 py-1 rounded" style={{ backgroundColor: color }}>
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
          {/* ユーザー名入力 */}
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">ユーザー名を入力してください</h5>
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
            </Card.Body>
          </Card>

          {/* 最終候補日 */}
          <Card>
            <Card.Body>
              <h5 className="mb-3">最終候補日</h5>
              <ul className="list-unstyled">
                {results.map((result, index) => {
                  const isMax = result._count.id === maxCount; // 最大人数かどうかを判定
                  return (
                    <li
                      key={index}
                      className={`mb-2 d-flex justify-content-between align-items-center p-2 rounded ${isMax ? 'bg-warning text-dark' : ''}`}
                    >
                      <span>
                        {formatDateWithWeekday(result.startDateTime)} - {formatTime(result.endDateTime)}
                      </span>
                      <span>
                        {result._count.id}人
                        {isMax && <Badge bg="secondary" className="ms-2">最も多い</Badge>}
                      </span>
                    </li>
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
