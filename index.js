// 厳格モード
'use strict';
// httpモジュール呼び出し
const http = require('http');
// http-authモジュール呼び出し
const auth = require('http-auth');
// 自作のrouterモジュール呼び出し
const router = require('./lib/router');
/** 
 * Basic認証の生成
 * 　第一引数：Basic認証情報オプションデータのインスタンス
*/
const basic = auth.basic({
  // realm: Basic認証時に保護する領域を規定する文字列。
  realm: 'Enter username and password.',
  // file: "{ユーザー名}:{パスワード}"の形式で
  // 　　　 パスワードを管理しているhtpasswdファイルのアドレス
  file: './users.htpasswd'
});
/**
 * サーバー側エラー時に実行する関数
 * @param {Error} e 
 */
let errFunc = function(e){
  console.error('server error', e);
}
/**
 * クライアント側エラー発生時に実行する関数
 * @param {Error} e 
 */
let errFunc2 = function(e){
  console.error('client error', e);
}
/**
 * ルーティングを行う関数
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 */
let routeFunc = function(req, res){
  // routerモジュールでルーティングを行う
  router.route(req,res);
}
/** 
 * サーバー作成
 * 第一引数：サーバーにリクエストがあったときに実行するコールバック（以下CB）関数
 * 　　CB関数の引数１：IncomingMessage
 * 　　CB関数の引数２：ServerResponse
 * 　　CB関数の戻り値：void
*/
const server = http.createServer(basic, routeFunc); 
/**
 * イベントハンドラを設定する
 * 第一引数：イベント名
 * 第二引数：イベント発生時に実行するCB関数
 * 　　CB関数の引数１：Error
 * 　　CB関数の戻り値：void
 */
server.on('error', errFunc);
// 同上
server.on('clientError', errFunc2 );

// ポート番号
const port = 8000;
/**
 * サーバー起動時に実行する関数
 */
let listenFunc = function(){
  console.info('Listening on ' + port);
}
/**
 * サーバーを起動する
 * 第一引数：サーバー起動時に実行するCB関数
 */
server.listen(port, listenFunc);

