import Component from '@ember/component';

export default Component.extend({
  actions: {
    showBranchDetails(url) {
      this.sendAction('showBranchDetails', url);
    }
  }
});
