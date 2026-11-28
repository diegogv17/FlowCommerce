(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))r(l);new MutationObserver(l=>{for(const s of l)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function n(l){const s={};return l.integrity&&(s.integrity=l.integrity),l.referrerPolicy&&(s.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?s.credentials="include":l.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(l){if(l.ep)return;l.ep=!0;const s=n(l);fetch(l.href,s)}})();function nc(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var Vi={exports:{}},qr={},$i={exports:{}},z={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Hn=Symbol.for("react.element"),rc=Symbol.for("react.portal"),lc=Symbol.for("react.fragment"),sc=Symbol.for("react.strict_mode"),oc=Symbol.for("react.profiler"),ic=Symbol.for("react.provider"),ac=Symbol.for("react.context"),uc=Symbol.for("react.forward_ref"),cc=Symbol.for("react.suspense"),dc=Symbol.for("react.memo"),fc=Symbol.for("react.lazy"),Lo=Symbol.iterator;function pc(e){return e===null||typeof e!="object"?null:(e=Lo&&e[Lo]||e["@@iterator"],typeof e=="function"?e:null)}var Wi={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},Hi=Object.assign,Gi={};function nn(e,t,n){this.props=e,this.context=t,this.refs=Gi,this.updater=n||Wi}nn.prototype.isReactComponent={};nn.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};nn.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function Ki(){}Ki.prototype=nn.prototype;function Os(e,t,n){this.props=e,this.context=t,this.refs=Gi,this.updater=n||Wi}var js=Os.prototype=new Ki;js.constructor=Os;Hi(js,nn.prototype);js.isPureReactComponent=!0;var To=Array.isArray,Yi=Object.prototype.hasOwnProperty,Is={current:null},Xi={key:!0,ref:!0,__self:!0,__source:!0};function Zi(e,t,n){var r,l={},s=null,o=null;if(t!=null)for(r in t.ref!==void 0&&(o=t.ref),t.key!==void 0&&(s=""+t.key),t)Yi.call(t,r)&&!Xi.hasOwnProperty(r)&&(l[r]=t[r]);var i=arguments.length-2;if(i===1)l.children=n;else if(1<i){for(var a=Array(i),c=0;c<i;c++)a[c]=arguments[c+2];l.children=a}if(e&&e.defaultProps)for(r in i=e.defaultProps,i)l[r]===void 0&&(l[r]=i[r]);return{$$typeof:Hn,type:e,key:s,ref:o,props:l,_owner:Is.current}}function mc(e,t){return{$$typeof:Hn,type:e.type,key:t,ref:e.ref,props:e.props,_owner:e._owner}}function Ms(e){return typeof e=="object"&&e!==null&&e.$$typeof===Hn}function xc(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(n){return t[n]})}var Ro=/\/+/g;function hl(e,t){return typeof e=="object"&&e!==null&&e.key!=null?xc(""+e.key):t.toString(36)}function vr(e,t,n,r,l){var s=typeof e;(s==="undefined"||s==="boolean")&&(e=null);var o=!1;if(e===null)o=!0;else switch(s){case"string":case"number":o=!0;break;case"object":switch(e.$$typeof){case Hn:case rc:o=!0}}if(o)return o=e,l=l(o),e=r===""?"."+hl(o,0):r,To(l)?(n="",e!=null&&(n=e.replace(Ro,"$&/")+"/"),vr(l,t,n,"",function(c){return c})):l!=null&&(Ms(l)&&(l=mc(l,n+(!l.key||o&&o.key===l.key?"":(""+l.key).replace(Ro,"$&/")+"/")+e)),t.push(l)),1;if(o=0,r=r===""?".":r+":",To(e))for(var i=0;i<e.length;i++){s=e[i];var a=r+hl(s,i);o+=vr(s,t,n,a,l)}else if(a=pc(e),typeof a=="function")for(e=a.call(e),i=0;!(s=e.next()).done;)s=s.value,a=r+hl(s,i++),o+=vr(s,t,n,a,l);else if(s==="object")throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.");return o}function Jn(e,t,n){if(e==null)return e;var r=[],l=0;return vr(e,r,"","",function(s){return t.call(n,s,l++)}),r}function vc(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(n){(e._status===0||e._status===-1)&&(e._status=1,e._result=n)},function(n){(e._status===0||e._status===-1)&&(e._status=2,e._result=n)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var oe={current:null},hr={transition:null},hc={ReactCurrentDispatcher:oe,ReactCurrentBatchConfig:hr,ReactCurrentOwner:Is};function qi(){throw Error("act(...) is not supported in production builds of React.")}z.Children={map:Jn,forEach:function(e,t,n){Jn(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return Jn(e,function(){t++}),t},toArray:function(e){return Jn(e,function(t){return t})||[]},only:function(e){if(!Ms(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};z.Component=nn;z.Fragment=lc;z.Profiler=oc;z.PureComponent=Os;z.StrictMode=sc;z.Suspense=cc;z.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=hc;z.act=qi;z.cloneElement=function(e,t,n){if(e==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+e+".");var r=Hi({},e.props),l=e.key,s=e.ref,o=e._owner;if(t!=null){if(t.ref!==void 0&&(s=t.ref,o=Is.current),t.key!==void 0&&(l=""+t.key),e.type&&e.type.defaultProps)var i=e.type.defaultProps;for(a in t)Yi.call(t,a)&&!Xi.hasOwnProperty(a)&&(r[a]=t[a]===void 0&&i!==void 0?i[a]:t[a])}var a=arguments.length-2;if(a===1)r.children=n;else if(1<a){i=Array(a);for(var c=0;c<a;c++)i[c]=arguments[c+2];r.children=i}return{$$typeof:Hn,type:e.type,key:l,ref:s,props:r,_owner:o}};z.createContext=function(e){return e={$$typeof:ac,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:ic,_context:e},e.Consumer=e};z.createElement=Zi;z.createFactory=function(e){var t=Zi.bind(null,e);return t.type=e,t};z.createRef=function(){return{current:null}};z.forwardRef=function(e){return{$$typeof:uc,render:e}};z.isValidElement=Ms;z.lazy=function(e){return{$$typeof:fc,_payload:{_status:-1,_result:e},_init:vc}};z.memo=function(e,t){return{$$typeof:dc,type:e,compare:t===void 0?null:t}};z.startTransition=function(e){var t=hr.transition;hr.transition={};try{e()}finally{hr.transition=t}};z.unstable_act=qi;z.useCallback=function(e,t){return oe.current.useCallback(e,t)};z.useContext=function(e){return oe.current.useContext(e)};z.useDebugValue=function(){};z.useDeferredValue=function(e){return oe.current.useDeferredValue(e)};z.useEffect=function(e,t){return oe.current.useEffect(e,t)};z.useId=function(){return oe.current.useId()};z.useImperativeHandle=function(e,t,n){return oe.current.useImperativeHandle(e,t,n)};z.useInsertionEffect=function(e,t){return oe.current.useInsertionEffect(e,t)};z.useLayoutEffect=function(e,t){return oe.current.useLayoutEffect(e,t)};z.useMemo=function(e,t){return oe.current.useMemo(e,t)};z.useReducer=function(e,t,n){return oe.current.useReducer(e,t,n)};z.useRef=function(e){return oe.current.useRef(e)};z.useState=function(e){return oe.current.useState(e)};z.useSyncExternalStore=function(e,t,n){return oe.current.useSyncExternalStore(e,t,n)};z.useTransition=function(){return oe.current.useTransition()};z.version="18.3.1";$i.exports=z;var Us=$i.exports;const gc=nc(Us);/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var yc=Us,Cc=Symbol.for("react.element"),wc=Symbol.for("react.fragment"),Ec=Object.prototype.hasOwnProperty,kc=yc.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,Sc={key:!0,ref:!0,__self:!0,__source:!0};function Ji(e,t,n){var r,l={},s=null,o=null;n!==void 0&&(s=""+n),t.key!==void 0&&(s=""+t.key),t.ref!==void 0&&(o=t.ref);for(r in t)Ec.call(t,r)&&!Sc.hasOwnProperty(r)&&(l[r]=t[r]);if(e&&e.defaultProps)for(r in t=e.defaultProps,t)l[r]===void 0&&(l[r]=t[r]);return{$$typeof:Cc,type:e,key:s,ref:o,props:l,_owner:kc.current}}qr.Fragment=wc;qr.jsx=Ji;qr.jsxs=Ji;Vi.exports=qr;var Vl=Vi.exports,$l={},ea={exports:{}},he={},ta={exports:{}},na={};/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */(function(e){function t(k,P){var b=k.length;k.push(P);e:for(;0<b;){var V=b-1>>>1,K=k[V];if(0<l(K,P))k[V]=P,k[b]=K,b=V;else break e}}function n(k){return k.length===0?null:k[0]}function r(k){if(k.length===0)return null;var P=k[0],b=k.pop();if(b!==P){k[0]=b;e:for(var V=0,K=k.length,Zn=K>>>1;V<Zn;){var mt=2*(V+1)-1,vl=k[mt],xt=mt+1,qn=k[xt];if(0>l(vl,b))xt<K&&0>l(qn,vl)?(k[V]=qn,k[xt]=b,V=xt):(k[V]=vl,k[mt]=b,V=mt);else if(xt<K&&0>l(qn,b))k[V]=qn,k[xt]=b,V=xt;else break e}}return P}function l(k,P){var b=k.sortIndex-P.sortIndex;return b!==0?b:k.id-P.id}if(typeof performance=="object"&&typeof performance.now=="function"){var s=performance;e.unstable_now=function(){return s.now()}}else{var o=Date,i=o.now();e.unstable_now=function(){return o.now()-i}}var a=[],c=[],x=1,m=null,p=3,g=!1,y=!1,C=!1,R=typeof setTimeout=="function"?setTimeout:null,d=typeof clearTimeout=="function"?clearTimeout:null,u=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function f(k){for(var P=n(c);P!==null;){if(P.callback===null)r(c);else if(P.startTime<=k)r(c),P.sortIndex=P.expirationTime,t(a,P);else break;P=n(c)}}function v(k){if(C=!1,f(k),!y)if(n(a)!==null)y=!0,ml(E);else{var P=n(c);P!==null&&xl(v,P.startTime-k)}}function E(k,P){y=!1,C&&(C=!1,d(_),_=-1),g=!0;var b=p;try{for(f(P),m=n(a);m!==null&&(!(m.expirationTime>P)||k&&!Fe());){var V=m.callback;if(typeof V=="function"){m.callback=null,p=m.priorityLevel;var K=V(m.expirationTime<=P);P=e.unstable_now(),typeof K=="function"?m.callback=K:m===n(a)&&r(a),f(P)}else r(a);m=n(a)}if(m!==null)var Zn=!0;else{var mt=n(c);mt!==null&&xl(v,mt.startTime-P),Zn=!1}return Zn}finally{m=null,p=b,g=!1}}var S=!1,F=null,_=-1,Q=5,D=-1;function Fe(){return!(e.unstable_now()-D<Q)}function sn(){if(F!==null){var k=e.unstable_now();D=k;var P=!0;try{P=F(!0,k)}finally{P?on():(S=!1,F=null)}}else S=!1}var on;if(typeof u=="function")on=function(){u(sn)};else if(typeof MessageChannel<"u"){var Ao=new MessageChannel,tc=Ao.port2;Ao.port1.onmessage=sn,on=function(){tc.postMessage(null)}}else on=function(){R(sn,0)};function ml(k){F=k,S||(S=!0,on())}function xl(k,P){_=R(function(){k(e.unstable_now())},P)}e.unstable_IdlePriority=5,e.unstable_ImmediatePriority=1,e.unstable_LowPriority=4,e.unstable_NormalPriority=3,e.unstable_Profiling=null,e.unstable_UserBlockingPriority=2,e.unstable_cancelCallback=function(k){k.callback=null},e.unstable_continueExecution=function(){y||g||(y=!0,ml(E))},e.unstable_forceFrameRate=function(k){0>k||125<k?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):Q=0<k?Math.floor(1e3/k):5},e.unstable_getCurrentPriorityLevel=function(){return p},e.unstable_getFirstCallbackNode=function(){return n(a)},e.unstable_next=function(k){switch(p){case 1:case 2:case 3:var P=3;break;default:P=p}var b=p;p=P;try{return k()}finally{p=b}},e.unstable_pauseExecution=function(){},e.unstable_requestPaint=function(){},e.unstable_runWithPriority=function(k,P){switch(k){case 1:case 2:case 3:case 4:case 5:break;default:k=3}var b=p;p=k;try{return P()}finally{p=b}},e.unstable_scheduleCallback=function(k,P,b){var V=e.unstable_now();switch(typeof b=="object"&&b!==null?(b=b.delay,b=typeof b=="number"&&0<b?V+b:V):b=V,k){case 1:var K=-1;break;case 2:K=250;break;case 5:K=1073741823;break;case 4:K=1e4;break;default:K=5e3}return K=b+K,k={id:x++,callback:P,priorityLevel:k,startTime:b,expirationTime:K,sortIndex:-1},b>V?(k.sortIndex=b,t(c,k),n(a)===null&&k===n(c)&&(C?(d(_),_=-1):C=!0,xl(v,b-V))):(k.sortIndex=K,t(a,k),y||g||(y=!0,ml(E))),k},e.unstable_shouldYield=Fe,e.unstable_wrapCallback=function(k){var P=p;return function(){var b=p;p=P;try{return k.apply(this,arguments)}finally{p=b}}}})(na);ta.exports=na;var Fc=ta.exports;/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var _c=Us,ve=Fc;function h(e){for(var t="https://reactjs.org/docs/error-decoder.html?invariant="+e,n=1;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n]);return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var ra=new Set,zn={};function bt(e,t){Yt(e,t),Yt(e+"Capture",t)}function Yt(e,t){for(zn[e]=t,e=0;e<t.length;e++)ra.add(t[e])}var Ve=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),Wl=Object.prototype.hasOwnProperty,Pc=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,Oo={},jo={};function bc(e){return Wl.call(jo,e)?!0:Wl.call(Oo,e)?!1:Pc.test(e)?jo[e]=!0:(Oo[e]=!0,!1)}function zc(e,t,n,r){if(n!==null&&n.type===0)return!1;switch(typeof t){case"function":case"symbol":return!0;case"boolean":return r?!1:n!==null?!n.acceptsBooleans:(e=e.toLowerCase().slice(0,5),e!=="data-"&&e!=="aria-");default:return!1}}function Dc(e,t,n,r){if(t===null||typeof t>"u"||zc(e,t,n,r))return!0;if(r)return!1;if(n!==null)switch(n.type){case 3:return!t;case 4:return t===!1;case 5:return isNaN(t);case 6:return isNaN(t)||1>t}return!1}function ie(e,t,n,r,l,s,o){this.acceptsBooleans=t===2||t===3||t===4,this.attributeName=r,this.attributeNamespace=l,this.mustUseProperty=n,this.propertyName=e,this.type=t,this.sanitizeURL=s,this.removeEmptyString=o}var J={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e){J[e]=new ie(e,0,!1,e,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(e){var t=e[0];J[t]=new ie(t,1,!1,e[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(e){J[e]=new ie(e,2,!1,e.toLowerCase(),null,!1,!1)});["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(e){J[e]=new ie(e,2,!1,e,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e){J[e]=new ie(e,3,!1,e.toLowerCase(),null,!1,!1)});["checked","multiple","muted","selected"].forEach(function(e){J[e]=new ie(e,3,!0,e,null,!1,!1)});["capture","download"].forEach(function(e){J[e]=new ie(e,4,!1,e,null,!1,!1)});["cols","rows","size","span"].forEach(function(e){J[e]=new ie(e,6,!1,e,null,!1,!1)});["rowSpan","start"].forEach(function(e){J[e]=new ie(e,5,!1,e.toLowerCase(),null,!1,!1)});var Qs=/[\-:]([a-z])/g;function Vs(e){return e[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e){var t=e.replace(Qs,Vs);J[t]=new ie(t,1,!1,e,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e){var t=e.replace(Qs,Vs);J[t]=new ie(t,1,!1,e,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(e){var t=e.replace(Qs,Vs);J[t]=new ie(t,1,!1,e,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(e){J[e]=new ie(e,1,!1,e.toLowerCase(),null,!1,!1)});J.xlinkHref=new ie("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(e){J[e]=new ie(e,1,!1,e.toLowerCase(),null,!0,!0)});function $s(e,t,n,r){var l=J.hasOwnProperty(t)?J[t]:null;(l!==null?l.type!==0:r||!(2<t.length)||t[0]!=="o"&&t[0]!=="O"||t[1]!=="n"&&t[1]!=="N")&&(Dc(t,n,l,r)&&(n=null),r||l===null?bc(t)&&(n===null?e.removeAttribute(t):e.setAttribute(t,""+n)):l.mustUseProperty?e[l.propertyName]=n===null?l.type===3?!1:"":n:(t=l.attributeName,r=l.attributeNamespace,n===null?e.removeAttribute(t):(l=l.type,n=l===3||l===4&&n===!0?"":""+n,r?e.setAttributeNS(r,t,n):e.setAttribute(t,n))))}var Ge=_c.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,er=Symbol.for("react.element"),Bt=Symbol.for("react.portal"),Nt=Symbol.for("react.fragment"),Ws=Symbol.for("react.strict_mode"),Hl=Symbol.for("react.profiler"),la=Symbol.for("react.provider"),sa=Symbol.for("react.context"),Hs=Symbol.for("react.forward_ref"),Gl=Symbol.for("react.suspense"),Kl=Symbol.for("react.suspense_list"),Gs=Symbol.for("react.memo"),Ye=Symbol.for("react.lazy"),oa=Symbol.for("react.offscreen"),Io=Symbol.iterator;function an(e){return e===null||typeof e!="object"?null:(e=Io&&e[Io]||e["@@iterator"],typeof e=="function"?e:null)}var M=Object.assign,gl;function vn(e){if(gl===void 0)try{throw Error()}catch(n){var t=n.stack.trim().match(/\n( *(at )?)/);gl=t&&t[1]||""}return`
`+gl+e}var yl=!1;function Cl(e,t){if(!e||yl)return"";yl=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(t)if(t=function(){throw Error()},Object.defineProperty(t.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(t,[])}catch(c){var r=c}Reflect.construct(e,[],t)}else{try{t.call()}catch(c){r=c}e.call(t.prototype)}else{try{throw Error()}catch(c){r=c}e()}}catch(c){if(c&&r&&typeof c.stack=="string"){for(var l=c.stack.split(`
`),s=r.stack.split(`
`),o=l.length-1,i=s.length-1;1<=o&&0<=i&&l[o]!==s[i];)i--;for(;1<=o&&0<=i;o--,i--)if(l[o]!==s[i]){if(o!==1||i!==1)do if(o--,i--,0>i||l[o]!==s[i]){var a=`
`+l[o].replace(" at new "," at ");return e.displayName&&a.includes("<anonymous>")&&(a=a.replace("<anonymous>",e.displayName)),a}while(1<=o&&0<=i);break}}}finally{yl=!1,Error.prepareStackTrace=n}return(e=e?e.displayName||e.name:"")?vn(e):""}function Bc(e){switch(e.tag){case 5:return vn(e.type);case 16:return vn("Lazy");case 13:return vn("Suspense");case 19:return vn("SuspenseList");case 0:case 2:case 15:return e=Cl(e.type,!1),e;case 11:return e=Cl(e.type.render,!1),e;case 1:return e=Cl(e.type,!0),e;default:return""}}function Yl(e){if(e==null)return null;if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case Nt:return"Fragment";case Bt:return"Portal";case Hl:return"Profiler";case Ws:return"StrictMode";case Gl:return"Suspense";case Kl:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case sa:return(e.displayName||"Context")+".Consumer";case la:return(e._context.displayName||"Context")+".Provider";case Hs:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case Gs:return t=e.displayName||null,t!==null?t:Yl(e.type)||"Memo";case Ye:t=e._payload,e=e._init;try{return Yl(e(t))}catch{}}return null}function Nc(e){var t=e.type;switch(e.tag){case 24:return"Cache";case 9:return(t.displayName||"Context")+".Consumer";case 10:return(t._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return e=t.render,e=e.displayName||e.name||"",t.displayName||(e!==""?"ForwardRef("+e+")":"ForwardRef");case 7:return"Fragment";case 5:return t;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return Yl(t);case 8:return t===Ws?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof t=="function")return t.displayName||t.name||null;if(typeof t=="string")return t}return null}function ut(e){switch(typeof e){case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function ia(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function Ac(e){var t=ia(e)?"checked":"value",n=Object.getOwnPropertyDescriptor(e.constructor.prototype,t),r=""+e[t];if(!e.hasOwnProperty(t)&&typeof n<"u"&&typeof n.get=="function"&&typeof n.set=="function"){var l=n.get,s=n.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return l.call(this)},set:function(o){r=""+o,s.call(this,o)}}),Object.defineProperty(e,t,{enumerable:n.enumerable}),{getValue:function(){return r},setValue:function(o){r=""+o},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function tr(e){e._valueTracker||(e._valueTracker=Ac(e))}function aa(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),r="";return e&&(r=ia(e)?e.checked?"true":"false":e.value),e=r,e!==n?(t.setValue(e),!0):!1}function br(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function Xl(e,t){var n=t.checked;return M({},t,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:n??e._wrapperState.initialChecked})}function Mo(e,t){var n=t.defaultValue==null?"":t.defaultValue,r=t.checked!=null?t.checked:t.defaultChecked;n=ut(t.value!=null?t.value:n),e._wrapperState={initialChecked:r,initialValue:n,controlled:t.type==="checkbox"||t.type==="radio"?t.checked!=null:t.value!=null}}function ua(e,t){t=t.checked,t!=null&&$s(e,"checked",t,!1)}function Zl(e,t){ua(e,t);var n=ut(t.value),r=t.type;if(n!=null)r==="number"?(n===0&&e.value===""||e.value!=n)&&(e.value=""+n):e.value!==""+n&&(e.value=""+n);else if(r==="submit"||r==="reset"){e.removeAttribute("value");return}t.hasOwnProperty("value")?ql(e,t.type,n):t.hasOwnProperty("defaultValue")&&ql(e,t.type,ut(t.defaultValue)),t.checked==null&&t.defaultChecked!=null&&(e.defaultChecked=!!t.defaultChecked)}function Uo(e,t,n){if(t.hasOwnProperty("value")||t.hasOwnProperty("defaultValue")){var r=t.type;if(!(r!=="submit"&&r!=="reset"||t.value!==void 0&&t.value!==null))return;t=""+e._wrapperState.initialValue,n||t===e.value||(e.value=t),e.defaultValue=t}n=e.name,n!==""&&(e.name=""),e.defaultChecked=!!e._wrapperState.initialChecked,n!==""&&(e.name=n)}function ql(e,t,n){(t!=="number"||br(e.ownerDocument)!==e)&&(n==null?e.defaultValue=""+e._wrapperState.initialValue:e.defaultValue!==""+n&&(e.defaultValue=""+n))}var hn=Array.isArray;function Vt(e,t,n,r){if(e=e.options,t){t={};for(var l=0;l<n.length;l++)t["$"+n[l]]=!0;for(n=0;n<e.length;n++)l=t.hasOwnProperty("$"+e[n].value),e[n].selected!==l&&(e[n].selected=l),l&&r&&(e[n].defaultSelected=!0)}else{for(n=""+ut(n),t=null,l=0;l<e.length;l++){if(e[l].value===n){e[l].selected=!0,r&&(e[l].defaultSelected=!0);return}t!==null||e[l].disabled||(t=e[l])}t!==null&&(t.selected=!0)}}function Jl(e,t){if(t.dangerouslySetInnerHTML!=null)throw Error(h(91));return M({},t,{value:void 0,defaultValue:void 0,children:""+e._wrapperState.initialValue})}function Qo(e,t){var n=t.value;if(n==null){if(n=t.children,t=t.defaultValue,n!=null){if(t!=null)throw Error(h(92));if(hn(n)){if(1<n.length)throw Error(h(93));n=n[0]}t=n}t==null&&(t=""),n=t}e._wrapperState={initialValue:ut(n)}}function ca(e,t){var n=ut(t.value),r=ut(t.defaultValue);n!=null&&(n=""+n,n!==e.value&&(e.value=n),t.defaultValue==null&&e.defaultValue!==n&&(e.defaultValue=n)),r!=null&&(e.defaultValue=""+r)}function Vo(e){var t=e.textContent;t===e._wrapperState.initialValue&&t!==""&&t!==null&&(e.value=t)}function da(e){switch(e){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function es(e,t){return e==null||e==="http://www.w3.org/1999/xhtml"?da(t):e==="http://www.w3.org/2000/svg"&&t==="foreignObject"?"http://www.w3.org/1999/xhtml":e}var nr,fa=function(e){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(t,n,r,l){MSApp.execUnsafeLocalFunction(function(){return e(t,n,r,l)})}:e}(function(e,t){if(e.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in e)e.innerHTML=t;else{for(nr=nr||document.createElement("div"),nr.innerHTML="<svg>"+t.valueOf().toString()+"</svg>",t=nr.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;t.firstChild;)e.appendChild(t.firstChild)}});function Dn(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var Cn={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},Lc=["Webkit","ms","Moz","O"];Object.keys(Cn).forEach(function(e){Lc.forEach(function(t){t=t+e.charAt(0).toUpperCase()+e.substring(1),Cn[t]=Cn[e]})});function pa(e,t,n){return t==null||typeof t=="boolean"||t===""?"":n||typeof t!="number"||t===0||Cn.hasOwnProperty(e)&&Cn[e]?(""+t).trim():t+"px"}function ma(e,t){e=e.style;for(var n in t)if(t.hasOwnProperty(n)){var r=n.indexOf("--")===0,l=pa(n,t[n],r);n==="float"&&(n="cssFloat"),r?e.setProperty(n,l):e[n]=l}}var Tc=M({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function ts(e,t){if(t){if(Tc[e]&&(t.children!=null||t.dangerouslySetInnerHTML!=null))throw Error(h(137,e));if(t.dangerouslySetInnerHTML!=null){if(t.children!=null)throw Error(h(60));if(typeof t.dangerouslySetInnerHTML!="object"||!("__html"in t.dangerouslySetInnerHTML))throw Error(h(61))}if(t.style!=null&&typeof t.style!="object")throw Error(h(62))}}function ns(e,t){if(e.indexOf("-")===-1)return typeof t.is=="string";switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var rs=null;function Ks(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var ls=null,$t=null,Wt=null;function $o(e){if(e=Yn(e)){if(typeof ls!="function")throw Error(h(280));var t=e.stateNode;t&&(t=rl(t),ls(e.stateNode,e.type,t))}}function xa(e){$t?Wt?Wt.push(e):Wt=[e]:$t=e}function va(){if($t){var e=$t,t=Wt;if(Wt=$t=null,$o(e),t)for(e=0;e<t.length;e++)$o(t[e])}}function ha(e,t){return e(t)}function ga(){}var wl=!1;function ya(e,t,n){if(wl)return e(t,n);wl=!0;try{return ha(e,t,n)}finally{wl=!1,($t!==null||Wt!==null)&&(ga(),va())}}function Bn(e,t){var n=e.stateNode;if(n===null)return null;var r=rl(n);if(r===null)return null;n=r[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(e=e.type,r=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!r;break e;default:e=!1}if(e)return null;if(n&&typeof n!="function")throw Error(h(231,t,typeof n));return n}var ss=!1;if(Ve)try{var un={};Object.defineProperty(un,"passive",{get:function(){ss=!0}}),window.addEventListener("test",un,un),window.removeEventListener("test",un,un)}catch{ss=!1}function Rc(e,t,n,r,l,s,o,i,a){var c=Array.prototype.slice.call(arguments,3);try{t.apply(n,c)}catch(x){this.onError(x)}}var wn=!1,zr=null,Dr=!1,os=null,Oc={onError:function(e){wn=!0,zr=e}};function jc(e,t,n,r,l,s,o,i,a){wn=!1,zr=null,Rc.apply(Oc,arguments)}function Ic(e,t,n,r,l,s,o,i,a){if(jc.apply(this,arguments),wn){if(wn){var c=zr;wn=!1,zr=null}else throw Error(h(198));Dr||(Dr=!0,os=c)}}function zt(e){var t=e,n=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,t.flags&4098&&(n=t.return),e=t.return;while(e)}return t.tag===3?n:null}function Ca(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function Wo(e){if(zt(e)!==e)throw Error(h(188))}function Mc(e){var t=e.alternate;if(!t){if(t=zt(e),t===null)throw Error(h(188));return t!==e?null:e}for(var n=e,r=t;;){var l=n.return;if(l===null)break;var s=l.alternate;if(s===null){if(r=l.return,r!==null){n=r;continue}break}if(l.child===s.child){for(s=l.child;s;){if(s===n)return Wo(l),e;if(s===r)return Wo(l),t;s=s.sibling}throw Error(h(188))}if(n.return!==r.return)n=l,r=s;else{for(var o=!1,i=l.child;i;){if(i===n){o=!0,n=l,r=s;break}if(i===r){o=!0,r=l,n=s;break}i=i.sibling}if(!o){for(i=s.child;i;){if(i===n){o=!0,n=s,r=l;break}if(i===r){o=!0,r=s,n=l;break}i=i.sibling}if(!o)throw Error(h(189))}}if(n.alternate!==r)throw Error(h(190))}if(n.tag!==3)throw Error(h(188));return n.stateNode.current===n?e:t}function wa(e){return e=Mc(e),e!==null?Ea(e):null}function Ea(e){if(e.tag===5||e.tag===6)return e;for(e=e.child;e!==null;){var t=Ea(e);if(t!==null)return t;e=e.sibling}return null}var ka=ve.unstable_scheduleCallback,Ho=ve.unstable_cancelCallback,Uc=ve.unstable_shouldYield,Qc=ve.unstable_requestPaint,$=ve.unstable_now,Vc=ve.unstable_getCurrentPriorityLevel,Ys=ve.unstable_ImmediatePriority,Sa=ve.unstable_UserBlockingPriority,Br=ve.unstable_NormalPriority,$c=ve.unstable_LowPriority,Fa=ve.unstable_IdlePriority,Jr=null,Re=null;function Wc(e){if(Re&&typeof Re.onCommitFiberRoot=="function")try{Re.onCommitFiberRoot(Jr,e,void 0,(e.current.flags&128)===128)}catch{}}var De=Math.clz32?Math.clz32:Kc,Hc=Math.log,Gc=Math.LN2;function Kc(e){return e>>>=0,e===0?32:31-(Hc(e)/Gc|0)|0}var rr=64,lr=4194304;function gn(e){switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return e&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return e}}function Nr(e,t){var n=e.pendingLanes;if(n===0)return 0;var r=0,l=e.suspendedLanes,s=e.pingedLanes,o=n&268435455;if(o!==0){var i=o&~l;i!==0?r=gn(i):(s&=o,s!==0&&(r=gn(s)))}else o=n&~l,o!==0?r=gn(o):s!==0&&(r=gn(s));if(r===0)return 0;if(t!==0&&t!==r&&!(t&l)&&(l=r&-r,s=t&-t,l>=s||l===16&&(s&4194240)!==0))return t;if(r&4&&(r|=n&16),t=e.entangledLanes,t!==0)for(e=e.entanglements,t&=r;0<t;)n=31-De(t),l=1<<n,r|=e[n],t&=~l;return r}function Yc(e,t){switch(e){case 1:case 2:case 4:return t+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Xc(e,t){for(var n=e.suspendedLanes,r=e.pingedLanes,l=e.expirationTimes,s=e.pendingLanes;0<s;){var o=31-De(s),i=1<<o,a=l[o];a===-1?(!(i&n)||i&r)&&(l[o]=Yc(i,t)):a<=t&&(e.expiredLanes|=i),s&=~i}}function is(e){return e=e.pendingLanes&-1073741825,e!==0?e:e&1073741824?1073741824:0}function _a(){var e=rr;return rr<<=1,!(rr&4194240)&&(rr=64),e}function El(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function Gn(e,t,n){e.pendingLanes|=t,t!==536870912&&(e.suspendedLanes=0,e.pingedLanes=0),e=e.eventTimes,t=31-De(t),e[t]=n}function Zc(e,t){var n=e.pendingLanes&~t;e.pendingLanes=t,e.suspendedLanes=0,e.pingedLanes=0,e.expiredLanes&=t,e.mutableReadLanes&=t,e.entangledLanes&=t,t=e.entanglements;var r=e.eventTimes;for(e=e.expirationTimes;0<n;){var l=31-De(n),s=1<<l;t[l]=0,r[l]=-1,e[l]=-1,n&=~s}}function Xs(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var r=31-De(n),l=1<<r;l&t|e[r]&t&&(e[r]|=t),n&=~l}}var N=0;function Pa(e){return e&=-e,1<e?4<e?e&268435455?16:536870912:4:1}var ba,Zs,za,Da,Ba,as=!1,sr=[],tt=null,nt=null,rt=null,Nn=new Map,An=new Map,Ze=[],qc="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function Go(e,t){switch(e){case"focusin":case"focusout":tt=null;break;case"dragenter":case"dragleave":nt=null;break;case"mouseover":case"mouseout":rt=null;break;case"pointerover":case"pointerout":Nn.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":An.delete(t.pointerId)}}function cn(e,t,n,r,l,s){return e===null||e.nativeEvent!==s?(e={blockedOn:t,domEventName:n,eventSystemFlags:r,nativeEvent:s,targetContainers:[l]},t!==null&&(t=Yn(t),t!==null&&Zs(t)),e):(e.eventSystemFlags|=r,t=e.targetContainers,l!==null&&t.indexOf(l)===-1&&t.push(l),e)}function Jc(e,t,n,r,l){switch(t){case"focusin":return tt=cn(tt,e,t,n,r,l),!0;case"dragenter":return nt=cn(nt,e,t,n,r,l),!0;case"mouseover":return rt=cn(rt,e,t,n,r,l),!0;case"pointerover":var s=l.pointerId;return Nn.set(s,cn(Nn.get(s)||null,e,t,n,r,l)),!0;case"gotpointercapture":return s=l.pointerId,An.set(s,cn(An.get(s)||null,e,t,n,r,l)),!0}return!1}function Na(e){var t=gt(e.target);if(t!==null){var n=zt(t);if(n!==null){if(t=n.tag,t===13){if(t=Ca(n),t!==null){e.blockedOn=t,Ba(e.priority,function(){za(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function gr(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=us(e.domEventName,e.eventSystemFlags,t[0],e.nativeEvent);if(n===null){n=e.nativeEvent;var r=new n.constructor(n.type,n);rs=r,n.target.dispatchEvent(r),rs=null}else return t=Yn(n),t!==null&&Zs(t),e.blockedOn=n,!1;t.shift()}return!0}function Ko(e,t,n){gr(e)&&n.delete(t)}function ed(){as=!1,tt!==null&&gr(tt)&&(tt=null),nt!==null&&gr(nt)&&(nt=null),rt!==null&&gr(rt)&&(rt=null),Nn.forEach(Ko),An.forEach(Ko)}function dn(e,t){e.blockedOn===t&&(e.blockedOn=null,as||(as=!0,ve.unstable_scheduleCallback(ve.unstable_NormalPriority,ed)))}function Ln(e){function t(l){return dn(l,e)}if(0<sr.length){dn(sr[0],e);for(var n=1;n<sr.length;n++){var r=sr[n];r.blockedOn===e&&(r.blockedOn=null)}}for(tt!==null&&dn(tt,e),nt!==null&&dn(nt,e),rt!==null&&dn(rt,e),Nn.forEach(t),An.forEach(t),n=0;n<Ze.length;n++)r=Ze[n],r.blockedOn===e&&(r.blockedOn=null);for(;0<Ze.length&&(n=Ze[0],n.blockedOn===null);)Na(n),n.blockedOn===null&&Ze.shift()}var Ht=Ge.ReactCurrentBatchConfig,Ar=!0;function td(e,t,n,r){var l=N,s=Ht.transition;Ht.transition=null;try{N=1,qs(e,t,n,r)}finally{N=l,Ht.transition=s}}function nd(e,t,n,r){var l=N,s=Ht.transition;Ht.transition=null;try{N=4,qs(e,t,n,r)}finally{N=l,Ht.transition=s}}function qs(e,t,n,r){if(Ar){var l=us(e,t,n,r);if(l===null)Nl(e,t,r,Lr,n),Go(e,r);else if(Jc(l,e,t,n,r))r.stopPropagation();else if(Go(e,r),t&4&&-1<qc.indexOf(e)){for(;l!==null;){var s=Yn(l);if(s!==null&&ba(s),s=us(e,t,n,r),s===null&&Nl(e,t,r,Lr,n),s===l)break;l=s}l!==null&&r.stopPropagation()}else Nl(e,t,r,null,n)}}var Lr=null;function us(e,t,n,r){if(Lr=null,e=Ks(r),e=gt(e),e!==null)if(t=zt(e),t===null)e=null;else if(n=t.tag,n===13){if(e=Ca(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null);return Lr=e,null}function Aa(e){switch(e){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(Vc()){case Ys:return 1;case Sa:return 4;case Br:case $c:return 16;case Fa:return 536870912;default:return 16}default:return 16}}var Je=null,Js=null,yr=null;function La(){if(yr)return yr;var e,t=Js,n=t.length,r,l="value"in Je?Je.value:Je.textContent,s=l.length;for(e=0;e<n&&t[e]===l[e];e++);var o=n-e;for(r=1;r<=o&&t[n-r]===l[s-r];r++);return yr=l.slice(e,1<r?1-r:void 0)}function Cr(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function or(){return!0}function Yo(){return!1}function ge(e){function t(n,r,l,s,o){this._reactName=n,this._targetInst=l,this.type=r,this.nativeEvent=s,this.target=o,this.currentTarget=null;for(var i in e)e.hasOwnProperty(i)&&(n=e[i],this[i]=n?n(s):s[i]);return this.isDefaultPrevented=(s.defaultPrevented!=null?s.defaultPrevented:s.returnValue===!1)?or:Yo,this.isPropagationStopped=Yo,this}return M(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=or)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=or)},persist:function(){},isPersistent:or}),t}var rn={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},eo=ge(rn),Kn=M({},rn,{view:0,detail:0}),rd=ge(Kn),kl,Sl,fn,el=M({},Kn,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:to,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==fn&&(fn&&e.type==="mousemove"?(kl=e.screenX-fn.screenX,Sl=e.screenY-fn.screenY):Sl=kl=0,fn=e),kl)},movementY:function(e){return"movementY"in e?e.movementY:Sl}}),Xo=ge(el),ld=M({},el,{dataTransfer:0}),sd=ge(ld),od=M({},Kn,{relatedTarget:0}),Fl=ge(od),id=M({},rn,{animationName:0,elapsedTime:0,pseudoElement:0}),ad=ge(id),ud=M({},rn,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),cd=ge(ud),dd=M({},rn,{data:0}),Zo=ge(dd),fd={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},pd={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},md={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function xd(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=md[e])?!!t[e]:!1}function to(){return xd}var vd=M({},Kn,{key:function(e){if(e.key){var t=fd[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=Cr(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?pd[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:to,charCode:function(e){return e.type==="keypress"?Cr(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?Cr(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),hd=ge(vd),gd=M({},el,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),qo=ge(gd),yd=M({},Kn,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:to}),Cd=ge(yd),wd=M({},rn,{propertyName:0,elapsedTime:0,pseudoElement:0}),Ed=ge(wd),kd=M({},el,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),Sd=ge(kd),Fd=[9,13,27,32],no=Ve&&"CompositionEvent"in window,En=null;Ve&&"documentMode"in document&&(En=document.documentMode);var _d=Ve&&"TextEvent"in window&&!En,Ta=Ve&&(!no||En&&8<En&&11>=En),Jo=" ",ei=!1;function Ra(e,t){switch(e){case"keyup":return Fd.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function Oa(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var At=!1;function Pd(e,t){switch(e){case"compositionend":return Oa(t);case"keypress":return t.which!==32?null:(ei=!0,Jo);case"textInput":return e=t.data,e===Jo&&ei?null:e;default:return null}}function bd(e,t){if(At)return e==="compositionend"||!no&&Ra(e,t)?(e=La(),yr=Js=Je=null,At=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return Ta&&t.locale!=="ko"?null:t.data;default:return null}}var zd={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function ti(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!zd[e.type]:t==="textarea"}function ja(e,t,n,r){xa(r),t=Tr(t,"onChange"),0<t.length&&(n=new eo("onChange","change",null,n,r),e.push({event:n,listeners:t}))}var kn=null,Tn=null;function Dd(e){Ya(e,0)}function tl(e){var t=Rt(e);if(aa(t))return e}function Bd(e,t){if(e==="change")return t}var Ia=!1;if(Ve){var _l;if(Ve){var Pl="oninput"in document;if(!Pl){var ni=document.createElement("div");ni.setAttribute("oninput","return;"),Pl=typeof ni.oninput=="function"}_l=Pl}else _l=!1;Ia=_l&&(!document.documentMode||9<document.documentMode)}function ri(){kn&&(kn.detachEvent("onpropertychange",Ma),Tn=kn=null)}function Ma(e){if(e.propertyName==="value"&&tl(Tn)){var t=[];ja(t,Tn,e,Ks(e)),ya(Dd,t)}}function Nd(e,t,n){e==="focusin"?(ri(),kn=t,Tn=n,kn.attachEvent("onpropertychange",Ma)):e==="focusout"&&ri()}function Ad(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return tl(Tn)}function Ld(e,t){if(e==="click")return tl(t)}function Td(e,t){if(e==="input"||e==="change")return tl(t)}function Rd(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var Ne=typeof Object.is=="function"?Object.is:Rd;function Rn(e,t){if(Ne(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var n=Object.keys(e),r=Object.keys(t);if(n.length!==r.length)return!1;for(r=0;r<n.length;r++){var l=n[r];if(!Wl.call(t,l)||!Ne(e[l],t[l]))return!1}return!0}function li(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function si(e,t){var n=li(e);e=0;for(var r;n;){if(n.nodeType===3){if(r=e+n.textContent.length,e<=t&&r>=t)return{node:n,offset:t-e};e=r}e:{for(;n;){if(n.nextSibling){n=n.nextSibling;break e}n=n.parentNode}n=void 0}n=li(n)}}function Ua(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?Ua(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function Qa(){for(var e=window,t=br();t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href=="string"}catch{n=!1}if(n)e=t.contentWindow;else break;t=br(e.document)}return t}function ro(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}function Od(e){var t=Qa(),n=e.focusedElem,r=e.selectionRange;if(t!==n&&n&&n.ownerDocument&&Ua(n.ownerDocument.documentElement,n)){if(r!==null&&ro(n)){if(t=r.start,e=r.end,e===void 0&&(e=t),"selectionStart"in n)n.selectionStart=t,n.selectionEnd=Math.min(e,n.value.length);else if(e=(t=n.ownerDocument||document)&&t.defaultView||window,e.getSelection){e=e.getSelection();var l=n.textContent.length,s=Math.min(r.start,l);r=r.end===void 0?s:Math.min(r.end,l),!e.extend&&s>r&&(l=r,r=s,s=l),l=si(n,s);var o=si(n,r);l&&o&&(e.rangeCount!==1||e.anchorNode!==l.node||e.anchorOffset!==l.offset||e.focusNode!==o.node||e.focusOffset!==o.offset)&&(t=t.createRange(),t.setStart(l.node,l.offset),e.removeAllRanges(),s>r?(e.addRange(t),e.extend(o.node,o.offset)):(t.setEnd(o.node,o.offset),e.addRange(t)))}}for(t=[],e=n;e=e.parentNode;)e.nodeType===1&&t.push({element:e,left:e.scrollLeft,top:e.scrollTop});for(typeof n.focus=="function"&&n.focus(),n=0;n<t.length;n++)e=t[n],e.element.scrollLeft=e.left,e.element.scrollTop=e.top}}var jd=Ve&&"documentMode"in document&&11>=document.documentMode,Lt=null,cs=null,Sn=null,ds=!1;function oi(e,t,n){var r=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;ds||Lt==null||Lt!==br(r)||(r=Lt,"selectionStart"in r&&ro(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),Sn&&Rn(Sn,r)||(Sn=r,r=Tr(cs,"onSelect"),0<r.length&&(t=new eo("onSelect","select",null,t,n),e.push({event:t,listeners:r}),t.target=Lt)))}function ir(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n["Webkit"+e]="webkit"+t,n["Moz"+e]="moz"+t,n}var Tt={animationend:ir("Animation","AnimationEnd"),animationiteration:ir("Animation","AnimationIteration"),animationstart:ir("Animation","AnimationStart"),transitionend:ir("Transition","TransitionEnd")},bl={},Va={};Ve&&(Va=document.createElement("div").style,"AnimationEvent"in window||(delete Tt.animationend.animation,delete Tt.animationiteration.animation,delete Tt.animationstart.animation),"TransitionEvent"in window||delete Tt.transitionend.transition);function nl(e){if(bl[e])return bl[e];if(!Tt[e])return e;var t=Tt[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in Va)return bl[e]=t[n];return e}var $a=nl("animationend"),Wa=nl("animationiteration"),Ha=nl("animationstart"),Ga=nl("transitionend"),Ka=new Map,ii="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function dt(e,t){Ka.set(e,t),bt(t,[e])}for(var zl=0;zl<ii.length;zl++){var Dl=ii[zl],Id=Dl.toLowerCase(),Md=Dl[0].toUpperCase()+Dl.slice(1);dt(Id,"on"+Md)}dt($a,"onAnimationEnd");dt(Wa,"onAnimationIteration");dt(Ha,"onAnimationStart");dt("dblclick","onDoubleClick");dt("focusin","onFocus");dt("focusout","onBlur");dt(Ga,"onTransitionEnd");Yt("onMouseEnter",["mouseout","mouseover"]);Yt("onMouseLeave",["mouseout","mouseover"]);Yt("onPointerEnter",["pointerout","pointerover"]);Yt("onPointerLeave",["pointerout","pointerover"]);bt("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));bt("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));bt("onBeforeInput",["compositionend","keypress","textInput","paste"]);bt("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));bt("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));bt("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var yn="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Ud=new Set("cancel close invalid load scroll toggle".split(" ").concat(yn));function ai(e,t,n){var r=e.type||"unknown-event";e.currentTarget=n,Ic(r,t,void 0,e),e.currentTarget=null}function Ya(e,t){t=(t&4)!==0;for(var n=0;n<e.length;n++){var r=e[n],l=r.event;r=r.listeners;e:{var s=void 0;if(t)for(var o=r.length-1;0<=o;o--){var i=r[o],a=i.instance,c=i.currentTarget;if(i=i.listener,a!==s&&l.isPropagationStopped())break e;ai(l,i,c),s=a}else for(o=0;o<r.length;o++){if(i=r[o],a=i.instance,c=i.currentTarget,i=i.listener,a!==s&&l.isPropagationStopped())break e;ai(l,i,c),s=a}}}if(Dr)throw e=os,Dr=!1,os=null,e}function L(e,t){var n=t[vs];n===void 0&&(n=t[vs]=new Set);var r=e+"__bubble";n.has(r)||(Xa(t,e,2,!1),n.add(r))}function Bl(e,t,n){var r=0;t&&(r|=4),Xa(n,e,r,t)}var ar="_reactListening"+Math.random().toString(36).slice(2);function On(e){if(!e[ar]){e[ar]=!0,ra.forEach(function(n){n!=="selectionchange"&&(Ud.has(n)||Bl(n,!1,e),Bl(n,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[ar]||(t[ar]=!0,Bl("selectionchange",!1,t))}}function Xa(e,t,n,r){switch(Aa(t)){case 1:var l=td;break;case 4:l=nd;break;default:l=qs}n=l.bind(null,t,n,e),l=void 0,!ss||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(l=!0),r?l!==void 0?e.addEventListener(t,n,{capture:!0,passive:l}):e.addEventListener(t,n,!0):l!==void 0?e.addEventListener(t,n,{passive:l}):e.addEventListener(t,n,!1)}function Nl(e,t,n,r,l){var s=r;if(!(t&1)&&!(t&2)&&r!==null)e:for(;;){if(r===null)return;var o=r.tag;if(o===3||o===4){var i=r.stateNode.containerInfo;if(i===l||i.nodeType===8&&i.parentNode===l)break;if(o===4)for(o=r.return;o!==null;){var a=o.tag;if((a===3||a===4)&&(a=o.stateNode.containerInfo,a===l||a.nodeType===8&&a.parentNode===l))return;o=o.return}for(;i!==null;){if(o=gt(i),o===null)return;if(a=o.tag,a===5||a===6){r=s=o;continue e}i=i.parentNode}}r=r.return}ya(function(){var c=s,x=Ks(n),m=[];e:{var p=Ka.get(e);if(p!==void 0){var g=eo,y=e;switch(e){case"keypress":if(Cr(n)===0)break e;case"keydown":case"keyup":g=hd;break;case"focusin":y="focus",g=Fl;break;case"focusout":y="blur",g=Fl;break;case"beforeblur":case"afterblur":g=Fl;break;case"click":if(n.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":g=Xo;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":g=sd;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":g=Cd;break;case $a:case Wa:case Ha:g=ad;break;case Ga:g=Ed;break;case"scroll":g=rd;break;case"wheel":g=Sd;break;case"copy":case"cut":case"paste":g=cd;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":g=qo}var C=(t&4)!==0,R=!C&&e==="scroll",d=C?p!==null?p+"Capture":null:p;C=[];for(var u=c,f;u!==null;){f=u;var v=f.stateNode;if(f.tag===5&&v!==null&&(f=v,d!==null&&(v=Bn(u,d),v!=null&&C.push(jn(u,v,f)))),R)break;u=u.return}0<C.length&&(p=new g(p,y,null,n,x),m.push({event:p,listeners:C}))}}if(!(t&7)){e:{if(p=e==="mouseover"||e==="pointerover",g=e==="mouseout"||e==="pointerout",p&&n!==rs&&(y=n.relatedTarget||n.fromElement)&&(gt(y)||y[$e]))break e;if((g||p)&&(p=x.window===x?x:(p=x.ownerDocument)?p.defaultView||p.parentWindow:window,g?(y=n.relatedTarget||n.toElement,g=c,y=y?gt(y):null,y!==null&&(R=zt(y),y!==R||y.tag!==5&&y.tag!==6)&&(y=null)):(g=null,y=c),g!==y)){if(C=Xo,v="onMouseLeave",d="onMouseEnter",u="mouse",(e==="pointerout"||e==="pointerover")&&(C=qo,v="onPointerLeave",d="onPointerEnter",u="pointer"),R=g==null?p:Rt(g),f=y==null?p:Rt(y),p=new C(v,u+"leave",g,n,x),p.target=R,p.relatedTarget=f,v=null,gt(x)===c&&(C=new C(d,u+"enter",y,n,x),C.target=f,C.relatedTarget=R,v=C),R=v,g&&y)t:{for(C=g,d=y,u=0,f=C;f;f=Dt(f))u++;for(f=0,v=d;v;v=Dt(v))f++;for(;0<u-f;)C=Dt(C),u--;for(;0<f-u;)d=Dt(d),f--;for(;u--;){if(C===d||d!==null&&C===d.alternate)break t;C=Dt(C),d=Dt(d)}C=null}else C=null;g!==null&&ui(m,p,g,C,!1),y!==null&&R!==null&&ui(m,R,y,C,!0)}}e:{if(p=c?Rt(c):window,g=p.nodeName&&p.nodeName.toLowerCase(),g==="select"||g==="input"&&p.type==="file")var E=Bd;else if(ti(p))if(Ia)E=Td;else{E=Ad;var S=Nd}else(g=p.nodeName)&&g.toLowerCase()==="input"&&(p.type==="checkbox"||p.type==="radio")&&(E=Ld);if(E&&(E=E(e,c))){ja(m,E,n,x);break e}S&&S(e,p,c),e==="focusout"&&(S=p._wrapperState)&&S.controlled&&p.type==="number"&&ql(p,"number",p.value)}switch(S=c?Rt(c):window,e){case"focusin":(ti(S)||S.contentEditable==="true")&&(Lt=S,cs=c,Sn=null);break;case"focusout":Sn=cs=Lt=null;break;case"mousedown":ds=!0;break;case"contextmenu":case"mouseup":case"dragend":ds=!1,oi(m,n,x);break;case"selectionchange":if(jd)break;case"keydown":case"keyup":oi(m,n,x)}var F;if(no)e:{switch(e){case"compositionstart":var _="onCompositionStart";break e;case"compositionend":_="onCompositionEnd";break e;case"compositionupdate":_="onCompositionUpdate";break e}_=void 0}else At?Ra(e,n)&&(_="onCompositionEnd"):e==="keydown"&&n.keyCode===229&&(_="onCompositionStart");_&&(Ta&&n.locale!=="ko"&&(At||_!=="onCompositionStart"?_==="onCompositionEnd"&&At&&(F=La()):(Je=x,Js="value"in Je?Je.value:Je.textContent,At=!0)),S=Tr(c,_),0<S.length&&(_=new Zo(_,e,null,n,x),m.push({event:_,listeners:S}),F?_.data=F:(F=Oa(n),F!==null&&(_.data=F)))),(F=_d?Pd(e,n):bd(e,n))&&(c=Tr(c,"onBeforeInput"),0<c.length&&(x=new Zo("onBeforeInput","beforeinput",null,n,x),m.push({event:x,listeners:c}),x.data=F))}Ya(m,t)})}function jn(e,t,n){return{instance:e,listener:t,currentTarget:n}}function Tr(e,t){for(var n=t+"Capture",r=[];e!==null;){var l=e,s=l.stateNode;l.tag===5&&s!==null&&(l=s,s=Bn(e,n),s!=null&&r.unshift(jn(e,s,l)),s=Bn(e,t),s!=null&&r.push(jn(e,s,l))),e=e.return}return r}function Dt(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5);return e||null}function ui(e,t,n,r,l){for(var s=t._reactName,o=[];n!==null&&n!==r;){var i=n,a=i.alternate,c=i.stateNode;if(a!==null&&a===r)break;i.tag===5&&c!==null&&(i=c,l?(a=Bn(n,s),a!=null&&o.unshift(jn(n,a,i))):l||(a=Bn(n,s),a!=null&&o.push(jn(n,a,i)))),n=n.return}o.length!==0&&e.push({event:t,listeners:o})}var Qd=/\r\n?/g,Vd=/\u0000|\uFFFD/g;function ci(e){return(typeof e=="string"?e:""+e).replace(Qd,`
`).replace(Vd,"")}function ur(e,t,n){if(t=ci(t),ci(e)!==t&&n)throw Error(h(425))}function Rr(){}var fs=null,ps=null;function ms(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var xs=typeof setTimeout=="function"?setTimeout:void 0,$d=typeof clearTimeout=="function"?clearTimeout:void 0,di=typeof Promise=="function"?Promise:void 0,Wd=typeof queueMicrotask=="function"?queueMicrotask:typeof di<"u"?function(e){return di.resolve(null).then(e).catch(Hd)}:xs;function Hd(e){setTimeout(function(){throw e})}function Al(e,t){var n=t,r=0;do{var l=n.nextSibling;if(e.removeChild(n),l&&l.nodeType===8)if(n=l.data,n==="/$"){if(r===0){e.removeChild(l),Ln(t);return}r--}else n!=="$"&&n!=="$?"&&n!=="$!"||r++;n=l}while(n);Ln(t)}function lt(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?")break;if(t==="/$")return null}}return e}function fi(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="$"||n==="$!"||n==="$?"){if(t===0)return e;t--}else n==="/$"&&t++}e=e.previousSibling}return null}var ln=Math.random().toString(36).slice(2),Te="__reactFiber$"+ln,In="__reactProps$"+ln,$e="__reactContainer$"+ln,vs="__reactEvents$"+ln,Gd="__reactListeners$"+ln,Kd="__reactHandles$"+ln;function gt(e){var t=e[Te];if(t)return t;for(var n=e.parentNode;n;){if(t=n[$e]||n[Te]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=fi(e);e!==null;){if(n=e[Te])return n;e=fi(e)}return t}e=n,n=e.parentNode}return null}function Yn(e){return e=e[Te]||e[$e],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}function Rt(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(h(33))}function rl(e){return e[In]||null}var hs=[],Ot=-1;function ft(e){return{current:e}}function T(e){0>Ot||(e.current=hs[Ot],hs[Ot]=null,Ot--)}function A(e,t){Ot++,hs[Ot]=e.current,e.current=t}var ct={},re=ft(ct),ce=ft(!1),kt=ct;function Xt(e,t){var n=e.type.contextTypes;if(!n)return ct;var r=e.stateNode;if(r&&r.__reactInternalMemoizedUnmaskedChildContext===t)return r.__reactInternalMemoizedMaskedChildContext;var l={},s;for(s in n)l[s]=t[s];return r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=t,e.__reactInternalMemoizedMaskedChildContext=l),l}function de(e){return e=e.childContextTypes,e!=null}function Or(){T(ce),T(re)}function pi(e,t,n){if(re.current!==ct)throw Error(h(168));A(re,t),A(ce,n)}function Za(e,t,n){var r=e.stateNode;if(t=t.childContextTypes,typeof r.getChildContext!="function")return n;r=r.getChildContext();for(var l in r)if(!(l in t))throw Error(h(108,Nc(e)||"Unknown",l));return M({},n,r)}function jr(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||ct,kt=re.current,A(re,e),A(ce,ce.current),!0}function mi(e,t,n){var r=e.stateNode;if(!r)throw Error(h(169));n?(e=Za(e,t,kt),r.__reactInternalMemoizedMergedChildContext=e,T(ce),T(re),A(re,e)):T(ce),A(ce,n)}var Ie=null,ll=!1,Ll=!1;function qa(e){Ie===null?Ie=[e]:Ie.push(e)}function Yd(e){ll=!0,qa(e)}function pt(){if(!Ll&&Ie!==null){Ll=!0;var e=0,t=N;try{var n=Ie;for(N=1;e<n.length;e++){var r=n[e];do r=r(!0);while(r!==null)}Ie=null,ll=!1}catch(l){throw Ie!==null&&(Ie=Ie.slice(e+1)),ka(Ys,pt),l}finally{N=t,Ll=!1}}return null}var jt=[],It=0,Ir=null,Mr=0,ye=[],Ce=0,St=null,Me=1,Ue="";function vt(e,t){jt[It++]=Mr,jt[It++]=Ir,Ir=e,Mr=t}function Ja(e,t,n){ye[Ce++]=Me,ye[Ce++]=Ue,ye[Ce++]=St,St=e;var r=Me;e=Ue;var l=32-De(r)-1;r&=~(1<<l),n+=1;var s=32-De(t)+l;if(30<s){var o=l-l%5;s=(r&(1<<o)-1).toString(32),r>>=o,l-=o,Me=1<<32-De(t)+l|n<<l|r,Ue=s+e}else Me=1<<s|n<<l|r,Ue=e}function lo(e){e.return!==null&&(vt(e,1),Ja(e,1,0))}function so(e){for(;e===Ir;)Ir=jt[--It],jt[It]=null,Mr=jt[--It],jt[It]=null;for(;e===St;)St=ye[--Ce],ye[Ce]=null,Ue=ye[--Ce],ye[Ce]=null,Me=ye[--Ce],ye[Ce]=null}var xe=null,me=null,O=!1,ze=null;function eu(e,t){var n=we(5,null,null,0);n.elementType="DELETED",n.stateNode=t,n.return=e,t=e.deletions,t===null?(e.deletions=[n],e.flags|=16):t.push(n)}function xi(e,t){switch(e.tag){case 5:var n=e.type;return t=t.nodeType!==1||n.toLowerCase()!==t.nodeName.toLowerCase()?null:t,t!==null?(e.stateNode=t,xe=e,me=lt(t.firstChild),!0):!1;case 6:return t=e.pendingProps===""||t.nodeType!==3?null:t,t!==null?(e.stateNode=t,xe=e,me=null,!0):!1;case 13:return t=t.nodeType!==8?null:t,t!==null?(n=St!==null?{id:Me,overflow:Ue}:null,e.memoizedState={dehydrated:t,treeContext:n,retryLane:1073741824},n=we(18,null,null,0),n.stateNode=t,n.return=e,e.child=n,xe=e,me=null,!0):!1;default:return!1}}function gs(e){return(e.mode&1)!==0&&(e.flags&128)===0}function ys(e){if(O){var t=me;if(t){var n=t;if(!xi(e,t)){if(gs(e))throw Error(h(418));t=lt(n.nextSibling);var r=xe;t&&xi(e,t)?eu(r,n):(e.flags=e.flags&-4097|2,O=!1,xe=e)}}else{if(gs(e))throw Error(h(418));e.flags=e.flags&-4097|2,O=!1,xe=e}}}function vi(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;xe=e}function cr(e){if(e!==xe)return!1;if(!O)return vi(e),O=!0,!1;var t;if((t=e.tag!==3)&&!(t=e.tag!==5)&&(t=e.type,t=t!=="head"&&t!=="body"&&!ms(e.type,e.memoizedProps)),t&&(t=me)){if(gs(e))throw tu(),Error(h(418));for(;t;)eu(e,t),t=lt(t.nextSibling)}if(vi(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(h(317));e:{for(e=e.nextSibling,t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="/$"){if(t===0){me=lt(e.nextSibling);break e}t--}else n!=="$"&&n!=="$!"&&n!=="$?"||t++}e=e.nextSibling}me=null}}else me=xe?lt(e.stateNode.nextSibling):null;return!0}function tu(){for(var e=me;e;)e=lt(e.nextSibling)}function Zt(){me=xe=null,O=!1}function oo(e){ze===null?ze=[e]:ze.push(e)}var Xd=Ge.ReactCurrentBatchConfig;function pn(e,t,n){if(e=n.ref,e!==null&&typeof e!="function"&&typeof e!="object"){if(n._owner){if(n=n._owner,n){if(n.tag!==1)throw Error(h(309));var r=n.stateNode}if(!r)throw Error(h(147,e));var l=r,s=""+e;return t!==null&&t.ref!==null&&typeof t.ref=="function"&&t.ref._stringRef===s?t.ref:(t=function(o){var i=l.refs;o===null?delete i[s]:i[s]=o},t._stringRef=s,t)}if(typeof e!="string")throw Error(h(284));if(!n._owner)throw Error(h(290,e))}return e}function dr(e,t){throw e=Object.prototype.toString.call(t),Error(h(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e))}function hi(e){var t=e._init;return t(e._payload)}function nu(e){function t(d,u){if(e){var f=d.deletions;f===null?(d.deletions=[u],d.flags|=16):f.push(u)}}function n(d,u){if(!e)return null;for(;u!==null;)t(d,u),u=u.sibling;return null}function r(d,u){for(d=new Map;u!==null;)u.key!==null?d.set(u.key,u):d.set(u.index,u),u=u.sibling;return d}function l(d,u){return d=at(d,u),d.index=0,d.sibling=null,d}function s(d,u,f){return d.index=f,e?(f=d.alternate,f!==null?(f=f.index,f<u?(d.flags|=2,u):f):(d.flags|=2,u)):(d.flags|=1048576,u)}function o(d){return e&&d.alternate===null&&(d.flags|=2),d}function i(d,u,f,v){return u===null||u.tag!==6?(u=Ul(f,d.mode,v),u.return=d,u):(u=l(u,f),u.return=d,u)}function a(d,u,f,v){var E=f.type;return E===Nt?x(d,u,f.props.children,v,f.key):u!==null&&(u.elementType===E||typeof E=="object"&&E!==null&&E.$$typeof===Ye&&hi(E)===u.type)?(v=l(u,f.props),v.ref=pn(d,u,f),v.return=d,v):(v=Pr(f.type,f.key,f.props,null,d.mode,v),v.ref=pn(d,u,f),v.return=d,v)}function c(d,u,f,v){return u===null||u.tag!==4||u.stateNode.containerInfo!==f.containerInfo||u.stateNode.implementation!==f.implementation?(u=Ql(f,d.mode,v),u.return=d,u):(u=l(u,f.children||[]),u.return=d,u)}function x(d,u,f,v,E){return u===null||u.tag!==7?(u=Et(f,d.mode,v,E),u.return=d,u):(u=l(u,f),u.return=d,u)}function m(d,u,f){if(typeof u=="string"&&u!==""||typeof u=="number")return u=Ul(""+u,d.mode,f),u.return=d,u;if(typeof u=="object"&&u!==null){switch(u.$$typeof){case er:return f=Pr(u.type,u.key,u.props,null,d.mode,f),f.ref=pn(d,null,u),f.return=d,f;case Bt:return u=Ql(u,d.mode,f),u.return=d,u;case Ye:var v=u._init;return m(d,v(u._payload),f)}if(hn(u)||an(u))return u=Et(u,d.mode,f,null),u.return=d,u;dr(d,u)}return null}function p(d,u,f,v){var E=u!==null?u.key:null;if(typeof f=="string"&&f!==""||typeof f=="number")return E!==null?null:i(d,u,""+f,v);if(typeof f=="object"&&f!==null){switch(f.$$typeof){case er:return f.key===E?a(d,u,f,v):null;case Bt:return f.key===E?c(d,u,f,v):null;case Ye:return E=f._init,p(d,u,E(f._payload),v)}if(hn(f)||an(f))return E!==null?null:x(d,u,f,v,null);dr(d,f)}return null}function g(d,u,f,v,E){if(typeof v=="string"&&v!==""||typeof v=="number")return d=d.get(f)||null,i(u,d,""+v,E);if(typeof v=="object"&&v!==null){switch(v.$$typeof){case er:return d=d.get(v.key===null?f:v.key)||null,a(u,d,v,E);case Bt:return d=d.get(v.key===null?f:v.key)||null,c(u,d,v,E);case Ye:var S=v._init;return g(d,u,f,S(v._payload),E)}if(hn(v)||an(v))return d=d.get(f)||null,x(u,d,v,E,null);dr(u,v)}return null}function y(d,u,f,v){for(var E=null,S=null,F=u,_=u=0,Q=null;F!==null&&_<f.length;_++){F.index>_?(Q=F,F=null):Q=F.sibling;var D=p(d,F,f[_],v);if(D===null){F===null&&(F=Q);break}e&&F&&D.alternate===null&&t(d,F),u=s(D,u,_),S===null?E=D:S.sibling=D,S=D,F=Q}if(_===f.length)return n(d,F),O&&vt(d,_),E;if(F===null){for(;_<f.length;_++)F=m(d,f[_],v),F!==null&&(u=s(F,u,_),S===null?E=F:S.sibling=F,S=F);return O&&vt(d,_),E}for(F=r(d,F);_<f.length;_++)Q=g(F,d,_,f[_],v),Q!==null&&(e&&Q.alternate!==null&&F.delete(Q.key===null?_:Q.key),u=s(Q,u,_),S===null?E=Q:S.sibling=Q,S=Q);return e&&F.forEach(function(Fe){return t(d,Fe)}),O&&vt(d,_),E}function C(d,u,f,v){var E=an(f);if(typeof E!="function")throw Error(h(150));if(f=E.call(f),f==null)throw Error(h(151));for(var S=E=null,F=u,_=u=0,Q=null,D=f.next();F!==null&&!D.done;_++,D=f.next()){F.index>_?(Q=F,F=null):Q=F.sibling;var Fe=p(d,F,D.value,v);if(Fe===null){F===null&&(F=Q);break}e&&F&&Fe.alternate===null&&t(d,F),u=s(Fe,u,_),S===null?E=Fe:S.sibling=Fe,S=Fe,F=Q}if(D.done)return n(d,F),O&&vt(d,_),E;if(F===null){for(;!D.done;_++,D=f.next())D=m(d,D.value,v),D!==null&&(u=s(D,u,_),S===null?E=D:S.sibling=D,S=D);return O&&vt(d,_),E}for(F=r(d,F);!D.done;_++,D=f.next())D=g(F,d,_,D.value,v),D!==null&&(e&&D.alternate!==null&&F.delete(D.key===null?_:D.key),u=s(D,u,_),S===null?E=D:S.sibling=D,S=D);return e&&F.forEach(function(sn){return t(d,sn)}),O&&vt(d,_),E}function R(d,u,f,v){if(typeof f=="object"&&f!==null&&f.type===Nt&&f.key===null&&(f=f.props.children),typeof f=="object"&&f!==null){switch(f.$$typeof){case er:e:{for(var E=f.key,S=u;S!==null;){if(S.key===E){if(E=f.type,E===Nt){if(S.tag===7){n(d,S.sibling),u=l(S,f.props.children),u.return=d,d=u;break e}}else if(S.elementType===E||typeof E=="object"&&E!==null&&E.$$typeof===Ye&&hi(E)===S.type){n(d,S.sibling),u=l(S,f.props),u.ref=pn(d,S,f),u.return=d,d=u;break e}n(d,S);break}else t(d,S);S=S.sibling}f.type===Nt?(u=Et(f.props.children,d.mode,v,f.key),u.return=d,d=u):(v=Pr(f.type,f.key,f.props,null,d.mode,v),v.ref=pn(d,u,f),v.return=d,d=v)}return o(d);case Bt:e:{for(S=f.key;u!==null;){if(u.key===S)if(u.tag===4&&u.stateNode.containerInfo===f.containerInfo&&u.stateNode.implementation===f.implementation){n(d,u.sibling),u=l(u,f.children||[]),u.return=d,d=u;break e}else{n(d,u);break}else t(d,u);u=u.sibling}u=Ql(f,d.mode,v),u.return=d,d=u}return o(d);case Ye:return S=f._init,R(d,u,S(f._payload),v)}if(hn(f))return y(d,u,f,v);if(an(f))return C(d,u,f,v);dr(d,f)}return typeof f=="string"&&f!==""||typeof f=="number"?(f=""+f,u!==null&&u.tag===6?(n(d,u.sibling),u=l(u,f),u.return=d,d=u):(n(d,u),u=Ul(f,d.mode,v),u.return=d,d=u),o(d)):n(d,u)}return R}var qt=nu(!0),ru=nu(!1),Ur=ft(null),Qr=null,Mt=null,io=null;function ao(){io=Mt=Qr=null}function uo(e){var t=Ur.current;T(Ur),e._currentValue=t}function Cs(e,t,n){for(;e!==null;){var r=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,r!==null&&(r.childLanes|=t)):r!==null&&(r.childLanes&t)!==t&&(r.childLanes|=t),e===n)break;e=e.return}}function Gt(e,t){Qr=e,io=Mt=null,e=e.dependencies,e!==null&&e.firstContext!==null&&(e.lanes&t&&(ue=!0),e.firstContext=null)}function ke(e){var t=e._currentValue;if(io!==e)if(e={context:e,memoizedValue:t,next:null},Mt===null){if(Qr===null)throw Error(h(308));Mt=e,Qr.dependencies={lanes:0,firstContext:e}}else Mt=Mt.next=e;return t}var yt=null;function co(e){yt===null?yt=[e]:yt.push(e)}function lu(e,t,n,r){var l=t.interleaved;return l===null?(n.next=n,co(t)):(n.next=l.next,l.next=n),t.interleaved=n,We(e,r)}function We(e,t){e.lanes|=t;var n=e.alternate;for(n!==null&&(n.lanes|=t),n=e,e=e.return;e!==null;)e.childLanes|=t,n=e.alternate,n!==null&&(n.childLanes|=t),n=e,e=e.return;return n.tag===3?n.stateNode:null}var Xe=!1;function fo(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function su(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,effects:e.effects})}function Qe(e,t){return{eventTime:e,lane:t,tag:0,payload:null,callback:null,next:null}}function st(e,t,n){var r=e.updateQueue;if(r===null)return null;if(r=r.shared,B&2){var l=r.pending;return l===null?t.next=t:(t.next=l.next,l.next=t),r.pending=t,We(e,n)}return l=r.interleaved,l===null?(t.next=t,co(r)):(t.next=l.next,l.next=t),r.interleaved=t,We(e,n)}function wr(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,(n&4194240)!==0)){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,Xs(e,n)}}function gi(e,t){var n=e.updateQueue,r=e.alternate;if(r!==null&&(r=r.updateQueue,n===r)){var l=null,s=null;if(n=n.firstBaseUpdate,n!==null){do{var o={eventTime:n.eventTime,lane:n.lane,tag:n.tag,payload:n.payload,callback:n.callback,next:null};s===null?l=s=o:s=s.next=o,n=n.next}while(n!==null);s===null?l=s=t:s=s.next=t}else l=s=t;n={baseState:r.baseState,firstBaseUpdate:l,lastBaseUpdate:s,shared:r.shared,effects:r.effects},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}function Vr(e,t,n,r){var l=e.updateQueue;Xe=!1;var s=l.firstBaseUpdate,o=l.lastBaseUpdate,i=l.shared.pending;if(i!==null){l.shared.pending=null;var a=i,c=a.next;a.next=null,o===null?s=c:o.next=c,o=a;var x=e.alternate;x!==null&&(x=x.updateQueue,i=x.lastBaseUpdate,i!==o&&(i===null?x.firstBaseUpdate=c:i.next=c,x.lastBaseUpdate=a))}if(s!==null){var m=l.baseState;o=0,x=c=a=null,i=s;do{var p=i.lane,g=i.eventTime;if((r&p)===p){x!==null&&(x=x.next={eventTime:g,lane:0,tag:i.tag,payload:i.payload,callback:i.callback,next:null});e:{var y=e,C=i;switch(p=t,g=n,C.tag){case 1:if(y=C.payload,typeof y=="function"){m=y.call(g,m,p);break e}m=y;break e;case 3:y.flags=y.flags&-65537|128;case 0:if(y=C.payload,p=typeof y=="function"?y.call(g,m,p):y,p==null)break e;m=M({},m,p);break e;case 2:Xe=!0}}i.callback!==null&&i.lane!==0&&(e.flags|=64,p=l.effects,p===null?l.effects=[i]:p.push(i))}else g={eventTime:g,lane:p,tag:i.tag,payload:i.payload,callback:i.callback,next:null},x===null?(c=x=g,a=m):x=x.next=g,o|=p;if(i=i.next,i===null){if(i=l.shared.pending,i===null)break;p=i,i=p.next,p.next=null,l.lastBaseUpdate=p,l.shared.pending=null}}while(!0);if(x===null&&(a=m),l.baseState=a,l.firstBaseUpdate=c,l.lastBaseUpdate=x,t=l.shared.interleaved,t!==null){l=t;do o|=l.lane,l=l.next;while(l!==t)}else s===null&&(l.shared.lanes=0);_t|=o,e.lanes=o,e.memoizedState=m}}function yi(e,t,n){if(e=t.effects,t.effects=null,e!==null)for(t=0;t<e.length;t++){var r=e[t],l=r.callback;if(l!==null){if(r.callback=null,r=n,typeof l!="function")throw Error(h(191,l));l.call(r)}}}var Xn={},Oe=ft(Xn),Mn=ft(Xn),Un=ft(Xn);function Ct(e){if(e===Xn)throw Error(h(174));return e}function po(e,t){switch(A(Un,t),A(Mn,e),A(Oe,Xn),e=t.nodeType,e){case 9:case 11:t=(t=t.documentElement)?t.namespaceURI:es(null,"");break;default:e=e===8?t.parentNode:t,t=e.namespaceURI||null,e=e.tagName,t=es(t,e)}T(Oe),A(Oe,t)}function Jt(){T(Oe),T(Mn),T(Un)}function ou(e){Ct(Un.current);var t=Ct(Oe.current),n=es(t,e.type);t!==n&&(A(Mn,e),A(Oe,n))}function mo(e){Mn.current===e&&(T(Oe),T(Mn))}var j=ft(0);function $r(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||n.data==="$?"||n.data==="$!"))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==void 0){if(t.flags&128)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var Tl=[];function xo(){for(var e=0;e<Tl.length;e++)Tl[e]._workInProgressVersionPrimary=null;Tl.length=0}var Er=Ge.ReactCurrentDispatcher,Rl=Ge.ReactCurrentBatchConfig,Ft=0,I=null,H=null,Y=null,Wr=!1,Fn=!1,Qn=0,Zd=0;function ee(){throw Error(h(321))}function vo(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!Ne(e[n],t[n]))return!1;return!0}function ho(e,t,n,r,l,s){if(Ft=s,I=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,Er.current=e===null||e.memoizedState===null?tf:nf,e=n(r,l),Fn){s=0;do{if(Fn=!1,Qn=0,25<=s)throw Error(h(301));s+=1,Y=H=null,t.updateQueue=null,Er.current=rf,e=n(r,l)}while(Fn)}if(Er.current=Hr,t=H!==null&&H.next!==null,Ft=0,Y=H=I=null,Wr=!1,t)throw Error(h(300));return e}function go(){var e=Qn!==0;return Qn=0,e}function Le(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Y===null?I.memoizedState=Y=e:Y=Y.next=e,Y}function Se(){if(H===null){var e=I.alternate;e=e!==null?e.memoizedState:null}else e=H.next;var t=Y===null?I.memoizedState:Y.next;if(t!==null)Y=t,H=e;else{if(e===null)throw Error(h(310));H=e,e={memoizedState:H.memoizedState,baseState:H.baseState,baseQueue:H.baseQueue,queue:H.queue,next:null},Y===null?I.memoizedState=Y=e:Y=Y.next=e}return Y}function Vn(e,t){return typeof t=="function"?t(e):t}function Ol(e){var t=Se(),n=t.queue;if(n===null)throw Error(h(311));n.lastRenderedReducer=e;var r=H,l=r.baseQueue,s=n.pending;if(s!==null){if(l!==null){var o=l.next;l.next=s.next,s.next=o}r.baseQueue=l=s,n.pending=null}if(l!==null){s=l.next,r=r.baseState;var i=o=null,a=null,c=s;do{var x=c.lane;if((Ft&x)===x)a!==null&&(a=a.next={lane:0,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null}),r=c.hasEagerState?c.eagerState:e(r,c.action);else{var m={lane:x,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null};a===null?(i=a=m,o=r):a=a.next=m,I.lanes|=x,_t|=x}c=c.next}while(c!==null&&c!==s);a===null?o=r:a.next=i,Ne(r,t.memoizedState)||(ue=!0),t.memoizedState=r,t.baseState=o,t.baseQueue=a,n.lastRenderedState=r}if(e=n.interleaved,e!==null){l=e;do s=l.lane,I.lanes|=s,_t|=s,l=l.next;while(l!==e)}else l===null&&(n.lanes=0);return[t.memoizedState,n.dispatch]}function jl(e){var t=Se(),n=t.queue;if(n===null)throw Error(h(311));n.lastRenderedReducer=e;var r=n.dispatch,l=n.pending,s=t.memoizedState;if(l!==null){n.pending=null;var o=l=l.next;do s=e(s,o.action),o=o.next;while(o!==l);Ne(s,t.memoizedState)||(ue=!0),t.memoizedState=s,t.baseQueue===null&&(t.baseState=s),n.lastRenderedState=s}return[s,r]}function iu(){}function au(e,t){var n=I,r=Se(),l=t(),s=!Ne(r.memoizedState,l);if(s&&(r.memoizedState=l,ue=!0),r=r.queue,yo(du.bind(null,n,r,e),[e]),r.getSnapshot!==t||s||Y!==null&&Y.memoizedState.tag&1){if(n.flags|=2048,$n(9,cu.bind(null,n,r,l,t),void 0,null),X===null)throw Error(h(349));Ft&30||uu(n,t,l)}return l}function uu(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=I.updateQueue,t===null?(t={lastEffect:null,stores:null},I.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function cu(e,t,n,r){t.value=n,t.getSnapshot=r,fu(t)&&pu(e)}function du(e,t,n){return n(function(){fu(t)&&pu(e)})}function fu(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!Ne(e,n)}catch{return!0}}function pu(e){var t=We(e,1);t!==null&&Be(t,e,1,-1)}function Ci(e){var t=Le();return typeof e=="function"&&(e=e()),t.memoizedState=t.baseState=e,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Vn,lastRenderedState:e},t.queue=e,e=e.dispatch=ef.bind(null,I,e),[t.memoizedState,e]}function $n(e,t,n,r){return e={tag:e,create:t,destroy:n,deps:r,next:null},t=I.updateQueue,t===null?(t={lastEffect:null,stores:null},I.updateQueue=t,t.lastEffect=e.next=e):(n=t.lastEffect,n===null?t.lastEffect=e.next=e:(r=n.next,n.next=e,e.next=r,t.lastEffect=e)),e}function mu(){return Se().memoizedState}function kr(e,t,n,r){var l=Le();I.flags|=e,l.memoizedState=$n(1|t,n,void 0,r===void 0?null:r)}function sl(e,t,n,r){var l=Se();r=r===void 0?null:r;var s=void 0;if(H!==null){var o=H.memoizedState;if(s=o.destroy,r!==null&&vo(r,o.deps)){l.memoizedState=$n(t,n,s,r);return}}I.flags|=e,l.memoizedState=$n(1|t,n,s,r)}function wi(e,t){return kr(8390656,8,e,t)}function yo(e,t){return sl(2048,8,e,t)}function xu(e,t){return sl(4,2,e,t)}function vu(e,t){return sl(4,4,e,t)}function hu(e,t){if(typeof t=="function")return e=e(),t(e),function(){t(null)};if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function gu(e,t,n){return n=n!=null?n.concat([e]):null,sl(4,4,hu.bind(null,t,e),n)}function Co(){}function yu(e,t){var n=Se();t=t===void 0?null:t;var r=n.memoizedState;return r!==null&&t!==null&&vo(t,r[1])?r[0]:(n.memoizedState=[e,t],e)}function Cu(e,t){var n=Se();t=t===void 0?null:t;var r=n.memoizedState;return r!==null&&t!==null&&vo(t,r[1])?r[0]:(e=e(),n.memoizedState=[e,t],e)}function wu(e,t,n){return Ft&21?(Ne(n,t)||(n=_a(),I.lanes|=n,_t|=n,e.baseState=!0),t):(e.baseState&&(e.baseState=!1,ue=!0),e.memoizedState=n)}function qd(e,t){var n=N;N=n!==0&&4>n?n:4,e(!0);var r=Rl.transition;Rl.transition={};try{e(!1),t()}finally{N=n,Rl.transition=r}}function Eu(){return Se().memoizedState}function Jd(e,t,n){var r=it(e);if(n={lane:r,action:n,hasEagerState:!1,eagerState:null,next:null},ku(e))Su(t,n);else if(n=lu(e,t,n,r),n!==null){var l=se();Be(n,e,r,l),Fu(n,t,r)}}function ef(e,t,n){var r=it(e),l={lane:r,action:n,hasEagerState:!1,eagerState:null,next:null};if(ku(e))Su(t,l);else{var s=e.alternate;if(e.lanes===0&&(s===null||s.lanes===0)&&(s=t.lastRenderedReducer,s!==null))try{var o=t.lastRenderedState,i=s(o,n);if(l.hasEagerState=!0,l.eagerState=i,Ne(i,o)){var a=t.interleaved;a===null?(l.next=l,co(t)):(l.next=a.next,a.next=l),t.interleaved=l;return}}catch{}finally{}n=lu(e,t,l,r),n!==null&&(l=se(),Be(n,e,r,l),Fu(n,t,r))}}function ku(e){var t=e.alternate;return e===I||t!==null&&t===I}function Su(e,t){Fn=Wr=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function Fu(e,t,n){if(n&4194240){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,Xs(e,n)}}var Hr={readContext:ke,useCallback:ee,useContext:ee,useEffect:ee,useImperativeHandle:ee,useInsertionEffect:ee,useLayoutEffect:ee,useMemo:ee,useReducer:ee,useRef:ee,useState:ee,useDebugValue:ee,useDeferredValue:ee,useTransition:ee,useMutableSource:ee,useSyncExternalStore:ee,useId:ee,unstable_isNewReconciler:!1},tf={readContext:ke,useCallback:function(e,t){return Le().memoizedState=[e,t===void 0?null:t],e},useContext:ke,useEffect:wi,useImperativeHandle:function(e,t,n){return n=n!=null?n.concat([e]):null,kr(4194308,4,hu.bind(null,t,e),n)},useLayoutEffect:function(e,t){return kr(4194308,4,e,t)},useInsertionEffect:function(e,t){return kr(4,2,e,t)},useMemo:function(e,t){var n=Le();return t=t===void 0?null:t,e=e(),n.memoizedState=[e,t],e},useReducer:function(e,t,n){var r=Le();return t=n!==void 0?n(t):t,r.memoizedState=r.baseState=t,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:t},r.queue=e,e=e.dispatch=Jd.bind(null,I,e),[r.memoizedState,e]},useRef:function(e){var t=Le();return e={current:e},t.memoizedState=e},useState:Ci,useDebugValue:Co,useDeferredValue:function(e){return Le().memoizedState=e},useTransition:function(){var e=Ci(!1),t=e[0];return e=qd.bind(null,e[1]),Le().memoizedState=e,[t,e]},useMutableSource:function(){},useSyncExternalStore:function(e,t,n){var r=I,l=Le();if(O){if(n===void 0)throw Error(h(407));n=n()}else{if(n=t(),X===null)throw Error(h(349));Ft&30||uu(r,t,n)}l.memoizedState=n;var s={value:n,getSnapshot:t};return l.queue=s,wi(du.bind(null,r,s,e),[e]),r.flags|=2048,$n(9,cu.bind(null,r,s,n,t),void 0,null),n},useId:function(){var e=Le(),t=X.identifierPrefix;if(O){var n=Ue,r=Me;n=(r&~(1<<32-De(r)-1)).toString(32)+n,t=":"+t+"R"+n,n=Qn++,0<n&&(t+="H"+n.toString(32)),t+=":"}else n=Zd++,t=":"+t+"r"+n.toString(32)+":";return e.memoizedState=t},unstable_isNewReconciler:!1},nf={readContext:ke,useCallback:yu,useContext:ke,useEffect:yo,useImperativeHandle:gu,useInsertionEffect:xu,useLayoutEffect:vu,useMemo:Cu,useReducer:Ol,useRef:mu,useState:function(){return Ol(Vn)},useDebugValue:Co,useDeferredValue:function(e){var t=Se();return wu(t,H.memoizedState,e)},useTransition:function(){var e=Ol(Vn)[0],t=Se().memoizedState;return[e,t]},useMutableSource:iu,useSyncExternalStore:au,useId:Eu,unstable_isNewReconciler:!1},rf={readContext:ke,useCallback:yu,useContext:ke,useEffect:yo,useImperativeHandle:gu,useInsertionEffect:xu,useLayoutEffect:vu,useMemo:Cu,useReducer:jl,useRef:mu,useState:function(){return jl(Vn)},useDebugValue:Co,useDeferredValue:function(e){var t=Se();return H===null?t.memoizedState=e:wu(t,H.memoizedState,e)},useTransition:function(){var e=jl(Vn)[0],t=Se().memoizedState;return[e,t]},useMutableSource:iu,useSyncExternalStore:au,useId:Eu,unstable_isNewReconciler:!1};function Pe(e,t){if(e&&e.defaultProps){t=M({},t),e=e.defaultProps;for(var n in e)t[n]===void 0&&(t[n]=e[n]);return t}return t}function ws(e,t,n,r){t=e.memoizedState,n=n(r,t),n=n==null?t:M({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var ol={isMounted:function(e){return(e=e._reactInternals)?zt(e)===e:!1},enqueueSetState:function(e,t,n){e=e._reactInternals;var r=se(),l=it(e),s=Qe(r,l);s.payload=t,n!=null&&(s.callback=n),t=st(e,s,l),t!==null&&(Be(t,e,l,r),wr(t,e,l))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var r=se(),l=it(e),s=Qe(r,l);s.tag=1,s.payload=t,n!=null&&(s.callback=n),t=st(e,s,l),t!==null&&(Be(t,e,l,r),wr(t,e,l))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=se(),r=it(e),l=Qe(n,r);l.tag=2,t!=null&&(l.callback=t),t=st(e,l,r),t!==null&&(Be(t,e,r,n),wr(t,e,r))}};function Ei(e,t,n,r,l,s,o){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(r,s,o):t.prototype&&t.prototype.isPureReactComponent?!Rn(n,r)||!Rn(l,s):!0}function _u(e,t,n){var r=!1,l=ct,s=t.contextType;return typeof s=="object"&&s!==null?s=ke(s):(l=de(t)?kt:re.current,r=t.contextTypes,s=(r=r!=null)?Xt(e,l):ct),t=new t(n,s),e.memoizedState=t.state!==null&&t.state!==void 0?t.state:null,t.updater=ol,e.stateNode=t,t._reactInternals=e,r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=l,e.__reactInternalMemoizedMaskedChildContext=s),t}function ki(e,t,n,r){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(n,r),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(n,r),t.state!==e&&ol.enqueueReplaceState(t,t.state,null)}function Es(e,t,n,r){var l=e.stateNode;l.props=n,l.state=e.memoizedState,l.refs={},fo(e);var s=t.contextType;typeof s=="object"&&s!==null?l.context=ke(s):(s=de(t)?kt:re.current,l.context=Xt(e,s)),l.state=e.memoizedState,s=t.getDerivedStateFromProps,typeof s=="function"&&(ws(e,t,s,n),l.state=e.memoizedState),typeof t.getDerivedStateFromProps=="function"||typeof l.getSnapshotBeforeUpdate=="function"||typeof l.UNSAFE_componentWillMount!="function"&&typeof l.componentWillMount!="function"||(t=l.state,typeof l.componentWillMount=="function"&&l.componentWillMount(),typeof l.UNSAFE_componentWillMount=="function"&&l.UNSAFE_componentWillMount(),t!==l.state&&ol.enqueueReplaceState(l,l.state,null),Vr(e,n,l,r),l.state=e.memoizedState),typeof l.componentDidMount=="function"&&(e.flags|=4194308)}function en(e,t){try{var n="",r=t;do n+=Bc(r),r=r.return;while(r);var l=n}catch(s){l=`
Error generating stack: `+s.message+`
`+s.stack}return{value:e,source:t,stack:l,digest:null}}function Il(e,t,n){return{value:e,source:null,stack:n??null,digest:t??null}}function ks(e,t){try{console.error(t.value)}catch(n){setTimeout(function(){throw n})}}var lf=typeof WeakMap=="function"?WeakMap:Map;function Pu(e,t,n){n=Qe(-1,n),n.tag=3,n.payload={element:null};var r=t.value;return n.callback=function(){Kr||(Kr=!0,As=r),ks(e,t)},n}function bu(e,t,n){n=Qe(-1,n),n.tag=3;var r=e.type.getDerivedStateFromError;if(typeof r=="function"){var l=t.value;n.payload=function(){return r(l)},n.callback=function(){ks(e,t)}}var s=e.stateNode;return s!==null&&typeof s.componentDidCatch=="function"&&(n.callback=function(){ks(e,t),typeof r!="function"&&(ot===null?ot=new Set([this]):ot.add(this));var o=t.stack;this.componentDidCatch(t.value,{componentStack:o!==null?o:""})}),n}function Si(e,t,n){var r=e.pingCache;if(r===null){r=e.pingCache=new lf;var l=new Set;r.set(t,l)}else l=r.get(t),l===void 0&&(l=new Set,r.set(t,l));l.has(n)||(l.add(n),e=yf.bind(null,e,t,n),t.then(e,e))}function Fi(e){do{var t;if((t=e.tag===13)&&(t=e.memoizedState,t=t!==null?t.dehydrated!==null:!0),t)return e;e=e.return}while(e!==null);return null}function _i(e,t,n,r,l){return e.mode&1?(e.flags|=65536,e.lanes=l,e):(e===t?e.flags|=65536:(e.flags|=128,n.flags|=131072,n.flags&=-52805,n.tag===1&&(n.alternate===null?n.tag=17:(t=Qe(-1,1),t.tag=2,st(n,t,1))),n.lanes|=1),e)}var sf=Ge.ReactCurrentOwner,ue=!1;function le(e,t,n,r){t.child=e===null?ru(t,null,n,r):qt(t,e.child,n,r)}function Pi(e,t,n,r,l){n=n.render;var s=t.ref;return Gt(t,l),r=ho(e,t,n,r,s,l),n=go(),e!==null&&!ue?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~l,He(e,t,l)):(O&&n&&lo(t),t.flags|=1,le(e,t,r,l),t.child)}function bi(e,t,n,r,l){if(e===null){var s=n.type;return typeof s=="function"&&!bo(s)&&s.defaultProps===void 0&&n.compare===null&&n.defaultProps===void 0?(t.tag=15,t.type=s,zu(e,t,s,r,l)):(e=Pr(n.type,null,r,t,t.mode,l),e.ref=t.ref,e.return=t,t.child=e)}if(s=e.child,!(e.lanes&l)){var o=s.memoizedProps;if(n=n.compare,n=n!==null?n:Rn,n(o,r)&&e.ref===t.ref)return He(e,t,l)}return t.flags|=1,e=at(s,r),e.ref=t.ref,e.return=t,t.child=e}function zu(e,t,n,r,l){if(e!==null){var s=e.memoizedProps;if(Rn(s,r)&&e.ref===t.ref)if(ue=!1,t.pendingProps=r=s,(e.lanes&l)!==0)e.flags&131072&&(ue=!0);else return t.lanes=e.lanes,He(e,t,l)}return Ss(e,t,n,r,l)}function Du(e,t,n){var r=t.pendingProps,l=r.children,s=e!==null?e.memoizedState:null;if(r.mode==="hidden")if(!(t.mode&1))t.memoizedState={baseLanes:0,cachePool:null,transitions:null},A(Qt,pe),pe|=n;else{if(!(n&1073741824))return e=s!==null?s.baseLanes|n:n,t.lanes=t.childLanes=1073741824,t.memoizedState={baseLanes:e,cachePool:null,transitions:null},t.updateQueue=null,A(Qt,pe),pe|=e,null;t.memoizedState={baseLanes:0,cachePool:null,transitions:null},r=s!==null?s.baseLanes:n,A(Qt,pe),pe|=r}else s!==null?(r=s.baseLanes|n,t.memoizedState=null):r=n,A(Qt,pe),pe|=r;return le(e,t,l,n),t.child}function Bu(e,t){var n=t.ref;(e===null&&n!==null||e!==null&&e.ref!==n)&&(t.flags|=512,t.flags|=2097152)}function Ss(e,t,n,r,l){var s=de(n)?kt:re.current;return s=Xt(t,s),Gt(t,l),n=ho(e,t,n,r,s,l),r=go(),e!==null&&!ue?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~l,He(e,t,l)):(O&&r&&lo(t),t.flags|=1,le(e,t,n,l),t.child)}function zi(e,t,n,r,l){if(de(n)){var s=!0;jr(t)}else s=!1;if(Gt(t,l),t.stateNode===null)Sr(e,t),_u(t,n,r),Es(t,n,r,l),r=!0;else if(e===null){var o=t.stateNode,i=t.memoizedProps;o.props=i;var a=o.context,c=n.contextType;typeof c=="object"&&c!==null?c=ke(c):(c=de(n)?kt:re.current,c=Xt(t,c));var x=n.getDerivedStateFromProps,m=typeof x=="function"||typeof o.getSnapshotBeforeUpdate=="function";m||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(i!==r||a!==c)&&ki(t,o,r,c),Xe=!1;var p=t.memoizedState;o.state=p,Vr(t,r,o,l),a=t.memoizedState,i!==r||p!==a||ce.current||Xe?(typeof x=="function"&&(ws(t,n,x,r),a=t.memoizedState),(i=Xe||Ei(t,n,i,r,p,a,c))?(m||typeof o.UNSAFE_componentWillMount!="function"&&typeof o.componentWillMount!="function"||(typeof o.componentWillMount=="function"&&o.componentWillMount(),typeof o.UNSAFE_componentWillMount=="function"&&o.UNSAFE_componentWillMount()),typeof o.componentDidMount=="function"&&(t.flags|=4194308)):(typeof o.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=r,t.memoizedState=a),o.props=r,o.state=a,o.context=c,r=i):(typeof o.componentDidMount=="function"&&(t.flags|=4194308),r=!1)}else{o=t.stateNode,su(e,t),i=t.memoizedProps,c=t.type===t.elementType?i:Pe(t.type,i),o.props=c,m=t.pendingProps,p=o.context,a=n.contextType,typeof a=="object"&&a!==null?a=ke(a):(a=de(n)?kt:re.current,a=Xt(t,a));var g=n.getDerivedStateFromProps;(x=typeof g=="function"||typeof o.getSnapshotBeforeUpdate=="function")||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(i!==m||p!==a)&&ki(t,o,r,a),Xe=!1,p=t.memoizedState,o.state=p,Vr(t,r,o,l);var y=t.memoizedState;i!==m||p!==y||ce.current||Xe?(typeof g=="function"&&(ws(t,n,g,r),y=t.memoizedState),(c=Xe||Ei(t,n,c,r,p,y,a)||!1)?(x||typeof o.UNSAFE_componentWillUpdate!="function"&&typeof o.componentWillUpdate!="function"||(typeof o.componentWillUpdate=="function"&&o.componentWillUpdate(r,y,a),typeof o.UNSAFE_componentWillUpdate=="function"&&o.UNSAFE_componentWillUpdate(r,y,a)),typeof o.componentDidUpdate=="function"&&(t.flags|=4),typeof o.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof o.componentDidUpdate!="function"||i===e.memoizedProps&&p===e.memoizedState||(t.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||i===e.memoizedProps&&p===e.memoizedState||(t.flags|=1024),t.memoizedProps=r,t.memoizedState=y),o.props=r,o.state=y,o.context=a,r=c):(typeof o.componentDidUpdate!="function"||i===e.memoizedProps&&p===e.memoizedState||(t.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||i===e.memoizedProps&&p===e.memoizedState||(t.flags|=1024),r=!1)}return Fs(e,t,n,r,s,l)}function Fs(e,t,n,r,l,s){Bu(e,t);var o=(t.flags&128)!==0;if(!r&&!o)return l&&mi(t,n,!1),He(e,t,s);r=t.stateNode,sf.current=t;var i=o&&typeof n.getDerivedStateFromError!="function"?null:r.render();return t.flags|=1,e!==null&&o?(t.child=qt(t,e.child,null,s),t.child=qt(t,null,i,s)):le(e,t,i,s),t.memoizedState=r.state,l&&mi(t,n,!0),t.child}function Nu(e){var t=e.stateNode;t.pendingContext?pi(e,t.pendingContext,t.pendingContext!==t.context):t.context&&pi(e,t.context,!1),po(e,t.containerInfo)}function Di(e,t,n,r,l){return Zt(),oo(l),t.flags|=256,le(e,t,n,r),t.child}var _s={dehydrated:null,treeContext:null,retryLane:0};function Ps(e){return{baseLanes:e,cachePool:null,transitions:null}}function Au(e,t,n){var r=t.pendingProps,l=j.current,s=!1,o=(t.flags&128)!==0,i;if((i=o)||(i=e!==null&&e.memoizedState===null?!1:(l&2)!==0),i?(s=!0,t.flags&=-129):(e===null||e.memoizedState!==null)&&(l|=1),A(j,l&1),e===null)return ys(t),e=t.memoizedState,e!==null&&(e=e.dehydrated,e!==null)?(t.mode&1?e.data==="$!"?t.lanes=8:t.lanes=1073741824:t.lanes=1,null):(o=r.children,e=r.fallback,s?(r=t.mode,s=t.child,o={mode:"hidden",children:o},!(r&1)&&s!==null?(s.childLanes=0,s.pendingProps=o):s=ul(o,r,0,null),e=Et(e,r,n,null),s.return=t,e.return=t,s.sibling=e,t.child=s,t.child.memoizedState=Ps(n),t.memoizedState=_s,e):wo(t,o));if(l=e.memoizedState,l!==null&&(i=l.dehydrated,i!==null))return of(e,t,o,r,i,l,n);if(s){s=r.fallback,o=t.mode,l=e.child,i=l.sibling;var a={mode:"hidden",children:r.children};return!(o&1)&&t.child!==l?(r=t.child,r.childLanes=0,r.pendingProps=a,t.deletions=null):(r=at(l,a),r.subtreeFlags=l.subtreeFlags&14680064),i!==null?s=at(i,s):(s=Et(s,o,n,null),s.flags|=2),s.return=t,r.return=t,r.sibling=s,t.child=r,r=s,s=t.child,o=e.child.memoizedState,o=o===null?Ps(n):{baseLanes:o.baseLanes|n,cachePool:null,transitions:o.transitions},s.memoizedState=o,s.childLanes=e.childLanes&~n,t.memoizedState=_s,r}return s=e.child,e=s.sibling,r=at(s,{mode:"visible",children:r.children}),!(t.mode&1)&&(r.lanes=n),r.return=t,r.sibling=null,e!==null&&(n=t.deletions,n===null?(t.deletions=[e],t.flags|=16):n.push(e)),t.child=r,t.memoizedState=null,r}function wo(e,t){return t=ul({mode:"visible",children:t},e.mode,0,null),t.return=e,e.child=t}function fr(e,t,n,r){return r!==null&&oo(r),qt(t,e.child,null,n),e=wo(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function of(e,t,n,r,l,s,o){if(n)return t.flags&256?(t.flags&=-257,r=Il(Error(h(422))),fr(e,t,o,r)):t.memoizedState!==null?(t.child=e.child,t.flags|=128,null):(s=r.fallback,l=t.mode,r=ul({mode:"visible",children:r.children},l,0,null),s=Et(s,l,o,null),s.flags|=2,r.return=t,s.return=t,r.sibling=s,t.child=r,t.mode&1&&qt(t,e.child,null,o),t.child.memoizedState=Ps(o),t.memoizedState=_s,s);if(!(t.mode&1))return fr(e,t,o,null);if(l.data==="$!"){if(r=l.nextSibling&&l.nextSibling.dataset,r)var i=r.dgst;return r=i,s=Error(h(419)),r=Il(s,r,void 0),fr(e,t,o,r)}if(i=(o&e.childLanes)!==0,ue||i){if(r=X,r!==null){switch(o&-o){case 4:l=2;break;case 16:l=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:l=32;break;case 536870912:l=268435456;break;default:l=0}l=l&(r.suspendedLanes|o)?0:l,l!==0&&l!==s.retryLane&&(s.retryLane=l,We(e,l),Be(r,e,l,-1))}return Po(),r=Il(Error(h(421))),fr(e,t,o,r)}return l.data==="$?"?(t.flags|=128,t.child=e.child,t=Cf.bind(null,e),l._reactRetry=t,null):(e=s.treeContext,me=lt(l.nextSibling),xe=t,O=!0,ze=null,e!==null&&(ye[Ce++]=Me,ye[Ce++]=Ue,ye[Ce++]=St,Me=e.id,Ue=e.overflow,St=t),t=wo(t,r.children),t.flags|=4096,t)}function Bi(e,t,n){e.lanes|=t;var r=e.alternate;r!==null&&(r.lanes|=t),Cs(e.return,t,n)}function Ml(e,t,n,r,l){var s=e.memoizedState;s===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:r,tail:n,tailMode:l}:(s.isBackwards=t,s.rendering=null,s.renderingStartTime=0,s.last=r,s.tail=n,s.tailMode=l)}function Lu(e,t,n){var r=t.pendingProps,l=r.revealOrder,s=r.tail;if(le(e,t,r.children,n),r=j.current,r&2)r=r&1|2,t.flags|=128;else{if(e!==null&&e.flags&128)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Bi(e,n,t);else if(e.tag===19)Bi(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}r&=1}if(A(j,r),!(t.mode&1))t.memoizedState=null;else switch(l){case"forwards":for(n=t.child,l=null;n!==null;)e=n.alternate,e!==null&&$r(e)===null&&(l=n),n=n.sibling;n=l,n===null?(l=t.child,t.child=null):(l=n.sibling,n.sibling=null),Ml(t,!1,l,n,s);break;case"backwards":for(n=null,l=t.child,t.child=null;l!==null;){if(e=l.alternate,e!==null&&$r(e)===null){t.child=l;break}e=l.sibling,l.sibling=n,n=l,l=e}Ml(t,!0,n,null,s);break;case"together":Ml(t,!1,null,null,void 0);break;default:t.memoizedState=null}return t.child}function Sr(e,t){!(t.mode&1)&&e!==null&&(e.alternate=null,t.alternate=null,t.flags|=2)}function He(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),_t|=t.lanes,!(n&t.childLanes))return null;if(e!==null&&t.child!==e.child)throw Error(h(153));if(t.child!==null){for(e=t.child,n=at(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=at(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function af(e,t,n){switch(t.tag){case 3:Nu(t),Zt();break;case 5:ou(t);break;case 1:de(t.type)&&jr(t);break;case 4:po(t,t.stateNode.containerInfo);break;case 10:var r=t.type._context,l=t.memoizedProps.value;A(Ur,r._currentValue),r._currentValue=l;break;case 13:if(r=t.memoizedState,r!==null)return r.dehydrated!==null?(A(j,j.current&1),t.flags|=128,null):n&t.child.childLanes?Au(e,t,n):(A(j,j.current&1),e=He(e,t,n),e!==null?e.sibling:null);A(j,j.current&1);break;case 19:if(r=(n&t.childLanes)!==0,e.flags&128){if(r)return Lu(e,t,n);t.flags|=128}if(l=t.memoizedState,l!==null&&(l.rendering=null,l.tail=null,l.lastEffect=null),A(j,j.current),r)break;return null;case 22:case 23:return t.lanes=0,Du(e,t,n)}return He(e,t,n)}var Tu,bs,Ru,Ou;Tu=function(e,t){for(var n=t.child;n!==null;){if(n.tag===5||n.tag===6)e.appendChild(n.stateNode);else if(n.tag!==4&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return;n=n.return}n.sibling.return=n.return,n=n.sibling}};bs=function(){};Ru=function(e,t,n,r){var l=e.memoizedProps;if(l!==r){e=t.stateNode,Ct(Oe.current);var s=null;switch(n){case"input":l=Xl(e,l),r=Xl(e,r),s=[];break;case"select":l=M({},l,{value:void 0}),r=M({},r,{value:void 0}),s=[];break;case"textarea":l=Jl(e,l),r=Jl(e,r),s=[];break;default:typeof l.onClick!="function"&&typeof r.onClick=="function"&&(e.onclick=Rr)}ts(n,r);var o;n=null;for(c in l)if(!r.hasOwnProperty(c)&&l.hasOwnProperty(c)&&l[c]!=null)if(c==="style"){var i=l[c];for(o in i)i.hasOwnProperty(o)&&(n||(n={}),n[o]="")}else c!=="dangerouslySetInnerHTML"&&c!=="children"&&c!=="suppressContentEditableWarning"&&c!=="suppressHydrationWarning"&&c!=="autoFocus"&&(zn.hasOwnProperty(c)?s||(s=[]):(s=s||[]).push(c,null));for(c in r){var a=r[c];if(i=l!=null?l[c]:void 0,r.hasOwnProperty(c)&&a!==i&&(a!=null||i!=null))if(c==="style")if(i){for(o in i)!i.hasOwnProperty(o)||a&&a.hasOwnProperty(o)||(n||(n={}),n[o]="");for(o in a)a.hasOwnProperty(o)&&i[o]!==a[o]&&(n||(n={}),n[o]=a[o])}else n||(s||(s=[]),s.push(c,n)),n=a;else c==="dangerouslySetInnerHTML"?(a=a?a.__html:void 0,i=i?i.__html:void 0,a!=null&&i!==a&&(s=s||[]).push(c,a)):c==="children"?typeof a!="string"&&typeof a!="number"||(s=s||[]).push(c,""+a):c!=="suppressContentEditableWarning"&&c!=="suppressHydrationWarning"&&(zn.hasOwnProperty(c)?(a!=null&&c==="onScroll"&&L("scroll",e),s||i===a||(s=[])):(s=s||[]).push(c,a))}n&&(s=s||[]).push("style",n);var c=s;(t.updateQueue=c)&&(t.flags|=4)}};Ou=function(e,t,n,r){n!==r&&(t.flags|=4)};function mn(e,t){if(!O)switch(e.tailMode){case"hidden":t=e.tail;for(var n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null;break;case"collapsed":n=e.tail;for(var r=null;n!==null;)n.alternate!==null&&(r=n),n=n.sibling;r===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null}}function te(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,r=0;if(t)for(var l=e.child;l!==null;)n|=l.lanes|l.childLanes,r|=l.subtreeFlags&14680064,r|=l.flags&14680064,l.return=e,l=l.sibling;else for(l=e.child;l!==null;)n|=l.lanes|l.childLanes,r|=l.subtreeFlags,r|=l.flags,l.return=e,l=l.sibling;return e.subtreeFlags|=r,e.childLanes=n,t}function uf(e,t,n){var r=t.pendingProps;switch(so(t),t.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return te(t),null;case 1:return de(t.type)&&Or(),te(t),null;case 3:return r=t.stateNode,Jt(),T(ce),T(re),xo(),r.pendingContext&&(r.context=r.pendingContext,r.pendingContext=null),(e===null||e.child===null)&&(cr(t)?t.flags|=4:e===null||e.memoizedState.isDehydrated&&!(t.flags&256)||(t.flags|=1024,ze!==null&&(Rs(ze),ze=null))),bs(e,t),te(t),null;case 5:mo(t);var l=Ct(Un.current);if(n=t.type,e!==null&&t.stateNode!=null)Ru(e,t,n,r,l),e.ref!==t.ref&&(t.flags|=512,t.flags|=2097152);else{if(!r){if(t.stateNode===null)throw Error(h(166));return te(t),null}if(e=Ct(Oe.current),cr(t)){r=t.stateNode,n=t.type;var s=t.memoizedProps;switch(r[Te]=t,r[In]=s,e=(t.mode&1)!==0,n){case"dialog":L("cancel",r),L("close",r);break;case"iframe":case"object":case"embed":L("load",r);break;case"video":case"audio":for(l=0;l<yn.length;l++)L(yn[l],r);break;case"source":L("error",r);break;case"img":case"image":case"link":L("error",r),L("load",r);break;case"details":L("toggle",r);break;case"input":Mo(r,s),L("invalid",r);break;case"select":r._wrapperState={wasMultiple:!!s.multiple},L("invalid",r);break;case"textarea":Qo(r,s),L("invalid",r)}ts(n,s),l=null;for(var o in s)if(s.hasOwnProperty(o)){var i=s[o];o==="children"?typeof i=="string"?r.textContent!==i&&(s.suppressHydrationWarning!==!0&&ur(r.textContent,i,e),l=["children",i]):typeof i=="number"&&r.textContent!==""+i&&(s.suppressHydrationWarning!==!0&&ur(r.textContent,i,e),l=["children",""+i]):zn.hasOwnProperty(o)&&i!=null&&o==="onScroll"&&L("scroll",r)}switch(n){case"input":tr(r),Uo(r,s,!0);break;case"textarea":tr(r),Vo(r);break;case"select":case"option":break;default:typeof s.onClick=="function"&&(r.onclick=Rr)}r=l,t.updateQueue=r,r!==null&&(t.flags|=4)}else{o=l.nodeType===9?l:l.ownerDocument,e==="http://www.w3.org/1999/xhtml"&&(e=da(n)),e==="http://www.w3.org/1999/xhtml"?n==="script"?(e=o.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild)):typeof r.is=="string"?e=o.createElement(n,{is:r.is}):(e=o.createElement(n),n==="select"&&(o=e,r.multiple?o.multiple=!0:r.size&&(o.size=r.size))):e=o.createElementNS(e,n),e[Te]=t,e[In]=r,Tu(e,t,!1,!1),t.stateNode=e;e:{switch(o=ns(n,r),n){case"dialog":L("cancel",e),L("close",e),l=r;break;case"iframe":case"object":case"embed":L("load",e),l=r;break;case"video":case"audio":for(l=0;l<yn.length;l++)L(yn[l],e);l=r;break;case"source":L("error",e),l=r;break;case"img":case"image":case"link":L("error",e),L("load",e),l=r;break;case"details":L("toggle",e),l=r;break;case"input":Mo(e,r),l=Xl(e,r),L("invalid",e);break;case"option":l=r;break;case"select":e._wrapperState={wasMultiple:!!r.multiple},l=M({},r,{value:void 0}),L("invalid",e);break;case"textarea":Qo(e,r),l=Jl(e,r),L("invalid",e);break;default:l=r}ts(n,l),i=l;for(s in i)if(i.hasOwnProperty(s)){var a=i[s];s==="style"?ma(e,a):s==="dangerouslySetInnerHTML"?(a=a?a.__html:void 0,a!=null&&fa(e,a)):s==="children"?typeof a=="string"?(n!=="textarea"||a!=="")&&Dn(e,a):typeof a=="number"&&Dn(e,""+a):s!=="suppressContentEditableWarning"&&s!=="suppressHydrationWarning"&&s!=="autoFocus"&&(zn.hasOwnProperty(s)?a!=null&&s==="onScroll"&&L("scroll",e):a!=null&&$s(e,s,a,o))}switch(n){case"input":tr(e),Uo(e,r,!1);break;case"textarea":tr(e),Vo(e);break;case"option":r.value!=null&&e.setAttribute("value",""+ut(r.value));break;case"select":e.multiple=!!r.multiple,s=r.value,s!=null?Vt(e,!!r.multiple,s,!1):r.defaultValue!=null&&Vt(e,!!r.multiple,r.defaultValue,!0);break;default:typeof l.onClick=="function"&&(e.onclick=Rr)}switch(n){case"button":case"input":case"select":case"textarea":r=!!r.autoFocus;break e;case"img":r=!0;break e;default:r=!1}}r&&(t.flags|=4)}t.ref!==null&&(t.flags|=512,t.flags|=2097152)}return te(t),null;case 6:if(e&&t.stateNode!=null)Ou(e,t,e.memoizedProps,r);else{if(typeof r!="string"&&t.stateNode===null)throw Error(h(166));if(n=Ct(Un.current),Ct(Oe.current),cr(t)){if(r=t.stateNode,n=t.memoizedProps,r[Te]=t,(s=r.nodeValue!==n)&&(e=xe,e!==null))switch(e.tag){case 3:ur(r.nodeValue,n,(e.mode&1)!==0);break;case 5:e.memoizedProps.suppressHydrationWarning!==!0&&ur(r.nodeValue,n,(e.mode&1)!==0)}s&&(t.flags|=4)}else r=(n.nodeType===9?n:n.ownerDocument).createTextNode(r),r[Te]=t,t.stateNode=r}return te(t),null;case 13:if(T(j),r=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(O&&me!==null&&t.mode&1&&!(t.flags&128))tu(),Zt(),t.flags|=98560,s=!1;else if(s=cr(t),r!==null&&r.dehydrated!==null){if(e===null){if(!s)throw Error(h(318));if(s=t.memoizedState,s=s!==null?s.dehydrated:null,!s)throw Error(h(317));s[Te]=t}else Zt(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;te(t),s=!1}else ze!==null&&(Rs(ze),ze=null),s=!0;if(!s)return t.flags&65536?t:null}return t.flags&128?(t.lanes=n,t):(r=r!==null,r!==(e!==null&&e.memoizedState!==null)&&r&&(t.child.flags|=8192,t.mode&1&&(e===null||j.current&1?G===0&&(G=3):Po())),t.updateQueue!==null&&(t.flags|=4),te(t),null);case 4:return Jt(),bs(e,t),e===null&&On(t.stateNode.containerInfo),te(t),null;case 10:return uo(t.type._context),te(t),null;case 17:return de(t.type)&&Or(),te(t),null;case 19:if(T(j),s=t.memoizedState,s===null)return te(t),null;if(r=(t.flags&128)!==0,o=s.rendering,o===null)if(r)mn(s,!1);else{if(G!==0||e!==null&&e.flags&128)for(e=t.child;e!==null;){if(o=$r(e),o!==null){for(t.flags|=128,mn(s,!1),r=o.updateQueue,r!==null&&(t.updateQueue=r,t.flags|=4),t.subtreeFlags=0,r=n,n=t.child;n!==null;)s=n,e=r,s.flags&=14680066,o=s.alternate,o===null?(s.childLanes=0,s.lanes=e,s.child=null,s.subtreeFlags=0,s.memoizedProps=null,s.memoizedState=null,s.updateQueue=null,s.dependencies=null,s.stateNode=null):(s.childLanes=o.childLanes,s.lanes=o.lanes,s.child=o.child,s.subtreeFlags=0,s.deletions=null,s.memoizedProps=o.memoizedProps,s.memoizedState=o.memoizedState,s.updateQueue=o.updateQueue,s.type=o.type,e=o.dependencies,s.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),n=n.sibling;return A(j,j.current&1|2),t.child}e=e.sibling}s.tail!==null&&$()>tn&&(t.flags|=128,r=!0,mn(s,!1),t.lanes=4194304)}else{if(!r)if(e=$r(o),e!==null){if(t.flags|=128,r=!0,n=e.updateQueue,n!==null&&(t.updateQueue=n,t.flags|=4),mn(s,!0),s.tail===null&&s.tailMode==="hidden"&&!o.alternate&&!O)return te(t),null}else 2*$()-s.renderingStartTime>tn&&n!==1073741824&&(t.flags|=128,r=!0,mn(s,!1),t.lanes=4194304);s.isBackwards?(o.sibling=t.child,t.child=o):(n=s.last,n!==null?n.sibling=o:t.child=o,s.last=o)}return s.tail!==null?(t=s.tail,s.rendering=t,s.tail=t.sibling,s.renderingStartTime=$(),t.sibling=null,n=j.current,A(j,r?n&1|2:n&1),t):(te(t),null);case 22:case 23:return _o(),r=t.memoizedState!==null,e!==null&&e.memoizedState!==null!==r&&(t.flags|=8192),r&&t.mode&1?pe&1073741824&&(te(t),t.subtreeFlags&6&&(t.flags|=8192)):te(t),null;case 24:return null;case 25:return null}throw Error(h(156,t.tag))}function cf(e,t){switch(so(t),t.tag){case 1:return de(t.type)&&Or(),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return Jt(),T(ce),T(re),xo(),e=t.flags,e&65536&&!(e&128)?(t.flags=e&-65537|128,t):null;case 5:return mo(t),null;case 13:if(T(j),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(h(340));Zt()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return T(j),null;case 4:return Jt(),null;case 10:return uo(t.type._context),null;case 22:case 23:return _o(),null;case 24:return null;default:return null}}var pr=!1,ne=!1,df=typeof WeakSet=="function"?WeakSet:Set,w=null;function Ut(e,t){var n=e.ref;if(n!==null)if(typeof n=="function")try{n(null)}catch(r){U(e,t,r)}else n.current=null}function zs(e,t,n){try{n()}catch(r){U(e,t,r)}}var Ni=!1;function ff(e,t){if(fs=Ar,e=Qa(),ro(e)){if("selectionStart"in e)var n={start:e.selectionStart,end:e.selectionEnd};else e:{n=(n=e.ownerDocument)&&n.defaultView||window;var r=n.getSelection&&n.getSelection();if(r&&r.rangeCount!==0){n=r.anchorNode;var l=r.anchorOffset,s=r.focusNode;r=r.focusOffset;try{n.nodeType,s.nodeType}catch{n=null;break e}var o=0,i=-1,a=-1,c=0,x=0,m=e,p=null;t:for(;;){for(var g;m!==n||l!==0&&m.nodeType!==3||(i=o+l),m!==s||r!==0&&m.nodeType!==3||(a=o+r),m.nodeType===3&&(o+=m.nodeValue.length),(g=m.firstChild)!==null;)p=m,m=g;for(;;){if(m===e)break t;if(p===n&&++c===l&&(i=o),p===s&&++x===r&&(a=o),(g=m.nextSibling)!==null)break;m=p,p=m.parentNode}m=g}n=i===-1||a===-1?null:{start:i,end:a}}else n=null}n=n||{start:0,end:0}}else n=null;for(ps={focusedElem:e,selectionRange:n},Ar=!1,w=t;w!==null;)if(t=w,e=t.child,(t.subtreeFlags&1028)!==0&&e!==null)e.return=t,w=e;else for(;w!==null;){t=w;try{var y=t.alternate;if(t.flags&1024)switch(t.tag){case 0:case 11:case 15:break;case 1:if(y!==null){var C=y.memoizedProps,R=y.memoizedState,d=t.stateNode,u=d.getSnapshotBeforeUpdate(t.elementType===t.type?C:Pe(t.type,C),R);d.__reactInternalSnapshotBeforeUpdate=u}break;case 3:var f=t.stateNode.containerInfo;f.nodeType===1?f.textContent="":f.nodeType===9&&f.documentElement&&f.removeChild(f.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(h(163))}}catch(v){U(t,t.return,v)}if(e=t.sibling,e!==null){e.return=t.return,w=e;break}w=t.return}return y=Ni,Ni=!1,y}function _n(e,t,n){var r=t.updateQueue;if(r=r!==null?r.lastEffect:null,r!==null){var l=r=r.next;do{if((l.tag&e)===e){var s=l.destroy;l.destroy=void 0,s!==void 0&&zs(t,n,s)}l=l.next}while(l!==r)}}function il(e,t){if(t=t.updateQueue,t=t!==null?t.lastEffect:null,t!==null){var n=t=t.next;do{if((n.tag&e)===e){var r=n.create;n.destroy=r()}n=n.next}while(n!==t)}}function Ds(e){var t=e.ref;if(t!==null){var n=e.stateNode;switch(e.tag){case 5:e=n;break;default:e=n}typeof t=="function"?t(e):t.current=e}}function ju(e){var t=e.alternate;t!==null&&(e.alternate=null,ju(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&(delete t[Te],delete t[In],delete t[vs],delete t[Gd],delete t[Kd])),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}function Iu(e){return e.tag===5||e.tag===3||e.tag===4}function Ai(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||Iu(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Bs(e,t,n){var r=e.tag;if(r===5||r===6)e=e.stateNode,t?n.nodeType===8?n.parentNode.insertBefore(e,t):n.insertBefore(e,t):(n.nodeType===8?(t=n.parentNode,t.insertBefore(e,n)):(t=n,t.appendChild(e)),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=Rr));else if(r!==4&&(e=e.child,e!==null))for(Bs(e,t,n),e=e.sibling;e!==null;)Bs(e,t,n),e=e.sibling}function Ns(e,t,n){var r=e.tag;if(r===5||r===6)e=e.stateNode,t?n.insertBefore(e,t):n.appendChild(e);else if(r!==4&&(e=e.child,e!==null))for(Ns(e,t,n),e=e.sibling;e!==null;)Ns(e,t,n),e=e.sibling}var Z=null,be=!1;function Ke(e,t,n){for(n=n.child;n!==null;)Mu(e,t,n),n=n.sibling}function Mu(e,t,n){if(Re&&typeof Re.onCommitFiberUnmount=="function")try{Re.onCommitFiberUnmount(Jr,n)}catch{}switch(n.tag){case 5:ne||Ut(n,t);case 6:var r=Z,l=be;Z=null,Ke(e,t,n),Z=r,be=l,Z!==null&&(be?(e=Z,n=n.stateNode,e.nodeType===8?e.parentNode.removeChild(n):e.removeChild(n)):Z.removeChild(n.stateNode));break;case 18:Z!==null&&(be?(e=Z,n=n.stateNode,e.nodeType===8?Al(e.parentNode,n):e.nodeType===1&&Al(e,n),Ln(e)):Al(Z,n.stateNode));break;case 4:r=Z,l=be,Z=n.stateNode.containerInfo,be=!0,Ke(e,t,n),Z=r,be=l;break;case 0:case 11:case 14:case 15:if(!ne&&(r=n.updateQueue,r!==null&&(r=r.lastEffect,r!==null))){l=r=r.next;do{var s=l,o=s.destroy;s=s.tag,o!==void 0&&(s&2||s&4)&&zs(n,t,o),l=l.next}while(l!==r)}Ke(e,t,n);break;case 1:if(!ne&&(Ut(n,t),r=n.stateNode,typeof r.componentWillUnmount=="function"))try{r.props=n.memoizedProps,r.state=n.memoizedState,r.componentWillUnmount()}catch(i){U(n,t,i)}Ke(e,t,n);break;case 21:Ke(e,t,n);break;case 22:n.mode&1?(ne=(r=ne)||n.memoizedState!==null,Ke(e,t,n),ne=r):Ke(e,t,n);break;default:Ke(e,t,n)}}function Li(e){var t=e.updateQueue;if(t!==null){e.updateQueue=null;var n=e.stateNode;n===null&&(n=e.stateNode=new df),t.forEach(function(r){var l=wf.bind(null,e,r);n.has(r)||(n.add(r),r.then(l,l))})}}function _e(e,t){var n=t.deletions;if(n!==null)for(var r=0;r<n.length;r++){var l=n[r];try{var s=e,o=t,i=o;e:for(;i!==null;){switch(i.tag){case 5:Z=i.stateNode,be=!1;break e;case 3:Z=i.stateNode.containerInfo,be=!0;break e;case 4:Z=i.stateNode.containerInfo,be=!0;break e}i=i.return}if(Z===null)throw Error(h(160));Mu(s,o,l),Z=null,be=!1;var a=l.alternate;a!==null&&(a.return=null),l.return=null}catch(c){U(l,t,c)}}if(t.subtreeFlags&12854)for(t=t.child;t!==null;)Uu(t,e),t=t.sibling}function Uu(e,t){var n=e.alternate,r=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(_e(t,e),Ae(e),r&4){try{_n(3,e,e.return),il(3,e)}catch(C){U(e,e.return,C)}try{_n(5,e,e.return)}catch(C){U(e,e.return,C)}}break;case 1:_e(t,e),Ae(e),r&512&&n!==null&&Ut(n,n.return);break;case 5:if(_e(t,e),Ae(e),r&512&&n!==null&&Ut(n,n.return),e.flags&32){var l=e.stateNode;try{Dn(l,"")}catch(C){U(e,e.return,C)}}if(r&4&&(l=e.stateNode,l!=null)){var s=e.memoizedProps,o=n!==null?n.memoizedProps:s,i=e.type,a=e.updateQueue;if(e.updateQueue=null,a!==null)try{i==="input"&&s.type==="radio"&&s.name!=null&&ua(l,s),ns(i,o);var c=ns(i,s);for(o=0;o<a.length;o+=2){var x=a[o],m=a[o+1];x==="style"?ma(l,m):x==="dangerouslySetInnerHTML"?fa(l,m):x==="children"?Dn(l,m):$s(l,x,m,c)}switch(i){case"input":Zl(l,s);break;case"textarea":ca(l,s);break;case"select":var p=l._wrapperState.wasMultiple;l._wrapperState.wasMultiple=!!s.multiple;var g=s.value;g!=null?Vt(l,!!s.multiple,g,!1):p!==!!s.multiple&&(s.defaultValue!=null?Vt(l,!!s.multiple,s.defaultValue,!0):Vt(l,!!s.multiple,s.multiple?[]:"",!1))}l[In]=s}catch(C){U(e,e.return,C)}}break;case 6:if(_e(t,e),Ae(e),r&4){if(e.stateNode===null)throw Error(h(162));l=e.stateNode,s=e.memoizedProps;try{l.nodeValue=s}catch(C){U(e,e.return,C)}}break;case 3:if(_e(t,e),Ae(e),r&4&&n!==null&&n.memoizedState.isDehydrated)try{Ln(t.containerInfo)}catch(C){U(e,e.return,C)}break;case 4:_e(t,e),Ae(e);break;case 13:_e(t,e),Ae(e),l=e.child,l.flags&8192&&(s=l.memoizedState!==null,l.stateNode.isHidden=s,!s||l.alternate!==null&&l.alternate.memoizedState!==null||(So=$())),r&4&&Li(e);break;case 22:if(x=n!==null&&n.memoizedState!==null,e.mode&1?(ne=(c=ne)||x,_e(t,e),ne=c):_e(t,e),Ae(e),r&8192){if(c=e.memoizedState!==null,(e.stateNode.isHidden=c)&&!x&&e.mode&1)for(w=e,x=e.child;x!==null;){for(m=w=x;w!==null;){switch(p=w,g=p.child,p.tag){case 0:case 11:case 14:case 15:_n(4,p,p.return);break;case 1:Ut(p,p.return);var y=p.stateNode;if(typeof y.componentWillUnmount=="function"){r=p,n=p.return;try{t=r,y.props=t.memoizedProps,y.state=t.memoizedState,y.componentWillUnmount()}catch(C){U(r,n,C)}}break;case 5:Ut(p,p.return);break;case 22:if(p.memoizedState!==null){Ri(m);continue}}g!==null?(g.return=p,w=g):Ri(m)}x=x.sibling}e:for(x=null,m=e;;){if(m.tag===5){if(x===null){x=m;try{l=m.stateNode,c?(s=l.style,typeof s.setProperty=="function"?s.setProperty("display","none","important"):s.display="none"):(i=m.stateNode,a=m.memoizedProps.style,o=a!=null&&a.hasOwnProperty("display")?a.display:null,i.style.display=pa("display",o))}catch(C){U(e,e.return,C)}}}else if(m.tag===6){if(x===null)try{m.stateNode.nodeValue=c?"":m.memoizedProps}catch(C){U(e,e.return,C)}}else if((m.tag!==22&&m.tag!==23||m.memoizedState===null||m===e)&&m.child!==null){m.child.return=m,m=m.child;continue}if(m===e)break e;for(;m.sibling===null;){if(m.return===null||m.return===e)break e;x===m&&(x=null),m=m.return}x===m&&(x=null),m.sibling.return=m.return,m=m.sibling}}break;case 19:_e(t,e),Ae(e),r&4&&Li(e);break;case 21:break;default:_e(t,e),Ae(e)}}function Ae(e){var t=e.flags;if(t&2){try{e:{for(var n=e.return;n!==null;){if(Iu(n)){var r=n;break e}n=n.return}throw Error(h(160))}switch(r.tag){case 5:var l=r.stateNode;r.flags&32&&(Dn(l,""),r.flags&=-33);var s=Ai(e);Ns(e,s,l);break;case 3:case 4:var o=r.stateNode.containerInfo,i=Ai(e);Bs(e,i,o);break;default:throw Error(h(161))}}catch(a){U(e,e.return,a)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function pf(e,t,n){w=e,Qu(e)}function Qu(e,t,n){for(var r=(e.mode&1)!==0;w!==null;){var l=w,s=l.child;if(l.tag===22&&r){var o=l.memoizedState!==null||pr;if(!o){var i=l.alternate,a=i!==null&&i.memoizedState!==null||ne;i=pr;var c=ne;if(pr=o,(ne=a)&&!c)for(w=l;w!==null;)o=w,a=o.child,o.tag===22&&o.memoizedState!==null?Oi(l):a!==null?(a.return=o,w=a):Oi(l);for(;s!==null;)w=s,Qu(s),s=s.sibling;w=l,pr=i,ne=c}Ti(e)}else l.subtreeFlags&8772&&s!==null?(s.return=l,w=s):Ti(e)}}function Ti(e){for(;w!==null;){var t=w;if(t.flags&8772){var n=t.alternate;try{if(t.flags&8772)switch(t.tag){case 0:case 11:case 15:ne||il(5,t);break;case 1:var r=t.stateNode;if(t.flags&4&&!ne)if(n===null)r.componentDidMount();else{var l=t.elementType===t.type?n.memoizedProps:Pe(t.type,n.memoizedProps);r.componentDidUpdate(l,n.memoizedState,r.__reactInternalSnapshotBeforeUpdate)}var s=t.updateQueue;s!==null&&yi(t,s,r);break;case 3:var o=t.updateQueue;if(o!==null){if(n=null,t.child!==null)switch(t.child.tag){case 5:n=t.child.stateNode;break;case 1:n=t.child.stateNode}yi(t,o,n)}break;case 5:var i=t.stateNode;if(n===null&&t.flags&4){n=i;var a=t.memoizedProps;switch(t.type){case"button":case"input":case"select":case"textarea":a.autoFocus&&n.focus();break;case"img":a.src&&(n.src=a.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(t.memoizedState===null){var c=t.alternate;if(c!==null){var x=c.memoizedState;if(x!==null){var m=x.dehydrated;m!==null&&Ln(m)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(h(163))}ne||t.flags&512&&Ds(t)}catch(p){U(t,t.return,p)}}if(t===e){w=null;break}if(n=t.sibling,n!==null){n.return=t.return,w=n;break}w=t.return}}function Ri(e){for(;w!==null;){var t=w;if(t===e){w=null;break}var n=t.sibling;if(n!==null){n.return=t.return,w=n;break}w=t.return}}function Oi(e){for(;w!==null;){var t=w;try{switch(t.tag){case 0:case 11:case 15:var n=t.return;try{il(4,t)}catch(a){U(t,n,a)}break;case 1:var r=t.stateNode;if(typeof r.componentDidMount=="function"){var l=t.return;try{r.componentDidMount()}catch(a){U(t,l,a)}}var s=t.return;try{Ds(t)}catch(a){U(t,s,a)}break;case 5:var o=t.return;try{Ds(t)}catch(a){U(t,o,a)}}}catch(a){U(t,t.return,a)}if(t===e){w=null;break}var i=t.sibling;if(i!==null){i.return=t.return,w=i;break}w=t.return}}var mf=Math.ceil,Gr=Ge.ReactCurrentDispatcher,Eo=Ge.ReactCurrentOwner,Ee=Ge.ReactCurrentBatchConfig,B=0,X=null,W=null,q=0,pe=0,Qt=ft(0),G=0,Wn=null,_t=0,al=0,ko=0,Pn=null,ae=null,So=0,tn=1/0,je=null,Kr=!1,As=null,ot=null,mr=!1,et=null,Yr=0,bn=0,Ls=null,Fr=-1,_r=0;function se(){return B&6?$():Fr!==-1?Fr:Fr=$()}function it(e){return e.mode&1?B&2&&q!==0?q&-q:Xd.transition!==null?(_r===0&&(_r=_a()),_r):(e=N,e!==0||(e=window.event,e=e===void 0?16:Aa(e.type)),e):1}function Be(e,t,n,r){if(50<bn)throw bn=0,Ls=null,Error(h(185));Gn(e,n,r),(!(B&2)||e!==X)&&(e===X&&(!(B&2)&&(al|=n),G===4&&qe(e,q)),fe(e,r),n===1&&B===0&&!(t.mode&1)&&(tn=$()+500,ll&&pt()))}function fe(e,t){var n=e.callbackNode;Xc(e,t);var r=Nr(e,e===X?q:0);if(r===0)n!==null&&Ho(n),e.callbackNode=null,e.callbackPriority=0;else if(t=r&-r,e.callbackPriority!==t){if(n!=null&&Ho(n),t===1)e.tag===0?Yd(ji.bind(null,e)):qa(ji.bind(null,e)),Wd(function(){!(B&6)&&pt()}),n=null;else{switch(Pa(r)){case 1:n=Ys;break;case 4:n=Sa;break;case 16:n=Br;break;case 536870912:n=Fa;break;default:n=Br}n=Xu(n,Vu.bind(null,e))}e.callbackPriority=t,e.callbackNode=n}}function Vu(e,t){if(Fr=-1,_r=0,B&6)throw Error(h(327));var n=e.callbackNode;if(Kt()&&e.callbackNode!==n)return null;var r=Nr(e,e===X?q:0);if(r===0)return null;if(r&30||r&e.expiredLanes||t)t=Xr(e,r);else{t=r;var l=B;B|=2;var s=Wu();(X!==e||q!==t)&&(je=null,tn=$()+500,wt(e,t));do try{hf();break}catch(i){$u(e,i)}while(!0);ao(),Gr.current=s,B=l,W!==null?t=0:(X=null,q=0,t=G)}if(t!==0){if(t===2&&(l=is(e),l!==0&&(r=l,t=Ts(e,l))),t===1)throw n=Wn,wt(e,0),qe(e,r),fe(e,$()),n;if(t===6)qe(e,r);else{if(l=e.current.alternate,!(r&30)&&!xf(l)&&(t=Xr(e,r),t===2&&(s=is(e),s!==0&&(r=s,t=Ts(e,s))),t===1))throw n=Wn,wt(e,0),qe(e,r),fe(e,$()),n;switch(e.finishedWork=l,e.finishedLanes=r,t){case 0:case 1:throw Error(h(345));case 2:ht(e,ae,je);break;case 3:if(qe(e,r),(r&130023424)===r&&(t=So+500-$(),10<t)){if(Nr(e,0)!==0)break;if(l=e.suspendedLanes,(l&r)!==r){se(),e.pingedLanes|=e.suspendedLanes&l;break}e.timeoutHandle=xs(ht.bind(null,e,ae,je),t);break}ht(e,ae,je);break;case 4:if(qe(e,r),(r&4194240)===r)break;for(t=e.eventTimes,l=-1;0<r;){var o=31-De(r);s=1<<o,o=t[o],o>l&&(l=o),r&=~s}if(r=l,r=$()-r,r=(120>r?120:480>r?480:1080>r?1080:1920>r?1920:3e3>r?3e3:4320>r?4320:1960*mf(r/1960))-r,10<r){e.timeoutHandle=xs(ht.bind(null,e,ae,je),r);break}ht(e,ae,je);break;case 5:ht(e,ae,je);break;default:throw Error(h(329))}}}return fe(e,$()),e.callbackNode===n?Vu.bind(null,e):null}function Ts(e,t){var n=Pn;return e.current.memoizedState.isDehydrated&&(wt(e,t).flags|=256),e=Xr(e,t),e!==2&&(t=ae,ae=n,t!==null&&Rs(t)),e}function Rs(e){ae===null?ae=e:ae.push.apply(ae,e)}function xf(e){for(var t=e;;){if(t.flags&16384){var n=t.updateQueue;if(n!==null&&(n=n.stores,n!==null))for(var r=0;r<n.length;r++){var l=n[r],s=l.getSnapshot;l=l.value;try{if(!Ne(s(),l))return!1}catch{return!1}}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function qe(e,t){for(t&=~ko,t&=~al,e.suspendedLanes|=t,e.pingedLanes&=~t,e=e.expirationTimes;0<t;){var n=31-De(t),r=1<<n;e[n]=-1,t&=~r}}function ji(e){if(B&6)throw Error(h(327));Kt();var t=Nr(e,0);if(!(t&1))return fe(e,$()),null;var n=Xr(e,t);if(e.tag!==0&&n===2){var r=is(e);r!==0&&(t=r,n=Ts(e,r))}if(n===1)throw n=Wn,wt(e,0),qe(e,t),fe(e,$()),n;if(n===6)throw Error(h(345));return e.finishedWork=e.current.alternate,e.finishedLanes=t,ht(e,ae,je),fe(e,$()),null}function Fo(e,t){var n=B;B|=1;try{return e(t)}finally{B=n,B===0&&(tn=$()+500,ll&&pt())}}function Pt(e){et!==null&&et.tag===0&&!(B&6)&&Kt();var t=B;B|=1;var n=Ee.transition,r=N;try{if(Ee.transition=null,N=1,e)return e()}finally{N=r,Ee.transition=n,B=t,!(B&6)&&pt()}}function _o(){pe=Qt.current,T(Qt)}function wt(e,t){e.finishedWork=null,e.finishedLanes=0;var n=e.timeoutHandle;if(n!==-1&&(e.timeoutHandle=-1,$d(n)),W!==null)for(n=W.return;n!==null;){var r=n;switch(so(r),r.tag){case 1:r=r.type.childContextTypes,r!=null&&Or();break;case 3:Jt(),T(ce),T(re),xo();break;case 5:mo(r);break;case 4:Jt();break;case 13:T(j);break;case 19:T(j);break;case 10:uo(r.type._context);break;case 22:case 23:_o()}n=n.return}if(X=e,W=e=at(e.current,null),q=pe=t,G=0,Wn=null,ko=al=_t=0,ae=Pn=null,yt!==null){for(t=0;t<yt.length;t++)if(n=yt[t],r=n.interleaved,r!==null){n.interleaved=null;var l=r.next,s=n.pending;if(s!==null){var o=s.next;s.next=l,r.next=o}n.pending=r}yt=null}return e}function $u(e,t){do{var n=W;try{if(ao(),Er.current=Hr,Wr){for(var r=I.memoizedState;r!==null;){var l=r.queue;l!==null&&(l.pending=null),r=r.next}Wr=!1}if(Ft=0,Y=H=I=null,Fn=!1,Qn=0,Eo.current=null,n===null||n.return===null){G=1,Wn=t,W=null;break}e:{var s=e,o=n.return,i=n,a=t;if(t=q,i.flags|=32768,a!==null&&typeof a=="object"&&typeof a.then=="function"){var c=a,x=i,m=x.tag;if(!(x.mode&1)&&(m===0||m===11||m===15)){var p=x.alternate;p?(x.updateQueue=p.updateQueue,x.memoizedState=p.memoizedState,x.lanes=p.lanes):(x.updateQueue=null,x.memoizedState=null)}var g=Fi(o);if(g!==null){g.flags&=-257,_i(g,o,i,s,t),g.mode&1&&Si(s,c,t),t=g,a=c;var y=t.updateQueue;if(y===null){var C=new Set;C.add(a),t.updateQueue=C}else y.add(a);break e}else{if(!(t&1)){Si(s,c,t),Po();break e}a=Error(h(426))}}else if(O&&i.mode&1){var R=Fi(o);if(R!==null){!(R.flags&65536)&&(R.flags|=256),_i(R,o,i,s,t),oo(en(a,i));break e}}s=a=en(a,i),G!==4&&(G=2),Pn===null?Pn=[s]:Pn.push(s),s=o;do{switch(s.tag){case 3:s.flags|=65536,t&=-t,s.lanes|=t;var d=Pu(s,a,t);gi(s,d);break e;case 1:i=a;var u=s.type,f=s.stateNode;if(!(s.flags&128)&&(typeof u.getDerivedStateFromError=="function"||f!==null&&typeof f.componentDidCatch=="function"&&(ot===null||!ot.has(f)))){s.flags|=65536,t&=-t,s.lanes|=t;var v=bu(s,i,t);gi(s,v);break e}}s=s.return}while(s!==null)}Gu(n)}catch(E){t=E,W===n&&n!==null&&(W=n=n.return);continue}break}while(!0)}function Wu(){var e=Gr.current;return Gr.current=Hr,e===null?Hr:e}function Po(){(G===0||G===3||G===2)&&(G=4),X===null||!(_t&268435455)&&!(al&268435455)||qe(X,q)}function Xr(e,t){var n=B;B|=2;var r=Wu();(X!==e||q!==t)&&(je=null,wt(e,t));do try{vf();break}catch(l){$u(e,l)}while(!0);if(ao(),B=n,Gr.current=r,W!==null)throw Error(h(261));return X=null,q=0,G}function vf(){for(;W!==null;)Hu(W)}function hf(){for(;W!==null&&!Uc();)Hu(W)}function Hu(e){var t=Yu(e.alternate,e,pe);e.memoizedProps=e.pendingProps,t===null?Gu(e):W=t,Eo.current=null}function Gu(e){var t=e;do{var n=t.alternate;if(e=t.return,t.flags&32768){if(n=cf(n,t),n!==null){n.flags&=32767,W=n;return}if(e!==null)e.flags|=32768,e.subtreeFlags=0,e.deletions=null;else{G=6,W=null;return}}else if(n=uf(n,t,pe),n!==null){W=n;return}if(t=t.sibling,t!==null){W=t;return}W=t=e}while(t!==null);G===0&&(G=5)}function ht(e,t,n){var r=N,l=Ee.transition;try{Ee.transition=null,N=1,gf(e,t,n,r)}finally{Ee.transition=l,N=r}return null}function gf(e,t,n,r){do Kt();while(et!==null);if(B&6)throw Error(h(327));n=e.finishedWork;var l=e.finishedLanes;if(n===null)return null;if(e.finishedWork=null,e.finishedLanes=0,n===e.current)throw Error(h(177));e.callbackNode=null,e.callbackPriority=0;var s=n.lanes|n.childLanes;if(Zc(e,s),e===X&&(W=X=null,q=0),!(n.subtreeFlags&2064)&&!(n.flags&2064)||mr||(mr=!0,Xu(Br,function(){return Kt(),null})),s=(n.flags&15990)!==0,n.subtreeFlags&15990||s){s=Ee.transition,Ee.transition=null;var o=N;N=1;var i=B;B|=4,Eo.current=null,ff(e,n),Uu(n,e),Od(ps),Ar=!!fs,ps=fs=null,e.current=n,pf(n),Qc(),B=i,N=o,Ee.transition=s}else e.current=n;if(mr&&(mr=!1,et=e,Yr=l),s=e.pendingLanes,s===0&&(ot=null),Wc(n.stateNode),fe(e,$()),t!==null)for(r=e.onRecoverableError,n=0;n<t.length;n++)l=t[n],r(l.value,{componentStack:l.stack,digest:l.digest});if(Kr)throw Kr=!1,e=As,As=null,e;return Yr&1&&e.tag!==0&&Kt(),s=e.pendingLanes,s&1?e===Ls?bn++:(bn=0,Ls=e):bn=0,pt(),null}function Kt(){if(et!==null){var e=Pa(Yr),t=Ee.transition,n=N;try{if(Ee.transition=null,N=16>e?16:e,et===null)var r=!1;else{if(e=et,et=null,Yr=0,B&6)throw Error(h(331));var l=B;for(B|=4,w=e.current;w!==null;){var s=w,o=s.child;if(w.flags&16){var i=s.deletions;if(i!==null){for(var a=0;a<i.length;a++){var c=i[a];for(w=c;w!==null;){var x=w;switch(x.tag){case 0:case 11:case 15:_n(8,x,s)}var m=x.child;if(m!==null)m.return=x,w=m;else for(;w!==null;){x=w;var p=x.sibling,g=x.return;if(ju(x),x===c){w=null;break}if(p!==null){p.return=g,w=p;break}w=g}}}var y=s.alternate;if(y!==null){var C=y.child;if(C!==null){y.child=null;do{var R=C.sibling;C.sibling=null,C=R}while(C!==null)}}w=s}}if(s.subtreeFlags&2064&&o!==null)o.return=s,w=o;else e:for(;w!==null;){if(s=w,s.flags&2048)switch(s.tag){case 0:case 11:case 15:_n(9,s,s.return)}var d=s.sibling;if(d!==null){d.return=s.return,w=d;break e}w=s.return}}var u=e.current;for(w=u;w!==null;){o=w;var f=o.child;if(o.subtreeFlags&2064&&f!==null)f.return=o,w=f;else e:for(o=u;w!==null;){if(i=w,i.flags&2048)try{switch(i.tag){case 0:case 11:case 15:il(9,i)}}catch(E){U(i,i.return,E)}if(i===o){w=null;break e}var v=i.sibling;if(v!==null){v.return=i.return,w=v;break e}w=i.return}}if(B=l,pt(),Re&&typeof Re.onPostCommitFiberRoot=="function")try{Re.onPostCommitFiberRoot(Jr,e)}catch{}r=!0}return r}finally{N=n,Ee.transition=t}}return!1}function Ii(e,t,n){t=en(n,t),t=Pu(e,t,1),e=st(e,t,1),t=se(),e!==null&&(Gn(e,1,t),fe(e,t))}function U(e,t,n){if(e.tag===3)Ii(e,e,n);else for(;t!==null;){if(t.tag===3){Ii(t,e,n);break}else if(t.tag===1){var r=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&(ot===null||!ot.has(r))){e=en(n,e),e=bu(t,e,1),t=st(t,e,1),e=se(),t!==null&&(Gn(t,1,e),fe(t,e));break}}t=t.return}}function yf(e,t,n){var r=e.pingCache;r!==null&&r.delete(t),t=se(),e.pingedLanes|=e.suspendedLanes&n,X===e&&(q&n)===n&&(G===4||G===3&&(q&130023424)===q&&500>$()-So?wt(e,0):ko|=n),fe(e,t)}function Ku(e,t){t===0&&(e.mode&1?(t=lr,lr<<=1,!(lr&130023424)&&(lr=4194304)):t=1);var n=se();e=We(e,t),e!==null&&(Gn(e,t,n),fe(e,n))}function Cf(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),Ku(e,n)}function wf(e,t){var n=0;switch(e.tag){case 13:var r=e.stateNode,l=e.memoizedState;l!==null&&(n=l.retryLane);break;case 19:r=e.stateNode;break;default:throw Error(h(314))}r!==null&&r.delete(t),Ku(e,n)}var Yu;Yu=function(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps||ce.current)ue=!0;else{if(!(e.lanes&n)&&!(t.flags&128))return ue=!1,af(e,t,n);ue=!!(e.flags&131072)}else ue=!1,O&&t.flags&1048576&&Ja(t,Mr,t.index);switch(t.lanes=0,t.tag){case 2:var r=t.type;Sr(e,t),e=t.pendingProps;var l=Xt(t,re.current);Gt(t,n),l=ho(null,t,r,e,l,n);var s=go();return t.flags|=1,typeof l=="object"&&l!==null&&typeof l.render=="function"&&l.$$typeof===void 0?(t.tag=1,t.memoizedState=null,t.updateQueue=null,de(r)?(s=!0,jr(t)):s=!1,t.memoizedState=l.state!==null&&l.state!==void 0?l.state:null,fo(t),l.updater=ol,t.stateNode=l,l._reactInternals=t,Es(t,r,e,n),t=Fs(null,t,r,!0,s,n)):(t.tag=0,O&&s&&lo(t),le(null,t,l,n),t=t.child),t;case 16:r=t.elementType;e:{switch(Sr(e,t),e=t.pendingProps,l=r._init,r=l(r._payload),t.type=r,l=t.tag=kf(r),e=Pe(r,e),l){case 0:t=Ss(null,t,r,e,n);break e;case 1:t=zi(null,t,r,e,n);break e;case 11:t=Pi(null,t,r,e,n);break e;case 14:t=bi(null,t,r,Pe(r.type,e),n);break e}throw Error(h(306,r,""))}return t;case 0:return r=t.type,l=t.pendingProps,l=t.elementType===r?l:Pe(r,l),Ss(e,t,r,l,n);case 1:return r=t.type,l=t.pendingProps,l=t.elementType===r?l:Pe(r,l),zi(e,t,r,l,n);case 3:e:{if(Nu(t),e===null)throw Error(h(387));r=t.pendingProps,s=t.memoizedState,l=s.element,su(e,t),Vr(t,r,null,n);var o=t.memoizedState;if(r=o.element,s.isDehydrated)if(s={element:r,isDehydrated:!1,cache:o.cache,pendingSuspenseBoundaries:o.pendingSuspenseBoundaries,transitions:o.transitions},t.updateQueue.baseState=s,t.memoizedState=s,t.flags&256){l=en(Error(h(423)),t),t=Di(e,t,r,n,l);break e}else if(r!==l){l=en(Error(h(424)),t),t=Di(e,t,r,n,l);break e}else for(me=lt(t.stateNode.containerInfo.firstChild),xe=t,O=!0,ze=null,n=ru(t,null,r,n),t.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling;else{if(Zt(),r===l){t=He(e,t,n);break e}le(e,t,r,n)}t=t.child}return t;case 5:return ou(t),e===null&&ys(t),r=t.type,l=t.pendingProps,s=e!==null?e.memoizedProps:null,o=l.children,ms(r,l)?o=null:s!==null&&ms(r,s)&&(t.flags|=32),Bu(e,t),le(e,t,o,n),t.child;case 6:return e===null&&ys(t),null;case 13:return Au(e,t,n);case 4:return po(t,t.stateNode.containerInfo),r=t.pendingProps,e===null?t.child=qt(t,null,r,n):le(e,t,r,n),t.child;case 11:return r=t.type,l=t.pendingProps,l=t.elementType===r?l:Pe(r,l),Pi(e,t,r,l,n);case 7:return le(e,t,t.pendingProps,n),t.child;case 8:return le(e,t,t.pendingProps.children,n),t.child;case 12:return le(e,t,t.pendingProps.children,n),t.child;case 10:e:{if(r=t.type._context,l=t.pendingProps,s=t.memoizedProps,o=l.value,A(Ur,r._currentValue),r._currentValue=o,s!==null)if(Ne(s.value,o)){if(s.children===l.children&&!ce.current){t=He(e,t,n);break e}}else for(s=t.child,s!==null&&(s.return=t);s!==null;){var i=s.dependencies;if(i!==null){o=s.child;for(var a=i.firstContext;a!==null;){if(a.context===r){if(s.tag===1){a=Qe(-1,n&-n),a.tag=2;var c=s.updateQueue;if(c!==null){c=c.shared;var x=c.pending;x===null?a.next=a:(a.next=x.next,x.next=a),c.pending=a}}s.lanes|=n,a=s.alternate,a!==null&&(a.lanes|=n),Cs(s.return,n,t),i.lanes|=n;break}a=a.next}}else if(s.tag===10)o=s.type===t.type?null:s.child;else if(s.tag===18){if(o=s.return,o===null)throw Error(h(341));o.lanes|=n,i=o.alternate,i!==null&&(i.lanes|=n),Cs(o,n,t),o=s.sibling}else o=s.child;if(o!==null)o.return=s;else for(o=s;o!==null;){if(o===t){o=null;break}if(s=o.sibling,s!==null){s.return=o.return,o=s;break}o=o.return}s=o}le(e,t,l.children,n),t=t.child}return t;case 9:return l=t.type,r=t.pendingProps.children,Gt(t,n),l=ke(l),r=r(l),t.flags|=1,le(e,t,r,n),t.child;case 14:return r=t.type,l=Pe(r,t.pendingProps),l=Pe(r.type,l),bi(e,t,r,l,n);case 15:return zu(e,t,t.type,t.pendingProps,n);case 17:return r=t.type,l=t.pendingProps,l=t.elementType===r?l:Pe(r,l),Sr(e,t),t.tag=1,de(r)?(e=!0,jr(t)):e=!1,Gt(t,n),_u(t,r,l),Es(t,r,l,n),Fs(null,t,r,!0,e,n);case 19:return Lu(e,t,n);case 22:return Du(e,t,n)}throw Error(h(156,t.tag))};function Xu(e,t){return ka(e,t)}function Ef(e,t,n,r){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function we(e,t,n,r){return new Ef(e,t,n,r)}function bo(e){return e=e.prototype,!(!e||!e.isReactComponent)}function kf(e){if(typeof e=="function")return bo(e)?1:0;if(e!=null){if(e=e.$$typeof,e===Hs)return 11;if(e===Gs)return 14}return 2}function at(e,t){var n=e.alternate;return n===null?(n=we(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&14680064,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n}function Pr(e,t,n,r,l,s){var o=2;if(r=e,typeof e=="function")bo(e)&&(o=1);else if(typeof e=="string")o=5;else e:switch(e){case Nt:return Et(n.children,l,s,t);case Ws:o=8,l|=8;break;case Hl:return e=we(12,n,t,l|2),e.elementType=Hl,e.lanes=s,e;case Gl:return e=we(13,n,t,l),e.elementType=Gl,e.lanes=s,e;case Kl:return e=we(19,n,t,l),e.elementType=Kl,e.lanes=s,e;case oa:return ul(n,l,s,t);default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case la:o=10;break e;case sa:o=9;break e;case Hs:o=11;break e;case Gs:o=14;break e;case Ye:o=16,r=null;break e}throw Error(h(130,e==null?e:typeof e,""))}return t=we(o,n,t,l),t.elementType=e,t.type=r,t.lanes=s,t}function Et(e,t,n,r){return e=we(7,e,r,t),e.lanes=n,e}function ul(e,t,n,r){return e=we(22,e,r,t),e.elementType=oa,e.lanes=n,e.stateNode={isHidden:!1},e}function Ul(e,t,n){return e=we(6,e,null,t),e.lanes=n,e}function Ql(e,t,n){return t=we(4,e.children!==null?e.children:[],e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}function Sf(e,t,n,r,l){this.tag=t,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=El(0),this.expirationTimes=El(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=El(0),this.identifierPrefix=r,this.onRecoverableError=l,this.mutableSourceEagerHydrationData=null}function zo(e,t,n,r,l,s,o,i,a){return e=new Sf(e,t,n,i,a),t===1?(t=1,s===!0&&(t|=8)):t=0,s=we(3,null,null,t),e.current=s,s.stateNode=e,s.memoizedState={element:r,isDehydrated:n,cache:null,transitions:null,pendingSuspenseBoundaries:null},fo(s),e}function Ff(e,t,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:Bt,key:r==null?null:""+r,children:e,containerInfo:t,implementation:n}}function Zu(e){if(!e)return ct;e=e._reactInternals;e:{if(zt(e)!==e||e.tag!==1)throw Error(h(170));var t=e;do{switch(t.tag){case 3:t=t.stateNode.context;break e;case 1:if(de(t.type)){t=t.stateNode.__reactInternalMemoizedMergedChildContext;break e}}t=t.return}while(t!==null);throw Error(h(171))}if(e.tag===1){var n=e.type;if(de(n))return Za(e,n,t)}return t}function qu(e,t,n,r,l,s,o,i,a){return e=zo(n,r,!0,e,l,s,o,i,a),e.context=Zu(null),n=e.current,r=se(),l=it(n),s=Qe(r,l),s.callback=t??null,st(n,s,l),e.current.lanes=l,Gn(e,l,r),fe(e,r),e}function cl(e,t,n,r){var l=t.current,s=se(),o=it(l);return n=Zu(n),t.context===null?t.context=n:t.pendingContext=n,t=Qe(s,o),t.payload={element:e},r=r===void 0?null:r,r!==null&&(t.callback=r),e=st(l,t,o),e!==null&&(Be(e,l,o,s),wr(e,l,o)),o}function Zr(e){if(e=e.current,!e.child)return null;switch(e.child.tag){case 5:return e.child.stateNode;default:return e.child.stateNode}}function Mi(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function Do(e,t){Mi(e,t),(e=e.alternate)&&Mi(e,t)}function _f(){return null}var Ju=typeof reportError=="function"?reportError:function(e){console.error(e)};function Bo(e){this._internalRoot=e}dl.prototype.render=Bo.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(h(409));cl(e,t,null,null)};dl.prototype.unmount=Bo.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;Pt(function(){cl(null,e,null,null)}),t[$e]=null}};function dl(e){this._internalRoot=e}dl.prototype.unstable_scheduleHydration=function(e){if(e){var t=Da();e={blockedOn:null,target:e,priority:t};for(var n=0;n<Ze.length&&t!==0&&t<Ze[n].priority;n++);Ze.splice(n,0,e),n===0&&Na(e)}};function No(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function fl(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==" react-mount-point-unstable "))}function Ui(){}function Pf(e,t,n,r,l){if(l){if(typeof r=="function"){var s=r;r=function(){var c=Zr(o);s.call(c)}}var o=qu(t,r,e,0,null,!1,!1,"",Ui);return e._reactRootContainer=o,e[$e]=o.current,On(e.nodeType===8?e.parentNode:e),Pt(),o}for(;l=e.lastChild;)e.removeChild(l);if(typeof r=="function"){var i=r;r=function(){var c=Zr(a);i.call(c)}}var a=zo(e,0,!1,null,null,!1,!1,"",Ui);return e._reactRootContainer=a,e[$e]=a.current,On(e.nodeType===8?e.parentNode:e),Pt(function(){cl(t,a,n,r)}),a}function pl(e,t,n,r,l){var s=n._reactRootContainer;if(s){var o=s;if(typeof l=="function"){var i=l;l=function(){var a=Zr(o);i.call(a)}}cl(t,o,e,l)}else o=Pf(n,t,e,l,r);return Zr(o)}ba=function(e){switch(e.tag){case 3:var t=e.stateNode;if(t.current.memoizedState.isDehydrated){var n=gn(t.pendingLanes);n!==0&&(Xs(t,n|1),fe(t,$()),!(B&6)&&(tn=$()+500,pt()))}break;case 13:Pt(function(){var r=We(e,1);if(r!==null){var l=se();Be(r,e,1,l)}}),Do(e,1)}};Zs=function(e){if(e.tag===13){var t=We(e,134217728);if(t!==null){var n=se();Be(t,e,134217728,n)}Do(e,134217728)}};za=function(e){if(e.tag===13){var t=it(e),n=We(e,t);if(n!==null){var r=se();Be(n,e,t,r)}Do(e,t)}};Da=function(){return N};Ba=function(e,t){var n=N;try{return N=e,t()}finally{N=n}};ls=function(e,t,n){switch(t){case"input":if(Zl(e,n),t=n.name,n.type==="radio"&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll("input[name="+JSON.stringify(""+t)+'][type="radio"]'),t=0;t<n.length;t++){var r=n[t];if(r!==e&&r.form===e.form){var l=rl(r);if(!l)throw Error(h(90));aa(r),Zl(r,l)}}}break;case"textarea":ca(e,n);break;case"select":t=n.value,t!=null&&Vt(e,!!n.multiple,t,!1)}};ha=Fo;ga=Pt;var bf={usingClientEntryPoint:!1,Events:[Yn,Rt,rl,xa,va,Fo]},xn={findFiberByHostInstance:gt,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},zf={bundleType:xn.bundleType,version:xn.version,rendererPackageName:xn.rendererPackageName,rendererConfig:xn.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:Ge.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return e=wa(e),e===null?null:e.stateNode},findFiberByHostInstance:xn.findFiberByHostInstance||_f,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var xr=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!xr.isDisabled&&xr.supportsFiber)try{Jr=xr.inject(zf),Re=xr}catch{}}he.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=bf;he.createPortal=function(e,t){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!No(t))throw Error(h(200));return Ff(e,t,null,n)};he.createRoot=function(e,t){if(!No(e))throw Error(h(299));var n=!1,r="",l=Ju;return t!=null&&(t.unstable_strictMode===!0&&(n=!0),t.identifierPrefix!==void 0&&(r=t.identifierPrefix),t.onRecoverableError!==void 0&&(l=t.onRecoverableError)),t=zo(e,1,!1,null,null,n,!1,r,l),e[$e]=t.current,On(e.nodeType===8?e.parentNode:e),new Bo(t)};he.findDOMNode=function(e){if(e==null)return null;if(e.nodeType===1)return e;var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(h(188)):(e=Object.keys(e).join(","),Error(h(268,e)));return e=wa(t),e=e===null?null:e.stateNode,e};he.flushSync=function(e){return Pt(e)};he.hydrate=function(e,t,n){if(!fl(t))throw Error(h(200));return pl(null,e,t,!0,n)};he.hydrateRoot=function(e,t,n){if(!No(e))throw Error(h(405));var r=n!=null&&n.hydratedSources||null,l=!1,s="",o=Ju;if(n!=null&&(n.unstable_strictMode===!0&&(l=!0),n.identifierPrefix!==void 0&&(s=n.identifierPrefix),n.onRecoverableError!==void 0&&(o=n.onRecoverableError)),t=qu(t,null,e,1,n??null,l,!1,s,o),e[$e]=t.current,On(e),r)for(e=0;e<r.length;e++)n=r[e],l=n._getVersion,l=l(n._source),t.mutableSourceEagerHydrationData==null?t.mutableSourceEagerHydrationData=[n,l]:t.mutableSourceEagerHydrationData.push(n,l);return new dl(t)};he.render=function(e,t,n){if(!fl(t))throw Error(h(200));return pl(null,e,t,!1,n)};he.unmountComponentAtNode=function(e){if(!fl(e))throw Error(h(40));return e._reactRootContainer?(Pt(function(){pl(null,null,e,!1,function(){e._reactRootContainer=null,e[$e]=null})}),!0):!1};he.unstable_batchedUpdates=Fo;he.unstable_renderSubtreeIntoContainer=function(e,t,n,r){if(!fl(n))throw Error(h(200));if(e==null||e._reactInternals===void 0)throw Error(h(38));return pl(e,t,n,!1,r)};he.version="18.3.1-next-f1338f8080-20240426";function ec(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(ec)}catch(e){console.error(e)}}ec(),ea.exports=he;var Df=ea.exports,Qi=Df;$l.createRoot=Qi.createRoot,$l.hydrateRoot=Qi.hydrateRoot;const Bf=`<svg class="inline-defs-container" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden"></svg>



<!-- 1. NAVBAR -->
<header class="sticky top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-[#E6EBF0] shadow-[0_2px_12px_rgba(36,60,76,0.04)]">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
<!-- Logo Oficial -->
<a class="flex items-center gap-2 transition-transform hover:scale-[1.02]" href="#">
<img alt="FlowCommerce" class="h-8 sm:h-9 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSVA639-ifhCTJC2SHIn9lRBomVpzWTcoWuAJNO3ewk_7So1fXXwbglVzIMAN6DOIkyYXSkDidnhc_eGFSiJU3Ld6aL60CZ3OSgxnLlOFxz4FRek1QAopqcky6acPoVAqcv7ZWKRlZ6lG3d0h7DU-ZSbPgUtoWInI1bWCd8esbW6r2TLBzdE9ZV75qd-POKuQAcFoe1Kev0K-IYK8QcBlzG4Kbksgmd3Hh_RqS8aF7cRhPo6sZTmymJdaH5Rsb16iIZQ">
</a>
<!-- Navegación Central -->
<nav class="hidden lg:flex items-center gap-1 xl:gap-2">
<a class="px-3 py-2 text-sm font-medium text-[#243C4C]/80 hover:text-[#1F609C] hover:bg-[#E6EBF0]/50 rounded-lg transition-colors" href="#como-funciona">¿Cómo funciona?</a>
<a class="px-3 py-2 text-sm font-medium text-[#243C4C]/80 hover:text-[#1F609C] hover:bg-[#E6EBF0]/50 rounded-lg transition-colors" href="#beneficios">Beneficios</a>
<a class="px-3 py-2 text-sm font-medium text-[#243C4C]/80 hover:text-[#1F609C] hover:bg-[#E6EBF0]/50 rounded-lg transition-colors" href="#soluciones">Soluciones</a>
<a class="px-3 py-2 text-sm font-medium text-[#243C4C]/80 hover:text-[#1F609C] hover:bg-[#E6EBF0]/50 rounded-lg transition-colors" href="#planes">Precios</a>
<a class="px-3 py-2 text-sm font-medium text-[#243C4C]/80 hover:text-[#1F609C] hover:bg-[#E6EBF0]/50 rounded-lg transition-colors" href="#complementos">Complementos</a>
<a class="px-3 py-2 text-sm font-medium text-[#243C4C]/80 hover:text-[#1F609C] hover:bg-[#E6EBF0]/50 rounded-lg transition-colors" href="#faq">FAQ</a>
</nav>
<!-- Botones de Acción Derecha -->
<div class="flex items-center gap-3">
<a class="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold text-[#1F609C] hover:text-[#243C4C] hover:bg-[#E6EBF0]/60 rounded-lg transition-colors" href="/login">
          Iniciar Sesión
        </a>
<a class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1F609C] hover:bg-[#243C4C] rounded-lg shadow-sm hover:shadow transition-all" href="/registro">
<span class="">Comenzar gratis</span>
<span class="material-symbols-outlined text-[18px]">arrow_forward</span>
</a>
</div>
</div>
</header>
<main class="w-full">
<!-- 2. HERO / SECCIÓN PRINCIPAL -->
<section class="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9]/60 to-[#F8FAFC]">
<!-- Luces ambientales de fondo -->
<div class="absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-gradient-to-r from-[#1F609C]/10 via-[#5289AD]/15 to-[#4B8D4B]/15 blur-3xl pointer-events-none -z-10 rounded-full"></div>
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div class="flex flex-col items-center text-center max-w-4xl mx-auto mb-14">
<!-- Eyebrow Badge -->
<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E6EBF0] text-[#1F609C] font-mono-num text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
<span class="w-2 h-2 rounded-full bg-[#4B8D4B] animate-pulse"></span>
            CRM COMERCIAL · VENTAS ÁGILES · GUATEMALA Y LATAM
          </div>
<!-- Título principal H1 exacto con degradado azul y verde -->
<h1 class="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#243C4C] tracking-tight mb-6 leading-tight">
            Automatiza tus ventas. Desde la cotización hasta el <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#1F609C] via-[#5289AD] to-[#4B8D4B]">pago</span>.
          </h1>
<!-- Subtítulo exacto -->
<p class="text-base sm:text-xl text-[#243C4C]/80 max-w-2xl mb-8 leading-relaxed font-normal">
            FlowCommerce centraliza clientes, cotizaciones, seguimiento y pagos en una sola plataforma.
          </p>
<!-- Botones CTA -->
<div class="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
<a class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-lg bg-[#1F609C] text-white font-semibold text-base shadow-md hover:bg-[#243C4C] hover:shadow-lg transition-all transform hover:-translate-y-0.5" href="/registro">
<span class="">Comenzar gratis</span>
<span class="material-symbols-outlined text-[20px]">arrow_forward</span>
</a>
<a class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-white border border-[#E6EBF0] text-[#243C4C] font-semibold text-base shadow-sm hover:bg-[#E6EBF0]/50 transition-all" href="#planes">
<span class="">Ver planes</span>
<span class="material-symbols-outlined text-[20px] text-[#5289AD]">payments</span>
</a>
</div>
<!-- Micro-garantías -->
<div class="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-8 text-sm text-[#243C4C]/75 font-medium">
<div class="flex items-center gap-1.5">
<span class="material-symbols-outlined text-[#4B8D4B] text-[18px]">verified</span>
<span class="">Sin tarjeta de crédito requerida</span>
</div>
<div class="flex items-center gap-1.5">
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">bolt</span>
<span class="">Onboarding en 2 minutos</span>
</div>
<div class="flex items-center gap-1.5">
<span class="material-symbols-outlined text-[#5289AD] text-[18px]">lock</span>
<span class="">Cifrado bancario 256-Bit</span>
</div>
</div>
</div>
<!-- COTIZACIÓN EN EL HERO -->
<div class="w-full max-w-5xl mx-auto rounded-2xl bg-white border border-[#E6EBF0] shadow-2xl shadow-[#243C4C]/8 overflow-hidden">

  <!-- Encabezado -->
  <div class="bg-[#243C4C] p-5 sm:p-6 text-white flex flex-wrap justify-between items-center gap-4">
    <div>
      <p class="text-[#D9EAD7] text-xs font-semibold tracking-widest">
        FLOWCOMMERCE · COTIZACIÓN
      </p>
      <h3 class="text-2xl sm:text-3xl font-bold mt-2">
        COT-2026-0148
      </h3>
      <p class="text-slate-300 text-xs mt-2 font-semibold">
        ENVIADA AL CLIENTE
      </p>
    </div>

    <div class="text-sm text-slate-200">
      <p>Fecha: <strong class="text-white">27/11/2026</strong></p>
      <p class="mt-2">Vencimiento: <strong class="text-white">07/12/2026</strong></p>
    </div>
  </div>

  <div class="p-5 sm:p-7">

    <!-- Datos de las empresas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">

      <div>
        <p class="text-xs uppercase tracking-widest text-[#5289AD] font-bold mb-2">
          Emitido por
        </p>
        <h4 class="font-bold text-[#243C4C]">
          Distribuidora Comercial GT
        </h4>
        <p class="text-sm text-[#243C4C]/70 mt-1">
          Ciudad de Guatemala
        </p>
        <p class="text-sm text-[#243C4C]/70">
          ventas@distribuidora.gt
        </p>
      </div>

      <div>
        <p class="text-xs uppercase tracking-widest text-[#5289AD] font-bold mb-2">
          Cotizado para
        </p>
        <h4 class="font-bold text-[#243C4C]">
          Comercializadora Los Pinos
        </h4>
        <p class="text-sm text-[#243C4C]/70 mt-1">
          Atención: María López
        </p>
        <p class="text-sm text-[#243C4C]/70">
          Ciudad de Guatemala
        </p>
      </div>

    </div>

    <!-- Tabla de productos -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-[#F8FAFC] text-[#243C4C]/70">
            <th class="p-3 text-left">Descripción</th>
            <th class="p-3 text-center">Cant.</th>
            <th class="p-3 text-right">Precio</th>
            <th class="p-3 text-right">Total</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-[#E6EBF0] text-[#243C4C]">
          <tr>
            <td class="p-3 font-medium">Impresoras multifuncionales</td>
            <td class="p-3 text-center">2</td>
            <td class="p-3 text-right">Q1,850.00</td>
            <td class="p-3 text-right font-semibold">Q3,700.00</td>
          </tr>

          <tr>
            <td class="p-3 font-medium">Resmas papel carta</td>
            <td class="p-3 text-center">10</td>
            <td class="p-3 text-right">Q42.00</td>
            <td class="p-3 text-right font-semibold">Q420.00</td>
          </tr>

          <tr>
            <td class="p-3 font-medium">Cartuchos de tinta</td>
            <td class="p-3 text-center">4</td>
            <td class="p-3 text-right">Q185.00</td>
            <td class="p-3 text-right font-semibold">Q740.00</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Totales -->
    <div class="mt-6 border-t border-[#E6EBF0] pt-5 max-w-sm ml-auto">

      <div class="flex justify-between text-sm text-[#243C4C]/70 mb-2">
        <span>Subtotal</span>
        <span>Q4,860.00</span>
      </div>

      <div class="flex justify-between text-sm text-[#243C4C]/70 mb-4">
        <span>IVA (12%)</span>
        <span>Q583.20</span>
      </div>

      <div class="border-t border-[#E6EBF0] pt-4 flex justify-between items-center gap-3">
        <span class="font-bold text-[#243C4C]">Total</span>
        <span class="text-xl sm:text-2xl font-extrabold text-[#1F609C]">
          Q5,443.20
        </span>
      </div>

    </div>

    <!-- Enlace de pago -->
    <div class="mt-6 bg-[#E6EBF0]/50 rounded-xl p-4 sm:p-5 flex flex-wrap justify-between items-center gap-4">
      <div>
        <p class="font-bold text-[#243C4C]">
          ¿Listo para realizar el pago?
        </p>
        <p class="text-sm text-[#243C4C]/70 mt-1">
          La cotización incluye un enlace de pago seguro.
        </p>
      </div>

      <div class="inline-flex items-center justify-center gap-2 bg-[#1F609C] text-white px-5 py-3 rounded-lg font-bold text-sm">
        <span class="material-symbols-outlined text-[18px]">lock</span>
        Smart Link de pago
      </div>
    </div>

  </div>
</div>
</section>
<!-- 3. PROBLEMA / NECESIDAD COMERCIAL -->
<section class="py-20 bg-white border-y border-[#E6EBF0]">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div class="text-center max-w-3xl mx-auto mb-16">
<span class="font-mono-num text-xs font-bold tracking-widest text-[#5289AD] uppercase block mb-3">PUNTOS DE DOLOR EN VENTAS</span>
<h2 class="text-3xl sm:text-4xl font-bold text-[#243C4C] mb-4">
            ¿Pierdes ventas por falta de seguimiento y procesos manuales?
          </h2>
<p class="text-base sm:text-lg text-[#243C4C]/75">
            El 70% de las oportunidades de venta no se cierran porque las cotizaciones tardan demasiado o los prospectos quedan en el olvido entre mensajes dispersos.
          </p>
</div>
<!-- Comparativa Visual: Caos vs FlowCommerce -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
<!-- El Caos Tradicional -->
<div class="p-8 rounded-2xl bg-[#FFF5F5] border border-red-200/80 flex flex-col justify-between">
<div>
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 font-mono-num text-xs font-semibold mb-6">
<span class="material-symbols-outlined text-[16px]">close</span> MÉTODO TRADICIONAL DISPERSO
              </div>
<h3 class="text-xl font-bold text-red-950 mb-4">El costo de la fricción comercial</h3>
<ul class="space-y-4 text-sm text-red-900/80">
<li class="flex items-start gap-3">
<span class="material-symbols-outlined text-red-500 mt-0.5 text-[20px] shrink-0">cancel</span>
<span class=""><strong>Cotizaciones lentas en PDF:</strong> Tardas horas diseñando propuestas en Excel o Word que se desconfiguran o se pierden en correos.</span>
</li>
<li class="flex items-start gap-3">
<span class="material-symbols-outlined text-red-500 mt-0.5 text-[20px] shrink-0">cancel</span>
<span class=""><strong>Chats de WhatsApp sin control:</strong> Decenas de prospectos olvidados sin recordatorio ni seguimiento estructurado de cobranza.</span>
</li>
<li class="flex items-start gap-3">
<span class="material-symbols-outlined text-red-500 mt-0.5 text-[20px] shrink-0">cancel</span>
<span class=""><strong>Cobros tardíos y facturas vencidas:</strong> Solicitar transferencias bancarias y esperar comprobantes manuales atrasa el flujo de caja.</span>
</li>
</ul>
</div>
<div class="mt-8 pt-4 border-t border-red-200 text-xs font-mono-num text-red-700 font-semibold">
              Resultado: Pérdida de hasta un 38% del pipeline mensual y clientes insatisfechos.
            </div>
</div>
<!-- La Velocidad con FlowCommerce -->
<div class="p-8 rounded-2xl bg-[#F0FDF4] border border-[#76B37A]/50 flex flex-col justify-between shadow-sm">
<div>
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D9EAD7] text-[#4B8D4B] font-mono-num text-xs font-semibold mb-6">
<span class="material-symbols-outlined text-[16px]">check_circle</span> CON FLOWCOMMERCE
              </div>
<h3 class="text-xl font-bold text-[#243C4C] mb-4">Velocidad, orden y cierres ágiles</h3>
<ul class="space-y-4 text-sm text-[#243C4C]/85">
<li class="flex items-start gap-3">
<span class="material-symbols-outlined text-[#4B8D4B] mt-0.5 text-[20px] shrink-0">check_circle</span>
<span class=""><strong>Cotizaciones generadas en segundos:</strong> Emite cotizaciones profesionales con cálculo automático y en Quetzales (Q).</span>
</li>
<li class="flex items-start gap-3">
<span class="material-symbols-outlined text-[#4B8D4B] mt-0.5 text-[20px] shrink-0">check_circle</span>
<span class=""><strong>Pipeline y alertas proactivas:</strong> Todo prospecto clasificado por etapa con historial y recordatorios automáticos de contacto.</span>
</li>
<li class="flex items-start gap-3">
<span class="material-symbols-outlined text-[#4B8D4B] mt-0.5 text-[20px] shrink-0">check_circle</span>
<span class=""><strong>Smart Links de pago directos:</strong> Tu cliente aprueba y paga al instante con tarjeta de crédito o débito de forma 100% segura.</span>
</li>
</ul>
</div>
<div class="mt-8 pt-4 border-t border-[#76B37A]/30 text-xs font-mono-num text-[#4B8D4B] font-semibold">
              Resultado: +300% de rapidez operativa y hasta 40% de incremento en conversiones de pago.
            </div>
</div>
</div>
</div>
</section>
<!-- 4. SOLUCIÓN FLOWCOMMERCE -->
<section class="py-20 bg-[#F8FAFC]" id="soluciones">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
<div class="lg:col-span-6 space-y-6">
<span class="font-mono-num text-xs font-bold tracking-widest text-[#1F609C] uppercase block">LA PLATAFORMA INTEGRAL</span>
<h2 class="text-3xl sm:text-4xl font-bold text-[#243C4C] leading-snug">
              La suite comercial que acompaña cada etapa de tu ciclo de venta
            </h2>
<p class="text-base sm:text-lg text-[#243C4C]/80 leading-relaxed">
              FlowCommerce reúne en un entorno unificado todo lo que tu equipo necesita: cotiza en menos de 30 segundos, visualiza con precisión en qué fase se encuentra cada cliente potencial y habilita pagos inmediatos mediante Smart Links seguros.
            </p>
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
<div class="p-4 rounded-xl bg-white border border-[#E6EBF0]">
<div class="w-10 h-10 rounded-lg bg-[#E6EBF0] text-[#1F609C] flex items-center justify-center mb-3">
<span class="material-symbols-outlined text-[22px]">timer</span>
</div>
<h4 class="font-bold text-sm text-[#243C4C] mb-1">Cotizaciones en 30s</h4>
<p class="text-xs text-[#243C4C]/70">Genera propuestas formales desde tu celular o computadora sin errores de cálculo.</p>
</div>
<div class="p-4 rounded-xl bg-white border border-[#E6EBF0]">
<div class="w-10 h-10 rounded-lg bg-[#D9EAD7] text-[#4B8D4B] flex items-center justify-center mb-3">
<span class="material-symbols-outlined text-[22px]">credit_card</span>
</div>
<h4 class="font-bold text-sm text-[#243C4C] mb-1">Pagos con Smart Links</h4>
<p class="text-xs text-[#243C4C]/70">El cliente recibe su cotización con botón de pago integrado en Quetzales (Q).</p>
</div>
</div>
</div>
<div class="lg:col-span-6">
<div class="p-6 sm:p-8 rounded-2xl bg-white border border-[#E6EBF0] shadow-xl relative">
<div class="flex items-center justify-between pb-4 mb-4 border-b border-[#E6EBF0]">
<div class="flex items-center gap-2">
<span class="w-3 h-3 rounded-full bg-[#1F609C]"></span>
<span class="font-bold text-sm text-[#243C4C]">Cotización Dinámica #FC-2026-89</span>
</div>
<span class="font-mono-num text-xs font-semibold px-2.5 py-1 rounded-full bg-[#D9EAD7] text-[#4B8D4B]">Lista para cobro</span>
</div>
<div class="space-y-3 mb-6 font-body text-sm">
<div class="flex justify-between py-1 text-[#243C4C]/80">
<span class="">Cliente: Corporación Agropecuaria del Sur</span>
<span class="font-mono-num text-xs font-semibold text-[#1F609C]">NIT: 928374-1</span>
</div>
<div class="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6EBF0] space-y-2">
<div class="flex justify-between text-xs">
<span class="">1x Plan Anual Equipos B2B (Licencias 12m)</span>
<span class="font-mono-num font-semibold text-[#243C4C]">Q 18,500.00</span>
</div>
<div class="flex justify-between text-xs">
<span class="">1x Módulo Onboarding &amp; Implementación</span>
<span class="font-mono-num font-semibold text-[#243C4C]">Q 4,200.00</span>
</div>
<div class="flex justify-between text-xs text-[#4B8D4B] font-medium">
<span class="">Descuento Comercial Pago Inmediato</span>
<span class="font-mono-num font-semibold">- Q 1,200.00</span>
</div>
</div>
<div class="flex justify-between text-base font-bold text-[#243C4C] pt-1">
<span class="">Total a Pagar:</span>
<span class="font-mono-num text-xl text-[#1F609C]">Q 21,500.00</span>
</div>
</div>
<div class="p-4 rounded-xl bg-gradient-to-r from-[#1F609C] to-[#243C4C] text-white flex items-center justify-between">
<div>
<span class="text-xs uppercase font-mono-num opacity-80 block">Link de pago bancario</span>
<span class="font-semibold text-sm">Pagar vía Smart Link</span>
</div>
<div class="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg text-xs font-mono-num">
<span class="material-symbols-outlined text-[16px]">lock</span> 256-Bit SSL
                </div>
</div>
</div>
</div>
</div>
</div>
</section>
<!-- 5. CÓMO FUNCIONA FLOWCOMMERCE (Flujo visual paso a paso) -->
<section class="py-20 bg-white border-t border-[#E6EBF0]" id="como-funciona">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div class="text-center max-w-3xl mx-auto mb-16">
<span class="font-mono-num text-xs font-bold tracking-widest text-[#4B8D4B] uppercase block mb-3">FLUJO ÁGIL Y TRANSPARENTE</span>
<h2 class="text-3xl sm:text-4xl font-bold text-[#243C4C] mb-4">
            ¿Cómo funciona FlowCommerce?
          </h2>
<p class="text-base sm:text-lg text-[#243C4C]/75">
            Cinco pasos sencillos para transformar solicitudes en ingresos confirmados en tu cuenta bancaria.
          </p>
<!-- Barra de Proceso Sintetizada -->
<div class="mt-8 py-3 px-4 rounded-xl bg-[#F8FAFC] border border-[#E6EBF0] inline-flex items-center flex-wrap justify-center gap-2 text-xs sm:text-sm font-semibold text-[#243C4C]">
<span class="text-[#1F609C]">Solicitud</span>
<span class="text-[#5289AD]">→</span>
<span class="text-[#1F609C]">Cotización</span>
<span class="text-[#5289AD]">→</span>
<span class="text-[#1F609C]">Seguimiento</span>
<span class="text-[#5289AD]">→</span>
<span class="text-[#1F609C]">Link de pago</span>
<span class="text-[#5289AD]">→</span>
<span class="text-[#4B8D4B] font-bold">Venta</span>
</div>
</div>
<!-- 5 Pasos con conectores y tarjetas -->
<div class="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
<!-- Paso 01 -->
<div class="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] hover:border-[#1F609C]/50 transition-all flex flex-col justify-between relative group">
<div>
<div class="flex items-center justify-between mb-4">
<span class="font-mono-num text-xl font-bold text-[#1F609C]">01</span>
<span class="w-10 h-10 rounded-lg bg-[#E6EBF0] text-[#1F609C] flex items-center justify-center">
<span class="material-symbols-outlined text-[20px]">person_add</span>
</span>
</div>
<h3 class="font-bold text-base text-[#243C4C] mb-2">Recibe la solicitud</h3>
<p class="text-xs text-[#243C4C]/75 leading-relaxed">
                Registra al cliente y su solicitud comercial de inmediato desde cualquier canal.
              </p>
</div>
<div class="mt-6 pt-3 border-t border-[#E6EBF0] font-mono-num text-[11px] text-[#5289AD] font-medium">
              Captura instantánea
            </div>
</div>
<!-- Paso 02 -->
<div class="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] hover:border-[#1F609C]/50 transition-all flex flex-col justify-between relative group">
<div>
<div class="flex items-center justify-between mb-4">
<span class="font-mono-num text-xl font-bold text-[#1F609C]">02</span>
<span class="w-10 h-10 rounded-lg bg-[#E6EBF0] text-[#1F609C] flex items-center justify-center">
<span class="material-symbols-outlined text-[20px]">request_quote</span>
</span>
</div>
<h3 class="font-bold text-base text-[#243C4C] mb-2">Crea la cotización</h3>
<p class="text-xs text-[#243C4C]/75 leading-relaxed">
                Genera y personaliza cotizaciones rápidamente en moneda local (Q) con cálculo exacto.
              </p>
</div>
<div class="mt-6 pt-3 border-t border-[#E6EBF0] font-mono-num text-[11px] text-[#5289AD] font-medium">
              Emisión en segundos
            </div>
</div>
<!-- Paso 03 -->
<div class="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] hover:border-[#1F609C]/50 transition-all flex flex-col justify-between relative group">
<div>
<div class="flex items-center justify-between mb-4">
<span class="font-mono-num text-xl font-bold text-[#1F609C]">03</span>
<span class="w-10 h-10 rounded-lg bg-[#E6EBF0] text-[#1F609C] flex items-center justify-center">
<span class="material-symbols-outlined text-[20px]">monitoring</span>
</span>
</div>
<h3 class="font-bold text-base text-[#243C4C] mb-2">Da seguimiento</h3>
<p class="text-xs text-[#243C4C]/75 leading-relaxed">
                Mantén el seguimiento proactivo de tus clientes y oportunidades en el pipeline visual.
              </p>
</div>
<div class="mt-6 pt-3 border-t border-[#E6EBF0] font-mono-num text-[11px] text-[#5289AD] font-medium">
              Cero prospectos perdidos
            </div>
</div>
<!-- Paso 04 -->
<div class="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] hover:border-[#1F609C]/50 transition-all flex flex-col justify-between relative group">
<div>
<div class="flex items-center justify-between mb-4">
<span class="font-mono-num text-xl font-bold text-[#1F609C]">04</span>
<span class="w-10 h-10 rounded-lg bg-[#E6EBF0] text-[#1F609C] flex items-center justify-center">
<span class="material-symbols-outlined text-[20px]">link</span>
</span>
</div>
<h3 class="font-bold text-base text-[#243C4C] mb-2">Envía el link de pago</h3>
<p class="text-xs text-[#243C4C]/75 leading-relaxed">
                Facilita que tus clientes realicen el pago inmediato con Smart Links bancarios y seguros.
              </p>
</div>
<div class="mt-6 pt-3 border-t border-[#E6EBF0] font-mono-num text-[11px] text-[#5289AD] font-medium">
              Cobro sin fricciones
            </div>
</div>
<!-- Paso 05 -->
<div class="p-6 rounded-2xl bg-[#F0FDF4] border border-[#76B37A] hover:border-[#4B8D4B] transition-all flex flex-col justify-between relative group">
<div>
<div class="flex items-center justify-between mb-4">
<span class="font-mono-num text-xl font-bold text-[#4B8D4B]">05</span>
<span class="w-10 h-10 rounded-lg bg-[#D9EAD7] text-[#4B8D4B] flex items-center justify-center">
<span class="material-symbols-outlined text-[20px]">verified</span>
</span>
</div>
<h3 class="font-bold text-base text-[#243C4C] mb-2">Cierra la venta</h3>
<p class="text-xs text-[#243C4C]/75 leading-relaxed">
                Consulta el historial en tiempo real y controla tus ventas sin fricción operativa.
              </p>
</div>
<div class="mt-6 pt-3 border-t border-[#D9EAD7] font-mono-num text-[11px] text-[#4B8D4B] font-bold">
              Liquidación confirmada
            </div>
</div>
</div>
</div>
</section>
<!-- 6. BENEFICIOS ("¿Por qué elegir FlowCommerce?") -->
<section class="py-20 bg-[#F8FAFC]" id="beneficios">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div class="text-center max-w-3xl mx-auto mb-16">
<span class="font-mono-num text-xs font-bold tracking-widest text-[#1F609C] uppercase block mb-3">VENTAJAS COMPETITIVAS</span>
<h2 class="text-3xl sm:text-4xl font-bold text-[#243C4C] mb-4">
            ¿Por qué elegir FlowCommerce?
          </h2>
<p class="text-base sm:text-lg text-[#243C4C]/75">
            Una infraestructura construida específicamente para el dinamismo de negocios en Guatemala y América Latina.
          </p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
<!-- Beneficio 1 -->
<div class="p-6 rounded-2xl bg-white border border-[#E6EBF0] shadow-sm hover:shadow-md transition-all">
<div class="w-12 h-12 rounded-xl bg-[#E6EBF0] text-[#1F609C] flex items-center justify-center mb-5">
<span class="material-symbols-outlined text-[26px]">schedule</span>
</div>
<div class="inline-block px-2.5 py-0.5 rounded-full bg-[#E6EBF0] text-[#1F609C] font-mono-num text-xs font-semibold mb-2">-80% tiempo manual</div>
<h3 class="text-lg font-bold text-[#243C4C] mb-2">Ahorra tiempo</h3>
<p class="text-sm text-[#243C4C]/75">
              Reduce tareas manuales en tu proceso de ventas y elimina el papeleo repetitivo en hojas de cálculo.
            </p>
</div>
<!-- Beneficio 2 -->
<div class="p-6 rounded-2xl bg-white border border-[#E6EBF0] shadow-sm hover:shadow-md transition-all">
<div class="w-12 h-12 rounded-xl bg-[#D9EAD7] text-[#4B8D4B] flex items-center justify-center mb-5">
<span class="material-symbols-outlined text-[26px]">trending_up</span>
</div>
<div class="inline-block px-2.5 py-0.5 rounded-full bg-[#D9EAD7] text-[#4B8D4B] font-mono-num text-xs font-semibold mb-2">+40% cierres de venta</div>
<h3 class="text-lg font-bold text-[#243C4C] mb-2">Aumenta tus oportunidades</h3>
<p class="text-sm text-[#243C4C]/75">
              Da seguimiento a tus clientes y evita perder oportunidades de cierre gracias a notificaciones inteligentes.
            </p>
</div>
<!-- Beneficio 3 -->
<div class="p-6 rounded-2xl bg-white border border-[#E6EBF0] shadow-sm hover:shadow-md transition-all">
<div class="w-12 h-12 rounded-xl bg-[#E6EBF0] text-[#5289AD] flex items-center justify-center mb-5">
<span class="material-symbols-outlined text-[26px]">point_of_sale</span>
</div>
<div class="inline-block px-2.5 py-0.5 rounded-full bg-[#E6EBF0] text-[#5289AD] font-mono-num text-xs font-semibold mb-2">Liquidación en Quetzales</div>
<h3 class="text-lg font-bold text-[#243C4C] mb-2">Facilita los pagos</h3>
<p class="text-sm text-[#243C4C]/75">
              Envía links de pago directamente a tus clientes con liquidación ágil e integración bancaria transparente.
            </p>
</div>
<!-- Beneficio 4 -->
<div class="p-6 rounded-2xl bg-white border border-[#E6EBF0] shadow-sm hover:shadow-md transition-all">
<div class="w-12 h-12 rounded-xl bg-[#E6EBF0] text-[#1F609C] flex items-center justify-center mb-5">
<span class="material-symbols-outlined text-[26px]">insights</span>
</div>
<div class="inline-block px-2.5 py-0.5 rounded-full bg-[#E6EBF0] text-[#1F609C] font-mono-num text-xs font-semibold mb-2">Control en tiempo real</div>
<h3 class="text-lg font-bold text-[#243C4C] mb-2">Mejora tus decisiones</h3>
<p class="text-sm text-[#243C4C]/75">
              Consulta reportes detallados e historial de ventas con métricas en tiempo real para optimizar tu estrategia.
            </p>
</div>
<!-- Beneficio 5 -->
<div class="p-6 rounded-2xl bg-white border border-[#E6EBF0] shadow-sm hover:shadow-md transition-all md:col-span-2 lg:col-span-2">
<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
<div class="flex items-center gap-3">
<div class="w-12 h-12 rounded-xl bg-[#D9EAD7] text-[#4B8D4B] flex items-center justify-center shrink-0">
<span class="material-symbols-outlined text-[26px]">groups</span>
</div>
<div>
<h3 class="text-lg font-bold text-[#243C4C]">Trabaja en equipo</h3>
<div class="inline-block px-2.5 py-0.5 rounded-full bg-[#D9EAD7] text-[#4B8D4B] font-mono-num text-xs font-semibold mt-1">Multi-usuario y Asignación de Roles</div>
</div>
</div>
<span class="text-xs font-mono-num text-[#5289AD] font-bold">Colaboración B2B ágil</span>
</div>
<p class="text-sm text-[#243C4C]/75">
              Gestiona usuarios, asigna prospectos a vendedores y coordina equipos comerciales sin fricción ni duplicidad de tareas. Control total sobre permisos y visibilidad de cotizaciones.
            </p>
</div>
</div>
</div>
</section>
<!-- 7. FUNCIONALIDADES CLAVE (Integradas) -->
<section class="py-20 bg-white border-y border-[#E6EBF0]">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div class="text-center max-w-3xl mx-auto mb-16">
<span class="font-mono-num text-xs font-bold tracking-widest text-[#5289AD] uppercase block mb-3">TECNOLOGÍA ROBUSTA</span>
<h2 class="text-3xl sm:text-4xl font-bold text-[#243C4C] mb-4">
            Funcionalidades Clave Integradas
          </h2>
<p class="text-base sm:text-lg text-[#243C4C]/75">
            Cada herramienta fue diseñada para simplificar tu operación comercial e impulsar tu crecimiento.
          </p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
<!-- Funcionalidad 1 -->
<div class="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] flex flex-col justify-between">
<div>
<div class="w-10 h-10 rounded-lg bg-[#1F609C] text-white flex items-center justify-center mb-4">
<span class="material-symbols-outlined text-[22px]">description</span>
</div>
<h4 class="font-bold text-base text-[#243C4C] mb-2">Generador de Cotizaciones</h4>
<p class="text-xs text-[#243C4C]/75 leading-relaxed">
                Elabora cotizaciones formales en segundos. Precios, impuestos y moneda nacional en Quetzales (Q) integrados automáticamente.
              </p>
</div>
<div class="mt-4 pt-3 border-t border-[#E6EBF0] text-xs font-mono-num text-[#1F609C] font-semibold">
              Exportación instantánea
            </div>
</div>
<!-- Funcionalidad 2 -->
<div class="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] flex flex-col justify-between">
<div>
<div class="w-10 h-10 rounded-lg bg-[#5289AD] text-white flex items-center justify-center mb-4">
<span class="material-symbols-outlined text-[22px]">view_kanban</span>
</div>
<h4 class="font-bold text-base text-[#243C4C] mb-2">Pipeline Kanban / Embudo</h4>
<p class="text-xs text-[#243C4C]/75 leading-relaxed">
                Mueve tus oportunidades entre etapas con arrastrar y soltar (Drag &amp; Drop). Visibilidad total del estado de cada negociación.
              </p>
</div>
<div class="mt-4 pt-3 border-t border-[#E6EBF0] text-xs font-mono-num text-[#5289AD] font-semibold">
              Etapas configurables
            </div>
</div>
<!-- Funcionalidad 3 -->
<div class="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] flex flex-col justify-between">
<div>
<div class="w-10 h-10 rounded-lg bg-[#4B8D4B] text-white flex items-center justify-center mb-4">
<span class="material-symbols-outlined text-[22px]">payments</span>
</div>
<h4 class="font-bold text-base text-[#243C4C] mb-2">Smart Links de Cobro en Q</h4>
<p class="text-xs text-[#243C4C]/75 leading-relaxed">
                Links seguros de pago enlazados directamente a cada cotización emitida. Notificación inmediata cuando el cliente realiza el abono.
              </p>
</div>
<div class="mt-4 pt-3 border-t border-[#E6EBF0] text-xs font-mono-num text-[#4B8D4B] font-semibold">
              Tarjetas &amp; Transferencias
            </div>
</div>
<!-- Funcionalidad 4 -->
<div class="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] flex flex-col justify-between">
<div>
<div class="w-10 h-10 rounded-lg bg-[#243C4C] text-white flex items-center justify-center mb-4">
<span class="material-symbols-outlined text-[22px]">analytics</span>
</div>
<h4 class="font-bold text-base text-[#243C4C] mb-2">Historial y Métricas</h4>
<p class="text-xs text-[#243C4C]/75 leading-relaxed">
                Consulta ventas cerradas, ticket promedio, tiempos de respuesta y desempeño comercial de tus colaboradores en un solo panel.
              </p>
</div>
<div class="mt-4 pt-3 border-t border-[#E6EBF0] text-xs font-mono-num text-[#243C4C] font-semibold">
              Reportes en tiempo real
            </div>
</div>
</div>
</div>
</section>
<!-- 8. FLOWCOMMERCE PARA CADA ETAPA DE TU NEGOCIO (Diferenciación de audiencias) -->
<section class="py-20 bg-[#F8FAFC]">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div class="text-center max-w-3xl mx-auto mb-16">
<span class="font-mono-num text-xs font-bold tracking-widest text-[#1F609C] uppercase block mb-3">SEGMENTACIÓN A MEDIDA</span>
<h2 class="text-3xl sm:text-4xl font-bold text-[#243C4C] mb-4">
            FlowCommerce para cada etapa de tu negocio
          </h2>
<p class="text-base sm:text-lg text-[#243C4C]/75">
            Soluciones adaptadas a la escala de tu equipo, desde creadores y microempresas hasta corporaciones consolidadas.
          </p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
<!-- Bloque 1: EMPRENDEDORES -->
<div class="p-8 sm:p-10 rounded-2xl bg-white border border-[#E6EBF0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D9EAD7] text-[#4B8D4B] font-mono-num text-xs font-bold mb-4">
                EMPRENDEDORES &amp; NEGOCIOS ÁGILES
              </div>
<h3 class="text-2xl font-bold text-[#243C4C] mb-2">
                Organiza tus ventas y comienza a crecer sin complicaciones.
              </h3>
<p class="text-sm text-[#243C4C]/75 mb-6">
                Ideal para negocios en crecimiento activos en Redes Sociales (TikTok, Instagram, Facebook) que atienden cotizaciones por chat y desean profesionalizar sus ventas de inmediato.
              </p>
<div class="space-y-3 pt-2 mb-8">
<div class="flex items-center gap-3 text-sm text-[#243C4C]/90 font-medium">
<span class="material-symbols-outlined text-[#4B8D4B] text-[20px]">check_circle</span>
<span class="">Gestión ágil de clientes</span>
</div>
<div class="flex items-center gap-3 text-sm text-[#243C4C]/90 font-medium">
<span class="material-symbols-outlined text-[#4B8D4B] text-[20px]">check_circle</span>
<span class="">Cotizaciones rápidas desde el móvil</span>
</div>
<div class="flex items-center gap-3 text-sm text-[#243C4C]/90 font-medium">
<span class="material-symbols-outlined text-[#4B8D4B] text-[20px]">check_circle</span>
<span class="">Seguimiento de prospectos</span>
</div>
<div class="flex items-center gap-3 text-sm text-[#243C4C]/90 font-medium">
<span class="material-symbols-outlined text-[#4B8D4B] text-[20px]">check_circle</span>
<span class="">Links de pago por WhatsApp y Web</span>
</div>
<div class="flex items-center gap-3 text-sm text-[#243C4C]/90 font-medium">
<span class="material-symbols-outlined text-[#4B8D4B] text-[20px]">check_circle</span>
<span class="">Historial de ventas en tiempo real</span>
</div>
</div>
</div>
<a class="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg bg-[#4B8D4B] text-white font-semibold text-sm shadow hover:bg-[#3d753d] transition-all" href="/registro">
<span class="">Empezar como Emprendedor</span>
<span class="material-symbols-outlined text-[18px]">arrow_forward</span>
</a>
</div>
<!-- Bloque 2: EMPRESAS -->
<div class="p-8 sm:p-10 rounded-2xl bg-white border border-[#1F609C]/30 shadow-md hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden">
<div class="absolute top-0 right-0 w-32 h-32 bg-[#E6EBF0]/50 rounded-bl-full pointer-events-none -z-0"></div>
<div class="relative z-10">
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6EBF0] text-[#1F609C] font-mono-num text-xs font-bold mb-4">
                EMPRESAS &amp; EQUIPOS COMERCIALES
              </div>
<h3 class="text-2xl font-bold text-[#243C4C] mb-2">
                Centraliza y automatiza el proceso comercial de tu equipo.
              </h3>
<p class="text-sm text-[#243C4C]/75 mb-6">
                Potenciado para corporaciones y prospección en LinkedIn Ads y Mailing B2B que exigen visibilidad de embudos, múltiples asesores comerciales y métricas directivas.
              </p>
<div class="space-y-3 pt-2 mb-8">
<div class="flex items-center gap-3 text-sm text-[#243C4C]/90 font-medium">
<span class="material-symbols-outlined text-[#1F609C] text-[20px]">check_circle</span>
<span class="">Gestión de equipos comerciales y roles</span>
</div>
<div class="flex items-center gap-3 text-sm text-[#243C4C]/90 font-medium">
<span class="material-symbols-outlined text-[#1F609C] text-[20px]">check_circle</span>
<span class="">Automatización de seguimientos y recordatorios</span>
</div>
<div class="flex items-center gap-3 text-sm text-[#243C4C]/90 font-medium">
<span class="material-symbols-outlined text-[#1F609C] text-[20px]">check_circle</span>
<span class="">Reportes avanzados y analítica por asesor</span>
</div>
<div class="flex items-center gap-3 text-sm text-[#243C4C]/90 font-medium">
<span class="material-symbols-outlined text-[#1F609C] text-[20px]">check_circle</span>
<span class="">Panel de ventas multi-etapa unificado</span>
</div>
<div class="flex items-center gap-3 text-sm text-[#243C4C]/90 font-medium">
<span class="material-symbols-outlined text-[#1F609C] text-[20px]">check_circle</span>
<span class="">Asientos y usuarios adicionales según escala</span>
</div>
</div>
</div>
<a class="relative z-10 w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg bg-[#1F609C] text-white font-semibold text-sm shadow hover:bg-[#243C4C] transition-all" href="#planes">
<span class="">Ver Solución Empresa</span>
<span class="material-symbols-outlined text-[18px]">arrow_forward</span>
</a>
</div>
</div>
</div>
</section>
<!-- 9. MODELO FREEMIUM -->
<section class="py-20 bg-white border-y border-[#E6EBF0]">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div class="text-center max-w-3xl mx-auto mb-14">
<span class="font-mono-num text-xs font-bold tracking-widest text-[#4B8D4B] uppercase block mb-3">CRECIMIENTO SOSTENIBLE</span>
<h2 class="text-3xl sm:text-4xl font-bold text-[#243C4C] mb-4">
            Empieza gratis. Crece cuando estés listo.
          </h2>
<p class="text-base sm:text-lg text-[#243C4C]/75">
            Utiliza FlowCommerce gratis con funciones básicas y aumenta las capacidades de tu negocio cuando necesites más clientes, cotizaciones, usuarios o automatizaciones.
          </p>
</div>
<!-- Visualización del Modelo de Crecimiento Continuo -->
<div class="max-w-4xl mx-auto mb-10">
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
<!-- Paso Gratis -->
<div class="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] text-center">
<span class="font-mono-num text-xs font-semibold text-[#5289AD] uppercase block mb-1">Nivel 01</span>
<h3 class="text-xl font-bold text-[#243C4C] mb-1">GRATIS</h3>
<div class="font-mono-num text-2xl font-bold text-[#1F609C] mb-3">Q0 <span class="text-xs font-normal text-[#243C4C]/60">/ mes</span></div>
<p class="text-xs text-[#243C4C]/70">Para validar tu negocio y emitir tus primeras cotizaciones sin ningún costo.</p>
</div>
<!-- Paso Profesional -->
<div class="p-6 rounded-2xl bg-[#F0FDF4] border border-[#76B37A] text-center shadow-md relative">
<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#4B8D4B] text-white font-mono-num text-[11px] font-bold">
                RECOMENDADO
              </div>
<span class="font-mono-num text-xs font-semibold text-[#4B8D4B] uppercase block mb-1">Nivel 02</span>
<h3 class="text-xl font-bold text-[#243C4C] mb-1">PROFESIONAL</h3>
<div class="font-mono-num text-2xl font-bold text-[#4B8D4B] mb-3">Q80 <span class="text-xs font-normal text-[#243C4C]/60">/ mes</span></div>
<p class="text-xs text-[#243C4C]/70">Clientes y cotizaciones ilimitadas con Smart Links de cobro activos.</p>
</div>
<!-- Paso Empresa -->
<div class="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] text-center">
<span class="font-mono-num text-xs font-semibold text-[#1F609C] uppercase block mb-1">Nivel 03</span>
<h3 class="text-xl font-bold text-[#243C4C] mb-1">EMPRESA</h3>
<div class="font-mono-num text-2xl font-bold text-[#243C4C] mb-3">Q160 <span class="text-xs font-normal text-[#243C4C]/60">/ mes</span></div>
<p class="text-xs text-[#243C4C]/70">Automatizaciones, reportes avanzados y múltiples equipos comerciales.</p>
</div>
</div>
</div>
<!-- Badge Destacado -->
<div class="text-center">
<div class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D9EAD7] text-[#4B8D4B] font-mono-num text-xs sm:text-sm font-bold border border-[#76B37A]/50">
<span class="material-symbols-outlined text-[18px]">verified</span>
            Prueba gratuita de 14 días del plan Profesional disponible sin tarjeta.
          </div>
</div>
</div>
</section>
<!-- 10. PLANES Y PRECIOS -->
<section class="py-20 bg-[#F8FAFC]" id="planes">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div class="text-center max-w-3xl mx-auto mb-16">
<span class="font-mono-num text-xs font-bold tracking-widest text-[#1F609C] uppercase block mb-3">PRECIOS EN QUETZALES (Q)</span>
<h2 class="text-3xl sm:text-4xl font-bold text-[#243C4C] mb-4">
            Planes para cada etapa de tu negocio
          </h2>
<p class="text-base sm:text-lg text-[#243C4C]/75">
            Precios transparentes en Quetzales (Q). Sin contratos forzosos. Cambia o cancela cuando quieras.
          </p>
</div>
<!-- Grid de 3 Tarjetas de Precios -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-12">
<!-- Tarjeta 1: PLAN GRATIS -->
<div class="p-8 rounded-2xl bg-white border border-[#E6EBF0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div class="mb-6">
<span class="text-xs font-bold font-mono-num text-[#5289AD] uppercase block mb-1">Para comenzar</span>
<h3 class="text-2xl font-bold text-[#243C4C]">Plan Gratis</h3>
<p class="text-xs text-[#243C4C]/70 mt-1">Explora la herramienta y emite propuestas base sin ningún costo.</p>
</div>
<div class="p-4 rounded-xl bg-[#F8FAFC] border border-[#E6EBF0] mb-6">
<div class="flex items-baseline gap-1">
<span class="font-mono-num text-4xl font-bold text-[#243C4C]">Q0</span>
<span class="text-xs text-[#243C4C]/60">/ mes</span>
</div>
<span class="font-mono-num text-xs text-[#5289AD] font-medium block mt-1">Acceso permanente</span>
</div>
<!-- Lista de características -->
<ul class="space-y-3 mb-8 text-sm text-[#243C4C]/85">
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">check</span>
<span class="">Hasta <strong>10 clientes</strong></span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">check</span>
<span class="">Hasta <strong>2 cotizaciones al día</strong></span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">check</span>
<span class="">Gestión básica de clientes</span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">check</span>
<span class="">Seguimiento básico</span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">check</span>
<span class="">1 usuario</span>
</li>
<li class="flex items-center gap-2.5 text-[#243C4C]/60 text-xs">
<span class="material-symbols-outlined text-[16px]">info</span>
<span class="">Marca de FlowCommerce en las cotizaciones</span>
</li>
<li class="flex items-center gap-2.5 text-xs text-[#1F609C] font-medium">
<span class="material-symbols-outlined text-[16px]">add_circle</span>
<span class="">Posibilidad de adquirir herramientas premium individualmente</span>
</li>
</ul>
</div>
<a class="w-full py-3 px-4 rounded-lg bg-[#E6EBF0] text-[#1F609C] font-semibold text-sm text-center hover:bg-[#1F609C] hover:text-white transition-colors" href="/registro">
              Comenzar gratis
            </a>
</div>
<!-- Tarjeta 2: PLAN PROFESIONAL (DESTACADO) -->
<div class="p-8 rounded-2xl bg-white border-2 border-[#4B8D4B] shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between relative transform lg:-translate-y-2">
<!-- Badge superior flotante -->
<div class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#4B8D4B] text-white font-mono-num text-xs font-bold tracking-wide shadow flex items-center gap-1.5 whitespace-nowrap">
<span class="material-symbols-outlined text-[16px]">star</span> MÁS POPULAR · RECOMENDADO
            </div>
<div>
<div class="mb-6 mt-2">
<span class="text-xs font-bold font-mono-num text-[#4B8D4B] uppercase block mb-1">Para emprendimientos en crecimiento</span>
<h3 class="text-2xl font-bold text-[#243C4C]">Plan Profesional</h3>
<p class="text-xs text-[#243C4C]/70 mt-1">La suite comercial completa para cerrar y cobrar sin límites.</p>
</div>
<div class="p-4 rounded-xl bg-[#F0FDF4] border border-[#D9EAD7] mb-6">
<div class="flex items-baseline gap-1">
<span class="font-mono-num text-4xl font-bold text-[#4B8D4B]">Q80</span>
<span class="text-xs text-[#243C4C]/60">/ mes</span>
</div>
<span class="font-mono-num text-xs text-[#4B8D4B] font-semibold block mt-1">Facturación mensual estándar</span>
</div>
<!-- Lista de características -->
<ul class="space-y-3 mb-8 text-sm text-[#243C4C]/90 font-medium">
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#4B8D4B] text-[18px]">check_circle</span>
<span class=""><strong>Clientes ilimitados</strong></span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#4B8D4B] text-[18px]">check_circle</span>
<span class=""><strong>Cotizaciones ilimitadas</strong></span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#4B8D4B] text-[18px]">check_circle</span>
<span class="">Seguimiento de clientes</span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#4B8D4B] text-[18px]">check_circle</span>
<span class="">Generación de links de pago</span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#4B8D4B] text-[18px]">check_circle</span>
<span class="">Historial de ventas</span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#4B8D4B] text-[18px]">check_circle</span>
<span class="">Reportes básicos</span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#4B8D4B] text-[18px]">check_circle</span>
<span class="">Hasta <strong>3 usuarios</strong></span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#4B8D4B] text-[18px]">check_circle</span>
<span class="">Personalización de cotizaciones</span>
</li>
<li class="flex items-center gap-2.5 text-[#4B8D4B] font-bold">
<span class="material-symbols-outlined text-[18px]">verified</span>
<span class="">Sin publicidad ni marca de FlowCommerce</span>
</li>
</ul>
</div>
<a class="w-full py-3.5 px-4 rounded-lg bg-[#4B8D4B] hover:bg-[#3d753d] text-white font-bold text-sm text-center shadow-md transition-all flex items-center justify-center gap-2" href="/registro">
<span class="">Probar 14 días gratis</span>
<span class="material-symbols-outlined text-[18px]">arrow_forward</span>
</a>
</div>
<!-- Tarjeta 3: PLAN EMPRESA -->
<div class="p-8 rounded-2xl bg-white border border-[#E6EBF0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div class="mb-6">
<span class="text-xs font-bold font-mono-num text-[#1F609C] uppercase block mb-1">Para empresas con equipos de ventas</span>
<h3 class="text-2xl font-bold text-[#243C4C]">Plan Empresa</h3>
<p class="text-xs text-[#243C4C]/70 mt-1">Automatización, jerarquías de roles y analítica comercial avanzada.</p>
</div>
<div class="p-4 rounded-xl bg-[#F8FAFC] border border-[#E6EBF0] mb-6">
<div class="flex items-baseline gap-1">
<span class="font-mono-num text-4xl font-bold text-[#243C4C]">Q160</span>
<span class="text-xs text-[#243C4C]/60">/ mes</span>
</div>
<span class="font-mono-num text-xs text-[#1F609C] font-semibold block mt-1">Facturación mensual por empresa</span>
</div>
<!-- Lista de características -->
<ul class="space-y-3 mb-8 text-sm text-[#243C4C]/85">
<li class="flex items-center gap-2.5 font-bold text-[#1F609C]">
<span class="material-symbols-outlined text-[18px]">done_all</span>
<span class="">Todo lo incluido en Profesional</span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">check</span>
<span class="">Usuarios adicionales</span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">check</span>
<span class="">Automatización de seguimientos</span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">check</span>
<span class="">Reportes avanzados</span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">check</span>
<span class="">Panel de ventas</span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">check</span>
<span class="">Gestión de equipos</span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">check</span>
<span class="">Personalización avanzada</span>
</li>
<li class="flex items-center gap-2.5">
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">check</span>
<span class="">Soporte prioritario</span>
</li>
</ul>
</div>
<a class="w-full py-3 px-4 rounded-lg bg-[#243C4C] text-white font-semibold text-sm text-center hover:bg-[#1F609C] transition-colors" href="/registro">
              Elegir Empresa
            </a>
</div>
</div>
</div>
</section>
<!-- 11. SECCIÓN DE COMPLEMENTOS / HERRAMIENTAS INDIVIDUALES -->
<section class="py-20 bg-white border-y border-[#E6EBF0]" id="complementos">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div class="text-center max-w-3xl mx-auto mb-16">
<span class="font-mono-num text-xs font-bold tracking-widest text-[#5289AD] uppercase block mb-3">FLEXIBILIDAD A DEMANDA</span>
<h2 class="text-3xl sm:text-4xl font-bold text-[#243C4C] mb-4">
            Potencia tu experiencia con complementos
          </h2>
<p class="text-base sm:text-lg text-[#243C4C]/75">
            Adquiere funcionalidades específicas según las necesidades puntuales de tu operación. Complementos desde Q4.
          </p>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
<!-- Complemento 1 -->
<div class="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] hover:border-[#1F609C] transition-all flex flex-col justify-between">
<div>
<div class="w-10 h-10 rounded-lg bg-[#E6EBF0] text-[#1F609C] flex items-center justify-center mb-4">
<span class="material-symbols-outlined text-[22px]">smart_toy</span>
</div>
<h4 class="font-bold text-base text-[#243C4C] mb-2">Automatizaciones comerciales</h4>
<p class="text-xs text-[#243C4C]/70 leading-relaxed mb-4">
                Triggers automáticos, recordatorios inteligentes de cobro y avisos de seguimiento por correo y chat.
              </p>
</div>
<div class="pt-4 border-t border-[#E6EBF0] flex items-center justify-between">
<span class="font-mono-num text-xs font-bold text-[#1F609C]">Desde Q4 / mes</span>
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">add_circle_outline</span>
</div>
</div>
<!-- Complemento 2 -->
<div class="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] hover:border-[#1F609C] transition-all flex flex-col justify-between">
<div>
<div class="w-10 h-10 rounded-lg bg-[#E6EBF0] text-[#1F609C] flex items-center justify-center mb-4">
<span class="material-symbols-outlined text-[22px]">query_stats</span>
</div>
<h4 class="font-bold text-base text-[#243C4C] mb-2">Reportes avanzados &amp; Analítica</h4>
<p class="text-xs text-[#243C4C]/70 leading-relaxed mb-4">
                Exportación de métricas a Excel, comparativa intermensual y medición de productividad por asesor comercial.
              </p>
</div>
<div class="pt-4 border-t border-[#E6EBF0] flex items-center justify-between">
<span class="font-mono-num text-xs font-bold text-[#1F609C]">Desde Q4 / mes</span>
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">add_circle_outline</span>
</div>
</div>
<!-- Complemento 3 -->
<div class="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] hover:border-[#1F609C] transition-all flex flex-col justify-between">
<div>
<div class="w-10 h-10 rounded-lg bg-[#E6EBF0] text-[#1F609C] flex items-center justify-center mb-4">
<span class="material-symbols-outlined text-[22px]">person_add_alt</span>
</div>
<h4 class="font-bold text-base text-[#243C4C] mb-2">Usuarios adicionales</h4>
<p class="text-xs text-[#243C4C]/70 leading-relaxed mb-4">
                Asientos escalables para tu fuerza de ventas sin necesidad de cambiar el tipo de suscripción base.
              </p>
</div>
<div class="pt-4 border-t border-[#E6EBF0] flex items-center justify-between">
<span class="font-mono-num text-xs font-bold text-[#1F609C]">Desde Q4 / mes</span>
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">add_circle_outline</span>
</div>
</div>
<!-- Complemento 4 -->
<div class="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] hover:border-[#1F609C] transition-all flex flex-col justify-between">
<div>
<div class="w-10 h-10 rounded-lg bg-[#E6EBF0] text-[#1F609C] flex items-center justify-center mb-4">
<span class="material-symbols-outlined text-[22px]">branding_watermark</span>
</div>
<h4 class="font-bold text-base text-[#243C4C] mb-2">Personalización avanzada</h4>
<p class="text-xs text-[#243C4C]/70 leading-relaxed mb-4">
                Plantillas de cotización con diseño a medida, marca blanca completa y dominio propio para enlaces de pago.
              </p>
</div>
<div class="pt-4 border-t border-[#E6EBF0] flex items-center justify-between">
<span class="font-mono-num text-xs font-bold text-[#1F609C]">Desde Q4 / mes</span>
<span class="material-symbols-outlined text-[#1F609C] text-[18px]">add_circle_outline</span>
</div>
</div>
</div>
</div>
</section>
<!-- 12. PRUEBA GRATUITA DESTACADA -->
<section class="py-20 bg-[#F8FAFC]">
<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
<div class="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#243C4C] via-[#1F609C] to-[#243C4C] text-white text-center shadow-2xl relative overflow-hidden">
<!-- Brillo de fondo -->
<div class="absolute -top-24 -right-24 w-80 h-80 bg-[#4B8D4B]/20 rounded-full blur-3xl pointer-events-none"></div>
<div class="relative z-10 max-w-2xl mx-auto">
<span class="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-white/10 text-[#D9EAD7] font-mono-num text-xs font-bold tracking-wider uppercase mb-6 backdrop-blur-sm">
<span class="material-symbols-outlined text-[16px]">verified</span> Activación inmediata · Sin tarjeta de crédito
            </span>
<h2 class="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
              Prueba las funciones profesionales durante 14 días
            </h2>
<p class="text-base sm:text-lg text-white/80 mb-8 leading-relaxed font-light">
              Descubre todo lo que FlowCommerce puede hacer por tu negocio antes de elegir tu plan.
            </p>
<a class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#4B8D4B] text-white font-bold text-base hover:bg-[#3d753d] shadow-lg transition-all transform hover:-translate-y-0.5" href="/registro">
<span class="">Comenzar prueba gratuita</span>
<span class="material-symbols-outlined text-[20px]">arrow_forward</span>
</a>
</div>
</div>
</div>
</section>
<!-- 13. PREGUNTAS FRECUENTES (FAQ INTERACTIVA / ACORDEÓN) -->
<section class="py-20 bg-white border-t border-[#E6EBF0]" id="faq">
<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
<div class="text-center mb-16">
<span class="font-mono-num text-xs font-bold tracking-widest text-[#1F609C] uppercase block mb-3">RESOLVIENDO DUDAS</span>
<h2 class="text-3xl sm:text-4xl font-bold text-[#243C4C] mb-4">
            Preguntas Frecuentes
          </h2>
<p class="text-base sm:text-lg text-[#243C4C]/75">
            Respuestas claras para que comiences a cotizar y vender con total confianza.
          </p>
</div>
<div class="space-y-4">
<!-- FAQ 1 -->
<details class="group p-5 sm:p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] open:border-[#1F609C]/40 transition-all">
<summary class="flex justify-between items-center font-bold text-base sm:text-lg text-[#243C4C] cursor-pointer list-none">
<span class="">¿Puedo utilizar FlowCommerce gratis?</span>
<span class="material-symbols-outlined text-[#5289AD] group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<p class="mt-4 text-sm text-[#243C4C]/80 leading-relaxed pt-2 border-t border-[#E6EBF0]">
              Sí. El plan Gratis puede utilizarse permanentemente con algunas limitaciones (hasta 10 clientes y 2 cotizaciones diarias). Es ideal para validar la herramienta y emitir propuestas sin costo alguno.
            </p>
</details>
<!-- FAQ 2 -->
<details class="group p-5 sm:p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] open:border-[#1F609C]/40 transition-all">
<summary class="flex justify-between items-center font-bold text-base sm:text-lg text-[#243C4C] cursor-pointer list-none">
<span class="">¿Puedo probar el plan Profesional?</span>
<span class="material-symbols-outlined text-[#5289AD] group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<p class="mt-4 text-sm text-[#243C4C]/80 leading-relaxed pt-2 border-t border-[#E6EBF0]">
              Sí. Puedes probar todas las funciones profesionales durante 14 días completos sin costo ni compromiso, sin tener que ingresar tarjetas de crédito.
            </p>
</details>
<!-- FAQ 3 -->
<details class="group p-5 sm:p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] open:border-[#1F609C]/40 transition-all">
<summary class="flex justify-between items-center font-bold text-base sm:text-lg text-[#243C4C] cursor-pointer list-none">
<span class="">¿Puedo agregar más usuarios?</span>
<span class="material-symbols-outlined text-[#5289AD] group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<p class="mt-4 text-sm text-[#243C4C]/80 leading-relaxed pt-2 border-t border-[#E6EBF0]">
              Sí. El plan Empresa permite agregar usuarios y asesores comerciales adicionales según el crecimiento de tu equipo, o puedes adquirir usuarios extra como complementos individuales desde Q4.
            </p>
</details>
<!-- FAQ 4 -->
<details class="group p-5 sm:p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] open:border-[#1F609C]/40 transition-all">
<summary class="flex justify-between items-center font-bold text-base sm:text-lg text-[#243C4C] cursor-pointer list-none">
<span class="">¿Puedo cancelar mi suscripción?</span>
<span class="material-symbols-outlined text-[#5289AD] group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<p class="mt-4 text-sm text-[#243C4C]/80 leading-relaxed pt-2 border-t border-[#E6EBF0]">
              Sí, puedes cambiar de plan o cancelar tu suscripción en cualquier momento sin penalizaciones ni contratos forzosos. Tú tienes el control total de tu cuenta.
            </p>
</details>
<!-- FAQ 5 -->
<details class="group p-5 sm:p-6 rounded-2xl bg-[#F8FAFC] border border-[#E6EBF0] open:border-[#1F609C]/40 transition-all">
<summary class="flex justify-between items-center font-bold text-base sm:text-lg text-[#243C4C] cursor-pointer list-none">
<span class="">¿Los links de pago aceptan cobros en Quetzales?</span>
<span class="material-symbols-outlined text-[#5289AD] group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<p class="mt-4 text-sm text-[#243C4C]/80 leading-relaxed pt-2 border-t border-[#E6EBF0]">
              Sí, FlowCommerce está optimizado para cobrar en Quetzales (Q) de forma segura con liquidación ágil e integración bancaria directa en Guatemala y toda la región.
            </p>
</details>
</div>
</div>
</section>
<!-- 14. CTA FINAL -->
<section class="py-20 bg-[#F8FAFC]">
<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
<div class="p-8 sm:p-14 rounded-3xl bg-white border border-[#E6EBF0] shadow-xl text-center relative overflow-hidden">
<div class="max-w-2xl mx-auto">
<h2 class="text-3xl sm:text-4xl font-extrabold text-[#243C4C] mb-4">
              ¿Listo para hacer crecer tus ventas?
            </h2>
<p class="text-base sm:text-lg text-[#243C4C]/80 mb-8 leading-relaxed">
              Gestiona clientes, cotizaciones, seguimiento y pagos desde un solo lugar.
            </p>
<a class="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#1F609C] text-white font-bold text-base shadow-md hover:bg-[#243C4C] hover:shadow-lg transition-all mb-4" href="/registro">
<span class="">Comenzar gratis</span>
<span class="material-symbols-outlined text-[20px]">arrow_forward</span>
</a>
<p class="text-xs sm:text-sm text-[#243C4C]/60 font-medium">
              Empieza con el plan gratuito y escala cuando tu negocio lo necesite.
            </p>
</div>
</div>
</div>
</section>
</main>
<!-- 15. FOOTER -->
<footer class="w-full bg-white border-t border-[#E6EBF0]">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
<!-- Columna Marca -->
<div class="lg:col-span-2 space-y-4">
<a class="inline-block" href="#">
<img alt="FlowCommerce" class="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSVA639-ifhCTJC2SHIn9lRBomVpzWTcoWuAJNO3ewk_7So1fXXwbglVzIMAN6DOIkyYXSkDidnhc_eGFSiJU3Ld6aL60CZ3OSgxnLlOFxz4FRek1QAopqcky6acPoVAqcv7ZWKRlZ6lG3d0h7DU-ZSbPgUtoWInI1bWCd8esbW6r2TLBzdE9ZV75qd-POKuQAcFoe1Kev0K-IYK8QcBlzG4Kbksgmd3Hh_RqS8aF7cRhPo6sZTmymJdaH5Rsb16iIZQ">
</a>
<p class="text-sm text-[#243C4C]/75 max-w-sm leading-relaxed">
            Plataforma comercial y CRM ágil para acelerar ventas, emitir cotizaciones profesionales y recaudar pagos en moneda local sin fricción operativa.
          </p>
<div class="flex items-center gap-2 text-xs font-mono-num text-[#5289AD]">
<span class="w-2 h-2 rounded-full bg-[#4B8D4B]"></span>
<span class="">Servicios operativos 99.8% SLA</span>
</div>
</div>
<!-- Columna Producto -->
<div class="space-y-3">
<h4 class="font-bold text-sm text-[#243C4C] tracking-wide uppercase font-mono-num">Producto</h4>
<ul class="space-y-2 text-sm text-[#243C4C]/80">
<li class=""><a class="hover:text-[#1F609C] transition-colors" href="#como-funciona">¿Cómo funciona?</a></li>
<li class=""><a class="hover:text-[#1F609C] transition-colors" href="#beneficios">Beneficios</a></li>
<li class=""><a class="hover:text-[#1F609C] transition-colors" href="#planes">Planes &amp; Precios</a></li>
<li class=""><a class="hover:text-[#1F609C] transition-colors" href="#complementos">Complementos desde Q4</a></li>
</ul>
</div>
<!-- Columna Soluciones -->
<div class="space-y-3">
<h4 class="font-bold text-sm text-[#243C4C] tracking-wide uppercase font-mono-num">Soluciones</h4>
<ul class="space-y-2 text-sm text-[#243C4C]/80">
<li class=""><a class="hover:text-[#1F609C] transition-colors" href="#soluciones">Para Emprendedores</a></li>
<li class=""><a class="hover:text-[#1F609C] transition-colors" href="#soluciones">Para Empresas B2B</a></li>
<li class=""><a class="hover:text-[#1F609C] transition-colors" href="#como-funciona">Links de Pago en Q</a></li>
<li class=""><a class="hover:text-[#1F609C] transition-colors" href="#faq">Preguntas Frecuentes</a></li>
</ul>
</div>
<!-- Columna Seguridad & Legal -->
<div class="space-y-3">
<h4 class="font-bold text-sm text-[#243C4C] tracking-wide uppercase font-mono-num">Seguridad &amp; Legal</h4>
<ul class="space-y-2 text-sm text-[#243C4C]/80">
<li class=""><a class="hover:text-[#1F609C] transition-colors" href="/privacidad.html">Políticas de Privacidad</a></li>
<li class=""><a class="hover:text-[#1F609C] transition-colors" href="#">Términos de Servicio</a></li>
<li class=""><a class="hover:text-[#1F609C] transition-colors" href="#">Cifrado Bancario 256-Bit</a></li>
<li class=""><a class="hover:text-[#1F609C] transition-colors" href="#">SLA de Disponibilidad</a></li>
</ul>
</div>
</div>
<!-- Barra Inferior Copyright -->
<div class="pt-8 border-t border-[#E6EBF0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#243C4C]/60">
<p class="font-mono-num">
          © 2026 FlowCommerce Technologies Inc. Todos los derechos reservados.
        </p>
<p class="font-mono-num">
          Diseñado para Guatemala y América Latina · Precios en Quetzales (Q)
        </p>
</div>
</div>
</footer>
`;function Nf(){return Vl.jsx("div",{dangerouslySetInnerHTML:{__html:Bf}})}$l.createRoot(document.getElementById("root")).render(Vl.jsx(gc.StrictMode,{children:Vl.jsx(Nf,{})}));
