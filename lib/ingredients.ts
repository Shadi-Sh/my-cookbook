import type {Ingredient} from './model.ts';
import {quantityPattern,unitPattern,canonicalUnit,parseAmount} from './units.ts';
const digit = (s: string) => s.replace(/[۰-۹٠-٩]/g, c => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c) >= 0 ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(c) : '٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/٫/g, '.');
export function parseIngredient(line: string): Ingredient {
  line=digit(line).trim();
  let qualifiers='';
  const approximate=line.match(/^(?:about|approx\.?|approximately|ca\.?|circa|etwa|ungefähr|~)\s*/i);
  if(approximate){qualifiers=approximate[0].trim();line=line.slice(approximate[0].length);}
  line=line.replace(/^(\S+(?:\s+\d+\/\d+)?)\s+(heaped|level|gehäufte?r?|gestrichene?r?)\s+/i,(_,amount,q)=>{qualifiers=[qualifiers,q].filter(Boolean).join('; ');return amount+' ';});
  let pack='';line=line.replace(/^(\d+)\s*\(([^)]+)\)\s*/,(_,amount,size)=>{pack=size+' je Behälter / per container';return amount+' ';});
  const amount='('+quantityPattern+'(?:\\s*(?:[-–—]|to|bis)\\s*'+quantityPattern+')?)';
  const start=line.match(new RegExp('^'+amount+'\\s*(?:('+unitPattern+')(?:\\.)?(?=\\s|$))?\\s*(.+)$','i'));
  const end=line.match(new RegExp('^(.+?)\\s*[:：]\\s*'+amount+'\\s*('+unitPattern+')?\\s*$','i'));
  let name=start?.[3]??end?.[1]??line, unit=start?.[2]??end?.[3]??'', note='';
  const value=parseAmount(start?.[1]??end?.[2]??'');
  // Counts can follow the ingredient, as in "basil leaves torn".
  if(!unit && start){
    const suffix=name.match(/^(.+?)\s+(leaves|sprigs|cloves|slices|stalks|heads|bulbs|Blätter|Zweige|Zehen|Scheiben|Stangen)\b(?:\s+(.*))?$/i);
    if(suffix){name=suffix[1];unit=suffix[2];note=suffix[3]??'';}
    const compound=name.match(/^(.+?)(blätter|zweige|zehen)$/i);if(!unit&&compound){name=compound[1];unit=compound[2];}
  }
  const prep=name.match(/^(.+?)\s+(torn|leaves picked|finely chopped|chopped|minced|beaten|peeled|sliced|gehackt|gezupft|zerrupft|geschält|in Scheiben)(?:\s+.*)?$/i);if(prep){note=[note,name.slice(prep[1].length).trim()].filter(Boolean).join('; ');name=prep[1];}
  const split=name.match(/^(.+?)[,،]\s*(.+)$/);if(split){name=split[1];note=[note,split[2]].filter(Boolean).join('; ');}
  return {name:name.trim().slice(0,150),...value,unit:canonicalUnit(unit).slice(0,40),optional:/optional|اختیاری/i.test(line),note:[qualifiers,pack,note].filter(Boolean).join('; ').slice(0,200)};
}

export function normalizeIngredient(i:Ingredient):Ingredient {
 const result={...i,unit:canonicalUnit(i.unit)};
 if(i.quantity===null&&!i.quantityRange){
  const parsed=parseIngredient(i.name);
  if(parsed.quantityRange)return {...result,...parsed,optional:i.optional,note:[parsed.note,i.note.replace('Mengenbereich prüfen / Check quantity range','')].filter(Boolean).join('; ').slice(0,200)};
  const range=i.note.match(new RegExp('^('+quantityPattern+'\\s*(?:[-–—]|to|bis)\\s*'+quantityPattern+')\\s*('+unitPattern+')(?=\\s|[,،]|$)[,،]?\\s*(.*)$','i'));
  if(range){const amount=parseAmount(range[1]);if(amount.quantityRange)return {...result,...amount,unit:result.unit||canonicalUnit(range[2]),note:range[3]};}
 }
 return result;
}
