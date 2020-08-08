<template>
  <b-container class="bv-example-row">
    <b-row>
      <b-col>
        <CodeBlock v-model="answer" />
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-spinner v-if="executing"/>
        <Feedback v-else-if="feedbackData" :data="feedbackData" :taskInfos="taskInfos" />
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
  import axios from "axios"
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
      error: null,
      executing: false,
      answer: {},
      taskInfos: {}
    }),
    methods: {
      submit() {
        this.executing = true;
        console.log(JSON.stringify({
            tid: this.tid,
            input: {fields: this.answer}
          }))
          axios.post(`${this.pythiaUrl}/api/execute`, {
            
            tid: this.tid,
            input: JSON.stringify({fields: this.answer}),
          
          })
          .then(response => {
            return response.data;
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
            console.log(data)
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
    },
    mounted(){
      this.taskInfos = {specs: {name: "sub"}}
    }
  };
</script>
