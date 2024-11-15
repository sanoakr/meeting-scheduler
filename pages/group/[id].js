import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns-tz'; // utcToZonedTime を削除
import { v4 as uuidv4 } from 'uuid';
import io from 'socket.io-client'; // 追加

// ICSファイル生成用のヘルパー関数を修正
const generateICSContent = (results, groupName) => {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const timeZone = 'Asia/Tokyo';

  // ICSファイルのヘッダー
  const icsHeader = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Meeting Scheduler//NONSGML v1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    `TZID:${timeZone}`,
    'END:VTIMEZONE'
  ].join('\r\n');

  // ICSファイルのフッター
  const icsFooter = 'END:VCALENDAR';

  // 各候補日のVEVENTを生成
  const events = results.map(result => {
    const users = getUsersForTimeSlot(result.startDateTime);
    const userNames = users.map(user => user.name).join(',');
    
    // 日付をICSフォーマットに変換
    const startDate = new Date(result.startDateTime);
    const endDate = new Date(result.endDateTime);
    const start = format(startDate, "yyyyMMdd'T'HHmmss", { timeZone });
    const end = format(endDate, "yyyyMMdd'T'HHmmss", { timeZone });

    return [
      'BEGIN:VEVENT',
      `DTSTART;TZID=${timeZone}:${start}`,
      `DTEND;TZID=${timeZone}:${end}`,
      `DTSTAMP:${now}`,
      `UID:${result.id}@meetingscheduler`,
      `SUMMARY:${groupName} (${userNames})`,
      'END:VEVENT'
    ].join('\r\n');
  });

  return `${icsHeader}\r\n${events.join('\r\n')}\r\n${icsFooter}`;
};
import { Container, Row, Col, Button, Alert, Card, Form, Badge } from 'react-bootstrap';
import { getApiUrl } from '../../utils/api';
import fs from 'fs';
import path from 'path';
import GroupHeader from '../../components/GroupHeader';
import CalendarComponent from '../../components/CalendarComponent';
import CommentSection from '../../components/CommentSection';
import Sidebar from '../../components/Sidebar';
import {
  getColorByUserName,
  formatDateWithWeekday,
  formatTime,
} from '../../utils/utils';

export async function getServerSideProps(context) {
  const { id } = context.params;
  
  // プロトコルとホスト名を取得してベース URL を構築
  const protocol = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers['host'];
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''; // 追加
  const baseUrl = `${protocol}://${host}${basePath}`; // 変更
  
  const res = await fetch(`${baseUrl}/api/group/${id}`); // 変更箇所
  const data = await res.json();

  if (res.status !== 200 || !data.name) {
    // グループが存在しない場合、404エラーページを表示
    return {
      notFound: true,
    };
  }

  const versionFilePath = path.join(process.cwd(), 'version.txt');
  const version = fs.readFileSync(versionFilePath, 'utf8').trim();
  
  return {
    props: {
      version,
      groupName: data.name,
      // ...existing props...
    },
  };
}

let socket; // 追加

