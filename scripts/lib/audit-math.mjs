export function changeUncertainty(sd0,sd1,rho){
 if(![sd0,sd1,rho].every(Number.isFinite)||sd0<0||sd1<0||Math.abs(rho)>1)throw Error('Invalid change uncertainty inputs');
 const variance=sd0**2+sd1**2-2*rho*sd0*sd1;
 return {variance,sd:Math.sqrt(Math.max(0,variance)),half95:1.96*Math.sqrt(Math.max(0,variance))};
}
export function requiredIndependentUnits(cv,relativeHalfWidth,designEffect=1){
 if(![cv,relativeHalfWidth,designEffect].every(Number.isFinite)||cv<0||relativeHalfWidth<=0||designEffect<1)throw Error('Invalid design inputs');
 return Math.ceil((1.96*cv/relativeHalfWidth)**2*designEffect);
}
export const median=a=>{const s=[...a].sort((x,y)=>x-y);return s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2;};
