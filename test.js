// 厳格モード
'use strict';
// 'jade'モジュール呼び出し
const jade = require('jade');
// 'assert'モジュール呼び出し（テスト用モジュール）
const assert = require('assert');

// jade のテンプレートにおける XSS 脆弱性のテスト
// テスト用投稿のユーザー名
let username = 'guest1';
// テスト用投稿データを格納する配列
let posts = [];
// テスト用の投稿データのオブジェクト
// HTMLタグがエスケープされることを確認するテスト投稿
let testpost = {
    id: 1,
    content: '<script>alert(\'test\');</script>',
    postedBy: 'guest1',
    trackingCookie: '2639292283224063_ddcc625203464a9e10af58fc3eb92eed7df4b9b5',
    createdAt: new Date(),
    updatedAt: new Date()
}
// テスト用の投稿データを配列に格納する
posts.push(testpost);
// 投稿データをjadeテンプレートを適用してHTMに変換する
const html = jade.renderFile('./views/posts.jade', {
    posts: posts ,
    user: username
});

// スクリプトタグがエスケープされて含まれていることをチェック
let result = html.indexOf('&lt;script&gt;alert(\'test\');&lt;/script&gt;')
// indexOf()の結果が正であればOK
assert( result > 0);

console.log('テストが正常に完了しました');
