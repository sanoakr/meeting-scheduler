
import React from 'react';
import { Card, Form, Button, Badge } from 'react-bootstrap';

const Sidebar = ({
  name,
  setName,
  isGroupMode,
  setIsGroupMode,
  results,
  users,
  maxCount,
  handleDownload,
  getUsersForTimeSlot,
  formatDateWithWeekday,
  formatTime,
  getColorByUserName,
}) => (
  <>
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
          label="グループ指定：入力可能日時が制限されます"
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
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">最終候補日</h5>
          <Button variant="primary" size="sm" onClick={handleDownload}>
            ICS Download
          </Button>
        </div>
        <ul className="list-unstyled">
          {results.map((result, index) => {
            const usersForSlot = getUsersForTimeSlot(result.startDateTime);
            const userCount = usersForSlot.length;
            const isMax = userCount === maxCount;
            const uniqueId = result.id ? result.id : `${result.startDateTime}-${result.endDateTime}`;

            return (
              <React.Fragment key={`result-fragment-${uniqueId}`}>
                <li
                  key={`result-li-${uniqueId}`}
                  className={`mb-2 d-flex justify-content-between align-items-center p-2 rounded ${
                    isMax ? 'bg-warning text-dark' : ''
                  }`}
                >
                  <span className="final-date-time">
                    {formatDateWithWeekday(result.startDateTime)} - {formatTime(result.endDateTime)}
                  </span>
                  <span className="user-count">{userCount}人</span>
                </li>
                {isMax && usersForSlot.length > 0 && (
                  <li
                    key={`users-li-${uniqueId}`}
                    className="ms-3 mb-3 d-flex justify-content-between align-items-center"
                  >
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {usersForSlot.map((user, userIndex) => (
                        <span
                          key={`user-${uniqueId}-${userIndex}`}
                          className="px-2 py-1 rounded"
                          style={{
                            backgroundColor: user.color,
                            color: '#fff',
                            fontSize: '0.9rem',
                          }}
                        >
                          {user.name}
                        </span>
                      ))}
                    </div>
                    <Badge bg="secondary">最も多い</Badge>
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ul>
      </Card.Body>
    </Card>
  </>
);

export default Sidebar;