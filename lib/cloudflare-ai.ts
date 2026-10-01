export const recipeModel='@cf/google/gemma-4-26b-a4b-it';
export function providerRequest(prompt:string,image?:string){
 return {messages:[{role:'user',content:image?[{type:'text',text:prompt},{type:'image_url',image_url:{url:`data:image/jpeg;base64,${image}`}}]:prompt}],max_completion_tokens:3000,temperature:0.1,stream:false,chat_template_kwargs:{enable_thinking:false}};
}
export function providerText(data:unknown):string {
 const d=data as {success?:boolean;result?:{choices?:{message?:{content?:unknown}}[]}};
 const value=d?.result?.choices?.[0]?.message?.content;
 if(d?.success!==true||typeof value!=='string')throw new Error('Invalid provider response');
 return value;
}
