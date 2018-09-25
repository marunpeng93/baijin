var validator      = require('validator');
var eventproxy     = require('eventproxy');
var config         = require('../config');
var User           = require('../proxy').User;
var mail           = require('../common/mail');
var tools          = require('../common/tools');
var utility        = require('utility');
var authMiddleWare = require('../middlewares/auth');
var uuid           = require('node-uuid');
var volunteers     = require("../models").volunteers

//sign up
exports.create = function (req, res) {
  res.render('join/volunteer');
};

exports.join = async function (req, res, next) {
    let login = req.session.user._id;
    let {name, gender, phone, province, city, town} = req.body;
    var ep = new eventproxy();
    ep.fail(next);
    ep.on('prop_err', function (msg) {
        res.status(422);
        res.render('join/volunteer', {error: msg});
    });

  // 验证信息的正确性
  if ([name, gender, phone].some(function (item) { return item === ''; })) {
    ep.emit('prop_err', '信息不完整。');
    return;
  }
  if (name.length < 1) {
    ep.emit('prop_err', '姓名不能为空');
    return;
  }
  if(!gender){
    ep.emit('prop_err', '性别不能为空');
    return;
  }
  if (!(/^1[34578]\d{9}$/.test(phone))) {
    return ep.emit('prop_err', '电话号码不合法。');
  }
  if(province == "省份" || city == "地级市" || town == "市、县级市、县"){
    return ep.emit('prop_err', '地区不完整');
  }
    
  
  var data = {
    login:login,
    name: name,
    phone: phone,
    gender: gender,
    address: province + "-" + city + "-" + town,
    isTrue: true
  }

  var user = await volunteers.update({login:login}, data, {upsert: true})
  
  
  res.render('join/volunteer', {
        success: "申请志愿者成功, 等待工作人员核实。"
    });
};

