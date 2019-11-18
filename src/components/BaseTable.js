let BaseTable = Vue.component("base-table", {
    props: ['columns', 'rows'],
    template: `
    <table>
        <thead>
            <tr>
                <td v-for = "col in columns">
                  {{col}}
                </td>
            </tr>
        </thead>
        <tbody>
            <tr v-for="row in rows">
                <td v-for="cell in row" v-on:click="notify($event, row)">{{cell}}</td>
            </tr>
        </tbody>
    </table>
    `,

    methods:{
        notify: function(event, row){
            const rowIndex = event.target.parentElement.rowIndex-1;
            this.$dispatch('selected', row);
        }
    }
});

export {BaseTable};