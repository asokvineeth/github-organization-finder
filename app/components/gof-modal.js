import Component from '@ember/component';

export default Component.extend({
  actions: {
    toggleData(name) {
      this.sendAction('toggleData', name);
    }
  }
});