export default function GroupPage({ version }) {
  const router = useRouter();
  const { id } = router.query;
  const [groupName, setGroupName] = useState('');
  const [name, setName] = useState('');
  const [events, setEvents] = useState([]);
  const [results, setResults] = useState([]);
  const [isCopied, setIsCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState('');
  const [isGroupMode, setIsGroupMode] = useState(false); // 追加
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const socketRef = useRef(null);  // socket インスタンスを保持するref
  // const [isIcsMode, setIsIcsMode] = useState(false); // ics トグルスイッチの状態
  // const [selectedResults, setSelectedResults] = useState([]); // チェックされた日時項目のIDを管理
  
  // ユーザー色を管理するためのStateを追加
  const [userColors, setUserColors] = useState(new Map());

  // クライアントサイドでのみ URL を設定（修正）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      setPageUrl(`${window.location.origin}${basePath}${router.asPath}`);
    }
  }, [router.asPath]);
  
  // APIエンドポイントのベースパスを設定
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  
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
          const coloredEvents = data.map(applyEventStyle);
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
  }, [id, basePath]);
  
  useEffect(() => {
    if (id) {
      fetch(getApiUrl(`/api/group/${id}/comments`))
      .then(res => res.json())
      .then(data => {
        console.log('Fetched comments:', data); // デバッグ用にコンソール出力
        
        if (Array.isArray(data)) {
          setComments(data);
        } else {
          console.error('コメントのデータ形式が不正です:', data);
          setComments([]); // データ形式が不正な場合は空の配列をセット
        }
      })
      .catch(error => {
        console.error('Error fetching comments:', error);
        setComments([]); // エラー発生時も空の配列をセット
      });
    }
  }, [id]);
  
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
  
  // ユーザー一覧を取得する関数（先に定義）
  const getUsersForTimeSlot = (startTime) => {
    return events
    .filter(event => 
      new Date(event.start).getTime() === new Date(startTime).getTime() &&
      event.title !== 'GROUP'  // GROUP を除外
    )
    .map(event => ({
      name: event.title,
      color: event.backgroundColor
    }));
  };
  
  // 候補日の最大人数を計算（GROUP を除外）
  const maxCount = results.length > 0 ? 
  Math.max(...results.map(r => {
    const users = getUsersForTimeSlot(r.startDateTime);
    return users.length;  // GROUP を除外した実際のユーザー数
  })) : 0;
  
  // ユーザー一覧を抽出
  const usersMap = new Map();
  events.forEach(event => {
    if (event.title && event.backgroundColor && event.title !== 'GROUP') {
      usersMap.set(event.title, event.backgroundColor);
    }
  });
  const users = Array.from(usersMap.entries()); // [ユーザー名, 色] の配列
  
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
    
    // 同じユーザーが同じ時間帯に既にイベントを持っているか確認を強化
    const existingEvent = events.find(e =>
      e.title === currentName &&
      new Date(e.start).getTime() === start.getTime()
    );
    
    if (existingEvent) {
      // イベントを削除する
      try {
        const eventId = parseInt(existingEvent.id);
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
    } else {
      try {
        const res = await fetch(`${basePath}/api/group/${id}/candidates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start, end, name: currentName }),
        });
        
        if (res.ok) {
          const data = await res.json();
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
      try {
        const eventId = parseInt(existingEvent.id);
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
  
  // コメント追加ハンドラーを修正
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('コメントを投稿するには名前を入力してください');
      return;
    }
    if (!newComment.trim()) {
      alert('コメントを入力してください');
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/api/group/${id}/comments`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          text: newComment,
        }),
      });

      if (res.ok) {
        // サーバーからのWebSocket通知で処理されるため、
        // ここでのsetCommentsは不要
        setNewComment(''); // 入力フィールドをクリア
      } else {
        console.error('コメント投稿エラー:', await res.text());
        alert('コメントの投稿に失敗しました');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('コメントの投稿中にエラーが発生しました');
    }
  };

  // 最も多いリストの項目をデフォルトで選択
  // useEffect(() => {
  //   if (isIcsMode) {
  //     // 参加人数が最も多い候補を抽出
  //     const maxAttendees = results
  //     .filter(result => {
  //       const users = getUsersForTimeSlot(result.startDateTime);
  //       return users.length === maxCount;
  //     })
  //     .slice(0, 1) // 最初の1件のみを選択
  //     .map(result => result.id);
      
  //     setSelectedResults(maxAttendees);
  //   } else {
  //     setSelectedResults([]);
  //   }
  // }, [isIcsMode, results, maxCount]);
  
  // ICSファイル生成用のヘルパー関数を追加
  const generateICSContent = (results, groupName) => {
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const timeZone = 'Asia/Tokyo';
    
    // ICSファイルのヘッダー
    const icsHeader = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Meeting Scheduler//NONSGML v1.0//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ].join('\r\n');
    
    // ICSファイルのフッター
    const icsFooter = 'END:VCALENDAR';
    
    // 各候補日のVEVENTを生成
    const events = results.map(result => {
      const users = getUsersForTimeSlot(result.startDateTime);
      const userNames = users.map(user => user.name).join(',');
      const startDate = new Date(result.startDateTime);
      const endDate = new Date(result.endDateTime);
      
      // 日付をICSフォーマットに変換
      const start = format(startDate, "yyyyMMdd'T'HHmmss", { timeZone });
      const end = format(endDate, "yyyyMMdd'T'HHmmss", { timeZone });
          
      // UIDの生成: result.id が存在する場合はそれを使用し、存在しない場合はUUIDを生成
      const uid = result.id ? `${result.id}@meetingscheduler` : `${uuidv4()}@meetingscheduler`;
    
      return [
        'BEGIN:VEVENT',
        `DTSTART;TZID=${timeZone}:${start}`,
        `DTEND;TZID=${timeZone}:${end}`,
        `DTSTAMP:${now}`,
        `UID:${uid}@meetingscheduler`,
        `SUMMARY:${groupName} (${userNames})`,
        'END:VEVENT'
      ].join('\r\n');
    });
    
    // 完全なICSファイルの内容を生成
    return `${icsHeader}\r\n${events.join('\r\n')}\r\n${icsFooter}`;
  };
  
  // ダウンロードハンドラーを修正
  const handleDownload = () => {
    const icsContent = generateICSContent(results, groupName);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${groupName || 'meeting'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const fetchEvents = async () => {
    const res = await fetch(`/api/group/${id}/candidates`);
    // ...existing code...
  };

  const handleAddEvent = async (eventData) => {
    const res = await fetch(`/api/group/${id}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    // ...existing code...
  };

  const handleDeleteEvent = async (eventId) => {
    const res = await fetch(`/api/group/${id}/candidates`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    });
    // ...existing code...
  };

  // 重複したuseEffectを削除し、1つのWebSocket初期化処理にまとめる
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io();
      const socket = socketRef.current;

      socket.emit('joinGroup', { groupId: id });

      socket.on('eventAdded', ({ event, senderId, isServerEvent }) => {
        console.log('Received eventAdded:', { event, senderId, isServerEvent });
        setEvents(prevEvents => {
          // 既存のイベントとの重複チェックを修正
          const eventExists = prevEvents.some(e => 
            e.id === event.id || 
            (e.title === event.title && 
             new Date(e.start).getTime() === new Date(event.start).getTime())
          );
          
          if (!eventExists) {
            return [...prevEvents, applyEventStyle(event)];
          }
          return prevEvents;
        });
      });

      socket.on('eventDeleted', ({ eventId, senderId }) => {
        setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      });

      // 最終候補日更新のリスナーを追加
      socket.on('resultsUpdated', (newResults) => {
        console.log('Received resultsUpdated:', newResults);
        setResults(newResults);
      });

      // コメント追加のリスナーを追加
      socket.on('commentAdded', (newComment) => {
        console.log('Received commentAdded:', newComment);
        setComments(prevComments => [newComment, ...prevComments]);
      });

      return () => {
        socket.off('eventAdded');
        socket.off('eventDeleted');
        socket.off('resultsUpdated');
        socket.off('commentAdded'); // コメントリスナーの解除を追加
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [id]); // id のみを依存配列に含める

  const handleEventAdd = async (info) => {
    const { start, end } = info.dateStr ? 
      { start: new Date(info.dateStr), end: new Date(info.dateStr) } : 
      { start: info.start, end: info.end };

    try {
      const res = await fetch(`/api/group/${id}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          start,
          end
        })
      });

      if (!res.ok) {
        throw new Error('イベントの追加に失敗しました');
      }

      const newEvent = await res.json();
      setEvents(prev => [...prev, newEvent]);

      // 他のクライアントに通知
      socketRef.current.emit('addEvent', {
        groupId: id,
        event: newEvent
      });

      return true; // 成功を返す
    } catch (error) {
      console.error('Error adding event:', error);
      return false; // 失敗を返す
    }
  };

  const handleEventDelete = async (eventId) => {
    try {
      const res = await fetch(`/api/group/${id}/candidates`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: eventId.toString() })
      });

      if (!res.ok) {
        throw new Error('イベントの削除に失敗しました');
      }

      // ローカルでイベントを削除
      setEvents(prev => prev.filter(event => event.id !== eventId.toString()));

      // 他のクライアントに通知
      socketRef.current.emit('deleteEvent', {
        groupId: id,
        eventId: eventId.toString()
      });

      return true; // 成功を返す
    } catch (error) {
      console.error('Error deleting event:', error);
      return false; // 失敗を返す
    }
  };

  const handleDateSelect = async (selectInfo) => {
    const title = userName || '名前未設定';
    const calendarApi = selectInfo.view.calendar;

    try {
      const res = await fetch(`/api/group/${id}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: title,
          start: selectInfo.start,
          end: selectInfo.end,
        }),
      });

      if (!res.ok) {
        throw new Error('イベントの追加に失敗しました');
      }

      // ローカルでのイベント追加はサーバーからの通知で行うため、ここでは行わない
      calendarApi.unselect();
    } catch (error) {
      console.error('Error adding event:', error);
      calendarApi.unselect();
    }
  };

  // ユーザーの色を一貫して取得・管理する関数
  const getConsistentColorForUser = (username) => {
    if (userColors.has(username)) {
      return userColors.get(username);
    }
    const newColor = getColorByUserName(username);
    setUserColors(prev => new Map(prev).set(username, newColor));
    return newColor;
  };

  // イベントにスタイルを適用する関数を修正
  const applyEventStyle = (event) => {
    if (!event) return null;

    let eventStyle = {
      ...event,
      backgroundColor: getConsistentColorForUser(event.title),
      textColor: '#fff',
    };
    
    if (event.title === 'GROUP') {
      eventStyle = {
        ...event,
        backgroundColor: 'rgba(255, 165, 0, 0.5)',
        borderColor: 'orange',
        textColor: '',
        display: 'background',
      };
    }
    
    return eventStyle;
  };

  return (
    <Container className="mt-5">
      {/* グループ名とURL */}
      <GroupHeader
        groupName={groupName}
        pageUrl={pageUrl}
        handleCopyUrl={handleCopyUrl}
        isCopied={isCopied}
      />

      {/* カレンダーとサイドバー */}
      <Row>
        {/* カレンダー */}
        <Col md={8} className="mb-4 px-2">
          <CalendarComponent
            events={events}
            handleDateClick={handleDateClick}
            handleEventClick={handleEventClick}
            renderEventContent={renderEventContent}
            selectAllow={selectAllow}
            users={users}
            version={version}
            setName={setName} // 追加
          />

          <CommentSection
            comments={comments}
            handleAddComment={handleAddComment}
            newComment={newComment}
            setNewComment={setNewComment}
            name={name}
            getColorByUserName={getColorByUserName}
            formatDateWithWeekday={formatDateWithWeekday}
          />
        </Col>

        {/* サイドバー */}
        <Col md={4}>
          <Sidebar
            name={name}
            setName={setName}
            isGroupMode={isGroupMode}
            setIsGroupMode={setIsGroupMode}
            results={results}
            users={users}
            maxCount={maxCount}
            handleDownload={handleDownload}
            getUsersForTimeSlot={getUsersForTimeSlot}
            formatDateWithWeekday={formatDateWithWeekday}
            formatTime={formatTime}
            getColorByUserName={getColorByUserName}
          />
        </Col>
      </Row>
    </Container>
  );
}
