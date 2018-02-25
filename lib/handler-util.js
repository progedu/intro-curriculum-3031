//厳格モード
'use strict';
// fsモジュールを呼び出す
const fs = require('fs');
/**
 * ログアウト処理を行う関数
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 */
function handleLogout(req, res) {
  // レスポンスヘッダにステータスコードとその他の情報を書き出す
  // ステータスコード401はUnauthorized
  res.writeHead(401, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  // ログアウトした旨をレスポンスとして返す
  res.end('<!DOCTYPE html><html lang="ja"><body>' +
    '<h1>ログアウトしました</h1>' +
    '<a href="/posts">ログイン</a>' +
    '</body></html>');
}
/**
 * Not Found処理を行う関数
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 */
function handleNotFound(req, res) {
  // レスポンスヘッダにステータスコードとその他の情報を書き出す
  // ステータスコード404はNot Found
  res.writeHead(404, {
    'Content-Type': 'text/plain; charset=utf-8'
  });
  // ページが見つからなかった旨をレスポンスとして返す
  res.end('ページがみつかりません');
}
/**
 * Bad Request処理を行う関数
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 */
function handleBadRequest(req, res) {
  // レスポンスヘッダにステータスコードとその他の情報を書き出す
  // ステータスコード400はBad Request
  res.writeHead(400, {
    'Content-Type': 'text/plain; charset=utf-8'
  });
  // リクエストされたメソッドが未対応である旨をレスポンスとして返す
  res.end('未対応のメソッドです');
}
/**
 * faviconをレスポンスとして与える
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 */
function handleFavicon(req, res) {
  // レスポンスヘッダにステータスコードとその他の情報を書き出す
  // 'image/vnd.microsoft.icon'はfaviconの'Content-Type' 
  res.writeHead(200, {
    'Content-Type': 'image/vnd.microsoft.icon'
  })
  // faviconを読み取る
  const favicon = fs.readFileSync('./favicon.ico');
  // faviconを書き出して終了
  res.end(favicon);
}

// 関数をこのモジュールに登録する
module.exports = {
  handleLogout: handleLogout,
  handleNotFound: handleNotFound,
  handleBadRequest: handleBadRequest,
  handleFavicon: handleFavicon
};