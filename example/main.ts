import Markdown from "markdown-it";
import { markdownTypePlugIn } from "../src/index";
let md=new Markdown()
md.use(markdownTypePlugIn)
let content= document.getElementById('content') as HTMLTextAreaElement
const right=document.getElementById('right') as HTMLDivElement
right.innerHTML=md.render(content.value)
content.addEventListener('input',()=>{
    right.innerHTML=md.render(content.value)
})