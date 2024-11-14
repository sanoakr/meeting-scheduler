import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Custom404 = () => {
  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div className="text-center">
        <h1 className="display-4">ページが見つかりません</h1>
        <p className="lead">お探しのページは存在しないか、移動した可能性があります。</p>
        <a href="/" className="btn btn-primary mt-3">ホームに戻る</a>
      </div>
    </div>
  );
};

export default Custom404;