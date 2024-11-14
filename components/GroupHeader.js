
import React from 'react';
import { Row, Col, Button, Alert } from 'react-bootstrap';

const GroupHeader = ({ groupName, pageUrl, handleCopyUrl, isCopied }) => (
  <Row className="mb-4">
    <Col>
      <h1 className="text-center mb-3">{groupName || 'グループ名が設定されていません'}</h1>
      <div className="text-center">
        {pageUrl && (
          <Button
            variant="outline-primary"
            onClick={handleCopyUrl}
          >
            グループURLの取得
          </Button>
        )}
        {isCopied && <Alert variant="success" className="mt-2">URLをコピーしました！</Alert>}
      </div>
    </Col>
  </Row>
);

export default GroupHeader;