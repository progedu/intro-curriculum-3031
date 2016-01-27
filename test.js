'use strict';
let jade = require('jade');
let assert = require('assert');

// jade のテンプレートにおける XSS 脆弱性のテスト
let html = jade.renderFile('./views/posts.jade', {
  posts: [{
    id: 1,
    content: '<script>alert(\'test\');</script>',
    postedBy: 'guest1',
    trackingCookie: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }],
  user: 'guest1'
});

// スクリプトタグがエスケープされて含まれていることをチェック
assert(html.indexOf('&lt;script&gt;alert(\'test\');&lt;/script&gt;') > 0);
console.log('テストが正常に完了しました');

