(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const d of document.querySelectorAll('link[rel="modulepreload"]'))a(d);new MutationObserver(d=>{for(const o of d)if(o.type==="childList")for(const c of o.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&a(c)}).observe(document,{childList:!0,subtree:!0});function s(d){const o={};return d.integrity&&(o.integrity=d.integrity),d.referrerPolicy&&(o.referrerPolicy=d.referrerPolicy),d.crossOrigin==="use-credentials"?o.credentials="include":d.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function a(d){if(d.ep)return;d.ep=!0;const o=s(d);fetch(d.href,o)}})();const Fe="vm_";function we(e,i=null){try{const s=localStorage.getItem(Fe+e);return s!==null?JSON.parse(s):i}catch{return i}}function Se(e,i){localStorage.setItem(Fe+e,JSON.stringify(i))}function ae(){return we("chapters",[])}function nt(e){const i=ae(),s=i.findIndex(a=>a.id===e.id);s>=0?i[s]=e:i.push(e),Se("chapters",i)}function Ne(e){return ae().find(i=>i.id===e)||null}function it(e){Se("chapters",ae().filter(i=>i.id!==e)),localStorage.removeItem(Fe+`wd_${e}`)}function Le(e,i){return we(`wd_${e}`,{})[i]||{easeFactor:2.5,interval:0,repetitions:0,nextReview:0,mastery:"new"}}function We(e,i,s){const a=we(`wd_${e}`,{});a[i]=s,Se(`wd_${e}`,a)}function _e(e){return we(`wd_${e}`,{})}function Ie(){return we("stats",{xp:0,level:1,streak:0,lastStudyDate:null,badges:[],totalStudied:0,totalCorrect:0})}function Ke(e){Se("stats",e)}const ke=[0,100,250,500,900,1400,2e3,2800,3800,5e3],qe=[{id:"first_word",icon:"🌱",name:"첫 단어!",check:e=>e.totalStudied>=1},{id:"ten_words",icon:"🌿",name:"10단어 달성",check:e=>e.totalStudied>=10},{id:"fifty_words",icon:"🌳",name:"50단어 달성",check:e=>e.totalStudied>=50},{id:"hundred",icon:"💯",name:"100단어 달성",check:e=>e.totalStudied>=100},{id:"streak3",icon:"🔥",name:"3일 연속",check:e=>e.streak>=3},{id:"streak7",icon:"⚡",name:"7일 연속",check:e=>e.streak>=7},{id:"streak30",icon:"💫",name:"30일 연속",check:e=>e.streak>=30},{id:"accuracy90",icon:"🎯",name:"정확도 90%",check:e=>e.totalStudied>20&&e.totalCorrect/e.totalStudied>=.9},{id:"level5",icon:"⭐",name:"Lv.5 달성",check:e=>e.level>=5},{id:"level10",icon:"🏆",name:"Lv.10 달성 (MAX)",check:e=>e.level>=10}];function st(e){let i=1;for(let s=ke.length-1;s>=0;s--)if(e>=ke[s]){i=s+1;break}return i}function Xe(e){const i=ke[e.level-1]||0,s=ke[e.level]??null;return s?{pct:(e.xp-i)/(s-i)*100,current:e.xp-i,needed:s-e.xp}:{pct:100,current:e.xp-i,needed:0}}function Qe(e,i){return e.xp+=i,e.level=st(e.xp),e}function Ve(e){const i=new Date().toDateString(),s=new Date(Date.now()-864e5).toDateString();return e.lastStudyDate===i||(e.streak=e.lastStudyDate===s?e.streak+1:1,e.lastStudyDate=i),e}function Je(e){const i=[];for(const s of qe)!e.badges.includes(s.id)&&s.check(e)&&(e.badges.push(s.id),i.push(s));return{stats:e,earned:i}}const Z={flashcard_good:5,flashcard_again:1,typing_correct:12,typing_wrong:2,typing_hint:6};function Ge(e,i={}){let{easeFactor:s=2.5,interval:a=0,repetitions:d=0}=i,o,c;e>=3?(d===0?o=1:d===1?o=6:o=Math.round(a*s),c=d+1):(o=1,c=0);const v=Math.max(1.3,s+.1-(5-e)*(.08+(5-e)*.02));let p;return c===0?p="learning":c<3?p="review":p="mastered",{easeFactor:v,interval:o,repetitions:c,nextReview:Date.now()+o*864e5,mastery:p}}function Ce(e){return!e||e.mastery==="new"?!0:Date.now()>=(e.nextReview||0)}const se={again:0,hard:3,good:4,perfect:5};function rt(e){return{new:"신규",learning:"학습중",review:"복습중",mastered:"완료"}[e]||"신규"}function at(e){return{new:"#888",learning:"#f59e0b",review:"#3b82f6",mastered:"#22c55e"}[e]||"#888"}function dt(){const e=Ie(),i=ae(),{pct:s,needed:a}=Xe(e);let d=0;for(const c of i){const v=_e(c.id);for(const p of c.words)Ce(v[p.id])&&d++}const o=qe.filter(c=>e.badges.includes(c.id));return`
<div class="view home-view">
  <div class="home-header">
    <h1 class="app-title">VocabMaster</h1>
    <div class="streak-badge ${e.streak>0?"active":""}">
      ${e.streak>0?"🔥":"❄️"} ${e.streak}일 연속
    </div>
  </div>

  <div class="xp-card">
    <div class="xp-top">
      <div class="level-circle">Lv.${e.level}</div>
      <div class="xp-info">
        <div class="xp-total">${e.xp.toLocaleString()} XP</div>
        <div class="xp-sub">${a>0?`다음 레벨까지 ${a} XP`:"🏆 최고 레벨"}</div>
      </div>
    </div>
    <div class="xp-bar-wrap">
      <div class="xp-bar-fill" style="width:${Math.min(s,100)}%"></div>
    </div>
  </div>

  ${d>0?`<div class="due-card" id="btn-go-review">
        <div class="due-left">
          <div class="due-icon">📬</div>
          <div>
            <div class="due-title">복습할 단어</div>
            <div class="due-count">${d}개 대기중</div>
          </div>
        </div>
        <div class="due-arrow">›</div>
      </div>`:'<div class="done-card"><span>✅</span><span>오늘 복습 완료!</span></div>'}

  <div class="section-row">
    <div class="section-title">챕터</div>
    ${i.length>3?'<button class="see-all-btn" id="btn-see-all">전체 →</button>':""}
  </div>

  ${i.length===0?`<div class="empty-card" id="btn-add-chapter">
        <span>📚</span>
        <p>CSV를 업로드해서 첫 챕터를 추가하세요</p>
      </div>`:`<div class="chapter-list">
        ${i.slice(0,3).map(c=>ot(c)).join("")}
      </div>`}

  ${o.length>0?`
    <div class="section-title">획득한 뱃지</div>
    <div class="badge-row">
      ${o.map(c=>`
        <div class="badge-chip" title="${c.name}">
          <span>${c.icon}</span><span class="badge-name">${c.name}</span>
        </div>`).join("")}
    </div>`:""}
</div>`}function ot(e){const i=_e(e.id),s=e.words.length,a=e.words.filter(o=>{var c;return((c=i[o.id])==null?void 0:c.mastery)==="mastered"}).length,d=s>0?Math.round(a/s*100):0;return`
  <div class="chapter-card" data-id="${e.id}">
    <div class="chapter-card-info">
      <div class="chapter-card-name">${e.name}</div>
      <div class="chapter-card-meta">${s}단어 · ${d}% 완료</div>
    </div>
    <div class="mini-progress">
      <div class="mini-fill" style="width:${d}%"></div>
    </div>
  </div>`}function ct(){var e,i,s;(e=document.getElementById("btn-go-review"))==null||e.addEventListener("click",()=>j("review")),(i=document.getElementById("btn-see-all"))==null||i.addEventListener("click",()=>j("chapters")),(s=document.getElementById("btn-add-chapter"))==null||s.addEventListener("click",()=>j("chapters")),document.querySelectorAll(".chapter-card").forEach(a=>{a.addEventListener("click",()=>j("chapter-detail",{id:a.dataset.id}))})}var lt=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function ut(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var Ye={exports:{}};/* @license
Papa Parse
v5.5.3
https://github.com/mholt/PapaParse
License: MIT
*/(function(e,i){((s,a)=>{e.exports=a()})(lt,function s(){var a=typeof self<"u"?self:typeof window<"u"?window:a!==void 0?a:{},d,o=!a.document&&!!a.postMessage,c=a.IS_PAPA_WORKER||!1,v={},p=0,h={};function z(t){this._handle=null,this._finished=!1,this._completed=!1,this._halted=!1,this._input=null,this._baseIndex=0,this._partialLine="",this._rowCount=0,this._start=0,this._nextChunk=null,this.isFirstChunk=!0,this._completeResults={data:[],errors:[],meta:{}},(function(n){var r=Oe(n);r.chunkSize=parseInt(r.chunkSize),n.step||n.chunk||(r.chunkSize=null),this._handle=new le(r),(this._handle.streamer=this)._config=r}).call(this,t),this.parseChunk=function(n,r){var u=parseInt(this._config.skipFirstNLines)||0;if(this.isFirstChunk&&0<u){let y=this._config.newline;y||(l=this._config.quoteChar||'"',y=this._handle.guessLineEndings(n,l)),n=[...n.split(y).slice(u)].join(y)}this.isFirstChunk&&L(this._config.beforeFirstChunk)&&(l=this._config.beforeFirstChunk(n))!==void 0&&(n=l),this.isFirstChunk=!1,this._halted=!1;var u=this._partialLine+n,l=(this._partialLine="",this._handle.parse(u,this._baseIndex,!this._finished));if(!this._handle.paused()&&!this._handle.aborted()){if(n=l.meta.cursor,u=(this._finished||(this._partialLine=u.substring(n-this._baseIndex),this._baseIndex=n),l&&l.data&&(this._rowCount+=l.data.length),this._finished||this._config.preview&&this._rowCount>=this._config.preview),c)a.postMessage({results:l,workerId:h.WORKER_ID,finished:u});else if(L(this._config.chunk)&&!r){if(this._config.chunk(l,this._handle),this._handle.paused()||this._handle.aborted())return void(this._halted=!0);this._completeResults=l=void 0}return this._config.step||this._config.chunk||(this._completeResults.data=this._completeResults.data.concat(l.data),this._completeResults.errors=this._completeResults.errors.concat(l.errors),this._completeResults.meta=l.meta),this._completed||!u||!L(this._config.complete)||l&&l.meta.aborted||(this._config.complete(this._completeResults,this._input),this._completed=!0),u||l&&l.meta.paused||this._nextChunk(),l}this._halted=!0},this._sendError=function(n){L(this._config.error)?this._config.error(n):c&&this._config.error&&a.postMessage({workerId:h.WORKER_ID,error:n,finished:!1})}}function ne(t){var n;(t=t||{}).chunkSize||(t.chunkSize=h.RemoteChunkSize),z.call(this,t),this._nextChunk=o?function(){this._readChunk(),this._chunkLoaded()}:function(){this._readChunk()},this.stream=function(r){this._input=r,this._nextChunk()},this._readChunk=function(){if(this._finished)this._chunkLoaded();else{if(n=new XMLHttpRequest,this._config.withCredentials&&(n.withCredentials=this._config.withCredentials),o||(n.onload=ie(this._chunkLoaded,this),n.onerror=ie(this._chunkError,this)),n.open(this._config.downloadRequestBody?"POST":"GET",this._input,!o),this._config.downloadRequestHeaders){var r,u=this._config.downloadRequestHeaders;for(r in u)n.setRequestHeader(r,u[r])}var l;this._config.chunkSize&&(l=this._start+this._config.chunkSize-1,n.setRequestHeader("Range","bytes="+this._start+"-"+l));try{n.send(this._config.downloadRequestBody)}catch(y){this._chunkError(y.message)}o&&n.status===0&&this._chunkError()}},this._chunkLoaded=function(){n.readyState===4&&(n.status<200||400<=n.status?this._chunkError():(this._start+=this._config.chunkSize||n.responseText.length,this._finished=!this._config.chunkSize||this._start>=(r=>(r=r.getResponseHeader("Content-Range"))!==null?parseInt(r.substring(r.lastIndexOf("/")+1)):-1)(n),this.parseChunk(n.responseText)))},this._chunkError=function(r){r=n.statusText||r,this._sendError(new Error(r))}}function de(t){(t=t||{}).chunkSize||(t.chunkSize=h.LocalChunkSize),z.call(this,t);var n,r,u=typeof FileReader<"u";this.stream=function(l){this._input=l,r=l.slice||l.webkitSlice||l.mozSlice,u?((n=new FileReader).onload=ie(this._chunkLoaded,this),n.onerror=ie(this._chunkError,this)):n=new FileReaderSync,this._nextChunk()},this._nextChunk=function(){this._finished||this._config.preview&&!(this._rowCount<this._config.preview)||this._readChunk()},this._readChunk=function(){var l=this._input,y=(this._config.chunkSize&&(y=Math.min(this._start+this._config.chunkSize,this._input.size),l=r.call(l,this._start,y)),n.readAsText(l,this._config.encoding));u||this._chunkLoaded({target:{result:y}})},this._chunkLoaded=function(l){this._start+=this._config.chunkSize,this._finished=!this._config.chunkSize||this._start>=this._input.size,this.parseChunk(l.target.result)},this._chunkError=function(){this._sendError(n.error)}}function oe(t){var n;z.call(this,t=t||{}),this.stream=function(r){return n=r,this._nextChunk()},this._nextChunk=function(){var r,u;if(!this._finished)return r=this._config.chunkSize,n=r?(u=n.substring(0,r),n.substring(r)):(u=n,""),this._finished=!n,this.parseChunk(u)}}function ce(t){z.call(this,t=t||{});var n=[],r=!0,u=!1;this.pause=function(){z.prototype.pause.apply(this,arguments),this._input.pause()},this.resume=function(){z.prototype.resume.apply(this,arguments),this._input.resume()},this.stream=function(l){this._input=l,this._input.on("data",this._streamData),this._input.on("end",this._streamEnd),this._input.on("error",this._streamError)},this._checkIsFinished=function(){u&&n.length===1&&(this._finished=!0)},this._nextChunk=function(){this._checkIsFinished(),n.length?this.parseChunk(n.shift()):r=!0},this._streamData=ie(function(l){try{n.push(typeof l=="string"?l:l.toString(this._config.encoding)),r&&(r=!1,this._checkIsFinished(),this.parseChunk(n.shift()))}catch(y){this._streamError(y)}},this),this._streamError=ie(function(l){this._streamCleanUp(),this._sendError(l)},this),this._streamEnd=ie(function(){this._streamCleanUp(),u=!0,this._streamData("")},this),this._streamCleanUp=ie(function(){this._input.removeListener("data",this._streamData),this._input.removeListener("end",this._streamEnd),this._input.removeListener("error",this._streamError)},this)}function le(t){var n,r,u,l,y=Math.pow(2,53),D=-y,K=/^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/,X=/^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/,_=this,O=0,g=0,U=!1,m=!1,k=[],f={data:[],errors:[],meta:{}};function A(E){return t.skipEmptyLines==="greedy"?E.join("").trim()==="":E.length===1&&E[0].length===0}function B(){if(f&&u&&(Q("Delimiter","UndetectableDelimiter","Unable to auto-detect delimiting character; defaulted to '"+h.DefaultDelimiter+"'"),u=!1),t.skipEmptyLines&&(f.data=f.data.filter(function(I){return!A(I)})),P()){let I=function(F,C){L(t.transformHeader)&&(F=t.transformHeader(F,C)),k.push(F)};var b=I;if(f)if(Array.isArray(f.data[0])){for(var E=0;P()&&E<f.data.length;E++)f.data[E].forEach(I);f.data.splice(0,1)}else f.data.forEach(I)}function $(I,F){for(var C=t.header?{}:[],S=0;S<I.length;S++){var w=S,H=I[S],H=((x,R)=>(M=>(t.dynamicTypingFunction&&t.dynamicTyping[M]===void 0&&(t.dynamicTyping[M]=t.dynamicTypingFunction(M)),(t.dynamicTyping[M]||t.dynamicTyping)===!0))(x)?R==="true"||R==="TRUE"||R!=="false"&&R!=="FALSE"&&((M=>{if(K.test(M)&&(M=parseFloat(M),D<M&&M<y))return 1})(R)?parseFloat(R):X.test(R)?new Date(R):R===""?null:R):R)(w=t.header?S>=k.length?"__parsed_extra":k[S]:w,H=t.transform?t.transform(H,w):H);w==="__parsed_extra"?(C[w]=C[w]||[],C[w].push(H)):C[w]=H}return t.header&&(S>k.length?Q("FieldMismatch","TooManyFields","Too many fields: expected "+k.length+" fields but parsed "+S,g+F):S<k.length&&Q("FieldMismatch","TooFewFields","Too few fields: expected "+k.length+" fields but parsed "+S,g+F)),C}var T;f&&(t.header||t.dynamicTyping||t.transform)&&(T=1,!f.data.length||Array.isArray(f.data[0])?(f.data=f.data.map($),T=f.data.length):f.data=$(f.data,0),t.header&&f.meta&&(f.meta.fields=k),g+=T)}function P(){return t.header&&k.length===0}function Q(E,$,T,b){E={type:E,code:$,message:T},b!==void 0&&(E.row=b),f.errors.push(E)}L(t.step)&&(l=t.step,t.step=function(E){f=E,P()?B():(B(),f.data.length!==0&&(O+=E.data.length,t.preview&&O>t.preview?r.abort():(f.data=f.data[0],l(f,_))))}),this.parse=function(E,$,T){var b=t.quoteChar||'"',b=(t.newline||(t.newline=this.guessLineEndings(E,b)),u=!1,t.delimiter?L(t.delimiter)&&(t.delimiter=t.delimiter(E),f.meta.delimiter=t.delimiter):((b=((I,F,C,S,w)=>{var H,x,R,M;w=w||[",","	","|",";",h.RECORD_SEP,h.UNIT_SEP];for(var ue=0;ue<w.length;ue++){for(var J,ge=w[ue],N=0,G=0,q=0,W=(R=void 0,new Re({comments:S,delimiter:ge,newline:F,preview:10}).parse(I)),ee=0;ee<W.data.length;ee++)C&&A(W.data[ee])?q++:(J=W.data[ee].length,G+=J,R===void 0?R=J:0<J&&(N+=Math.abs(J-R),R=J));0<W.data.length&&(G/=W.data.length-q),(x===void 0||N<=x)&&(M===void 0||M<G)&&1.99<G&&(x=N,H=ge,M=G)}return{successful:!!(t.delimiter=H),bestDelimiter:H}})(E,t.newline,t.skipEmptyLines,t.comments,t.delimitersToGuess)).successful?t.delimiter=b.bestDelimiter:(u=!0,t.delimiter=h.DefaultDelimiter),f.meta.delimiter=t.delimiter),Oe(t));return t.preview&&t.header&&b.preview++,n=E,r=new Re(b),f=r.parse(n,$,T),B(),U?{meta:{paused:!0}}:f||{meta:{paused:!1}}},this.paused=function(){return U},this.pause=function(){U=!0,r.abort(),n=L(t.chunk)?"":n.substring(r.getCharIndex())},this.resume=function(){_.streamer._halted?(U=!1,_.streamer.parseChunk(n,!0)):setTimeout(_.resume,3)},this.aborted=function(){return m},this.abort=function(){m=!0,r.abort(),f.meta.aborted=!0,L(t.complete)&&t.complete(f),n=""},this.guessLineEndings=function(I,b){I=I.substring(0,1048576);var b=new RegExp(V(b)+"([^]*?)"+V(b),"gm"),T=(I=I.replace(b,"")).split("\r"),b=I.split(`
`),I=1<b.length&&b[0].length<T[0].length;if(T.length===1||I)return`
`;for(var F=0,C=0;C<T.length;C++)T[C][0]===`
`&&F++;return F>=T.length/2?`\r
`:"\r"}}function V(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function Re(t){var n=(t=t||{}).delimiter,r=t.newline,u=t.comments,l=t.step,y=t.preview,D=t.fastMode,K=null,X=!1,_=t.quoteChar==null?'"':t.quoteChar,O=_;if(t.escapeChar!==void 0&&(O=t.escapeChar),(typeof n!="string"||-1<h.BAD_DELIMITERS.indexOf(n))&&(n=","),u===n)throw new Error("Comment character same as delimiter");u===!0?u="#":(typeof u!="string"||-1<h.BAD_DELIMITERS.indexOf(u))&&(u=!1),r!==`
`&&r!=="\r"&&r!==`\r
`&&(r=`
`);var g=0,U=!1;this.parse=function(m,k,f){if(typeof m!="string")throw new Error("Input must be a string");var A=m.length,B=n.length,P=r.length,Q=u.length,E=L(l),$=[],T=[],b=[],I=g=0;if(!m)return N();if(D||D!==!1&&m.indexOf(_)===-1){for(var F=m.split(r),C=0;C<F.length;C++){if(b=F[C],g+=b.length,C!==F.length-1)g+=r.length;else if(f)return N();if(!u||b.substring(0,Q)!==u){if(E){if($=[],M(b.split(n)),G(),U)return N()}else M(b.split(n));if(y&&y<=C)return $=$.slice(0,y),N(!0)}}return N()}for(var S=m.indexOf(n,g),w=m.indexOf(r,g),H=new RegExp(V(O)+V(_),"g"),x=m.indexOf(_,g);;)if(m[g]===_)for(x=g,g++;;){if((x=m.indexOf(_,x+1))===-1)return f||T.push({type:"Quotes",code:"MissingQuotes",message:"Quoted field unterminated",row:$.length,index:g}),J();if(x===A-1)return J(m.substring(g,x).replace(H,_));if(_===O&&m[x+1]===O)x++;else if(_===O||x===0||m[x-1]!==O){S!==-1&&S<x+1&&(S=m.indexOf(n,x+1));var R=ue((w=w!==-1&&w<x+1?m.indexOf(r,x+1):w)===-1?S:Math.min(S,w));if(m.substr(x+1+R,B)===n){b.push(m.substring(g,x).replace(H,_)),m[g=x+1+R+B]!==_&&(x=m.indexOf(_,g)),S=m.indexOf(n,g),w=m.indexOf(r,g);break}if(R=ue(w),m.substring(x+1+R,x+1+R+P)===r){if(b.push(m.substring(g,x).replace(H,_)),ge(x+1+R+P),S=m.indexOf(n,g),x=m.indexOf(_,g),E&&(G(),U))return N();if(y&&$.length>=y)return N(!0);break}T.push({type:"Quotes",code:"InvalidQuotes",message:"Trailing quote on quoted field is malformed",row:$.length,index:g}),x++}}else if(u&&b.length===0&&m.substring(g,g+Q)===u){if(w===-1)return N();g=w+P,w=m.indexOf(r,g),S=m.indexOf(n,g)}else if(S!==-1&&(S<w||w===-1))b.push(m.substring(g,S)),g=S+B,S=m.indexOf(n,g);else{if(w===-1)break;if(b.push(m.substring(g,w)),ge(w+P),E&&(G(),U))return N();if(y&&$.length>=y)return N(!0)}return J();function M(q){$.push(q),I=g}function ue(q){var W=0;return W=q!==-1&&(q=m.substring(x+1,q))&&q.trim()===""?q.length:W}function J(q){return f||(q===void 0&&(q=m.substring(g)),b.push(q),g=A,M(b),E&&G()),N()}function ge(q){g=q,M(b),b=[],w=m.indexOf(r,g)}function N(q){if(t.header&&!k&&$.length&&!X){var W=$[0],ee=Object.create(null),Te=new Set(W);let Ue=!1;for(let he=0;he<W.length;he++){let Y=W[he];if(ee[Y=L(t.transformHeader)?t.transformHeader(Y,he):Y]){let me,He=ee[Y];for(;me=Y+"_"+He,He++,Te.has(me););Te.add(me),W[he]=me,ee[Y]++,Ue=!0,(K=K===null?{}:K)[me]=Y}else ee[Y]=1,W[he]=Y;Te.add(Y)}Ue&&console.warn("Duplicate headers found and renamed."),X=!0}return{data:$,errors:T,meta:{delimiter:n,linebreak:r,aborted:U,truncated:!!q,cursor:I+(k||0),renamedHeaders:K}}}function G(){l(N()),$=[],T=[]}},this.abort=function(){U=!0},this.getCharIndex=function(){return g}}function tt(t){var n=t.data,r=v[n.workerId],u=!1;if(n.error)r.userError(n.error,n.file);else if(n.results&&n.results.data){var l={abort:function(){u=!0,je(n.workerId,{data:[],errors:[],meta:{aborted:!0}})},pause:ze,resume:ze};if(L(r.userStep)){for(var y=0;y<n.results.data.length&&(r.userStep({data:n.results.data[y],errors:n.results.errors,meta:n.results.meta},l),!u);y++);delete n.results}else L(r.userChunk)&&(r.userChunk(n.results,l,n.file),delete n.results)}n.finished&&!u&&je(n.workerId,n.results)}function je(t,n){var r=v[t];L(r.userComplete)&&r.userComplete(n),r.terminate(),delete v[t]}function ze(){throw new Error("Not implemented.")}function Oe(t){if(typeof t!="object"||t===null)return t;var n,r=Array.isArray(t)?[]:{};for(n in t)r[n]=Oe(t[n]);return r}function ie(t,n){return function(){t.apply(n,arguments)}}function L(t){return typeof t=="function"}return h.parse=function(t,n){var r=(n=n||{}).dynamicTyping||!1;if(L(r)&&(n.dynamicTypingFunction=r,r={}),n.dynamicTyping=r,n.transform=!!L(n.transform)&&n.transform,!n.worker||!h.WORKERS_SUPPORTED)return r=null,h.NODE_STREAM_INPUT,typeof t=="string"?(t=(u=>u.charCodeAt(0)!==65279?u:u.slice(1))(t),r=new(n.download?ne:oe)(n)):t.readable===!0&&L(t.read)&&L(t.on)?r=new ce(n):(a.File&&t instanceof File||t instanceof Object)&&(r=new de(n)),r.stream(t);(r=(()=>{var u;return!!h.WORKERS_SUPPORTED&&(u=(()=>{var l=a.URL||a.webkitURL||null,y=s.toString();return h.BLOB_URL||(h.BLOB_URL=l.createObjectURL(new Blob(["var global = (function() { if (typeof self !== 'undefined') { return self; } if (typeof window !== 'undefined') { return window; } if (typeof global !== 'undefined') { return global; } return {}; })(); global.IS_PAPA_WORKER=true; ","(",y,")();"],{type:"text/javascript"})))})(),(u=new a.Worker(u)).onmessage=tt,u.id=p++,v[u.id]=u)})()).userStep=n.step,r.userChunk=n.chunk,r.userComplete=n.complete,r.userError=n.error,n.step=L(n.step),n.chunk=L(n.chunk),n.complete=L(n.complete),n.error=L(n.error),delete n.worker,r.postMessage({input:t,config:n,workerId:r.id})},h.unparse=function(t,n){var r=!1,u=!0,l=",",y=`\r
`,D='"',K=D+D,X=!1,_=null,O=!1,g=((()=>{if(typeof n=="object"){if(typeof n.delimiter!="string"||h.BAD_DELIMITERS.filter(function(k){return n.delimiter.indexOf(k)!==-1}).length||(l=n.delimiter),typeof n.quotes!="boolean"&&typeof n.quotes!="function"&&!Array.isArray(n.quotes)||(r=n.quotes),typeof n.skipEmptyLines!="boolean"&&typeof n.skipEmptyLines!="string"||(X=n.skipEmptyLines),typeof n.newline=="string"&&(y=n.newline),typeof n.quoteChar=="string"&&(D=n.quoteChar),typeof n.header=="boolean"&&(u=n.header),Array.isArray(n.columns)){if(n.columns.length===0)throw new Error("Option columns is empty");_=n.columns}n.escapeChar!==void 0&&(K=n.escapeChar+D),n.escapeFormulae instanceof RegExp?O=n.escapeFormulae:typeof n.escapeFormulae=="boolean"&&n.escapeFormulae&&(O=/^[=+\-@\t\r].*$/)}})(),new RegExp(V(D),"g"));if(typeof t=="string"&&(t=JSON.parse(t)),Array.isArray(t)){if(!t.length||Array.isArray(t[0]))return U(null,t,X);if(typeof t[0]=="object")return U(_||Object.keys(t[0]),t,X)}else if(typeof t=="object")return typeof t.data=="string"&&(t.data=JSON.parse(t.data)),Array.isArray(t.data)&&(t.fields||(t.fields=t.meta&&t.meta.fields||_),t.fields||(t.fields=Array.isArray(t.data[0])?t.fields:typeof t.data[0]=="object"?Object.keys(t.data[0]):[]),Array.isArray(t.data[0])||typeof t.data[0]=="object"||(t.data=[t.data])),U(t.fields||[],t.data||[],X);throw new Error("Unable to serialize unrecognized input");function U(k,f,A){var B="",P=(typeof k=="string"&&(k=JSON.parse(k)),typeof f=="string"&&(f=JSON.parse(f)),Array.isArray(k)&&0<k.length),Q=!Array.isArray(f[0]);if(P&&u){for(var E=0;E<k.length;E++)0<E&&(B+=l),B+=m(k[E],E);0<f.length&&(B+=y)}for(var $=0;$<f.length;$++){var T=(P?k:f[$]).length,b=!1,I=P?Object.keys(f[$]).length===0:f[$].length===0;if(A&&!P&&(b=A==="greedy"?f[$].join("").trim()==="":f[$].length===1&&f[$][0].length===0),A==="greedy"&&P){for(var F=[],C=0;C<T;C++){var S=Q?k[C]:C;F.push(f[$][S])}b=F.join("").trim()===""}if(!b){for(var w=0;w<T;w++){0<w&&!I&&(B+=l);var H=P&&Q?k[w]:w;B+=m(f[$][H],w)}$<f.length-1&&(!A||0<T&&!I)&&(B+=y)}}return B}function m(k,f){var A,B;return k==null?"":k.constructor===Date?JSON.stringify(k).slice(1,25):(B=!1,O&&typeof k=="string"&&O.test(k)&&(k="'"+k,B=!0),A=k.toString().replace(g,K),(B=B||r===!0||typeof r=="function"&&r(k,f)||Array.isArray(r)&&r[f]||((P,Q)=>{for(var E=0;E<Q.length;E++)if(-1<P.indexOf(Q[E]))return!0;return!1})(A,h.BAD_DELIMITERS)||-1<A.indexOf(l)||A.charAt(0)===" "||A.charAt(A.length-1)===" ")?D+A+D:A)}},h.RECORD_SEP="",h.UNIT_SEP="",h.BYTE_ORDER_MARK="\uFEFF",h.BAD_DELIMITERS=["\r",`
`,'"',h.BYTE_ORDER_MARK],h.WORKERS_SUPPORTED=!o&&!!a.Worker,h.NODE_STREAM_INPUT=1,h.LocalChunkSize=10485760,h.RemoteChunkSize=5242880,h.DefaultDelimiter=",",h.Parser=Re,h.ParserHandle=le,h.NetworkStreamer=ne,h.FileStreamer=de,h.StringStreamer=oe,h.ReadableStreamStreamer=ce,a.jQuery&&((d=a.jQuery).fn.parse=function(t){var n=t.config||{},r=[];return this.each(function(y){if(!(d(this).prop("tagName").toUpperCase()==="INPUT"&&d(this).attr("type").toLowerCase()==="file"&&a.FileReader)||!this.files||this.files.length===0)return!0;for(var D=0;D<this.files.length;D++)r.push({file:this.files[D],inputElem:this,instanceConfig:d.extend({},n)})}),u(),this;function u(){if(r.length===0)L(t.complete)&&t.complete();else{var y,D,K,X,_=r[0];if(L(t.before)){var O=t.before(_.file,_.inputElem);if(typeof O=="object"){if(O.action==="abort")return y="AbortError",D=_.file,K=_.inputElem,X=O.reason,void(L(t.error)&&t.error({name:y},D,K,X));if(O.action==="skip")return void l();typeof O.config=="object"&&(_.instanceConfig=d.extend(_.instanceConfig,O.config))}else if(O==="skip")return void l()}var g=_.instanceConfig.complete;_.instanceConfig.complete=function(U){L(g)&&g(U,_.file,_.inputElem),l()},h.parse(_.file,_.instanceConfig)}}function l(){r.splice(0,1),u()}}),c&&(a.onmessage=function(t){t=t.data,h.WORKER_ID===void 0&&t&&(h.WORKER_ID=t.workerId),typeof t.input=="string"?a.postMessage({workerId:h.WORKER_ID,results:h.parse(t.input,t.config),finished:!0}):(a.File&&t.input instanceof File||t.input instanceof Object)&&(t=h.parse(t.input,t.config))&&a.postMessage({workerId:h.WORKER_ID,results:t,finished:!0})}),(ne.prototype=Object.create(z.prototype)).constructor=ne,(de.prototype=Object.create(z.prototype)).constructor=de,(oe.prototype=Object.create(oe.prototype)).constructor=oe,(ce.prototype=Object.create(z.prototype)).constructor=ce,h})})(Ye);var ht=Ye.exports;const ft=ut(ht);function pt(e){const{data:i}=ft.parse(e.trim(),{header:!0,skipEmptyLines:!0,transformHeader:s=>s.trim()});return i.map((s,a)=>{const d=(s.영단어||s.word||s.Word||"").trim(),o=(s.뜻||s.meaning||s.Meaning||"").trim(),c=(s.동의어||s.synonym||s.Synonym||"").trim();return{id:parseInt(s.번호||s.id||a+1),word:d,meaning:o,synonym:c}}).filter(s=>s.word)}function vt(){const e=ae();return`
<div class="view chapters-view">
  <div class="view-header">
    <h2>챕터</h2>
    <button class="icon-btn" id="btn-upload" title="CSV 업로드">➕</button>
  </div>

  <input type="file" id="csv-input" accept=".csv" style="display:none" />

  ${e.length===0?`<div class="empty-state">
        <div style="font-size:3rem">📂</div>
        <p>아직 챕터가 없어요</p>
        <button class="btn-primary" id="btn-upload-main">CSV 업로드</button>
      </div>`:`<div class="chapter-list-full">
        ${e.map(i=>gt(i)).join("")}
      </div>`}
</div>`}function gt(e){const i=_e(e.id),s=e.words.length,a=e.words.filter(c=>{var v;return((v=i[c.id])==null?void 0:v.mastery)==="mastered"}).length,d=e.words.filter(c=>{var v;return["learning","review"].includes((v=i[c.id])==null?void 0:v.mastery)}).length,o=s>0?Math.round(a/s*100):0;return`
  <div class="chapter-row" data-id="${e.id}">
    <div class="chapter-row-main">
      <div class="chapter-row-name">${e.name}</div>
      <div class="chapter-row-stats">
        <span class="stat-chip new">${s-a-d}신규</span>
        <span class="stat-chip learning">${d}학습중</span>
        <span class="stat-chip mastered">${a}완료</span>
      </div>
      <div class="mini-progress">
        <div class="mini-fill" style="width:${o}%"></div>
      </div>
    </div>
    <button class="delete-btn" data-del="${e.id}" title="삭제">✕</button>
  </div>`}function mt(){var s,a;const e=document.getElementById("csv-input");function i(){e.click()}(s=document.getElementById("btn-upload"))==null||s.addEventListener("click",i),(a=document.getElementById("btn-upload-main"))==null||a.addEventListener("click",i),e.addEventListener("change",async d=>{const o=d.target.files[0];if(!o)return;const c=await o.text();try{const v=pt(c);if(!v.length){fe("단어를 찾을 수 없어요");return}const p=o.name.replace(/\.csv$/i,""),h={id:`ch_${Date.now()}`,name:p,words:v,createdAt:Date.now()};nt(h),fe(`"${p}" 챕터 추가 완료 (${v.length}단어)`),j("chapters")}catch(v){fe("CSV 파싱 오류: "+v.message)}e.value=""}),document.querySelectorAll(".chapter-row").forEach(d=>{d.addEventListener("click",o=>{o.target.closest(".delete-btn")||j("chapter-detail",{id:d.dataset.id})})}),document.querySelectorAll(".delete-btn").forEach(d=>{d.addEventListener("click",o=>{o.stopPropagation();const c=d.dataset.del,v=ae().find(p=>p.id===c);confirm(`"${v==null?void 0:v.name}" 챕터를 삭제할까요?`)&&(it(c),fe("챕터 삭제됨"),j("chapters"))})})}function yt({id:e}={}){const i=Ne(e);if(!i)return'<div class="view"><p>챕터를 찾을 수 없어요</p></div>';const s=_e(e),a=i.words.length,d=i.words.filter(v=>{var p;return((p=s[v.id])==null?void 0:p.mastery)==="mastered"}).length,o=i.words.filter(v=>Ce(s[v.id])).length,c=a>0?Math.round(d/a*100):0;return`
<div class="view detail-view">
  <div class="view-header">
    <button class="back-btn" id="btn-back">‹</button>
    <h2>${i.name}</h2>
    <span></span>
  </div>

  <div class="detail-stats">
    <div class="dstat">
      <div class="dstat-num">${a}</div>
      <div class="dstat-label">전체</div>
    </div>
    <div class="dstat">
      <div class="dstat-num" style="color:#22c55e">${d}</div>
      <div class="dstat-label">완료</div>
    </div>
    <div class="dstat">
      <div class="dstat-num" style="color:#f59e0b">${o}</div>
      <div class="dstat-label">복습 필요</div>
    </div>
    <div class="dstat">
      <div class="dstat-num">${c}%</div>
      <div class="dstat-label">마스터</div>
    </div>
  </div>

  <div class="progress-bar-wrap">
    <div class="progress-bar-fill" style="width:${c}%"></div>
  </div>

  <div class="study-btns">
    <button class="study-btn flashcard" data-mode="flashcard" data-id="${e}">
      <span>🃏</span><span>플래시카드</span>
    </button>
    <button class="study-btn typing" data-mode="typing" data-id="${e}">
      <span>⌨️</span><span>타이핑 테스트</span>
    </button>
    <button class="study-btn srs ${o===0?"disabled":""}" data-mode="srs" data-id="${e}" ${o===0?"disabled":""}>
      <span>🔄</span><span>SRS 복습 ${o>0?`(${o})`:"(없음)"}</span>
    </button>
  </div>

  <div class="word-list">
    ${i.words.map(v=>{const p=s[v.id]||{},h=rt(p.mastery),z=at(p.mastery);return`
      <div class="word-item">
        <div class="word-item-main">
          <div class="word-en">${v.word}</div>
          <div class="word-ko">${v.meaning}</div>
          ${v.synonym?`<div class="word-syn">= ${v.synonym}</div>`:""}
        </div>
        <div class="mastery-dot" style="background:${z}" title="${h}"></div>
      </div>`}).join("")}
  </div>
</div>`}function bt({id:e}={}){var i;(i=document.getElementById("btn-back"))==null||i.addEventListener("click",()=>j("chapters")),document.querySelectorAll(".study-btn:not(.disabled)").forEach(s=>{s.addEventListener("click",()=>{j("study",{chapterId:s.dataset.id,mode:s.dataset.mode})})})}let te=[],pe=0,Be=!1,Pe="",Ee="",$e=0,ye=0;function wt({chapterId:e,mode:i}={}){Ee=e,Pe=i;const s=Ne(e);return s?(i==="srs"?te=s.words.filter(a=>Ce(Le(e,a.id))):te=[...s.words].sort(()=>Math.random()-.5),pe=0,$e=0,ye=0,te.length===0?`<div class="view study-view">
      <div class="view-header">
        <button class="back-btn" id="btn-back">‹</button>
        <h2>${s.name}</h2><span></span>
      </div>
      <div class="empty-state"><div style="font-size:3rem">✅</div><p>복습할 단어가 없어요!</p></div>
    </div>`:`
<div class="view study-view" id="study-root">
  <div class="view-header">
    <button class="back-btn" id="btn-back">‹</button>
    <h2>${s.name} · ${_t(i)}</h2>
    <span class="progress-text" id="progress-text">1/${te.length}</span>
  </div>
  <div class="session-progress-bar">
    <div class="session-progress-fill" id="session-bar" style="width:0%"></div>
  </div>
  <div id="card-area"></div>
</div>`):'<div class="view"><p>챕터 없음</p></div>'}function _t(e){return{flashcard:"플래시카드",typing:"타이핑",srs:"SRS 복습"}[e]||e}function kt({chapterId:e,mode:i}={}){var s;(s=document.getElementById("btn-back"))==null||s.addEventListener("click",()=>j("chapter-detail",{id:e})),te.length>0&&Ze()}function Ze(){const e=document.getElementById("card-area");if(!e)return;if(pe>=te.length){Lt();return}const i=te[pe];St(),Pe==="typing"?$t(e,i):Et(e,i)}function Et(e,i){Be=!1,e.innerHTML=`
  <div class="flashcard-wrap">
    <div class="flashcard" id="fc">
      <div class="fc-front">
        <div class="fc-word">${i.word}</div>
        <div class="fc-hint">탭하여 뒤집기</div>
      </div>
      <div class="fc-back" style="display:none">
        <div class="fc-meaning">${i.meaning}</div>
        ${i.synonym?`<div class="fc-syn">동의어: ${i.synonym}</div>`:""}
      </div>
    </div>
    <div class="rating-row" id="rating-row" style="display:none">
      <button class="rating-btn again"  data-q="again">다시<br><small>0xp</small></button>
      <button class="rating-btn hard"   data-q="hard">어려움<br><small>+1xp</small></button>
      <button class="rating-btn good"   data-q="good">좋음<br><small>+5xp</small></button>
      <button class="rating-btn perfect" data-q="perfect">완벽<br><small>+5xp</small></button>
    </div>
  </div>`,document.getElementById("fc").addEventListener("click",()=>{Be||(Be=!0,document.querySelector(".fc-front").style.display="none",document.querySelector(".fc-back").style.display="flex",document.getElementById("rating-row").style.display="flex")}),document.getElementById("rating-row").addEventListener("click",s=>{const a=s.target.closest(".rating-btn");if(!a)return;const d=a.dataset.q,o=se[d],c=o>=4?Z.flashcard_good:Z.flashcard_again;Ae(i,o,c,o>=3)})}function $t(e,i){e.innerHTML=`
  <div class="typing-wrap">
    <div class="typing-prompt">
      <div class="typing-meaning">${i.meaning}</div>
      ${i.synonym?`<div class="typing-syn">동의어: ${i.synonym}</div>`:""}
    </div>
    <div class="typing-input-wrap">
      <input type="text" id="typing-input" placeholder="영단어를 입력하세요..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
      <button class="hint-btn" id="btn-hint">힌트</button>
    </div>
    <div class="hint-text" id="hint-text"></div>
    <button class="btn-primary" id="btn-check">확인</button>
    <div class="typing-result" id="typing-result" style="display:none"></div>
  </div>`;const s=document.getElementById("typing-input");s.focus();let a=0;document.getElementById("btn-hint").addEventListener("click",()=>{a++;const o=i.word.split("").map((c,v)=>v<a?c:"_").join(" ");document.getElementById("hint-text").textContent=o});function d(){const o=s.value.trim().toLowerCase(),c=i.word.toLowerCase(),v=o===c,p=document.getElementById("typing-result");if(p.style.display="block",v){p.innerHTML=`<div class="result-correct">✅ 정답! <strong>${i.word}</strong></div>`;const h=a===0?Z.typing_correct:Z.typing_hint;setTimeout(()=>Ae(i,se.good,h,!0),900)}else p.innerHTML=`<div class="result-wrong">❌ 오답 — 정답: <strong>${i.word}</strong></div>`,setTimeout(()=>Ae(i,se.again,Z.typing_wrong,!1),1200);document.getElementById("btn-check").disabled=!0,s.disabled=!0}document.getElementById("btn-check").addEventListener("click",d),s.addEventListener("keydown",o=>{o.key==="Enter"&&d()})}function Ae(e,i,s,a){const d=Le(Ee,e.id),o=Ge(i,d);We(Ee,e.id,o);let c=Ie();c=Ve(c),c=Qe(c,s),c.totalStudied++,a&&c.totalCorrect++;const{stats:v,earned:p}=Je(c);Ke(v),s>0&&xt(s),p.forEach(h=>fe(`🏅 뱃지 획득: ${h.icon} ${h.name}`)),ye++,a&&$e++,pe++,Ze()}function xt(e){var s;const i=document.createElement("div");i.className="xp-popup",i.textContent=`+${e} XP`,(s=document.getElementById("card-area"))==null||s.appendChild(i),setTimeout(()=>i.remove(),1e3)}function St(){const e=pe/te.length*100,i=document.getElementById("session-bar"),s=document.getElementById("progress-text");i&&(i.style.width=e+"%"),s&&(s.textContent=`${pe+1}/${te.length}`)}function Lt(){const e=ye>0?Math.round($e/ye*100):0,i=document.getElementById("card-area");i&&(i.innerHTML=`
  <div class="summary-card">
    <div class="summary-title">세션 완료! 🎉</div>
    <div class="summary-score">${e}%</div>
    <div class="summary-detail">${$e} / ${ye} 정답</div>
    <div class="summary-btns">
      <button class="btn-primary" id="btn-again">다시 학습</button>
      <button class="btn-secondary" id="btn-home">홈으로</button>
    </div>
  </div>`,document.getElementById("btn-again").addEventListener("click",()=>{j("study",{chapterId:Ee,mode:Pe})}),document.getElementById("btn-home").addEventListener("click",()=>j("home")))}let re=[],ve=0,De=!1,xe=0,be=0;function It(){const e=ae(),i=[];for(const s of e)for(const a of s.words){const d=Le(s.id,a.id);Ce(d)&&i.push({...a,chapterId:s.id,chapterName:s.name})}return re=i.sort(()=>Math.random()-.5),ve=0,xe=0,be=0,re.length===0?`<div class="view review-view">
      <div class="view-header"><h2>전체 복습</h2><span></span></div>
      <div class="empty-state">
        <div style="font-size:3rem">🎉</div>
        <p>복습할 단어가 없어요!<br>모두 완료했습니다.</p>
        <button class="btn-primary" id="btn-go-chapters">챕터 추가</button>
      </div>
    </div>`:`
<div class="view review-view" id="review-root">
  <div class="view-header">
    <h2>전체 복습</h2>
    <span class="progress-text" id="progress-text">1/${re.length}</span>
  </div>
  <div class="session-progress-bar">
    <div class="session-progress-fill" id="session-bar" style="width:0%"></div>
  </div>
  <div id="review-chapter-label" class="chapter-label"></div>
  <div id="card-area"></div>
</div>`}function Ct(){var e;(e=document.getElementById("btn-go-chapters"))==null||e.addEventListener("click",()=>j("chapters")),re.length>0&&et()}function et(){const e=document.getElementById("card-area");if(!e)return;if(ve>=re.length){Bt();return}const i=re[ve],s=document.getElementById("review-chapter-label");s&&(s.textContent=`📚 ${i.chapterName}`),Tt(),Math.random()>.4?Rt(e,i):Ot(e,i)}function Rt(e,i){De=!1,e.innerHTML=`
  <div class="flashcard-wrap">
    <div class="flashcard" id="fc">
      <div class="fc-front">
        <div class="fc-word">${i.word}</div>
        <div class="fc-hint">탭하여 뒤집기</div>
      </div>
      <div class="fc-back" style="display:none">
        <div class="fc-meaning">${i.meaning}</div>
        ${i.synonym?`<div class="fc-syn">동의어: ${i.synonym}</div>`:""}
      </div>
    </div>
    <div class="rating-row" id="rating-row" style="display:none">
      <button class="rating-btn again"  data-q="again">다시</button>
      <button class="rating-btn hard"   data-q="hard">어려움</button>
      <button class="rating-btn good"   data-q="good">좋음</button>
      <button class="rating-btn perfect" data-q="perfect">완벽</button>
    </div>
  </div>`,document.getElementById("fc").addEventListener("click",()=>{De||(De=!0,document.querySelector(".fc-front").style.display="none",document.querySelector(".fc-back").style.display="flex",document.getElementById("rating-row").style.display="flex")}),document.getElementById("rating-row").addEventListener("click",s=>{const a=s.target.closest(".rating-btn");if(!a)return;const d=a.dataset.q;Me(i,se[d],se[d]>=4?Z.flashcard_good:Z.flashcard_again,se[d]>=3)})}function Ot(e,i){e.innerHTML=`
  <div class="typing-wrap">
    <div class="typing-prompt">
      <div class="typing-meaning">${i.meaning}</div>
      ${i.synonym?`<div class="typing-syn">동의어: ${i.synonym}</div>`:""}
    </div>
    <div class="typing-input-wrap">
      <input type="text" id="typing-input" placeholder="영단어 입력..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"/>
      <button class="hint-btn" id="btn-hint">힌트</button>
    </div>
    <div class="hint-text" id="hint-text"></div>
    <button class="btn-primary" id="btn-check">확인</button>
    <div class="typing-result" id="typing-result" style="display:none"></div>
  </div>`;const s=document.getElementById("typing-input");s.focus();let a=0;document.getElementById("btn-hint").addEventListener("click",()=>{a++,document.getElementById("hint-text").textContent=i.word.split("").map((o,c)=>c<a?o:"_").join(" ")});function d(){const o=s.value.trim().toLowerCase()===i.word.toLowerCase(),c=document.getElementById("typing-result");if(c.style.display="block",o){c.innerHTML=`<div class="result-correct">✅ 정답! <strong>${i.word}</strong></div>`;const v=a===0?Z.typing_correct:Z.typing_hint;setTimeout(()=>Me(i,se.good,v,!0),900)}else c.innerHTML=`<div class="result-wrong">❌ 정답: <strong>${i.word}</strong></div>`,setTimeout(()=>Me(i,se.again,Z.typing_wrong,!1),1200);document.getElementById("btn-check").disabled=!0,s.disabled=!0}document.getElementById("btn-check").addEventListener("click",d),s.addEventListener("keydown",o=>{o.key==="Enter"&&d()})}function Me(e,i,s,a){const d=Le(e.chapterId,e.id),o=Ge(i,d);We(e.chapterId,e.id,o);let c=Ie();c=Ve(c),c=Qe(c,s),c.totalStudied++,a&&c.totalCorrect++;const{stats:v,earned:p}=Je(c);Ke(v),p.forEach(h=>fe(`🏅 뱃지: ${h.icon} ${h.name}`)),be++,a&&xe++,ve++,et()}function Tt(){const e=ve/re.length*100,i=document.getElementById("session-bar"),s=document.getElementById("progress-text");i&&(i.style.width=e+"%"),s&&(s.textContent=`${ve+1}/${re.length}`)}function Bt(){var s,a;const e=be>0?Math.round(xe/be*100):0,i=document.getElementById("card-area");i&&(i.innerHTML=`
  <div class="summary-card">
    <div class="summary-title">복습 완료! 🎉</div>
    <div class="summary-score">${e}%</div>
    <div class="summary-detail">${xe} / ${be} 정답</div>
    <div class="summary-btns">
      <button class="btn-primary" id="btn-again">다시 복습</button>
      <button class="btn-secondary" id="btn-home">홈으로</button>
    </div>
  </div>`,(s=document.getElementById("btn-again"))==null||s.addEventListener("click",()=>j("review")),(a=document.getElementById("btn-home"))==null||a.addEventListener("click",()=>j("home")))}function Dt(){const e=Ie(),i=ae(),{pct:s,current:a,needed:d}=Xe(e),o=e.totalStudied>0?Math.round(e.totalCorrect/e.totalStudied*100):0,c=i.map(p=>{const h=_e(p.id),z=p.words.length,ne=p.words.filter(le=>{var V;return((V=h[le.id])==null?void 0:V.mastery)==="mastered"}).length,de=p.words.filter(le=>{var V;return["learning","review"].includes((V=h[le.id])==null?void 0:V.mastery)}).length,oe=z-ne-de,ce=z>0?Math.round(ne/z*100):0;return{name:p.name,total:z,mastered:ne,learning:de,newCount:oe,p:ce}}),v=qe.map(p=>({...p,earned:e.badges.includes(p.id)}));return`
<div class="view stats-view">
  <div class="view-header"><h2>통계</h2><span></span></div>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-big">${e.totalStudied.toLocaleString()}</div>
      <div class="stat-lbl">총 학습</div>
    </div>
    <div class="stat-card">
      <div class="stat-big">${o}%</div>
      <div class="stat-lbl">정확도</div>
    </div>
    <div class="stat-card">
      <div class="stat-big">${e.streak}</div>
      <div class="stat-lbl">연속 일수</div>
    </div>
    <div class="stat-card">
      <div class="stat-big">Lv.${e.level}</div>
      <div class="stat-lbl">${e.xp} XP</div>
    </div>
  </div>

  <div class="section-title">레벨 진행</div>
  <div class="xp-card">
    <div class="xp-top">
      <div class="level-circle">Lv.${e.level}</div>
      <div class="xp-info">
        <div class="xp-total">${e.xp} XP</div>
        <div class="xp-sub">${d>0?`다음 레벨까지 ${d} XP`:"🏆 최고 레벨"}</div>
      </div>
    </div>
    <div class="xp-bar-wrap">
      <div class="xp-bar-fill" style="width:${Math.min(s,100)}%"></div>
    </div>
  </div>

  ${c.length>0?`
    <div class="section-title">챕터별 현황</div>
    <div class="chapter-stats-list">
      ${c.map(p=>`
      <div class="cstat-row">
        <div class="cstat-name">${p.name}</div>
        <div class="cstat-chips">
          <span class="stat-chip new">${p.newCount}신규</span>
          <span class="stat-chip learning">${p.learning}학습중</span>
          <span class="stat-chip mastered">${p.mastered}완료</span>
        </div>
        <div class="mini-progress">
          <div class="mini-fill" style="width:${p.p}%"></div>
        </div>
      </div>`).join("")}
    </div>`:""}

  <div class="section-title">뱃지</div>
  <div class="badge-grid">
    ${v.map(p=>`
    <div class="badge-cell ${p.earned?"earned":"locked"}" title="${p.name}">
      <div class="badge-icon">${p.earned?p.icon:"🔒"}</div>
      <div class="badge-label">${p.name}</div>
    </div>`).join("")}
  </div>
</div>`}function At(){}const Mt={home:{render:dt,setup:ct,nav:"home"},chapters:{render:vt,setup:mt,nav:"chapters"},"chapter-detail":{render:yt,setup:bt,nav:"chapters"},study:{render:wt,setup:kt,nav:null},review:{render:It,setup:Ct,nav:"review"},stats:{render:Dt,setup:At,nav:"stats"}};function j(e,i={}){var d;const s=Mt[e];if(!s)return;const a=document.getElementById("view");a.innerHTML=s.render(i),(d=s.setup)==null||d.call(s,i),a.scrollTop=0,document.querySelectorAll(".nav-btn").forEach(o=>{o.classList.toggle("active",o.dataset.route===s.nav)})}document.getElementById("bottom-nav").addEventListener("click",e=>{const i=e.target.closest(".nav-btn");i&&j(i.dataset.route)});function fe(e,i=2500){const s=document.getElementById("toast-container"),a=document.createElement("div");a.className="toast",a.textContent=e,s.appendChild(a),requestAnimationFrame(()=>a.classList.add("show")),setTimeout(()=>{a.classList.remove("show"),setTimeout(()=>a.remove(),300)},i)}j("home");
