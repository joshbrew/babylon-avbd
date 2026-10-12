var globalThis;(globalThis||={}).AVBD=(()=>{var Ba=Object.defineProperty;var Ru=Object.getOwnPropertyDescriptor;var Ou=Object.getOwnPropertyNames;var Tu=Object.prototype.hasOwnProperty;var ju=(s,e)=>{for(var t in e)Ba(s,t,{get:e[t],enumerable:!0})},Du=(s,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of Ou(e))!Tu.call(s,r)&&r!==t&&Ba(s,r,{get:()=>e[r],enumerable:!(i=Ru(e,r))||i.enumerable});return s};var Gu=s=>Du(Ba({},"__esModule",{value:!0}),s);var jd={};ju(jd,{AvbdPhysics:()=>ps,AvbdPhysicsAggregate:()=>ms,AvbdPhysicsBody:()=>Rr,AvbdPhysicsConstraint:()=>Pr,AvbdPhysicsHinge:()=>Lr,AvbdScene2D:()=>va,AvbdScene3D:()=>ya,AvbdShapeType:()=>rt,GPUBufferRecycler:()=>Hr,GpuContactSample:()=>Aa,GpuSurfaceParticles:()=>xa,GpuTimer:()=>Wr,INPUT_WORDS:()=>Lu,PARTICLE_BYTE_STRIDE:()=>Ls,WorkerCanvas:()=>wa,addGpuStepPass:()=>Pu,cookHeightfield:()=>Mr,cookStaticMesh:()=>zr,createSharedInput:()=>_u,createSolverPipeline:()=>yu,createWebGPUDevice:()=>Sr,prepareWebGPUDevice3D:()=>Ni,readSharedInput:()=>Mu,sampledContactShader:()=>Su,seedConstraintColoring:()=>ku,writeSharedInput:()=>Eu});var S=(s=0,e=0,t=0)=>Float64Array.of(s,e,t),jt=(s=0,e=0,t=0,i=1)=>Float64Array.of(s,e,t,i),ae=()=>new Float64Array(9);var Es=s=>s<0?-1:s>0?1:0,Bt=(s,e)=>s<e?s:e,Fu=(s,e)=>s>e?s:e,ce=(s,e,t)=>Fu(e,Bt(t,s)),V=(s,e)=>s[0]*e[0]+s[1]*e[1]+s[2]*e[2],Ne=s=>V(s,s),sr=s=>Math.sqrt(Ne(s));function ct(s,e,t,i){return s[0]=e,s[1]=t,s[2]=i,s}var Li=(s,e,t)=>ct(s,e[0]+t[0],e[1]+t[1],e[2]+t[2]),J=(s,e,t)=>ct(s,e[0]-t[0],e[1]-t[1],e[2]-t[2]),ne=(s,e,t)=>ct(s,e[0]*t,e[1]*t,e[2]*t),_t=(s,e,t)=>ct(s,e[0]/t,e[1]/t,e[2]/t),ee=(s,e)=>ct(s,-e[0],-e[1],-e[2]),Ca=(s,e)=>ct(s,Math.abs(e[0]),Math.abs(e[1]),Math.abs(e[2])),D=(s,e,t,i)=>ct(s,e[0]+t[0]*i,e[1]+t[1]*i,e[2]+t[2]*i),Uu=(s,e)=>_t(s,e,sr(e)),Dt=(s,e,t)=>ct(s,e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]);function rr(s,e,t,i,r){return s[0]=e,s[1]=t,s[2]=i,s[3]=r,s}function $r(s,e,t){let i=e[0],r=e[1],o=e[2],a=e[3],n=t[0],l=t[1],c=t[2],u=t[3];return rr(s,a*n+i*u+r*c-o*l,a*l-i*c+r*u+o*n,a*c+i*l-r*n+o*u,a*u-i*n-r*l-o*c)}var Nu=(s,e)=>rr(s,-e[0],-e[1],-e[2],e[3]),Yn=s=>Ne(s)+s[3]*s[3];function Sa(s,e){let t=Yn(e);return rr(s,-e[0]/t,-e[1]/t,-e[2]/t,e[3]/t)}function qu(s,e){let t=Math.sqrt(Yn(e));return rr(s,e[0]/t,e[1]/t,e[2]/t,e[3]/t)}var ir=new Float64Array(4),Pi=new Float64Array(4);function ut(s,e,t){return $r(ir,e,Sa(ir,t)),ct(s,ir[0]*2,ir[1]*2,ir[2]*2)}function si(s,e,t){return rr(Pi,t[0],t[1],t[2],0),$r(Pi,Pi,e),qu(s,rr(s,e[0]+Pi[0]*.5,e[1]+Pi[1]*.5,e[2]+Pi[2]*.5,e[3]+Pi[3]*.5))}function le(s,e,t){let i=e[0],r=e[1],o=e[2],a=e[3],n=(r*t[2]-o*t[1])*2,l=(o*t[0]-i*t[2])*2,c=(i*t[1]-r*t[0])*2;return ct(s,t[0]+n*a+(r*c-o*l),t[1]+l*a+(o*n-i*c),t[2]+c*a+(i*l-r*n))}var Xn=new Float64Array(3);function Gt(s,e,t,i){return le(Xn,t,i),Li(s,Xn,e)}function Te(s,e,t){return le(s,Nu(ir,e),t)}function Ce(s,e,t,i){return s.fill(0),s[0]=e,s[4]=t,s[8]=i,s}function ka(s,e){return s[0]=0,s[1]=-e[2],s[2]=e[1],s[3]=e[2],s[4]=0,s[5]=-e[0],s[6]=-e[1],s[7]=e[0],s[8]=0,s}function _i(s,e){let t=e[1],i=e[2],r=e[5];return s[0]=e[0],s[1]=e[3],s[2]=e[6],s[3]=t,s[4]=e[4],s[5]=e[7],s[6]=i,s[7]=r,s[8]=e[8],s}function Ke(s,e,t){let i=e[0],r=e[1],o=e[2],a=e[3],n=e[4],l=e[5],c=e[6],u=e[7],f=e[8],d=t[0],p=t[1],m=t[2],h=t[3],g=t[4],b=t[5],y=t[6],A=t[7],v=t[8];return s[0]=i*d+r*h+o*y,s[1]=i*p+r*g+o*A,s[2]=i*m+r*b+o*v,s[3]=a*d+n*h+l*y,s[4]=a*p+n*g+l*A,s[5]=a*m+n*b+l*v,s[6]=c*d+u*h+f*y,s[7]=c*p+u*g+f*A,s[8]=c*m+u*b+f*v,s}function ue(s,e,t){let i=t[0],r=t[1],o=t[2];return ct(s,e[0]*i+e[1]*r+e[2]*o,e[3]*i+e[4]*r+e[5]*o,e[6]*i+e[7]*r+e[8]*o)}function qe(s,e){for(let t=0;t<9;t++)s[t]+=e[t];return s}function Ei(s,e,t){for(let i=0;i<9;i++)s[i]=e[i]*t;return s}function Qn(s,e){for(let t=0;t<9;t++)s[t]=-e[t];return s}function Ms(s,e,t){for(let i=0;i<3;i++)for(let r=0;r<3;r++)s[i*3+r]=t[r]*e[i];return s}function Kn(s,e){let t=Math.sqrt(e[0]*e[0]+e[3]*e[3]+e[6]*e[6]),i=Math.sqrt(e[1]*e[1]+e[4]*e[4]+e[7]*e[7]),r=Math.sqrt(e[2]*e[2]+e[5]*e[5]+e[8]*e[8]);return Ce(s,t,i,r)}function zs(s,e){let t=Math.abs(e[0])>Math.abs(e[2])?S(-e[1],e[0],0):S(0,-e[2],e[1]);Uu(t,t);let i=Dt(S(),e,t);return s[0]=e[0],s[1]=e[1],s[2]=e[2],s.set(t,3),s.set(i,6),s}function Is(s,e,t,i,r,o,a){let n=s[0],l=s[3],c=s[4],u=s[6],f=s[7],d=s[8],p=t[0],m=t[1],h=t[2],g=e[0],b=t[3],y=t[4],A=t[5],v=e[3],x=e[4],w=t[6],B=t[7],L=t[8],M=e[6],I=e[7],E=e[8],k=l/n,P=u/n,C=p/n,_=b/n,z=w/n,R=n,G=c-k*k*R,X=(f-k*P*R)/G,W=(m-k*C*R)/G,U=(y-k*_*R)/G,H=(B-k*z*R)/G,Z=d-(P*P*R+X*X*G),he=(h-P*C*R-X*W*G)/Z,we=(A-P*_*R-X*U*G)/Z,Oe=(L-P*z*R-X*H*G)/Z,$=g-(C*C*R+W*W*G+he*he*Z),Je=(v-C*_*R-W*U*G-he*we*Z)/$,Xe=(M-C*z*R-W*H*G-he*Oe*Z)/$,Be=x-(_*_*R+U*U*G+we*we*Z+Je*Je*$),at=(I-_*z*R-U*H*G-we*Oe*Z-Je*Xe*$)/Be,ri=E-(z*z*R+H*H*G+Oe*Oe*Z+Xe*Xe*$+at*at*Be),Ye=i[0],nt=i[1]-k*Ye,Qe=i[2]-P*Ye-X*nt,lt=r[0]-C*Ye-W*nt-he*Qe,wt=r[1]-_*Ye-U*nt-we*Qe-Je*lt,Ki=r[2]-z*Ye-H*nt-Oe*Qe-Xe*lt-at*wt,Zi=Ye/R,er=nt/G,tr=Qe/Z,Wt=lt/$,zu=wt/Be,Iu=Ki/ri;a[2]=Iu,a[1]=zu-at*a[2],a[0]=Wt-Je*a[1]-Xe*a[2],o[2]=tr-he*a[0]-we*a[1]-Oe*a[2],o[1]=er-X*o[2]-W*a[0]-U*a[1]-H*a[2],o[0]=Zi-k*o[1]-P*o[2]-C*a[0]-_*a[1]-z*a[2]}var Et=1,Ve=1e10,Rs=.01,Zn=1e-5,Ze=class{solver;forces=[];positionLin;positionAng=jt();initialLin=S();initialAng=jt();inertialLin=S();inertialAng=jt();velocityLin;velocityAng=S();prevVelocityLin;size;mass;moment;friction;radius;constructor(e,t,i,r,o,a=[0,0,0]){this.solver=e,this.size=S(t[0],t[1],t[2]),this.friction=r,this.positionLin=S(o[0],o[1],o[2]),this.velocityLin=S(a[0],a[1],a[2]),this.prevVelocityLin=S(a[0],a[1],a[2]);let[n,l,c]=this.size;this.mass=n*l*c*i,this.moment=S((l*l+c*c)/12*this.mass,(n*n+c*c)/12*this.mass,(n*n+l*l)/12*this.mass),this.radius=sr([n*.5,l*.5,c*.5]),e.bodies.push(this)}constrainedTo(e){for(let t of this.forces)if(t.bodyA===this&&t.bodyB===e||t.bodyA===e&&t.bodyB===this)return!0;return!1}},Os=()=>({lhsLin:ae(),lhsAng:ae(),lhsCross:ae(),rhsLin:S(),rhsAng:S()}),Ft=class{solver;bodyA;bodyB;constructor(e,t,i){this.solver=e,this.bodyA=t,this.bodyB=i,e.forces.push(this),t?.forces.push(this),i.forces.push(this)}destroy(){let e=this.solver.forces,t=e.indexOf(this);t>=0&&e.splice(t,1),this.unlinkFromBodies()}unlinkFromBodies(){for(let e of[this.bodyA,this.bodyB]){if(!e)continue;let t=e.forces.indexOf(this);t>=0&&e.forces.splice(t,1)}}};var sl=8,el=16,zi=1e-6,La=1e-5,Vu=1e-6,_a=34028234663852886e22,Ts=0,ol=1,js=2;function tl(s){let e=s.positionAng;return{center:s.positionLin,half:ne(S(),s.size,.5),axis:[le(S(),e,[1,0,0]),le(S(),e,[0,1,0]),le(S(),e,[0,0,1])]}}var Mi=(s,e)=>Math.abs(V(s,e));function Ds(s,e){let t=V(e,s.axis[0])>=0?1:-1,i=V(e,s.axis[1])>=0?1:-1,r=V(e,s.axis[2])>=0?1:-1,o=D(S(),s.center,s.axis[0],s.half[0]*t);return D(o,o,s.axis[1],s.half[1]*i),D(o,o,s.axis[2],s.half[2]*r)}function al(s,e){return e===0?{u:s.axis[1],v:s.axis[2],extentU:s.half[1],extentV:s.half[2]}:e===1?{u:s.axis[0],v:s.axis[2],extentU:s.half[0],extentV:s.half[2]}:{u:s.axis[0],v:s.axis[1],extentU:s.half[0],extentV:s.half[1]}}function Wu(s,e,t){let i=V(t,s.axis[e])>=0?1:-1,r=ne(S(),s.axis[e],i),o=D(S(),s.center,r,s.half[e]);return{normal:r,center:o,...al(s,e)}}function Hu(s,e){let t=0,i=-_a;for(let r=0;r<3;r++){let o=Mi(s.axis[r],e);o>i&&(i=o,t=r)}return t}function $u(s,e,t){let i=V(s.axis[e],t)>0?-1:1,r=ne(S(),s.axis[e],i),o=D(S(),s.center,r,s.half[e]),{u:a,v:n,extentU:l,extentV:c}=al(s,e),u=(f,d)=>{let p=D(S(),o,a,f*l);return D(p,p,n,d*c)};return[u(1,1),u(-1,1),u(-1,-1),u(1,-1)]}function Ju(s,e,t){let i=[];if(s.length===0)return i;let r=s[s.length-1],o=V(e,r)-t;for(let a of s){let n=V(e,a)-t,l=o<=La,c=n<=La;if(l!==c){let u=0,f=o-n;Math.abs(f)>zi&&(u=ce(o/f,0,1)),i.length<el&&i.push(D(S(),r,J(S(),a,r),u))}c&&i.length<el&&i.push(a),r=a,o=n}return i}var Gs=class{contacts=[];midpoints=[];bodyA;bodyB;constructor(e,t){this.bodyA=e,this.bodyB=t}add(e,t,i){let r=ne(S(),Li(S(),e,t),.5);for(let n of this.midpoints)if(Ne(J(S(),r,n))<Vu)return;if(this.contacts.length>=sl)return;let{bodyA:o,bodyB:a}=this;this.contacts.push({feature:i,rA:Te(S(),o.positionAng,J(S(),e,o.positionLin)),rB:Te(S(),a.positionAng,J(S(),t,a.positionLin))}),this.midpoints.push(r)}};function Pa(s,e,t,i,r,o,a,n){let l=Ne(i);if(l<zi)return!0;let c=1/Math.sqrt(l),u=ne(S(),i,c);V(u,t)<0&&ee(u,u);let f=Math.abs(V(t,u)),d=s.half[0]*Mi(u,s.axis[0])+s.half[1]*Mi(u,s.axis[1])+s.half[2]*Mi(u,s.axis[2]),p=e.half[0]*Mi(u,e.axis[0])+e.half[1]*Mi(u,e.axis[1])+e.half[2]*Mi(u,e.axis[2]),m=f-(d+p);return m>0?!1:((!n.valid||m>n.separation)&&(n.valid=!0,n.type=r,n.indexA=o,n.indexB=a,n.separation=m,n.normalAB=u),!0)}function il(s,e,t){let i=(e+1)%3,r=(e+2)%3,o=V(t,s.axis[i])>=0?1:-1,a=V(t,s.axis[r])>=0?1:-1,n=D(S(),s.center,s.axis[i],s.half[i]*o);D(n,n,s.axis[r],s.half[r]*a);let l=ne(S(),s.axis[e],s.half[e]);return[J(S(),n,l),Li(S(),n,l)]}function Xu(s,e,t,i){let r=J(S(),e,s),o=J(S(),i,t),a=J(S(),s,t),n=V(r,r),l=V(o,o),c=V(o,a),u=0,f=0;if(n<=zi&&l<=zi)return[s,t];if(n<=zi)f=ce(c/l,0,1);else{let d=V(r,a);if(l<=zi)u=ce(-d/n,0,1);else{let p=V(r,o),m=n*l-p*p;Math.abs(m)>zi&&(u=ce((p*c-d*l)/m,0,1)),f=(p*u+c)/l,f<0?(f=0,u=ce(-d/n,0,1)):f>1&&(f=1,u=ce((p-d)/n,0,1))}}return[D(S(),s,r,u),D(S(),t,o,f)]}function rl(s,e,t,i,r,o,a){let n=r?t:i,l=r?i:t,c=r?a:ee(S(),a),u=Wu(n,o,c),f=Hu(l,u.normal),d=$u(l,f,u.normal),p=[[u.u,u.extentU],[ee(S(),u.u),u.extentU],[u.v,u.extentV],[ee(S(),u.v),u.extentV]];for(let[g,b]of p)if(d=Ju(d,g,V(g,u.center)+b),!d.length)return[];let m=new Gs(s,e),h=(r?Ts:ol)<<24|(o&255)<<16|(f&255)<<8;for(let g=0;g<d.length&&m.contacts.length<sl;g++){let b=d[g],y=V(J(S(),b,u.center),u.normal);if(y>La)continue;let A=D(S(),b,u.normal,-y),v=r?A:b,x=r?b:A;m.add(v,x,h|g&255)}return m.contacts.length||m.add(Ds(t,a),Ds(i,ee(S(),a)),h),m.contacts}function Yu(s,e,t,i,r,o,a){let[n,l]=il(t,r,a),[c,u]=il(i,o,ee(S(),a)),[f,d]=Xu(n,l,c,u),p=new Gs(s,e),m=js<<24|(r&255)<<8|o&255;return p.add(f,d,m),p.contacts.length||p.add(Ds(t,a),Ds(i,ee(S(),a)),m),p.contacts}function nl(s,e,t){let i=tl(s),r=tl(e),o=J(S(),r.center,i.center),a={type:Ts,indexA:0,indexB:0,separation:-_a,normalAB:S(),valid:!1},n={type:js,indexA:0,indexB:0,separation:-_a,normalAB:S(),valid:!1};for(let u=0;u<3;u++)if(!Pa(i,r,o,i.axis[u],Ts,u,-1,a))return[];for(let u=0;u<3;u++)if(!Pa(i,r,o,r.axis[u],ol,-1,u,a))return[];let l=S();for(let u=0;u<3;u++)for(let f=0;f<3;f++)if(Dt(l,i.axis[u],r.axis[f]),!Pa(i,r,o,l,js,u,f,n))return[];if(!a.valid)return[];let c=a;return n.valid&&.95*n.separation>a.separation+.01&&(c=n),zs(t,ee(S(),c.normalAB)),c.type===js?Yu(s,e,i,r,c.indexA,c.indexB,c.normalAB):c.type===Ts?rl(s,e,i,r,!0,c.indexA,c.normalAB):rl(s,e,i,r,!1,c.indexB,c.normalAB)}var ll=S(),cl=S(),ul=S(),fl=S(),dl=S(),hl=S(),Fs=ae(),Ea=ae(),Ma=ae(),Us=ae(),za=ae(),Ia=ae(),Ra=ae(),Ns=ae(),Me=S(),je=S(),Ii=S(),oi=S(),pl=S(),ml=S(),or=0,Jr=0;function gl(s,e,t){for(let i=0;i<3;i++)oi[0]=t[i*3],oi[1]=t[i*3+1],oi[2]=t[i*3+2],Dt(oi,e,oi),s[i*3]=oi[0],s[i*3+1]=oi[1],s[i*3+2]=oi[2];return s}var ai=class extends Ft{contacts=[];basis=ae();friction=0;constructor(e,t,i){super(e,t,i)}get numContacts(){return this.contacts.length}initialize(){let e=this.bodyA,t=this.bodyB,{solver:i}=this;this.friction=Math.sqrt(e.friction*t.friction);let r=this.contacts;this.contacts=nl(e,t,this.basis).map(o=>{let a=r.find(n=>n.feature===o.feature);return a?{feature:o.feature,rA:a.stick?a.rA:o.rA,rB:a.stick?a.rB:o.rB,C0:S(),penalty:a.penalty.slice(),lambda:a.lambda.slice(),stick:a.stick}:{feature:o.feature,rA:o.rA,rB:o.rB,C0:S(),penalty:S(),lambda:S(),stick:!1}});for(let o of this.contacts){Gt(pl,e.positionLin,e.positionAng,o.rA),Gt(ml,t.positionLin,t.positionAng,o.rB),ue(o.C0,this.basis,J(Ii,pl,ml)),o.C0[0]+=Rs;for(let a=0;a<3;a++)o.lambda[a]=o.lambda[a]*i.alpha*i.gamma,o.penalty[a]=ce(o.penalty[a]*i.gamma,Et,Ve)}return this.contacts.length>0}evaluate(e,t){let i=this.bodyA,r=this.bodyB,o=this.basis;le(dl,i.positionAng,e.rA),le(hl,r.positionAng,e.rB),Qn(Fs,o),gl(Ea,dl,o),gl(Ma,hl,Fs),Ce(Us,e.penalty[0],e.penalty[1],e.penalty[2]),ne(Me,e.C0,1-t),D(Me,Me,ue(Ii,o,ll),1),D(Me,Me,ue(Ii,Fs,ul),1),D(Me,Me,ue(Ii,Ea,cl),1),D(Me,Me,ue(Ii,Ma,fl),1),ue(je,Us,Me),D(je,je,e.lambda,1),je[0]=Bt(je[0],0),Jr=Math.abs(je[0])*this.friction,or=Math.sqrt(je[1]*je[1]+je[2]*je[2]),or>Jr&&or>0&&(je[1]*=Jr/or,je[2]*=Jr/or)}computeDisplacements(){let e=this.bodyA,t=this.bodyB;J(ll,e.positionLin,e.initialLin),ut(cl,e.positionAng,e.initialAng),J(ul,t.positionLin,t.initialLin),ut(fl,t.positionAng,t.initialAng)}updatePrimal(e,t,i){this.computeDisplacements();let r=e===this.bodyA;for(let o of this.contacts){this.evaluate(o,t);let a=r?this.basis:Fs,n=r?Ea:Ma;_i(za,a),_i(Ia,n),Ke(Ra,Ia,Us),qe(i.lhsLin,Ke(Ns,Ke(Ns,za,Us),a)),qe(i.lhsAng,Ke(Ns,Ra,n)),qe(i.lhsCross,Ke(Ns,Ra,a)),D(i.rhsLin,i.rhsLin,ue(Ii,za,je),1),D(i.rhsAng,i.rhsAng,ue(Ii,Ia,je),1)}}updateDual(e){let{solver:t}=this;this.computeDisplacements();for(let i of this.contacts)this.evaluate(i,e),i.lambda.set(je),je[0]<0&&(i.penalty[0]=Bt(i.penalty[0]+t.betaLin*Math.abs(Me[0]),Ve)),or<=Jr&&(i.penalty[1]=Bt(i.penalty[1]+t.betaLin*Math.abs(Me[1]),Ve),i.penalty[2]=Bt(i.penalty[2]+t.betaLin*Math.abs(Me[2]),Ve),i.stick=Math.sqrt(Me[1]*Me[1]+Me[2]*Me[2])<Zn)}};var Oa=()=>({dt:1/60,gravity:-10,iterations:10,betaLin:1e4,betaAng:100,alpha:.99,gamma:.999}),ni=class{dt=1/60;gravity=-10;iterations=10;alpha=.99;betaLin=1e4;betaAng=100;gamma=.999;bodies=[];forces=[];constructor(){this.defaultParams()}defaultParams(){Object.assign(this,Oa())}clear(){this.forces=[],this.bodies=[]}pick(e,t){let r=null,o=S(),a=S();for(let n=this.bodies.length-1;n>=0;n--){let l=this.bodies[n];if(l.mass<=0)continue;Te(o,l.positionAng,J(o,e,l.positionLin)),Te(a,l.positionAng,t);let c=0,u=1/0,f=!0;for(let p=0;p<3&&f;p++){let m=l.size[p]*.5;if(Math.abs(a[p])<1e-6){(o[p]<-m||o[p]>m)&&(f=!1);continue}let h=1/a[p],g=(-m-o[p])*h,b=(m-o[p])*h;g>b&&([g,b]=[b,g]),c=Math.max(c,g),u=Math.min(u,b),c>u&&(f=!1)}if(!f)continue;let d=c>=0?c:u;d<0||(!r||d<r.t)&&(r={body:l,local:D(S(),o,a,d),t:d})}return r}sys=Os();dxLin=S();dxAng=S();dp=S();accel=S();step(){let{dt:e,gravity:t,bodies:i,sys:r,dp:o}=this;for(let n=i.length-1;n>=0;n--){let l=i[n];for(let c=n-1;c>=0;c--){let u=i[c];J(o,l.positionLin,u.positionLin);let f=l.radius+u.radius;V(o,o)<=f*f&&!l.constrainedTo(u)&&new ai(this,l,u)}}let a=[];for(let n of this.forces)n.initialize()?a.push(n):n.unlinkFromBodies();this.forces=a;for(let n=i.length-1;n>=0;n--){let l=i[n];D(l.inertialLin,l.positionLin,l.velocityLin,e),l.mass>0&&(l.inertialLin[2]+=t*(e*e)),si(l.inertialAng,l.positionAng,bl(l.velocityAng,e)),_t(this.accel,J(this.accel,l.velocityLin,l.prevVelocityLin),e);let c=this.accel[2]*Es(t),u=ce(c/Math.abs(t),0,1);Number.isFinite(u)||(u=0),l.initialLin.set(l.positionLin),l.initialAng.set(l.positionAng),l.mass>0&&(D(l.positionLin,l.positionLin,l.velocityLin,e),l.positionLin[2]+=t*(u*e*e),si(l.positionAng,l.positionAng,bl(l.velocityAng,e)))}for(let n=0;n<this.iterations;n++){for(let l=i.length-1;l>=0;l--){let c=i[l];if(c.mass<=0)continue;let u=c.mass,f=c.moment;Ce(r.lhsLin,u/(e*e),u/(e*e),u/(e*e)),Ce(r.lhsAng,f[0]/(e*e),f[1]/(e*e),f[2]/(e*e)),r.lhsCross.fill(0),ue(r.rhsLin,r.lhsLin,J(o,c.positionLin,c.inertialLin)),ue(r.rhsAng,r.lhsAng,ut(o,c.positionAng,c.inertialAng));let d=c.forces;for(let p=d.length-1;p>=0;p--)d[p].updatePrimal(c,this.alpha,r);Is(r.lhsLin,r.lhsAng,r.lhsCross,ee(r.rhsLin,r.rhsLin),ee(r.rhsAng,r.rhsAng),this.dxLin,this.dxAng),D(c.positionLin,c.positionLin,this.dxLin,1),si(c.positionAng,c.positionAng,this.dxAng)}for(let l of this.forces)l.updateDual(this.alpha)}for(let n of i)n.prevVelocityLin.set(n.velocityLin),n.mass>0&&(_t(n.velocityLin,J(n.velocityLin,n.positionLin,n.initialLin),e),_t(n.velocityAng,ut(n.velocityAng,n.positionAng,n.initialAng),e))}},Qu=S(),bl=(s,e)=>ne(Qu,s,e);var xe=(s,e)=>[s[0]-e[0],s[1]-e[1],s[2]-e[2]],Mt=(s,e)=>s[0]*e[0]+s[1]*e[1]+s[2]*e[2],Ri=(s,e)=>[s[1]*e[2]-s[2]*e[1],s[2]*e[0]-s[0]*e[2],s[0]*e[1]-s[1]*e[0]],et=s=>Math.sqrt(Mt(s,s));function Xr(s){let e=Ta(s);return!e||e.vertices.length/3<=32?e:Ta(yl(e,32))}function yl(s,e){let[t,i,r,o]=s.rotation,a=f=>{let d=[2*(i*f[2]-r*f[1]),2*(r*f[0]-t*f[2]),2*(t*f[1]-i*f[0])];return[f[0]+o*d[0]+(i*d[2]-r*d[1])+s.center[0],f[1]+o*d[1]+(r*d[0]-t*d[2])+s.center[1],f[2]+o*d[2]+(t*d[1]-i*d[0])+s.center[2]]},n=[];for(let f=0;f<s.vertices.length;f+=3)n.push(a([s.vertices[f],s.vertices[f+1],s.vertices[f+2]]));let l=0;n.forEach((f,d)=>{et(xe(f,s.center))>et(xe(n[l],s.center))&&(l=d)});let c=[l],u=n.map(f=>et(xe(f,n[l])));for(;c.length<e;){let f=0;u.forEach((d,p)=>{d>u[f]&&(f=p)}),c.push(f),n.forEach((d,p)=>{u[p]=Math.min(u[p],et(xe(d,n[f])))})}return c.flatMap(f=>n[f])}function Ta(s){let e=0;for(let v=0;v<s.length;v++)e=Math.max(e,Math.abs(s[v]));let t=Math.max(e,1e-9)*1e-6,i=new Set,r=[];for(let v=0;v+2<s.length;v+=3){let x=[s[v],s[v+1],s[v+2]],w=x.map(B=>Math.round(B/t)).join(",");i.has(w)||(i.add(w),r.push(x))}if(r.length<4)return null;let o=Math.max(e,1e-9)*1e-10,a=0;for(let v=1;v<r.length;v++)r[v][0]<r[a][0]&&(a=v);let n=-1,l=0;for(let v=0;v<r.length;v++){let x=et(xe(r[v],r[a]));x>l&&(l=x,n=v)}if(n<0||l<o)return null;let c=-1;l=0;let u=xe(r[n],r[a]);for(let v=0;v<r.length;v++){let x=et(Ri(u,xe(r[v],r[a])));x>l&&(l=x,c=v)}if(c<0||l<o*et(u))return null;let f=Ri(u,xe(r[c],r[a])),d=-1;l=0;for(let v=0;v<r.length;v++){let x=Math.abs(Mt(f,xe(r[v],r[a])));x>l&&(l=x,d=v)}if(d<0||l<o*et(f))return null;let p=[],m=(v,x,w)=>{let B=Ri(xe(r[x],r[v]),xe(r[w],r[v])),L=et(B)||1,M=[B[0]/L,B[1]/L,B[2]/L];return{v:[v,x,w],n:M,d:Mt(M,r[v])}},g=Mt(f,xe(r[d],r[a]))>0?[a,c,n]:[a,n,c];p.push(m(g[0],g[1],g[2])),p.push(m(g[0],d,g[1])),p.push(m(g[1],d,g[2])),p.push(m(g[2],d,g[0]));let b=new Set([a,n,c,d]),y=r.map((v,x)=>x).filter(v=>!b.has(v)),A=[a,n,c,d].reduce((v,x)=>[v[0]+r[x][0]/4,v[1]+r[x][1]/4,v[2]+r[x][2]/4],[0,0,0]);y.sort((v,x)=>et(xe(r[x],A))-et(xe(r[v],A)));for(let v of y){let x=p.filter(k=>Mt(k.n,r[v])-k.d>o);if(!x.length)continue;let w=new Map;for(let k of p)for(let P=0;P<3;P++)w.set(`${k.v[P]},${k.v[(P+1)%3]}`,k);let B=new Set(x),L=[...x];for(;L.length;){let k=L.pop();for(let P=0;P<3;P++){let C=w.get(`${k.v[(P+1)%3]},${k.v[P]}`);C&&!B.has(C)&&Mt(C.n,r[v])-C.d>-o&&(B.add(C),L.push(C))}}let M=[...B],I=new Set;for(let k of M)for(let P=0;P<3;P++)I.add(`${k.v[P]},${k.v[(P+1)%3]}`);let E=[];for(let k of M)for(let P=0;P<3;P++){let C=k.v[P],_=k.v[(P+1)%3];I.has(`${_},${C}`)||E.push([C,_])}for(let k of M)p.splice(p.indexOf(k),1);for(let[k,P]of E)p.push(m(k,P,v))}return vl(r.flat(),p.flatMap(v=>v.v))}function ja(s,e){let t=vl(s,e);return t&&t.vertices.length/3>32?Ta(yl(t,32)):t}function vl(s,e){let t=[];for(let C=0;C+2<s.length;C+=3)t.push([s[C],s[C+1],s[C+2]]);let i=0;for(let C of t)i=Math.max(i,Math.abs(C[0]),Math.abs(C[1]),Math.abs(C[2]));let r=Math.max(i,1e-9)*1e-5,o=[];for(let C=0;C+2<e.length;C+=3){let _=[e[C],e[C+1],e[C+2]],z=Ri(xe(t[_[1]],t[_[0]]),xe(t[_[2]],t[_[0]])),R=et(z);if(!(R>0))continue;let G=[z[0]/R,z[1]/R,z[2]/R];o.push({v:_,n:G,d:Mt(G,t[_[0]])})}let a=new Map;o.forEach((C,_)=>{for(let z=0;z<3;z++)a.set(`${C.v[z]},${C.v[(z+1)%3]}`,_)});let n=new Array(o.length).fill(-1),l=[];o.forEach((C,_)=>{if(n[_]>=0)return;let z=[_];n[_]=l.length;for(let R=0;R<z.length;R++){let G=o[z[R]];for(let X=0;X<3;X++){let W=a.get(`${G.v[(X+1)%3]},${G.v[X]}`);if(W===void 0||n[W]>=0)continue;let U=o[W];Mt(C.n,U.n)>1-1e-5&&U.v.every(H=>Math.abs(Mt(C.n,t[H])-C.d)<=r)&&(n[W]=l.length,z.push(W))}}l.push(z)});let c=[];for(let C of l){let _=new Set;for(let U of C)for(let H=0;H<3;H++)_.add(`${o[U].v[H]},${o[U].v[(H+1)%3]}`);let z=new Map;for(let U of C)for(let H=0;H<3;H++){let Z=o[U].v[H],he=o[U].v[(H+1)%3];if(!_.has(`${he},${Z}`)){if(z.has(Z))return null;z.set(Z,he)}}let R=[0,0,0];for(let U of C){let H=o[U],Z=Ri(xe(t[H.v[1]],t[H.v[0]]),xe(t[H.v[2]],t[H.v[0]]));R[0]+=Z[0],R[1]+=Z[1],R[2]+=Z[2]}let G=et(R)||1,X=z.keys().next().value,W=[X];for(let U=z.get(X);U!==X&&W.length<=z.size;U=z.get(U))W.push(U);if(W.length!==z.size)return null;c.push({n:[R[0]/G,R[1]/G,R[2]/G],verts:W})}let u=new Map,f=[];for(let C of c)for(let _ of C.verts)u.has(_)||(u.set(_,f.length),f.push(t[_]));for(let C of c)C.verts=C.verts.map(_=>u.get(_));let d=new Set,p=0;for(let C of c)C.verts.forEach((_,z)=>{d.add(`${_},${C.verts[(z+1)%C.verts.length]}`),p++});if(d.size!==p||![...d].every(C=>{let[_,z]=C.split(",");return d.has(`${z},${_}`)})||f.length-d.size/2+c.length!==2)return null;let m=0,h=[0,0,0],g=[0,0,0,0,0,0];for(let C of c){let _=f[C.verts[0]];for(let z=1;z+1<C.verts.length;z++){let R=f[C.verts[z]],G=f[C.verts[z+1]],X=Mt(_,Ri(R,G));m+=X/6;for(let U=0;U<3;U++)h[U]+=X/24*(_[U]+R[U]+G[U]);let W=(U,H)=>X/120*(_[U]*_[H]+R[U]*R[H]+G[U]*G[H]+(_[U]+R[U]+G[U])*(_[H]+R[H]+G[H]));g[0]+=W(0,0),g[1]+=W(1,1),g[2]+=W(2,2),g[3]+=W(0,1),g[4]+=W(0,2),g[5]+=W(1,2)}}if(!(m>0))return null;for(let C=0;C<3;C++)h[C]/=m;g[0]-=m*h[0]*h[0],g[1]-=m*h[1]*h[1],g[2]-=m*h[2]*h[2],g[3]-=m*h[0]*h[1],g[4]-=m*h[0]*h[2],g[5]-=m*h[1]*h[2];let b=g[0]+g[1]+g[2],y=[[b-g[0],-g[3],-g[4]],[-g[3],b-g[1],-g[5]],[-g[4],-g[5],b-g[2]]],{values:A,vectors:v}=Ku(y),x=v,w=C=>{let _=xe(C,h);return[x[0][0]*_[0]+x[1][0]*_[1]+x[2][0]*_[2],x[0][1]*_[0]+x[1][1]*_[1]+x[2][1]*_[2],x[0][2]*_[0]+x[1][2]*_[1]+x[2][2]*_[2]]},B=f.map(w),L=new Float32Array(B.flat()),M=c.map(C=>{let _=C.n,z=[x[0][0]*_[0]+x[1][0]*_[1]+x[2][0]*_[2],x[0][1]*_[0]+x[1][1]*_[1]+x[2][1]*_[2],x[0][2]*_[0]+x[1][2]*_[1]+x[2][2]*_[2]],R=-1/0;for(let G of C.verts)R=Math.max(R,Mt(z,B[G]));return{normal:z,d:R,verts:C.verts}}),I=new Map;M.forEach((C,_)=>C.verts.forEach((z,R)=>I.set(`${z},${C.verts[(R+1)%C.verts.length]}`,_)));let E=[];M.forEach((C,_)=>C.verts.forEach((z,R)=>{let G=C.verts[(R+1)%C.verts.length],X=I.get(`${G},${z}`);z<G&&X!==void 0&&E.push([z,G,_,X])}));let k=[0,0,0],P=0;for(let C of B){for(let _=0;_<3;_++)k[_]=Math.max(k[_],2*Math.abs(C[_]));P=Math.max(P,et(C))}return{vertices:L,faces:M,edges:E,volume:m,moments:[A[0],A[1],A[2]],size:k,radius:P,center:h,rotation:Zu(x)}}function Ku(s){let e=s.map(n=>[...n]),t=[[1,0,0],[0,1,0],[0,0,1]];for(let n=0;n<50&&!(e[0][1]**2+e[0][2]**2+e[1][2]**2<1e-30*(e[0][0]**2+e[1][1]**2+e[2][2]**2+1e-300));n++)for(let c=0;c<3;c++)for(let u=c+1;u<3;u++){if(Math.abs(e[c][u])<1e-300)continue;let f=(e[u][u]-e[c][c])/(2*e[c][u]),d=Math.sign(f||1)/(Math.abs(f)+Math.sqrt(f*f+1)),p=1/Math.sqrt(d*d+1),m=d*p;for(let h=0;h<3;h++){let g=e[h][c],b=e[h][u];e[h][c]=p*g-m*b,e[h][u]=m*g+p*b}for(let h=0;h<3;h++){let g=e[c][h],b=e[u][h];e[c][h]=p*g-m*b,e[u][h]=m*g+p*b}for(let h=0;h<3;h++){let g=t[h][c],b=t[h][u];t[h][c]=p*g-m*b,t[h][u]=m*g+p*b}}let i=[t[0][0],t[1][0],t[2][0]],r=[t[0][1],t[1][1],t[2][1]],o=Ri(i,r),a=[[i[0],r[0],o[0]],[i[1],r[1],o[1]],[i[2],r[2],o[2]]];return{values:[e[0][0],e[1][1],e[2][2]],vectors:a}}function Zu(s){let e=s[0][0]+s[1][1]+s[2][2],t,i,r,o;if(e>0){let n=.5/Math.sqrt(e+1);o=.25/n,t=(s[2][1]-s[1][2])*n,i=(s[0][2]-s[2][0])*n,r=(s[1][0]-s[0][1])*n}else if(s[0][0]>s[1][1]&&s[0][0]>s[2][2]){let n=2*Math.sqrt(1+s[0][0]-s[1][1]-s[2][2]);o=(s[2][1]-s[1][2])/n,t=.25*n,i=(s[0][1]+s[1][0])/n,r=(s[0][2]+s[2][0])/n}else if(s[1][1]>s[2][2]){let n=2*Math.sqrt(1+s[1][1]-s[0][0]-s[2][2]);o=(s[0][2]-s[2][0])/n,t=(s[0][1]+s[1][0])/n,i=.25*n,r=(s[1][2]+s[2][1])/n}else{let n=2*Math.sqrt(1+s[2][2]-s[0][0]-s[1][1]);o=(s[1][0]-s[0][1])/n,t=(s[0][2]+s[2][0])/n,i=(s[1][2]+s[2][1])/n,r=.25*n}let a=Math.hypot(t,i,r,o);return[t/a,i/a,r/a,o/a]}var Al=new WeakSet,De=s=>Al.has(s),ef=new WeakSet;var ar=s=>ef.has(s);function nr(s,e,t,i,r,o=[0,0,0]){let a=new Ze(s,[2*e,2*e,2*e],t,i,r,o);a.mass=t>0?4/3*Math.PI*e*e*e*t:0;let n=.4*a.mass*e*e;return a.moment.set([n,n,n]),a.radius=e,Al.add(a),a}var wl=new WeakMap,Ct=s=>wl.get(s);function lr(s,e,t,i,r,o=[0,0,0,1],a=[0,0,0]){if(e.vertices.length/3>32||e.faces.length>255||e.edges.length>255)throw new Error(`hull: ${e.vertices.length/3} vertices, ${e.faces.length} faces, ${e.edges.length} edges (at most ${32} vertices, 255 faces and edges)`);let n=new Ze(s,e.size,t,i,r,a);return n.positionAng.set([o[0],o[1],o[2],o[3]]),n.mass=t>0?e.volume*t:0,n.moment.set(e.moments.map(l=>l*Math.max(t,0))),n.radius=e.radius,wl.set(n,e),n}var Da=`
const T_NONE = 0;

const MAX_COLORS = 64u;
const NO_COLOR = 255u;
const PENDING = 256u;

const C_PAIRS = 0u;
const C_CONTACTS = 1u;
const C_PREV_CONTACTS = 2u;
const C_OVERFLOW = 3u;
const C_CLASHES = 4u;
const C_NUM_COLORS = 5u;

const IA_PAIRS = 0u;
const IA_CONTACTS = 3u;
const IA_PREV = 6u;
const IA_CONSTRAINTS = 9u;
const IA_COLOR = 12u;

const WG = 64u;
const COLOR_WG = 256u;

const BIG = 3e38;
const HARD = 1e30;

fn groupsFor(n: u32) -> u32 {
  return (n + WG - 1u) / WG;
}

/** lowbias32 integer hash (same as the CPU colouring priorities). */
fn hash32(v: u32) -> u32 {
  var x = v;
  x ^= x >> 16u;
  x *= 0x7feb352du;
  x ^= x >> 15u;
  x *= 0x846ca68bu;
  x ^= x >> 16u;
  return x;
}
`,Ut=`
// Shared by every 2D module (layout.ts)
${Da}
const T_JOINT = 1;
const T_SPRING = 2;
const T_MOTOR = 3;

const PENALTY_MIN = 1.0;
const PENALTY_MAX = 1e9;
const STICK_THRESH = 0.01;
const COLLISION_MARGIN = 0.0005;

const FLAG_VBD = 1u;
const FLAG_RESCALE = 2u;
const FLAG_POST_STABILIZE = 4u;
const FLAG_MATCH_NEAREST = 8u;
const NEAREST_FRACTION = ${.05};

struct Body {
  pose: vec4f,      // x, y, angle, friction
  initial: vec4f,   // pose at the start of the step (x-)
  inertial: vec4f,  // inertial target y
  vel: vec4f,
  prevVel: vec4f,
  shape: vec4f,     // width, height, mass, moment
}

struct Joint {
  pen: vec4f,       // per-row penalty (stiffness parameter k)
  lam: vec4f,       // per-row dual variable
  stiff: vec4f,     // per-row material stiffness (>= HARD: hard constraint)
  fmin: vec4f,
  fmax: vec4f,
  frac: vec4f,      // per-row fracture threshold on |lambda|
  c0: vec4f,        // C(x-)
  anchors: vec4f,   // rA.xy (world point for world joints), rB.xy
  param: vec4f,     // joint: restAngle, torqueArm; spring: rest; motor: speed
}

struct Contact {
  ids: vec4u,       // bodyA, bodyB (A > B), feature key, stick flag
  pl: vec4f,        // penalty normal/tangent, lambda normal/tangent
  anchors: vec4f,   // rA.xy, rB.xy in body-local space
  geo: vec4f,       // C0 normal, C0 tangent, normal.xy (B to A)
  misc: vec4f,      // friction
}

struct Params {
  dt: f32,
  gravity: f32,
  beta: f32,
  gamma: f32,
  alpha: f32,
  vbdStiffness: f32,
  flags: u32,
  bodyCount: u32,
  jointCount: u32,
  colorCap: u32,
  cellSize: f32,
  tableMask: u32,
  maxSmallRadius: f32,
  largeCount: u32,
  noCollideCount: u32,
  pairCapacity: u32,
  contactCapacity: u32,
  hashMask: u32,
  adjFillOffset: u32,
  adjListOffset: u32,
  gridCursorOffset: u32,
  gridSortedOffset: u32,
  gridCellOffset: u32,
  stateBOffset: u32,
  colorHistOffset: u32,   // per (colour, workgroup) body counts, scanned into slot offsets
  colorStartOffset: u32,
  colorGroups: u32,       // workgroups of COLOR_WG bodies covering the body capacity
  colorBodiesOffset: u32,
  rounds: u32,
  pad0: u32,
  pad1: u32,
  pad2: u32,
}

/**
 * (cos x, sin x) to ~1e-7. WGSL promises the built-ins only to 2^-11 absolute and GPUs differ:
 * on an M1 Pro, stiff springs (Spring Ratio) drifted 9 cm from the CPU in 60 steps and a
 * single friction step missed by 1.2e-4, where the M4 Max tracked to 1.6e-4 and 4e-6; rounding
 * the built-ins to 2^-13 on the M4 reproduced it. Cody-Waite reduction by pi/2 (three-part
 * constant) and the Cephes single-precision polynomials on [-pi/4, pi/4].
 */
fn cosSin(x: f32) -> vec2f {
  let q = floor(x * 0.63661977236 + 0.5);
  // fma keeps the three parts apart: written as subtractions, fast math folded them back into
  // one rounded pi/2 and the error grew with the angle (2.8e-6 at 100 rad)
  let r = fma(-q, 7.549789954891882e-8, fma(-q, 4.837512969970703e-4, fma(-q, 1.5703125, x)));
  let z = r * r;
  let s = r + r * z * (-1.6666654611e-1 + z * (8.3321608736e-3 + z * -1.9515295891e-4));
  let c = 1.0 - 0.5 * z + z * z * (4.1666645683e-2 + z * (-1.3887316255e-3 + z * 2.4433157468e-5));
  switch (u32(i32(q)) & 3u) {
    case 0u: { return vec2f(c, s); }
    case 1u: { return vec2f(-s, c); }
    case 2u: { return vec2f(-c, -s); }
    default: { return vec2f(s, -c); }
  }
}

fn rot(angle: f32, v: vec2f) -> vec2f {
  let cs = cosSin(angle);
  return vec2f(cs.x * v.x - cs.y * v.y, cs.y * v.x + cs.x * v.y);
}

`,Yr=(s,e={counter:"C_CONTACTS",prevCounter:"C_PREV_CONTACTS",capacity:"params.contactCapacity"})=>`
${s}
${e.colorThreads??"fn colorThreads(bodies: u32) -> u32 { return bodies; }"}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> counters: array<u32>;
@group(0) @binding(2) var<storage, read> color: array<u32>;
@group(0) @binding(3) var<storage, read_write> args: array<u32>;

fn setArgs(at: u32, count: u32) {
  args[at] = groupsFor(count);
  args[at + 1u] = 1u;
  args[at + 2u] = 1u;
}

@compute @workgroup_size(1)
fn argsPrev() {
  setArgs(IA_PREV, counters[${e.prevCounter}]);
}

@compute @workgroup_size(1)
fn argsPairs() {
  setArgs(IA_PAIRS, min(counters[C_PAIRS], params.pairCapacity));
}

@compute @workgroup_size(1)
fn argsContacts() {
  let items = min(counters[${e.counter}], ${e.capacity});
  setArgs(IA_CONTACTS, items);
  setArgs(IA_CONSTRAINTS, params.jointCount + items);
}

@compute @workgroup_size(64)
fn argsColors(@builtin(local_invocation_id) lid: vec3u) {
  let c = lid.x;
  setArgs(IA_COLOR + 3u * c, colorThreads(color[params.colorStartOffset + c + 1u] - color[params.colorStartOffset + c]));
}
`,qs=Yr(Ut),Se=["collision","adjacency","coloring","solve"];var tf=`
struct ScanParams {
  offset: u32,  // first element of the range in data
  n: u32,       // elements in the range
  pad0: u32,
  pad1: u32,
}

@group(0) @binding(0) var<uniform> sp: ScanParams;
@group(0) @binding(1) var<storage, read_write> data: array<u32>;
@group(0) @binding(2) var<storage, read_write> sums: array<u32>;

var<workgroup> partial: array<u32, 256>;

fn load(i: u32) -> u32 {
  if (i < sp.n) { return data[sp.offset + i]; }
  return 0u;
}

@compute @workgroup_size(256)
fn scanBlocks(@builtin(workgroup_id) wid: vec3u, @builtin(local_invocation_id) lid: vec3u) {
  let base = wid.x * 512u + lid.x * 2u;
  let a = load(base);
  let b = load(base + 1u);
  let own = a + b;
  partial[lid.x] = own;
  workgroupBarrier();
  // Hillis-Steele inclusive scan of the 256 pair sums
  for (var d = 1u; d < 256u; d *= 2u) {
    var v = 0u;
    if (lid.x >= d) { v = partial[lid.x - d]; }
    workgroupBarrier();
    partial[lid.x] += v;
    workgroupBarrier();
  }
  let exclusive = partial[lid.x] - own;
  if (base < sp.n) { data[sp.offset + base] = exclusive; }
  if (base + 1u < sp.n) { data[sp.offset + base + 1u] = exclusive + a; }
  if (lid.x == 255u) { sums[wid.x] = partial[255]; }
}

@compute @workgroup_size(256)
fn addBlocks(@builtin(workgroup_id) wid: vec3u, @builtin(local_invocation_id) lid: vec3u) {
  let add = sums[wid.x];
  let base = wid.x * 512u + lid.x * 2u;
  if (base < sp.n) { data[sp.offset + base] += add; }
  if (base + 1u < sp.n) { data[sp.offset + base + 1u] += add; }
}
`,tt=class{levels=[];buffers=[];scanPipeline;addPipeline;constructor(e,t,i,r){let o=e.createShaderModule({label:"prefix scan",code:tf}),a=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),n=e.createPipelineLayout({bindGroupLayouts:[a]});this.scanPipeline=e.createComputePipeline({label:"scanBlocks",layout:n,compute:{module:o,entryPoint:"scanBlocks"}}),this.addPipeline=e.createComputePipeline({label:"addBlocks",layout:n,compute:{module:o,entryPoint:"addBlocks"}});let l=t,c=i,u=r;for(;;){let f=Math.max(1,Math.ceil(u/512)),d=e.createBuffer({label:`scan sums ${this.levels.length}`,size:Math.max(f,4)*4,usage:GPUBufferUsage.STORAGE}),p=e.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM,mappedAtCreation:!0});new Uint32Array(p.getMappedRange()).set([c,u,0,0]),p.unmap(),this.buffers.push(d,p);let m=e.createBindGroup({layout:a,entries:[{binding:0,resource:{buffer:p}},{binding:1,resource:{buffer:l}},{binding:2,resource:{buffer:d}}]});if(this.levels.push({n:u,blocks:f,group:m}),f===1)break;l=d,c=0,u=f}}encode(e){e.setPipeline(this.scanPipeline);for(let t of this.levels)e.setBindGroup(0,t.group),e.dispatchWorkgroups(t.blocks);e.setPipeline(this.addPipeline);for(let t=this.levels.length-2;t>=0;t--)e.setBindGroup(0,this.levels[t].group),e.dispatchWorkgroups(this.levels[t].blocks)}destroy(){for(let e of this.buffers)e.destroy()}};var rf=`
alias TopoItem = Contact;

fn topoCount() -> u32 {
  return min(atomicLoad(&counters[C_CONTACTS]), params.contactCapacity);
}

/** Tells apart a body pair's contacts (up to two per pair in 2D): the contact's feature key. */
fn topoSecondary(i: u32) -> u32 {
  return contacts[i].ids.z;
}

fn dynamicBody(i: i32) -> bool {
  return i >= 0 && bodies[i].shape.z > 0.0;
}

/** A joint takes part unless it was disabled (fracture, released drag). */
fn jointActive(j: u32) -> bool {
  let s = joints[j].stiff;
  return info[j].x != T_NONE && (s.x != 0.0 || s.y != 0.0 || s.z != 0.0);
}
`,Ti=(s,e)=>`
${s}
${e}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> bodies: array<Body>;
@group(0) @binding(2) var<storage, read> joints: array<Joint>;
@group(0) @binding(3) var<storage, read> info: array<vec4i>;
@group(0) @binding(4) var<storage, read> contacts: array<TopoItem>;
@group(0) @binding(5) var<storage, read_write> counters: array<atomic<u32>>;
// Adjacency: degree -> start[bodies + 1] | fill[bodies] | list
@group(0) @binding(6) var<storage, read_write> adj: array<atomic<u32>>;
// Colours: stateA[bodies] | stateB[bodies] | start[65] | bodies[bodies] | hist[64 * groups + 1]
@group(0) @binding(7) var<storage, read_write> color: array<atomic<u32>>;


fn endpoints(id: u32) -> vec2i {
  if (id < params.jointCount) { return info[id].yz; }
  let ids = contacts[id - params.jointCount].ids;
  return vec2i(i32(ids.x), i32(ids.y));
}

// --- Adjacency ----------------------------------------------------------------------------

fn countEndpoints(id: u32) {
  let e = endpoints(id);
  if (dynamicBody(e.x)) { atomicAdd(&adj[e.x], 1u); }
  if (dynamicBody(e.y)) { atomicAdd(&adj[e.y], 1u); }
}

fn fillEndpoints(id: u32) {
  let e = endpoints(id);
  for (var s = 0; s < 2; s++) {
    let x = e[s];
    if (!dynamicBody(x)) { continue; }
    let slot = atomicLoad(&adj[x]) + atomicAdd(&adj[params.adjFillOffset + u32(x)], 1u);
    atomicStore(&adj[params.adjListOffset + slot], id);
  }
}

@compute @workgroup_size(64)
fn degreeJoints(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= params.jointCount || !jointActive(gid.x)) { return; }
  countEndpoints(gid.x);
}

@compute @workgroup_size(64)
fn degreeContacts(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= topoCount()) { return; }
  countEndpoints(params.jointCount + gid.x);
}

@compute @workgroup_size(64)
fn fillJoints(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= params.jointCount || !jointActive(gid.x)) { return; }
  fillEndpoints(gid.x);
}

@compute @workgroup_size(64)
fn fillContacts(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= topoCount()) { return; }
  fillEndpoints(params.jointCount + gid.x);
}

/**
 * Where constraint \`id\` goes in body b's list, independent of run-to-run order: joints first
 * by id, then contacts by the other body and topoSecondary. (Contact ids are the order the
 * narrowphase appended them in, which atomics make vary from run to run.)
 */
fn adjKey(b: u32, id: u32) -> vec2u {
  if (id < params.jointCount) { return vec2u(0u, id); }
  let e = endpoints(id);
  let other = select(e.x, e.y, e.x == i32(b));
  return vec2u(u32(other + 2), topoSecondary(id - params.jointCount));
}

fn keyLess(a: vec2u, b: vec2u) -> bool {
  return a.x < b.x || (a.x == b.x && a.y < b.y);
}

/**
 * Sort each body's list (insertion sort: a body has a few dozen constraints at most). The
 * atomic fill leaves them in a different order each run, and the primal solve sums them in
 * list order: floating point then rounds differently, and a chaotic pile of bodies amplifies
 * that into a different outcome. Sorted, the same scene steps to the same bits every time.
 */
@compute @workgroup_size(64)
fn sortAdjacency(@builtin(global_invocation_id) gid: vec3u) {
  let b = gid.x;
  if (b >= params.bodyCount) { return; }
  let lo = atomicLoad(&adj[b]);
  let hi = atomicLoad(&adj[b + 1u]);
  let list = params.adjListOffset;
  for (var i = lo + 1u; i < hi; i++) {
    let id = atomicLoad(&adj[list + i]);
    let key = adjKey(b, id);
    var j = i;
    loop {
      if (j <= lo) { break; }
      let prev = atomicLoad(&adj[list + j - 1u]);
      if (!keyLess(key, adjKey(b, prev))) { break; }
      atomicStore(&adj[list + j], prev);
      j--;
    }
    atomicStore(&adj[list + j], id);
  }
}

// --- Colouring ----------------------------------------------------------------------------

fn priority(i: u32) -> u32 {
  return hash32(i + 0x9e3779b9u);
}

fn beats(i: u32, j: u32) -> bool {
  let pi = priority(i);
  let pj = priority(j);
  return pi > pj || (pi == pj && i > j);
}

fn neighbour(b: u32, e: u32) -> i32 {
  let ends = endpoints(atomicLoad(&adj[params.adjListOffset + e]));
  let other = select(ends.x, ends.y, ends.x == i32(b));
  return select(-1, other, dynamicBody(other));
}

fn state(offset: u32, i: u32) -> u32 {
  return atomicLoad(&color[offset + i]);
}

/**
 * Smallest colour not used by b's neighbours (optionally skipping pending ones); colorCap or
 * more when every colour below the cap is taken.
 */
fn smallestFree(b: u32, src: u32, skipPending: bool) -> u32 {
  var lo = 0u;
  var hi = 0u;
  for (var e = atomicLoad(&adj[b]); e < atomicLoad(&adj[b + 1u]); e++) {
    let j = neighbour(b, e);
    if (j < 0) { continue; }
    let s = state(src, u32(j));
    if (skipPending && (s & PENDING) != 0u) { continue; }
    let col = s & 0xffu;
    if (col == NO_COLOR) { continue; }
    if (col < 32u) { lo |= 1u << col; } else { hi |= 1u << (col - 32u); }
  }
  var free = MAX_COLORS - 1u;
  if (~lo != 0u) { free = countTrailingZeros(~lo); }
  else if (~hi != 0u) { free = 32u + countTrailingZeros(~hi); }
  return free;
}

// 1. Compaction: a body whose priority beats all neighbours may drop to a smaller free colour.
@compute @workgroup_size(64)
fn colorCompact(@builtin(global_invocation_id) gid: vec3u) {
  let b = gid.x;
  if (b >= params.bodyCount) { return; }
  let dst = params.stateBOffset;
  if (!dynamicBody(i32(b))) { atomicStore(&color[dst + b], NO_COLOR); return; }
  var col = state(0u, b) & 0xffu;
  if (col != NO_COLOR) {
    var isMax = true;
    for (var e = atomicLoad(&adj[b]); e < atomicLoad(&adj[b + 1u]) && isMax; e++) {
      let j = neighbour(b, e);
      if (j >= 0 && !beats(b, u32(j))) { isMax = false; }
    }
    if (isMax) { col = min(col, smallestFree(b, 0u, false)); }
  }
  atomicStore(&color[dst + b], col);
}

// 2. Pending: no colour, or the same colour as a higher-priority neighbour.
@compute @workgroup_size(64)
fn colorMark(@builtin(global_invocation_id) gid: vec3u) {
  let b = gid.x;
  if (b >= params.bodyCount) { return; }
  let src = params.stateBOffset;
  let col = state(src, b) & 0xffu;
  if (!dynamicBody(i32(b))) { atomicStore(&color[b], NO_COLOR); return; }
  var pending = col == NO_COLOR;
  for (var e = atomicLoad(&adj[b]); e < atomicLoad(&adj[b + 1u]) && !pending; e++) {
    let j = neighbour(b, e);
    if (j >= 0 && (state(src, u32(j)) & 0xffu) == col && beats(u32(j), b)) { pending = true; }
  }
  atomicStore(&color[b], col | select(0u, PENDING, pending));
}

// 3. Jones-Plassmann round: a pending body beating all pending neighbours takes the smallest
// colour its settled neighbours leave free. Winners are never adjacent.
fn round(b: u32, src: u32, dst: u32) {
  let s = state(src, b);
  if ((s & PENDING) == 0u) { atomicStore(&color[dst + b], s); return; }
  var isMax = true;
  for (var e = atomicLoad(&adj[b]); e < atomicLoad(&adj[b + 1u]) && isMax; e++) {
    let j = neighbour(b, e);
    if (j >= 0 && (state(src, u32(j)) & PENDING) != 0u && !beats(b, u32(j))) { isMax = false; }
  }
  if (isMax) {
    // No colour left below the cap: take the last one but stay pending, so the clash is
    // counted and the host grows the cap (committing it hid clashes between neighbours)
    let free = smallestFree(b, src, true);
    atomicStore(&color[dst + b], select(free, (params.colorCap - 1u) | PENDING, free >= params.colorCap));
  } else { atomicStore(&color[dst + b], s); }
}

@compute @workgroup_size(64)
fn colorRoundAB(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= params.bodyCount) { return; }
  round(gid.x, 0u, params.stateBOffset);
}

@compute @workgroup_size(64)
fn colorRoundBA(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= params.bodyCount) { return; }
  round(gid.x, params.stateBOffset, 0u);
}

// 4-6. Bucket bodies by colour, keeping each colour's bodies in (chunked) index order so a
// colour's primal pass reads memory coherently (measured 4-21% faster than an atomic scatter).
// Each workgroup of COLOR_WG bodies counts its bodies per colour; a prefix scan over the
// colour-major (colour, workgroup) counts turns them into slot offsets and colour starts; then
// each workgroup writes its bodies contiguously.

var<workgroup> hist: array<atomic<u32>, 64>;
var<workgroup> chunkColors: array<u32, ${256}>;

// 4. Per-workgroup colour histogram; each body's rank within it goes to stateB. Bodies still
// pending keep a clashing colour (counted). Dispatched over the whole capacity so every
// histogram entry is rewritten each step.
@compute @workgroup_size(${256})
fn colorCount(@builtin(global_invocation_id) gid: vec3u, @builtin(local_invocation_id) lid: vec3u, @builtin(workgroup_id) wid: vec3u) {
  if (lid.x < MAX_COLORS) { atomicStore(&hist[lid.x], 0u); }
  let b = gid.x;
  var col = NO_COLOR;
  if (b < params.bodyCount && dynamicBody(i32(b))) {
    let s = state(0u, b);
    col = s & 0xffu;
    if ((s & PENDING) != 0u) { atomicAdd(&counters[C_CLASHES], 1u); }
    if (col == NO_COLOR) { col = params.colorCap - 1u; }
    atomicStore(&color[b], col);
    atomicMax(&counters[C_NUM_COLORS], col + 1u);
  }
  chunkColors[lid.x] = col;
  workgroupBarrier();
  if (col != NO_COLOR) {
    // Stable rank: same-colour bodies earlier in this chunk (keeps index order in the bucket)
    var rank = 0u;
    for (var j = 0u; j < lid.x; j++) { rank += select(0u, 1u, chunkColors[j] == col); }
    atomicStore(&color[params.stateBOffset + b], rank);
    atomicAdd(&hist[col], 1u);
  }
  workgroupBarrier();
  if (lid.x < MAX_COLORS) {
    atomicStore(&color[params.colorHistOffset + lid.x * params.colorGroups + wid.x], atomicLoad(&hist[lid.x]));
  }
  // The entry after the last one becomes the total once scanned
  if (gid.x == 0u) { atomicStore(&color[params.colorHistOffset + MAX_COLORS * params.colorGroups], 0u); }
}

// 5. After the histogram scan: colour c starts at its first workgroup's offset.
@compute @workgroup_size(64)
fn colorStarts(@builtin(local_invocation_id) lid: vec3u) {
  let c = lid.x;
  atomicStore(&color[params.colorStartOffset + c], atomicLoad(&color[params.colorHistOffset + c * params.colorGroups]));
  if (c == 0u) {
    atomicStore(&color[params.colorStartOffset + MAX_COLORS], atomicLoad(&color[params.colorHistOffset + MAX_COLORS * params.colorGroups]));
  }
}

// 6. Scatter: workgroup offset for the body's colour plus its rank within the workgroup.
@compute @workgroup_size(${256})
fn colorScatter(@builtin(global_invocation_id) gid: vec3u, @builtin(workgroup_id) wid: vec3u) {
  let b = gid.x;
  if (b >= params.bodyCount || !dynamicBody(i32(b))) { return; }
  let col = state(0u, b) & 0xffu;
  let slot = atomicLoad(&color[params.colorHistOffset + col * params.colorGroups + wid.x]) + state(params.stateBOffset, b);
  atomicStore(&color[params.colorBodiesOffset + slot], b);
}
`,Qr=Ti(Ut,rf);var sf=jt(),zt=ae(),Vs=ae(),ji=ae(),Ga=ae(),cr=ae(),Fa=ae(),ft=ae(),Ws=ae(),Kr=ae(),ye=S(),ze=S(),ve=S(),li=S(),ur=S();function Ua(s,e,t){return Ce(s,-t[e],-t[e],-t[e]),s[e]+=t[0],s[3+e]+=t[1],s[6+e]+=t[2],s}var Hs=(s,e,t)=>ct(s,Bt(e[0],t),Bt(e[1],t),Bt(e[2],t)),ke=class extends Ft{rA;rB;C0Lin=S();C0Ang=S();penaltyLin=S();penaltyAng=S();lambdaLin=S();lambdaAng=S();stiffnessLin;stiffnessAng;fracture;torqueArm;broken=!1;constructor(e,t,i,r,o,a=1/0,n=0,l=1/0){super(e,t,i),this.rA=S(r[0],r[1],r[2]),this.rB=S(o[0],o[1],o[2]),this.stiffnessLin=a,this.stiffnessAng=n,this.fracture=l;let c=t?t.size:[0,0,0];this.torqueArm=Ne([c[0]+i.size[0],c[1]+i.size[1],c[2]+i.size[2]])}evaluateLin(e){let{bodyA:t,bodyB:i}=this;return t?Gt(li,t.positionLin,t.positionAng,this.rA):li.set(this.rA),J(e,li,Gt(ur,i.positionLin,i.positionAng,this.rB))}evaluateAng(e){return ut(e,this.bodyA?this.bodyA.positionAng:sf,this.bodyB.positionAng),ne(e,e,this.torqueArm)}initialize(){let{solver:e}=this;this.evaluateLin(this.C0Lin),this.evaluateAng(this.C0Ang);for(let t=0;t<3;t++)this.lambdaLin[t]=this.lambdaLin[t]*e.alpha*e.gamma,this.lambdaAng[t]=this.lambdaAng[t]*e.alpha*e.gamma,this.penaltyLin[t]=ce(this.penaltyLin[t]*e.gamma,Et,Ve),this.penaltyAng[t]=ce(this.penaltyAng[t]*e.gamma,Et,Ve);return Hs(this.penaltyLin,this.penaltyLin,this.stiffnessLin),Hs(this.penaltyAng,this.penaltyAng,this.stiffnessAng),!this.broken}updatePrimal(e,t,i){let r=e===this.bodyA;if(Ne(this.penaltyLin)>0){Ce(zt,this.penaltyLin[0],this.penaltyLin[1],this.penaltyLin[2]),this.evaluateLin(ye),this.stiffnessLin===1/0&&D(ye,ye,this.C0Lin,-t),ue(ze,zt,ye),D(ze,ze,this.lambdaLin,1);let o=r?1:-1;Ce(Vs,o,o,o),r?ka(ji,ee(ve,le(ve,this.bodyA.positionAng,this.rA))):ka(ji,le(ve,this.bodyB.positionAng,this.rB)),_i(Ga,Vs),_i(cr,ji),Ke(Fa,cr,zt),qe(i.lhsLin,Ke(ft,Ke(ft,Ga,zt),Vs)),qe(i.lhsAng,Ke(ft,Fa,ji)),qe(i.lhsCross,Ke(ft,Fa,Vs)),r?le(ve,this.bodyA.positionAng,this.rA):ee(ve,le(ve,this.bodyB.positionAng,this.rB)),Ei(Ws,Ua(Kr,0,ve),ze[0]),qe(Ws,Ei(Kr,Ua(Kr,1,ve),ze[1])),qe(Ws,Ei(Kr,Ua(Kr,2,ve),ze[2])),qe(i.lhsAng,Kn(ft,Ws)),D(i.rhsLin,i.rhsLin,ue(ve,Ga,ze),1),D(i.rhsAng,i.rhsAng,ue(ve,cr,ze),1)}if(Ne(this.penaltyAng)>0){Ce(zt,this.penaltyAng[0],this.penaltyAng[1],this.penaltyAng[2]),this.evaluateAng(ye),this.stiffnessAng===1/0&&D(ye,ye,this.C0Ang,-t),ue(ze,zt,ye),D(ze,ze,this.lambdaAng,1);let o=(r?1:-1)*this.torqueArm;Ce(ji,o,o,o),_i(cr,ji),qe(i.lhsAng,Ke(ft,Ke(ft,cr,zt),ji)),D(i.rhsAng,i.rhsAng,ue(ve,cr,ze),1)}}updateDual(e){let{solver:t}=this;Ne(this.penaltyLin)>0&&(Ce(zt,this.penaltyLin[0],this.penaltyLin[1],this.penaltyLin[2]),this.evaluateLin(ye),this.stiffnessLin===1/0&&(D(ye,ye,this.C0Lin,-e),ue(ze,zt,ye),D(this.lambdaLin,ze,this.lambdaLin,1)),D(this.penaltyLin,this.penaltyLin,Ca(ve,ye),t.betaLin),Hs(this.penaltyLin,this.penaltyLin,Bt(this.stiffnessLin,Ve))),Ne(this.penaltyAng)>0&&(Ce(zt,this.penaltyAng[0],this.penaltyAng[1],this.penaltyAng[2]),this.evaluateAng(ye),this.stiffnessAng===1/0&&(D(ye,ye,this.C0Ang,-e),ue(ze,zt,ye),D(this.lambdaAng,ze,this.lambdaAng,1)),D(this.penaltyAng,this.penaltyAng,Ca(ve,ye),t.betaAng),Hs(this.penaltyAng,this.penaltyAng,Bt(this.stiffnessAng,Ve))),Ne(this.lambdaAng)>this.fracture*this.fracture&&(this.penaltyLin.fill(0),this.penaltyAng.fill(0),this.lambdaLin.fill(0),this.lambdaAng.fill(0),this.broken=!0)}},dt=class extends Ft{rA;rB;rest;stiffness;constructor(e,t,i,r,o,a,n=-1){super(e,t,i),this.rA=S(r[0],r[1],r[2]),this.rB=S(o[0],o[1],o[2]),this.stiffness=a,this.rest=n,this.rest<0&&(Gt(li,t.positionLin,t.positionAng,this.rA),Gt(ur,i.positionLin,i.positionAng,this.rB),this.rest=sr(J(ye,li,ur)))}initialize(){return!0}updatePrimal(e,t,i){let r=this.bodyA,o=this.bodyB;Gt(li,r.positionLin,r.positionAng,this.rA),Gt(ur,o.positionLin,o.positionAng,this.rB);let a=J(ye,li,ur),n=sr(a);if(n<=1e-6)return;let l=_t(ze,a,n),c=n-this.rest,u=this.stiffness*c,f=li,d=ur;e===r?(le(ve,r.positionAng,this.rA),f.set(l),Dt(d,ve,l)):(le(ve,o.positionAng,this.rB),ee(f,l),ee(d,Dt(d,ve,l))),qe(i.lhsLin,Ei(ft,Ms(ft,f,f),this.stiffness)),qe(i.lhsAng,Ei(ft,Ms(ft,d,d),this.stiffness)),qe(i.lhsCross,Ei(ft,Ms(ft,d,f),this.stiffness)),D(i.rhsLin,i.rhsLin,ne(ve,f,u),1),D(i.rhsAng,i.rhsAng,ne(ve,d,u),1)}updateDual(){}},$s=class extends Ft{initialize(){return!0}updatePrimal(){}updateDual(){}};var We=40,fr=0,Zr=4,Bl=8,Cl=12,Na=16,qa=20,Sl=24,kl=28,Va=32,Wa=36,pe=32,ci=0,es=4,dr=8,hr=12,Pl=16,Ll=20,ui=24,pr=28,Nt=8;var Js=4,Ht=16,mr=0,Xs=4,Ys=8,Qs=12,ts=2147483648,gr=6,of=7,_l=0,Ha=1,$a=2,Ks=3,is=1,br=2,rs=1,ss=2,os=4,as=8,ns=16,af=.1,El=.002,Ml=.002,nf=.05,ls=44,ge=`
// Shared by every 3D module (avbd3d/gpu/layout.ts)
${Da}
const T_JOINT = ${is};
const T_SPRING = ${br};

const PENALTY_MIN = 1.0;
const PENALTY_MAX = 1e10;
// Least LDL\u1D40 pivot of the primal solve, relative to its diagonal (wgsl-solve.ts finishBody)
const PIVOT_FLOOR = 1e-5;
const COLLISION_MARGIN = 0.01;
const STICK_THRESH = 0.00001;

const SHAPE_SPHERE = ${Ha}.0;
const SHAPE_SAIL = ${$a}.0;
const SHAPE_HULL = ${Ks}.0;
const STICK_BIT = ${ts}u;
const C_MANIFOLDS = ${gr}u;
const C_PREV_MANIFOLDS = ${of}u;
/** Feature key of every contact involving a sphere (one contact per pair). */
const SPHERE_FEATURE = 3u << 24u;

const FLAG_MATCH_NEAREST = ${rs}u;
const FLAG_FACE_BIAS = ${ss}u;
const FLAG_REUSE_CONTACTS = ${os}u;
const FLAG_START_AT_REST = ${as}u;
const FLAG_MASS_PENALTY = ${ns}u;
const REST_SPEED = ${af};
const NEAREST_FRACTION = ${nf};

struct Body {
  pos: vec4f,          // xyz, w: friction
  rot: vec4f,          // orientation quaternion (x, y, z, w)
  initialPos: vec4f,   // pose at the start of the step (x-)
  initialRot: vec4f,
  size: vec4f,         // full widths, w: mass (0 = static)
  moment: vec4f,       // principal moments, w: bounding radius
  inertialPos: vec4f,  // inertial target y, w: step it last moved from its reference pose (u32)
  inertialRot: vec4f,
  vel: vec4f,          // xyz, w: previous step's velocity along up (adaptive warm start)
  angVel: vec4f,       // xyz, w: shape (SHAPE_BOX, SHAPE_SPHERE, SHAPE_SAIL, or SHAPE_HULL + hull offset)
}

struct Joint {
  penLin: vec4f,  // xyz, w: linear stiffness (>= HARD: hard); spring: its stiffness
  penAng: vec4f,  // xyz, w: angular stiffness
  lamLin: vec4f,  // xyz, w: fracture threshold on |lamAng|
  lamAng: vec4f,  // xyz, w: torque arm
  c0Lin: vec4f,   // C(x-)
  c0Ang: vec4f,
  rA: vec4f,      // xyz: anchor on A (world point when A is the world), w: spring rest length
  rB: vec4f,      // xyz: anchor on B
}

struct Manifold {
  ids: vec4u,     // bodyA, bodyB (A > B), first contact, count | generation step << 4
  geo: vec4f,     // normal (B to A), friction
}

fn pairCount(m: Manifold) -> u32 {
  return m.ids.w & 15u;
}

struct Contact {
  rA: vec3f,      // body-local anchors
  key: u32,       // feature | STICK_BIT
  rB: vec3f,
  c0x: f32,       // C(x-) in the pair's basis, including the collision margin
  pen: vec3f,     // normal, tangent, tangent
  c0y: f32,
  lam: vec3f,
  c0z: f32,
}

struct Params {
  dt: f32,
  gravity: f32,         // acceleration along up (m/s\xB2, negative: down)
  betaLin: f32,
  betaAng: f32,
  gamma: f32,
  alpha: f32,
  flags: u32,
  bodyCount: u32,
  jointCount: u32,
  colorCap: u32,
  cellSize: f32,
  tableMask: u32,
  maxSmallRadius: f32,
  largeCount: u32,
  noCollideCount: u32,
  pairCapacity: u32,
  contactCapacity: u32,
  hashMask: u32,
  adjFillOffset: u32,
  adjListOffset: u32,
  gridCursorOffset: u32,
  gridSortedOffset: u32,
  gridCellOffset: u32,
  stateBOffset: u32,
  colorHistOffset: u32,
  colorStartOffset: u32,
  colorGroups: u32,
  colorBodiesOffset: u32,
  rounds: u32,
  manifoldCapacity: u32,
  step: u32,           // steps since the solver was created (from 1)
  primalLanes: u32,    // bytes 0-2: log2 of the colour sizes from which 1, 2, 4 lanes per body suffice
  wind: vec4f,         // xyz: wind velocity (m/s), w: air pressure coefficient \xBD\u03C1C_d
  gust: vec4f,         // x: gust strength (fraction of the wind)
  up: vec4f,           // xyz: which way is up (unit)
}

fn qmul(a: vec4f, b: vec4f) -> vec4f {
  return vec4f(
    a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z);
}

fn qconj(q: vec4f) -> vec4f {
  return vec4f(-q.xyz, q.w);
}

/** The demo's quat - quat: 2\xB7vec(a\xB7b\u207B\xB9), a small-angle rotation vector. */
fn qsub(a: vec4f, b: vec4f) -> vec3f {
  return qmul(a, qconj(b) / dot(b, b)).xyz * 2.0;
}

/** The demo's quat + float3: integrate a rotation vector, normalize(a + (v, 0)\xB7a\xB7\xBD). */
fn qadd(a: vec4f, v: vec3f) -> vec4f {
  return normalize(a + qmul(vec4f(v, 0.0), a) * 0.5);
}

fn qrotate(q: vec4f, v: vec3f) -> vec3f {
  let t = cross(q.xyz, v) * 2.0;
  return v + t * q.w + cross(q.xyz, t);
}

/** Contact basis rows (n, t1, t2), as maths.h orthonormal(). */
fn orthonormal(n: vec3f) -> mat3x3f {
  var t1 = select(vec3f(0.0, -n.z, n.y), vec3f(-n.y, n.x, 0.0), abs(n.x) > abs(n.z));
  t1 = normalize(t1);
  // Columns of the WGSL matrix are the basis rows
  return mat3x3f(n, t1, cross(n, t1));
}
`,yr=`
alias TopoItem = Manifold;

/** A body pair has one manifold, so the other body alone orders a body's contacts. */
fn topoSecondary(i: u32) -> u32 {
  return 0u;
}

fn topoCount() -> u32 {
  return min(atomicLoad(&counters[C_MANIFOLDS]), params.manifoldCapacity);
}

fn dynamicBody(i: i32) -> bool {
  return i >= 0 && bodies[i].size.w > 0.0;
}

/** A joint or spring takes part unless disabled (fracture, released drag): stiffness zeroed. */
fn jointActive(j: u32) -> bool {
  let k = joints[j];
  return info[j].x != T_NONE && (k.penLin.w != 0.0 || k.penAng.w != 0.0);
}
`,Ja=`
fn lanesFor(bodies: u32) -> u32 {
  let rule = params.primalLanes;
  if (bodies >= (1u << (rule & 255u))) { return 1u; }
  if (bodies >= (1u << ((rule >> 8u) & 255u))) { return 2u; }
  if (bodies >= (1u << ((rule >> 16u) & 255u))) { return 4u; }
  return 8u;
}

fn colorThreads(bodies: u32) -> u32 {
  return bodies * lanesFor(bodies);
}
`,Zs={counter:"C_MANIFOLDS",prevCounter:"C_PREV_MANIFOLDS",capacity:"params.manifoldCapacity",colorThreads:Ja};var zl=`
const MAX_CLIP = 64u;
const NO_HULL = 0xffffffffu;

/** A convex shape as the hull code sees it: a box (hull = NO_HULL, extents h) or a hull. */
struct Poly {
  c: vec3f,
  q: vec4f,
  h: vec3f,
  hull: u32,
  vs: u32, nv: u32, fs: u32, nf: u32, es: u32, ne: u32, is: u32,
}

// Box topology: vertex v has signs (bit 0: x, 1: y, 2: z); faces +x -x +y -y +z -z as vertex
// loops; edges as vertex a, vertex b, the two faces they separate.
var<private> BOX_FACE_VERTS: array<u32, 24> = array<u32, 24>(1u, 3u, 7u, 5u, 0u, 2u, 6u, 4u, 2u, 3u, 7u, 6u, 0u, 1u, 5u, 4u, 4u, 5u, 7u, 6u, 0u, 1u, 3u, 2u);
var<private> BOX_EDGES: array<vec4u, 12> = array<vec4u, 12>(
  vec4u(0u, 1u, 3u, 5u), vec4u(2u, 3u, 2u, 5u), vec4u(4u, 5u, 3u, 4u), vec4u(6u, 7u, 2u, 4u),
  vec4u(0u, 2u, 1u, 5u), vec4u(1u, 3u, 0u, 5u), vec4u(4u, 6u, 1u, 4u), vec4u(5u, 7u, 0u, 4u),
  vec4u(0u, 4u, 1u, 3u), vec4u(1u, 5u, 0u, 3u), vec4u(2u, 6u, 1u, 2u), vec4u(3u, 7u, 0u, 2u));

fn isHull(i: u32) -> bool {
  return bodies[i].angVel.w >= SHAPE_HULL;
}

fn polyOf(i: u32) -> Poly {
  var P: Poly;
  P.c = bodies[i].pos.xyz;
  P.q = bodies[i].rot;
  P.h = bodies[i].size.xyz * 0.5;
  P.hull = NO_HULL;
  P.nv = 8u; P.nf = 6u; P.ne = 12u;
  if (isHull(i)) {
    let h = u32(bodies[i].angVel.w - SHAPE_HULL + 0.5);
    let h0 = hulls[h];
    let h1 = hulls[h + 1u];
    P.hull = h;
    P.vs = h0.x; P.nv = h0.y; P.fs = h0.z; P.nf = h0.w;
    P.es = h1.x; P.ne = h1.y; P.is = h1.z;
  }
  return P;
}

fn vertLocal(P: Poly, v: u32) -> vec3f {
  if (P.hull == NO_HULL) {
    return vec3f(select(-P.h.x, P.h.x, (v & 1u) != 0u), select(-P.h.y, P.h.y, (v & 2u) != 0u), select(-P.h.z, P.h.z, (v & 4u) != 0u));
  }
  return bitcast<vec4f>(hulls[P.vs + v]).xyz;
}

fn vert(P: Poly, v: u32) -> vec3f {
  return P.c + qrotate(P.q, vertLocal(P, v));
}

/** Face f's world plane: outward normal (xyz) and offset (w). */
fn facePlane(P: Poly, f: u32) -> vec4f {
  var nl: vec3f;
  var d: f32;
  if (P.hull == NO_HULL) {
    let k = f / 2u;
    let s = select(1.0, -1.0, (f & 1u) != 0u);
    nl = vec3f(0.0);
    nl[k] = s;
    d = P.h[k];
  } else {
    let p = bitcast<vec4f>(hulls[P.fs + 2u * f]);
    nl = p.xyz;
    d = p.w;
  }
  let n = qrotate(P.q, nl);
  return vec4f(n, d + dot(n, P.c));
}

fn faceVertCount(P: Poly, f: u32) -> u32 {
  if (P.hull == NO_HULL) { return 4u; }
  return hulls[P.fs + 2u * f + 1u].y;
}

fn faceVert(P: Poly, f: u32, j: u32) -> u32 {
  if (P.hull == NO_HULL) { return BOX_FACE_VERTS[f * 4u + j]; }
  let k = hulls[P.fs + 2u * f + 1u].x + j;
  return hulls[P.is + k / 4u][k % 4u];
}

fn edgeOf(P: Poly, e: u32) -> vec4u {
  if (P.hull == NO_HULL) { return BOX_EDGES[e]; }
  return hulls[P.es + e];
}

fn polySupport(P: Poly, dir: vec3f) -> vec3f {
  let l = qrotate(qconj(P.q), dir);
  if (P.hull == NO_HULL) { return P.c + qrotate(P.q, select(-P.h, P.h, l >= vec3f(0.0))); }
  var best = -3.4e38;
  var at = vec3f(0.0);
  for (var v = 0u; v < P.nv; v++) {
    let p = bitcast<vec4f>(hulls[P.vs + v]).xyz;
    let s = dot(p, l);
    if (s > best) { best = s; at = p; }
  }
  return P.c + qrotate(P.q, at);
}

struct FaceQuery { sep: f32, face: u32 }

/** The face of A whose plane B sticks out of least (largest separation). */
fn queryFaces(A: Poly, B: Poly) -> FaceQuery {
  var out = FaceQuery(-3.4e38, 0u);
  for (var f = 0u; f < A.nf; f++) {
    let p = facePlane(A, f);
    let s = dot(p.xyz, polySupport(B, -p.xyz)) - p.w;
    if (s > out.sep) { out = FaceQuery(s, f); }
  }
  return out;
}

/** The edges' Gauss-map arcs (a-b on A's, c-d on B's negated) cross: their cross product is a candidate axis. */
fn minkowskiFace(a: vec3f, b: vec3f, c: vec3f, d: vec3f) -> bool {
  let bxa = cross(b, a);
  let dxc = cross(d, c);
  let cba = dot(c, bxa);
  let dba = dot(d, bxa);
  let adc = dot(a, dxc);
  let bdc = dot(b, dxc);
  return cba * dba < 0.0 && adc * bdc < 0.0 && cba * bdc > 0.0;
}

struct EdgeQuery { sep: f32, ea: u32, eb: u32, n: vec3f, valid: bool }

/** Face f's outward normal in the shape's own frame. */
fn faceNormalLocal(P: Poly, f: u32) -> vec3f {
  if (P.hull == NO_HULL) {
    var n = vec3f(0.0);
    n[f / 2u] = select(1.0, -1.0, (f & 1u) != 0u);
    return n;
  }
  return bitcast<vec4f>(hulls[P.fs + 2u * f]).xyz;
}

fn queryEdges(A: Poly, B: Poly) -> EdgeQuery {
  var out: EdgeQuery;
  out.sep = -3.4e38;
  // The Gauss-map test in B's frame: A's normals turned once per A edge, B's read as stored
  let toB = qmul(qconj(B.q), A.q);
  for (var i = 0u; i < A.ne; i++) {
    let ea = edgeOf(A, i);
    let a = qrotate(toB, faceNormalLocal(A, ea.z));
    let b = qrotate(toB, faceNormalLocal(A, ea.w));
    for (var j = 0u; j < B.ne; j++) {
      let eb = edgeOf(B, j);
      if (!minkowskiFace(a, b, -faceNormalLocal(B, eb.z), -faceNormalLocal(B, eb.w))) { continue; }
      let pa = vert(A, ea.x);
      let qa = vert(A, ea.y);
      let pb = vert(B, eb.x);
      let qb = vert(B, eb.y);
      var n = cross(qa - pa, qb - pb);
      let l = length(n);
      // Parallel edges: their faces' normals already cover the axis
      if (l < 1e-5 * length(qa - pa) * length(qb - pb)) { continue; }
      n /= l;
      if (dot(n, pa - A.c) < 0.0) { n = -n; }
      let s = dot(n, pb - pa);
      if (s > out.sep) { out = EdgeQuery(s, i, j, n, true); }
    }
  }
  return out;
}

/** Clip poly (n points) to dot(pn, x) <= offset. */
fn clipHull(src: ptr<function, array<vec3f, 64>>, n: u32, dst: ptr<function, array<vec3f, 64>>, pn: vec3f, offset: f32) -> u32 {
  if (n == 0u) { return 0u; }
  var count = 0u;
  var a = (*src)[n - 1u];
  var da = dot(pn, a) - offset;
  for (var i = 0u; i < n; i++) {
    let b = (*src)[i];
    let db = dot(pn, b) - offset;
    if ((da <= PLANE_EPSILON) != (db <= PLANE_EPSILON)) {
      var t = 0.0;
      if (abs(da - db) > SAT_AXIS_EPSILON) { t = clamp(da / (da - db), 0.0, 1.0); }
      if (count < MAX_CLIP) { (*dst)[count] = a + (b - a) * t; count++; }
    }
    if (db <= PLANE_EPSILON && count < MAX_CLIP) { (*dst)[count] = b; count++; }
    a = b;
    da = db;
  }
  return count;
}

/** Face contact: A's (refIsA) or B's face refFace is the reference face; the other shape's is clipped to it. */
fn hullFaceContact(A: Poly, B: Poly, refIsA: bool, refFace: u32) -> Found {
  var found: Found;
  var R = B;
  var I = A;
  if (refIsA) { R = A; I = B; }
  let plane = facePlane(R, refFace);
  let rn = plane.xyz;
  // Incident face: the other shape's most anti-parallel among those with its deepest vertex. The
  // most anti-parallel of all may not touch that vertex on an irregular hull (it does on a box), and
  // clipping it would then leave the deepest corner without a contact.
  var deepest = 0u;
  var low = 3.4e38;
  for (var v = 0u; v < I.nv; v++) {
    let d = dot(vert(I, v), rn);
    if (d < low) { low = d; deepest = v; }
  }
  var inc = 0u;
  var least = 3.4e38;
  for (var f = 0u; f < I.nf; f++) {
    var touches = false;
    for (var j = 0u; j < faceVertCount(I, f); j++) { if (faceVert(I, f, j) == deepest) { touches = true; break; } }
    if (!touches) { continue; }
    let d = dot(facePlane(I, f).xyz, rn);
    if (d < least) { least = d; inc = f; }
  }
  var poly: array<vec3f, 64>;
  var tmp: array<vec3f, 64>;
  var n = min(faceVertCount(I, inc), MAX_CLIP);
  for (var j = 0u; j < n; j++) { poly[j] = vert(I, faceVert(I, inc, j)); }
  // Side planes of the reference face, outward from its centre
  let k = faceVertCount(R, refFace);
  var centre = vec3f(0.0);
  for (var j = 0u; j < k; j++) { centre += vert(R, faceVert(R, refFace, j)); }
  centre /= f32(k);
  for (var j = 0u; j < k && n > 0u; j++) {
    let v0 = vert(R, faceVert(R, refFace, j));
    let v1 = vert(R, faceVert(R, refFace, (j + 1u) % k));
    var s = cross(v1 - v0, rn);
    let l = length(s);
    if (l < SAT_AXIS_EPSILON) { continue; }
    s /= l;
    if (dot(s, centre - v0) > 0.0) { s = -s; }
    n = clipHull(&poly, n, &tmp, s, dot(s, v0));
    for (var m = 0u; m < n; m++) { poly[m] = tmp[m]; }
  }
  // Points on or below the reference plane; at most MAX_CONTACTS, the deepest first then the
  // farthest from those chosen (the patch's extent is what keeps a resting shape upright)
  // (feature keys use the point's index in the clipped polygon, as faceManifold does: stable from
  // step to step, so warm starts and static-friction anchors stay with their point)
  var depth: array<f32, 64>;
  var index: array<u32, 64>;
  var keep = 0u;
  for (var m = 0u; m < n; m++) {
    let dist = dot(rn, poly[m]) - plane.w;
    if (dist <= PLANE_EPSILON) { tmp[keep] = poly[m]; depth[keep] = dist; index[keep] = m; keep++; }
  }
  let prefix = (select(AXIS_FACE_B, AXIS_FACE_A, refIsA) << 24u) | (min(refFace, 255u) << 16u) | (min(inc, 255u) << 8u);
  var chosen: array<bool, 64>;
  for (var c = 0u; c < min(keep, MAX_CONTACTS); c++) {
    var pick = 0u;
    var bestScore = -3.4e38;
    for (var m = 0u; m < keep; m++) {
      if (chosen[m]) { continue; }
      var score = -depth[m];
      if (c > 0u) {
        score = 3.4e38;
        for (var o = 0u; o < keep; o++) { if (chosen[o]) { score = min(score, dot(tmp[m] - tmp[o], tmp[m] - tmp[o])); } }
      }
      if (score > bestScore) { bestScore = score; pick = m; }
    }
    chosen[pick] = true;
    let p = tmp[pick];
    let onRef = p - rn * depth[pick];
    addFound(&found, select(p, onRef, refIsA), select(onRef, p, refIsA), prefix | min(index[pick], 255u));
  }
  if (found.count == 0u) {
    let nAB = select(-rn, rn, refIsA);
    addFound(&found, polySupport(A, nAB), polySupport(B, -nAB), prefix);
  }
  return found;
}

fn hullEdgeContact(A: Poly, B: Poly, q: EdgeQuery) -> Found {
  var found: Found;
  let ea = edgeOf(A, q.ea);
  let eb = edgeOf(B, q.eb);
  let p0 = vert(A, ea.x);
  let q0 = vert(B, eb.x);
  let d1 = vert(A, ea.y) - p0;
  let d2 = vert(B, eb.y) - q0;
  let r = p0 - q0;
  let a = dot(d1, d1);
  let e = dot(d2, d2);
  let f = dot(d2, r);
  let c = dot(d1, r);
  let b = dot(d1, d2);
  let denom = a * e - b * b;
  var s = 0.0;
  if (abs(denom) > SAT_AXIS_EPSILON * a * e) { s = clamp((b * f - c * e) / denom, 0.0, 1.0); }
  var t = (b * s + f) / max(e, SAT_AXIS_EPSILON);
  if (t < 0.0) { t = 0.0; s = clamp(-c / max(a, SAT_AXIS_EPSILON), 0.0, 1.0); }
  else if (t > 1.0) { t = 1.0; s = clamp((b - c) / max(a, SAT_AXIS_EPSILON), 0.0, 1.0); }
  addFound(&found, p0 + d1 * s, q0 + d2 * t, (AXIS_EDGE << 24u) | (min(q.ea, 255u) << 8u) | min(q.eb, 255u));
  return found;
}

/** Collide two convex shapes (at least one a hull); sat.n from A towards B. */
fn collidePoly(A: Poly, B: Poly, sat: ptr<function, Sat>) -> Found {
  var none: Found;
  let fa = queryFaces(A, B);
  if (fa.sep > 0.0) { return none; }
  let fb = queryFaces(B, A);
  if (fb.sep > 0.0) { return none; }
  let eq = queryEdges(A, B);
  if (eq.valid && eq.sep > 0.0) { return none; }
  // Faces are preferred (stabler manifolds) unless an edge axis is clearly better, as in collide
  let faceSep = max(fa.sep, fb.sep);
  var edgeWins = eq.valid && eq.sep > 0.95 * faceSep + 0.01;
  if ((params.flags & FLAG_FACE_BIAS) == 0u) { edgeWins = eq.valid && 0.95 * eq.sep > faceSep + 0.01; }
  if (edgeWins) {
    *sat = Sat(AXIS_EDGE, eq.ea, eq.eb, eq.sep, eq.n, true);
    return hullEdgeContact(A, B, eq);
  }
  // A's face unless B's separates more, as collide does
  if (fb.sep > fa.sep) {
    *sat = Sat(AXIS_FACE_B, 0u, fb.face, fb.sep, -facePlane(B, fb.face).xyz, true);
    return hullFaceContact(A, B, false, fb.face);
  }
  *sat = Sat(AXIS_FACE_A, fa.face, 0u, fa.sep, facePlane(A, fa.face).xyz, true);
  return hullFaceContact(A, B, true, fa.face);
}

/** Closest point of segment ab to p. */
fn segmentPoint(a: vec3f, b: vec3f, p: vec3f) -> vec3f {
  let d = b - a;
  return a + d * clamp(dot(p - a, d) / max(dot(d, d), 1e-20), 0.0, 1.0);
}

/** Sphere S (centre c, radius r) against hull X: as sphereBox (n from the sphere towards X). */
fn sphereHull(c: vec3f, r: f32, X: Poly) -> SphereBoxHit {
  var out: SphereBoxHit;
  var deepest = -3.4e38;
  var deepFace = 0u;
  for (var f = 0u; f < X.nf; f++) {
    let s = dot(facePlane(X, f).xyz, c) - facePlane(X, f).w;
    if (s > deepest) { deepest = s; deepFace = f; }
  }
  if (deepest > r) { return out; }
  if (deepest <= 0.0) {
    // Centre inside: out through the face it is least deep behind
    let n = facePlane(X, deepFace).xyz;
    out.hit = true;
    out.n = -n;
    out.onBox = c - n * deepest;
    out.onSphere = c - n * r;
    return out;
  }
  // Outside: the closest point is on a face the centre is in front of
  var best = vec3f(0.0);
  var bestDist = 3.4e38;
  for (var f = 0u; f < X.nf; f++) {
    let plane = facePlane(X, f);
    let s = dot(plane.xyz, c) - plane.w;
    if (s <= 0.0) { continue; }
    var p = c - plane.xyz * s;
    let k = faceVertCount(X, f);
    var centre = vec3f(0.0);
    for (var j = 0u; j < k; j++) { centre += vert(X, faceVert(X, f, j)); }
    centre /= f32(k);
    var inside = true;
    var edgeBest = vec3f(0.0);
    var edgeDist = 3.4e38;
    for (var j = 0u; j < k; j++) {
      let v0 = vert(X, faceVert(X, f, j));
      let v1 = vert(X, faceVert(X, f, (j + 1u) % k));
      var side = cross(v1 - v0, plane.xyz);
      if (dot(side, centre - v0) > 0.0) { side = -side; }
      if (dot(side, p - v0) > 0.0) { inside = false; }
      let q = segmentPoint(v0, v1, c);
      let dq = dot(q - c, q - c);
      if (dq < edgeDist) { edgeDist = dq; edgeBest = q; }
    }
    if (!inside) { p = edgeBest; }
    let dist = length(p - c);
    if (dist < bestDist) { bestDist = dist; best = p; }
  }
  if (bestDist > r) { return out; }
  var n = vec3f(0.0, 0.0, 1.0);
  if (bestDist > 0.0) { n = (c - best) / bestDist; }  // from the hull towards the sphere
  out.hit = true;
  out.n = -n;
  out.onBox = best;
  out.onSphere = c - n * r;
  return out;
}
`;var eo=`
${ge}

struct RefPose {
  pos: vec4f,
  rot: vec4f,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read_write> bodies: array<Body>;
@group(0) @binding(2) var<storage, read_write> refs: array<RefPose>;

@compute @workgroup_size(64)
fn updateRefs(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount) { return; }
  let pos = bodies[i].pos.xyz;
  let rot = bodies[i].rot;
  let last = refs[i];
  // A zero quaternion marks a body without a reference yet
  let moved = dot(last.rot, last.rot) == 0.0
    || length(pos - last.pos.xyz) > ${El}
    || length(qsub(rot, last.rot)) > ${Ml};
  if (moved) {
    refs[i] = RefPose(vec4f(pos, 0.0), rot);
    bodies[i].inertialPos.w = bitcast<f32>(params.step);
  }
}
`,fi=`
${ge}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> bodies: array<Body>;
// Grid: bucketStart[tableMask + 2] | cursor[tableMask + 1] | sorted[bodies] | cell[3 * bodies]
@group(0) @binding(2) var<storage, read_write> grid: array<atomic<u32>>;
@group(0) @binding(3) var<storage, read_write> pairs: array<vec2u>;
@group(0) @binding(4) var<storage, read_write> counters: array<atomic<u32>>;
// Static: large body indices[largeCount] | noCollide (hi, lo, joint) triples, sorted by (hi, lo)
@group(0) @binding(5) var<storage, read> statics: array<u32>;
@group(0) @binding(6) var<storage, read> joints: array<Joint>;
// Per body: its collision groups and the groups it collides with (GpuSolver3D.setFilters)
@group(0) @binding(7) var<storage, read> filters: array<vec2u>;

@compute @workgroup_size(1)
fn beginFrame() {
  // Last step's pairs and contacts become "previous" (they sit in the other ping-pong buffers)
  atomicStore(&counters[C_PREV_MANIFOLDS], min(atomicLoad(&counters[C_MANIFOLDS]), params.manifoldCapacity));
  atomicStore(&counters[C_PREV_CONTACTS], min(atomicLoad(&counters[C_CONTACTS]), params.contactCapacity));
  atomicStore(&counters[C_MANIFOLDS], 0u);
  atomicStore(&counters[C_CONTACTS], 0u);
  atomicStore(&counters[C_PAIRS], 0u);
  atomicStore(&counters[C_OVERFLOW], 0u);
  atomicStore(&counters[C_CLASHES], 0u);
  atomicStore(&counters[C_NUM_COLORS], 0u);
}

fn radius(i: u32) -> f32 {
  return bodies[i].moment.w;
}

fn isLarge(i: u32) -> bool {
  return radius(i) > params.maxSmallRadius;
}

fn cellOf(i: u32) -> vec3i {
  return vec3i(floor(bodies[i].pos.xyz / params.cellSize));
}

fn cellHash(c: vec3i) -> u32 {
  return ((u32(c.x) * 73856093u) ^ (u32(c.y) * 19349663u) ^ (u32(c.z) * 83492791u)) & params.tableMask;
}

@compute @workgroup_size(64)
fn gridCount(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount || isLarge(i)) { return; }
  let c = cellOf(i);
  for (var k = 0u; k < 3u; k++) { atomicStore(&grid[params.gridCellOffset + 3u * i + k], bitcast<u32>(c[k])); }
  atomicAdd(&grid[cellHash(c)], 1u);
}

@compute @workgroup_size(64)
fn gridScatter(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount || isLarge(i)) { return; }
  let h = cellHash(cellOf(i));
  let slot = atomicLoad(&grid[h]) + atomicAdd(&grid[params.gridCursorOffset + h], 1u);
  atomicStore(&grid[params.gridSortedOffset + slot], i);
}

/** Binary search of the (hi, lo) no-collide list; false if every connecting joint has broken. */
fn ignored(hi: u32, lo: u32) -> bool {
  let base = params.largeCount;
  var first = 0u;
  var count = params.noCollideCount;
  while (count > 0u) {
    let step = count / 2u;
    let mid = first + step;
    let mh = statics[base + 3u * mid];
    let ml = statics[base + 3u * mid + 1u];
    if (mh < hi || (mh == hi && ml < lo)) {
      first = mid + 1u;
      count -= step + 1u;
    } else {
      count = step;
    }
  }
  for (var k = first; k < params.noCollideCount; k++) {
    if (statics[base + 3u * k] != hi || statics[base + 3u * k + 1u] != lo) { break; }
    let j = statics[base + 3u * k + 2u];
    if (j == 0xffffffffu) { return true; }
    if (joints[j].penLin.w != 0.0 || joints[j].penAng.w != 0.0) { return true; }
  }
  return false;
}

/** Body i as the broadphase sees it: world axes and half extents (a sphere: its radius). */
struct Shape {
  ax: array<vec3f, 3>,
  h: vec3f,
  sphere: bool,
}

fn shapeOf(i: u32) -> Shape {
  let q = bodies[i].rot;
  var s: Shape;
  s.h = bodies[i].size.xyz * 0.5;
  s.sphere = bodies[i].angVel.w == SHAPE_SPHERE;
  s.ax[0] = qrotate(q, vec3f(1.0, 0.0, 0.0));
  s.ax[1] = qrotate(q, vec3f(0.0, 1.0, 0.0));
  s.ax[2] = qrotate(q, vec3f(0.0, 0.0, 1.0));
  return s;
}

/** Half width of a shape along unit axis n. */
fn extent(s: Shape, n: vec3f) -> f32 {
  if (s.sphere) { return s.h.x; }
  return s.h.x * abs(dot(n, s.ax[0])) + s.h.y * abs(dot(n, s.ax[1])) + s.h.z * abs(dot(n, s.ax[2]));
}

/** Half extents of a shape's world-space bounding box. */
fn aabbHalf(s: Shape) -> vec3f {
  if (s.sphere) { return vec3f(s.h.x); }
  return abs(s.ax[0]) * s.h.x + abs(s.ax[1]) * s.h.y + abs(s.ax[2]) * s.h.z;
}

/**
 * A face axis of either shape separates them by more than 1 mm (d: centre A minus centre B).
 * The narrowphase rejects any pair a separating axis finds (it tests these axes and the edge
 * axes), so this only drops pairs it would drop; the millimetre keeps round-off out of it.
 */
fn faceSeparated(A: Shape, B: Shape, d: vec3f) -> bool {
  for (var k = 0u; k < 3u; k++) {
    if (abs(dot(d, A.ax[k])) - extent(A, A.ax[k]) - extent(B, A.ax[k]) > 1e-3) { return true; }
    if (abs(dot(d, B.ax[k])) - extent(A, B.ax[k]) - extent(B, B.ax[k]) > 1e-3) { return true; }
  }
  return false;
}

/** What the pair tests need of the body a findPairs thread starts from, loaded once. */
struct Probe {
  index: u32,
  pos: vec3f,
  radius: f32,
  aabb: vec3f,
  dynamic: bool,
  shape: Shape,
}

fn probeOf(i: u32) -> Probe {
  let shape = shapeOf(i);
  return Probe(i, bodies[i].pos.xyz, radius(i), aabbHalf(shape), bodies[i].size.w > 0.0, shape);
}

fn testPair(P: Probe, j: u32) {
  if (!P.dynamic && bodies[j].size.w <= 0.0) { return; }
  // Each in a group the other collides with
  let fi = filters[P.index];
  let fj = filters[j];
  if ((fi.x & fj.y) == 0u || (fj.x & fi.y) == 0u) { return; }
  let d = P.pos - bodies[j].pos.xyz;
  let r = P.radius + radius(j);
  if (dot(d, d) > r * r) { return; }
  // Bounding spheres of boxes overlap far more often than the boxes do (neighbouring
  // columns, rows of bricks); world AABBs are a cheap, conservative second test (with a
  // small pad for f32 round-off), and face axes a third: rings of bricks and piles sent
  // 48-72% of their pairs to the narrowphase only to be found apart.
  let B = shapeOf(j);
  if (any(abs(d) > P.aabb + aabbHalf(B) + vec3f(1e-4))) { return; }
  if (faceSeparated(P.shape, B, d)) { return; }
  let a = max(P.index, j);
  let b = min(P.index, j);
  if (ignored(a, b)) { return; }
  let slot = atomicAdd(&counters[C_PAIRS], 1u);
  if (slot >= params.pairCapacity) {
    atomicOr(&counters[C_OVERFLOW], 1u);
    return;
  }
  pairs[slot] = vec2u(a, b);
}

@compute @workgroup_size(64)
fn findPairs(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount) { return; }
  let small = !isLarge(i);
  let P = probeOf(i);
  if (small) {
    // Every overlapping small pair is in the same or an adjacent cell; emit from the higher index
    let c = cellOf(i);
    for (var oz = -1; oz <= 1; oz++) {
      for (var oy = -1; oy <= 1; oy++) {
        for (var ox = -1; ox <= 1; ox++) {
          let cell = c + vec3i(ox, oy, oz);
          let h = cellHash(cell);
          let end = atomicLoad(&grid[h + 1u]);
          for (var k = atomicLoad(&grid[h]); k < end; k++) {
            let j = atomicLoad(&grid[params.gridSortedOffset + k]);
            if (j >= i) { continue; }
            // Different cells can share a bucket; only accept bodies really in this cell
            let o = params.gridCellOffset + 3u * j;
            let cj = vec3i(bitcast<i32>(atomicLoad(&grid[o])), bitcast<i32>(atomicLoad(&grid[o + 1u])), bitcast<i32>(atomicLoad(&grid[o + 2u])));
            if (any(cj != cell)) { continue; }
            testPair(P, j);
          }
        }
      }
    }
  }
  // Large bodies against everything (large-large pairs once, from the larger index)
  for (var k = 0u; k < params.largeCount; k++) {
    let l = statics[k];
    if (l == i || (!small && l < i)) { continue; }
    testPair(P, l);
  }
}
`,vr=s=>`
${ge}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> bodies: array<Body>;
@group(0) @binding(2) var<storage, read> pairs: array<vec2u>;
@group(0) @binding(3) var<storage, read_write> contacts: array<Contact>;
@group(0) @binding(4) var<storage, read> prevContacts: array<Contact>;
@group(0) @binding(5) var<storage, read_write> manifolds: array<Manifold>;
@group(0) @binding(6) var<storage, read> prevManifolds: array<Manifold>;
@group(0) @binding(7) var<storage, read_write> table: array<atomic<u32>>;
@group(0) @binding(8) var<storage, read_write> counters: array<atomic<u32>>;
${s?"@group(0) @binding(9) var<storage, read> hulls: array<vec4u>;":""}

fn pairHash(a: u32, b: u32) -> u32 {
  return hash32((a * 0x9e3779b1u) ^ hash32(b));
}

/**
 * Last step's pairs into the table (slot value = pair index + 1), linear probing. Slots are
 * claimed by atomicExchange, not compare-exchange (Safari's Metal backend fails to compile
 * atomicCompareExchangeWeak, github issue 1): a taken slot's occupant is swapped out and
 * carried on to the next slot, which keeps it on its own probe chain.
 */
@compute @workgroup_size(64)
fn hashInsert(@builtin(global_invocation_id) gid: vec3u) {
  let m = gid.x;
  if (m >= atomicLoad(&counters[C_PREV_MANIFOLDS])) { return; }
  let ids = prevManifolds[m].ids;
  var h = pairHash(ids.x, ids.y) & params.hashMask;
  var value = m + 1u;
  for (var probe = 0u; probe <= params.hashMask; probe++) {
    value = atomicExchange(&table[h], value);
    if (value == 0u) { return; }
    h = (h + 1u) & params.hashMask;
  }
}

/** Index of last step's pair (a, b), or -1. */
fn hashFind(a: u32, b: u32) -> i32 {
  var h = pairHash(a, b) & params.hashMask;
  for (var probe = 0u; probe <= params.hashMask; probe++) {
    let v = atomicLoad(&table[h]);
    if (v == 0u) { return -1; }
    let ids = prevManifolds[v - 1u].ids;
    if (ids.x == a && ids.y == b) { return i32(v - 1u); }
    h = (h + 1u) & params.hashMask;
  }
  return -1;
}

// --- Narrowphase: OBB SAT + clipping (../ref/collide.ts) -----------------------------------

const MAX_CONTACTS = 8u;
const MAX_POLY = 8u;
const SAT_AXIS_EPSILON = 1.0e-6;
const PLANE_EPSILON = 1.0e-5;
const CONTACT_MERGE_DIST_SQ = 1.0e-6;
const AXIS_FACE_A = 0u;
const AXIS_FACE_B = 1u;
const AXIS_EDGE = 2u;

struct Box {
  c: vec3f,
  h: vec3f,
  ax: array<vec3f, 3>,
}

struct Sat {
  kind: u32,
  ia: u32,
  ib: u32,
  sep: f32,
  n: vec3f,  // from A towards B
  valid: bool,
}

struct Found {
  feature: array<u32, 8>,
  xA: array<vec3f, 8>,
  xB: array<vec3f, 8>,
  count: u32,
}

fn makeBox(i: u32) -> Box {
  let q = bodies[i].rot;
  var b: Box;
  b.c = bodies[i].pos.xyz;
  b.h = bodies[i].size.xyz * 0.5;
  b.ax[0] = qrotate(q, vec3f(1.0, 0.0, 0.0));
  b.ax[1] = qrotate(q, vec3f(0.0, 1.0, 0.0));
  b.ax[2] = qrotate(q, vec3f(0.0, 0.0, 1.0));
  return b;
}

fn projRadius(b: Box, n: vec3f) -> f32 {
  return b.h.x * abs(dot(n, b.ax[0])) + b.h.y * abs(dot(n, b.ax[1])) + b.h.z * abs(dot(n, b.ax[2]));
}

/** SAT test of one axis; false when it separates the boxes. Tracks the least-separated axis. */
fn testAxis(A: Box, B: Box, delta: vec3f, axis: vec3f, kind: u32, ia: u32, ib: u32, best: ptr<function, Sat>) -> bool {
  let lenSq = dot(axis, axis);
  if (lenSq < SAT_AXIS_EPSILON) { return true; }
  var n = axis * inverseSqrt(lenSq);
  if (dot(n, delta) < 0.0) { n = -n; }
  let sep = abs(dot(delta, n)) - (projRadius(A, n) + projRadius(B, n));
  if (sep > 0.0) { return false; }
  if (!(*best).valid || sep > (*best).sep) { *best = Sat(kind, ia, ib, sep, n, true); }
  return true;
}

fn support(b: Box, dir: vec3f) -> vec3f {
  let s = select(vec3f(-1.0), vec3f(1.0), vec3f(dot(dir, b.ax[0]), dot(dir, b.ax[1]), dot(dir, b.ax[2])) >= vec3f(0.0));
  return b.c + b.ax[0] * (b.h.x * s.x) + b.ax[1] * (b.h.y * s.y) + b.ax[2] * (b.h.z * s.z);
}

fn addFound(f: ptr<function, Found>, xA: vec3f, xB: vec3f, feature: u32) {
  let mid = (xA + xB) * 0.5;
  for (var i = 0u; i < (*f).count; i++) {
    let d = mid - ((*f).xA[i] + (*f).xB[i]) * 0.5;
    if (dot(d, d) < CONTACT_MERGE_DIST_SQ) { return; }
  }
  if ((*f).count >= MAX_CONTACTS) { return; }
  (*f).feature[(*f).count] = feature;
  (*f).xA[(*f).count] = xA;
  (*f).xB[(*f).count] = xB;
  (*f).count++;
}

/**
 * Sutherland-Hodgman: clip src (n verts) against dot(pn, x) <= offset into dst. A quad
 * clipped by four planes has at most 8 vertices (the reference allows 16 but never needs them),
 * and the vertex order is the reference's, so contact indices (feature keys) match.
 */
fn clipPlane(src: ptr<function, array<vec3f, 8>>, n: u32, dst: ptr<function, array<vec3f, 8>>, pn: vec3f, offset: f32) -> u32 {
  if (n == 0u) { return 0u; }
  var count = 0u;
  var a = (*src)[n - 1u];
  var da = dot(pn, a) - offset;
  for (var i = 0u; i < n; i++) {
    let b = (*src)[i];
    let db = dot(pn, b) - offset;
    let aIn = da <= PLANE_EPSILON;
    let bIn = db <= PLANE_EPSILON;
    if (aIn != bIn) {
      var t = 0.0;
      let denom = da - db;
      if (abs(denom) > SAT_AXIS_EPSILON) { t = clamp(da / denom, 0.0, 1.0); }
      if (count < MAX_POLY) { (*dst)[count] = a + (b - a) * t; count++; }
    }
    if (bIn && count < MAX_POLY) { (*dst)[count] = b; count++; }
    a = b;
    da = db;
  }
  return count;
}

/** Face-axis (u, v) extents: axis 0 -> (1, 2), 1 -> (0, 2), 2 -> (0, 1). */
fn faceU(k: u32) -> u32 { return select(0u, 1u, k == 0u); }
fn faceV(k: u32) -> u32 { return select(1u, 2u, k != 2u); }

fn faceManifold(A: Box, B: Box, refIsA: bool, refAxis: u32, nAB: vec3f) -> Found {
  var found: Found;
  var R = B;
  var I = A;
  if (refIsA) {
    R = A;
    I = B;
  }
  let outward = select(-nAB, nAB, refIsA);

  // Reference face
  let rs = select(-1.0, 1.0, dot(outward, R.ax[refAxis]) >= 0.0);
  let rn = R.ax[refAxis] * rs;
  let rc = R.c + rn * R.h[refAxis];
  let ru = R.ax[faceU(refAxis)];
  let rv = R.ax[faceV(refAxis)];
  let eu = R.h[faceU(refAxis)];
  let ev = R.h[faceV(refAxis)];

  // Incident face: the incident box's face most anti-parallel to the reference normal
  var incAxis = 0u;
  var bestDot = -1.0;
  for (var k = 0u; k < 3u; k++) {
    let d = abs(dot(I.ax[k], rn));
    if (d > bestDot) { bestDot = d; incAxis = k; }
  }
  let is = select(1.0, -1.0, dot(I.ax[incAxis], rn) > 0.0);
  let ic = I.c + I.ax[incAxis] * (is * I.h[incAxis]);
  let iu = I.ax[faceU(incAxis)] * I.h[faceU(incAxis)];
  let iv = I.ax[faceV(incAxis)] * I.h[faceV(incAxis)];
  var poly: array<vec3f, 8>;
  var tmp: array<vec3f, 8>;
  poly[0] = ic + iu + iv;
  poly[1] = ic - iu + iv;
  poly[2] = ic - iu - iv;
  poly[3] = ic + iu - iv;
  var n = 4u;
  n = clipPlane(&poly, n, &tmp, ru, dot(ru, rc) + eu);
  n = clipPlane(&tmp, n, &poly, -ru, dot(-ru, rc) + eu);
  n = clipPlane(&poly, n, &tmp, rv, dot(rv, rc) + ev);
  n = clipPlane(&tmp, n, &poly, -rv, dot(-rv, rc) + ev);
  if (n == 0u) { return found; }

  let prefix = (select(AXIS_FACE_B, AXIS_FACE_A, refIsA) << 24u) | (refAxis << 16u) | (incAxis << 8u);
  for (var i = 0u; i < n && found.count < MAX_CONTACTS; i++) {
    let p = poly[i];
    let dist = dot(p - rc, rn);
    if (dist > PLANE_EPSILON) { continue; }
    let onRef = p - rn * dist;
    addFound(&found, select(p, onRef, refIsA), select(onRef, p, refIsA), prefix | i);
  }
  if (found.count == 0u) { addFound(&found, support(A, nAB), support(B, -nAB), prefix); }
  return found;
}

fn supportEdge(b: Box, k: u32, dir: vec3f) -> array<vec3f, 2> {
  let k1 = (k + 1u) % 3u;
  let k2 = (k + 2u) % 3u;
  let s1 = select(-1.0, 1.0, dot(dir, b.ax[k1]) >= 0.0);
  let s2 = select(-1.0, 1.0, dot(dir, b.ax[k2]) >= 0.0);
  let c = b.c + b.ax[k1] * (b.h[k1] * s1) + b.ax[k2] * (b.h[k2] * s2);
  let e = b.ax[k] * b.h[k];
  return array<vec3f, 2>(c - e, c + e);
}

fn edgeContact(A: Box, B: Box, ia: u32, ib: u32, nAB: vec3f) -> Found {
  var found: Found;
  let ea = supportEdge(A, ia, nAB);
  let eb = supportEdge(B, ib, -nAB);
  // Closest points between the two segments
  let p0 = ea[0];
  let q0 = eb[0];
  let d1 = ea[1] - p0;
  let d2 = eb[1] - q0;
  let r = p0 - q0;
  let a = dot(d1, d1);
  let e = dot(d2, d2);
  let f = dot(d2, r);
  var s = 0.0;
  var t = 0.0;
  if (a <= SAT_AXIS_EPSILON && e <= SAT_AXIS_EPSILON) {
    // both degenerate: s = t = 0
  } else if (a <= SAT_AXIS_EPSILON) {
    t = clamp(f / e, 0.0, 1.0);
  } else {
    let c = dot(d1, r);
    if (e <= SAT_AXIS_EPSILON) {
      s = clamp(-c / a, 0.0, 1.0);
    } else {
      let b = dot(d1, d2);
      let denom = a * e - b * b;
      if (abs(denom) > SAT_AXIS_EPSILON) { s = clamp((b * f - c * e) / denom, 0.0, 1.0); }
      t = (b * s + f) / e;
      if (t < 0.0) {
        t = 0.0;
        s = clamp(-c / a, 0.0, 1.0);
      } else if (t > 1.0) {
        t = 1.0;
        s = clamp((b - c) / a, 0.0, 1.0);
      }
    }
  }
  let key = (AXIS_EDGE << 24u) | (ia << 8u) | ib;
  addFound(&found, p0 + d1 * s, q0 + d2 * t, key);
  if (found.count == 0u) { addFound(&found, support(A, nAB), support(B, -nAB), key); }
  return found;
}

// --- Spheres (GPU-only extension, ../shapes.ts) -------------------------------------------

/** Sphere against sphere: one contact, normal along the centre line. */
fn sphereSphere(A: Box, B: Box, sat: ptr<function, Sat>) -> Found {
  var found: Found;
  let d = B.c - A.c;
  let dist = length(d);
  if (dist > A.h.x + B.h.x) { return found; }
  var n = vec3f(0.0, 0.0, 1.0);
  if (dist > 0.0) { n = d / dist; }
  (*sat).n = n;
  addFound(&found, A.c + n * A.h.x, B.c - n * B.h.x, SPHERE_FEATURE);
  return found;
}

struct SphereBoxHit {
  hit: bool,
  onSphere: vec3f,
  onBox: vec3f,
  n: vec3f,  // from the sphere towards the box
}

/** Sphere S against box X: closest point of the box, or the shallowest face when inside. */
fn sphereBox(S: Box, X: Box, qX: vec4f) -> SphereBoxHit {
  var out: SphereBoxHit;
  let p = qrotate(qconj(qX), S.c - X.c);
  let q = clamp(p, -X.h, X.h);
  let r = S.h.x;
  var nLocal: vec3f;  // from the box towards the sphere, box frame
  var onBox = q;
  if (any(p != q)) {
    let d = p - q;
    let dist = length(d);
    if (dist > r) { return out; }
    nLocal = d / dist;
  } else {
    // Centre inside the box: push out through the face of least penetration
    let depth = X.h - abs(p);
    var k = 0u;
    if (depth.y < depth[k]) { k = 1u; }
    if (depth.z < depth[k]) { k = 2u; }
    let s = select(-1.0, 1.0, p[k] >= 0.0);
    nLocal = vec3f(0.0);
    nLocal[k] = s;
    onBox[k] = s * X.h[k];
  }
  let n = qrotate(qX, nLocal);
  out.hit = true;
  out.n = -n;
  out.onBox = X.c + qrotate(qX, onBox);
  out.onSphere = S.c - n * r;
  return out;
}

/** Collide boxes a and b; the contact normal (B to A) is -sat.n. */
fn collide(A: Box, B: Box, sat: ptr<function, Sat>) -> Found {
  var none: Found;
  let delta = B.c - A.c;
  var face: Sat;
  var edge: Sat;
  for (var i = 0u; i < 3u; i++) { if (!testAxis(A, B, delta, A.ax[i], AXIS_FACE_A, i, 0u, &face)) { return none; } }
  for (var i = 0u; i < 3u; i++) { if (!testAxis(A, B, delta, B.ax[i], AXIS_FACE_B, 0u, i, &face)) { return none; } }
  for (var i = 0u; i < 3u; i++) {
    for (var j = 0u; j < 3u; j++) {
      if (!testAxis(A, B, delta, cross(A.ax[i], B.ax[j]), AXIS_EDGE, i, j, &edge)) { return none; }
    }
  }
  if (!face.valid) { return none; }
  // Prefer a face axis unless an edge axis is clearly better (stabler manifolds). The demo
  // scales the edge separation by 0.95, which for penetrating boxes (negative separations)
  // favours the edge: a box sunk 0.7 into another, faces aligned, gets a single edge contact
  // and never recovers (docs/FINDINGS.md). FLAG_FACE_BIAS scales the face separation instead
  // (as Box2D does), so an edge must beat the face by a margin that grows with penetration.
  var best = face;
  if (edge.valid) {
    var edgeWins = 0.95 * edge.sep > face.sep + 0.01;
    if ((params.flags & FLAG_FACE_BIAS) != 0u) { edgeWins = edge.sep > 0.95 * face.sep + 0.01; }
    if (edgeWins) { best = edge; }
  }
  *sat = best;
  if (best.kind == AXIS_EDGE) { return edgeContact(A, B, best.ia, best.ib, best.n); }
  return faceManifold(A, B, best.kind == AXIS_FACE_A, select(best.ib, best.ia, best.kind == AXIS_FACE_A), best.n);
}

/**
 * Keep pair (a, b)'s contact points from last step, skipping SAT and clipping, when they were
 * computed no earlier than both bodies last moved beyond the reuse tolerance (refsWGSL). The
 * points keep their warm-start data; C(x-) is recomputed from the current poses. Returns
 * false when the pair must go through the narrowphase.
 */
/**
 * A contact's least normal penalty with FLAG_MASS_PENALTY: the lighter dynamic body's mass over
 * dt\xB2, its inertia term in the primal Hessian. From the demo's PENALTY_MIN the ramp (\u03B2|C| an
 * iteration) takes many steps to catch up with a heavy body, which sinks through the floor
 * meanwhile; at m/dt\xB2 a contact removes about half its error an iteration from the start,
 * whatever the mass. Not in the paper; for unit-scale bodies it is ~10\xB3, below where their
 * penalties settle anyway. Friction rows keep the demo's ramp (Coulomb stopping distances).
 */
fn contactPenaltyMin(a: u32, b: u32) -> f32 {
  if ((params.flags & FLAG_MASS_PENALTY) == 0u) { return PENALTY_MIN; }
  let mA = select(bodies[a].size.w, 3.4e38, bodies[a].size.w <= 0.0);
  let mB = select(bodies[b].size.w, 3.4e38, bodies[b].size.w <= 0.0);
  return clamp(min(mA, mB) / (params.dt * params.dt), PENALTY_MIN, PENALTY_MAX);
}

fn reuseContacts(a: u32, b: u32) -> bool {
  let pm = hashFind(a, b);
  if (pm < 0) { return false; }
  let prev = prevManifolds[pm];
  let count = pairCount(prev);
  let generated = prev.ids.w >> 4u;
  let moved = max(bitcast<u32>(bodies[a].inertialPos.w), bitcast<u32>(bodies[b].inertialPos.w));
  if (count == 0u || generated < moved) { return false; }

  let m = atomicAdd(&counters[C_MANIFOLDS], 1u);
  if (m >= params.manifoldCapacity) {
    atomicOr(&counters[C_OVERFLOW], 4u);
    return true;
  }
  let base = atomicAdd(&counters[C_CONTACTS], count);
  if (base + count > params.contactCapacity) {
    atomicOr(&counters[C_OVERFLOW], 2u);
    manifolds[m] = Manifold(vec4u(a, b, base, prev.ids.w & ~15u), prev.geo);
    return true;
  }
  manifolds[m] = Manifold(vec4u(a, b, base, prev.ids.w), prev.geo);

  let pA = bodies[a].pos.xyz;
  let qA = bodies[a].rot;
  let pB = bodies[b].pos.xyz;
  let qB = bodies[b].rot;
  let basis = orthonormal(prev.geo.xyz);
  for (var i = 0u; i < count; i++) {
    var k = prevContacts[prev.ids.z + i];
    // C(x-) at the current poses, then the usual warm start (Eq. 19)
    let d = (qrotate(qA, k.rA) + pA) - (qrotate(qB, k.rB) + pB);
    k.c0x = dot(basis[0], d) + COLLISION_MARGIN;
    k.c0y = dot(basis[1], d);
    k.c0z = dot(basis[2], d);
    k.lam = k.lam * params.alpha * params.gamma;
    k.pen = clamp(k.pen * params.gamma, vec3f(PENALTY_MIN), vec3f(PENALTY_MAX));
    k.pen.x = max(k.pen.x, contactPenaltyMin(a, b));
    contacts[base + i] = k;
  }
  return true;
}

${s?zl:"fn isHull(i: u32) -> bool { return false; }"}

@compute @workgroup_size(64)
fn narrowphase(@builtin(global_invocation_id) gid: vec3u) {
  let p = gid.x;
  if (p >= min(atomicLoad(&counters[C_PAIRS]), params.pairCapacity)) { return; }
  let a = pairs[p].x;
  let b = pairs[p].y;
  if ((params.flags & FLAG_REUSE_CONTACTS) != 0u && reuseContacts(a, b)) { return; }
  let A = makeBox(a);
  let B = makeBox(b);
  var sat: Sat;
  var found: Found;
  let sphereA = bodies[a].angVel.w == SHAPE_SPHERE;
  let sphereB = bodies[b].angVel.w == SHAPE_SPHERE;
  if (sphereA && sphereB) {
    found = sphereSphere(A, B, &sat);
  }${s?` else if (isHull(a) || isHull(b)) {
    if (sphereA || sphereB) {
      // sat.n points from A towards B
      if (sphereA) {
        let h = sphereHull(A.c, A.h.x, polyOf(b));
        sat.n = h.n;
        if (h.hit) { addFound(&found, h.onSphere, h.onBox, SPHERE_FEATURE); }
      } else {
        let h = sphereHull(B.c, B.h.x, polyOf(a));
        sat.n = -h.n;
        if (h.hit) { addFound(&found, h.onBox, h.onSphere, SPHERE_FEATURE); }
      }
    } else {
      found = collidePoly(polyOf(a), polyOf(b), &sat);
    }
  }`:""} else if (sphereA || sphereB) {
    // sat.n points from A towards B
    var h: SphereBoxHit;
    if (sphereA) {
      h = sphereBox(A, B, bodies[b].rot);
      sat.n = h.n;
      if (h.hit) { addFound(&found, h.onSphere, h.onBox, SPHERE_FEATURE); }
    } else {
      h = sphereBox(B, A, bodies[a].rot);
      sat.n = -h.n;
      if (h.hit) { addFound(&found, h.onBox, h.onSphere, SPHERE_FEATURE); }
    }
  } else {
    found = collide(A, B, &sat);
  }
  if (found.count == 0u) { return; }

  // Reserve the pair record and its consecutive contact points
  let m = atomicAdd(&counters[C_MANIFOLDS], 1u);
  if (m >= params.manifoldCapacity) {
    atomicOr(&counters[C_OVERFLOW], 4u);
    return;
  }
  let base = atomicAdd(&counters[C_CONTACTS], found.count);
  var count = found.count;
  if (base + count > params.contactCapacity) {
    atomicOr(&counters[C_OVERFLOW], 2u);
    count = 0u;
  }
  let n = -sat.n;
  manifolds[m] = Manifold(vec4u(a, b, base, count | (params.step << 4u)), vec4f(n, sqrt(bodies[a].pos.w * bodies[b].pos.w)));
  if (count == 0u) { return; }

  let qA = bodies[a].rot;
  let qB = bodies[b].rot;
  let basis = orthonormal(n);
  let anySphere = sphereA || sphereB;
  // Last step's contacts of this pair (at most 8, consecutive)
  var prevFirst = 0u;
  var prevCount = 0u;
  let pm = hashFind(a, b);
  if (pm >= 0) {
    prevFirst = prevManifolds[pm].ids.z;
    prevCount = pairCount(prevManifolds[pm]);
  }
  let matchNearest = (params.flags & FLAG_MATCH_NEAREST) != 0u;
  let minSide = min(min(min(A.h.x, A.h.y), A.h.z), min(min(B.h.x, B.h.y), B.h.z)) * 2.0;
  let penaltyMin = contactPenaltyMin(a, b);

  for (var i = 0u; i < count; i++) {
    var rA = qrotate(qconj(qA), found.xA[i] - A.c);
    var rB = qrotate(qconj(qB), found.xB[i] - B.c);
    var pen = vec3f(0.0);
    var lam = vec3f(0.0);
    var stick = 0u;

    // Warm start from last step's point with this feature; with matchNearest, fall back to
    // the pair's previous point nearest in A-local anchor position
    var j = -1;
    for (var c = prevFirst; c < prevFirst + prevCount; c++) {
      if ((prevContacts[c].key & ~STICK_BIT) == found.feature[i]) { j = i32(c); break; }
    }
    if (j < 0 && matchNearest) {
      var bestDist = NEAREST_FRACTION * minSide;
      for (var c = prevFirst; c < prevFirst + prevCount; c++) {
        let dist = length(prevContacts[c].rA - rA);
        if (dist <= bestDist) {
          bestDist = dist;
          j = i32(c);
        }
      }
    }
    if (j >= 0) {
      let prev = prevContacts[j];
      pen = prev.pen;
      lam = prev.lam;
      stick = prev.key & STICK_BIT;
      // Static friction last step: keep the old anchors. Not for spheres: their contact point
      // moves over both surfaces as they roll, and pinned anchors would rotate away with them
      if (stick != 0u && !anySphere) {
        rA = prev.rA;
        rB = prev.rB;
      }
    }

    // C(x-) in the contact basis, plus the collision margin on the normal row
    let d = (qrotate(qA, rA) + A.c) - (qrotate(qB, rB) + B.c);
    let c0 = vec3f(dot(basis[0], d) + COLLISION_MARGIN, dot(basis[1], d), dot(basis[2], d));

    // Warm start the dual variables and penalty parameters (Eq. 19)
    lam = lam * params.alpha * params.gamma;
    pen = clamp(pen * params.gamma, vec3f(PENALTY_MIN), vec3f(PENALTY_MAX));
    pen.x = max(pen.x, penaltyMin);

    contacts[base + i] = Contact(rA, found.feature[i] | stick, rB, c0.x, pen, c0.y, lam, c0.z);
  }
}
`,Il=vr(!1),Rl=vr(!0);var Ge=`
${ge}
${Ja}

// Per-dispatch constants, selected with a dynamic uniform offset
struct PassConstants {
  color: u32,   // colour solved by this primal dispatch
  alpha: f32,   // stabilization for this iteration
  pad0: u32,
  pad1: u32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read_write> bodies: array<Body>;
@group(0) @binding(2) var<storage, read_write> joints: array<Joint>;
@group(0) @binding(3) var<storage, read> info: array<vec4i>;  // type, bodyA (-1 = world), bodyB
@group(0) @binding(4) var<storage, read_write> contacts: array<Contact>;
@group(0) @binding(8) var<storage, read> manifolds: array<Manifold>;
@group(0) @binding(5) var<storage, read> adj: array<u32>;
@group(0) @binding(6) var<storage, read> color: array<u32>;
@group(0) @binding(7) var<storage, read> counters: array<u32>;
@group(1) @binding(0) var<uniform> pc: PassConstants;

fn manifoldCount() -> u32 {
  return min(counters[C_MANIFOLDS], params.manifoldCapacity);
}

/** outer(u, v): row i, column j = u[i] v[j] (WGSL matrices are column-major). */
fn outer(u: vec3f, v: vec3f) -> mat3x3f {
  return mat3x3f(u * v.x, u * v.y, u * v.z);
}

/**
 * One body's Newton system [lin cross\u1D40; cross ang]\xB7dx = rhs. cross holds row = angular
 * index, column = linear index.
 */
struct Acc {
  lin: mat3x3f,
  ang: mat3x3f,
  cross: mat3x3f,
  rLin: vec3f,
  rAng: vec3f,
}

/** Fold one constraint row in: Jacobian (l, a) w.r.t. the body, stiffness k and force f. */
fn addRow(acc: ptr<function, Acc>, l: vec3f, a: vec3f, k: f32, f: f32) {
  (*acc).lin += outer(l, l) * k;
  (*acc).ang += outer(a, a) * k;
  (*acc).cross += outer(a, l) * k;
  (*acc).rLin += l * f;
  (*acc).rAng += a * f;
}

// --- Joints and springs -----------------------------------------------------------------------

fn anchorA(k: Joint, a: i32) -> vec3f {
  if (a < 0) { return k.rA.xyz; }
  return qrotate(bodies[a].rot, k.rA.xyz) + bodies[a].pos.xyz;
}

fn rotA(a: i32) -> vec4f {
  if (a < 0) { return vec4f(0.0, 0.0, 0.0, 1.0); }
  return bodies[a].rot;
}

fn jointLinC(k: Joint, a: i32, b: i32) -> vec3f {
  return anchorA(k, a) - (qrotate(bodies[b].rot, k.rB.xyz) + bodies[b].pos.xyz);
}

fn jointAngC(k: Joint, a: i32, b: i32) -> vec3f {
  return qsub(rotA(a), bodies[b].rot) * k.lamAng.w;
}

/** Stabilized linear / angular constraints (Eq. 18 on hard rows). */
fn jointLinRows(k: Joint, a: i32, b: i32, alpha: f32) -> vec3f {
  return jointLinC(k, a, b) - select(vec3f(0.0), k.c0Lin.xyz * alpha, k.penLin.w >= HARD);
}

fn jointAngRows(k: Joint, a: i32, b: i32, alpha: f32) -> vec3f {
  return jointAngC(k, a, b) - select(vec3f(0.0), k.c0Ang.xyz * alpha, k.penAng.w >= HARD);
}

fn addJoint(acc: ptr<function, Acc>, j: u32, alpha: f32, i: u32) {
  let t = info[j].x;
  let a = info[j].y;
  let b = info[j].z;
  let k = joints[j];
  let isA = i32(i) == a;
  let sg = select(-1.0, 1.0, isA);

  if (t == T_SPRING) {
    let rAW = qrotate(bodies[a].rot, k.rA.xyz);
    let rBW = qrotate(bodies[b].rot, k.rB.xyz);
    let d = (rAW + bodies[a].pos.xyz) - (rBW + bodies[b].pos.xyz);
    let len = length(d);
    if (len <= 1.0e-6) { return; }
    let n = d / len;
    let stiffness = k.penLin.w;
    let r = select(rBW, rAW, isA);
    addRow(acc, n * sg, cross(r, n) * sg, stiffness, stiffness * (len - k.rA.w));
    return;
  }

  // Ball-socket rows
  if (dot(k.penLin.xyz, k.penLin.xyz) > 0.0) {
    let F = k.penLin.xyz * jointLinRows(k, a, b, alpha) + k.lamLin.xyz;
    // Jacobian: sg\xB7I (linear) and skew(-rA) for A, skew(rB) for B (angular); rows below
    var r: vec3f;
    if (isA) { r = qrotate(bodies[a].rot, k.rA.xyz); }
    else { r = -qrotate(bodies[b].rot, k.rB.xyz); }
    // Row m of skew(-r): (-r) \xD7 e_m... written out: skew(v) rows (0,-vz,vy), (vz,0,-vx), (-vy,vx,0)
    let v = -r;
    addRow(acc, vec3f(sg, 0.0, 0.0), vec3f(0.0, -v.z, v.y), k.penLin.x, F.x);
    addRow(acc, vec3f(0.0, sg, 0.0), vec3f(v.z, 0.0, -v.x), k.penLin.y, F.y);
    addRow(acc, vec3f(0.0, 0.0, sg), vec3f(-v.y, v.x, 0.0), k.penLin.z, F.z);
    // Diagonally lumped geometric stiffness (Sec. 3.5): column norms of -(r\xB7F) I + r F\u1D40
    let rf = dot(r, F);
    let g = vec3f(
      length(r * F.x - vec3f(rf, 0.0, 0.0)),
      length(r * F.y - vec3f(0.0, rf, 0.0)),
      length(r * F.z - vec3f(0.0, 0.0, rf)));
    (*acc).ang += mat3x3f(vec3f(g.x, 0.0, 0.0), vec3f(0.0, g.y, 0.0), vec3f(0.0, 0.0, g.z));
  }

  // Angle-lock rows: Jacobian sg\xB7torqueArm\xB7I on the angular part
  if (dot(k.penAng.xyz, k.penAng.xyz) > 0.0) {
    let F = k.penAng.xyz * jointAngRows(k, a, b, alpha) + k.lamAng.xyz;
    let s = sg * k.lamAng.w;
    addRow(acc, vec3f(0.0), vec3f(s, 0.0, 0.0), k.penAng.x, F.x);
    addRow(acc, vec3f(0.0), vec3f(0.0, s, 0.0), k.penAng.y, F.y);
    addRow(acc, vec3f(0.0), vec3f(0.0, 0.0, s), k.penAng.z, F.z);
  }
}

// --- Contacts ---------------------------------------------------------------------------------

/** What a contact needs of one body, loaded once per pair: rotation and displacement since x-. */
struct PairBody {
  index: u32,
  rot: vec4f,
  dLin: vec3f,
  dAng: vec3f,
}

fn pairBody(i: u32) -> PairBody {
  let rot = bodies[i].rot;
  return PairBody(i, rot, bodies[i].pos.xyz - bodies[i].initialPos.xyz, qsub(rot, bodies[i].initialRot));
}

/**
 * One contact point evaluated at the current poses: C, the force and the lever arms (callers
 * rebuild their own angular Jacobian rows from these; keeping all six rows live cost
 * registers, and the primal ran 60% slower on mixed piles).
 */
struct ContactEval {
  rAW: vec3f,
  rBW: vec3f,
  C: vec3f,
  F: vec3f,        // cone-clamped force
  frictionScale: f32,
  bounds: f32,
}

fn evalContact(k: Contact, basis: mat3x3f, friction: f32, A: PairBody, B: PairBody, alpha: f32) -> ContactEval {
  // Lever arms at the current rotation, as the reference does for boxes. Sphere contacts use
  // the step-start rotation instead (the Taylor point x-): a rolling sphere turns ~0.1 rad per
  // step, and a lever arm rotated with it puts a false separation into the normal row, so the
  // sphere sank through the ground while gaining energy.
  var rotA = A.rot;
  var rotB = B.rot;
  if ((k.key & ~STICK_BIT) == SPHERE_FEATURE) {
    rotA = bodies[A.index].initialRot;
    rotB = bodies[B.index].initialRot;
  }
  var e: ContactEval;
  e.rAW = qrotate(rotA, k.rA);
  e.rBW = qrotate(rotB, k.rB);

  // Taylor series approximation of C(x) about x- (Sec. 4), one row per basis vector l, with
  // angular Jacobians rA \xD7 l and rB \xD7 (-l)
  let n = basis[0];
  let t1 = basis[1];
  let t2 = basis[2];
  let keep = 1.0 - alpha;
  e.C = vec3f(
    k.c0x * keep + dot(n, A.dLin) - dot(n, B.dLin) + dot(cross(e.rAW, n), A.dAng) + dot(cross(e.rBW, -n), B.dAng),
    k.c0y * keep + dot(t1, A.dLin) - dot(t1, B.dLin) + dot(cross(e.rAW, t1), A.dAng) + dot(cross(e.rBW, -t1), B.dAng),
    k.c0z * keep + dot(t2, A.dLin) - dot(t2, B.dLin) + dot(cross(e.rAW, t2), A.dAng) + dot(cross(e.rBW, -t2), B.dAng));
  var F = k.pen * e.C + k.lam;
  // Normal pushes only; friction is clamped to the cone
  F.x = min(F.x, 0.0);
  e.bounds = abs(F.x) * friction;
  e.frictionScale = length(F.yz);
  if (e.frictionScale > e.bounds && e.frictionScale > 0.0) {
    F = vec3f(F.x, F.yz * (e.bounds / e.frictionScale));
  }
  e.F = F;
  return e;
}

// --- Warm start -------------------------------------------------------------------------------

@compute @workgroup_size(64)
fn warmStartJoints(@builtin(global_invocation_id) gid: vec3u) {
  let j = gid.x;
  if (j >= params.jointCount || info[j].x != T_JOINT) { return; }
  var k = joints[j];
  let a = info[j].y;
  let b = info[j].z;
  k.c0Lin = vec4f(jointLinC(k, a, b), 0.0);
  k.c0Ang = vec4f(jointAngC(k, a, b), 0.0);
  let decay = params.alpha * params.gamma;
  k.lamLin = vec4f(k.lamLin.xyz * decay, k.lamLin.w);
  k.lamAng = vec4f(k.lamAng.xyz * decay, k.lamAng.w);
  // Penalties decay, stay within bounds, and never exceed the material stiffness
  k.penLin = vec4f(min(clamp(k.penLin.xyz * params.gamma, vec3f(PENALTY_MIN), vec3f(PENALTY_MAX)), vec3f(k.penLin.w)), k.penLin.w);
  k.penAng = vec4f(min(clamp(k.penAng.xyz * params.gamma, vec3f(PENALTY_MIN), vec3f(PENALTY_MAX)), vec3f(k.penAng.w)), k.penAng.w);
  joints[j] = k;
}

/**
 * The wind on a sail (a thin plate): pressure drag \xBD\u03C1C_d A (n\xB7u)|n\xB7u| along its normal n, u
 * the wind relative to the plate, plus skin friction along the plate (6% of that
 * coefficient), which streams a flag out downwind. The wind gusts in time and across space,
 * sideways too (a few travelling sines), so a flag lying along it still catches it and
 * ripples. The pressure is linearised implicitly in the plate's normal speed (divided by
 * 1 + dt \u2202a/\u2202v): a light plate in real air is stiff, and explicit drag would blow up.
 */
fn windAccel(i: u32, x: vec3f, rot: vec4f, v: vec3f) -> vec3f {
  let t = f32(params.step) * params.dt;
  let w = params.wind.xyz;
  let speed = length(w);
  // Gusts travel downwind: phases in the wind's frame (a downwind, c across)
  let d = select(vec3f(1.0, 0.0, 0.0), w / speed, speed > 1e-6);
  let side = vec3f(-d.y, d.x, 0.0);
  let a = dot(x, d);
  let c = dot(x, side);
  let along = 0.5 * sin(1.1 * t - 0.35 * a + 0.2 * c) + 0.3 * sin(2.9 * t - 0.8 * a + 0.6 * x.z)
    + 0.2 * sin(6.1 * t - 1.7 * a + 1.3 * x.z + 0.9 * c);
  let across = 0.6 * sin(1.7 * t - 0.6 * a + 0.4 * x.z) + 0.4 * sin(4.3 * t - 1.3 * a - 0.7 * x.z);
  let lift = sin(2.3 * t - 0.9 * a + 1.1 * c);
  let g = params.gust.x;
  let u = w * (1.0 + g * along) + (side * (0.25 * across) + vec3f(0.0, 0.0, 0.1 * lift)) * (g * speed) - v;
  let n = qrotate(rot, vec3f(0.0, 0.0, 1.0));
  let size = bodies[i].size;
  let k = params.wind.w * size.x * size.y / size.w; // \xBD\u03C1C_d A / m
  let un = dot(u, n);
  let ut = u - n * un;
  return n * (k * un * abs(un) / (1.0 + 2.0 * params.dt * k * abs(un))) + ut * (0.06 * k * length(ut));
}

@compute @workgroup_size(64)
fn warmStartBodies(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount) { return; }
  // Field-wise loads and stores: only the poses change (whole-record copies moved 320 bytes)
  let pos = bodies[i].pos;
  let rot = bodies[i].rot;
  let vel = bodies[i].vel;
  let angVel = bodies[i].angVel.xyz;
  let dt = params.dt;
  let g = params.gravity;
  let dynamic = bodies[i].size.w > 0.0;

  // Inertial target (Eq. 2), with the wind's push on sails as a second external force
  var inertialPos = pos.xyz + vel.xyz * dt;
  if (dynamic) { inertialPos += params.up.xyz * (g * (dt * dt)); }
  if (dynamic && bodies[i].angVel.w == SHAPE_SAIL) { inertialPos += windAccel(i, pos.xyz, rot, vel.xyz) * (dt * dt); }
  bodies[i].inertialPos = vec4f(inertialPos, bodies[i].inertialPos.w);
  bodies[i].inertialRot = qadd(rot, angVel * dt);

  // Adaptive warm start (original VBD paper), along up; vel.w holds last step's velocity along up. With
  // FLAG_START_AT_REST a body slower than REST_SPEED starts from x- instead: at few
  // iterations a resting stack never corrects the extrapolated guess, which pumps tall walls
  // until they buckle (docs/FINDINGS.md, Stage 8m)
  var w = 0.0;
  if (abs(g) > 0.0) { w = clamp((dot(vel.xyz, params.up.xyz) - vel.w) / dt * sign(g) / abs(g), 0.0, 1.0); }
  let slow = length(vel.xyz) + length(angVel) * bodies[i].moment.w < REST_SPEED;
  let atRest = (params.flags & FLAG_START_AT_REST) != 0u && slow;

  bodies[i].initialPos = pos;
  bodies[i].initialRot = rot;
  if (dynamic && !atRest) {
    bodies[i].pos = vec4f(pos.xyz + vel.xyz * dt + params.up.xyz * (g * (w * dt * dt)), pos.w);
    bodies[i].rot = qadd(rot, angVel * dt);
  }
  // A fixed body with a velocity is kinematic: it moves by it over the step, from where it
  // started (initialPos), so what it touches sees it slide and is pushed and carried along
  if (!dynamic && (any(vel.xyz != vec3f(0.0)) || any(angVel != vec3f(0.0)))) {
    bodies[i].pos = vec4f(pos.xyz + vel.xyz * dt, pos.w);
    bodies[i].rot = qadd(rot, angVel * dt);
  }
}

// --- Primal: one colour -----------------------------------------------------------------------

/** A partial system per body slot handed between lanes (primal). */
var<workgroup> partials: array<Acc, 32>;

/**
 * One colour's bodies, lanesFor(colour size) threads per body: each lane accumulates every
 * lanes-th adjacency entry, the partial systems are summed in workgroup memory (halving the
 * lanes each round), and lane 0 solves. Bodies of one colour share no constraint, so writing
 * poses in place never races with a neighbour's read (bodies left clashing by the colouring
 * are the only, counted, exception).
 */
@compute @workgroup_size(64)
fn primal(@builtin(local_invocation_id) lid: vec3u, @builtin(workgroup_id) wid: vec3u) {
  let start = color[params.colorStartOffset + pc.color];
  let count = color[params.colorStartOffset + pc.color + 1u] - start;
  let lanes = lanesFor(count);
  let slot = lid.x / lanes;
  let lane = lid.x % lanes;
  let k = wid.x * (64u / lanes) + slot;
  let live = k < count;
  var i = 0u;
  var acc: Acc;
  if (live) {
    i = color[params.colorBodiesOffset + start + k];
    acc = accumulate(i, lane, lanes);
  }
  // Lanes s..2s-1 hand their sums to lanes 0..s-1 (constant bounds keep the barriers uniform)
  for (var s = 4u; s > 0u; s >>= 1u) {
    let merging = s < lanes;
    if (merging && lane >= s && lane < 2u * s) { partials[slot * s + lane - s] = acc; }
    workgroupBarrier();
    if (merging && lane < s) {
      let other = partials[slot * s + lane];
      acc.lin += other.lin;
      acc.ang += other.ang;
      acc.cross += other.cross;
      acc.rLin += other.rLin;
      acc.rAng += other.rAng;
    }
    workgroupBarrier();
  }
  if (live && lane == 0u) { finishBody(i, acc); }
}

/**
 * Body i's Newton system from adjacency entries lane, lane + lanes, ... (lane 0 also adds the
 * inertia terms); lanes > 1 split a body's constraints across threads.
 */
fn accumulate(i: u32, lane: u32, lanes: u32) -> Acc {
  let pos = bodies[i].pos;
  let rot = bodies[i].rot;
  let dt2 = params.dt * params.dt;
  let m = bodies[i].size.w / dt2;
  let I = bodies[i].moment.xyz / dt2;
  var acc: Acc;
  if (lane == 0u) {
    acc.lin = mat3x3f(vec3f(m, 0.0, 0.0), vec3f(0.0, m, 0.0), vec3f(0.0, 0.0, m));
    acc.ang = mat3x3f(vec3f(I.x, 0.0, 0.0), vec3f(0.0, I.y, 0.0), vec3f(0.0, 0.0, I.z));
    acc.rLin = m * (pos.xyz - bodies[i].inertialPos.xyz);
    acc.rAng = I * qsub(rot, bodies[i].inertialRot);
  }

  // One flat loop over joints and contact points: each iteration handles one point, loading
  // its pair when the previous pair runs out. Only what the point needs stays live across
  // iterations (partner and own rotation/displacement, the normal): live registers limit
  // how many threads hide memory latency, and mixed piles run in small, latency-bound
  // per-colour dispatches.
  var e = adj[i] + lane;
  let end = adj[i + 1u];
  var c = 0u;
  var cEnd = 0u;
  var A: PairBody;
  var B: PairBody;
  var normal = vec3f(0.0);
  var friction = 0.0;
  var isA = false;
  loop {
    if (c == cEnd) {
      if (e >= end) { break; }
      let id = adj[params.adjListOffset + e];
      e += lanes;
      if (id < params.jointCount) {
        addJoint(&acc, id, pc.alpha, i);
        continue;
      }
      let mf = manifolds[id - params.jointCount];
      isA = i == mf.ids.x;
      A = pairBody(mf.ids.x);
      B = pairBody(mf.ids.y);
      normal = mf.geo.xyz;
      friction = mf.geo.w;
      c = mf.ids.z;
      cEnd = mf.ids.z + pairCount(mf);
      if (c == cEnd) { continue; }
    }
    let k = contacts[c];
    c++;
    let basis = orthonormal(normal);
    let ev = evalContact(k, basis, friction, A, B, pc.alpha);
    // This body's rows: linear \xB1l, angular r \xD7 (\xB1l)
    let sg = select(-1.0, 1.0, isA);
    let r = select(ev.rBW, ev.rAW, isA);
    let l0 = basis[0] * sg;
    let l1 = basis[1] * sg;
    let l2 = basis[2] * sg;
    addRow(&acc, l0, cross(r, l0), k.pen.x, ev.F.x);
    addRow(&acc, l1, cross(r, l1), k.pen.y, ev.F.y);
    addRow(&acc, l2, cross(r, l2), k.pen.z, ev.F.z);
  }
  return acc;
}

/** Solve body i's 6x6 system and apply the update (Eq. 4). */
fn finishBody(i: u32, acc: Acc) {
  let pos = bodies[i].pos;
  let rot = bodies[i].rot;
  // LDL\u1D40 solve of the 6x6 SPD system (maths.h solve), lower triangle only. Each pivot is floored
  // at 1e-5 of its diagonal: in f32 a direction held only by a light body's inertia, under
  // contacts near PENALTY_MAX (a sliver on its edge under a slab), cancels to noise and can come
  // out negative, and the step then climbs until the body is Inf, then NaN. The floor stiffens
  // just that direction, and only when it is that ill-conditioned (pivot.gpu.test.ts).
  let A11 = acc.lin[0][0];
  let A21 = acc.lin[0][1]; let A22 = acc.lin[1][1];
  let A31 = acc.lin[0][2]; let A32 = acc.lin[1][2]; let A33 = acc.lin[2][2];
  let A41 = acc.cross[0][0]; let A42 = acc.cross[1][0]; let A43 = acc.cross[2][0]; let A44 = acc.ang[0][0];
  let A51 = acc.cross[0][1]; let A52 = acc.cross[1][1]; let A53 = acc.cross[2][1]; let A54 = acc.ang[0][1]; let A55 = acc.ang[1][1];
  let A61 = acc.cross[0][2]; let A62 = acc.cross[1][2]; let A63 = acc.cross[2][2]; let A64 = acc.ang[0][2]; let A65 = acc.ang[1][2]; let A66 = acc.ang[2][2];

  let D1 = A11;
  let L21 = A21 / D1;
  let L31 = A31 / D1;
  let L41 = A41 / D1;
  let L51 = A51 / D1;
  let L61 = A61 / D1;
  let D2 = max(A22 - L21 * L21 * D1, A22 * PIVOT_FLOOR);
  let L32 = (A32 - L21 * L31 * D1) / D2;
  let L42 = (A42 - L21 * L41 * D1) / D2;
  let L52 = (A52 - L21 * L51 * D1) / D2;
  let L62 = (A62 - L21 * L61 * D1) / D2;
  let D3 = max(A33 - (L31 * L31 * D1 + L32 * L32 * D2), A33 * PIVOT_FLOOR);
  let L43 = (A43 - L31 * L41 * D1 - L32 * L42 * D2) / D3;
  let L53 = (A53 - L31 * L51 * D1 - L32 * L52 * D2) / D3;
  let L63 = (A63 - L31 * L61 * D1 - L32 * L62 * D2) / D3;
  let D4 = max(A44 - (L41 * L41 * D1 + L42 * L42 * D2 + L43 * L43 * D3), A44 * PIVOT_FLOOR);
  let L54 = (A54 - L41 * L51 * D1 - L42 * L52 * D2 - L43 * L53 * D3) / D4;
  let L64 = (A64 - L41 * L61 * D1 - L42 * L62 * D2 - L43 * L63 * D3) / D4;
  let D5 = max(A55 - (L51 * L51 * D1 + L52 * L52 * D2 + L53 * L53 * D3 + L54 * L54 * D4), A55 * PIVOT_FLOOR);
  let L65 = (A65 - L51 * L61 * D1 - L52 * L62 * D2 - L53 * L63 * D3 - L54 * L64 * D4) / D5;
  let D6 = max(A66 - (L61 * L61 * D1 + L62 * L62 * D2 + L63 * L63 * D3 + L64 * L64 * D4 + L65 * L65 * D5), A66 * PIVOT_FLOOR);

  let y1 = acc.rLin.x;
  let y2 = acc.rLin.y - L21 * y1;
  let y3 = acc.rLin.z - L31 * y1 - L32 * y2;
  let y4 = acc.rAng.x - L41 * y1 - L42 * y2 - L43 * y3;
  let y5 = acc.rAng.y - L51 * y1 - L52 * y2 - L53 * y3 - L54 * y4;
  let y6 = acc.rAng.z - L61 * y1 - L62 * y2 - L63 * y3 - L64 * y4 - L65 * y5;

  let w3 = y6 / D6;
  let w2 = y5 / D5 - L65 * w3;
  let w1 = y4 / D4 - L54 * w2 - L64 * w3;
  let v3 = y3 / D3 - L43 * w1 - L53 * w2 - L63 * w3;
  let v2 = y2 / D2 - L32 * v3 - L42 * w1 - L52 * w2 - L62 * w3;
  let v1 = y1 / D1 - L21 * v2 - L31 * v3 - L41 * w1 - L51 * w2 - L61 * w3;

  // dx = -A\u207B\xB9 rhs (Eq. 4)
  bodies[i].pos = vec4f(pos.xyz - vec3f(v1, v2, v3), pos.w);
  bodies[i].rot = qadd(rot, -vec3f(w1, w2, w3));
}

// --- Dual -------------------------------------------------------------------------------------

fn dualJoint(j: u32) {
  let t = info[j].x;
  if (t != T_JOINT) { return; }
  let a = info[j].y;
  let b = info[j].z;
  var k = joints[j];
  let alpha = pc.alpha;
  if (dot(k.penLin.xyz, k.penLin.xyz) > 0.0) {
    let C = jointLinRows(k, a, b, alpha);
    if (k.penLin.w >= HARD) { k.lamLin = vec4f(k.penLin.xyz * C + k.lamLin.xyz, k.lamLin.w); }
    k.penLin = vec4f(min(k.penLin.xyz + abs(C) * params.betaLin, vec3f(min(k.penLin.w, PENALTY_MAX))), k.penLin.w);
  }
  if (dot(k.penAng.xyz, k.penAng.xyz) > 0.0) {
    let C = jointAngRows(k, a, b, alpha);
    if (k.penAng.w >= HARD) { k.lamAng = vec4f(k.penAng.xyz * C + k.lamAng.xyz, k.lamAng.w); }
    k.penAng = vec4f(min(k.penAng.xyz + abs(C) * params.betaAng, vec3f(min(k.penAng.w, PENALTY_MAX))), k.penAng.w);
  }
  // Fracture: the joint stops acting for good (the CPU deletes it). A negative threshold (not in
  // the paper: GpuSolver3D.appendJoints) breaks on the linear force too, at the same limit
  let frac = k.lamLin.w;
  let limit = abs(frac);
  let linear = frac < 0.0 && dot(k.lamLin.xyz, k.lamLin.xyz) > limit * limit;
  if (limit < BIG && (dot(k.lamAng.xyz, k.lamAng.xyz) > limit * limit || linear)) {
    k.penLin = vec4f(0.0);
    k.penAng = vec4f(0.0);
    k.lamLin = vec4f(0.0, 0.0, 0.0, frac);
    k.lamAng = vec4f(0.0, 0.0, 0.0, k.lamAng.w);
  }
  joints[j] = k;
}

fn dualManifold(m: u32) {
  let mf = manifolds[m];
  let A = pairBody(mf.ids.x);
  let B = pairBody(mf.ids.y);
  let basis = orthonormal(mf.geo.xyz);
  let end = mf.ids.z + pairCount(mf);
  for (var c = mf.ids.z; c < end; c++) {
    let k = contacts[c];
    let e = evalContact(k, basis, mf.geo.w, A, B, pc.alpha);
    // Write back only what changes (lambda, penalty, stick): the dual is bandwidth-bound
    contacts[c].lam = e.F;
    // Ramp the penalty where the force is within its bounds (Eq. 16)
    var pen = k.pen;
    if (e.F.x < 0.0) { pen.x = min(pen.x + params.betaLin * abs(e.C.x), PENALTY_MAX); }
    if (e.frictionScale <= e.bounds) {
      pen.y = min(pen.y + params.betaLin * abs(e.C.y), PENALTY_MAX);
      pen.z = min(pen.z + params.betaLin * abs(e.C.z), PENALTY_MAX);
      let stick = length(e.C.yz) < STICK_THRESH;
      contacts[c].key = (k.key & ~STICK_BIT) | select(0u, STICK_BIT, stick);
    }
    contacts[c].pen = pen;
  }
}

/** Dual update of every constraint: joints first, then contact pairs (one dispatch). */
@compute @workgroup_size(64)
fn dual(@builtin(global_invocation_id) gid: vec3u) {
  let id = gid.x;
  if (id < params.jointCount) { dualJoint(id); }
  else if (id - params.jointCount < manifoldCount()) { dualManifold(id - params.jointCount); }
}

@compute @workgroup_size(64)
fn updateVelocities(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount) { return; }
  // This step's starting velocity along up, for the next step's adaptive warm start
  let prevUp = dot(bodies[i].vel.xyz, params.up.xyz);
  if (bodies[i].size.w > 0.0) {
    bodies[i].vel = vec4f((bodies[i].pos.xyz - bodies[i].initialPos.xyz) / params.dt, prevUp);
    bodies[i].angVel = vec4f(qsub(bodies[i].rot, bodies[i].initialRot) / params.dt, bodies[i].angVel.w);
  } else {
    bodies[i].vel.w = prevUp;
  }
}
`;function to(s,e){let t=0,i=s.length-1;for(;t<i;){let r=s[e],o=t,a=i;do{for(;s[o]<r;)o++;for(;r<s[a];)a--;if(o<=a){let n=s[o];s[o]=s[a],s[a]=n,o++,a--}}while(o<=a);a<e&&(t=o),e<o&&(i=a)}return s[e]}function Xa(s){let e=s.length,t=e>0?to(s,e>>1):1,i=0;for(let r=0;r<e;r++)s[r]<=2*t&&(i=Math.max(i,s[r]));return e>64&&(i=Math.max(i,to(s,e-64-1))),i}var $t=s=>s===1/0?3e38:s===-1/0?-3e38:s,ht=s=>Math.ceil(s/64),Tl=s=>2**Math.ceil(Math.log2(Math.max(s,2))),lf=s=>Math.max(s,1)*We*4,cf=8,io=3,uf=8,ff=1.6,df=.8,hf=2,pf=[0,0,1],mf=()=>({...Oa(),matchNearest:!0,faceBias:!0,reuseContacts:!0,startAtRest:!0,massPenalty:!0,windSpeed:0,windAngle:0,windGust:.4,windPressure:.72,up:[0,1,0]});function gf(s,e){let t=s.vertices.length/3,i=s.faces.length,r=s.faces.reduce((m,h)=>m+h.verts.length,0),o=Math.ceil(r/4),a=s.edges.length,n=new Float32Array((2+t+2*i+o+a)*4),l=new Uint32Array(n.buffer),c=e+2,u=c+t,f=u+2*i,d=f+o;l.set([c,t,u,i,d,a,f,0],0);for(let m=0;m<t;m++)n.set(s.vertices.subarray(m*3,m*3+3),(2+m)*4);let p=0;return s.faces.forEach((m,h)=>{let g=(2+t+2*h)*4;n.set(m.normal,g),n[g+3]=m.d,l[g+4]=p,l[g+5]=m.verts.length;for(let b of m.verts)l[(2+t+2*i)*4+p++]=b}),s.edges.forEach((m,h)=>l.set(m,(2+t+2*i+o+h)*4)),n}var Ya=.001;function bf(s,e){let t=s.length,i=s.map(y=>{let A=y;return[A.group??4294967295,A.collidesWith??4294967295]}),r=i.map(([y,A])=>y!==0&&A!==0),o=s.map(y=>[0,1,2].map(A=>{let v=[0,0,0];return v[A]=1,le(S(),y.positionAng,v)})),a=s.map((y,A)=>{if(De(y))return[y.radius,y.radius,y.radius];let v=[0,0,0];for(let x=0;x<3;x++)for(let w=0;w<3;w++)v[w]+=y.size[x]*.5*Math.abs(o[A][x][w]);return v}),n=Xa(Float64Array.from(s,y=>y.radius)),l=Math.max(2*n,.001),c=(y,A)=>{let v=s[y],x=s[A];if(v.mass<=0&&x.mass<=0||!(i[y][0]&i[A][1])||!(i[A][0]&i[y][1]))return!1;let w=v.positionLin[0]-x.positionLin[0],B=v.positionLin[1]-x.positionLin[1],L=v.positionLin[2]-x.positionLin[2];if(!(Math.abs(w)<=a[y][0]+a[A][0]&&Math.abs(B)<=a[y][1]+a[A][1]&&Math.abs(L)<=a[y][2]+a[A][2]))return!1;let M=v.radius+x.radius;return w*w+B*B+L*L<=M*M},u=(y,A)=>y[0]*A[0]+y[1]*A[1]+y[2]*A[2],f=(y,A)=>{let v=s[y],x=s[A],w=[0,1,2].map(E=>x.positionLin[E]-v.positionLin[E]),[B,L]=[De(v),De(x)];if(B&&L)return Math.hypot(w[0],w[1],w[2])<=v.radius+x.radius+Ya;if(B||L){let[E,k,P]=B?[A,v.radius,-1]:[y,x.radius,1],C=0;for(let _=0;_<3;_++){let z=Math.abs(P*u(w,o[E][_]))-s[E].size[_]*.5;z>0&&(C+=z*z)}return C<=(k+Ya)**2}let M=(E,k)=>s[E].size[0]*.5*Math.abs(u(o[E][0],k))+s[E].size[1]*.5*Math.abs(u(o[E][1],k))+s[E].size[2]*.5*Math.abs(u(o[E][2],k)),I=E=>{let k=Math.hypot(E[0],E[1],E[2]);return k<1e-6?!1:Math.abs(u(w,E))-M(y,E)-M(A,E)>Ya*k};for(let E=0;E<3;E++)if(I(o[y][E])||I(o[A][E]))return!1;for(let E of o[y])for(let k of o[A])if(I([E[1]*k[2]-E[2]*k[1],E[2]*k[0]-E[0]*k[2],E[0]*k[1]-E[1]*k[0]]))return!1;return!0},d=new Set,p=new Map,m=(y,A,v)=>(y*73856093^A*19349663^v*83492791)>>>0,h=y=>[0,1,2].map(A=>Math.floor(s[y].positionLin[A]/l));for(let y=0;y<t;y++){if(!r[y])continue;if(s[y].radius>n){d.add(y);continue}let[A,v,x]=h(y),w=m(A,v,x),B=p.get(w);B?B.push(y):p.set(w,[y])}let g=0,b=0;for(let y=0;y<t;y++){if(!r[y]||d.has(y))continue;let[A,v,x]=h(y);for(let w=-1;w<=1;w++)for(let B=-1;B<=1;B++)for(let L=-1;L<=1;L++)for(let M of p.get(m(A+L,v+B,x+w))??[])M<y&&c(y,M)&&(g++,f(y,M)&&(b++,e[y]++,e[M]++))}for(let y of d)for(let A=0;A<t;A++)r[A]&&A!==y&&(!d.has(A)||A<y)&&c(y,A)&&(g++,f(y,A)&&(b++,e[y]++,e[A]++));return{pairs:g,touching:b}}function yf(s){let e=[1/0,1/0,1/0],t=[-1/0,-1/0,-1/0];for(let o of s)for(let a=0;a<3;a++)e[a]=Math.min(e[a],o.positionLin[a]),t[a]=Math.max(t[a],o.positionLin[a]);let i=o=>{let a=o&1023;return a=(a|a<<16)&50331903,a=(a|a<<8)&50393103,a=(a|a<<4)&51130563,a=(a|a<<2)&153391689,a},r=s.map(o=>{let a=[0,1,2].map(n=>Math.min(1023,Math.floor((o.positionLin[n]-e[n])/Math.max(t[n]-e[n],1e-9)*1024)));return(i(a[0])|i(a[1])<<1|i(a[2])<<2)>>>0});return s.map((o,a)=>a).sort((o,a)=>r[o]-r[a]||o-a)}var Pe=()=>GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST,ro=class{device;params=mf();bodyCount=0;bodyCapacity;bodies=[];hulls;hullBuffer;get hullStorage(){return this.hullBuffer}hullCapacity=4096;hullTop=0;hullSlots=new Map;contactShaders;hullShaders=!1;hullFree=[];refToGpu;jointCount=0;jointCapacity=0;info=new Int32Array(0);pairCapacity=0;manifoldCapacity=0;contactCapacity=0;colorCap=12;fixedColors=null;primalLanes=[2**31,2**15,2**12];splitPasses=!1;shrinkVotes=0;colorRounds;get colorHistOffset(){return 3*this.bodyCapacity+65}bodyBuffer;ownsBodyBuffer;jointBuffer;infoBuffer;contactBuffers;manifoldBuffers;pairBuffer;tableBuffer;gridBuffer;staticBuffer=null;filterBuffer;get filterStorage(){return this.filterBuffer}counterBuffer;get contactStorage(){let e=1-this.parity;return{manifolds:this.manifoldBuffers[e],contacts:this.contactBuffers[e],counters:this.counterBuffer}}argsBuffer;adjBuffer=null;colorBuffer;paramsBuffer;refBuffer;stepCount=0;passBuffer=null;passEntries=0;parity=0;tableSize;hashSize=0;cellSize=1;maxSmallRadius=0;largeCount=0;noCollideCount=0;radiiDirty=!0;noCollideDirty=!0;large=[];entries=[];pendingEntries=[];releasedSlots=new Set;freeSlots=[];layouts;pipes={};groups;passGroup=null;gridScan;colorHistScan;colorGroups;adjScan=null;timing;timingCallback=null;timingBusy=!1;destroyed=!1;constructor(e,t,i={}){this.device=e;let{dt:r,gravity:o,iterations:a,alpha:n,betaLin:l,betaAng:c,gamma:u}=t;if(Object.assign(this.params,{dt:r,gravity:o,iterations:a,alpha:n,betaLin:l,betaAng:c,gamma:u,up:pf}),this.bodyCount=t.bodies.length,this.colorRounds=i.colorRounds??16,this.ownsBodyBuffer=!i.bodyBuffer,this.bodyCapacity=i.bodyBuffer?Math.floor(i.bodyBuffer.size/(We*4)):Math.max(i.bodyCapacity??this.bodyCount+1024,this.bodyCount,1),this.bodyCapacity<this.bodyCount)throw new Error("body buffer too small");this.bodyBuffer=i.bodyBuffer??e.createBuffer({label:"bodies 3d",size:lf(this.bodyCapacity),usage:Pe()}),this.filterBuffer=e.createBuffer({label:"collision filters",size:Math.max(this.bodyCapacity,1)*8,usage:Pe()}),e.queue.writeBuffer(this.filterBuffer,0,new Uint32Array(Math.max(this.bodyCapacity,1)*2).fill(4294967295));let f=this.bodyCapacity;this.tableSize=Tl(2*f),this.gridBuffer=e.createBuffer({label:"grid 3d",size:(2*this.tableSize+1+4*f)*4,usage:Pe()}),this.counterBuffer=e.createBuffer({label:"counters",size:64,usage:Pe()}),this.argsBuffer=e.createBuffer({label:"indirect args",size:816,usage:Pe()|GPUBufferUsage.INDIRECT}),this.colorGroups=Math.ceil(f/256),this.colorBuffer=e.createBuffer({label:"colours",size:(3*f+65+64*this.colorGroups+1)*4,usage:Pe()}),this.paramsBuffer=e.createBuffer({label:"params 3d",size:ls*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.refBuffer=e.createBuffer({label:"reference poses",size:f*32,usage:Pe()}),this.hulls=(i.hulls??!0)&&e.limits.maxStorageBuffersPerShaderStage>=9,this.hullBuffer=e.createBuffer({label:"hulls",size:this.hullCapacity*16,usage:Pe()}),e.queue.writeBuffer(this.colorBuffer,0,new Uint32Array(f).fill(255));let d=2*Se.length;this.timing=e.features.has("timestamp-query")?{querySet:e.createQuerySet({type:"timestamp",count:d}),resolve:e.createBuffer({size:d*8,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC}),read:e.createBuffer({size:d*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST})}:null,this.layouts=this.createLayouts(),this.createPipelines(i.shaders??{}),this.gridScan=new tt(e,this.gridBuffer,0,this.tableSize+1),this.colorHistScan=new tt(e,this.colorBuffer,this.colorHistOffset,64*this.colorGroups+1);let p=i.spatialSort===!1?t.bodies.map((w,B)=>B):yf(t.bodies);this.refToGpu=new Int32Array(p.length),p.forEach((w,B)=>this.refToGpu[w]=B);let m=new Map(t.bodies.map((w,B)=>[w,this.refToGpu[B]])),h=t.forces.filter(w=>w instanceof ke||w instanceof dt);for(let w of t.forces){if(!(w instanceof $s))continue;let B=m.get(w.bodyA),L=m.get(w.bodyB);this.pendingEntries.push([Math.max(B,L),Math.min(B,L),4294967295])}this.allocateJoints(Math.max(h.length+256,i.capacity?.joints??0));for(let w of h)this.writeJoint(this.jointCount++,w,m);let g=new Int32Array(t.bodies.length),{pairs:b,touching:y}=bf(t.bodies,g),A=new Map(t.bodies.map((w,B)=>[w,B]));for(let w of h)w.bodyA&&g[A.get(w.bodyA)]++,g[A.get(w.bodyB)]++;let v=0;t.bodies.forEach((w,B)=>{w.mass>0&&(v=Math.max(v,g[B]))}),this.colorCap=Math.min(64,Math.max(uf,v+1+io,i.capacity?.colors??0));let x=i.capacity??{};this.allocateContacts(Math.max(8192,4*f,cf*y,x.contacts??0),Math.max(4096,4*f,2*b,x.pairs??0),Math.max(4096,f,ff*y,x.manifolds??0)),this.writeBodies(0,p.map(w=>t.bodies[w]))}gpuIndex(e){return e<this.refToGpu.length?this.refToGpu[e]:e}createLayouts(){let e=this.device,t=(a,n)=>e.createBindGroupLayout({label:a,entries:n.map((l,c)=>({binding:c,visibility:GPUShaderStage.COMPUTE,buffer:{type:l}}))}),i="read-only-storage",r="storage",o="uniform";return{broad:t("broadphase 3d",[o,i,r,r,r,i,i,i]),contacts:t("contacts 3d",[o,i,i,r,i,r,i,r,r,...this.hulls?[i]:[]]),topo:t("topology 3d",[o,i,i,i,i,r,r,r]),solve:t("solve 3d",[o,r,r,i,r,i,i,i,i]),pass:e.createBindGroupLayout({label:"pass",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform",hasDynamicOffset:!0,minBindingSize:16}}]}),args:t("args 3d",[o,i,i,r]),refs:t("refs 3d",[o,r,r])}}createPipelines(e){let t=this.device,i=(o,a,n)=>{let l=t.createShaderModule({code:o}),c=t.createPipelineLayout({bindGroupLayouts:a});for(let u of n)this.pipes[u]=t.createComputePipeline({label:u,layout:c,compute:{module:l,entryPoint:u}})},r=this.layouts;i(fi,[r.broad],["beginFrame","gridCount","gridScatter","findPairs"]),i(e.refs??eo,[r.refs],["updateRefs"]),i(e.contacts??Il,[r.contacts],["hashInsert","narrowphase"]),this.contactShaders={make:o=>i(o,[r.contacts],["hashInsert","narrowphase"]),custom:!!e.contacts},i(e.topology??Ti(ge,yr),[r.topo],["degreeJoints","degreeContacts","fillJoints","fillContacts","sortAdjacency","colorCompact","colorMark","colorRoundAB","colorRoundBA","colorCount","colorStarts","colorScatter"]),i(e.solve??Ge,[r.solve,r.pass],["warmStartJoints","warmStartBodies","primal","dual","updateVelocities"]),i(Yr(ge,Zs),[r.args],["argsPrev","argsPairs","argsContacts","argsColors"])}allocateJoints(e){let t=this.device,i=t.createBuffer({label:"joints 3d",size:Math.max(e,1)*pe*4,usage:Pe()}),r=t.createBuffer({label:"joint info",size:Math.max(e,1)*16,usage:Pe()});if(this.jointBuffer){let a=t.createCommandEncoder();a.copyBufferToBuffer(this.jointBuffer,0,i,0,this.jointCapacity*pe*4),a.copyBufferToBuffer(this.infoBuffer,0,r,0,this.jointCapacity*16),t.queue.submit([a.finish()]),this.jointBuffer.destroy(),this.infoBuffer.destroy()}let o=new Int32Array(e*4);o.set(this.info.subarray(0,Math.min(this.info.length,o.length))),this.info=o,this.jointBuffer=i,this.infoBuffer=r,this.jointCapacity=e,this.contactBuffers&&this.rebuildBindings()}allocateContacts(e,t,i){let r=this.device,o=r.limits.maxStorageBufferBindingSize,a=Math.min(Math.ceil(e),Math.floor(o/(Ht*4))),n=Math.min(Math.ceil(t),Math.floor(o/8)),l=Math.min(Math.ceil(i),n,Math.floor(o/(Nt*4))),c={contacts:this.contactBuffers,manifolds:this.manifoldBuffers,contactCapacity:this.contactCapacity,manifoldCapacity:this.manifoldCapacity};for(let u of[this.pairBuffer,this.tableBuffer])u?.destroy();if(this.contactCapacity=a,this.pairCapacity=n,this.manifoldCapacity=l,this.hashSize=Tl(2*l),this.pairBuffer=r.createBuffer({label:"pairs",size:n*8,usage:Pe()}),this.tableBuffer=r.createBuffer({label:"manifold hash",size:this.hashSize*4,usage:Pe()}),this.contactBuffers=[0,1].map(u=>r.createBuffer({label:`contacts 3d ${u}`,size:a*Ht*4,usage:Pe()})),this.manifoldBuffers=[0,1].map(u=>r.createBuffer({label:`manifolds 3d ${u}`,size:l*Nt*4,usage:Pe()})),c.contacts){let u=r.createCommandEncoder(),f=Math.min(c.contactCapacity,a)*Ht*4,d=Math.min(c.manifoldCapacity,l)*Nt*4;c.contacts.forEach((p,m)=>u.copyBufferToBuffer(p,0,this.contactBuffers[m],0,f)),c.manifolds.forEach((p,m)=>u.copyBufferToBuffer(p,0,this.manifoldBuffers[m],0,d)),r.queue.submit([u.finish()]),[...c.contacts,...c.manifolds].forEach(p=>p.destroy())}this.rebuildBindings()}rebuildBindings(){let e=this.device,t=this.bodyCapacity;this.adjBuffer?.destroy(),this.adjBuffer=e.createBuffer({label:"adjacency",size:(2*t+1+2*(this.jointCapacity+this.manifoldCapacity))*4,usage:Pe()}),this.adjScan?.destroy(),this.adjScan=new tt(e,this.adjBuffer,0,this.bodyCount+1),this.staticBuffer??=e.createBuffer({label:"statics",size:16,usage:Pe()});let i=(d,p)=>e.createBindGroup({layout:d,entries:p.map((m,h)=>({binding:h,resource:{buffer:m}}))}),r=this.paramsBuffer,[o,a]=this.contactBuffers,[n,l]=this.manifoldBuffers,c=this.adjBuffer,u=this.tableBuffer,f=this.counterBuffer;this.groups={broad:i(this.layouts.broad,[r,this.bodyBuffer,this.gridBuffer,this.pairBuffer,f,this.staticBuffer,this.jointBuffer,this.filterBuffer]),contacts:[i(this.layouts.contacts,[r,this.bodyBuffer,this.pairBuffer,o,a,n,l,u,f,...this.hulls?[this.hullBuffer]:[]]),i(this.layouts.contacts,[r,this.bodyBuffer,this.pairBuffer,a,o,l,n,u,f,...this.hulls?[this.hullBuffer]:[]])],topo:[n,l].map(d=>i(this.layouts.topo,[r,this.bodyBuffer,this.jointBuffer,this.infoBuffer,d,f,c,this.colorBuffer])),solve:[0,1].map(d=>i(this.layouts.solve,[r,this.bodyBuffer,this.jointBuffer,this.infoBuffer,[o,a][d],c,this.colorBuffer,f,[n,l][d]])),args:i(this.layouts.args,[r,this.counterBuffer,this.colorBuffer,this.argsBuffer]),refs:i(this.layouts.refs,[r,this.bodyBuffer,this.refBuffer])}}writeBodies(e,t){let i=new Float32Array(Math.max(t.length,1)*We);t.forEach((r,o)=>{let a=this.pack(r,i,o*We,this.bodies[e+o]?.hull);this.bodies[e+o]?.radius!==a.radius&&(this.radiiDirty=!0),this.bodies[e+o]=a}),this.device.queue.writeBuffer(this.bodyBuffer,e*We*4,i,0,t.length*We)}rewriteFixed(e,t,i,r,o){if(!e.length)return;let a=new Float32Array(We),n={positionLin:[0,0,0],positionAng:[0,0,0,1],initialLin:[0,0,0],initialAng:[0,0,0,1],inertialLin:[0,0,0],inertialAng:[0,0,0,1],velocityLin:[0,0,0],prevVelocityLin:[0,0,0],velocityAng:[0,0,0],size:[i[0],i[1],i[2]],mass:0,moment:[0,0,0],friction:r,radius:Math.hypot(i[0]/2,i[1]/2,i[2]/2)},l=this.pack(n,a,0);for(let c=0;c<e.length;){let u=c+1;for(;u<e.length&&e[u]===e[u-1]+1;)u++;let f=new Float32Array((u-c)*We);for(let d=c;d<u;d++){let p=(d-c)*We;f.set(a,p);for(let h=0;h<3;h++)f[p+fr+h]=t[3*d+h];if(o)for(let h=0;h<4;h++)f[p+Zr+h]=o[4*d+h];let m=this.bodies[e[d]];m?.radius!==l.radius&&(this.radiiDirty=!0),m?.hull&&this.releaseHull(m.hull),this.bodies[e[d]]={...l,size:[...l.size]}}this.device.queue.writeBuffer(this.bodyBuffer,e[c]*We*4,f),this.device.queue.writeBuffer(this.colorBuffer,e[c]*4,new Uint32Array(u-c).fill(255)),c=u}}pack(e,t,i,r){{t.set(e.positionLin,i+fr),t[i+fr+3]=e.friction,t.set(e.positionAng,i+Zr),t.set(e.size,i+Na),t[i+Na+3]=e.mass,t.set(e.moment,i+qa),t[i+qa+3]=e.radius,t.set(e.initialLin,i+Bl),t.set(e.initialAng,i+Cl),t.set(e.inertialLin,i+Sl),t.set(e.inertialAng,i+kl),t.set(e.velocityLin,i+Va);let o=this.params.up;t[i+Va+3]=e.prevVelocityLin[0]*o[0]+e.prevVelocityLin[1]*o[1]+e.prevVelocityLin[2]*o[2],t.set(e.velocityAng,i+Wa);let a=De(e),n=this.hulls?Ct(e):void 0;r&&r!==n&&this.releaseHull(r);let l=n?r===n?this.hullSlots.get(n).offset:this.acquireHull(n):-1;return t[i+Wa+3]=a?Ha:l>=0?Ks+l:ar(e)?$a:_l,{radius:e.radius,dynamic:e.mass>0,sphere:a,size:[e.size[0],e.size[1],e.size[2]],hull:n}}}writeJoint(e,t,i){let r=new Float32Array(pe),o=t.bodyA?i.get(t.bodyA):-1,a=i.get(t.bodyB);t instanceof ke?(r.set(t.penaltyLin,ci),r[ci+3]=$t(t.broken?0:t.stiffnessLin),r.set(t.penaltyAng,es),r[es+3]=$t(t.broken?0:t.stiffnessAng),r.set(t.lambdaLin,dr),r[dr+3]=$t(t.fracture),r.set(t.lambdaAng,hr),r[hr+3]=t.torqueArm,r.set(t.C0Lin,Pl),r.set(t.C0Ang,Ll),r.set(t.rA,ui),r.set(t.rB,pr)):(r[ci+3]=t.stiffness,r.set(t.rA,ui),r[ui+3]=t.rest,r.set(t.rB,pr)),this.info.set([t instanceof ke?is:br,o,a,0],e*4),this.device.queue.writeBuffer(this.jointBuffer,e*pe*4,r),this.device.queue.writeBuffer(this.infoBuffer,e*16,this.info,e*4,4),this.noCollide(o,a,e)}noCollide(e,t,i){e<0||(this.pendingEntries.push([Math.max(e,t),Math.min(e,t),i]),this.noCollideDirty=!0)}uploadStatics(){if(this.radiiDirty){let r=this.bodyCount,o=new Float64Array(r);for(let c=0;c<r;c++)o[c]=this.bodies[c].radius;let a=Xa(o),n=1/0;for(let c=0;c<r;c++)o[c]>a&&(n=Math.min(n,o[c]));let l=n===1/0?a*1.5:(a+n)/2;this.maxSmallRadius=l,this.cellSize=Math.max(2*a*(1+1e-4),.001),this.large=[];for(let c=0;c<r;c++)this.bodies[c].radius>l&&this.large.push(c);this.radiiDirty=!1}if(this.noCollideDirty){let r=(l,c)=>l[0]-c[0]||l[1]-c[1],o=this.releasedSlots.size?this.entries.filter(l=>!this.releasedSlots.has(l[2])):this.entries;this.releasedSlots.clear();let a=this.pendingEntries.sort(r);this.pendingEntries=[];let n=[];for(let l=0,c=0;l<o.length||c<a.length;)c>=a.length||l<o.length&&r(o[l],a[c])<=0?n.push(o[l++]):n.push(a[c++]);this.entries=n,this.noCollideDirty=!1}let{large:e,entries:t}=this;this.largeCount=e.length,this.noCollideCount=t.length;let i=new Uint32Array(Math.max(e.length+3*t.length,4));i.set(e,0),t.forEach((r,o)=>i.set(r,e.length+3*o)),this.staticBuffer.size<i.byteLength&&(this.staticBuffer.destroy(),this.staticBuffer=this.device.createBuffer({label:"statics",size:i.byteLength,usage:Pe()}),this.rebuildBindings()),this.device.queue.writeBuffer(this.staticBuffer,0,i)}seedFrom(e){if(this.refToGpu.some((m,h)=>m!==h))throw new Error("seedFrom needs spatialSort: false");let t=new Map(e.bodies.map((m,h)=>[m,h]));this.writeBodies(0,e.bodies);let i=0;for(let m of e.forces)(m instanceof ke||m instanceof dt)&&this.writeJoint(i++,m,t);if(i!==this.jointCount)throw new Error("seedFrom: joints differ from the reference");let r=e.forces.filter(m=>m instanceof ai),o=r.reduce((m,h)=>m+h.contacts.length,0);if(o>this.contactCapacity||r.length>this.manifoldCapacity)throw new Error("seedFrom: too many contacts");let a=new ArrayBuffer(Math.max(o,1)*Ht*4),n=new Uint32Array(a),l=new Float32Array(a),c=new ArrayBuffer(Math.max(r.length,1)*Nt*4),u=new Uint32Array(c),f=new Float32Array(c),d=0;r.forEach((m,h)=>{u.set([t.get(m.bodyA),t.get(m.bodyB),d,m.contacts.length],h*Nt),f.set([m.basis[0],m.basis[1],m.basis[2],m.friction],h*Nt+Js);for(let g of m.contacts){let b=d++*Ht;l.set(g.rA,b+mr),n[b+mr+3]=g.feature>>>0|(g.stick?ts:0),l.set([...g.rB,g.C0[0]],b+Xs),l.set([...g.penalty,g.C0[1]],b+Ys),l.set([...g.lambda,g.C0[2]],b+Qs)}}),this.device.queue.writeBuffer(this.contactBuffers[1-this.parity],0,a),this.device.queue.writeBuffer(this.manifoldBuffers[1-this.parity],0,c);let p=new Uint32Array(16);p[1]=o,p[gr]=r.length,this.device.queue.writeBuffer(this.counterBuffer,0,p)}sequentialColors(){let e=new Uint32Array(this.bodyCount).fill(255),t=0;for(let i=this.bodyCount-1;i>=0;i--)this.bodies[i].dynamic&&(e[i]=t++);if(t>64)throw new Error(`sequentialColors: ${t} dynamic bodies, at most ${64}`);return e}acquireHull(e){!this.hullShaders&&!this.contactShaders.custom&&(this.contactShaders.make(Rl),this.hullShaders=!0);let t=this.hullSlots.get(e);if(t)return t.refs++,t.offset;let i=2+e.vertices.length/3+2*e.faces.length+Math.ceil(e.faces.reduce((a,n)=>a+n.verts.length,0)/4)+e.edges.length,r=-1,o=this.hullFree.findIndex(a=>a.size>=i);if(o>=0){let a=this.hullFree[o];r=a.offset,a.size===i?this.hullFree.splice(o,1):Object.assign(a,{offset:a.offset+i,size:a.size-i})}else r=this.hullTop,this.hullTop+=i,this.hullTop>this.hullCapacity&&this.growHulls(this.hullTop);if(r+Ks>=2**24)throw new Error("hull buffer beyond 2^24 vec4s");return this.device.queue.writeBuffer(this.hullBuffer,r*16,gf(e,r)),this.hullSlots.set(e,{offset:r,size:i,refs:1}),r}releaseHull(e){let t=this.hullSlots.get(e);if(!t||--t.refs>0)return;this.hullSlots.delete(e),this.hullFree.push({offset:t.offset,size:t.size}),this.hullFree.sort((r,o)=>r.offset-o.offset);let i=[];for(let r of this.hullFree){let o=i[i.length-1];o&&o.offset+o.size===r.offset?o.size+=r.size:i.push({...r})}this.hullFree=i}growHulls(e){let t=this.hullCapacity;for(;t<e;)t*=2;let i=this.device.createBuffer({label:"hulls",size:t*16,usage:Pe()}),r=this.device.createCommandEncoder();r.copyBufferToBuffer(this.hullBuffer,0,i,0,this.hullCapacity*16),this.device.queue.submit([r.finish()]),this.hullBuffer.destroy(),this.hullBuffer=i,this.hullCapacity=t,this.contactBuffers&&this.rebuildBindings()}addBody(e){return this.addBodies([e])}addBodies(e){let t=Math.min(e.length,this.bodyCapacity-this.bodyCount);if(t<=0)return-1;let i=this.bodyCount;return this.bodyCount+=t,this.writeBodies(i,e.slice(0,t)),this.device.queue.writeBuffer(this.colorBuffer,i*4,new Uint32Array(t).fill(255)),this.adjScan.destroy(),this.adjScan=new tt(this.device,this.adjBuffer,0,this.bodyCount+1),i}appendJoint(e,t,i,r,o,a){let n=this.jointCount;n>=this.jointCapacity&&this.allocateJoints(this.jointCapacity*2),this.jointCount++;let l=new Float32Array(pe);l[ci+3]=$t(o),l[es+3]=$t(a),l[dr+3]=3e38,l.set([i[0],i[1],i[2]],ui),l.set([r[0],r[1],r[2]],pr);let c=e>=0?this.bodies[e].size:[0,0,0],u=this.bodies[t].size;return l[hr+3]=(c[0]+u[0])**2+(c[1]+u[1])**2+(c[2]+u[2])**2,this.info.set([is,e,t,0],n*4),this.device.queue.writeBuffer(this.jointBuffer,n*pe*4,l),this.device.queue.writeBuffer(this.infoBuffer,n*16,this.info,n*4,4),this.noCollide(e,t,n),n}appendJoints(e,t,i=!1){return this.appendConstraints(e.length,(r,o)=>{let{a,b:n,rA:l,rB:c,angular:u}=e[r];o[ci+3]=3e38,o[es+3]=u===void 0?3e38:$t(u),o[dr+3]=i?-$t(t):$t(t),o.set([l[0],l[1],l[2]],ui),o.set([c[0],c[1],c[2]],pr);let[f,d]=[this.bodies[a].size,this.bodies[n].size];return o[hr+3]=(f[0]+d[0])**2+(f[1]+d[1])**2+(f[2]+d[2])**2,[is,a,n]})}appendSprings(e){return this.appendConstraints(e.length,(t,i)=>{let{a:r,b:o,rA:a,rB:n,stiffness:l,rest:c}=e[t];return i[ci+3]=$t(l),i.set([a[0],a[1],a[2],c],ui),i.set([n[0],n[1],n[2]],pr),[br,r,o]})}appendConstraints(e,t){let i=[];if(this.freeSlots.length)for(this.freeSlots.sort((n,l)=>l-n);i.length<e&&this.freeSlots.length;)i.push(this.freeSlots.pop());let r=e-i.length,o=this.jointCapacity;for(;this.jointCount+r>o;)o*=2;o>this.jointCapacity&&this.allocateJoints(o);for(let n=0;n<r;n++)i.push(this.jointCount++);let a=new Float32Array(e*pe);for(let n=0;n<e;n++){let[l,c,u]=t(n,a.subarray(n*pe,(n+1)*pe));this.info.set([l,c,u,0],i[n]*4),this.releasedSlots.delete(i[n]),this.noCollide(c,u,i[n])}for(let n=0;n<e;){let l=n+1;for(;l<e&&i[l]===i[l-1]+1;)l++;this.device.queue.writeBuffer(this.jointBuffer,i[n]*pe*4,a,n*pe,(l-n)*pe),this.device.queue.writeBuffer(this.infoBuffer,i[n]*16,this.info,i[n]*4,(l-n)*4),n=l}return i}releaseJoints(e){let t=[...new Set(Array.from(e))].filter(r=>r<this.jointCount&&this.info[r*4]!==0).sort((r,o)=>r-o);if(!t.length)return;for(let r of t)this.info.set([0,-1,-1,0],r*4),this.releasedSlots.add(r),this.freeSlots.push(r);let i=new Float32Array(0);for(let r=0;r<t.length;){let o=r+1;for(;o<t.length&&t[o]===t[o-1]+1;)o++;i.length<(o-r)*pe&&(i=new Float32Array((o-r)*pe)),this.device.queue.writeBuffer(this.jointBuffer,t[r]*pe*4,i,0,(o-r)*pe),this.device.queue.writeBuffer(this.infoBuffer,t[r]*16,this.info,t[r]*4,(o-r)*4),r=o}this.noCollideDirty=!0}rewriteBodies(e,t){for(let i=0;i<e.length;){let r=i+1;for(;r<e.length&&e[r]===e[r-1]+1;)r++;this.writeBodies(e[i],t.slice(i,r)),this.device.queue.writeBuffer(this.colorBuffer,e[i]*4,new Uint32Array(r-i).fill(255)),i=r}}setFilters(e,t,i){for(let r=0;r<e.length;){let o=r+1;for(;o<e.length&&e[o]===e[o-1]+1;)o++;let a=new Uint32Array(2*(o-r));for(let n=r;n<o;n++)a.set([t[n]>>>0,i[n]>>>0],2*(n-r));this.device.queue.writeBuffer(this.filterBuffer,e[r]*8,a),r=o}}setWorldAnchor(e,t){this.device.queue.writeBuffer(this.jointBuffer,(e*pe+ui)*4,new Float32Array([t[0],t[1],t[2]]))}disableConstraint(e){this.device.queue.writeBuffer(this.jointBuffer,(e*pe+ci)*4,new Float32Array(8)),this.device.queue.writeBuffer(this.jointBuffer,(e*pe+dr)*4,new Float32Array(3)),this.device.queue.writeBuffer(this.jointBuffer,(e*pe+hr)*4,new Float32Array(3))}profileNextStep(e){this.timing&&!this.timingBusy&&(this.timingCallback=e)}writeParams(){let e=this.params,t=this.bodyCapacity,i=new ArrayBuffer(ls*4),r=new Float32Array(i),o=new Uint32Array(i);r[0]=e.dt,r[1]=e.gravity,r[2]=e.betaLin,r[3]=e.betaAng,r[4]=e.gamma,r[5]=e.alpha,o[6]=(e.matchNearest?rs:0)|(e.faceBias?ss:0)|(e.reuseContacts?os:0)|(e.startAtRest?as:0)|(e.massPenalty?ns:0),o[7]=this.bodyCount,o[8]=this.jointCount,o[9]=this.colorCap,r[10]=this.cellSize,o[11]=this.tableSize-1,r[12]=this.maxSmallRadius,o[13]=this.largeCount,o[14]=this.noCollideCount,o[15]=this.pairCapacity,o[16]=this.contactCapacity,o[17]=this.hashSize-1,o[18]=t+1,o[19]=2*t+1,o[20]=this.tableSize+1,o[21]=2*this.tableSize+1,o[22]=2*this.tableSize+1+t,o[23]=t,o[24]=this.colorHistOffset,o[25]=2*t,o[26]=this.colorGroups,o[27]=2*t+65,o[28]=this.colorRounds,o[29]=this.manifoldCapacity,o[30]=this.stepCount;let a=n=>Math.min(31,Math.max(0,Math.round(Math.log2(n))));o[31]=a(this.primalLanes[0])|a(this.primalLanes[1])<<8|a(this.primalLanes[2])<<16,r.set([e.windSpeed*Math.cos(e.windAngle),e.windSpeed*Math.sin(e.windAngle),0,e.windPressure,e.windGust],32),r.set([e.up[0],e.up[1],e.up[2],0],40),this.device.queue.writeBuffer(this.paramsBuffer,0,i)}writePassConstants(e,t){let i=this.colorCap+1,r=Math.max(e*i,1);(r>this.passEntries||!this.passGroup)&&(this.passBuffer?.destroy(),this.passBuffer=this.device.createBuffer({label:"pass constants",size:r*256,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.passEntries=r,this.passGroup=this.device.createBindGroup({layout:this.layouts.pass,entries:[{binding:0,resource:{buffer:this.passBuffer,size:16}}]}));let o=new ArrayBuffer(r*256),a=new Uint32Array(o),n=new Float32Array(o);for(let l=0;l<e;l++)for(let c=0;c<=this.colorCap;c++){let u=(l*i+c)*256/4;a[u]=c,n[u+1]=t}this.device.queue.writeBuffer(this.passBuffer,0,o)}step(){(this.radiiDirty||this.noCollideDirty)&&this.uploadStatics();let e=this.params;this.fixedColors&&(this.device.queue.writeBuffer(this.colorBuffer,0,this.fixedColors),this.colorCap=Math.max(1,...this.fixedColors.map(y=>y===255?0:y+1))),this.stepCount++,this.writeParams(),this.writePassConstants(e.iterations,e.alpha);let t=this.parity,i=this.bodyCapacity,r=this.bodyCount,o=this.jointCount,a=this.device.createCommandEncoder({label:"avbd3d step"});a.clearBuffer(this.gridBuffer,0,(2*this.tableSize+1)*4),a.clearBuffer(this.tableBuffer),a.clearBuffer(this.adjBuffer,0,(2*i+1)*4);let n=this.timingCallback!==null&&this.timing!==null,l,c=0,u=n||this.splitPasses,f=()=>{l&&!u||(l?.end(),l=a.beginComputePass({label:u?Se[c]:"avbd3d step",timestampWrites:n?{querySet:this.timing.querySet,beginningOfPassWriteIndex:2*c,endOfPassWriteIndex:2*c+1}:void 0}),c++)},d=this.groups,p=(y,A,v)=>{v<=0||(l.setPipeline(this.pipes[y]),l.setBindGroup(0,A),l.dispatchWorkgroups(v))},m=(y,A,v)=>{l.setPipeline(this.pipes[y]),l.setBindGroup(0,A),l.dispatchWorkgroupsIndirect(this.argsBuffer,v*4)};if(f(),p("beginFrame",d.broad,1),e.reuseContacts&&p("updateRefs",d.refs,ht(r)),p("argsPrev",d.args,1),m("hashInsert",d.contacts[t],6),p("gridCount",d.broad,ht(r)),this.gridScan.encode(l),p("gridScatter",d.broad,ht(r)),p("findPairs",d.broad,ht(r)),p("argsPairs",d.args,1),m("narrowphase",d.contacts[t],0),p("argsContacts",d.args,1),f(),p("degreeJoints",d.topo[t],ht(o)),m("degreeContacts",d.topo[t],3),this.adjScan.encode(l),p("fillJoints",d.topo[t],ht(o)),m("fillContacts",d.topo[t],3),p("sortAdjacency",d.topo[t],ht(r)),f(),!this.fixedColors){p("colorCompact",d.topo[t],ht(r)),p("colorMark",d.topo[t],ht(r));for(let y=0;y<this.colorRounds;y++)p(y%2===0?"colorRoundAB":"colorRoundBA",d.topo[t],ht(r))}p("colorCount",d.topo[t],this.colorGroups),this.colorHistScan.encode(l),p("colorStarts",d.topo[t],1),p("argsColors",d.args,1),p("colorScatter",d.topo[t],this.colorGroups),f();let h=this.colorCap+1,g=y=>l.setBindGroup(1,this.passGroup,[y*256]);l.setBindGroup(0,d.solve[t]),g(0),o>0&&(l.setPipeline(this.pipes.warmStartJoints),l.dispatchWorkgroups(ht(o))),l.setPipeline(this.pipes.warmStartBodies),l.dispatchWorkgroups(ht(r));for(let y=0;y<e.iterations;y++){l.setPipeline(this.pipes.primal);for(let A=0;A<this.colorCap;A++)g(y*h+A),l.dispatchWorkgroupsIndirect(this.argsBuffer,(12+3*A)*4);g(y*h+this.colorCap),l.setPipeline(this.pipes.dual),l.dispatchWorkgroupsIndirect(this.argsBuffer,36)}l.setPipeline(this.pipes.updateVelocities),l.dispatchWorkgroups(ht(r)),l.end();let b=2*Se.length;if(n){let{querySet:y,resolve:A,read:v}=this.timing;a.resolveQuerySet(y,0,b,A,0),a.copyBufferToBuffer(A,0,v,0,b*8)}if(this.device.queue.submit([a.finish()]),this.parity=1-t,n){let y=this.timingCallback;this.timingCallback=null,this.timingBusy=!0;let A=this.timing.read;A.mapAsync(GPUMapMode.READ).then(()=>{let v=new BigUint64Array(A.getMappedRange()).slice();if(A.unmap(),this.timingBusy=!1,this.destroyed)return this.releaseTiming();let x=(B,L)=>Number(v[L]-v[B])/1e6,w={total:x(0,b-1)};Se.forEach((B,L)=>w[B]=x(2*L,2*L+1)),y(w)},()=>{this.timingBusy=!1,this.destroyed&&this.releaseTiming()})}}async readBodies(){return new Float32Array(await this.read(this.bodyBuffer,this.bodyCount*We*4))}async readJoints(){return new Float32Array(await this.read(this.jointBuffer,this.jointCount*pe*4))}async readCounters(){let e=new Uint32Array(await this.read(this.counterBuffer,64));return{pairs:e[0],contacts:e[1],manifolds:e[gr],overflow:e[3],clashes:e[4],colors:e[5]}}async readContactList(){let e=await this.readCounters(),t=Math.min(e.manifolds,this.manifoldCapacity),i=Math.min(e.contacts,this.contactCapacity),r=1-this.parity,[o,a]=await Promise.all([this.read(this.manifoldBuffers[r],t*Nt*4),this.read(this.contactBuffers[r],i*Ht*4)]),n=new Uint32Array(o),l=new Float32Array(o),c=new Uint32Array(a),u=new Float32Array(a),f=[];for(let d=0;d<t;d++){let p=d*Nt,m=[...l.subarray(p+Js,p+Js+3)];for(let h=n[p+2];h<n[p+2]+(n[p+3]&15);h++){let g=h*Ht,b=c[g+mr+3];f.push({a:n[p],b:n[p+1],feature:(b&~ts)>>>0,stick:(b&ts)!==0,rA:[...u.subarray(g+mr,g+mr+3)],rB:[...u.subarray(g+Xs,g+Xs+3)],pen:[...u.subarray(g+Ys,g+Ys+3)],lam:[...u.subarray(g+Qs,g+Qs+3)],normal:m})}}return f}async readPairs(){let{pairs:e}=await this.readCounters();return new Uint32Array(await this.read(this.pairBuffer,Math.min(e,this.pairCapacity)*8))}jointInfo(){return this.info.subarray(0,this.jointCount*4)}adapt(e){if(this.fixedColors)return;let t=e.colors;e.clashes>0&&(this.colorRounds=Math.min(32,this.colorRounds*2)),e.clashes>0||this.colorCap-t<2?(this.colorCap=Math.min(64,Math.max(t+io+2,this.colorCap+4)),this.shrinkVotes=0):t+io+2<this.colorCap||this.colorRounds>4?++this.shrinkVotes>=3&&(this.colorCap=Math.min(64,t+io),this.colorRounds=Math.max(4,this.colorRounds-4),this.shrinkVotes=0):this.shrinkVotes=0;let i=(n,l,c)=>(e.overflow&c)!==0||n>df*l?Math.max(hf*n,1.25*l):l,r=i(e.contacts,this.contactCapacity,2),o=i(e.pairs,this.pairCapacity,1),a=i(e.manifolds,this.manifoldCapacity,4);this.capacityCanGrow(r,o,a)&&this.allocateContacts(r,o,a)}capacityCanGrow(e,t,i){let r=this.device.limits.maxStorageBufferBindingSize;return Math.min(e,r/(Ht*4))>this.contactCapacity||Math.min(t,r/8)>this.pairCapacity||Math.min(i,t,r/(Nt*4))>this.manifoldCapacity}async read(e,t){if(t===0)return new ArrayBuffer(0);let i=this.device.createBuffer({size:t,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),r=this.device.createCommandEncoder();r.copyBufferToBuffer(e,0,i,0,t),this.device.queue.submit([r.finish()]),await i.mapAsync(GPUMapMode.READ);let o=i.getMappedRange().slice(0);return i.unmap(),i.destroy(),o}releaseTiming(){this.timing?.resolve.destroy(),this.timing?.read.destroy(),this.timing?.querySet.destroy()}destroy(){this.ownsBodyBuffer&&this.bodyBuffer.destroy();let e=[this.jointBuffer,this.infoBuffer,...this.contactBuffers,...this.manifoldBuffers,this.pairBuffer,this.tableBuffer,this.gridBuffer,this.staticBuffer,this.counterBuffer,this.argsBuffer,this.adjBuffer,this.colorBuffer,this.paramsBuffer,this.refBuffer,this.hullBuffer,this.passBuffer,this.filterBuffer];for(let t of e)t?.destroy();this.destroyed=!0,this.timingBusy||this.releaseTiming(),this.gridScan.destroy(),this.colorHistScan.destroy(),this.adjScan?.destroy()}};var jl=`  e.C = vec3f(
    k.c0x * keep + dot(n, A.dLin) - dot(n, B.dLin) + dot(cross(e.rAW, n), A.dAng) + dot(cross(e.rBW, -n), B.dAng),
    k.c0y * keep + dot(t1, A.dLin) - dot(t1, B.dLin) + dot(cross(e.rAW, t1), A.dAng) + dot(cross(e.rBW, -t1), B.dAng),
    k.c0z * keep + dot(t2, A.dLin) - dot(t2, B.dLin) + dot(cross(e.rAW, t2), A.dAng) + dot(cross(e.rBW, -t2), B.dAng));`;if(Ge.split(jl).length!==2)throw Error("Pinned contact evaluation changed; review the app kernel variant");var us=Ge.replace(jl,`  let delta = A.dLin - B.dLin + cross(A.dAng, e.rAW) - cross(B.dAng, e.rBW);
  e.C = vec3f(k.c0x, k.c0y, k.c0z) * keep + vec3f(dot(n, delta), dot(t1, delta), dot(t2, delta));`);function St(s,e,t){if(s.split(e).length!==2)throw Error("Pinned solve layout changed; review the app kernel variant");return s.replace(e,t)}var so=(()=>{let s=St(us,"  var e = adj[i] + lane;",`  let begin = adj[i];
  var e = begin;`);return s=St(s,`    if (c == cEnd) {
`,`    if (c >= cEnd) {
`),s=St(s,`      e += lanes;
      if (id < params.jointCount) {
        addJoint(&acc, id, pc.alpha, i);`,`      e++;
      if (id < params.jointCount) {
        if ((e - begin - 1u) % lanes != lane) { continue; }
        addJoint(&acc, id, pc.alpha, i);`),s=St(s,"      isA = i == mf.ids.x;",`      c = mf.ids.z + lane;
      cEnd = mf.ids.z + pairCount(mf);
      if (c >= cEnd) { continue; }
      isA = i == mf.ids.x;`),s=St(s,`      c = mf.ids.z;
      cEnd = mf.ids.z + pairCount(mf);
      if (c == cEnd) { continue; }`,""),s=St(s,"    c++;","    c += lanes;"),s})();function sn(s=Ge){s=St(s,"fn manifoldCount() -> u32 {",`fn solverStepValid() -> bool {
  return counters[C_OVERFLOW] == 0u && counters[C_CLASHES] == 0u;
}


fn manifoldCount() -> u32 {`);for(let[e,t]of[["warmStartJoints","global_invocation_id"],["warmStartBodies","global_invocation_id"],["dual","global_invocation_id"],["updateVelocities","global_invocation_id"]]){let i=`fn ${e}(@builtin(${t}) gid: vec3u) {`;s=St(s,i,`${i}
  if (!solverStepValid()) { return; }`)}return St(s,"  let live = k < count;","  let live = k < count && solverStepValid();")}function on(s){return s=St(s,"  return qsub(rotA(a), bodies[b].rot) * k.lamAng.w;",`  let rest = vec4f(k.c0Lin.w, k.c0Ang.w, k.rA.w, k.rB.w);
  var restTarget = rotA(a);
  if (dot(rest, rest) > 0.5) {
    restTarget = vec4f(restTarget.w * rest.xyz + rest.w * restTarget.xyz + cross(restTarget.xyz, rest.xyz),
      restTarget.w * rest.w - dot(restTarget.xyz, rest.xyz));
  }
  return qsub(restTarget, bodies[b].rot) * k.lamAng.w;`),s=St(s,"k.c0Lin = vec4f(jointLinC(k, a, b), 0.0);","k.c0Lin = vec4f(jointLinC(k, a, b), k.c0Lin.w);"),St(s,"k.c0Ang = vec4f(jointAngC(k, a, b), 0.0);","k.c0Ang = vec4f(jointAngC(k, a, b), k.c0Ang.w);")}var Dl=`// Capture new constraints from live GPU poses; no stale mesh poses or readback.
struct Body { pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f }
struct Joint { penLin:vec4f,penAng:vec4f,lamLin:vec4f,lamAng:vec4f,c0Lin:vec4f,c0Ang:vec4f,rA:vec4f,rB:vec4f }
@group(0) @binding(0) var<storage,read> bodies:array<Body>;
@group(0) @binding(1) var<storage,read_write> joints:array<Joint>;
@group(0) @binding(2) var<storage,read> info:array<vec4i>;
@group(0) @binding(3) var<storage,read> commands:array<vec4u>;
fn rotate(q:vec4f,v:vec3f)->vec3f {let t=2.*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
@compute @workgroup_size(64) fn capture(@builtin(global_invocation_id) id:vec3u) {
  if(id.x>=arrayLength(&commands)){return;}
  let slot=commands[id.x].x; let kind=commands[id.x].y;
  let a=info[slot].y; let b=info[slot].z;
  if(kind==0u){
    var inv=vec4f(0.,0.,0.,1.);
    if(a>=0){let q=bodies[a].rot;inv=vec4f(-q.xyz,q.w);}
    let q=bodies[b].rot;
    let rest=normalize(vec4f(inv.w*q.xyz+q.w*inv.xyz+cross(inv.xyz,q.xyz),inv.w*q.w-dot(inv.xyz,q.xyz)));
    joints[slot].c0Lin.w=rest.x; joints[slot].c0Ang.w=rest.y;
    joints[slot].rA.w=rest.z; joints[slot].rB.w=rest.w;
  } else {
    let pa=bodies[a].pos.xyz+rotate(bodies[a].rot,joints[slot].rA.xyz);
    let pb=bodies[b].pos.xyz+rotate(bodies[b].rot,joints[slot].rB.xyz);
    joints[slot].rA.w=length(pa-pb);
  }
}
`;function hi(s){let e=new ArrayBuffer(s*4);return{f:new Float32Array(e),u:new Uint32Array(e),previous:new Uint32Array(s),buffer:null,uploads:0,bytes:0}}function Qt(s,e,t){let{u:i,previous:r}=t,o=0,a=i.length-1;if(t.buffer===e){for(;o<=a&&i[o]===r[o];)o++;for(;a>=o&&i[a]===r[a];)a--;if(o>a)return}s.queue.writeBuffer(e,o*4,i,o,a-o+1),r.set(i),t.buffer=e,t.uploads++,t.bytes+=(a-o+1)*4}var Gl=`// Conservative GPU sleeping. Resting contacts form supports from the ground
// upward. Any impact, moving joint endpoint or explicit edit wakes the world.
// This deliberately favors reliable waking over finely partitioned islands.
struct Body { pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f }
struct State { mass:f32, quiet:f32, asleep:u32, support:atomic<u32>, eligible:u32, pad0:u32, pad1:u32, pad2:u32 }
struct Manifold { ids:vec4u, geo:vec4f }
struct Params { count:u32,joints:u32,manifolds:u32,forceWake:u32,speed:f32,delay:f32,dt:f32,gravity:f32,up:vec4f }
@group(0) @binding(0) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(1) var<storage,read_write> states:array<State>;
@group(0) @binding(2) var<storage,read> info:array<vec4i>;
@group(0) @binding(3) var<storage,read> manifolds:array<Manifold>;
@group(0) @binding(4) var<storage,read> counters:array<u32>;
@group(0) @binding(5) var<storage,read_write> globals:array<atomic<u32>>;
@group(0) @binding(6) var<uniform> params:Params;
fn speed(i:u32)->f32 {return length(bodies[i].velocity.xyz)+length(bodies[i].angular.xyz)*bodies[i].moment.w;}
fn wake(i:u32) {if(states[i].mass>0.){bodies[i].size.w=states[i].mass;states[i].asleep=0u;states[i].quiet=0.;states[i].pad2=0u;}}
@compute @workgroup_size(64) fn before(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;if(i>=params.count){return;}
  if(params.forceWake!=0u||atomicLoad(&globals[0])!=0u||(states[i].pad2&2u)!=0u){wake(i);}
  atomicStore(&states[i].support,0u);
}
@compute @workgroup_size(1) fn clear() {atomicStore(&globals[0],0u);atomicStore(&globals[1],0u);}
fn impact(a:u32,b:u32) {
  if(states[a].asleep!=0u && states[b].asleep==0u && speed(b)>2.*params.speed){atomicStore(&globals[0],1u);}
}
fn signalWake(i:u32){atomicStore(&globals[0],1u);}
@compute @workgroup_size(64) fn contacts(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;if(i>=min(counters[6],params.manifolds)){return;}
  let m=manifolds[i];if((m.ids.w&15u)==0u || (m.ids.w&0x80000000u)!=0u){return;}
  let a=m.ids.x;let b=m.ids.y;
  manifoldImpact(m);
  let up=dot(m.geo.xyz,params.up.xyz);
  if(up>0.3){support(a,b);}
  if(up < -0.3){support(b,a);}
}
@compute @workgroup_size(64) fn joints(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;if(i>=params.joints){return;}let j=info[i];if(j.x==0||j.y<0){return;}
  impact(u32(j.y),u32(j.z));impact(u32(j.z),u32(j.y));
}
@compute @workgroup_size(64) fn rest(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;if(i>=params.count||states[i].mass<=0.){return;}
  if(states[i].eligible==0u){wake(i);return;}
  if(atomicLoad(&globals[0])!=0u || counters[3]!=0u || counters[4]!=0u){wake(i);return;}
  states[i].pad2=select(0u,1u,speed(i)<=params.speed && (params.gravity==0. || atomicLoad(&states[i].support)!=0u));
  if(states[i].asleep==0u){
    if(speed(i)<=params.speed && (params.gravity==0. || atomicLoad(&states[i].support)!=0u)) {states[i].quiet+=params.dt;}
    else {states[i].quiet=0.;}
    if(states[i].quiet>=params.delay){
      states[i].asleep=1u;bodies[i].size.w=0.;bodies[i].velocity=vec4f(0.);bodies[i].angular=vec4f(vec3f(0.),bodies[i].angular.w);
    }
  }
  if(states[i].asleep!=0u){atomicAdd(&globals[1],1u);}
}
`;var Fl=`struct Body { pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f }\r
struct State { mass:f32, quiet:f32, asleep:u32, support:atomic<u32>, eligible:u32, parent:atomic<u32>, wake:atomic<u32>, pad2:u32 }\r
struct Manifold { ids:vec4u, geo:vec4f }\r
struct Params { count:u32,joints:u32,manifolds:u32,forceWake:u32,speed:f32,delay:f32,dt:f32,gravity:f32,up:vec4f }\r
@group(0) @binding(0) var<storage,read_write> bodies:array<Body>;\r
@group(0) @binding(1) var<storage,read_write> states:array<State>;\r
@group(0) @binding(2) var<storage,read> info:array<vec4i>;\r
@group(0) @binding(3) var<storage,read> manifolds:array<Manifold>;\r
@group(0) @binding(4) var<storage,read> counters:array<u32>;\r
@group(0) @binding(5) var<storage,read_write> globals:array<atomic<u32>>;\r
@group(0) @binding(6) var<uniform> params:Params;\r
fn speed(i:u32)->f32 {return length(bodies[i].velocity.xyz)+length(bodies[i].angular.xyz)*bodies[i].moment.w;}\r
fn wake(i:u32) {if(states[i].mass>0.){bodies[i].size.w=states[i].mass;states[i].asleep=0u;states[i].quiet=0.;states[i].pad2=0u;}}\r
@compute @workgroup_size(64) fn before(@builtin(global_invocation_id) id:vec3u) {\r
  let i=id.x;if(i>=params.count){return;}\r
  if((params.forceWake&1u)!=0u||atomicLoad(&globals[0])!=0u){wake(i);atomicStore(&states[i].parent,i);}\r
  else if((states[i].pad2&2u)!=0u){wake(i);states[i].pad2|=2u;}\r
  // Rebuild live connectivity after bodies wake or separate. Only sleeping\r
  // subtrees need history, since their static/static contact pairs are omitted.\r
  if(states[i].asleep==0u){atomicStore(&states[i].parent,i);}\r
  if((params.forceWake&2u)!=0u && speed(i)<=params.speed && states[i].eligible!=0u){states[i].pad2|=4u;}\r
  atomicStore(&states[i].wake,0u);\r
  atomicStore(&states[i].support,0u);\r
}\r
@compute @workgroup_size(1) fn clear() {atomicStore(&globals[0],0u);atomicStore(&globals[1],0u);}\r
fn impact(a:u32,b:u32) {\r
  if(states[a].asleep!=0u && states[b].asleep==0u && speed(b)>2.*params.speed){signalWake(a);}\r
}\r
fn signalWake(i:u32){let r=root(i);if(r<params.count){atomicOr(&states[r].wake,1u);}else{atomicStore(&globals[0],1u);}}\r
@compute @workgroup_size(64) fn contacts(@builtin(global_invocation_id) id:vec3u) {\r
  let i=id.x;if(i>=min(counters[6],params.manifolds)){return;}\r
  let m=manifolds[i];if((m.ids.w&15u)==0u || (m.ids.w&0x80000000u)!=0u){return;}\r
  let a=m.ids.x;let b=m.ids.y;\r
  manifoldImpact(m);\r
  let up=dot(m.geo.xyz,params.up.xyz);\r
  if(up>0.3){support(a,b);}\r
  if(up < -0.3){support(b,a);}\r
  if((params.forceWake&2u)!=0u){\r
    if(states[b].mass<=0. && speed(b)<=params.speed && up>0.3 && states[a].mass>0.){atomicOr(&states[root(a)].wake,2u);}\r
    if(states[a].mass<=0. && speed(a)<=params.speed && up< -0.3 && states[b].mass>0.){atomicOr(&states[root(b)].wake,2u);}\r
  }\r
}\r
@compute @workgroup_size(64) fn joints(@builtin(global_invocation_id) id:vec3u) {\r
  let i=id.x;if(i>=params.joints){return;}let j=info[i];if(j.x==0||j.y<0){return;}\r
  impact(u32(j.y),u32(j.z));impact(u32(j.z),u32(j.y));\r
}\r
@compute @workgroup_size(64) fn rest(@builtin(global_invocation_id) id:vec3u) {\r
  let i=id.x;if(i>=params.count||states[i].mass<=0.){return;}\r
  if(states[i].eligible==0u){wake(i);return;}\r
  let r=root(i);\r
  let flags=atomicLoad(&states[min(r,params.count-1u)].wake);\r
  if(r>=params.count || (flags&1u)!=0u || atomicLoad(&globals[0])!=0u || counters[3]!=0u || counters[4]!=0u){wake(i);return;}\r
  let initiallyQuiet=(states[i].pad2&4u)!=0u;\r
  let held=(states[i].pad2&2u)!=0u;\r
  states[i].pad2=select(0u,1u,speed(i)<=params.speed && (params.gravity==0. || atomicLoad(&states[i].support)!=0u));\r
  if(states[i].asleep==0u){\r
    if(speed(i)<=params.speed && (params.gravity==0. || atomicLoad(&states[i].support)!=0u)) {states[i].quiet+=params.dt;}\r
    else {states[i].quiet=0.;}\r
    if(!held && ((states[i].quiet>=params.delay && (flags&4u)==0u) || ((params.forceWake&2u)!=0u && initiallyQuiet && (flags&6u)==2u))){\r
      states[i].asleep=1u;bodies[i].size.w=0.;bodies[i].velocity=vec4f(0.);bodies[i].angular=vec4f(vec3f(0.),bodies[i].angular.w);\r
    }\r
  }\r
  if(states[i].asleep!=0u){atomicAdd(&globals[1],1u);}\r
}\r
// Startup sleep is restricted to contact islands connected to stationary solid\r
// support, with no moving or sleep-excluded member. Floating groups stay awake.\r
@compute @workgroup_size(64) fn activity(@builtin(global_invocation_id) id:vec3u){\r
  let i=id.x;if(i>=params.count||states[i].mass<=0.){return;}\r
  var busy=false;\r
  if((params.forceWake&2u)!=0u){busy=(states[i].pad2&4u)==0u;}\r
  else if(states[i].asleep==0u){\r
    busy=speed(i)>params.speed;\r
    if(states[i].eligible!=0u && (states[i].pad2&2u)==0u){\r
      busy=busy || states[i].quiet+params.dt<params.delay || (params.gravity!=0. && atomicLoad(&states[i].support)==0u);\r
    }\r
  }\r
  if(busy){let r=root(i);if(r<params.count){atomicOr(&states[r].wake,4u);}}\r
}\r
\r
// Dynamic connectivity is conservative: unions persist while asleep because\r
// collision detection intentionally omits pairs of sleeping bodies. The\r
// awake bodies rebuild their links each step. Shared static ground never joins\r
// otherwise independent piles. No thread waits for another workgroup.\r
fn root(index:u32)->u32 {\r
  var i=index;\r
  for(var attempt=0u;attempt<256u;attempt++) {\r
    if(i>=params.count){atomicStore(&globals[0],1u);return params.count;}\r
    let p=atomicLoad(&states[i].parent);\r
    if(p==i){return i;}\r
    if(p>i){atomicStore(&globals[0],1u);return params.count;}\r
    let gp=atomicLoad(&states[p].parent);\r
    atomicMin(&states[i].parent,gp);\r
    i=gp;\r
  }\r
  // Excessive depth is a safe wake-all fallback, never a cross-group wait.\r
  atomicStore(&globals[0],1u);return params.count;\r
}\r
fn connect(a:u32,b:u32) {\r
  if(a>=params.count || b>=params.count || states[a].mass<=0. || states[b].mass<=0.){return;}\r
  for(var attempt=0u;attempt<256u;attempt++) {\r
    let ra=root(a);let rb=root(b);\r
    if(ra==rb || ra>=params.count || rb>=params.count){return;}\r
    let hi=max(ra,rb);let lo=min(ra,rb);\r
    let result=atomicCompareExchangeWeak(&states[hi].parent,hi,lo);\r
    if(result.exchanged){return;}\r
  }\r
  atomicStore(&globals[0],1u);\r
}\r
@compute @workgroup_size(64) fn connectContacts(@builtin(global_invocation_id) id:vec3u){\r
  let i=id.x;if(i>=min(counters[6],params.manifolds)){return;}\r
  let m=manifolds[i];if((m.ids.w&15u)==0u || (m.ids.w&0x80000000u)!=0u){return;}\r
  connect(m.ids.x,m.ids.y);\r
}\r
@compute @workgroup_size(64) fn connectJoints(@builtin(global_invocation_id) id:vec3u){\r
  let i=id.x;if(i>=params.joints){return;}let j=info[i];\r
  if(j.x!=0 && j.y>=0 && j.z>=0){connect(u32(j.y),u32(j.z));}\r
}\r
`;var Ul=`struct Contact {rA:vec3f,key:u32,rB:vec3f,c0x:f32,pen:vec3f,c0y:f32,lam:vec3f,c0z:f32}
@group(0) @binding(7) var<storage,read> contactPoints:array<Contact>;
fn rotated(q:vec4f,r:vec3f)->vec3f {return r+2.*cross(q.xyz,cross(q.xyz,r)+q.w*r);}
fn contactVelocity(i:u32,r:vec3f,previous:bool)->vec3f {
  var v=bodies[i].velocity.xyz;
  var w=bodies[i].angular.xyz;
  var q=bodies[i].rot;
  if(previous){
    // The inertial target retains the incoming velocity after the solve. Remove
    // this step's gravity increment so resting contacts do not count as impacts.
    v=(bodies[i].inertialPos.xyz-bodies[i].initialPos.xyz)/params.dt;
    if(bodies[i].size.w>0.){v-=params.up.xyz*(params.gravity*params.dt);}
    let a=bodies[i].inertialRot;let b=bodies[i].initialRot;
    w=2.*(-a.w*b.xyz+b.w*a.xyz-cross(a.xyz,b.xyz))/(dot(b,b)*params.dt);
    q=b;
  }
  return v+cross(w,rotated(q,r));
}
fn manifoldImpact(m:Manifold){
  let a=m.ids.x;let b=m.ids.y;
  if(states[a].asleep==states[b].asleep){return;}
  // A rotating face can approach at one corner while its first contact recedes.
  for(var k=0u;k<(m.ids.w&15u);k++){
    let c=contactPoints[m.ids.z+k];
    contactImpact(a,b,m.geo.xyz,c.rA,c.rB);contactImpact(b,a,-m.geo.xyz,c.rB,c.rA);
  }
}
fn contactImpact(a:u32,b:u32,n:vec3f,rA:vec3f,rB:vec3f) {
  if(states[a].asleep==0u || states[b].asleep!=0u){return;}
  let incoming=dot(contactVelocity(b,rB,true)-contactVelocity(a,rA,true),n);
  let outgoing=dot(contactVelocity(b,rB,false)-contactVelocity(a,rA,false),n);
  if(max(incoming,outgoing)>2.*params.speed){signalWake(a);}
}
fn support(a:u32,b:u32) {
  // Grounded, quiet awake bodies can support the next course. This lets a stack
  // accumulate quiet time together instead of stopping one course at a time.
  if(states[b].mass<=0. || states[b].asleep!=0u || ((states[b].pad2&1u)!=0u && speed(b)<=params.speed)) {
    atomicStore(&states[a].support,1u);
  }
}
`;var an=class{constructor(e){this.device=e,this.targets=new Map,this.bits=new Float32Array(1),this.words=new Uint32Array(this.bits.buffer)}target(e){let t=this.targets.get(e);return t||this.targets.set(e,t={pending:new Map}),t}uint(e,t,i){this.target(e).pending.set(t,i>>>0)}float(e,t,i){this.bits[0]=i,this.uint(e,t,this.words[0])}get pending(){for(let e of this.targets.values())if(e.pending.size)return!0;return!1}flush(e){let t=this.device,i=e,r=0,o=0,a=0,n=0;for(let[l,c]of this.targets){let u=c.pending.size;if(!u)continue;(!c.data||c.data.length<u*2)&&(c.data=new Uint32Array(Math.max(u*2,(c.data?.length??0)*2,128)));let f=Array.from(c.pending.keys()),d=!0;for(let m=1;m<u;m++)if(f[m]<f[m-1]){d=!1;break}d||f.sort((m,h)=>m-h);let p=1;for(let m=1;m<u;m++)f[m]!==f[m-1]+1&&p++;if(p<=4||u<=8){for(let m=0;m<u;m++)c.data[m]=c.pending.get(f[m]);for(let m=0;m<u;){let h=m+1;for(;h<u&&f[h]===f[h-1]+1;)h++;t.queue.writeBuffer(l,f[m]*4,c.data.buffer,m*4,(h-m)*4),r++,m=h}n+=u*4}else{let m=u*8,h=Math.min(t.limits.maxBufferSize,t.limits.maxStorageBufferBindingSize);if(m>h)throw Error("Property batch exceeds GPU buffer limits");for(let A=0;A<u;A++)c.data[A*2]=f[A],c.data[A*2+1]=c.pending.get(f[A]);(!c.upload||c.upload.size<m)&&(c.upload?.destroy(),c.upload=t.createBuffer({size:Math.min(h,m*2),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),c.group=null),t.queue.writeBuffer(c.upload,0,c.data.buffer,0,m),this.pipeline??=t.createComputePipeline({layout:"auto",compute:{entryPoint:"applyEdits",module:t.createShaderModule({code:`
          @group(0) @binding(0) var<storage,read_write> outputWords:array<u32>;
          @group(0) @binding(1) var<storage,read> edits:array<vec2u>;
          @compute @workgroup_size(64) fn applyEdits(@builtin(global_invocation_id) id:vec3u){
            let i=id.x+id.y*${t.limits.maxComputeWorkgroupsPerDimension*64}u;
            if(i>=arrayLength(&edits)){return;}let edit=edits[i];outputWords[edit.x]=edit.y;
          }`})}}),(!c.group||c.bytes!==m)&&(c.group=t.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}},{binding:1,resource:{buffer:c.upload,size:m}}]}),c.bytes=m),i??=t.createCommandEncoder({label:"AVBD property edits"});let g=i.beginComputePass();g.setPipeline(this.pipeline),g.setBindGroup(0,c.group);let b=Math.ceil(u/64),y=t.limits.maxComputeWorkgroupsPerDimension;g.dispatchWorkgroups(Math.min(b,y),Math.ceil(b/y)),g.end(),r++,o++,n+=m}a+=u,c.pending.clear()}!e&&i&&t.queue.submit([i.finish()]),a&&(this.lastBatch={words:a,writes:r,dispatches:o,uploadedBytes:n,submissions:!e&&i?1:0})}destroy(){for(let e of this.targets.values())e.upload?.destroy();this.targets.clear()}forget(e){this.targets.get(e)?.upload?.destroy(),this.targets.delete(e)}};function oe(s){return s.propertyEdits??=new an(s.device)}var Fi=class{constructor(e,t={}){if(this.world=e,this.device=e.device,this.speed=t.speedThreshold??.03,this.delay=t.timeThreshold??.5,t.startAsleep!==void 0&&typeof t.startAsleep!="boolean")throw Error("startAsleep must be a boolean");if(t.islands!==void 0&&typeof t.islands!="boolean")throw Error("Sleep islands must be a boolean");if(this.islands=t.islands??(e.gpu.bodyCount>=4096&&!e.gpu.portableContactMath&&!e.gpu.dispatchIsolation),this.initializing=!!t.startAsleep&&this.islands,!Number.isFinite(this.speed)||this.speed<=0||!Number.isFinite(this.delay)||this.delay<=0)throw Error("Sleep speedThreshold and timeThreshold must be positive and finite");let i=this.device,r=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC;this.state=i.createBuffer({size:e.capacity*32,usage:r}),this.globals=i.createBuffer({size:8,usage:r}),this.params=i.createBuffer({size:48,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let o=i.createShaderModule({code:`${this.islands?Fl:Gl}
${Ul}`});this.layout=i.createBindGroupLayout({entries:["storage","storage","read-only-storage","read-only-storage","read-only-storage","storage","uniform","read-only-storage"].map((c,u)=>({binding:u,visibility:GPUShaderStage.COMPUTE,buffer:{type:c}}))});let a=i.createPipelineLayout({bindGroupLayouts:[this.layout]});this.pipelines=Object.fromEntries(["before","clear",...this.islands?["connectContacts","connectJoints","activity"]:[],"contacts","joints","rest"].map(c=>[c,i.createComputePipeline({layout:a,compute:{module:o,entryPoint:c}})]));let n=new Float32Array(e.capacity*8),l=new Uint32Array(n.buffer);for(let c of e.aggregates)if(!c.disposed){let u=(c.gpuSlot??e.gpu.gpuIndex(c.index))*8;n[u]=c.rigid.mass,l[u+4]=c.allowSleep===!1||c.rigid.allowSleep===!1?0:1,this.islands&&(l[u+5]=u/8)}i.queue.writeBuffer(this.state,0,n),this.wakeRequested=!1}register(e,t,i=!0){let r=new Float32Array([t,0,0,0,0,0,0,0]);new Uint32Array(r.buffer)[4]=i?1:0,this.islands&&(new Uint32Array(r.buffer)[5]=e);let o=new Uint32Array(r.buffer),a=oe(this.world.gpu);for(let n=0;n<8;n++)a.uint(this.state,e*8+n,o[n]);this.wakeRequested=!0}bindContacts(){let e=this.world.gpu,t=e.contactStorage,i=[e.bodyBuffer,this.state,e.infoBuffer,t.manifolds,t.counters,this.globals,this.params,t.contacts],r=this.groups?.find(o=>o.buffers.every((a,n)=>a===i[n]));r||(r={buffers:i,group:this.device.createBindGroup({layout:this.layout,entries:i.map((o,a)=>({binding:a,resource:{buffer:o}}))})},this.groups=[...(this.groups??[]).slice(-1),r]),this.group=r.group}before(e){this.world.gpu.flushPropertyEdits(e);let{gpu:t}=this.world,i=this.paramData??=hi(12),{u:r,f:o}=i;r[0]=t.bodyCount,r[1]=t.jointCount,r[2]=t.manifoldCapacity,r[3]=Number(this.wakeRequested)|(this.initializing?2:0),o[4]=this.speed,o[5]=this.delay,o[6]=t.params.dt,o[7]=t.params.gravity,o[8]=t.params.up[0],o[9]=t.params.up[1],o[10]=t.params.up[2],Qt(this.device,this.params,i),this.wakeRequested=!1,this.bindContacts(),this.run([["before",t.bodyCount],["clear",1]],e)}wakeBody(e){if(!Number.isInteger(e)||e<0||e>=this.world.gpu.bodyCount)throw Error("Sleeping wake requires a live GPU body index");oe(this.world.gpu).uint(this.state,e*8+7,2)}after(e){let t=this.world.gpu;this.bindContacts(),this.run([...this.islands?[["connectContacts",t.manifoldCapacity],["connectJoints",t.jointCount]]:[],["contacts",t.manifoldCapacity],["joints",t.jointCount],...this.islands?[["activity",t.bodyCount]]:[],["rest",t.bodyCount]],e),this.initializing=!1}run(e,t){let i=t??this.device.createCommandEncoder(),r=i.beginComputePass();r.setBindGroup(0,this.group);for(let[o,a]of e)a&&(r.setPipeline(this.pipelines[o]),r.dispatchWorkgroups(o==="clear"?1:Math.ceil(a/64)));r.end(),t||this.device.queue.submit([i.finish()])}async readStats(){let e=this.device,t=e.createBuffer({size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let i=e.createCommandEncoder();i.copyBufferToBuffer(this.globals,0,t,0,8),e.queue.submit([i.finish()]),await t.mapAsync(GPUMapMode.READ);let r=new Uint32Array(t.getMappedRange());return{sleeping:r[1],wakeRequested:!!r[0]}}finally{t.destroy()}}dispose(){this.world.gpu.propertyEdits?.forget(this.state),this.state.destroy(),this.globals.destroy(),this.params.destroy()}};function Bf(s){s=s.replaceAll("bodies[","localBodies["),s=s.replace("var<storage, read_write> bodies: array<Body>;","var<storage, read_write> globalBodies: array<Body>;");let e=s.indexOf(`@compute @workgroup_size(64)
fn primal(`),t=s.indexOf(`
/**`,e);if(e<0||t<e)throw Error("Review small-group primal integration");let i=s.slice(e,t).replace(`@compute @workgroup_size(64)
`,"").replace("fn primal(@builtin(local_invocation_id) lid: vec3u, @builtin(workgroup_id) wid: vec3u)","fn localPrimal(lid: vec3u, wid: vec3u, col: u32)").replaceAll("pc.color","col");return s.slice(0,e)+i+s.slice(t)+`
var<workgroup> localBodies: array<Body,32>;
var<workgroup> bucketBlocks: u32;
@compute @workgroup_size(64)
fn smallGroup(@builtin(local_invocation_id) lid: vec3u) {
  if(lid.x<params.bodyCount){localBodies[lid.x]=globalBodies[lid.x];}
  workgroupBarrier();
  for(var it=0u;it<pc.pad0;it++) {
    for(var col=0u;col<params.colorCap;col++) {
      if(lid.x==0u){
        let start=color[params.colorStartOffset+col];
        let count=color[params.colorStartOffset+col+1u]-start;
        let perBlock=64u/lanesFor(count);
        bucketBlocks=(count+perBlock-1u)/perBlock;
      }
      let blocks=workgroupUniformLoad(&bucketBlocks);
      for(var block=0u;block<blocks;block++) {
        localPrimal(lid,vec3u(block,0u,0u),col);
        workgroupBarrier();
      }
    }
    for(var m=lid.x;m<manifoldCount();m+=64u){dualManifold(m);}
    storageBarrier();
    workgroupBarrier();
  }
  if(lid.x<params.bodyCount){globalBodies[lid.x]=localBodies[lid.x];}
}
`}function Nl(s){if(!(s.smallGroups!==!1&&s.bodyCount>0&&s.bodyCount<=32&&s.jointCount===0&&s.solverDecision.selected==="standard"&&!s.scalarPrimal&&!s.portableContactMath&&!s.dispatchIsolation)){s.smallGroupPipeline=null;return}let t=`${s.sensorsEnabled?1:0}`;if(s.smallGroupPipelines??=new Map,!s.smallGroupPipelines.has(t)){let i=Bf(s.solveSource(Ge,"standard"));s.smallGroupPipelines.set(t,s.device.createComputePipeline({label:"AVBD closed small group",layout:s.device.createPipelineLayout({bindGroupLayouts:[s.layouts.solve,s.layouts.pass]}),compute:{module:s.device.createShaderModule({code:i}),entryPoint:"smallGroup"}}))}s.smallGroupPipeline=s.smallGroupPipelines.get(t)}var nn=new WeakMap;function It(s={}){let e={};for(let t of["breakStrain","breakForce"]){let i=s[t]??1/0;if(i!==1/0&&(!Number.isFinite(i)||i<=0))throw Error(`${t} must be positive or Infinity`);e[t]=i}return e}function xr(s,e){let t=It(e);Number.isFinite(t.breakStrain)||Number.isFinite(t.breakForce)?nn.set(s,t):nn.delete(s)}var Ui=s=>nn.get(s);function oo(s){let e="fn dualJoint(j: u32) {";if(s.split(e).length!==2)throw Error("Review spring fracture kernel integration");return s.replace(e,`${e}
  if (info[j].x == T_SPRING) {
    var material = joints[j];
    let strainLimit = material.lamLin.w;
    let forceLimit = material.lamAng.w;
    if (material.penLin.w > 0.0 && (strainLimit > 0.0 || forceLimit > 0.0)) {
      let a = info[j].y;
      let b = info[j].z;
      let lengthNow = length(anchorA(material,a) - (qrotate(bodies[b].rot,material.rB.xyz) + bodies[b].pos.xyz));
      let extension = max(0.0,lengthNow - material.rA.w);
      let strain = extension / max(material.rA.w,1.0e-6);
      let tension = material.penLin.w * extension;
      if ((strainLimit > 0.0 && material.rA.w > 1.0e-6 && strain > strainLimit) || (forceLimit > 0.0 && tension > forceLimit)) {
        material.penLin = vec4f(0.0);
        material.penAng = vec4f(0.0);
        material.lamLin = vec4f(vec3f(0.0),strainLimit);
        material.lamAng = vec4f(vec3f(0.0),forceLimit);
        joints[j] = material;
        return;
      }
    }
  }
`)}var Cf=["auto","standard","optimized","points"];function Ar({requested:s="auto",bodyCount:e,constraintCount:t=0,contactScheduling:i="manifolds",custom:r=!1}){if(!Cf.includes(s))throw Error("solverMode must be 'auto', 'standard', 'optimized' or 'points'");if(!["manifolds","points"].includes(i))throw Error("contactScheduling must be 'manifolds' or 'points'");if(r&&s!=="auto")throw Error("A scene-specific solve shader cannot be replaced with a rigid-body solver mode");let o=r?"custom":s!=="auto"?s:t>0||e<5e4?"standard":i==="points"?"points":"optimized",a=r?"This scene supplies its own solver. Automatic keeps that implementation.":s!=="auto"?"Explicit implementation override (developer setting).":t>0?"Work layout selected for joints and springs.":e<5e4?"Work layout selected for smaller rigid scenes.":o==="points"?"Large rigid scene with a measured shared-contact-points layout.":"Work layout selected for large rigid scenes.";return{requested:s,selected:o,reason:a,bodyCount:e,constraintCount:t}}var ao=`// Portable hierarchical PLOC: Morton ordering and independent SAH treelets.
// Dispatch boundaries publish each hierarchy level; no cross-workgroup spin waits.
struct Node {
  lo: vec3f,
  left: u32,
  hi: vec3f,
  right: u32,
}
struct BuildSettings {
  count: u32,
  nodeBase: u32,
  inputOffset: u32,
  outputOffset: u32,
  root: u32,
  blocks: u32,
  shift: u32,
  boundsOffset: u32,
  inputCount: u32,
  escapeOffset: u32,
  _pad0: u32,
  _pad1: u32,
}
@group(0) @binding(0) var<uniform> build: BuildSettings;
@group(0) @binding(1) var<storage, read> inputBodies: array<Body>;
@group(0) @binding(2) var<storage, read_write> nodes: array<Node>;
@group(0) @binding(3) var<storage, read_write> ordering: array<vec2u>;
@group(0) @binding(4) var<storage, read_write> bounds: array<vec4f>;
@group(0) @binding(5) var<storage, read_write> links: array<u32>;
@group(0) @binding(6) var<storage, read_write> clusters: array<u32>;
const END: u32 = 0xffffffffu;
const WIDTH: u32 = 16u;
var<workgroup> lower: array<vec3f, 128>;
var<workgroup> upper: array<vec3f, 128>;

fn bodyHalf(i: u32) -> vec3f {
  let b = inputBodies[i];
  let h = b.size.xyz * 0.5;
  if (b.angVel.w == SHAPE_SPHERE) { return vec3f(h.x); }
  return abs(qrotate(b.rot, vec3f(1, 0, 0))) * h.x
    + abs(qrotate(b.rot, vec3f(0, 1, 0))) * h.y
    + abs(qrotate(b.rot, vec3f(0, 0, 1))) * h.z;
}

// Refit only consumes leaf bounds. Scene bounds and their workgroup reductions
// are needed when Morton ordering is rebuilt, not on intervening steps.
@compute @workgroup_size(128)
fn refitLeaves(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= build.count) { return; }
  let h = bodyHalf(i);
  let p = inputBodies[i].pos.xyz;
  nodes[i] = Node(p - h, i, p + h, END);
}

@compute @workgroup_size(128)
fn leaves(
  @builtin(global_invocation_id) gid: vec3u,
  @builtin(local_invocation_id) lid: vec3u,
  @builtin(workgroup_id) wid: vec3u,
) {
  let i = gid.x;
  var lo = vec3f(3.402823e38);
  var hi = -lo;
  if (i < build.count) {
    let h = bodyHalf(i);
    let p = inputBodies[i].pos.xyz;
    lo = p - h;
    hi = p + h;
    nodes[i] = Node(lo, i, hi, END);
  }
  lower[lid.x] = lo;
  upper[lid.x] = hi;
  workgroupBarrier();
  for (var stride = 64u; stride > 0u; stride >>= 1u) {
    if (lid.x < stride) {
      lower[lid.x] = min(lower[lid.x], lower[lid.x + stride]);
      upper[lid.x] = max(upper[lid.x], upper[lid.x + stride]);
    }
    workgroupBarrier();
  }
  if (lid.x == 0u) {
    bounds[build.outputOffset + wid.x * 2u] = vec4f(lower[0], 0);
    bounds[build.outputOffset + wid.x * 2u + 1u] = vec4f(upper[0], 0);
  }
}

@compute @workgroup_size(128)
fn reduceBounds(
  @builtin(global_invocation_id) gid: vec3u,
  @builtin(local_invocation_id) lid: vec3u,
  @builtin(workgroup_id) wid: vec3u,
) {
  var lo = vec3f(3.402823e38);
  var hi = -lo;
  if (gid.x < build.inputCount) {
    lo = bounds[build.inputOffset + gid.x * 2u].xyz;
    hi = bounds[build.inputOffset + gid.x * 2u + 1u].xyz;
  }
  lower[lid.x] = lo;
  upper[lid.x] = hi;
  workgroupBarrier();
  for (var stride = 64u; stride > 0u; stride >>= 1u) {
    if (lid.x < stride) {
      lower[lid.x] = min(lower[lid.x], lower[lid.x + stride]);
      upper[lid.x] = max(upper[lid.x], upper[lid.x + stride]);
    }
    workgroupBarrier();
  }
  if (lid.x == 0u) {
    bounds[build.outputOffset + wid.x * 2u] = vec4f(lower[0], 0);
    bounds[build.outputOffset + wid.x * 2u + 1u] = vec4f(upper[0], 0);
  }
}

fn expandBits(v: u32) -> u32 {
  var x = v & 1023u;
  x = (x | (x << 16u)) & 0x030000ffu;
  x = (x | (x << 8u)) & 0x0300f00fu;
  x = (x | (x << 4u)) & 0x030c30c3u;
  return (x | (x << 2u)) & 0x09249249u;
}

@compute @workgroup_size(128)
fn mortonCodes(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= build.count) { return; }
  let n = nodes[i];
  let lo = bounds[build.boundsOffset].xyz;
  let hi = bounds[build.boundsOffset + 1u].xyz;
  // Half-scale avoids overflow when a finite scene spans distant coordinates.
  let extent = max(hi * 0.5 - lo * 0.5, vec3f(1e-20));
  let p = clamp(((n.lo * 0.25 + n.hi * 0.25) - lo * 0.5) / extent,
    vec3f(0), vec3f(0.999999));
  let q = vec3u(p * 1024.0);
  ordering[i] = vec2u((expandBits(q.x) << 2u)
    | (expandBits(q.y) << 1u) | expandBits(q.z), i);
}

@compute @workgroup_size(128)
fn seedClusters(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x < build.count) { clusters[gid.x] = ordering[gid.x].y; }
}

var<workgroup> alive: array<u32, 16>;
var<workgroup> clusterID: array<u32, 16>;
var<workgroup> best: array<u32, 16>;
var<workgroup> mergeFlag: array<u32, 16>;
var<workgroup> created: u32;
var<workgroup> survivors: u32;

fn area(lo: vec3f, hi: vec3f) -> f32 {
  let d = min(max(hi - lo, vec3f(0)), vec3f(1e18));
  return d.x * d.y + d.y * d.z + d.z * d.x;
}

@compute @workgroup_size(16)
fn miniHploc(
  @builtin(local_invocation_id) lid: vec3u,
  @builtin(workgroup_id) wid: vec3u,
) {
  let lane = lid.x;
  let at = wid.x * WIDTH + lane;
  let live = at < build.inputCount;
  alive[lane] = select(0u, 1u, live);
  if (live) { clusterID[lane] = clusters[build.inputOffset + at]; }
  if (lane == 0u) {
    created = 0u;
    survivors = min(WIDTH, build.inputCount - wid.x * WIDTH);
  }
  workgroupBarrier();
  loop {
    if (workgroupUniformLoad(&survivors) <= 1u) { break; }
    var winner = END;
    var cost = 3.402823e38;
    if (alive[lane] != 0u) {
      let a = nodes[clusterID[lane]];
      for (var j = 0u; j < WIDTH; j++) {
        if (j == lane || alive[j] == 0u) { continue; }
        let b = nodes[clusterID[j]];
        let c = area(min(a.lo, b.lo), max(a.hi, b.hi));
        // Deterministic edge ties guarantee a mutual nearest pair.
        if (c < cost || (c == cost && j < winner)) {
          cost = c;
          winner = j;
        }
      }
    }
    best[lane] = winner;
    workgroupBarrier();
    mergeFlag[lane] = 0u;
    if (alive[lane] != 0u && winner != END && lane < winner
      && best[winner] == lane) { mergeFlag[lane] = 1u; }
    workgroupBarrier();
    var rank = 0u;
    var merged = 0u;
    for (var j = 0u; j < WIDTH; j++) {
      if (j < lane) { rank += mergeFlag[j]; }
      merged += mergeFlag[j];
    }
    // Read every input before any winning lane retires its partner.
    var aID = END;
    var bID = END;
    var node: Node;
    if (mergeFlag[lane] != 0u) {
      aID = clusterID[lane];
      bID = clusterID[winner];
      let a = nodes[aID];
      let b = nodes[bID];
      node = Node(min(a.lo, b.lo), aID, max(a.hi, b.hi), bID);
    }
    workgroupBarrier();
    if (mergeFlag[lane] != 0u) {
      let id = build.nodeBase + wid.x * (WIDTH - 1u) + created + rank;
      nodes[id] = node;
      links[aID] = id;
      links[bID] = id;
      clusterID[lane] = id;
      alive[winner] = 0u;
    }
    storageBarrier();
    workgroupBarrier();
    if (lane == 0u) {
      created += merged;
      survivors -= merged;
    }
    workgroupBarrier();
  }
  if (alive[lane] != 0u) {
    clusters[build.outputOffset + wid.x] = clusterID[lane];
  }
}

@compute @workgroup_size(64)
fn refitTreelets(@builtin(global_invocation_id) gid: vec3u) {
  let first = gid.x * WIDTH;
  if (first >= build.inputCount) { return; }
  let count = min(WIDTH, build.inputCount - first);
  // Creation order puts children before parents inside this treelet.
  for (var j = 0u; j + 1u < count; j++) {
    let id = build.nodeBase + gid.x * (WIDTH - 1u) + j;
    let n = nodes[id];
    let a = nodes[n.left];
    let b = nodes[n.right];
    nodes[id] = Node(min(a.lo, b.lo), n.left, max(a.hi, b.hi), n.right);
  }
}

@compute @workgroup_size(128)
fn ropes(@builtin(global_invocation_id) gid: vec3u) {
  let id = gid.x;
  if (id >= build.escapeOffset) { return; }
  var at = id;
  var escape = END;
  // The host's <= 1M dispatch limit allows at most five 16-way levels:
  // <= 75 binary ancestors, including fully unbalanced treelets.
  for (var depth = 0u; depth < 128u; depth++) {
    if (at == build.root) { break; }
    let p = links[at];
    if (p == END) { break; }
    let parent = nodes[p];
    if (parent.left == at) {
      escape = parent.right;
      break;
    }
    at = p;
  }
  links[build.escapeOffset + id] = escape;
}
`;var ql=`// Stable 4-bit GPU radix sort; PrefixScan scans digit-major block counts.
struct SortSettings { count: u32, blocks: u32, shift: u32, _pad: u32 }
@group(0) @binding(0) var<uniform> sort: SortSettings;
@group(0) @binding(1) var<storage, read> input: array<vec2u>;
@group(0) @binding(2) var<storage, read_write> output: array<vec2u>;
@group(0) @binding(3) var<storage, read_write> hist: array<u32>;
var<workgroup> counts: array<atomic<u32>, 16>;
var<workgroup> digits: array<u32, 128>;

@compute @workgroup_size(128)
fn countDigits(
  @builtin(global_invocation_id) gid: vec3u,
  @builtin(local_invocation_id) lid: vec3u,
  @builtin(workgroup_id) wid: vec3u,
) {
  if (lid.x < 16u) { atomicStore(&counts[lid.x], 0u); }
  workgroupBarrier();
  if (gid.x < sort.count) {
    atomicAdd(&counts[(input[gid.x].x >> sort.shift) & 15u], 1u);
  }
  workgroupBarrier();
  if (lid.x < 16u) {
    hist[lid.x * sort.blocks + wid.x] = atomicLoad(&counts[lid.x]);
  }
}

@compute @workgroup_size(128)
fn scatterDigits(
  @builtin(global_invocation_id) gid: vec3u,
  @builtin(local_invocation_id) lid: vec3u,
  @builtin(workgroup_id) wid: vec3u,
) {
  var value = vec2u(0);
  var digit = 16u;
  if (gid.x < sort.count) {
    value = input[gid.x];
    digit = (value.x >> sort.shift) & 15u;
  }
  digits[lid.x] = digit;
  workgroupBarrier();
  if (gid.x >= sort.count) { return; }
  // Rank by input lane, rather than atomic arrival order, to retain stable ties.
  var rank = 0u;
  for (var j = 0u; j < lid.x; j++) {
    rank += select(0u, 1u, digits[j] == digit);
  }
  output[hist[digit * sort.blocks + wid.x] + rank] = value;
}\r
`;var Pf=()=>GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC,Rt=(s,e=128)=>Math.max(1,Math.ceil(s/e)),Lf=4294967295,ln=fi.indexOf(`@compute @workgroup_size(64)
fn gridCount`),cn=fi.indexOf("/** Binary search"),Vl=fi.indexOf(`@compute @workgroup_size(64)
fn findPairs`);if(ln<0||cn<ln||Vl<cn)throw Error("Pinned broadphase changed; review H-PLOC integration");var _f=ao.slice(0,ao.indexOf("@group(0)")),Ef=(fi.slice(0,ln)+fi.slice(cn,Vl)).replace("var<storage, read_write> grid: array<atomic<u32>>;","var<storage, read_write> tree: array<Node>;")+`
${_f}
@group(1) @binding(0) var<uniform> build: BuildSettings;
@group(1) @binding(1) var<storage,read> links: array<u32>;
@compute @workgroup_size(64)
fn findTreePairs(@builtin(global_invocation_id) gid:vec3u) {
  let i=gid.x; if(i>=params.bodyCount || build.root==0xffffffffu){return;}
  let collisionFilter=filters[i];if(collisionFilter.x==0u || collisionFilter.y==0u){return;}
  let P=probeOf(i);
  // Static/kinematic leaves are found from dynamic queries. Traversing a
  // scene-wide ground slab would otherwise serialize an entire tree in one lane.
  if(!P.dynamic){return;}
  let lo=P.pos-P.aabb-vec3f(1e-4);let hi=P.pos+P.aabb+vec3f(1e-4);
  var at=build.root;
  // Stackless escape links: no truncation at an arbitrary traversal stack size.
  loop {
    if(at==0xffffffffu){break;}
    let node=tree[at];
    if(any(node.hi<lo)||any(node.lo>hi)) {at=links[build.escapeOffset+at];continue;}
    if(node.right==0xffffffffu) {
      if(node.left!=i && (node.left<i || bodies[node.left].size.w<=0.0)){testPair(P,node.left);}
      at=links[build.escapeOffset+at];
    } else {at=node.left;}
  }
}`,no=class{constructor(e,t,{rebuildInterval:i=64}={}){if(!Number.isInteger(i)||i<1)throw Error("BVH rebuildInterval must be a positive integer");if(this.device=e,this.capacity=t.bodyCapacity,this.capacity>16*e.limits.maxComputeWorkgroupsPerDimension)throw Error("H-PLOC capacity exceeds the adapter dispatch limit; select the grid");this.bodyBuffer=t.bodyBuffer,this.rebuildInterval=i,this.nodeCapacity=2*this.capacity+16*Math.ceil(Math.log2(Math.max(2,this.capacity)))+32,this.buffers=[],this.uniforms=[],this.stats={builds:0,refits:0,nodes:0,extraBytes:0};let r=(u,f,d=Pf())=>{if(d&GPUBufferUsage.STORAGE&&f>e.limits.maxStorageBufferBindingSize)throw Error(`${u} exceeds the adapter storage binding limit`);let p=e.createBuffer({label:u,size:Math.max(16,f),usage:d});return this.buffers.push(p),this.stats.extraBytes+=p.size,p};this.nodes=r("H-PLOC nodes",this.nodeCapacity*32),this.links=r("H-PLOC parents and escape links",this.nodeCapacity*8),this.keys=[r("Morton keys A",this.capacity*8),r("Morton keys B",this.capacity*8)],this.clusters=r("H-PLOC level roots",this.capacity*8+128),this.bounds=r("H-PLOC scene bounds",(Rt(this.capacity)*2+256)*16),this.sortBlocks=Rt(this.capacity),this.hist=r("Morton radix counts",this.sortBlocks*16*4),this.scan=new tt(e,this.hist,0,this.sortBlocks*16);let o=(u,f)=>({binding:u,visibility:GPUShaderStage.COMPUTE,buffer:{type:f}});this.layout=e.createBindGroupLayout({entries:[o(0,"uniform"),o(1,"read-only-storage"),...Array.from({length:5},(u,f)=>o(f+2,"storage"))]}),this.extraLayout=e.createBindGroupLayout({entries:[o(0,"uniform"),o(1,"read-only-storage")]});let a=e.createShaderModule({label:"portable H-PLOC",code:ge+ao+`
@compute @workgroup_size(128)
fn initializeLinks(@builtin(global_invocation_id) gid:vec3u){if(gid.x<build.escapeOffset){links[gid.x]=0xffffffffu;}}
`}),n=e.createPipelineLayout({bindGroupLayouts:[this.layout]});this.pipes=Object.fromEntries(["leaves","refitLeaves","reduceBounds","mortonCodes","seedClusters","miniHploc","refitTreelets","ropes","initializeLinks"].map(u=>[u,e.createComputePipeline({layout:n,compute:{module:a,entryPoint:u}})]));let l=e.createShaderModule({label:"stable Morton radix",code:ql});this.sortLayout=e.createBindGroupLayout({entries:[o(0,"uniform"),o(1,"read-only-storage"),o(2,"storage"),o(3,"storage")]});let c=e.createPipelineLayout({bindGroupLayouts:[this.sortLayout]});this.sortPipes=Object.fromEntries(["countDigits","scatterDigits"].map(u=>[u,e.createComputePipeline({layout:c,compute:{module:l,entryPoint:u}})])),this.traverse=e.createComputePipeline({label:"H-PLOC collision traversal",layout:e.createPipelineLayout({bindGroupLayouts:[t.layouts.broad,this.extraLayout]}),compute:{module:e.createShaderModule({code:Ef}),entryPoint:"findTreePairs"}}),this.configure(t.bodyCount)}uniform(e){let t=this.device.createBuffer({size:e.length*4,usage:GPUBufferUsage.UNIFORM,mappedAtCreation:!0});return new Uint32Array(t.getMappedRange()).set(e),t.unmap(),this.uniforms.push(t),t}configure(e){if(e===this.count)return;if(e>this.capacity)throw Error("H-PLOC body capacity exceeded");for(let d of this.uniforms)d.destroy();this.uniforms=[],this.count=e,this.built=!1,this.stepsSinceBuild=0;let t=[],i=e,r=e,o=0,a=e,n=e===0?Lf:0;for(;i>1;){let d=Math.ceil(i/16);t.push({inputCount:i,nodeBase:r,inputOffset:o,outputOffset:a,blocks:d}),d===1&&(n=r+i-2),r+=d*15,o=a,a+=d,i=d}this.stats.nodes=e?2*e-1:0;let l=(d={})=>{let p=this.uniform([e,d.nodeBase??0,d.inputOffset??0,d.outputOffset??0,n,this.sortBlocks,0,d.boundsOffset??0,d.inputCount??e,this.nodeCapacity,0,0]);return{group:this.device.createBindGroup({layout:this.layout,entries:[p,this.bodyBuffer,this.nodes,this.keys[0],this.bounds,this.links,this.clusters].map((h,g)=>({binding:g,resource:{buffer:h}}))}),buffer:p}};this.base=l(),this.levels=t.map(d=>({...d,...l(d)})),this.reductions=[];let c=Rt(e),u=0,f=c*2;for(;c>1;){let d=Rt(c);this.reductions.push({blocks:d,...l({inputCount:c,inputOffset:u,outputOffset:f})}),u=f,f+=d*2,c=d}this.morton=l({boundsOffset:u}),this.sortGroups=Array.from({length:8},(d,p)=>{let m=this.uniform([e,this.sortBlocks,p*4,0]);return this.device.createBindGroup({layout:this.sortLayout,entries:[m,this.keys[p%2],this.keys[1-p%2],this.hist].map((h,g)=>({binding:g,resource:{buffer:h}}))})}),this.extra=this.device.createBindGroup({layout:this.extraLayout,entries:[{binding:0,resource:{buffer:this.base.buffer}},{binding:1,resource:{buffer:this.links}}]}),this.broadBuffers=null}encodeBuild(e){let t=(r,o,a)=>{e.setPipeline(this.pipes[r]),e.setBindGroup(0,o),e.dispatchWorkgroups(a)},i=!this.built||this.stepsSinceBuild>=this.rebuildInterval;if(this.lastRebuilt=i,t(i?"leaves":"refitLeaves",this.base.group,Rt(this.count)),i){t("initializeLinks",this.base.group,Rt(this.nodeCapacity));for(let r of this.reductions)t("reduceBounds",r.group,r.blocks);t("mortonCodes",this.morton.group,Rt(this.count));for(let r of this.sortGroups)e.setPipeline(this.sortPipes.countDigits),e.setBindGroup(0,r),e.dispatchWorkgroups(this.sortBlocks),this.scan.encode(e),e.setPipeline(this.sortPipes.scatterDigits),e.setBindGroup(0,r),e.dispatchWorkgroups(this.sortBlocks);t("seedClusters",this.base.group,Rt(this.count));for(let r of this.levels)t("miniHploc",r.group,r.blocks);t("ropes",this.base.group,Rt(this.nodeCapacity)),this.built=!0,this.stepsSinceBuild=0,this.stats.builds++}else{for(let r of this.levels)t("refitTreelets",r.group,Rt(r.blocks,64));this.stats.refits++}this.stepsSinceBuild++}encodePairs(e,t){this.configure(t.bodyCount);let i=[t.paramsBuffer,t.bodyBuffer,this.nodes,t.pairBuffer,t.counterBuffer,t.staticBuffer,t.jointBuffer,t.filterBuffer];(!this.broadBuffers||i.some((r,o)=>r!==this.broadBuffers[o]))&&(this.broadBuffers=i,this.broad=this.device.createBindGroup({layout:t.layouts.broad,entries:i.map((r,o)=>({binding:o,resource:{buffer:r}}))})),e.setPipeline(this.traverse),e.setBindGroup(0,this.broad),e.setBindGroup(1,this.extra),e.dispatchWorkgroups(Rt(this.count,64))}destroy(){this.scan.destroy();for(let e of[...this.buffers,...this.uniforms])e.destroy()}};function Wl(s,e={}){let t,i,r=!0,o=new Map,a=l=>{if(!i&&!l)return;let c=e.timestampWrites,u=s.beginComputePass({...e,timestampWrites:c&&(r||l)?{querySet:c.querySet,...r&&c.beginningOfPassWriteIndex!==void 0?{beginningOfPassWriteIndex:c.beginningOfPassWriteIndex}:{},...l&&c.endOfPassWriteIndex!==void 0?{endOfPassWriteIndex:c.endOfPassWriteIndex}:{}}:void 0});if(i){u.setPipeline(i.pipeline);for(let[f,d]of i.bindings)u.setBindGroup(f,...d);u[i.method](...i.args)}u.end(),i=null,r=!1},n=(l,c)=>{a(!1),i={pipeline:t,bindings:new Map(o),method:l,args:c}};return{setPipeline(l){t=l},setBindGroup(l,c,u){o.set(l,u===void 0?[c]:[c,[...u]])},dispatchWorkgroups(...l){n("dispatchWorkgroups",l)},dispatchWorkgroupsIndirect(...l){n("dispatchWorkgroupsIndirect",l)},end(){a(!0)}}}var mt=s=>Math.ceil(s/64);function Hl(s){(s.radiiDirty||s.noCollideDirty)&&s.uploadStatics();let e=s.params;s.fixedColors&&(s.device.queue.writeBuffer(s.colorBuffer,0,s.fixedColors),s.colorCap=Math.max(1,...s.fixedColors.map(k=>k===255?0:k+1))),s.stepCount++,s.writeParams(),s.writePassConstants(e.iterations,e.alpha);let t=s.parity,i=s.bodyCapacity,r=s.bodyCount,o=s.jointCount,a=s.groups,n=s.device.createCommandEncoder({label:"AVBD app step"});s.encodeStepPrelude?.(n),s.bvh||n.clearBuffer(s.gridBuffer,0,(2*s.tableSize+1)*4),n.clearBuffer(s.tableBuffer),n.clearBuffer(s.adjBuffer,0,(2*i+1)*4);let l=!!s.detailCallback,c=l||s.timingCallback!==null&&s.timing!==null,u=c||s.splitPasses,f=l?s.detailTiming:s.timing,d=[],p,m,h,g=(k,P)=>{if(p&&!l&&(m===P||!u))return;p?.end(),m=P;let C=l?d.length:Se.indexOf(P);d.push({name:k,aggregate:P});let _={label:k,timestampWrites:c?{querySet:f.querySet,beginningOfPassWriteIndex:C*2,endOfPassWriteIndex:C*2+1}:void 0};p=s.dispatchIsolation?Wl(n,_):n.beginComputePass(_),h=void 0},b=k=>{h!==k&&(p.setBindGroup(0,k),h=k)},y=(k,P,C)=>{C<=0||(p.setPipeline(s.pipes[k]),b(P),p.dispatchWorkgroups(C))},A=(k,P,C)=>{p.setPipeline(s.pipes[k]),b(P),p.dispatchWorkgroupsIndirect(s.argsBuffer,C*4)};if(g("contactCache","collision"),y("beginFrame",a.broad,1),e.reuseContacts&&y("updateRefs",a.refs,mt(r)),y("argsPrev",a.args,1),A("hashInsert",a.contacts[t],6),g("broadphaseBuild","collision"),s.bvh?(s.bvh.configure(r),s.bvh.encodeBuild(p),h=void 0):(y("gridCount",a.broad,mt(r)),s.gridScan.encode(p),h=void 0,y("gridScatter",a.broad,mt(r))),g("broadphasePairs","collision"),s.bvh?(s.bvh.encodePairs(p,s),h=void 0):y("findPairs",a.broad,mt(r)),g("narrowphase","collision"),y("argsPairs",a.args,1),A("narrowphase",a.contacts[t],0),y("argsContacts",a.args,1),g("adjacency","adjacency"),y("degreeJoints",a.topo[t],mt(o)),A("degreeContacts",a.topo[t],3),s.adjScan.encode(p),h=void 0,y("fillJoints",a.topo[t],mt(o)),A("fillContacts",a.topo[t],3),y("sortAdjacency",a.topo[t],mt(r)),g("coloring","coloring"),!s.fixedColors){y("colorCompact",a.topo[t],mt(r)),y("colorMark",a.topo[t],mt(r));for(let k=0;k<s.colorRounds;k++)y(k%2===0?"colorRoundAB":"colorRoundBA",a.topo[t],mt(r))}y("colorCount",a.topo[t],s.colorGroups),s.colorHistScan.encode(p),h=void 0,y("colorStarts",a.topo[t],1),y("argsColors",a.args,1),y("colorScatter",a.topo[t],s.colorGroups);let v=s.passOffsets??=[0],x,w,B,L=k=>{w===p&&B===k||(v[0]=k*256,p.setBindGroup(1,s.passGroup,v),w=p,B=k)},M=()=>{x!==p&&(p.setBindGroup(0,a.solve[t]),x=p)};if(g("warmStart","solve"),M(),L(0),o>0&&(p.setPipeline(s.pipes.warmStartJoints),p.dispatchWorkgroups(mt(o))),p.setPipeline(s.pipes.warmStartBodies),r&&p.dispatchWorkgroups(mt(r)),s.smallGroupPipeline)g("smallGroupSolve","solve"),M(),L(0),p.setPipeline(s.smallGroupPipeline),p.dispatchWorkgroups(1);else for(let k=0;k<e.iterations;k++){g("bodySolve","solve"),M(),p.setPipeline(s.pipes.primal);for(let P=0;P<s.colorCap;P++)L(k*(s.colorCap+1)+P),p.dispatchWorkgroupsIndirect(s.argsBuffer,(12+3*P)*4);g("contactUpdate","solve"),M(),L(k*(s.colorCap+1)+s.colorCap),p.setPipeline(s.pipes.dual),p.dispatchWorkgroupsIndirect(s.argsBuffer,36)}g("velocities","solve"),M(),L(0),p.setPipeline(s.pipes.updateVelocities),r&&p.dispatchWorkgroups(mt(r)),p.end();let I=2*(l?d.length:Se.length);if(c&&(n.resolveQuerySet(f.querySet,0,I,f.resolve,0),n.copyBufferToBuffer(f.resolve,0,f.read,0,I*8)),s.parity=1-t,s.encodeStepPostlude?.(n),s.device.queue.submit([n.finish()]),!c)return;let E=l?s.detailCallback:s.timingCallback;l?s.detailCallback=null:s.timingCallback=null,s.timingBusy=!0,f.read.mapAsync(GPUMapMode.READ).then(()=>{let k=new BigUint64Array(f.read.getMappedRange()).slice();if(f.read.unmap(),s.timingBusy=!1,s.destroyed){s.releaseAppTiming(),s.releaseTiming();return}let P=(_,z)=>Number(k[z]-k[_])/1e6,C={total:P(0,I-1),broadphase:s.broadphase,bvhRebuilt:s.bvh?.lastRebuilt??!1};if(l){C.details={};for(let[_,z]of d.entries()){let R=P(_*2,_*2+1);C[z.aggregate]=(C[z.aggregate]??0)+R,C.details[z.name]=(C.details[z.name]??0)+R}}else Se.forEach((_,z)=>C[_]=P(z*2,z*2+1));E(C)},k=>{s.timingBusy=!1,s.profileErrors.push(k.message),s.destroyed&&(s.releaseAppTiming(),s.releaseTiming())})}function lo(s){let e=s.indexOf(`@compute @workgroup_size(256)
fn colorCount(`),t=s.indexOf(`
// 5.`,e);if(e<0||t<e)throw Error("Pinned color buckets changed; review the bitset rank kernel");return s.slice(0,e).replace(`var<workgroup> hist: array<atomic<u32>, 64>;
var<workgroup> chunkColors: array<u32, 256>;
`,"")+`
var<workgroup> colorBits:array<atomic<u32>,512>;
@compute @workgroup_size(256)
fn colorCount(@builtin(global_invocation_id) gid:vec3u,
              @builtin(local_invocation_id) lid:vec3u,
              @builtin(workgroup_id) wid:vec3u) {
  atomicStore(&colorBits[lid.x],0u);
  atomicStore(&colorBits[lid.x+256u],0u);
  workgroupBarrier();
  let b=gid.x;
  var col=NO_COLOR;
  if(b<params.bodyCount && dynamicBody(i32(b))) {
    let s=state(0u,b);
    col=s&0xffu;
    if((s&PENDING)!=0u){atomicAdd(&counters[C_CLASHES],1u);}
    if (col == NO_COLOR) { col = params.colorCap - 1u; }
    atomicStore(&color[b],col);
    atomicMax(&counters[C_NUM_COLORS],col+1u);
  }
  let word=lid.x>>5u;
  let bit=lid.x&31u;
  if(col!=NO_COLOR){atomicOr(&colorBits[col*8u+word],1u<<bit);}
  workgroupBarrier();
  if(col!=NO_COLOR){
    var rank=0u;
    for(var k=0u;k<word;k++){rank+=countOneBits(atomicLoad(&colorBits[col*8u+k]));}
    rank+=countOneBits(atomicLoad(&colorBits[col*8u+word])&((1u<<bit)-1u));
    atomicStore(&color[params.stateBOffset+b],rank);
  }
  if(lid.x<MAX_COLORS){
    var count=0u;
    for(var k=0u;k<8u;k++){count+=countOneBits(atomicLoad(&colorBits[lid.x*8u+k]));}
    atomicStore(&color[params.colorHistOffset+lid.x*params.colorGroups+wid.x],count);
  }
  if(gid.x==0u){atomicStore(&color[params.colorHistOffset+MAX_COLORS*params.colorGroups],0u);}
}

`+s.slice(t)}function co(s,e){let t=s.bodyCount>=1024;if(s.bitsetColorBuckets===t)return;let i=s.colorBucketPipelines??={scan:s.pipes.colorCount};t&&!i.bitset&&(i.bitset=s.device.createComputePipeline({label:"Stable bitset color buckets",layout:s.device.createPipelineLayout({bindGroupLayouts:[s.layouts.topo]}),compute:{module:s.device.createShaderModule({code:e}),entryPoint:"colorCount"}})),s.pipes.colorCount=t?i.bitset:i.scan,s.bitsetColorBuckets=t}var $l=`  let list = params.adjListOffset;
  for (var i = lo + 1u; i < hi; i++) {`,un=Ti(ge,yr),Jl=lo(un);if(un.split($l).length!==2)throw Error("Pinned adjacency sort changed; review the cached-key variant");var Xl=un.replace($l,`
  let list = params.adjListOffset;
  let count = hi - lo;
  if (count <= 16u) {
    var ids: array<u32, 16>;
    var keys: array<vec2u, 16>;
    for (var i = 0u; i < count; i++) {
      ids[i] = atomicLoad(&adj[list + lo + i]);
      keys[i] = adjKey(b, ids[i]);
    }
    for (var i = 1u; i < count; i++) {
      let id = ids[i];
      let key = keys[i];
      var j = i;
      loop {
        if (j == 0u) { break; }
        if (!keyLess(key, keys[j - 1u])) { break; }
        ids[j] = ids[j - 1u];
        keys[j] = keys[j - 1u];
        j--;
      }
      ids[j] = id;
      keys[j] = key;
    }
    for (var i = 0u; i < count; i++) {
      atomicStore(&adj[list + lo + i], ids[i]);
    }
    return;
  }
  for (var i = lo + 1u; i < hi; i++) {`);function fn(s){return s.replace("return m.ids.w & 15u;","return select(m.ids.w & 15u, 0u, (m.ids.w & 0x80000000u) != 0u);").replace("bodies[i].initialPos = pos;","bodies[i].initialPos = vec4f(pos.xyz, bodies[i].initialPos.w);")}function uo(s){return s.replace("let generated = prev.ids.w >> 4u;","let generated = (prev.ids.w >> 4u) & 0x07ffffffu;").replace("reuseContacts(a, b))","bodies[a].initialPos.w == 0.0 && bodies[b].initialPos.w == 0.0 && reuseContacts(a, b))").replace("count | (params.step << 4u)","count | ((params.step & 0x07ffffffu) << 4u) | select(0u, 0x80000000u, bodies[a].initialPos.w != 0.0 || bodies[b].initialPos.w != 0.0)")}function dn(s=Ti(ge,yr)){return s.replaceAll("if (gid.x >= topoCount()) { return; }",`if (gid.x >= topoCount()) { return; }
  if ((contacts[gid.x].ids.w & 0x80000000u) != 0u) { return; }`)}function hn(s){let e=s.device,t=e.createShaderModule({code:`
    @group(0) @binding(0) var<storage,read_write> records:array<vec4f>;
    @compute @workgroup_size(64) fn clear(@builtin(global_invocation_id) id:vec3u){
      if(id.x*10u+2u>=arrayLength(&records)){return;}
      records[id.x*10u+2u].w=0.;
    }`}),i=e.createComputePipeline({layout:"auto",compute:{module:t,entryPoint:"clear"}}),r=e.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:s.bodyBuffer}}]}),o=e.createCommandEncoder(),a=o.beginComputePass();a.setPipeline(i),a.setBindGroup(0,r),a.dispatchWorkgroups(Math.ceil(s.bodyCount/64)),a.end(),e.queue.submit([o.finish()])}var Mf=`
fn contactGeneration(value: f32) -> u32 {
  return select(0u, bitcast<u32>(value) ^ 0x3f800000u, value != 0.0);
}
fn contactMovedAfter(value: f32, generated: u32) -> bool {
  let age = (contactGeneration(value) - generated) & 0x07ffffffu;
  return age != 0u && age < 0x04000000u;
}
`;function Yl(s){let e="bodies[i].inertialPos.w = bitcast<f32>(params.step);";if(!s.includes(e))throw Error("Contact reference layout changed");return s.replace(e,"bodies[i].inertialPos.w = bitcast<f32>((params.step & 0x07ffffffu) ^ 0x3f800000u);")}function Ql(s){let e=`  let moved = max(bitcast<u32>(bodies[a].inertialPos.w), bitcast<u32>(bodies[b].inertialPos.w));
  if (count == 0u || generated < moved) { return false; }`;if(!s.includes(e))throw Error("Contact cache layout changed");return Mf+s.replace(e,`  let generation = generated & 0x07ffffffu;
  if (count == 0u || contactMovedAfter(bodies[a].inertialPos.w, generation) || contactMovedAfter(bodies[b].inertialPos.w, generation)) { return false; }`)}var zf=["captureIncoming"],If=["captureSolved","initialize",...Array.from({length:12},()=>["pairs","apply"]).flat(),"writeBack"],Rf=`${ge}
struct Config { count:u32, joints:u32, capacity:u32, list:u32, threshold:f32, dt:f32, pad0:u32, pad1:u32 }
struct Velocity { incoming:vec4f, incomingAngular:vec4f, linear:vec4f, angular:vec4f }
struct Bounce { impulse:f32, delta:f32, reboundSpeed:f32, inverseMass:f32, rA:vec4f, rB:vec4f }
@group(0) @binding(0) var<uniform> cfg:Config;
@group(0) @binding(1) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(2) var<storage,read_write> velocities:array<Velocity>;
@group(0) @binding(3) var<storage,read> materials:array<f32>;
@group(0) @binding(4) var<storage,read> manifolds:array<Manifold>;
@group(0) @binding(5) var<storage,read> contacts:array<Contact>;
@group(0) @binding(6) var<storage,read> adj:array<u32>;
@group(0) @binding(7) var<storage,read> counters:array<u32>;
@group(0) @binding(8) var<storage,read_write> bounce:array<Bounce>;
fn inverseInertia(i:u32,t:vec3f)->vec3f {
  if(bodies[i].size.w<=0.){return vec3f(0.);}
  let local=qrotate(qconj(bodies[i].rot),t);
  let moment=bodies[i].moment.xyz;
  return qrotate(bodies[i].rot,select(vec3f(0.),local/max(moment,vec3f(1.e-20)),moment>vec3f(0.)));
}
fn inverseMass(i:u32)->f32 {return select(0.,1./max(bodies[i].size.w,1.e-20),bodies[i].size.w>0.);}
fn pointVelocity(i:u32,r:vec3f,incoming:bool)->vec3f {
  let v=velocities[i];
  return select(v.linear.xyz,v.incoming.xyz,incoming)+cross(select(v.angular.xyz,v.incomingAngular.xyz,incoming),r);
}
@compute @workgroup_size(64) fn captureIncoming(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=cfg.count){return;}
  velocities[i].incoming=bodies[i].vel;
  velocities[i].incomingAngular=bodies[i].angVel;
}
@compute @workgroup_size(64) fn captureSolved(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=cfg.count){return;}
  velocities[i].linear=bodies[i].vel;
  velocities[i].angular=bodies[i].angVel;
}
@compute @workgroup_size(64) fn initialize(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=min(counters[C_MANIFOLDS],cfg.capacity)){return;}
  bounce[i]=Bounce(0.,0.,0.,0.,vec4f(0.),vec4f(0.));
  let m=manifolds[i];let count=m.ids.w&15u;
  let a=m.ids.x;let b=m.ids.y;let e=max(materials[a],materials[b]);
  if(count==0u || e<=0. || (m.ids.w&0x80000000u)!=0u || counters[C_OVERFLOW]!=0u || counters[C_CLASHES]!=0u){return;}
  var ra=vec3f(0.);var rb=vec3f(0.);
  for(var c=0u;c<count;c++){let k=contacts[m.ids.z+c];ra+=qrotate(bodies[a].rot,k.rA);rb+=qrotate(bodies[b].rot,k.rB);}
  ra/=f32(count);rb/=f32(count);
  let vn=dot(m.geo.xyz,pointVelocity(a,ra,true)-pointVelocity(b,rb,true));
  if(vn>=-cfg.threshold){return;}
  let ta=cross(ra,m.geo.xyz);let tb=cross(rb,m.geo.xyz);
  let k=inverseMass(a)+inverseMass(b)+dot(ta,inverseInertia(a,ta))+dot(tb,inverseInertia(b,tb));
  if(k<=0.){return;}
  bounce[i]=Bounce(0.,0.,-e*vn,k,vec4f(ra,0.),vec4f(rb,0.));
}
@compute @workgroup_size(64) fn pairs(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=min(counters[C_MANIFOLDS],cfg.capacity)){return;}
  var s=bounce[i];if(s.inverseMass<=0.){return;}
  let m=manifolds[i];let a=m.ids.x;let b=m.ids.y;
  let vn=dot(m.geo.xyz,pointVelocity(a,s.rA.xyz,false)-pointVelocity(b,s.rB.xyz,false));
  // Degree-based relaxation bounds the Jacobi coupling in dense contact graphs.
  let degree=max(1u,max(adj[a+1u]-adj[a],adj[b+1u]-adj[b]));
  let impulse=max(0.,s.impulse+(s.reboundSpeed-vn)/(s.inverseMass*f32(degree)));
  s.delta=impulse-s.impulse;s.impulse=impulse;bounce[i]=s;
}
@compute @workgroup_size(64) fn apply(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=cfg.count || bodies[i].size.w<=0.){return;}
  var dv=vec3f(0.);var dw=vec3f(0.);
  for(var j=adj[i];j<adj[i+1u];j++){
    let key=adj[cfg.list+j];if(key<cfg.joints){continue;}
    let m=manifolds[key-cfg.joints];let s=bounce[key-cfg.joints];
    if(s.inverseMass<=0.){continue;}
    let isA=i==m.ids.x;let impulse=m.geo.xyz*s.delta*select(-1.,1.,isA);
    dv+=impulse*inverseMass(i);dw+=inverseInertia(i,cross(select(s.rB.xyz,s.rA.xyz,isA),impulse));
  }
  velocities[i].linear+=vec4f(dv,0.);velocities[i].angular+=vec4f(dw,0.);
}
@compute @workgroup_size(64) fn writeBack(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=cfg.count || bodies[i].size.w<=0.){return;}
  bodies[i].vel=velocities[i].linear;bodies[i].angVel=velocities[i].angular;
}
`;var wr=class{constructor(e,{code:t=Rf,dimension:i=3}={}){this.solver=e,this.dimension=i,this.device=e.device,this.active=new Set;let r=this.device,o=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST;this.materials=r.createBuffer({size:e.bodyCapacity*4,usage:o}),this.velocities=r.createBuffer({size:e.bodyCapacity*64,usage:o}),this.params=r.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.layout=r.createBindGroupLayout({entries:["uniform","storage","storage","read-only-storage","read-only-storage","read-only-storage","read-only-storage","read-only-storage","storage"].map((l,c)=>({binding:c,visibility:GPUShaderStage.COMPUTE,buffer:{type:l}}))});let a=r.createShaderModule({code:t}),n=r.createPipelineLayout({bindGroupLayouts:[this.layout]});this.pipes=Object.fromEntries(["captureIncoming","captureSolved","initialize","pairs","apply","writeBack"].map(l=>[l,r.createComputePipeline({layout:n,compute:{module:a,entryPoint:l}})]))}set(e,t){if(!Number.isFinite(t)||t<0||t>1)throw Error("restitution must be between 0 and 1");t>0?this.active.add(e):this.active.delete(e),oe(this.solver).float(this.materials,e,t)}bind(){let e=this.solver,t=this.device,i=this.dimension===3?e.contactStorage:{manifolds:e.contactBuffers[1-e.parity],contacts:e.contactBuffers[1-e.parity],counters:e.counterBuffer},r=this.dimension===3?e.manifoldCapacity:e.contactCapacity;this.capacity!==r&&(this.bounce?.destroy(),this.capacity=r,this.bounce=t.createBuffer({size:Math.max(1,this.capacity)*48,usage:GPUBufferUsage.STORAGE}));let o=[this.params,e.bodyBuffer,this.velocities,this.materials,i.manifolds,i.contacts,e.adjBuffer,i.counters,this.bounce];(!this.buffers||o.some((c,u)=>c!==this.buffers[u]))&&(this.buffers=o,this.group=t.createBindGroup({layout:this.layout,entries:o.map((c,u)=>({binding:u,resource:{buffer:c}}))}));let a=this.paramData??=hi(8),{u:n,f:l}=a;n[0]=e.bodyCount,n[1]=e.jointCount,n[2]=r,n[3]=2*e.bodyCapacity+1,l[4]=1,l[5]=e.params.dt,Qt(t,this.params,a)}run(e,t){this.bind();let i=t??this.device.createCommandEncoder(),r=i.beginComputePass();r.setBindGroup(0,this.group);for(let o of e)r.setPipeline(this.pipes[o]),r.dispatchWorkgroups(Math.max(1,Math.ceil((o==="initialize"||o==="pairs"?this.capacity:this.solver.bodyCount)/64)));r.end(),t||this.device.queue.submit([i.finish()])}before(e){this.active.size&&this.run(zf,e)}after(e){this.active.size&&this.run(If,e)}destroy(){for(let e of["materials","velocities","params","bounce"])this[e]?.destroy()}};var Kl=new WeakMap,fs=s=>Kl.get(s);function Br(s,e){Kl.set(s,e)}var pn=(s,e,t)=>{if(s.split(e).length!==2)throw Error("Pinned angular solver layout changed");return s.replace(e,t)};function mn(s){return s=pn(s,"fn addJoint(acc: ptr<function, Acc>, j: u32, alpha: f32, i: u32) {",`
fn angularFrame(k:Joint,a:i32,b:i32)->mat3x3f {
  let qa=rotA(a);let axis=qrotate(qa,k.rA.xyz);
  let ta=qrotate(qa,k.c0Lin.xyz);let tb=qrotate(bodies[b].rot,k.c0Ang.xyz);
  return mat3x3f(axis,ta,tb);
}
fn angularAngle(k:Joint,a:i32,b:i32)->f32 {
  let f=angularFrame(k,a,b);
  return atan2(dot(f[0],cross(f[1],f[2])),dot(f[1],f[2]));
}
fn angularRows(k:Joint,a:i32,b:i32,t:i32,alpha:f32)->vec2f {
  let angle=angularAngle(k,a,b);
  if(t==3){
    let delta=atan2(sin(angle-k.c0Lin.w),cos(angle-k.c0Lin.w));
    return vec2f(delta-k.rA.w*params.dt,0.);
  }
  return vec2f(angle-k.rA.w,angle-k.rB.w)-alpha*vec2f(k.c0Lin.w,k.c0Ang.w);
}
fn angularForce(k:Joint,C:vec2f,t:i32)->vec2f {
  let f=k.penLin.xy*C+k.lamLin.xy;
  if(t==3){return vec2f(clamp(f.x,-k.rB.w,k.rB.w),0.);}
  return vec2f(min(0.,f.x),max(0.,f.y));
}
fn addAngular(acc:ptr<function,Acc>,j:u32,alpha:f32,i:u32){
  let a=info[j].y;let b=info[j].z;let t=info[j].x;let k=joints[j];
  if(t==3 && k.rB.w==0.){return;}
  let axis=angularFrame(k,a,b)[0]*select(1.,-1.,i32(i)==a);
  let C=angularRows(k,a,b,t,alpha);let F=angularForce(k,C,t);
  if(t==3 || F.x!=0.){addRow(acc,vec3f(0.),axis,k.penLin.x,F.x);}
  if(t==4 && F.y!=0.){addRow(acc,vec3f(0.),axis,k.penLin.y,F.y);}
}
fn warmAngular(j:u32){
  var k=joints[j];if(k.penLin.w==0.){return;}
  let a=info[j].y;let b=info[j].z;let t=info[j].x;
  let angle=angularAngle(k,a,b);
  k.c0Lin.w=select(min(0.,angle-k.rA.w),angle,t==3);
  k.c0Ang.w=max(0.,angle-k.rB.w);
  k.lamLin=vec4f(k.lamLin.xyz*(params.alpha*params.gamma),k.lamLin.w);
  k.penLin=vec4f(clamp(k.penLin.xyz*params.gamma,vec3f(PENALTY_MIN),vec3f(PENALTY_MAX)),k.penLin.w);
  joints[j]=k;
}
fn dualAngular(j:u32){
  var k=joints[j];if(k.penLin.w==0.){return;}
  let t=info[j].x;let C=angularRows(k,info[j].y,info[j].z,t,pc.alpha);
  let F=angularForce(k,C,t);k.lamLin=vec4f(F,0.,k.lamLin.w);
  let violation=select(vec2f(max(0.,-C.x),max(0.,C.y)),abs(C),t==3);
  k.penLin=vec4f(min(k.penLin.xy+violation*params.betaAng,vec2f(PENALTY_MAX)),k.penLin.zw);
  joints[j]=k;
}
`+`
fn addJoint(acc: ptr<function, Acc>, j: u32, alpha: f32, i: u32) {
  if(info[j].x==3 || info[j].x==4){if(joints[j].penLin.w!=0.){addAngular(acc,j,alpha,i);}return;}`),s=pn(s,"  if (j >= params.jointCount || info[j].x != T_JOINT) { return; }",`  if(j>=params.jointCount){return;}
  if(info[j].x==3 || info[j].x==4){warmAngular(j);return;}
  if(info[j].x!=T_JOINT){return;}`),pn(s,"fn dualJoint(j: u32) {",`fn dualJoint(j: u32) {
  if(info[j].x==3 || info[j].x==4){dualAngular(j);return;}`)}function kt({type:s,axisA:e=[0,1,0],axisB:t=[0,1,0],speed:i=1,maxTorque:r=100,minAngle:o=-Math.PI,maxAngle:a=Math.PI}={}){let n=l=>{let c=l&&typeof l.x=="number"?[l.x,l.y,l.z]:Array.from(l),u=Math.hypot(...c);if(c.length!==3||!c.every(Number.isFinite)||u<1e-8)throw Error("Angular axis requires three finite, nonzero components");return c.map(f=>f/u)};if(s!=="motor"&&s!=="limit")throw Error("Invalid angular constraint type");if(!Number.isFinite(i)||!Number.isFinite(r)||r<0)throw Error("Motor speed must be finite and maxTorque nonnegative");if(!Number.isFinite(o)||!Number.isFinite(a)||o<-Math.PI||a>Math.PI||o>a)throw Error("Hinge angles must be ordered within -PI..PI radians");return{type:s,axisA:n(e),axisB:n(t),speed:i,maxTorque:r,minAngle:o,maxAngle:a}}var Zl=`struct Body { pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f }
struct Joint {penLin:vec4f,penAng:vec4f,lamLin:vec4f,lamAng:vec4f,c0Lin:vec4f,c0Ang:vec4f,rA:vec4f,rB:vec4f}
@group(0) @binding(0) var<storage,read> bodies:array<Body>;
@group(0) @binding(1) var<storage,read_write> joints:array<Joint>;
@group(0) @binding(2) var<storage,read> info:array<vec4i>;
@group(0) @binding(3) var<storage,read> slots:array<u32>;
fn rotate(q:vec4f,v:vec3f)->vec3f{let t=2.*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
@compute @workgroup_size(64) fn capture(@builtin(global_invocation_id) id:vec3u){
  if(id.x>=arrayLength(&slots)){return;}let j=slots[id.x];let a=info[j].y;let b=info[j].z;
  var qa=vec4f(0.,0.,0.,1.);if(a>=0){qa=bodies[a].rot;}
  let qb=bodies[b].rot;let axis=joints[j].rA.xyz;
  let tangent=normalize(select(vec3f(0.,-axis.z,axis.y),vec3f(-axis.y,axis.x,0.),abs(axis.x)>abs(axis.z)));
  let world=rotate(qa,tangent);let axisB=normalize(joints[j].rB.xyz);
  var tangentB=rotate(vec4f(-qb.xyz,qb.w),world);
  tangentB-=axisB*dot(tangentB,axisB);
  if(length(tangentB)<1.e-6){tangentB=select(vec3f(0.,-axisB.z,axisB.y),vec3f(-axisB.y,axisB.x,0.),abs(axisB.x)>abs(axisB.z));}
  joints[j].c0Lin=vec4f(tangent,0.);joints[j].c0Ang=vec4f(normalize(tangentB),0.);
}
`;var ec=new WeakSet,Fe=s=>ec.has(s);function Cr(s,e,t,i=1,r=.6,o=[0,0,0]){if(!Number.isFinite(e)||e<=0||!Number.isFinite(t)||t<2*e)throw Error("Capsule height must be at least twice its positive radius");if(!Number.isFinite(i)||i<0)throw Error("Capsule density must be nonnegative");let a=new Ze(s,[2*e,t,2*e],i,r,o),n=t-2*e,l=Math.PI*e*e*n*i,c=4/3*Math.PI*e**3*i;a.mass=l+c;let u=l*e**2/2+c*2*e**2/5,f=l*(n**2/12+e**2/4)+c*(2*e**2/5+n**2/4+3*n*e/8);return a.moment.set([f,u,f]),a.radius=t/2,ec.add(a),a}var tc=`// Exact rounded capsule geometry. Shape -1: radius=size.x/2, segment along Y,
// half-length=size.y/2-radius. No tessellation, endpoint-only collision test,
// shape storage buffer or iterative support search for capsule/sphere/box.
struct Capsule {a:vec3f,b:vec3f,r:f32}
struct SegmentPair {a:vec3f,b:vec3f}
fn capsuleOf(i:u32)->Capsule{
  let radius=bodies[i].size.x*.5;let axis=qrotate(bodies[i].rot,vec3f(0.,max(0.,bodies[i].size.y*.5-radius),0.));
  return Capsule(bodies[i].pos.xyz-axis,bodies[i].pos.xyz+axis,radius);
}
fn capSegmentPoint(a:vec3f,b:vec3f,p:vec3f)->vec3f{let d=b-a;return a+d*clamp(dot(p-a,d)/max(dot(d,d),1.e-20),0.,1.);}
fn capSegments(a:vec3f,b:vec3f,c:vec3f,d:vec3f)->SegmentPair{
  let u=b-a;let v=d-c;let w=a-c;let uu=dot(u,u);let vv=dot(v,v);let uv=dot(u,v);let uw=dot(u,w);let vw=dot(v,w);
  var s=0.;var t=0.;
  if(uu<=1.e-16){t=clamp(vw/max(vv,1.e-20),0.,1.);}
  else if(vv<=1.e-16){s=clamp(-uw/uu,0.,1.);}
  else{let denominator=uu*vv-uv*uv;if(denominator>1.e-8*uu*vv){s=clamp((uv*vw-uw*vv)/denominator,0.,1.);}t=(uv*s+vw)/vv;
    if(t<0.){t=0.;s=clamp(-uw/uu,0.,1.);}else if(t>1.){t=1.;s=clamp((uv-uw)/uu,0.,1.);}}
  return SegmentPair(a+s*u,c+t*v);
}
fn capFallback(axis:vec3f)->vec3f{
  if(length(axis)<1.e-8){return vec3f(1.,0.,0.);}
  let n=normalize(axis);return normalize(select(vec3f(0.,-n.z,n.y),vec3f(-n.y,n.x,0.),abs(n.x)>abs(n.z)));
}
fn capsuleSphere(A:Capsule,c:vec3f,r:f32,sat:ptr<function,Sat>)->Found{
  var found:Found;let p=capSegmentPoint(A.a,A.b,c);let delta=c-p;let distance=length(delta);
  if(distance>A.r+r){return found;}var n=capFallback(A.b-A.a);if(distance>1.e-8){n=delta/distance;}
  (*sat).n=n;addFound(&found,p+n*A.r,c-n*r,4u<<24u);return found;
}
fn capsuleCapsule(A:Capsule,B:Capsule,sat:ptr<function,Sat>)->Found{
  var found:Found;let points=capSegments(A.a,A.b,B.a,B.b);let delta=points.b-points.a;let distance=length(delta);
  if(distance>A.r+B.r){return found;}var n=capFallback(A.b-A.a);let crossing=cross(A.b-A.a,B.b-B.a);
  if(distance>1.e-8){n=delta/distance;}else if(length(crossing)>1.e-8){n=normalize(crossing);}
  (*sat).n=n;
  let da=A.b-A.a;let db=B.b-B.a;
  if(length(da)>1.e-8&&length(db)>1.e-8&&length(cross(normalize(da),normalize(db)))<1.e-4){
    let axis=normalize(da);let lo=max(dot(A.a,axis),min(dot(B.a,axis),dot(B.b,axis)));let hi=min(dot(A.b,axis),max(dot(B.a,axis),dot(B.b,axis)));
    if(hi-lo>1.e-5){for(var j=0u;j<2u;j++){let p=A.a+axis*(select(lo,hi,j==1u)-dot(A.a,axis));let q=capSegmentPoint(B.a,B.b,p);addFound(&found,p+n*A.r,q-n*B.r,(4u<<24u)|j);}return found;}
  }
  addFound(&found,points.a+n*A.r,points.b-n*B.r,4u<<24u);return found;
}
// Piecewise quadratic closest segment/AABB distance. Every face crossing is
// considered, so a long capsule cannot miss an obstacle between its endpoints.
fn capSegmentBox(a:vec3f,b:vec3f,h:vec3f)->SegmentPair{
  let d=b-a;var breaks:array<f32,8>;breaks[0]=0.;breaks[1]=1.;var count=2u;
  for(var k=0u;k<3u;k++){if(abs(d[k])>1.e-12){for(var side=0u;side<2u;side++){let t=(select(-h[k],h[k],side==1u)-a[k])/d[k];if(t>0.&&t<1.){breaks[count]=t;count++;}}}}
  for(var i=1u;i<count;i++){let value=breaks[i];var j=i;while(j>0u&&breaks[j-1u]>value){breaks[j]=breaks[j-1u];j--;}breaks[j]=value;}
  var best=3.4e38;var bestT=.5;var result:SegmentPair;
  for(var j=0u;j+1u<count;j++){
    let lo=breaks[j];let hi=breaks[j+1u];let mid=.5*(lo+hi);let p=a+mid*d;var numerator=0.;var denominator=0.;
    for(var k=0u;k<3u;k++){if(p[k]<-h[k]||p[k]>h[k]){let edge=clamp(p[k],-h[k],h[k]);numerator+=d[k]*(a[k]-edge);denominator+=d[k]*d[k];}}
    var t=mid;if(denominator>1.e-20){t=clamp(-numerator/denominator,lo,hi);}let point=a+t*d;let box=clamp(point,-h,h);let dist=dot(point-box,point-box);
    // An exact segment/box intersection must win over a nearby exterior
    // sample. A distance tie alone can select roundoff-sized separation and
    // normalize it into an arbitrary contact normal.
    let exactIntersection=dist==0.;let previousIntersection=best==0.;
    if((exactIntersection&&!previousIntersection)||dist<best-1.e-12 ||
      (exactIntersection==previousIntersection&&abs(dist-best)<=1.e-12&&abs(t-.5)<abs(bestT-.5))){best=dist;bestT=t;result=SegmentPair(point,box);}
  }
  return result;
}
fn capBoxAxis(A:Capsule,h:vec3f,axis:vec3f,best:ptr<function,f32>,normal:ptr<function,vec3f>)->bool{
  let l=length(axis);if(l<1.e-8){return true;}let n=axis/l;
  let lo=min(dot(A.a,n),dot(A.b,n))-A.r;let hi=max(dot(A.a,n),dot(A.b,n))+A.r;let extent=dot(abs(n),h);
  let positive=hi+extent;let negative=extent-lo;if(positive<0.||negative<0.){return false;}
  let depth=min(positive,negative);if(depth<*best){*best=depth;*normal=select(-n,n,positive<negative);}return true;
}
fn capsuleBox(A:Capsule,B:Box,q:vec4f,sat:ptr<function,Sat>)->Found{
  var found:Found;let inv=qconj(q);let local=Capsule(qrotate(inv,A.a-B.c),qrotate(inv,A.b-B.c),A.r);
  let closest=capSegmentBox(local.a,local.b,B.h);let delta=closest.b-closest.a;let distance=length(delta);
  if(distance>A.r){return found;}var nLocal=vec3f(0.);var center=closest.a;var onBox=closest.b;
  if(distance>1.e-8){nLocal=delta/distance;}else{
    var depth=3.4e38;
    for(var k=0u;k<3u;k++){var axis=vec3f(0.);axis[k]=1.;if(!capBoxAxis(local,B.h,axis,&depth,&nLocal)){return found;}if(!capBoxAxis(local,B.h,cross(local.b-local.a,axis),&depth,&nLocal)){return found;}}
    for(var k=0u;k<8u;k++){let vertex=vec3f(select(-B.h.x,B.h.x,(k&1u)!=0u),select(-B.h.y,B.h.y,(k&2u)!=0u),select(-B.h.z,B.h.z,(k&4u)!=0u));if(!capBoxAxis(local,B.h,vertex-capSegmentPoint(local.a,local.b,vertex),&depth,&nLocal)){return found;}}
    center=select(local.a,local.b,dot(local.b,nLocal)>dot(local.a,nLocal));onBox=clamp(center,-B.h,B.h);
    let point=center+nLocal*local.r;onBox=point-nLocal*depth;
  }
  let n=qrotate(q,nLocal);(*sat).n=n;
  // Parallel support at both end caps produces a stable two-point manifold.
  var ends:Found;
  for(var j=0u;j<2u;j++){var S:Box;S.c=select(A.a,A.b,j==1u);S.h=vec3f(A.r);let hit=sphereBox(S,B,q);if(hit.hit&&dot(hit.n,n)>.9999){addFound(&ends,hit.onSphere,hit.onBox,(4u<<24u)|j);}}
  if(ends.count==2u){return ends;}
  addFound(&found,B.c+qrotate(q,center)+n*A.r,B.c+qrotate(q,onBox),4u<<24u);return found;
}
`;function gn(s){if(s.includes("fn capsuleOf"))throw Error("Capsule collision kernel installed twice");let e=`@compute @workgroup_size(64)
fn narrowphase`;if(!s.includes(e))throw Error("Pinned capsule narrowphase layout changed");let t=s.includes("struct Poly");t&&(s=s.replace(e,jf+`
`+e)),s=s.replace(e,tc+`
`+e);let i=t?" else if(isHull(b)){found=capsulePoly(capsuleOf(a),polyOf(b),&sat);}":"",r=t?" else if(isHull(a)){found=capsulePoly(capsuleOf(b),polyOf(a),&sat);}":"";return s.replace("let anySphere = sphereA || sphereB;","let anySphere = sphereA || sphereB || capsuleA || capsuleB;").replace("  if (sphereA && sphereB) {",`  let capsuleA=bodies[a].angVel.w == -1.;let capsuleB=bodies[b].angVel.w == -1.;
  if(capsuleA || capsuleB){
    if(capsuleA && capsuleB){found=capsuleCapsule(capsuleOf(a),capsuleOf(b),&sat);}
    else if(capsuleA){if(sphereB){found=capsuleSphere(capsuleOf(a),B.c,B.h.x,&sat);}${i} else{found=capsuleBox(capsuleOf(a),B,bodies[b].rot,&sat);}}
    else{if(sphereA){found=capsuleSphere(capsuleOf(b),A.c,A.h.x,&sat);}${r} else{found=capsuleBox(capsuleOf(b),A,bodies[a].rot,&sat);}
      sat.n=-sat.n;for(var c=0u;c<found.count;c++){let p=found.xA[c];found.xA[c]=found.xB[c];found.xB[c]=p;}}
  } else if (sphereA && sphereB) {`)}var jf=`
fn capPolyAxis(A:Capsule,P:Poly,axis:vec3f,best:ptr<function,f32>,normal:ptr<function,vec3f>)->bool{
 let l=length(axis);if(l<1.e-8){return true;}let n=axis/l;
 let lo=min(dot(A.a,n),dot(A.b,n))-A.r;let hi=max(dot(A.a,n),dot(A.b,n))+A.r;
 let low=dot(polySupport(P,-n),n);let high=dot(polySupport(P,n),n);
 let positive=hi-low;let negative=high-lo;if(positive<0.||negative<0.){return false;}
 let depth=min(positive,negative);if(depth<*best){*best=depth;*normal=select(-n,n,positive<negative);}return true;
}
fn capsulePoly(A:Capsule,P:Poly,sat:ptr<function,Sat>)->Found{
 var found:Found;var best=3.4e38;var points:SegmentPair;let direction=A.b-A.a;var insideLo=0.;var insideHi=1.;
 for(var f=0u;f<P.nf;f++){
  let plane=facePlane(P,f);let n=plane.xyz;let s=dot(n,A.a)-plane.w;let slope=dot(n,direction);
  if(abs(slope)<1.e-12){if(s>0.){insideLo=2.;}}else if(slope>0.){insideHi=min(insideHi,-s/slope);}else{insideLo=max(insideLo,-s/slope);}
  let count=faceVertCount(P,f);var center=vec3f(0.);for(var j=0u;j<count;j++){center+=vert(P,faceVert(P,f,j));}center/=f32(count);
  var lo=0.;var hi=1.;let projectedA=A.a-n*s;let projectedD=direction-n*slope;
  for(var j=0u;j<count;j++){
   let a=vert(P,faceVert(P,f,j));let b=vert(P,faceVert(P,f,(j+1u)%count));var side=cross(b-a,n);if(dot(side,center-a)>0.){side=-side;}
   let edgeS=dot(side,projectedA-a);let edgeD=dot(side,projectedD);if(abs(edgeD)<1.e-12){if(edgeS>1.e-7){lo=2.;}}else if(edgeD>0.){hi=min(hi,-edgeS/edgeD);}else{lo=max(lo,-edgeS/edgeD);}
   let pair=capSegments(A.a,A.b,a,b);let dist=dot(pair.a-pair.b,pair.a-pair.b);if(dist<best){best=dist;points=pair;}
  }
  if(lo<=hi){var t=.5*(lo+hi);if(abs(slope)>1.e-12){t=clamp(-s/slope,lo,hi);}let p=A.a+t*direction;let q=p-n*(s+t*slope);let dist=dot(p-q,p-q);if(dist<best){best=dist;points=SegmentPair(p,q);}}
 }
 let inside=insideLo<=insideHi;let distance=sqrt(best);if(!inside&&distance>A.r){return found;}var n=vec3f(0.);
 if(!inside&&distance>1.e-8){n=(points.b-points.a)/distance;}else{
  var depth=3.4e38;
  for(var f=0u;f<P.nf;f++){if(!capPolyAxis(A,P,facePlane(P,f).xyz,&depth,&n)){return found;}}
  for(var e=0u;e<P.ne;e++){let edge=edgeOf(P,e);if(!capPolyAxis(A,P,cross(direction,vert(P,edge.y)-vert(P,edge.x)),&depth,&n)){return found;}}
  for(var v=0u;v<P.nv;v++){let vertex=vert(P,v);if(!capPolyAxis(A,P,vertex-capSegmentPoint(A.a,A.b,vertex),&depth,&n)){return found;}}
  points.a=select(A.a,A.b,dot(A.b,n)>dot(A.a,n));points.b=points.a+n*(A.r-depth);
 }
 (*sat).n=n;addFound(&found,points.a+n*A.r,points.b,4u<<24u);return found;
}
`;var bn=`// GPU queries against current poses. Rounded box/hull sweeps test offset faces
// and rounded edges, so expanding a bounding box cannot create corner hits.
struct Query { origin:vec4f, direction:vec4f }
struct Params { head:vec4u, flags:vec4u, ignored:array<vec4u,4> }
struct Hit { t:f32, n:vec3f }
@group(0) @binding(0) var<storage,read> bodies:array<vec4f>;
@group(0) @binding(1) var<storage,read> hulls:array<vec4u>;
@group(0) @binding(2) var<storage,read> queries:array<Query>;
@group(0) @binding(3) var<storage,read_write> best:array<atomic<u32>>;
@group(0) @binding(4) var<storage,read_write> hits:array<vec4f>;
@group(0) @binding(5) var<uniform> params:Params;
@group(0) @binding(6) var<storage,read> filters:array<vec2u>;
const MISS=Hit(-1.,vec3f(0.));
const DIM=3u;
const STRIDE=10u;
var<private> FACE_VERTS:array<u32,24>=array<u32,24>(1u,3u,7u,5u,0u,2u,6u,4u,2u,3u,7u,6u,0u,1u,5u,4u,4u,5u,7u,6u,0u,1u,3u,2u);
var<private> EDGES:array<vec2u,12>=array<vec2u,12>(vec2u(0u,1u),vec2u(2u,3u),vec2u(4u,5u),vec2u(6u,7u),vec2u(0u,2u),vec2u(1u,3u),vec2u(4u,6u),vec2u(5u,7u),vec2u(0u,4u),vec2u(1u,5u),vec2u(2u,6u),vec2u(3u,7u));
fn turn(q:vec4f,v:vec3f)->vec3f{let t=2.*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
fn closest(a:vec3f,b:vec3f,p:vec3f)->vec3f{let e=b-a;return a+e*clamp(dot(p-a,e)/max(dot(e,e),1.e-20),0.,1.);}
fn raySphere(o:vec3f,d:vec3f,c:vec3f,r:f32)->Hit{
 let v=o-c;let b=dot(v,d);let disc=b*b-dot(v,v)+r*r;if(disc<0.){return MISS;}let t=-b-sqrt(disc);if(t<0.){return MISS;}
 let p=o+d*t-c;return Hit(t,select(-d,p/max(length(p),1.e-20),length(p)>1.e-10));
}
fn rayCapsule(o:vec3f,d:vec3f,a:vec3f,b:vec3f,r:f32)->Hit{
 let ba=b-a;let oa=o-a;let bb=dot(ba,ba);if(bb<1.e-16){return raySphere(o,d,a,r);}
 let bd=dot(ba,d);let bo=dot(ba,oa);let od=dot(oa,d);let A=bb-bd*bd;let B=bb*od-bo*bd;let C=bb*dot(oa,oa)-bo*bo-r*r*bb;
 var hit=MISS;let disc=B*B-A*C;
 if(A>1.e-12*bb&&disc>=0.){let t=(-B-sqrt(disc))/A;let y=bo+t*bd;
  if(t>=0.&&y>=0.&&y<=bb){let p=o+d*t;hit=Hit(t,normalize(p-(a+ba*y/bb)));}}
 for(var end=0u;end<2u;end++){let c=select(a,b,end==1u);let h=raySphere(o,d,c,r);
  if(h.t>=0.&&(hit.t<0.||h.t<hit.t)){hit=h;}}
 return hit;
}
fn vertex(v:u32,h:vec3f,header:u32,isHull:bool)->vec3f{
 if(isHull){return bitcast<vec4f>(hulls[hulls[header].x+v]).xyz;}
 return vec3f(select(-h.x,h.x,(v&1u)!=0u),select(-h.y,h.y,(v&2u)!=0u),select(-h.z,h.z,(v&4u)!=0u));
}
fn plane(f:u32,h:vec3f,header:u32,isHull:bool)->vec4f{
 if(isHull){return bitcast<vec4f>(hulls[hulls[header].z+2u*f]);}
 let k=f/2u;var n=vec3f(0.);n[k]=select(1.,-1.,(f&1u)!=0u);return vec4f(n,h[k]);
}
fn faceCount(f:u32,header:u32,isHull:bool)->u32{if(isHull){return hulls[hulls[header].z+2u*f+1u].y;}return 4u;}
fn faceVertex(f:u32,j:u32,header:u32,isHull:bool)->u32{
 if(isHull){let index=hulls[hulls[header].z+2u*f+1u].x+j;return hulls[hulls[header+1u].z+index/4u][index%4u];}
 return FACE_VERTS[f*4u+j];
}
fn onFace(p:vec3f,f:u32,h:vec3f,header:u32,isHull:bool)->bool{
 let count=faceCount(f,header,isHull);let normal=plane(f,h,header,isHull).xyz;var center=vec3f(0.);
 for(var j=0u;j<count;j++){center+=vertex(faceVertex(f,j,header,isHull),h,header,isHull);}center/=f32(count);
 for(var j=0u;j<count;j++){let a=vertex(faceVertex(f,j,header,isHull),h,header,isHull);let b=vertex(faceVertex(f,(j+1u)%count,header,isHull),h,header,isHull);let side=cross(b-a,normal);
  if(dot(side,p-a)*select(-1.,1.,dot(side,center-a)>=0.) < -1.e-6){return false;}}
 return true;
}
fn roundedPoly(o:vec3f,d:vec3f,h:vec3f,header:u32,isHull:bool,r:f32)->Hit{
 var nf=6u;var ne=12u;if(isHull){nf=hulls[header].w;ne=hulls[header+1u].y;}
 if(r==0.){
  var enter= -3.4e38;var exit=3.4e38;var normal= -d;
  for(var f=0u;f<nf;f++){let pl=plane(f,h,header,isHull);let denom=dot(pl.xyz,d);let gap=pl.w-dot(pl.xyz,o);
   if(abs(denom)<1.e-12){if(gap<0.){return MISS;}}else{let t=gap/denom;if(denom<0.){if(t>enter){enter=t;normal=pl.xyz;}}else{exit=min(exit,t);}}
   if(enter>exit){return MISS;}}
  if(exit<0.){return MISS;}if(enter<=0.){return Hit(0.,-d);}return Hit(enter,normal);
 }
 var inside=true;var distance=3.4e38;var hit=MISS;
 for(var f=0u;f<nf;f++){
  let pl=plane(f,h,header,isHull);let signed=dot(pl.xyz,o)-pl.w;if(signed>0.){inside=false;}
  let projection=o-pl.xyz*signed;if(onFace(projection,f,h,header,isHull)){distance=min(distance,signed*signed);}
  let denom=dot(pl.xyz,d);if(denom< -1.e-12){let t=(pl.w+r-dot(pl.xyz,o))/denom;
   if(t>=0.&&(hit.t<0.||t<hit.t)&&onFace(o+d*t-pl.xyz*r,f,h,header,isHull)){hit=Hit(t,pl.xyz);}}
 }
 for(var e=0u;e<ne;e++){
  var edge=EDGES[e%12u];if(isHull){edge=hulls[hulls[header+1u].x+e].xy;}
  let a=vertex(edge.x,h,header,isHull);let b=vertex(edge.y,h,header,isHull);let q=o-closest(a,b,o);distance=min(distance,dot(q,q));
  if(r>0.){let candidate=rayCapsule(o,d,a,b,r);if(candidate.t>=0.&&(hit.t<0.||candidate.t<hit.t)){hit=candidate;}}
 }
 if(inside||distance<=r*r){return Hit(0.,-d);}return hit;
}
fn roundedBox2D(o:vec3f,d:vec3f,h:vec3f,r:f32)->Hit{
 let nearest=clamp(o.xy,-h.xy,h.xy);if(dot(o.xy-nearest,o.xy-nearest)<=r*r){return Hit(0.,-d);}var hit=MISS;
 for(var k=0u;k<2u;k++){for(var side=0u;side<2u;side++){
  let sign=select(-1.,1.,side==1u);if(d[k]*sign< -1.e-12){let t=(sign*(h[k]+r)-o[k])/d[k];let p=o+d*t;
   if(t>=0.&&abs(p[1u-k])<=h[1u-k]&&(hit.t<0.||t<hit.t)){var n=vec3f(0.);n[k]=sign;hit=Hit(t,n);}}
 }}
 if(r>0.){for(var k=0u;k<4u;k++){let c=vec3f(select(-h.x,h.x,(k&1u)!=0u),select(-h.y,h.y,(k&2u)!=0u),0.);let candidate=raySphere(o,d,c,r);if(candidate.t>=0.&&(hit.t<0.||candidate.t<hit.t)){hit=candidate;}}}return hit;
}
fn roundedSegmentQuery2D(o:vec3f,d:vec3f,half:f32,r:f32)->Hit {
 let a=vec3f(-half,0.,0.);let b=vec3f(half,0.,0.);let delta=o-closest(a,b,o);
 if(dot(delta,delta)<=r*r){return Hit(0.,-d);}
 if(r>0.){return rayCapsule(o,d,a,b,r);}
 // A zero-thickness line still has a well-defined transverse intersection.
 // A rotated world-space line has f32 transform error. Recognize collinearity
 // at that precision before dividing by an almost-zero perpendicular direction.
 if(abs(d.y)<1e-7&&abs(o.y)<1e-6*max(1.,half)){
  if(abs(o.x)<=half){return Hit(0.,-d);}
  if(o.x< -half&&d.x>0.){return Hit((-half-o.x)/d.x,vec3f(-1.,0.,0.));}
  if(o.x>half&&d.x<0.){return Hit((half-o.x)/d.x,vec3f(1.,0.,0.));}
  return MISS;
 }
 if(abs(d.y)<1e-12){return MISS;}
 let t=-o.y/d.y;let x=o.x+t*d.x;
 if(t<0.||abs(x)>half){return MISS;}
 return Hit(t,vec3f(0.,select(1.,-1.,d.y>0.),0.));
}
fn shapeQuery2D(index:u32,o:vec3f,d:vec3f,size:vec3f,r:f32)->Hit {
 if(params.flags.w==0u){return roundedBox2D(o,d,size*.5,r);}
 let g=bitcast<vec4f>(hulls[index]);
 if(g.x==4.){return polygonQuery2D(o,d,u32(g.z),u32(g.w),r);}
 if(g.x==1.){let radius=g.y+r;if(dot(o,o)<=radius*radius){return Hit(0.,-d);}return raySphere(o,d,vec3f(0.),radius);}
 if(g.x==2.){return roundedSegmentQuery2D(o,d,g.z,g.y+r);}
 if(g.x==3.) {
  if(o.y<=r){return Hit(0.,-d);}if(d.y>=-1e-12){return MISS;}
  return Hit((r-o.y)/d.y,vec3f(0.,1.,0.));
 }
 return roundedBox2D(o,d,size*.5,r);
}
fn polygonQuery2D(o:vec3f,d:vec3f,offset:u32,count:u32,r:f32)->Hit {
 var inside=true;var distance=3.4e38;var hit=MISS;
 for(var k=0u;k<count;k++) {
  let record=bitcast<vec4f>(hulls[offset+k]);let a=vec3f(record.xy,0.);let b=vec3f(bitcast<vec4f>(hulls[offset+(k+1u)%count]).xy,0.);
  let n=vec3f(record.zw,0.);let signed=dot(o-a,n);if(signed>0.){inside=false;}
  let delta=o-closest(a,b,o);distance=min(distance,dot(delta,delta));
  let denom=dot(d,n);
  if(denom< -1e-12) {
   let t=(r-signed)/denom;let p=o+d*t-n*r;let edge=b-a;let along=dot(p-a,edge);
   let tolerance=1e-6*dot(edge,edge);
   if(t>=0.&&along>=-tolerance&&along<=dot(edge,edge)+tolerance&&(hit.t<0.||t<hit.t)){hit=Hit(t,n);}
  }
  if(r>0.){let candidate=raySphere(o,d,a,r);if(candidate.t>=0.&&(hit.t<0.||candidate.t<hit.t)){hit=candidate;}}
 }
 if(inside||distance<=r*r){return Hit(0.,-d);}return hit;
}
fn trace(index:u32,query:Query)->Hit{
 let base=index*STRIDE;var position=bodies[base].xyz;var q=vec4f(0.,0.,0.,1.);var size=vec3f(0.);var shape=0.;
 if(DIM==2u){let angle=position.z;position.z=0.;q=vec4f(0.,0.,sin(angle*.5),cos(angle*.5));size=vec3f(bodies[base+5u].xy,0.);}
 else{q=bodies[base+1u];size=bodies[base+4u].xyz;shape=bodies[base+9u].w;}
 let inv=vec4f(-q.xyz,q.w);let o=turn(inv,query.origin.xyz-position);let d=turn(inv,query.direction.xyz);let r=query.direction.w;var hit=MISS;
 if(DIM==2u){hit=shapeQuery2D(index,o,d,size,r);}
 else if(shape==1.){let radius=size.x*.5+r;if(dot(o,o)<=radius*radius){hit=Hit(0.,-d);}else{hit=raySphere(o,d,vec3f(0.),radius);}}
 else if(shape== -1.){let half=max(0.,size.y*.5-size.x*.5);let a=vec3f(0.,-half,0.);let b=vec3f(0.,half,0.);let radius=size.x*.5+r;let delta=o-closest(a,b,o);if(dot(delta,delta)<=radius*radius){hit=Hit(0.,-d);}else{hit=rayCapsule(o,d,a,b,radius);}}
 else {let hull=shape>=3.;hit=roundedPoly(o,d,size*.5,u32(max(0.,shape-3.)+.5),hull,r);}
 if(hit.t>query.origin.w){return MISS;}hit.n=turn(q,hit.n);return hit;
}
fn ignored(index:u32)->bool{
 if(params.flags.y!=0u&&(filters[index].x&params.head.w)==0u){return true;}
 if(params.flags.y==0u&&params.head.w==0u){return true;}
 let sensor=select(bodies[index*STRIDE+2u].w,bodies[index*STRIDE+1u].w,DIM==2u);
 if(params.flags.x!=0u&&params.flags.z!=0u&&sensor!=0.){return true;}
 for(var k=0u;k<params.head.z;k++){if(params.ignored[k/4u][k%4u]==index){return true;}}return false;
}
@compute @workgroup_size(64)
fn nearest(@builtin(global_invocation_id) id:vec3u){if(id.x>=params.head.x||ignored(id.x)){return;}let h=trace(id.x,queries[id.y]);if(h.t>=0.){atomicMin(&best[id.y*2u],bitcast<u32>(max(0.,h.t)));}}
@compute @workgroup_size(64)
fn owner(@builtin(global_invocation_id) id:vec3u){if(id.x>=params.head.x||ignored(id.x)){return;}let h=trace(id.x,queries[id.y]);if(h.t>=0.&&bitcast<u32>(max(0.,h.t))==atomicLoad(&best[id.y*2u])){atomicMin(&best[id.y*2u+1u],id.x);}}
@compute @workgroup_size(64)
fn finish(@builtin(global_invocation_id) id:vec3u){if(id.x>=params.head.y){return;}let index=atomicLoad(&best[id.x*2u+1u]);if(index==0xffffffffu){hits[id.x*2u]=vec4f(0.,0.,0.,-1.);return;}let h=trace(index,queries[id.x]);hits[id.x*2u]=vec4f(h.n,max(0.,h.t));hits[id.x*2u+1u]=vec4f(bitcast<f32>(index),0.,0.,0.);}
`;var pi=class{constructor(e,t=3){this.solver=e,this.dimension=t,this.jobs=new Set,this.idle=[],this.destroyed=!1;let i=e.device,r=i.createShaderModule({label:`AVBD ${t}D queries`,code:t===2?bn.replace("const DIM=3u;","const DIM=2u;").replace("const STRIDE=10u;","const STRIDE=6u;"):bn});this.layout=i.createBindGroupLayout({entries:["read-only-storage","read-only-storage","read-only-storage","storage","storage","uniform","read-only-storage"].map((a,n)=>({binding:n,visibility:GPUShaderStage.COMPUTE,buffer:{type:a}}))});let o=i.createPipelineLayout({bindGroupLayouts:[this.layout]});this.pipes=Object.fromEntries(["nearest","owner","finish"].map(a=>[a,i.createComputePipeline({layout:o,compute:{module:r,entryPoint:a}})])),this.dummy=i.createBuffer({size:16,usage:GPUBufferUsage.STORAGE})}acquire(e){if(this.destroyed)throw Error("GPU queries have been destroyed");let t=this.idle.findIndex(r=>r.capacity>=e),i=t>=0?this.idle.splice(t,1)[0]:this.idle.pop()??{};if(!i.capacity||i.capacity<e){let r=Math.min(65535,Math.max(e,(i.capacity??0)*2,16));for(let[o,a,n]of[["queryBuffer",r*32,GPUBufferUsage.STORAGE],["best",r*8,GPUBufferUsage.STORAGE],["hits",r*32,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC],["uniform",96,GPUBufferUsage.UNIFORM],["read",r*32,GPUBufferUsage.MAP_READ]])i[o]?.destroy(),i[o]=this.solver.device.createBuffer({size:a,usage:n|GPUBufferUsage.COPY_DST});i.capacity=r,i.buffers=null,i.data=new Float32Array(r*8),i.initial=new Uint32Array(r*2),i.params=new Uint32Array(24)}return this.jobs.add(i),i}release(e){if(e.read.unmap(),!this.destroyed&&e.capacity*104<=2*1024*1024&&this.idle.length<2)this.idle.push(e);else{for(let t of["queryBuffer","best","hits","uniform","read"])e[t].destroy();this.jobs.delete(e)}}async cast(e,{ignore:t=[],collidesWith:i=4294967295,includeTriggers:r=!0,maxDistance:o}={}){if(this.destroyed)throw Error("GPU queries have been destroyed");let a=this.solver,n=a.device,l=this.dimension;if(!Number.isInteger(i)||i<0||i>4294967295)throw Error("Query mask must be an unsigned 32-bit integer");if(typeof r!="boolean")throw Error("includeTriggers must be boolean");if(t.length>16||t.some(d=>!Number.isInteger(d)||d<0||d>=a.bodyCount))throw Error("Queries can ignore up to 16 live body indices");if(e.length>Math.min(65535,n.limits.maxComputeWorkgroupsPerDimension))throw Error("Too many queries in one batch");let c=e.map(d=>{let p=Array.from(d.origin),m=Array.from(d.direction),h=d.radius??0,g=d.maxDistance??o??3e38;if(p.length!==l||m.length!==l||![...p,...m].every(Number.isFinite)||Math.hypot(...m)===0)throw Error(`A query requires ${l} finite components and a nonzero direction`);if(!Number.isFinite(h)||h<0||!Number.isFinite(g)||g<0)throw Error("Query radius and maximum distance must be finite and nonnegative");let b=Math.hypot(...m);return{origin:p,direction:m.map(y=>y/b),radius:h,maxDistance:g}});if(!c.length)return[];let u=c.length,f=this.acquire(u);try{let d=f.data;c.forEach((I,E)=>{d.set([...I.origin,...Array(3-l).fill(0),I.maxDistance,...I.direction,...Array(3-l).fill(0),I.radius],E*8)});let p=f.params;p.fill(0),p.set([a.bodyCount,u,t.length,i,r?0:1,l===3||a.filters?1:0,a.sensorsEnabled?1:0,l===2&&a.shapeBuffer?1:0]),p.set(t,8);let m=f.initial;for(let I=0;I<u;I++)m.set([2139095040,4294967295],I*2);let{queryBuffer:h,best:g,hits:b,uniform:y,read:A}=f;n.queue.writeBuffer(h,0,d.buffer,0,u*32),n.queue.writeBuffer(g,0,m.buffer,0,u*8),n.queue.writeBuffer(y,0,p);let v=[a.bodyBuffer,l===3?a.hullStorage:a.shapeBuffer??this.dummy,h,g,b,y,l===3?a.filterStorage:a.filters??this.dummy];(!f.buffers||v.some((I,E)=>I!==f.buffers[E]))&&(f.group=n.createBindGroup({layout:this.layout,entries:v.map((I,E)=>({binding:E,resource:{buffer:I}}))}),f.buffers=v);let x=n.createCommandEncoder(),w=x.beginComputePass();w.setBindGroup(0,f.group);for(let I of["nearest","owner"])w.setPipeline(this.pipes[I]),w.dispatchWorkgroups(Math.ceil(a.bodyCount/64),u);w.setPipeline(this.pipes.finish),w.dispatchWorkgroups(Math.ceil(u/64)),w.end(),x.copyBufferToBuffer(b,0,A,0,u*32),n.queue.submit([x.finish()]),await A.mapAsync(GPUMapMode.READ,0,u*32);let B=A.getMappedRange(0,u*32),L=new Float32Array(B),M=new Uint32Array(B);return c.map((I,E)=>{let k=L[E*8+3];if(k<0)return null;let P=Array.from(L.slice(E*8,E*8+l)),C=I.origin.map((_,z)=>_+k*I.direction[z]);return{index:M[E*8+4],distance:k,normal:P,center:C,point:C.map((_,z)=>_-I.radius*P[z])}})}finally{this.release(f)}}destroy(){this.destroyed=!0;for(let e of this.jobs)for(let t of["queryBuffer","best","hits","uniform","read"])e[t].destroy();this.jobs.clear(),this.idle.length=0,this.dummy.destroy()}};function fo(s,e){let t=this.passConstantCache??={alphas:[]},i=t.iterations!==s||t.colors!==this.colorCap||t.buffer!==this.passBuffer||!this.passGroup;for(let n=0;n<s;n++){let l=typeof e=="function"?e(n):e;t.alphas[n]!==l&&(i=!0),t.alphas[n]=l}if(!i)return;let r=this.colorCap+1,o=Math.max(s*r,1),a=o*256;(o>this.passEntries||!this.passGroup)&&(this.passBuffer?.destroy(),this.passBuffer=this.device.createBuffer({label:"AVBD pass constants",size:a,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.passEntries=o,this.passGroup=this.device.createBindGroup({layout:this.layouts.pass,entries:[{binding:0,resource:{buffer:this.passBuffer,size:16}}]})),(!t.data||t.data.byteLength<a)&&(t.data=new ArrayBuffer(Math.max(a,(t.data?.byteLength??0)*2)),t.u32=new Uint32Array(t.data),t.f32=new Float32Array(t.data)),t.u32[2]=s;for(let n=0;n<s;n++)for(let l=0;l<=this.colorCap;l++){let c=(n*r+l)*256/4;t.u32[c]=l,t.u32[c+2]=s,t.f32[c+1]=t.alphas[n]}this.device.queue.writeBuffer(this.passBuffer,0,t.data,0,a),t.iterations=s,t.colors=this.colorCap,t.buffer=this.passBuffer,t.uploads=(t.uploads??0)+1}function ac(s,e){return s.stepParamsCache??=hi(e)}function nc(s,e,t){let i=s.bodyCapacity;t[7]=s.bodyCount,t[8]=s.jointCount,t[9]=s.colorCap,e[10]=s.cellSize,t[11]=s.tableSize-1,e[12]=s.maxSmallRadius,t[13]=s.largeCount,t[14]=s.noCollideCount,t[15]=s.pairCapacity,t[16]=s.contactCapacity,t[17]=s.hashSize-1,t[18]=i+1,t[19]=2*i+1,t[20]=s.tableSize+1,t[21]=2*s.tableSize+1,t[22]=2*s.tableSize+1+i,t[23]=i,t[24]=s.colorHistOffset,t[25]=2*i,t[26]=s.colorGroups,t[27]=2*i+65,t[28]=s.colorRounds}function lc(s,e){let t=ac(this,32),{f:i,u:r}=t,o=this.params;i[0]=o.dt,i[1]=o.gravity,i[2]=o.beta,i[3]=o.gamma,i[4]=s,i[5]=o.vbdStiffness,r[6]=(o.vbd?1:0)|(o.stiffnessRescale?2:0)|(e?4:0)|(o.matchNearest?8:0),nc(this,i,r),Qt(this.device,this.paramsBuffer,t)}function cc(){let s=ac(this,ls),{f:e,u:t}=s,i=this.params;e[0]=i.dt,e[1]=i.gravity,e[2]=i.betaLin,e[3]=i.betaAng,e[4]=i.gamma,e[5]=i.alpha,t[6]=(i.matchNearest?rs:0)|(i.faceBias?ss:0)|(i.reuseContacts?os:0)|(i.startAtRest?as:0)|(i.massPenalty?ns:0),nc(this,e,t),t[29]=this.manifoldCapacity,t[30]=this.stepCount;let r=o=>Math.min(31,Math.max(0,Math.round(Math.log2(o))));t[31]=r(this.primalLanes[0])|r(this.primalLanes[1])<<8|r(this.primalLanes[2])<<16,e[32]=i.windSpeed*Math.cos(i.windAngle),e[33]=i.windSpeed*Math.sin(i.windAngle),e[34]=0,e[35]=i.windPressure,e[36]=i.windGust,e[40]=i.up[0],e[41]=i.up[1],e[42]=i.up[2],e[43]=0,Qt(this.device,this.paramsBuffer,s)}function uc(s){let e=(i,r)=>{if(s.split(i).length!==2)throw Error("Review packed Newton accumulator integration");s=s.replace(i,r)};e(`  lin: mat3x3f,
  ang: mat3x3f,`,`  lin: mat2x3f,
  ang: mat2x3f,`),e("fn addRow(acc:",`fn symmetricOuter(v: vec3f) -> mat2x3f {
  return mat2x3f(v * v, vec3f(v.y * v.x, v.z * v.x, v.z * v.y));
}

fn addRow(acc:`),e("outer(l, l) * k","symmetricOuter(l) * k"),e("outer(a, a) * k","symmetricOuter(a) * k"),e("mat3x3f(vec3f(g.x, 0.0, 0.0), vec3f(0.0, g.y, 0.0), vec3f(0.0, 0.0, g.z))","mat2x3f(g, vec3f(0.0))"),e("mat3x3f(vec3f(m, 0.0, 0.0), vec3f(0.0, m, 0.0), vec3f(0.0, 0.0, m))","mat2x3f(vec3f(m), vec3f(0.0))"),e("mat3x3f(vec3f(I.x, 0.0, 0.0), vec3f(0.0, I.y, 0.0), vec3f(0.0, 0.0, I.z))","mat2x3f(I, vec3f(0.0))");let t={"0][0":"0][0","0][1":"1][0","0][2":"1][1","1][1":"0][1","1][2":"1][2","2][2":"0][2"};return s=s.replace(/acc\.(lin|ang)\[(\d)\]\[(\d)\]/g,(i,r,o,a)=>{let n=t[`${o}][${a}`];if(!n)throw Error("Unexpected Newton accumulator entry");return`acc.${r}[${n}]`}),s}var vn=["pos","rot","initialPos","initialRot","size","moment","inertialPos","inertialRot","vel","angVel"],Gf=/bodies\[([^\]]+)\]\.([A-Za-z]+)/g;function Ff(s){let e=new Map;for(let t of s.matchAll(/\bfn (\w+)\(/g)){let i=t.index,r=s.indexOf("{",i),o=1,a=r+1;for(;o&&a<s.length;a++)s[a]==="{"&&o++,s[a]==="}"&&o--;if(o)throw Error("Review compact body function boundaries");e.set(t[1],{start:i,brace:r,end:a,text:s.slice(i,a),body:s.slice(r+1,a-1)})}return e}function xn(s){let e=Ff(s),t=m=>{let h=e.get(m);if(!h)throw Error(`Review compact body integration: ${m}`);return h},i=(m,h)=>m.replace(Gf,(g,b,y)=>{let A=vn.indexOf(y);if(A<0)throw Error(`Review compact body field: ${y}`);return h?`bodies[compactBodySlot(u32(${b}), ${A}u)]`:`bodies[u32(${b}) * 10u + ${A}u]`}),r=m=>[...m.matchAll(/\b(\w+)\s*\(/g)].map(h=>h[1]).filter(h=>e.has(h)),o=new Set([...e].filter(([,m])=>m.body.includes("bodies[")).map(([m])=>m)),a;do{a=!1;for(let[m,h]of e)!o.has(m)&&r(h.body).some(g=>o.has(g))&&(o.add(m),a=!0)}while(a);let n=new Set,l=m=>{for(let h of r(t(m).body))!o.has(h)||n.has(h)||(n.add(h),l(h))};l("warmStartJoints"),l("warmStartBodies");let c=m=>m.replace(/\b(\w+)(?=\s*\()/g,h=>n.has(h)?`${h}BodyRecords`:h),u=[...n].map(m=>c(i(t(m).text,!1))).join(`

`),f=(m,h)=>{let g=t(m).body;for(let y of["  if (!solverStepValid()) { return; }","  let i = gid.x;","  if (i >= params.bodyCount) { return; }"]){if(g.split(y).length!==2)throw Error(`Review compact body entry: ${m}`);g=g.replace(y,"")}g=g.replace(/bodies\[i\]\.([A-Za-z]+)/g,"value.$1"),h||(g=c(g));let b=(y,A)=>A?`compactBodySlot(i, ${y}u)`:`i * 10u + ${y}u`;return`fn ${m}(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  let allocated = i < params.stateBOffset;
  var value: Body;
  if (allocated) { value = Body(${vn.map((y,A)=>`bodies[${b(A,h)}]`).join(", ")}); }
  if (i < params.bodyCount && solverStepValid()) { ${g} }
  // All threads finish reading their tile before any thread overwrites it.
  // Inactive and unused records participate, including a partial final tile.
  storageBarrier();
  if (allocated) { ${vn.map((y,A)=>`bodies[${b(A,!h)}] = value.${y};`).join(`
`)} }
}`},d=[[t("warmStartJoints"),c(i(t("warmStartJoints").text,!1))],[t("warmStartBodies"),f("warmStartBodies",!1)],[t("updateVelocities"),f("updateVelocities",!0)]].sort(([m],[h])=>h.start-m.start);for(let[m,h]of d)s=s.slice(0,m.start)+h+s.slice(m.end);let p="var<storage, read_write> bodies: array<Body>;";if(s.split(p).length!==2)throw Error("Review compact body storage binding");return s=s.replace(p,"var<storage, read_write> bodies: array<vec4f>;"),i(s,!0)+`
${u}
fn compactBodySlot(i: u32, field: u32) -> u32 {
  let tile = i / 64u * 64u;
  let width = min(64u, params.stateBOffset - tile);
  if (field < 4u) { return tile * 10u + (i % 64u) * 4u + field; }
  return tile * 10u + width * 4u + (i % 64u) * 6u + field - 4u;
}
`}var ho=256;function fc(s){let e=(t,i)=>{if(s.split(t).length!==2)throw Error("Review parallel dual integration");s=s.replace(t,i)};return e("fn dualManifold(m: u32) {","fn dualManifold(m: u32, lane: u32) {"),e("for (var c = mf.ids.z; c < end; c++) {","for (var c = mf.ids.z + lane; c < end; c += 4u) {"),e(`  let id = gid.x;
  if (id < params.jointCount) { dualJoint(id); }
  else if (id - params.jointCount < manifoldCount()) { dualManifold(id - params.jointCount); }`,`  let id = (gid.x + gid.y * ${ho*64}u) / 4u;
  let lane = gid.x % 4u;
  if (id < params.jointCount) { if (lane == 0u) { dualJoint(id); } }
  else if (id - params.jointCount < manifoldCount()) { dualManifold(id - params.jointCount, lane); }`),s}function An(s,e){let t=s.dualArgPipelines??={serial:s.pipes.argsContacts};if(e&&!t.parallel){let i=Yr(ge,Zs),r="setArgs(IA_CONSTRAINTS, params.jointCount + items);";if(i.split(r).length!==2)throw Error("Review parallel contact dispatch sizing");let o=i.replace(r,`let blocks = groupsFor((params.jointCount + items) * 4u);
  args[IA_CONSTRAINTS] = min(blocks, ${ho}u);
  args[IA_CONSTRAINTS + 1u] = max(1u, (blocks + ${ho-1}u) / ${ho}u);
  args[IA_CONSTRAINTS + 2u] = 1u;`);t.parallel=s.device.createComputePipeline({layout:s.device.createPipelineLayout({bindGroupLayouts:[s.layouts.args]}),compute:{module:s.device.createShaderModule({code:o}),entryPoint:"argsContacts"}})}s.pipes.argsContacts=e?t.parallel:t.serial,s.parallelDual=e}var wn=new WeakMap;function po(s){return wn.get(s)}function dc(s,e){e?wn.set(s,Object.freeze({...e})):wn.delete(s)}function Bn(s){let e=s.indexOf("/** A partial system per body slot handed between lanes (primal). */"),t=s.indexOf("fn accumulate(",e),i=s.lastIndexOf("/**",t);if(e<0||t<0||i<=e)throw Error("3D primal layout changed; review the compatibility kernel");return s.slice(0,e)+`
@compute @workgroup_size(64)
fn primal(@builtin(global_invocation_id) gid: vec3u) {
  let start = color[params.colorStartOffset + pc.color];
  let count = color[params.colorStartOffset + pc.color + 1u] - start;
  if (gid.x >= count || !solverStepValid()) { return; }
  let i = color[params.colorBodiesOffset + start + gid.x];
  finishBody(i, accumulate(i, 0u, 1u));
}

`+s.slice(i)}function mi(s,e,t){if(s.split(e).length!==2)throw Error("3D contact layout changed; review the compatibility kernel");return s.replace(e,t)}function mo(s,e,t){let i=new RegExp(`struct ${e} \\{[^}]*\\}`,"g");if([...s.matchAll(i)].length!==1)throw Error(`Expected one 3D ${e} layout`);return s.replace(i,t)}function hc(s,e,t){let i=`fn ${e}(`;if(s.split(i).length!==2)throw Error(`Expected one 3D ${e} function`);let r=s.indexOf(i),a=s.indexOf("{",r)+1,n=1;for(;a<s.length&&n;a++)s[a]==="{"&&n++,s[a]==="}"&&n--;if(n)throw Error(`Incomplete 3D ${e} function`);return s.slice(0,r)+t(s.slice(r,a))+s.slice(a)}function Cn(s){s=mo(s,"PairBody",`struct PairBody {
  ids: vec4u,
  rot: vec4f,
  dLin: vec4f,
  dAng: vec4f,
}`),s=mi(s,"return PairBody(i, rot, bodies[i].pos.xyz - bodies[i].initialPos.xyz, qsub(rot, bodies[i].initialRot));","return PairBody(vec4u(i, 0u, 0u, 0u), rot, vec4f(bodies[i].pos.xyz - bodies[i].initialPos.xyz, 0.0), vec4f(qsub(rot, bodies[i].initialRot), 0.0));"),s=s.replace(/\b(A|B)\.index\b/g,"$1.ids.x").replace(/\b(A|B)\.(dLin|dAng)\b/g,"$1.$2.xyz"),s=mo(s,"Contact",`struct Contact {
  anchorA: vec4u, // xyz: float bits, w: integer feature key
  anchorB: vec4f, // xyz: anchor, w: normal error
  penalty: vec4f, // xyz: penalties, w: first tangent error
  force: vec4f,   // xyz: forces, w: second tangent error
}`);let e={rA:"bitcast<vec3f>(k.anchorA.xyz)",rB:"k.anchorB.xyz",key:"k.anchorA.w",c0x:"k.anchorB.w",c0y:"k.penalty.w",c0z:"k.force.w",pen:"k.penalty.xyz",lam:"k.force.xyz"};for(let t of["evalContact","accumulate","dualManifold"])s=hc(s,t,i=>i.replace(/\bk\.(rA|rB|key|c0x|c0y|c0z|pen|lam)\b/g,(r,o)=>e[o]));return s=mi(s,"contacts[c].lam = e.F;","contacts[c].force = vec4f(e.F, k.force.w);"),s=mi(s,"contacts[c].key =","contacts[c].anchorA.w ="),s=mi(s,"contacts[c].pen = pen;","contacts[c].penalty = vec4f(pen, k.penalty.w);"),s=hc(s,"evalContact",t=>{t=mi(t,`  var e: ContactEval;
`,""),t=mi(t,"  e.rAW =","  let rAW ="),t=mi(t,"  e.rBW =","  let rBW ="),t=t.replaceAll("e.rAW","rAW").replaceAll("e.rBW","rBW"),t=mi(t,"  e.C =","  let C =");let i=t.indexOf("  var F ="),r=t.indexOf("  return e;",i);if(i<0||r<0)throw Error("Expected 3D contact force projection");return t.slice(0,i)+`  let raw = k.penalty.xyz * C + k.force.xyz;
  let normalForce = select(0.0, raw.x, raw.x < 0.0);
  let bounds = abs(normalForce) * friction;
  let frictionScale = length(raw.yz);
  var scale = 1.0;
  if (frictionScale > bounds && frictionScale > 0.0) {
    scale = bounds / frictionScale;
  }
  let force = vec3f(normalForce, raw.yz * scale);
  return ContactEval(vec4f(rAW, 0.0), vec4f(rBW, 0.0),
    vec4f(C, 0.0), vec4f(force, 0.0), vec4f(frictionScale, bounds, 0.0, 0.0));
}`}),s=mo(s,"ContactEval",`struct ContactEval {
  rAW: vec4f,
  rBW: vec4f,
  C: vec4f,
  F: vec4f,
  limits: vec4f, // x: tangent force length, y: Coulomb bound
}`),s=s.replace(/\b(ev|e)\.(rAW|rBW|C|F)\b/g,"$1.$2.xyz").replace(/\be\.frictionScale\b/g,"e.limits.x").replace(/\be\.bounds\b/g,"e.limits.y"),s=mo(s,"PassConstants","struct PassConstants { data: vec4u, }"),s.replaceAll("pc.color","pc.data.x").replaceAll("pc.alpha","bitcast<f32>(pc.data.y)")}function pc(s){if(!s.includes("struct Poly"))return s;let e=`@compute @workgroup_size(64)
fn narrowphase(@builtin(global_invocation_id) gid: vec3u)`;if(s.split(e).length!==2)throw Error("3D hull narrowphase changed; review the compatibility kernel");return s.replace(e,"fn narrowphasePair(gid: vec3u)")+`
@compute @workgroup_size(32)
fn narrowphase(@builtin(global_invocation_id) gid: vec3u) {
  for (var offset = 0u; offset < 2u; offset++) {
    narrowphasePair(vec3u(gid.x * 2u + offset, 0u, 0u));
  }
}
`}function mc(s,e){return e==="points"&&(s=uc(s)),(e==="points"||e==="optimized")&&(s=fc(s)),s}var gi=class extends ro{writeParams(){cc.call(this)}writePassConstants(e,t){fo.call(this,e,t)}constructor(e,t,i={}){if(i.smallGroups!==void 0&&typeof i.smallGroups!="boolean")throw Error("smallGroups must be a boolean");let r=po(e),o=i.scalarPrimal??r?.scalarPrimal??!1,a=i.portableContactMath??r?.portableContactMath??!1,n=t.forces.some(v=>fs(v)),l=t.forces.some(v=>{let x=Ui(v);return x&&(Number.isFinite(x.breakStrain)||Number.isFinite(x.breakForce))}),c={requested:i.solverMode??"auto",contactScheduling:i.contactScheduling??"manifolds",custom:!!i.shaders?.solve},u=Ar({...c,bodyCount:t.bodies.length,constraintCount:t.forces.filter(v=>v instanceof ke||v instanceof dt).length}),f=u.selected==="custom"?i.shaders.solve:u.selected==="optimized"?us:u.selected==="points"?so:void 0,d=r?.broadphase??i.broadphase??"auto";if(!["grid","hploc","auto"].includes(d))throw Error("broadphase must be 'grid', 'hploc' or 'auto'");let p=i.bvh?.rebuildInterval??64;if(!Number.isInteger(p)||p<1)throw Error("BVH rebuildInterval must be a positive integer");for(let[v,x]of[["minimumColors",64],["minimumColorRounds",32]]){let w=i[v]??0;if(!Number.isInteger(w)||w<0||w>x)throw Error(`${v} must be an integer between 0 and ${x}`);if(v==="minimumColorRounds"&&w%2)throw Error("minimumColorRounds must be even")}let m=mc(f??Ge,u.selected),h=sn(on(n?mn(l?oo(m):m):l?oo(m):m));o&&(h=Bn(h)),a&&(h=Cn(h)),u.selected==="points"&&!o&&!a&&!r?.dispatchIsolation&&(h=xn(h));let g=!i.shaders?.contacts&&i.hulls!==!1&&e.limits.maxStorageBuffersPerShaderStage>=9&&t.bodies.some(v=>Ct(v)),b=!i.shaders?.contacts&&t.bodies.some(v=>Fe(v)),y=!i.shaders?.contacts&&t.bodies.some(v=>v.isTrigger);y&&(h=fn(h));let A=v=>(b&&(v=gn(v)),y&&(v=uo(v)),v=Ql(v),a?pc(v):v);if(super(e,t,{...i,shaders:{...i.shaders,contacts:i.shaders?.contacts??A(vr(g)),solve:h,refs:i.shaders?.refs??(i.shaders?.contacts?void 0:Yl(eo)),topology:i.shaders?.topology??(y?dn():void 0)}}),this.solverPolicy=c,this.scalarPrimal=o,this.portableContactMath=a,y&&(this.sensorsEnabled=!0,hn(this)),o&&(this.primalLanes=[1,1,1]),this.dispatchIsolation=r?.dispatchIsolation??!1,!i.shaders?.contacts){this.contactShaders.custom=!1,this.hullShaders=g,this.capsulesEnabled=b;let v=this.contactShaders.make;this.contactShaders.make=x=>v(A(x))}this.springFracture=l,this.angularConstraints=n,this.customSolveSource=i.shaders?.solve,t.forces.forEach((v,x)=>{let w=Ui(v);w&&this.setSpringMaterial(x,w)}),this.adaptiveScheduling=o?!1:i.adaptiveScheduling??!0,this.defaultPrimalLanes=[...this.primalLanes],this.cacheAdjacencyKeys=i.cacheAdjacencyKeys,this.smallGroups=i.smallGroups,this.adjacencyPipelines={original:this.pipes.sortAdjacency},this.selectAdjacencyPipeline(),this.solverDecision=u,this.solvePipelineCache=new Map([[u.selected,Object.fromEntries(["warmStartJoints","warmStartBodies","primal","dual","updateVelocities"].map(v=>[v,this.pipes[v]]))]]),An(this,u.selected==="points"||u.selected==="optimized"),this.minimumColors=i.minimumColors??0,this.minimumColorRounds=i.minimumColorRounds??4,this.colorCap=Math.max(this.minimumColors,this.colorCap),this.colorRounds=Math.max(this.minimumColorRounds,this.colorRounds),this.broadphaseRequested=d,this.broadphase=d==="hploc"?"hploc":"grid",this.bvhOptions=i.bvh??{},this.bvh=null,this.detailCallback=null,this.detailTiming=null,this.profileErrors=[],this.selectBroadphase(),t.forces.forEach((v,x)=>{let w=fs(v);w&&this.setAngularConstraint(x,w)}),t.bodies.forEach((v,x)=>{Fe(v)&&this.installCapsule(this.gpuIndex(x))})}installCapsule(e){if(!this.capsulesEnabled){if(this.contactShaders.custom)throw Error("Analytic capsules require the built-in contact kernel");this.capsulesEnabled=!0;let t=this.contactShaders.make;this.contactShaders.make=i=>t(gn(i)),this.contactShaders.make(vr(this.hullShaders??!1))}this.device.queue.writeBuffer(this.bodyBuffer,e*160+156,new Float32Array([-1]))}async raycast(e,t,i={}){let[r]=await this.raycastAll([{origin:e,direction:t,maxDistance:i.maxDistance}],i);return r}raycastAll(e,t={}){return this.flushPropertyEdits(),this.shapeQueries??=new pi(this),this.shapeQueries.cast(e.map(i=>({...i,radius:0})),t)}async sphereCast(e,t,i,r={}){let[o]=await this.sphereCastAll([{origin:e,radius:t,direction:i,maxDistance:r.maxDistance}],r);return o}sphereCastAll(e,t={}){return this.flushPropertyEdits(),this.shapeQueries??=new pi(this),this.shapeQueries.cast(e,t)}selectBroadphase(){if(this.broadphaseRequested!=="auto"){this.broadphaseDecision={requested:this.broadphaseRequested,selected:this.broadphase,reason:"Explicit selection"};return}let e=new Float64Array(this.bodyCount),t=0,i=0,r=0;for(let d=0;d<this.bodyCount;d++){let p=this.bodies[d];if(p.radius>0&&(e[t++]=p.radius),p.dynamic){i++;let[m,h,g]=p.size,b=Math.min(m,h,g),y=Math.max(m,h,g),A=m+h+g-b-y;!p.sphere&&!p.hull&&b<=.4*A&&A>=.5*y&&r++}}let o=t?to(e.subarray(0,t),t>>1):1,a=this.cellSize/(2*o),n=this.jointCount-this.freeSlots.length,l=i?r/i:0,c=this.bodyCapacity<=16*this.device.limits.maxComputeWorkgroupsPerDimension&&(2*this.bodyCapacity+16*Math.ceil(Math.log2(Math.max(2,this.bodyCapacity)))+32)*32<=this.device.limits.maxStorageBufferBindingSize,u=n>=this.bodyCount&&l>=.25,f=c&&this.bodyCount>=1e4&&(a>=4||u);this.broadphase=f?"hploc":"grid",this.broadphaseDecision={requested:"auto",selected:this.broadphase,bodyCount:this.bodyCount,cellRatio:a,constraintCount:n,thinPlateFraction:l,reason:c?f?u?"Many linked thin plates; the tree avoids empty grid-cell space":"Large grid cells contain many smaller objects":"Grid retained for this body count and size distribution":"The GPU tree exceeds this adapter's limits; the grid is used"}}step(){co(this,Jl),this.selectAdjacencyPipeline(),this.selectSolver(),Nl(this),this.radiiDirty&&(this.uploadStatics(),this.selectBroadphase()),this.broadphaseRequested==="auto"&&this.broadphaseDecision.constraintCount!==this.jointCount-this.freeSlots.length&&this.selectBroadphase(),this.broadphase==="grid"&&this.bvh&&(this.bvh.destroy(),this.bvh=null),this.broadphase==="hploc"&&(!this.bvh||this.bvh.bodyBuffer!==this.bodyBuffer)&&(this.bvh?.destroy(),this.bvh=new no(this.device,this,this.bvhOptions)),this.dispatchIsolation||this.smallGroupPipeline||this.bvh||this.detailCallback||this.sleeping||this.restitution?.active.size||this.bodyCommands?.pending.size||this.propertyEdits?.pending||this.externalBeforeStep?Hl(this):super.step()}encodeStepPrelude(e){this.flushPropertyEdits(e),this.sleeping?.before(e),this.bodyCommands?.flush(e),this.externalBeforeStep?.(e),this.restitution?.before(e)}encodeStepPostlude(e){this.restitution?.after(e),this.sleeping?.after(e),this.externalAfterStep?.(e)}setRestitution(e,t){if(this.destroyed)throw Error("The 3D solver has been destroyed");if(!Number.isInteger(e)||e<0||e>=this.bodyCount||!Number.isFinite(t)||t<0||t>1)throw Error("Restitution requires a live body index and a value between 0 and 1");t>0&&!this.restitution&&(this.restitution=new wr(this)),this.restitution?.set(e,t),this.wakeAll()}setSolverMode(e){return Ar({...this.solverPolicy,requested:e,bodyCount:this.bodyCount}),this.solverPolicy.requested=e,this.selectSolver(),this.solverDecision}solveSource(e,t=this.solverDecision.selected){return e=mc(e,t),this.springFracture&&(e=oo(e)),this.angularConstraints&&(e=mn(e)),this.sensorsEnabled&&(e=fn(e)),e=sn(on(e)),this.scalarPrimal&&(e=Bn(e)),this.portableContactMath&&(e=Cn(e)),t==="points"&&!this.scalarPrimal&&!this.portableContactMath&&!this.dispatchIsolation&&(e=xn(e)),e}setAngularConstraint(e,t){if(!Number.isInteger(e)||e<0||e>=this.jointCount)throw Error("Angular constraint needs a live slot");let i=kt(t);this.flushPropertyEdits(),this.angularConstraints||(this.angularConstraints=!0,this.rebuildSolvePipelines());let r=new Float32Array(32);r[0]=r[1]=1e3,r[3]=3e38,r.set(i.axisA,24),r.set(i.axisB,28),r[27]=i.type==="motor"?i.speed:i.minAngle,r[31]=i.type==="motor"?i.maxTorque:i.maxAngle,this.device.queue.writeBuffer(this.jointBuffer,e*128,r),this.info[e*4]=i.type==="motor"?3:4,this.device.queue.writeBuffer(this.infoBuffer,e*16,this.info.subarray(e*4,e*4+4)),this.captureAngularFrames([e]),this.wakeAll()}captureAngularFrames(e){if(!e.length)return;this.flushPropertyEdits();let t=this.device;this.angularFramePipeline??=t.createComputePipeline({layout:"auto",compute:{module:t.createShaderModule({code:`const DISPATCH_STRIDE = ${t.limits.maxComputeWorkgroupsPerDimension*64}u;
${Zl.replaceAll("id.x","(id.x+id.y*DISPATCH_STRIDE)")}`}),entryPoint:"capture"}}),this.runCapture("angular",this.angularFramePipeline,Uint32Array.from(e),e.length)}setMotor(e,{speed:t,maxTorque:i}={}){if(this.destroyed)throw Error("The 3D solver has been destroyed");if(this.info[e*4]!==3)throw Error("Motor needs an active motor slot");if(t!==void 0&&!Number.isFinite(t))throw Error("Motor speed must be finite");if(i!==void 0&&(!Number.isFinite(i)||i<0))throw Error("maxTorque must be nonnegative");t!==void 0&&oe(this).float(this.jointBuffer,e*32+27,t),i!==void 0&&oe(this).float(this.jointBuffer,e*32+31,i),this.wakeAll()}rebuildSolvePipelines(){this.solvePipelineCache.clear(),this.smallGroupPipelines?.clear(),this.smallGroupPipeline=null;let e=this.solverDecision.selected,t=e==="custom"?this.customSolveSource:e==="optimized"?us:e==="points"?so:Ge,i=this.device.createShaderModule({code:this.solveSource(t)}),r=this.device.createPipelineLayout({bindGroupLayouts:[this.layouts.solve,this.layouts.pass]}),o=Object.fromEntries(["warmStartJoints","warmStartBodies","primal","dual","updateVelocities"].map(a=>[a,this.device.createComputePipeline({layout:r,compute:{module:i,entryPoint:a}})]));Object.assign(this.pipes,o),this.solvePipelineCache.set(e,o)}setSensor(e,t){if(this.destroyed)throw Error("The 3D solver has been destroyed");if(!Number.isInteger(e)||e<0||e>=this.bodyCount||typeof t!="boolean")throw Error("Sensor requires a live body index and boolean flag");if(t&&!this.sensorsEnabled){this.sensorsEnabled=!0,hn(this),this.rebuildSolvePipelines(),this.contactShaders.make(uo(vr(this.hullShaders??!1)));let i=this.contactShaders.make;this.contactShaders.make=a=>i(uo(a));let r=this.device.createShaderModule({code:dn()}),o=this.device.createPipelineLayout({bindGroupLayouts:[this.layouts.topo]});for(let a of["degreeContacts","fillContacts"])this.pipes[a]=this.device.createComputePipeline({layout:o,compute:{module:r,entryPoint:a}})}this.sensorsEnabled&&oe(this).float(this.bodyBuffer,e*40+11,t?1:0),this.wakeAll()}selectSolver(){let e=this.jointCount-this.freeSlots.length;this.adaptiveScheduling&&this.schedulingDecision?.dense&&(this.bodyCount<25e4||e>0)&&(this.primalLanes=[...this.defaultPrimalLanes],this.schedulingDecision={...this.schedulingDecision,dense:!1,reason:"Threads per body follow solve-group size"});let t=this.solverDecision;if(t.requested===this.solverPolicy.requested&&t.bodyCount===this.bodyCount&&t.constraintCount===e)return;let i=Ar({...this.solverPolicy,bodyCount:this.bodyCount,constraintCount:e});if(i.selected!==t.selected){let r=this.solvePipelineCache.get(i.selected);if(!r){let o=i.selected==="optimized"?us:i.selected==="points"?so:void 0,a=this.device.createShaderModule({code:this.solveSource(o??Ge,i.selected)}),n=this.device.createPipelineLayout({bindGroupLayouts:[this.layouts.solve,this.layouts.pass]});r=Object.fromEntries(["warmStartJoints","warmStartBodies","primal","dual","updateVelocities"].map(l=>[l,this.device.createComputePipeline({label:`${i.selected} ${l}`,layout:n,compute:{module:a,entryPoint:l}})])),this.solvePipelineCache.set(i.selected,r)}Object.assign(this.pipes,r)}this.solverDecision=i,An(this,i.selected==="points"||i.selected==="optimized")}profileDetailedNextStep(e){if(!this.device.features.has("timestamp-query")||this.timingBusy||this.timingCallback||this.detailCallback)return!1;let t=2*(9+2*this.params.iterations);return(!this.detailTiming||this.detailTiming.count<t)&&(this.releaseAppTiming(),this.detailTiming={count:t,querySet:this.device.createQuerySet({type:"timestamp",count:t}),resolve:this.device.createBuffer({size:t*8,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC}),read:this.device.createBuffer({size:t*8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ})}),this.detailCallback=e,!0}captureConstraintFrames(e){if(e.length){this.flushPropertyEdits(),this.framePipeline||(this.framePipeline=this.device.createComputePipeline({layout:"auto",compute:{module:this.device.createShaderModule({code:`const DISPATCH_STRIDE = ${this.device.limits.maxComputeWorkgroupsPerDimension*64}u;
${Dl.replaceAll("id.x","(id.x+id.y*DISPATCH_STRIDE)")}`}),entryPoint:"capture"}})),(!this.frameData||this.frameData.length<e.length*4)&&(this.frameData=new Uint32Array(Math.max(e.length*4,(this.frameData?.length??0)*2,64)));for(let t=0;t<e.length;t++)this.frameData[t*4]=e[t].slot,this.frameData[t*4+1]=e[t].spring?1:0;this.runCapture("frame",this.framePipeline,this.frameData.subarray(0,e.length*4),e.length)}}runCapture(e,t,i,r){this.flushEdits?.();let o=this.device,a=(this.captureUploads??={})[e]??={};(!a.buffer||a.buffer.size<i.byteLength)&&(a.buffer?.destroy(),a.buffer=o.createBuffer({size:i.byteLength*2,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),a.buffers=null),o.queue.writeBuffer(a.buffer,0,i);let n=[this.bodyBuffer,this.jointBuffer,this.infoBuffer,a.buffer];(!a.buffers||n.some((d,p)=>d!==a.buffers[p])||a.bytes!==i.byteLength)&&(a.group=o.createBindGroup({layout:t.getBindGroupLayout(0),entries:n.map((d,p)=>({binding:p,resource:{buffer:d,...p===3?{size:i.byteLength}:{}}}))}),a.buffers=n,a.bytes=i.byteLength);let l=o.createCommandEncoder(),c=l.beginComputePass();c.setPipeline(t),c.setBindGroup(0,a.group);let u=Math.ceil(r/64),f=o.limits.maxComputeWorkgroupsPerDimension;c.dispatchWorkgroups(Math.min(u,f),Math.ceil(u/f)),c.end(),o.queue.submit([l.finish()])}setSpringMaterial(e,t={}){if(this.destroyed)throw Error("The 3D solver has been destroyed");if(!Number.isInteger(e)||e<0||e>=this.jointCount||this.info[e*4]!==br)throw Error("Spring material requires an active spring slot");let i=It(t);!this.springFracture&&(Number.isFinite(i.breakStrain)||Number.isFinite(i.breakForce))&&(this.springFracture=!0,this.rebuildSolvePipelines());for(let[r,o]of[["breakStrain",11],["breakForce",15]])oe(this).float(this.jointBuffer,e*32+o,i[r]===1/0?0:i[r]);this.wakeAll()}appendConstraints(...e){return this.flushPropertyEdits(),super.appendConstraints(...e)}appendJoint(e,t,i,r,o,a){let n=c=>c===1/0?3e38:c,[l]=this.appendConstraints(1,(c,u)=>{u[3]=n(o),u[7]=n(a),u[11]=3e38,u.set(i,24),u.set(r,28);let f=e>=0?this.bodies[e].size:[0,0,0],d=this.bodies[t].size;return u[15]=f.reduce((p,m,h)=>p+(m+d[h])**2,0),[1,e,t]});return this.wakeAll(),l}appendJoints(...e){let t=super.appendJoints(...e);return this.wakeAll(),t}appendSprings(...e){let t=super.appendSprings(...e);return this.wakeAll(),t}enableSleeping(e,t={}){this.sleeping||(this.sleeping=new Fi({device:this.device,gpu:this,capacity:this.bodyCapacity,aggregates:e.bodies.map((i,r)=>({rigid:i,index:r}))},t),this.sleeping.initializing&&this.step())}wakeAll(){this.sleeping&&(this.sleeping.wakeRequested=!0)}async readSleepStats(){return this.sleeping?this.sleeping.readStats():{sleeping:0,wakeRequested:!1}}addBodies(e){this.flushPropertyEdits();let t=super.addBodies(e);if(t>=0)for(let i=0;i<Math.min(e.length,this.bodyCount-t);i++)Fe(e[i])&&this.installCapsule(t+i);if(t>=0&&this.sleeping)for(let i=0;i<Math.min(e.length,this.bodyCount-t);i++)this.sleeping.register(t+i,e[i].mass,e[i].allowSleep!==!1);return t}rewriteBodies(e,t){this.flushPropertyEdits(),super.rewriteBodies(e,t);for(let i=0;i<e.length;i++)Fe(t[i])&&this.installCapsule(e[i]);if(this.sleeping)for(let i=0;i<e.length;i++)this.sleeping.register(e[i],t[i].mass,t[i].allowSleep!==!1)}releaseJoints(e){this.flushPropertyEdits(),super.releaseJoints(e),this.wakeAll()}setWorldAnchor(e,t){if(!Number.isInteger(e)||e<0||e>=this.jointCount||this.info[e*4+1]!==-1||t?.length!==3||!Array.from(t).every(Number.isFinite))throw Error("A world joint and finite xyz anchor are required");for(let i=0;i<3;i++)oe(this).float(this.jointBuffer,e*32+24+i,t[i]);this.sleeping?.wakeBody(this.info[e*4+2])}disableConstraint(e){this.flushPropertyEdits(),super.disableConstraint(e),this.wakeAll()}setFilters(e,t,i){if(this.destroyed)throw Error("The 3D solver has been destroyed");if(e.length!==t.length||e.length!==i.length)throw Error("Each body index needs a group and collision mask");for(let o=0;o<e.length;o++){if(!Number.isInteger(e[o])||e[o]<0||e[o]>=this.bodyCount)throw Error("Collision filters require live body indices");for(let a of[t[o],i[o]])if(!Number.isInteger(a)||a<0||a>4294967295)throw Error("Collision masks must be unsigned 32-bit integers")}let r=oe(this);for(let o=0;o<e.length;o++)r.uint(this.filterBuffer,e[o]*2,t[o]),r.uint(this.filterBuffer,e[o]*2+1,i[o]);this.wakeAll()}profileNextStep(e){return this.detailCallback?!1:super.profileNextStep(t=>e({...t,broadphase:this.broadphase,bvhRebuilt:this.bvh?.lastRebuilt??!1}))}flushPropertyEdits(e){this.propertyEdits?.flush(e)}readJoints(){return this.flushPropertyEdits(),super.readJoints()}releaseAppTiming(){if(this.detailTiming){for(let e of["querySet","resolve","read"])this.detailTiming[e].destroy();this.detailTiming=null}}destroy(){this.passConstantCache=null;for(let e of Object.values(this.captureUploads??{}))e.buffer.destroy();this.captureUploads=null,this.frameData=null,this.propertyEdits?.destroy(),this.shapeQueries?.destroy(),this.restitution?.destroy(),this.sleeping?.dispose(),this.bvh?.destroy(),this.bvh=null,this.timingBusy||this.releaseAppTiming(),super.destroy(),this.solvePipelineCache.clear(),this.adjacencyPipelines={}}adapt(e){if(super.adapt(e),this.colorCap=Math.max(this.minimumColors,this.colorCap),this.colorRounds=Math.max(this.minimumColorRounds,this.colorRounds),this.adaptiveScheduling){let t=this.bodyCount>=25e4&&this.jointCount-this.freeSlots.length===0&&e.manifolds>=1.75*this.bodyCount&&!e.overflow&&!e.clashes;this.primalLanes=t?[2**31,2**31,2**31]:[...this.defaultPrimalLanes],this.schedulingDecision={bodyCount:this.bodyCount,manifolds:e.manifolds,dense:t,cachedAdjacency:this.adjacencyCached,reason:t?"Eight threads share each dense body solve":"Threads per body follow solve-group size"}}}selectAdjacencyPipeline(){let e=this.cacheAdjacencyKeys??this.bodyCount>=25e4;this.adjacencyCached!==e&&(e&&!this.adjacencyPipelines.cached&&(this.adjacencyPipelines.cached=this.device.createComputePipeline({label:"Cached adjacency keys",layout:this.device.createPipelineLayout({bindGroupLayouts:[this.layouts.topo]}),compute:{module:this.device.createShaderModule({code:Xl}),entryPoint:"sortAdjacency"}})),this.pipes.sortAdjacency=e?this.adjacencyPipelines.cached:this.adjacencyPipelines.original,this.adjacencyCached=e)}};var Sn=new WeakMap,gc=[{name:"batched-grid",broadphase:"grid",dispatchIsolation:!1},{name:"isolated-grid",broadphase:"grid",dispatchIsolation:!0},{name:"batched-hploc",broadphase:"hploc",dispatchIsolation:!1},{name:"isolated-hploc",broadphase:"hploc",dispatchIsolation:!0},{name:"scalar-grid",broadphase:"grid",dispatchIsolation:!1,scalarPrimal:!0},{name:"scalar-isolated-grid",broadphase:"grid",dispatchIsolation:!0,scalarPrimal:!0},{name:"portable-contact-grid",broadphase:"grid",dispatchIsolation:!1,portableContactMath:!0},{name:"portable-contact-isolated-grid",broadphase:"grid",dispatchIsolation:!0,scalarPrimal:!0,portableContactMath:!0}];function bc(s){return Sn.has(s)||Sn.set(s,Uf(s)),Sn.get(s)}async function Uf(s,e){let t=[];for(let i of gc){let r=await Hf(s,i,e);if(t.push(r),!!r.passed)return dc(s,{dispatchIsolation:i.dispatchIsolation,scalarPrimal:i.scalarPrimal??!1,portableContactMath:i.portableContactMath??!1,broadphase:i.broadphase==="hploc"?"hploc":void 0}),{...r,selected:i.name,compatibility:i.name!==gc[0].name,attempts:t}}return{...t[0],selected:null,compatibility:!1,attempts:t}}function Nf(s){let e=new ni;return e.iterations=5,s||(e.gravity=0),new Ze(e,[16,.25,16],0,.6,[0,-.125,0]),new Ze(e,[1,1,1],1,.6,[-2,s?2:.45,0]),nr(e,.5,1,.6,[0,s?2.3:.45,0]),Cr(e,.25,1.6,1,.6,[2,s?2.5:.75,0]),e}async function bi(s,e,t=e.size){let i=s.createBuffer({size:t,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});try{let r=s.createCommandEncoder();return r.copyBufferToBuffer(e,0,i,0,t),s.queue.submit([r.finish()]),await i.mapAsync(GPUMapMode.READ),i.getMappedRange().slice(0)}finally{i.destroy()}}async function qf(s){s.step();let e=await s.readCounters(),t=new Uint32Array(await bi(s.device,s.argsBuffer)),i=await Wf(s),r=new Uint32Array(i),o=new Float32Array(i),a=new Uint32Array(await bi(s.device,s.adjBuffer)),n=new Uint32Array(await bi(s.device,s.colorBuffer)),{manifolds:l,contacts:c}=s.contactStorage,u=await bi(s.device,l,Math.max(32,e.manifolds*32)),f=new Uint32Array(u),d=new Float32Array(u),p=new Float32Array(await bi(s.device,c,Math.max(64,e.contacts*64))),m=await s.readBodies(),h=e.manifolds>=3?await Vf(s):[],g=h.some(({contactEvaluation:b})=>b.returnedForce===0&&b.independentForce<-1e-5);return{expectedFloorPairs:3,counters:e,pairs:e.pairs?Array.from(await s.readPairs()):[],narrowphaseWorkgroups:Array.from(t.subarray(0,3)),solver:{scalarPrimal:s.scalarPrimal,portableContactMath:s.portableContactMath,lanes:[...s.primalLanes],contactWorkgroups:Array.from(t.subarray(3,6)),dualWorkgroups:Array.from(t.subarray(9,12)),colorWorkgroups:Array.from(t.subarray(12,12+3*s.colorCap)),adjacencyStarts:Array.from(a.subarray(0,5)),adjacencyEntries:Array.from(a.subarray(2*s.bodyCapacity+1,2*s.bodyCapacity+1+a[4])),colorStarts:Array.from(n.subarray(2*s.bodyCapacity,2*s.bodyCapacity+s.colorCap+1)),colorBodies:Array.from(n.subarray(2*s.bodyCapacity+65,2*s.bodyCapacity+68)),positionsAfterOverlap:[1,2,3].map(b=>Array.from(m.subarray(b*40,b*40+3))),manifolds:Array.from({length:e.manifolds},(b,y)=>({ids:Array.from(f.subarray(y*8,y*8+4)),normalAndFriction:Array.from(d.subarray(y*8+4,y*8+8))})),contacts:Array.from({length:e.contacts},(b,y)=>({anchorA:Array.from(p.subarray(y*16,y*16+3)),anchorB:Array.from(p.subarray(y*16+4,y*16+7)),gap:p[y*16+7],penalty:Array.from(p.subarray(y*16+8,y*16+11)),force:Array.from(p.subarray(y*16+12,y*16+15))})),serialSystems:h,failure:g?"contact-evaluation":null},filters:Array.from(new Uint32Array(await bi(s.device,s.filterBuffer))),params:{bodyCount:r[0],largeCount:r[1],noCollideCount:r[2],pairCapacity:r[3],contactCapacity:r[4],dt:o[5],cellSize:o[6],maxSmallRadius:o[7],up:Array.from(o.subarray(8,11)),alpha:o[11]},stage:e.pairs<3?"collision-pairs":e.manifolds<3?"contact-generation":"contacts-created"}}async function Vf(s){let e=s.portableContactMath?"bitcast<f32>(pc.data.y)":"pc.alpha",t=s.portableContactMath?"k.anchorB.w":"k.c0x",i=s.portableContactMath?"k.penalty.x":"k.pen.x",r=s.portableContactMath?"k.force.x":"k.lam.x",o=s.device.createShaderModule({code:s.solveSource(Ge)+`
@compute @workgroup_size(1) fn inspectSystems(@builtin(global_invocation_id) gid: vec3u) {
  let acc = accumulate(gid.x + 1u, 0u, 1u);
  joints[gid.x].penLin = vec4f(acc.lin[0][0], acc.lin[1][1], acc.lin[2][2], 0.0);
  joints[gid.x].penAng = vec4f(acc.ang[0][0], acc.ang[1][1], acc.ang[2][2], 0.0);
  joints[gid.x].c0Lin = vec4f(acc.rLin, 0.0);
  joints[gid.x].c0Ang = vec4f(acc.rAng, 0.0);
  let mf = manifolds[gid.x];
  let k = contacts[mf.ids.z];
  let A = pairBody(mf.ids.x); let B = pairBody(mf.ids.y);
  let basis = orthonormal(mf.geo.xyz);
  let result = evalContact(k, basis, mf.geo.w, A, B, ${e});
  // Independently recompute the normal row from scalar inputs. Compare input
  // reads, pass alpha, the returned error and the returned clamped force.
  let dA = bodies[mf.ids.x].pos.xyz - bodies[mf.ids.x].initialPos.xyz;
  let dB = bodies[mf.ids.y].pos.xyz - bodies[mf.ids.y].initialPos.xyz;
  let wA = qsub(bodies[mf.ids.x].rot, bodies[mf.ids.x].initialRot);
  let wB = qsub(bodies[mf.ids.y].rot, bodies[mf.ids.y].initialRot);
  let expectedC = ${t} * (1.0 - ${e}) + dot(basis[0], dA - dB)
    + dot(cross(result.rAW.xyz, basis[0]), wA)
    - dot(cross(result.rBW.xyz, basis[0]), wB);
  let raw = ${i} * expectedC + ${r};
  joints[gid.x].rA = vec4f(${t}, ${e}, result.C.x, result.F.x);
  joints[gid.x].rB = vec4f(${i}, ${r}, expectedC, min(raw, 0.0));
}`}),a=s.device.createComputePipeline({layout:s.device.createPipelineLayout({bindGroupLayouts:[s.layouts.solve,s.layouts.pass]}),compute:{module:o,entryPoint:"inspectSystems"}}),n=s.device.createCommandEncoder(),l=n.beginComputePass();l.setPipeline(a),l.setBindGroup(0,s.groups.solve[1-s.parity]),l.setBindGroup(1,s.passGroup,[0]),l.dispatchWorkgroups(3),l.end(),s.device.queue.submit([n.finish()]);let c=new Float32Array(await bi(s.device,s.jointBuffer,384));return[0,1,2].map(u=>({linearDiagonal:Array.from(c.subarray(u*32,u*32+3)),angularDiagonal:Array.from(c.subarray(u*32+4,u*32+7)),linearForce:Array.from(c.subarray(u*32+16,u*32+19)),angularForce:Array.from(c.subarray(u*32+20,u*32+23)),contactEvaluation:{inputGap:c[u*32+24],passAlpha:c[u*32+25],returnedError:c[u*32+26],returnedForce:c[u*32+27],inputPenalty:c[u*32+28],inputForce:c[u*32+29],independentError:c[u*32+30],independentForce:c[u*32+31]}}))}async function Wf(s){let{device:e}=s,t=e.createBuffer({size:48,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});try{let i=e.createComputePipeline({layout:"auto",compute:{module:e.createShaderModule({code:ge+`
@group(0) @binding(0) var<uniform> p: Params;
@group(0) @binding(1) var<storage,read_write> out: array<u32>;
@compute @workgroup_size(1) fn inspectParams() {
  out[0]=p.bodyCount; out[1]=p.largeCount; out[2]=p.noCollideCount;
  out[3]=p.pairCapacity; out[4]=p.contactCapacity;
  out[5]=bitcast<u32>(p.dt); out[6]=bitcast<u32>(p.cellSize); out[7]=bitcast<u32>(p.maxSmallRadius);
  out[8]=bitcast<u32>(p.up.x); out[9]=bitcast<u32>(p.up.y); out[10]=bitcast<u32>(p.up.z);
  out[11]=bitcast<u32>(p.alpha);
}`}),entryPoint:"inspectParams"}}),r=e.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:s.paramsBuffer}},{binding:1,resource:{buffer:t}}]}),o=e.createCommandEncoder(),a=o.beginComputePass();return a.setPipeline(i),a.setBindGroup(0,r),a.dispatchWorkgroups(1),a.end(),e.queue.submit([o.finish()]),await bi(e,t)}finally{t.destroy()}}async function Hf(s,e,t){let i={mode:e.name,passed:!1,steps:180,cases:[],errors:[],contactCache:"normal-float-generations-v1",diagnosticVersion:4,limits:{storageBindings:s.limits.maxStorageBuffersPerShaderStage,workgroupStorageBytes:s.limits.maxComputeWorkgroupStorageSize,workgroupInvocations:s.limits.maxComputeInvocationsPerWorkgroup,storageBindingBytes:s.limits.maxStorageBufferBindingSize}},r,o=a=>{let n=new gi(s,Nf(a),{spatialSort:!1,bodyCapacity:4,smallGroups:!1,broadphase:e.broadphase,scalarPrimal:e.scalarPrimal??!1,portableContactMath:e.portableContactMath??!1,capacity:{pairs:32,manifolds:32,contacts:256,colors:8}});return n.params.up=[0,1,0],n.dispatchIsolation=e.dispatchIsolation,t?.(n,e,a),n};s.pushErrorScope("validation");try{if(r=o(!1),i.pipeline=await qf(r),i.pipeline.stage!=="contacts-created")i.reason=i.pipeline.stage==="collision-pairs"?"The GPU did not find the three known overlapping floor pairs.":"The GPU found overlapping pairs but did not create all floor contacts.";else{r.destroy(),r=o(!0);let a=0;i.samples=[];for(let l=0;l<i.steps;l++){if(r.step(),(l+1)%30&&l!==39)continue;let c=await r.readCounters();if(i.samples.push({step:l+1,...c}),c.manifolds&&a++,c.overflow||c.clashes)throw Error("Incomplete GPU contact graph")}let n=await r.readBodies();for(let l=1;l<4;l++){let c=l*40,[u,f,d,p]=n.subarray(c+4,c+8),m=l===1?.5*(Math.abs(2*(u*f+p*d))+Math.abs(1-2*(u*u+d*d))+Math.abs(2*(f*d-p*u))):l===2?.5:.25+.55*Math.abs(1-2*(u*u+d*d)),h=n[c+1]-m,g=n.subarray(c,c+40).every(Number.isFinite);i.cases.push({shape:["floor","box","sphere","capsule"][l],passed:g&&h>=-.06&&h<.12,floorGap:h,position:Array.from(n.subarray(c,c+3))})}i.contactSteps=a,i.passed=a>0&&i.cases.every(l=>l.passed),i.passed||(i.reason=i.pipeline.solver.failure==="contact-evaluation"?"The GPU created floor contacts but returned zero force where a push was required.":"The GPU did not keep all three falling shapes on the floor.")}}catch(a){i.errors.push(a.message)}finally{try{let a=await s.popErrorScope();a&&i.errors.push(a.message)}catch(a){i.errors.push(a.message)}r?.destroy()}return i.passed=i.passed&&!i.errors.length,i}async function Sr(s={}){if(!globalThis.navigator?.gpu)throw Error("WebGPU needs a supported browser on localhost or HTTPS");let e=await navigator.gpu.requestAdapter({powerPreference:s.powerPreference??"high-performance"});if(!e)throw Error("No WebGPU adapter is available");let t={};for(let[r,o]of Object.entries(s.preferredLimits??{})){if(!r.startsWith("max")||e.limits[r]===void 0||!Number.isSafeInteger(o)||o<0)throw Error(`Invalid preferred GPU limit: ${r}`);t[r]=Math.min(o,e.limits[r])}for(let[r,o]of Object.entries(s.requiredLimits??{})){if(e.limits[r]===void 0||!Number.isSafeInteger(o)||o<0)throw Error(`Invalid required GPU limit: ${r}`);let a=e.limits[r];if(r.startsWith("min")&&o<a||!r.startsWith("min")&&o>a)throw Error(`GPU limit ${r} requires ${o}; this adapter supports ${a}`);t[r]=o}let i=await e.requestDevice({requiredLimits:t,requiredFeatures:e.features.has("timestamp-query")?["timestamp-query"]:[]});if(s.validate3D)try{await Ni(i)}catch(r){throw i.destroy(),r}return{adapter:e,device:i}}async function Ni(s){if(po(s))return s;let e=await bc(s);if(!e.passed)throw Error(`GPU 3D contact check failed: ${e.reason??e.errors.join("; ")}`);return s}var yc=`struct Body { pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f }
struct Command { index:u32,mask:u32,pad0:u32,pad1:u32,velocity:vec4f,angular:vec4f,impulse:vec4f,torque:vec4f,position:vec4f,rotation:vec4f,pointImpulse:vec4f }
@group(0) @binding(0) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(1) var<storage,read> commands:array<Command>;
fn rotate(q:vec4f,v:vec3f)->vec3f {let t=2.*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
@compute @workgroup_size(64) fn applyCommands(@builtin(global_invocation_id) id:vec3u){
 let i=id.x+id.y*DISPATCH_STRIDE;
 if(i>=arrayLength(&commands)){return;}
 let c=commands[i];var b=bodies[c.index];
 if((c.mask&1u)!=0u){b.velocity=vec4f(c.velocity.xyz,b.velocity.w);}
 if((c.mask&2u)!=0u){b.angular=vec4f(c.angular.xyz,b.angular.w);}
 if((c.mask&4u)!=0u && b.size.w>0.){
  b.velocity=vec4f(b.velocity.xyz+c.impulse.xyz/b.size.w,b.velocity.w);
  // Sum world-point moments about the live GPU centre, never a stale CPU pose.
  let torque=c.torque.xyz-cross(b.pos.xyz,c.pointImpulse.xyz);
  let local=rotate(vec4f(-b.rot.xyz,b.rot.w),torque);
  b.angular=vec4f(b.angular.xyz+rotate(b.rot,local/max(b.moment.xyz,vec3f(1.e-10))),b.angular.w);
 }
 if((c.mask&8u)!=0u){
  if((c.mask&32u)!=0u){
   // Position-only teleports preserve the live orientation, including the
   // principal-frame offset of meshes whose origin is not their mass centre.
   b.pos=vec4f(c.position.xyz+rotate(b.rot,c.rotation.xyz),b.pos.w);
  }else{b.pos=vec4f(c.position.xyz,b.pos.w);b.rot=c.rotation;}
 }
 if((c.mask&16u)!=0u){b.size.w=0.;b.moment=vec4f(vec3f(0),b.moment.w);b.velocity=vec4f(0);b.angular=vec4f(vec3f(0),b.angular.w);}
 bodies[c.index]=b;
}
`;var Kt=class{constructor(e,t,i="linear"){this.solver=e,this.dimension=t,this.components=i==="angular"&&t===2?1:t;let r=e.device,o=t===3?10:6,a=t===3?i==="angular"?9:8:3;this.pipeline=r.createComputePipeline({layout:"auto",compute:{entryPoint:"setVelocities",module:r.createShaderModule({code:`
      @group(0) @binding(0) var<storage,read_write> bodies:array<vec4f>;
      @group(0) @binding(1) var<storage,read> indices:array<u32>;
      @group(0) @binding(2) var<storage,read> velocities:array<f32>;
      @compute @workgroup_size(64) fn setVelocities(@builtin(global_invocation_id) id:vec3u) {
        let i=id.x+id.y*${r.limits.maxComputeWorkgroupsPerDimension*64}u;
        if(i>=arrayLength(&indices)){return;}
        let base=indices[i]*${o}u+${a}u;
        var v=bodies[base];
        ${this.components===1?"v.z=velocities[i];":`v.x=velocities[i*${t}u];v.y=velocities[i*${t}u+1u];${t===3?"v.z=velocities[i*3u+2u];":""}`}
        bodies[base]=v;
      }`})}})}set(e,t){let i=this.solver,r=i.device,o=e instanceof Uint32Array?e:Uint32Array.from(e),a=t instanceof Float32Array?t:Float32Array.from(t);if(a.length!==o.length*this.components)throw Error(`Provide ${this.components} velocity components per body`);let n=-1;for(let c=0;c<e.length;c++){if(i.liveIndex(e[c]),e[c]<=n)throw Error("Velocity batch indices must be unique and ascending GPU slots");n=e[c]}for(let c of a)if(!Number.isFinite(c))throw Error("Velocities must be finite Float32 values");let l=Math.min(r.limits.maxStorageBufferBindingSize,r.limits.maxBufferSize);if(o.byteLength>l||a.byteLength>l)throw Error("Velocity batch exceeds GPU buffer limits");o.length&&(i.wakeAll(),i.flushEdits(),this.submitValidated(o,a))}submitValidated(e,t,i){if(!e.length)return;let r=this.solver,o=r.device,a=Math.min(o.limits.maxStorageBufferBindingSize,o.limits.maxBufferSize);if(e.byteLength>a||t.byteLength>a)throw Error("Velocity batch exceeds GPU buffer limits");for(let[f,d]of[["indices",e],["values",t]])(!this[f]||this[f].size<d.byteLength)&&(this[f]?.destroy(),this[f]=o.createBuffer({size:Math.min(a,d.byteLength*2),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})),o.queue.writeBuffer(this[f],0,d);let n=i??o.createCommandEncoder(),l=n.beginComputePass();l.setPipeline(this.pipeline),(!this.binding||this.boundBody!==r.bodyBuffer||this.boundIndices!==this.indices||this.boundValues!==this.values||this.boundBytes!==t.byteLength)&&(this.binding=o.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.bodyBuffer}},{binding:1,resource:{buffer:this.indices,size:e.byteLength}},{binding:2,resource:{buffer:this.values,size:t.byteLength}}]}),this.boundBody=r.bodyBuffer,this.boundIndices=this.indices,this.boundValues=this.values,this.boundBytes=t.byteLength),l.setBindGroup(0,this.binding);let c=Math.ceil(e.length/64),u=o.limits.maxComputeWorkgroupsPerDimension;l.dispatchWorkgroups(Math.min(c,u),Math.ceil(c/u)),l.end(),i||o.queue.submit([n.finish()]),this.lastBatch={bodies:e.length,uploadedBytes:e.byteLength+t.byteLength}}destroy(){this.indices?.destroy(),this.values?.destroy()}},yi=class{constructor(e,t){this.solver=e,this.dimension=t,this.wordsPerBody=t===3?8:5}set(e,{linear:t,angular:i}={}){let r=this.solver,o=this.dimension,a=o===3?3:1,n=e instanceof Uint32Array?e:Uint32Array.from(e),l=t===void 0?null:t instanceof Float32Array?t:Float32Array.from(t),c=i===void 0?null:i instanceof Float32Array?i:Float32Array.from(i);if(!l&&!c)throw Error("Provide linear and/or angular velocities");if(l&&l.length!==n.length*o)throw Error(`Provide ${o} linear components per body`);if(c&&c.length!==n.length*a)throw Error(`Provide ${a} angular components per body`);let u=-1;for(let p=0;p<e.length;p++){if(r.liveIndex(e[p]),e[p]<=u)throw Error("Velocity batch indices must be unique and ascending GPU slots");u=e[p]}for(let p of[l,c])if(p){for(let m of p)if(!Number.isFinite(m))throw Error("Velocities must be finite Float32 values")}let f=n.length*this.wordsPerBody,d=Math.min(r.device.limits.maxStorageBufferBindingSize,r.device.limits.maxBufferSize);if(f*4>d)throw Error("Motion batch exceeds GPU buffer limits");if(f){(!this.data||this.data.length<f)&&(this.data=new Uint32Array(Math.max(f,(this.data?.length??0)*2)),this.floats=new Float32Array(this.data.buffer));for(let p=0;p<n.length;p++){let m=p*this.wordsPerBody;if(this.data[m]=n[p],this.data[m+1]=(l?1:0)|(c?2:0),l)for(let h=0;h<o;h++)this.floats[m+2+h]=l[p*o+h];if(c)for(let h=0;h<a;h++)this.floats[m+2+o+h]=c[p*a+h]}r.wakeAll(),r.flushEdits(),this.submitValidated(this.data.subarray(0,f))}}submitValidated(e,t){if(!e.length)return;let i=this.solver,r=i.device,o=this.wordsPerBody,a=Math.min(r.limits.maxStorageBufferBindingSize,r.limits.maxBufferSize);if(e.byteLength>a)throw Error("Motion batch exceeds GPU buffer limits");(!this.buffer||this.buffer.size<e.byteLength)&&(this.buffer?.destroy(),this.buffer=r.createBuffer({size:Math.min(a,e.byteLength*2),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})),r.queue.writeBuffer(this.buffer,0,e),this.pipeline??=r.createComputePipeline({layout:"auto",compute:{entryPoint:"edit",module:r.createShaderModule({code:`
      @group(0) @binding(0) var<storage,read_write> bodies:array<vec4f>;
      @group(0) @binding(1) var<storage,read> commands:array<u32>;
      @compute @workgroup_size(64) fn edit(@builtin(global_invocation_id) id:vec3u) {
        let i=id.x+id.y*${r.limits.maxComputeWorkgroupsPerDimension*64}u;
        let o=i*${o}u;if(o>=arrayLength(&commands)){return;}
        let b=commands[o]*${this.dimension===3?10:6}u;
        let mask=commands[o+1u];
        var v=bodies[b+${this.dimension===3?8:3}u];
        if((mask&1u)!=0u){v.x=bitcast<f32>(commands[o+2u]);v.y=bitcast<f32>(commands[o+3u]);${this.dimension===3?"v.z=bitcast<f32>(commands[o+4u]);":""}}
        ${this.dimension===2?"if((mask&2u)!=0u){v.z=bitcast<f32>(commands[o+4u]);}":"if((mask&2u)!=0u){var a=bodies[b+9u];a.xyz=vec3f(bitcast<f32>(commands[o+5u]),bitcast<f32>(commands[o+6u]),bitcast<f32>(commands[o+7u]));bodies[b+9u]=a;}"}
        bodies[b+${this.dimension===3?8:3}u]=v;
      }`})}}),(!this.binding||this.boundBody!==i.bodyBuffer||this.boundBuffer!==this.buffer||this.boundBytes!==e.byteLength)&&(this.binding=r.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i.bodyBuffer}},{binding:1,resource:{buffer:this.buffer,size:e.byteLength}}]}),this.boundBody=i.bodyBuffer,this.boundBuffer=this.buffer,this.boundBytes=e.byteLength);let n=t??r.createCommandEncoder(),l=n.beginComputePass();l.setPipeline(this.pipeline),l.setBindGroup(0,this.binding);let c=Math.ceil(e.length/o/64),u=r.limits.maxComputeWorkgroupsPerDimension;l.dispatchWorkgroups(Math.min(c,u),Math.ceil(c/u)),l.end(),t||r.queue.submit([n.finish()]),this.lastBatch={bodies:e.length/o,uploadedBytes:e.byteLength}}destroy(){this.buffer?.destroy(),this.binding=null,this.data=this.floats=null}};function go(s,e={}){return Ar({...e,requested:e.solverMode??"auto",bodyCount:s.bodies.length,custom:!!e.shaders?.solve}),{...e,solverMode:e.solverMode??"auto"}}function kr(s,e){let t=s&&typeof s.x=="number"?[s.x,s.y,s.z]:Array.from(s);if(t.length!==3||!t.every(Number.isFinite))throw Error(`${e} requires three finite components`);return t}function bo(s,e){if(s!==1/0&&(!Number.isFinite(s)||s<0))throw Error(`${e} must be nonnegative or Infinity`);return s}function vc(s,e){let t=kr(e,"anchor");if(!s)return t;let i=s.aggregate,r=i.mesh.position.constructor;return new r(...t).subtract(i.localCenter).applyRotationQuaternion(i.localRotation.conjugate()).asArray()}var Pr=class{constructor(e,t,i,r={}){e.assertAlive();for(let a of[t,i])if(a&&(a.assertAlive(),a.aggregate.world!==e))throw Error("Constraint bodies must belong to this world");if(!i||t===i)throw Error("A constraint needs a body B and distinct endpoints");let o=r.type??"ball";if(!["ball","fixed","spring","motor","limit"].includes(o))throw Error("Constraint type must be ball, fixed, spring, motor or limit");if(o==="spring"&&!t)throw Error("A spring requires two bodies; use a static aggregate for a world anchor");if(this.world=e,this.bodyA=t,this.bodyB=i,this.type=o,o==="motor"||o==="limit"){let a=(n,l)=>n?new n.aggregate.mesh.position.constructor(...kr(l,"axis")).applyRotationQuaternion(n.aggregate.localRotation.conjugate()).asArray():kr(l,"axis");this.angularMaterial=kt({...r,type:o,axisA:a(t,r.axisA??[0,1,0]),axisB:a(i,r.axisB??[0,1,0])})}if(this.anchorA=vc(t,r.anchorA??[0,0,0]),this.anchorB=vc(i,r.anchorB??[0,0,0]),this.linear=bo(o==="spring"?r.stiffness??1e3:r.stiffness??1/0,"stiffness"),this.angular=o==="fixed"?bo(r.angularStiffness??1/0,"angularStiffness"):0,this.breakForce=bo(r.breakForce??1/0,"breakForce"),this.breakForce===0)throw Error("breakForce must be positive");if(this.material=It({breakForce:this.breakForce,breakStrain:r.breakStrain}),o!=="spring"&&r.breakStrain!==void 0)throw Error("breakStrain applies to springs only");if(this.breakOnPull=r.breakOnPull??!1,this.rest=r.rest,this.rest!==void 0&&(!Number.isFinite(this.rest)||this.rest<0))throw Error("Spring rest length must be nonnegative and finite");if(o==="spring"&&!Number.isFinite(this.linear))throw Error("Spring stiffness must be finite");e.gpu?(e.flushCommands(),this.attach()):this.force=o==="spring"?new dt(e.ref,t.aggregate.rigid,i.aggregate.rigid,this.anchorA,this.anchorB,this.linear,this.rest??-1):new ke(e.ref,t?.aggregate.rigid??null,i.aggregate.rigid,this.anchorA,this.anchorB,this.linear,this.angular,this.breakForce),this.force&&o==="spring"&&xr(this.force,this.material),this.force&&this.angularMaterial&&Br(this.force,this.angularMaterial),e.constraints.add(this),e.wakeAll?.()}attach(e,t=!0){let i=this.world.gpu;if(e!==void 0?this.slot=e:this.type==="spring"?[this.slot]=i.appendSprings([{a:this.bodyA.gpuIndex,b:this.bodyB.gpuIndex,rA:this.anchorA,rB:this.anchorB,stiffness:this.linear,rest:this.rest??0}]):this.slot=i.appendJoint(this.bodyA?.gpuIndex??-1,this.bodyB.gpuIndex,this.anchorA,this.anchorB,this.linear,this.angular),this.angularMaterial&&i.setAngularConstraint(this.slot,this.angularMaterial),this.type==="spring"&&(Number.isFinite(this.material.breakStrain)||Number.isFinite(this.material.breakForce))&&i.setSpringMaterial(this.slot,this.material),this.type!=="spring"&&Number.isFinite(this.breakForce)){let r=Number.isFinite(this.breakForce)?this.breakForce:1e30;i.device.queue.writeBuffer(i.jointBuffer,(this.slot*32+11)*4,new Float32Array([this.breakOnPull?-r:r]))}t&&(this.type==="fixed"||this.type==="spring"&&this.rest===void 0)&&i.captureConstraintFrames([{slot:this.slot,spring:this.type==="spring"}])}assertAlive(){if(this.world.assertAlive(),this.disposed)throw Error("Constraint is disposed")}setWorldAnchor(e){if(this.assertAlive(),this.bodyA||this.type==="spring")throw Error("Only world-anchored joints have a movable world anchor");return this.anchorA=kr(e,"world anchor"),this.world.gpu?this.world.gpu.setWorldAnchor(this.slot,this.anchorA):this.force.rA.set(this.anchorA),this.world.sleepManager?.wakeBody(this.bodyB.gpuIndex),this}async readState(){this.assertAlive(),this.world.initialize();let e=this.world.gpu,t=this.world.device,i=t.createBuffer({size:128,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let r=t.createCommandEncoder();r.copyBufferToBuffer(e.jointBuffer,this.slot*128,i,0,128),t.queue.submit([r.finish()]),await i.mapAsync(GPUMapMode.READ);let o=new Float32Array(i.getMappedRange().slice(0));return{broken:o[3]===0&&o[7]===0,linearForce:Array.from(o.subarray(8,11)),angularForce:Array.from(o.subarray(12,15))}}finally{i.destroy()}}setMotor(e){if(this.assertAlive(),this.type!=="motor")throw Error("setMotor requires a motor constraint");return this.angularMaterial=kt({...this.angularMaterial,...e}),this.world.gpu?this.world.gpu.setMotor(this.slot,e):Br(this.force,this.angularMaterial),this.world.wakeAll(),this}dispose(){this.disposed||(this.world.disposed||(this.world.gpu?this.world.gpu.releaseJoints([this.slot]):this.force.destroy(),this.world.wakeAll?.()),this.world.constraints.delete(this),this.disposed=!0)}},Lr=class{constructor(e,t,i,r={}){let o=kt({...r,type:"limit"}),a=r.span??1;if(!Number.isFinite(a)||a<=0)throw Error("Hinge span must be positive");let n=kr(r.anchorA??[0,0,0],"anchorA"),l=kr(r.anchorB??[0,0,0],"anchorB");r.motor&&kt({...r.motor,type:"motor",axisA:o.axisA,axisB:o.axisB}),this.world=e,this.bodyA=t,this.bodyB=i,this.disposed=!1,this.joints=[-1,1].map(c=>e.addJoint(t,i,{anchorA:n.map((u,f)=>u+c*a*.5*o.axisA[f]),anchorB:l.map((u,f)=>u+c*a*.5*o.axisB[f]),stiffness:r.stiffness??1/0})),(r.minAngle!==void 0||r.maxAngle!==void 0)&&(this.limit=e.addConstraint(t,i,{...o,type:"limit"})),r.motor&&(this.motor=e.addMotor(t,i,{axisA:o.axisA,axisB:o.axisB,...r.motor}))}dispose(){if(!this.disposed){for(let e of[...this.joints,this.limit,this.motor])e?.dispose();this.disposed=!0}}};var vi=class{constructor(e){this.device=e,this.pipelines=new Map,this.idle=[],this.jobs=new Set,this.destroyed=!1}acquire(e,t){if(this.destroyed)throw Error("Pose readback has been destroyed");let i=this.device;if(e>i.limits.maxStorageBufferBindingSize||t>Math.min(i.limits.maxStorageBufferBindingSize,i.limits.maxBufferSize))throw Error("Pose selection exceeds GPU buffer limits");let r=this.idle.findIndex(a=>a.selection.size>=e&&a.selected.size>=t),o=r>=0?this.idle.splice(r,1)[0]:this.idle.pop()??{};for(let[a,n,l]of[["selection",e,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST],["selected",t,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC],["staging",t,GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST]])(!o[a]||o[a].size<n)&&(o[a]?.destroy(),o[a]=i.createBuffer({size:n,usage:l}));return this.jobs.add(o),o}release(e){if(e.staging.unmap(),!this.destroyed&&e.selected.size<=8*1024*1024&&this.idle.length<2)this.idle.push(e);else{for(let t of["selection","selected","staging"])e[t].destroy();this.jobs.delete(e)}}destroy(){this.destroyed=!0;for(let e of this.jobs)for(let t of["selection","selected","staging"])e[t].destroy();this.jobs.clear(),this.idle.length=0}async read(e,t,i=!1,r=10){if(!t.length)return new Float32Array;let o=i?r===6?1:2:r,a=this.device,n=a.limits.maxComputeWorkgroupsPerDimension,l=`${r}:${o}`,c=this.pipelines.get(l);c||(c=a.createComputePipeline({layout:"auto",compute:{entryPoint:"gather",module:a.createShaderModule({code:`
        @group(0) @binding(0) var<storage,read> bodies:array<vec4f>;
        @group(0) @binding(1) var<storage,read> indices:array<u32>;
        @group(0) @binding(2) var<storage,read_write> selected:array<vec4f>;
        @compute @workgroup_size(64) fn gather(@builtin(global_invocation_id) id:vec3u) {
          let i=id.x+id.y*${n*64}u; if(i>=arrayLength(&selected)){return;}
          selected[i]=bodies[indices[i/${o}u]*${r}u+i%${o}u];
        }`})}}),this.pipelines.set(l,c));let u=t.length*o*16,f=this.acquire(t.length*4,u),{selection:d,selected:p,staging:m}=f;try{a.queue.writeBuffer(d,0,t instanceof Uint32Array?t:Uint32Array.from(t)),(!f.group||f.body!==e||f.pipeline!==c||f.boundSelection!==d||f.boundSelected!==p||f.indexBytes!==t.length*4||f.bytes!==u)&&(f.group=a.createBindGroup({layout:c.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:1,resource:{buffer:d,size:t.length*4}},{binding:2,resource:{buffer:p,size:u}}]}),f.body=e,f.pipeline=c,f.boundSelection=d,f.boundSelected=p,f.indexBytes=t.length*4,f.bytes=u);let h=a.createCommandEncoder(),g=h.beginComputePass();g.setPipeline(c),g.setBindGroup(0,f.group);let b=Math.ceil(t.length*o/64);return g.dispatchWorkgroups(Math.min(b,n),Math.ceil(b/n)),g.end(),h.copyBufferToBuffer(p,0,m,0,u),a.queue.submit([h.finish()]),await m.mapAsync(GPUMapMode.READ,0,u),new Float32Array(m.getMappedRange(0,u).slice(0))}finally{this.release(f)}}};var kn=4,_r=3,Ai=1,Jf=2,ds=`
struct Manifold { ids: vec4u, geo: vec4f }   // a, b (a > b), first contact, count (low 4 bits); normal (b to a)
struct Contact { rA: vec3f, key: u32, rB: vec3f, c0x: f32, pen: vec3f, c0y: f32, lam: vec3f, c0z: f32 }
struct Params { prev: u32, now: u32, mask: u32, capacity: u32, pairs: u32, step: u32, dt: f32, pad: u32 }

@group(0) @binding(0) var<storage, read> bodies: array<vec4f>;
@group(0) @binding(1) var<storage, read> manifolds: array<Manifold>;
@group(0) @binding(2) var<storage, read> contacts: array<Contact>;
@group(0) @binding(3) var<storage, read> counters: array<u32>;
@group(0) @binding(4) var<storage, read> watch: array<u32>;
@group(0) @binding(5) var<storage, read_write> table: array<atomic<u32>>;   // head, then two sets: per slot a + 1, b
@group(0) @binding(6) var<storage, read_write> events: array<vec4f>;
@group(0) @binding(7) var<uniform> params: Params;

const STRIDE = ${We/4}u;

fn hash32(x0: u32) -> u32 {
  var x = x0;
  x = (x ^ (x >> 16u)) * 0x7feb352du;
  x = (x ^ (x >> 15u)) * 0x846ca68bu;
  return x ^ (x >> 16u);
}

fn turn(q: vec4f, v: vec3f) -> vec3f {
  let t = 2.0 * cross(q.xyz, v);
  return v + q.w * t + cross(q.xyz, t);
}

fn slotOf(base: u32, h: u32) -> u32 {
  return ${kn}u + 2u * (base + h);
}

fn insert(base: u32, a: u32, b: u32) {
  var h = hash32((a * 0x9e3779b1u) ^ hash32(b)) & params.mask;
  for (var probe = 0u; probe <= 2u * params.mask + 1u; probe++) {
    let s = slotOf(base, h);
    let r = atomicCompareExchangeWeak(&table[s], 0u, a + 1u);
    if (r.exchanged) {
      atomicStore(&table[s + 1u], b);
      return;
    }
    // (A weak exchange can fail with the slot still empty: try it again)
    if (r.old_value != 0u) { h = (h + 1u) & params.mask; }
  }
  atomicOr(&table[1], 1u);
}

fn has(base: u32, a: u32, b: u32) -> bool {
  var h = hash32((a * 0x9e3779b1u) ^ hash32(b)) & params.mask;
  for (var probe = 0u; probe <= params.mask; probe++) {
    let s = slotOf(base, h);
    let k = atomicLoad(&table[s]);
    if (k == 0u) { return false; }
    if (k == a + 1u && atomicLoad(&table[s + 1u]) == b) { return true; }
    h = (h + 1u) & params.mask;
  }
  return false;
}

fn emit(kind: u32, a: u32, b: u32, point: vec3f, impulse: f32, normal: vec3f) {
  let e = atomicAdd(&table[0], 1u);
  if (e >= params.capacity) { return; }
  events[${_r}u * e] = bitcast<vec4f>(vec4u(kind, a, b, params.step));
  events[${_r}u * e + 1u] = vec4f(point, impulse);
  events[${_r}u * e + 2u] = vec4f(normal, 0.0);
}

/** Per pair this step: into this step's set, and a begin if it wasn't in last step's. */
@compute @workgroup_size(64)
fn touching(@builtin(global_invocation_id) id: vec3u) {
  let m = id.x;
  if (m >= min(counters[${gr}u], params.pairs)) { return; }
  let mf = manifolds[m];
  let count = mf.ids.w & 15u;
  let a = mf.ids.x;
  let b = mf.ids.y;
  if (count == 0u || (watch[a] | watch[b]) == 0u) { return; }
  insert(params.now, a, b);
  if (has(params.prev, a, b)) { return; }
  // Where (the points' average, on a) and how hard (the normal force over the step)
  let pA = bodies[a * STRIDE + ${fr/4}u].xyz;
  let qA = bodies[a * STRIDE + ${Zr/4}u];
  var point = vec3f(0.0);
  var force = 0.0;
  for (var i = 0u; i < count; i++) {
    let k = contacts[mf.ids.z + i];
    point += turn(qA, k.rA) + pA;
    force += k.lam.x;
  }
  emit(${Ai}u, a, b, point / f32(count), abs(force) * params.dt, mf.geo.xyz);
}

/** Per slot of last step's set: an end if the pair isn't in this step's. */
@compute @workgroup_size(64)
fn ended(@builtin(global_invocation_id) id: vec3u) {
  if (id.x > params.mask) { return; }
  let s = slotOf(params.prev, id.x);
  let k = atomicLoad(&table[s]);
  if (k == 0u) { return; }
  let b = atomicLoad(&table[s + 1u]);
  if (!has(params.now, k - 1u, b)) { emit(${Jf}u, k - 1u, b, vec3f(0.0), 0.0, vec3f(0.0)); }
}
`,Xf=ds.replace("struct Manifold { ids: vec4u, geo: vec4f }","struct Manifold { ids:vec4u, pl:vec4f, anchors:vec4f, geo:vec4f, misc:vec4f }").replace(`const STRIDE = ${We/4}u;`,"const STRIDE = 6u;").replace(ds.slice(ds.indexOf(`@compute @workgroup_size(64)
fn touching`),ds.indexOf("/** Per slot of last step")),`
@compute @workgroup_size(64) fn touching(@builtin(global_invocation_id) id:vec3u){
  let m=id.x;let count=min(counters[1u],params.pairs);if(m>=count){return;}
  let c=manifolds[m];let a=c.ids.x;let b=c.ids.y;
  if((watch[a]|watch[b])==0u){return;}
  if(m>0u && all(manifolds[m-1u].ids.xy==c.ids.xy)){return;}
  insert(params.now,a,b);if(has(params.prev,a,b)){return;}
  let pose=bodies[a*STRIDE];let cs=cos(pose.z);let sn=sin(pose.z);
  let r=c.anchors.xy;let point=pose.xy+vec2f(cs*r.x-sn*r.y,sn*r.x+cs*r.y);
  emit(${Ai}u,a,b,vec3f(point,0.),abs(c.pl.z)*params.dt,vec3f(c.geo.zw,0.));
}

`),xi=class{device;pipelines;layout;watch;table;events;params;setSlots;capacity;group=null;bound=[];flip=0;bodies;constructor(e,t,i,r,o,a=3){this.device=e,this.bodies=t,this.capacity=o,this.setSlots=2**Math.ceil(Math.log2(Math.max(64,2*r)));let n=e.createShaderModule({label:"contact events",code:a===2?Xf:ds}),l=["read-only-storage","read-only-storage","read-only-storage","read-only-storage","read-only-storage","storage","storage","uniform"];this.layout=e.createBindGroupLayout({label:"contact events",entries:l.map((d,p)=>({binding:p,visibility:GPUShaderStage.COMPUTE,buffer:{type:d}}))});let c=e.createPipelineLayout({bindGroupLayouts:[this.layout]}),u=d=>e.createComputePipeline({label:`contact events ${d}`,layout:c,compute:{module:n,entryPoint:d}});this.pipelines={touching:u("touching"),ended:u("ended")};let f=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC;this.watch=e.createBuffer({label:"contact watch",size:Math.max(16,i*4),usage:f}),this.table=e.createBuffer({label:"contact sets",size:(kn+4*this.setSlots)*4,usage:f}),this.events=e.createBuffer({label:"contact events",size:o*_r*16,usage:f}),this.params=e.createBuffer({label:"contact params",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}setWatched(e,t){let i=e.map((r,o)=>[r,t[o]?1:0]).sort((r,o)=>r[0]-o[0]);for(let r=0;r<i.length;){let o=r+1;for(;o<i.length&&i[o][0]===i[o-1][0]+1;)o++;this.device.queue.writeBuffer(this.watch,i[r][0]*4,Uint32Array.from(i.slice(r,o),a=>a[1])),r=o}}run(e,t,i,r){let o=this.device,a=[this.bodies,e.manifolds,e.contacts,e.counters,this.watch,this.table,this.events,this.params];(!this.group||a.some((d,p)=>d!==this.bound[p]))&&(this.bound=a,this.group=o.createBindGroup({layout:this.layout,entries:a.map((d,p)=>({binding:p,resource:{buffer:d}}))})),this.flip=1-this.flip;let[n,l]=this.flip?[0,this.setSlots]:[this.setSlots,0],c=new Uint32Array([n,l,this.setSlots-1,this.capacity,t,i,0,0]);new Float32Array(c.buffer)[6]=r,o.queue.writeBuffer(this.params,0,c);let u=o.createCommandEncoder({label:"contact events"});u.clearBuffer(this.table,(kn+2*l)*4,2*this.setSlots*4);let f=u.beginComputePass({label:"contact events"});f.setBindGroup(0,this.group),f.setPipeline(this.pipelines.touching),f.dispatchWorkgroups(Math.max(1,Math.ceil(t/64))),f.setPipeline(this.pipelines.ended),f.dispatchWorkgroups(Math.ceil(this.setSlots/64)),f.end(),o.queue.submit([u.finish()])}async read(){let e=this.device,t=16+this.capacity*_r*16,i=e.createBuffer({size:t,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),r=e.createCommandEncoder({label:"read contact events"});r.copyBufferToBuffer(this.table,0,i,0,16),r.copyBufferToBuffer(this.events,0,i,16,t-16),r.clearBuffer(this.table,0,16),e.queue.submit([r.finish()]),await i.mapAsync(GPUMapMode.READ);let o=i.getMappedRange().slice(0);i.unmap(),i.destroy();let a=new Uint32Array(o),n=new Float32Array(o),l=Math.min(a[0],this.capacity),c=[];for(let u=0;u<l;u++){let f=4+u*_r*4;c.push({kind:a[f],a:a[f+1],b:a[f+2],step:a[f+3],point:[n[f+4],n[f+5],n[f+6]],impulse:n[f+7],normal:[n[f+8],n[f+9],n[f+10]]})}return c.sort((u,f)=>u.step-f.step),{events:c,dropped:a[0]-l,full:a[1]!==0}}destroy(){for(let e of[this.watch,this.table,this.events,this.params])e.destroy()}};var xc=[0,1,2,3,5,4,0,3,4,0,4,1,1,4,5,1,5,2,2,5,3,2,3,0],Er=xc.slice();for(let s=0;s<Er.length;s+=3)[Er[s+1],Er[s+2]]=[Er[s+2],Er[s+1]];var yo=(s,e,t)=>{let i=Array.from(s??[]);if(i.length!==e||!i.every(Number.isFinite))throw Error(`${t} requires ${e} finite values`);return i},Ac=(s,e)=>{if(!Number.isFinite(s)||s<=0)throw Error(`${e} must be positive and finite`);return s};function wc(s){let e=[0,1,2].map(u=>s.reduce((f,d)=>f+d[u],0)/s.length),[t,i,r,o]=s,a=i.map((u,f)=>u-t[f]),n=r.map((u,f)=>u-t[f]),l=(a[1]*n[2]-a[2]*n[1])*(t[0]-o[0])+(a[2]*n[0]-a[0]*n[2])*(t[1]-o[1])+(a[0]*n[1]-a[1]*n[0])*(t[2]-o[2]),c=ja(s.flatMap(u=>u.map((f,d)=>f-e[d])),l>0?xc:Er);if(!c)throw Error("Terrain contains a degenerate collision piece");return{shape:c,position:c.center.map((u,f)=>u+e[f]),rotation:c.rotation}}function Mr({heights:s,columns:e,rows:t,spacing:i=1,origin:r=[0,0,0],upAxis:o=1,baseHeight:a,holes:n}={}){for(let[g,b]of Object.entries({columns:e,rows:t}))if(!Number.isInteger(b)||b<2)throw Error(`${g} must be an integer >= 2`);let l=yo(s,e*t,"heights"),c=yo(r,3,"origin");if(![0,1,2].includes(o))throw Error("upAxis must be 0, 1 or 2");let u=typeof i=="number"?[i,i]:yo(i,2,"spacing");u.forEach(g=>Ac(g,"spacing"));let f=a??l.reduce((g,b)=>Math.min(g,b),1/0)-2;if(!Number.isFinite(f)||l.some(g=>g<=f))throw Error("baseHeight must be below every terrain height");let d=(e-1)*(t-1);if(n&&n.length!==d)throw Error("holes requires one value per terrain cell");let p=[0,1,2].filter(g=>g!==o),m=[],h=(g,b)=>{let y=[...c];return y[p[0]]+=g*u[0],y[p[1]]+=b*u[1],y[o]+=l[b*e+g],y};for(let g=0;g<t-1;g++)for(let b=0;b<e-1;b++){if(n?.[g*(e-1)+b])continue;let y=h(b,g),A=h(b+1,g),v=h(b,g+1),x=h(b+1,g+1);for(let w of[[y,A,v],[A,x,v]])m.push(wc([...w,...w.map(B=>{let L=[...B];return L[o]=c[o]+f,L})]))}return{kind:"heightfield",pieces:m,triangleCount:m.length}}function zr({positions:s,indices:e,thickness:t=.1}={}){if(!s||s.length%3)throw Error("positions requires xyz triples");let i=yo(s,s.length,"positions"),r=i.length/3;if(e===void 0&&r%3)throw Error("Nonindexed positions require three vertices per triangle");let o=e===void 0?Array.from({length:r},(n,l)=>l):Array.from(e);if(!o.length||o.length%3||!o.every(n=>Number.isInteger(n)&&n>=0&&n<r))throw Error("indices requires valid triangle vertex indices");Ac(t,"thickness");let a=[];for(let n=0;n<o.length;n+=3){let l=o.slice(n,n+3).map(g=>i.slice(g*3,g*3+3)),[c,u,f]=l,d=u.map((g,b)=>g-c[b]),p=f.map((g,b)=>g-c[b]),m=[d[1]*p[2]-d[2]*p[1],d[2]*p[0]-d[0]*p[2],d[0]*p[1]-d[1]*p[0]],h=Math.hypot(...m);h!==0&&a.push(wc([...l,...l.map(g=>g.map((b,y)=>b-m[y]*t/h))]))}if(!a.length)throw Error("Static mesh requires at least one nondegenerate triangle");return{kind:"static-mesh",pieces:a,triangleCount:a.length}}function vo(s,e,t={}){if(t.mass!==void 0&&t.mass!==0)throw Error("Terrain is static and requires zero mass");let i=t.friction??.6,r=t.restitution??0;if(!Number.isFinite(i)||i<0)throw Error("friction must be nonnegative and finite");if(!Number.isFinite(r)||r<0||r>1)throw Error("restitution must be between 0 and 1");for(let o of["group","collidesWith"]){let a=t[o]??4294967295;if(!Number.isInteger(a)||a<0||a>4294967295)throw Error(`${o} must be an unsigned 32-bit integer`)}if(!e?.pieces?.length)throw Error("Terrain requires collision pieces");return e.pieces.map(o=>{let a=lr(s,o.shape,0,i,o.position,o.rotation);return Object.assign(a,{allowSleep:!1,isTrigger:!1,restitution:r,group:t.group??4294967295,collidesWith:t.collidesWith??4294967295}),a})}var rt=Object.freeze({BOX:"box",SPHERE:"sphere",CAPSULE:"capsule",CYLINDER:"cylinder",CONVEX_HULL:"convex-hull"}),Le=s=>s&&typeof s.x=="number"?[s.x,s.y,s.z,...typeof s.w=="number"?[s.w]:[]]:Array.from(s),hs=new WeakMap,Ir=s=>{if(!Number.isInteger(s)||s<0||s>4294967295)throw Error("Collision masks must be unsigned 32-bit integers");return s},xo=(s,e,t=!1)=>{if(!Number.isFinite(s)||(t?s<0:s<=0))throw Error(`${e} must be ${t?"nonnegative":"positive"} and finite`);return s},ps=class s{static async create({device:e,...t}={}){if(t.scene&&hs.has(t.scene))throw Error("This scene already has an AVBD world");let i=!e;e||({device:e}=await Sr({preferredLimits:{maxStorageBuffersPerShaderStage:9,maxStorageBufferBindingSize:512*1024*1024,maxBufferSize:1024*1024*1024}}));let r;try{return await Ni(e),r=new s(e,t),r.ownsDevice=i,r.scene&&r.autoAttach&&r.attachToScene(),r}catch(o){throw r?r.dispose():i&&e.destroy(),o}}constructor(e,{scene:t,gravity:i=[0,-10,0],timeStep:r=1/60,iterations:o=10,capacity:a=4096,syncMeshes:n=!0,maxSyncedBodies:l=2048,broadphase:c="auto",solverMode:u="auto",smallGroups:f,bvh:d={},autoAttach:p=!0,maxContactPairs:m=8192,maxContactEvents:h=4096,sleeping:g=!1}={}){if(this.device=e,this.scene=t,this.autoAttach=p,this.syncEnabled=n,this.maxSyncedBodies=l,!Number.isInteger(a)||a<1||!Number.isInteger(l)||l<0)throw Error("capacity and maxSyncedBodies must be valid integer counts");if(this.capacity=a,this.collisionOptions={broadphase:c,bvh:d,solverMode:u,smallGroups:f},this.ref=new ni,this.ref.dt=xo(r,"timeStep"),!Number.isInteger(o)||o<1)throw Error("iterations must be a positive integer");this.ref.iterations=o,this.aggregates=[],this.constraints=new Set,this.contactListeners=new Set;for(let[y,A]of Object.entries({maxContactPairs:m,maxContactEvents:h}))if(!Number.isInteger(A)||A<1)throw Error(`${y} must be a positive integer`);if(this.contactOptions={maxContactPairs:m,maxContactEvents:h},this.bodyReadback=new vi(e),this.sleepOptions=g,g!==!1&&g!==!0&&(typeof g!="object"||g===null))throw Error("sleeping must be a boolean or options object");this.commands=new Map,this.steps=0,this.errors=[],this.deviceLost=null;let b=new WeakRef(this);e.lost.then(y=>{let A=b.deref();!A||A.disposed||(A.deviceLost={reason:y.reason,message:y.message},A.errors.push(`WebGPU device lost: ${y.message||y.reason}`),A.dispose())}),this.setGravity(i),this.errorListener=y=>this.errors.push(y.error.message),e.addEventListener("uncapturederror",this.errorListener),t&&hs.set(t,this)}setGravity(e){let t=Le(e);if(t.length!==3||!t.every(Number.isFinite))throw Error("gravity requires three finite components");let i=Math.hypot(...t);this.gravity=-i,this.up=i?t.map(r=>-r/i):[0,1,0],this.gpu&&(this.gpu.params.gravity=this.gravity,this.gpu.params.up=this.up),this.wakeAll()}get solverDecision(){return this.initialize(),{...this.gpu.solverDecision}}setSolverMode(e){this.initialize();let t=this.gpu.setSolverMode(e);return this.collisionOptions.solverMode=e,{...t}}initialize(){if(this.assertAlive(),this.gpu)return;if(this.syncEnabled&&this.aggregates.filter(r=>r.sync).length>this.maxSyncedBodies)throw Error("For large scenes use syncMeshes:false and draw the GPU body buffer directly");if(this.aggregates.length>this.capacity)throw Error(`Body capacity ${this.capacity} exceeded; size the world before initialization`);this.gpu=new gi(this.device,this.ref,go(this.ref,{bodyCapacity:Math.max(1,this.capacity),spatialSort:!0,...this.collisionOptions})),Object.assign(this.gpu.params,{gravity:this.gravity,up:this.up}),this.gpu.externalBeforeStep=r=>{this.sleepManager?.before(r),this.flushCommands(r)},this.gpu.externalAfterStep=r=>this.sleepManager?.after(r);let e=new Map([...this.constraints].map(r=>[r.force,r])),t=[],i=0;for(let r of this.ref.forces){let o=e.get(r);o&&(o.attach(i++,!1),(o.type==="fixed"||o.type==="spring"&&o.rest===void 0)&&t.push({slot:o.slot,spring:o.type==="spring"}))}this.gpu.captureConstraintFrames(t),this.byGpuIndex=new Map(this.aggregates.map(r=>[this.gpu.gpuIndex(r.index),r.body]));for(let r of this.aggregates)(r.disposed||r.group!==4294967295||r.collidesWith!==4294967295)&&this.gpu.setFilters([this.gpu.gpuIndex(r.index)],[r.disposed?0:r.group],[r.disposed?0:r.collidesWith]);for(let r of this.aggregates)r.isTrigger&&this.gpu.setSensor(r.body.gpuIndex,!0);for(let r of this.aggregates)r.restitution>0&&this.gpu.setRestitution(r.body.gpuIndex,r.restitution);this.contactListeners.size&&this.initializeContacts(),this.sleepOptions&&(this.sleepManager=new Fi(this,this.sleepOptions===!0?{}:this.sleepOptions))}addAggregate(e,t,i={}){return new ms(e,t,i,this)}addAggregates(e){return e.map(({mesh:t,type:i,options:r})=>this.addAggregate(t,i,r))}addHeightfield(e){return this.addTerrain(Mr(e),e)}addStaticMesh(e,t={}){e.computeWorldMatrix(!0);let i=e.getVerticesData("position"),r=e.getWorldMatrix().m;if(!i)throw Error("Static mesh requires vertex positions");let o=new Float64Array(i.length);for(let u=0;u<i.length;u+=3){let f=i[u],d=i[u+1],p=i[u+2];for(let m=0;m<3;m++)o[u+m]=r[m]*f+r[4+m]*d+r[8+m]*p+r[12+m]}let a=e.getIndices(),n=a?.length?Uint32Array.from(a):Uint32Array.from({length:i.length/3},(u,f)=>f),l=e.getVerticesData("normal"),c=e.getWorldMatrix().determinant()<0;for(let u=0;u<n.length;u+=3){let f=n[u]*3,d=n[u+1]*3,p=n[u+2]*3,m=[0,1,2].map(b=>i[d+b]-i[f+b]),h=[0,1,2].map(b=>i[p+b]-i[f+b]),g=!1;l?.length===i.length&&(g=[m[1]*h[2]-m[2]*h[1],m[2]*h[0]-m[0]*h[2],m[0]*h[1]-m[1]*h[0]].reduce((y,A,v)=>y+A*(l[f+v]+l[d+v]+l[p+v]),0)<0),g!==c&&([n[u+1],n[u+2]]=[n[u+2],n[u+1]])}return this.addTerrain(zr({positions:o,indices:n,thickness:t.thickness}),t)}addTerrain(e,t={}){if(this.assertAlive(),this.gpu)throw Error("Add static terrain before initializing the physics world");if(this.device.limits.maxStorageBuffersPerShaderStage<9)throw Error("Terrain collisions require nine storage buffer bindings");if(this.aggregates.length+(e?.pieces?.length??0)>this.capacity)throw Error("AVBD terrain exceeds body capacity; reserve space for its collision pieces");let r=vo(this.ref,e,t).map(a=>new Pn(this,a)),o=!1;return{bodies:r.map(a=>a.body),triangleCount:e.triangleCount,kind:e.kind,dispose:()=>{if(o)return;o=!0;let a=new Set(r.map(n=>n.body));for(let n of[...this.constraints])(a.has(n.bodyA)||a.has(n.bodyB))&&n.dispose();if(this.gpu&&!this.disposed){let n=r.map(c=>c.body.gpuIndex),l=new Uint32Array(n.length);this.gpu.setFilters(n,l,l)}for(let n of r)n.disposed=n.body.disposed=!0,n.group=n.collidesWith=0,this.commands.delete(n.body);this.wakeAll()}}}addConstraint(e,t,i={}){return new Pr(this,e,t,i)}addJoint(e,t,i={}){return this.addConstraint(e,t,{...i,type:i.type??"ball"})}addWeld(e,t,i={}){return this.addConstraint(e,t,{...i,type:"fixed"})}addSpring(e,t,i={}){return this.addConstraint(e,t,{...i,type:"spring"})}enableSleeping(e={}){return this.assertAlive(),this.sleepOptions=e,this.gpu&&!this.sleepManager&&(this.sleepManager=new Fi(this,e)),this}disableSleeping(){return this.assertAlive(),this.sleepOptions=!1,this.gpu?(this.flushCommands(),this.sleepManager&&(this.sleepManager.wakeRequested=!0,this.sleepManager.before(),this.sleepManager.dispose(),this.sleepManager=null),this):this}addMotor(e,t,i={}){return this.addConstraint(e,t,{...i,type:"motor"})}addHinge(e,t,i={}){return new Lr(this,e,t,i)}initializeContacts(){if(this.contactWatch)return;let{maxContactPairs:e,maxContactEvents:t}=this.contactOptions;this.contactWatch=new xi(this.device,this.gpu.bodyBuffer,this.capacity,e,t);let i=this.aggregates.filter(r=>!r.disposed);this.contactWatch.setWatched(i.map(r=>r.body.gpuIndex),i.map(()=>!0))}onContact(e){if(this.assertAlive(),typeof e!="function")throw Error("A contact callback is required");return this.contactListeners.add(e),this.gpu&&this.initializeContacts(),()=>this.contactListeners.delete(e)}async readContactEvents(){return this.initialize(),this.initializeContacts(),this.contactPending?this.contactPending:(this.contactPending=this.contactWatch.read().then(e=>({...e,events:e.events.map(t=>({...t,type:t.kind===Ai?"begin":"end",isTrigger:!!(this.byGpuIndex.get(t.a)?.aggregate.isTrigger||this.byGpuIndex.get(t.b)?.aggregate.isTrigger),a:this.byGpuIndex.get(t.a),b:this.byGpuIndex.get(t.b)}))})).finally(()=>this.contactPending=null),this.contactPending)}async raycast(e,t,i={}){let[r]=await this.raycastAll([{origin:e,direction:t,maxDistance:i.maxDistance}],i);return r}async sphereCast(e,t,i,r={}){let[o]=await this.sphereCastAll([{origin:e,radius:t,direction:i,maxDistance:r.maxDistance}],r);return o}async sphereCastAll(e,{ignore:t=[],collidesWith:i=4294967295,includeTriggers:r=!0}={}){this.assertAlive(),Ir(i),this.initialize(),this.flushCommands();for(let a of t)if(a.aggregate.world!==this||a.disposed)throw Error("Ignored cast bodies must belong to this world and be alive");return(await this.gpu.sphereCastAll(e.map(a=>({...a,origin:Le(a.origin),direction:Le(a.direction)})),{ignore:t.map(a=>a.gpuIndex),collidesWith:i,includeTriggers:r})).map(a=>a?{...a,body:this.byGpuIndex.get(a.index)??null}:null)}async raycastAll(e,{ignore:t=[],collidesWith:i=4294967295,includeTriggers:r=!0}={}){Ir(i),this.initialize(),this.flushCommands();let o=e.map(n=>{let l=Le(n.origin),c=Le(n.direction);if(l.length!==3||c.length!==3||![...l,...c].every(Number.isFinite)||!Math.hypot(...c))throw Error("A ray requires a finite origin and nonzero direction");return n.maxDistance!==void 0&&xo(n.maxDistance,"maxDistance",!0),{...n,origin:l,direction:c}});for(let n of t)if(n.aggregate.world!==this)throw Error("Ignored ray bodies must belong to this world");return(await this.gpu.raycastAll(o,{ignore:t.map(n=>n.gpuIndex),collidesWith:i,includeTriggers:r})).map(n=>n?{...n,body:this.byGpuIndex.get(n.index)??null}:null)}getRenderBinding(e=this.device){if(this.initialize(),e!==this.device)throw Error("Direct GPU rendering must share the physics GPUDevice");return{device:e,buffer:this.bodyBuffer,stride:160,positionOffset:0,rotationOffset:16,sizeOffset:64,count:this.gpu.bodyCount}}wakeAll(){this.sleepManager&&(this.sleepManager.wakeRequested=!0)}async readSleepStats(){return this.initialize(),this.sleepManager?this.sleepManager.readStats():{sleeping:0,wakeRequested:!1}}assertAlive(){if(this.disposed)throw Error("AVBD world is disposed")}queue(e,t,i,r){this.assertAlive(),e.assertAlive();let o=Le(r);if(o.length!==(i==="rotation"?4:3)||!o.every(Number.isFinite))throw Error(`${i} requires ${i==="rotation"?4:3} finite components`);let a=this.commands.get(e);return a||this.commands.set(e,a={mask:0}),a.mask|=t,a[i]=o,this.wakeAll(),a}flushCommands(e){if(this.initialize(),this.gpu.flushPropertyEdits(e),!this.commands.size)return;this.sleepManager?.wakeRequested&&this.sleepManager.before(e);let t=this.commands.size,i=0;for(let h of this.commands.values())i|=h.mask;if(i===1||i===2){if(!this.velocityIndices||this.velocityIndices.length<t){let y=Math.max(t,(this.velocityIndices?.length??0)*2,64);this.velocityIndices=new Uint32Array(y),this.velocityValues=new Float32Array(y*3)}let h=0;for(let[y,A]of this.commands)this.velocityIndices[h]=y.aggregate.gpuSlot??this.gpu.gpuIndex(y.aggregate.index),this.velocityValues.set(i===2?A.angular:A.velocity,h++*3);let g=i===2?"angularVelocityBatch":"velocityBatch",b=this[g]??=new Kt(this.gpu,3,i===2?"angular":"linear");b.solver=this.gpu,b.submitValidated(this.velocityIndices.subarray(0,t),this.velocityValues.subarray(0,t*3),e),this.lastCommandBatch={bodies:t,path:i===2?"packed-angular-velocities":"packed-velocities",uploadedBytes:t*16},this.commands.clear();return}let r=!0;for(let h of this.commands.values())if((h.mask&-4)!==0){r=!1;break}if(r){(!this.motionData||this.motionData.length<t*8)&&(this.motionData=new Uint32Array(Math.max(t*8,(this.motionData?.length??0)*2,512)),this.motionFloats=new Float32Array(this.motionData.buffer));let h=0;for(let[g,b]of this.commands){let y=h++*8;this.motionData[y]=g.aggregate.gpuSlot??this.gpu.gpuIndex(g.aggregate.index),this.motionData[y+1]=b.mask,b.velocity&&this.motionFloats.set(b.velocity,y+2),b.angular&&this.motionFloats.set(b.angular,y+5)}this.motionBatch??=new yi(this.gpu,3),this.motionBatch.submitValidated(this.motionData.subarray(0,t*8),e),this.lastCommandBatch={bodies:t,path:"packed-motion",uploadedBytes:t*32},this.commands.clear();return}let o=t*128,a=Math.min(this.device.limits.maxStorageBufferBindingSize,this.device.limits.maxBufferSize);if(o>a)throw Error("Body command batch exceeds GPU buffer limits");(!this.commandData||this.commandData.byteLength<o)&&(this.commandData=new ArrayBuffer(Math.min(a,Math.max(o,(this.commandData?.byteLength??0)*2,128))));let n=this.commandData,l=new Float32Array(n),c=new Uint32Array(n);l.fill(0,0,t*32);let u=0;for(let[h,g]of this.commands){let b=u++*32;c[b]=h.aggregate.gpuSlot??this.gpu.gpuIndex(h.aggregate.index),c[b+1]=g.mask;for(let[y,A]of[["velocity",4],["angular",8],["impulse",12],["torque",16],["position",20],["rotation",24],["pointImpulse",28]])g[y]&&l.set(g[y],b+A)}this.commands.clear(),(!this.commandBuffer||this.commandBuffer.size<o)&&(this.commandBuffer?.destroy(),this.commandBuffer=this.device.createBuffer({size:Math.min(a,Math.max(o*2,128)),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})),this.device.queue.writeBuffer(this.commandBuffer,0,n,0,o),this.commandPipeline??=this.device.createComputePipeline({layout:"auto",compute:{module:this.device.createShaderModule({code:`const DISPATCH_STRIDE = ${this.device.limits.maxComputeWorkgroupsPerDimension*64}u;
${yc}`,label:"AVBD body commands"}),entryPoint:"applyCommands"}}),(!this.commandBinding||this.boundCommandBody!==this.gpu.bodyBuffer||this.boundCommandBuffer!==this.commandBuffer||this.boundCommandBytes!==o)&&(this.commandBinding=this.device.createBindGroup({layout:this.commandPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.gpu.bodyBuffer}},{binding:1,resource:{buffer:this.commandBuffer,size:o}}]}),this.boundCommandBody=this.gpu.bodyBuffer,this.boundCommandBuffer=this.commandBuffer,this.boundCommandBytes=o);let f=e??this.device.createCommandEncoder(),d=f.beginComputePass();d.setPipeline(this.commandPipeline),d.setBindGroup(0,this.commandBinding);let p=Math.ceil(u/64),m=this.device.limits.maxComputeWorkgroupsPerDimension;d.dispatchWorkgroups(Math.min(p,m),Math.ceil(p/m)),d.end(),e||this.device.queue.submit([f.finish()]),this.lastCommandBatch={bodies:t,path:"aggregate-commands",uploadedBytes:o}}step(){this.initialize(),this.gpu.step(),this.steps++,this.contactWatch&&(this.contactWatch.run(this.gpu.contactStorage,this.gpu.manifoldCapacity,this.steps,this.ref.dt),this.contactListeners.size&&!this.contactPending&&this.readContactEvents().then(({events:e,dropped:t,full:i})=>{if(!this.disposed){(t||i)&&this.errors.push(`Contact event storage full: ${t} events dropped; increase maxContactEvents/maxContactPairs`);for(let r of e)for(let o of this.contactListeners)o(r)}}).catch(e=>{this.disposed||this.errors.push(e.message)})),this.syncEnabled&&!this.syncPending&&this.syncMeshes().catch(e=>this.errors.push(e.message)),this.steps%20===0&&!this.counterPending&&(this.counterPending=!0,this.gpu.readCounters().then(e=>{this.disposed||(this.counters=e,this.gpu.adapt(e),(e.overflow||e.clashes)&&this.errors.push(`Collision capacity/color conflict: ${JSON.stringify(e)}`))}).catch(e=>{this.disposed||this.errors.push(e.message)}).finally(()=>this.counterPending=!1))}async syncMeshes(){if(this.initialize(),this.flushCommands(),this.syncPending)return this.syncPending;let e=this.aggregates.filter(t=>t.sync&&!t.disposed);return this.syncPending=this.bodyReadback.read(this.bodyBuffer,e.map(t=>t.body.gpuIndex),!0).then(t=>{if(!this.disposed){for(let i=0;i<e.length;i++)e[i].disposed||e[i].syncPose(t,i*8);this.lastSyncBytes=t.byteLength}}).finally(()=>this.syncPending=null),this.syncPending}get bodyBuffer(){return this.initialize(),this.gpu.bodyBuffer}async readBodies(e){if(this.initialize(),this.flushCommands(),e){for(let t of e)if(t.aggregate.world!==this)throw Error("Selected bodies must belong to this world");return this.bodyReadback.read(this.bodyBuffer,e.map(t=>t.gpuIndex))}return this.gpu.readBodies()}dispose(){if(!this.disposed){this.disposed=!0,this.observer&&this.scene?.onBeforeRenderObservable.remove(this.observer),this.disposeObserver&&this.scene?.onDisposeObservable.remove(this.disposeObserver),this.scene&&hs.get(this.scene)===this&&hs.delete(this.scene),this.device.removeEventListener("uncapturederror",this.errorListener),this.gpu?.destroy(),this.contactWatch?.destroy(),this.sleepManager?.dispose(),this.commandBuffer?.destroy(),this.velocityBatch?.destroy(),this.angularVelocityBatch?.destroy(),this.motionBatch?.destroy(),this.bodyReadback.destroy(),this.commandData=this.velocityIndices=this.velocityValues=null,this.commandBinding=null;for(let e of this.aggregates)e.disposed=!0,e.body.disposed=!0;this.commands.clear(),this.contactListeners.clear();for(let e of this.constraints)e.disposed=!0;this.constraints.clear(),this.ownsDevice&&this.device.destroy()}}attachToScene(e=this.scene){if(this.assertAlive(),!e)throw Error("A Babylon scene is required");if(this.observer&&e===this.scene)return this;if(this.observer)throw Error("AVBD world is already attached to another scene");this.scene=e,this.disposeObserver=e.onDisposeObservable.addOnce(()=>this.dispose());let t=0;return this.observer=e.onBeforeRenderObservable.add(()=>{t+=Math.min(.05,e.getEngine().getDeltaTime()/1e3);for(let i=0;t>=this.ref.dt&&i<3;i++)this.step(),t-=this.ref.dt}),this}},ms=class{constructor(e,t,{mass:i=1,friction:r=.6,restitution:o=0,allowSleep:a,isTrigger:n=!1,sync:l=!0,group:c=4294967295,collidesWith:u=4294967295}={},f){if(f=f instanceof ps?f:hs.get(f??e.getScene()),!f)throw Error("Create an AVBD world for this scene before adding aggregates");if(f.assertAlive(),typeof t=="number"&&(t=[rt.SPHERE,rt.CAPSULE,rt.CYLINDER,rt.BOX,rt.CONVEX_HULL][t]),xo(i,"mass",!0),xo(r,"friction",!0),!Number.isFinite(o)||o<0||o>1)throw Error("restitution must be between 0 and 1");if(e.parent)throw Error("AVBD aggregate meshes must have no parent; bake the parent transform first");if(!Object.values(rt).includes(t))throw Error(`Unsupported AVBD shape: ${t}`);if(f.aggregates.length>=f.capacity)throw Error("AVBD body capacity exceeded");if(this.world=f,this.mesh=e,this.sync=l,this.type=t,a!==void 0&&typeof a!="boolean")throw Error("allowSleep must be a boolean");if(this.allowSleep=a??!0,typeof n!="boolean")throw Error("isTrigger must be a boolean");if(this.isTrigger=n,this.restitution=o,a===!0&&!f.sleepOptions&&f.enableSleeping(),this.group=Ir(c),this.collidesWith=Ir(u),f.gpu&&f.syncEnabled&&l&&f.aggregates.filter(v=>v.sync&&!v.disposed).length>=f.maxSyncedBodies)throw Error("For large scenes use syncMeshes:false and draw the GPU body buffer directly");if(![rt.BOX,rt.SPHERE,rt.CAPSULE].includes(t)&&f.device.limits.maxStorageBuffersPerShaderStage<9)throw Error("Convex hull collisions require nine storage buffer bindings");e.computeWorldMatrix(!0),e.refreshBoundingInfo();let d=e.getBoundingInfo().boundingBox,p=e.scaling;if([p.x,p.y,p.z].some(v=>v<=0))throw Error("Bake negative or zero mesh scaling before creating an aggregate");let m=d.maximum.subtract(d.minimum).multiply(p),h=d.center.multiply(p),g=e.rotationQuaternion?.clone()||e.rotation.toQuaternion();this.localCenter=h,this.localRotation=g.constructor.Identity();let b;if(t===rt.BOX)b=new Ze(f.ref,Le(m),1,r,[0,0,0]);else if(t===rt.SPHERE){if(Math.max(m.x,m.y,m.z)-Math.min(m.x,m.y,m.z)>1e-4)throw Error("Sphere aggregate requires uniform dimensions");b=nr(f.ref,m.x/2,1,r,[0,0,0])}else if(t===rt.CAPSULE){if(Math.abs(m.x-m.z)>1e-4)throw Error("Capsule aggregate requires equal X and Z diameters; bake an upright Y-axis capsule mesh");b=Cr(f.ref,m.x/2,m.y,1,r,[0,0,0])}else{let v=e.getVerticesData("position");if(!v)throw Error("Hull aggregate requires mesh positions");let x=Float32Array.from(v,(B,L)=>B*[p.x,p.y,p.z][L%3]),w=Xr(x);if(!w)throw Error("Hull aggregate requires a closed shape with nonzero volume");this.localCenter=new e.position.constructor(...w.center),this.localRotation=g.constructor.FromArray(w.rotation),b=lr(f.ref,w,1,r,[0,0,0])}let y=i/b.mass;b.mass=i,b.moment.forEach((v,x)=>b.moment[x]=v*y);let A=e.position.add(this.localCenter.applyRotationQuaternion(g));if(b.positionLin.set(Le(A)),b.positionAng.set(g.multiply(this.localRotation).asArray()),this.rigid=b,this.index=f.aggregates.length,this.body=new Rr(this),f.aggregates.push(this),e.rotationQuaternion=g,f.gpu){if(this.gpuSlot=f.gpu.addBody(b),this.gpuSlot<0)throw Error("AVBD body capacity exceeded");f.byGpuIndex.set(this.gpuSlot,this.body),f.gpu.setFilters([this.gpuSlot],[this.group],[this.collidesWith]),(this.isTrigger||f.gpu.sensorsEnabled)&&f.gpu.setSensor(this.gpuSlot,this.isTrigger),this.restitution>0&&f.gpu.setRestitution(this.gpuSlot,this.restitution),f.contactWatch?.setWatched([this.gpuSlot],[!0]),f.sleepManager?.register(this.gpuSlot,b.mass,this.allowSleep),f.wakeAll?.()}}syncPose(e,t){let i=t??this.body.gpuIndex*40,r=this.localRotation.constructor.FromArray(e,i+4).multiply(this.localRotation.conjugate());this.mesh.rotationQuaternion.copyFrom(r),this.mesh.position.copyFrom(new this.mesh.position.constructor(...e.subarray(i,i+3)).subtract(this.localCenter.applyRotationQuaternion(r)))}dispose(){Bc(this)}},Pn=class{constructor(e,t){Object.assign(this,{world:e,rigid:t,index:e.aggregates.length,sync:!1,allowSleep:!1,isTrigger:!1,restitution:t.restitution,group:t.group,collidesWith:t.collidesWith,staticTerrain:!0}),this.body=new Rr(this),e.aggregates.push(this)}dispose(){Bc(this)}};function Bc(s){if(s.disposed)return;let e=s.world;for(let t of[...e.constraints])(t.bodyA===s.body||t.bodyB===s.body)&&t.dispose();if(e.gpu){let t=s.body.gpuIndex;e.queue(s.body,16,"velocity",[0,0,0]),e.gpu.setFilters([t],[0],[0]),e.gpu.setRestitution(t,0)}s.rigid.mass=0,s.rigid.moment.fill(0),s.sync=!1,s.disposed=s.body.disposed=!0,e.sleepManager?.register(s.gpuSlot??e.gpu?.gpuIndex(s.index)??s.index,0),e.wakeAll?.()}var Rr=class{constructor(e){this.aggregate=e}assertAlive(){if(this.disposed||this.aggregate.disposed)throw Error("AVBD body is disposed")}get gpuIndex(){this.assertAlive();let e=this.aggregate.world;return e.initialize(),this.aggregate.gpuSlot??e.gpu.gpuIndex(this.aggregate.index)}setLinearVelocity(e){return this.aggregate.world.queue(this,1,"velocity",e),this}setAngularVelocity(e){return this.aggregate.world.queue(this,2,"angular",e),this}applyImpulse(e,t){let i=t?Le(t):null;if(i&&(i.length!==3||!i.every(Number.isFinite)))throw Error("Impulse point requires three finite components");let r=this.aggregate.world,o=Le(e),a=r.commands.get(this),n=o.map((c,u)=>c+(a?.impulse?.[u]||0)),l=r.queue(this,4,"impulse",n);if(t){let c=[i[1]*o[2]-i[2]*o[1],i[2]*o[0]-i[0]*o[2],i[0]*o[1]-i[1]*o[0]],u=l.torque||[0,0,0];l.torque=Le(c).map((f,d)=>f+u[d]),l.pointImpulse=o.map((f,d)=>f+(l.pointImpulse?.[d]||0))}return this}applyAngularImpulse(e){let t=this.aggregate.world,i=t.commands.get(this)?.torque||[0,0,0];return t.queue(this,4,"torque",Le(e).map((r,o)=>r+i[o])),this}applyForce(e,t){return this.applyImpulse(Le(e).map(i=>i*this.aggregate.world.ref.dt),t)}applyTorque(e){return this.applyAngularImpulse(Le(e).map(t=>t*this.aggregate.world.ref.dt))}setCollisionGroups(e,t=4294967295){this.assertAlive();let i=this.aggregate,r=Ir(e),o=Ir(t);return i.group=r,i.collidesWith=o,i.world.gpu&&i.world.gpu.setFilters([this.gpuIndex],[i.group],[i.collidesWith]),i.world.wakeAll?.(),this}setTrigger(e){if(this.assertAlive(),typeof e!="boolean")throw Error("isTrigger must be a boolean");let t=this.aggregate;return t.isTrigger=e,t.world.gpu&&t.world.gpu.setSensor(this.gpuIndex,e),t.world.wakeAll(),this}setRestitution(e){if(this.assertAlive(),!Number.isFinite(e)||e<0||e>1)throw Error("restitution must be between 0 and 1");let t=this.aggregate;return t.restitution=e,t.world.gpu&&t.world.gpu.setRestitution(this.gpuIndex,e),t.world.wakeAll(),this}async readState(){let e=await this.aggregate.world.readBodies([this]),t=this.aggregate.rigid.mass;return{position:Array.from(e.subarray(0,3)),rotation:Array.from(e.subarray(4,8)),linearVelocity:Array.from(e.subarray(32,35)),angularVelocity:Array.from(e.subarray(36,39)),mass:t,effectiveMass:e[19],sleeping:t>0&&e[19]===0}}wakeUp(){return this.assertAlive(),this.aggregate.world.wakeAll(),this}setSleepEnabled(e){if(this.assertAlive(),typeof e!="boolean")throw Error("Sleep eligibility must be a boolean");let t=this.aggregate,i=t.world;return t.allowSleep=e,e&&!i.sleepOptions&&i.enableSleeping(),i.gpu&&i.sleepManager?.register(this.gpuIndex,t.rigid.mass,e),i.wakeAll(),this}teleport(e,t){if(this.assertAlive(),this.aggregate.staticTerrain)throw Error("Terrain is static; set its geometry transform before registration");let i=this.aggregate;if(t===void 0){let a=i.world.commands.get(this);if(a&&(a.mask&8)!==0&&(a.mask&32)===0){let n=i.mesh.rotationQuaternion.clone();n.copyFromFloats(...a.rotation);let l=i.localCenter.applyRotationQuaternion(i.localRotation.conjugate());i.world.queue(this,8,"position",Le(e.add(l.applyRotationQuaternion(n))))}else{let n=i.localCenter.applyRotationQuaternion(i.localRotation.conjugate());i.world.queue(this,40,"position",Le(e)),i.world.queue(this,40,"rotation",[...Le(n),0])}return this}let r=t.clone().normalize();i.world.queue(this,8,"position",Le(e.add(i.localCenter.applyRotationQuaternion(r))));let o=i.world.queue(this,8,"rotation",r.multiply(i.localRotation).asArray());return o.mask&=-33,this}};var qi=class{solver;bodyA;bodyB;J=new Float64Array(12);H=new Float64Array(36);C=new Float64Array(4);fmin=new Float64Array(4).fill(-1/0);fmax=new Float64Array(4).fill(1/0);stiffness=new Float64Array(4).fill(1/0);fracture=new Float64Array(4).fill(1/0);penalty=new Float64Array(4);lambda=new Float64Array(4);constructor(e,t,i){this.solver=e,this.bodyA=t,this.bodyB=i,e.forces.push(this),t?.forces.push(this),i.forces.push(this)}destroy(){let e=this.solver.forces,t=e.indexOf(this);t>=0&&e.splice(t,1),this.unlinkFromBodies()}unlinkFromBodies(){for(let e of[this.bodyA,this.bodyB]){if(!e)continue;let t=e.forces.indexOf(this);t>=0&&e.forces.splice(t,1)}}disable(){this.stiffness.fill(0),this.penalty.fill(0),this.lambda.fill(0)}};var Cc=s=>s<0?-1:s>0?1:0,Or=(s,e)=>s<e?s:e,Yf=(s,e)=>s>e?s:e,Tr=(s,e,t)=>Yf(e,Or(t,s));function gs(s,e,t){let i=Math.cos(s),r=Math.sin(s);return[i*e-r*t,r*e+i*t]}function Vi(s,e,t){let i=Math.cos(s[2]),r=Math.sin(s[2]);return[i*e-r*t+s[0],r*e+i*t+s[1]]}function Zt(s,e,t,i,r){s[e*3]=t,s[e*3+1]=i,s[e*3+2]=r}var Ao=class extends qi{rA;rB;C0=new Float64Array(3);torqueArm;restAngle;constructor(e,t,i,r,o,a=[1/0,1/0,1/0],n=1/0){super(e,t,i),this.rA=[r[0],r[1]],this.rB=[o[0],o[1]],this.stiffness[0]=a[0],this.stiffness[1]=a[1],this.stiffness[2]=a[2],this.fmax[2]=n,this.fmin[2]=-n,this.fracture[2]=n,this.restAngle=(t?t.position[2]:0)-i.position[2];let l=(t?t.size[0]:0)+i.size[0],c=(t?t.size[1]:0)+i.size[1];this.torqueArm=l*l+c*c}rows(){return 3}evaluate(e){let t=this.bodyA?Vi(this.bodyA.position,this.rA[0],this.rA[1]):this.rA,i=Vi(this.bodyB.position,this.rB[0],this.rB[1]);e[0]=t[0]-i[0],e[1]=t[1]-i[1],e[2]=((this.bodyA?this.bodyA.position[2]:0)-this.bodyB.position[2]-this.restAngle)*this.torqueArm}initialize(){return this.evaluate(this.C0),this.stiffness[0]!==0||this.stiffness[1]!==0||this.stiffness[2]!==0}Cn=new Float64Array(3);computeConstraint(e){this.evaluate(this.Cn);for(let t=0;t<3;t++)this.C[t]=this.stiffness[t]===1/0?this.Cn[t]-this.C0[t]*e:this.Cn[t]}computeDerivatives(e){let{J:t,H:i}=this;if(i.fill(0,0,27),e===this.bodyA){let r=gs(e.position[2],this.rA[0],this.rA[1]);Zt(t,0,1,0,-r[1]),Zt(t,1,0,1,r[0]),Zt(t,2,0,0,this.torqueArm),i[8]=-r[0],i[17]=-r[1]}else{let r=gs(e.position[2],this.rB[0],this.rB[1]);Zt(t,0,-1,0,r[1]),Zt(t,1,0,-1,-r[0]),Zt(t,2,0,0,-this.torqueArm),i[8]=r[0],i[17]=r[1]}}},wo=class extends qi{rA;rB;rest;constructor(e,t,i,r,o,a,n=-1){if(super(e,t,i),this.rA=[r[0],r[1]],this.rB=[o[0],o[1]],this.stiffness[0]=a,this.rest=n,this.rest<0){let l=Vi(t.position,r[0],r[1]),c=Vi(i.position,o[0],o[1]);this.rest=Math.hypot(l[0]-c[0],l[1]-c[1])}}rows(){return 1}initialize(){return!0}delta(){let e=Vi(this.bodyA.position,this.rA[0],this.rA[1]),t=Vi(this.bodyB.position,this.rB[0],this.rB[1]);return[e[0]-t[0],e[1]-t[1]]}computeConstraint(){let e=this.delta();this.C[0]=Math.hypot(e[0],e[1])-this.rest}computeDerivatives(e){let t=this.delta(),i=t[0]*t[0]+t[1]*t[1];if(i===0)return;let r=Math.sqrt(i),o=t[0]/r,a=t[1]/r,n=(1-o*o)/r,l=(0-o*a)/r,c=(0-a*o)/r,u=(1-a*a)/r,f=e===this.bodyA,d=f?this.rA:this.rB,p=gs(e.position[2],-d[1],d[0]),m=gs(e.position[2],d[0],d[1]),h=n*p[0]+l*p[1],g=c*p[0]+u*p[1],b=o*m[0]+a*m[1],y=o*p[0]+a*p[1];f?Zt(this.J,0,o,a,y):Zt(this.J,0,-o,-a,-y);let A=f?-b-b:b+b,v=this.H;v[0]=n,v[1]=l,v[2]=h,v[3]=c,v[4]=u,v[5]=g,v[6]=h,v[7]=g,v[8]=A}},Bo=class extends qi{rows(){return 0}initialize(){return!0}computeConstraint(){}computeDerivatives(){}},Co=class extends qi{speed;constructor(e,t,i,r,o){super(e,t,i),this.speed=r,this.fmax[0]=o,this.fmin[0]=-o}rows(){return 1}initialize(){return!0}computeConstraint(){let e=this.bodyA?this.bodyA.position[2]-this.bodyA.initial[2]:0,t=this.bodyB.position[2]-this.bodyB.initial[2];this.C[0]=e-t-this.speed*this.solver.dt}computeDerivatives(e){Zt(this.J,0,0,0,e===this.bodyA?1:-1),this.H.fill(0,0,9)}};var So=()=>({dt:1/60,gravity:-10,iterations:10,beta:1e5,alpha:.99,gamma:.99,postStabilize:!0,stiffnessRescale:!1,vbd:!1,vbdStiffness:1e6,matchNearest:!1}),ko=()=>({...So(),postStabilize:!1,alpha:.95,matchNearest:!0});var jr=(s,e)=>s>e?s*2097152+e:e*2097152+s;function Qf(s,e,t){let i=0,r=e;for(;i<r;){let o=i+r>>>1;s[o]<t?i=o+1:r=o}return i}function Ln(s,e,t){let i=Qf(s,e,t);return i<e&&s[i]===t}var Po=class{cellSize=1;pairs=new Float64Array(1024);pairCount=0;configuredFor=-1;large=new Int32Array(0);isLarge=new Uint8Array(0);cellX=new Int32Array(0);cellY=new Int32Array(0);tableSize=0;bucketStart=new Int32Array(0);sorted=new Int32Array(0);configure(e,t){this.configuredFor=e;let i=Float64Array.from({length:e},(n,l)=>t[l*4+1]).sort(),r=e>0?i[e>>1]:1,o=0;for(let n=0;n<e;n++)i[n]<=4*r&&(o=Math.max(o,i[n]));this.cellSize=Math.max(2*o,.001),this.isLarge=new Uint8Array(e);let a=[];for(let n=0;n<e;n++)t[n*4+1]>o&&(this.isLarge[n]=1,a.push(n));for(this.large=Int32Array.from(a),this.cellX=new Int32Array(e),this.cellY=new Int32Array(e),this.tableSize=1;this.tableSize<2*e;)this.tableSize<<=1;this.bucketStart=new Int32Array(this.tableSize+1),this.sorted=new Int32Array(e)}hash(e,t){return(Math.imul(e,73856093)^Math.imul(t,19349663))&this.tableSize-1}findPairs(e,t,i,r,o,a){e!==this.configuredFor&&this.configure(e,i),this.pairCount=0;let{cellX:n,cellY:l,isLarge:c,bucketStart:u,sorted:f}=this,d=1/this.cellSize;u.fill(0);for(let h=0;h<e;h++)c[h]||(n[h]=Math.floor(t[h*4]*d),l[h]=Math.floor(t[h*4+1]*d),u[this.hash(n[h],l[h])+1]++);for(let h=0;h<this.tableSize;h++)u[h+1]+=u[h];let p=u.slice(0,this.tableSize);for(let h=0;h<e;h++)c[h]||(f[p[this.hash(n[h],l[h])]++]=h);let m=(h,g)=>{if(!r[h]&&!r[g])return;let b=t[h*4]-t[g*4],y=t[h*4+1]-t[g*4+1],A=i[h*4+1]+i[g*4+1];if(b*b+y*y>A*A)return;let v=jr(h,g);if(!Ln(o,a,v)){if(this.pairCount===this.pairs.length){let x=new Float64Array(this.pairs.length*2);x.set(this.pairs),this.pairs=x}this.pairs[this.pairCount++]=v}};for(let h=0;h<e;h++){if(c[h])continue;let g=n[h],b=l[h];for(let y=-1;y<=1;y++)for(let A=-1;A<=1;A++){let v=this.hash(g+A,b+y);for(let x=u[v];x<u[v+1];x++){let w=f[x];w>=h||n[w]!==g+A||l[w]!==b+y||m(h,w)}}}for(let h of this.large)for(let g=0;g<e;g++)g===h||c[g]&&g>h||m(h,g);this.pairs.subarray(0,this.pairCount).sort()}};var gt=new Float64Array(12),Sc=new Float64Array(12),Wi=new Float64Array(12);function qt(s,e,t,i,r,o,a,n){let l=e*6;s[l]=t,s[l+1]=i,s[l+2]=r,s[l+3]=o,s[l+4]=a,s[l+5]=n}function kc(s,e,t,i,r,o){let a=0,n=t*e[0]+i*e[1]-r,l=t*e[6]+i*e[7]-r;if(n<=0){for(let c=0;c<6;c++)s[a*6+c]=e[c];a++}if(l<=0){for(let c=0;c<6;c++)s[a*6+c]=e[6+c];a++}if(n*l<0){let c=n/(n-l),u=e[0]+(e[6]-e[0])*c,f=e[1]+(e[7]-e[1])*c;n>0?qt(s,a,u,f,o,e[3],0,e[5]):qt(s,a,u,f,e[8],o,e[10],0),a++}return a}function Lo(s,e,t,i,r,o,a,n){let l=-(r*a+o*n),c=-(-o*a+r*n);Math.abs(l)>Math.abs(c)?l>0?(qt(gt,0,s,-e,0,0,3,4),qt(gt,1,s,e,0,0,4,1)):(qt(gt,0,-s,e,0,0,1,2),qt(gt,1,-s,-e,0,0,2,3)):c>0?(qt(gt,0,s,e,0,0,4,1),qt(gt,1,-s,e,0,0,1,2)):(qt(gt,0,-s,-e,0,0,2,3),qt(gt,1,s,-e,0,0,3,4));for(let u=0;u<2;u++){let f=u*6,d=gt[f],p=gt[f+1];gt[f]=t+r*d-o*p,gt[f+1]=i+o*d+r*p}}function _o(s,e,t,i,r,o,a,n,l,c,u){let f=Math.cos(t),d=Math.sin(t),p=Math.cos(n),m=Math.sin(n),h=o-s,g=a-e,b=f*h+d*g,y=-d*h+f*g,A=p*h+m*g,v=-m*h+p*g,x=Math.abs(f*p+d*m),w=Math.abs(f*-m+d*p),B=Math.abs(-d*p+f*m),L=Math.abs(-d*-m+f*p),M=Math.abs(b)-i-(x*l+w*c),I=Math.abs(y)-r-(B*l+L*c);if(M>0||I>0)return 0;let E=Math.abs(A)-(x*i+B*r)-l,k=Math.abs(v)-(w*i+L*r)-c;if(E>0||k>0)return 0;let P=0,C=M,_=b>0?f:-f,z=b>0?d:-d;I>.95*C+.01*r&&(P=1,C=I,_=y>0?-d:d,z=y>0?f:-f),E>.95*C+.01*l&&(P=2,C=E,_=A>0?p:-p,z=A>0?m:-m),k>.95*C+.01*c&&(P=3,C=k,_=v>0?-m:m,z=v>0?p:-p);let R,G,X,W,U,H,Z,he,we;if(P===0){R=_,G=z,X=s*R+e*G+i,W=-d,U=f;let $=s*W+e*U;H=-$+r,Z=$+r,he=3,we=1,Lo(l,c,o,a,p,m,R,G)}else if(P===1){R=_,G=z,X=s*R+e*G+r,W=f,U=d;let $=s*W+e*U;H=-$+i,Z=$+i,he=2,we=4,Lo(l,c,o,a,p,m,R,G)}else if(P===2){R=-_,G=-z,X=o*R+a*G+l,W=-m,U=p;let $=o*W+a*U;H=-$+c,Z=$+c,he=3,we=1,Lo(i,r,s,e,f,d,R,G)}else{R=-_,G=-z,X=o*R+a*G+c,W=p,U=m;let $=o*W+a*U;H=-$+l,Z=$+l,he=2,we=4,Lo(i,r,s,e,f,d,R,G)}if(kc(Sc,gt,-W,-U,H,he)<2||kc(Wi,Sc,W,U,Z,we)<2)return 0;let Oe=0;for(let $=0;$<2;$++){let Je=$*6,Xe=Wi[Je],Be=Wi[Je+1],at=R*Xe+G*Be-X;if(at>0)continue;let ri=Xe-R*at,Ye=Be-G*at,nt=Wi[Je+2],Qe=Wi[Je+3],lt=Wi[Je+4],wt=Wi[Je+5],Ki,Zi,er,tr;P>=2?([nt,Qe,lt,wt]=[lt,wt,nt,Qe],Ki=Xe-s,Zi=Be-e,er=ri-o,tr=Ye-a):(Ki=ri-s,Zi=Ye-e,er=Xe-o,tr=Be-a);let Wt=Oe*7;u[Wt+0]=nt&255|(Qe&255)<<8|(lt&255)<<16|(wt&255)<<24,u[Wt+1]=f*Ki+d*Zi,u[Wt+1+1]=-d*Ki+f*Zi,u[Wt+3]=p*er+m*tr,u[Wt+3+1]=-m*er+p*tr,u[Wt+5]=-_,u[Wt+5+1]=-z,Oe++}return Oe}var Pc=s=>31-Math.clz32(s&-s);function Kf(s){let e=s+2654435769;return e^=e>>>16,e=Math.imul(e,2146121005),e^=e>>>15,e=Math.imul(e,2221713035),e^=e>>>16,e>>>0}var _n=(s,e,t,i)=>s>t||s===t&&e>i,Eo=class{colors=new Int32Array(0);colorStart=new Int32Array(65);colorBodies=new Int32Array(0);next=new Int32Array(0);pending=new Uint8Array(0);prio=new Uint32Array(0);resize(e){if(this.colors.length===e)return;let t=new Int32Array(e).fill(-1);t.set(this.colors.subarray(0,Math.min(e,this.colors.length))),this.colors=t,this.next=new Int32Array(e),this.pending=new Uint8Array(e),this.colorBodies=new Int32Array(e),this.prio=Uint32Array.from({length:e},(i,r)=>Kf(r))}run(e,t,i,r,o,a){this.resize(e);let{colors:n,next:l,pending:c,prio:u}=this,f=(v,x)=>{let w=o[v*4+1],B=w===x?o[v*4+2]:w;return B>=0&&t[B]?B:-1},d=(v,x)=>{let w=0,B=0;for(let L=i[v];L<i[v+1];L++){let M=f(r[L],v);if(M<0||x&&c[M])continue;let I=n[M];I<0||(I<32?w|=1<<I:B|=1<<I-32)}return~w!==0?Pc(~w):~B!==0?32+Pc(~B):63};for(let v=0;v<e;v++){if(l[v]=n[v],!t[v]||n[v]<0)continue;let x=!0;for(let w=i[v];w<i[v+1]&&x;w++){let B=f(r[w],v);B>=0&&!_n(u[v],v,u[B],B)&&(x=!1)}x&&(l[v]=Math.min(n[v],d(v,!1)))}n.set(l);let p=()=>{let v=0;for(let x=0;x<e;x++)if(c[x]=0,!!t[x]){if(n[x]<0)c[x]=1;else for(let w=i[x];w<i[x+1];w++){let B=f(r[w],x);if(B>=0&&n[B]===n[x]&&_n(u[B],B,u[x],x)){c[x]=1;break}}v+=c[x]}return v},m=p(),h=0;for(;m>0&&h<a;){h++;for(let v=0;v<e;v++){if(l[v]=-2,!c[v])continue;let x=!0;for(let w=i[v];w<i[v+1]&&x;w++){let B=f(r[w],v);B>=0&&c[B]&&!_n(u[v],v,u[B],B)&&(x=!1)}x&&(l[v]=d(v,!0))}for(let v=0;v<e;v++)l[v]!==-2&&(n[v]=l[v],c[v]=0,m--)}let g=0;if(m>0){for(let v=0;v<e;v++)c[v]&&n[v]<0&&(n[v]=0);g=p()}let b=this.colorStart;b.fill(0);let y=0;for(let v=0;v<e;v++)t[v]&&(b[n[v]+1]++,y=Math.max(y,n[v]+1));for(let v=0;v<64;v++)b[v+1]+=b[v];let A=b.slice(0,64);for(let v=0;v<e;v++)t[v]&&(this.colorBodies[A[n[v]]++]=v);return{numColors:y,conflicts:g,rounds:h}}};var Lc=0,Bi=1,_c=2,Ro=3,bs=4,Ec=[0,3,1,1,2],Mn=.05,j=4,O=32,se=0,te=3,Q=6,_e=9,Ae=12,Pt=15,fe=18,N=21,Y=23,re=25,be=26,Ue=27,Hi=28,Dr=class{params=So();options;bodyCount=0;pose;initial;inertial;velocity;prevVelocity;shape;props;dynamic=new Uint8Array(0);jointCount=0;contactCount=0;info=new Int32Array(0);data;handles=[];prevCount=0;prevKeys=new Float64Array(0);prevInfo=new Int32Array(0);prevData=new Float64Array(0);ignorePairs=[];noCollide=new Float64Array(0);noCollideCount=0;noCollideDirty=!0;adjStart=new Int32Array(1);adjList=new Int32Array(0);broadphase=new Po;coloring=new Eo;numColors=0;colorConflicts=0;colorRounds=0;profiling=!1;profile={};phaseStart=0;contactOut=new Float64Array(14);dxBuf=new Float64Array(0);constructor(e={}){this.options={precision:"f32",order:"colored",colorRounds:32,...e},this.pose=this.real(0),this.initial=this.real(0),this.inertial=this.real(0),this.velocity=this.real(0),this.prevVelocity=this.real(0),this.shape=this.real(0),this.props=this.real(0),this.data=this.real(0)}real(e){return this.options.precision==="f32"?new Float32Array(e):new Float64Array(e)}grow(e,t){if(e.length>=t)return e;let i=new e.constructor(Math.max(t,e.length*2,16));return i.set(e),i}clear(){this.bodyCount=0,this.jointCount=0,this.contactCount=0,this.prevCount=0,this.handles=[],this.ignorePairs=[],this.noCollideDirty=!0,this.coloring.resize(0)}addBody(e,t,i,r,o=[0,0,0]){let a=this.bodyCount++,n=this.bodyCount*4;this.pose=this.grow(this.pose,n),this.initial=this.grow(this.initial,n),this.inertial=this.grow(this.inertial,n),this.velocity=this.grow(this.velocity,n),this.prevVelocity=this.grow(this.prevVelocity,n),this.shape=this.grow(this.shape,n),this.props=this.grow(this.props,n),this.dynamic=this.grow(this.dynamic,this.bodyCount);let l=e[0]*e[1]*t;return this.pose.set([r[0],r[1],r[2]??0,0],a*4),this.velocity.set([o[0],o[1],o[2]??0,0],a*4),this.prevVelocity.set(this.velocity.subarray(a*4,a*4+4),a*4),this.shape.set([e[0],e[1],l,l*(e[0]*e[0]+e[1]*e[1])/12],a*4),this.props.set([i,Math.hypot(e[0]*.5,e[1]*.5),0,0],a*4),this.dynamic[a]=l>0?1:0,a}allocConstraint(){let e=this.jointCount++,t=this.jointCount+this.contactCount;this.info=this.grow(this.info,t*j),this.data=this.grow(this.data,t*O),this.contactCount>0&&(this.info.copyWithin((e+1)*j,e*j,(t-1)*j),this.data.copyWithin((e+1)*O,e*O,(t-1)*O)),this.data.fill(0,e*O,e*O+O);for(let i=0;i<3;i++)this.data[e*O+Q+i]=1/0,this.data[e*O+_e+i]=-1/0,this.data[e*O+Ae+i]=1/0,this.data[e*O+Pt+i]=1/0;return this.handles[e]=null,this.noCollideDirty=!0,e}setInfo(e,t,i,r){this.info.set([t,i,r,0],e*j)}addJoint(e,t,i,r,o=[1/0,1/0,1/0],a=1/0){let n=this.allocConstraint();this.setInfo(n,Bi,e,t);let l=this.data,c=n*O;l.set(o,c+Q),l[c+Ae+2]=a,l[c+_e+2]=-a,l[c+Pt+2]=a,l.set(i,c+N),l.set(r,c+Y),l[c+re]=(e>=0?this.pose[e*4+2]:0)-this.pose[t*4+2];let u=(e>=0?this.shape[e*4]:0)+this.shape[t*4],f=(e>=0?this.shape[e*4+1]:0)+this.shape[t*4+1];l[c+be]=u*u+f*f;let d={slot:n,alive:!0};return this.handles[n]=d,d}setJointWorldAnchor(e,t,i){e.alive&&(this.data[e.slot*O+N]=t,this.data[e.slot*O+N+1]=i)}removeJoint(e){e.alive&&(this.disable(e.slot),e.alive=!1)}addSpring(e,t,i,r,o,a){let n=this.allocConstraint();this.setInfo(n,_c,e,t);let l=n*O;this.data[l+Q]=o,this.data.set(i,l+N),this.data.set(r,l+Y),this.data[l+re]=a}addMotor(e,t,i,r){let o=this.allocConstraint();this.setInfo(o,Ro,e,t);let a=o*O;this.data[a+Ae]=r,this.data[a+_e]=-r,this.data[a+re]=i}ignoredPairs(){return this.ignorePairs}addIgnoreCollision(e,t){this.ignorePairs.push(jr(e,t)),this.noCollideDirty=!0}loadFromReference(e){this.clear();let t=Object.keys(So());Object.assign(this.params,Object.fromEntries(t.map(r=>[r,e[r]])));let i=new Map(e.bodies.map((r,o)=>[r,o]));for(let r of e.bodies){let o=this.addBody(r.size,0,r.friction,r.position,r.velocity);this.shape[o*4+2]=r.mass,this.shape[o*4+3]=r.moment,this.dynamic[o]=r.mass>0?1:0}for(let r of e.forces){let o=r.bodyA?i.get(r.bodyA):-1,a=i.get(r.bodyB);if(r instanceof Ao){let n=this.addJoint(o,a,r.rA,r.rB,[r.stiffness[0],r.stiffness[1],r.stiffness[2]],r.fracture[2]);this.data[n.slot*O+re]=r.restAngle,this.data[n.slot*O+be]=r.torqueArm}else r instanceof wo?this.addSpring(o,a,r.rA,r.rB,r.stiffness[0],r.rest):r instanceof Co?this.addMotor(o,a,r.speed,r.fmax[0]):r instanceof Bo&&this.addIgnoreCollision(o,a)}}step(){let e=this.params,t=e.postStabilize&&!e.vbd,i=e.vbd?0:e.alpha;this.phaseStart=this.profiling?performance.now():0,this.saveContacts(),this.findPairs(),this.mark("broadphase"),this.initJoints(),this.narrowphase(),this.mark("narrowphase"),this.warmStartConstraints(t,i),this.buildAdjacency(),this.mark("adjacency"),this.colorBodies(),this.mark("coloring"),this.warmStartBodies();let r=e.iterations+(t?1:0);for(let o=0;o<r;o++){let a=t?o<e.iterations?1:0:i;this.primal(a),this.mark("primal"),o<e.iterations&&this.dual(a),o===e.iterations-1&&this.updateVelocities(),this.mark("dual")}t&&this.refreshStick()}mark(e){if(!this.profiling)return;let t=performance.now();this.profile[e]=(this.profile[e]??0)+t-this.phaseStart,this.phaseStart=t}resetProfile(){for(let e of Object.keys(this.profile))delete this.profile[e]}saveContacts(){let e=this.contactCount,t=this.jointCount;this.prevKeys.length<e&&(this.prevKeys=new Float64Array(e*2),this.prevInfo=new Int32Array(e*2*j),this.prevData=new Float64Array(e*2*O));for(let i=0;i<e;i++){let r=t+i;this.prevKeys[i]=jr(this.info[r*j+1],this.info[r*j+2])}this.prevInfo.set(this.info.subarray(t*j,(t+e)*j)),this.prevData.set(this.data.subarray(t*O,(t+e)*O)),this.prevCount=e,this.contactCount=0}findPairs(){if(this.noCollideDirty){let e=[...this.ignorePairs];for(let t=0;t<this.jointCount;t++){let i=this.info[t*j+1],r=this.info[t*j+2];this.info[t*j]!==Lc&&i>=0&&e.push(jr(i,r))}this.noCollide=Float64Array.from(e).sort(),this.noCollideCount=e.length,this.noCollideDirty=!1}this.broadphase.findPairs(this.bodyCount,this.pose,this.props,this.dynamic,this.noCollide,this.noCollideCount)}initJoints(){let{info:e,data:t,pose:i}=this,r=0;for(let o=0;o<this.jointCount;o++){let a=o*O;if(e[o*j]===Bi){if(t[a+Q]===0&&t[a+Q+1]===0&&t[a+Q+2]===0){let u=this.handles[o];u&&(u.alive=!1);continue}let l=e[o*j+1],c=e[o*j+2];this.jointC(l,c,a,i,t,a+fe)}r!==o&&(e.copyWithin(r*j,o*j,(o+1)*j),t.copyWithin(r*O,a,a+O),this.handles[r]=this.handles[o],this.handles[r]&&(this.handles[r].slot=r)),r++}if(r!==this.jointCount){for(let o=r;o<this.jointCount;o++)this.handles[o]=null;this.jointCount=r,this.noCollideDirty=!0}}jointC(e,t,i,r,o,a,n=o){let l,c,u;if(e>=0){let h=Math.cos(r[e*4+2]),g=Math.sin(r[e*4+2]),b=o[i+N],y=o[i+N+1];l=h*b-g*y+r[e*4],c=g*b+h*y+r[e*4+1],u=r[e*4+2]}else l=o[i+N],c=o[i+N+1],u=0;let f=Math.cos(r[t*4+2]),d=Math.sin(r[t*4+2]),p=o[i+Y],m=o[i+Y+1];n[a]=l-(f*p-d*m+r[t*4]),n[a+1]=c-(d*p+f*m+r[t*4+1]),n[a+2]=(u-r[t*4+2]-o[i+re])*o[i+be]}narrowphase(){let{pose:e,shape:t,props:i}=this,r=this.broadphase.pairs,o=this.contactOut;for(let a=0;a<this.broadphase.pairCount;a++){let n=r[a],l=Math.floor(n/2097152),c=n-l*2097152,u=_o(e[l*4],e[l*4+1],e[l*4+2],t[l*4]*.5,t[l*4+1]*.5,e[c*4],e[c*4+1],e[c*4+2],t[c*4]*.5,t[c*4+1]*.5,o);if(u===0)continue;let f=0,d=this.prevCount;for(;f<d;){let h=f+d>>>1;this.prevKeys[h]<n?f=h+1:d=h}let p=f,m=Math.sqrt(i[l*4]*i[c*4]);for(let h=0;h<u;h++){let g=this.jointCount+this.contactCount++;this.info=this.grow(this.info,(g+1)*j),this.data=this.grow(this.data,(g+1)*O);let b=this.data,y=g*O,A=h*7,v=o[A+0];this.info.set([bs,l,c,v],g*j),b.fill(0,y,y+O),b[y+Q]=b[y+Q+1]=1/0,b[y+_e]=-1/0,b[y+Ae]=0,b[y+Pt]=b[y+Pt+1]=1/0,b[y+N]=o[A+1],b[y+N+1]=o[A+1+1],b[y+Y]=o[A+3],b[y+Y+1]=o[A+3+1],b[y+re]=m,b[y+be]=o[A+5],b[y+Ue]=o[A+5+1];let x=-1;for(let C=p;C<this.prevCount&&this.prevKeys[C]===n;C++)this.prevInfo[C*j+3]===v&&(x=C);if(x<0&&this.params.matchNearest){let C=Mn*Math.min(t[l*4],t[l*4+1],t[c*4],t[c*4+1]);for(let _=p;_<this.prevCount&&this.prevKeys[_]===n;_++){let z=Math.hypot(this.prevData[_*O+N]-b[y+N],this.prevData[_*O+N+1]-b[y+N+1]);z<=C&&(C=z,x=_)}}if(x>=0){let C=x*O;b[y+se]=this.prevData[C+se],b[y+se+1]=this.prevData[C+se+1],b[y+te]=this.prevData[C+te],b[y+te+1]=this.prevData[C+te+1],this.prevData[C+Hi]&&(b[y+N]=this.prevData[C+N],b[y+N+1]=this.prevData[C+N+1],b[y+Y]=this.prevData[C+Y],b[y+Y+1]=this.prevData[C+Y+1])}let[w,B]=wi(e[l*4+2],b[y+N],b[y+N+1]),[L,M]=wi(e[c*4+2],b[y+Y],b[y+Y+1]),I=b[y+be],E=b[y+Ue],k=e[l*4]+w-e[c*4]-L,P=e[l*4+1]+B-e[c*4+1]-M;b[y+fe]=I*k+E*P+5e-4,b[y+fe+1]=E*k-I*P}}}warmStartConstraints(e,t){let i=this.params,r=this.data,o=this.jointCount+this.contactCount;for(let a=0;a<o;a++){let n=Ec[this.info[a*j]],l=a*O;for(let c=0;c<n;c++){if(i.vbd){r[l+se+c]=Or(r[l+Q+c],i.vbdStiffness);continue}e||(r[l+te+c]=r[l+te+c]*t*i.gamma),r[l+se+c]=Or(Tr(r[l+se+c]*i.gamma,1,1e9),r[l+Q+c])}}}prepareTopology(){this.buildAdjacency(),this.colorBodies()}buildAdjacency(){let e=this.bodyCount,t=this.jointCount+this.contactCount;this.adjStart=this.grow(this.adjStart,e+1),this.adjList=this.grow(this.adjList,t*2);let i=this.adjStart;i.fill(0,0,e+1);for(let o=0;o<t;o++)for(let a=1;a<=2;a++){let n=this.info[o*j+a];n>=0&&this.dynamic[n]&&i[n+1]++}for(let o=0;o<e;o++)i[o+1]+=i[o];let r=i.slice(0,e);for(let o=0;o<t;o++)for(let a=1;a<=2;a++){let n=this.info[o*j+a];n>=0&&this.dynamic[n]&&(this.adjList[r[n]++]=o)}}colorBodies(){if(this.options.order!=="colored")return;let e=this.coloring.run(this.bodyCount,this.dynamic,this.adjStart,this.adjList,this.info,this.options.colorRounds);this.numColors=e.numColors,this.colorConflicts=e.conflicts,this.colorRounds=e.rounds}warmStartBodies(){let{dt:e,gravity:t}=this.params,{pose:i,velocity:r,initial:o,inertial:a,prevVelocity:n}=this;for(let l=0;l<this.bodyCount;l++){let c=l*4;r[c+2]=Tr(r[c+2],-50,50),a[c]=i[c]+r[c]*e,a[c+1]=i[c+1]+r[c+1]*e,a[c+2]=i[c+2]+r[c+2]*e,this.dynamic[l]&&(a[c+1]+=t*e*e);let u=(r[c+1]-n[c+1])/e*Cc(t),f=Tr(u/Math.abs(t),0,1);Number.isFinite(f)||(f=0),o[c]=i[c],o[c+1]=i[c+1],o[c+2]=i[c+2],i[c]=i[c]+r[c]*e,i[c+1]=i[c+1]+r[c+1]*e+t*f*e*e,i[c+2]=i[c+2]+r[c+2]*e}}eC=new Float64Array(3);eMin=new Float64Array(3);eMax=new Float64Array(3);eJ=new Float64Array(9);eG=new Float64Array(9);evalConstraint(e,t,i){let{info:r,data:o,pose:a,initial:n}=this,l=r[e*j],c=r[e*j+1],u=r[e*j+2],f=e*O,{eC:d,eMin:p,eMax:m,eJ:h,eG:g}=this,b=Ec[l];for(let A=0;A<b;A++)p[A]=o[f+_e+A],m[A]=o[f+Ae+A];let y=i===c;if(g.fill(0),l===Bi){this.jointC(c,u,f,a,o,0,d);for(let A=0;A<3;A++)o[f+Q+A]===1/0&&(d[A]-=o[f+fe+A]*t);if(i>=0){let A=a[i*4+2],[v,x]=wi(A,o[f+(y?N:Y)],o[f+(y?N:Y)+1]),w=y?1:-1;h[0]=w,h[1]=0,h[2]=-w*x,h[3]=0,h[4]=w,h[5]=w*v,h[6]=0,h[7]=0,h[8]=w*o[f+be],g[2]=Math.abs(v),g[5]=Math.abs(x)}}else if(l===_c){let[A,v]=Mc(a,c,o[f+N],o[f+N+1]),[x,w]=Mc(a,u,o[f+Y],o[f+Y+1]),B=A-x,L=v-w,M=B*B+L*L,I=Math.sqrt(M);if(d[0]=I-o[f+re],i>=0&&M!==0){let E=B/I,k=L/I,P=(1-E*E)/I,C=-E*k/I,_=(1-k*k)/I,z=a[i*4+2],R=y?N:Y,[G,X]=wi(z,-o[f+R+1],o[f+R]),[W,U]=wi(z,o[f+R],o[f+R+1]),H=P*G+C*X,Z=C*G+_*X,he=E*W+k*U,we=E*G+k*X,Oe=y?1:-1;h[0]=Oe*E,h[1]=Oe*k,h[2]=Oe*we;let $=y?-he-he:he+he;g[0]=Math.hypot(P,C,H),g[1]=Math.hypot(C,_,Z),g[2]=Math.hypot(H,Z,$)}else i>=0&&h.fill(0,0,3)}else if(l===Ro){let A=c>=0?a[c*4+2]-n[c*4+2]:0,v=a[u*4+2]-n[u*4+2];d[0]=A-v-o[f+re]*this.params.dt,i>=0&&(h[0]=0,h[1]=0,h[2]=y?1:-1)}else if(l===bs){let A=o[f+be],v=o[f+Ue],x=v,w=-A,[B,L]=wi(n[c*4+2],o[f+N],o[f+N+1]),[M,I]=wi(n[u*4+2],o[f+Y],o[f+Y+1]),E=B*v-L*A,k=-(M*v-I*A),P=B*w-L*x,C=-(M*w-I*x),_=a[c*4]-n[c*4],z=a[c*4+1]-n[c*4+1],R=a[c*4+2]-n[c*4+2],G=a[u*4]-n[u*4],X=a[u*4+1]-n[u*4+1],W=a[u*4+2]-n[u*4+2];d[0]=o[f+fe]*(1-t)+A*_+v*z+E*R+-A*G+-v*X+k*W,d[1]=o[f+fe+1]*(1-t)+x*_+w*z+P*R+-x*G+-w*X+C*W;let U=Math.abs(o[f+te])*o[f+re];m[1]=U,p[1]=-U,i>=0&&(y?(h[0]=A,h[1]=v,h[2]=E,h[3]=x,h[4]=w,h[5]=P):(h[0]=-A,h[1]=-v,h[2]=k,h[3]=-x,h[4]=-w,h[5]=C))}return b}solveBody(e,t){let i=this.params,{shape:r,pose:o,inertial:a,data:n}=this,l=i.dt*i.dt,c=r[e*4+2]/l,u=r[e*4+3]/l,f=c,d=0,p=c,m=0,h=0,g=u,b=c*(o[e*4]-a[e*4]),y=c*(o[e*4+1]-a[e*4+1]),A=u*(o[e*4+2]-a[e*4+2]),{eC:v,eMin:x,eMax:w,eJ:B,eG:L}=this,M=this.adjStart,I=this.adjList;for(let H=M[e+1]-1;H>=M[e];H--){let Z=I[H],he=this.evalConstraint(Z,t,e),we=Z*O,Oe=!i.vbd;for(let $=0;$<he;$++){let Je=n[we+Q+$],Xe=Oe&&Je===1/0?n[we+te+$]:0,Be=n[we+se+$],at=v[$],ri=Be*at+Xe,Ye=Tr(ri,x[$],w[$]),nt=Math.abs(Ye);i.stiffnessRescale&&at!==0&&(ri<x[$]?Be=Math.abs((x[$]-Xe)/at):ri>w[$]&&(Be=Math.abs((w[$]-Xe)/at)));let Qe=B[$*3],lt=B[$*3+1],wt=B[$*3+2];b+=Qe*Ye,y+=lt*Ye,A+=wt*Ye,f+=Qe*Qe*Be+L[$*3]*nt,d+=lt*Qe*Be,p+=lt*lt*Be+L[$*3+1]*nt,m+=wt*Qe*Be,h+=wt*lt*Be,g+=wt*wt*Be+L[$*3+2]*nt}}let E=f,k=d/f,P=m/f,C=p-k*k*E,_=(h-k*P*E)/C,z=g-(P*P*E+_*_*C),R=y-k*b,X=(A-P*b-_*R)/z,W=R/C-_*X,U=b/E-k*W-P*X;this.dxBuf[e*3]=U,this.dxBuf[e*3+1]=W,this.dxBuf[e*3+2]=X}applyDx(e){this.pose[e*4]-=this.dxBuf[e*3],this.pose[e*4+1]-=this.dxBuf[e*3+1],this.pose[e*4+2]-=this.dxBuf[e*3+2]}primal(e){if(this.dxBuf.length<this.bodyCount*3&&(this.dxBuf=new Float64Array(this.bodyCount*3)),this.options.order==="sequential"){for(let r=this.bodyCount-1;r>=0;r--)this.dynamic[r]&&(this.solveBody(r,e),this.applyDx(r));return}let{colorStart:t,colorBodies:i}=this.coloring;for(let r=0;r<this.numColors;r++){for(let o=t[r];o<t[r+1];o++)this.solveBody(i[o],e);for(let o=t[r];o<t[r+1];o++)this.applyDx(i[o])}}dual(e){let t=this.params,i=this.data,{eC:r,eMin:o,eMax:a}=this,n=this.jointCount+this.contactCount;for(let l=0;l<n;l++){let c=this.info[l*j];if(c===Lc)continue;let u=this.evalConstraint(l,e,-1),f=l*O;c===bs&&(i[f+Hi]=Math.abs(i[f+te+1])<a[1]&&Math.abs(i[f+fe+1])<.01?1:0);for(let d=0;d<u;d++){let p=i[f+Q+d],m=!t.vbd&&p===1/0?i[f+te+d]:0,h=Tr(i[f+se+d]*r[d]+m,o[d],a[d]);i[f+te+d]=h,Math.abs(h)>=i[f+Pt+d]&&this.disable(l),!t.vbd&&h>o[d]&&h<a[d]&&(i[f+se+d]=Or(i[f+se+d]+t.beta*Math.abs(r[d]),Or(1e9,i[f+Q+d])))}}}refreshStick(){let e=this.data;for(let t=0;t<this.contactCount;t++){let i=(this.jointCount+t)*O,r=Math.abs(e[i+te])*e[i+re];e[i+Hi]=Math.abs(e[i+te+1])<r&&Math.abs(e[i+fe+1])<.01?1:0}}disable(e){let t=e*O;this.data.fill(0,t+se,t+se+3),this.data.fill(0,t+te,t+te+3),this.data.fill(0,t+Q,t+Q+3)}updateVelocities(){let{dt:e}=this.params,{pose:t,initial:i,velocity:r,prevVelocity:o}=this;for(let a=0;a<this.bodyCount;a++){let n=a*4;o[n]=r[n],o[n+1]=r[n+1],o[n+2]=r[n+2],this.dynamic[a]&&(r[n]=(t[n]-i[n])/e,r[n+1]=(t[n+1]-i[n+1])/e,r[n+2]=(t[n+2]-i[n+2])/e)}}pick(e,t){for(let i=this.bodyCount-1;i>=0;i--){let[r,o]=wi(-this.pose[i*4+2],e-this.pose[i*4],t-this.pose[i*4+1]);if(Math.abs(r)<=this.shape[i*4]*.5&&Math.abs(o)<=this.shape[i*4+1]*.5)return{body:i,local:[r,o]}}return null}kineticEnergy(){let e=0;for(let t=0;t<this.bodyCount;t++){if(!this.dynamic[t])continue;let i=t*4,r=this.velocity;e+=.5*this.shape[i+2]*(r[i]*r[i]+r[i+1]*r[i+1])+.5*this.shape[i+3]*r[i+2]*r[i+2]}return e}maxJointError(){let e=0,t=new Float64Array(3);for(let i=0;i<this.jointCount;i++){if(this.info[i*j]!==Bi)continue;let r=i*O;this.jointC(this.info[i*j+1],this.info[i*j+2],r,this.pose,this.data,0,t);for(let o=0;o<2;o++)this.data[r+Q+o]===1/0&&(e=Math.max(e,Math.abs(t[o])))}return e}isContactPairIgnored(e,t){return Ln(this.noCollide,this.noCollideCount,jr(e,t))}};function wi(s,e,t){let i=Math.cos(s),r=Math.sin(s);return[i*e-r*t,r*e+i*t]}function Mc(s,e,t,i){let r=Math.cos(s[e*4+2]),o=Math.sin(s[e*4+2]);return[r*t-o*i+s[e*4],o*t+r*i+s[e*4+1]]}var ys=`
${Ut}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> bodies: array<Body>;
// Grid: bucketStart[tableMask + 2] | cursor[tableMask + 1] | sorted[bodies] | cell[2 * bodies]
@group(0) @binding(2) var<storage, read_write> grid: array<atomic<u32>>;
@group(0) @binding(3) var<storage, read_write> pairs: array<vec2u>;
@group(0) @binding(4) var<storage, read_write> counters: array<atomic<u32>>;
// Static: large body indices[largeCount] | noCollide (hi, lo, joint) triples, sorted by (hi, lo)
@group(0) @binding(5) var<storage, read> statics: array<u32>;
@group(0) @binding(6) var<storage, read> joints: array<Joint>;

// --- Frame start --------------------------------------------------------------------------

@compute @workgroup_size(1)
fn beginFrame() {
  // Last step's contacts become "previous" (they sit in the other ping-pong buffer)
  let prev = min(atomicLoad(&counters[C_CONTACTS]), params.contactCapacity);
  atomicStore(&counters[C_PREV_CONTACTS], prev);
  atomicStore(&counters[C_CONTACTS], 0u);
  atomicStore(&counters[C_PAIRS], 0u);
  atomicStore(&counters[C_OVERFLOW], 0u);
  atomicStore(&counters[C_CLASHES], 0u);
  atomicStore(&counters[C_NUM_COLORS], 0u);
}

// --- Broadphase ---------------------------------------------------------------------------

fn radius(i: u32) -> f32 {
  return 0.5 * length(bodies[i].shape.xy);
}

fn isLarge(i: u32) -> bool {
  return radius(i) > params.maxSmallRadius;
}

fn cellOf(i: u32) -> vec2i {
  return vec2i(floor(bodies[i].pose.xy / params.cellSize));
}

fn cellHash(c: vec2i) -> u32 {
  return ((u32(c.x) * 73856093u) ^ (u32(c.y) * 19349663u)) & params.tableMask;
}

@compute @workgroup_size(64)
fn gridCount(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount || isLarge(i)) { return; }
  let c = cellOf(i);
  atomicStore(&grid[params.gridCellOffset + 2u * i], bitcast<u32>(c.x));
  atomicStore(&grid[params.gridCellOffset + 2u * i + 1u], bitcast<u32>(c.y));
  atomicAdd(&grid[cellHash(c)], 1u);
}

@compute @workgroup_size(64)
fn gridScatter(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount || isLarge(i)) { return; }
  let h = cellHash(cellOf(i));
  let slot = atomicLoad(&grid[h]) + atomicAdd(&grid[params.gridCursorOffset + h], 1u);
  atomicStore(&grid[params.gridSortedOffset + slot], i);
}

/** Binary search of the (hi, lo) no-collide list; false if the pair's joint has broken. */
fn ignored(hi: u32, lo: u32) -> bool {
  let base = params.largeCount;
  var first = 0u;
  var count = params.noCollideCount;
  while (count > 0u) {
    let step = count / 2u;
    let mid = first + step;
    let mh = statics[base + 3u * mid];
    let ml = statics[base + 3u * mid + 1u];
    if (mh < hi || (mh == hi && ml < lo)) {
      first = mid + 1u;
      count -= step + 1u;
    } else {
      count = step;
    }
  }
  // Several constraints can connect the same pair; any live one (or an IgnoreCollision)
  // keeps the pair from colliding.
  for (var k = first; k < params.noCollideCount; k++) {
    if (statics[base + 3u * k] != hi || statics[base + 3u * k + 1u] != lo) { break; }
    let j = statics[base + 3u * k + 2u];
    if (j == 0xffffffffu) { return true; }
    let s = joints[j].stiff;
    if (s.x != 0.0 || s.y != 0.0 || s.z != 0.0) { return true; }
  }
  return false;
}

fn testPair(i: u32, j: u32) {
  let a = max(i, j);
  let b = min(i, j);
  if (bodies[a].shape.z <= 0.0 && bodies[b].shape.z <= 0.0) { return; }
  let d = bodies[a].pose.xy - bodies[b].pose.xy;
  let r = radius(a) + radius(b);
  if (dot(d, d) > r * r) { return; }
  if (ignored(a, b)) { return; }
  let slot = atomicAdd(&counters[C_PAIRS], 1u);
  if (slot >= params.pairCapacity) {
    atomicOr(&counters[C_OVERFLOW], 1u);
    return;
  }
  pairs[slot] = vec2u(a, b);
}

@compute @workgroup_size(64)
fn findPairs(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount) { return; }
  let small = !isLarge(i);
  if (small) {
    // Every overlapping small pair is in the same or an adjacent cell; emit from the higher index
    let c = cellOf(i);
    for (var oy = -1; oy <= 1; oy++) {
      for (var ox = -1; ox <= 1; ox++) {
        let cell = c + vec2i(ox, oy);
        let h = cellHash(cell);
        let end = atomicLoad(&grid[h + 1u]);
        for (var k = atomicLoad(&grid[h]); k < end; k++) {
          let j = atomicLoad(&grid[params.gridSortedOffset + k]);
          if (j >= i) { continue; }
          // Different cells can share a bucket; only accept bodies really in this cell
          let cj = vec2i(bitcast<i32>(atomicLoad(&grid[params.gridCellOffset + 2u * j])), bitcast<i32>(atomicLoad(&grid[params.gridCellOffset + 2u * j + 1u])));
          if (any(cj != cell)) { continue; }
          testPair(i, j);
        }
      }
    }
  }
  // Large bodies against everything (large-large pairs once, from the larger index)
  for (var k = 0u; k < params.largeCount; k++) {
    let l = statics[k];
    if (l == i || (!small && l < i)) { continue; }
    testPair(l, i);
  }
}
`,vs=`
${Ut}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> bodies: array<Body>;
@group(0) @binding(2) var<storage, read> pairs: array<vec2u>;
@group(0) @binding(3) var<storage, read_write> contacts: array<Contact>;
@group(0) @binding(4) var<storage, read> prevContacts: array<Contact>;
@group(0) @binding(5) var<storage, read_write> table: array<atomic<u32>>;
@group(0) @binding(6) var<storage, read_write> counters: array<atomic<u32>>;

fn contactHash(a: u32, b: u32, feature: u32) -> u32 {
  return hash32((a * 0x9e3779b1u) ^ hash32(b ^ hash32(feature)));
}

/** Feature key used to look up a per-pair entry (real features are bytes <= 4). */
const PAIR_ENTRY = 0xffffffffu;

/** Slot values: contact index + 1, with PAIR_BIT set on per-pair entries. */
const PAIR_BIT = 0x80000000u;

// Slots are claimed by atomicExchange rather than compare-exchange (Safari's Metal backend
// fails to compile atomicCompareExchangeWeak, github issue 1): a taken slot's occupant is
// swapped out and carried on to the next slot, which keeps it on its own probe chain, with
// no empty slot before it for a lookup to stop at.
fn insert(a: u32, b: u32, feature: u32, first: u32) {
  var h = contactHash(a, b, feature) & params.hashMask;
  var value = first;
  for (var probe = 0u; probe <= params.hashMask; probe++) {
    value = atomicExchange(&table[h], value);
    if (value == 0u) { return; }
    h = (h + 1u) & params.hashMask;
  }
}

/**
 * Insert last step's contacts into the table (slot value = contact index + 1), plus one
 * pair-only entry per manifold for the matchNearest fallback. A pair's contacts are always
 * consecutive (narrowphase reserves them with one atomicAdd), so the entry points at the first.
 */
@compute @workgroup_size(64)
fn hashInsert(@builtin(global_invocation_id) gid: vec3u) {
  let k = gid.x;
  if (k >= atomicLoad(&counters[C_PREV_CONTACTS])) { return; }
  let ids = prevContacts[k].ids;
  insert(ids.x, ids.y, ids.z, k + 1u);
  if ((params.flags & FLAG_MATCH_NEAREST) != 0u) {
    let first = k == 0u || prevContacts[k - 1u].ids.x != ids.x || prevContacts[k - 1u].ids.y != ids.y;
    if (first) { insert(ids.x, ids.y, PAIR_ENTRY, (k + 1u) | PAIR_BIT); }
  }
}

/** Index of last step's contact with this key, or -1. */
fn hashFind(a: u32, b: u32, feature: u32) -> i32 {
  var h = contactHash(a, b, feature) & params.hashMask;
  for (var probe = 0u; probe <= params.hashMask; probe++) {
    let v = atomicLoad(&table[h]);
    if (v == 0u) { return -1; }
    // Pair entries (PAIR_BIT) match on the pair alone, contact entries on the full key
    let isPair = (v & PAIR_BIT) != 0u;
    let index = (v & ~PAIR_BIT) - 1u;
    let ids = prevContacts[index].ids;
    if (isPair == (feature == PAIR_ENTRY) && ids.x == a && ids.y == b && (isPair || ids.z == feature)) { return i32(index); }
    h = (h + 1u) & params.hashMask;
  }
  return -1;
}

// --- Narrowphase (box2d-lite clipping, see ../soa/collide.ts) -----------------------------

struct ClipV {
  p: vec2f,
  f: vec4u,  // inEdge1, outEdge1, inEdge2, outEdge2
}

struct Clip {
  v: array<ClipV, 2>,
  n: u32,
}

fn clipSegment(src: array<ClipV, 2>, n: vec2f, offset: f32, clipEdge: u32) -> Clip {
  var o: Clip;
  let d0 = dot(n, src[0].p) - offset;
  let d1 = dot(n, src[1].p) - offset;
  if (d0 <= 0.0) { o.v[o.n] = src[0]; o.n++; }
  if (d1 <= 0.0) { o.v[o.n] = src[1]; o.n++; }
  if (d0 * d1 < 0.0 && o.n < 2u) {
    var cv: ClipV;
    cv.p = src[0].p + (src[1].p - src[0].p) * (d0 / (d0 - d1));
    if (d0 > 0.0) { cv.f = vec4u(clipEdge, src[0].f.y, 0u, src[0].f.w); }
    else { cv.f = vec4u(src[1].f.x, clipEdge, src[1].f.z, 0u); }
    o.v[o.n] = cv;
    o.n++;
  }
  return o;
}

fn incidentEdge(h: vec2f, pos: vec2f, c: f32, s: f32, fnrm: vec2f) -> array<ClipV, 2> {
  // Reference face normal in the incident box's frame, flipped
  let n = -vec2f(c * fnrm.x + s * fnrm.y, -s * fnrm.x + c * fnrm.y);
  var v: array<ClipV, 2>;
  if (abs(n.x) > abs(n.y)) {
    if (n.x > 0.0) {
      v[0] = ClipV(vec2f(h.x, -h.y), vec4u(0u, 0u, 3u, 4u));
      v[1] = ClipV(vec2f(h.x, h.y), vec4u(0u, 0u, 4u, 1u));
    } else {
      v[0] = ClipV(vec2f(-h.x, h.y), vec4u(0u, 0u, 1u, 2u));
      v[1] = ClipV(vec2f(-h.x, -h.y), vec4u(0u, 0u, 2u, 3u));
    }
  } else if (n.y > 0.0) {
    v[0] = ClipV(vec2f(h.x, h.y), vec4u(0u, 0u, 4u, 1u));
    v[1] = ClipV(vec2f(-h.x, h.y), vec4u(0u, 0u, 1u, 2u));
  } else {
    v[0] = ClipV(vec2f(-h.x, -h.y), vec4u(0u, 0u, 2u, 3u));
    v[1] = ClipV(vec2f(h.x, -h.y), vec4u(0u, 0u, 3u, 4u));
  }
  for (var i = 0; i < 2; i++) {
    let p = v[i].p;
    v[i].p = pos + vec2f(c * p.x - s * p.y, s * p.x + c * p.y);
  }
  return v;
}

struct ContactOut {
  feature: u32,
  rA: vec2f,
  rB: vec2f,
  n: vec2f,  // B to A
}

struct Collision {
  count: u32,
  c: array<ContactOut, 2>,
}

fn collideBoxes(pa: vec3f, ha: vec2f, pb: vec3f, hb: vec2f) -> Collision {
  var out: Collision;
  let csA = cosSin(pa.z);
  let csB = cosSin(pb.z);
  let cA = csA.x;
  let sA = csA.y;
  let cB = csB.x;
  let sB = csB.y;
  let dp = pb.xy - pa.xy;
  let dA = vec2f(cA * dp.x + sA * dp.y, -sA * dp.x + cA * dp.y);
  let dB = vec2f(cB * dp.x + sB * dp.y, -sB * dp.x + cB * dp.y);
  let a00 = abs(cA * cB + sA * sB);
  let a01 = abs(cA * -sB + sA * cB);
  let a10 = abs(-sA * cB + cA * sB);
  let a11 = abs(-sA * -sB + cA * cB);

  let faceA = abs(dA) - ha - vec2f(a00 * hb.x + a01 * hb.y, a10 * hb.x + a11 * hb.y);
  if (faceA.x > 0.0 || faceA.y > 0.0) { return out; }
  let faceB = abs(dB) - vec2f(a00 * ha.x + a10 * ha.y, a01 * ha.x + a11 * ha.y) - hb;
  if (faceB.x > 0.0 || faceB.y > 0.0) { return out; }

  // Best separating axis, biased towards A's faces for coherence
  var axis = 0;
  var separation = faceA.x;
  var n = select(vec2f(-cA, -sA), vec2f(cA, sA), dA.x > 0.0);
  if (faceA.y > 0.95 * separation + 0.01 * ha.y) {
    axis = 1;
    separation = faceA.y;
    n = select(vec2f(sA, -cA), vec2f(-sA, cA), dA.y > 0.0);
  }
  if (faceB.x > 0.95 * separation + 0.01 * hb.x) {
    axis = 2;
    separation = faceB.x;
    n = select(vec2f(-cB, -sB), vec2f(cB, sB), dB.x > 0.0);
  }
  if (faceB.y > 0.95 * separation + 0.01 * hb.y) {
    axis = 3;
    separation = faceB.y;
    n = select(vec2f(sB, -cB), vec2f(-sB, cB), dB.y > 0.0);
  }

  var fnrm: vec2f;
  var front: f32;
  var sn: vec2f;
  var negSide: f32;
  var posSide: f32;
  var negEdge: u32;
  var posEdge: u32;
  var incident: array<ClipV, 2>;
  if (axis == 0) {
    fnrm = n;
    front = dot(pa.xy, fnrm) + ha.x;
    sn = vec2f(-sA, cA);
    let side = dot(pa.xy, sn);
    negSide = -side + ha.y;
    posSide = side + ha.y;
    negEdge = 3u;
    posEdge = 1u;
    incident = incidentEdge(hb, pb.xy, cB, sB, fnrm);
  } else if (axis == 1) {
    fnrm = n;
    front = dot(pa.xy, fnrm) + ha.y;
    sn = vec2f(cA, sA);
    let side = dot(pa.xy, sn);
    negSide = -side + ha.x;
    posSide = side + ha.x;
    negEdge = 2u;
    posEdge = 4u;
    incident = incidentEdge(hb, pb.xy, cB, sB, fnrm);
  } else if (axis == 2) {
    fnrm = -n;
    front = dot(pb.xy, fnrm) + hb.x;
    sn = vec2f(-sB, cB);
    let side = dot(pb.xy, sn);
    negSide = -side + hb.y;
    posSide = side + hb.y;
    negEdge = 3u;
    posEdge = 1u;
    incident = incidentEdge(ha, pa.xy, cA, sA, fnrm);
  } else {
    fnrm = -n;
    front = dot(pb.xy, fnrm) + hb.y;
    sn = vec2f(cB, sB);
    let side = dot(pb.xy, sn);
    negSide = -side + hb.x;
    posSide = side + hb.x;
    negEdge = 2u;
    posEdge = 4u;
    incident = incidentEdge(ha, pa.xy, cA, sA, fnrm);
  }

  let clip1 = clipSegment(incident, -sn, negSide, negEdge);
  if (clip1.n < 2u) { return out; }
  let clip2 = clipSegment(clip1.v, sn, posSide, posEdge);
  if (clip2.n < 2u) { return out; }

  for (var i = 0; i < 2; i++) {
    let v = clip2.v[i].p;
    let sep = dot(fnrm, v) - front;
    if (sep > 0.0) { continue; }
    // Slide the point onto the reference face; flip features when B is the reference
    let onRef = v - fnrm * sep;
    var f = clip2.v[i].f;
    var wa: vec2f;
    var wb: vec2f;
    if (axis >= 2) {
      f = vec4u(f.z, f.w, f.x, f.y);
      wa = v - pa.xy;
      wb = onRef - pb.xy;
    } else {
      wa = onRef - pa.xy;
      wb = v - pb.xy;
    }
    var c: ContactOut;
    c.feature = (f.x & 0xffu) | ((f.y & 0xffu) << 8u) | ((f.z & 0xffu) << 16u) | ((f.w & 0xffu) << 24u);
    c.rA = vec2f(cA * wa.x + sA * wa.y, -sA * wa.x + cA * wa.y);
    c.rB = vec2f(cB * wb.x + sB * wb.y, -sB * wb.x + cB * wb.y);
    c.n = -n;
    out.c[out.count] = c;
    out.count++;
  }
  return out;
}

@compute @workgroup_size(64)
fn narrowphase(@builtin(global_invocation_id) gid: vec3u) {
  let p = gid.x;
  if (p >= min(atomicLoad(&counters[C_PAIRS]), params.pairCapacity)) { return; }
  let a = pairs[p].x;
  let b = pairs[p].y;
  let A = bodies[a];
  let B = bodies[b];
  let col = collideBoxes(A.pose.xyz, A.shape.xy * 0.5, B.pose.xyz, B.shape.xy * 0.5);
  if (col.count == 0u) { return; }
  let base = atomicAdd(&counters[C_CONTACTS], col.count);
  let vbd = (params.flags & FLAG_VBD) != 0u;
  let postStabilize = (params.flags & FLAG_POST_STABILIZE) != 0u;

  for (var i = 0u; i < col.count; i++) {
    let k = base + i;
    if (k >= params.contactCapacity) {
      atomicOr(&counters[C_OVERFLOW], 2u);
      return;
    }
    let o = col.c[i];
    var rec: Contact;
    rec.ids = vec4u(a, b, o.feature, 0u);
    rec.anchors = vec4f(o.rA, o.rB);
    rec.misc = vec4f(sqrt(A.pose.w * B.pose.w), 0.0, 0.0, 0.0);

    // Warm start from the matching contact of last step (same pair, same feature); with
    // matchNearest, fall back to the pair's previous contact nearest in A-local anchor position
    var j = hashFind(a, b, o.feature);
    if (j < 0 && (params.flags & FLAG_MATCH_NEAREST) != 0u) {
      let first = hashFind(a, b, PAIR_ENTRY);
      if (first >= 0) {
        var best = NEAREST_FRACTION * min(min(A.shape.x, A.shape.y), min(B.shape.x, B.shape.y));
        let count = atomicLoad(&counters[C_PREV_CONTACTS]);
        for (var c = u32(first); c < min(u32(first) + 2u, count); c++) {
          let ids = prevContacts[c].ids;
          if (ids.x != a || ids.y != b) { break; }
          let dist = length(prevContacts[c].anchors.xy - o.rA);
          if (dist <= best) {
            best = dist;
            j = i32(c);
          }
        }
      }
    }
    if (j >= 0) {
      let prev = prevContacts[j];
      rec.pl = prev.pl;
      // Static friction last step: keep the old anchors
      if (prev.ids.w != 0u) { rec.anchors = prev.anchors; }
    }

    // C(x-) in the contact basis (normal, tangent)
    let rAW = rot(A.pose.z, rec.anchors.xy);
    let rBW = rot(B.pose.z, rec.anchors.zw);
    let d = A.pose.xy + rAW - B.pose.xy - rBW;
    rec.geo = vec4f(dot(o.n, d) + COLLISION_MARGIN, o.n.y * d.x - o.n.x * d.y, o.n);

    // Warm start the penalty and dual variables (Eq. 19); contacts are hard constraints
    if (vbd) {
      rec.pl = vec4f(params.vbdStiffness, params.vbdStiffness, rec.pl.zw);
    } else {
      if (!postStabilize) { rec.pl = vec4f(rec.pl.xy, rec.pl.zw * params.alpha * params.gamma); }
      rec.pl = vec4f(clamp(rec.pl.xy * params.gamma, vec2f(PENALTY_MIN), vec2f(PENALTY_MAX)), rec.pl.zw);
    }
    contacts[k] = rec;
  }
}
`;var xs=`
${Ut}

// Per-dispatch constants, selected with a dynamic uniform offset
struct PassConstants {
  color: u32,   // colour solved by this primal dispatch
  alpha: f32,   // stabilization for this iteration
  pad0: u32,
  pad1: u32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read_write> bodies: array<Body>;
@group(0) @binding(2) var<storage, read_write> joints: array<Joint>;
@group(0) @binding(3) var<storage, read> info: array<vec4i>;  // type, bodyA (-1 = world), bodyB
@group(0) @binding(4) var<storage, read_write> contacts: array<Contact>;
@group(0) @binding(5) var<storage, read> adj: array<u32>;
@group(0) @binding(6) var<storage, read> color: array<u32>;
@group(0) @binding(7) var<storage, read> counters: array<u32>;
@group(1) @binding(0) var<uniform> pc: PassConstants;

fn contactCount() -> u32 {
  return min(counters[C_CONTACTS], params.contactCapacity);
}

fn rowCount(t: i32) -> u32 {
  switch t {
    case T_JOINT: { return 3u; }
    case T_SPRING, T_MOTOR: { return 1u; }
    default: { return 0u; }
  }
}

/** Raw joint constraint: anchor separation and scaled relative angle. */
fn jointC(k: Joint, a: i32, b: i32) -> vec3f {
  var pa = k.anchors.xy;
  var angA = 0.0;
  if (a >= 0) {
    let p = bodies[a].pose;
    pa = rot(p.z, k.anchors.xy) + p.xy;
    angA = p.z;
  }
  let pb = bodies[b].pose;
  let d = pa - (rot(pb.z, k.anchors.zw) + pb.xy);
  return vec3f(d, (angA - pb.z - k.param.x) * k.param.y);
}

// Constraint rows are evaluated by small typed helpers and folded straight into a register
// accumulator with explicit per-row calls: no arrays and no dynamic indexing, which Metal
// and friends would otherwise keep in (slow) memory.

/** Accumulated 3x3 Hessian (lower triangle) and right-hand side of one body's Newton step. */
struct Acc {
  h00: f32,
  h10: f32,
  h11: f32,
  h20: f32,
  h21: f32,
  h22: f32,
  rhs: vec3f,
}

/**
 * Fold one constraint row into the accumulator: J the row's Jacobian w.r.t. the body, g its
 * diagonal geometric-stiffness weights (Sec. 3.5), then the row's state.
 */
fn addRow(acc: ptr<function, Acc>, j: vec3f, g: vec3f, C: f32, pen0: f32, lam: f32, stiff: f32, fmin: f32, fmax: f32) {
  let vbd = (params.flags & FLAG_VBD) != 0u;
  let lambda = select(0.0, lam, !vbd && stiff >= HARD);
  var pen = pen0;
  let fRaw = pen * C + lambda;
  let f = clamp(fRaw, fmin, fmax);
  let af = abs(f);
  // Stiffness rescaling for clamped forces (Eq. 14), Hessian only
  if ((params.flags & FLAG_RESCALE) != 0u && C != 0.0) {
    if (fRaw < fmin) { pen = abs((fmin - lambda) / C); }
    else if (fRaw > fmax) { pen = abs((fmax - lambda) / C); }
  }
  (*acc).rhs += j * f;
  (*acc).h00 += j.x * j.x * pen + g.x * af;
  (*acc).h10 += j.y * j.x * pen;
  (*acc).h11 += j.y * j.y * pen + g.y * af;
  (*acc).h20 += j.z * j.x * pen;
  (*acc).h21 += j.z * j.y * pen;
  (*acc).h22 += j.z * j.z * pen + g.z * af;
}

/** Per-row constraint values of joint/spring/motor j (rows beyond its count are unused). */
fn jointRowsC(j: u32, alpha: f32) -> vec3f {
  let t = info[j].x;
  let a = info[j].y;
  let b = info[j].z;
  let k = joints[j];
  if (t == T_JOINT) {
    // Hard rows are stabilized (Eq. 18)
    return jointC(k, a, b) - select(vec3f(0.0), k.c0.xyz * alpha, k.stiff.xyz >= vec3f(HARD));
  }
  if (t == T_SPRING) {
    let pa4 = bodies[a].pose;
    let pb4 = bodies[b].pose;
    let d = (rot(pa4.z, k.anchors.xy) + pa4.xy) - (rot(pb4.z, k.anchors.zw) + pb4.xy);
    return vec3f(length(d) - k.param.x, 0.0, 0.0);
  }
  if (t == T_MOTOR) {
    var dA = 0.0;
    if (a >= 0) { dA = bodies[a].pose.z - bodies[a].initial.z; }
    let dB = bodies[b].pose.z - bodies[b].initial.z;
    return vec3f(dA - dB - k.param.x * params.dt, 0.0, 0.0);
  }
  return vec3f(0.0);
}

/** Add the rows of joint/spring/motor j, differentiated w.r.t. body i. */
fn addJoint(acc: ptr<function, Acc>, j: u32, alpha: f32, i: u32) {
  let t = info[j].x;
  let a = info[j].y;
  let b = info[j].z;
  let k = joints[j];
  let isA = i32(i) == a;
  let sg = select(-1.0, 1.0, isA);
  let C = jointRowsC(j, alpha);

  if (t == T_JOINT) {
    let r = rot(bodies[i].pose.z, select(k.anchors.zw, k.anchors.xy, isA));
    addRow(acc, vec3f(sg, 0.0, -sg * r.y), vec3f(0.0, 0.0, abs(r.x)), C.x, k.pen.x, k.lam.x, k.stiff.x, k.fmin.x, k.fmax.x);
    addRow(acc, vec3f(0.0, sg, sg * r.x), vec3f(0.0, 0.0, abs(r.y)), C.y, k.pen.y, k.lam.y, k.stiff.y, k.fmin.y, k.fmax.y);
    addRow(acc, vec3f(0.0, 0.0, sg * k.param.y), vec3f(0.0), C.z, k.pen.z, k.lam.z, k.stiff.z, k.fmin.z, k.fmax.z);
  } else if (t == T_SPRING) {
    let pa4 = bodies[a].pose;
    let pb4 = bodies[b].pose;
    let d = (rot(pa4.z, k.anchors.xy) + pa4.xy) - (rot(pb4.z, k.anchors.zw) + pb4.xy);
    let len2 = dot(d, d);
    // A degenerate spring contributes nothing (the CPU zeroes its Jacobian the same way)
    var J = vec3f(0.0);
    var G = vec3f(0.0);
    if (len2 != 0.0) {
      let len = sqrt(len2);
      let n = d / len;
      let d00 = (1.0 - n.x * n.x) / len;
      let d01 = -n.x * n.y / len;
      let d11 = (1.0 - n.y * n.y) / len;
      let ang = bodies[i].pose.z;
      let lr = select(k.anchors.zw, k.anchors.xy, isA);
      let sr = rot(ang, vec2f(-lr.y, lr.x));
      let r = rot(ang, lr);
      let dxr0 = d00 * sr.x + d01 * sr.y;
      let dxr1 = d01 * sr.x + d11 * sr.y;
      let nr = dot(n, r);
      J = sg * vec3f(n, dot(n, sr));
      let drr = select(nr + nr, -nr - nr, isA);
      G = vec3f(length(vec3f(d00, d01, dxr0)), length(vec3f(d01, d11, dxr1)), length(vec3f(dxr0, dxr1, drr)));
    }
    addRow(acc, J, G, C.x, k.pen.x, k.lam.x, k.stiff.x, k.fmin.x, k.fmax.x);
  } else if (t == T_MOTOR) {
    addRow(acc, vec3f(0.0, 0.0, sg), vec3f(0.0), C.x, k.pen.x, k.lam.x, k.stiff.x, k.fmin.x, k.fmax.x);
  }
}

/** Contact geometry: Taylor-expanded C about x- (Sec. 4) and the Jacobians of both bodies. */
struct ContactRows {
  C: vec2f,  // normal, tangent
  jAn: vec3f,
  jAt: vec3f,
  jBn: vec3f,
  jBt: vec3f,
}

fn contactRows(k: Contact, alpha: f32) -> ContactRows {
  let a = k.ids.x;
  let b = k.ids.y;
  let n = k.geo.zw;
  let tg = vec2f(n.y, -n.x);
  // Only the poses are needed: load those fields, not the whole 96-byte body records
  let poseA = bodies[a].pose.xyz;
  let initA = bodies[a].initial.xyz;
  let poseB = bodies[b].pose.xyz;
  let initB = bodies[b].initial.xyz;
  let rA = rot(initA.z, k.anchors.xy);
  let rB = rot(initB.z, k.anchors.zw);
  var r: ContactRows;
  r.jAn = vec3f(n, rA.x * n.y - rA.y * n.x);
  r.jBn = -vec3f(n, rB.x * n.y - rB.y * n.x);
  r.jAt = vec3f(tg, rA.x * tg.y - rA.y * tg.x);
  r.jBt = -vec3f(tg, rB.x * tg.y - rB.y * tg.x);
  let dA = poseA - initA;
  let dB = poseB - initB;
  r.C = vec2f(
    k.geo.x * (1.0 - alpha) + dot(r.jAn, dA) + dot(r.jBn, dB),
    k.geo.y * (1.0 - alpha) + dot(r.jAt, dA) + dot(r.jBt, dB));
  return r;
}

/** Add contact c's normal and friction rows, differentiated w.r.t. body i. */
fn addContact(acc: ptr<function, Acc>, c: u32, alpha: f32, i: u32) {
  let k = contacts[c];
  let r = contactRows(k, alpha);
  let isA = i == k.ids.x;
  // Normal pushes only; friction is bounded by the current normal force
  let bound = abs(k.pl.z) * k.misc.x;
  addRow(acc, select(r.jBn, r.jAn, isA), vec3f(0.0), r.C.x, k.pl.x, k.pl.z, BIG, -BIG, 0.0);
  addRow(acc, select(r.jBt, r.jAt, isA), vec3f(0.0), r.C.y, k.pl.y, k.pl.w, BIG, -bound, bound);
}

// --- Warm start ---------------------------------------------------------------------------

@compute @workgroup_size(64)
fn warmStartJoints(@builtin(global_invocation_id) gid: vec3u) {
  let j = gid.x;
  if (j >= params.jointCount) { return; }
  let t = info[j].x;
  if (t == T_NONE) { return; }
  var k = joints[j];
  if (t == T_JOINT) { k.c0 = vec4f(jointC(k, info[j].y, info[j].z), 0.0); }
  let vbd = (params.flags & FLAG_VBD) != 0u;
  let postStabilize = (params.flags & FLAG_POST_STABILIZE) != 0u;
  for (var r = 0u; r < rowCount(t); r++) {
    if (vbd) {
      k.pen[r] = min(k.stiff[r], params.vbdStiffness);
      continue;
    }
    if (!postStabilize) { k.lam[r] = k.lam[r] * params.alpha * params.gamma; }
    k.pen[r] = min(clamp(k.pen[r] * params.gamma, PENALTY_MIN, PENALTY_MAX), k.stiff[r]);
  }
  joints[j] = k;
}

@compute @workgroup_size(64)
fn warmStartBodies(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount) { return; }
  var b = bodies[i];
  let dt = params.dt;
  let g = params.gravity;
  b.vel.z = clamp(b.vel.z, -50.0, 50.0);

  // Inertial target (Eq. 2)
  b.inertial = vec4f(b.pose.xyz + b.vel.xyz * dt, 0.0);
  if (b.shape.z > 0.0) { b.inertial.y += g * dt * dt; }

  // Adaptive warm start (original VBD paper)
  var w = 0.0;
  if (abs(g) > 0.0) { w = clamp(((b.vel.y - b.prevVel.y) / dt) * sign(g) / abs(g), 0.0, 1.0); }

  b.initial = b.pose;
  b.pose = vec4f(b.pose.x + b.vel.x * dt, b.pose.y + b.vel.y * dt + g * w * dt * dt, b.pose.z + b.vel.z * dt, b.pose.w);
  bodies[i] = b;
}

// --- Primal: one colour ---------------------------------------------------------------------

// Bodies of one colour share no constraint, so writing poses in place never races with a
// neighbour's read (bodies left clashing by the colouring are the only, counted, exception).
@compute @workgroup_size(64)
fn primal(@builtin(global_invocation_id) gid: vec3u) {
  let start = color[params.colorStartOffset + pc.color];
  if (gid.x >= color[params.colorStartOffset + pc.color + 1u] - start) { return; }
  solveBody(color[params.colorBodiesOffset + start + gid.x]);
}

// Variant for comparison: one thread per body in index order, skipping other colours. More
// threads, but neighbouring threads touch neighbouring memory.
@compute @workgroup_size(64)
fn primalScan(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount || color[i] != pc.color || bodies[i].shape.z <= 0.0) { return; }
  solveBody(i);
}

fn solveBody(i: u32) {
  let pose = bodies[i].pose;
  let inertial = bodies[i].inertial.xyz;
  let shape = bodies[i].shape;
  let dt2 = params.dt * params.dt;
  let mdt = shape.z / dt2;
  let idt = shape.w / dt2;
  var acc = Acc(mdt, 0.0, mdt, 0.0, 0.0, idt, vec3f(mdt * (pose.x - inertial.x), mdt * (pose.y - inertial.y), idt * (pose.z - inertial.z)));

  let end = adj[i + 1u];
  for (var e = adj[i]; e < end; e++) {
    let id = adj[params.adjListOffset + e];
    if (id < params.jointCount) { addJoint(&acc, id, pc.alpha, i); }
    else { addContact(&acc, id - params.jointCount, pc.alpha, i); }
  }

  // LDL\u1D40 solve of the 3x3 SPD system
  let D1 = acc.h00;
  let L21 = acc.h10 / acc.h00;
  let L31 = acc.h20 / acc.h00;
  let D2 = acc.h11 - L21 * L21 * D1;
  let L32 = (acc.h21 - L21 * L31 * D1) / D2;
  let D3 = acc.h22 - (L31 * L31 * D1 + L32 * L32 * D2);
  let rhs = acc.rhs;
  let y2 = rhs.y - L21 * rhs.x;
  let y3 = rhs.z - L31 * rhs.x - L32 * y2;
  let x2 = y3 / D3;
  let x1 = y2 / D2 - L32 * x2;
  let x0 = rhs.x / D1 - L21 * x1 - L31 * x2;
  bodies[i].pose = vec4f(pose.xyz - vec3f(x0, x1, x2), pose.w);
}

// --- Dual -----------------------------------------------------------------------------------

fn dualJoint(j: u32) {
  let t = info[j].x;
  if (t == T_NONE) { return; }
  let C = jointRowsC(j, pc.alpha);
  var k = joints[j];
  let vbd = (params.flags & FLAG_VBD) != 0u;
  for (var r = 0u; r < rowCount(t); r++) {
    let lambda = select(0.0, k.lam[r], !vbd && k.stiff[r] >= HARD);
    let lam = clamp(k.pen[r] * C[r] + lambda, k.fmin[r], k.fmax[r]);
    let lo = k.fmin[r];
    let hi = k.fmax[r];
    k.lam[r] = lam;
    if (abs(lam) >= k.frac[r]) {
      // Fracture: the joint stops acting (and stays zero from now on)
      k.pen = vec4f(0.0);
      k.lam = vec4f(0.0);
      k.stiff = vec4f(0.0);
    }
    if (!vbd && lam > lo && lam < hi) {
      k.pen[r] = min(k.pen[r] + params.beta * abs(C[r]), min(PENALTY_MAX, k.stiff[r]));
    }
  }
  joints[j] = k;
}

fn dualContact(c: u32) {
  var k = contacts[c];
  let r = contactRows(k, pc.alpha);
  let vbd = (params.flags & FLAG_VBD) != 0u;
  // Friction bounds (and the stick test) use the normal force from before this update
  let bound = abs(k.pl.z) * k.misc.x;
  k.ids.w = select(0u, 1u, abs(k.pl.w) < bound && abs(k.geo.y) < STICK_THRESH);
  // Normal row: bounds (-BIG, 0]
  let lamN = clamp(k.pl.x * r.C.x + select(k.pl.z, 0.0, vbd), -BIG, 0.0);
  var penN = k.pl.x;
  if (!vbd && lamN > -BIG && lamN < 0.0) { penN = min(penN + params.beta * abs(r.C.x), PENALTY_MAX); }
  // Friction row: bounds [-bound, bound]
  let lamT = clamp(k.pl.y * r.C.y + select(k.pl.w, 0.0, vbd), -bound, bound);
  var penT = k.pl.y;
  if (!vbd && lamT > -bound && lamT < bound) { penT = min(penT + params.beta * abs(r.C.y), PENALTY_MAX); }
  k.pl = vec4f(penN, penT, lamN, lamT);
  contacts[c] = k;
}

/** Dual update of every constraint: joints first, then contacts (one dispatch). */
@compute @workgroup_size(64)
fn dual(@builtin(global_invocation_id) gid: vec3u) {
  let id = gid.x;
  if (id < params.jointCount) { dualJoint(id); }
  else if (id - params.jointCount < contactCount()) { dualContact(id - params.jointCount); }
}

/** With post stabilization the stick flags come from the final lambdas (see soa refreshStick). */
@compute @workgroup_size(64)
fn refreshStick(@builtin(global_invocation_id) gid: vec3u) {
  let c = gid.x;
  if (c >= contactCount()) { return; }
  let k = contacts[c];
  let bound = abs(k.pl.z) * k.misc.x;
  contacts[c].ids.w = select(0u, 1u, abs(k.pl.w) < bound && abs(k.geo.y) < STICK_THRESH);
}

@compute @workgroup_size(64)
fn updateVelocities(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.bodyCount) { return; }
  var b = bodies[i];
  b.prevVel = b.vel;
  if (b.shape.z > 0.0) { b.vel = vec4f((b.pose.xyz - b.initial.xyz) / params.dt, 0.0); }
  bodies[i] = b;
}
`;var Oo=s=>s===1/0?3e38:s===-1/0?-3e38:s,bt=s=>Math.ceil(s/64),Rc=s=>2**Math.ceil(Math.log2(Math.max(s,2))),od=s=>Math.max(s,1)*24*4,ad=4,yt=()=>GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST,To=class{device;params=ko();topology;bodyCount=0;bodyCapacity;jointCount=0;jointCapacity=0;pairCapacity=0;contactCapacity=0;colorCap=12;splitPasses=!1;primalMode="bucket";shrinkVotes=0;get colorHistOffset(){return 3*this.bodyCapacity+65}colorRounds;bodyBuffer;ownsBodyBuffer;jointBuffer;infoBuffer;contactBuffers;pairBuffer;tableBuffer;gridBuffer;staticBuffer=null;counterBuffer;argsBuffer;adjBuffer=null;colorBuffer;paramsBuffer;passBuffer=null;passEntries=0;parity=0;tableSize;hashSize=0;cellSize=1;maxSmallRadius=0;largeCount=0;noCollideCount=0;staticsDirty=!0;layouts;pipes={};groups;passGroup=null;gridScan;colorHistScan;colorGroups;adjScan=null;timing;timingCallback=null;timingBusy=!1;destroyed=!1;constructor(e,t,i={}){if(this.device=e,this.topology=t,Object.assign(this.params,t.params),this.bodyCount=t.bodyCount,this.colorRounds=i.colorRounds??16,this.ownsBodyBuffer=!i.bodyBuffer,this.bodyCapacity=i.bodyBuffer?Math.floor(i.bodyBuffer.size/96):Math.max(i.bodyCapacity??this.bodyCount+1024,this.bodyCount,1),this.bodyCapacity<this.bodyCount)throw new Error("body buffer too small");this.bodyBuffer=i.bodyBuffer??e.createBuffer({label:"bodies",size:od(this.bodyCapacity),usage:yt()});let r=this.bodyCapacity;this.tableSize=Rc(2*r),this.gridBuffer=e.createBuffer({label:"grid",size:(2*this.tableSize+1+3*r)*4,usage:yt()}),this.counterBuffer=e.createBuffer({label:"counters",size:64,usage:yt()}),this.argsBuffer=e.createBuffer({label:"indirect args",size:816,usage:yt()|GPUBufferUsage.INDIRECT}),this.colorGroups=Math.ceil(r/256),this.colorBuffer=e.createBuffer({label:"colours",size:(3*r+65+64*this.colorGroups+1)*4,usage:yt()}),this.paramsBuffer=e.createBuffer({label:"params",size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),e.queue.writeBuffer(this.colorBuffer,0,new Uint32Array(r).fill(255));let o=2*Se.length;this.timing=e.features.has("timestamp-query")?{querySet:e.createQuerySet({type:"timestamp",count:o}),resolve:e.createBuffer({size:o*8,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC}),read:e.createBuffer({size:o*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST})}:null,this.layouts=this.createLayouts(),this.createPipelines(),this.gridScan=new tt(e,this.gridBuffer,0,this.tableSize+1),this.colorHistScan=new tt(e,this.colorBuffer,this.colorHistOffset,64*this.colorGroups+1),this.jointCount=t.jointCount,this.allocateJoints(t.jointCount+256),this.uploadJoints(0,t.jointCount),this.allocateContacts(Math.max(4096,4*r)),this.uploadBodies()}createLayouts(){let e=this.device,t=(a,n)=>e.createBindGroupLayout({label:a,entries:n.map((l,c)=>({binding:c,visibility:GPUShaderStage.COMPUTE,buffer:{type:l}}))}),i="read-only-storage",r="storage",o="uniform";return{broad:t("broadphase",[o,i,r,r,r,i,i]),contacts:t("contacts",[o,i,i,r,i,r,r]),topo:t("topology",[o,i,i,i,i,r,r,r]),solve:t("solve",[o,r,r,i,r,i,i,i]),pass:e.createBindGroupLayout({label:"pass",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform",hasDynamicOffset:!0,minBindingSize:16}}]}),args:t("args",[o,i,i,r])}}createPipelines(){let e=this.device,t=(r,o,a)=>{let n=e.createShaderModule({code:r}),l=e.createPipelineLayout({bindGroupLayouts:o});for(let c of a)this.pipes[c]=e.createComputePipeline({label:c,layout:l,compute:{module:n,entryPoint:c}})},i=this.layouts;t(ys,[i.broad],["beginFrame","gridCount","gridScatter","findPairs"]),t(vs,[i.contacts],["hashInsert","narrowphase"]),t(Qr,[i.topo],["degreeJoints","degreeContacts","fillJoints","fillContacts","sortAdjacency","colorCompact","colorMark","colorRoundAB","colorRoundBA","colorCount","colorStarts","colorScatter"]),t(xs,[i.solve,i.pass],["warmStartJoints","warmStartBodies","primal","primalScan","dual","refreshStick","updateVelocities"]),t(qs,[i.args],["argsPrev","argsPairs","argsContacts","argsColors"])}allocateJoints(e){let t=this.device,i=t.createBuffer({label:"joints",size:Math.max(e,1)*36*4,usage:yt()}),r=t.createBuffer({label:"joint info",size:Math.max(e,1)*16,usage:yt()});if(this.jointBuffer){let o=t.createCommandEncoder();o.copyBufferToBuffer(this.jointBuffer,0,i,0,this.jointCapacity*36*4),o.copyBufferToBuffer(this.infoBuffer,0,r,0,this.jointCapacity*16),t.queue.submit([o.finish()]),this.jointBuffer.destroy(),this.infoBuffer.destroy()}this.jointBuffer=i,this.infoBuffer=r,this.jointCapacity=e,this.contactBuffers&&this.rebuildBindings()}allocateContacts(e,t=2*e){let i=this.device,r=i.limits.maxStorageBufferBindingSize,o=Math.min(e,Math.floor(r/80),Math.floor(r/16)),a=Math.min(t,Math.floor(r/8)),n=this.contactBuffers,l=this.contactCapacity;for(let c of[this.pairBuffer,this.tableBuffer])c?.destroy();if(this.contactCapacity=o,this.pairCapacity=a,this.hashSize=Rc(4*o),this.pairBuffer=i.createBuffer({label:"pairs",size:a*8,usage:yt()}),this.tableBuffer=i.createBuffer({label:"contact hash",size:this.hashSize*4,usage:yt()}),this.contactBuffers=[0,1].map(c=>i.createBuffer({label:`contacts ${c}`,size:o*20*4,usage:yt()})),n){let c=i.createCommandEncoder(),u=Math.min(l,o)*20*4;n.forEach((f,d)=>c.copyBufferToBuffer(f,0,this.contactBuffers[d],0,u)),i.queue.submit([c.finish()]),n.forEach(f=>f.destroy())}this.rebuildBindings()}rebuildBindings(){let e=this.device,t=this.bodyCapacity;this.adjBuffer?.destroy(),this.adjBuffer=e.createBuffer({label:"adjacency",size:(2*t+1+2*(this.jointCapacity+this.contactCapacity))*4,usage:yt()}),this.adjScan?.destroy(),this.adjScan=new tt(e,this.adjBuffer,0,this.bodyCount+1),this.staticBuffer??=e.createBuffer({label:"statics",size:16,usage:yt()});let i=(l,c)=>e.createBindGroup({layout:l,entries:c.map((u,f)=>({binding:f,resource:{buffer:u}}))}),r=this.paramsBuffer,[o,a]=this.contactBuffers,n=this.adjBuffer;this.groups={broad:i(this.layouts.broad,[r,this.bodyBuffer,this.gridBuffer,this.pairBuffer,this.counterBuffer,this.staticBuffer,this.jointBuffer]),contacts:[i(this.layouts.contacts,[r,this.bodyBuffer,this.pairBuffer,o,a,this.tableBuffer,this.counterBuffer]),i(this.layouts.contacts,[r,this.bodyBuffer,this.pairBuffer,a,o,this.tableBuffer,this.counterBuffer])],topo:[o,a].map(l=>i(this.layouts.topo,[r,this.bodyBuffer,this.jointBuffer,this.infoBuffer,l,this.counterBuffer,n,this.colorBuffer])),solve:[o,a].map(l=>i(this.layouts.solve,[r,this.bodyBuffer,this.jointBuffer,this.infoBuffer,l,n,this.colorBuffer,this.counterBuffer])),args:i(this.layouts.args,[r,this.counterBuffer,this.colorBuffer,this.argsBuffer])}}uploadBodies(e=0,t=this.topology.bodyCount-e){let i=this.topology,r=new Float32Array(Math.max(t,1)*24);for(let o=0;o<t;o++){let a=e+o,n=o*24;r.set(i.pose.subarray(a*4,a*4+3),n),r[n+3]=i.props[a*4],r.set(i.initial.subarray(a*4,a*4+4),n+4),r.set(i.inertial.subarray(a*4,a*4+4),n+8),r.set(i.velocity.subarray(a*4,a*4+4),n+12),r.set(i.prevVelocity.subarray(a*4,a*4+4),n+16),r.set(i.shape.subarray(a*4,a*4+4),n+20)}this.device.queue.writeBuffer(this.bodyBuffer,e*24*4,r),this.staticsDirty=!0}uploadJoints(e,t){if(t===0)return;let i=this.topology,r=new Float32Array(t*36);for(let o=0;o<t;o++){let a=(e+o)*O,n=o*36;for(let l=0;l<3;l++)r[n+0+l]=i.data[a+se+l],r[n+4+l]=i.data[a+te+l],r[n+8+l]=Oo(i.data[a+Q+l]),r[n+12+l]=Oo(i.data[a+_e+l]),r[n+16+l]=Oo(i.data[a+Ae+l]),r[n+20+l]=Oo(i.data[a+Pt+l]),r[n+24+l]=i.data[a+fe+l];r[n+28]=i.data[a+N],r[n+28+1]=i.data[a+N+1],r[n+28+2]=i.data[a+Y],r[n+28+3]=i.data[a+Y+1],r[n+32]=i.data[a+re],r[n+32+1]=i.data[a+be]}this.device.queue.writeBuffer(this.jointBuffer,e*36*4,r),this.device.queue.writeBuffer(this.infoBuffer,e*16,i.info,e*j,t*j)}uploadStatics(){let e=this.topology,t=this.bodyCount,i=Float64Array.from({length:t},(f,d)=>e.props[d*4+1]).sort(),r=t>0?i[t>>1]:1,o=0;for(let f=0;f<t;f++)i[f]<=ad*r&&(o=Math.max(o,i[f]));let a=1/0;for(let f=0;f<t;f++)i[f]>o&&(a=Math.min(a,i[f]));let n=a===1/0?o*1.5:(o+a)/2;this.maxSmallRadius=n,this.cellSize=Math.max(2*o*(1+1e-4),.001);let l=[];for(let f=0;f<t;f++)e.props[f*4+1]>n&&l.push(f);let c=[];for(let f=0;f<e.jointCount;f++){let d=e.info[f*j+1],p=e.info[f*j+2];d>=0&&c.push([Math.max(d,p),Math.min(d,p),f])}for(let f of e.ignoredPairs()){let d=Math.floor(f/2097152);c.push([d,f-d*2097152,4294967295])}c.sort((f,d)=>f[0]-d[0]||f[1]-d[1]),this.largeCount=l.length,this.noCollideCount=c.length;let u=new Uint32Array(Math.max(l.length+3*c.length,4));u.set(l,0),c.forEach((f,d)=>u.set(f,l.length+3*d)),this.staticBuffer.size<u.byteLength&&(this.staticBuffer.destroy(),this.staticBuffer=this.device.createBuffer({label:"statics",size:u.byteLength,usage:yt()}),this.rebuildBindings()),this.device.queue.writeBuffer(this.staticBuffer,0,u),this.staticsDirty=!1}seedContactsFrom(e){let t=e.contactCount;if(t>this.contactCapacity)throw new Error("seedContactsFrom: too many contacts");let i=new ArrayBuffer(Math.max(t,1)*20*4),r=new Uint32Array(i),o=new Float32Array(i);for(let l=0;l<t;l++){let c=e.jointCount+l,u=c*O,f=l*20;r[f]=e.info[c*j+1],r[f+1]=e.info[c*j+2],r[f+2]=e.info[c*j+3],r[f+3]=e.data[u+Hi]?1:0,o.set([e.data[u+se],e.data[u+se+1],e.data[u+te],e.data[u+te+1]],f+4),o.set([e.data[u+N],e.data[u+N+1],e.data[u+Y],e.data[u+Y+1]],f+8),o.set([e.data[u+fe],e.data[u+fe+1],e.data[u+be],e.data[u+Ue]],f+12),o[f+16]=e.data[u+re]}this.device.queue.writeBuffer(this.contactBuffers[1-this.parity],0,i);let a=new Uint32Array(16);a[1]=t,this.device.queue.writeBuffer(this.counterBuffer,0,a);let n=Uint32Array.from({length:this.bodyCount},(l,c)=>(e.coloring.colors[c]??-1)<0?255:e.coloring.colors[c]);this.device.queue.writeBuffer(this.colorBuffer,0,n)}addBody(e,t,i,r,o){if(this.bodyCount>=this.bodyCapacity)return-1;let a=this.topology.addBody(e,t,i,r,o);return this.bodyCount=this.topology.bodyCount,this.uploadBodies(a,1),this.device.queue.writeBuffer(this.colorBuffer,a*4,new Uint32Array([255])),this.adjScan.destroy(),this.adjScan=new tt(this.device,this.adjBuffer,0,this.bodyCount+1),a}appendJoint(e,t,i,r,o,a=1/0){let n=this.topology;if(n.contactCount>0)throw new Error("appendJoint: the CPU mirror must not hold contacts");let l=n.addJoint(e,t,i,r,o,a).slot;return l>=this.jointCapacity&&this.allocateJoints(Math.max(l+1,this.jointCapacity*2)),this.jointCount=l+1,this.uploadJoints(l,1),e>=0&&(this.staticsDirty=!0),l}setWorldAnchor(e,t,i){this.device.queue.writeBuffer(this.jointBuffer,(e*36+28)*4,new Float32Array([t,i]))}disableConstraint(e){this.device.queue.writeBuffer(this.jointBuffer,(e*36+0)*4,new Float32Array(12)),this.topology.data.fill(0,e*O+Q,e*O+Q+3)}profileNextStep(e){this.timing&&!this.timingBusy&&(this.timingCallback=e)}writeParams(e,t){let i=this.params,r=this.bodyCapacity,o=new ArrayBuffer(128),a=new Float32Array(o),n=new Uint32Array(o);a[0]=i.dt,a[1]=i.gravity,a[2]=i.beta,a[3]=i.gamma,a[4]=e,a[5]=i.vbdStiffness,n[6]=(i.vbd?1:0)|(i.stiffnessRescale?2:0)|(t?4:0)|(i.matchNearest?8:0),n[7]=this.bodyCount,n[8]=this.jointCount,n[9]=this.colorCap,a[10]=this.cellSize,n[11]=this.tableSize-1,a[12]=this.maxSmallRadius,n[13]=this.largeCount,n[14]=this.noCollideCount,n[15]=this.pairCapacity,n[16]=this.contactCapacity,n[17]=this.hashSize-1,n[18]=r+1,n[19]=2*r+1,n[20]=this.tableSize+1,n[21]=2*this.tableSize+1,n[22]=2*this.tableSize+1+r,n[23]=r,n[24]=this.colorHistOffset,n[25]=2*r,n[26]=this.colorGroups,n[27]=2*r+65,n[28]=this.colorRounds,this.device.queue.writeBuffer(this.paramsBuffer,0,o)}writePassConstants(e,t){let i=this.colorCap+1,r=e*i;(r>this.passEntries||!this.passGroup)&&(this.passBuffer?.destroy(),this.passBuffer=this.device.createBuffer({label:"pass constants",size:r*256,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.passEntries=r,this.passGroup=this.device.createBindGroup({layout:this.layouts.pass,entries:[{binding:0,resource:{buffer:this.passBuffer,size:16}}]}));let o=new ArrayBuffer(r*256),a=new Uint32Array(o),n=new Float32Array(o);for(let l=0;l<e;l++)for(let c=0;c<=this.colorCap;c++){let u=(l*i+c)*256/4;a[u]=c,n[u+1]=t(l)}this.device.queue.writeBuffer(this.passBuffer,0,o)}step(){this.staticsDirty&&this.uploadStatics();let e=this.params,t=e.postStabilize&&!e.vbd,i=e.vbd?0:e.alpha,r=e.iterations+(t?1:0);this.writeParams(i,t),this.writePassConstants(r,x=>t?x<e.iterations?1:0:i);let o=this.parity,a=this.bodyCapacity,n=this.bodyCount,l=this.jointCount,c=this.device.createCommandEncoder({label:"avbd2d step"});c.clearBuffer(this.gridBuffer,0,(2*this.tableSize+1)*4),c.clearBuffer(this.tableBuffer),c.clearBuffer(this.adjBuffer,0,(2*a+1)*4);let u=this.timingCallback!==null&&this.timing!==null,f,d=0,p=u||this.splitPasses,m=()=>{f&&!p||(f?.end(),f=c.beginComputePass({label:p?Se[d]:"avbd2d step",timestampWrites:u?{querySet:this.timing.querySet,beginningOfPassWriteIndex:2*d,endOfPassWriteIndex:2*d+1}:void 0}),d++)},h=this.groups,g=(x,w,B)=>{B<=0||(f.setPipeline(this.pipes[x]),f.setBindGroup(0,w),f.dispatchWorkgroups(B))},b=(x,w,B)=>{f.setPipeline(this.pipes[x]),f.setBindGroup(0,w),f.dispatchWorkgroupsIndirect(this.argsBuffer,B*4)};m(),g("beginFrame",h.broad,1),g("argsPrev",h.args,1),b("hashInsert",h.contacts[o],6),g("gridCount",h.broad,bt(n)),this.gridScan.encode(f),g("gridScatter",h.broad,bt(n)),g("findPairs",h.broad,bt(n)),g("argsPairs",h.args,1),b("narrowphase",h.contacts[o],0),g("argsContacts",h.args,1),m(),g("degreeJoints",h.topo[o],bt(l)),b("degreeContacts",h.topo[o],3),this.adjScan.encode(f),g("fillJoints",h.topo[o],bt(l)),b("fillContacts",h.topo[o],3),g("sortAdjacency",h.topo[o],bt(n)),m(),g("colorCompact",h.topo[o],bt(n)),g("colorMark",h.topo[o],bt(n));for(let x=0;x<this.colorRounds;x++)g(x%2===0?"colorRoundAB":"colorRoundBA",h.topo[o],bt(n));g("colorCount",h.topo[o],this.colorGroups),this.colorHistScan.encode(f),g("colorStarts",h.topo[o],1),g("argsColors",h.args,1),g("colorScatter",h.topo[o],this.colorGroups),m();let y=this.colorCap+1,A=x=>f.setBindGroup(1,this.passGroup,[x*256]);f.setBindGroup(0,h.solve[o]),A(0),l>0&&(f.setPipeline(this.pipes.warmStartJoints),f.dispatchWorkgroups(bt(l))),f.setPipeline(this.pipes.warmStartBodies),f.dispatchWorkgroups(bt(n));for(let x=0;x<r;x++){let w=this.primalMode==="scan";f.setPipeline(w?this.pipes.primalScan:this.pipes.primal);for(let B=0;B<this.colorCap;B++)A(x*y+B),w?f.dispatchWorkgroups(bt(n)):f.dispatchWorkgroupsIndirect(this.argsBuffer,(12+3*B)*4);x<e.iterations&&(A(x*y+this.colorCap),f.setPipeline(this.pipes.dual),f.dispatchWorkgroupsIndirect(this.argsBuffer,36)),x===e.iterations-1&&(f.setPipeline(this.pipes.updateVelocities),f.dispatchWorkgroups(bt(n)))}t&&(f.setPipeline(this.pipes.refreshStick),f.dispatchWorkgroupsIndirect(this.argsBuffer,12)),f.end();let v=2*Se.length;if(u){let{querySet:x,resolve:w,read:B}=this.timing;c.resolveQuerySet(x,0,v,w,0),c.copyBufferToBuffer(w,0,B,0,v*8)}if(this.device.queue.submit([c.finish()]),this.parity=1-o,u){let x=this.timingCallback;this.timingCallback=null,this.timingBusy=!0;let w=this.timing.read;w.mapAsync(GPUMapMode.READ).then(()=>{let B=new BigUint64Array(w.getMappedRange()).slice();if(w.unmap(),this.timingBusy=!1,this.destroyed)return this.releaseTiming();let L=(I,E)=>Number(B[E]-B[I])/1e6,M={total:L(0,v-1)};Se.forEach((I,E)=>M[I]=L(2*E,2*E+1)),x(M)},()=>{this.timingBusy=!1,this.destroyed&&this.releaseTiming()})}}async readBodies(){return new Float32Array(await this.read(this.bodyBuffer,this.bodyCount*24*4))}async readJoints(){return new Float32Array(await this.read(this.jointBuffer,this.jointCount*36*4))}async readCounters(){let e=new Uint32Array(await this.read(this.counterBuffer,64));return{pairs:e[0],contacts:e[1],overflow:e[3],clashes:e[4],colors:e[5]}}async readContacts(){let{contacts:e}=await this.readCounters(),t=Math.min(e,this.contactCapacity);return this.read(this.contactBuffers[1-this.parity],t*20*4)}async readPairs(){let{pairs:e}=await this.readCounters();return new Uint32Array(await this.read(this.pairBuffer,Math.min(e,this.pairCapacity)*8))}async readColors(){return new Uint32Array(await this.read(this.colorBuffer,this.bodyCount*4))}async readAdjacency(){let e=new Uint32Array(await this.read(this.adjBuffer,this.adjBuffer.size)),t=e.slice(0,this.bodyCount+1),i=2*this.bodyCapacity+1;return{start:t,list:e.slice(i,i+t[this.bodyCount])}}adapt(e){let t=e.colors;e.clashes>0||t>=this.colorCap-1?(this.colorCap=Math.min(64,Math.max(t+4,this.colorCap+4)),this.shrinkVotes=0):t+2<this.colorCap?++this.shrinkVotes>=3&&(this.colorCap=Math.min(64,Math.max(4,t+2)),this.shrinkVotes=0):this.shrinkVotes=0;let i=(e.overflow&2)!==0||e.contacts>.8*this.contactCapacity,r=(e.overflow&1)!==0||e.pairs>.8*this.pairCapacity,o=this.contactCapacity*(i?2:1),a=this.pairCapacity*(r?2:1);(i||r)&&this.capacityCanGrow(o,a)&&this.allocateContacts(o,a)}capacityCanGrow(e,t){let i=this.device.limits.maxStorageBufferBindingSize,r=Math.min(Math.floor(i/80),Math.floor(i/16));return Math.min(e,r)>this.contactCapacity||Math.min(t,Math.floor(i/8))>this.pairCapacity}async readStats(e){let[t,i]=await Promise.all([e??this.readBodies(),this.readJoints()]),r=0;for(let c=0;c<this.bodyCount;c++){let u=c*24,f=t[u+22],d=t[u+12],p=t[u+13],m=t[u+14];f>0&&(r+=.5*f*(d*d+p*p)+.5*t[u+23]*m*m)}let o=0,a=0,n=this.topology.info,l=(c,u,f)=>{let d=c*24,p=Math.cos(t[d+2]),m=Math.sin(t[d+2]);return[p*u-m*f+t[d],m*u+p*f+t[d+1]]};for(let c=0;c<this.jointCount;c++){if(n[c*j]!==Bi)continue;let u=c*36;if(i[u+8]===0&&i[u+8+1]===0&&i[u+8+2]===0)continue;a++;let f=n[c*j+1],d=n[c*j+2],p=f>=0?l(f,i[u+28],i[u+28+1]):[i[u+28],i[u+28+1]],m=l(d,i[u+28+2],i[u+28+3]);for(let h=0;h<2;h++)i[u+8+h]>=1e30&&(o=Math.max(o,Math.abs(p[h]-m[h])))}return{kineticEnergy:r,maxJointError:o,joints:a}}async read(e,t){if(t===0)return new ArrayBuffer(0);let i=this.device.createBuffer({size:t,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),r=this.device.createCommandEncoder();r.copyBufferToBuffer(e,0,i,0,t),this.device.queue.submit([r.finish()]),await i.mapAsync(GPUMapMode.READ);let o=i.getMappedRange().slice(0);return i.unmap(),i.destroy(),o}releaseTiming(){this.timing?.resolve.destroy(),this.timing?.read.destroy(),this.timing?.querySet.destroy()}destroy(){this.ownsBodyBuffer&&this.bodyBuffer.destroy();let e=[this.jointBuffer,this.infoBuffer,...this.contactBuffers,this.pairBuffer,this.tableBuffer,this.gridBuffer,this.staticBuffer,this.counterBuffer,this.argsBuffer,this.adjBuffer,this.colorBuffer,this.paramsBuffer,this.passBuffer];for(let t of e)t?.destroy();this.destroyed=!0,this.timingBusy||this.releaseTiming(),this.gridScan.destroy(),this.colorHistScan.destroy(),this.adjScan?.destroy()}};var nd=`${Ut}
struct Config { count:u32,joints:u32,capacity:u32,list:u32,threshold:f32,dt:f32,pad0:u32,pad1:u32 }
struct Velocity { incoming:vec4f, incomingAngular:vec4f, linear:vec4f, angular:vec4f }
struct Bounce { impulse:f32,delta:f32,reboundSpeed:f32,inverseMass:f32,rA:vec4f,rB:vec4f }
@group(0) @binding(0) var<uniform> cfg:Config;
@group(0) @binding(1) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(2) var<storage,read_write> velocities:array<Velocity>;
@group(0) @binding(3) var<storage,read> materials:array<f32>;
@group(0) @binding(4) var<storage,read> unused:array<Contact>;
@group(0) @binding(5) var<storage,read> contacts:array<Contact>;
@group(0) @binding(6) var<storage,read> adj:array<u32>;
@group(0) @binding(7) var<storage,read> counters:array<u32>;
@group(0) @binding(8) var<storage,read_write> bounce:array<Bounce>;
fn invMass(i:u32)->f32{return select(0.,1./max(bodies[i].shape.z,1.e-20),bodies[i].shape.z>0.);}
fn invMoment(i:u32)->f32{return select(0.,1./max(bodies[i].shape.w,1.e-20),bodies[i].shape.z>0.&&bodies[i].shape.w>0.);}
fn cross2(a:vec2f,b:vec2f)->f32{return a.x*b.y-a.y*b.x;}
fn pointVelocity(i:u32,r:vec2f,incoming:bool)->vec2f{let v=select(velocities[i].linear,velocities[i].incoming,incoming);return v.xy+v.z*vec2f(-r.y,r.x);}
@compute @workgroup_size(64) fn captureIncoming(@builtin(global_invocation_id) id:vec3u){let i=id.x;if(i>=cfg.count){return;}velocities[i].incoming=bodies[i].vel;}
@compute @workgroup_size(64) fn captureSolved(@builtin(global_invocation_id) id:vec3u){let i=id.x;if(i>=cfg.count){return;}velocities[i].linear=bodies[i].vel;}
@compute @workgroup_size(64) fn initialize(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;let count=min(counters[C_CONTACTS],cfg.capacity);if(i>=count){return;}
 bounce[i]=Bounce(0.,0.,0.,0.,vec4f(0.),vec4f(0.));
 let c=contacts[i];let a=c.ids.x;let b=c.ids.y;let e=max(materials[a],materials[b]);
 if(e<=0. || counters[C_OVERFLOW]!=0u || counters[C_CLASHES]!=0u || (c.ids.w&0x80000000u)!=0u){return;}
 // Two face points belong to one pair. Apply a single centroid impulse, so
 // point count cannot multiply bounce strength or introduce spurious spin.
 if(i>0u && all(contacts[i-1u].ids.xy==c.ids.xy)){return;}
 var ra=rot(bodies[a].pose.z,c.anchors.xy);var rb=rot(bodies[b].pose.z,c.anchors.zw);
 if(i+1u<count && all(contacts[i+1u].ids.xy==c.ids.xy)){let d=contacts[i+1u];ra=.5*(ra+rot(bodies[a].pose.z,d.anchors.xy));rb=.5*(rb+rot(bodies[b].pose.z,d.anchors.zw));}
 let n=c.geo.zw;let vn=dot(n,pointVelocity(a,ra,true)-pointVelocity(b,rb,true));if(vn>=-cfg.threshold){return;}
 let ta=cross2(ra,n);let tb=cross2(rb,n);let k=invMass(a)+invMass(b)+ta*ta*invMoment(a)+tb*tb*invMoment(b);if(k<=0.){return;}
 bounce[i]=Bounce(0.,0.,-e*vn,k,vec4f(ra,0.,0.),vec4f(rb,0.,0.));
}
@compute @workgroup_size(64) fn pairs(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=min(counters[C_CONTACTS],cfg.capacity)){return;}var s=bounce[i];if(s.inverseMass<=0.){return;}
 let c=contacts[i];let a=c.ids.x;let b=c.ids.y;let vn=dot(c.geo.zw,pointVelocity(a,s.rA.xy,false)-pointVelocity(b,s.rB.xy,false));
 let degree=max(1u,max(adj[a+1u]-adj[a],adj[b+1u]-adj[b]));let impulse=max(0.,s.impulse+(s.reboundSpeed-vn)/(s.inverseMass*f32(degree)));
 s.delta=impulse-s.impulse;s.impulse=impulse;bounce[i]=s;
}
@compute @workgroup_size(64) fn apply(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=cfg.count||bodies[i].shape.z<=0.){return;}var dv=vec3f(0.);
 for(var j=adj[i];j<adj[i+1u];j++){let key=adj[cfg.list+j];if(key<cfg.joints){continue;}let c=contacts[key-cfg.joints];let s=bounce[key-cfg.joints];if(s.inverseMass<=0.){continue;}
 let isA=i==c.ids.x;let impulse=c.geo.zw*s.delta*select(-1.,1.,isA);dv+=vec3f(impulse*invMass(i),cross2(select(s.rB.xy,s.rA.xy,isA),impulse)*invMoment(i));}
 velocities[i].linear+=vec4f(dv,0.);
}
@compute @workgroup_size(64) fn writeBack(@builtin(global_invocation_id) id:vec3u){let i=id.x;if(i>=cfg.count||bodies[i].shape.z<=0.){return;}bodies[i].vel=velocities[i].linear;}
`;var jo=class extends wr{constructor(e){super(e,{code:nd,dimension:2})}};function Oc(s){for(let e of["warmStartJoints","warmStartBodies","primal","primalScan","dual","refreshStick","updateVelocities"]){let t=`fn ${e}(@builtin(global_invocation_id) gid: vec3u) {`;if(s.split(t).length!==2)throw Error(`Pinned 2D ${e} signature changed; review the step guard`);s=s.replace(t,`${t}
  if (counters[C_OVERFLOW] != 0u || counters[C_CLASHES] != 0u) { return; }`)}return s}function Rn(s){let e="if (col == NO_COLOR) { col = params.colorCap - 1u; }";if(s.split(e).length!==2)throw Error("Pinned 2D color-count layout changed; review the capacity guard");return s.replace(e,`${e}
    if (col >= params.colorCap) { atomicAdd(&counters[C_CLASHES], 1u); }`)}var Tc=`// Sleeping is scheduling metadata in velocity.w; physical mass and inertia stay intact.
struct Body {pose:vec4f,initial:vec4f,inertial:vec4f,vel:vec4f,prev:vec4f,shape:vec4f}
struct Joint {pen:vec4f,lam:vec4f,stiff:vec4f,fmin:vec4f,fmax:vec4f,frac:vec4f,c0:vec4f,anchors:vec4f,param:vec4f}
struct Contact {ids:vec4u,pl:vec4f,anchors:vec4f,geo:vec4f,misc:vec4f}
struct State {quiet:f32,eligible:u32,flags:atomic<u32>,pad:u32}
struct Config {count:u32,joints:u32,capacity:u32,wake:u32,speed:f32,delay:f32,dt:f32,gravity:f32}
@group(0) @binding(0) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(1) var<storage,read_write> states:array<State>;
@group(0) @binding(2) var<storage,read> info:array<vec4i>;
@group(0) @binding(3) var<storage,read> joints:array<Joint>;
@group(0) @binding(4) var<storage,read> contacts:array<Contact>;
@group(0) @binding(5) var<storage,read> counters:array<u32>;
@group(0) @binding(6) var<storage,read_write> globals:array<atomic<u32>>;
@group(0) @binding(7) var<uniform> cfg:Config;
fn asleep(i:u32)->bool{return bodies[i].vel.w!=0.;}
fn speed(i:u32)->f32{return length(bodies[i].vel.xy)+abs(bodies[i].vel.z)*.5*length(bodies[i].shape.xy);}
fn wake(i:u32){bodies[i].vel.w=0.;states[i].quiet=0.;}
fn failed()->bool{return counters[3]!=0u||counters[4]!=0u;}
@compute @workgroup_size(1) fn clear(){atomicStore(&globals[0],0u);atomicStore(&globals[1],0u);}
@compute @workgroup_size(64) fn before(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=cfg.count){return;}atomicStore(&states[i].flags,0u);
 if(cfg.wake!=0u){wake(i);states[i].pad=0u;}else if(states[i].eligible==0u){wake(i);}
}
// Grounded quiet supports propagate upward between steps. Quiet time need not
// restart independently for every layer, and mutually floating boxes cannot seed it.
fn support(a:u32,b:u32){if(bodies[b].shape.z<=0.||asleep(b)||(states[b].pad!=0u&&speed(b)<=cfg.speed)){atomicOr(&states[a].flags,1u);}}
fn pointVelocity(i:u32,r:vec2f)->vec2f{return bodies[i].vel.xy+bodies[i].vel.z*vec2f(-r.y,r.x);}
fn rotate(angle:f32,p:vec2f)->vec2f{let c=cos(angle);let s=sin(angle);return vec2f(c*p.x-s*p.y,s*p.x+c*p.y);}
@compute @workgroup_size(64) fn contactsWake(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=min(counters[1],cfg.capacity)||failed()){return;}
 let c=contacts[i];if((c.ids.w&0x80000000u)!=0u){return;}
 let a=c.ids.x;let b=c.ids.y;let n=c.geo.zw;
 let va=pointVelocity(a,rotate(bodies[a].pose.z,c.anchors.xy));
 let vb=pointVelocity(b,rotate(bodies[b].pose.z,c.anchors.zw));
 if((asleep(a)||asleep(b))&&(dot(va-vb,n)<-2.*cfg.speed||c.geo.x<-.02||(!asleep(a)&&speed(a)>2.*cfg.speed)||(!asleep(b)&&speed(b)>2.*cfg.speed))){atomicStore(&globals[0],1u);}
 let up=select(1.,-1.,cfg.gravity>0.);
 if(n.y*up>.3){support(a,b);}if(n.y*up<-.3){support(b,a);}
}
@compute @workgroup_size(64) fn jointsWake(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=cfg.joints||failed()){return;}let e=info[i];let k=joints[i];
 if(e.x==0||all(k.stiff.xyz==vec3f(0.))){return;}
 let b=u32(e.z);
 // A powered motor never sleeps, even while holding against an angle stop.
 if(e.x==3&&k.fmax.x>0.){atomicOr(&states[b].flags,2u);if(e.y>=0){atomicOr(&states[u32(e.y)].flags,2u);}if(asleep(b)){atomicStore(&globals[0],1u);}return;}
 if(e.y>=0){let a=u32(e.y);if((asleep(a)&&speed(b)>2.*cfg.speed)||(asleep(b)&&speed(a)>2.*cfg.speed)){atomicStore(&globals[0],1u);}}
 if(e.x!=1&&e.x!=2){return;}
 if(e.x==1&&(k.stiff.x<1.e30||k.stiff.y<1.e30)){return;}
 if(e.y<0){atomicOr(&states[b].flags,1u);}else{let a=u32(e.y);support(a,b);support(b,a);}
}
@compute @workgroup_size(64) fn decide(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=cfg.count||failed()||!asleep(i)){return;}
 if(states[i].eligible==0u||(atomicLoad(&states[i].flags)&2u)!=0u||(cfg.gravity!=0.&&(atomicLoad(&states[i].flags)&1u)==0u)){atomicStore(&globals[0],1u);}
}
@compute @workgroup_size(64) fn applyWake(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=cfg.count||failed()){return;}if(atomicLoad(&globals[0])!=0u){wake(i);}
}
@compute @workgroup_size(64) fn rest(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=cfg.count||bodies[i].shape.z<=0.||failed()){return;}
 let flags=atomicLoad(&states[i].flags);
 states[i].pad=select(0u,1u,(flags&1u)!=0u&&speed(i)<=cfg.speed);
 if(states[i].eligible==0u||(flags&2u)!=0u){return;}
 if(!asleep(i)){
  if(speed(i)<=cfg.speed&&(cfg.gravity==0.||(flags&1u)!=0u)){states[i].quiet+=cfg.dt;}else{states[i].quiet=0.;}
  if(states[i].quiet>=cfg.delay){
   bodies[i].vel=vec4f(0.,0.,0.,1.);bodies[i].prev=vec4f(0.);
   bodies[i].initial=vec4f(bodies[i].pose.xyz,bodies[i].initial.w);
   bodies[i].inertial=vec4f(bodies[i].pose.xyz,0.);
  }
 }
 if(asleep(i)){atomicAdd(&globals[1],1u);}
}
`;function Go(s={}){if(s!==!0&&(typeof s!="object"||s===null))throw Error("sleeping must be a boolean or options object");let e=s.speedThreshold??.03,t=s.timeThreshold??.5;if(![e,t].every(i=>Number.isFinite(i)&&i>0))throw Error("Sleep thresholds must be positive and finite");return{speedThreshold:e,timeThreshold:t}}function jc(s){for(let e of["warmStartBodies","updateVelocities"])s=s.replace(`fn ${e}(@builtin(global_invocation_id) gid: vec3u) {`,`fn ${e}(@builtin(global_invocation_id) gid: vec3u) {
  if(gid.x<params.bodyCount && bodies[gid.x].vel.w!=0.){return;}`);return s.replace("fn solveBody(i: u32) {",`fn solveBody(i: u32) {
  if(bodies[i].vel.w!=0.){return;}`)}function Dc(s){return s.replace("return i >= 0 && bodies[i].shape.z > 0.0;","return i >= 0 && bodies[i].shape.z > 0.0 && bodies[i].vel.w==0.;")}var Do=class{constructor(e,t){this.gpu=e,this.device=e.device,this.options=Go(t);let i=this.device,r=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC;this.state=i.createBuffer({size:e.bodyCapacity*16,usage:r}),this.globals=i.createBuffer({size:8,usage:r}),this.params=i.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let o=i.createShaderModule({code:Tc});this.layout=i.createBindGroupLayout({entries:["storage","storage","read-only-storage","read-only-storage","read-only-storage","read-only-storage","storage","uniform"].map((l,c)=>({binding:c,visibility:GPUShaderStage.COMPUTE,buffer:{type:l}}))});let a=i.createPipelineLayout({bindGroupLayouts:[this.layout]});this.pipes=Object.fromEntries(["clear","before","contactsWake","jointsWake","decide","applyWake","rest"].map(l=>[l,i.createComputePipeline({layout:a,compute:{module:o,entryPoint:l}})]));let n=new Uint32Array(e.bodyCapacity*4);for(let l=0;l<e.bodyCount;l++)n[l*4+1]=e.sleepEligible?.get(l)===!1?0:1;i.queue.writeBuffer(this.state,0,n),this.wakeRequested=!1}register(e,t=!0){let i=oe(this.gpu);for(let r=0;r<4;r++)i.uint(this.state,e*4+r,r===1?Number(t):0);this.wakeRequested=!0}group(e){let t=this.gpu,i=[t.bodyBuffer,this.state,t.infoBuffer,t.jointBuffer,t.contactBuffers[e],t.counterBuffer,this.globals,this.params],r=this.groups?.find(o=>o.buffers.every((a,n)=>a===i[n]));return r||(r={buffers:i,group:this.device.createBindGroup({layout:this.layout,entries:i.map((o,a)=>({binding:a,resource:{buffer:o}}))})},this.groups=[...(this.groups??[]).slice(-1),r]),r.group}dispatch(e,t,i){e.setBindGroup(0,this.group(t));for(let[r,o]of i)o&&(e.setPipeline(this.pipes[r]),e.dispatchWorkgroups(Math.ceil(o/64)))}run(e,t){let i=t??this.device.createCommandEncoder(),r=i.beginComputePass();this.dispatch(r,1-this.gpu.parity,e),r.end(),t||this.device.queue.submit([i.finish()])}before(e){this.gpu.flushPropertyEdits(e);let t=this.gpu,i=this.paramData??=hi(8),{u:r,f:o}=i;r[0]=t.bodyCount,r[1]=t.jointCount,r[2]=t.contactCapacity,r[3]=Number(this.wakeRequested),o[4]=this.options.speedThreshold,o[5]=this.options.timeThreshold,o[6]=t.params.dt,o[7]=t.params.gravity,Qt(this.device,this.params,i),this.wakeRequested=!1,this.run([["clear",1],["before",t.bodyCount]],e)}encodeWake(e,t){let i=this.gpu;this.dispatch(e,t,[["contactsWake",i.contactCapacity],["jointsWake",i.jointCount],["decide",i.bodyCount],["applyWake",i.bodyCount]])}after(e){this.run([["rest",this.gpu.bodyCount]],e)}async readStats(){let e=new Uint32Array(await this.gpu.read(this.globals,8));return{sleeping:e[1],wakeRequested:this.wakeRequested||!!e[0]}}destroy(){this.gpu.propertyEdits?.forget(this.state),this.state.destroy(),this.globals.destroy(),this.params.destroy()}};var vt=s=>Math.ceil(s/64);function Gc(){this.staticsDirty&&this.uploadStatics();let s=this.params,e=s.postStabilize&&!s.vbd,t=s.vbd?0:s.alpha,i=s.iterations+(e?1:0);this.writeParams(t,e),this.writePassConstants(i,L=>e?L<s.iterations?1:0:t);let r=this.parity,o=this.bodyCapacity,a=this.bodyCount,n=this.jointCount,l=this.device.createCommandEncoder({label:"avbd2d step"});this.encodeStepPrelude?.(l),l.clearBuffer(this.gridBuffer,0,(2*this.tableSize+1)*4),l.clearBuffer(this.tableBuffer),l.clearBuffer(this.adjBuffer,0,(2*o+1)*4);let c=this.timingCallback!==null&&this.timing!==null,u,f,d=0,p=c||this.splitPasses,m=()=>{u&&!p||(u?.end(),u=l.beginComputePass({label:p?Se[d]:"avbd2d step",timestampWrites:c?{querySet:this.timing.querySet,beginningOfPassWriteIndex:2*d,endOfPassWriteIndex:2*d+1}:void 0}),f=void 0,d++)},h=this.groups,g=L=>{f!==L&&(u.setBindGroup(0,L),f=L)},b=(L,M,I)=>{I<=0||(u.setPipeline(this.pipes[L]),g(M),u.dispatchWorkgroups(I))},y=(L,M,I)=>{u.setPipeline(this.pipes[L]),g(M),u.dispatchWorkgroupsIndirect(this.argsBuffer,I*4)};m(),b("beginFrame",h.broad,1),b("argsPrev",h.args,1),y("hashInsert",h.contacts[r],6),b("gridCount",h.broad,vt(a)),this.gridScan.encode(u),f=void 0,b("gridScatter",h.broad,vt(a)),b("findPairs",h.broad,vt(a)),b("argsPairs",h.args,1),y("narrowphase",h.contacts[r],0),b("argsContacts",h.args,1),this.sleeping?.encodeWake(u,r),f=void 0,m(),b("degreeJoints",h.topo[r],vt(n)),y("degreeContacts",h.topo[r],3),this.adjScan.encode(u),f=void 0,b("fillJoints",h.topo[r],vt(n)),y("fillContacts",h.topo[r],3),b("sortAdjacency",h.topo[r],vt(a)),m(),b("colorCompact",h.topo[r],vt(a)),b("colorMark",h.topo[r],vt(a));for(let L=0;L<this.colorRounds;L++)b(L%2===0?"colorRoundAB":"colorRoundBA",h.topo[r],vt(a));b("colorCount",h.topo[r],this.colorGroups),this.colorHistScan.encode(u),f=void 0,b("colorStarts",h.topo[r],1),b("argsColors",h.args,1),b("colorScatter",h.topo[r],this.colorGroups),m();let A=this.colorCap+1,v=this.passOffsets??=[0],x=-1,w=L=>{L!==x&&(v[0]=L*256,u.setBindGroup(1,this.passGroup,v),x=L)};u.setBindGroup(0,h.solve[r]),w(0),n>0&&(u.setPipeline(this.pipes.warmStartJoints),u.dispatchWorkgroups(vt(n))),u.setPipeline(this.pipes.warmStartBodies),u.dispatchWorkgroups(vt(a));for(let L=0;L<i;L++){let M=this.primalMode==="scan";u.setPipeline(M?this.pipes.primalScan:this.pipes.primal);for(let I=0;I<this.colorCap;I++)w(L*A+I),M?u.dispatchWorkgroups(vt(a)):u.dispatchWorkgroupsIndirect(this.argsBuffer,(12+3*I)*4);L<s.iterations&&(w(L*A+this.colorCap),u.setPipeline(this.pipes.dual),u.dispatchWorkgroupsIndirect(this.argsBuffer,36)),L===s.iterations-1&&(u.setPipeline(this.pipes.updateVelocities),u.dispatchWorkgroups(vt(a)))}e&&(u.setPipeline(this.pipes.refreshStick),u.dispatchWorkgroupsIndirect(this.argsBuffer,12)),u.end();let B=2*Se.length;if(c){let{querySet:L,resolve:M,read:I}=this.timing;l.resolveQuerySet(L,0,B,M,0),l.copyBufferToBuffer(M,0,I,0,B*8)}if(this.parity=1-r,this.encodeStepPostlude?.(l),this.device.queue.submit([l.finish()]),c){let L=this.timingCallback;this.timingCallback=null,this.timingBusy=!0;let M=this.timing.read;M.mapAsync(GPUMapMode.READ).then(()=>{let I=new BigUint64Array(M.getMappedRange()).slice();if(M.unmap(),this.timingBusy=!1,this.destroyed)return this.releaseTiming();let E=(P,C)=>Number(I[C]-I[P])/1e6,k={total:E(0,B-1)};Se.forEach((P,C)=>k[P]=E(2*C,2*C+1)),L(k)},()=>{this.timingBusy=!1,this.destroyed&&this.releaseTiming()})}}var Fo=5;function ki({minAngle:s=-Math.PI,maxAngle:e=Math.PI}={}){if(!Number.isFinite(s)||!Number.isFinite(e)||s>e)throw Error("Angle limits require finite minAngle <= maxAngle, in radians");return{minAngle:s,maxAngle:e}}function Bs(s,e,t){let i=e*O;s.info[e*j]=Fo,s.data.set([1/0,1/0,0],i+Q),s.data.set([-1/0,0,0],i+_e),s.data.set([0,1/0,0],i+Ae),s.data[i+be]=t.minAngle,s.data[i+Ue]=t.maxAngle}function Fc(s){let e=s.topology;for(let t=0;t<e.jointCount;t++)e.info[t*j]===Fo&&s.device.queue.writeBuffer(s.jointBuffer,(t*36+32)*4,new Float32Array([e.data[t*O+re],e.data[t*O+be],e.data[t*O+Ue],0]))}var ws=(s,e,t)=>{if(s.split(e).length!==2)throw Error("Pinned 2D angular layout changed");return s.replace(e,t)};function Uc(s){return s=ws(s,"case T_JOINT: { return 3u; }",`case T_JOINT: { return 3u; }
    case 5: { return 2u; }`),s=ws(s,"fn jointRowsC(j: u32, alpha: f32) -> vec3f {",`
fn limitAngle2D(k:Joint,a:i32,b:i32)->f32 {
  var angleA=0.;if(a>=0){angleA=bodies[a].pose.z;}
  return angleA-bodies[b].pose.z-k.param.x;
}
fn limitRows2D(k:Joint,a:i32,b:i32,alpha:f32)->vec3f {
  let angle=limitAngle2D(k,a,b);
  return vec3f(angle-k.param.y,angle-k.param.z,0.)-alpha*k.c0.xyz;
}
`+`
fn jointRowsC(j: u32, alpha: f32) -> vec3f {`),s=ws(s,`  if (t == T_JOINT) {
    // Hard rows`,`  if(t==5){return limitRows2D(k,a,b,alpha);}
  if (t == T_JOINT) {
    // Hard rows`),s=ws(s,"  let C = jointRowsC(j, alpha);",`  let C = jointRowsC(j, alpha);
  if(t==5){
    // Unilateral rows only contribute while their force is active. Inside the
    // interval a hinge has no angular stiffness and remains free to rotate.
    let F=clamp(k.pen.xyz*C+k.lam.xyz,k.fmin.xyz,k.fmax.xyz);
    if(F.x!=0.){addRow(acc,vec3f(0.,0.,sg),vec3f(0.),C.x,k.pen.x,k.lam.x,k.stiff.x,k.fmin.x,k.fmax.x);}
    if(F.y!=0.){addRow(acc,vec3f(0.,0.,sg),vec3f(0.),C.y,k.pen.y,k.lam.y,k.stiff.y,k.fmin.y,k.fmax.y);}
    return;
  }`),s=ws(s,"  if (t == T_JOINT) { k.c0 = vec4f(jointC(k, info[j].y, info[j].z), 0.0); }",`  if (t == T_JOINT) { k.c0 = vec4f(jointC(k, info[j].y, info[j].z), 0.0); }
  if(t==5){let angle=limitAngle2D(k,info[j].y,info[j].z);k.c0=vec4f(min(0.,angle-k.param.y),max(0.,angle-k.param.z),0.,0.);}`),s}var Nc=`// Analytic circles and capsules, finite two-sided segments and solid half-space planes.
// Kind 4 stores bounding radius, vertex-record offset and vertex count.
@group(0) @binding(7) var<storage,read> geometry:array<vec4f>;
struct Face2D { a:vec2f, b:vec2f, feature:u32 }
struct Axis2D { gap:f32, normal:vec2f }
fn inverse2D(angle:f32,p:vec2f)->vec2f { return rot(-angle,p); }
fn spine2D(i:u32)->Face2D {
 let b=bodies[i];let half=geometry[i].z;
 let extent=rot(b.pose.z,vec2f(half,0.));
 return Face2D(b.pose.xy-extent,b.pose.xy+extent,0u);
}
fn nearest2D(a:vec2f,b:vec2f,p:vec2f)->vec2f {
 let edge=b-a;return a+edge*clamp(dot(p-a,edge)/max(dot(edge,edge),1e-20),0.,1.);
}
fn vertex2D(i:u32,k:u32)->vec2f {
 if(geometry[i].x==4.){return bodies[i].pose.xy+rot(bodies[i].pose.z,geometry[u32(geometry[i].z)+k].xy);}
 let b=bodies[i];let half=b.shape.xy*.5;
 let bits=select(k,5u-k,k>=2u);
 return b.pose.xy+rot(b.pose.z,vec2f(select(-half.x,half.x,(bits&1u)!=0u),select(-half.y,half.y,(bits&2u)!=0u)));
}
fn polygon2D(i:u32)->bool{return geometry[i].x==0.||geometry[i].x==4.;}
fn vertices2D(i:u32)->u32{return select(4u,u32(geometry[i].w),geometry[i].x==4.);}
fn edge2D(i:u32,k:u32)->Face2D{return Face2D(vertex2D(i,k),vertex2D(i,(k+1u)%vertices2D(i)),k+1u);}
fn outward2D(face:Face2D)->vec2f{let e=face.b-face.a;return normalize(vec2f(e.y,-e.x));}
fn facing2D(i:u32,n:vec2f)->Face2D{
 var best= -3.4e38;var face=edge2D(i,0u);
 for(var k=0u;k<vertices2D(i);k++){let f=edge2D(i,k);let score=dot(outward2D(f),n);if(score>best){best=score;face=f;}}
 return face;
}
// Support may be an entire face. Keeping two points gives flat contacts a stable torque arm.
fn support2D(i:u32,n:vec2f)->Face2D {
 let b=bodies[i];let g=geometry[i];let local=inverse2D(b.pose.z,n);
 if(g.x==1.) { let p=b.pose.xy+n*g.y;return Face2D(p,p,1u); }
 if(g.x==2.) {
  let s=spine2D(i);let offset=n*g.y;
  if(abs(local.x)<1e-5){return Face2D(s.a+offset,s.b+offset,3u);}
  let p=select(s.a,s.b,local.x>0.)+offset;
  return Face2D(p,p,select(1u,2u,local.x>0.));
 }
 if(g.x==4.) {
  var best= -3.4e38;var v=0u;
  for(var k=0u;k<u32(g.w);k++){let score=dot(geometry[u32(g.z)+k].xy,local);if(score>best){best=score;v=k;}}
  let next=(v+1u)%u32(g.w);let prev=(v+u32(g.w)-1u)%u32(g.w);
  let tolerance=1e-6*max(g.y,1e-6);
  if(abs(dot(geometry[u32(g.z)+next].xy,local)-best)<tolerance){return edge2D(i,v);}
  if(abs(dot(geometry[u32(g.z)+prev].xy,local)-best)<tolerance){return edge2D(i,prev);}
  let p=vertex2D(i,v);return Face2D(p,p,65u+v);
 }
 let h=b.shape.xy*.5;let sx=select(-1.,1.,local.x>0.);let sy=select(-1.,1.,local.y>0.);
 var a=vec2f(sx*h.x,sy*h.y);var c=a;var key=1u+select(0u,1u,local.x>0.)+select(0u,2u,local.y>0.);
 if(abs(local.x)<1e-5){a.x=-h.x;c.x=h.x;key=select(5u,6u,local.y>0.);}
 else if(abs(local.y)<1e-5){a.y=-h.y;c.y=h.y;key=select(7u,8u,local.x>0.);}
 return Face2D(b.pose.xy+rot(b.pose.z,a),b.pose.xy+rot(b.pose.z,c),key);
}
fn consider2D(a:u32,b:u32,axis:vec2f,best:ptr<function,Axis2D>) {
 let len=length(axis);if(len<1e-8){return;}let n=axis/len;
 let gap=dot(support2D(a,-n).a-support2D(b,n).a,n);
 let reverse=dot(support2D(b,-n).a-support2D(a,n).a,n);
 var signed=gap;var normal=n;if(reverse>gap){signed=reverse;normal=-n;}
 if(signed>(*best).gap+1e-6){(*best)=Axis2D(signed,normal);}
}
fn closestSpines2D(a:Face2D,b:Face2D)->vec2f {
 let u=a.b-a.a;let v=b.b-b.a;let w=a.a-b.a;
 let aa=dot(u,u);let bb=dot(u,v);let cc=dot(v,v);let dd=dot(u,w);let ee=dot(v,w);
 var s=0.;var t=0.;
 if(aa<1e-16&&cc<1e-16){return w;}
 if(aa<1e-16){t=clamp(ee/cc,0.,1.);}
 else if(cc<1e-16){s=clamp(-dd/aa,0.,1.);}
 else {
  let denominator=aa*cc-bb*bb;
  if(denominator>1e-8*aa*cc){s=clamp((bb*ee-cc*dd)/denominator,0.,1.);}
  t=(bb*s+ee)/cc;
  if(t<0.){t=0.;s=clamp(-dd/aa,0.,1.);}
  else if(t>1.){t=1.;s=clamp((bb-dd)/aa,0.,1.);}
 }
 return a.a+u*s-b.a-v*t;
}
fn onFace2D(face:Face2D,tangent:vec2f,coordinate:f32)->vec2f {
 let delta=dot(face.b-face.a,tangent);
 if(abs(delta)<1e-8){return face.a;}
 return mix(face.a,face.b,clamp((coordinate-dot(face.a,tangent))/delta,0.,1.));
}
fn contact2D(a:u32,b:u32,wa:vec2f,wb:vec2f,n:vec2f,key:u32)->ContactOut {
 return ContactOut(key,inverse2D(bodies[a].pose.z,wa-bodies[a].pose.xy),inverse2D(bodies[b].pose.z,wb-bodies[b].pose.xy),n);
}
// Clip the incident edge to the reference face, preserving two independent torque arms.
fn polygonContacts2D(a:u32,b:u32,n:vec2f)->Collision {
 var out:Collision;
 let fa=facing2D(a,-n);let fb=facing2D(b,n);
 let referenceA=dot(outward2D(fa),-n)>=dot(outward2D(fb),n);
 var referenceFace=fb;if(referenceA){referenceFace=fa;}let rn=outward2D(referenceFace);
 let incident=facing2D(select(a,b,referenceA),-rn);
 let tangent=normalize(referenceFace.b-referenceFace.a);let extent=length(referenceFace.b-referenceFace.a);
 let start=dot(incident.a-referenceFace.a,tangent);let delta=dot(incident.b-incident.a,tangent);
 var lo=0.;var hi=1.;
 if(abs(delta)<1e-8){if(start<0.||start>extent){return out;}}
 else{let u=-start/delta;let v=(extent-start)/delta;lo=max(0.,min(u,v));hi=min(1.,max(u,v));if(lo>hi){return out;}}
 let count=select(1u,2u,(hi-lo)*length(incident.b-incident.a)>1e-6);
 for(var k=0u;k<count;k++){
  let point=mix(incident.a,incident.b,select(lo,hi,k==1u));let gap=dot(point-referenceFace.a,rn);
  if(gap>1e-6){continue;}let projected=point-rn*gap;
  let wa=select(point,projected,referenceA);let wb=select(projected,point,referenceA);
  out.c[out.count]=contact2D(a,b,wa,wb,n,0x30000000u|(referenceFace.feature<<8u)|(incident.feature<<16u)|select(0u,4u,referenceA)|k);out.count++;
 }
 return out;
}
fn planeContacts2D(a:u32,b:u32)->Collision {
 var out:Collision;let planeA=geometry[a].x==3.;let p=select(b,a,planeA);let other=select(a,b,planeA);
 if(geometry[other].x==3.){return out;}
 let n=rot(bodies[p].pose.z,vec2f(0.,1.));let origin=bodies[p].pose.xy;
 let face=support2D(other,-n);let count=select(1u,2u,length(face.b-face.a)>1e-6);
 for(var k=0u;k<count;k++) {
  let point=select(face.a,face.b,k==1u);let gap=dot(point-origin,n);
  if(gap>0.){continue;}let onPlane=point-n*gap;
  let wa=select(point,onPlane,planeA);let wb=select(onPlane,point,planeA);
  out.c[out.count]=contact2D(a,b,wa,wb,select(n,-n,planeA),0x20000000u|(face.feature<<8u)|k);
  out.count++;
 }
 return out;
}
fn collideShapes2D(a:u32,b:u32)->Collision {
 let ga=geometry[a];let gb=geometry[b];let A=bodies[a];let B=bodies[b];
 if(ga.x==0.&&gb.x==0.){return collideBoxes(A.pose.xyz,A.shape.xy*.5,B.pose.xyz,B.shape.xy*.5);}
 if(ga.x==3.||gb.x==3.){return planeContacts2D(a,b);}
 var out:Collision;var best=Axis2D(-3.4e38,vec2f(0.,1.));
 // Face normals plus vertex-to-spine directions are the complete SAT axes for a box
 // versus a swept disk. Two swept disks use their closest spines and side normals.
 for(var side=0u;side<2u;side++) {
  let i=select(a,b,side==1u);let j=select(b,a,side==1u);let g=geometry[i];
  if(polygon2D(i)) {
   for(var k=0u;k<vertices2D(i);k++){consider2D(a,b,outward2D(edge2D(i,k)),&best);}
   if(!polygon2D(j)) {
    let spine=spine2D(j);
    for(var k=0u;k<vertices2D(i);k++){let v=vertex2D(i,k);consider2D(a,b,v-nearest2D(spine.a,spine.b,v),&best);}
   }
  } else if(g.x==2.&&g.z>0.){consider2D(a,b,rot(bodies[i].pose.z,vec2f(0.,1.)),&best);}
 }
 if(!polygon2D(a)&&!polygon2D(b)){consider2D(a,b,closestSpines2D(spine2D(a),spine2D(b)),&best);}
 if(best.gap== -3.4e38){consider2D(a,b,vec2f(0.,1.),&best);}
 if(best.gap>0.){return out;}
 if(polygon2D(a)&&polygon2D(b)){return polygonContacts2D(a,b,best.normal);}
 let n=best.normal;let tangent=vec2f(-n.y,n.x);let fa=support2D(a,-n);let fb=support2D(b,n);
 let ta=vec2f(dot(fa.a,tangent),dot(fa.b,tangent));let tb=vec2f(dot(fb.a,tangent),dot(fb.b,tangent));
 let lo=max(min(ta.x,ta.y),min(tb.x,tb.y));let hi=min(max(ta.x,ta.y),max(tb.x,tb.y));
 // At a rounded corner both faces reduce to points, whose tangent projections coincide.
 let count=select(1u,2u,hi-lo>1e-5);
 for(var k=0u;k<count;k++) {
  let coordinate=select(lo,hi,k==1u);
  out.c[k]=contact2D(a,b,onFace2D(fa,tangent,coordinate),onFace2D(fb,tangent,coordinate),n,
    0x10000000u|(fa.feature<<8u)|(fb.feature<<16u)|k);
 }
 out.count=count;return out;
}
`;var On=new WeakMap,Gr=(s,e,t=!1)=>{if(!Number.isFinite(s)||(t?s<0:s<=0))throw Error(`${e} must be ${t?"nonnegative":"positive"} and finite`);return s},Uo=(s,e)=>{if(!s||s.length!==2||!Array.from(s).every(Number.isFinite))throw Error(`${e} requires two finite components`);return Array.from(s)},ei=s=>On.get(s);function No(s){let e=Array.from(s??[]),t=typeof e[0]=="number"?e:e.flatMap(w=>Uo(w,"Hull point"));if(t.length<6||t.length%2||!t.every(Number.isFinite))throw Error("A 2D hull requires finite xy pairs spanning an area");let i=[];for(let w=0;w<t.length;w+=2)i.push([t[w],t[w+1]]);i.sort((w,B)=>w[0]-B[0]||w[1]-B[1]);let r=i.filter((w,B)=>!B||w[0]!==i[B-1][0]||w[1]!==i[B-1][1]),o=(w,B,L)=>(B[0]-w[0])*(L[1]-w[1])-(B[1]-w[1])*(L[0]-w[0]),a=w=>{let B=[];for(let L of w){for(;B.length>1&&o(B.at(-2),B.at(-1),L)<=0;)B.pop();B.push(L)}return B.slice(0,-1)},n=[...a(r),...a([...r].reverse())];if(n.length<3||n.length>32)throw Error("A 2D hull needs 3\u201332 boundary vertices spanning an area");let l=n[0],c=n.map(w=>[w[0]-l[0],w[1]-l[1]]),u=0,f=0,d=0;for(let w=0;w<c.length;w++){let B=c[w],L=c[(w+1)%c.length],M=B[0]*L[1]-L[0]*B[1];u+=M,f+=(B[0]+L[0])*M,d+=(B[1]+L[1])*M}if(!(u>0)||!Number.isFinite(u))throw Error("Hull area must be positive and finite");f/=3*u,d/=3*u;let p=c.map(w=>[w[0]-f,w[1]-d]),m=0,h=0,g=0,b=0,y=[];for(let w=0;w<p.length;w++){let B=p[w],L=p[(w+1)%p.length],M=B[0]*L[1]-L[0]*B[1];m+=M*(B[0]*B[0]+B[0]*L[0]+L[0]*L[0]+B[1]*B[1]+B[1]*L[1]+L[1]*L[1])/12;let I=L[0]-B[0],E=L[1]-B[1],k=Math.hypot(I,E);y.push(B[0],B[1],E/k,-I/k),h=Math.max(h,Math.hypot(...B)),g=Math.max(g,Math.abs(B[0])),b=Math.max(b,Math.abs(B[1]))}let A=u/2,v=m/A;if(![A,v,h,g,b,...y].every(w=>Number.isFinite(Math.fround(w)))||Math.fround(A)<=0||Math.fround(v)<=0)throw Error("Hull geometry exceeds GPU floating-point range");let x=[4,h,0,p.length];return x.vertices=y,{geometry:x,size:[2*g,2*b],area:A,momentPerMass:v,radius:h}}function qo(s){let e=Gr(s,"radius");return{geometry:[1,e,0,0],size:[2*e,2*e],area:Math.PI*e*e,momentPerMass:e*e/2,radius:e}}function Vo(s,e){let t=Gr(s,"radius");if(Gr(e,"length"),e<2*t)throw Error("Capsule length must be at least twice its radius");return qc((e-2*t)/2,t)}function qc(s,e){let t=2*s,i=2*e*t,r=Math.PI*e*e,o=i+r,a=i*(t*t+4*e*e)/12+r*(t*t/4+e*e/2+4*t*e/(3*Math.PI));return{geometry:[2,e,s,0],size:[t+2*e,Math.max(2*e,1e-6)],area:o,momentPerMass:o?a/o:0,radius:s+e}}function Wo(s,e,t={}){let i=Uo(s,"start"),r=Uo(e,"end"),o=r[0]-i[0],a=r[1]-i[1],n=Math.hypot(o,a),l=Gr(t.radius??0,"radius",!0);if(Gr(n,"segment length"),t.position!==void 0||t.angle!==void 0)throw Error("Segment position and angle come from its endpoints");if(l===0&&(t.density??0)!==0)throw Error("A zero-thickness segment must be static; give it a radius for a dynamic capsule");return{...qc(n/2,l),options:{...t,density:t.density??0,position:[(i[0]+r[0])/2,(i[1]+r[1])/2],angle:Math.atan2(a,o)}}}function Ho(s,e=0,t={}){let i=Uo(s,"normal"),r=Gr(Math.hypot(...i),"normal length");if(!Number.isFinite(e))throw Error("Plane offset must be finite");if((t.density??0)!==0)throw Error("An infinite plane must be static");if(t.position!==void 0||t.angle!==void 0)throw Error("Plane position and angle come from its normal and offset");let o=i[0]/r,a=i[1]/r;return{geometry:[3,0,0,0],size:[1,1],area:0,momentPerMass:0,radius:0,options:{...t,density:0,position:[o*e,a*e],angle:Math.atan2(-o,a)}}}function Fr(s,e,t,i){let r=On.get(s);r||On.set(s,r=new Map),r.set(e,t.geometry);let o=t.area*i,a=e*4;s.shape[a+2]=o,s.shape[a+3]=o*t.momentPerMass,s.props[a+1]=t.radius,s.dynamic[e]=+(o>0)}var Vc=`struct Body {pose:vec4f,initial:vec4f,inertial:vec4f,velocity:vec4f,previous:vec4f,shape:vec4f}
struct Command { header:vec4u, value:vec4f, point:vec4f }
@group(0) @binding(0) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(1) var<storage,read> commands:array<Command>;
@group(0) @binding(2) var<storage,read> ranges:array<vec2u>;
// Each invocation owns one body; commands for that body execute in submission order.
@compute @workgroup_size(64)
fn edit(@builtin(global_invocation_id) id:vec3u) {
 let i=id.x+id.y*DISPATCH_STRIDE;
 if(i>=arrayLength(&ranges)){return;}
 let range=ranges[i];let index=commands[range.x].header.x;var b=bodies[index];
 for(var k=range.x;k<range.x+range.y;k++) {
  let c=commands[k];let kind=c.header.y;
  if(kind==0u){b.velocity=vec4f(c.value.xy,b.velocity.zw);}
  else if(kind==1u){b.velocity.z=c.value.x;}
  else if(kind==2u||kind==3u) {
   if(b.shape.z>0.) {
    let impulse=c.value.xy*select(1.,c.value.w,kind==3u);
    b.velocity=vec4f(b.velocity.xy+impulse/b.shape.z,b.velocity.zw);
    if(c.header.z!=0u&&b.shape.w>0.) {
     let arm=c.point.xy-b.pose.xy;
     b.velocity.z+=(arm.x*impulse.y-arm.y*impulse.x)/b.shape.w;
    }
   }
  } else if(kind==5u||kind==6u) {
   if(b.shape.w>0.){b.velocity.z+=c.value.x*select(1.,c.value.w,kind==6u)/b.shape.w;}
  } else if(kind==4u) {
   b.pose=vec4f(c.value.xy,select(b.pose.z,c.value.z,c.header.z!=0u),b.pose.w);
   b.initial=vec4f(b.pose.xyz,b.initial.w);b.inertial=vec4f(b.pose.xyz,0.);
   // Contacts from before the teleport must not supply old friction anchors or forces.
   b.previous.w=1.;
  }
 }
 bodies[index]=b;
}
\r
`;function Vt(s,e){let t=s&&typeof s.x=="number"?[s.x,s.y]:Array.isArray(s)||ArrayBuffer.isView(s)&&!(s instanceof DataView)?s:Array.from(s??[]);if(t.length!==2||!t.every(Number.isFinite))throw Error(`${e} requires two finite components`);return t}var ti=class{constructor(){this.count=0,this.capacity=0}reserve(e){if(e<=this.capacity)return;let t=Math.max(e,this.capacity*2,64),i=new ArrayBuffer(t*48),r=new Float32Array(i),o=new Uint32Array(i);this.u32&&o.set(this.u32.subarray(0,this.count*12)),this.words=r,this.u32=o,this.capacity=t}append(e,t,i,r,o=!1){this.reserve(this.count+1),Wc(this.words,this.u32,this.count++*12,e,t,i,r,o)}};function Wc(s,e,t,i,r,o,a,n){e[t]=i,e[t+1]=r,e[t+2]=Number(n),e[t+3]=0;for(let l=0;l<4;l++)s[t+4+l]=o[l]??0,s[t+8+l]=a?.[l]??0}var Ur=class{constructor(e,t=Vc,i=2){this.solver=e,this.shader=t,this.dimension=i,this.pending=new Map,this.queue=new ti,this.requested=0,this.linearOnly=!0,this.angularOnly=!0,this.hasTeleports=!1,this.motionOnly=!0,this.freeRanges=[]}slot(e,t){this.requested++,this.linearOnly&&=t===0,this.angularOnly&&=t===1,this.motionOnly&&=t===0||t===1,this.hasTeleports||=t===4;let i=this.pending.get(e);if(i&&(t===0||t===1)&&this.queue.u32[i.tail*12+1]===t)return i.tail;if(this.queue.reserve(this.queue.count+1),!this.next||this.next.length<this.queue.capacity){let o=new Int32Array(this.queue.capacity);this.next&&o.set(this.next),this.next=o}let r=this.queue.count++;return this.next[r]=-1,i?(this.next[i.tail]=r,i.tail=r,i.length++):(i=this.freeRanges.pop()??{},i.head=i.tail=r,i.length=1,this.pending.set(e,i)),r}enqueue(e,t,i,r,o=!1){let a=this.slot(e,t);Wc(this.queue.words,this.queue.u32,a*12,e,t,i,r,o)}enqueueValidated(e){for(let t=0;t<e.count;t++){let i=t*12,r=this.slot(e.u32[i],e.u32[i+1])*12;for(let o=0;o<12;o++)this.queue.u32[r+o]=e.u32[i+o]}}flush(e){if(!this.pending.size)return;let t=this.solver.device,i=this.pending.size;if(this.linearOnly||this.angularOnly){let r=this.angularOnly&&this.dimension===2?1:this.dimension;if(!this.linearIndices||this.linearIndices.length<i){let l=Math.max(i,(this.linearIndices?.length??0)*2,64);this.linearIndices=new Uint32Array(l),this.linearValues=new Float32Array(l*this.dimension)}let o=0;for(let[l,c]of this.pending){this.linearIndices[o]=l;for(let u=0;u<r;u++)this.linearValues[o*r+u]=this.queue.words[c.tail*12+4+u];o++}let a=this.angularOnly?"angularVelocityBatch":"velocityBatch",n=this.solver[a]??=new Kt(this.solver,this.dimension,this.angularOnly?"angular":"linear");n.submitValidated(this.linearIndices.subarray(0,i),this.linearValues.subarray(0,i*r),e),this.lastBatch={bodies:i,commands:this.queue.count,requestedCommands:this.requested,uploadedBytes:n.lastBatch.uploadedBytes,path:this.angularOnly?"packed-angular-velocities":"packed-velocities",submissions:e?0:1}}else if(this.motionOnly){let r=this.motionBatch??=new yi(this.solver,this.dimension),o=r.wordsPerBody;(!this.motionData||this.motionData.length<i*o)&&(this.motionData=new Uint32Array(Math.max(i*o,(this.motionData?.length??0)*2,64*o)),this.motionFloats=new Float32Array(this.motionData.buffer));let a=0;for(let[n,l]of this.pending){let c=a++*o;this.motionData[c]=n;let u=0;for(let f=l.head;f!==-1;f=this.next[f]){let d=this.queue.u32[f*12+1];u|=1<<d;let p=c+(d===0?2:2+this.dimension),m=d===0||this.dimension===3?this.dimension:1;for(let h=0;h<m;h++)this.motionFloats[p+h]=this.queue.words[f*12+4+h]}this.motionData[c+1]=u}r.submitValidated(this.motionData.subarray(0,i*o),e),this.lastBatch={bodies:i,commands:this.queue.count,requestedCommands:this.requested,uploadedBytes:r.lastBatch.uploadedBytes,path:"packed-motion",submissions:e?0:1}}else{this.upload??=new ti,this.upload.count=0,this.upload.reserve(this.queue.count),(!this.rangeData||this.rangeData.length<i*2)&&(this.rangeData=new Uint32Array(Math.max(i*2,(this.rangeData?.length??0)*2,128)));let r=0,o=0;for(let p of this.pending.values()){this.rangeData[o++]=r,this.rangeData[o++]=p.length;for(let m=p.head;m!==-1;m=this.next[m]){for(let h=0;h<12;h++)this.upload.u32[r*12+h]=this.queue.u32[m*12+h];r++}}let a=r*48,n=i*8,l=Math.min(t.limits.maxStorageBufferBindingSize,t.limits.maxBufferSize);if(a>l||n>l)throw Error("Body command batch exceeds GPU buffer limits");for(let[p,m]of[["commands",a],["ranges",n]])(!this[p]||this[p].size<m)&&(this[p]?.destroy(),this[p]=t.createBuffer({size:Math.min(l,Math.max(m*2,16)),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}));t.queue.writeBuffer(this.commands,0,this.upload.words.buffer,0,a),t.queue.writeBuffer(this.ranges,0,this.rangeData.buffer,0,n),this.pipeline??=t.createComputePipeline({layout:"auto",compute:{entryPoint:"edit",module:t.createShaderModule({code:"const DISPATCH_STRIDE = "+t.limits.maxComputeWorkgroupsPerDimension*64+`u;
`+this.shader})}}),(!this.group||this.boundBody!==this.solver.bodyBuffer||this.boundCommands!==this.commands||this.boundRanges!==this.ranges||this.boundRangeBytes!==n)&&(this.group=t.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.solver.bodyBuffer}},{binding:1,resource:{buffer:this.commands}},{binding:2,resource:{buffer:this.ranges,size:n}}]}),this.boundBody=this.solver.bodyBuffer,this.boundCommands=this.commands,this.boundRanges=this.ranges,this.boundRangeBytes=n);let c=e??t.createCommandEncoder(),u=c.beginComputePass();u.setPipeline(this.pipeline),u.setBindGroup(0,this.group);let f=Math.ceil(i/64),d=t.limits.maxComputeWorkgroupsPerDimension;u.dispatchWorkgroups(Math.min(f,d),Math.ceil(f/d)),u.end(),this.encodeAfterEdits(c,i),e||t.queue.submit([c.finish()]),this.lastBatch={bodies:i,commands:r,requestedCommands:this.requested,uploadedBytes:a+n,path:"ordered-commands",submissions:e?0:1}}for(let r of this.pending.values())this.freeRanges.push(r);this.pending.clear(),this.queue.count=0,this.requested=0,this.linearOnly=!0,this.angularOnly=!0,this.motionOnly=!0,this.hasTeleports=!1}encodeAfterEdits(){}destroy(){this.commands?.destroy(),this.ranges?.destroy(),this.solver.velocityBatch?.destroy(),this.solver.angularVelocityBatch?.destroy(),this.motionBatch?.destroy(),this.freeRanges.length=0,this.pending.clear(),this.queue=this.upload=this.next=this.linearIndices=this.linearValues=this.rangeData=this.motionData=this.motionFloats=null,this.group=null}};var $o=class extends To{writeParams(e,t){lc.call(this,e,t)}writePassConstants(e,t){fo.call(this,e,t)}createPipelines(){let e=this.layouts;this.compile(ys,[e.broad],["beginFrame","gridCount","gridScatter","findPairs"]),this.compile(vs,[e.contacts],["hashInsert","narrowphase"]),this.compile(Qr,[e.topo],["degreeJoints","degreeContacts","fillJoints","fillContacts","sortAdjacency","colorCompact","colorMark","colorRoundAB","colorRoundBA","colorCount","colorStarts","colorScatter"]),this.compile(xs,[e.solve,e.pass],["warmStartJoints","warmStartBodies","primal","primalScan","dual","refreshStick","updateVelocities"]),this.compile(qs,[e.args],["argsPrev","argsPairs","argsContacts","argsColors"])}constructor(e,t,i={}){if(i.minimumColors!==void 0&&(!Number.isInteger(i.minimumColors)||i.minimumColors<4||i.minimumColors>64))throw Error("minimumColors must be an integer from 4 to 64");i.sleeping!==void 0&&i.sleeping!==!1&&Go(i.sleeping),super(e,t,i),this.minimumColors=i.minimumColors??4,this.colorCap=Math.max(this.colorCap,this.minimumColors),this.sleepEligible=new Map(t.avbdSleepEligible??[]),Fc(this),ei(t)?.size&&this.enableShapes(),(i.sleeping||[...this.sleepEligible.values()].some(r=>r===!0))&&this.enableSleeping(i.sleeping||{})}enableShapes(){this.shapeBuffer||(this.syncShapeGeometry(),this.shapeContactLayout=this.makeLayout(["uniform","read-only-storage","read-only-storage","storage","read-only-storage","storage","storage","read-only-storage"]),this.compileBroadphase(),this.compileContacts(),this.bindContacts(),this.staticsDirty=!0)}geometryBytes(e=0){let t=(this.geometryRecords??this.bodyCapacity)*4+e;if(this.geometryRecords===void 0)for(let r of ei(this.topology)?.values()??[])t+=r.vertices?.length??0;let i=t*4;if(i>Math.min(this.device.limits.maxStorageBufferBindingSize,this.device.limits.maxBufferSize,16777216*16))throw Error("2D hull geometry exceeds this GPU's storage capacity");return i}syncShapeGeometry(){let e=this.geometryBytes(),t=new Float32Array(e/4);this.packedShapes=new Map;let i=this.bodyCapacity;for(let[r,o]of ei(this.topology)??[]){let a=Array.from(o);o.vertices&&(a[2]=i,t.set(o.vertices,i*4),i+=o.vertices.length/4),t.set(a,r*4),this.packedShapes.set(r,a)}this.geometryRecords=i,this.shapeBuffer=this.createShapeBuffer(e),this.device.queue.writeBuffer(this.shapeBuffer,0,t)}createShapeBuffer(e){let t=Math.min(this.device.limits.maxStorageBufferBindingSize,this.device.limits.maxBufferSize,268435456);return this.device.createBuffer({label:"2D collider geometry",size:Math.min(t,Math.max(e,Math.ceil(e*1.5/16)*16)),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}appendShapeGeometry(e,t){let i=this.geometryBytes(t.vertices?.length??0);if(this.shapeBuffer.size<i){let o=this.shapeBuffer;this.shapeBuffer=this.createShapeBuffer(i);let a=this.device.createCommandEncoder();a.copyBufferToBuffer(o,0,this.shapeBuffer,0,this.geometryRecords*16),this.device.queue.submit([a.finish()]),o.destroy(),this.bindFilters(),this.bindContacts()}let r=Array.from(t);t.vertices&&(r[2]=this.geometryRecords,this.device.queue.writeBuffer(this.shapeBuffer,this.geometryRecords*16,new Float32Array(t.vertices)),this.geometryRecords+=t.vertices.length/4),this.packedShapes.set(e,r),this.device.queue.writeBuffer(this.shapeBuffer,e*16,new Float32Array(r))}makeLayout(e){return this.device.createBindGroupLayout({entries:e.map((t,i)=>({binding:i,visibility:GPUShaderStage.COMPUTE,buffer:{type:t}}))})}contactSource(){let e=vs;return this.shapeBuffer&&(e=e.replace(`@compute @workgroup_size(64)
fn narrowphase`,Nc+`
@compute @workgroup_size(64)
fn narrowphase`).replace("let col = collideBoxes(A.pose.xyz, A.shape.xy * 0.5, B.pose.xyz, B.shape.xy * 0.5);","let col = collideShapes2D(a,b);")),this.sensorsEnabled&&(e=e.replace("rec.ids = vec4u(a, b, o.feature, 0u);","rec.ids = vec4u(a,b,o.feature,select(0u,0x80000000u,A.initial.w!=0.||B.initial.w!=0.));").replace("if (j >= 0) {","if (j >= 0 && rec.ids.w==0u && (prevContacts[j].ids.w&0x80000000u)==0u) {")),this.bodyCommands&&(e=e.replace("if (j >= 0","if (A.prevVel.w==0. && B.prevVel.w==0. && j >= 0")),e}compileContacts(){this.compile(this.contactSource(),[this.shapeContactLayout??this.layouts.contacts],["hashInsert","narrowphase"])}bindContacts(){this.shapeBuffer&&(this.groups.contacts=this.contactBuffers.map((e,t)=>this.device.createBindGroup({layout:this.shapeContactLayout,entries:[this.paramsBuffer,this.bodyBuffer,this.pairBuffer,e,this.contactBuffers[1-t],this.tableBuffer,this.counterBuffer,this.shapeBuffer].map((i,r)=>({binding:r,resource:{buffer:i}}))})))}compileBroadphase(){let e=["uniform","read-only-storage","storage","storage","storage","read-only-storage","read-only-storage"],t=ys;if(this.shapeBuffer&&(e.push("read-only-storage"),t=t.replace(`fn radius(i: u32) -> f32 {
  return 0.5 * length(bodies[i].shape.xy);
}`,`@group(0) @binding(7) var<storage,read> geometry:array<vec4f>;
fn radius(i:u32)->f32{let g=geometry[i];if(g.x==4.){return g.y;}if(g.x==1.||g.x==2.){return g.y+g.z;}return .5*length(bodies[i].shape.xy);}`).replace("return radius(i) > params.maxSmallRadius;","return geometry[i].x==3. || radius(i) > params.maxSmallRadius;").replace("if (dot(d, d) > r * r) { return; }",`if(geometry[a].x==3.||geometry[b].x==3.) {
let plane=select(b,a,geometry[a].x==3.);let other=select(a,b,geometry[a].x==3.);let normal=rot(bodies[plane].pose.z,vec2f(0.,1.));
if(dot(bodies[other].pose.xy-bodies[plane].pose.xy,normal)>radius(other)){return;}
} else if(dot(d,d)>r*r){return;}`)),this.filters){let i=e.length;e.push("read-only-storage"),t=t.replace("fn ignored(hi: u32, lo: u32) -> bool {",`@group(0) @binding(${i}) var<storage,read> filters:array<vec2u>;
fn ignored(hi:u32,lo:u32)->bool{
if((filters[hi].x&filters[lo].y)==0u || (filters[lo].x&filters[hi].y)==0u){return true;}`)}this.filterLayout=this.makeLayout(e),this.compile(t,[this.filterLayout],["beginFrame","gridCount","gridScatter","findPairs"]),this.bindFilters()}uploadBodies(e=0,t=this.topology.bodyCount-e){this.flushPropertyEdits(),super.uploadBodies(e,t);for(let o=e;o<e+t;o++)this.sleeping?.register(o,this.sleepEligible?.get(o)!==!1);if(!this.shapeBuffer&&!this.triggers?.size)return;let i=this.shapeBuffer&&t>0?new Float32Array(t*4):null,r=this.packedShapes;for(let o=e;o<e+t;o++){let a=r?.get(o);i&&a&&i.set(a,(o-e)*4),this.triggers?.has(o)&&this.device.queue.writeBuffer(this.bodyBuffer,o*96+28,new Float32Array([1]))}i&&this.device.queue.writeBuffer(this.shapeBuffer,e*16,i)}uploadStatics(){if(!this.shapeBuffer)return super.uploadStatics();let e=this.topology,t=ei(e),i=[];for(let f=0;f<this.bodyCount;f++)t?.get(f)?.[0]!==3&&i.push(e.props[f*4+1]);i.sort((f,d)=>f-d);let r=i[i.length>>1]??1,o=0,a=1/0;for(let f of i)f<=4*r&&(o=Math.max(o,f));for(let f of i)f>o&&(a=Math.min(a,f));let n=a===1/0?o*1.5:(o+a)/2;this.maxSmallRadius=n,this.cellSize=Math.max(2*o*(1+1e-4),.001);let l=[],c=[];for(let f=0;f<this.bodyCount;f++)(t?.get(f)?.[0]===3||e.props[f*4+1]>n)&&l.push(f);for(let f=0;f<e.jointCount;f++){let d=e.info[f*4+1],p=e.info[f*4+2];d>=0&&c.push([Math.max(d,p),Math.min(d,p),f])}for(let f of e.ignoredPairs()){let d=Math.floor(f/2097152);c.push([d,f-d*2097152,4294967295])}c.sort((f,d)=>f[0]-d[0]||f[1]-d[1]),this.largeCount=l.length,this.noCollideCount=c.length;let u=new Uint32Array(Math.max(l.length+3*c.length,4));u.set(l),c.forEach((f,d)=>u.set(f,l.length+3*d)),this.staticBuffer.size<u.byteLength&&(this.staticBuffer.destroy(),this.staticBuffer=this.device.createBuffer({label:"2D boundaries",size:u.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.rebuildBindings()),this.device.queue.writeBuffer(this.staticBuffer,0,u),this.staticsDirty=!1}async raycast(e,t,i={}){let[r]=await this.raycastAll([{origin:e,direction:t,maxDistance:i.maxDistance}],i);return r}raycastAll(e,t={}){return this.flushEdits(),this.shapeQueries??=new pi(this,2),this.shapeQueries.cast(e.map(i=>({...i,radius:0})),t)}async circleCast(e,t,i,r={}){let[o]=await this.circleCastAll([{origin:e,radius:t,direction:i,maxDistance:r.maxDistance}],r);return o}circleCastAll(e,t={}){return this.flushEdits(),this.shapeQueries??=new pi(this,2),this.shapeQueries.cast(e,t)}liveIndex(e){if(this.destroyed)throw Error("The 2D solver has been destroyed");if(!Number.isInteger(e)||e<0||e>=this.bodyCount)throw Error("A live 2D body index is required")}queueBodyCommand(e,t,i,r,o=!1){return this.liveIndex(e),this.prepareBodyCommands().enqueue(e,t,i,r,o),this}prepareBodyCommands(){return this.wakeAll(),this.bodyCommands||(this.bodyCommands=new Ur(this),this.compileContacts()),this.bodyCommands}setLinearVelocity(e,t){return this.queueBodyCommand(e,0,Vt(t,"velocity"))}setAngularVelocity(e,t){if(!Number.isFinite(t))throw Error("Angular velocity must be finite");return this.queueBodyCommand(e,1,[t,0,0,0])}applyImpulse(e,t,i){return this.queueBodyCommand(e,2,Vt(t,"impulse"),i===void 0?void 0:Vt(i,"point"),i!==void 0)}applyForce(e,t,i){return this.queueBodyCommand(e,3,[...Vt(t,"force"),0,this.params.dt],i===void 0?void 0:Vt(i,"point"),i!==void 0)}applyAngularImpulse(e,t){if(!Number.isFinite(t))throw Error("Angular impulse must be finite");return this.queueBodyCommand(e,5,[t,0,0,0])}applyTorque(e,t){if(!Number.isFinite(t))throw Error("Torque must be finite");return this.queueBodyCommand(e,6,[t,0,0,this.params.dt])}teleport(e,t,i){if(i!==void 0&&!Number.isFinite(i))throw Error("Angle must be finite");return this.queueBodyCommand(e,4,[...Vt(t,"position"),i??0,0],void 0,i!==void 0)}readBodies(){return this.flushEdits(),super.readBodies()}async readBodyState(e){this.liveIndex(e),this.flushEdits();let t=this.device,i=t.createBuffer({size:96,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let r=t.createCommandEncoder();r.copyBufferToBuffer(this.bodyBuffer,e*96,i,0,96),t.queue.submit([r.finish()]),await i.mapAsync(GPUMapMode.READ);let o=new Float32Array(i.getMappedRange());return{position:[o[0],o[1]],angle:o[2],linearVelocity:[o[12],o[13]],angularVelocity:o[14],mass:o[22],moment:o[23],sleeping:o[15]!==0}}finally{i.destroy()}}addBox(e,t={}){return this.addShape({size:Array.from(e)},t)}addCircle(e,t={}){return this.addShape(qo(e),t)}addHull(e,t={}){return this.addShape(No(e),t)}addCapsule(e,t,i={}){return this.addShape(Vo(e,t),i)}addSegment(e,t,i={}){return this.addShape(Wo(e,t,i))}addPlane(e=[0,1],t=0,i={}){return this.addShape(Ho(e,t,i))}addShape(e,t={}){t=e.options??t;let{density:i=1,friction:r=.6,position:o=[0,0],angle:a=0,velocity:n=[0,0,0],restitution:l=0,isTrigger:c=!1,group:u=4294967295,collidesWith:f=4294967295,allowSleep:d}=t;if(this.destroyed)throw Error("The 2D solver has been destroyed");if(d!==void 0&&typeof d!="boolean")throw Error("allowSleep must be boolean");if(this.bodyCount>=this.bodyCapacity)throw Error("2D body capacity reached; reserve bodyCapacity when creating the solver");if(e.size.length!==2||!e.size.every(h=>Number.isFinite(h)&&h>0)||!Number.isFinite(i)||i<0||!Number.isFinite(r)||r<0||!Number.isFinite(a))throw Error("Body dimensions must be positive, density and friction nonnegative, and angle finite");if(n.length!==3||!Array.from(n).every(Number.isFinite))throw Error("Velocity requires [x, y, angular] finite components");if(typeof c!="boolean"||!Number.isFinite(l)||l<0||l>1)throw Error("isTrigger must be boolean and restitution between zero and one");if([u,f].some(h=>!Number.isInteger(h)||h<0||h>4294967295))throw Error("Collision masks must be unsigned 32-bit integers");let p=Vt(o,"position");e.geometry&&this.geometryBytes(e.geometry.vertices?.length??0);let m=super.addBody(e.size,i,r,[...p,a],Array.from(n));return e.geometry&&(Fr(this.topology,m,e,i),this.shapeBuffer?this.appendShapeGeometry(m,e.geometry):this.enableShapes(),this.uploadBodies(m,1)),l&&this.setRestitution(m,l),c&&this.setSensor(m,!0),(u!==4294967295||f!==4294967295)&&this.setFilters([m],[u],[f]),this.contactWatch?.setWatched([m],[!this.watchedIndices||this.watchedIndices.has(m)]),this.sleepEligible.set(m,d??!0),d===!0&&!this.sleeping&&this.enableSleeping(),this.sleeping?.register(m,d!==!1),this.wakeAll(),m}setRestitution(e,t){if(this.liveIndex(e),!Number.isInteger(e)||e<0||e>=this.bodyCount||!Number.isFinite(t)||t<0||t>1)throw Error("Restitution requires a live body index and a coefficient in 0..1");t>0&&!this.restitution&&(this.restitution=new jo(this)),this.restitution?.set(e,t),this.wakeAll()}constraintSlot(e,t){if(this.destroyed)throw Error("The 2D solver has been destroyed");if(!Number.isInteger(e)||e<0||e>=this.jointCount||this.topology.handles[e]?.disposed)throw Error("A live 2D constraint slot is required");if(t!==void 0&&this.topology.info[e*j]!==t)throw Error("The constraint has a different type");return e}setMotor(e,{speed:t,maxTorque:i}={}){if(this.constraintSlot(e,Ro),t!==void 0&&!Number.isFinite(t)||i!==void 0&&(!Number.isFinite(i)||i<0))throw Error("Motor speed must be finite and maximum torque nonnegative");let r=e*O,o=e*36;t!==void 0&&(this.topology.data[r+re]=t,oe(this).float(this.jointBuffer,o+32,t)),i!==void 0&&(this.topology.data[r+_e]=-i,this.topology.data[r+Ae]=i,oe(this).float(this.jointBuffer,o+12,-i),oe(this).float(this.jointBuffer,o+16,i)),this.wakeAll()}setAngleLimits(e,t){this.constraintSlot(e,Fo);let i=ki(t);this.topology.data[e*O+be]=i.minAngle,this.topology.data[e*O+Ue]=i.maxAngle,oe(this).float(this.jointBuffer,e*36+32+1,i.minAngle),oe(this).float(this.jointBuffer,e*36+32+2,i.maxAngle);for(let r=4;r<8;r++)oe(this).float(this.jointBuffer,e*36+r,0);this.wakeAll()}setWorldAnchor(e,t,i){if(this.constraintSlot(e,Bi),this.topology.info[e*j+1]!==-1||!Number.isFinite(t)||!Number.isFinite(i))throw Error("A world joint and finite xy anchor are required");oe(this).float(this.jointBuffer,e*36+28,t),oe(this).float(this.jointBuffer,e*36+28+1,i),this.wakeAll()}disableConstraint(e){if(this.topology.handles[e]?.disposed)return;this.constraintSlot(e),this.flushPropertyEdits(),super.disableConstraint(e),this.wakeAll();let t=this.topology.handles[e];t&&(t.alive=!1,t.disposed=!0)}appendJoint(e,t,i,r,o,a=1/0){if(e!==-1&&this.liveIndex(e),this.liveIndex(t),e===t)throw Error("Constraint endpoints must differ");let n=Vt(i,"anchorA"),l=Vt(r,"anchorB");if(!o||o.length!==3||Array.from(o).some(u=>u!==1/0&&(!Number.isFinite(u)||u<0))||a!==1/0&&(!Number.isFinite(a)||a<0))throw Error("Joint stiffness and break force must be nonnegative or Infinity");this.flushPropertyEdits();let c=super.appendJoint(e,t,n,l,Array.from(o),a);return this.wakeAll(),c}setFilters(e,t,i){if(this.destroyed)throw Error("The 2D solver has been destroyed");if(e.length!==t.length||e.length!==i.length)throw Error("Each body index needs a group and collision mask");let r=n=>{if(!Number.isInteger(n)||n<0||n>4294967295)throw Error("Collision masks must be unsigned 32-bit integers");return n},o=Array.from(e,(n,l)=>(this.liveIndex(n),[n,r(t[l]),r(i[l])]));if(this.wakeAll(),!this.filters){let n=this.device;this.filters=n.createBuffer({size:this.bodyCapacity*8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),n.queue.writeBuffer(this.filters,0,new Uint32Array(this.bodyCapacity*2).fill(4294967295)),this.compileBroadphase()}let a=oe(this);for(let[n,l,c]of o)a.uint(this.filters,n*2,l),a.uint(this.filters,n*2+1,c)}bindFilters(){this.filterLayout&&(this.groups.broad=this.device.createBindGroup({layout:this.filterLayout,entries:[this.paramsBuffer,this.bodyBuffer,this.gridBuffer,this.pairBuffer,this.counterBuffer,this.staticBuffer,this.jointBuffer,...this.shapeBuffer?[this.shapeBuffer]:[],...this.filters?[this.filters]:[]].map((e,t)=>({binding:t,resource:{buffer:e}}))}))}rebuildBindings(){super.rebuildBindings(),this.bindFilters(),this.bindContacts()}setSensor(e,t){if(this.liveIndex(e),typeof t!="boolean")throw Error("Sensor flag must be boolean");if(this.wakeAll(),t&&!this.sensorsEnabled){this.sensorsEnabled=!0;let i=this.device,r=i.createComputePipeline({layout:"auto",compute:{module:i.createShaderModule({code:"@group(0) @binding(0) var<storage,read_write> data:array<vec4f>; @compute @workgroup_size(64) fn clear(@builtin(global_invocation_id) id:vec3u){if(id.x*6u+1u<arrayLength(&data)){data[id.x*6u+1u].w=0.;}}"}),entryPoint:"clear"}}),o=i.createBindGroup({layout:r.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.bodyBuffer}}]}),a=i.createCommandEncoder(),n=a.beginComputePass();n.setPipeline(r),n.setBindGroup(0,o),n.dispatchWorkgroups(Math.ceil(this.bodyCount/64)),n.end(),i.queue.submit([a.finish()]),this.compileContacts();let l=xs.replace("b.initial = b.pose;","b.initial = vec4f(b.pose.xyz,b.initial.w);").replace("fn addContact(acc: ptr<function, Acc>, c: u32, alpha: f32, i: u32) {",`fn addContact(acc: ptr<function, Acc>, c: u32, alpha: f32, i: u32) {
 if((contacts[c].ids.w&0x80000000u)!=0u){return;}`).replace("fn dualContact(c: u32) {",`fn dualContact(c: u32) {
 if((contacts[c].ids.w&0x80000000u)!=0u){return;}`).replace(`  let k = contacts[c];
  let bound`,`  let k = contacts[c];
  if((k.ids.w&0x80000000u)!=0u){return;}
  let bound`);this.compile(l,[this.layouts.solve,this.layouts.pass],["warmStartJoints","warmStartBodies","primal","primalScan","dual","refreshStick","updateVelocities"]);let c=Qr.replaceAll("if (gid.x >= topoCount()) { return; }",`if (gid.x >= topoCount()) { return; }
 if((contacts[gid.x].ids.w&0x80000000u)!=0u){return;}`);this.compile(c,[this.layouts.topo],["degreeContacts","fillContacts"])}this.sensorsEnabled&&oe(this).float(this.bodyBuffer,e*24+7,t?1:0),this.triggers??=new Set,t?this.triggers.add(e):this.triggers.delete(e)}compile(e,t,i){e.includes("fn warmStartBodies(")&&(e=Oc(jc(Uc(e)))),e.includes("fn dynamicBody(")&&(e=Dc(e));let r=e.includes("fn colorCount(");r&&(this.colorBucketSource=Rn(lo(e)),e=Rn(e));let o=this.device,a=o.createShaderModule({code:e}),n=o.createPipelineLayout({bindGroupLayouts:t});for(let l of i)this.pipes[l]=o.createComputePipeline({layout:n,compute:{module:a,entryPoint:l}});r&&i.includes("colorCount")&&(this.colorBucketPipelines={scan:this.pipes.colorCount},this.bitsetColorBuckets=void 0)}watchContacts({maxPairs:e=8192,maxEvents:t=4096,indices:i}={}){if(this.destroyed)throw Error("The 2D solver has been destroyed");if(i!==void 0){if(!Array.isArray(i))throw Error("Watched indices must be an array of live body indices");for(let r of i)this.liveIndex(r)}for(let r of[e,t])if(!Number.isInteger(r)||r<1)throw Error("Contact capacities must be positive integers");return this.contactWatch||(this.contactWatch=new xi(this.device,this.bodyBuffer,this.bodyCapacity,e,t,2),i===void 0&&this.contactWatch.setWatched(Array.from({length:this.bodyCount},(r,o)=>o),Array(this.bodyCount).fill(!0))),i!==void 0&&(this.watchedIndices=new Set(i),this.contactWatch.setWatched(Array.from({length:this.bodyCount},(r,o)=>o),Array.from({length:this.bodyCount},(r,o)=>this.watchedIndices.has(o)))),this}async readContactEvents(){this.watchContacts();let e=await this.contactWatch.read();return{...e,events:e.events.map(t=>({...t,type:t.kind===Ai?"begin":"end",isTrigger:!!(this.triggers?.has(t.a)||this.triggers?.has(t.b))}))}}step(){if(this.destroyed)throw Error("The 2D solver has been destroyed");co(this,this.colorBucketSource),this.sleeping||this.restitution?.active.size||this.bodyCommands?.pending.size||this.propertyEdits?.pending||this.externalBeforeStep||this.externalAfterStep?Gc.call(this):super.step(),this.contactWatch&&this.contactWatch.run({manifolds:this.contactBuffers[1-this.parity],contacts:this.contactBuffers[1-this.parity],counters:this.counterBuffer},this.contactCapacity,this.eventStep=(this.eventStep??0)+1,this.params.dt)}adapt(e){super.adapt(e),this.colorCap=Math.max(this.colorCap,this.minimumColors)}encodeStepPrelude(e){this.flushPropertyEdits(e),this.sleeping?.before(e),this.bodyCommands?.flush(e),this.restitution?.before(e),this.externalBeforeStep?.(e)}encodeStepPostlude(e){this.restitution?.after(e),this.sleeping?.after(e),this.externalAfterStep?.(e)}destroy(){this.passConstantCache=null,this.propertyEdits?.destroy(),!this.destroyed&&(this.detachFromScene(),this.shapeQueries?.destroy(),this.restitution?.destroy(),this.filters?.destroy(),this.shapeBuffer?.destroy(),this.bodyCommands?.destroy(),this.contactWatch?.destroy(),this.sleeping?.destroy(),super.destroy())}enableSleeping(e={}){if(this.destroyed)throw Error("The 2D solver has been destroyed");return this.sleeping?this.sleeping.options=Go(e):this.sleeping=new Do(this,e),this}disableSleeping(){if(this.destroyed)throw Error("The 2D solver has been destroyed");return this.sleeping&&(this.sleeping.wakeRequested=!0,this.sleeping.before(),this.sleeping.destroy(),this.sleeping=null),this}setSleepEnabled(e,t){if(this.liveIndex(e),typeof t!="boolean")throw Error("Sleep flag must be boolean");return this.sleepEligible.set(e,t),t&&!this.sleeping&&this.enableSleeping(),this.sleeping?.register(e,t),this.wakeAll(),this}wakeAll(){return this.sleeping&&(this.sleeping.wakeRequested=!0),this}wakeUp(e){return this.liveIndex(e),this.wakeAll()}async readSleepStats(){return this.sleeping?this.sleeping.readStats():{sleeping:0,wakeRequested:!1}}flushEdits(){this.flushPropertyEdits(),this.sleeping?.wakeRequested&&this.sleeping.before(),this.bodyCommands?.flush()}flushPropertyEdits(e){this.propertyEdits?.flush(e)}readJoints(){return this.flushPropertyEdits(),super.readJoints()}attachToScene(e,{maxSubSteps:t=6,maxFrameTime:i=.05,afterStep:r}={}){if(this.destroyed)throw Error("The 2D solver has been destroyed");if(!e?.onBeforeRenderObservable?.add||!e?.onDisposeObservable?.addOnce||!e?.getEngine)throw Error("A Babylon scene is required");if(!Number.isInteger(t)||t<1||!Number.isFinite(i)||i<=0||r!==void 0&&typeof r!="function")throw Error("Scene stepping requires positive frame limits and an optional afterStep function");if(this.sceneBinding){if(this.sceneBinding.scene===e)return this;throw Error("The 2D solver is already attached to another scene")}let o=0,a=e.onBeforeRenderObservable.add(()=>{let l=this.params.dt;if(!(l>0)||!Number.isFinite(l))throw Error("Simulation timestep must be positive and finite");let c=e.getEngine().getDeltaTime()/1e3;o=Math.min(t*l,o+Math.min(i,Math.max(0,c)));for(let u=0;o+1e-12>=l&&u<t&&(this.step(),o=Math.max(0,o-l),r?.(this),!(!this.sceneBinding||this.destroyed));u++);}),n=e.onDisposeObservable.addOnce(()=>this.destroy());return this.sceneBinding={scene:e,before:a,dispose:n},this}detachFromScene(){let e=this.sceneBinding;return e&&(e.scene.onBeforeRenderObservable.remove(e.before),e.scene.onDisposeObservable.remove(e.dispose),this.sceneBinding=null),this}};var Jo=s=>{if(!Number.isInteger(s)||s<0||s>4294967295)throw Error("Collision masks must be unsigned 32-bit integers");return s};function me(s,e,t){let i=s&&typeof s.x=="number"?[s.x,s.y,...e>=3?[s.z]:[],...e===4?[s.w]:[]]:Array.isArray(s)||ArrayBuffer.isView(s)&&!(s instanceof DataView)?s:Array.from(s??[]);if(i.length!==e||!i.every(Number.isFinite))throw Error(`${t} requires ${e} finite components`);return i}var Hc=["linearVelocity","angularVelocity","impulse","force","","angularImpulse","torque"];function fd(s,e){if(this.destroyed)throw Error("The solver has been destroyed");let t=this.editInProgress,i=t?new ti:this.editStaging??=new ti;this.editInProgress=!0;try{return dd.call(this,s,e,i)}finally{this.editInProgress=t}}function dd(s,e,t){t.count=0;let i,r=(o,a)=>{if(e===3)return me(o,3,a);if(!Number.isFinite(o))throw Error(`${a} must be finite`);return[o,0,0]};for(let o of s){let a=this.bodyIndex(o.body),{isTrigger:n,restitution:l,group:c,collidesWith:u,allowSleep:f}=o;if(n!==void 0||l!==void 0||c!==void 0||u!==void 0||f!==void 0){if(n!==void 0&&typeof n!="boolean")throw Error("isTrigger must be a boolean");if(f!==void 0&&typeof f!="boolean")throw Error("allowSleep must be a boolean");if(l!==void 0&&(!Number.isFinite(l)||l<0||l>1))throw Error("restitution must be between 0 and 1");if(u!==void 0&&c===void 0)throw Error("A collision-mask edit requires group as well");c!==void 0&&Jo(c),u!==void 0&&Jo(u),(i??=[]).push({index:a,isTrigger:n,restitution:l,group:c,collidesWith:u??4294967295,allowSleep:f})}let d=o.worldPoint===void 0?void 0:me(o.worldPoint,e,"worldPoint");if(o.position!==void 0){let p=me(o.position,e,"position"),m;if(o.rotation!==void 0){if(m=e===3?me(o.rotation,4,"rotation"):[o.rotation],e===3){let h=Math.hypot(...m);if(!h)throw Error("rotation must be nonzero");m=m.map(g=>g/h)}else if(!Number.isFinite(o.rotation))throw Error("angle must be finite")}t.append(a,4,p,e===3?m:void 0,m!==void 0),e===2&&(t.words[(t.count-1)*12+6]=m?.[0]??0)}else if(o.rotation!==void 0)throw Error("A rotation edit requires position; use teleport for a full pose");for(let p=0;p<Hc.length;p++){if(p===4)continue;let m=Hc[p];if(o[m]===void 0)continue;let g=p===1||p>=5?r(o[m],m):me(o[m],e,m);t.append(a,p,g,p===2||p===3?d:void 0,(p===2||p===3)&&d!==void 0),(p===3||p===6)&&(t.words[(t.count-1)*12+7]=this.params.dt)}}if(this.destroyed)throw Error("The solver was destroyed while reading body edits");t.count&&this.prepareBodyCommands().enqueueValidated(t);for(let o of i??[])o.isTrigger!==void 0&&this.setSensor(o.index,o.isTrigger),o.restitution!==void 0&&this.setRestitution(o.index,o.restitution),o.group!==void 0&&this.setFilters([o.index],[o.group],[o.collidesWith]),o.allowSleep!==void 0&&this.setSleepEnabled(o.index,o.allowSleep);return this}var Xo=class{constructor(e,t){this.solver=e,this.index=t}get gpuIndex(){return this.solver.liveIndex(this.index),this.index}setLinearVelocity(e){return this.solver.setLinearVelocity(this.gpuIndex,e),this}setAngularVelocity(e){return this.solver.setAngularVelocity(this.gpuIndex,e),this}applyImpulse(e,t){return this.solver.applyImpulse(this.gpuIndex,e,t),this}applyForce(e,t){return this.solver.applyForce(this.gpuIndex,e,t),this}applyAngularImpulse(e){return this.solver.applyAngularImpulse(this.gpuIndex,e),this}applyTorque(e){return this.solver.applyTorque(this.gpuIndex,e),this}teleport(e,t){return this.solver.teleport(this.gpuIndex,e,t),this}setTrigger(e){return this.solver.setSensor(this.gpuIndex,e),this.solver.wakeAll(),this}setRestitution(e){return this.solver.setRestitution(this.gpuIndex,e),this.solver.wakeAll(),this}setCollisionGroups(e,t=4294967295){return this.solver.setFilters([this.gpuIndex],[Jo(e)],[Jo(t)]),this.solver.wakeAll(),this}setSleepEnabled(e){return this.solver.setSleepEnabled(this.gpuIndex,e),this}wakeUp(){return this.solver.liveIndex(this.index),this.solver.wakeAll(),this}readState(){return this.solver.readBodyState(this.gpuIndex)}};function $c(s,{maxSubSteps:e=6,maxFrameTime:t=.05}={}){if(!Number.isInteger(e)||e<1||!Number.isFinite(t)||t<=0)throw Error("Stepping limits must be positive");let i=s.params.dt;if(!Number.isFinite(i)||i<=0)throw Error("Simulation timestep must be positive and finite");return{dt:i,maxSubSteps:e,maxFrameTime:t}}function Jc(s,e,t,i){if(s.destroyed)throw Error("The solver has been destroyed");if(!Number.isFinite(e)||e<0)throw Error("elapsed must be finite nonnegative seconds");let{dt:r,maxSubSteps:o,maxFrameTime:a}=$c(s,t);s.timeAccumulator=Math.min(o*r,(s.timeAccumulator??0)+Math.min(a,e));let n=0;for(;s.timeAccumulator+1e-12>=r&&n<o;)s.step(),s.timeAccumulator=Math.max(0,s.timeAccumulator-r),n++,i?.(s);return n}function hd(s,e){return Jc(this,s,e)}function Yo(s,{afterStep:e,...t}={}){if(this.destroyed)throw Error("The solver has been destroyed");if(!s?.onBeforeRenderObservable?.add||!s?.onDisposeObservable?.addOnce||!s?.getEngine)throw Error("A Babylon scene is required");if(e!==void 0&&typeof e!="function")throw Error("afterStep must be a function");if($c(this,t),this.sceneBinding){if(this.sceneBinding.scene===s)return this;throw Error("The solver is already attached to another scene")}let i=s.onBeforeRenderObservable.add(()=>{Jc(this,Math.max(0,s.getEngine().getDeltaTime()/1e3),t,e)}),r=s.onDisposeObservable.addOnce(()=>this.destroy());return this.sceneBinding={scene:s,before:i,dispose:r},this}function Qo(){let s=this.sceneBinding;return s&&(s.scene.onBeforeRenderObservable.remove(s.before),s.scene.onDisposeObservable.remove(s.dispose),this.sceneBinding=null,this.timeAccumulator=0),this}function Nr(s,e,t,i={}){s.advance=hd;let r,o;s.bodyIndex=function(n){if(this.destroyed)throw Error("The solver has been destroyed");let l=n;if(n instanceof Xo){if(n.solver!==this)throw Error("Body belongs to another solver");return n.gpuIndex}return typeof l!="number"&&t===3&&(o||(o=new WeakMap,e.bodies.forEach((c,u)=>o.set(c,this.gpuIndex(u)))),l=o.get(n)),this.liveIndex(l),l},s.body=function(n){let l=this.bodyIndex(n);return r??=new Map,r.has(l)||r.set(l,new Xo(this,l)),r.get(l)},s.editBodies=function(n){return fd.call(this,n,t)},s.setLinearVelocities=function(n,l){if(this.destroyed)throw Error("The solver has been destroyed");return i.setVelocities?i.setVelocities.call(this,n,{linear:l}):(this.velocityBatch??=new Kt(this,t),this.velocityBatch.set(n,l),this)},s.setVelocities=function(n,l){if(this.destroyed)throw Error("The solver has been destroyed");return i.setVelocities?i.setVelocities.call(this,n,l):l?.angular===void 0&&l?.linear!==void 0?this.setLinearVelocities(n,l.linear):l?.linear===void 0&&l?.angular!==void 0?this.setAngularVelocities(n,l.angular):(this.motionBatch??=new yi(this,t),this.motionBatch.set(n,l),this)},s.setAngularVelocities=function(n,l){if(this.destroyed)throw Error("The solver has been destroyed");return i.setVelocities?i.setVelocities.call(this,n,{angular:l}):(this.angularVelocityBatch??=new Kt(this,t,"angular"),this.angularVelocityBatch.set(n,l),this)};let a=s.destroy;return s.destroy=function(){this.destroyed||(this.velocityBatch?.destroy(),this.angularVelocityBatch?.destroy(),this.motionBatch?.destroy(),this.bodyReadback?.destroy(),this.editStaging=null,a.call(this),r?.clear(),o=null,e=null)},i.readSelectedBodies?s.readSelectedBodies=i.readSelectedBodies:t===2&&(s.readSelectedBodies=function(n,{posesOnly:l=!1}={}){let c=n instanceof Uint32Array?n:Array.from(n);return c.forEach(u=>this.liveIndex(u)),this.flushEdits(),this.bodyReadback??=new vi(this.device),this.bodyReadback.read(this.bodyBuffer,c,l,6)}),s}var Ko=class extends $o{constructor(e,t,i){super(e,t,i),Nr(this,null,2)}};var Tn=`struct Body { pos:vec4f, rot:vec4f, initialPos:vec4f, initialRot:vec4f, size:vec4f, moment:vec4f, inertialPos:vec4f, inertialRot:vec4f, velocity:vec4f, angular:vec4f }
struct Command { header:vec4u, value:vec4f, point:vec4f }
struct Manifold { ids:vec4u, geo:vec4f }
@group(0) @binding(0) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(1) var<storage,read> commands:array<Command>;
@group(0) @binding(2) var<storage,read> ranges:array<vec2u>;
@group(0) @binding(3) var<storage,read_write> manifolds:array<Manifold>;
fn rotate(q:vec4f,v:vec3f)->vec3f {let t=2.*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
fn angularImpulse(b:Body,impulse:vec3f)->vec3f {
 let local=rotate(vec4f(-b.rot.xyz,b.rot.w),impulse);
 return rotate(b.rot,local/max(b.moment.xyz,vec3f(1.e-10)));
}
// One invocation owns one body. Preserve command order without atomic pose writes.
@compute @workgroup_size(64) fn edit(@builtin(global_invocation_id) id:vec3u) {
 let i=id.x+id.y*DISPATCH_STRIDE;
 if(i>=arrayLength(&ranges)){return;}
 let range=ranges[i];let index=commands[range.x].header.x;var b=bodies[index];
 for(var k=range.x;k<range.x+range.y;k++) {
  let c=commands[k];let kind=c.header.y;
  if(kind==0u){b.velocity=vec4f(c.value.xyz,b.velocity.w);}
  else if(kind==1u){b.angular=vec4f(c.value.xyz,b.angular.w);}
  else if(kind==2u||kind==3u) {
   if(b.size.w>0.) {
    let impulse=c.value.xyz*select(1.,c.value.w,kind==3u);
    b.velocity=vec4f(b.velocity.xyz+impulse/b.size.w,b.velocity.w);
    if(c.header.z!=0u){b.angular=vec4f(b.angular.xyz+angularImpulse(b,cross(c.point.xyz-b.pos.xyz,impulse)),b.angular.w);}
   }
  } else if(kind==5u||kind==6u) {
   if(b.size.w>0.){b.angular=vec4f(b.angular.xyz+angularImpulse(b,c.value.xyz*select(1.,c.value.w,kind==6u)),b.angular.w);}
  } else if(kind==4u) {
   b.pos=vec4f(c.value.xyz,b.pos.w);
   if(c.header.z!=0u){b.rot=c.point;}
   // Encode a temporary marker while preserving the sensor flag in this word.
   let marker=select(-(b.initialPos.w+1.),b.initialPos.w,b.initialPos.w<0.);
   b.initialPos=vec4f(b.pos.xyz,marker);b.initialRot=b.rot;
   b.inertialPos=vec4f(b.pos.xyz,b.inertialPos.w);b.inertialRot=b.rot;
  }
 }
 bodies[index]=b;
}
// Only teleport batches run this pass. Retain warm starts on unaffected bodies.
@compute @workgroup_size(64) fn invalidate(@builtin(global_invocation_id) id:vec3u) {
 let i=id.x+id.y*DISPATCH_STRIDE;
 if(i>=arrayLength(&manifolds)){return;}
 let m=manifolds[i];
 if((m.ids.w&15u)!=0u && (bodies[m.ids.x].initialPos.w<0.||bodies[m.ids.y].initialPos.w<0.)){manifolds[i].ids.w=0u;}
}
@compute @workgroup_size(64) fn clearMarkers(@builtin(global_invocation_id) id:vec3u) {
 let i=id.x+id.y*DISPATCH_STRIDE;
 if(i>=arrayLength(&ranges)){return;}
 let index=commands[ranges[i].x].header.x;
 if(bodies[index].initialPos.w<0.){bodies[index].initialPos.w=-bodies[index].initialPos.w-1.;}
}
`;var jn=class extends Ur{constructor(e){super(e,Tn,3)}encodeAfterEdits(e,t){if(!this.hasTeleports)return;let i=this.solver,r=i.device;if(!this.invalidate){let c=r.createShaderModule({code:`const DISPATCH_STRIDE = ${r.limits.maxComputeWorkgroupsPerDimension*64}u;
${Tn}`});this.invalidate=r.createComputePipeline({layout:"auto",compute:{module:c,entryPoint:"invalidate"}}),this.clearMarkers=r.createComputePipeline({layout:"auto",compute:{module:c,entryPoint:"clearMarkers"}})}(this.invalidateBody!==i.bodyBuffer||this.invalidateManifolds!==i.contactStorage.manifolds)&&(this.invalidateGroup=r.createBindGroup({layout:this.invalidate.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i.bodyBuffer}},{binding:3,resource:{buffer:i.contactStorage.manifolds}}]}),this.invalidateBody=i.bodyBuffer,this.invalidateManifolds=i.contactStorage.manifolds);let o=e.beginComputePass();o.setPipeline(this.invalidate),o.setBindGroup(0,this.invalidateGroup);let a=Math.ceil(i.manifoldCapacity/64),n=r.limits.maxComputeWorkgroupsPerDimension;o.dispatchWorkgroups(Math.min(a,n),Math.ceil(a/n)),o.end(),(this.markerBody!==i.bodyBuffer||this.markerCommands!==this.commands||this.markerRanges!==this.ranges||this.markerBytes!==t*8)&&(this.markerGroup=r.createBindGroup({layout:this.clearMarkers.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i.bodyBuffer}},{binding:1,resource:{buffer:this.commands}},{binding:2,resource:{buffer:this.ranges,size:t*8}}]}),this.markerBody=i.bodyBuffer,this.markerCommands=this.commands,this.markerRanges=this.ranges,this.markerBytes=t*8),o=e.beginComputePass(),o.setPipeline(this.clearMarkers),o.setBindGroup(0,this.markerGroup);let l=Math.ceil(t/64);o.dispatchWorkgroups(Math.min(l,n),Math.ceil(l/n)),o.end()}},Zo=class extends gi{constructor(e,t,i){super(e,t,i),this.nativeRef=t,Nr(this,{bodies:t.bodies},3)}rigidAt(e){return this.nativeBodies||(this.nativeBodies=[],this.nativeRef.bodies.forEach((t,i)=>this.nativeBodies[this.gpuIndex(i)]=t)),this.nativeBodies[e]}rewriteBodies(e,t){if(super.rewriteBodies(e,t),this.nativeBodies)for(let i=0;i<e.length;i++)this.nativeBodies[e[i]]=t[i]}liveIndex(e){if(this.destroyed)throw Error("The 3D solver has been destroyed");if(!Number.isInteger(e)||e<0||e>=this.bodyCount)throw Error("A live 3D GPU body index is required")}queueBodyCommand(e,t,i,r,o=!1){return this.liveIndex(e),this.prepareBodyCommands(),this.bodyCommands.enqueue(e,t,i,r,o),this}prepareBodyCommands(){return this.wakeAll(),this.bodyCommands??=new jn(this)}setLinearVelocity(e,t){return this.queueBodyCommand(e,0,me(t,3,"velocity"))}setAngularVelocity(e,t){return this.queueBodyCommand(e,1,me(t,3,"angular velocity"))}applyImpulse(e,t,i){return this.queueBodyCommand(e,2,me(t,3,"impulse"),i===void 0?void 0:me(i,3,"point"),i!==void 0)}applyForce(e,t,i){return this.queueBodyCommand(e,3,[...me(t,3,"force"),this.params.dt],i===void 0?void 0:me(i,3,"point"),i!==void 0)}applyAngularImpulse(e,t){return this.queueBodyCommand(e,5,me(t,3,"angular impulse"))}applyTorque(e,t){return this.queueBodyCommand(e,6,[...me(t,3,"torque"),this.params.dt])}teleport(e,t,i){let r=me(t,3,"position"),o;if(i!==void 0){o=me(i,4,"rotation");let a=Math.hypot(...o);if(!a)throw Error("rotation must be nonzero");o=o.map(n=>n/a)}return this.queueBodyCommand(e,4,r,o,o!==void 0)}flushEdits(){if(this.destroyed)throw Error("The 3D solver has been destroyed");this.flushPropertyEdits(),this.sleeping?.wakeRequested&&this.sleeping.before(),this.bodyCommands?.flush()}readBodies(){return this.flushEdits(),super.readBodies()}readSelectedBodies(e,{posesOnly:t=!1}={}){let i=e instanceof Uint32Array?e:Array.from(e);return i.forEach(r=>this.liveIndex(r)),this.flushEdits(),this.bodyReadback??=new vi(this.device),this.bodyReadback.read(this.bodyBuffer,i,t)}async readBodyState(e){let t=await this.readSelectedBodies([e]),i=this.rigidAt(e)?.mass??t[19];return{position:Array.from(t.subarray(0,3)),rotation:Array.from(t.subarray(4,8)),linearVelocity:Array.from(t.subarray(32,35)),angularVelocity:Array.from(t.subarray(36,39)),mass:i,effectiveMass:t[19],sleeping:i>0&&t[19]===0}}raycastAll(...e){return this.flushEdits(),super.raycastAll(...e)}sphereCastAll(...e){return this.flushEdits(),super.sphereCastAll(...e)}watchContacts({maxPairs:e=8192,maxEvents:t=4096,indices:i}={}){if(this.destroyed)throw Error("The 3D solver has been destroyed");if(i!==void 0){if(!Array.isArray(i))throw Error("Watched indices must be an array");i.forEach(r=>this.liveIndex(r))}for(let r of[e,t])if(!Number.isInteger(r)||r<1)throw Error("Contact capacities must be positive integers");if(this.contactWatch||(this.contactWatch=new xi(this.device,this.bodyBuffer,this.bodyCapacity,e,t),i===void 0&&(i=Array.from({length:this.bodyCount},(r,o)=>o))),i!==void 0){let r=new Set(i);this.contactWatch.setWatched(Array.from({length:this.bodyCount},(o,a)=>a),Array.from({length:this.bodyCount},(o,a)=>r.has(a)))}return this}async readContactEvents(){this.watchContacts();let e=await this.contactWatch.read();return{...e,events:e.events.map(t=>({...t,type:t.kind===Ai?"begin":"end",isTrigger:!!(this.triggers?.has(t.a)||this.triggers?.has(t.b))}))}}setSensor(e,t){super.setSensor(e,t),this.triggers??=new Set,t?this.triggers.add(e):this.triggers.delete(e)}setSleepEnabled(e,t){if(this.liveIndex(e),typeof t!="boolean")throw Error("Sleep flag must be boolean");let i=this.rigidAt(e);if(!i)throw Error("Sleep eligibility requires a scene body");return i.allowSleep=t,t&&!this.sleeping&&this.enableSleeping(),this.sleeping?.register(e,i.mass,t),this.wakeAll(),this}enableSleeping(e={},t={}){let i=e.bodies?e:this.nativeRef;return super.enableSleeping(i,e.bodies?t:e),this}disableSleeping(){return this.flushEdits(),this.sleeping&&(this.sleeping.wakeRequested=!0,this.sleeping.before(),this.sleeping.dispose(),this.sleeping=null),this}attachToScene(e,t){return Yo.call(this,e,t)}detachFromScene(){return Qo.call(this)}step(){if(this.destroyed)throw Error("The 3D solver has been destroyed");super.step(),this.contactWatch?.run(this.contactStorage,this.manifoldCapacity,this.stepCount,this.params.dt)}destroy(){this.destroyed||(this.detachFromScene(),this.bodyCommands?.destroy(),this.contactWatch?.destroy(),super.destroy(),this.destroyed=!0)}};function Cs(s,e,t){if(s.split(e).length!==2)throw Error("Pinned solver changed; review the cloth kernel integration");return s.replace(e,t)}var ii=Cs(Ge,"  if (j >= params.jointCount || info[j].x != T_JOINT) { return; }",`  if (j >= params.jointCount) { return; }
  if (info[j].x == T_SPRING) {
    // Finite material stiffness: Eq. 16, with no hard-constraint multiplier.
    joints[j].penLin.x = min(joints[j].penLin.w, max(PENALTY_MIN, joints[j].penLin.x * params.gamma));
    return;
  }
  if (info[j].x != T_JOINT) { return; }`);ii=Cs(ii,"    let stiffness = k.penLin.w;","    let stiffness = k.penLin.x;");ii=Cs(ii,"    addRow(acc, n * sg, cross(r, n) * sg, stiffness, stiffness * (len - k.rA.w));",`    let force = stiffness * (len - k.rA.w);
    addRow(acc, n * sg, cross(r, n) * sg, stiffness, force);
    // Eq. 17: positive diagonal lumping of the geometric Hessian's column
    // norms. For C=|xA-xB|-L, G=(force/len)(I-n*n^T).
    let g = abs(force / len) * sqrt(max(vec3f(0.0), vec3f(1.0) - n*n));
    (*acc).lin += mat3x3f(vec3f(g.x,0.0,0.0), vec3f(0.0,g.y,0.0), vec3f(0.0,0.0,g.z));`);ii=Cs(ii,"  if (t != T_JOINT) { return; }",`  if (t == T_SPRING) {
    let a = info[j].y;
    let b = info[j].z;
    let C = length(anchorA(joints[j], a) - (qrotate(bodies[b].rot, joints[j].rB.xyz) + bodies[b].pos.xyz)) - joints[j].rA.w;
    joints[j].penLin.x = min(joints[j].penLin.w, joints[j].penLin.x + params.betaLin * abs(C));
    return;
  }
  if (t != T_JOINT) { return; }`);ii=Cs(ii,"fn finishBody(i: u32, acc: Acc) {",`fn finishBody(i: u32, acc: Acc) {
  if (all(bodies[i].moment.xyz == vec3f(0.0))) {
    // LDL^T of the point's 3x3 SPD system, using the same pivot floor as
    // rigid bodies. Contact friction moves the point; it cannot spin it.
    let d1 = acc.lin[0][0];
    let l21 = acc.lin[0][1] / d1;
    let l31 = acc.lin[0][2] / d1;
    let d2 = max(acc.lin[1][1] - l21*l21*d1, acc.lin[1][1]*PIVOT_FLOOR);
    let l32 = (acc.lin[1][2] - l31*l21*d1) / d2;
    let d3 = max(acc.lin[2][2] - l31*l31*d1 - l32*l32*d2, acc.lin[2][2]*PIVOT_FLOOR);
    let y1 = acc.rLin.x;
    let y2 = acc.rLin.y - l21*y1;
    let y3 = acc.rLin.z - l31*y1 - l32*y2;
    let v3 = y3/d3;
    let v2 = y2/d2 - l32*v3;
    let v1 = y1/d1 - l21*v2 - l31*v3;
    bodies[i].pos = vec4f(bodies[i].pos.xyz - vec3f(v1,v2,v3), bodies[i].pos.w);
    return;
  }`);var Xc=ii;var eu=8,Yc=16,Yi=1e-6,Gn=1e-5,md=1e-6,Fn=34028234663852886e22,ea=0,tu=1,ta=2;function Qc(s){let e=s.positionAng;return{center:s.positionLin,half:ne(S(),s.size,.5),axis:[le(S(),e,[1,0,0]),le(S(),e,[0,1,0]),le(S(),e,[0,0,1])]}}var Xi=(s,e)=>Math.abs(V(s,e));function ia(s,e){let t=V(e,s.axis[0])>=0?1:-1,i=V(e,s.axis[1])>=0?1:-1,r=V(e,s.axis[2])>=0?1:-1,o=D(S(),s.center,s.axis[0],s.half[0]*t);return D(o,o,s.axis[1],s.half[1]*i),D(o,o,s.axis[2],s.half[2]*r)}function iu(s,e){return e===0?{u:s.axis[1],v:s.axis[2],extentU:s.half[1],extentV:s.half[2]}:e===1?{u:s.axis[0],v:s.axis[2],extentU:s.half[0],extentV:s.half[2]}:{u:s.axis[0],v:s.axis[1],extentU:s.half[0],extentV:s.half[1]}}function gd(s,e,t){let i=V(t,s.axis[e])>=0?1:-1,r=ne(S(),s.axis[e],i),o=D(S(),s.center,r,s.half[e]);return{normal:r,center:o,...iu(s,e)}}function bd(s,e){let t=0,i=-Fn;for(let r=0;r<3;r++){let o=Xi(s.axis[r],e);o>i&&(i=o,t=r)}return t}function yd(s,e,t){let i=V(s.axis[e],t)>0?-1:1,r=ne(S(),s.axis[e],i),o=D(S(),s.center,r,s.half[e]),{u:a,v:n,extentU:l,extentV:c}=iu(s,e),u=(f,d)=>{let p=D(S(),o,a,f*l);return D(p,p,n,d*c)};return[u(1,1),u(-1,1),u(-1,-1),u(1,-1)]}function vd(s,e,t){let i=[];if(s.length===0)return i;let r=s[s.length-1],o=V(e,r)-t;for(let a of s){let n=V(e,a)-t,l=o<=Gn,c=n<=Gn;if(l!==c){let u=0,f=o-n;Math.abs(f)>Yi&&(u=ce(o/f,0,1)),i.length<Yc&&i.push(D(S(),r,J(S(),a,r),u))}c&&i.length<Yc&&i.push(a),r=a,o=n}return i}var ra=class{contacts=[];midpoints=[];bodyA;bodyB;constructor(e,t){this.bodyA=e,this.bodyB=t}add(e,t,i){let r=ne(S(),Li(S(),e,t),.5);for(let n of this.midpoints)if(Ne(J(S(),r,n))<md)return;if(this.contacts.length>=eu)return;let{bodyA:o,bodyB:a}=this;this.contacts.push({feature:i,rA:Te(S(),o.positionAng,J(S(),e,o.positionLin)),rB:Te(S(),a.positionAng,J(S(),t,a.positionLin))}),this.midpoints.push(r)}};function Dn(s,e,t,i,r,o,a,n){let l=Ne(i);if(l<Yi)return!0;let c=1/Math.sqrt(l),u=ne(S(),i,c);V(u,t)<0&&ee(u,u);let f=Math.abs(V(t,u)),d=s.half[0]*Xi(u,s.axis[0])+s.half[1]*Xi(u,s.axis[1])+s.half[2]*Xi(u,s.axis[2]),p=e.half[0]*Xi(u,e.axis[0])+e.half[1]*Xi(u,e.axis[1])+e.half[2]*Xi(u,e.axis[2]),m=f-(d+p);return m>0?!1:((!n.valid||m>n.separation)&&(n.valid=!0,n.type=r,n.indexA=o,n.indexB=a,n.separation=m,n.normalAB=u),!0)}function Kc(s,e,t){let i=(e+1)%3,r=(e+2)%3,o=V(t,s.axis[i])>=0?1:-1,a=V(t,s.axis[r])>=0?1:-1,n=D(S(),s.center,s.axis[i],s.half[i]*o);D(n,n,s.axis[r],s.half[r]*a);let l=ne(S(),s.axis[e],s.half[e]);return[J(S(),n,l),Li(S(),n,l)]}function xd(s,e,t,i){let r=J(S(),e,s),o=J(S(),i,t),a=J(S(),s,t),n=V(r,r),l=V(o,o),c=V(o,a),u=0,f=0;if(n<=Yi&&l<=Yi)return[s,t];if(n<=Yi)f=ce(c/l,0,1);else{let d=V(r,a);if(l<=Yi)u=ce(-d/n,0,1);else{let p=V(r,o),m=n*l-p*p;Math.abs(m)>Yi&&(u=ce((p*c-d*l)/m,0,1)),f=(p*u+c)/l,f<0?(f=0,u=ce(-d/n,0,1)):f>1&&(f=1,u=ce((p-d)/n,0,1))}}return[D(S(),s,r,u),D(S(),t,o,f)]}function Zc(s,e,t,i,r,o,a){let n=r?t:i,l=r?i:t,c=r?a:ee(S(),a),u=gd(n,o,c),f=bd(l,u.normal),d=yd(l,f,u.normal),p=[[u.u,u.extentU],[ee(S(),u.u),u.extentU],[u.v,u.extentV],[ee(S(),u.v),u.extentV]];for(let[g,b]of p)if(d=vd(d,g,V(g,u.center)+b),!d.length)return[];let m=new ra(s,e),h=(r?ea:tu)<<24|(o&255)<<16|(f&255)<<8;for(let g=0;g<d.length&&m.contacts.length<eu;g++){let b=d[g],y=V(J(S(),b,u.center),u.normal);if(y>Gn)continue;let A=D(S(),b,u.normal,-y),v=r?A:b,x=r?b:A;m.add(v,x,h|g&255)}return m.contacts.length||m.add(ia(t,a),ia(i,ee(S(),a)),h),m.contacts}function Ad(s,e,t,i,r,o,a){let[n,l]=Kc(t,r,a),[c,u]=Kc(i,o,ee(S(),a)),[f,d]=xd(n,l,c,u),p=new ra(s,e),m=ta<<24|(r&255)<<8|o&255;return p.add(f,d,m),p.contacts.length||p.add(ia(t,a),ia(i,ee(S(),a)),m),p.contacts}function ru(s,e,t,i=!0){let r=Qc(s),o=Qc(e),a=J(S(),o.center,r.center),n={type:ea,indexA:0,indexB:0,separation:-Fn,normalAB:S(),valid:!1},l={type:ta,indexA:0,indexB:0,separation:-Fn,normalAB:S(),valid:!1};for(let f=0;f<3;f++)if(!Dn(r,o,a,r.axis[f],ea,f,-1,n))return[];for(let f=0;f<3;f++)if(!Dn(r,o,a,o.axis[f],tu,-1,f,n))return[];let c=S();for(let f=0;f<3;f++)for(let d=0;d<3;d++)if(Dt(c,r.axis[f],o.axis[d]),!Dn(r,o,a,c,ta,f,d,l))return[];if(!n.valid)return[];let u=n;return l.valid&&(i?l.separation>.95*n.separation+.01:.95*l.separation>n.separation+.01)&&(u=l),zs(t,ee(S(),u.normalAB)),u.type===ta?Ad(s,e,r,o,u.indexA,u.indexB,u.normalAB):u.type===ea?Zc(s,e,r,o,!0,u.indexA,u.normalAB):Zc(s,e,r,o,!1,u.indexB,u.normalAB)}var de=(s,e)=>s.map((t,i)=>t+e[i]),T=(s,e)=>s.map((t,i)=>t-e[i]),q=(s,e)=>s.map(t=>t*e),F=(s,e)=>s.reduce((t,i,r)=>t+i*e[r],0),xt=(s,e)=>[s[1]*e[2]-s[2]*e[1],s[2]*e[0]-s[0]*e[2],s[0]*e[1]-s[1]*e[0]],Tt=s=>q(s,1/(Math.hypot(...s)||1)),Ee=(s,e)=>Array.from(le(S(),s,e)),su=(s,e)=>Te(S(),s.positionAng,T(e,s.positionLin)),Ot=(s,e)=>de(s.positionLin,Ee(s.positionAng,e)),wd=[[1,3,7,5],[0,4,6,2],[2,6,7,3],[0,1,5,4],[4,5,7,6],[0,2,3,1]],Bd=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];function qr(s){if(De(s)||Fe(s)){let a=(De(s),s.size[0]/2),n=Fe(s)?Math.max(0,s.size[1]/2-a):0;return{body:s,radius:a,spine:[Ot(s,[0,-n,0]),Ot(s,[0,n,0])]}}let e=Ct(s),t=e?Array.from({length:e.vertices.length/3},(a,n)=>Ot(s,e.vertices.slice(n*3,n*3+3))):Array.from({length:8},(a,n)=>Ot(s,s.size.map((l,c)=>l/2*(n>>c&1?1:-1)))),i=e?e.faces.map(a=>({vertices:a.verts.map(n=>t[n]),normal:Ee(s.positionAng,a.normal)})):wd.map((a,n)=>({vertices:a.map(l=>t[l]),normal:Ee(s.positionAng,Bd[n])})),r=[],o=new Set;for(let a of i)for(let n=0;n<a.vertices.length;n++){let l=a.vertices[n],c=a.vertices[(n+1)%a.vertices.length],u=t.indexOf(l),f=t.indexOf(c),d=`${Math.min(u,f)},${Math.max(u,f)}`;o.has(d)||(o.add(d),r.push([l,c]))}return{body:s,vertices:t,faces:i,edges:r}}function Ss(s,e){let t=s.spine??s.vertices,i=t[0];for(let r of t)F(r,e)>F(i,e)&&(i=r);return s.spine?de(i,q(e,s.radius)):i}function Cd(s,e,t){let i=T(e,s);return de(s,q(i,Math.max(0,Math.min(1,F(T(t,s),i)/(F(i,i)||1)))))}function sa([s,e],[t,i]){let r=T(e,s),o=T(i,t),a=T(s,t),n=F(r,r),l=F(o,o),c=F(o,a),u=0,f=0,d=p=>Math.max(0,Math.min(1,p));if(n<1e-16)f=l>1e-16?d(c/l):0;else{let p=F(r,a);if(l<1e-16)u=d(-p/n);else{let m=F(r,o),h=n*l-m*m;u=h>1e-12*n*l?d((m*c-p*l)/h):0,f=(m*u+c)/l,f<0?(f=0,u=d(-p/n)):f>1&&(f=1,u=d((m-p)/n))}}return[de(s,q(r,u)),de(t,q(o,f))]}function Sd(s,e,t){let i=[];for(let r=0;r<s.length;r++){let o=s[r],a=s[(r+1)%s.length],n=F(o,e)-t,l=F(a,e)-t;n<=1e-8&&i.push(o),n<0!=l<0&&i.push(de(o,q(T(a,o),n/(n-l))))}return i}function kd(s,e,t,i){let r=T(t,e),o=T(i,e),a=T(s,e),n=F(r,a),l=F(o,a);if(n<=0&&l<=0)return e;let c=T(s,t),u=F(r,c),f=F(o,c);if(u>=0&&f<=u)return t;let d=n*f-u*l;if(d<=0&&n>=0&&u<=0)return de(e,q(r,n/(n-u)));let p=T(s,i),m=F(r,p),h=F(o,p);if(h>=0&&m<=h)return i;let g=m*l-n*h;if(g<=0&&l>=0&&h<=0)return de(e,q(o,l/(l-h)));let b=u*h-m*f;if(b<=0&&f-u>=0&&m-h>=0)return de(t,q(T(i,t),(f-u)/(f-u+m-h)));let y=1/(b+g+d);return de(e,de(q(r,g*y),q(o,d*y)))}function Pd(s,e){let t=null,i=1/0;for(let r of s.faces)for(let o=1;o<r.vertices.length-1;o++){let a=kd(e,r.vertices[0],r.vertices[o],r.vertices[o+1]),n=F(T(e,a),T(e,a));n<i&&(t=a,i=n)}return t}function ou(s,e,t,i,r){if(!De(s)&&!De(e)&&!Fe(s)&&!Fe(e)&&!Ct(s)&&!Ct(e))return ru(s,e,t,s.solver.faceBias!==!1);i??=qr(s),r??=qr(e);let o=-1/0,a=[0,0,1],n=null,l=(f,d=null)=>{if(Math.hypot(...f)<1e-9)return;let p=Tt(f),m=F(T(Ss(i,q(p,-1)),Ss(r,p)),p),h=F(T(Ss(r,q(p,-1)),Ss(i,p)),p);h>m&&(m=h,p=q(p,-1)),m>o+1e-7&&(o=m,a=p,n=d)};for(let f of[i,r])for(let d of f.faces??[])l(d.normal);if(i.edges&&r.edges)for(let f of i.edges)for(let d of r.edges)l(xt(T(f[1],f[0]),T(d[1],d[0])),[f,d]);if(i.spine&&r.spine){let f=sa(i.spine,r.spine);l(T(...f))}for(let[f,d]of[[i,r],[r,i]])if(f.spine&&d.faces){for(let p of d.vertices)l(T(p,Cd(...f.spine,p)));for(let p of d.edges){let m=sa(f.spine,p);l(T(...m))}}if(o===-1/0&&l(T(s.positionLin,e.positionLin)),o>0)return[];o===-1/0&&(a=[0,0,1],o=-(i.radius+r.radius));let c=Tt(xt(a,Math.abs(a[0])<.7?[1,0,0]:[0,1,0]));t.set([...a,...c,...xt(a,c)]);let u=[];if(i.spine&&r.spine){let[f,d]=sa(i.spine,r.spine);u=[[de(f,q(a,-i.radius)),de(d,q(a,r.radius))]]}else if(i.spine||r.spine){let f=i.spine?i:r,d=i.spine?r:i,p=i.spine?q(a,-1):a,m=Ss(f,p),h=Pd(d,m);u=[i.spine?[m,h]:[h,m]]}else if(n)u=[sa(...n)];else{let f=(A,v)=>A.faces.reduce((x,w)=>F(w.normal,v)>F(x.normal,v)?w:x,A.faces[0]),d=f(i,q(a,-1)),p=f(r,a),m=F(d.normal,q(a,-1))>=F(p.normal,a),h=m?d:p,b=f(m?r:i,q(h.normal,-1)).vertices,y=q(h.vertices.reduce((A,v)=>de(A,v),[0,0,0]),1/h.vertices.length);for(let A=0;A<h.vertices.length&&b.length;A++){let v=h.vertices[A],x=h.vertices[(A+1)%h.vertices.length],w=Tt(xt(T(x,v),h.normal));F(T(y,v),w)>0&&(w=q(w,-1)),b=Sd(b,w,F(v,w))}for(let A of b){let v=F(T(A,h.vertices[0]),h.normal);if(v<=1e-6){let x=T(A,q(h.normal,v));u.push(m?[x,A]:[A,x])}}}return u.slice(0,8).map(([f,d],p)=>({feature:p+1,rA:su(s,f),rB:su(e,d)}))}var oa=(s,e,t)=>Math.max(e,Math.min(t,s)),Ld=(s,e)=>[F(s.slice(0,3),e),F(s.slice(3,6),e),F(s.slice(6,9),e)];function qn(s,e=!1){if(e){s.rest=Math.hypot(...T(Ot(s.bodyA,s.rA),Ot(s.bodyB,s.rB)));return}let t=s.bodyA?.positionAng??[0,0,0,1];s.cpuRest=$r(jt(),Sa(jt(),t),s.bodyB.positionAng),s.evaluateAng=i=>{let r=$r(jt(),s.bodyA?.positionAng??[0,0,0,1],s.cpuRest);ut(i,r,s.bodyB.positionAng);for(let o=0;o<3;o++)i[o]*=s.torqueArm;return i}}var Un=class extends ai{initialize(){let e=this.bodyA,t=this.bodyB;if(!((e.group??4294967295)&(t.collidesWith??4294967295))||!((t.group??4294967295)&(e.collidesWith??4294967295)))return!1;let i=this.contacts,r=De(e)||De(t)||Fe(e)||Fe(t);this.friction=Math.sqrt(e.friction*t.friction),this.contacts=ou(e,t,this.basis,this.solver.cpuGeometry.get(e),this.solver.cpuGeometry.get(t)).map(o=>{let a=i.find(n=>n.feature===o.feature);return{feature:o.feature,rA:a?.stick&&!r?a.rA:o.rA,rB:a?.stick&&!r?a.rB:o.rB,C0:S(),penalty:a?a.penalty.slice():S(),lambda:a?a.lambda.slice():S(),stick:a?.stick??!1}});for(let o of this.contacts){o.C0.set(Ld(this.basis,T(Ot(e,o.rA),Ot(t,o.rB)))),o.C0[0]+=Rs;for(let a=0;a<3;a++)o.lambda[a]*=this.solver.alpha*this.solver.gamma,o.penalty[a]=oa(o.penalty[a]*this.solver.gamma,Et,Ve);if(this.solver.massPenalty!==!1){let a=Math.min(e.mass>0?e.mass:1/0,t.mass>0?t.mass:1/0);o.penalty[0]=Math.max(o.penalty[0],oa(a/this.solver.dt**2,Et,Ve))}}return this.contacts.length>0}updatePrimal(...e){!this.bodyA.isTrigger&&!this.bodyB.isTrigger&&super.updatePrimal(...e)}updateDual(...e){!this.bodyA.isTrigger&&!this.bodyB.isTrigger&&super.updateDual(...e)}},Nn=class extends Ft{constructor(e,t,i){super(e,t.bodyA,t.bodyB),this.options={...i},this.pen=[Et,Et],this.lam=[0,0],this.source=t;let r=i.axisA;this.ta=Tt(Math.abs(r[0])>Math.abs(r[2])?[-r[1],r[0],0]:[0,-r[2],r[1]]);let o=this.bodyA?Ee(this.bodyA.positionAng,this.ta):this.ta,a=Array.from(Te(S(),this.bodyB.positionAng,o));a=T(a,q(i.axisB,F(a,i.axisB))),this.tb=Tt(a)}frame(){let e=this.bodyA?Ee(this.bodyA.positionAng,this.options.axisA):this.options.axisA,t=this.bodyA?Ee(this.bodyA.positionAng,this.ta):this.ta,i=Ee(this.bodyB.positionAng,this.tb);return{axis:e,angle:Math.atan2(F(e,xt(t,i)),F(t,i))}}initialize(){let e=this.frame().angle;this.c0=this.options.type==="motor"?[e,0]:[Math.min(0,e-this.options.minAngle),Math.max(0,e-this.options.maxAngle)];for(let t=0;t<2;t++)this.lam[t]*=this.solver.alpha*this.solver.gamma,this.pen[t]=oa(this.pen[t]*this.solver.gamma,Et,Ve);return!this.source.broken}evaluate(e){let{angle:t}=this.frame(),i=this.options,r=i.type==="motor"?[Math.atan2(Math.sin(t-this.c0[0]),Math.cos(t-this.c0[0]))-i.speed*this.solver.dt,0]:[t-i.minAngle-e*this.c0[0],t-i.maxAngle-e*this.c0[1]],o=r.map((a,n)=>this.pen[n]*a+this.lam[n]);return{c:r,f:i.type==="motor"?[oa(o[0],-i.maxTorque,i.maxTorque),0]:[Math.min(0,o[0]),Math.max(0,o[1])]}}updatePrimal(e,t,i){let{f:r}=this.evaluate(t),o=this.options;if(o.type==="motor"&&o.maxTorque===0)return;let a=q(this.frame().axis,e===this.bodyA?-1:1);for(let n=0;n<(o.type==="motor"?1:2);n++)if(!(o.type==="limit"&&r[n]===0))for(let l=0;l<3;l++){i.rhsAng[l]+=a[l]*r[n];for(let c=0;c<3;c++)i.lhsAng[l*3+c]+=a[l]*a[c]*this.pen[n]}}updateDual(e){let{c:t,f:i}=this.evaluate(e);this.lam=i;for(let r=0;r<2;r++)this.pen[r]=Math.min(Ve,this.pen[r]+this.solver.betaAng*(this.options.type==="motor"?Math.abs(t[r]):r===0?Math.max(0,-t[r]):Math.max(0,t[r])))}};function aa(s){if(!s.cpuPrepared){s.cpuPrepared=!0;for(let e of[...s.forces]){let t=fs(e);if(t){e.unlinkFromBodies(),s.forces.splice(s.forces.indexOf(e),1),e.cpuAngular=new Nn(s,e,t);continue}if(e instanceof ke&&e.stiffnessAng>0&&qn(e),e instanceof dt){let i=e.initialize.bind(e);e.initialize=()=>{if(e.broken)return!1;let r=Ui(e);if(r){let o=Math.max(0,Math.hypot(...T(Ot(e.bodyA,e.rA),Ot(e.bodyB,e.rB)))-e.rest);if(o/Math.max(e.rest,1e-6)>r.breakStrain||o*e.stiffness>r.breakForce)return e.broken=!0,!1}return i()}}}}}function au(s){let e=s.bodies;s.cpuGeometry=new Map;for(let l of e)(De(l)||Fe(l)||Ct(l))&&s.cpuGeometry.set(l,qr(l));let t=e.filter(l=>l.mass>0).slice(0,1024).map(l=>l.radius).sort((l,c)=>l-c),i=Math.max(.1,(t[Math.floor(t.length/2)]??1)*2),r=new Map,o=[],a=new Set,n=(l,c)=>{if(l===c||e[l].mass<=0&&e[c].mass<=0)return;let u=Math.max(l,c),f=Math.min(l,c),d=u*e.length+f;if(a.has(d))return;a.add(d);let p=e[u],m=e[f];if(!((p.group??4294967295)&(m.collidesWith??4294967295))||!((m.group??4294967295)&(p.collidesWith??4294967295)))return;let h=p.radius+m.radius;F(T(p.positionLin,m.positionLin),T(p.positionLin,m.positionLin))<=h*h&&!p.constrainedTo(m)&&new Un(s,p,m)};for(let l=0;l<e.length;l++){let c=e[l],u=c.positionLin.map(d=>Math.floor((d-c.radius)/i)),f=c.positionLin.map(d=>Math.floor((d+c.radius)/i));if((f[0]-u[0]+1)*(f[1]-u[1]+1)*(f[2]-u[2]+1)>128){o.push(l);continue}for(let d=u[0];d<=f[0];d++)for(let p=u[1];p<=f[1];p++)for(let m=u[2];m<=f[2];m++){let h=`${d},${p},${m}`,g=r.get(h)??[];for(let b of g)n(l,b);g.push(l),r.set(h,g)}}for(let l of o)for(let c=0;c<e.length;c++)n(l,c)}function na(s,e){if(!(e===3?s.bodies.some(r=>r.restitution>0):[...s.restitution.values()].some(r=>r>0)))return null;if(e===2)return Float64Array.from(s.velocity);let i=new Float64Array(s.bodies.length*6);return s.bodies.forEach((r,o)=>{i.set(r.velocityLin,o*6),i.set(r.velocityAng,o*6+3)}),i}function la(s,e,t){if(!t)return;let i=e===3?s.bodies.length:s.bodyCount,r=e===3?6:4,o=e===3?new Float64Array(i*r):s.velocity;e===3&&s.bodies.forEach((h,g)=>{o.set(h.velocityLin,g*r),o.set(h.velocityAng,g*r+3)});let a=h=>e===3?s.bodies[h].mass>0&&!s.bodies[h].sleeping?1/s.bodies[h].mass:0:s.dynamic[h]?1/s.shape[h*4+2]:0,n=(h,g)=>{if(!a(h))return e===3?[0,0,0]:0;if(e===2)return s.shape[h*4+3]>0?g/s.shape[h*4+3]:0;let b=s.bodies[h],y=b.positionAng,A=Ee([-y[0],-y[1],-y[2],y[3]],g);return Ee(y,A.map((v,x)=>b.moment[x]>0?v/b.moment[x]:0))},l=(h,g,b)=>{let y=g*r;return e===3?T(h.subarray(y,y+3),xt(b,h.subarray(y+3,y+6))):[h[y]-h[y+2]*b[1],h[y+1]+h[y+2]*b[0]]},c=(h,g)=>e===3?xt(h,g):h[0]*g[1]-h[1]*g[0],u=(h,g)=>e===3?F(h,g):h*g,f;if(e===3){let h=new Map(s.bodies.map((g,b)=>[g,b]));f=s.forces.filter(g=>g.contacts?.length&&!g.bodyA.isTrigger&&!g.bodyB.isTrigger).map(g=>{let b=(y,A)=>{let v=[0,0,0];for(let x of g.contacts){let w=Ee(y.positionAng,x[A]);for(let B=0;B<3;B++)v[B]+=w[B]/g.contacts.length}return v};return{a:h.get(g.bodyA),b:h.get(g.bodyB),n:g.basis.slice(0,3),ra:b(g.bodyA,"rA"),rb:b(g.bodyB,"rB"),e:Math.max(g.bodyA.restitution??0,g.bodyB.restitution??0)}})}else{let h=(g,b)=>{let y=Math.cos(s.pose[g*4+2]),A=Math.sin(s.pose[g*4+2]);return[y*b[0]-A*b[1],A*b[0]+y*b[1]]};f=s.contactPairs.filter(g=>!s.sensors.has(g.a)&&!s.sensors.has(g.b)).map(g=>({...g,ra:h(g.a,g.ra),rb:h(g.b,g.rb),e:Math.max(s.restitution.get(g.a)??0,s.restitution.get(g.b)??0)}))}let d=new Uint32Array(i);if(e===3)s.bodies.forEach((h,g)=>{d[g]=h.forces.length});else for(let h=0;h<i;h++)d[h]=s.adjStart[h+1]-s.adjStart[h];let p=[];for(let h of f){if(h.e<=0)continue;let g=F(h.n,T(l(t,h.a,h.ra),l(t,h.b,h.rb)));if(g>=-1)continue;let b=c(h.ra,h.n),y=c(h.rb,h.n),A=n(h.a,b),v=n(h.b,y),x=a(h.a)+a(h.b)+u(b,A)+u(y,v);x>0&&p.push({...h,inertiaA:A,inertiaB:v,k:x,target:-h.e*g,impulse:0})}let m=new Float64Array(o.length);for(let h=0;h<12&&p.length;h++){m.fill(0);for(let g of p){let b=F(g.n,T(l(o,g.a,g.ra),l(o,g.b,g.rb))),y=Math.max(0,g.impulse+(g.target-b)/(g.k*Math.max(1,d[g.a],d[g.b]))),A=y-g.impulse;g.impulse=y;for(let[v,x,w]of[[g.a,1,g.inertiaA],[g.b,-1,g.inertiaB]]){let B=v*r,L=a(v);for(let M=0;M<e;M++)m[B+M]+=x*A*L*g.n[M];if(e===3)for(let M=0;M<3;M++)m[B+3+M]+=x*A*w[M];else m[B+2]+=x*A*w}}for(let g=0;g<o.length;g++)o[g]+=m[g]}e===3&&s.bodies.forEach((h,g)=>{h.velocityLin.set(o.subarray(g*r,g*r+3)),h.velocityAng.set(o.subarray(g*r+3,g*r+6))})}function nu(s,e,t){let i=e.windSpeed??0;if(!ar(s)||s.mass<=0||i===0)return null;let r=e.windAngle??0,o=[Math.cos(r),Math.sin(r),0],a=[-o[1],o[0],0],n=s.positionLin,l=t*e.dt,c=F(n,o),u=F(n,a),f=.5*Math.sin(1.1*l-.35*c+.2*u)+.3*Math.sin(2.9*l-.8*c+.6*n[2])+.2*Math.sin(6.1*l-1.7*c+1.3*n[2]+.9*u),d=.6*Math.sin(1.7*l-.6*c+.4*n[2])+.4*Math.sin(4.3*l-1.3*c-.7*n[2]),p=Math.sin(2.3*l-.9*c+1.1*u),m=e.windGust??.4,h=o.map((x,w)=>i*x*(1+m*f)+m*i*(a[w]*.25*d+(w===2?.1*p:0))-s.velocityLin[w]),g=Ee(s.positionAng,[0,0,1]),b=(e.windPressure??.72)*s.size[0]*s.size[1]/s.mass,y=F(h,g),A=h.map((x,w)=>x-g[w]*y),v=b*y*Math.abs(y)/(1+2*e.dt*b*Math.abs(y));return g.map((x,w)=>x*v+A[w]*.06*b*Math.hypot(...A))}var _d=()=>({dt:1/60,gravity:-10,iterations:10,betaLin:1e4,betaAng:100,alpha:.99,gamma:.999}),ca=class{dt=1/60;gravity=-10;iterations=10;alpha=.99;betaLin=1e4;betaAng=100;gamma=.999;massPenalty=!0;faceBias=!0;up=[0,0,1];cpuStep=0;bodies=[];forces=[];constructor(){this.defaultParams()}defaultParams(){Object.assign(this,_d())}clear(){this.forces=[],this.bodies=[]}pick(e,t){let r=null,o=S(),a=S();for(let n=this.bodies.length-1;n>=0;n--){let l=this.bodies[n];if(l.mass<=0)continue;Te(o,l.positionAng,J(o,e,l.positionLin)),Te(a,l.positionAng,t);let c=0,u=1/0,f=!0;for(let p=0;p<3&&f;p++){let m=l.size[p]*.5;if(Math.abs(a[p])<1e-6){(o[p]<-m||o[p]>m)&&(f=!1);continue}let h=1/a[p],g=(-m-o[p])*h,b=(m-o[p])*h;g>b&&([g,b]=[b,g]),c=Math.max(c,g),u=Math.min(u,b),c>u&&(f=!1)}if(!f)continue;let d=c>=0?c:u;d<0||(!r||d<r.t)&&(r={body:l,local:D(S(),o,a,d),t:d})}return r}sys=Os();dxLin=S();dxAng=S();dp=S();accel=S();step(){let{dt:e,gravity:t,bodies:i,sys:r,dp:o}=this,a=na(this,3);aa(this),au(this);let n=[];for(let l of this.forces)l.initialize()?n.push(l):l.unlinkFromBodies();this.forces=n;for(let l=i.length-1;l>=0;l--){let c=i[l];D(c.inertialLin,c.positionLin,c.velocityLin,e),c.mass>0&&D(c.inertialLin,c.inertialLin,this.up,t*e*e);let u=nu(c,this,this.cpuStep);u&&D(c.inertialLin,c.inertialLin,u,e*e),si(c.inertialAng,c.positionAng,lu(c.velocityAng,e)),_t(this.accel,J(this.accel,c.velocityLin,c.prevVelocityLin),e);let f=V(this.accel,this.up)*Es(t),d=ce(f/Math.abs(t),0,1);Number.isFinite(d)||(d=0),c.initialLin.set(c.positionLin),c.initialAng.set(c.positionAng),c.mass>0&&!c.sleeping&&(D(c.positionLin,c.positionLin,c.velocityLin,e),D(c.positionLin,c.positionLin,this.up,t*d*e*e),si(c.positionAng,c.positionAng,lu(c.velocityAng,e)))}for(let l=0;l<this.iterations;l++){for(let c=i.length-1;c>=0;c--){let u=i[c];if(u.mass<=0||u.sleeping)continue;let f=u.mass,d=u.moment;Ce(r.lhsLin,f/(e*e),f/(e*e),f/(e*e)),Ce(r.lhsAng,d[0]/(e*e),d[1]/(e*e),d[2]/(e*e)),r.lhsCross.fill(0),ue(r.rhsLin,r.lhsLin,J(o,u.positionLin,u.inertialLin)),ue(r.rhsAng,r.lhsAng,ut(o,u.positionAng,u.inertialAng));let p=u.forces;for(let h=p.length-1;h>=0;h--)p[h].updatePrimal(u,this.alpha,r);let m=u.moment.every(h=>h===0);m&&(Ce(r.lhsAng,1,1,1),r.lhsCross.fill(0),r.rhsAng.fill(0)),Is(r.lhsLin,r.lhsAng,r.lhsCross,ee(r.rhsLin,r.rhsLin),ee(r.rhsAng,r.rhsAng),this.dxLin,this.dxAng),D(u.positionLin,u.positionLin,this.dxLin,1),m||si(u.positionAng,u.positionAng,this.dxAng)}for(let c of this.forces)c.updateDual(this.alpha)}for(let l of i)l.prevVelocityLin.set(l.velocityLin),l.mass>0&&!l.sleeping&&(_t(l.velocityLin,J(l.velocityLin,l.positionLin,l.initialLin),e),_t(l.velocityAng,ut(l.velocityAng,l.positionAng,l.initialAng),e));la(this,3,a),this.cpuStep++}},Ed=S(),lu=(s,e)=>ne(Ed,s,e);var Ps=(s,e)=>s.map((t,i)=>t+e[i]),Re=(s,e)=>s.map((t,i)=>t-e[i]),Lt=(s,e)=>s.map(t=>t*e),ot=(s,e)=>s[0]*e[0]+s[1]*e[1],ks=(s,e)=>[Math.cos(s)*e[0]-Math.sin(s)*e[1],Math.sin(s)*e[0]+Math.cos(s)*e[1]],uu=s=>Math.max(0,Math.min(1,s)),cu=(s,e,t)=>Ps(s,Lt(Re(e,s),uu(ot(Re(t,s),Re(e,s))/(ot(Re(e,s),Re(e,s))||1))));function ua(s,e){let t=ei(s)?.get(e)??[0,0,0,0],i=Array.from(s.pose.subarray(e*4,e*4+2)),r=s.pose[e*4+2],o=l=>Ps(i,ks(r,l)),a=[s.shape[e*4]/2,s.shape[e*4+1]/2],n=t[0]===4?Array.from({length:t.vertices.length/4},(l,c)=>o(t.vertices.slice(c*4,c*4+2))):t[0]===0?[[-1,-1],[1,-1],[1,1],[-1,1]].map(l=>o([l[0]*a[0],l[1]*a[1]])):null;return{kind:t[0],p:i,angle:r,vertices:n,radius:t[1],spine:[o([-t[2]||0,0]),o([t[2]||0,0])]}}function Qi(s,e){if(s.vertices){let r=-1/0,o=[];for(let a of s.vertices){let n=ot(a,e);n>r+1e-7?(r=n,o=[a]):Math.abs(n-r)<1e-7&&o.push(a)}return[o[0],o.at(-1)]}let t=Ps(s.spine[0],Lt(e,s.radius)),i=Ps(s.spine[1],Lt(e,s.radius));return Math.abs(ot(t,e)-ot(i,e))<1e-7?[t,i]:ot(t,e)>ot(i,e)?[t,t]:[i,i]}function fu(s,e,t,i){let r=ua(s,e),o=ua(s,t),a=s.pose,n=s.shape;if(r.kind===0&&o.kind===0)return _o(...a.subarray(e*4,e*4+3),n[e*4]/2,n[e*4+1]/2,...a.subarray(t*4,t*4+3),n[t*4]/2,n[t*4+1]/2,i);let l=[];if(r.kind===3||o.kind===3){let u=r.kind===3,f=u?r:o,d=u?o:r;if(d.kind===3)return 0;let p=ks(f.angle,[0,1]),m=Qi(d,Lt(p,-1));for(let h of m){let g=ot(Re(h,f.p),p);if(g<=0){let b=Re(h,Lt(p,g));l.push({a:u?b:h,b:u?h:b,n:u?Lt(p,-1):p})}}}else{let u=-1/0,f=[0,1],d=x=>{let w=Math.hypot(...x);if(w<1e-9)return;let B=Lt(x,1/w),L=ot(Re(Qi(r,Lt(B,-1))[0],Qi(o,B)[0]),B),M=ot(Re(Qi(o,Lt(B,-1))[0],Qi(r,B)[0]),B);Math.max(L,M)>u+1e-7&&(u=Math.max(L,M),f=L>=M?B:Lt(B,-1))};for(let[x,w]of[[r,o],[o,r]])if(x.vertices)for(let B=0;B<x.vertices.length;B++){let L=Re(x.vertices[(B+1)%x.vertices.length],x.vertices[B]);d([L[1],-L[0]]),w.vertices||d(Re(x.vertices[B],cu(...w.spine,x.vertices[B])))}else if(d(ks(x.angle,[0,1])),!w.vertices)for(let B of x.spine)d(Re(B,cu(...w.spine,B)));if(u===-1/0&&d([0,1]),u>0)return 0;let p=Qi(r,Lt(f,-1)),m=Qi(o,f),h=[-f[1],f[0]],g=p.map(x=>ot(x,h)),b=m.map(x=>ot(x,h)),y=Math.max(Math.min(...g),Math.min(...b)),A=Math.min(Math.max(...g),Math.max(...b)),v=(x,w)=>{let B=ot(Re(x[1],x[0]),h);return Math.abs(B)<1e-9?x[0]:Ps(x[0],Lt(Re(x[1],x[0]),uu((w-ot(x[0],h))/B)))};for(let x of A-y>1e-6?[y,A]:[(y+A)/2])l.push({a:v(p,x),b:v(m,x),n:f})}let c=0;for(let u of l){if(c&&Math.hypot(...Re(u.a,l[0].a))<1e-7)continue;let f=ks(-r.angle,Re(u.a,r.p)),d=ks(-o.angle,Re(u.b,o.p));if(i.set([268435456+c,...f,...d,...u.n],c*7),c++,c===2)break}return c}var du=(s,e,t)=>[Math.cos(s)*e-Math.sin(s)*t,Math.sin(s)*e+Math.cos(s)*t],hu=function(){let{pose:s,shape:e,props:t}=this,i=this.broadphase.pairs,r=this.contactOut;for(let o=0;o<this.broadphase.pairCount;o++){let a=i[o],n=Math.floor(a/2097152),l=a-n*2097152,c=this.collideBodies(n,l,r);if(c===0)continue;let u=0,f=this.prevCount;for(;u<f;){let m=u+f>>>1;this.prevKeys[m]<a?u=m+1:f=m}let d=u,p=Math.sqrt(t[n*4]*t[l*4]);for(let m=0;m<c;m++){let h=this.jointCount+this.contactCount++;this.info=this.grow(this.info,(h+1)*j),this.data=this.grow(this.data,(h+1)*O);let g=this.data,b=h*O,y=m*7,A=r[y+0];this.info.set([bs,n,l,A],h*j),g.fill(0,b,b+O),g[b+Q]=g[b+Q+1]=1/0,g[b+_e]=-1/0,g[b+Ae]=0,g[b+Pt]=g[b+Pt+1]=1/0,g[b+N]=r[y+1],g[b+N+1]=r[y+1+1],g[b+Y]=r[y+3],g[b+Y+1]=r[y+3+1],g[b+re]=p,g[b+be]=r[y+5],g[b+Ue]=r[y+5+1];let v=-1;for(let P=d;P<this.prevCount&&this.prevKeys[P]===a;P++)this.prevInfo[P*j+3]===A&&(v=P);if(v<0&&this.params.matchNearest){let P=Mn*Math.min(e[n*4],e[n*4+1],e[l*4],e[l*4+1]);for(let C=d;C<this.prevCount&&this.prevKeys[C]===a;C++){let _=Math.hypot(this.prevData[C*O+N]-g[b+N],this.prevData[C*O+N+1]-g[b+N+1]);_<=P&&(P=_,v=C)}}if(v>=0){let P=v*O;g[b+se]=this.prevData[P+se],g[b+se+1]=this.prevData[P+se+1],g[b+te]=this.prevData[P+te],g[b+te+1]=this.prevData[P+te+1],this.prevData[P+Hi]&&(g[b+N]=this.prevData[P+N],g[b+N+1]=this.prevData[P+N+1],g[b+Y]=this.prevData[P+Y],g[b+Y+1]=this.prevData[P+Y+1])}let[x,w]=du(s[n*4+2],g[b+N],g[b+N+1]),[B,L]=du(s[l*4+2],g[b+Y],g[b+Y+1]),M=g[b+be],I=g[b+Ue],E=s[n*4]+x-s[l*4]-B,k=s[n*4+1]+w-s[l*4+1]-L;g[b+fe]=M*E+I*k+5e-4,g[b+fe+1]=I*E-M*k}}};var fa=class extends Dr{constructor(e,t,i){if(super({precision:i==="soa-colored"?"f32":"f64",order:i==="soa-colored"?"colored":"sequential"}),Object.assign(this,e),this.options={...this.options,precision:i==="soa-colored"?"f32":"f64",order:i==="soa-colored"?"colored":"sequential"},this.options.precision==="f64")for(let[r,o]of Object.entries(this))o instanceof Float32Array&&(this[r]=Float64Array.from(o));for(let[r,o]of ei(e)??[]){let a=this.shape[r*4+2];Fr(this,r,{geometry:o,area:a,momentPerMass:a>0?this.shape[r*4+3]/a:0,radius:this.props[r*4+1]},1)}this.filters=new Map(t?.filters??[]),this.sensors=new Set(t?.sensors??[]),this.restitution=new Map(t?.restitution??[]),this.contactPairs=[],t&&(t.topology=this)}narrowphase(){this.contactPairs=[],hu.call(this)}collideBodies(e,t,i){let r=this.filters.get(e)??[4294967295,4294967295],o=this.filters.get(t)??[4294967295,4294967295];if(!(r[0]&o[1])||!(o[0]&r[1]))return 0;let a=fu(this,e,t,i);if(a){let n=[i[5],i[6]],l=[0,0],c=[0,0];for(let p=0;p<a;p++)for(let m=0;m<2;m++)l[m]+=i[p*7+1+m]/a,c[m]+=i[p*7+3+m]/a;let u=this.pose[e*4+2],f=Math.cos(u),d=Math.sin(u);this.contactPairs.push({a:e,b:t,n,ra:l,rb:c,point:[this.pose[e*4]+f*l[0]-d*l[1],this.pose[e*4+1]+d*l[0]+f*l[1],0],impulse:0})}return this.sensors.has(e)||this.sensors.has(t)?0:a}initJoints(){for(let e=0;e<this.jointCount;e++){let t=e*O,i=this.info[e*j];if(this.data[t+Q]===0&&this.data[t+Q+1]===0&&this.data[t+Q+2]===0){i!==0&&(this.info[e*j]=0,this.noCollideDirty=!0,this.handles[e]&&(this.handles[e].alive=!1));continue}i===1&&this.jointC(this.info[e*j+1],this.info[e*j+2],t,this.pose,this.data,t+fe)}for(let e=0;e<this.jointCount;e++)if(this.info[e*j]===5){let t=e*O,i=this.info[e*j+1],r=this.info[e*j+2],o=(i<0?0:this.pose[i*4+2])-this.pose[r*4+2]-this.data[t+re];this.data[t+fe]=Math.min(0,o-this.data[t+be]),this.data[t+fe+1]=Math.max(0,o-this.data[t+Ue])}}warmStartConstraints(e,t){let i=[];for(let r=0;r<this.jointCount;r++)this.info[r*j]===5&&(i.push(r),this.info[r*j]=4);super.warmStartConstraints(e,t);for(let r of i)this.info[r*j]=5}evalConstraint(e,t,i){if(this.info[e*j]!==5)return super.evalConstraint(e,t,i);let r=e*O,o=this.info[e*j+1],a=this.info[e*j+2],n=this.data,l=(o<0?0:this.pose[o*4+2])-this.pose[a*4+2]-n[r+re];this.eC[0]=l-n[r+be]-t*n[r+fe],this.eC[1]=l-n[r+Ue]-t*n[r+fe+1],this.eG.fill(0),this.eJ.fill(0);for(let c=0;c<2;c++){this.eMin[c]=n[r+_e+c],this.eMax[c]=n[r+Ae+c];let u=Math.max(this.eMin[c],Math.min(this.eMax[c],n[r+se+c]*this.eC[c]+n[r+te+c]));i>=0&&u!==0&&(this.eJ[c*3+2]=i===o?1:-1)}return 2}step(){let e=na(this,2);super.step(),la(this,2,e);let t=new Map(this.contactPairs.map(i=>[`${i.a},${i.b}`,i]));for(let i=this.jointCount;i<this.jointCount+this.contactCount;i++){let r=t.get(`${this.info[i*j+1]},${this.info[i*j+2]}`);r&&(r.impulse+=Math.abs(this.data[i*O+te])*this.params.dt)}}};var ha=(s,e,t)=>{let i=T(e,s);return de(s,q(i,Math.max(0,Math.min(1,F(T(t,s),i)/(F(i,i)||1)))))};function da(s,e,t,i){let r=T(s,t),o=F(r,e),a=o*o-F(r,r)+i*i;if(a<0)return null;let n=-o-Math.sqrt(a);return n<0?null:{t:n,n:Tt(T(de(s,q(e,n)),t))}}function Vr(s,e){return e&&(!s||e.t<s.t)?e:s}function Vn(s,e,t,i,r){let o=T(i,t),a=T(s,t),n=F(o,o);if(n<1e-16)return da(s,e,t,r);let l=F(o,e),c=F(o,a),u=F(a,e),f=n-l*l,d=n*u-c*l,p=n*F(a,a)-c*c-r*r*n,m=d*d-f*p,h=null;if(f>1e-12*n&&m>=0){let g=(-d-Math.sqrt(m))/f,b=c+g*l;g>=0&&b>=0&&b<=n&&(h={t:g,n:Tt(T(de(s,q(e,g)),de(t,q(o,b/n))))})}return Vr(Vr(h,da(s,e,t,r)),da(s,e,i,r))}function pu(s,e){let t=q(e.vertices.reduce((i,r)=>de(i,r),[0,0,0]),1/e.vertices.length);for(let i=0;i<e.vertices.length;i++){let r=e.vertices[i],o=e.vertices[(i+1)%e.vertices.length],a=xt(T(o,r),e.normal);if(F(a,T(s,r))*(F(a,T(t,r))>=0?1:-1)<-1e-6)return!1}return!0}function Md(s,e,t,i){if(i===0){let n=-1/0,l=1/0,c=q(t,-1);for(let u of s.faces){let f=F(u.normal,t),d=F(u.normal,T(u.vertices[0],e));if(Math.abs(f)<1e-12){if(d<0)return null}else{let p=d/f;f<0?p>n&&(n=p,c=u.normal):l=Math.min(l,p)}if(n>l)return null}return l<0?null:{t:Math.max(0,n),n:n<=0?q(t,-1):c}}let r=!0,o=1/0,a=null;for(let n of s.faces){let l=F(n.normal,T(e,n.vertices[0]));l>0&&(r=!1),pu(T(e,q(n.normal,l)),n)&&(o=Math.min(o,l*l));let c=F(n.normal,t);if(c<-1e-12){let u=(i-l)/c;u>=0&&pu(T(de(e,q(t,u)),q(n.normal,i)),n)&&(a=Vr(a,{t:u,n:n.normal}))}}for(let[n,l]of s.edges){let c=T(e,ha(n,l,e));o=Math.min(o,F(c,c)),a=Vr(a,Vn(e,t,n,l,i))}return r||o<=i*i?{t:0,n:q(t,-1)}:a}var At=(s,e)=>s[0]*e[0]+s[1]*e[1];function zd(s,e,t,i){let r=!0,o=1/0,a=null;for(let n=0;n<s.vertices.length;n++){let l=s.vertices[n],c=s.vertices[(n+1)%s.vertices.length],u=T(c,l),f=Tt([u[1],-u[0]]),d=At(T(e,l),f);d>0&&(r=!1);let p=T(e,ha(l,c,e));o=Math.min(o,At(p,p));let m=At(t,f);if(m<-1e-12){let h=(i-d)/m,g=T(de(e,q(t,h)),q(f,i)),b=At(T(g,l),u),y=1e-6*At(u,u);h>=0&&b>=-y&&b<=At(u,u)+y&&(a=Vr(a,{t:h,n:f}))}i>0&&(a=Vr(a,da(e,t,l,i)))}return r||o<=i*i?{t:0,n:q(t,-1)}:a}function Id(s,e,t,i){if(s.vertices)return zd(s,e,t,i);if(s.kind===3){let p=[-Math.sin(s.angle),Math.cos(s.angle)],m=At(T(e,s.p),p)-i,h=At(t,p);return m<=0?{t:0,n:q(t,-1)}:h<-1e-12?{t:-m/h,n:p}:null}let r=s.kind===1?s.p:s.spine[0],o=s.kind===1?s.p:s.spine[1],a=i+s.radius,n=T(e,ha(r,o,e));if(At(n,n)<=a*a)return{t:0,n:q(t,-1)};if(a>0)return Vn(e,t,r,o,a);let l=T(o,r),c=t[0]*l[1]-t[1]*l[0];if(Math.abs(c)<1e-12){let p=T(e,r);if(Math.abs(p[0]*l[1]-p[1]*l[0])/Math.max(Math.hypot(...l),1e-20)>1e-6)return null;let h=Math.min(At(T(r,e),t),At(T(o,e),t));return Math.max(At(T(r,e),t),At(T(o,e),t))<0?null:{t:Math.max(0,h),n:q(t,-1)}}let u=T(r,e),f=(u[0]*l[1]-u[1]*l[0])/c,d=(u[0]*t[1]-u[1]*t[0])/c;return f>=0&&d>=0&&d<=1?{t:f,n:q(Tt([l[1],-l[0]]),c>0?-1:1)}:null}function mu(s,e,t,i,{maxDistance:r=1e30,ignore:o=[],collidesWith:a=4294967295,includeTriggers:n=!0}={}){let l=s.dimension,c=me(e,l,"origin"),u=me(i,l,"direction"),f=Math.hypot(...u);if(!f||!Number.isFinite(t)||t<0||!Number.isFinite(r)||r<0)throw Error("Provide a nonzero direction, finite nonnegative radius and distance");if(!Number.isInteger(a)||a<0||a>4294967295)throw Error("Collision masks must be unsigned 32-bit integers");let d=new Set(o);for(let h of d)s.liveIndex(h);let p=u.map(h=>h/f),m=null;for(let h=0;h<s.bodyCount;h++){if(d.has(h))continue;let g=l===3?s.solver.bodies[h]:null,b=g?g.group??4294967295:s.solver.filters.get(h)?.[0]??4294967295,y=g?g.isTrigger:s.solver.sensors.has(h);if(!(b&a)||!n&&y)continue;let A;if(l===2)A=Id(ua(s.solver,h),c,p,t);else{let x=qr(g);if(x.spine){let w=x.radius+t,B=T(c,ha(...x.spine,c));A=F(B,B)<=w*w?{t:0,n:q(p,-1)}:Vn(c,p,...x.spine,w)}else A=Md(x,c,p,t)}if(!A||A.t>r||m&&A.t>=m.distance)continue;let v=de(c,q(p,A.t));m={index:h,distance:A.t,normal:A.n,center:v,point:T(v,q(A.n,t))}}return m}var pa=class{constructor(e,{speedThreshold:t=.08,timeThreshold:i=.6}={}){if(!Number.isFinite(t)||t<=0||!Number.isFinite(i)||i<=0)throw Error("Sleep thresholds must be positive and finite");this.world=e,this.speedThreshold=t,this.timeThreshold=i,this.time=new Float64Array(e.bodyCount),this.asleep=new Set}wake(){let e=this.world;for(let t of this.asleep)e.dimension===3?e.solver.bodies[t].sleeping=!1:e.solver.dynamic[t]=+(e.solver.shape[t*4+2]>0);this.asleep.clear(),this.time.fill(0)}after(){let e=this.world,t=e.solver,i=e.bodyCount,r=Int32Array.from({length:i},(d,p)=>p),o=new Set,a=[],n=d=>e.dimension===3?t.bodies[d].mass:t.shape[d*4+2],l=d=>{for(;r[d]!==d;)r[d]=r[r[d]],d=r[d];return d},c=(d,p)=>{if(d<0){o.add(p);return}n(d)<=0?o.add(p):n(p)<=0?o.add(d):r[l(d)]=l(p),a.push([d,p])};if(e.dimension===3){let d=new Map(t.bodies.map((p,m)=>[p,m]));for(let p of t.forces)!p.broken&&!p.bodyA?.isTrigger&&!p.bodyB?.isTrigger&&c(p.bodyA?d.get(p.bodyA):-1,d.get(p.bodyB))}else{for(let d of t.contactPairs)!t.sensors.has(d.a)&&!t.sensors.has(d.b)&&c(d.a,d.b);for(let d=0;d<t.jointCount;d++)(t.data[d*32+6]||t.data[d*32+7]||t.data[d*32+8])&&c(t.info[d*4+1],t.info[d*4+2])}let u=new Set([...o].map(l)),f=new Map;for(let d=0;d<i;d++)if(n(d)>0){let p=l(d),m=e.dimension===3?t.bodies[d]:null,h=m?m.allowSleep!==!1:t.avbdSleepEligible?.get(d)!==!1,g=m?Math.hypot(...m.velocityLin,...m.velocityAng):Math.hypot(...t.velocity.subarray(d*4,d*4+3));f.has(p)||f.set(p,u.has(p)),f.set(p,f.get(p)&&h&&g<=this.speedThreshold)}for(let d=0;d<i;d++)n(d)>0&&(this.time[d]=f.get(l(d))?this.time[d]+e.params.dt:0,this.time[d]>=this.timeThreshold&&(this.asleep.add(d),e.dimension===3?(t.bodies[d].sleeping=!0,t.bodies[d].velocityLin.fill(0),t.bodies[d].velocityAng.fill(0)):(t.dynamic[d]=0,t.velocity.fill(0,d*4,d*4+4))));a.some(([d,p])=>d>=0&&n(d)>0&&n(p)>0&&this.asleep.has(d)!==this.asleep.has(p))&&this.wake()}};var ma=class{constructor(e,t,i={}){if(this.backend="cpu",this.dimension=t,this.scene=e,this.stepCount=0,this.pending=new ti,this.events=[],this.previous=new Map,this.watched=null,t===3){this.solver=Object.assign(new ca,e.ref),this.solver.up=[...e.up??[0,0,1]],this.nativeRef=e.ref,this.constraints=this.solver.forces.slice();for(let r of this.solver.bodies)r.solver=this.solver;for(let r of this.constraints)r.solver=this.solver;this.constraints.forEach((r,o)=>{let a=e.handles?.get(r);a&&(a.slot=o)}),aa(this.solver)}else this.solver=new fa(e.topology,e,i.order==="colored"?"soa-colored":"soa-seq"),this.topology=this.solver,this.builder=Object.assign(Object.create(Object.getPrototypeOf(e)),{topology:this.solver,filters:this.solver.filters,sensors:this.solver.sensors,restitution:this.solver.restitution});this.params=t===3?this.solver:this.solver.params,Nr(this,t===3?{bodies:this.solver.bodies}:null,t,{setVelocities:this.setPackedVelocities,readSelectedBodies:this.readSelectedBodies}),(i.sleeping||e.sleepOptIn||[...e.topology?.avbdSleepEligible?.values()??[]].some(Boolean))&&this.enableSleeping(i.sleeping===!0?{}:i.sleeping)}get bodyCount(){return this.dimension===3?this.solver.bodies.length:this.solver.bodyCount}get jointCount(){return this.dimension===3?this.constraints.length:this.solver.jointCount}gpuIndex(e){return this.liveIndex(e),e}liveIndex(e){if(this.assertLive(),!Number.isInteger(e)||e<0||e>=this.bodyCount)throw Error("A live body index is required")}assertLive(){if(this.destroyed)throw Error("The solver has been destroyed")}prepareBodyCommands(){return this.wakeAll(),{enqueueValidated:e=>{this.pending.reserve(this.pending.count+e.count),this.pending.u32.set(e.u32.subarray(0,e.count*12),this.pending.count*12),this.pending.count+=e.count}}}setLinearVelocity(e,t){return this.editBodies([{body:e,linearVelocity:t}])}setAngularVelocity(e,t){return this.editBodies([{body:e,angularVelocity:t}])}applyImpulse(e,t,i){return this.editBodies([{body:e,impulse:t,worldPoint:i}])}applyForce(e,t,i){return this.editBodies([{body:e,force:t,worldPoint:i}])}applyAngularImpulse(e,t){return this.editBodies([{body:e,angularImpulse:t}])}applyTorque(e,t){return this.editBodies([{body:e,torque:t}])}teleport(e,t,i){return this.editBodies([{body:e,position:t,rotation:i}])}setPackedVelocities(e,t){let i=Array.from(e),r=t?.linear,o=t?.angular,a=this.dimension,n=a===3?3:1;if(r===void 0&&o===void 0)throw Error("Provide linear or angular velocities");let l=-1;i.forEach(d=>{if(this.liveIndex(d),d<=l)throw Error("Velocity batch indices must be unique and ascending GPU slots");l=d});for(let[d,p]of[[r,a],[o,n]])if(d!==void 0&&(d.length!==i.length*p||!Array.from(d).every(m=>Number.isFinite(Math.fround(m)))))throw Error("Provide finite packed velocity components per body");let c=r===void 0?null:Array.from(r),u=o===void 0?null:Array.from(o),f=i.map((d,p)=>({body:d,...c===null?{}:{linearVelocity:c.slice(p*a,(p+1)*a)},...u===null?{}:{angularVelocity:a===3?u.slice(p*n,(p+1)*n):u[p]}}));return this.editBodies(f),this.flushEdits(),this}flushEdits(){if(this.destroyed)throw Error("The solver has been destroyed");let{words:e,u32:t,count:i}=this.pending,r=this.solver,o=this.dimension;for(let a=0;a<i;a++){let n=a*12,l=t[n],c=t[n+1],u=t[n+2]!==0,f=o===3?r.bodies[l]:null,d=f?.velocityLin??r.velocity.subarray(l*4,l*4+2),p=f?.mass??r.shape[l*4+2],m=f?.positionLin??r.pose.subarray(l*4,l*4+2),h=g=>{if(!(p<=0))if(o===2)r.velocity[l*4+2]+=g[0]/Math.max(1e-10,r.shape[l*4+3]);else{let b=f.positionAng,y=Ee([-b[0],-b[1],-b[2],b[3]],g),A=Ee(b,y.map((v,x)=>v/Math.max(1e-10,f.moment[x])));for(let v=0;v<3;v++)f.velocityAng[v]+=A[v]}};if(c===0)d.set(e.subarray(n+4,n+4+o));else if(c===1)f?f.velocityAng.set(e.subarray(n+4,n+7)):r.velocity[l*4+2]=e[n+4];else if(c===4)if(m.set(e.subarray(n+4,n+4+o)),f){u&&f.positionAng.set(e.subarray(n+8,n+12)),f.initialLin.set(m),f.inertialLin.set(m),f.initialAng.set(f.positionAng),f.inertialAng.set(f.positionAng);for(let g of[...f.forces])g.contacts&&g.destroy()}else u&&(r.pose[l*4+2]=e[n+6]),r.initial.set(r.pose.subarray(l*4,l*4+4),l*4),r.inertial.set(r.pose.subarray(l*4,l*4+4),l*4),r.prevCount=0;else if(c===2||c===3){if(p<=0)continue;let g=Array.from(e.subarray(n+4,n+4+o),b=>b*(c===3?e[n+7]:1));for(let b=0;b<o;b++)d[b]+=g[b]/p;if(u){let b=Array.from(e.subarray(n+8,n+8+o),(y,A)=>y-m[A]);h(o===3?xt(b,g):[b[0]*g[1]-b[1]*g[0]])}}else(c===5||c===6)&&h(Array.from(e.subarray(n+4,n+4+(o===3?3:1)),g=>g*(c===6?e[n+7]:1)))}this.pending.count=0}step(){this.flushEdits(),this.solver.step(),this.sleeping?.after(),this.stepCount++,this.captureEvents()}attachToScene(e,t){return Yo.call(this,e,t)}detachFromScene(){return Qo.call(this)}setFilters(e,t,i){let r=Array.from(e),o=Array.from(t),a=Array.from(i);if(o.length!==r.length||a.length!==r.length)throw Error("Provide one group and mask per body");r.forEach(n=>this.liveIndex(n));for(let n of[...o,...a])if(!Number.isInteger(n)||n<0||n>4294967295)throw Error("Collision masks must be unsigned 32-bit integers");r.forEach((n,l)=>{this.dimension===3?Object.assign(this.solver.bodies[n],{group:o[l],collidesWith:a[l]}):this.solver.filters.set(n,[o[l],a[l]])}),this.wakeAll()}setSensor(e,t){if(this.liveIndex(e),typeof t!="boolean")throw Error("Trigger flag must be boolean");this.dimension===3?this.solver.bodies[e].isTrigger=t:t?this.solver.sensors.add(e):this.solver.sensors.delete(e),this.wakeAll()}setRestitution(e,t){if(this.liveIndex(e),!Number.isFinite(t)||t<0||t>1)throw Error("restitution must be between 0 and 1");this.dimension===3?this.solver.bodies[e].restitution=t:this.solver.restitution.set(e,t),this.wakeAll()}setMotor(e,t){if(this.assertLive(),this.dimension===3){let i=this.constraints[e];if(!i?.cpuAngular)throw Error("A motor constraint is required");Object.assign(i.cpuAngular.options,kt({...i.cpuAngular.options,...t}))}else{let i=this.solver,r=e*O;if(!Number.isInteger(e)||e<0||e>=i.jointCount||i.info[e*4]!==3)throw Error("A motor constraint is required");let o=t.speed??i.data[r+re],a=t.maxTorque??i.data[r+Ae];if(!Number.isFinite(o)||!Number.isFinite(a)||a<0)throw Error("Provide finite motor speed and nonnegative torque");i.data[r+re]=o,i.data[r+_e]=-a,i.data[r+Ae]=a}this.wakeAll()}setAngleLimits(e,t){if(this.assertLive(),this.dimension!==2)throw Error("Use a 3D hinge constraint");if(this.solver.info[e*4]!==5)throw Error("An angular limit is required");Bs(this.solver,e,ki(t)),this.wakeAll()}releaseJoints(e){for(let t of e)this.disableConstraint(t)}disableConstraint(e){if(this.assertLive(),!Number.isInteger(e)||e<0||e>=this.jointCount)throw Error("A live constraint slot is required");if(this.dimension===3){let t=this.constraints[e];t.broken=!0,(t.cpuAngular??t).destroy()}else this.solver.disable(e),this.solver.info[e*4]=0,this.solver.noCollideDirty=!0;this.wakeAll()}setWorldAnchor(e,t,i){if(this.assertLive(),this.dimension===2){let r=this.solver;if(!Number.isInteger(e)||e<0||e>=r.jointCount||r.info[e*4+1]!==-1)throw Error("A world-anchor constraint is required");r.data.set(me([t,i],2,"point"),e*O+21)}else{let r=this.constraints[e];if(!r||r.bodyA)throw Error("A world-anchor constraint is required");r.rA.set(me(t,3,"point"))}this.wakeAll()}addBox(...e){return this.addDynamic("addBox",e)}addCircle(...e){return this.addDynamic("addCircle",e)}addCapsule(...e){return this.addDynamic("addCapsule",e)}addHull(...e){return this.addDynamic("addHull",e)}addSegment(...e){return this.addDynamic("addSegment",e)}addPlane(...e){return this.addDynamic("addPlane",e)}addDynamic(e,t){if(this.destroyed)throw Error("The solver has been destroyed");if(this.dimension!==2)throw Error("Build 3D bodies before creating the solver");this.wakeAll();let i=this.sleeping?{speedThreshold:this.sleeping.speedThreshold,timeThreshold:this.sleeping.timeThreshold}:null,r=this.builder[e](...t);return i&&this.enableSleeping(i),r}appendJoint(e,t,i,r,o,a=1/0){if(this.assertLive(),this.dimension!==2)throw Error("Build 3D constraints before creating the solver");return this.wakeAll(),this.builder.addJoint(e,t,i,r,{stiffness:o,breakForce:a}).slot}captureConstraintFrames(e){if(this.assertLive(),this.dimension!==3)throw Error("Constraint frame capture requires a 3D world");let t=Array.from(e);for(let{slot:i,spring:r}of t){let o=this.constraints[i];if(!Number.isInteger(i)||!o||o.broken||o.cpuAngular||(r?o.rest===void 0:o.stiffnessAng===void 0))throw Error("A live spring or joint slot is required")}this.flushEdits();for(let{slot:i,spring:r}of t)qn(this.constraints[i],r);t.length&&this.wakeAll()}setSpringMaterial(e,t={}){this.assertLive();let i=this.constraints[e];if(!i||i.rest===void 0)throw Error("A spring constraint is required");xr(i,It(t)),this.wakeAll()}packBodyRecords(e,t=!1){let i=this.solver,r=this.dimension,o=t?r===3?8:4:r===3?40:24,a=e?.length??this.bodyCount,n=new Float32Array(a*o);for(let l=0;l<a;l++){let c=e?.[l]??l,u=l*o;if(t){if(r===3){let f=i.bodies[c];n.set(f.positionLin,u),n[u+3]=f.friction,n.set(f.positionAng,u+4)}else n.set(i.pose.subarray(c*4,c*4+4),u),n[u+3]=i.props[c*4];continue}if(r===3){let f=i.bodies[c];n.set(f.positionLin,u),n[u+3]=f.friction,n.set(f.positionAng,u+4),n.set(f.initialLin,u+8),n[u+11]=+!!f.isTrigger,n.set(f.initialAng,u+12),n.set(f.size,u+16),n[u+19]=f.sleeping?0:f.mass,n.set(f.moment,u+20),n[u+23]=f.radius,n.set(f.inertialLin,u+24),n.set(f.inertialAng,u+28),n.set(f.velocityLin,u+32),n[u+35]=f.prevVelocityLin.reduce((d,p,m)=>d+p*i.up[m],0),n.set(f.velocityAng,u+36),n[u+39]=De(f)?1:Fe(f)?-1:Ct(f)?3:ar(f)?2:0}else n.set(i.pose.subarray(c*4,c*4+4),u),n[u+3]=i.props[c*4],n.set(i.initial.subarray(c*4,c*4+4),u+4),n.set(i.inertial.subarray(c*4,c*4+4),u+8),n.set(i.velocity.subarray(c*4,c*4+4),u+12),n.set(i.prevVelocity.subarray(c*4,c*4+4),u+16),n.set(i.shape.subarray(c*4,c*4+4),u+20)}return n}async readBodies(){return this.flushEdits(),this.packBodyRecords()}async readSelectedBodies(e,{posesOnly:t=!1}={}){let i=Array.from(e);return i.forEach(r=>this.liveIndex(r)),this.flushEdits(),this.packBodyRecords(i,t)}async readBodyState(e){this.liveIndex(e),this.flushEdits();let t=this.solver;if(this.dimension===3){let i=t.bodies[e],r=this.sleeping?.asleep.has(e)??!1;return{position:Array.from(i.positionLin),rotation:Array.from(i.positionAng),linearVelocity:Array.from(i.velocityLin),angularVelocity:Array.from(i.velocityAng),mass:i.mass,effectiveMass:r?0:i.mass,sleeping:r}}return{position:Array.from(t.pose.subarray(e*4,e*4+2)),angle:t.pose[e*4+2],linearVelocity:Array.from(t.velocity.subarray(e*4,e*4+2)),angularVelocity:t.velocity[e*4+2],mass:t.shape[e*4+2],moment:t.shape[e*4+3],sleeping:this.sleeping?.asleep.has(e)??!1}}async readJoints(){return this.flushEdits(),this.packJointRecords()}packJointRecords(){let e=this.dimension===3?32:36,t=new Float32Array(this.jointCount*e),i=r=>r===1/0?3e38:r===-1/0?-3e38:r;if(this.dimension===2){let r=this.solver.data;for(let o=0;o<this.jointCount;o++){let a=o*36,n=o*O;[se,te,Q,_e,Ae,Pt,fe].forEach((l,c)=>{for(let u=0;u<3;u++)t[a+c*4+u]=i(r[n+l+u])}),t.set([r[n+N],r[n+N+1],r[n+Y],r[n+Y+1]],a+28),t.set([r[n+re],r[n+re+1],r[n+re+2],0],a+32)}}else this.constraints.forEach((r,o)=>{let a=o*32;if(r.cpuAngular){let n=r.cpuAngular,l=n.options;t.set(n.pen,a),t[a+3]=r.broken?0:1,t.set(n.lam,a+8),t.set(n.ta,a+16),t.set(n.tb,a+20),t.set(l.axisA,a+24),t.set(l.axisB,a+28),t[a+19]=n.c0?.[0]??0,t[a+23]=n.c0?.[1]??0,t[a+27]=l.type==="motor"?l.speed:l.minAngle,t[a+31]=l.type==="motor"?l.maxTorque:l.maxAngle;return}for(let[n,l]of[["penaltyLin",0],["penaltyAng",4],["lambdaLin",8],["lambdaAng",12],["C0Lin",16],["C0Ang",20],["rA",24],["rB",28]])r[n]&&t.set(r[n],a+l);if(t[a+3]=r.broken?0:i(r.stiffnessLin??r.stiffness??0),t[a+7]=r.broken?0:i(r.stiffnessAng??0),t[a+11]=i(r.fracture??0),t[a+15]=r.torqueArm??0,t[a+27]=r.rest??0,r.cpuRest&&(t[a+19]=r.cpuRest[0],t[a+23]=r.cpuRest[1],t[a+27]=r.cpuRest[2],t[a+31]=r.cpuRest[3]),r.rest!==void 0){let n=Ui(r);t[a+11]=Number.isFinite(n?.breakStrain)?n.breakStrain:0,t[a+15]=Number.isFinite(n?.breakForce)?n.breakForce:0}});return t}async readCounters(){this.assertLive();let e=this.dimension===2?this.solver.contactCount:this.solver.forces.reduce((i,r)=>i+(r.contacts?.length??0),0),t=this.dimension===2?this.solver.contactPairs.length:this.solver.forces.filter(i=>i.contacts?.length).length;return{pairs:t,contacts:e,manifolds:t,joints:this.jointCount,overflow:0,clashes:0,colors:0,sleeping:this.sleeping?.asleep.size??0}}adapt(){}watchContacts({indices:e,maxPairs:t=this.maxPairs??8192,maxEvents:i=this.maxEvents??4096}={}){if(this.assertLive(),!Number.isInteger(i)||i<1||!Number.isInteger(t)||t<1)throw Error("Contact capacities must be positive integers");return e!==void 0?(e.forEach(r=>this.liveIndex(r)),this.watched=new Set(e)):this.watched??=new Set(Array.from({length:this.bodyCount},(r,o)=>o)),this.maxEvents=i,this.maxPairs=t,this}captureEvents(){if(!this.watched)return;let e=this.dimension===3?new Map(this.solver.bodies.map((i,r)=>[i,r])):null,t=this.dimension===2?this.solver.contactPairs:this.solver.forces.filter(i=>i.contacts?.length).map(i=>{let r=Array.from(i.bodyA.positionLin);for(let o of i.contacts){let a=Ee(i.bodyA.positionAng,o.rA);for(let n=0;n<3;n++)r[n]+=a[n]/i.contacts.length}return{a:e.get(i.bodyA),b:e.get(i.bodyB),point:r,normal:Array.from(i.basis.slice(0,3)),impulse:i.bodyA.isTrigger||i.bodyB.isTrigger?0:i.contacts.reduce((o,a)=>o+Math.abs(a.lambda[0])*this.params.dt,0)}});this.trackContactPairs(t)}trackContactPairs(e){let t=new Map,i=(a,n)=>{this.events.length<(this.maxEvents??4096)?this.events.push({...a,normal:a.normal??[...a.n,0],type:n,kind:n==="begin"?1:2,step:this.stepCount,isTrigger:a.isTrigger??(this.dimension===3?!!(this.solver.bodies[a.a].isTrigger||this.solver.bodies[a.b].isTrigger):this.solver.sensors.has(a.a)||this.solver.sensors.has(a.b))}):this.dropped=(this.dropped??0)+1},r=new Set,o=[];for(let a of e){if(!this.watched.has(a.a)&&!this.watched.has(a.b))continue;let n=`${Math.max(a.a,a.b)},${Math.min(a.a,a.b)}`;r.add(n),this.previous.has(n)&&t.size<this.maxPairs?t.set(n,a):o.push([n,a])}for(let[a,n]of o)if(!t.has(a)){if(t.size>=this.maxPairs){this.pairFull=!0;continue}t.set(a,n),this.previous.has(a)||i(n,"begin")}for(let[a,n]of this.previous)r.has(a)||i({...n,impulse:0},"end");this.previous=t}async readContactEvents(){this.watchContacts();let e={events:this.events,dropped:this.dropped??0,full:!!this.dropped||!!this.pairFull};return this.events=[],this.dropped=0,this.pairFull=!1,e}async raycast(e,t,i){return this.sphereCast(e,0,t,i)}async circleCast(e,t,i,r){return this.sphereCast(e,t,i,r)}async sphereCast(e,t,i,r){return this.flushEdits(),mu(this,e,t,i,r)}async raycastAll(e,t){return Promise.all(e.map(i=>this.raycast(i.origin,i.direction,{...t,maxDistance:i.maxDistance??t?.maxDistance})))}async sphereCastAll(e,t){return Promise.all(e.map(i=>this.sphereCast(i.origin,i.radius,i.direction,{...t,maxDistance:i.maxDistance??t?.maxDistance})))}async circleCastAll(e,t){return this.sphereCastAll(e,t)}setSleepEnabled(e,t){if(this.liveIndex(e),typeof t!="boolean")throw Error("Sleep flag must be boolean");return this.dimension===3?this.solver.bodies[e].allowSleep=t:(this.solver.avbdSleepEligible??=new Map,this.solver.avbdSleepEligible.set(e,t)),t&&!this.sleeping&&this.enableSleeping(),this.wakeAll(),this}enableSleeping(e={}){return this.assertLive(),this.disableSleeping(),this.sleeping=new pa(this,e),this}disableSleeping(){return this.sleeping?.wake(),this.sleeping=null,this}async readSleepStats(){return this.assertLive(),{sleeping:this.sleeping?.asleep.size??0,wakeRequested:!1}}wakeUp(e){return this.liveIndex(e),this.wakeAll()}wakeAll(){return this.sleeping?.wake(),this}destroy(){this.destroyed||(this.detachFromScene(),this.disableSleeping(),this.pending.count=0,this.events=[],this.previous.clear(),this.destroyed=!0)}};var gu=new WeakSet,ga=s=>s!==null&&typeof s=="object"&&gu.has(s),bu=s=>gu.add(s);async function yu({backend:s="webgpu",device:e,gl:t,validate3D:i=!0,...r}={}){if(!["webgpu","cpu"].includes(s))throw Error(`Unsupported solver backend: ${s}`);if(s!=="webgpu"&&e!==void 0)throw Error("Only WebGPU initialization accepts a GPU device");if(t!==void 0)throw Error("Solver pipelines do not accept a WebGL context");let o,a=!1,n=!1;s==="webgpu"&&(e?i&&await Ni(e):({device:e,adapter:o}=await Sr({...r,preferredLimits:{maxStorageBuffersPerShaderStage:9,maxStorageBufferBindingSize:512*1024*1024,maxBufferSize:1024*1024*1024,...r.preferredLimits},validate3D:i}),a=!0));let l=new Set,c={backend:s,device:e,adapter:o,createSolver(u,f={}){if(n)throw Error("The solver pipeline has been destroyed");if(!u||typeof u.assertEditable!="function"||!u.ref&&!u.topology)throw Error("An AVBD scene builder is required");u.assertEditable();let d;if(s==="webgpu")d=u.createSolver(e,f);else{let m=u.ref?3:u.topology?2:0;if(f.bodyBuffer!==void 0)throw Error("A GPU body buffer requires the WebGPU backend");d=new ma(u,m,f),u.gpu=d,u.created=!0}Object.defineProperty(d,"backend",{value:s,configurable:!0}),l.add(d);let p=d.destroy;return d.destroy=function(){p.call(this),l.delete(this)},d},destroy(){if(!n){for(let u of l)u.destroy();l.clear(),a&&e.destroy(),n=!0}}};return bu(c),c}var ie=(s,e,t)=>{let i=Array.from(s);if(i.length!==e||!i.every(Number.isFinite))throw Error(`${t} requires ${e} finite components`);return i},K=(s,e,t=!1)=>{if(!Number.isFinite(s)||(t?s<0:s<=0))throw Error(`${e} must be ${t?"nonnegative":"positive"} and finite`);return s},vu=s=>{if(!Number.isInteger(s)||s<0||s>4294967295)throw Error("Collision masks must be unsigned 32-bit integers");return s};function ba(s){for(let t of["allowSleep","isTrigger"])if(s[t]!==void 0&&typeof s[t]!="boolean")throw Error(`${t} must be a boolean`);let e=s.restitution??0;if(!Number.isFinite(e)||e<0||e>1)throw Error("restitution must be between 0 and 1");if(s.mass!==void 0&&(K(s.mass,"mass",!0),s.mass>0&&s.density===0))throw Error("A positive mass needs positive density");for(let t of["velocity","angularVelocity"])s[t]!==void 0&&ie(s[t],3,t);if(s.rotation!==void 0&&!Math.hypot(...ie(s.rotation,4,"rotation")))throw Error("rotation must be nonzero");vu(s.group??4294967295),vu(s.collidesWith??4294967295)}function xu(s,e){if(e.timeStep!==void 0&&(s.dt=K(e.timeStep,"timeStep")),e.iterations!==void 0){if(K(e.iterations,"iterations"),!Number.isInteger(e.iterations))throw Error("iterations must be an integer");s.iterations=e.iterations}if(e.gravity!==void 0){if(!Number.isFinite(e.gravity))throw Error("gravity must be finite");s.gravity=e.gravity}}var ya=class{constructor(e={}){if(this.ref=new ni,xu(this.ref,e),this.up=ie(e.up??[0,1,0],3,"up"),Math.abs(Math.hypot(...this.up)-1)>1e-5)throw Error("up must be a unit vector");this.points=!1,this.handles=new Map,this.bodySet=new Set}get bodies(){return this.ref.bodies}get constraints(){return[...this.handles.values()]}assertEditable(){if(this.created)throw Error("Build this scene before createSolver; use the solver's GPU edit methods afterwards")}addBox(e,t={}){this.assertEditable(),ba(t);let i=ie(e,3,"size");i.forEach(o=>K(o,"size"));let r=new Ze(this.ref,i,K(t.density??1,"density",!0),K(t.friction??.6,"friction",!0),ie(t.position??[0,0,0],3,"position"));return this.configure(r,t)}addSphere(e,t={}){return this.assertEditable(),ba(t),this.configure(nr(this.ref,K(e,"radius"),K(t.density??1,"density",!0),K(t.friction??.6,"friction",!0),ie(t.position??[0,0,0],3,"position")),t)}addHull(e,t={}){if(this.assertEditable(),ba(t),e.length%3||!Array.from(e).every(Number.isFinite))throw Error("Hull points must contain finite xyz triples");let i=Xr(e);if(!i)throw Error("A convex hull requires finite points spanning a volume");return this.hulls=!0,this.configure(lr(this.ref,i,K(t.density??1,"density",!0),K(t.friction??.6,"friction",!0),ie(t.position??[0,0,0],3,"position")),t)}addCapsule(e,t,i={}){return this.assertEditable(),ba(i),this.configure(Cr(this.ref,e,t,K(i.density??1,"density",!0),K(i.friction??.6,"friction",!0),ie(i.position??[0,0,0],3,"position")),i)}addHeightfield(e){return this.addTerrain(Mr(e),e)}addStaticMesh(e){return this.addTerrain(zr(e),e)}addTerrain(e,t={}){this.assertEditable();let i=this.ref.bodies.length,r=vo(this.ref,e,t);r.forEach(a=>this.bodySet.add(a)),this.hulls=!0;let o=!1;return{bodies:r,triangleCount:e.triangleCount,kind:e.kind,dispose:()=>{if(!o&&(o=!0,r.forEach(a=>{a.group=0,a.collidesWith=0}),this.gpu&&!this.gpu.destroyed)){let a=r.map((n,l)=>this.gpu.gpuIndex(i+l));this.gpu.setFilters(a,a.map(()=>0),a.map(()=>0)),this.gpu.wakeAll?.()}}}}configure(e,t){if(t.allowSleep!==void 0&&typeof t.allowSleep!="boolean")throw Error("allowSleep must be a boolean");e.allowSleep=t.allowSleep??!0,this.sleepOptIn||=t.allowSleep===!0;let i=t.restitution??0;if(!Number.isFinite(i)||i<0||i>1)throw Error("restitution must be between 0 and 1");if(e.restitution=i,t.isTrigger!==void 0&&typeof t.isTrigger!="boolean")throw Error("isTrigger must be a boolean");if(e.isTrigger=t.isTrigger??!1,e.group=t.group??4294967295,e.collidesWith=t.collidesWith??4294967295,t.mass!==void 0){let r=K(t.mass,"mass",!0);if(e.mass===0&&r>0)throw Error("A positive mass needs positive density");let o=e.mass>0?r/e.mass:0;e.mass=r,e.moment.forEach((a,n)=>e.moment[n]=a*o)}if(t.rotation){let r=ie(t.rotation,4,"rotation"),o=Math.hypot(...r);if(!o)throw Error("rotation must be nonzero");e.positionAng.set(r.map(a=>a/o))}return t.velocity&&e.velocityLin.set(ie(t.velocity,3,"velocity")),t.angularVelocity&&e.velocityAng.set(ie(t.angularVelocity,3,"angularVelocity")),this.bodySet.add(e),e}addPoint(e,{mass:t=.02,radius:i=.05,friction:r=.5}={}){let o=this.addSphere(i,{position:e,mass:t,friction:r});return o.moment.fill(0),this.points=!0,o}addFabric({columns:e=16,rows:t=16,spacing:i=.2,origin:r=[0,3,0],mass:o=.02,stiffness:a=1e3,anchorStiffness:n=a,materialAt:l,breakStrain:c=1/0,breakForce:u=1/0,bendingStiffness:f=Number.isFinite(c)||Number.isFinite(u)?0:a/50,pinCorners:d=!1,pinEdges:p=!d}={}){for(let[E,k]of Object.entries({columns:e,rows:t}))if(!Number.isInteger(k)||k<2)throw Error(`${E} must be an integer >= 2`);if(K(i,"spacing"),K(o,"mass"),K(a,"stiffness"),K(n,"anchorStiffness"),l!==void 0&&typeof l!="function")throw Error("materialAt must be a function");if(K(f,"bendingStiffness",!0),typeof d!="boolean"||typeof p!="boolean")throw Error("Fabric pin options must be boolean");let m=It({breakStrain:c,breakForce:u}),h=ie(r,3,"origin"),g=(E,k)=>`${Math.min(E,k)},${Math.max(E,k)}`;function*b(){for(let E=0;E<t;E++)for(let k=0;k<e;k++){let P=E*e+k;k&&(yield[P,P-1,a]),E&&(yield[P,P-e,a]),k&&E&&(yield[P,P-e-1,a/2],yield[P-1,P-e,a/2]),k>1&&f&&(yield[P,P-2,f]),E>1&&f&&(yield[P,P-2*e,f])}}let y=new Map;if(l)for(let[E,k]of b()){let P=l((E%e+k%e)/(2*(e-1)),(Math.floor(E/e)+Math.floor(k/e))/(2*(t-1)))??{};if(typeof P!="object"||Array.isArray(P))throw Error("materialAt must return a material object");y.set(g(E,k),{scale:K(P.stiffnessScale??1,"materialAt.stiffnessScale"),material:It({...m,...P})})}let A=Array.from({length:t},(E,k)=>Array.from({length:e},(P,C)=>this.addPoint([h[0]+(C-(e-1)/2)*i,h[1],h[2]+(k-(t-1)/2)*i],{mass:p&&(C===0||k===0||C===e-1||k===t-1)||d&&(C===0||C===e-1)&&(k===0||k===t-1)?0:o,radius:i/Math.SQRT2}))),v=A.flat(),x=new Map(v.map((E,k)=>[E,k])),w=[],B=new Map,L=(E,k,P)=>{(E.mass===0||k.mass===0)&&(P*=n/a);let C=x.get(E),_=x.get(k),z=y.get(g(C,_)),R=this.addSpring(E,k,[0,0,0],[0,0,0],{stiffness:P*(z?.scale??1),...z?.material??m});return B.set(g(x.get(E),x.get(k)),w.length),w.push(R),R};for(let[E,k,P]of b())L(v[E],v[k],P);let M=[];for(let E=0;E<t;E++)for(let k=0;k<e;k++)if(k&&E){let P=(E-1)*e+k-1,C=P+1,_=E*e+k-1,z=_+1;M.push(P,_,C,C,_,z)}let I=[];for(let E=0;E<M.length;E+=3){let[k,P,C]=M.slice(E,E+3);I.push(B.get(g(k,P)),B.get(g(P,C)),B.get(g(C,k)))}return{points:v,grid:A,indices:Uint32Array.from(M),connections:w,triangleConnections:Uint32Array.from(I)}}addRope({segments:e=12,length:t=12,origin:i=[0,12,0],width:r=.15,endMass:o=20}={}){if(!Number.isInteger(e)||e<1)throw Error("segments must be a positive integer");K(t,"length"),K(r,"width"),K(o,"endMass",!0);let a=ie(i,3,"origin"),n=t/e,l=this.addBox([r,r,r],{mass:0,position:a}),c=[];for(let u=0;u<e;u++){let f=this.addBox([r,n,r],{mass:1,position:[a[0],a[1]-(u+.5)*n,a[2]]});this.addJoint(u?c[u-1]:l,f,[0,u?-n/2:0,0],[0,n/2,0]),c.push(f)}if(o){let u=this.addBox([.6,.6,.6],{mass:o,position:[a[0],a[1]-t-.3,a[2]]});this.addJoint(c.at(-1),u,[0,-n/2,0],[0,.3,0]),c.push(u)}return{anchor:l,links:c}}addRagdoll({origin:e=[0,2,0],mass:t=10}={}){let i=ie(e,3,"origin");K(t,"mass");let r=(l,c)=>this.addBox(l,{mass:t/10,position:c.map((u,f)=>u+i[f])}),o=r([.7,1.2,.35],[0,2,0]),a=this.addSphere(.25,{mass:t/10,position:[i[0],i[1]+2.9,i[2]]}),n=[o,a];this.addJoint(o,a,[0,.6,0],[0,-.3,0]);for(let l of[-1,1]){let c=r([.3,.8,.3],[l*.5,1.95,0]),u=r([.26,.7,.26],[l*.5,1.2,0]);this.addJoint(o,c,[l*.35,.35,0],[-l*.15,.4,0]),this.addJoint(c,u,[0,-.4,0],[0,.35,0]);let f=r([.28,.8,.3],[l*.2,1,0]),d=r([.26,.75,.28],[l*.2,.225,0]);this.addJoint(o,f,[l*.2,-.6,0],[0,.4,0]),this.addJoint(f,d,[0,-.4,0],[0,.375,0]),n.push(c,u,f,d)}return{torso:o,head:a,bodies:n}}addJoint(e,t,i=[0,0,0],r=[0,0,0],{linearStiffness:o=1/0,angularStiffness:a=0,breakForce:n=1/0,breakOnPull:l=!1}={}){this.assertEditable(),this.checkBodies(e,t);for(let c of[o,a,n])c!==1/0&&K(c,"joint stiffness/breakForce",!0);return this.handle(new ke(this.ref,e,t,ie(i,3,"anchorA"),ie(r,3,"anchorB"),o,a,l&&n!==1/0?-n:n))}addSpring(e,t,i=[0,0,0],r=[0,0,0],{stiffness:o=1e3,rest:a=-1,breakStrain:n=1/0,breakForce:l=1/0}={}){if(this.assertEditable(),this.checkBodies(e,t),!e)throw Error("A spring requires two bodies");K(o,"stiffness",!0),a!==-1&&K(a,"rest",!0);let c=It({breakStrain:n,breakForce:l}),u=new dt(this.ref,e,t,ie(i,3,"anchorA"),ie(r,3,"anchorB"),o,a);return xr(u,c),this.handle(u)}checkBodies(e,t){if(!t||e===t||!this.bodySet.has(t)||e&&!this.bodySet.has(e))throw Error("Constraint endpoints must be distinct bodies in this scene")}addMotor(e,t,i={}){this.assertEditable(),this.checkBodies(e,t);let r=kt({...i,type:"motor"}),o=new ke(this.ref,e,t,[0,0,0],[0,0,0],1/0,0);return Br(o,r),this.handle(o)}addHinge(e,t,i={}){this.assertEditable(),this.checkBodies(e,t);let r=kt({...i,type:"limit"}),o=K(i.span??1,"span"),a=ie(i.anchorA??[0,0,0],3,"anchorA"),n=ie(i.anchorB??[0,0,0],3,"anchorB"),l=[-1,1].map(f=>this.addJoint(e,t,a.map((d,p)=>d+f*o*.5*r.axisA[p]),n.map((d,p)=>d+f*o*.5*r.axisB[p]))),c,u;if(i.minAngle!==void 0||i.maxAngle!==void 0){let f=new ke(this.ref,e,t,[0,0,0],[0,0,0],1/0,0);Br(f,r),c=this.handle(f)}return i.motor&&(u=this.addMotor(e,t,{axisA:r.axisA,axisB:r.axisB,...i.motor})),{joints:l,limit:c,motor:u,dispose(){for(let f of[...l,c,u])f?.dispose()}}}handle(e){let t={slot:-1,disposed:!1,dispose:()=>{t.disposed||(this.gpu?this.gpu.destroyed||this.gpu.releaseJoints([t.slot]):e.destroy(),this.handles.delete(e),t.disposed=!0)}};return t.destroy=t.dispose,this.handles.set(e,t),t}createSolver(e,t={}){if(ga(e))return e.createSolver(this,t);if(this.assertEditable(),this.hulls&&e.limits.maxStorageBuffersPerShaderStage<9)throw Error("Hull collisions require nine storage buffer bindings");let i=new Zo(e,this.ref,go(this.ref,{...t,...this.points?{shaders:{...t.shaders,solve:Xc}}:{}})),r=[];this.ref.forces.forEach((l,c)=>{this.handles.get(l).slot=c,l instanceof ke&&l.stiffnessAng>0&&r.push({slot:c})}),i.captureConstraintFrames(r),i.params.up=[...this.up];let o=[],a=[],n=[];for(let[l,c]of this.ref.bodies.entries())(c.group!==4294967295||c.collidesWith!==4294967295)&&(o.push(i.gpuIndex(l)),a.push(c.group),n.push(c.collidesWith)),c.isTrigger&&i.setSensor(i.gpuIndex(l),!0),c.restitution>0&&i.setRestitution(i.gpuIndex(l),c.restitution);return o.length&&i.setFilters(o,a,n),(t.sleeping||this.sleepOptIn)&&i.enableSleeping(this.ref,t.sleeping===!0?{}:t.sleeping),this.gpu=i,this.created=!0,i}},va=class{constructor(e={}){if(this.topology=new Dr,Object.assign(this.topology.params,ko()),xu(this.topology.params,e),e.alpha!==void 0){if(!Number.isFinite(e.alpha)||e.alpha<0||e.alpha>1)throw Error("alpha must be between zero and one");this.topology.params.alpha=e.alpha}for(let t of["postStabilize","matchNearest"])if(e[t]!==void 0){if(typeof e[t]!="boolean")throw Error(`${t} must be boolean`);this.topology.params[t]=e[t]}}assertEditable(){if(this.created)throw Error("Build this scene before createSolver; use GPU edit methods afterwards")}get bodyCount(){return this.topology.bodyCount}addShape(e,t={}){let i=e.options??t,r=this.addBox(e.size,i);return Fr(this.topology,r,e,i.density??1),r}addCircle(e,t={}){return this.addShape(qo(e),t)}addHull(e,t={}){return this.addShape(No(e),t)}addCapsule(e,t,i={}){return this.addShape(Vo(e,t),i)}addSegment(e,t,i={}){return this.addShape(Wo(e,t,i))}addPlane(e=[0,1],t=0,i={}){return this.addShape(Ho(e,t,i))}addBox(e,{density:t=1,friction:i=.6,position:r=[0,0],angle:o=0,velocity:a=[0,0,0],restitution:n=0,isTrigger:l=!1,group:c=4294967295,collidesWith:u=4294967295,allowSleep:f}={}){if(this.assertEditable(),f!==void 0&&typeof f!="boolean")throw Error("allowSleep must be boolean");let d=ie(e,2,"size");d.forEach(h=>K(h,"size"));let p=ie(r,2,"position");if(!Number.isFinite(o))throw Error("angle must be finite");if(!Number.isFinite(n)||n<0||n>1)throw Error("restitution must be between 0 and 1");if(typeof l!="boolean")throw Error("isTrigger must be boolean");for(let h of[c,u])if(!Number.isInteger(h)||h<0||h>4294967295)throw Error("Collision masks must be unsigned 32-bit integers");let m=this.topology.addBody(d,K(t,"density",!0),K(i,"friction",!0),[...p,o],ie(a,3,"velocity"));return this.restitution??=new Map,n>0&&this.restitution.set(m,n),this.sensors??=new Set,l&&this.sensors.add(m),this.filters??=new Map,(c!==4294967295||u!==4294967295)&&this.filters.set(m,[c,u]),this.topology.avbdSleepEligible??=new Map,f!==void 0&&this.topology.avbdSleepEligible.set(m,f),m}checkBodies(e,t){if(!Number.isInteger(e)||!Number.isInteger(t)||e<-1||e>=this.bodyCount||t<0||t>=this.bodyCount||e===t)throw Error("Invalid 2D constraint endpoints")}addJoint(e,t,i=[0,0],r=[0,0],{stiffness:o=[1/0,1/0,0],breakForce:a=1/0}={}){if(this.assertEditable(),this.checkBodies(e,t),!o||o.length!==3||Array.from(o).some(l=>l!==1/0&&(!Number.isFinite(l)||l<0))||a!==1/0&&(!Number.isFinite(a)||a<0))throw Error("Joint stiffness and break force must be nonnegative or Infinity");let n=this.topology.addJoint(e,t,ie(i,2,"anchorA"),ie(r,2,"anchorB"),o,a);return this.constraintHandle(n.slot,n)}constraintHandle(e,t={}){return Object.assign(t,{slot:e,alive:!0,disposed:!1}),t.dispose=()=>{t.disposed||(this.gpu&&!this.gpu.destroyed?this.gpu.disableConstraint(e):this.gpu||this.topology.data.fill(0,e*O+Q,e*O+Q+3),t.alive=!1,t.disposed=!0)},t.destroy=t.dispose,this.topology.handles[e]=t,t}addSpring(e,t,i=[0,0],r=[0,0],{stiffness:o=1e3,rest:a=1}={}){if(this.assertEditable(),this.checkBodies(e,t),e<0)throw Error("A spring requires two bodies");let n=this.topology.jointCount;return this.topology.addSpring(e,t,ie(i,2,"anchorA"),ie(r,2,"anchorB"),K(o,"stiffness",!0),K(a,"rest",!0)),this.constraintHandle(n)}addMotor(e,t,{speed:i=1,maxTorque:r=100}={}){if(this.assertEditable(),this.checkBodies(e,t),!Number.isFinite(i))throw Error("speed must be finite");let o=this.topology.jointCount;return this.topology.addMotor(e,t,i,K(r,"maxTorque",!0)),this.constraintHandle(o)}addAngularLimit(e,t,i={}){this.assertEditable(),this.checkBodies(e,t);let r=ki(i),o=this.topology.addJoint(e,t,[0,0],[0,0],[0,0,0]);Bs(this.topology,o.slot,r);let a=this.constraintHandle(o.slot,o);return a.setLimits=n=>{if(a.disposed)throw Error("The angular limit has been disposed");return this.gpu?this.gpu.setAngleLimits(a.slot,n):Bs(this.topology,a.slot,ki(n)),a},a}addHinge(e,t,i=[0,0],r=[0,0],o={}){this.assertEditable(),this.checkBodies(e,t);let a=ie(i,2,"anchorA"),n=ie(r,2,"anchorB"),l=o.minAngle!==void 0||o.maxAngle!==void 0?ki(o):null,c=o.motor;if(c){if(!Number.isFinite(c.speed??1))throw Error("speed must be finite");K(c.maxTorque??100,"maxTorque",!0)}let u=this.addJoint(e,t,a,n),f=l?this.addAngularLimit(e,t,l):null,d=c?this.addMotor(e,t,c):null;return{joint:u,limits:f,motor:d,disposed:!1,dispose(){this.disposed||(this.joint.dispose(),this.limits?.dispose(),this.motor?.dispose(),this.disposed=!0)},destroy(){this.dispose()}}}createSolver(e,t={}){if(ga(e))return e.createSolver(this,t);this.assertEditable();let i=new Ko(e,this.topology,t);for(let[r,o]of this.restitution??[])i.setRestitution(r,o);for(let r of this.sensors??[])i.setSensor(r,!0);for(let[r,o]of this.filters??[])i.setFilters([r],[o[0]],[o[1]]);return this.gpu=i,this.created=!0,i}};var Wr=class{constructor(e){if(this.device=e,this.latestMs=null,this.samples=0,this.slots=[],!!e.features.has("timestamp-query"))for(let t=0;t<3;t++)this.slots.push({query:e.createQuerySet({type:"timestamp",count:2}),resolve:e.createBuffer({size:256,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC}),read:e.createBuffer({size:16,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),busy:!1})}begin(){let e=this.slots.find(t=>!t.busy);return!e||this.disposed?null:(e.busy=!0,e)}descriptor(e){return e?{timestampWrites:{querySet:e.query,beginningOfPassWriteIndex:0,endOfPassWriteIndex:1}}:{}}encode(e,t){t&&(e.resolveQuerySet(t.query,0,2,t.resolve,0),e.copyBufferToBuffer(t.resolve,0,t.read,0,16))}resolve(e){if(e)return e.pending=e.read.mapAsync(GPUMapMode.READ).then(()=>{let t=new BigUint64Array(e.read.getMappedRange());this.latestMs=Number(t[1]-t[0])/1e6,this.samples++,e.read.unmap()}).catch(()=>{}).finally(()=>{e.busy=!1,e.pending=null}),e.pending}settled(){return Promise.all(this.slots.map(e=>e.pending))}destroy(){this.disposed=!0;for(let e of this.slots)e.query.destroy(),e.resolve.destroy(),e.read.destroy()}};var Au=(s,e)=>Math.ceil(s/e)*e,wu=s=>String(s>>>0),Hr=class{constructor(e,t={}){this.device=e,this.maxFreeBytes=t.maxFreeBytes??201326592,this.freeBytes=0,this.free=new Map,this.all=new Set}acquire(e,t,i="recycled-buffer"){let r=Au(Math.max(4,e),4),o=wu(t),a=this.free.get(o);if(a){let l=-1,c=1/0;for(let u=0;u<a.length;u+=1){let f=a[u];f.size>=r&&f.size<c&&(l=u,c=f.size)}if(l>=0){let[u]=a.splice(l,1);return this.freeBytes-=u.size,u.buffer}}let n=this.device.createBuffer({label:i,size:r,usage:t,mappedAtCreation:!1});return this.all.add(n),n}release(e,t,i){if(!e)return;let r=Au(Math.max(4,t),4);if(this.freeBytes+r>this.maxFreeBytes){e.destroy(),this.all.delete(e);return}let o=wu(i),a=this.free.get(o);a||(a=[],this.free.set(o,a)),a.push({buffer:e,size:r,usage:i}),this.freeBytes+=r}trim(e=this.maxFreeBytes){this.maxFreeBytes=e;for(let[t,i]of this.free.entries()){for(;this.freeBytes>this.maxFreeBytes&&i.length>0;){let r=i.pop();r.buffer.destroy(),this.all.delete(r.buffer),this.freeBytes-=r.size}i.length===0&&this.free.delete(t)}}destroy(){for(let e of this.all)e.destroy();this.free.clear(),this.all.clear(),this.freeBytes=0}};var Bu=`const EPS : f32 = 1.0e-7;

struct Bullet {
  posLife: vec4<f32>,
  velRadius: vec4<f32>,
  seed: vec4<u32>,
}

struct Triangle {
  a: vec4<f32>,
  b: vec4<f32>,
  c: vec4<f32>,
}

struct Counters {
  hits: atomic<u32>,
  alive: atomic<u32>,
  _pad0: atomic<u32>,
  _pad1: atomic<u32>,
}

struct Params {
  dt: f32,
  speed: f32,
  life: f32,
  bulletRadius: f32,

  spawnRadius: f32,
  jitter: f32,
  targetCount: u32,
  triCount: u32,

  frame: u32,
  dispatchWidth: u32,
  _pad1: u32,
  _pad2: u32,
}

@group(0) @binding(0) var<storage, read_write> bullets : array<Bullet>;
@group(0) @binding(1) var<storage, read> triangles : array<Triangle>;
@group(0) @binding(2) var<storage, read_write> counters : Counters;
@group(0) @binding(3) var<uniform> params : Params;

fn hashU32(xIn: u32) -> u32 {
  var x = xIn;
  x ^= x >> 16u;
  x *= 0x7feb352du;
  x ^= x >> 15u;
  x *= 0x846ca68bu;
  x ^= x >> 16u;
  return x;
}

fn rand01(state: ptr<function, u32>) -> f32 {
  let h = hashU32((*state) + 0x9e3779b9u);
  *state = h;
  return f32(h) * 2.3283064365386963e-10;
}

fn randSigned(state: ptr<function, u32>) -> f32 {
  return rand01(state) * 2.0 - 1.0;
}

fn randomUnit(state: ptr<function, u32>) -> vec3<f32> {
  var v = vec3<f32>(1.0, 0.0, 0.0);
  var ok = false;
  for (var i = 0u; i < 12u; i += 1u) {
    let p = vec3<f32>(randSigned(state), randSigned(state), randSigned(state));
    let l2 = dot(p, p);
    if (!ok && l2 > 1.0e-5 && l2 <= 1.0) {
      v = p * inverseSqrt(l2);
      ok = true;
    }
  }
  return v;
}

fn safeNormal(v: vec3<f32>) -> vec3<f32> {
  let l2 = dot(v, v);
  if (l2 > EPS) {
    return v * inverseSqrt(l2);
  }
  return vec3<f32>(1.0, 0.0, 0.0);
}

fn makeBasis(dir: vec3<f32>) -> mat3x3<f32> {
  var helper = vec3<f32>(0.0, 1.0, 0.0);
  if (abs(dir.y) > 0.85) {
    helper = vec3<f32>(1.0, 0.0, 0.0);
  }
  let u = safeNormal(cross(helper, dir));
  let v = safeNormal(cross(dir, u));
  return mat3x3<f32>(u, v, dir);
}

fn respawn(id: u32, frameSalt: u32) {
  var state = hashU32(id * 747796405u + frameSalt * 2891336453u + 0x68bc21ebu);
  let spawnDir = randomUnit(&state);
  let pos = spawnDir * params.spawnRadius;
  let jitter = randomUnit(&state) * params.jitter;
  let velDir = safeNormal(-pos + jitter);
  bullets[id].posLife = vec4<f32>(pos, params.life);
  bullets[id].velRadius = vec4<f32>(velDir * params.speed, params.bulletRadius);
  bullets[id].seed = vec4<u32>(state, frameSalt, id, 0u);
}

fn rayTriHit(
  origin: vec3<f32>,
  dir: vec3<f32>,
  maxT: f32,
  a: vec3<f32>,
  b: vec3<f32>,
  c: vec3<f32>
) -> bool {
  let ab = b - a;
  let ac = c - a;
  let p = cross(dir, ac);
  let det = dot(ab, p);
  if (abs(det) < EPS) {
    return false;
  }

  let invDet = 1.0 / det;
  let tvec = origin - a;
  let u = dot(tvec, p) * invDet;
  if (u < 0.0 || u > 1.0) {
    return false;
  }

  let q = cross(tvec, ab);
  let v = dot(dir, q) * invDet;
  if (v < 0.0 || u + v > 1.0) {
    return false;
  }

  let t = dot(ac, q) * invDet;
  return t >= 0.0 && t <= maxT;
}

fn sweepTriangle(p0: vec3<f32>, p1: vec3<f32>, radius: f32, tri: Triangle) -> bool {
  let delta = p1 - p0;
  let len = length(delta);
  if (len < EPS) {
    return false;
  }

  let dir = delta / len;
  let basis = makeBasis(dir);
  let u = basis[0] * radius * 0.85;
  let v = basis[1] * radius * 0.85;
  let maxT = len + radius * 2.75;
  let a = tri.a.xyz;
  let b = tri.b.xyz;
  let c = tri.c.xyz;

  if (rayTriHit(p0, dir, maxT, a, b, c)) { return true; }
  if (rayTriHit(p0 + u, dir, maxT, a, b, c)) { return true; }
  if (rayTriHit(p0 - u, dir, maxT, a, b, c)) { return true; }
  if (rayTriHit(p0 + v, dir, maxT, a, b, c)) { return true; }
  if (rayTriHit(p0 - v, dir, maxT, a, b, c)) { return true; }
  return false;
}

@compute @workgroup_size(128)
fn collisionBenchmark(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id = gid.x + gid.y * params.dispatchWidth;
  if (id >= params.targetCount) {
    if (id < arrayLength(&bullets)) {
      bullets[id].posLife.w = -1.0;
    }
    return;
  }

  var b = bullets[id];
  if (b.posLife.w <= 0.0 || b.velRadius.w <= 0.0) {
    respawn(id, params.frame);
    atomicAdd(&counters.alive, 1u);
    return;
  }

  let p0 = b.posLife.xyz;
  let p1 = p0 + b.velRadius.xyz * params.dt;
  var hit = false;

  for (var triId = 0u; triId < params.triCount; triId += 1u) {
    if (!hit && sweepTriangle(p0, p1, b.velRadius.w, triangles[triId])) {
      hit = true;
    }
  }

  if (hit) {
    atomicAdd(&counters.hits, 1u);
    respawn(id, params.frame + 97u);
    atomicAdd(&counters.alive, 1u);
    return;
  }

  b.posLife = vec4<f32>(p1, b.posLife.w - params.dt);
  bullets[id] = b;
  atomicAdd(&counters.alive, 1u);
}
`;var Ls=48,Wn=48,_s=16,Hn=48,$n=class{constructor(e,t,i=3){this.device=e,this.recycler=t,this.slotCount=Math.max(2,i|0),this.usage=GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST,this.slots=[],this.cursor=0,this.latest={hits:0,alive:0};for(let r=0;r<this.slotCount;r+=1)this.slots.push({buffer:t.acquire(_s,this.usage,`collision-counter-readback-${r}`),pending:!1})}encodeCopy(e,t){let i=null;for(let r=0;r<this.slots.length;r+=1){let o=(this.cursor+r)%this.slots.length;if(!this.slots[o].pending){i=this.slots[o],this.cursor=(o+1)%this.slots.length;break}}return i?(i.pending=!0,e.copyBufferToBuffer(t,0,i.buffer,0,_s),i):null}resolve(e){return e?(e.buffer.mapAsync(GPUMapMode.READ).then(()=>{let t=new Uint32Array(e.buffer.getMappedRange(),0,4);this.latest={hits:t[0],alive:t[1]},e.buffer.unmap(),e.pending=!1}).catch(t=>{this.disposed||console.warn("Particle counter readback failed:",t),e.pending=!1}),this.latest):this.latest}destroy(){this.disposed=!0;for(let e of this.slots)e.pending||this.recycler.release(e.buffer,_s,this.usage);this.slots.length=0}},xa=class{constructor(e,{capacity:t,triangleCount:i,readback:r=!0}={}){let o=e.limits.maxComputeWorkgroupsPerDimension**2*128,a=Math.min(e.limits.maxStorageBufferBindingSize,e.limits.maxBufferSize);for(let[n,l,c]of[["capacity",t,Ls],["triangleCount",i,Wn]])if(!Number.isSafeInteger(l)||l<1||l*c>a||n==="capacity"&&l>o)throw Error(`Invalid particle ${n}: exceeds GPU capacity or is not a positive integer`);this.device=e,this.timer=new Wr(e),this.capacity=t,this.triangleCount=i,this.frame=0,this.recycler=new Hr(e),this.storageUsage=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC,this.uniformUsage=GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST,this.module=e.createShaderModule({label:"collision-benchmark-module",code:Bu}),this.pipeline=e.createComputePipeline({label:"collision-benchmark-pipeline",layout:"auto",compute:{module:this.module,entryPoint:"collisionBenchmark"}}),this.particleBuffer=this.recycler.acquire(this.capacity*Ls,this.storageUsage,"collision-bullets"),this.triangleBuffer=this.recycler.acquire(this.triangleCount*Wn,this.storageUsage,"collision-triangles"),this.counterBuffer=this.recycler.acquire(_s,this.storageUsage,"collision-counters"),this.paramBuffer=this.recycler.acquire(Hn,this.uniformUsage,"collision-params"),this.params=new ArrayBuffer(Hn),this.zeroCounters=new Uint32Array(4),this.readback=r?new $n(e,this.recycler,3):null,this.bindGroup=e.createBindGroup({label:"collision-benchmark-bg",layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.particleBuffer}},{binding:1,resource:{buffer:this.triangleBuffer}},{binding:2,resource:{buffer:this.counterBuffer}},{binding:3,resource:{buffer:this.paramBuffer}}]}),this.clear()}clear(){if(this.disposed)throw Error("Particle system has been destroyed");let e=this.device.createCommandEncoder({label:"Clear surface particles"});e.clearBuffer(this.particleBuffer),this.device.queue.submit([e.finish()]),this.frame=0,this.readback&&(this.readback.latest={hits:0,alive:0})}writeTriangles(e){if(this.disposed)throw Error("Particle system has been destroyed");if(!(e instanceof Float32Array)||e.length!==this.triangleCount*12||!e.every(Number.isFinite))throw Error("Triangles require 12 finite float32 values per triangle: padded a, b, c vertices");this.device.queue.writeBuffer(this.triangleBuffer,0,e)}step(e){if(this.disposed)throw Error("Particle system has been destroyed");let t={speed:80,life:3,bulletRadius:.09,spawnRadius:32,jitter:4.8,...e,target:e.count??this.capacity,frame:e.frame??this.frame++};if(!Number.isSafeInteger(t.target)||t.target<1||t.target>this.capacity)throw Error("Particle count exceeds allocated capacity");for(let d of["dt","speed","life","bulletRadius","spawnRadius"])if(!Number.isFinite(t[d])||t[d]<=0)throw Error(`Particle ${d} must be positive and finite`);if(!Number.isFinite(t.jitter)||t.jitter<0)throw Error("Particle jitter must be nonnegative and finite");let i=new Float32Array(this.params),r=new Uint32Array(this.params);i.fill(0),i[0]=t.dt,i[1]=t.speed,i[2]=t.life,i[3]=t.bulletRadius,i[4]=t.spawnRadius,i[5]=t.jitter,r[6]=t.target>>>0,r[7]=this.triangleCount>>>0,r[8]=t.frame>>>0;let o=Math.ceil(t.target/128),a=Math.ceil(o/this.device.limits.maxComputeWorkgroupsPerDimension),n=Math.ceil(o/a);r[9]=n*128,this.device.queue.writeBuffer(this.paramBuffer,0,this.params),this.device.queue.writeBuffer(this.counterBuffer,0,this.zeroCounters);let l=this.device.createCommandEncoder({label:"collision-benchmark-encoder"}),c=this.timer.begin(),u=l.beginComputePass({label:"collision-benchmark-pass",...this.timer.descriptor(c)});u.setPipeline(this.pipeline),u.setBindGroup(0,this.bindGroup),u.dispatchWorkgroups(n,a),u.end(),this.timer.encode(l,c);let f=this.readback?.encodeCopy(l,this.counterBuffer);return this.device.queue.submit([l.finish()]),this.timer.resolve(c),this.readback?.resolve(f)??null}destroy(){this.disposed||(this.disposed=!0,this.timer.destroy(),this.readback?.destroy(),this.recycler.release(this.particleBuffer,this.capacity*Ls,this.storageUsage),this.recycler.release(this.triangleBuffer,this.triangleCount*Wn,this.storageUsage),this.recycler.release(this.counterBuffer,_s,this.storageUsage),this.recycler.release(this.paramBuffer,Hn,this.uniformUsage),this.recycler.destroy())}};var Cu=`// Read the canonical solver's completed contact buffers directly. These layouts
// match avbd3d/gpu/layout.ts; no contact data is copied to the CPU for this view.
struct Body {pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f}
struct Camera {vp:mat4x4f,eye:vec4f,light:vec4f}
struct Manifold {ids:vec4u,geo:vec4f}
struct Contact {rA:vec4f,rB:vec4f,pen:vec4f,lambda:vec4f}
@group(0) @binding(0) var<storage,read> bodies:array<Body>;
@group(0) @binding(1) var<uniform> camera:Camera;
@group(0) @binding(2) var<storage,read> manifolds:array<Manifold>;
@group(0) @binding(3) var<storage,read> contacts:array<Contact>;
@group(0) @binding(4) var<storage,read> counters:array<u32>;
const CORNERS=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(1,1),vec2f(-1,-1),vec2f(1,1),vec2f(-1,1));
const MAX_MANIFOLDS=512u;
fn rotate(q:vec4f,v:vec3f)->vec3f {let t=2.*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
@vertex fn vertexMain(@builtin(vertex_index) v:u32,@builtin(instance_index) instance:u32)->@builtin(position) vec4f {
 let hidden=vec4f(2,2,2,1);
 let count=min(counters[6],arrayLength(&manifolds));
 let slot=instance/4u;
 if(slot>=min(count,MAX_MANIFOLDS)){return hidden;}
 // Sample across the entire contact region when it exceeds the display budget.
 let index=select(slot,slot*count/MAX_MANIFOLDS,count>MAX_MANIFOLDS);
 let m=manifolds[index];let point=instance%4u;let k=m.ids.z+point;
 if(point>=(m.ids.w&15u)||k>=min(counters[1],arrayLength(&contacts))||m.ids.x>=arrayLength(&bodies)){return hidden;}
 let b=bodies[m.ids.x];let p=b.pos.xyz+rotate(b.rot,contacts[k].rA.xyz);
 var clip=camera.vp*vec4f(p.x,p.z,p.y,1);
 clip.x+=CORNERS[v].x*3./camera.light.x*clip.w;
 clip.y+=CORNERS[v].y*3./camera.light.y*clip.w;
 return clip;
}
@fragment fn fragmentMain()->@location(0) vec4f {return vec4f(.83,.25,.39,1);}
`;var Td=Cu.replace("@vertex fn vertexMain","fn samplePoint").replaceAll("@builtin(vertex_index) ","").replaceAll("@builtin(instance_index) ","").replace("->@builtin(position) vec4f","->vec4f").replace(/clip\.x\+=.*?;/,"").replace(/clip\.y\+=.*?;/,"")+`
@group(0) @binding(5) var<storage,read_write> sampled:array<vec4f>;
@compute @workgroup_size(64) fn gather(@builtin(global_invocation_id) id:vec3u) {
  if(id.x<arrayLength(&sampled)){sampled[id.x]=samplePoint(0u,id.x);}
}`,Su=`
struct Camera {vp:mat4x4f,eye:vec4f,light:vec4f}
@group(0) @binding(0) var<uniform> camera:Camera;
@group(0) @binding(1) var<storage,read> points:array<vec4f>;
const CORNERS=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(1,1),vec2f(-1,-1),vec2f(1,1),vec2f(-1,1));
@vertex fn vertexMain(@builtin(vertex_index) v:u32,@builtin(instance_index) instance:u32)->@builtin(position) vec4f {
  var clip=points[instance];
  clip.x+=CORNERS[v].x*3./camera.light.x*clip.w;
  clip.y+=CORNERS[v].y*3./camera.light.y*clip.w;
  return clip;
}
@fragment fn fragmentMain()->@location(0) vec4f {return vec4f(.83,.25,.39,1);}
`,Aa=class{constructor(e,{count:t=2048}={}){if(!Number.isSafeInteger(t)||t<1||Math.ceil(t/64)>e.limits.maxComputeWorkgroupsPerDimension)throw Error("Contact sample count exceeds GPU dispatch capacity");this.device=e,this.count=t,this.buffer=e.createBuffer({label:"AVBD sampled contact dots",size:this.count*16,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.pipeline=e.createComputePipeline({label:"AVBD contact overlay sampling",layout:"auto",compute:{module:e.createShaderModule({code:Td}),entryPoint:"gather"}}),this.bindings=[]}encode(e,{bodyBuffer:t,cameraBuffer:i,contactStorage:r}){let o=[t,i,r.manifolds,r.contacts,r.counters,this.buffer],a=this.bindings.find(l=>l.buffers.every((c,u)=>c===o[u]));a||(a={buffers:o,bind:this.device.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:o.map((l,c)=>({binding:c,resource:{buffer:l}}))})},this.bindings.push(a),this.bindings.length>2&&this.bindings.shift());let n=e.beginComputePass();n.setPipeline(this.pipeline),n.setBindGroup(0,a.bind),n.dispatchWorkgroups(Math.ceil(this.count/64)),n.end()}dispose(){this.buffer.destroy(),this.bindings.length=0}};function ku(s,e,t=8){let i=new Map(e.bodies.map((c,u)=>[c,u])),r=e.bodies.map(()=>new Set);for(let c of e.forces){let u=i.get(c.bodyA),f=i.get(c.bodyB);u===void 0||f===void 0||e.bodies[u].mass===0||e.bodies[f].mass===0||(r[u].add(f),r[f].add(u))}let o=e.bodies.map((c,u)=>u).filter(c=>e.bodies[c].mass>0).sort((c,u)=>r[u].size-r[c].size||c-u),a=new Uint32Array(s.bodyCapacity).fill(255),n=new Map,l=0;for(let c of o){let u=new Set([...r[c]].map(d=>n.get(d))),f=0;for(;u.has(f);)f++;if(f>=64)return;n.set(c,f),a[s.gpuIndex(c)]=f,l=Math.max(l,f+1)}s.device.queue.writeBuffer(s.colorBuffer,0,a),s.colorCap=Math.min(64,Math.max(t,l+3))}var Jn=new WeakMap;function Pu(s,{before:e,after:t}={}){if(!s.bodyBuffer||typeof s.step!="function")throw Error("GPU step passes require a WebGPU solver");if(!e&&!t||e!==void 0&&typeof e!="function"||t!==void 0&&typeof t!="function")throw Error("GPU step passes require synchronous before and/or after callbacks");let i=Jn.get(s);i||(i={hooks:new Set,previousBefore:s.externalBeforeStep,previousAfter:s.externalAfterStep},i.before=o=>{i.previousBefore?.call(s,o);for(let a of i.hooks)a.before?.(o,s)},i.after=o=>{i.previousAfter?.call(s,o);for(let a of i.hooks)a.after?.(o,s)},s.externalBeforeStep=i.before,s.externalAfterStep=i.after,Jn.set(s,i));let r={before:e,after:t};return i.hooks.add(r),()=>{i.hooks.delete(r)&&(i.hooks.size||(s.externalBeforeStep===i.before&&(s.externalBeforeStep=i.previousBefore),s.externalAfterStep===i.after&&(s.externalAfterStep=i.previousAfter),Jn.delete(s)))}}var wa=class{constructor(e,t,i){this.offscreenCanvas=e,this.events=new Map,this.resize(t,i)}resize(e,t){let i=Math.max(1,Math.floor(e)),r=Math.max(1,Math.floor(t));(i!==this.clientWidth||r!==this.clientHeight)&&(this.revision=(this.revision??0)+1),this.clientWidth=i,this.clientHeight=r}get width(){return this.offscreenCanvas.width}set width(e){this.offscreenCanvas.width=e}get height(){return this.offscreenCanvas.height}set height(e){this.offscreenCanvas.height=e}getContext(...e){return this.offscreenCanvas.getContext(...e)}getBoundingClientRect(){return{left:0,top:0,width:this.clientWidth,height:this.clientHeight}}addEventListener(e,t){this.events.has(e)||this.events.set(e,new Set),this.events.get(e).add(t)}removeEventListener(e,t){this.events.get(e)?.delete(t)}setPointerCapture(){}dispatch(e,t){let i={...t,preventDefault(){}};for(let r of this.events.get(e)??[])r(i)}};var Lu=9;function _u(){return globalThis.crossOriginIsolated&&typeof SharedArrayBuffer=="function"?new Int32Array(new SharedArrayBuffer(36)):null}function Eu(s,e,t=0){Atomics.add(s,0,1),[Math.round(e.clientX*1024),Math.round(e.clientY*1024),e.pointerId??1,e.buttons??0,e.altKey?1:0,e.shiftKey?1:0,e.ctrlKey?1:0,Math.round(t*1024)].forEach((r,o)=>Atomics.store(s,o+1,r)),Atomics.add(s,0,1)}function Mu(s,e=-1){let t=Atomics.load(s,0);if(t&1||t===e)return null;let i=Array.from({length:8},(r,o)=>Atomics.load(s,o+1));return Atomics.load(s,0)!==t?null:{sequence:t,event:{clientX:i[0]/1024,clientY:i[1]/1024,pointerId:i[2],buttons:i[3],altKey:!!i[4],shiftKey:!!i[5],ctrlKey:!!i[6]},wheel:i[7]/1024}}return Gu(jd);})();
