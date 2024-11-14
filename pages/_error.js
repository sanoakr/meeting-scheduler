// pages/_error.js

import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Error = ({ statusCode, err }) => {
  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div className="text-center">
        <h1 className="display-4">エラーが発生しました</h1>
        <p className="lead">
          {statusCode
            ? `サーバーでエラーが発生しました: ${statusCode}`
            : 'クライアントでエラーが発生しました'}
        </p>
        {err && <p>{err.message}</p>}
        <a href="/" className="btn btn-primary mt-3">ホームに戻る</a>
      </div>
    </div>
  );
};

export default Error;