// 厳格モード
'use strict';
// cryptoモジュール呼び出し
const crypto = require('crypto');
// jadeモジュール呼び出し
const jade = require('jade');
// cookiesモジュール呼び出し
// 利用する際に、個別のオブジェクトを生成する必要があるモジュールについては頭文字を大文字にしているようだ
const Cookies = require('cookies');
// moment-timezoneモジュール呼び出し
const moment = require('moment-timezone');
// 自作のhandler-utilモジュール呼び出し
const util = require('./handler-util');
// 自作のpostモジュール呼び出し
const Post = require('./post');
// ハッシュとして登録するcookie値のキーとする文字列
const trackingIdKey = 'tracking_id';
/**
 * 投稿などの処理を行う関数
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 */
function handle(req, res) {
  // 個別のCookie情報(Cookiesオブジェクト)を生成する 
  const cookies = new Cookies(req, res);
  // 生成したCookiesオブジェクトにCookie値などのデータを設定する
  // addTrackingCookie(cookies);
  // 生成したCookiesオブジェクトにCookie値などのデータを設定する
  const trackingId = addTrackingCookie(cookies, req.user);
  // リクエスト情報に含まれるHTTPメソッドによって処理を分岐する
  switch (req.method) {
    // 'GET'メソッドでアクセスされた場合
    case 'GET':
      // レスポンスヘッダにステータスコードとその他の情報を書き出す
      res.writeHead(
        // ステータスコード200は成功
        200, {
          // Content-Typeとして'text/html; charset=utf-8'を設定する
          'Content-Type': 'text/html; charset=utf-8'
        });
      /** 
       * すべての投稿内容を取得する
       * 第一引数：投稿内容の取得に関するオプションデータのオブジェクト
      */
      let posts = Post.findAll(
        // idの降順で取得するように指定する（最新の投稿から取得する）
        { order: 'id DESC' }
      );
      /**
       * レスポンスとしてHTML形式で投稿内容を書き出す関数
       * @param {*} ps 
       */
      let renderFunc = function (ps) {
        /**
         * 投稿を整形する関数
         * '+'を半角スペースに置き換える。
         * 投稿時間を日本語化して、formattedCreatedAt属性として追加する
         * @param {Bluebird<Any>} p 
         */
        let modifyPostFunc = function (p) {
          // '+'文字を半角スペースに置き換える
          p.content = p.content.replace(/\+/g, ' ');
          // p.content = p.content.replace(/\n/g, '<br>');
          // 投稿時間をmomentオブジェクト化
          let mom = moment(p.createdAt);
          // momentオブジェクトをAsia/Tokyoのタイムゾーンにあわせる
          mom = mom.tz('Asia/Tokyo')
          // momentオブジェクトを整形する（返り値はstring）
          mom = mom.format('YYYY年MM月DD日 HH時mm分ss秒');
          // PostのformattedCreatedAt属性として設定する
          p.formattedCreatedAt = mom;
        }
        // 投稿を１件ずつ取り出して改行を<br>タグに置き換える
        ps.forEach(modifyPostFunc);
        /** 
         * jadeテンプレートを適用して投稿情報をHTMLに書き換える
         * 第一引数：jadeファイルのURL
         * 第二引数：変数情報のオブジェクト
        */
        let html = jade.renderFile('./views/posts.jade',
          // jadeテンプレート内のpostsにはこのjsファイルのpsを、userにはreq.userを値として与える
          {
            posts: ps,
            user: req.user
          });
        // HTMLを書き出して終了
        res.end(html);
        // 標準出力に閲覧ユーザー情報を出力する
        console.info(
          // ユーザー名
          `閲覧されました: user: ${req.user}, ` +
          // Cookie値
          // `trackingId: ${cookies.get(trackingIdKey)},` +
          `trackingId: ${trackingId},` +
          // IPアドレス
          `remoteAddress: ${req.connection.remoteAddress}, ` +
          // User-Agent
          `userAgent: ${req.headers['user-agent']} `
        );
      };
      // postsが正常に取得できていればrenderFunc関数を実行する
      posts.then(renderFunc);
      break;
    // 'POST'メソッドでアクセスされた場合
    case 'POST':
      // 新しい投稿情報を格納する配列（リクエストが細切れで送られてくることがあるため配列にする）
      let body = [];
      /**
       * 'data'イベント発生時（データを受け取った時）に実行する関数
       * 第一引数：送られてきた文字列
       * @param {string} chunk 
       */
      let dataFunc = function (chunk) {
        // 送られてきた文字列を配列に格納する
        body.push(chunk);
      };
      // 'data'イベントのイベントハンドラを登録する
      req.on('data', dataFunc);
      /** 
       * 'end'イベント発生時（すべてのデータを受け取り終わった時）に実行する関数
      */
      let endFunc = function () {
        // body配列に格納されている文字列を結合する
        body = Buffer.concat(body).toString();
        // 文字列はURIエンコードされているのでデコードしてやる
        const decoded = decodeURIComponent(body);
        // decodedは'content=XXXXX'という形式になっているので内容の部分だけ取得する
        const content = decoded.split('content=')[1];
        // 標準出力に新しく投稿された内容を出力する
        console.info('投稿されました: ' + content);
        /**
         * Postモデルを作成する(Sequelizeモジュールを利用してDBにも反映する)
         * 第一引数：作成するModelデータのオブジェクト
         */
        let post = Post.create({
          // 投稿内容
          content: content,
          // Cookie値
          // trackingCookie: cookies.get(trackingIdKey),
          trackingCookie: trackingId,
          // ユーザー名
          postedBy: req.user
        });
        /** 
         * リダイレクト処理を行う関数
        */
        let redirectPostsFunc = function () {
          // リダイレクト
          handleRedirectPosts(req, res);
        }
        // Postモデルが生成できればリダイレクトする
        post.then(redirectPostsFunc);
      };
      // 'end'イベントのイベントハンドラを登録する
      req.on('end', endFunc);
      break;
    // 'GET''POST'以外のメソッドでアクセスされた場合
    default:
      // handler-utilモジュールでBad Request処理を行う
      util.handleBadRequest(req, res);
      break;
  }
}
/**
 * 投稿の削除処理を行う関数
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 */
function handleDelete(req, res) {
  // リクエスト情報に含まれるHTTPメソッドによって処理を分岐する
  switch (req.method) {
    // 'POST'メソッドでアクセスされた場合
    case 'POST':
      // body配列に格納されている文字列を結合する
      let body = [];
      /**
       * 'data'イベント発生時（データを受け取った時）に実行する関数
       * 第一引数：送られてきた文字列
       * @param {string} chunk 
       */
      let dataFunc = function (chunk) {
        // 送られてきた文字列を配列に格納する
        body.push(chunk);
      };
      // 'data'イベントのイベントハンドラを登録する
      req.on('data', dataFunc);
      /** 
       * 'end'イベント発生時（すべてのデータを受け取り終わった時）に実行する関数
      */
      let endFunc = function () {
        // body配列に格納されている文字列を結合する
        body = Buffer.concat(body).toString();
        // 文字列はURIエンコードされているのでデコードしてやる
        const decoded = decodeURIComponent(body);
        // decodedは'id=XXXXX'という形式になっているのでIDの部分だけ取得する
        const id = decoded.split('id=')[1];
        /** 
         * 削除したい投稿を特定する
         * 第一引数：主キー
        */
        let post = Post.findById(id);
        /**
         * 投稿を削除する関数
         * @param {Bluebird<any>} p 
         */
        let deleteFunc = function (p) {
          // リクエスト情報に含まれるユーザー名と投稿したユーザー名が一致した場合
          if (req.user === p.postedBy || req.user === 'admin') {
            // 投稿を削除する(DBにも反映する)
            p.destroy();
            // 標準出力にログを書き込む
            console.info(
              // ユーザー名
              `削除されました: user: ${req.user}, ` +
              // IPアドレス
              `remoteAddress: ${req.connection.remoteAddress}, ` +
              // User-Agent
              `userAgent: ${req.headers['user-agent']} `
            );
          }
          // リダイレクトする
          handleRedirectPosts(req, res);
        }
        // 投稿を特定できたら削除処理を行う
        post.then(deleteFunc);
      }
      // 'end'イベントのイベントハンドラを登録する
      req.on('end', endFunc);
      break;
    // 'POST'以外のメソッドでアクセスされた場合
    default:
      // handler-utilモジュールでBad Request処理を行う
      util.handleBadRequest(req, res);
      break;
  }
}
/**
 * cookiesオブジェクトにcookie情報をセットする
 * @param {Cookies} cookies 
 */
