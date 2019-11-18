const VPaginate = Vue.component("vpaginate", {
  template: `
    <div class="paginate">
        <button v-on:click="prevPage"><</button>
        <span>{{value+1}}</span><span v-if="length!=undefined">/{{length}}</span>
        <button v-on:click="nextPage">></button>
    </div>`,

  props: ['value', 'length'],

  data: function(){
    return {
        content: this.value,
    };
  },

  computed:{
    hasNext: function(){
      return this.value<this.length-1;
    },

    hasPrev: function(){
      return this.value>0;
    }
  },
  
  methods: {
    nextPage: function(e){
        if(this.hasNext){
          this.content = this.value+1;
          window.scrollTo(0,0);
          this.$emit('input', this.content)
        }
    },
    prevPage: function(e){
      if(this.hasPrev){
        this.content= this.value-1;
        window.scrollTo(0,0);
        this.$emit('input', this.content)
      }
    }
  }
});

export {VPaginate};