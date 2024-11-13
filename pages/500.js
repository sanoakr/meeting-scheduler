import React from 'react';

function Custom500({ error }) {
  return (
    <div>
      <h1>サーバーエラーが発生しました</h1>
      <p>{error?.message || '予期しないエラーが発生しました。'}</p>
    </div>
  );
}

export default Custom500;
