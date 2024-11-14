// pages/index.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Row, Col, Button, Form, Card } from 'react-bootstrap';
// import { version } from '../version'; // 削除

import fs from 'fs';
import path from 'path';

export async function getServerSideProps() {
  const versionFilePath = path.join(process.cwd(), 'version.txt');
  const version = fs.readFileSync(versionFilePath, 'utf8').trim();

  return {
    props: {
      version,
    },
  };
}

export default function HomePage({ version }) { // version を props から受け取る
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  
  const handleCreateGroup = async () => {
    if (!groupName) {
      alert('グループ名を入力してください');
      return;
    }

    try {
      const res = await fetch('/api/create-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName }),
      });

      if (res.ok) {
        const { groupId } = await res.json();
        // グループ作成���にページ遷移
        router.push(`/group/${groupId}`);
      } else {
        const errorData = await res.json();
        alert(`エラー: ${errorData.error}`);
      }
    } catch (error) {
      console.error('グループ作成中にエラーが発生しました:', error);
      alert('グループ作成に失敗しました');
    }
  };
  
  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Body>
              <h1 className="text-center mb-4">ミーティングスケジューラ（仮）</h1>
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
          <div style={{ textAlign: 'right', color: 'gray', fontSize: 'small' }}>
            ver. {version}
          </div>
        </Col>
      </Row>
    </Container>
  );
}