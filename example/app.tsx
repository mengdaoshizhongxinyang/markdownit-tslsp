import { defineComponent, onMounted } from "vue";
import Test from "./test.md";
import { active } from "../src/code-block-ts.script";
export default defineComponent(()=>{
  onMounted(()=>{
    active()
  })
  return ()=><div>
    <section class="post-default">
      <article class="post-article">

        <Test></Test>
      </article>
    </section>
    
  </div>
})