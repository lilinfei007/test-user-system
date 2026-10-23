import { ref } from 'vue';
export default {
  setup(){
    const count = ref(0);
    return () => 
    <div>
      这是jsx渲染的组件
      {count.value}
      <button onClick={() => count.value ++}>加1</button>
    </div>
  }
}
