<template>
    <div>
        <b-alert v-if="data.status == 'success'" show variant="info">{{data.output}}</b-alert>
        <b-alert v-else-if="data.status == 'unreachable'" show variant="danger">Chould not reach pythia</b-alert>
        <b-alert v-else show variant="danger">Error: {{data.status}}</b-alert>
    </div>
</template>
<script>
export default {
    name: "Feedback",
    props: {
        data: {status: String}
    }
}
</script>