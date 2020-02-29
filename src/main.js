import '@babel/polyfill'
import 'mutationobserver-shim'

import Vue from 'vue'
import './plugins/bootstrap-vue'
import App from './App.vue'
import vueCustomElement from 'vue-custom-element';
import './plugins/codemirror';

Vue.config.ignoredElements = [
  'example-component'
];

Vue.use(vueCustomElement);

Vue.customElement('example-component', App, {});

