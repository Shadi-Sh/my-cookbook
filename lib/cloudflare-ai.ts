import {AIError} from './ai-errors.ts';
export const recipeModel='@cf/google/gemma-4-26b-a4b-it';
export function providerRequest(prompt:string,image?:string){
 return {messages:[{role:'user',content:image?[{type:'text',text:prompt},{type:'image_url',image_url:{url:`data:image/jpeg;base64,${image}`}}]:prompt}],max_completion_tokens:3000,temperature:0.1,stream:false,chat_template_kwargs:{enable_thinking:false}};
}
export function providerText(data:unknown):string {
 if (!data || typeof data !== 'object') throw new AIError('AI_PROVIDER_FORMAT_INVALID');
 const d=data as {success?:boolean;result?:{choices?:{finish_reason?:unknown;message?:{content?:unknown}}[]}};
 if (d.success === false) throw new AIError('AI_PROVIDER_FAILURE');
 const choice=Array.isArray(d.result?.choices) ? d.result.choices[0] : undefined;
 if (choice?.finish_reason === 'length') throw new AIError('AI_OUTPUT_TRUNCATED');
 const value=choice?.message?.content;
 if(d.success!==true||typeof value!=='string'||!value.trim())throw new AIError('AI_PROVIDER_FORMAT_INVALID');
 return value;
}
