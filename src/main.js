import '@babel/polyfill'
import 'mutationobserver-shim'
import 'document-register-element/build/document-register-element';

import Vue from 'vue'
import './plugins/bootstrap-vue'
import App from './App.vue'
import vueCustomElement from 'vue-custom-element';
import './plugins/codemirror';

Vue.config.ignoredElements = [
  'pythia-task-executor'
];

Vue.use(vueCustomElement);

Vue.customElement('pythia-task-executor', App, {});
