// Units remain separate unless conversion is unambiguous. Cup/tsp/tbsp and
// vague containers are never converted to ml or grams without a standard.
export const unitCatalog: Record<string,string[]> = {
 g:['g','gram','grams','Gramm','گرم'],kg:['kg','kilogram','kilograms','Kilogramm','کیلوگرم'],mg:['mg','milligram','milligrams','Milligramm'],µg:['µg','μg','mcg','microgram','micrograms','Mikrogramm'],
 ml:['ml','milliliter','milliliters','millilitre','millilitres','cc','cm³','Milliliter','میلیلیتر','میلی‌لیتر'],cl:['cl','centiliter','centiliters','centilitre','centilitres','Zentiliter'],dl:['dl','deciliter','deciliters','decilitre','decilitres','Deziliter'],l:['l','liter','liters','litre','litres','لیتر'],
 oz:['oz','ounce','ounces','Unze','Unzen'],lb:['lb','lbs','pound','pounds'],Pfund:['Pfund'], 'fl oz':['fl oz','fl. oz.','fluid ounce','fluid ounces'],
 EL:['EL','tbsp','tbs','tablespoon','tablespoons','Esslöffel','قاشق غذاخوری','ق.غ'],TL:['TL','tsp','teaspoon','teaspoons','Teelöffel','قاشق چای خوری','قاشق چای‌خوری','ق.چ'],
 cup:['cup','cups','Tasse','Tassen','پیمانه'],pt:['pt','pint','pints'],qt:['qt','quart','quarts'],gal:['gal','gallon','gallons'],
 Stück:['Stück','Stücke','Stk','Stk.','pc','pcs','piece','pieces','عدد'],Prise:['Prise','Prisen','pinch','pinches'],Schuss:['Schuss','Schüsse','dash','dashes'],Tropfen:['Tropfen','drop','drops'],Handvoll:['Handvoll','handful','handfuls'],
 Bund:['Bund','Bünde','bunch','bunches'],Blätter:['Blatt','Blätter','leaf','leaves'],Zweige:['Zweig','Zweige','sprig','sprigs'],Zehen:['Zehe','Zehen','clove','cloves'],Scheiben:['Scheibe','Scheiben','slice','slices'],Stangen:['Stange','Stangen','stalk','stalks'],Köpfe:['Kopf','Köpfe','head','heads'],Knollen:['Knolle','Knollen','bulb','bulbs'],
 Dose:['Dose','Dosen','can','cans','tin','tins'],Glas:['Glas','Gläser','jar','jars'],Flasche:['Flasche','Flaschen','bottle','bottles'],Packung:['Packung','Packungen','packet','packets','package','packages','pkg'],Beutel:['Beutel','bag','bags','sachet','sachets'],Becher:['Becher','tub','tubs'],Würfel:['Würfel','cube','cubes'],Stückchen:['Stückchen','chunk','chunks'],Portion:['Portion','Portionen','serving','servings'],cm:['cm','centimeter','centimeters','centimetre','centimetres','Zentimeter'],mm:['mm','millimeter','millimeters','millimetre','millimetres','Millimeter'],Dutzend:['Dutzend','dozen'],Paar:['Paar','pair','pairs'],Messlöffel:['Messlöffel','scoop','scoops'],Kelle:['Kelle','Kellen','ladle','ladles'],Stick:['stick','sticks'],Riegel:['Riegel','bar','bars'],Spalten:['Spalte','Spalten','wedge','wedges'],Dessertlöffel:['Dessertlöffel','dessertspoon','dessertspoons','dessert spoon','dessert spoons','dsp'],Messerspitze:['Messerspitze','Messerspitzen','Msp','Msp.'],
};
const norm=(s:string)=>s.toLowerCase().replace(/\./g,'').replace(/[\s\u200c]+/g,' ').trim();
const aliases=new Map(Object.entries(unitCatalog).flatMap(([key,values])=>values.map(v=>[norm(v),key] as const)));
export function canonicalUnit(s:string){return aliases.get(norm(s))??s.trim();}
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'[\\s\\u200c]+');
export const unitPattern=Object.values(unitCatalog).flat().sort((a,b)=>b.length-a.length).map(escape).join('|');
export const quantityPattern='(?:\\d+\\s*[½¼¾⅓⅔⅛⅜⅝⅞]|\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:[.,]\\d+)?|\\d*[½¼¾⅓⅔⅛⅜⅝⅞])';
export function amountNumber(s:string):number|null {
 const f:Record<string,number>={'½':.5,'¼':.25,'¾':.75,'⅓':1/3,'⅔':2/3,'⅛':.125,'⅜':.375,'⅝':.625,'⅞':.875};
 const unicode=s.match(/^(\d*)\s*([½¼¾⅓⅔⅛⅜⅝⅞])$/);if(unicode)return Number(unicode[1]||0)+f[unicode[2]];
 const fraction=s.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);if(fraction){const n=Number(fraction[1]||0)+Number(fraction[2])/Number(fraction[3]);return Number.isFinite(n)&&n<=1e6?n:null;}
 const n=Number(s.replace(',','.'));return s.trim()&&Number.isFinite(n)&&n>=0&&n<=1e6?n:null;
}
export function parseAmount(s:string):{quantity:number|null;quantityRange?:{min:number;max:number}} {
 const m=s.trim().match(new RegExp('^('+quantityPattern+')\\s*(?:[-–—]|to|bis)\\s*('+quantityPattern+')$','i'));
 if(m){const min=amountNumber(m[1]),max=amountNumber(m[2]);if(min!==null&&max!==null&&min<=max)return {quantity:null,quantityRange:{min,max}};return {quantity:null};}
 return {quantity:amountNumber(s)};
}
export function amountText(i:{quantity:number|null;quantityRange?:{min:number;max:number}},factor=1){const fmt=(v:number)=>String(Math.round(v*1000)/1000);return i.quantityRange?`${fmt(i.quantityRange.min*factor)}–${fmt(i.quantityRange.max*factor)}`:i.quantity===null?'':fmt(i.quantity*factor);}
