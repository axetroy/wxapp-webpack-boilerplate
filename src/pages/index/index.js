//index.js

const wxFetch = require('../../wxapp-fetch').default;

var app = getApp();
Page({
  data: {
    success: 0,
    fail: 0
  },
  onLoad: function() {
    wxFetch('https://api.github.com')
      .then(function(res) {
        return res.json();
      })
      .then(data => {
        console.info(data);
      })
      .catch(err => {
        console.error(err);
        console.error(err.json());
      });
  }
});
