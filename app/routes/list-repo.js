import Route from '@ember/routing/route';
import Ember from 'ember';

export default Route.extend({
  ajaxCall(url, callBackFunction, failureStatus) {
    var self = this;
    this.set('controller.filterApplied', false);
    self.set('controller.loader', true);
    self.set('controller.filterApplied', false);
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        let json = JSON.parse(this.response);
        if (this.status == 200 && !Ember.isEmpty(json) && (json.length || json.total_count)) {
          callBackFunction(self, json, xhttp.getResponseHeader("Link"));
        } else {
          self.send('onFailAjax', failureStatus);
        }
        self.set('controller.loader', false);
      }
    }
    xhttp.open("GET", url, true);
    xhttp.send();
  },
  updateOrganzationData(self, response, links) {
    let controller = self.get('controller');
    Ember.set(controller, 'totalCount', response.total_count);
    Ember.set(controller, 'login', response.items[0].owner.login);
    Ember.set(controller, 'avatar_url', response.items[0].owner.avatar_url);
    Ember.set(controller, 'html_url', response.items[0].owner.html_url);
    if (!Ember.isEmpty(links)) {
      self.navLinkModifier(links, controller);
    } else {
      Ember.set(controller, 'navigation', undefined);
    }
    self.updateRepositoryData(controller, response);
    if (controller.Type) {
      Ember.run.scheduleOnce('afterRender', function() {
        let selectDropdown = document.querySelector('#filterByType');
        if (selectDropdown) {
          document.querySelector('#filterByType').value = controller.Type;
        }
      });
    }
  },
  navLinkModifier(links, controller) {
    let navigation = {};
    let navLinks = links.split(',');
    navLinks.forEach(function(navLink) {
      let link = navLink.split(';');
      let key = link[1].split('=')[1];
      key = key.replace(/['"]+/g, '');
      link[0] = link[0].trim();
      navigation[key] = link[0].substring(1, link[0].length - 1);
    });
    Ember.set(controller, 'navigation', navigation);
  },
  updateRepositoryData(controller, response) {
    if (!controller) {
      controller = self.get('controller');
    }
    let repositories = [];
    response.items.forEach(function(repo) {
      let newRepo = {};
      ['name', 'html_url', 'full_name', 'private', 'description', 'branches_url', 'language'].map(item => newRepo[item] = repo[item]);
      repositories.pushObject(newRepo);
    });
    controller.set('repos', repositories);
  },
  showBranchDetail(self, response) {
    let controller = self.get('controller');
    controller.set('showModal', true);
    controller.set('branches', response);
  },
  changeOrganizationPage(self, response, links) {
    let controller = self.get('controller');
    if (!Ember.isEmpty(links)) {
      self.navLinkModifier(links, controller);
    } else {
      Ember.set(controller, 'navigation', undefined);
    }
    self.updateRepositoryData(controller, response);
  },
  actions: {
    getOrganizationRepository(organizationName) {
      this.set('controller.failOrganization', false);
      this.set('organizationName', organizationName);
      let getQuery = '';
      let controller = this.get('controller');
      if (!Ember.isEmpty(controller.Type)) {
        getQuery = "+is:" + controller.Type;
      }
      if (!Ember.isEmpty(controller.languageFilter)) {
        getQuery = "+language:" + controller.languageFilter;
      }
      this.ajaxCall(`https://api.github.com/search/repositories?q=org:${organizationName}${getQuery}`, this.updateOrganzationData, 'failOrganization');
      this.set('controller.orgPageNumber', 1);
    },
    showBranchDetails(url) {
      this.ajaxCall(url.substring(0, url.indexOf('{')), this.showBranchDetail);
    },
    changePage(url) {
      let pageNumber = url.split('=').pop();
      this.ajaxCall(url.trim(), this.changeOrganizationPage);
      this.set('controller.orgPageNumber', pageNumber);
    },
    toggleData(name) {
      this.get('controller').toggleProperty(name);
    },
    onFailAjax(failureStatus) {
      this.set('controller.' + failureStatus, true);
      let controller = this.get('controller');
      if (controller.languageFilter || controller.Type) {
        this.set('controller.filterApplied', true);
      }
    },
    filterContent(value, type) {
      if (type == "Type") {
        value = document.querySelector('#filterByType').value;
        this.set('controller.Type', value);
      } else if (Ember.isEmpty(type)) {
        this.set('controller.languageFilter', value);
      } else {
        this.set('controller.' + type, value);
      }
      this.send('getOrganizationRepository', this.get('organizationName'));
    },
    clearAllFilter() {
      this.set('controller.languageFilter', '');
      this.set('controller.Type', 'all');
      this.send('getOrganizationRepository', this.get('organizationName'));
    }
  }
});