/*
function addTrackingCookie(cookies) {
  // cookiesオブジェクトがcookie値を持っていない場合
  if (!cookies.get(trackingIdKey)) {
    // Cookie値とするランダムな整数値
    const trackingId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    // Cookie値の有効期限を１日後にする
    const tomorrow = new Date(new Date().getTime() + (1000 * 60 * 60 * 24));
    // 
    /**
     * cookiesオブジェクトにCookie値と有効期限を設定する
     * 第一引数：ハッシュとして登録するCookie値のキーとして使用する文字列
     * 第二引数：Cookie値
     * 第三引数：Cookie情報のオプション
     */
/*
cookies.set(trackingIdKey, trackingId,
  // expires: 有効期限
  { expires: tomorrow });
}
}*/
/**
* Cookieに含まれているトラッキングIDに異常がなければその値を返し、
* 存在しない場合や異常なものである場合には、再度作成しCookieに付与してその値を返す
* @param {Cookies} cookies Cookie情報を格納するオブジェクト
* @param {String} userName ユーザー名
* @return {String} トラッキングID
*/
function addTrackingCookie(cookies, userName) {
  // 最初に設定されているトラッキングIDを取得する
  const requestedTrackingId = cookies.get(trackingIdKey);
  // 正常なトラッキングIDであった場合
  if (isValidTrackingId(requestedTrackingId, userName)) {
    // cookiesに設定されていたトラッキングIDをそのまま返す
    return requestedTrackingId;
  }
  // 未設定、もしくは異常なトラッキングIDであった場合 
  else {
    // ランダムな整数値を得る
    // const originalId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    // cryptoモジュールを使用して8byteのランダムバイト列を得る
    // const randByteId = crypto.randomBytes(8);
    // ランダムバイト列を16進数の文字列に変換する
    // const randStrId = randByteId.toString('hex');
    // console.info('randStrId' + randStrId)
    // ランダム文字列を整数値に変換する
    // const originalId = parseInt(randStrId, 16);
    const originalId = parseInt(crypto.randomBytes(8).toString('hex'), 16);
    // ちょうど１日後の時刻を取得する
    const tomorrow = new Date(new Date().getTime() + (1000 * 60 * 60 * 24));
    // 新たなトラッキングIDとして"{ランダム整数値}_{ランダム整数値とユーザー名から得たハッシュ値(SHA1)}を設定する"
    const trackingId = originalId + '_' + createValidHash(originalId, userName);
    /**
     * cookie情報にCookie値と有効期限を設定する
     * 第一引数：ハッシュとして登録するCookie値のキーとして使用する文字列
     * 第二引数：Cookie値
     * 第三引数：Cookie情報のオプション
     */
    cookies.set(trackingIdKey, trackingId,
      // expires: 有効期限
      { expires: tomorrow }
    );
    // 新たなトラッキングIDを返す
    return trackingId;
  }
}
/**
 * 正常なトラッキングIDを持っているかどうか判定する関数
 * @param {*} trackingId 
 * @param {*} userName 
 */
