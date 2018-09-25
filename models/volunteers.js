const mongoose = require('mongoose');

let schema = new mongoose.Schema({

    name: String, //姓名

    address: String, //地区

    phone: String, //手机号

    login: String, // 微信登陆

    gender: String, // 性别
    
    isTrue: {type: Boolean, default: false},

    activity: {type: Array, default: []}, // 参与的活动

    create_at: {type: Date, default: Date.now} , //创建时间
});

module.exports = mongoose.model('volunteers', schema);