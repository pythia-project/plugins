// Copyright 2020 The Pythia Authors.
// This file is part of Pythia.
//
// Pythia is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, version 3 of the License.
//
// Pythia is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Foobar.  If not, see <https://www.gnu.org/licenses/>.

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
