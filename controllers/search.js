var models       = require('../models');
var TopicModel   = models.Topic;
var Topic   = require('../proxy').Topic;
var TopicCollect = require('../proxy').TopicCollect;
var User    = require('../proxy').User;
var UserModel    = models.User;
var config       = require('../config');
var eventproxy   = require('eventproxy');
var _            = require('lodash');
var at           = require('../common/at');
var renderHelper = require('../common/render_helper');
var validator    = require('validator');
var cache        = require('../common/cache');
var xmlbuilder   = require('xmlbuilder');
var moment = require('moment');



exports.index = function (req, res, next) {
  var tab = 'all';
  var page = parseInt(req.query.page, 10) || 1;
  page = page > 0 ? page : 1;
  var q = req.query.q;
  q = encodeURIComponent(q);
  let query = {
    title: new RegExp(q)
  }
  var proxy = new eventproxy();
  proxy.fail(next);
  var limit = config.list_topic_count;
  var options = { skip: (page - 1) * limit, limit: limit, sort: '-top -last_reply_at'};
  
  Topic.getTopicsByQuery(query, options, proxy.done('topics', function (topics) {
    return topics;
  }));

  // 取排行榜上的用户
  cache.get('tops', proxy.done(function (tops) {
    if (tops) {
      proxy.emit('tops', tops);
    } else {
      User.getUsersByQuery(
        {is_block: false},
        { limit: 10, sort: '-score'},
        proxy.done('tops', function (tops) {
          cache.set('tops', tops, 60 * 1);
          return tops;
        })
      );
    }
  }));
  // END 取排行榜上的用户

  // 取0回复的主题
  cache.get('no_reply_topics', proxy.done(function (no_reply_topics) {
    if (no_reply_topics) {
      proxy.emit('no_reply_topics', no_reply_topics);
    } else {
      Topic.getTopicsByQuery(
        { reply_count: 0, tab: {$nin: ['job', 'dev']}},
        { limit: 5, sort: '-create_at'},
        proxy.done('no_reply_topics', function (no_reply_topics) {
          cache.set('no_reply_topics', no_reply_topics, 60 * 1);
          return no_reply_topics;
        }));
    }
  }));
  // END 取0回复的主题

  // 取分页数据
  var pagesCacheKey = JSON.stringify(query) + 'pages';
  cache.get(pagesCacheKey, proxy.done(function (pages) {
    if (pages) {
      proxy.emit('pages', pages);
    } else {
      Topic.getCountByQuery(query, proxy.done(function (all_topics_count) {
        var pages = Math.ceil(all_topics_count / limit);
        cache.set(pagesCacheKey, pages, 60 * 1);
        proxy.emit('pages', pages);
      }));
    }
  }));
  // END 取分页数据

  var tabName = renderHelper.tabName(tab);
  proxy.all('topics', 'tops', 'no_reply_topics', 'pages',
    function (topics, tops, no_reply_topics, pages) {
      res.render('index', {
        topics: topics,
        current_page: page,
        list_topic_count: limit,
        tops: tops,
        no_reply_topics: no_reply_topics,
        pages: pages,
        tabs: config.tabs,
        tab: tab,
        pageTitle: tabName && (tabName + '版块'),
      });
    });
};
