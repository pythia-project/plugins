<template>
  <b-container class="bv-example-row">
    <b-row>
      <b-col>
        <CodeBlock v-model="taskInput" />
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-spinner v-if="executing"/>
        <Feedback v-else-if="feedbackData" :data="feedbackData" />
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-button @click="submit" :disabled="executing">Submit</b-button>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
  import Feedback from "./components/Feedback";
  export default {
    name: "App",
    components: {
      CodeBlock : () => import('./components/CodeBlock'),
      Feedback
    },
    props: {
      url: String,
      tid: String
    },
    data: () => ({
      submited: false,
      feedbackData: null,
      taskInput: 'print("Hello World!", end="")',
      error: null,
      executing: false
    }),
    methods: {
      submit() {
        this.executing = true;
        fetch(`${this.pythiaUrl}/api/execute`, {
          method: "POST",
          body: JSON.stringify({
            tid: this.tid,
            input: this.taskInput
          })
        })
          .then(response => {
            return response.json();
          })
          .catch(() => {
            return {status: "unreachable"}
          })
          .then(data => {
            if(data.output)
              data.output = JSON.parse(data.output);

            return data;
          })
          .then(data => {
            this.feedbackData = data;
          })
      }
    },
    watch: {
      feedbackData() {
        this.executing = false;
      }
    },
    computed: {
      pythiaUrl() {
        return this.url || window.PYTHIA_URL || "http://localhost:8080"
      }
    }
  };
</script>
