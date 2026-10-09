export const CONTENT_RELEASE_PLATFORM_FEE_PERCENT=1;
export function contentReleasePriceCents(release:{accessModel:string;price?:string|number|null;minPrice?:string|number|null}):number{
 const raw=release.accessModel==='pay_what_you_want'?release.minPrice:release.price;
 const cents=Math.round(Number(raw??0)*100);
 return Number.isSafeInteger(cents)&&cents>=0?cents:0;
}
export function contentReleasePublicView<T extends {contentUrl:string;accessModel:string;userId:number}>(release:T,viewerId?:number){
 return {...release,contentUrl:release.accessModel==='free'||release.userId===viewerId?release.contentUrl:null};
}
export function isVerifiedContentPurchase(purchase:{amountPaid:string|number;stripePaymentIntentId?:string|null;paymentStatus?:string|null}|null|undefined){
 return !!purchase&&purchase.paymentStatus!=='refunded'&&(!!purchase.stripePaymentIntentId||Number(purchase.amountPaid)===0);
}
