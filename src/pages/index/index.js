//index.js
import r2 from 'wxapp-r2';

Page({
  data: {
    posts: []
  },
  resolveTab(tab) {
    console.log(tab);
    const obj = {
      share: '分享',
      ask: '问答'
    };
    return obj[tab] || tab;
  },
  async fetchData() {
    try {
      const res = await r2('https://cnodejs.org/api/v1/topics').json;
      if (res.success) {
        console.log(res.data);
        this.setData({
          posts: res.data.map(d => {
            d.tag = this.resolveTab(d.tab);
            return d;
          })
        });
      }
    } catch (err) {
      console.error(err);
    }
  },
  onLoad: async function() {
    try {
      await this.fetchData();
    } catch (err) {
      console.error(err);
    }
  }
});
