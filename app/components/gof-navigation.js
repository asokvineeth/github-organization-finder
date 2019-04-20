import Component from '@ember/component';

export default Component.extend({
  actions: {
    changePage(pageUrl) {
      this.sendAction('changePage', pageUrl);
    }
  }
});
