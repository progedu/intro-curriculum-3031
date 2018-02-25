// 厳格モード
'use strict';
// 自作のposts-handlerモジュール呼び出し
const postsHandler = require('./posts-handler');
// 自作のhandler-utilモジュール呼び出し
const util = require('./handler-util');
/**
 * ルーティングを行う関数
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 */
function route(req, res) {
  // リクエストされたURLによって処理を分岐する
  switch (req.url) {
    // /postsへのリクエストを受けた場合
    case '/posts':
      // posts-Handlerモジュール内で投稿などの処理を行う
      postsHandler.handle(req, res);
      break;
    // /posts?delete=1へのリクエストを受けた場合
    case '/posts?delete=1':
      // posts-Handlerモジュール内で投稿の削除処理を行う
      postsHandler.handleDelete(req, res);
      break;
    // /logoutへのリクエストを受けた場合
    case '/logout':
      // handler-utilモジュール内でログアウト処理を行う
      util.handleLogout(req, res);
      break;
    // /favicon.icoへのリクエストを受けた場合
    case '/favicon.ico':
      // handler-utilモジュール内でfaviconを設定する処理を行う
      util.handleFavicon(req, res);
      break;
    // それ以外のURLへのリクエストを受けた場合
    default:
      // handler-utilモジュール内でNot Found処理を行う
      util.handleNotFound(req, res);
      break;
  }
}
// このモジュールに関数を登録する
module.exports = {
  route: route
};