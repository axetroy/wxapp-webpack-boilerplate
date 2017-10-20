//index.js
import wxFetch from 'wxapp-fetch';

Page({
  data: {
    success: 0,
    fail: 0
  },
  onLoad: async function() {
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
