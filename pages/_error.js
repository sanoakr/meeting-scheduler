import React from 'react';

function Error({ statusCode, err }) {
  return (
    <div>
      <h1>エラーが発生しました</h1>
      <p>
        {statusCode
          ? `サーバーでエラーが発生しました: ${statusCode}`
          : 'クライアントでエラーが発生しました'}
      </p>
      {err && <p>{err.message}</p>}
    </div>
  );
}

export default Error;
