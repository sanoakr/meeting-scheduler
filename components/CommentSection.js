
import React from 'react';
import { Card, Button, Form } from 'react-bootstrap';

const CommentSection = ({
  comments,
  handleAddComment,
  newComment,
  setNewComment,
  name,
  getColorByUserName,
  formatDateWithWeekday,
}) => (
  <Card className="mt-4">
    <Card.Body>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">コメント</h5>
        <Button
          type="submit"
          variant="primary"
          disabled={!newComment.trim()}
          onMouseOver={() => {
            if (!name.trim()) {
              alert('ユーザー名の入力が必要');
            }
          }}
          form="commentForm"
        >
          Submit
        </Button>
      </div>

      {/* コメント入力フォーム */}
      <Form id="commentForm" onSubmit={handleAddComment} className="mb-3">
        <Form.Group>
          <Form.Control
            as="textarea"
            rows={1}
            placeholder="コメントを入力"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="comment-textarea"
          />
        </Form.Group>
      </Form>

      {/* コメントリスト */}
      <div>
        {comments.map((comment) => (
          <div key={comment.id} className="mb-2 border-bottom pb-1">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle me-2 comment-icon"
                  style={{
                    backgroundColor: getColorByUserName(comment.name),
                  }}
                >
                  {comment.name.charAt(0).toUpperCase()}
                </div>
                <strong className="comment-name">{comment.name}</strong>
              </div>
              <small className="text-muted comment-date">
                {formatDateWithWeekday(comment.createdAt)}
              </small>
            </div>
            <p className="mb-0 comment-text">{comment.text}</p>
          </div>
        ))}
      </div>
    </Card.Body>
  </Card>
);

export default CommentSection;