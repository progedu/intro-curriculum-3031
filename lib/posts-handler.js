'use strict';
const crypto = require('crypto');
const pug = require('pug');
const Cookies = require('cookies');
const moment = require('moment-timezone');
const util = require('./handler-util');
const Post = require('./post');

const trackingIdKey = 'tracking_id';

function handle(req, res) {
  const cookies = new Cookies(req, res);
  const trackingId = addTrackingCookie(cookies, req.user);
  switch (req.method) {
    case 'GET':
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      Post.findAll({ order: [['id', 'DESC']] }).then((posts) => {
        posts.forEach((post) => {
          post.content = post.content.replace(/\+/g, ' ');
          post.formattedCreatedAt = moment(post.createdAt).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH時mm分ss秒');
        });
        res.end(pug.renderFile('./views/posts.pug', {
          posts: posts,
          user: req.user
        }));
        console.info(
          `閲覧されました: user: ${req.user}, ` +
          `trackinId: ${trackingId},` +
          `remoteAddress: ${req.connection.remoteAddress}, ` +
          `userAgent: ${req.headers['user-agent']} `
        );
      });
      break;
    case 'POST':
      let body = [];
      req.on('data', (chunk) => {
        body.push(chunk);
      }).on('end', () => {
        body = Buffer.concat(body).toString();
        const decoded = decodeURIComponent(body);
        const content = decoded.split('content=')[1];
        console.info('投稿されました: ' + content);
        Post.create({
          content: content,
          trackingCookie: trackingId,
          postedBy: req.user
        }).then(() => {
          handleRedirectPosts(req, res);
        });
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

function handleDelete(req, res) {
  switch (req.method) {
    case 'POST':
      let body = [];
      req.on('data', (chunk) => {
        body.push(chunk);
      }).on('end', () => {
        body = Buffer.concat(body).toString();
        const decoded = decodeURIComponent(body);
        const id = decoded.split('id=')[1];
        Post.findByPk(id).then((post) => {
          if (req.user === post.postedBy || req.user === 'admin') {
            post.destroy().then(() => {
              console.info(
                `削除されました: user: ${req.user}, ` +
                `remoteAddress: ${req.connection.remoteAddress}, ` +
                `userAgent: ${req.headers['user-agent']} `
              );
              handleRedirectPosts(req, res);
            });
          }
        });
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

/**
 * Cookieに含まれているトラッキングIDに異常がなければその値を返し、
 * 存在しない場合や異常なものである場合には、再度作成しCookieに付与してその値を返す
 * @param {Cookeies} cookies
 * @param {String} userName
 * @return {String} トラッキングID
 */
function addTrackingCookie(cookies, userName) {
  const requestedTrackingId = cookies.get(trackingIdKey);
  if (isValidTrackingId(requestedTrackingId, userName)) {
    return requestedTrackingId;
  } else {
    const originalId = parseInt(crypto.randomBytes(8).toString('hex'), 16);
    const tomorrow = new Date(new Date().getTime() + (1000 * 60 * 60 * 24));
    const trackingId = originalId + '_' + createValidHash(originalId, userName);
    cookies.set(trackingIdKey, trackingId, { expires: tomorrow });
    return trackingId;
  }
}

function isValidTrackingId(trackingId, userName) {
  if (!trackingId) {
    return false;
  }
  const spilited = trackingId.split('_');
  const originalId = spilited[0];
  const requestedHash = spilited[1];
  return createValidHash(originalId, userName) === requestedHash;
}

const secretKey =
  '2183584d11485465d02ede9fc94b8134c6f00c5cbd47d8ed0b34f0dd87f44ad4f7bcbe2faa3d2bde2a179d8f3f647271d3ea66ba9ad107555f1f8799488a4fb688e1c9dcb1d82f9dfb61f18cce10103a9864fd6877342f0bdd36d56582c18b9b7f399f83f1184ff7dfd6797904c9583547e97af56dc40cf438bb7c12186e6fbfd0449c662664337b3feea178023d7957dd4b06599d55aa0b1bfafe1bd546c107bdbd0959b5c948460d562e97b778531862e59117ad4a87626a33489eca6a41bdbf59944df6ba991ac940cee1d01d1c1bbdff2fa0a4a71c21dd53a296417faa73b4a64295e9b45c51233000a7d7a3ca9ae7c353669e06791f01a9f43f9f17769b';

function createValidHash(originalId, userName) {
  const sha1sum = crypto.createHash('sha1');
  sha1sum.update(originalId + userName + secretKey);
  return sha1sum.digest('hex');
}

function handleRedirectPosts(req, res) {
  res.writeHead(303, {
    'Location': '/posts'
  });
  res.end();
}

module.exports = {
  handle,
  handleDelete
};
