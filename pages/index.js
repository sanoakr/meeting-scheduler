// pages/index.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Row, Col, Button, Form, Card } from 'react-bootstrap';

export default function HomePage() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');

  const handleCreateGroup = async () => {
    if (!groupName) {
      alert('グループ名を入力してください');
      return;
    }

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const res = await fetch(`${basePath}/api/create-group`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName }),
    });

    if (res.ok) {
      const { groupId } = await res.json();
      router.push(`/group/${groupId}`);
    } else {
      const errorData = await res.json();
      alert(`エラー: ${errorData.error}`);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Body>
              <h1 className="text-center mb-4">ミーティングスケジューラー</h1>
              <Form>
                <Form.Group controlId="groupName">
                  <Form.Label>グループ名</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="グループ名を入力してください"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </Form.Group>
                <Button
                  variant="primary"
                  className="mt-3 w-100"
                  onClick={handleCreateGroup}
                >
                  グループ作成
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}