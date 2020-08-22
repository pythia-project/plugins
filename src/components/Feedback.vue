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
    <div>
        <b-alert v-if="data.status == 'success'" show variant="info">{{data.output}}</b-alert>
        <b-alert v-else-if="data.status == 'unreachable'" show variant="danger">Could not reach Pythia.</b-alert>
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
