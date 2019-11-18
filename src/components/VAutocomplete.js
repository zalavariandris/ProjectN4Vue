const VAutocomplete = Vue.component('v-autocomplete',{
    props: ['value', 'filter', 'placeholder'],
    
    template: `
    <div class="autocomplete">
        <input ref="input" type="text" v-model="content" :placeholder="placeholder" v-on:keyup="keyup"/>
        <ul>
            <li v-for="item in results" v-on:click="select(item);">
                <slot v-bind="item"></slot>
            </li>
        </ul>
    </div>
    `,

    data: function(){
        return {
            content: this.value,
            isOpen: false
        };
    },

    computed: {
        results: function(){
            return this.filter(this.content);
        }
    },

    watch: {
        value: function(){
            this.content = this.value;
        },

        content: function(){
            this.$emit('input', this.content);
        }
    },

    methods: {
        select: function(item){
            this.$emit('select', item);
            this.$refs.input.blur();
        },

        keyup: function(event){
            if(event.keyCode==13){
                this.select(this.results[0]);
            }
        }
    },
});

export {VAutocomplete};