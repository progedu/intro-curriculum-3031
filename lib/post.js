// 厳格モード
'use strict';
// sequelizeモジュール呼び出す
const Sequelize = require('sequelize');
/** 
 * sequelizeオブジェクトを生成し、データベースに接続する
 * 第一引数：URL形式のデータベースの設定
 * 第二引数：オプションデータのオブジェクト
*/
const sequelize = new Sequelize(
  // {DBの種類}://{ユーザー名}:{パスワード}@{ホスト名}/{データベース名}　という形式？
  // postgresがいろいろ出てきてどれがどれかよくわからない
  'postgres://postgres:postgres@localhost/secret_board',
  // logging:ログとして出力するか
  { logging: false }
);
//↓これでも接続できた。こっちの方が直感的な気がする。
/**
 * sequelizeオブジェクトを生成し、データベースに接続する
 * 第一引数：データベース名
 * 第二引数：ユーザー名
 * 第三引数：パスワード
 * 第四引数：オプション設定のオブジェクト
 */
/*const sequelize = new Sequelize(
    'secret_board', 'postgres', 'postgres',
    {
      // ホスト名（サーバー名）
      host: 'localhost',
      // DBの種類(postgresとか)
      dialect: 'postgres',
      // ログとして出力するか
      logging: false
    }
);*/

// idカラムの設定のオブジェクト。
let idColumn = {
  // type: データ型
  type: Sequelize.INTEGER,
  // autoIncrement: データ作成時にidを１ずつ増加する
  autoIncrement: true,
  // primaryKey: 主キー（レコードをただひとつに特定できるキー）
  primaryKey: true
};
// contentカラムの設定オブジェクト
let contentColumn = {
  // TEXT型は可変長文字列の型
  type: Sequelize.TEXT
};
// postedByColumnカラムの設定オブジェクト
let postedByColumn = {
  type: Sequelize.TEXT
};
// trackingCookieColumnカラムの設定オブジェクト
let trackingCookieColumn = {
  // STRING型は255文字までの文字列を格納できるデータ型
  type: Sequelize.STRING
};
// それぞれの設定をカラム名のプロパティに設定する
let columns = {
  id: idColumn,
  content: contentColumn,
  postedBy: postedByColumn,
  trackingCookie: trackingCookieColumn
};
// テーブル全般に関する設定のオブジェクト
let dbOptions = {
  // freezeTableNameプロパティはモデル名をそのままカラム名に使用するという意味らしい
  // trueだとRuby on Railsみたいにテーブル名を複数形にしてしまうようだ
  freezeTableName: true,
  // timestampsプロパティはtimestamps用のカラム(createdAt(作成時間)とupdatedAt(更新時間))を自動的に追加してくれる
  timestamps: true
}

/**
 * Model定義を作成する。
 * 第一引数：モデル名（テーブル名）
 * 第二引数：作成するテーブルのカラム情報のオブジェクト
 * 第三引数：テーブル全般に関する設定のオブジェクト
 */
const Post = sequelize.define('Post', columns, dbOptions);
// テーブルを再構成
Post.sync();
module.exports = Post;