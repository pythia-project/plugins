<template>
  <div>
    <b-alert
      v-if="data.status == 'success' && data.output.status == 'success'"
      show
      variant="info"
      >All the test succeded</b-alert
    >
    <b-alert
      v-if="data.status == 'success' && data.output.status == 'failed'"
      show
      variant="danger"
    >
      <div>
        You passed <b>{{ passed }}</b> {{ passed > 1 ? "tests" : "test" }} out
        of <b>{{ numberOfTests }}</b>
      </div>
      <div>Here is a failed test:</div>
      <div>
        <div>
          <span>Input:</span>
          <span>{{ taskInfos.specs.name }}{{ example.input }}</span>
        </div>
        <div>
          <span>Expected:</span> <span>{{ example.expected }}</span>
        </div>
        <div>
          <span>Actual:</span> <span>{{ example.actual }}</span>
        </div>
      </div>
      <div v-if="message">{{ message }}</div>
    </b-alert>
    <b-alert v-else-if="data.status == 'unreachable'" show variant="danger"
      >Could not reach Pythia.</b-alert
    >
    <b-alert v-else show variant="danger">Error: {{ data.status }}</b-alert>
  </div>
</template>
<script>
export default {
  name: "Feedback",
  props: {
    data: Object,
    taskInfos: Object,
  },
  computed: {
    passed() {
      return this.data.output.feedback.stats.succeeded;
    },
    numberOfTests() {
      return this.data.output.feedback.stats.total;
    },
    example() {
      return this.data.output.feedback.example;
    },
    message() {
      return this.data.output.feedback.message;
    },
  },
};
</script>
