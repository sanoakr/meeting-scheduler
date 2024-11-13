import React from 'react';
import { useRouter } from 'next/router';
import { createGroupAPI } from '../api/group'; // createGroupAPIの���ンポートを追加

const CreateGroupButton = () => {
  const router = useRouter();

  const handleCreateGroup = async () => {
    try {
      // ...existing APIリクエストコード...
      await createGroupAPI(); // 例: グループ作成APIの呼び出し
      // グループ作成成功後の処理
      router.push('/groups');
    } catch (error) {
      console.error('グループ作成エラー:', error);
      // エラーメッセージをログに詳細に出力
      router.push('/500');
    }
  };

  return (
    <button onClick={handleCreateGroup}>
      グループ作成
    </button>
  );
};

export default CreateGroupButton;