function isValidTrackingId(trackingId, userName) {
  // トラッキングIDを持っていない場合
  if (!trackingId) {
    // falseを返す
    return false;
  }
  // トラッキングIDを持っている場合
  // {ランダム整数値}_{ランダム整数値とユーザー名から得たハッシュ値(SHA1)}という形式になっているはずなので
  // '_'で分割する
  const splitted = trackingId.split('_');
  // 設定されているトラッキングIDのランダム整数値部分を取得する
  const originalId = splitted[0];
  // 設定されているトラッキングIDのハッシュ値部分を取得する
  const requestedHash = splitted[1];
  // 設定されているトラッキングIDのハッシュ値が、
  // 設定されているランダム整数値と投稿ユーザー名から生成したハッシュ値と
  // 一致するかどうかを判定する
  const result = createValidHash(originalId, userName) === requestedHash;
  // 判定結果を返す
  return result;
}
// 秘密キーを設定する
const secretKey =
  '5a69bb55532235125986a0df24aca759f69bae045c7a66d6e2bc4652e3efb43da4' +
  'd1256ca5ac705b9cf0eb2c6abb4adb78cba82f20596985c5216647ec218e84905a' +
  '9f668a6d3090653b3be84d46a7a4578194764d8306541c0411cb23fbdbd611b5e0' +
  'cd8fca86980a91d68dc05a3ac5fb52f16b33a6f3260c5a5eb88ffaee07774fe2c0' +
  '825c42fbba7c909e937a9f947d90ded280bb18f5b43659d6fa0521dbc72ecc9b4b' +
  'a7d958360c810dbd94bbfcfd80d0966e90906df302a870cdbffe655145cc4155a2' +
  '0d0d019b67899a912e0892630c0386829aa2c1f1237bf4f63d73711117410c2fc5' +
  '0c1472e87ecd6844d0805cd97c0ea8bbfbda507293beebc5d9';
/**
 * ランダム整数値とユーザー名からSHA1アルゴリズムを用いて生成したハッシュ値を返す関数
 * @param {*} originalId 
 * @param {*} userName 
 */
function createValidHash(originalId, userName) {
  // SHA1アルゴリズムを生成する
  const sha1sum = crypto.createHash('sha1');
  // SHA1アルゴリズムにハッシュ値の元となるデータを設定する
  //  sha1sum.update(originalId + userName);
  // 秘密キーをシードに使うことでなりすましを難しくする
  sha1sum.update(originalId + userName + secretKey);
  /**
   * SHA1アルゴリズムを使用して、ハッシュ値を生成する
   * 第一引数：エンコーディング方式。hexは16進数値に変換しろの意味
   * 返り値：ハッシュ値の文字列
   */
  const hashVal = sha1sum.digest('hex')
  return hashVal;
}

/**
 * /postsへリダイレクト処理を行う
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 */
function handleRedirectPosts(req, res) {
  // レスポンスヘッダにステータスコードとその他の情報を書き出す
  // 303はSee Otherをあらわす　URLが間違っていない場合は302じゃなくてこっちを使う
  res.writeHead(303, {
    // リダイレクト先を設定
    'Location': '/posts'
  });
  // 書き出し終了
  res.end();
}
// このモジュールに関数を登録する
module.exports = {
  handle: handle,
  handleDelete: handleDelete
};
