<!--
Copyright 2020 The Pythia Authors.
This file is part of Pythia.

Pythia is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, version 3 of the License.

Pythia is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Foobar.  If not, see <https://www.gnu.org/licenses/>.
-->

<template>
  <b-container>
    <b-row>
      <b-col>
        <CodeBlock
          v-if="taskInfos && !error"
          v-model="answer"
          :infos="taskInfos"
          @error="onError"
        />
        <b-card v-if="!taskInfos">
          <div class="dot-pulse"></div>
        </b-card>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-spinner v-if="executing" />
        <Feedback v-else-if="feedbackData" :data="feedbackData" />
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-button
          v-if="taskInfos && !error"
          @click="submit"
          :disabled="executing"
          >Submit</b-button
        >
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import Feedback from "./components/Feedback";
import axios from "axios";
export default {
  name: "App",
  components: {
    CodeBlock: () => import("./components/CodeBlock"),
    Feedback,
  },
  props: {
    url: String,
    tid: String,
  },
  data: () => ({
    taskInfos: null,
    submited: false,
    feedbackData: null,
    error: false,
    executing: false,
    answer: {},
  }),
  methods: {
    submit() {
      this.executing = true;
      fetch(`${this.pythiaUrl}/api/execute`, {
        method: "POST",
        body: JSON.stringify({
          tid: this.tid,
          input: this.answer,
        }),
      })
        .then((response) => {
          return response.json();
        })
        .catch(() => {
          return { status: "unreachable" };
        })
        .then((data) => {
          if (data.output) data.output = JSON.parse(data.output);

          return data;
        })
        .then((data) => {
          this.feedbackData = data;
        });
    },
    onError() {
      this.error = true;
      this.feedbackData = { status: "configError" };
    },
  },
  watch: {
    feedbackData() {
      this.executing = false;
    },
  },
  computed: {
    pythiaUrl() {
      return this.url || window.PYTHIA_URL || "http://localhost:8080";
    },
  },
  mounted() {
    axios.get(`${this.pythiaUrl}/api/tasks/${this.tid}`).then((response) => {
      this.taskInfos = response.data;
    });
  },
};
</script>
<style lang="scss" scoped>
$dot-color: grey;
@import "three-dots/sass/_variables.scss";
@import "three-dots/sass/_mixins.scss";
@import "three-dots/sass/_dot-pulse.scss";

.dot-pulse {
  margin: 15px auto;
}
</style>
