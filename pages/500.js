// pages/500.js

import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Custom500 = ({ error }) => {
  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div className="text-center">
        <h1 className="display-4">サーバーエラーが発生しました</h1>
        <p className="lead">
          {error?.message || '予期しないエラーが発生しました。'}
        </p>
        <a href="/" className="btn btn-primary mt-3">
          ホームに戻る
        </a>
      </div>
    </div>
  );
};

export default Custom500;