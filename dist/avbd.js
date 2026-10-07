var L=(o=0,e=0,t=0)=>Float64Array.of(o,e,t),Pi=(o=0,e=0,t=0,i=1)=>Float64Array.of(o,e,t,i),Y=()=>new Float64Array(9);var ca=o=>o<0?-1:o>0?1:0,tt=(o,e)=>o<e?o:e,hl=(o,e)=>o>e?o:e,Oe=(o,e,t)=>hl(e,tt(t,o)),Z=(o,e)=>o[0]*e[0]+o[1]*e[1]+o[2]*e[2],it=o=>Z(o,o),Li=o=>Math.sqrt(it(o));function We(o,e,t,i){return o[0]=e,o[1]=t,o[2]=i,o}var Lr=(o,e,t)=>We(o,e[0]+t[0],e[1]+t[1],e[2]+t[2]),X=(o,e,t)=>We(o,e[0]-t[0],e[1]-t[1],e[2]-t[2]),Ce=(o,e,t)=>We(o,e[0]*t,e[1]*t,e[2]*t),ei=(o,e,t)=>We(o,e[0]/t,e[1]/t,e[2]/t),he=(o,e)=>We(o,-e[0],-e[1],-e[2]),Js=(o,e)=>We(o,Math.abs(e[0]),Math.abs(e[1]),Math.abs(e[2])),N=(o,e,t,i)=>We(o,e[0]+t[0]*i,e[1]+t[1]*i,e[2]+t[2]*i),pl=(o,e)=>ei(o,e,Li(e)),Mt=(o,e,t)=>We(o,e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]);function ki(o,e,t,i,r){return o[0]=e,o[1]=t,o[2]=i,o[3]=r,o}function ua(o,e,t){let i=e[0],r=e[1],s=e[2],a=e[3],n=t[0],l=t[1],c=t[2],f=t[3];return ki(o,a*n+i*f+r*c-s*l,a*l-i*c+r*f+s*n,a*c+i*l-r*n+s*f,a*f-i*n-r*l-s*c)}var ml=(o,e)=>ki(o,-e[0],-e[1],-e[2],e[3]),fa=o=>it(o)+o[3]*o[3];function bl(o,e){let t=fa(e);return ki(o,-e[0]/t,-e[1]/t,-e[2]/t,e[3]/t)}function gl(o,e){let t=Math.sqrt(fa(e));return ki(o,e[0]/t,e[1]/t,e[2]/t,e[3]/t)}var Si=new Float64Array(4),Zt=new Float64Array(4);function It(o,e,t){return ua(Si,e,bl(Si,t)),We(o,Si[0]*2,Si[1]*2,Si[2]*2)}function _r(o,e,t){return ki(Zt,t[0],t[1],t[2],0),ua(Zt,Zt,e),gl(o,ki(o,e[0]+Zt[0]*.5,e[1]+Zt[1]*.5,e[2]+Zt[2]*.5,e[3]+Zt[3]*.5))}function ue(o,e,t){let i=e[0],r=e[1],s=e[2],a=e[3],n=(r*t[2]-s*t[1])*2,l=(s*t[0]-i*t[2])*2,c=(i*t[1]-r*t[0])*2;return We(o,t[0]+n*a+(r*c-s*l),t[1]+l*a+(s*n-i*c),t[2]+c*a+(i*l-r*n))}var la=new Float64Array(3);function ht(o,e,t,i){return ue(la,t,i),Lr(o,la,e)}function _i(o,e,t){return ue(o,ml(Si,e),t)}function je(o,e,t,i){return o.fill(0),o[0]=e,o[4]=t,o[8]=i,o}function $s(o,e){return o[0]=0,o[1]=-e[2],o[2]=e[1],o[3]=e[2],o[4]=0,o[5]=-e[0],o[6]=-e[1],o[7]=e[0],o[8]=0,o}function ti(o,e){let t=e[1],i=e[2],r=e[5];return o[0]=e[0],o[1]=e[3],o[2]=e[6],o[3]=t,o[4]=e[4],o[5]=e[7],o[6]=i,o[7]=r,o[8]=e[8],o}function Te(o,e,t){let i=e[0],r=e[1],s=e[2],a=e[3],n=e[4],l=e[5],c=e[6],f=e[7],u=e[8],d=t[0],p=t[1],m=t[2],h=t[3],b=t[4],y=t[5],v=t[6],B=t[7],g=t[8];return o[0]=i*d+r*h+s*v,o[1]=i*p+r*b+s*B,o[2]=i*m+r*y+s*g,o[3]=a*d+n*h+l*v,o[4]=a*p+n*b+l*B,o[5]=a*m+n*y+l*g,o[6]=c*d+f*h+u*v,o[7]=c*p+f*b+u*B,o[8]=c*m+f*y+u*g,o}function ie(o,e,t){let i=t[0],r=t[1],s=t[2];return We(o,e[0]*i+e[1]*r+e[2]*s,e[3]*i+e[4]*r+e[5]*s,e[6]*i+e[7]*r+e[8]*s)}function Se(o,e){for(let t=0;t<9;t++)o[t]+=e[t];return o}function ii(o,e,t){for(let i=0;i<9;i++)o[i]=e[i]*t;return o}function da(o,e){for(let t=0;t<9;t++)o[t]=-e[t];return o}function Er(o,e,t){for(let i=0;i<3;i++)for(let r=0;r<3;r++)o[i*3+r]=t[r]*e[i];return o}function ha(o,e){let t=Math.sqrt(e[0]*e[0]+e[3]*e[3]+e[6]*e[6]),i=Math.sqrt(e[1]*e[1]+e[4]*e[4]+e[7]*e[7]),r=Math.sqrt(e[2]*e[2]+e[5]*e[5]+e[8]*e[8]);return je(o,t,i,r)}function pa(o,e){let t=Math.abs(e[0])>Math.abs(e[2])?L(-e[1],e[0],0):L(0,-e[2],e[1]);pl(t,t);let i=Mt(L(),e,t);return o[0]=e[0],o[1]=e[1],o[2]=e[2],o.set(t,3),o.set(i,6),o}function ma(o,e,t,i,r,s,a){let n=o[0],l=o[3],c=o[4],f=o[6],u=o[7],d=o[8],p=t[0],m=t[1],h=t[2],b=e[0],y=t[3],v=t[4],B=t[5],g=e[3],A=e[4],x=t[6],w=t[7],E=t[8],k=e[6],z=e[7],M=e[8],P=l/n,_=f/n,C=p/n,S=y/n,R=x/n,I=n,O=c-P*P*I,q=(u-P*_*I)/O,G=(m-P*C*I)/O,j=(v-P*S*I)/O,F=(w-P*R*I)/O,H=d-(_*_*I+q*q*O),ee=(h-_*C*I-q*G*O)/H,le=(B-_*S*I-q*j*O)/H,xe=(E-_*R*I-q*F*O)/H,U=b-(C*C*I+G*G*O+ee*ee*H),ze=(g-C*S*I-G*j*O-ee*le*H)/U,Me=(k-C*R*I-G*F*O-ee*xe*H)/U,ce=A-(S*S*I+j*j*O+le*le*H+ze*ze*U),Ne=(z-S*R*I-j*F*O-le*xe*H-ze*Me*U)/ce,zt=M-(R*R*I+F*F*O+xe*xe*H+Me*Me*U+Ne*Ne*ce),Ie=i[0],qe=i[1]-P*Ie,Re=i[2]-_*Ie-q*qe,Ve=r[0]-C*Ie-G*qe-ee*Re,et=r[1]-S*Ie-j*qe-le*Re-ze*Ve,Ai=r[2]-R*Ie-F*qe-xe*Re-Me*Ve-Ne*et,wi=Ie/I,Bi=qe/O,Ci=Re/H,At=Ve/U,fl=et/ce,dl=Ai/zt;a[2]=dl,a[1]=fl-Ne*a[2],a[0]=At-ze*a[1]-Me*a[2],s[2]=Ci-ee*a[0]-le*a[1]-xe*a[2],s[1]=Bi-q*s[2]-G*a[0]-j*a[1]-F*a[2],s[0]=wi-P*s[1]-_*s[2]-C*a[0]-S*a[1]-R*a[2]}var rr=1,pt=1e10,ba=.01,ga=1e-5,De=class{solver;forces=[];positionLin;positionAng=Pi();initialLin=L();initialAng=Pi();inertialLin=L();inertialAng=Pi();velocityLin;velocityAng=L();prevVelocityLin;size;mass;moment;friction;radius;constructor(e,t,i,r,s,a=[0,0,0]){this.solver=e,this.size=L(t[0],t[1],t[2]),this.friction=r,this.positionLin=L(s[0],s[1],s[2]),this.velocityLin=L(a[0],a[1],a[2]),this.prevVelocityLin=L(a[0],a[1],a[2]);let[n,l,c]=this.size;this.mass=n*l*c*i,this.moment=L((l*l+c*c)/12*this.mass,(n*n+c*c)/12*this.mass,(n*n+l*l)/12*this.mass),this.radius=Li([n*.5,l*.5,c*.5]),e.bodies.push(this)}constrainedTo(e){for(let t of this.forces)if(t.bodyA===this&&t.bodyB===e||t.bodyA===e&&t.bodyB===this)return!0;return!1}},ya=()=>({lhsLin:Y(),lhsAng:Y(),lhsCross:Y(),rhsLin:L(),rhsAng:L()}),Rt=class{solver;bodyA;bodyB;constructor(e,t,i){this.solver=e,this.bodyA=t,this.bodyB=i,e.forces.push(this),t?.forces.push(this),i.forces.push(this)}destroy(){let e=this.solver.forces,t=e.indexOf(this);t>=0&&e.splice(t,1),this.unlinkFromBodies()}unlinkFromBodies(){for(let e of[this.bodyA,this.bodyB]){if(!e)continue;let t=e.forces.indexOf(this);t>=0&&e.forces.splice(t,1)}}};var Ba=8,va=16,si=1e-6,Ys=1e-5,yl=1e-6,Qs=34028234663852886e22,zr=0,Ca=1,Mr=2;function xa(o){let e=o.positionAng;return{center:o.positionLin,half:Ce(L(),o.size,.5),axis:[ue(L(),e,[1,0,0]),ue(L(),e,[0,1,0]),ue(L(),e,[0,0,1])]}}var ri=(o,e)=>Math.abs(Z(o,e));function Ir(o,e){let t=Z(e,o.axis[0])>=0?1:-1,i=Z(e,o.axis[1])>=0?1:-1,r=Z(e,o.axis[2])>=0?1:-1,s=N(L(),o.center,o.axis[0],o.half[0]*t);return N(s,s,o.axis[1],o.half[1]*i),N(s,s,o.axis[2],o.half[2]*r)}function Sa(o,e){return e===0?{u:o.axis[1],v:o.axis[2],extentU:o.half[1],extentV:o.half[2]}:e===1?{u:o.axis[0],v:o.axis[2],extentU:o.half[0],extentV:o.half[2]}:{u:o.axis[0],v:o.axis[1],extentU:o.half[0],extentV:o.half[1]}}function vl(o,e,t){let i=Z(t,o.axis[e])>=0?1:-1,r=Ce(L(),o.axis[e],i),s=N(L(),o.center,r,o.half[e]);return{normal:r,center:s,...Sa(o,e)}}function xl(o,e){let t=0,i=-Qs;for(let r=0;r<3;r++){let s=ri(o.axis[r],e);s>i&&(i=s,t=r)}return t}function Al(o,e,t){let i=Z(o.axis[e],t)>0?-1:1,r=Ce(L(),o.axis[e],i),s=N(L(),o.center,r,o.half[e]),{u:a,v:n,extentU:l,extentV:c}=Sa(o,e),f=(u,d)=>{let p=N(L(),s,a,u*l);return N(p,p,n,d*c)};return[f(1,1),f(-1,1),f(-1,-1),f(1,-1)]}function wl(o,e,t){let i=[];if(o.length===0)return i;let r=o[o.length-1],s=Z(e,r)-t;for(let a of o){let n=Z(e,a)-t,l=s<=Ys,c=n<=Ys;if(l!==c){let f=0,u=s-n;Math.abs(u)>si&&(f=Oe(s/u,0,1)),i.length<va&&i.push(N(L(),r,X(L(),a,r),f))}c&&i.length<va&&i.push(a),r=a,s=n}return i}var Rr=class{contacts=[];midpoints=[];bodyA;bodyB;constructor(e,t){this.bodyA=e,this.bodyB=t}add(e,t,i){let r=Ce(L(),Lr(L(),e,t),.5);for(let n of this.midpoints)if(it(X(L(),r,n))<yl)return;if(this.contacts.length>=Ba)return;let{bodyA:s,bodyB:a}=this;this.contacts.push({feature:i,rA:_i(L(),s.positionAng,X(L(),e,s.positionLin)),rB:_i(L(),a.positionAng,X(L(),t,a.positionLin))}),this.midpoints.push(r)}};function Xs(o,e,t,i,r,s,a,n){let l=it(i);if(l<si)return!0;let c=1/Math.sqrt(l),f=Ce(L(),i,c);Z(f,t)<0&&he(f,f);let u=Math.abs(Z(t,f)),d=o.half[0]*ri(f,o.axis[0])+o.half[1]*ri(f,o.axis[1])+o.half[2]*ri(f,o.axis[2]),p=e.half[0]*ri(f,e.axis[0])+e.half[1]*ri(f,e.axis[1])+e.half[2]*ri(f,e.axis[2]),m=u-(d+p);return m>0?!1:((!n.valid||m>n.separation)&&(n.valid=!0,n.type=r,n.indexA=s,n.indexB=a,n.separation=m,n.normalAB=f),!0)}function Aa(o,e,t){let i=(e+1)%3,r=(e+2)%3,s=Z(t,o.axis[i])>=0?1:-1,a=Z(t,o.axis[r])>=0?1:-1,n=N(L(),o.center,o.axis[i],o.half[i]*s);N(n,n,o.axis[r],o.half[r]*a);let l=Ce(L(),o.axis[e],o.half[e]);return[X(L(),n,l),Lr(L(),n,l)]}function Bl(o,e,t,i){let r=X(L(),e,o),s=X(L(),i,t),a=X(L(),o,t),n=Z(r,r),l=Z(s,s),c=Z(s,a),f=0,u=0;if(n<=si&&l<=si)return[o,t];if(n<=si)u=Oe(c/l,0,1);else{let d=Z(r,a);if(l<=si)f=Oe(-d/n,0,1);else{let p=Z(r,s),m=n*l-p*p;Math.abs(m)>si&&(f=Oe((p*c-d*l)/m,0,1)),u=(p*f+c)/l,u<0?(u=0,f=Oe(-d/n,0,1)):u>1&&(u=1,f=Oe((p-d)/n,0,1))}}return[N(L(),o,r,f),N(L(),t,s,u)]}function wa(o,e,t,i,r,s,a){let n=r?t:i,l=r?i:t,c=r?a:he(L(),a),f=vl(n,s,c),u=xl(l,f.normal),d=Al(l,u,f.normal),p=[[f.u,f.extentU],[he(L(),f.u),f.extentU],[f.v,f.extentV],[he(L(),f.v),f.extentV]];for(let[b,y]of p)if(d=wl(d,b,Z(b,f.center)+y),!d.length)return[];let m=new Rr(o,e),h=(r?zr:Ca)<<24|(s&255)<<16|(u&255)<<8;for(let b=0;b<d.length&&m.contacts.length<Ba;b++){let y=d[b],v=Z(X(L(),y,f.center),f.normal);if(v>Ys)continue;let B=N(L(),y,f.normal,-v),g=r?B:y,A=r?y:B;m.add(g,A,h|b&255)}return m.contacts.length||m.add(Ir(t,a),Ir(i,he(L(),a)),h),m.contacts}function Cl(o,e,t,i,r,s,a){let[n,l]=Aa(t,r,a),[c,f]=Aa(i,s,he(L(),a)),[u,d]=Bl(n,l,c,f),p=new Rr(o,e),m=Mr<<24|(r&255)<<8|s&255;return p.add(u,d,m),p.contacts.length||p.add(Ir(t,a),Ir(i,he(L(),a)),m),p.contacts}function ka(o,e,t){let i=xa(o),r=xa(e),s=X(L(),r.center,i.center),a={type:zr,indexA:0,indexB:0,separation:-Qs,normalAB:L(),valid:!1},n={type:Mr,indexA:0,indexB:0,separation:-Qs,normalAB:L(),valid:!1};for(let f=0;f<3;f++)if(!Xs(i,r,s,i.axis[f],zr,f,-1,a))return[];for(let f=0;f<3;f++)if(!Xs(i,r,s,r.axis[f],Ca,-1,f,a))return[];let l=L();for(let f=0;f<3;f++)for(let u=0;u<3;u++)if(Mt(l,i.axis[f],r.axis[u]),!Xs(i,r,s,l,Mr,f,u,n))return[];if(!a.valid)return[];let c=a;return n.valid&&.95*n.separation>a.separation+.01&&(c=n),pa(t,he(L(),c.normalAB)),c.type===Mr?Cl(o,e,i,r,c.indexA,c.indexB,c.normalAB):c.type===zr?wa(o,e,i,r,!0,c.indexA,c.normalAB):wa(o,e,i,r,!1,c.indexB,c.normalAB)}var Pa=L(),La=L(),_a=L(),Ea=L(),za=L(),Ma=L(),Or=Y(),Ks=Y(),Zs=Y(),jr=Y(),eo=Y(),to=Y(),io=Y(),Tr=Y(),pe=L(),Ae=L(),oi=L(),Ot=L(),Ia=L(),Ra=L(),Ei=0,sr=0;function Oa(o,e,t){for(let i=0;i<3;i++)Ot[0]=t[i*3],Ot[1]=t[i*3+1],Ot[2]=t[i*3+2],Mt(Ot,e,Ot),o[i*3]=Ot[0],o[i*3+1]=Ot[1],o[i*3+2]=Ot[2];return o}var zi=class extends Rt{contacts=[];basis=Y();friction=0;constructor(e,t,i){super(e,t,i)}get numContacts(){return this.contacts.length}initialize(){let e=this.bodyA,t=this.bodyB,{solver:i}=this;this.friction=Math.sqrt(e.friction*t.friction);let r=this.contacts;this.contacts=ka(e,t,this.basis).map(s=>{let a=r.find(n=>n.feature===s.feature);return a?{feature:s.feature,rA:a.stick?a.rA:s.rA,rB:a.stick?a.rB:s.rB,C0:L(),penalty:a.penalty.slice(),lambda:a.lambda.slice(),stick:a.stick}:{feature:s.feature,rA:s.rA,rB:s.rB,C0:L(),penalty:L(),lambda:L(),stick:!1}});for(let s of this.contacts){ht(Ia,e.positionLin,e.positionAng,s.rA),ht(Ra,t.positionLin,t.positionAng,s.rB),ie(s.C0,this.basis,X(oi,Ia,Ra)),s.C0[0]+=ba;for(let a=0;a<3;a++)s.lambda[a]=s.lambda[a]*i.alpha*i.gamma,s.penalty[a]=Oe(s.penalty[a]*i.gamma,rr,pt)}return this.contacts.length>0}evaluate(e,t){let i=this.bodyA,r=this.bodyB,s=this.basis;ue(za,i.positionAng,e.rA),ue(Ma,r.positionAng,e.rB),da(Or,s),Oa(Ks,za,s),Oa(Zs,Ma,Or),je(jr,e.penalty[0],e.penalty[1],e.penalty[2]),Ce(pe,e.C0,1-t),N(pe,pe,ie(oi,s,Pa),1),N(pe,pe,ie(oi,Or,_a),1),N(pe,pe,ie(oi,Ks,La),1),N(pe,pe,ie(oi,Zs,Ea),1),ie(Ae,jr,pe),N(Ae,Ae,e.lambda,1),Ae[0]=tt(Ae[0],0),sr=Math.abs(Ae[0])*this.friction,Ei=Math.sqrt(Ae[1]*Ae[1]+Ae[2]*Ae[2]),Ei>sr&&Ei>0&&(Ae[1]*=sr/Ei,Ae[2]*=sr/Ei)}computeDisplacements(){let e=this.bodyA,t=this.bodyB;X(Pa,e.positionLin,e.initialLin),It(La,e.positionAng,e.initialAng),X(_a,t.positionLin,t.initialLin),It(Ea,t.positionAng,t.initialAng)}updatePrimal(e,t,i){this.computeDisplacements();let r=e===this.bodyA;for(let s of this.contacts){this.evaluate(s,t);let a=r?this.basis:Or,n=r?Ks:Zs;ti(eo,a),ti(to,n),Te(io,to,jr),Se(i.lhsLin,Te(Tr,Te(Tr,eo,jr),a)),Se(i.lhsAng,Te(Tr,io,n)),Se(i.lhsCross,Te(Tr,io,a)),N(i.rhsLin,i.rhsLin,ie(oi,eo,Ae),1),N(i.rhsAng,i.rhsAng,ie(oi,to,Ae),1)}}updateDual(e){let{solver:t}=this;this.computeDisplacements();for(let i of this.contacts)this.evaluate(i,e),i.lambda.set(Ae),Ae[0]<0&&(i.penalty[0]=tt(i.penalty[0]+t.betaLin*Math.abs(pe[0]),pt)),Ei<=sr&&(i.penalty[1]=tt(i.penalty[1]+t.betaLin*Math.abs(pe[1]),pt),i.penalty[2]=tt(i.penalty[2]+t.betaLin*Math.abs(pe[2]),pt),i.stick=Math.sqrt(pe[1]*pe[1]+pe[2]*pe[2])<ga)}};var ro=()=>({dt:1/60,gravity:-10,iterations:10,betaLin:1e4,betaAng:100,alpha:.99,gamma:.999}),jt=class{dt=1/60;gravity=-10;iterations=10;alpha=.99;betaLin=1e4;betaAng=100;gamma=.999;bodies=[];forces=[];constructor(){this.defaultParams()}defaultParams(){Object.assign(this,ro())}clear(){this.forces=[],this.bodies=[]}pick(e,t){let r=null,s=L(),a=L();for(let n=this.bodies.length-1;n>=0;n--){let l=this.bodies[n];if(l.mass<=0)continue;_i(s,l.positionAng,X(s,e,l.positionLin)),_i(a,l.positionAng,t);let c=0,f=1/0,u=!0;for(let p=0;p<3&&u;p++){let m=l.size[p]*.5;if(Math.abs(a[p])<1e-6){(s[p]<-m||s[p]>m)&&(u=!1);continue}let h=1/a[p],b=(-m-s[p])*h,y=(m-s[p])*h;b>y&&([b,y]=[y,b]),c=Math.max(c,b),f=Math.min(f,y),c>f&&(u=!1)}if(!u)continue;let d=c>=0?c:f;d<0||(!r||d<r.t)&&(r={body:l,local:N(L(),s,a,d),t:d})}return r}sys=ya();dxLin=L();dxAng=L();dp=L();accel=L();step(){let{dt:e,gravity:t,bodies:i,sys:r,dp:s}=this;for(let n=i.length-1;n>=0;n--){let l=i[n];for(let c=n-1;c>=0;c--){let f=i[c];X(s,l.positionLin,f.positionLin);let u=l.radius+f.radius;Z(s,s)<=u*u&&!l.constrainedTo(f)&&new zi(this,l,f)}}let a=[];for(let n of this.forces)n.initialize()?a.push(n):n.unlinkFromBodies();this.forces=a;for(let n=i.length-1;n>=0;n--){let l=i[n];N(l.inertialLin,l.positionLin,l.velocityLin,e),l.mass>0&&(l.inertialLin[2]+=t*(e*e)),_r(l.inertialAng,l.positionAng,ja(l.velocityAng,e)),ei(this.accel,X(this.accel,l.velocityLin,l.prevVelocityLin),e);let c=this.accel[2]*ca(t),f=Oe(c/Math.abs(t),0,1);Number.isFinite(f)||(f=0),l.initialLin.set(l.positionLin),l.initialAng.set(l.positionAng),l.mass>0&&(N(l.positionLin,l.positionLin,l.velocityLin,e),l.positionLin[2]+=t*(f*e*e),_r(l.positionAng,l.positionAng,ja(l.velocityAng,e)))}for(let n=0;n<this.iterations;n++){for(let l=i.length-1;l>=0;l--){let c=i[l];if(c.mass<=0)continue;let f=c.mass,u=c.moment;je(r.lhsLin,f/(e*e),f/(e*e),f/(e*e)),je(r.lhsAng,u[0]/(e*e),u[1]/(e*e),u[2]/(e*e)),r.lhsCross.fill(0),ie(r.rhsLin,r.lhsLin,X(s,c.positionLin,c.inertialLin)),ie(r.rhsAng,r.lhsAng,It(s,c.positionAng,c.inertialAng));let d=c.forces;for(let p=d.length-1;p>=0;p--)d[p].updatePrimal(c,this.alpha,r);ma(r.lhsLin,r.lhsAng,r.lhsCross,he(r.rhsLin,r.rhsLin),he(r.rhsAng,r.rhsAng),this.dxLin,this.dxAng),N(c.positionLin,c.positionLin,this.dxLin,1),_r(c.positionAng,c.positionAng,this.dxAng)}for(let l of this.forces)l.updateDual(this.alpha)}for(let n of i)n.prevVelocityLin.set(n.velocityLin),n.mass>0&&(ei(n.velocityLin,X(n.velocityLin,n.positionLin,n.initialLin),e),ei(n.velocityAng,It(n.velocityAng,n.positionAng,n.initialAng),e))}},Sl=L(),ja=(o,e)=>Ce(Sl,o,e);var oe=(o,e)=>[o[0]-e[0],o[1]-e[1],o[2]-e[2]],nt=(o,e)=>o[0]*e[0]+o[1]*e[1]+o[2]*e[2],ai=(o,e)=>[o[1]*e[2]-o[2]*e[1],o[2]*e[0]-o[0]*e[2],o[0]*e[1]-o[1]*e[0]],Ge=o=>Math.sqrt(nt(o,o));function or(o){let e=Ta(o);return!e||e.vertices.length/3<=32?e:Ta(kl(e,32))}function kl(o,e){let[t,i,r,s]=o.rotation,a=u=>{let d=[2*(i*u[2]-r*u[1]),2*(r*u[0]-t*u[2]),2*(t*u[1]-i*u[0])];return[u[0]+s*d[0]+(i*d[2]-r*d[1])+o.center[0],u[1]+s*d[1]+(r*d[0]-t*d[2])+o.center[1],u[2]+s*d[2]+(t*d[1]-i*d[0])+o.center[2]]},n=[];for(let u=0;u<o.vertices.length;u+=3)n.push(a([o.vertices[u],o.vertices[u+1],o.vertices[u+2]]));let l=0;n.forEach((u,d)=>{Ge(oe(u,o.center))>Ge(oe(n[l],o.center))&&(l=d)});let c=[l],f=n.map(u=>Ge(oe(u,n[l])));for(;c.length<e;){let u=0;f.forEach((d,p)=>{d>f[u]&&(u=p)}),c.push(u),n.forEach((d,p)=>{f[p]=Math.min(f[p],Ge(oe(d,n[u])))})}return c.flatMap(u=>n[u])}function Ta(o){let e=0;for(let g=0;g<o.length;g++)e=Math.max(e,Math.abs(o[g]));let t=Math.max(e,1e-9)*1e-6,i=new Set,r=[];for(let g=0;g+2<o.length;g+=3){let A=[o[g],o[g+1],o[g+2]],x=A.map(w=>Math.round(w/t)).join(",");i.has(x)||(i.add(x),r.push(A))}if(r.length<4)return null;let s=Math.max(e,1e-9)*1e-10,a=0;for(let g=1;g<r.length;g++)r[g][0]<r[a][0]&&(a=g);let n=-1,l=0;for(let g=0;g<r.length;g++){let A=Ge(oe(r[g],r[a]));A>l&&(l=A,n=g)}if(n<0||l<s)return null;let c=-1;l=0;let f=oe(r[n],r[a]);for(let g=0;g<r.length;g++){let A=Ge(ai(f,oe(r[g],r[a])));A>l&&(l=A,c=g)}if(c<0||l<s*Ge(f))return null;let u=ai(f,oe(r[c],r[a])),d=-1;l=0;for(let g=0;g<r.length;g++){let A=Math.abs(nt(u,oe(r[g],r[a])));A>l&&(l=A,d=g)}if(d<0||l<s*Ge(u))return null;let p=[],m=(g,A,x)=>{let w=ai(oe(r[A],r[g]),oe(r[x],r[g])),E=Ge(w)||1,k=[w[0]/E,w[1]/E,w[2]/E];return{v:[g,A,x],n:k,d:nt(k,r[g])}},b=nt(u,oe(r[d],r[a]))>0?[a,c,n]:[a,n,c];p.push(m(b[0],b[1],b[2])),p.push(m(b[0],d,b[1])),p.push(m(b[1],d,b[2])),p.push(m(b[2],d,b[0]));let y=new Set([a,n,c,d]),v=r.map((g,A)=>A).filter(g=>!y.has(g)),B=[a,n,c,d].reduce((g,A)=>[g[0]+r[A][0]/4,g[1]+r[A][1]/4,g[2]+r[A][2]/4],[0,0,0]);v.sort((g,A)=>Ge(oe(r[A],B))-Ge(oe(r[g],B)));for(let g of v){let A=p.filter(P=>nt(P.n,r[g])-P.d>s);if(!A.length)continue;let x=new Map;for(let P of p)for(let _=0;_<3;_++)x.set(`${P.v[_]},${P.v[(_+1)%3]}`,P);let w=new Set(A),E=[...A];for(;E.length;){let P=E.pop();for(let _=0;_<3;_++){let C=x.get(`${P.v[(_+1)%3]},${P.v[_]}`);C&&!w.has(C)&&nt(C.n,r[g])-C.d>-s&&(w.add(C),E.push(C))}}let k=[...w],z=new Set;for(let P of k)for(let _=0;_<3;_++)z.add(`${P.v[_]},${P.v[(_+1)%3]}`);let M=[];for(let P of k)for(let _=0;_<3;_++){let C=P.v[_],S=P.v[(_+1)%3];z.has(`${S},${C}`)||M.push([C,S])}for(let P of k)p.splice(p.indexOf(P),1);for(let[P,_]of M)p.push(m(P,_,g))}return Pl(r.flat(),p.flatMap(g=>g.v))}function Pl(o,e){let t=[];for(let C=0;C+2<o.length;C+=3)t.push([o[C],o[C+1],o[C+2]]);let i=0;for(let C of t)i=Math.max(i,Math.abs(C[0]),Math.abs(C[1]),Math.abs(C[2]));let r=Math.max(i,1e-9)*1e-5,s=[];for(let C=0;C+2<e.length;C+=3){let S=[e[C],e[C+1],e[C+2]],R=ai(oe(t[S[1]],t[S[0]]),oe(t[S[2]],t[S[0]])),I=Ge(R);if(!(I>0))continue;let O=[R[0]/I,R[1]/I,R[2]/I];s.push({v:S,n:O,d:nt(O,t[S[0]])})}let a=new Map;s.forEach((C,S)=>{for(let R=0;R<3;R++)a.set(`${C.v[R]},${C.v[(R+1)%3]}`,S)});let n=new Array(s.length).fill(-1),l=[];s.forEach((C,S)=>{if(n[S]>=0)return;let R=[S];n[S]=l.length;for(let I=0;I<R.length;I++){let O=s[R[I]];for(let q=0;q<3;q++){let G=a.get(`${O.v[(q+1)%3]},${O.v[q]}`);if(G===void 0||n[G]>=0)continue;let j=s[G];nt(C.n,j.n)>1-1e-5&&j.v.every(F=>Math.abs(nt(C.n,t[F])-C.d)<=r)&&(n[G]=l.length,R.push(G))}}l.push(R)});let c=[];for(let C of l){let S=new Set;for(let j of C)for(let F=0;F<3;F++)S.add(`${s[j].v[F]},${s[j].v[(F+1)%3]}`);let R=new Map;for(let j of C)for(let F=0;F<3;F++){let H=s[j].v[F],ee=s[j].v[(F+1)%3];if(!S.has(`${ee},${H}`)){if(R.has(H))return null;R.set(H,ee)}}let I=[0,0,0];for(let j of C){let F=s[j],H=ai(oe(t[F.v[1]],t[F.v[0]]),oe(t[F.v[2]],t[F.v[0]]));I[0]+=H[0],I[1]+=H[1],I[2]+=H[2]}let O=Ge(I)||1,q=R.keys().next().value,G=[q];for(let j=R.get(q);j!==q&&G.length<=R.size;j=R.get(j))G.push(j);if(G.length!==R.size)return null;c.push({n:[I[0]/O,I[1]/O,I[2]/O],verts:G})}let f=new Map,u=[];for(let C of c)for(let S of C.verts)f.has(S)||(f.set(S,u.length),u.push(t[S]));for(let C of c)C.verts=C.verts.map(S=>f.get(S));let d=new Set,p=0;for(let C of c)C.verts.forEach((S,R)=>{d.add(`${S},${C.verts[(R+1)%C.verts.length]}`),p++});if(d.size!==p||![...d].every(C=>{let[S,R]=C.split(",");return d.has(`${R},${S}`)})||u.length-d.size/2+c.length!==2)return null;let m=0,h=[0,0,0],b=[0,0,0,0,0,0];for(let C of c){let S=u[C.verts[0]];for(let R=1;R+1<C.verts.length;R++){let I=u[C.verts[R]],O=u[C.verts[R+1]],q=nt(S,ai(I,O));m+=q/6;for(let j=0;j<3;j++)h[j]+=q/24*(S[j]+I[j]+O[j]);let G=(j,F)=>q/120*(S[j]*S[F]+I[j]*I[F]+O[j]*O[F]+(S[j]+I[j]+O[j])*(S[F]+I[F]+O[F]));b[0]+=G(0,0),b[1]+=G(1,1),b[2]+=G(2,2),b[3]+=G(0,1),b[4]+=G(0,2),b[5]+=G(1,2)}}if(!(m>0))return null;for(let C=0;C<3;C++)h[C]/=m;b[0]-=m*h[0]*h[0],b[1]-=m*h[1]*h[1],b[2]-=m*h[2]*h[2],b[3]-=m*h[0]*h[1],b[4]-=m*h[0]*h[2],b[5]-=m*h[1]*h[2];let y=b[0]+b[1]+b[2],v=[[y-b[0],-b[3],-b[4]],[-b[3],y-b[1],-b[5]],[-b[4],-b[5],y-b[2]]],{values:B,vectors:g}=Ll(v),A=g,x=C=>{let S=oe(C,h);return[A[0][0]*S[0]+A[1][0]*S[1]+A[2][0]*S[2],A[0][1]*S[0]+A[1][1]*S[1]+A[2][1]*S[2],A[0][2]*S[0]+A[1][2]*S[1]+A[2][2]*S[2]]},w=u.map(x),E=new Float32Array(w.flat()),k=c.map(C=>{let S=C.n,R=[A[0][0]*S[0]+A[1][0]*S[1]+A[2][0]*S[2],A[0][1]*S[0]+A[1][1]*S[1]+A[2][1]*S[2],A[0][2]*S[0]+A[1][2]*S[1]+A[2][2]*S[2]],I=-1/0;for(let O of C.verts)I=Math.max(I,nt(R,w[O]));return{normal:R,d:I,verts:C.verts}}),z=new Map;k.forEach((C,S)=>C.verts.forEach((R,I)=>z.set(`${R},${C.verts[(I+1)%C.verts.length]}`,S)));let M=[];k.forEach((C,S)=>C.verts.forEach((R,I)=>{let O=C.verts[(I+1)%C.verts.length],q=z.get(`${O},${R}`);R<O&&q!==void 0&&M.push([R,O,S,q])}));let P=[0,0,0],_=0;for(let C of w){for(let S=0;S<3;S++)P[S]=Math.max(P[S],2*Math.abs(C[S]));_=Math.max(_,Ge(C))}return{vertices:E,faces:k,edges:M,volume:m,moments:[B[0],B[1],B[2]],size:P,radius:_,center:h,rotation:_l(A)}}function Ll(o){let e=o.map(n=>[...n]),t=[[1,0,0],[0,1,0],[0,0,1]];for(let n=0;n<50&&!(e[0][1]**2+e[0][2]**2+e[1][2]**2<1e-30*(e[0][0]**2+e[1][1]**2+e[2][2]**2+1e-300));n++)for(let c=0;c<3;c++)for(let f=c+1;f<3;f++){if(Math.abs(e[c][f])<1e-300)continue;let u=(e[f][f]-e[c][c])/(2*e[c][f]),d=Math.sign(u||1)/(Math.abs(u)+Math.sqrt(u*u+1)),p=1/Math.sqrt(d*d+1),m=d*p;for(let h=0;h<3;h++){let b=e[h][c],y=e[h][f];e[h][c]=p*b-m*y,e[h][f]=m*b+p*y}for(let h=0;h<3;h++){let b=e[c][h],y=e[f][h];e[c][h]=p*b-m*y,e[f][h]=m*b+p*y}for(let h=0;h<3;h++){let b=t[h][c],y=t[h][f];t[h][c]=p*b-m*y,t[h][f]=m*b+p*y}}let i=[t[0][0],t[1][0],t[2][0]],r=[t[0][1],t[1][1],t[2][1]],s=ai(i,r),a=[[i[0],r[0],s[0]],[i[1],r[1],s[1]],[i[2],r[2],s[2]]];return{values:[e[0][0],e[1][1],e[2][2]],vectors:a}}function _l(o){let e=o[0][0]+o[1][1]+o[2][2],t,i,r,s;if(e>0){let n=.5/Math.sqrt(e+1);s=.25/n,t=(o[2][1]-o[1][2])*n,i=(o[0][2]-o[2][0])*n,r=(o[1][0]-o[0][1])*n}else if(o[0][0]>o[1][1]&&o[0][0]>o[2][2]){let n=2*Math.sqrt(1+o[0][0]-o[1][1]-o[2][2]);s=(o[2][1]-o[1][2])/n,t=.25*n,i=(o[0][1]+o[1][0])/n,r=(o[0][2]+o[2][0])/n}else if(o[1][1]>o[2][2]){let n=2*Math.sqrt(1+o[1][1]-o[0][0]-o[2][2]);s=(o[0][2]-o[2][0])/n,t=(o[0][1]+o[1][0])/n,i=.25*n,r=(o[1][2]+o[2][1])/n}else{let n=2*Math.sqrt(1+o[2][2]-o[0][0]-o[1][1]);s=(o[1][0]-o[0][1])/n,t=(o[0][2]+o[2][0])/n,i=(o[1][2]+o[2][1])/n,r=.25*n}let a=Math.hypot(t,i,r,s);return[t/a,i/a,r/a,s/a]}var Ga=new WeakSet,ar=o=>Ga.has(o),El=new WeakSet;var Fa=o=>El.has(o);function Mi(o,e,t,i,r,s=[0,0,0]){let a=new De(o,[2*e,2*e,2*e],t,i,r,s);a.mass=t>0?4/3*Math.PI*e*e*e*t:0;let n=.4*a.mass*e*e;return a.moment.set([n,n,n]),a.radius=e,Ga.add(a),a}var Ua=new WeakMap,Dr=o=>Ua.get(o);function Gr(o,e,t,i,r,s=[0,0,0,1],a=[0,0,0]){if(e.vertices.length/3>32||e.faces.length>255||e.edges.length>255)throw new Error(`hull: ${e.vertices.length/3} vertices, ${e.faces.length} faces, ${e.edges.length} edges (at most ${32} vertices, 255 faces and edges)`);let n=new De(o,e.size,t,i,r,a);return n.positionAng.set([s[0],s[1],s[2],s[3]]),n.mass=t>0?e.volume*t:0,n.moment.set(e.moments.map(l=>l*Math.max(t,0))),n.radius=e.radius,Ua.set(n,e),n}var so=`
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
`,mt=`
// Shared by every 2D module (layout.ts)
${so}
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

`,oo=(o,e={counter:"C_CONTACTS",prevCounter:"C_PREV_CONTACTS",capacity:"params.contactCapacity"})=>`
${o}
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
`,Fr=oo(mt),fe=["collision","adjacency","coloring","solve"];var zl=`
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
`,Fe=class{levels=[];buffers=[];scanPipeline;addPipeline;constructor(e,t,i,r){let s=e.createShaderModule({label:"prefix scan",code:zl}),a=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),n=e.createPipelineLayout({bindGroupLayouts:[a]});this.scanPipeline=e.createComputePipeline({label:"scanBlocks",layout:n,compute:{module:s,entryPoint:"scanBlocks"}}),this.addPipeline=e.createComputePipeline({label:"addBlocks",layout:n,compute:{module:s,entryPoint:"addBlocks"}});let l=t,c=i,f=r;for(;;){let u=Math.max(1,Math.ceil(f/512)),d=e.createBuffer({label:`scan sums ${this.levels.length}`,size:Math.max(u,4)*4,usage:GPUBufferUsage.STORAGE}),p=e.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM,mappedAtCreation:!0});new Uint32Array(p.getMappedRange()).set([c,f,0,0]),p.unmap(),this.buffers.push(d,p);let m=e.createBindGroup({layout:a,entries:[{binding:0,resource:{buffer:p}},{binding:1,resource:{buffer:l}},{binding:2,resource:{buffer:d}}]});if(this.levels.push({n:f,blocks:u,group:m}),u===1)break;l=d,c=0,f=u}}encode(e){e.setPipeline(this.scanPipeline);for(let t of this.levels)e.setBindGroup(0,t.group),e.dispatchWorkgroups(t.blocks);e.setPipeline(this.addPipeline);for(let t=this.levels.length-2;t>=0;t--)e.setBindGroup(0,this.levels[t].group),e.dispatchWorkgroups(this.levels[t].blocks)}destroy(){for(let e of this.buffers)e.destroy()}};var Ml=`
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
`,li=(o,e)=>`
${o}
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
`,nr=li(mt,Ml);var Il=Pi(),lt=Y(),Ur=Y(),ci=Y(),ao=Y(),Ii=Y(),no=Y(),He=Y(),Nr=Y(),lr=Y(),re=L(),me=L(),se=L(),Tt=L(),Ri=L();function lo(o,e,t){return je(o,-t[e],-t[e],-t[e]),o[e]+=t[0],o[3+e]+=t[1],o[6+e]+=t[2],o}var qr=(o,e,t)=>We(o,tt(e[0],t),tt(e[1],t),tt(e[2],t)),we=class extends Rt{rA;rB;C0Lin=L();C0Ang=L();penaltyLin=L();penaltyAng=L();lambdaLin=L();lambdaAng=L();stiffnessLin;stiffnessAng;fracture;torqueArm;broken=!1;constructor(e,t,i,r,s,a=1/0,n=0,l=1/0){super(e,t,i),this.rA=L(r[0],r[1],r[2]),this.rB=L(s[0],s[1],s[2]),this.stiffnessLin=a,this.stiffnessAng=n,this.fracture=l;let c=t?t.size:[0,0,0];this.torqueArm=it([c[0]+i.size[0],c[1]+i.size[1],c[2]+i.size[2]])}evaluateLin(e){let{bodyA:t,bodyB:i}=this;return t?ht(Tt,t.positionLin,t.positionAng,this.rA):Tt.set(this.rA),X(e,Tt,ht(Ri,i.positionLin,i.positionAng,this.rB))}evaluateAng(e){return It(e,this.bodyA?this.bodyA.positionAng:Il,this.bodyB.positionAng),Ce(e,e,this.torqueArm)}initialize(){let{solver:e}=this;this.evaluateLin(this.C0Lin),this.evaluateAng(this.C0Ang);for(let t=0;t<3;t++)this.lambdaLin[t]=this.lambdaLin[t]*e.alpha*e.gamma,this.lambdaAng[t]=this.lambdaAng[t]*e.alpha*e.gamma,this.penaltyLin[t]=Oe(this.penaltyLin[t]*e.gamma,rr,pt),this.penaltyAng[t]=Oe(this.penaltyAng[t]*e.gamma,rr,pt);return qr(this.penaltyLin,this.penaltyLin,this.stiffnessLin),qr(this.penaltyAng,this.penaltyAng,this.stiffnessAng),!this.broken}updatePrimal(e,t,i){let r=e===this.bodyA;if(it(this.penaltyLin)>0){je(lt,this.penaltyLin[0],this.penaltyLin[1],this.penaltyLin[2]),this.evaluateLin(re),this.stiffnessLin===1/0&&N(re,re,this.C0Lin,-t),ie(me,lt,re),N(me,me,this.lambdaLin,1);let s=r?1:-1;je(Ur,s,s,s),r?$s(ci,he(se,ue(se,this.bodyA.positionAng,this.rA))):$s(ci,ue(se,this.bodyB.positionAng,this.rB)),ti(ao,Ur),ti(Ii,ci),Te(no,Ii,lt),Se(i.lhsLin,Te(He,Te(He,ao,lt),Ur)),Se(i.lhsAng,Te(He,no,ci)),Se(i.lhsCross,Te(He,no,Ur)),r?ue(se,this.bodyA.positionAng,this.rA):he(se,ue(se,this.bodyB.positionAng,this.rB)),ii(Nr,lo(lr,0,se),me[0]),Se(Nr,ii(lr,lo(lr,1,se),me[1])),Se(Nr,ii(lr,lo(lr,2,se),me[2])),Se(i.lhsAng,ha(He,Nr)),N(i.rhsLin,i.rhsLin,ie(se,ao,me),1),N(i.rhsAng,i.rhsAng,ie(se,Ii,me),1)}if(it(this.penaltyAng)>0){je(lt,this.penaltyAng[0],this.penaltyAng[1],this.penaltyAng[2]),this.evaluateAng(re),this.stiffnessAng===1/0&&N(re,re,this.C0Ang,-t),ie(me,lt,re),N(me,me,this.lambdaAng,1);let s=(r?1:-1)*this.torqueArm;je(ci,s,s,s),ti(Ii,ci),Se(i.lhsAng,Te(He,Te(He,Ii,lt),ci)),N(i.rhsAng,i.rhsAng,ie(se,Ii,me),1)}}updateDual(e){let{solver:t}=this;it(this.penaltyLin)>0&&(je(lt,this.penaltyLin[0],this.penaltyLin[1],this.penaltyLin[2]),this.evaluateLin(re),this.stiffnessLin===1/0&&(N(re,re,this.C0Lin,-e),ie(me,lt,re),N(this.lambdaLin,me,this.lambdaLin,1)),N(this.penaltyLin,this.penaltyLin,Js(se,re),t.betaLin),qr(this.penaltyLin,this.penaltyLin,tt(this.stiffnessLin,pt))),it(this.penaltyAng)>0&&(je(lt,this.penaltyAng[0],this.penaltyAng[1],this.penaltyAng[2]),this.evaluateAng(re),this.stiffnessAng===1/0&&(N(re,re,this.C0Ang,-e),ie(me,lt,re),N(this.lambdaAng,me,this.lambdaAng,1)),N(this.penaltyAng,this.penaltyAng,Js(se,re),t.betaAng),qr(this.penaltyAng,this.penaltyAng,tt(this.stiffnessAng,pt))),it(this.lambdaAng)>this.fracture*this.fracture&&(this.penaltyLin.fill(0),this.penaltyAng.fill(0),this.lambdaLin.fill(0),this.lambdaAng.fill(0),this.broken=!0)}},ct=class extends Rt{rA;rB;rest;stiffness;constructor(e,t,i,r,s,a,n=-1){super(e,t,i),this.rA=L(r[0],r[1],r[2]),this.rB=L(s[0],s[1],s[2]),this.stiffness=a,this.rest=n,this.rest<0&&(ht(Tt,t.positionLin,t.positionAng,this.rA),ht(Ri,i.positionLin,i.positionAng,this.rB),this.rest=Li(X(re,Tt,Ri)))}initialize(){return!0}updatePrimal(e,t,i){let r=this.bodyA,s=this.bodyB;ht(Tt,r.positionLin,r.positionAng,this.rA),ht(Ri,s.positionLin,s.positionAng,this.rB);let a=X(re,Tt,Ri),n=Li(a);if(n<=1e-6)return;let l=ei(me,a,n),c=n-this.rest,f=this.stiffness*c,u=Tt,d=Ri;e===r?(ue(se,r.positionAng,this.rA),u.set(l),Mt(d,se,l)):(ue(se,s.positionAng,this.rB),he(u,l),he(d,Mt(d,se,l))),Se(i.lhsLin,ii(He,Er(He,u,u),this.stiffness)),Se(i.lhsAng,ii(He,Er(He,d,d),this.stiffness)),Se(i.lhsCross,ii(He,Er(He,d,u),this.stiffness)),N(i.rhsLin,i.rhsLin,Ce(se,u,f),1),N(i.rhsAng,i.rhsAng,Ce(se,d,f),1)}updateDual(){}},Vr=class extends Rt{initialize(){return!0}updatePrimal(){}updateDual(){}};var ke=40,Oi=0,cr=4,Na=8,qa=12,co=16,uo=20,Va=24,Wa=28,fo=32,ho=36,te=32,Dt=0,ur=4,ji=8,Ti=12,Ha=16,Ja=20,Gt=24,Di=28,bt=8;var Wr=4,wt=16,Gi=0,Hr=4,Jr=8,$r=12,fr=2147483648,Fi=6,Rl=7,$a=0,po=1,mo=2,Xr=3,dr=1,Ui=2,bo=1,go=2,yo=4,vo=8,xo=16,Ol=.1,Xa=.002,Ya=.002,jl=.05,Ao=44,ae=`
// Shared by every 3D module (avbd3d/gpu/layout.ts)
${so}
const T_JOINT = ${dr};
const T_SPRING = ${Ui};

const PENALTY_MIN = 1.0;
const PENALTY_MAX = 1e10;
// Least LDL\u1D40 pivot of the primal solve, relative to its diagonal (wgsl-solve.ts finishBody)
const PIVOT_FLOOR = 1e-5;
const COLLISION_MARGIN = 0.01;
const STICK_THRESH = 0.00001;

const SHAPE_SPHERE = ${po}.0;
const SHAPE_SAIL = ${mo}.0;
const SHAPE_HULL = ${Xr}.0;
const STICK_BIT = ${fr}u;
const C_MANIFOLDS = ${Fi}u;
const C_PREV_MANIFOLDS = ${Rl}u;
/** Feature key of every contact involving a sphere (one contact per pair). */
const SPHERE_FEATURE = 3u << 24u;

const FLAG_MATCH_NEAREST = ${bo}u;
const FLAG_FACE_BIAS = ${go}u;
const FLAG_REUSE_CONTACTS = ${yo}u;
const FLAG_START_AT_REST = ${vo}u;
const FLAG_MASS_PENALTY = ${xo}u;
const REST_SPEED = ${Ol};
const NEAREST_FRACTION = ${jl};

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
`,Ni=`
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
`,wo=`
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
`,Qa={counter:"C_MANIFOLDS",prevCounter:"C_PREV_MANIFOLDS",capacity:"params.manifoldCapacity",colorThreads:wo};var Ka=`
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
`;var Yr=`
${ae}

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
    || length(pos - last.pos.xyz) > ${Xa}
    || length(qsub(rot, last.rot)) > ${Ya};
  if (moved) {
    refs[i] = RefPose(vec4f(pos, 0.0), rot);
    bodies[i].inertialPos.w = bitcast<f32>(params.step);
  }
}
`,Ft=`
${ae}

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
`,ui=o=>`
${ae}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> bodies: array<Body>;
@group(0) @binding(2) var<storage, read> pairs: array<vec2u>;
@group(0) @binding(3) var<storage, read_write> contacts: array<Contact>;
@group(0) @binding(4) var<storage, read> prevContacts: array<Contact>;
@group(0) @binding(5) var<storage, read_write> manifolds: array<Manifold>;
@group(0) @binding(6) var<storage, read> prevManifolds: array<Manifold>;
@group(0) @binding(7) var<storage, read_write> table: array<atomic<u32>>;
@group(0) @binding(8) var<storage, read_write> counters: array<atomic<u32>>;
${o?"@group(0) @binding(9) var<storage, read> hulls: array<vec4u>;":""}

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

${o?Ka:"fn isHull(i: u32) -> bool { return false; }"}

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
  }${o?` else if (isHull(a) || isHull(b)) {
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
`,Za=ui(!1),en=ui(!0);var be=`
${ae}
${wo}

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
`;function Qr(o,e){let t=0,i=o.length-1;for(;t<i;){let r=o[e],s=t,a=i;do{for(;o[s]<r;)s++;for(;r<o[a];)a--;if(s<=a){let n=o[s];o[s]=o[a],o[a]=n,s++,a--}}while(s<=a);a<e&&(t=s),e<s&&(i=a)}return o[e]}function Bo(o){let e=o.length,t=e>0?Qr(o,e>>1):1,i=0;for(let r=0;r<e;r++)o[r]<=2*t&&(i=Math.max(i,o[r]));return e>64&&(i=Math.max(i,Qr(o,e-64-1))),i}var Bt=o=>o===1/0?3e38:o===-1/0?-3e38:o,Je=o=>Math.ceil(o/64),rn=o=>2**Math.ceil(Math.log2(Math.max(o,2))),Tl=o=>Math.max(o,1)*ke*4,Dl=8,Kr=3,Gl=8,Fl=1.6,Ul=.8,Nl=2,ql=[0,0,1],Vl=()=>({...ro(),matchNearest:!0,faceBias:!0,reuseContacts:!0,startAtRest:!0,massPenalty:!0,windSpeed:0,windAngle:0,windGust:.4,windPressure:.72,up:[0,1,0]});function Wl(o,e){let t=o.vertices.length/3,i=o.faces.length,r=o.faces.reduce((m,h)=>m+h.verts.length,0),s=Math.ceil(r/4),a=o.edges.length,n=new Float32Array((2+t+2*i+s+a)*4),l=new Uint32Array(n.buffer),c=e+2,f=c+t,u=f+2*i,d=u+s;l.set([c,t,f,i,d,a,u,0],0);for(let m=0;m<t;m++)n.set(o.vertices.subarray(m*3,m*3+3),(2+m)*4);let p=0;return o.faces.forEach((m,h)=>{let b=(2+t+2*h)*4;n.set(m.normal,b),n[b+3]=m.d,l[b+4]=p,l[b+5]=m.verts.length;for(let y of m.verts)l[(2+t+2*i)*4+p++]=y}),o.edges.forEach((m,h)=>l.set(m,(2+t+2*i+s+h)*4)),n}var Co=.001;function Hl(o,e){let t=o.length,i=o.map(b=>[0,1,2].map(y=>{let v=[0,0,0];return v[y]=1,ue(L(),b.positionAng,v)})),r=o.map((b,y)=>{if(ar(b))return[b.radius,b.radius,b.radius];let v=[0,0,0];for(let B=0;B<3;B++)for(let g=0;g<3;g++)v[g]+=b.size[B]*.5*Math.abs(i[y][B][g]);return v}),s=Bo(Float64Array.from(o,b=>b.radius)),a=Math.max(2*s,.001),n=(b,y)=>{let v=o[b],B=o[y];if(v.mass<=0&&B.mass<=0)return!1;let g=[0,1,2].map(x=>v.positionLin[x]-B.positionLin[x]),A=v.radius+B.radius;return g[0]*g[0]+g[1]*g[1]+g[2]*g[2]>A*A?!1:g.every((x,w)=>Math.abs(x)<=r[b][w]+r[y][w])},l=(b,y)=>b[0]*y[0]+b[1]*y[1]+b[2]*y[2],c=(b,y)=>{let v=o[b],B=o[y],g=[0,1,2].map(k=>B.positionLin[k]-v.positionLin[k]),[A,x]=[ar(v),ar(B)];if(A&&x)return Math.hypot(g[0],g[1],g[2])<=v.radius+B.radius+Co;if(A||x){let[k,z,M]=A?[y,v.radius,-1]:[b,B.radius,1],P=0;for(let _=0;_<3;_++){let C=Math.abs(M*l(g,i[k][_]))-o[k].size[_]*.5;C>0&&(P+=C*C)}return P<=(z+Co)**2}let w=(k,z)=>o[k].size[0]*.5*Math.abs(l(i[k][0],z))+o[k].size[1]*.5*Math.abs(l(i[k][1],z))+o[k].size[2]*.5*Math.abs(l(i[k][2],z)),E=k=>{let z=Math.hypot(k[0],k[1],k[2]);return z<1e-6?!1:Math.abs(l(g,k))-w(b,k)-w(y,k)>Co*z};for(let k=0;k<3;k++)if(E(i[b][k])||E(i[y][k]))return!1;for(let k of i[b])for(let z of i[y])if(E([k[1]*z[2]-k[2]*z[1],k[2]*z[0]-k[0]*z[2],k[0]*z[1]-k[1]*z[0]]))return!1;return!0},f=new Set,u=new Map,d=(b,y,v)=>(b*73856093^y*19349663^v*83492791)>>>0,p=b=>[0,1,2].map(y=>Math.floor(o[b].positionLin[y]/a));for(let b=0;b<t;b++){if(o[b].radius>s){f.add(b);continue}let[y,v,B]=p(b),g=d(y,v,B),A=u.get(g);A?A.push(b):u.set(g,[b])}let m=0,h=0;for(let b=0;b<t;b++){if(f.has(b))continue;let[y,v,B]=p(b);for(let g=-1;g<=1;g++)for(let A=-1;A<=1;A++)for(let x=-1;x<=1;x++)for(let w of u.get(d(y+x,v+A,B+g))??[])w<b&&n(b,w)&&(m++,c(b,w)&&(h++,e[b]++,e[w]++))}for(let b of f)for(let y=0;y<t;y++)y!==b&&(!f.has(y)||y<b)&&n(b,y)&&(m++,c(b,y)&&(h++,e[b]++,e[y]++));return{pairs:m,touching:h}}function Jl(o){let e=[1/0,1/0,1/0],t=[-1/0,-1/0,-1/0];for(let s of o)for(let a=0;a<3;a++)e[a]=Math.min(e[a],s.positionLin[a]),t[a]=Math.max(t[a],s.positionLin[a]);let i=s=>{let a=s&1023;return a=(a|a<<16)&50331903,a=(a|a<<8)&50393103,a=(a|a<<4)&51130563,a=(a|a<<2)&153391689,a},r=o.map(s=>{let a=[0,1,2].map(n=>Math.min(1023,Math.floor((s.positionLin[n]-e[n])/Math.max(t[n]-e[n],1e-9)*1024)));return(i(a[0])|i(a[1])<<1|i(a[2])<<2)>>>0});return o.map((s,a)=>a).sort((s,a)=>r[s]-r[a]||s-a)}var de=()=>GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST,Zr=class{device;params=Vl();bodyCount=0;bodyCapacity;bodies=[];hulls;hullBuffer;get hullStorage(){return this.hullBuffer}hullCapacity=4096;hullTop=0;hullSlots=new Map;contactShaders;hullShaders=!1;hullFree=[];refToGpu;jointCount=0;jointCapacity=0;info=new Int32Array(0);pairCapacity=0;manifoldCapacity=0;contactCapacity=0;colorCap=12;fixedColors=null;primalLanes=[2**31,2**15,2**12];splitPasses=!1;shrinkVotes=0;colorRounds;get colorHistOffset(){return 3*this.bodyCapacity+65}bodyBuffer;ownsBodyBuffer;jointBuffer;infoBuffer;contactBuffers;manifoldBuffers;pairBuffer;tableBuffer;gridBuffer;staticBuffer=null;filterBuffer;get filterStorage(){return this.filterBuffer}counterBuffer;get contactStorage(){let e=1-this.parity;return{manifolds:this.manifoldBuffers[e],contacts:this.contactBuffers[e],counters:this.counterBuffer}}argsBuffer;adjBuffer=null;colorBuffer;paramsBuffer;refBuffer;stepCount=0;passBuffer=null;passEntries=0;parity=0;tableSize;hashSize=0;cellSize=1;maxSmallRadius=0;largeCount=0;noCollideCount=0;radiiDirty=!0;noCollideDirty=!0;large=[];entries=[];pendingEntries=[];releasedSlots=new Set;freeSlots=[];layouts;pipes={};groups;passGroup=null;gridScan;colorHistScan;colorGroups;adjScan=null;timing;timingCallback=null;timingBusy=!1;destroyed=!1;constructor(e,t,i={}){this.device=e;let{dt:r,gravity:s,iterations:a,alpha:n,betaLin:l,betaAng:c,gamma:f}=t;if(Object.assign(this.params,{dt:r,gravity:s,iterations:a,alpha:n,betaLin:l,betaAng:c,gamma:f,up:ql}),this.bodyCount=t.bodies.length,this.colorRounds=i.colorRounds??16,this.ownsBodyBuffer=!i.bodyBuffer,this.bodyCapacity=i.bodyBuffer?Math.floor(i.bodyBuffer.size/(ke*4)):Math.max(i.bodyCapacity??this.bodyCount+1024,this.bodyCount,1),this.bodyCapacity<this.bodyCount)throw new Error("body buffer too small");this.bodyBuffer=i.bodyBuffer??e.createBuffer({label:"bodies 3d",size:Tl(this.bodyCapacity),usage:de()}),this.filterBuffer=e.createBuffer({label:"collision filters",size:Math.max(this.bodyCapacity,1)*8,usage:de()}),e.queue.writeBuffer(this.filterBuffer,0,new Uint32Array(Math.max(this.bodyCapacity,1)*2).fill(4294967295));let u=this.bodyCapacity;this.tableSize=rn(2*u),this.gridBuffer=e.createBuffer({label:"grid 3d",size:(2*this.tableSize+1+4*u)*4,usage:de()}),this.counterBuffer=e.createBuffer({label:"counters",size:64,usage:de()}),this.argsBuffer=e.createBuffer({label:"indirect args",size:816,usage:de()|GPUBufferUsage.INDIRECT}),this.colorGroups=Math.ceil(u/256),this.colorBuffer=e.createBuffer({label:"colours",size:(3*u+65+64*this.colorGroups+1)*4,usage:de()}),this.paramsBuffer=e.createBuffer({label:"params 3d",size:Ao*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.refBuffer=e.createBuffer({label:"reference poses",size:u*32,usage:de()}),this.hulls=(i.hulls??!0)&&e.limits.maxStorageBuffersPerShaderStage>=9,this.hullBuffer=e.createBuffer({label:"hulls",size:this.hullCapacity*16,usage:de()}),e.queue.writeBuffer(this.colorBuffer,0,new Uint32Array(u).fill(255));let d=2*fe.length;this.timing=e.features.has("timestamp-query")?{querySet:e.createQuerySet({type:"timestamp",count:d}),resolve:e.createBuffer({size:d*8,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC}),read:e.createBuffer({size:d*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST})}:null,this.layouts=this.createLayouts(),this.createPipelines(i.shaders??{}),this.gridScan=new Fe(e,this.gridBuffer,0,this.tableSize+1),this.colorHistScan=new Fe(e,this.colorBuffer,this.colorHistOffset,64*this.colorGroups+1);let p=i.spatialSort===!1?t.bodies.map((x,w)=>w):Jl(t.bodies);this.refToGpu=new Int32Array(p.length),p.forEach((x,w)=>this.refToGpu[x]=w);let m=new Map(t.bodies.map((x,w)=>[x,this.refToGpu[w]])),h=t.forces.filter(x=>x instanceof we||x instanceof ct);for(let x of t.forces){if(!(x instanceof Vr))continue;let w=m.get(x.bodyA),E=m.get(x.bodyB);this.pendingEntries.push([Math.max(w,E),Math.min(w,E),4294967295])}this.allocateJoints(Math.max(h.length+256,i.capacity?.joints??0));for(let x of h)this.writeJoint(this.jointCount++,x,m);let b=new Int32Array(t.bodies.length),{pairs:y,touching:v}=Hl(t.bodies,b),B=new Map(t.bodies.map((x,w)=>[x,w]));for(let x of h)x.bodyA&&b[B.get(x.bodyA)]++,b[B.get(x.bodyB)]++;let g=0;t.bodies.forEach((x,w)=>{x.mass>0&&(g=Math.max(g,b[w]))}),this.colorCap=Math.min(64,Math.max(Gl,g+1+Kr,i.capacity?.colors??0));let A=i.capacity??{};this.allocateContacts(Math.max(8192,4*u,Dl*v,A.contacts??0),Math.max(4096,4*u,2*y,A.pairs??0),Math.max(4096,u,Fl*v,A.manifolds??0)),this.writeBodies(0,p.map(x=>t.bodies[x]))}gpuIndex(e){return e<this.refToGpu.length?this.refToGpu[e]:e}createLayouts(){let e=this.device,t=(a,n)=>e.createBindGroupLayout({label:a,entries:n.map((l,c)=>({binding:c,visibility:GPUShaderStage.COMPUTE,buffer:{type:l}}))}),i="read-only-storage",r="storage",s="uniform";return{broad:t("broadphase 3d",[s,i,r,r,r,i,i,i]),contacts:t("contacts 3d",[s,i,i,r,i,r,i,r,r,...this.hulls?[i]:[]]),topo:t("topology 3d",[s,i,i,i,i,r,r,r]),solve:t("solve 3d",[s,r,r,i,r,i,i,i,i]),pass:e.createBindGroupLayout({label:"pass",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform",hasDynamicOffset:!0,minBindingSize:16}}]}),args:t("args 3d",[s,i,i,r]),refs:t("refs 3d",[s,r,r])}}createPipelines(e){let t=this.device,i=(s,a,n)=>{let l=t.createShaderModule({code:s}),c=t.createPipelineLayout({bindGroupLayouts:a});for(let f of n)this.pipes[f]=t.createComputePipeline({label:f,layout:c,compute:{module:l,entryPoint:f}})},r=this.layouts;i(Ft,[r.broad],["beginFrame","gridCount","gridScatter","findPairs"]),i(Yr,[r.refs],["updateRefs"]),i(e.contacts??Za,[r.contacts],["hashInsert","narrowphase"]),this.contactShaders={make:s=>i(s,[r.contacts],["hashInsert","narrowphase"]),custom:!!e.contacts},i(li(ae,Ni),[r.topo],["degreeJoints","degreeContacts","fillJoints","fillContacts","sortAdjacency","colorCompact","colorMark","colorRoundAB","colorRoundBA","colorCount","colorStarts","colorScatter"]),i(e.solve??be,[r.solve,r.pass],["warmStartJoints","warmStartBodies","primal","dual","updateVelocities"]),i(oo(ae,Qa),[r.args],["argsPrev","argsPairs","argsContacts","argsColors"])}allocateJoints(e){let t=this.device,i=t.createBuffer({label:"joints 3d",size:Math.max(e,1)*te*4,usage:de()}),r=t.createBuffer({label:"joint info",size:Math.max(e,1)*16,usage:de()});if(this.jointBuffer){let a=t.createCommandEncoder();a.copyBufferToBuffer(this.jointBuffer,0,i,0,this.jointCapacity*te*4),a.copyBufferToBuffer(this.infoBuffer,0,r,0,this.jointCapacity*16),t.queue.submit([a.finish()]),this.jointBuffer.destroy(),this.infoBuffer.destroy()}let s=new Int32Array(e*4);s.set(this.info.subarray(0,Math.min(this.info.length,s.length))),this.info=s,this.jointBuffer=i,this.infoBuffer=r,this.jointCapacity=e,this.contactBuffers&&this.rebuildBindings()}allocateContacts(e,t,i){let r=this.device,s=r.limits.maxStorageBufferBindingSize,a=Math.min(Math.ceil(e),Math.floor(s/(wt*4))),n=Math.min(Math.ceil(t),Math.floor(s/8)),l=Math.min(Math.ceil(i),n,Math.floor(s/(bt*4))),c={contacts:this.contactBuffers,manifolds:this.manifoldBuffers,contactCapacity:this.contactCapacity,manifoldCapacity:this.manifoldCapacity};for(let f of[this.pairBuffer,this.tableBuffer])f?.destroy();if(this.contactCapacity=a,this.pairCapacity=n,this.manifoldCapacity=l,this.hashSize=rn(2*l),this.pairBuffer=r.createBuffer({label:"pairs",size:n*8,usage:de()}),this.tableBuffer=r.createBuffer({label:"manifold hash",size:this.hashSize*4,usage:de()}),this.contactBuffers=[0,1].map(f=>r.createBuffer({label:`contacts 3d ${f}`,size:a*wt*4,usage:de()})),this.manifoldBuffers=[0,1].map(f=>r.createBuffer({label:`manifolds 3d ${f}`,size:l*bt*4,usage:de()})),c.contacts){let f=r.createCommandEncoder(),u=Math.min(c.contactCapacity,a)*wt*4,d=Math.min(c.manifoldCapacity,l)*bt*4;c.contacts.forEach((p,m)=>f.copyBufferToBuffer(p,0,this.contactBuffers[m],0,u)),c.manifolds.forEach((p,m)=>f.copyBufferToBuffer(p,0,this.manifoldBuffers[m],0,d)),r.queue.submit([f.finish()]),[...c.contacts,...c.manifolds].forEach(p=>p.destroy())}this.rebuildBindings()}rebuildBindings(){let e=this.device,t=this.bodyCapacity;this.adjBuffer?.destroy(),this.adjBuffer=e.createBuffer({label:"adjacency",size:(2*t+1+2*(this.jointCapacity+this.manifoldCapacity))*4,usage:de()}),this.adjScan?.destroy(),this.adjScan=new Fe(e,this.adjBuffer,0,this.bodyCount+1),this.staticBuffer??=e.createBuffer({label:"statics",size:16,usage:de()});let i=(d,p)=>e.createBindGroup({layout:d,entries:p.map((m,h)=>({binding:h,resource:{buffer:m}}))}),r=this.paramsBuffer,[s,a]=this.contactBuffers,[n,l]=this.manifoldBuffers,c=this.adjBuffer,f=this.tableBuffer,u=this.counterBuffer;this.groups={broad:i(this.layouts.broad,[r,this.bodyBuffer,this.gridBuffer,this.pairBuffer,u,this.staticBuffer,this.jointBuffer,this.filterBuffer]),contacts:[i(this.layouts.contacts,[r,this.bodyBuffer,this.pairBuffer,s,a,n,l,f,u,...this.hulls?[this.hullBuffer]:[]]),i(this.layouts.contacts,[r,this.bodyBuffer,this.pairBuffer,a,s,l,n,f,u,...this.hulls?[this.hullBuffer]:[]])],topo:[n,l].map(d=>i(this.layouts.topo,[r,this.bodyBuffer,this.jointBuffer,this.infoBuffer,d,u,c,this.colorBuffer])),solve:[0,1].map(d=>i(this.layouts.solve,[r,this.bodyBuffer,this.jointBuffer,this.infoBuffer,[s,a][d],c,this.colorBuffer,u,[n,l][d]])),args:i(this.layouts.args,[r,this.counterBuffer,this.colorBuffer,this.argsBuffer]),refs:i(this.layouts.refs,[r,this.bodyBuffer,this.refBuffer])}}writeBodies(e,t){let i=new Float32Array(Math.max(t.length,1)*ke);t.forEach((r,s)=>{let a=this.pack(r,i,s*ke,this.bodies[e+s]?.hull);this.bodies[e+s]?.radius!==a.radius&&(this.radiiDirty=!0),this.bodies[e+s]=a}),this.device.queue.writeBuffer(this.bodyBuffer,e*ke*4,i,0,t.length*ke)}rewriteFixed(e,t,i,r,s){if(!e.length)return;let a=new Float32Array(ke),n={positionLin:[0,0,0],positionAng:[0,0,0,1],initialLin:[0,0,0],initialAng:[0,0,0,1],inertialLin:[0,0,0],inertialAng:[0,0,0,1],velocityLin:[0,0,0],prevVelocityLin:[0,0,0],velocityAng:[0,0,0],size:[i[0],i[1],i[2]],mass:0,moment:[0,0,0],friction:r,radius:Math.hypot(i[0]/2,i[1]/2,i[2]/2)},l=this.pack(n,a,0);for(let c=0;c<e.length;){let f=c+1;for(;f<e.length&&e[f]===e[f-1]+1;)f++;let u=new Float32Array((f-c)*ke);for(let d=c;d<f;d++){let p=(d-c)*ke;u.set(a,p);for(let h=0;h<3;h++)u[p+Oi+h]=t[3*d+h];if(s)for(let h=0;h<4;h++)u[p+cr+h]=s[4*d+h];let m=this.bodies[e[d]];m?.radius!==l.radius&&(this.radiiDirty=!0),m?.hull&&this.releaseHull(m.hull),this.bodies[e[d]]={...l,size:[...l.size]}}this.device.queue.writeBuffer(this.bodyBuffer,e[c]*ke*4,u),this.device.queue.writeBuffer(this.colorBuffer,e[c]*4,new Uint32Array(f-c).fill(255)),c=f}}pack(e,t,i,r){{t.set(e.positionLin,i+Oi),t[i+Oi+3]=e.friction,t.set(e.positionAng,i+cr),t.set(e.size,i+co),t[i+co+3]=e.mass,t.set(e.moment,i+uo),t[i+uo+3]=e.radius,t.set(e.initialLin,i+Na),t.set(e.initialAng,i+qa),t.set(e.inertialLin,i+Va),t.set(e.inertialAng,i+Wa),t.set(e.velocityLin,i+fo);let s=this.params.up;t[i+fo+3]=e.prevVelocityLin[0]*s[0]+e.prevVelocityLin[1]*s[1]+e.prevVelocityLin[2]*s[2],t.set(e.velocityAng,i+ho);let a=ar(e),n=this.hulls?Dr(e):void 0;r&&r!==n&&this.releaseHull(r);let l=n?r===n?this.hullSlots.get(n).offset:this.acquireHull(n):-1;return t[i+ho+3]=a?po:l>=0?Xr+l:Fa(e)?mo:$a,{radius:e.radius,dynamic:e.mass>0,sphere:a,size:[e.size[0],e.size[1],e.size[2]],hull:n}}}writeJoint(e,t,i){let r=new Float32Array(te),s=t.bodyA?i.get(t.bodyA):-1,a=i.get(t.bodyB);t instanceof we?(r.set(t.penaltyLin,Dt),r[Dt+3]=Bt(t.broken?0:t.stiffnessLin),r.set(t.penaltyAng,ur),r[ur+3]=Bt(t.broken?0:t.stiffnessAng),r.set(t.lambdaLin,ji),r[ji+3]=Bt(t.fracture),r.set(t.lambdaAng,Ti),r[Ti+3]=t.torqueArm,r.set(t.C0Lin,Ha),r.set(t.C0Ang,Ja),r.set(t.rA,Gt),r.set(t.rB,Di)):(r[Dt+3]=t.stiffness,r.set(t.rA,Gt),r[Gt+3]=t.rest,r.set(t.rB,Di)),this.info.set([t instanceof we?dr:Ui,s,a,0],e*4),this.device.queue.writeBuffer(this.jointBuffer,e*te*4,r),this.device.queue.writeBuffer(this.infoBuffer,e*16,this.info,e*4,4),this.noCollide(s,a,e)}noCollide(e,t,i){e<0||(this.pendingEntries.push([Math.max(e,t),Math.min(e,t),i]),this.noCollideDirty=!0)}uploadStatics(){if(this.radiiDirty){let r=this.bodyCount,s=new Float64Array(r);for(let c=0;c<r;c++)s[c]=this.bodies[c].radius;let a=Bo(s),n=1/0;for(let c=0;c<r;c++)s[c]>a&&(n=Math.min(n,s[c]));let l=n===1/0?a*1.5:(a+n)/2;this.maxSmallRadius=l,this.cellSize=Math.max(2*a*(1+1e-4),.001),this.large=[];for(let c=0;c<r;c++)this.bodies[c].radius>l&&this.large.push(c);this.radiiDirty=!1}if(this.noCollideDirty){let r=(l,c)=>l[0]-c[0]||l[1]-c[1],s=this.releasedSlots.size?this.entries.filter(l=>!this.releasedSlots.has(l[2])):this.entries;this.releasedSlots.clear();let a=this.pendingEntries.sort(r);this.pendingEntries=[];let n=[];for(let l=0,c=0;l<s.length||c<a.length;)c>=a.length||l<s.length&&r(s[l],a[c])<=0?n.push(s[l++]):n.push(a[c++]);this.entries=n,this.noCollideDirty=!1}let{large:e,entries:t}=this;this.largeCount=e.length,this.noCollideCount=t.length;let i=new Uint32Array(Math.max(e.length+3*t.length,4));i.set(e,0),t.forEach((r,s)=>i.set(r,e.length+3*s)),this.staticBuffer.size<i.byteLength&&(this.staticBuffer.destroy(),this.staticBuffer=this.device.createBuffer({label:"statics",size:i.byteLength,usage:de()}),this.rebuildBindings()),this.device.queue.writeBuffer(this.staticBuffer,0,i)}seedFrom(e){if(this.refToGpu.some((m,h)=>m!==h))throw new Error("seedFrom needs spatialSort: false");let t=new Map(e.bodies.map((m,h)=>[m,h]));this.writeBodies(0,e.bodies);let i=0;for(let m of e.forces)(m instanceof we||m instanceof ct)&&this.writeJoint(i++,m,t);if(i!==this.jointCount)throw new Error("seedFrom: joints differ from the reference");let r=e.forces.filter(m=>m instanceof zi),s=r.reduce((m,h)=>m+h.contacts.length,0);if(s>this.contactCapacity||r.length>this.manifoldCapacity)throw new Error("seedFrom: too many contacts");let a=new ArrayBuffer(Math.max(s,1)*wt*4),n=new Uint32Array(a),l=new Float32Array(a),c=new ArrayBuffer(Math.max(r.length,1)*bt*4),f=new Uint32Array(c),u=new Float32Array(c),d=0;r.forEach((m,h)=>{f.set([t.get(m.bodyA),t.get(m.bodyB),d,m.contacts.length],h*bt),u.set([m.basis[0],m.basis[1],m.basis[2],m.friction],h*bt+Wr);for(let b of m.contacts){let y=d++*wt;l.set(b.rA,y+Gi),n[y+Gi+3]=b.feature>>>0|(b.stick?fr:0),l.set([...b.rB,b.C0[0]],y+Hr),l.set([...b.penalty,b.C0[1]],y+Jr),l.set([...b.lambda,b.C0[2]],y+$r)}}),this.device.queue.writeBuffer(this.contactBuffers[1-this.parity],0,a),this.device.queue.writeBuffer(this.manifoldBuffers[1-this.parity],0,c);let p=new Uint32Array(16);p[1]=s,p[Fi]=r.length,this.device.queue.writeBuffer(this.counterBuffer,0,p)}sequentialColors(){let e=new Uint32Array(this.bodyCount).fill(255),t=0;for(let i=this.bodyCount-1;i>=0;i--)this.bodies[i].dynamic&&(e[i]=t++);if(t>64)throw new Error(`sequentialColors: ${t} dynamic bodies, at most ${64}`);return e}acquireHull(e){!this.hullShaders&&!this.contactShaders.custom&&(this.contactShaders.make(en),this.hullShaders=!0);let t=this.hullSlots.get(e);if(t)return t.refs++,t.offset;let i=2+e.vertices.length/3+2*e.faces.length+Math.ceil(e.faces.reduce((a,n)=>a+n.verts.length,0)/4)+e.edges.length,r=-1,s=this.hullFree.findIndex(a=>a.size>=i);if(s>=0){let a=this.hullFree[s];r=a.offset,a.size===i?this.hullFree.splice(s,1):Object.assign(a,{offset:a.offset+i,size:a.size-i})}else r=this.hullTop,this.hullTop+=i,this.hullTop>this.hullCapacity&&this.growHulls(this.hullTop);if(r+Xr>=2**24)throw new Error("hull buffer beyond 2^24 vec4s");return this.device.queue.writeBuffer(this.hullBuffer,r*16,Wl(e,r)),this.hullSlots.set(e,{offset:r,size:i,refs:1}),r}releaseHull(e){let t=this.hullSlots.get(e);if(!t||--t.refs>0)return;this.hullSlots.delete(e),this.hullFree.push({offset:t.offset,size:t.size}),this.hullFree.sort((r,s)=>r.offset-s.offset);let i=[];for(let r of this.hullFree){let s=i[i.length-1];s&&s.offset+s.size===r.offset?s.size+=r.size:i.push({...r})}this.hullFree=i}growHulls(e){let t=this.hullCapacity;for(;t<e;)t*=2;let i=this.device.createBuffer({label:"hulls",size:t*16,usage:de()}),r=this.device.createCommandEncoder();r.copyBufferToBuffer(this.hullBuffer,0,i,0,this.hullCapacity*16),this.device.queue.submit([r.finish()]),this.hullBuffer.destroy(),this.hullBuffer=i,this.hullCapacity=t,this.contactBuffers&&this.rebuildBindings()}addBody(e){return this.addBodies([e])}addBodies(e){let t=Math.min(e.length,this.bodyCapacity-this.bodyCount);if(t<=0)return-1;let i=this.bodyCount;return this.bodyCount+=t,this.writeBodies(i,e.slice(0,t)),this.device.queue.writeBuffer(this.colorBuffer,i*4,new Uint32Array(t).fill(255)),this.adjScan.destroy(),this.adjScan=new Fe(this.device,this.adjBuffer,0,this.bodyCount+1),i}appendJoint(e,t,i,r,s,a){let n=this.jointCount;n>=this.jointCapacity&&this.allocateJoints(this.jointCapacity*2),this.jointCount++;let l=new Float32Array(te);l[Dt+3]=Bt(s),l[ur+3]=Bt(a),l[ji+3]=3e38,l.set([i[0],i[1],i[2]],Gt),l.set([r[0],r[1],r[2]],Di);let c=e>=0?this.bodies[e].size:[0,0,0],f=this.bodies[t].size;return l[Ti+3]=(c[0]+f[0])**2+(c[1]+f[1])**2+(c[2]+f[2])**2,this.info.set([dr,e,t,0],n*4),this.device.queue.writeBuffer(this.jointBuffer,n*te*4,l),this.device.queue.writeBuffer(this.infoBuffer,n*16,this.info,n*4,4),this.noCollide(e,t,n),n}appendJoints(e,t,i=!1){return this.appendConstraints(e.length,(r,s)=>{let{a,b:n,rA:l,rB:c,angular:f}=e[r];s[Dt+3]=3e38,s[ur+3]=f===void 0?3e38:Bt(f),s[ji+3]=i?-Bt(t):Bt(t),s.set([l[0],l[1],l[2]],Gt),s.set([c[0],c[1],c[2]],Di);let[u,d]=[this.bodies[a].size,this.bodies[n].size];return s[Ti+3]=(u[0]+d[0])**2+(u[1]+d[1])**2+(u[2]+d[2])**2,[dr,a,n]})}appendSprings(e){return this.appendConstraints(e.length,(t,i)=>{let{a:r,b:s,rA:a,rB:n,stiffness:l,rest:c}=e[t];return i[Dt+3]=Bt(l),i.set([a[0],a[1],a[2],c],Gt),i.set([n[0],n[1],n[2]],Di),[Ui,r,s]})}appendConstraints(e,t){let i=[];if(this.freeSlots.length)for(this.freeSlots.sort((n,l)=>l-n);i.length<e&&this.freeSlots.length;)i.push(this.freeSlots.pop());let r=e-i.length,s=this.jointCapacity;for(;this.jointCount+r>s;)s*=2;s>this.jointCapacity&&this.allocateJoints(s);for(let n=0;n<r;n++)i.push(this.jointCount++);let a=new Float32Array(e*te);for(let n=0;n<e;n++){let[l,c,f]=t(n,a.subarray(n*te,(n+1)*te));this.info.set([l,c,f,0],i[n]*4),this.releasedSlots.delete(i[n]),this.noCollide(c,f,i[n])}for(let n=0;n<e;){let l=n+1;for(;l<e&&i[l]===i[l-1]+1;)l++;this.device.queue.writeBuffer(this.jointBuffer,i[n]*te*4,a,n*te,(l-n)*te),this.device.queue.writeBuffer(this.infoBuffer,i[n]*16,this.info,i[n]*4,(l-n)*4),n=l}return i}releaseJoints(e){let t=[...new Set(Array.from(e))].filter(r=>r<this.jointCount&&this.info[r*4]!==0).sort((r,s)=>r-s);if(!t.length)return;for(let r of t)this.info.set([0,-1,-1,0],r*4),this.releasedSlots.add(r),this.freeSlots.push(r);let i=new Float32Array(0);for(let r=0;r<t.length;){let s=r+1;for(;s<t.length&&t[s]===t[s-1]+1;)s++;i.length<(s-r)*te&&(i=new Float32Array((s-r)*te)),this.device.queue.writeBuffer(this.jointBuffer,t[r]*te*4,i,0,(s-r)*te),this.device.queue.writeBuffer(this.infoBuffer,t[r]*16,this.info,t[r]*4,(s-r)*4),r=s}this.noCollideDirty=!0}rewriteBodies(e,t){for(let i=0;i<e.length;){let r=i+1;for(;r<e.length&&e[r]===e[r-1]+1;)r++;this.writeBodies(e[i],t.slice(i,r)),this.device.queue.writeBuffer(this.colorBuffer,e[i]*4,new Uint32Array(r-i).fill(255)),i=r}}setFilters(e,t,i){for(let r=0;r<e.length;){let s=r+1;for(;s<e.length&&e[s]===e[s-1]+1;)s++;let a=new Uint32Array(2*(s-r));for(let n=r;n<s;n++)a.set([t[n]>>>0,i[n]>>>0],2*(n-r));this.device.queue.writeBuffer(this.filterBuffer,e[r]*8,a),r=s}}setWorldAnchor(e,t){this.device.queue.writeBuffer(this.jointBuffer,(e*te+Gt)*4,new Float32Array([t[0],t[1],t[2]]))}disableConstraint(e){this.device.queue.writeBuffer(this.jointBuffer,(e*te+Dt)*4,new Float32Array(8)),this.device.queue.writeBuffer(this.jointBuffer,(e*te+ji)*4,new Float32Array(3)),this.device.queue.writeBuffer(this.jointBuffer,(e*te+Ti)*4,new Float32Array(3))}profileNextStep(e){this.timing&&!this.timingBusy&&(this.timingCallback=e)}writeParams(){let e=this.params,t=this.bodyCapacity,i=new ArrayBuffer(Ao*4),r=new Float32Array(i),s=new Uint32Array(i);r[0]=e.dt,r[1]=e.gravity,r[2]=e.betaLin,r[3]=e.betaAng,r[4]=e.gamma,r[5]=e.alpha,s[6]=(e.matchNearest?bo:0)|(e.faceBias?go:0)|(e.reuseContacts?yo:0)|(e.startAtRest?vo:0)|(e.massPenalty?xo:0),s[7]=this.bodyCount,s[8]=this.jointCount,s[9]=this.colorCap,r[10]=this.cellSize,s[11]=this.tableSize-1,r[12]=this.maxSmallRadius,s[13]=this.largeCount,s[14]=this.noCollideCount,s[15]=this.pairCapacity,s[16]=this.contactCapacity,s[17]=this.hashSize-1,s[18]=t+1,s[19]=2*t+1,s[20]=this.tableSize+1,s[21]=2*this.tableSize+1,s[22]=2*this.tableSize+1+t,s[23]=t,s[24]=this.colorHistOffset,s[25]=2*t,s[26]=this.colorGroups,s[27]=2*t+65,s[28]=this.colorRounds,s[29]=this.manifoldCapacity,s[30]=this.stepCount;let a=n=>Math.min(31,Math.max(0,Math.round(Math.log2(n))));s[31]=a(this.primalLanes[0])|a(this.primalLanes[1])<<8|a(this.primalLanes[2])<<16,r.set([e.windSpeed*Math.cos(e.windAngle),e.windSpeed*Math.sin(e.windAngle),0,e.windPressure,e.windGust],32),r.set([e.up[0],e.up[1],e.up[2],0],40),this.device.queue.writeBuffer(this.paramsBuffer,0,i)}writePassConstants(e,t){let i=this.colorCap+1,r=Math.max(e*i,1);(r>this.passEntries||!this.passGroup)&&(this.passBuffer?.destroy(),this.passBuffer=this.device.createBuffer({label:"pass constants",size:r*256,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.passEntries=r,this.passGroup=this.device.createBindGroup({layout:this.layouts.pass,entries:[{binding:0,resource:{buffer:this.passBuffer,size:16}}]}));let s=new ArrayBuffer(r*256),a=new Uint32Array(s),n=new Float32Array(s);for(let l=0;l<e;l++)for(let c=0;c<=this.colorCap;c++){let f=(l*i+c)*256/4;a[f]=c,n[f+1]=t}this.device.queue.writeBuffer(this.passBuffer,0,s)}step(){(this.radiiDirty||this.noCollideDirty)&&this.uploadStatics();let e=this.params;this.fixedColors&&(this.device.queue.writeBuffer(this.colorBuffer,0,this.fixedColors),this.colorCap=Math.max(1,...this.fixedColors.map(v=>v===255?0:v+1))),this.stepCount++,this.writeParams(),this.writePassConstants(e.iterations,e.alpha);let t=this.parity,i=this.bodyCapacity,r=this.bodyCount,s=this.jointCount,a=this.device.createCommandEncoder({label:"avbd3d step"});a.clearBuffer(this.gridBuffer,0,(2*this.tableSize+1)*4),a.clearBuffer(this.tableBuffer),a.clearBuffer(this.adjBuffer,0,(2*i+1)*4);let n=this.timingCallback!==null&&this.timing!==null,l,c=0,f=n||this.splitPasses,u=()=>{l&&!f||(l?.end(),l=a.beginComputePass({label:f?fe[c]:"avbd3d step",timestampWrites:n?{querySet:this.timing.querySet,beginningOfPassWriteIndex:2*c,endOfPassWriteIndex:2*c+1}:void 0}),c++)},d=this.groups,p=(v,B,g)=>{g<=0||(l.setPipeline(this.pipes[v]),l.setBindGroup(0,B),l.dispatchWorkgroups(g))},m=(v,B,g)=>{l.setPipeline(this.pipes[v]),l.setBindGroup(0,B),l.dispatchWorkgroupsIndirect(this.argsBuffer,g*4)};if(u(),p("beginFrame",d.broad,1),e.reuseContacts&&p("updateRefs",d.refs,Je(r)),p("argsPrev",d.args,1),m("hashInsert",d.contacts[t],6),p("gridCount",d.broad,Je(r)),this.gridScan.encode(l),p("gridScatter",d.broad,Je(r)),p("findPairs",d.broad,Je(r)),p("argsPairs",d.args,1),m("narrowphase",d.contacts[t],0),p("argsContacts",d.args,1),u(),p("degreeJoints",d.topo[t],Je(s)),m("degreeContacts",d.topo[t],3),this.adjScan.encode(l),p("fillJoints",d.topo[t],Je(s)),m("fillContacts",d.topo[t],3),p("sortAdjacency",d.topo[t],Je(r)),u(),!this.fixedColors){p("colorCompact",d.topo[t],Je(r)),p("colorMark",d.topo[t],Je(r));for(let v=0;v<this.colorRounds;v++)p(v%2===0?"colorRoundAB":"colorRoundBA",d.topo[t],Je(r))}p("colorCount",d.topo[t],this.colorGroups),this.colorHistScan.encode(l),p("colorStarts",d.topo[t],1),p("argsColors",d.args,1),p("colorScatter",d.topo[t],this.colorGroups),u();let h=this.colorCap+1,b=v=>l.setBindGroup(1,this.passGroup,[v*256]);l.setBindGroup(0,d.solve[t]),b(0),s>0&&(l.setPipeline(this.pipes.warmStartJoints),l.dispatchWorkgroups(Je(s))),l.setPipeline(this.pipes.warmStartBodies),l.dispatchWorkgroups(Je(r));for(let v=0;v<e.iterations;v++){l.setPipeline(this.pipes.primal);for(let B=0;B<this.colorCap;B++)b(v*h+B),l.dispatchWorkgroupsIndirect(this.argsBuffer,(12+3*B)*4);b(v*h+this.colorCap),l.setPipeline(this.pipes.dual),l.dispatchWorkgroupsIndirect(this.argsBuffer,36)}l.setPipeline(this.pipes.updateVelocities),l.dispatchWorkgroups(Je(r)),l.end();let y=2*fe.length;if(n){let{querySet:v,resolve:B,read:g}=this.timing;a.resolveQuerySet(v,0,y,B,0),a.copyBufferToBuffer(B,0,g,0,y*8)}if(this.device.queue.submit([a.finish()]),this.parity=1-t,n){let v=this.timingCallback;this.timingCallback=null,this.timingBusy=!0;let B=this.timing.read;B.mapAsync(GPUMapMode.READ).then(()=>{let g=new BigUint64Array(B.getMappedRange()).slice();if(B.unmap(),this.timingBusy=!1,this.destroyed)return this.releaseTiming();let A=(w,E)=>Number(g[E]-g[w])/1e6,x={total:A(0,y-1)};fe.forEach((w,E)=>x[w]=A(2*E,2*E+1)),v(x)},()=>{this.timingBusy=!1,this.destroyed&&this.releaseTiming()})}}async readBodies(){return new Float32Array(await this.read(this.bodyBuffer,this.bodyCount*ke*4))}async readJoints(){return new Float32Array(await this.read(this.jointBuffer,this.jointCount*te*4))}async readCounters(){let e=new Uint32Array(await this.read(this.counterBuffer,64));return{pairs:e[0],contacts:e[1],manifolds:e[Fi],overflow:e[3],clashes:e[4],colors:e[5]}}async readContactList(){let e=await this.readCounters(),t=Math.min(e.manifolds,this.manifoldCapacity),i=Math.min(e.contacts,this.contactCapacity),r=1-this.parity,[s,a]=await Promise.all([this.read(this.manifoldBuffers[r],t*bt*4),this.read(this.contactBuffers[r],i*wt*4)]),n=new Uint32Array(s),l=new Float32Array(s),c=new Uint32Array(a),f=new Float32Array(a),u=[];for(let d=0;d<t;d++){let p=d*bt,m=[...l.subarray(p+Wr,p+Wr+3)];for(let h=n[p+2];h<n[p+2]+(n[p+3]&15);h++){let b=h*wt,y=c[b+Gi+3];u.push({a:n[p],b:n[p+1],feature:(y&~fr)>>>0,stick:(y&fr)!==0,rA:[...f.subarray(b+Gi,b+Gi+3)],rB:[...f.subarray(b+Hr,b+Hr+3)],pen:[...f.subarray(b+Jr,b+Jr+3)],lam:[...f.subarray(b+$r,b+$r+3)],normal:m})}}return u}async readPairs(){let{pairs:e}=await this.readCounters();return new Uint32Array(await this.read(this.pairBuffer,Math.min(e,this.pairCapacity)*8))}jointInfo(){return this.info.subarray(0,this.jointCount*4)}adapt(e){if(this.fixedColors)return;let t=e.colors;e.clashes>0&&(this.colorRounds=Math.min(32,this.colorRounds*2)),e.clashes>0||this.colorCap-t<2?(this.colorCap=Math.min(64,Math.max(t+Kr+2,this.colorCap+4)),this.shrinkVotes=0):t+Kr+2<this.colorCap||this.colorRounds>4?++this.shrinkVotes>=3&&(this.colorCap=Math.min(64,t+Kr),this.colorRounds=Math.max(4,this.colorRounds-4),this.shrinkVotes=0):this.shrinkVotes=0;let i=(n,l,c)=>(e.overflow&c)!==0||n>Ul*l?Math.max(Nl*n,1.25*l):l,r=i(e.contacts,this.contactCapacity,2),s=i(e.pairs,this.pairCapacity,1),a=i(e.manifolds,this.manifoldCapacity,4);this.capacityCanGrow(r,s,a)&&this.allocateContacts(r,s,a)}capacityCanGrow(e,t,i){let r=this.device.limits.maxStorageBufferBindingSize;return Math.min(e,r/(wt*4))>this.contactCapacity||Math.min(t,r/8)>this.pairCapacity||Math.min(i,t,r/(bt*4))>this.manifoldCapacity}async read(e,t){if(t===0)return new ArrayBuffer(0);let i=this.device.createBuffer({size:t,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),r=this.device.createCommandEncoder();r.copyBufferToBuffer(e,0,i,0,t),this.device.queue.submit([r.finish()]),await i.mapAsync(GPUMapMode.READ);let s=i.getMappedRange().slice(0);return i.unmap(),i.destroy(),s}releaseTiming(){this.timing?.resolve.destroy(),this.timing?.read.destroy(),this.timing?.querySet.destroy()}destroy(){this.ownsBodyBuffer&&this.bodyBuffer.destroy();let e=[this.jointBuffer,this.infoBuffer,...this.contactBuffers,...this.manifoldBuffers,this.pairBuffer,this.tableBuffer,this.gridBuffer,this.staticBuffer,this.counterBuffer,this.argsBuffer,this.adjBuffer,this.colorBuffer,this.paramsBuffer,this.refBuffer,this.hullBuffer,this.passBuffer,this.filterBuffer];for(let t of e)t?.destroy();this.destroyed=!0,this.timingBusy||this.releaseTiming(),this.gridScan.destroy(),this.colorHistScan.destroy(),this.adjScan?.destroy()}};var sn=`  e.C = vec3f(
    k.c0x * keep + dot(n, A.dLin) - dot(n, B.dLin) + dot(cross(e.rAW, n), A.dAng) + dot(cross(e.rBW, -n), B.dAng),
    k.c0y * keep + dot(t1, A.dLin) - dot(t1, B.dLin) + dot(cross(e.rAW, t1), A.dAng) + dot(cross(e.rBW, -t1), B.dAng),
    k.c0z * keep + dot(t2, A.dLin) - dot(t2, B.dLin) + dot(cross(e.rAW, t2), A.dAng) + dot(cross(e.rBW, -t2), B.dAng));`;if(be.split(sn).length!==2)throw Error("Pinned contact evaluation changed; review the app kernel variant");var pr=be.replace(sn,`  let delta = A.dLin - B.dLin + cross(A.dAng, e.rAW) - cross(B.dAng, e.rBW);
  e.C = vec3f(k.c0x, k.c0y, k.c0z) * keep + vec3f(dot(n, delta), dot(t1, delta), dot(t2, delta));`);function ot(o,e,t){if(o.split(e).length!==2)throw Error("Pinned solve layout changed; review the app kernel variant");return o.replace(e,t)}var es=(()=>{let o=ot(pr,"  var e = adj[i] + lane;",`  let begin = adj[i];
  var e = begin;`);return o=ot(o,`    if (c == cEnd) {
`,`    if (c >= cEnd) {
`),o=ot(o,`      e += lanes;
      if (id < params.jointCount) {
        addJoint(&acc, id, pc.alpha, i);`,`      e++;
      if (id < params.jointCount) {
        if ((e - begin - 1u) % lanes != lane) { continue; }
        addJoint(&acc, id, pc.alpha, i);`),o=ot(o,"      isA = i == mf.ids.x;",`      c = mf.ids.z + lane;
      cEnd = mf.ids.z + pairCount(mf);
      if (c >= cEnd) { continue; }
      isA = i == mf.ids.x;`),o=ot(o,`      c = mf.ids.z;
      cEnd = mf.ids.z + pairCount(mf);
      if (c == cEnd) { continue; }`,""),o=ot(o,"    c++;","    c += lanes;"),o})();function zo(o=be){o=ot(o,"fn manifoldCount() -> u32 {",`fn solverStepValid() -> bool {
  return counters[C_OVERFLOW] == 0u && counters[C_CLASHES] == 0u;
}


fn manifoldCount() -> u32 {`);for(let[e,t]of[["warmStartJoints","global_invocation_id"],["warmStartBodies","global_invocation_id"],["dual","global_invocation_id"],["updateVelocities","global_invocation_id"]]){let i=`fn ${e}(@builtin(${t}) gid: vec3u) {`;o=ot(o,i,`${i}
  if (!solverStepValid()) { return; }`)}return ot(o,"  let live = k < count;","  let live = k < count && solverStepValid();")}function Mo(o){return o=ot(o,"  return qsub(rotA(a), bodies[b].rot) * k.lamAng.w;",`  let rest = vec4f(k.c0Lin.w, k.c0Ang.w, k.rA.w, k.rB.w);
  var restTarget = rotA(a);
  if (dot(rest, rest) > 0.5) {
    restTarget = vec4f(restTarget.w * rest.xyz + rest.w * restTarget.xyz + cross(restTarget.xyz, rest.xyz),
      restTarget.w * rest.w - dot(restTarget.xyz, rest.xyz));
  }
  return qsub(restTarget, bodies[b].rot) * k.lamAng.w;`),o=ot(o,"k.c0Lin = vec4f(jointLinC(k, a, b), 0.0);","k.c0Lin = vec4f(jointLinC(k, a, b), k.c0Lin.w);"),ot(o,"k.c0Ang = vec4f(jointAngC(k, a, b), 0.0);","k.c0Ang = vec4f(jointAngC(k, a, b), k.c0Ang.w);")}var on=`// Capture new constraints from live GPU poses; no stale mesh poses or readback.
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
`;var an=`// Conservative GPU sleeping. Resting contacts form supports from the ground
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
fn wake(i:u32) {if(states[i].mass>0.){bodies[i].size.w=states[i].mass;states[i].asleep=0u;states[i].quiet=0.;}}
@compute @workgroup_size(64) fn before(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;if(i>=params.count){return;}
  if(params.forceWake!=0u||atomicLoad(&globals[0])!=0u){wake(i);}
  atomicStore(&states[i].support,0u);
}
@compute @workgroup_size(1) fn clear() {atomicStore(&globals[0],0u);atomicStore(&globals[1],0u);}
fn impact(a:u32,b:u32) {
  if(states[a].asleep!=0u && states[b].asleep==0u && speed(b)>2.*params.speed){atomicStore(&globals[0],1u);}
}
@compute @workgroup_size(64) fn contacts(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;if(i>=min(counters[6],params.manifolds)){return;}
  let m=manifolds[i];if((m.ids.w&15u)==0u || (m.ids.w&0x80000000u)!=0u){return;}
  let a=m.ids.x;let b=m.ids.y;impact(a,b);impact(b,a);
  let up=dot(m.geo.xyz,params.up.xyz);
  if(bodies[b].size.w==0. && up>0.3){atomicStore(&states[a].support,1u);}
  if(bodies[a].size.w==0. && up < -0.3){atomicStore(&states[b].support,1u);}
}
@compute @workgroup_size(64) fn joints(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;if(i>=params.joints){return;}let j=info[i];if(j.x==0||j.y<0){return;}
  impact(u32(j.y),u32(j.z));impact(u32(j.z),u32(j.y));
}
@compute @workgroup_size(64) fn rest(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;if(i>=params.count||states[i].mass<=0.){return;}
  if(states[i].eligible==0u){wake(i);return;}
  if(atomicLoad(&globals[0])!=0u || counters[3]!=0u || counters[4]!=0u){wake(i);return;}
  if(states[i].asleep==0u){
    if(speed(i)<=params.speed && (params.gravity==0. || atomicLoad(&states[i].support)!=0u)) {states[i].quiet+=params.dt;}
    else {states[i].quiet=0.;}
    if(states[i].quiet>=params.delay){
      states[i].asleep=1u;bodies[i].size.w=0.;bodies[i].velocity=vec4f(0.);bodies[i].angular=vec4f(vec3f(0.),bodies[i].angular.w);
    }
  }
  if(states[i].asleep!=0u){atomicAdd(&globals[1],1u);}
}
`;var Io=class{constructor(e){this.device=e,this.targets=new Map,this.bits=new Float32Array(1),this.words=new Uint32Array(this.bits.buffer)}target(e){let t=this.targets.get(e);return t||this.targets.set(e,t={pending:new Map}),t}uint(e,t,i){this.target(e).pending.set(t,i>>>0)}float(e,t,i){this.bits[0]=i,this.uint(e,t,this.words[0])}get pending(){for(let e of this.targets.values())if(e.pending.size)return!0;return!1}flush(e){let t=this.device,i=e,r=0,s=0,a=0,n=0;for(let[l,c]of this.targets){let f=c.pending.size;if(!f)continue;(!c.data||c.data.length<f*2)&&(c.data=new Uint32Array(Math.max(f*2,(c.data?.length??0)*2,128)));let u=Array.from(c.pending.keys()),d=!0;for(let m=1;m<f;m++)if(u[m]<u[m-1]){d=!1;break}d||u.sort((m,h)=>m-h);let p=1;for(let m=1;m<f;m++)u[m]!==u[m-1]+1&&p++;if(p<=4||f<=8){for(let m=0;m<f;m++)c.data[m]=c.pending.get(u[m]);for(let m=0;m<f;){let h=m+1;for(;h<f&&u[h]===u[h-1]+1;)h++;t.queue.writeBuffer(l,u[m]*4,c.data.buffer,m*4,(h-m)*4),r++,m=h}n+=f*4}else{let m=f*8,h=Math.min(t.limits.maxBufferSize,t.limits.maxStorageBufferBindingSize);if(m>h)throw Error("Property batch exceeds GPU buffer limits");for(let B=0;B<f;B++)c.data[B*2]=u[B],c.data[B*2+1]=c.pending.get(u[B]);(!c.upload||c.upload.size<m)&&(c.upload?.destroy(),c.upload=t.createBuffer({size:Math.min(h,m*2),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),c.group=null),t.queue.writeBuffer(c.upload,0,c.data.buffer,0,m),this.pipeline??=t.createComputePipeline({layout:"auto",compute:{entryPoint:"applyEdits",module:t.createShaderModule({code:`
          @group(0) @binding(0) var<storage,read_write> outputWords:array<u32>;
          @group(0) @binding(1) var<storage,read> edits:array<vec2u>;
          @compute @workgroup_size(64) fn applyEdits(@builtin(global_invocation_id) id:vec3u){
            let i=id.x+id.y*${t.limits.maxComputeWorkgroupsPerDimension*64}u;
            if(i>=arrayLength(&edits)){return;}let edit=edits[i];outputWords[edit.x]=edit.y;
          }`})}}),(!c.group||c.bytes!==m)&&(c.group=t.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}},{binding:1,resource:{buffer:c.upload,size:m}}]}),c.bytes=m),i??=t.createCommandEncoder({label:"AVBD property edits"});let b=i.beginComputePass();b.setPipeline(this.pipeline),b.setBindGroup(0,c.group);let y=Math.ceil(f/64),v=t.limits.maxComputeWorkgroupsPerDimension;b.dispatchWorkgroups(Math.min(y,v),Math.ceil(y/v)),b.end(),r++,s++,n+=m}a+=f,c.pending.clear()}!e&&i&&t.queue.submit([i.finish()]),a&&(this.lastBatch={words:a,writes:r,dispatches:s,uploadedBytes:n,submissions:!e&&i?1:0})}destroy(){for(let e of this.targets.values())e.upload?.destroy();this.targets.clear()}forget(e){this.targets.get(e)?.upload?.destroy(),this.targets.delete(e)}};function Q(o){return o.propertyEdits??=new Io(o.device)}var hi=class{constructor(e,t={}){if(this.world=e,this.device=e.device,this.speed=t.speedThreshold??.03,this.delay=t.timeThreshold??.5,!Number.isFinite(this.speed)||this.speed<=0||!Number.isFinite(this.delay)||this.delay<=0)throw Error("Sleep speedThreshold and timeThreshold must be positive and finite");let i=this.device,r=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC;this.state=i.createBuffer({size:e.capacity*32,usage:r}),this.globals=i.createBuffer({size:8,usage:r}),this.params=i.createBuffer({size:48,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let s=i.createShaderModule({code:an});this.layout=i.createBindGroupLayout({entries:["storage","storage","read-only-storage","read-only-storage","read-only-storage","storage","uniform"].map((c,f)=>({binding:f,visibility:GPUShaderStage.COMPUTE,buffer:{type:c}}))});let a=i.createPipelineLayout({bindGroupLayouts:[this.layout]});this.pipelines=Object.fromEntries(["before","clear","contacts","joints","rest"].map(c=>[c,i.createComputePipeline({layout:a,compute:{module:s,entryPoint:c}})]));let n=new Float32Array(e.capacity*8),l=new Uint32Array(n.buffer);for(let c of e.aggregates)if(!c.disposed){let f=(c.gpuSlot??e.gpu.gpuIndex(c.index))*8;n[f]=c.rigid.mass,l[f+4]=c.allowSleep===!1||c.rigid.allowSleep===!1?0:1}i.queue.writeBuffer(this.state,0,n),this.wakeRequested=!1}register(e,t,i=!0){let r=new Float32Array([t,0,0,0,0,0,0,0]);new Uint32Array(r.buffer)[4]=i?1:0;let s=new Uint32Array(r.buffer),a=Q(this.world.gpu);for(let n=0;n<8;n++)a.uint(this.state,e*8+n,s[n]);this.wakeRequested=!0}bindContacts(){let e=this.world.gpu,t=e.contactStorage,i=[e.bodyBuffer,this.state,e.infoBuffer,t.manifolds,t.counters,this.globals,this.params],r=this.groups?.find(s=>s.buffers.every((a,n)=>a===i[n]));r||(r={buffers:i,group:this.device.createBindGroup({layout:this.layout,entries:i.map((s,a)=>({binding:a,resource:{buffer:s}}))})},this.groups=[...(this.groups??[]).slice(-1),r]),this.group=r.group}before(e){this.world.gpu.flushPropertyEdits(e);let{gpu:t}=this.world,i=t.contactStorage,r=new ArrayBuffer(48),s=new Uint32Array(r),a=new Float32Array(r);s.set([t.bodyCount,t.jointCount,t.manifoldCapacity,this.wakeRequested?1:0]),a.set([this.speed,this.delay,t.params.dt,t.params.gravity],4),a.set(t.params.up,8),this.device.queue.writeBuffer(this.params,0,r),this.wakeRequested=!1,this.bindContacts(),this.run([["before",t.bodyCount],["clear",1]],e)}after(e){let t=this.world.gpu,i=t.contactStorage;this.bindContacts(),this.run([["contacts",t.manifoldCapacity],["joints",t.jointCount],["rest",t.bodyCount]],e)}run(e,t){let i=t??this.device.createCommandEncoder(),r=i.beginComputePass();r.setBindGroup(0,this.group);for(let[s,a]of e)a&&(r.setPipeline(this.pipelines[s]),r.dispatchWorkgroups(s==="clear"?1:Math.ceil(a/64)));r.end(),t||this.device.queue.submit([i.finish()])}async readStats(){let e=this.device,t=e.createBuffer({size:8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let i=e.createCommandEncoder();i.copyBufferToBuffer(this.globals,0,t,0,8),e.queue.submit([i.finish()]),await t.mapAsync(GPUMapMode.READ);let r=new Uint32Array(t.getMappedRange());return{sleeping:r[1],wakeRequested:!!r[0]}}finally{t.destroy()}}dispose(){this.world.gpu.propertyEdits?.forget(this.state),this.state.destroy(),this.globals.destroy(),this.params.destroy()}};var Ro=new WeakMap;function Pt(o={}){let e={};for(let t of["breakStrain","breakForce"]){let i=o[t]??1/0;if(i!==1/0&&(!Number.isFinite(i)||i<=0))throw Error(`${t} must be positive or Infinity`);e[t]=i}return e}function ts(o,e){let t=Pt(e);Number.isFinite(t.breakStrain)||Number.isFinite(t.breakForce)?Ro.set(o,t):Ro.delete(o)}var Oo=o=>Ro.get(o);function is(o){let e="fn dualJoint(j: u32) {";if(o.split(e).length!==2)throw Error("Review spring fracture kernel integration");return o.replace(e,`${e}
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
`)}var Yl=["auto","standard","optimized","points"];function qi({requested:o="auto",bodyCount:e,constraintCount:t=0,contactScheduling:i="manifolds",custom:r=!1}){if(!Yl.includes(o))throw Error("solverMode must be 'auto', 'standard', 'optimized' or 'points'");if(!["manifolds","points"].includes(i))throw Error("contactScheduling must be 'manifolds' or 'points'");if(r&&o!=="auto")throw Error("A scene-specific solve shader cannot be replaced with a rigid-body solver mode");let s=r?"custom":o!=="auto"?o:t>0||e<5e4?"standard":i==="points"?"points":"optimized",a=r?"This scene supplies its own solver. Automatic keeps that implementation.":o!=="auto"?"Explicit implementation override (developer setting).":t>0?"Work layout selected for joints and springs.":e<5e4?"Work layout selected for smaller rigid scenes.":s==="points"?"Large rigid scene with a measured shared-contact-points layout.":"Work layout selected for large rigid scenes.";return{requested:o,selected:s,reason:a,bodyCount:e,constraintCount:t}}var rs=`// Portable hierarchical PLOC: Morton ordering and independent SAH treelets.
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
}\r
`;var nn=`// Stable 4-bit GPU radix sort; PrefixScan scans digit-major block counts.
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
`;var Zl=()=>GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC,ut=(o,e=128)=>Math.max(1,Math.ceil(o/e)),ec=4294967295,jo=Ft.indexOf(`@compute @workgroup_size(64)
fn gridCount`),To=Ft.indexOf("/** Binary search"),ln=Ft.indexOf(`@compute @workgroup_size(64)
fn findPairs`);if(jo<0||To<jo||ln<To)throw Error("Pinned broadphase changed; review H-PLOC integration");var tc=rs.slice(0,rs.indexOf("@group(0)")),ic=(Ft.slice(0,jo)+Ft.slice(To,ln)).replace("var<storage, read_write> grid: array<atomic<u32>>;","var<storage, read_write> tree: array<Node>;")+`
${tc}
@group(1) @binding(0) var<uniform> build: BuildSettings;
@group(1) @binding(1) var<storage,read> links: array<u32>;
@compute @workgroup_size(64)
fn findTreePairs(@builtin(global_invocation_id) gid:vec3u) {
  let i=gid.x; if(i>=params.bodyCount || build.root==0xffffffffu){return;}
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
}`,ss=class{constructor(e,t,{rebuildInterval:i=64}={}){if(!Number.isInteger(i)||i<1)throw Error("BVH rebuildInterval must be a positive integer");if(this.device=e,this.capacity=t.bodyCapacity,this.capacity>16*e.limits.maxComputeWorkgroupsPerDimension)throw Error("H-PLOC capacity exceeds the adapter dispatch limit; select the grid");this.bodyBuffer=t.bodyBuffer,this.rebuildInterval=i,this.nodeCapacity=2*this.capacity+16*Math.ceil(Math.log2(Math.max(2,this.capacity)))+32,this.buffers=[],this.uniforms=[],this.stats={builds:0,refits:0,nodes:0,extraBytes:0};let r=(f,u,d=Zl())=>{if(d&GPUBufferUsage.STORAGE&&u>e.limits.maxStorageBufferBindingSize)throw Error(`${f} exceeds the adapter storage binding limit`);let p=e.createBuffer({label:f,size:Math.max(16,u),usage:d});return this.buffers.push(p),this.stats.extraBytes+=p.size,p};this.nodes=r("H-PLOC nodes",this.nodeCapacity*32),this.links=r("H-PLOC parents and escape links",this.nodeCapacity*8),this.keys=[r("Morton keys A",this.capacity*8),r("Morton keys B",this.capacity*8)],this.clusters=r("H-PLOC level roots",this.capacity*8+128),this.bounds=r("H-PLOC scene bounds",(ut(this.capacity)*2+256)*16),this.sortBlocks=ut(this.capacity),this.hist=r("Morton radix counts",this.sortBlocks*16*4),this.scan=new Fe(e,this.hist,0,this.sortBlocks*16);let s=(f,u)=>({binding:f,visibility:GPUShaderStage.COMPUTE,buffer:{type:u}});this.layout=e.createBindGroupLayout({entries:[s(0,"uniform"),s(1,"read-only-storage"),...Array.from({length:5},(f,u)=>s(u+2,"storage"))]}),this.extraLayout=e.createBindGroupLayout({entries:[s(0,"uniform"),s(1,"read-only-storage")]});let a=e.createShaderModule({label:"portable H-PLOC",code:ae+rs+`
@compute @workgroup_size(128)
fn initializeLinks(@builtin(global_invocation_id) gid:vec3u){if(gid.x<build.escapeOffset){links[gid.x]=0xffffffffu;}}
`}),n=e.createPipelineLayout({bindGroupLayouts:[this.layout]});this.pipes=Object.fromEntries(["leaves","reduceBounds","mortonCodes","seedClusters","miniHploc","refitTreelets","ropes","initializeLinks"].map(f=>[f,e.createComputePipeline({layout:n,compute:{module:a,entryPoint:f}})]));let l=e.createShaderModule({label:"stable Morton radix",code:nn});this.sortLayout=e.createBindGroupLayout({entries:[s(0,"uniform"),s(1,"read-only-storage"),s(2,"storage"),s(3,"storage")]});let c=e.createPipelineLayout({bindGroupLayouts:[this.sortLayout]});this.sortPipes=Object.fromEntries(["countDigits","scatterDigits"].map(f=>[f,e.createComputePipeline({layout:c,compute:{module:l,entryPoint:f}})])),this.traverse=e.createComputePipeline({label:"H-PLOC collision traversal",layout:e.createPipelineLayout({bindGroupLayouts:[t.layouts.broad,this.extraLayout]}),compute:{module:e.createShaderModule({code:ic}),entryPoint:"findTreePairs"}}),this.configure(t.bodyCount)}uniform(e){let t=this.device.createBuffer({size:e.length*4,usage:GPUBufferUsage.UNIFORM,mappedAtCreation:!0});return new Uint32Array(t.getMappedRange()).set(e),t.unmap(),this.uniforms.push(t),t}configure(e){if(e===this.count)return;if(e>this.capacity)throw Error("H-PLOC body capacity exceeded");for(let d of this.uniforms)d.destroy();this.uniforms=[],this.count=e,this.built=!1,this.stepsSinceBuild=0;let t=[],i=e,r=e,s=0,a=e,n=e===0?ec:0;for(;i>1;){let d=Math.ceil(i/16);t.push({inputCount:i,nodeBase:r,inputOffset:s,outputOffset:a,blocks:d}),d===1&&(n=r+i-2),r+=d*15,s=a,a+=d,i=d}this.stats.nodes=e?2*e-1:0;let l=(d={})=>{let p=this.uniform([e,d.nodeBase??0,d.inputOffset??0,d.outputOffset??0,n,this.sortBlocks,0,d.boundsOffset??0,d.inputCount??e,this.nodeCapacity,0,0]);return{group:this.device.createBindGroup({layout:this.layout,entries:[p,this.bodyBuffer,this.nodes,this.keys[0],this.bounds,this.links,this.clusters].map((h,b)=>({binding:b,resource:{buffer:h}}))}),buffer:p}};this.base=l(),this.levels=t.map(d=>({...d,...l(d)})),this.reductions=[];let c=ut(e),f=0,u=c*2;for(;c>1;){let d=ut(c);this.reductions.push({blocks:d,...l({inputCount:c,inputOffset:f,outputOffset:u})}),f=u,u+=d*2,c=d}this.morton=l({boundsOffset:f}),this.sortGroups=Array.from({length:8},(d,p)=>{let m=this.uniform([e,this.sortBlocks,p*4,0]);return this.device.createBindGroup({layout:this.sortLayout,entries:[m,this.keys[p%2],this.keys[1-p%2],this.hist].map((h,b)=>({binding:b,resource:{buffer:h}}))})}),this.extra=this.device.createBindGroup({layout:this.extraLayout,entries:[{binding:0,resource:{buffer:this.base.buffer}},{binding:1,resource:{buffer:this.links}}]}),this.broadBuffers=null}encodeBuild(e){let t=(r,s,a)=>{e.setPipeline(this.pipes[r]),e.setBindGroup(0,s),e.dispatchWorkgroups(a)};t("leaves",this.base.group,ut(this.count));let i=!this.built||this.stepsSinceBuild>=this.rebuildInterval;if(this.lastRebuilt=i,i){t("initializeLinks",this.base.group,ut(this.nodeCapacity));for(let r of this.reductions)t("reduceBounds",r.group,r.blocks);t("mortonCodes",this.morton.group,ut(this.count));for(let r of this.sortGroups)e.setPipeline(this.sortPipes.countDigits),e.setBindGroup(0,r),e.dispatchWorkgroups(this.sortBlocks),this.scan.encode(e),e.setPipeline(this.sortPipes.scatterDigits),e.setBindGroup(0,r),e.dispatchWorkgroups(this.sortBlocks);t("seedClusters",this.base.group,ut(this.count));for(let r of this.levels)t("miniHploc",r.group,r.blocks);t("ropes",this.base.group,ut(this.nodeCapacity)),this.built=!0,this.stepsSinceBuild=0,this.stats.builds++}else{for(let r of this.levels)t("refitTreelets",r.group,ut(r.blocks,64));this.stats.refits++}this.stepsSinceBuild++}encodePairs(e,t){this.configure(t.bodyCount);let i=[t.paramsBuffer,t.bodyBuffer,this.nodes,t.pairBuffer,t.counterBuffer,t.staticBuffer,t.jointBuffer,t.filterBuffer];(!this.broadBuffers||i.some((r,s)=>r!==this.broadBuffers[s]))&&(this.broadBuffers=i,this.broad=this.device.createBindGroup({layout:t.layouts.broad,entries:i.map((r,s)=>({binding:s,resource:{buffer:r}}))})),e.setPipeline(this.traverse),e.setBindGroup(0,this.broad),e.setBindGroup(1,this.extra),e.dispatchWorkgroups(ut(this.count,64))}destroy(){this.scan.destroy();for(let e of[...this.buffers,...this.uniforms])e.destroy()}};function cn(o,e={}){let t,i,r=!0,s=new Map,a=l=>{if(!i&&!l)return;let c=e.timestampWrites,f=o.beginComputePass({...e,timestampWrites:c&&(r||l)?{querySet:c.querySet,...r&&c.beginningOfPassWriteIndex!==void 0?{beginningOfPassWriteIndex:c.beginningOfPassWriteIndex}:{},...l&&c.endOfPassWriteIndex!==void 0?{endOfPassWriteIndex:c.endOfPassWriteIndex}:{}}:void 0});if(i){f.setPipeline(i.pipeline);for(let[u,d]of i.bindings)f.setBindGroup(u,...d);f[i.method](...i.args)}f.end(),i=null,r=!1},n=(l,c)=>{a(!1),i={pipeline:t,bindings:new Map(s),method:l,args:c}};return{setPipeline(l){t=l},setBindGroup(l,c,f){s.set(l,f===void 0?[c]:[c,[...f]])},dispatchWorkgroups(...l){n("dispatchWorkgroups",l)},dispatchWorkgroupsIndirect(...l){n("dispatchWorkgroupsIndirect",l)},end(){a(!0)}}}var $e=o=>Math.ceil(o/64);function un(o){(o.radiiDirty||o.noCollideDirty)&&o.uploadStatics();let e=o.params;o.fixedColors&&(o.device.queue.writeBuffer(o.colorBuffer,0,o.fixedColors),o.colorCap=Math.max(1,...o.fixedColors.map(x=>x===255?0:x+1))),o.stepCount++,o.writeParams(),o.writePassConstants(e.iterations,e.alpha);let t=o.parity,i=o.bodyCapacity,r=o.bodyCount,s=o.jointCount,a=o.groups,n=o.device.createCommandEncoder({label:"AVBD app step"});o.encodeStepPrelude?.(n),o.bvh||n.clearBuffer(o.gridBuffer,0,(2*o.tableSize+1)*4),n.clearBuffer(o.tableBuffer),n.clearBuffer(o.adjBuffer,0,(2*i+1)*4);let l=!!o.detailCallback,c=l||o.timingCallback!==null&&o.timing!==null,f=c||o.splitPasses,u=l?o.detailTiming:o.timing,d=[],p,m,h=(x,w)=>{if(p&&!l&&(m===w||!f))return;p?.end(),m=w;let E=l?d.length:fe.indexOf(w);d.push({name:x,aggregate:w});let k={label:x,timestampWrites:c?{querySet:u.querySet,beginningOfPassWriteIndex:E*2,endOfPassWriteIndex:E*2+1}:void 0};p=o.dispatchIsolation?cn(n,k):n.beginComputePass(k)},b=(x,w,E)=>{E<=0||(p.setPipeline(o.pipes[x]),p.setBindGroup(0,w),p.dispatchWorkgroups(E))},y=(x,w,E)=>{p.setPipeline(o.pipes[x]),p.setBindGroup(0,w),p.dispatchWorkgroupsIndirect(o.argsBuffer,E*4)};if(h("contactCache","collision"),b("beginFrame",a.broad,1),e.reuseContacts&&b("updateRefs",a.refs,$e(r)),b("argsPrev",a.args,1),y("hashInsert",a.contacts[t],6),h("broadphaseBuild","collision"),o.bvh?(o.bvh.configure(r),o.bvh.encodeBuild(p)):(b("gridCount",a.broad,$e(r)),o.gridScan.encode(p),b("gridScatter",a.broad,$e(r))),h("broadphasePairs","collision"),o.bvh?o.bvh.encodePairs(p,o):b("findPairs",a.broad,$e(r)),h("narrowphase","collision"),b("argsPairs",a.args,1),y("narrowphase",a.contacts[t],0),b("argsContacts",a.args,1),h("adjacency","adjacency"),b("degreeJoints",a.topo[t],$e(s)),y("degreeContacts",a.topo[t],3),o.adjScan.encode(p),b("fillJoints",a.topo[t],$e(s)),y("fillContacts",a.topo[t],3),b("sortAdjacency",a.topo[t],$e(r)),h("coloring","coloring"),!o.fixedColors){b("colorCompact",a.topo[t],$e(r)),b("colorMark",a.topo[t],$e(r));for(let x=0;x<o.colorRounds;x++)b(x%2===0?"colorRoundAB":"colorRoundBA",a.topo[t],$e(r))}b("colorCount",a.topo[t],o.colorGroups),o.colorHistScan.encode(p),b("colorStarts",a.topo[t],1),b("argsColors",a.args,1),b("colorScatter",a.topo[t],o.colorGroups);let v=x=>p.setBindGroup(1,o.passGroup,[x*256]),B=()=>{p.setBindGroup(0,a.solve[t]),v(0)};h("warmStart","solve"),B(),s>0&&(p.setPipeline(o.pipes.warmStartJoints),p.dispatchWorkgroups($e(s))),p.setPipeline(o.pipes.warmStartBodies),r&&p.dispatchWorkgroups($e(r));for(let x=0;x<e.iterations;x++){h("bodySolve","solve"),B(),p.setPipeline(o.pipes.primal);for(let w=0;w<o.colorCap;w++)v(x*(o.colorCap+1)+w),p.dispatchWorkgroupsIndirect(o.argsBuffer,(12+3*w)*4);h("contactUpdate","solve"),B(),v(x*(o.colorCap+1)+o.colorCap),p.setPipeline(o.pipes.dual),p.dispatchWorkgroupsIndirect(o.argsBuffer,36)}h("velocities","solve"),B(),p.setPipeline(o.pipes.updateVelocities),r&&p.dispatchWorkgroups($e(r)),p.end();let g=2*(l?d.length:fe.length);if(c&&(n.resolveQuerySet(u.querySet,0,g,u.resolve,0),n.copyBufferToBuffer(u.resolve,0,u.read,0,g*8)),o.parity=1-t,o.encodeStepPostlude?.(n),o.device.queue.submit([n.finish()]),!c)return;let A=l?o.detailCallback:o.timingCallback;l?o.detailCallback=null:o.timingCallback=null,o.timingBusy=!0,u.read.mapAsync(GPUMapMode.READ).then(()=>{let x=new BigUint64Array(u.read.getMappedRange()).slice();if(u.read.unmap(),o.timingBusy=!1,o.destroyed){o.releaseAppTiming(),o.releaseTiming();return}let w=(k,z)=>Number(x[z]-x[k])/1e6,E={total:w(0,g-1),broadphase:o.broadphase,bvhRebuilt:o.bvh?.lastRebuilt??!1};if(l){E.details={};for(let[k,z]of d.entries()){let M=w(k*2,k*2+1);E[z.aggregate]=(E[z.aggregate]??0)+M,E.details[z.name]=(E.details[z.name]??0)+M}}else fe.forEach((k,z)=>E[k]=w(z*2,z*2+1));A(E)},x=>{o.timingBusy=!1,o.profileErrors.push(x.message),o.destroyed&&(o.releaseAppTiming(),o.releaseTiming())})}var fn=`  let list = params.adjListOffset;
  for (var i = lo + 1u; i < hi; i++) {`,dn=li(ae,Ni);if(dn.split(fn).length!==2)throw Error("Pinned adjacency sort changed; review the cached-key variant");var hn=dn.replace(fn,`
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
  for (var i = lo + 1u; i < hi; i++) {`);function pn(o){return o.replace("return m.ids.w & 15u;","return select(m.ids.w & 15u, 0u, (m.ids.w & 0x80000000u) != 0u);").replace("bodies[i].initialPos = pos;","bodies[i].initialPos = vec4f(pos.xyz, bodies[i].initialPos.w);")}function Do(o){return o.replace("let generated = prev.ids.w >> 4u;","let generated = (prev.ids.w >> 4u) & 0x07ffffffu;").replace("reuseContacts(a, b))","bodies[a].initialPos.w == 0.0 && bodies[b].initialPos.w == 0.0 && reuseContacts(a, b))").replace("count | (params.step << 4u)","count | ((params.step & 0x07ffffffu) << 4u) | select(0u, 0x80000000u, bodies[a].initialPos.w != 0.0 || bodies[b].initialPos.w != 0.0)")}function mn(o=li(ae,Ni)){return o.replaceAll("if (gid.x >= topoCount()) { return; }",`if (gid.x >= topoCount()) { return; }
  if ((contacts[gid.x].ids.w & 0x80000000u) != 0u) { return; }`)}function bn(o){let e=o.device,t=e.createShaderModule({code:`
    @group(0) @binding(0) var<storage,read_write> records:array<vec4f>;
    @compute @workgroup_size(64) fn clear(@builtin(global_invocation_id) id:vec3u){
      if(id.x*10u+2u>=arrayLength(&records)){return;}
      records[id.x*10u+2u].w=0.;
    }`}),i=e.createComputePipeline({layout:"auto",compute:{module:t,entryPoint:"clear"}}),r=e.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:o.bodyBuffer}}]}),s=e.createCommandEncoder(),a=s.beginComputePass();a.setPipeline(i),a.setBindGroup(0,r),a.dispatchWorkgroups(Math.ceil(o.bodyCount/64)),a.end(),e.queue.submit([s.finish()])}var rc=`
fn contactGeneration(value: f32) -> u32 {
  return select(0u, bitcast<u32>(value) ^ 0x3f800000u, value != 0.0);
}
fn contactMovedAfter(value: f32, generated: u32) -> bool {
  let age = (contactGeneration(value) - generated) & 0x07ffffffu;
  return age != 0u && age < 0x04000000u;
}
`;function gn(o){let e="bodies[i].inertialPos.w = bitcast<f32>(params.step);";if(!o.includes(e))throw Error("Contact reference layout changed");return o.replace(e,"bodies[i].inertialPos.w = bitcast<f32>((params.step & 0x07ffffffu) ^ 0x3f800000u);")}function Go(o){let e=`  let moved = max(bitcast<u32>(bodies[a].inertialPos.w), bitcast<u32>(bodies[b].inertialPos.w));
  if (count == 0u || generated < moved) { return false; }`;if(!o.includes(e))throw Error("Contact cache layout changed");return rc+o.replace(e,`  let generation = generated & 0x07ffffffu;
  if (count == 0u || contactMovedAfter(bodies[a].inertialPos.w, generation) || contactMovedAfter(bodies[b].inertialPos.w, generation)) { return false; }`)}var sc=`${ae}
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
`,Vi=class{constructor(e,{code:t=sc,dimension:i=3}={}){this.solver=e,this.dimension=i,this.device=e.device,this.active=new Set;let r=this.device,s=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST;this.materials=r.createBuffer({size:e.bodyCapacity*4,usage:s}),this.velocities=r.createBuffer({size:e.bodyCapacity*64,usage:s}),this.params=r.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.layout=r.createBindGroupLayout({entries:["uniform","storage","storage","read-only-storage","read-only-storage","read-only-storage","read-only-storage","read-only-storage","storage"].map((l,c)=>({binding:c,visibility:GPUShaderStage.COMPUTE,buffer:{type:l}}))});let a=r.createShaderModule({code:t}),n=r.createPipelineLayout({bindGroupLayouts:[this.layout]});this.pipes=Object.fromEntries(["captureIncoming","captureSolved","initialize","pairs","apply","writeBack"].map(l=>[l,r.createComputePipeline({layout:n,compute:{module:a,entryPoint:l}})]))}set(e,t){if(!Number.isFinite(t)||t<0||t>1)throw Error("restitution must be between 0 and 1");t>0?this.active.add(e):this.active.delete(e),Q(this.solver).float(this.materials,e,t)}bind(){let e=this.solver,t=this.device,i=this.dimension===3?e.contactStorage:{manifolds:e.contactBuffers[1-e.parity],contacts:e.contactBuffers[1-e.parity],counters:e.counterBuffer},r=this.dimension===3?e.manifoldCapacity:e.contactCapacity;this.capacity!==r&&(this.bounce?.destroy(),this.capacity=r,this.bounce=t.createBuffer({size:Math.max(1,this.capacity)*48,usage:GPUBufferUsage.STORAGE}));let s=[this.params,e.bodyBuffer,this.velocities,this.materials,i.manifolds,i.contacts,e.adjBuffer,i.counters,this.bounce];(!this.buffers||s.some((n,l)=>n!==this.buffers[l]))&&(this.buffers=s,this.group=t.createBindGroup({layout:this.layout,entries:s.map((n,l)=>({binding:l,resource:{buffer:n}}))}));let a=new Uint32Array([e.bodyCount,e.jointCount,r,2*e.bodyCapacity+1,0,0,0,0]);new Float32Array(a.buffer).set([1,e.params.dt],4),t.queue.writeBuffer(this.params,0,a)}run(e,t){this.bind();let i=t??this.device.createCommandEncoder(),r=i.beginComputePass();r.setBindGroup(0,this.group);for(let s of e)r.setPipeline(this.pipes[s]),r.dispatchWorkgroups(Math.max(1,Math.ceil((s==="initialize"||s==="pairs"?this.capacity:this.solver.bodyCount)/64)));r.end(),t||this.device.queue.submit([i.finish()])}before(e){this.active.size&&this.run(["captureIncoming"],e)}after(e){this.active.size&&this.run(["captureSolved","initialize",...Array.from({length:12},()=>["pairs","apply"]).flat(),"writeBack"],e)}destroy(){for(let e of["materials","velocities","params","bounce"])this[e]?.destroy()}};var yn=new WeakMap,Uo=o=>yn.get(o);function Wi(o,e){yn.set(o,e)}var Fo=(o,e,t)=>{if(o.split(e).length!==2)throw Error("Pinned angular solver layout changed");return o.replace(e,t)};function No(o){return o=Fo(o,"fn addJoint(acc: ptr<function, Acc>, j: u32, alpha: f32, i: u32) {",`
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
  if(info[j].x==3 || info[j].x==4){if(joints[j].penLin.w!=0.){addAngular(acc,j,alpha,i);}return;}`),o=Fo(o,"  if (j >= params.jointCount || info[j].x != T_JOINT) { return; }",`  if(j>=params.jointCount){return;}
  if(info[j].x==3 || info[j].x==4){warmAngular(j);return;}
  if(info[j].x!=T_JOINT){return;}`),Fo(o,"fn dualJoint(j: u32) {",`fn dualJoint(j: u32) {
  if(info[j].x==3 || info[j].x==4){dualAngular(j);return;}`)}function gt({type:o,axisA:e=[0,1,0],axisB:t=[0,1,0],speed:i=1,maxTorque:r=100,minAngle:s=-Math.PI,maxAngle:a=Math.PI}={}){let n=l=>{let c=l&&typeof l.x=="number"?[l.x,l.y,l.z]:Array.from(l),f=Math.hypot(...c);if(c.length!==3||!c.every(Number.isFinite)||f<1e-8)throw Error("Angular axis requires three finite, nonzero components");return c.map(u=>u/f)};if(o!=="motor"&&o!=="limit")throw Error("Invalid angular constraint type");if(!Number.isFinite(i)||!Number.isFinite(r)||r<0)throw Error("Motor speed must be finite and maxTorque nonnegative");if(!Number.isFinite(s)||!Number.isFinite(a)||s<-Math.PI||a>Math.PI||s>a)throw Error("Hinge angles must be ordered within -PI..PI radians");return{type:o,axisA:n(e),axisB:n(t),speed:i,maxTorque:r,minAngle:s,maxAngle:a}}var vn=`struct Body { pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f }
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
`;var xn=new WeakSet,os=o=>xn.has(o);function Hi(o,e,t,i=1,r=.6,s=[0,0,0]){if(!Number.isFinite(e)||e<=0||!Number.isFinite(t)||t<2*e)throw Error("Capsule height must be at least twice its positive radius");if(!Number.isFinite(i)||i<0)throw Error("Capsule density must be nonnegative");let a=new De(o,[2*e,t,2*e],i,r,s),n=t-2*e,l=Math.PI*e*e*n*i,c=4/3*Math.PI*e**3*i;a.mass=l+c;let f=l*e**2/2+c*2*e**2/5,u=l*(n**2/12+e**2/4)+c*(2*e**2/5+n**2/4+3*n*e/8);return a.moment.set([u,f,u]),a.radius=t/2,xn.add(a),a}var An=`// Exact rounded capsule geometry. Shape -1: radius=size.x/2, segment along Y,
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
    if(dist<best-1.e-12 || (abs(dist-best)<=1.e-12&&abs(t-.5)<abs(bestT-.5))){best=dist;bestT=t;result=SegmentPair(point,box);}
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
`;function wn(o){if(o.includes("fn capsuleOf"))throw Error("Capsule collision kernel installed twice");let e=`@compute @workgroup_size(64)
fn narrowphase`;if(!o.includes(e))throw Error("Pinned capsule narrowphase layout changed");let t=o.includes("struct Poly");t&&(o=o.replace(e,nc+`
`+e)),o=o.replace(e,An+`
`+e);let i=t?" else if(isHull(b)){found=capsulePoly(capsuleOf(a),polyOf(b),&sat);}":"",r=t?" else if(isHull(a)){found=capsulePoly(capsuleOf(b),polyOf(a),&sat);}":"";return o.replace("let anySphere = sphereA || sphereB;","let anySphere = sphereA || sphereB || capsuleA || capsuleB;").replace("  if (sphereA && sphereB) {",`  let capsuleA=bodies[a].angVel.w == -1.;let capsuleB=bodies[b].angVel.w == -1.;
  if(capsuleA || capsuleB){
    if(capsuleA && capsuleB){found=capsuleCapsule(capsuleOf(a),capsuleOf(b),&sat);}
    else if(capsuleA){if(sphereB){found=capsuleSphere(capsuleOf(a),B.c,B.h.x,&sat);}${i} else{found=capsuleBox(capsuleOf(a),B,bodies[b].rot,&sat);}}
    else{if(sphereA){found=capsuleSphere(capsuleOf(b),A.c,A.h.x,&sat);}${r} else{found=capsuleBox(capsuleOf(b),A,bodies[a].rot,&sat);}
      sat.n=-sat.n;for(var c=0u;c<found.count;c++){let p=found.xA[c];found.xA[c]=found.xB[c];found.xB[c]=p;}}
  } else if (sphereA && sphereB) {`)}var nc=`
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
`;var qo=`// GPU queries against current poses. Rounded box/hull sweeps test offset faces
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
`;var Nt=class{constructor(e,t=3){this.solver=e,this.dimension=t,this.jobs=new Set,this.idle=[],this.destroyed=!1;let i=e.device,r=i.createShaderModule({label:`AVBD ${t}D queries`,code:t===2?qo.replace("const DIM=3u;","const DIM=2u;").replace("const STRIDE=10u;","const STRIDE=6u;"):qo});this.layout=i.createBindGroupLayout({entries:["read-only-storage","read-only-storage","read-only-storage","storage","storage","uniform","read-only-storage"].map((a,n)=>({binding:n,visibility:GPUShaderStage.COMPUTE,buffer:{type:a}}))});let s=i.createPipelineLayout({bindGroupLayouts:[this.layout]});this.pipes=Object.fromEntries(["nearest","owner","finish"].map(a=>[a,i.createComputePipeline({layout:s,compute:{module:r,entryPoint:a}})])),this.dummy=i.createBuffer({size:16,usage:GPUBufferUsage.STORAGE})}acquire(e){if(this.destroyed)throw Error("GPU queries have been destroyed");let t=this.idle.findIndex(r=>r.capacity>=e),i=t>=0?this.idle.splice(t,1)[0]:this.idle.pop()??{};if(!i.capacity||i.capacity<e){let r=Math.min(65535,Math.max(e,(i.capacity??0)*2,16));for(let[s,a,n]of[["queryBuffer",r*32,GPUBufferUsage.STORAGE],["best",r*8,GPUBufferUsage.STORAGE],["hits",r*32,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC],["uniform",96,GPUBufferUsage.UNIFORM],["read",r*32,GPUBufferUsage.MAP_READ]])i[s]?.destroy(),i[s]=this.solver.device.createBuffer({size:a,usage:n|GPUBufferUsage.COPY_DST});i.capacity=r,i.buffers=null,i.data=new Float32Array(r*8),i.initial=new Uint32Array(r*2),i.params=new Uint32Array(24)}return this.jobs.add(i),i}release(e){if(e.read.unmap(),!this.destroyed&&e.capacity*104<=2*1024*1024&&this.idle.length<2)this.idle.push(e);else{for(let t of["queryBuffer","best","hits","uniform","read"])e[t].destroy();this.jobs.delete(e)}}async cast(e,{ignore:t=[],collidesWith:i=4294967295,includeTriggers:r=!0}={}){if(this.destroyed)throw Error("GPU queries have been destroyed");let s=this.solver,a=s.device,n=this.dimension;if(!Number.isInteger(i)||i<0||i>4294967295)throw Error("Query mask must be an unsigned 32-bit integer");if(typeof r!="boolean")throw Error("includeTriggers must be boolean");if(t.length>16||t.some(u=>!Number.isInteger(u)||u<0||u>=s.bodyCount))throw Error("Queries can ignore up to 16 live body indices");if(e.length>Math.min(65535,a.limits.maxComputeWorkgroupsPerDimension))throw Error("Too many queries in one batch");let l=e.map(u=>{let d=Array.from(u.origin),p=Array.from(u.direction),m=u.radius??0,h=u.maxDistance??3e38;if(d.length!==n||p.length!==n||![...d,...p].every(Number.isFinite)||Math.hypot(...p)===0)throw Error(`A query requires ${n} finite components and a nonzero direction`);if(!Number.isFinite(m)||m<0||!Number.isFinite(h)||h<0)throw Error("Query radius and maximum distance must be finite and nonnegative");let b=Math.hypot(...p);return{origin:d,direction:p.map(y=>y/b),radius:m,maxDistance:h}});if(!l.length)return[];let c=l.length,f=this.acquire(c);try{let u=f.data;l.forEach((k,z)=>{u.set([...k.origin,...Array(3-n).fill(0),k.maxDistance,...k.direction,...Array(3-n).fill(0),k.radius],z*8)});let d=f.params;d.fill(0),d.set([s.bodyCount,c,t.length,i,r?0:1,n===3||s.filters?1:0,s.sensorsEnabled?1:0,n===2&&s.shapeBuffer?1:0]),d.set(t,8);let p=f.initial;for(let k=0;k<c;k++)p.set([2139095040,4294967295],k*2);let{queryBuffer:m,best:h,hits:b,uniform:y,read:v}=f;a.queue.writeBuffer(m,0,u.buffer,0,c*32),a.queue.writeBuffer(h,0,p.buffer,0,c*8),a.queue.writeBuffer(y,0,d);let B=[s.bodyBuffer,n===3?s.hullStorage:s.shapeBuffer??this.dummy,m,h,b,y,n===3?s.filterStorage:s.filters??this.dummy];(!f.buffers||B.some((k,z)=>k!==f.buffers[z]))&&(f.group=a.createBindGroup({layout:this.layout,entries:B.map((k,z)=>({binding:z,resource:{buffer:k}}))}),f.buffers=B);let g=a.createCommandEncoder(),A=g.beginComputePass();A.setBindGroup(0,f.group);for(let k of["nearest","owner"])A.setPipeline(this.pipes[k]),A.dispatchWorkgroups(Math.ceil(s.bodyCount/64),c);A.setPipeline(this.pipes.finish),A.dispatchWorkgroups(Math.ceil(c/64)),A.end(),g.copyBufferToBuffer(b,0,v,0,c*32),a.queue.submit([g.finish()]),await v.mapAsync(GPUMapMode.READ,0,c*32);let x=v.getMappedRange(0,c*32),w=new Float32Array(x),E=new Uint32Array(x);return l.map((k,z)=>{let M=w[z*8+3];if(M<0)return null;let P=Array.from(w.slice(z*8,z*8+n)),_=k.origin.map((C,S)=>C+M*k.direction[S]);return{index:E[z*8+4],distance:M,normal:P,center:_,point:_.map((C,S)=>C-k.radius*P[S])}})}finally{this.release(f)}}destroy(){this.destroyed=!0;for(let e of this.jobs)for(let t of["queryBuffer","best","hits","uniform","read"])e[t].destroy();this.jobs.clear(),this.idle.length=0,this.dummy.destroy()}};function as(o,e){let t=this.passConstantCache??={alphas:[]},i=t.iterations!==o||t.colors!==this.colorCap||t.buffer!==this.passBuffer||!this.passGroup;for(let n=0;n<o;n++){let l=typeof e=="function"?e(n):e;t.alphas[n]!==l&&(i=!0),t.alphas[n]=l}if(!i)return;let r=this.colorCap+1,s=Math.max(o*r,1),a=s*256;(s>this.passEntries||!this.passGroup)&&(this.passBuffer?.destroy(),this.passBuffer=this.device.createBuffer({label:"AVBD pass constants",size:a,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.passEntries=s,this.passGroup=this.device.createBindGroup({layout:this.layouts.pass,entries:[{binding:0,resource:{buffer:this.passBuffer,size:16}}]})),(!t.data||t.data.byteLength<a)&&(t.data=new ArrayBuffer(Math.max(a,(t.data?.byteLength??0)*2)),t.u32=new Uint32Array(t.data),t.f32=new Float32Array(t.data));for(let n=0;n<o;n++)for(let l=0;l<=this.colorCap;l++){let c=(n*r+l)*256/4;t.u32[c]=l,t.f32[c+1]=t.alphas[n]}this.device.queue.writeBuffer(this.passBuffer,0,t.data,0,a),t.iterations=o,t.colors=this.colorCap,t.buffer=this.passBuffer,t.uploads=(t.uploads??0)+1}var Vo=new WeakMap;function ns(o){return Vo.get(o)}function Bn(o,e){e?Vo.set(o,Object.freeze({...e})):Vo.delete(o)}function Wo(o){let e=o.indexOf("/** A partial system per body slot handed between lanes (primal). */"),t=o.indexOf("fn accumulate(",e),i=o.lastIndexOf("/**",t);if(e<0||t<0||i<=e)throw Error("3D primal layout changed; review the compatibility kernel");return o.slice(0,e)+`
@compute @workgroup_size(64)
fn primal(@builtin(global_invocation_id) gid: vec3u) {
  let start = color[params.colorStartOffset + pc.color];
  let count = color[params.colorStartOffset + pc.color + 1u] - start;
  if (gid.x >= count || !solverStepValid()) { return; }
  let i = color[params.colorBodiesOffset + start + gid.x];
  finishBody(i, accumulate(i, 0u, 1u));
}

`+o.slice(i)}function qt(o,e,t){if(o.split(e).length!==2)throw Error("3D contact layout changed; review the compatibility kernel");return o.replace(e,t)}function ls(o,e,t){let i=new RegExp(`struct ${e} \\{[^}]*\\}`,"g");if([...o.matchAll(i)].length!==1)throw Error(`Expected one 3D ${e} layout`);return o.replace(i,t)}function Cn(o,e,t){let i=`fn ${e}(`;if(o.split(i).length!==2)throw Error(`Expected one 3D ${e} function`);let r=o.indexOf(i),a=o.indexOf("{",r)+1,n=1;for(;a<o.length&&n;a++)o[a]==="{"&&n++,o[a]==="}"&&n--;if(n)throw Error(`Incomplete 3D ${e} function`);return o.slice(0,r)+t(o.slice(r,a))+o.slice(a)}function Ho(o){o=ls(o,"PairBody",`struct PairBody {
  ids: vec4u,
  rot: vec4f,
  dLin: vec4f,
  dAng: vec4f,
}`),o=qt(o,"return PairBody(i, rot, bodies[i].pos.xyz - bodies[i].initialPos.xyz, qsub(rot, bodies[i].initialRot));","return PairBody(vec4u(i, 0u, 0u, 0u), rot, vec4f(bodies[i].pos.xyz - bodies[i].initialPos.xyz, 0.0), vec4f(qsub(rot, bodies[i].initialRot), 0.0));"),o=o.replace(/\b(A|B)\.index\b/g,"$1.ids.x").replace(/\b(A|B)\.(dLin|dAng)\b/g,"$1.$2.xyz"),o=ls(o,"Contact",`struct Contact {
  anchorA: vec4u, // xyz: float bits, w: integer feature key
  anchorB: vec4f, // xyz: anchor, w: normal error
  penalty: vec4f, // xyz: penalties, w: first tangent error
  force: vec4f,   // xyz: forces, w: second tangent error
}`);let e={rA:"bitcast<vec3f>(k.anchorA.xyz)",rB:"k.anchorB.xyz",key:"k.anchorA.w",c0x:"k.anchorB.w",c0y:"k.penalty.w",c0z:"k.force.w",pen:"k.penalty.xyz",lam:"k.force.xyz"};for(let t of["evalContact","accumulate","dualManifold"])o=Cn(o,t,i=>i.replace(/\bk\.(rA|rB|key|c0x|c0y|c0z|pen|lam)\b/g,(r,s)=>e[s]));return o=qt(o,"contacts[c].lam = e.F;","contacts[c].force = vec4f(e.F, k.force.w);"),o=qt(o,"contacts[c].key =","contacts[c].anchorA.w ="),o=qt(o,"contacts[c].pen = pen;","contacts[c].penalty = vec4f(pen, k.penalty.w);"),o=Cn(o,"evalContact",t=>{t=qt(t,`  var e: ContactEval;
`,""),t=qt(t,"  e.rAW =","  let rAW ="),t=qt(t,"  e.rBW =","  let rBW ="),t=t.replaceAll("e.rAW","rAW").replaceAll("e.rBW","rBW"),t=qt(t,"  e.C =","  let C =");let i=t.indexOf("  var F ="),r=t.indexOf("  return e;",i);if(i<0||r<0)throw Error("Expected 3D contact force projection");return t.slice(0,i)+`  let raw = k.penalty.xyz * C + k.force.xyz;
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
}`}),o=ls(o,"ContactEval",`struct ContactEval {
  rAW: vec4f,
  rBW: vec4f,
  C: vec4f,
  F: vec4f,
  limits: vec4f, // x: tangent force length, y: Coulomb bound
}`),o=o.replace(/\b(ev|e)\.(rAW|rBW|C|F)\b/g,"$1.$2.xyz").replace(/\be\.frictionScale\b/g,"e.limits.x").replace(/\be\.bounds\b/g,"e.limits.y"),o=ls(o,"PassConstants","struct PassConstants { data: vec4u, }"),o.replaceAll("pc.color","pc.data.x").replaceAll("pc.alpha","bitcast<f32>(pc.data.y)")}function Jo(o){if(!o.includes("struct Poly"))return o;let e=`@compute @workgroup_size(64)
fn narrowphase(@builtin(global_invocation_id) gid: vec3u)`;if(o.split(e).length!==2)throw Error("3D hull narrowphase changed; review the compatibility kernel");return o.replace(e,"fn narrowphasePair(gid: vec3u)")+`
@compute @workgroup_size(32)
fn narrowphase(@builtin(global_invocation_id) gid: vec3u) {
  for (var offset = 0u; offset < 2u; offset++) {
    narrowphasePair(vec3u(gid.x * 2u + offset, 0u, 0u));
  }
}
`}var Vt=class extends Zr{writePassConstants(e,t){as.call(this,e,t)}constructor(e,t,i={}){let r=ns(e),s=i.scalarPrimal??r?.scalarPrimal??!1,a=i.portableContactMath??r?.portableContactMath??!1,n=t.forces.some(b=>Uo(b)),l=t.forces.some(b=>{let y=Oo(b);return y&&(Number.isFinite(y.breakStrain)||Number.isFinite(y.breakForce))}),c={requested:i.solverMode??"auto",contactScheduling:i.contactScheduling??"manifolds",custom:!!i.shaders?.solve},f=qi({...c,bodyCount:t.bodies.length,constraintCount:t.forces.filter(b=>b instanceof we||b instanceof ct).length}),u=f.selected==="custom"?i.shaders.solve:f.selected==="optimized"?pr:f.selected==="points"?es:void 0,d=r?.broadphase??i.broadphase??"auto";if(!["grid","hploc","auto"].includes(d))throw Error("broadphase must be 'grid', 'hploc' or 'auto'");let p=i.bvh?.rebuildInterval??64;if(!Number.isInteger(p)||p<1)throw Error("BVH rebuildInterval must be a positive integer");for(let[b,y]of[["minimumColors",64],["minimumColorRounds",32]]){let v=i[b]??0;if(!Number.isInteger(v)||v<0||v>y)throw Error(`${b} must be an integer between 0 and ${y}`);if(b==="minimumColorRounds"&&v%2)throw Error("minimumColorRounds must be even")}let m=zo(Mo(n?No(l?is(u??be):u??be):l?is(u??be):u??be));s&&(m=Wo(m)),a&&(m=Ho(m));let h=a&&!i.shaders?.contacts&&i.hulls!==!1&&e.limits.maxStorageBuffersPerShaderStage>=9&&t.bodies.some(b=>Dr(b));if(super(e,t,{...i,shaders:{...i.shaders,contacts:h?Jo(ui(!0)):i.shaders?.contacts,solve:m}}),this.solverPolicy=c,this.scalarPrimal=s,this.portableContactMath=a,s&&(this.primalLanes=[1,1,1]),this.dispatchIsolation=r?.dispatchIsolation??!1,!i.shaders?.contacts){h&&(this.contactShaders.custom=!1,this.hullShaders=!0);let b=this.contactShaders.make;this.contactShaders.make=y=>b(a?Jo(Go(y)):Go(y)),this.contactShaders.make(ui(this.hullShaders??!1)),this.pipes.updateRefs=e.createComputePipeline({label:"Portable contact references",layout:e.createPipelineLayout({bindGroupLayouts:[this.layouts.refs]}),compute:{module:e.createShaderModule({code:gn(Yr)}),entryPoint:"updateRefs"}})}this.springFracture=l,this.angularConstraints=n,this.customSolveSource=i.shaders?.solve,t.forces.forEach((b,y)=>{let v=Oo(b);v&&this.setSpringMaterial(y,v)}),this.adaptiveScheduling=s?!1:i.adaptiveScheduling??!0,this.defaultPrimalLanes=[...this.primalLanes],this.cacheAdjacencyKeys=i.cacheAdjacencyKeys,this.adjacencyPipelines={original:this.pipes.sortAdjacency},this.selectAdjacencyPipeline(),this.solverDecision=f,this.solvePipelineCache=new Map([[f.selected,Object.fromEntries(["warmStartJoints","warmStartBodies","primal","dual","updateVelocities"].map(b=>[b,this.pipes[b]]))]]),this.minimumColors=i.minimumColors??0,this.minimumColorRounds=i.minimumColorRounds??4,this.colorCap=Math.max(this.minimumColors,this.colorCap),this.colorRounds=Math.max(this.minimumColorRounds,this.colorRounds),this.broadphaseRequested=d,this.broadphase=d==="hploc"?"hploc":"grid",this.bvhOptions=i.bvh??{},this.bvh=null,this.detailCallback=null,this.detailTiming=null,this.profileErrors=[],this.selectBroadphase(),t.forces.forEach((b,y)=>{let v=Uo(b);v&&this.setAngularConstraint(y,v)}),t.bodies.forEach((b,y)=>{os(b)&&this.installCapsule(this.gpuIndex(y))})}installCapsule(e){if(!this.capsulesEnabled){if(this.contactShaders.custom)throw Error("Analytic capsules require the built-in contact kernel");this.capsulesEnabled=!0;let t=this.contactShaders.make;this.contactShaders.make=i=>t(wn(i)),this.contactShaders.make(ui(this.hullShaders??!1))}this.device.queue.writeBuffer(this.bodyBuffer,e*160+156,new Float32Array([-1]))}async raycast(e,t,i={}){let[r]=await this.raycastAll([{origin:e,direction:t,maxDistance:i.maxDistance}],i);return r}raycastAll(e,t={}){return this.flushPropertyEdits(),this.shapeQueries??=new Nt(this),this.shapeQueries.cast(e.map(i=>({...i,radius:0})),t)}async sphereCast(e,t,i,r={}){let[s]=await this.sphereCastAll([{origin:e,radius:t,direction:i,maxDistance:r.maxDistance}],r);return s}sphereCastAll(e,t={}){return this.flushPropertyEdits(),this.shapeQueries??=new Nt(this),this.shapeQueries.cast(e,t)}selectBroadphase(){if(this.broadphaseRequested!=="auto"){this.broadphaseDecision={requested:this.broadphaseRequested,selected:this.broadphase,reason:"Explicit selection"};return}let e=new Float64Array(this.bodyCount),t=0,i=0,r=0;for(let d=0;d<this.bodyCount;d++){let p=this.bodies[d];if(p.radius>0&&(e[t++]=p.radius),p.dynamic){i++;let[m,h,b]=p.size,y=Math.min(m,h,b),v=Math.max(m,h,b),B=m+h+b-y-v;!p.sphere&&!p.hull&&y<=.4*B&&B>=.5*v&&r++}}let s=t?Qr(e.subarray(0,t),t>>1):1,a=this.cellSize/(2*s),n=this.jointCount-this.freeSlots.length,l=i?r/i:0,c=this.bodyCapacity<=16*this.device.limits.maxComputeWorkgroupsPerDimension&&(2*this.bodyCapacity+16*Math.ceil(Math.log2(Math.max(2,this.bodyCapacity)))+32)*32<=this.device.limits.maxStorageBufferBindingSize,f=n>=this.bodyCount&&l>=.25,u=c&&this.bodyCount>=1e4&&(a>=4||f);this.broadphase=u?"hploc":"grid",this.broadphaseDecision={requested:"auto",selected:this.broadphase,bodyCount:this.bodyCount,cellRatio:a,constraintCount:n,thinPlateFraction:l,reason:c?u?f?"Many linked thin plates; the tree avoids empty grid-cell space":"Large grid cells contain many smaller objects":"Grid retained for this body count and size distribution":"The GPU tree exceeds this adapter's limits; the grid is used"}}step(){this.selectAdjacencyPipeline(),this.selectSolver(),this.radiiDirty&&(this.uploadStatics(),this.selectBroadphase()),this.broadphaseRequested==="auto"&&this.broadphaseDecision.constraintCount!==this.jointCount-this.freeSlots.length&&this.selectBroadphase(),this.broadphase==="grid"&&this.bvh&&(this.bvh.destroy(),this.bvh=null),this.broadphase==="hploc"&&(!this.bvh||this.bvh.bodyBuffer!==this.bodyBuffer)&&(this.bvh?.destroy(),this.bvh=new ss(this.device,this,this.bvhOptions)),this.dispatchIsolation||this.bvh||this.detailCallback||this.sleeping||this.restitution?.active.size||this.bodyCommands?.pending.size||this.propertyEdits?.pending||this.externalBeforeStep?un(this):super.step()}encodeStepPrelude(e){this.flushPropertyEdits(e),this.sleeping?.before(e),this.bodyCommands?.flush(e),this.externalBeforeStep?.(e),this.restitution?.before(e)}encodeStepPostlude(e){this.restitution?.after(e),this.sleeping?.after(e),this.externalAfterStep?.(e)}setRestitution(e,t){if(this.destroyed)throw Error("The 3D solver has been destroyed");if(!Number.isInteger(e)||e<0||e>=this.bodyCount||!Number.isFinite(t)||t<0||t>1)throw Error("Restitution requires a live body index and a value between 0 and 1");t>0&&!this.restitution&&(this.restitution=new Vi(this)),this.restitution?.set(e,t),this.wakeAll()}setSolverMode(e){return qi({...this.solverPolicy,requested:e,bodyCount:this.bodyCount}),this.solverPolicy.requested=e,this.selectSolver(),this.solverDecision}solveSource(e){return this.springFracture&&(e=is(e)),this.angularConstraints&&(e=No(e)),this.sensorsEnabled&&(e=pn(e)),e=zo(Mo(e)),this.scalarPrimal&&(e=Wo(e)),this.portableContactMath&&(e=Ho(e)),e}setAngularConstraint(e,t){if(!Number.isInteger(e)||e<0||e>=this.jointCount)throw Error("Angular constraint needs a live slot");let i=gt(t);this.flushPropertyEdits(),this.angularConstraints||(this.angularConstraints=!0,this.rebuildSolvePipelines());let r=new Float32Array(32);r[0]=r[1]=1e3,r[3]=3e38,r.set(i.axisA,24),r.set(i.axisB,28),r[27]=i.type==="motor"?i.speed:i.minAngle,r[31]=i.type==="motor"?i.maxTorque:i.maxAngle,this.device.queue.writeBuffer(this.jointBuffer,e*128,r),this.info[e*4]=i.type==="motor"?3:4,this.device.queue.writeBuffer(this.infoBuffer,e*16,this.info.subarray(e*4,e*4+4)),this.captureAngularFrames([e]),this.wakeAll()}captureAngularFrames(e){if(!e.length)return;this.flushPropertyEdits();let t=this.device;this.angularFramePipeline??=t.createComputePipeline({layout:"auto",compute:{module:t.createShaderModule({code:`const DISPATCH_STRIDE = ${t.limits.maxComputeWorkgroupsPerDimension*64}u;
${vn.replaceAll("id.x","(id.x+id.y*DISPATCH_STRIDE)")}`}),entryPoint:"capture"}}),this.runCapture("angular",this.angularFramePipeline,Uint32Array.from(e),e.length)}setMotor(e,{speed:t,maxTorque:i}={}){if(this.destroyed)throw Error("The 3D solver has been destroyed");if(this.info[e*4]!==3)throw Error("Motor needs an active motor slot");if(t!==void 0&&!Number.isFinite(t))throw Error("Motor speed must be finite");if(i!==void 0&&(!Number.isFinite(i)||i<0))throw Error("maxTorque must be nonnegative");t!==void 0&&Q(this).float(this.jointBuffer,e*32+27,t),i!==void 0&&Q(this).float(this.jointBuffer,e*32+31,i),this.wakeAll()}rebuildSolvePipelines(){this.solvePipelineCache.clear();let e=this.solverDecision.selected,t=e==="custom"?this.customSolveSource:e==="optimized"?pr:e==="points"?es:be,i=this.device.createShaderModule({code:this.solveSource(t)}),r=this.device.createPipelineLayout({bindGroupLayouts:[this.layouts.solve,this.layouts.pass]}),s=Object.fromEntries(["warmStartJoints","warmStartBodies","primal","dual","updateVelocities"].map(a=>[a,this.device.createComputePipeline({layout:r,compute:{module:i,entryPoint:a}})]));Object.assign(this.pipes,s),this.solvePipelineCache.set(e,s)}setSensor(e,t){if(this.destroyed)throw Error("The 3D solver has been destroyed");if(!Number.isInteger(e)||e<0||e>=this.bodyCount||typeof t!="boolean")throw Error("Sensor requires a live body index and boolean flag");if(t&&!this.sensorsEnabled){this.sensorsEnabled=!0,bn(this),this.rebuildSolvePipelines(),this.contactShaders.make(Do(ui(this.hullShaders??!1)));let i=this.contactShaders.make;this.contactShaders.make=a=>i(Do(a));let r=this.device.createShaderModule({code:mn()}),s=this.device.createPipelineLayout({bindGroupLayouts:[this.layouts.topo]});for(let a of["degreeContacts","fillContacts"])this.pipes[a]=this.device.createComputePipeline({layout:s,compute:{module:r,entryPoint:a}})}this.sensorsEnabled&&Q(this).float(this.bodyBuffer,e*40+11,t?1:0),this.wakeAll()}selectSolver(){let e=this.jointCount-this.freeSlots.length;this.adaptiveScheduling&&this.schedulingDecision?.dense&&(this.bodyCount<25e4||e>0)&&(this.primalLanes=[...this.defaultPrimalLanes],this.schedulingDecision={...this.schedulingDecision,dense:!1,reason:"Threads per body follow solve-group size"});let t=this.solverDecision;if(t.requested===this.solverPolicy.requested&&t.bodyCount===this.bodyCount&&t.constraintCount===e)return;let i=qi({...this.solverPolicy,bodyCount:this.bodyCount,constraintCount:e});if(i.selected!==t.selected){let r=this.solvePipelineCache.get(i.selected);if(!r){let s=i.selected==="optimized"?pr:i.selected==="points"?es:void 0,a=this.device.createShaderModule({code:this.solveSource(s??be)}),n=this.device.createPipelineLayout({bindGroupLayouts:[this.layouts.solve,this.layouts.pass]});r=Object.fromEntries(["warmStartJoints","warmStartBodies","primal","dual","updateVelocities"].map(l=>[l,this.device.createComputePipeline({label:`${i.selected} ${l}`,layout:n,compute:{module:a,entryPoint:l}})])),this.solvePipelineCache.set(i.selected,r)}Object.assign(this.pipes,r)}this.solverDecision=i}profileDetailedNextStep(e){if(!this.device.features.has("timestamp-query")||this.timingBusy||this.timingCallback||this.detailCallback)return!1;let t=2*(9+2*this.params.iterations);return(!this.detailTiming||this.detailTiming.count<t)&&(this.releaseAppTiming(),this.detailTiming={count:t,querySet:this.device.createQuerySet({type:"timestamp",count:t}),resolve:this.device.createBuffer({size:t*8,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC}),read:this.device.createBuffer({size:t*8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ})}),this.detailCallback=e,!0}captureConstraintFrames(e){if(e.length){this.flushPropertyEdits(),this.framePipeline||(this.framePipeline=this.device.createComputePipeline({layout:"auto",compute:{module:this.device.createShaderModule({code:`const DISPATCH_STRIDE = ${this.device.limits.maxComputeWorkgroupsPerDimension*64}u;
${on.replaceAll("id.x","(id.x+id.y*DISPATCH_STRIDE)")}`}),entryPoint:"capture"}})),(!this.frameData||this.frameData.length<e.length*4)&&(this.frameData=new Uint32Array(Math.max(e.length*4,(this.frameData?.length??0)*2,64)));for(let t=0;t<e.length;t++)this.frameData[t*4]=e[t].slot,this.frameData[t*4+1]=e[t].spring?1:0;this.runCapture("frame",this.framePipeline,this.frameData.subarray(0,e.length*4),e.length)}}runCapture(e,t,i,r){this.flushEdits?.();let s=this.device,a=(this.captureUploads??={})[e]??={};(!a.buffer||a.buffer.size<i.byteLength)&&(a.buffer?.destroy(),a.buffer=s.createBuffer({size:i.byteLength*2,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),a.buffers=null),s.queue.writeBuffer(a.buffer,0,i);let n=[this.bodyBuffer,this.jointBuffer,this.infoBuffer,a.buffer];(!a.buffers||n.some((d,p)=>d!==a.buffers[p])||a.bytes!==i.byteLength)&&(a.group=s.createBindGroup({layout:t.getBindGroupLayout(0),entries:n.map((d,p)=>({binding:p,resource:{buffer:d,...p===3?{size:i.byteLength}:{}}}))}),a.buffers=n,a.bytes=i.byteLength);let l=s.createCommandEncoder(),c=l.beginComputePass();c.setPipeline(t),c.setBindGroup(0,a.group);let f=Math.ceil(r/64),u=s.limits.maxComputeWorkgroupsPerDimension;c.dispatchWorkgroups(Math.min(f,u),Math.ceil(f/u)),c.end(),s.queue.submit([l.finish()])}setSpringMaterial(e,t={}){if(this.destroyed)throw Error("The 3D solver has been destroyed");if(!Number.isInteger(e)||e<0||e>=this.jointCount||this.info[e*4]!==Ui)throw Error("Spring material requires an active spring slot");let i=Pt(t);!this.springFracture&&(Number.isFinite(i.breakStrain)||Number.isFinite(i.breakForce))&&(this.springFracture=!0,this.rebuildSolvePipelines());for(let[r,s]of[["breakStrain",11],["breakForce",15]])Q(this).float(this.jointBuffer,e*32+s,i[r]===1/0?0:i[r]);this.wakeAll()}appendConstraints(...e){return this.flushPropertyEdits(),super.appendConstraints(...e)}appendJoint(e,t,i,r,s,a){let n=c=>c===1/0?3e38:c,[l]=this.appendConstraints(1,(c,f)=>{f[3]=n(s),f[7]=n(a),f[11]=3e38,f.set(i,24),f.set(r,28);let u=e>=0?this.bodies[e].size:[0,0,0],d=this.bodies[t].size;return f[15]=u.reduce((p,m,h)=>p+(m+d[h])**2,0),[1,e,t]});return this.wakeAll(),l}appendJoints(...e){let t=super.appendJoints(...e);return this.wakeAll(),t}appendSprings(...e){let t=super.appendSprings(...e);return this.wakeAll(),t}enableSleeping(e,t={}){this.sleeping||(this.sleeping=new hi({device:this.device,gpu:this,capacity:this.bodyCapacity,aggregates:e.bodies.map((i,r)=>({rigid:i,index:r}))},t))}wakeAll(){this.sleeping&&(this.sleeping.wakeRequested=!0)}async readSleepStats(){return this.sleeping?this.sleeping.readStats():{sleeping:0,wakeRequested:!1}}addBodies(e){this.flushPropertyEdits();let t=super.addBodies(e);if(t>=0)for(let i=0;i<Math.min(e.length,this.bodyCount-t);i++)os(e[i])&&this.installCapsule(t+i);if(t>=0&&this.sleeping)for(let i=0;i<Math.min(e.length,this.bodyCount-t);i++)this.sleeping.register(t+i,e[i].mass,e[i].allowSleep!==!1);return t}rewriteBodies(e,t){this.flushPropertyEdits(),super.rewriteBodies(e,t);for(let i=0;i<e.length;i++)os(t[i])&&this.installCapsule(e[i]);if(this.sleeping)for(let i=0;i<e.length;i++)this.sleeping.register(e[i],t[i].mass,t[i].allowSleep!==!1)}releaseJoints(e){this.flushPropertyEdits(),super.releaseJoints(e),this.wakeAll()}setWorldAnchor(e,t){if(!Number.isInteger(e)||e<0||e>=this.jointCount||this.info[e*4+1]!==-1||t?.length!==3||!Array.from(t).every(Number.isFinite))throw Error("A world joint and finite xyz anchor are required");for(let i=0;i<3;i++)Q(this).float(this.jointBuffer,e*32+24+i,t[i]);this.wakeAll()}disableConstraint(e){this.flushPropertyEdits(),super.disableConstraint(e),this.wakeAll()}setFilters(e,t,i){if(this.destroyed)throw Error("The 3D solver has been destroyed");if(e.length!==t.length||e.length!==i.length)throw Error("Each body index needs a group and collision mask");for(let s=0;s<e.length;s++){if(!Number.isInteger(e[s])||e[s]<0||e[s]>=this.bodyCount)throw Error("Collision filters require live body indices");for(let a of[t[s],i[s]])if(!Number.isInteger(a)||a<0||a>4294967295)throw Error("Collision masks must be unsigned 32-bit integers")}let r=Q(this);for(let s=0;s<e.length;s++)r.uint(this.filterBuffer,e[s]*2,t[s]),r.uint(this.filterBuffer,e[s]*2+1,i[s]);this.wakeAll()}profileNextStep(e){return this.detailCallback?!1:super.profileNextStep(t=>e({...t,broadphase:this.broadphase,bvhRebuilt:this.bvh?.lastRebuilt??!1}))}flushPropertyEdits(e){this.propertyEdits?.flush(e)}readJoints(){return this.flushPropertyEdits(),super.readJoints()}releaseAppTiming(){if(this.detailTiming){for(let e of["querySet","resolve","read"])this.detailTiming[e].destroy();this.detailTiming=null}}destroy(){this.passConstantCache=null;for(let e of Object.values(this.captureUploads??{}))e.buffer.destroy();this.captureUploads=null,this.frameData=null,this.propertyEdits?.destroy(),this.shapeQueries?.destroy(),this.restitution?.destroy(),this.sleeping?.dispose(),this.bvh?.destroy(),this.bvh=null,this.timingBusy||this.releaseAppTiming(),super.destroy(),this.solvePipelineCache.clear(),this.adjacencyPipelines={}}adapt(e){if(super.adapt(e),this.colorCap=Math.max(this.minimumColors,this.colorCap),this.colorRounds=Math.max(this.minimumColorRounds,this.colorRounds),this.adaptiveScheduling){let t=this.bodyCount>=25e4&&this.jointCount-this.freeSlots.length===0&&e.manifolds>=1.75*this.bodyCount&&!e.overflow&&!e.clashes;this.primalLanes=t?[2**31,2**31,2**31]:[...this.defaultPrimalLanes],this.schedulingDecision={bodyCount:this.bodyCount,manifolds:e.manifolds,dense:t,cachedAdjacency:this.adjacencyCached,reason:t?"Eight threads share each dense body solve":"Threads per body follow solve-group size"}}}selectAdjacencyPipeline(){let e=this.cacheAdjacencyKeys??this.bodyCount>=25e4;this.adjacencyCached!==e&&(e&&!this.adjacencyPipelines.cached&&(this.adjacencyPipelines.cached=this.device.createComputePipeline({label:"Cached adjacency keys",layout:this.device.createPipelineLayout({bindGroupLayouts:[this.layouts.topo]}),compute:{module:this.device.createShaderModule({code:hn}),entryPoint:"sortAdjacency"}})),this.pipes.sortAdjacency=e?this.adjacencyPipelines.cached:this.adjacencyPipelines.original,this.adjacencyCached=e)}};var $o=new WeakMap,Sn=[{name:"batched-grid",broadphase:"grid",dispatchIsolation:!1},{name:"isolated-grid",broadphase:"grid",dispatchIsolation:!0},{name:"batched-hploc",broadphase:"hploc",dispatchIsolation:!1},{name:"isolated-hploc",broadphase:"hploc",dispatchIsolation:!0},{name:"scalar-grid",broadphase:"grid",dispatchIsolation:!1,scalarPrimal:!0},{name:"scalar-isolated-grid",broadphase:"grid",dispatchIsolation:!0,scalarPrimal:!0},{name:"portable-contact-grid",broadphase:"grid",dispatchIsolation:!1,portableContactMath:!0},{name:"portable-contact-isolated-grid",broadphase:"grid",dispatchIsolation:!0,scalarPrimal:!0,portableContactMath:!0}];function kn(o){return $o.has(o)||$o.set(o,cc(o)),$o.get(o)}async function cc(o,e){let t=[];for(let i of Sn){let r=await pc(o,i,e);if(t.push(r),!!r.passed)return Bn(o,{dispatchIsolation:i.dispatchIsolation,scalarPrimal:i.scalarPrimal??!1,portableContactMath:i.portableContactMath??!1,broadphase:i.broadphase==="hploc"?"hploc":void 0}),{...r,selected:i.name,compatibility:i.name!==Sn[0].name,attempts:t}}return{...t[0],selected:null,compatibility:!1,attempts:t}}function uc(o){let e=new jt;return e.iterations=5,o||(e.gravity=0),new De(e,[16,.25,16],0,.6,[0,-.125,0]),new De(e,[1,1,1],1,.6,[-2,o?2:.45,0]),Mi(e,.5,1,.6,[0,o?2.3:.45,0]),Hi(e,.25,1.6,1,.6,[2,o?2.5:.75,0]),e}async function Wt(o,e,t=e.size){let i=o.createBuffer({size:t,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});try{let r=o.createCommandEncoder();return r.copyBufferToBuffer(e,0,i,0,t),o.queue.submit([r.finish()]),await i.mapAsync(GPUMapMode.READ),i.getMappedRange().slice(0)}finally{i.destroy()}}async function fc(o){o.step();let e=await o.readCounters(),t=new Uint32Array(await Wt(o.device,o.argsBuffer)),i=await hc(o),r=new Uint32Array(i),s=new Float32Array(i),a=new Uint32Array(await Wt(o.device,o.adjBuffer)),n=new Uint32Array(await Wt(o.device,o.colorBuffer)),{manifolds:l,contacts:c}=o.contactStorage,f=await Wt(o.device,l,Math.max(32,e.manifolds*32)),u=new Uint32Array(f),d=new Float32Array(f),p=new Float32Array(await Wt(o.device,c,Math.max(64,e.contacts*64))),m=await o.readBodies(),h=e.manifolds>=3?await dc(o):[],b=h.some(({contactEvaluation:y})=>y.returnedForce===0&&y.independentForce<-1e-5);return{expectedFloorPairs:3,counters:e,pairs:e.pairs?Array.from(await o.readPairs()):[],narrowphaseWorkgroups:Array.from(t.subarray(0,3)),solver:{scalarPrimal:o.scalarPrimal,portableContactMath:o.portableContactMath,lanes:[...o.primalLanes],contactWorkgroups:Array.from(t.subarray(3,6)),dualWorkgroups:Array.from(t.subarray(9,12)),colorWorkgroups:Array.from(t.subarray(12,12+3*o.colorCap)),adjacencyStarts:Array.from(a.subarray(0,5)),adjacencyEntries:Array.from(a.subarray(2*o.bodyCapacity+1,2*o.bodyCapacity+1+a[4])),colorStarts:Array.from(n.subarray(2*o.bodyCapacity,2*o.bodyCapacity+o.colorCap+1)),colorBodies:Array.from(n.subarray(2*o.bodyCapacity+65,2*o.bodyCapacity+68)),positionsAfterOverlap:[1,2,3].map(y=>Array.from(m.subarray(y*40,y*40+3))),manifolds:Array.from({length:e.manifolds},(y,v)=>({ids:Array.from(u.subarray(v*8,v*8+4)),normalAndFriction:Array.from(d.subarray(v*8+4,v*8+8))})),contacts:Array.from({length:e.contacts},(y,v)=>({anchorA:Array.from(p.subarray(v*16,v*16+3)),anchorB:Array.from(p.subarray(v*16+4,v*16+7)),gap:p[v*16+7],penalty:Array.from(p.subarray(v*16+8,v*16+11)),force:Array.from(p.subarray(v*16+12,v*16+15))})),serialSystems:h,failure:b?"contact-evaluation":null},filters:Array.from(new Uint32Array(await Wt(o.device,o.filterBuffer))),params:{bodyCount:r[0],largeCount:r[1],noCollideCount:r[2],pairCapacity:r[3],contactCapacity:r[4],dt:s[5],cellSize:s[6],maxSmallRadius:s[7],up:Array.from(s.subarray(8,11)),alpha:s[11]},stage:e.pairs<3?"collision-pairs":e.manifolds<3?"contact-generation":"contacts-created"}}async function dc(o){let e=o.portableContactMath?"bitcast<f32>(pc.data.y)":"pc.alpha",t=o.portableContactMath?"k.anchorB.w":"k.c0x",i=o.portableContactMath?"k.penalty.x":"k.pen.x",r=o.portableContactMath?"k.force.x":"k.lam.x",s=o.device.createShaderModule({code:o.solveSource(be)+`
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
}`}),a=o.device.createComputePipeline({layout:o.device.createPipelineLayout({bindGroupLayouts:[o.layouts.solve,o.layouts.pass]}),compute:{module:s,entryPoint:"inspectSystems"}}),n=o.device.createCommandEncoder(),l=n.beginComputePass();l.setPipeline(a),l.setBindGroup(0,o.groups.solve[1-o.parity]),l.setBindGroup(1,o.passGroup,[0]),l.dispatchWorkgroups(3),l.end(),o.device.queue.submit([n.finish()]);let c=new Float32Array(await Wt(o.device,o.jointBuffer,384));return[0,1,2].map(f=>({linearDiagonal:Array.from(c.subarray(f*32,f*32+3)),angularDiagonal:Array.from(c.subarray(f*32+4,f*32+7)),linearForce:Array.from(c.subarray(f*32+16,f*32+19)),angularForce:Array.from(c.subarray(f*32+20,f*32+23)),contactEvaluation:{inputGap:c[f*32+24],passAlpha:c[f*32+25],returnedError:c[f*32+26],returnedForce:c[f*32+27],inputPenalty:c[f*32+28],inputForce:c[f*32+29],independentError:c[f*32+30],independentForce:c[f*32+31]}}))}async function hc(o){let{device:e}=o,t=e.createBuffer({size:48,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});try{let i=e.createComputePipeline({layout:"auto",compute:{module:e.createShaderModule({code:ae+`
@group(0) @binding(0) var<uniform> p: Params;
@group(0) @binding(1) var<storage,read_write> out: array<u32>;
@compute @workgroup_size(1) fn inspectParams() {
  out[0]=p.bodyCount; out[1]=p.largeCount; out[2]=p.noCollideCount;
  out[3]=p.pairCapacity; out[4]=p.contactCapacity;
  out[5]=bitcast<u32>(p.dt); out[6]=bitcast<u32>(p.cellSize); out[7]=bitcast<u32>(p.maxSmallRadius);
  out[8]=bitcast<u32>(p.up.x); out[9]=bitcast<u32>(p.up.y); out[10]=bitcast<u32>(p.up.z);
  out[11]=bitcast<u32>(p.alpha);
}`}),entryPoint:"inspectParams"}}),r=e.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:o.paramsBuffer}},{binding:1,resource:{buffer:t}}]}),s=e.createCommandEncoder(),a=s.beginComputePass();return a.setPipeline(i),a.setBindGroup(0,r),a.dispatchWorkgroups(1),a.end(),e.queue.submit([s.finish()]),await Wt(e,t)}finally{t.destroy()}}async function pc(o,e,t){let i={mode:e.name,passed:!1,steps:180,cases:[],errors:[],contactCache:"normal-float-generations-v1",diagnosticVersion:4,limits:{storageBindings:o.limits.maxStorageBuffersPerShaderStage,workgroupStorageBytes:o.limits.maxComputeWorkgroupStorageSize,workgroupInvocations:o.limits.maxComputeInvocationsPerWorkgroup,storageBindingBytes:o.limits.maxStorageBufferBindingSize}},r,s=a=>{let n=new Vt(o,uc(a),{spatialSort:!1,bodyCapacity:4,broadphase:e.broadphase,scalarPrimal:e.scalarPrimal??!1,portableContactMath:e.portableContactMath??!1,capacity:{pairs:32,manifolds:32,contacts:256,colors:8}});return n.params.up=[0,1,0],n.dispatchIsolation=e.dispatchIsolation,t?.(n,e,a),n};o.pushErrorScope("validation");try{if(r=s(!1),i.pipeline=await fc(r),i.pipeline.stage!=="contacts-created")i.reason=i.pipeline.stage==="collision-pairs"?"The GPU did not find the three known overlapping floor pairs.":"The GPU found overlapping pairs but did not create all floor contacts.";else{r.destroy(),r=s(!0);let a=0;i.samples=[];for(let l=0;l<i.steps;l++){if(r.step(),(l+1)%30&&l!==39)continue;let c=await r.readCounters();if(i.samples.push({step:l+1,...c}),c.manifolds&&a++,c.overflow||c.clashes)throw Error("Incomplete GPU contact graph")}let n=await r.readBodies();for(let l=1;l<4;l++){let c=l*40,[f,u,d,p]=n.subarray(c+4,c+8),m=l===1?.5*(Math.abs(2*(f*u+p*d))+Math.abs(1-2*(f*f+d*d))+Math.abs(2*(u*d-p*f))):l===2?.5:.25+.55*Math.abs(1-2*(f*f+d*d)),h=n[c+1]-m,b=n.subarray(c,c+40).every(Number.isFinite);i.cases.push({shape:["floor","box","sphere","capsule"][l],passed:b&&h>=-.06&&h<.12,floorGap:h,position:Array.from(n.subarray(c,c+3))})}i.contactSteps=a,i.passed=a>0&&i.cases.every(l=>l.passed),i.passed||(i.reason=i.pipeline.solver.failure==="contact-evaluation"?"The GPU created floor contacts but returned zero force where a push was required.":"The GPU did not keep all three falling shapes on the floor.")}}catch(a){i.errors.push(a.message)}finally{try{let a=await o.popErrorScope();a&&i.errors.push(a.message)}catch(a){i.errors.push(a.message)}r?.destroy()}return i.passed=i.passed&&!i.errors.length,i}async function Xo(o={}){if(!globalThis.navigator?.gpu)throw Error("WebGPU needs a supported browser on localhost or HTTPS");let e=await navigator.gpu.requestAdapter({powerPreference:o.powerPreference??"high-performance"});if(!e)throw Error("No WebGPU adapter is available");let t={};for(let[r,s]of Object.entries(o.preferredLimits??{})){if(!r.startsWith("max")||e.limits[r]===void 0||!Number.isSafeInteger(s)||s<0)throw Error(`Invalid preferred GPU limit: ${r}`);t[r]=Math.min(s,e.limits[r])}for(let[r,s]of Object.entries(o.requiredLimits??{})){if(e.limits[r]===void 0||!Number.isSafeInteger(s)||s<0)throw Error(`Invalid required GPU limit: ${r}`);let a=e.limits[r];if(r.startsWith("min")&&s<a||!r.startsWith("min")&&s>a)throw Error(`GPU limit ${r} requires ${s}; this adapter supports ${a}`);t[r]=s}let i=await e.requestDevice({requiredLimits:t,requiredFeatures:e.features.has("timestamp-query")?["timestamp-query"]:[]});if(o.validate3D)try{await cs(i)}catch(r){throw i.destroy(),r}return{adapter:e,device:i}}async function cs(o){if(ns(o))return o;let e=await kn(o);if(!e.passed)throw Error(`GPU 3D contact check failed: ${e.reason??e.errors.join("; ")}`);return o}var Pn=`struct Body { pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f }
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
 if((c.mask&8u)!=0u){b.pos=vec4f(c.position.xyz,b.pos.w);b.rot=c.rotation;}
 if((c.mask&16u)!=0u){b.size.w=0.;b.moment=vec4f(vec3f(0),b.moment.w);b.velocity=vec4f(0);b.angular=vec4f(vec3f(0),b.angular.w);}
 bodies[c.index]=b;
}
`;var Lt=class{constructor(e,t,i="linear"){this.solver=e,this.dimension=t,this.components=i==="angular"&&t===2?1:t;let r=e.device,s=t===3?10:6,a=t===3?i==="angular"?9:8:3;this.pipeline=r.createComputePipeline({layout:"auto",compute:{entryPoint:"setVelocities",module:r.createShaderModule({code:`
      @group(0) @binding(0) var<storage,read_write> bodies:array<vec4f>;
      @group(0) @binding(1) var<storage,read> indices:array<u32>;
      @group(0) @binding(2) var<storage,read> velocities:array<f32>;
      @compute @workgroup_size(64) fn setVelocities(@builtin(global_invocation_id) id:vec3u) {
        let i=id.x+id.y*${r.limits.maxComputeWorkgroupsPerDimension*64}u;
        if(i>=arrayLength(&indices)){return;}
        let base=indices[i]*${s}u+${a}u;
        var v=bodies[base];
        ${this.components===1?"v.z=velocities[i];":`v.x=velocities[i*${t}u];v.y=velocities[i*${t}u+1u];${t===3?"v.z=velocities[i*3u+2u];":""}`}
        bodies[base]=v;
      }`})}})}set(e,t){let i=this.solver,r=i.device,s=e instanceof Uint32Array?e:Uint32Array.from(e),a=t instanceof Float32Array?t:Float32Array.from(t);if(a.length!==s.length*this.components)throw Error(`Provide ${this.components} velocity components per body`);let n=-1;for(let c=0;c<e.length;c++){if(i.liveIndex(e[c]),e[c]<=n)throw Error("Velocity batch indices must be unique and ascending GPU slots");n=e[c]}for(let c of a)if(!Number.isFinite(c))throw Error("Velocities must be finite Float32 values");let l=Math.min(r.limits.maxStorageBufferBindingSize,r.limits.maxBufferSize);if(s.byteLength>l||a.byteLength>l)throw Error("Velocity batch exceeds GPU buffer limits");s.length&&(i.wakeAll(),i.flushEdits(),this.submitValidated(s,a))}submitValidated(e,t,i){if(!e.length)return;let r=this.solver,s=r.device,a=Math.min(s.limits.maxStorageBufferBindingSize,s.limits.maxBufferSize);if(e.byteLength>a||t.byteLength>a)throw Error("Velocity batch exceeds GPU buffer limits");for(let[u,d]of[["indices",e],["values",t]])(!this[u]||this[u].size<d.byteLength)&&(this[u]?.destroy(),this[u]=s.createBuffer({size:Math.min(a,d.byteLength*2),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})),s.queue.writeBuffer(this[u],0,d);let n=i??s.createCommandEncoder(),l=n.beginComputePass();l.setPipeline(this.pipeline),(!this.binding||this.boundBody!==r.bodyBuffer||this.boundIndices!==this.indices||this.boundValues!==this.values||this.boundBytes!==t.byteLength)&&(this.binding=s.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:r.bodyBuffer}},{binding:1,resource:{buffer:this.indices,size:e.byteLength}},{binding:2,resource:{buffer:this.values,size:t.byteLength}}]}),this.boundBody=r.bodyBuffer,this.boundIndices=this.indices,this.boundValues=this.values,this.boundBytes=t.byteLength),l.setBindGroup(0,this.binding);let c=Math.ceil(e.length/64),f=s.limits.maxComputeWorkgroupsPerDimension;l.dispatchWorkgroups(Math.min(c,f),Math.ceil(c/f)),l.end(),i||s.queue.submit([n.finish()]),this.lastBatch={bodies:e.length,uploadedBytes:e.byteLength+t.byteLength}}destroy(){this.indices?.destroy(),this.values?.destroy()}},Ht=class{constructor(e,t){this.solver=e,this.dimension=t,this.wordsPerBody=t===3?8:5}set(e,{linear:t,angular:i}={}){let r=this.solver,s=this.dimension,a=s===3?3:1,n=e instanceof Uint32Array?e:Uint32Array.from(e),l=t===void 0?null:t instanceof Float32Array?t:Float32Array.from(t),c=i===void 0?null:i instanceof Float32Array?i:Float32Array.from(i);if(!l&&!c)throw Error("Provide linear and/or angular velocities");if(l&&l.length!==n.length*s)throw Error(`Provide ${s} linear components per body`);if(c&&c.length!==n.length*a)throw Error(`Provide ${a} angular components per body`);let f=-1;for(let p=0;p<e.length;p++){if(r.liveIndex(e[p]),e[p]<=f)throw Error("Velocity batch indices must be unique and ascending GPU slots");f=e[p]}for(let p of[l,c])if(p){for(let m of p)if(!Number.isFinite(m))throw Error("Velocities must be finite Float32 values")}let u=n.length*this.wordsPerBody,d=Math.min(r.device.limits.maxStorageBufferBindingSize,r.device.limits.maxBufferSize);if(u*4>d)throw Error("Motion batch exceeds GPU buffer limits");if(u){(!this.data||this.data.length<u)&&(this.data=new Uint32Array(Math.max(u,(this.data?.length??0)*2)),this.floats=new Float32Array(this.data.buffer));for(let p=0;p<n.length;p++){let m=p*this.wordsPerBody;if(this.data[m]=n[p],this.data[m+1]=(l?1:0)|(c?2:0),l)for(let h=0;h<s;h++)this.floats[m+2+h]=l[p*s+h];if(c)for(let h=0;h<a;h++)this.floats[m+2+s+h]=c[p*a+h]}r.wakeAll(),r.flushEdits(),this.submitValidated(this.data.subarray(0,u))}}submitValidated(e,t){if(!e.length)return;let i=this.solver,r=i.device,s=this.wordsPerBody,a=Math.min(r.limits.maxStorageBufferBindingSize,r.limits.maxBufferSize);if(e.byteLength>a)throw Error("Motion batch exceeds GPU buffer limits");(!this.buffer||this.buffer.size<e.byteLength)&&(this.buffer?.destroy(),this.buffer=r.createBuffer({size:Math.min(a,e.byteLength*2),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})),r.queue.writeBuffer(this.buffer,0,e),this.pipeline??=r.createComputePipeline({layout:"auto",compute:{entryPoint:"edit",module:r.createShaderModule({code:`
      @group(0) @binding(0) var<storage,read_write> bodies:array<vec4f>;
      @group(0) @binding(1) var<storage,read> commands:array<u32>;
      @compute @workgroup_size(64) fn edit(@builtin(global_invocation_id) id:vec3u) {
        let i=id.x+id.y*${r.limits.maxComputeWorkgroupsPerDimension*64}u;
        let o=i*${s}u;if(o>=arrayLength(&commands)){return;}
        let b=commands[o]*${this.dimension===3?10:6}u;
        let mask=commands[o+1u];
        var v=bodies[b+${this.dimension===3?8:3}u];
        if((mask&1u)!=0u){v.x=bitcast<f32>(commands[o+2u]);v.y=bitcast<f32>(commands[o+3u]);${this.dimension===3?"v.z=bitcast<f32>(commands[o+4u]);":""}}
        ${this.dimension===2?"if((mask&2u)!=0u){v.z=bitcast<f32>(commands[o+4u]);}":"if((mask&2u)!=0u){var a=bodies[b+9u];a.xyz=vec3f(bitcast<f32>(commands[o+5u]),bitcast<f32>(commands[o+6u]),bitcast<f32>(commands[o+7u]));bodies[b+9u]=a;}"}
        bodies[b+${this.dimension===3?8:3}u]=v;
      }`})}}),(!this.binding||this.boundBody!==i.bodyBuffer||this.boundBuffer!==this.buffer||this.boundBytes!==e.byteLength)&&(this.binding=r.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i.bodyBuffer}},{binding:1,resource:{buffer:this.buffer,size:e.byteLength}}]}),this.boundBody=i.bodyBuffer,this.boundBuffer=this.buffer,this.boundBytes=e.byteLength);let n=t??r.createCommandEncoder(),l=n.beginComputePass();l.setPipeline(this.pipeline),l.setBindGroup(0,this.binding);let c=Math.ceil(e.length/s/64),f=r.limits.maxComputeWorkgroupsPerDimension;l.dispatchWorkgroups(Math.min(c,f),Math.ceil(c/f)),l.end(),t||r.queue.submit([n.finish()]),this.lastBatch={bodies:e.length/s,uploadedBytes:e.byteLength}}destroy(){this.buffer?.destroy(),this.binding=null,this.data=this.floats=null}};function us(o,e={}){return qi({...e,requested:e.solverMode??"auto",bodyCount:o.bodies.length,custom:!!e.shaders?.solve}),{...e,solverMode:e.solverMode??"auto"}}function Ji(o,e){let t=o&&typeof o.x=="number"?[o.x,o.y,o.z]:Array.from(o);if(t.length!==3||!t.every(Number.isFinite))throw Error(`${e} requires three finite components`);return t}function fs(o,e){if(o!==1/0&&(!Number.isFinite(o)||o<0))throw Error(`${e} must be nonnegative or Infinity`);return o}function Ln(o,e){let t=Ji(e,"anchor");if(!o)return t;let i=o.aggregate,r=i.mesh.position.constructor;return new r(...t).subtract(i.localCenter).applyRotationQuaternion(i.localRotation.conjugate()).asArray()}var mr=class{constructor(e,t,i,r={}){e.assertAlive();for(let a of[t,i])if(a&&(a.assertAlive(),a.aggregate.world!==e))throw Error("Constraint bodies must belong to this world");if(!i||t===i)throw Error("A constraint needs a body B and distinct endpoints");let s=r.type??"ball";if(!["ball","fixed","spring","motor","limit"].includes(s))throw Error("Constraint type must be ball, fixed, spring, motor or limit");if(s==="spring"&&!t)throw Error("A spring requires two bodies; use a static aggregate for a world anchor");if(this.world=e,this.bodyA=t,this.bodyB=i,this.type=s,s==="motor"||s==="limit"){let a=(n,l)=>n?new n.aggregate.mesh.position.constructor(...Ji(l,"axis")).applyRotationQuaternion(n.aggregate.localRotation.conjugate()).asArray():Ji(l,"axis");this.angularMaterial=gt({...r,type:s,axisA:a(t,r.axisA??[0,1,0]),axisB:a(i,r.axisB??[0,1,0])})}if(this.anchorA=Ln(t,r.anchorA??[0,0,0]),this.anchorB=Ln(i,r.anchorB??[0,0,0]),this.linear=fs(s==="spring"?r.stiffness??1e3:r.stiffness??1/0,"stiffness"),this.angular=s==="fixed"?fs(r.angularStiffness??1/0,"angularStiffness"):0,this.breakForce=fs(r.breakForce??1/0,"breakForce"),this.breakForce===0)throw Error("breakForce must be positive");if(this.material=Pt({breakForce:this.breakForce,breakStrain:r.breakStrain}),s!=="spring"&&r.breakStrain!==void 0)throw Error("breakStrain applies to springs only");if(this.breakOnPull=r.breakOnPull??!1,this.rest=r.rest,this.rest!==void 0&&(!Number.isFinite(this.rest)||this.rest<0))throw Error("Spring rest length must be nonnegative and finite");if(s==="spring"&&!Number.isFinite(this.linear))throw Error("Spring stiffness must be finite");e.gpu?(e.flushCommands(),this.attach()):this.force=s==="spring"?new ct(e.ref,t.aggregate.rigid,i.aggregate.rigid,this.anchorA,this.anchorB,this.linear,this.rest??-1):new we(e.ref,t?.aggregate.rigid??null,i.aggregate.rigid,this.anchorA,this.anchorB,this.linear,this.angular,this.breakForce),this.force&&s==="spring"&&ts(this.force,this.material),this.force&&this.angularMaterial&&Wi(this.force,this.angularMaterial),e.constraints.add(this),e.wakeAll?.()}attach(e,t=!0){let i=this.world.gpu;if(e!==void 0?this.slot=e:this.type==="spring"?[this.slot]=i.appendSprings([{a:this.bodyA.gpuIndex,b:this.bodyB.gpuIndex,rA:this.anchorA,rB:this.anchorB,stiffness:this.linear,rest:this.rest??0}]):this.slot=i.appendJoint(this.bodyA?.gpuIndex??-1,this.bodyB.gpuIndex,this.anchorA,this.anchorB,this.linear,this.angular),this.angularMaterial&&i.setAngularConstraint(this.slot,this.angularMaterial),this.type==="spring"&&(Number.isFinite(this.material.breakStrain)||Number.isFinite(this.material.breakForce))&&i.setSpringMaterial(this.slot,this.material),this.type!=="spring"&&Number.isFinite(this.breakForce)){let r=Number.isFinite(this.breakForce)?this.breakForce:1e30;i.device.queue.writeBuffer(i.jointBuffer,(this.slot*32+11)*4,new Float32Array([this.breakOnPull?-r:r]))}t&&(this.type==="fixed"||this.type==="spring"&&this.rest===void 0)&&i.captureConstraintFrames([{slot:this.slot,spring:this.type==="spring"}])}assertAlive(){if(this.world.assertAlive(),this.disposed)throw Error("Constraint is disposed")}setWorldAnchor(e){if(this.assertAlive(),this.bodyA||this.type==="spring")throw Error("Only world-anchored joints have a movable world anchor");return this.anchorA=Ji(e,"world anchor"),this.world.gpu?this.world.gpu.setWorldAnchor(this.slot,this.anchorA):this.force.rA.set(this.anchorA),this.world.wakeAll?.(),this}async readState(){this.assertAlive(),this.world.initialize();let e=this.world.gpu,t=this.world.device,i=t.createBuffer({size:128,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let r=t.createCommandEncoder();r.copyBufferToBuffer(e.jointBuffer,this.slot*128,i,0,128),t.queue.submit([r.finish()]),await i.mapAsync(GPUMapMode.READ);let s=new Float32Array(i.getMappedRange().slice(0));return{broken:s[3]===0&&s[7]===0,linearForce:Array.from(s.subarray(8,11)),angularForce:Array.from(s.subarray(12,15))}}finally{i.destroy()}}setMotor(e){if(this.assertAlive(),this.type!=="motor")throw Error("setMotor requires a motor constraint");return this.angularMaterial=gt({...this.angularMaterial,...e}),this.world.gpu?this.world.gpu.setMotor(this.slot,e):Wi(this.force,this.angularMaterial),this.world.wakeAll(),this}dispose(){this.disposed||(this.world.disposed||(this.world.gpu?this.world.gpu.releaseJoints([this.slot]):this.force.destroy(),this.world.wakeAll?.()),this.world.constraints.delete(this),this.disposed=!0)}},br=class{constructor(e,t,i,r={}){let s=gt({...r,type:"limit"}),a=r.span??1;if(!Number.isFinite(a)||a<=0)throw Error("Hinge span must be positive");let n=Ji(r.anchorA??[0,0,0],"anchorA"),l=Ji(r.anchorB??[0,0,0],"anchorB");r.motor&&gt({...r.motor,type:"motor",axisA:s.axisA,axisB:s.axisB}),this.world=e,this.bodyA=t,this.bodyB=i,this.disposed=!1,this.joints=[-1,1].map(c=>e.addJoint(t,i,{anchorA:n.map((f,u)=>f+c*a*.5*s.axisA[u]),anchorB:l.map((f,u)=>f+c*a*.5*s.axisB[u]),stiffness:r.stiffness??1/0})),(r.minAngle!==void 0||r.maxAngle!==void 0)&&(this.limit=e.addConstraint(t,i,{...s,type:"limit"})),r.motor&&(this.motor=e.addMotor(t,i,{axisA:s.axisA,axisB:s.axisB,...r.motor}))}dispose(){if(!this.disposed){for(let e of[...this.joints,this.limit,this.motor])e?.dispose();this.disposed=!0}}};var Jt=class{constructor(e){this.device=e,this.pipelines=new Map,this.idle=[],this.jobs=new Set,this.destroyed=!1}acquire(e,t){if(this.destroyed)throw Error("Pose readback has been destroyed");let i=this.device;if(e>i.limits.maxStorageBufferBindingSize||t>Math.min(i.limits.maxStorageBufferBindingSize,i.limits.maxBufferSize))throw Error("Pose selection exceeds GPU buffer limits");let r=this.idle.findIndex(a=>a.selection.size>=e&&a.selected.size>=t),s=r>=0?this.idle.splice(r,1)[0]:this.idle.pop()??{};for(let[a,n,l]of[["selection",e,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST],["selected",t,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC],["staging",t,GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST]])(!s[a]||s[a].size<n)&&(s[a]?.destroy(),s[a]=i.createBuffer({size:n,usage:l}));return this.jobs.add(s),s}release(e){if(e.staging.unmap(),!this.destroyed&&e.selected.size<=8*1024*1024&&this.idle.length<2)this.idle.push(e);else{for(let t of["selection","selected","staging"])e[t].destroy();this.jobs.delete(e)}}destroy(){this.destroyed=!0;for(let e of this.jobs)for(let t of["selection","selected","staging"])e[t].destroy();this.jobs.clear(),this.idle.length=0}async read(e,t,i=!1,r=10){if(!t.length)return new Float32Array;let s=i?r===6?1:2:r,a=this.device,n=a.limits.maxComputeWorkgroupsPerDimension,l=`${r}:${s}`,c=this.pipelines.get(l);c||(c=a.createComputePipeline({layout:"auto",compute:{entryPoint:"gather",module:a.createShaderModule({code:`
        @group(0) @binding(0) var<storage,read> bodies:array<vec4f>;
        @group(0) @binding(1) var<storage,read> indices:array<u32>;
        @group(0) @binding(2) var<storage,read_write> selected:array<vec4f>;
        @compute @workgroup_size(64) fn gather(@builtin(global_invocation_id) id:vec3u) {
          let i=id.x+id.y*${n*64}u; if(i>=arrayLength(&selected)){return;}
          selected[i]=bodies[indices[i/${s}u]*${r}u+i%${s}u];
        }`})}}),this.pipelines.set(l,c));let f=t.length*s*16,u=this.acquire(t.length*4,f),{selection:d,selected:p,staging:m}=u;try{a.queue.writeBuffer(d,0,t instanceof Uint32Array?t:Uint32Array.from(t)),(!u.group||u.body!==e||u.pipeline!==c||u.boundSelection!==d||u.boundSelected!==p||u.indexBytes!==t.length*4||u.bytes!==f)&&(u.group=a.createBindGroup({layout:c.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e}},{binding:1,resource:{buffer:d,size:t.length*4}},{binding:2,resource:{buffer:p,size:f}}]}),u.body=e,u.pipeline=c,u.boundSelection=d,u.boundSelected=p,u.indexBytes=t.length*4,u.bytes=f);let h=a.createCommandEncoder(),b=h.beginComputePass();b.setPipeline(c),b.setBindGroup(0,u.group);let y=Math.ceil(t.length*s/64);return b.dispatchWorkgroups(Math.min(y,n),Math.ceil(y/n)),b.end(),h.copyBufferToBuffer(p,0,m,0,f),a.queue.submit([h.finish()]),await m.mapAsync(GPUMapMode.READ,0,f),new Float32Array(m.getMappedRange(0,f).slice(0))}finally{this.release(u)}}};var Yo=4,$i=3,Xt=1,bc=2,gr=`
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

const STRIDE = ${ke/4}u;

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
  return ${Yo}u + 2u * (base + h);
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
  events[${$i}u * e] = bitcast<vec4f>(vec4u(kind, a, b, params.step));
  events[${$i}u * e + 1u] = vec4f(point, impulse);
  events[${$i}u * e + 2u] = vec4f(normal, 0.0);
}

/** Per pair this step: into this step's set, and a begin if it wasn't in last step's. */
@compute @workgroup_size(64)
fn touching(@builtin(global_invocation_id) id: vec3u) {
  let m = id.x;
  if (m >= min(counters[${Fi}u], params.pairs)) { return; }
  let mf = manifolds[m];
  let count = mf.ids.w & 15u;
  let a = mf.ids.x;
  let b = mf.ids.y;
  if (count == 0u || (watch[a] | watch[b]) == 0u) { return; }
  insert(params.now, a, b);
  if (has(params.prev, a, b)) { return; }
  // Where (the points' average, on a) and how hard (the normal force over the step)
  let pA = bodies[a * STRIDE + ${Oi/4}u].xyz;
  let qA = bodies[a * STRIDE + ${cr/4}u];
  var point = vec3f(0.0);
  var force = 0.0;
  for (var i = 0u; i < count; i++) {
    let k = contacts[mf.ids.z + i];
    point += turn(qA, k.rA) + pA;
    force += k.lam.x;
  }
  emit(${Xt}u, a, b, point / f32(count), abs(force) * params.dt, mf.geo.xyz);
}

/** Per slot of last step's set: an end if the pair isn't in this step's. */
@compute @workgroup_size(64)
fn ended(@builtin(global_invocation_id) id: vec3u) {
  if (id.x > params.mask) { return; }
  let s = slotOf(params.prev, id.x);
  let k = atomicLoad(&table[s]);
  if (k == 0u) { return; }
  let b = atomicLoad(&table[s + 1u]);
  if (!has(params.now, k - 1u, b)) { emit(${bc}u, k - 1u, b, vec3f(0.0), 0.0, vec3f(0.0)); }
}
`,gc=gr.replace("struct Manifold { ids: vec4u, geo: vec4f }","struct Manifold { ids:vec4u, pl:vec4f, anchors:vec4f, geo:vec4f, misc:vec4f }").replace(`const STRIDE = ${ke/4}u;`,"const STRIDE = 6u;").replace(gr.slice(gr.indexOf(`@compute @workgroup_size(64)
fn touching`),gr.indexOf("/** Per slot of last step")),`
@compute @workgroup_size(64) fn touching(@builtin(global_invocation_id) id:vec3u){
  let m=id.x;let count=min(counters[1u],params.pairs);if(m>=count){return;}
  let c=manifolds[m];let a=c.ids.x;let b=c.ids.y;
  if((watch[a]|watch[b])==0u){return;}
  if(m>0u && all(manifolds[m-1u].ids.xy==c.ids.xy)){return;}
  insert(params.now,a,b);if(has(params.prev,a,b)){return;}
  let pose=bodies[a*STRIDE];let cs=cos(pose.z);let sn=sin(pose.z);
  let r=c.anchors.xy;let point=pose.xy+vec2f(cs*r.x-sn*r.y,sn*r.x+cs*r.y);
  emit(${Xt}u,a,b,vec3f(point,0.),abs(c.pl.z)*params.dt,vec3f(c.geo.zw,0.));
}

`),$t=class{device;pipelines;layout;watch;table;events;params;setSlots;capacity;group=null;bound=[];flip=0;bodies;constructor(e,t,i,r,s,a=3){this.device=e,this.bodies=t,this.capacity=s,this.setSlots=2**Math.ceil(Math.log2(Math.max(64,2*r)));let n=e.createShaderModule({label:"contact events",code:a===2?gc:gr}),l=["read-only-storage","read-only-storage","read-only-storage","read-only-storage","read-only-storage","storage","storage","uniform"];this.layout=e.createBindGroupLayout({label:"contact events",entries:l.map((d,p)=>({binding:p,visibility:GPUShaderStage.COMPUTE,buffer:{type:d}}))});let c=e.createPipelineLayout({bindGroupLayouts:[this.layout]}),f=d=>e.createComputePipeline({label:`contact events ${d}`,layout:c,compute:{module:n,entryPoint:d}});this.pipelines={touching:f("touching"),ended:f("ended")};let u=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC;this.watch=e.createBuffer({label:"contact watch",size:Math.max(16,i*4),usage:u}),this.table=e.createBuffer({label:"contact sets",size:(Yo+4*this.setSlots)*4,usage:u}),this.events=e.createBuffer({label:"contact events",size:s*$i*16,usage:u}),this.params=e.createBuffer({label:"contact params",size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})}setWatched(e,t){let i=e.map((r,s)=>[r,t[s]?1:0]).sort((r,s)=>r[0]-s[0]);for(let r=0;r<i.length;){let s=r+1;for(;s<i.length&&i[s][0]===i[s-1][0]+1;)s++;this.device.queue.writeBuffer(this.watch,i[r][0]*4,Uint32Array.from(i.slice(r,s),a=>a[1])),r=s}}run(e,t,i,r){let s=this.device,a=[this.bodies,e.manifolds,e.contacts,e.counters,this.watch,this.table,this.events,this.params];(!this.group||a.some((d,p)=>d!==this.bound[p]))&&(this.bound=a,this.group=s.createBindGroup({layout:this.layout,entries:a.map((d,p)=>({binding:p,resource:{buffer:d}}))})),this.flip=1-this.flip;let[n,l]=this.flip?[0,this.setSlots]:[this.setSlots,0],c=new Uint32Array([n,l,this.setSlots-1,this.capacity,t,i,0,0]);new Float32Array(c.buffer)[6]=r,s.queue.writeBuffer(this.params,0,c);let f=s.createCommandEncoder({label:"contact events"});f.clearBuffer(this.table,(Yo+2*l)*4,2*this.setSlots*4);let u=f.beginComputePass({label:"contact events"});u.setBindGroup(0,this.group),u.setPipeline(this.pipelines.touching),u.dispatchWorkgroups(Math.max(1,Math.ceil(t/64))),u.setPipeline(this.pipelines.ended),u.dispatchWorkgroups(Math.ceil(this.setSlots/64)),u.end(),s.queue.submit([f.finish()])}async read(){let e=this.device,t=16+this.capacity*$i*16,i=e.createBuffer({size:t,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),r=e.createCommandEncoder({label:"read contact events"});r.copyBufferToBuffer(this.table,0,i,0,16),r.copyBufferToBuffer(this.events,0,i,16,t-16),r.clearBuffer(this.table,0,16),e.queue.submit([r.finish()]),await i.mapAsync(GPUMapMode.READ);let s=i.getMappedRange().slice(0);i.unmap(),i.destroy();let a=new Uint32Array(s),n=new Float32Array(s),l=Math.min(a[0],this.capacity),c=[];for(let f=0;f<l;f++){let u=4+f*$i*4;c.push({kind:a[u],a:a[u+1],b:a[u+2],step:a[u+3],point:[n[u+4],n[u+5],n[u+6]],impulse:n[u+7],normal:[n[u+8],n[u+9],n[u+10]]})}return c.sort((f,u)=>f.step-u.step),{events:c,dropped:a[0]-l,full:a[1]!==0}}destroy(){for(let e of[this.watch,this.table,this.events,this.params])e.destroy()}};var Xe=Object.freeze({BOX:"box",SPHERE:"sphere",CAPSULE:"capsule",CYLINDER:"cylinder",CONVEX_HULL:"convex-hull"}),_e=o=>o&&typeof o.x=="number"?[o.x,o.y,o.z,...typeof o.w=="number"?[o.w]:[]]:Array.from(o),yr=new WeakMap,Xi=o=>{if(!Number.isInteger(o)||o<0||o>4294967295)throw Error("Collision masks must be unsigned 32-bit integers");return o},ds=(o,e,t=!1)=>{if(!Number.isFinite(o)||(t?o<0:o<=0))throw Error(`${e} must be ${t?"nonnegative":"positive"} and finite`);return o},hs=class o{static async create({device:e,...t}={}){if(t.scene&&yr.has(t.scene))throw Error("This scene already has an AVBD world");let i=!e;e||({device:e}=await Xo({preferredLimits:{maxStorageBuffersPerShaderStage:9,maxStorageBufferBindingSize:512*1024*1024,maxBufferSize:1024*1024*1024}}));let r;try{return await cs(e),r=new o(e,t),r.ownsDevice=i,r.scene&&r.autoAttach&&r.attachToScene(),r}catch(s){throw r?r.dispose():i&&e.destroy(),s}}constructor(e,{scene:t,gravity:i=[0,-10,0],timeStep:r=1/60,iterations:s=10,capacity:a=4096,syncMeshes:n=!0,maxSyncedBodies:l=2048,broadphase:c="auto",solverMode:f="auto",bvh:u={},autoAttach:d=!0,maxContactPairs:p=8192,maxContactEvents:m=4096,sleeping:h=!1}={}){if(this.device=e,this.scene=t,this.autoAttach=d,this.syncEnabled=n,this.maxSyncedBodies=l,!Number.isInteger(a)||a<1||!Number.isInteger(l)||l<0)throw Error("capacity and maxSyncedBodies must be valid integer counts");if(this.capacity=a,this.collisionOptions={broadphase:c,bvh:u,solverMode:f},this.ref=new jt,this.ref.dt=ds(r,"timeStep"),!Number.isInteger(s)||s<1)throw Error("iterations must be a positive integer");this.ref.iterations=s,this.aggregates=[],this.constraints=new Set,this.contactListeners=new Set;for(let[y,v]of Object.entries({maxContactPairs:p,maxContactEvents:m}))if(!Number.isInteger(v)||v<1)throw Error(`${y} must be a positive integer`);if(this.contactOptions={maxContactPairs:p,maxContactEvents:m},this.bodyReadback=new Jt(e),this.sleepOptions=h,h!==!1&&h!==!0&&(typeof h!="object"||h===null))throw Error("sleeping must be a boolean or options object");this.commands=new Map,this.steps=0,this.errors=[],this.deviceLost=null;let b=new WeakRef(this);e.lost.then(y=>{let v=b.deref();!v||v.disposed||(v.deviceLost={reason:y.reason,message:y.message},v.errors.push(`WebGPU device lost: ${y.message||y.reason}`),v.dispose())}),this.setGravity(i),this.errorListener=y=>this.errors.push(y.error.message),e.addEventListener("uncapturederror",this.errorListener),t&&yr.set(t,this)}setGravity(e){let t=_e(e);if(t.length!==3||!t.every(Number.isFinite))throw Error("gravity requires three finite components");let i=Math.hypot(...t);this.gravity=-i,this.up=i?t.map(r=>-r/i):[0,1,0],this.gpu&&(this.gpu.params.gravity=this.gravity,this.gpu.params.up=this.up),this.wakeAll()}get solverDecision(){return this.initialize(),{...this.gpu.solverDecision}}setSolverMode(e){this.initialize();let t=this.gpu.setSolverMode(e);return this.collisionOptions.solverMode=e,{...t}}initialize(){if(this.assertAlive(),this.gpu)return;if(this.syncEnabled&&this.aggregates.filter(r=>r.sync).length>this.maxSyncedBodies)throw Error("For large scenes use syncMeshes:false and draw the GPU body buffer directly");if(this.aggregates.length>this.capacity)throw Error(`Body capacity ${this.capacity} exceeded; size the world before initialization`);this.gpu=new Vt(this.device,this.ref,us(this.ref,{bodyCapacity:Math.max(1,this.capacity),spatialSort:!0,...this.collisionOptions})),Object.assign(this.gpu.params,{gravity:this.gravity,up:this.up}),this.gpu.externalBeforeStep=r=>{this.sleepManager?.before(r),this.flushCommands(r)},this.gpu.externalAfterStep=r=>this.sleepManager?.after(r);let e=new Map([...this.constraints].map(r=>[r.force,r])),t=[],i=0;for(let r of this.ref.forces){let s=e.get(r);s&&(s.attach(i++,!1),(s.type==="fixed"||s.type==="spring"&&s.rest===void 0)&&t.push({slot:s.slot,spring:s.type==="spring"}))}this.gpu.captureConstraintFrames(t),this.byGpuIndex=new Map(this.aggregates.map(r=>[this.gpu.gpuIndex(r.index),r.body]));for(let r of this.aggregates)(r.disposed||r.group!==4294967295||r.collidesWith!==4294967295)&&this.gpu.setFilters([this.gpu.gpuIndex(r.index)],[r.disposed?0:r.group],[r.disposed?0:r.collidesWith]);for(let r of this.aggregates)r.isTrigger&&this.gpu.setSensor(r.body.gpuIndex,!0);for(let r of this.aggregates)r.restitution>0&&this.gpu.setRestitution(r.body.gpuIndex,r.restitution);this.contactListeners.size&&this.initializeContacts(),this.sleepOptions&&(this.sleepManager=new hi(this,this.sleepOptions===!0?{}:this.sleepOptions))}addAggregate(e,t,i={}){return new ps(e,t,i,this)}addAggregates(e){return e.map(({mesh:t,type:i,options:r})=>this.addAggregate(t,i,r))}addConstraint(e,t,i={}){return new mr(this,e,t,i)}addJoint(e,t,i={}){return this.addConstraint(e,t,{...i,type:i.type??"ball"})}addWeld(e,t,i={}){return this.addConstraint(e,t,{...i,type:"fixed"})}addSpring(e,t,i={}){return this.addConstraint(e,t,{...i,type:"spring"})}enableSleeping(e={}){return this.assertAlive(),this.sleepOptions=e,this.gpu&&!this.sleepManager&&(this.sleepManager=new hi(this,e)),this}addMotor(e,t,i={}){return this.addConstraint(e,t,{...i,type:"motor"})}addHinge(e,t,i={}){return new br(this,e,t,i)}initializeContacts(){if(this.contactWatch)return;let{maxContactPairs:e,maxContactEvents:t}=this.contactOptions;this.contactWatch=new $t(this.device,this.gpu.bodyBuffer,this.capacity,e,t);let i=this.aggregates.filter(r=>!r.disposed);this.contactWatch.setWatched(i.map(r=>r.body.gpuIndex),i.map(()=>!0))}onContact(e){if(this.assertAlive(),typeof e!="function")throw Error("A contact callback is required");return this.contactListeners.add(e),this.gpu&&this.initializeContacts(),()=>this.contactListeners.delete(e)}async readContactEvents(){return this.initialize(),this.initializeContacts(),this.contactPending?this.contactPending:(this.contactPending=this.contactWatch.read().then(e=>({...e,events:e.events.map(t=>({...t,type:t.kind===Xt?"begin":"end",isTrigger:!!(this.byGpuIndex.get(t.a)?.aggregate.isTrigger||this.byGpuIndex.get(t.b)?.aggregate.isTrigger),a:this.byGpuIndex.get(t.a),b:this.byGpuIndex.get(t.b)}))})).finally(()=>this.contactPending=null),this.contactPending)}async raycast(e,t,i={}){let[r]=await this.raycastAll([{origin:e,direction:t,maxDistance:i.maxDistance}],i);return r}async sphereCast(e,t,i,r={}){let[s]=await this.sphereCastAll([{origin:e,radius:t,direction:i,maxDistance:r.maxDistance}],r);return s}async sphereCastAll(e,{ignore:t=[],collidesWith:i=4294967295,includeTriggers:r=!0}={}){this.assertAlive(),Xi(i),this.initialize(),this.flushCommands();for(let a of t)if(a.aggregate.world!==this||a.disposed)throw Error("Ignored cast bodies must belong to this world and be alive");return(await this.gpu.sphereCastAll(e.map(a=>({...a,origin:_e(a.origin),direction:_e(a.direction)})),{ignore:t.map(a=>a.gpuIndex),collidesWith:i,includeTriggers:r})).map(a=>a?{...a,body:this.byGpuIndex.get(a.index)??null}:null)}async raycastAll(e,{ignore:t=[],collidesWith:i=4294967295,includeTriggers:r=!0}={}){Xi(i),this.initialize(),this.flushCommands();let s=e.map(n=>{let l=_e(n.origin),c=_e(n.direction);if(l.length!==3||c.length!==3||![...l,...c].every(Number.isFinite)||!Math.hypot(...c))throw Error("A ray requires a finite origin and nonzero direction");return n.maxDistance!==void 0&&ds(n.maxDistance,"maxDistance",!0),{...n,origin:l,direction:c}});for(let n of t)if(n.aggregate.world!==this)throw Error("Ignored ray bodies must belong to this world");return(await this.gpu.raycastAll(s,{ignore:t.map(n=>n.gpuIndex),collidesWith:i,includeTriggers:r})).map(n=>n?{...n,body:this.byGpuIndex.get(n.index)??null}:null)}getRenderBinding(e=this.device){if(this.initialize(),e!==this.device)throw Error("Direct GPU rendering must share the physics GPUDevice");return{device:e,buffer:this.bodyBuffer,stride:160,positionOffset:0,rotationOffset:16,sizeOffset:64,count:this.gpu.bodyCount}}wakeAll(){this.sleepManager&&(this.sleepManager.wakeRequested=!0)}async readSleepStats(){return this.initialize(),this.sleepManager?this.sleepManager.readStats():{sleeping:0,wakeRequested:!1}}assertAlive(){if(this.disposed)throw Error("AVBD world is disposed")}queue(e,t,i,r){this.assertAlive(),e.assertAlive();let s=_e(r);if(s.length!==(i==="rotation"?4:3)||!s.every(Number.isFinite))throw Error(`${i} requires ${i==="rotation"?4:3} finite components`);let a=this.commands.get(e);return a||this.commands.set(e,a={mask:0}),a.mask|=t,a[i]=s,this.wakeAll(),a}flushCommands(e){if(this.initialize(),this.gpu.flushPropertyEdits(e),!this.commands.size)return;this.sleepManager?.wakeRequested&&this.sleepManager.before(e);let t=this.commands.size,i=0;for(let h of this.commands.values())i|=h.mask;if(i===1||i===2){if(!this.velocityIndices||this.velocityIndices.length<t){let v=Math.max(t,(this.velocityIndices?.length??0)*2,64);this.velocityIndices=new Uint32Array(v),this.velocityValues=new Float32Array(v*3)}let h=0;for(let[v,B]of this.commands)this.velocityIndices[h]=v.aggregate.gpuSlot??this.gpu.gpuIndex(v.aggregate.index),this.velocityValues.set(i===2?B.angular:B.velocity,h++*3);let b=i===2?"angularVelocityBatch":"velocityBatch",y=this[b]??=new Lt(this.gpu,3,i===2?"angular":"linear");y.solver=this.gpu,y.submitValidated(this.velocityIndices.subarray(0,t),this.velocityValues.subarray(0,t*3),e),this.lastCommandBatch={bodies:t,path:i===2?"packed-angular-velocities":"packed-velocities",uploadedBytes:t*16},this.commands.clear();return}let r=!0;for(let h of this.commands.values())if((h.mask&-4)!==0){r=!1;break}if(r){(!this.motionData||this.motionData.length<t*8)&&(this.motionData=new Uint32Array(Math.max(t*8,(this.motionData?.length??0)*2,512)),this.motionFloats=new Float32Array(this.motionData.buffer));let h=0;for(let[b,y]of this.commands){let v=h++*8;this.motionData[v]=b.aggregate.gpuSlot??this.gpu.gpuIndex(b.aggregate.index),this.motionData[v+1]=y.mask,y.velocity&&this.motionFloats.set(y.velocity,v+2),y.angular&&this.motionFloats.set(y.angular,v+5)}this.motionBatch??=new Ht(this.gpu,3),this.motionBatch.submitValidated(this.motionData.subarray(0,t*8),e),this.lastCommandBatch={bodies:t,path:"packed-motion",uploadedBytes:t*32},this.commands.clear();return}let s=t*128,a=Math.min(this.device.limits.maxStorageBufferBindingSize,this.device.limits.maxBufferSize);if(s>a)throw Error("Body command batch exceeds GPU buffer limits");(!this.commandData||this.commandData.byteLength<s)&&(this.commandData=new ArrayBuffer(Math.min(a,Math.max(s,(this.commandData?.byteLength??0)*2,128))));let n=this.commandData,l=new Float32Array(n),c=new Uint32Array(n);l.fill(0,0,t*32);let f=0;for(let[h,b]of this.commands){let y=f++*32;c[y]=h.aggregate.gpuSlot??this.gpu.gpuIndex(h.aggregate.index),c[y+1]=b.mask;for(let[v,B]of[["velocity",4],["angular",8],["impulse",12],["torque",16],["position",20],["rotation",24],["pointImpulse",28]])b[v]&&l.set(b[v],y+B)}this.commands.clear(),(!this.commandBuffer||this.commandBuffer.size<s)&&(this.commandBuffer?.destroy(),this.commandBuffer=this.device.createBuffer({size:Math.min(a,Math.max(s*2,128)),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})),this.device.queue.writeBuffer(this.commandBuffer,0,n,0,s),this.commandPipeline??=this.device.createComputePipeline({layout:"auto",compute:{module:this.device.createShaderModule({code:`const DISPATCH_STRIDE = ${this.device.limits.maxComputeWorkgroupsPerDimension*64}u;
${Pn}`,label:"AVBD body commands"}),entryPoint:"applyCommands"}}),(!this.commandBinding||this.boundCommandBody!==this.gpu.bodyBuffer||this.boundCommandBuffer!==this.commandBuffer||this.boundCommandBytes!==s)&&(this.commandBinding=this.device.createBindGroup({layout:this.commandPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.gpu.bodyBuffer}},{binding:1,resource:{buffer:this.commandBuffer,size:s}}]}),this.boundCommandBody=this.gpu.bodyBuffer,this.boundCommandBuffer=this.commandBuffer,this.boundCommandBytes=s);let u=e??this.device.createCommandEncoder(),d=u.beginComputePass();d.setPipeline(this.commandPipeline),d.setBindGroup(0,this.commandBinding);let p=Math.ceil(f/64),m=this.device.limits.maxComputeWorkgroupsPerDimension;d.dispatchWorkgroups(Math.min(p,m),Math.ceil(p/m)),d.end(),e||this.device.queue.submit([u.finish()]),this.lastCommandBatch={bodies:t,path:"aggregate-commands",uploadedBytes:s}}step(){this.initialize(),this.gpu.step(),this.steps++,this.contactWatch&&(this.contactWatch.run(this.gpu.contactStorage,this.gpu.manifoldCapacity,this.steps,this.ref.dt),this.contactListeners.size&&!this.contactPending&&this.readContactEvents().then(({events:e,dropped:t,full:i})=>{if(!this.disposed){(t||i)&&this.errors.push(`Contact event storage full: ${t} events dropped; increase maxContactEvents/maxContactPairs`);for(let r of e)for(let s of this.contactListeners)s(r)}}).catch(e=>{this.disposed||this.errors.push(e.message)})),this.syncEnabled&&!this.syncPending&&this.syncMeshes().catch(e=>this.errors.push(e.message)),this.steps%20===0&&!this.counterPending&&(this.counterPending=!0,this.gpu.readCounters().then(e=>{this.disposed||(this.counters=e,this.gpu.adapt(e),(e.overflow||e.clashes)&&this.errors.push(`Collision capacity/color conflict: ${JSON.stringify(e)}`))}).catch(e=>{this.disposed||this.errors.push(e.message)}).finally(()=>this.counterPending=!1))}async syncMeshes(){if(this.initialize(),this.flushCommands(),this.syncPending)return this.syncPending;let e=this.aggregates.filter(t=>t.sync&&!t.disposed);return this.syncPending=this.bodyReadback.read(this.bodyBuffer,e.map(t=>t.body.gpuIndex),!0).then(t=>{if(!this.disposed){for(let i=0;i<e.length;i++)e[i].disposed||e[i].syncPose(t,i*8);this.lastSyncBytes=t.byteLength}}).finally(()=>this.syncPending=null),this.syncPending}get bodyBuffer(){return this.initialize(),this.gpu.bodyBuffer}async readBodies(e){if(this.initialize(),this.flushCommands(),e){for(let t of e)if(t.aggregate.world!==this)throw Error("Selected bodies must belong to this world");return this.bodyReadback.read(this.bodyBuffer,e.map(t=>t.gpuIndex))}return this.gpu.readBodies()}dispose(){if(!this.disposed){this.disposed=!0,this.observer&&this.scene?.onBeforeRenderObservable.remove(this.observer),this.disposeObserver&&this.scene?.onDisposeObservable.remove(this.disposeObserver),this.scene&&yr.get(this.scene)===this&&yr.delete(this.scene),this.device.removeEventListener("uncapturederror",this.errorListener),this.gpu?.destroy(),this.contactWatch?.destroy(),this.sleepManager?.dispose(),this.commandBuffer?.destroy(),this.velocityBatch?.destroy(),this.angularVelocityBatch?.destroy(),this.motionBatch?.destroy(),this.bodyReadback.destroy(),this.commandData=this.velocityIndices=this.velocityValues=null,this.commandBinding=null;for(let e of this.aggregates)e.disposed=!0,e.body.disposed=!0;this.commands.clear(),this.contactListeners.clear();for(let e of this.constraints)e.disposed=!0;this.constraints.clear(),this.ownsDevice&&this.device.destroy()}}attachToScene(e=this.scene){if(this.assertAlive(),!e)throw Error("A Babylon scene is required");if(this.observer&&e===this.scene)return this;if(this.observer)throw Error("AVBD world is already attached to another scene");this.scene=e,this.disposeObserver=e.onDisposeObservable.addOnce(()=>this.dispose());let t=0;return this.observer=e.onBeforeRenderObservable.add(()=>{t+=Math.min(.05,e.getEngine().getDeltaTime()/1e3);for(let i=0;t>=this.ref.dt&&i<3;i++)this.step(),t-=this.ref.dt}),this}},ps=class{constructor(e,t,{mass:i=1,friction:r=.6,restitution:s=0,allowSleep:a,isTrigger:n=!1,sync:l=!0,group:c=4294967295,collidesWith:f=4294967295}={},u){if(u=u instanceof hs?u:yr.get(u??e.getScene()),!u)throw Error("Create an AVBD world for this scene before adding aggregates");if(u.assertAlive(),typeof t=="number"&&(t=[Xe.SPHERE,Xe.CAPSULE,Xe.CYLINDER,Xe.BOX,Xe.CONVEX_HULL][t]),ds(i,"mass",!0),ds(r,"friction",!0),!Number.isFinite(s)||s<0||s>1)throw Error("restitution must be between 0 and 1");if(e.parent)throw Error("AVBD aggregate meshes must have no parent; bake the parent transform first");if(!Object.values(Xe).includes(t))throw Error(`Unsupported AVBD shape: ${t}`);if(u.aggregates.length>=u.capacity)throw Error("AVBD body capacity exceeded");if(this.world=u,this.mesh=e,this.sync=l,this.type=t,a!==void 0&&typeof a!="boolean")throw Error("allowSleep must be a boolean");if(this.allowSleep=a??!0,typeof n!="boolean")throw Error("isTrigger must be a boolean");if(this.isTrigger=n,this.restitution=s,a===!0&&!u.sleepOptions&&u.enableSleeping(),this.group=Xi(c),this.collidesWith=Xi(f),u.gpu&&u.syncEnabled&&l&&u.aggregates.filter(g=>g.sync&&!g.disposed).length>=u.maxSyncedBodies)throw Error("For large scenes use syncMeshes:false and draw the GPU body buffer directly");if(![Xe.BOX,Xe.SPHERE,Xe.CAPSULE].includes(t)&&u.device.limits.maxStorageBuffersPerShaderStage<9)throw Error("Convex hull collisions require nine storage buffer bindings");e.computeWorldMatrix(!0),e.refreshBoundingInfo();let d=e.getBoundingInfo().boundingBox,p=e.scaling;if([p.x,p.y,p.z].some(g=>g<=0))throw Error("Bake negative or zero mesh scaling before creating an aggregate");let m=d.maximum.subtract(d.minimum).multiply(p),h=d.center.multiply(p),b=e.rotationQuaternion?.clone()||e.rotation.toQuaternion();this.localCenter=h,this.localRotation=b.constructor.Identity();let y;if(t===Xe.BOX)y=new De(u.ref,_e(m),1,r,[0,0,0]);else if(t===Xe.SPHERE){if(Math.max(m.x,m.y,m.z)-Math.min(m.x,m.y,m.z)>1e-4)throw Error("Sphere aggregate requires uniform dimensions");y=Mi(u.ref,m.x/2,1,r,[0,0,0])}else if(t===Xe.CAPSULE){if(Math.abs(m.x-m.z)>1e-4)throw Error("Capsule aggregate requires equal X and Z diameters; bake an upright Y-axis capsule mesh");y=Hi(u.ref,m.x/2,m.y,1,r,[0,0,0])}else{let g=e.getVerticesData("position");if(!g)throw Error("Hull aggregate requires mesh positions");let A=Float32Array.from(g,(w,E)=>w*[p.x,p.y,p.z][E%3]),x=or(A);if(!x)throw Error("Hull aggregate requires a closed shape with nonzero volume");this.localCenter=new e.position.constructor(...x.center),this.localRotation=b.constructor.FromArray(x.rotation),y=Gr(u.ref,x,1,r,[0,0,0])}let v=i/y.mass;y.mass=i,y.moment.forEach((g,A)=>y.moment[A]=g*v);let B=e.position.add(this.localCenter.applyRotationQuaternion(b));if(y.positionLin.set(_e(B)),y.positionAng.set(b.multiply(this.localRotation).asArray()),this.rigid=y,this.index=u.aggregates.length,this.body=new ms(this),u.aggregates.push(this),e.rotationQuaternion=b,u.gpu){if(this.gpuSlot=u.gpu.addBody(y),this.gpuSlot<0)throw Error("AVBD body capacity exceeded");u.byGpuIndex.set(this.gpuSlot,this.body),u.gpu.setFilters([this.gpuSlot],[this.group],[this.collidesWith]),(this.isTrigger||u.gpu.sensorsEnabled)&&u.gpu.setSensor(this.gpuSlot,this.isTrigger),this.restitution>0&&u.gpu.setRestitution(this.gpuSlot,this.restitution),u.contactWatch?.setWatched([this.gpuSlot],[!0]),u.sleepManager?.register(this.gpuSlot,y.mass,this.allowSleep),u.wakeAll?.()}}syncPose(e,t){let i=t??this.body.gpuIndex*40,r=this.localRotation.constructor.FromArray(e,i+4).multiply(this.localRotation.conjugate());this.mesh.rotationQuaternion.copyFrom(r),this.mesh.position.copyFrom(new this.mesh.position.constructor(...e.subarray(i,i+3)).subtract(this.localCenter.applyRotationQuaternion(r)))}dispose(){if(this.disposed)return;let e=this.world;for(let t of[...e.constraints])(t.bodyA===this.body||t.bodyB===this.body)&&t.dispose();if(e.gpu){let t=this.body.gpuIndex;e.queue(this.body,16,"velocity",[0,0,0]),e.gpu.setFilters([t],[0],[0]),e.gpu.setRestitution(t,0)}this.rigid.mass=0,this.rigid.moment.fill(0),this.sync=!1,this.disposed=this.body.disposed=!0,e.sleepManager?.register(this.gpuSlot??e.gpu?.gpuIndex(this.index)??this.index,0),e.wakeAll?.()}},ms=class{constructor(e){this.aggregate=e}assertAlive(){if(this.disposed||this.aggregate.disposed)throw Error("AVBD body is disposed")}get gpuIndex(){this.assertAlive();let e=this.aggregate.world;return e.initialize(),this.aggregate.gpuSlot??e.gpu.gpuIndex(this.aggregate.index)}setLinearVelocity(e){return this.aggregate.world.queue(this,1,"velocity",e),this}setAngularVelocity(e){return this.aggregate.world.queue(this,2,"angular",e),this}applyImpulse(e,t){let i=t?_e(t):null;if(i&&(i.length!==3||!i.every(Number.isFinite)))throw Error("Impulse point requires three finite components");let r=this.aggregate.world,s=_e(e),a=r.commands.get(this),n=s.map((c,f)=>c+(a?.impulse?.[f]||0)),l=r.queue(this,4,"impulse",n);if(t){let c=[i[1]*s[2]-i[2]*s[1],i[2]*s[0]-i[0]*s[2],i[0]*s[1]-i[1]*s[0]],f=l.torque||[0,0,0];l.torque=_e(c).map((u,d)=>u+f[d]),l.pointImpulse=s.map((u,d)=>u+(l.pointImpulse?.[d]||0))}return this}applyAngularImpulse(e){let t=this.aggregate.world,i=t.commands.get(this)?.torque||[0,0,0];return t.queue(this,4,"torque",_e(e).map((r,s)=>r+i[s])),this}applyForce(e,t){return this.applyImpulse(_e(e).map(i=>i*this.aggregate.world.ref.dt),t)}applyTorque(e){return this.applyAngularImpulse(_e(e).map(t=>t*this.aggregate.world.ref.dt))}setCollisionGroups(e,t=4294967295){this.assertAlive();let i=this.aggregate,r=Xi(e),s=Xi(t);return i.group=r,i.collidesWith=s,i.world.gpu&&i.world.gpu.setFilters([this.gpuIndex],[i.group],[i.collidesWith]),i.world.wakeAll?.(),this}setTrigger(e){if(this.assertAlive(),typeof e!="boolean")throw Error("isTrigger must be a boolean");let t=this.aggregate;return t.isTrigger=e,t.world.gpu&&t.world.gpu.setSensor(this.gpuIndex,e),t.world.wakeAll(),this}setRestitution(e){if(this.assertAlive(),!Number.isFinite(e)||e<0||e>1)throw Error("restitution must be between 0 and 1");let t=this.aggregate;return t.restitution=e,t.world.gpu&&t.world.gpu.setRestitution(this.gpuIndex,e),t.world.wakeAll(),this}async readState(){let e=await this.aggregate.world.readBodies([this]),t=this.aggregate.rigid.mass;return{position:Array.from(e.subarray(0,3)),rotation:Array.from(e.subarray(4,8)),linearVelocity:Array.from(e.subarray(32,35)),angularVelocity:Array.from(e.subarray(36,39)),mass:t,effectiveMass:e[19],sleeping:t>0&&e[19]===0}}wakeUp(){return this.assertAlive(),this.aggregate.world.wakeAll(),this}setSleepEnabled(e){if(this.assertAlive(),typeof e!="boolean")throw Error("Sleep eligibility must be a boolean");let t=this.aggregate,i=t.world;return t.allowSleep=e,e&&!i.sleepOptions&&i.enableSleeping(),i.gpu&&i.sleepManager?.register(this.gpuIndex,t.rigid.mass,e),i.wakeAll(),this}teleport(e,t=this.aggregate.mesh.rotationQuaternion){let i=t.clone().normalize(),r=this.aggregate;return r.world.queue(this,8,"position",_e(e.add(r.localCenter.applyRotationQuaternion(i)))),r.world.queue(this,8,"rotation",i.multiply(r.localRotation).asArray()),this}};var pi=class{solver;bodyA;bodyB;J=new Float64Array(12);H=new Float64Array(36);C=new Float64Array(4);fmin=new Float64Array(4).fill(-1/0);fmax=new Float64Array(4).fill(1/0);stiffness=new Float64Array(4).fill(1/0);fracture=new Float64Array(4).fill(1/0);penalty=new Float64Array(4);lambda=new Float64Array(4);constructor(e,t,i){this.solver=e,this.bodyA=t,this.bodyB=i,e.forces.push(this),t?.forces.push(this),i.forces.push(this)}destroy(){let e=this.solver.forces,t=e.indexOf(this);t>=0&&e.splice(t,1),this.unlinkFromBodies()}unlinkFromBodies(){for(let e of[this.bodyA,this.bodyB]){if(!e)continue;let t=e.forces.indexOf(this);t>=0&&e.forces.splice(t,1)}}disable(){this.stiffness.fill(0),this.penalty.fill(0),this.lambda.fill(0)}};var _n=o=>o<0?-1:o>0?1:0,Yi=(o,e)=>o<e?o:e,yc=(o,e)=>o>e?o:e,Qi=(o,e,t)=>yc(e,Yi(t,o));function vr(o,e,t){let i=Math.cos(o),r=Math.sin(o);return[i*e-r*t,r*e+i*t]}function mi(o,e,t){let i=Math.cos(o[2]),r=Math.sin(o[2]);return[i*e-r*t+o[0],r*e+i*t+o[1]]}function _t(o,e,t,i,r){o[e*3]=t,o[e*3+1]=i,o[e*3+2]=r}var bs=class extends pi{rA;rB;C0=new Float64Array(3);torqueArm;restAngle;constructor(e,t,i,r,s,a=[1/0,1/0,1/0],n=1/0){super(e,t,i),this.rA=[r[0],r[1]],this.rB=[s[0],s[1]],this.stiffness[0]=a[0],this.stiffness[1]=a[1],this.stiffness[2]=a[2],this.fmax[2]=n,this.fmin[2]=-n,this.fracture[2]=n,this.restAngle=(t?t.position[2]:0)-i.position[2];let l=(t?t.size[0]:0)+i.size[0],c=(t?t.size[1]:0)+i.size[1];this.torqueArm=l*l+c*c}rows(){return 3}evaluate(e){let t=this.bodyA?mi(this.bodyA.position,this.rA[0],this.rA[1]):this.rA,i=mi(this.bodyB.position,this.rB[0],this.rB[1]);e[0]=t[0]-i[0],e[1]=t[1]-i[1],e[2]=((this.bodyA?this.bodyA.position[2]:0)-this.bodyB.position[2]-this.restAngle)*this.torqueArm}initialize(){return this.evaluate(this.C0),this.stiffness[0]!==0||this.stiffness[1]!==0||this.stiffness[2]!==0}Cn=new Float64Array(3);computeConstraint(e){this.evaluate(this.Cn);for(let t=0;t<3;t++)this.C[t]=this.stiffness[t]===1/0?this.Cn[t]-this.C0[t]*e:this.Cn[t]}computeDerivatives(e){let{J:t,H:i}=this;if(i.fill(0,0,27),e===this.bodyA){let r=vr(e.position[2],this.rA[0],this.rA[1]);_t(t,0,1,0,-r[1]),_t(t,1,0,1,r[0]),_t(t,2,0,0,this.torqueArm),i[8]=-r[0],i[17]=-r[1]}else{let r=vr(e.position[2],this.rB[0],this.rB[1]);_t(t,0,-1,0,r[1]),_t(t,1,0,-1,-r[0]),_t(t,2,0,0,-this.torqueArm),i[8]=r[0],i[17]=r[1]}}},gs=class extends pi{rA;rB;rest;constructor(e,t,i,r,s,a,n=-1){if(super(e,t,i),this.rA=[r[0],r[1]],this.rB=[s[0],s[1]],this.stiffness[0]=a,this.rest=n,this.rest<0){let l=mi(t.position,r[0],r[1]),c=mi(i.position,s[0],s[1]);this.rest=Math.hypot(l[0]-c[0],l[1]-c[1])}}rows(){return 1}initialize(){return!0}delta(){let e=mi(this.bodyA.position,this.rA[0],this.rA[1]),t=mi(this.bodyB.position,this.rB[0],this.rB[1]);return[e[0]-t[0],e[1]-t[1]]}computeConstraint(){let e=this.delta();this.C[0]=Math.hypot(e[0],e[1])-this.rest}computeDerivatives(e){let t=this.delta(),i=t[0]*t[0]+t[1]*t[1];if(i===0)return;let r=Math.sqrt(i),s=t[0]/r,a=t[1]/r,n=(1-s*s)/r,l=(0-s*a)/r,c=(0-a*s)/r,f=(1-a*a)/r,u=e===this.bodyA,d=u?this.rA:this.rB,p=vr(e.position[2],-d[1],d[0]),m=vr(e.position[2],d[0],d[1]),h=n*p[0]+l*p[1],b=c*p[0]+f*p[1],y=s*m[0]+a*m[1],v=s*p[0]+a*p[1];u?_t(this.J,0,s,a,v):_t(this.J,0,-s,-a,-v);let B=u?-y-y:y+y,g=this.H;g[0]=n,g[1]=l,g[2]=h,g[3]=c,g[4]=f,g[5]=b,g[6]=h,g[7]=b,g[8]=B}},ys=class extends pi{rows(){return 0}initialize(){return!0}computeConstraint(){}computeDerivatives(){}},vs=class extends pi{speed;constructor(e,t,i,r,s){super(e,t,i),this.speed=r,this.fmax[0]=s,this.fmin[0]=-s}rows(){return 1}initialize(){return!0}computeConstraint(){let e=this.bodyA?this.bodyA.position[2]-this.bodyA.initial[2]:0,t=this.bodyB.position[2]-this.bodyB.initial[2];this.C[0]=e-t-this.speed*this.solver.dt}computeDerivatives(e){_t(this.J,0,0,0,e===this.bodyA?1:-1),this.H.fill(0,0,9)}};var xs=()=>({dt:1/60,gravity:-10,iterations:10,beta:1e5,alpha:.99,gamma:.99,postStabilize:!0,stiffnessRescale:!1,vbd:!1,vbdStiffness:1e6,matchNearest:!1}),As=()=>({...xs(),postStabilize:!1,alpha:.95,matchNearest:!0});var Ki=(o,e)=>o>e?o*2097152+e:e*2097152+o;function vc(o,e,t){let i=0,r=e;for(;i<r;){let s=i+r>>>1;o[s]<t?i=s+1:r=s}return i}function Qo(o,e,t){let i=vc(o,e,t);return i<e&&o[i]===t}var ws=class{cellSize=1;pairs=new Float64Array(1024);pairCount=0;configuredFor=-1;large=new Int32Array(0);isLarge=new Uint8Array(0);cellX=new Int32Array(0);cellY=new Int32Array(0);tableSize=0;bucketStart=new Int32Array(0);sorted=new Int32Array(0);configure(e,t){this.configuredFor=e;let i=Float64Array.from({length:e},(n,l)=>t[l*4+1]).sort(),r=e>0?i[e>>1]:1,s=0;for(let n=0;n<e;n++)i[n]<=4*r&&(s=Math.max(s,i[n]));this.cellSize=Math.max(2*s,.001),this.isLarge=new Uint8Array(e);let a=[];for(let n=0;n<e;n++)t[n*4+1]>s&&(this.isLarge[n]=1,a.push(n));for(this.large=Int32Array.from(a),this.cellX=new Int32Array(e),this.cellY=new Int32Array(e),this.tableSize=1;this.tableSize<2*e;)this.tableSize<<=1;this.bucketStart=new Int32Array(this.tableSize+1),this.sorted=new Int32Array(e)}hash(e,t){return(Math.imul(e,73856093)^Math.imul(t,19349663))&this.tableSize-1}findPairs(e,t,i,r,s,a){e!==this.configuredFor&&this.configure(e,i),this.pairCount=0;let{cellX:n,cellY:l,isLarge:c,bucketStart:f,sorted:u}=this,d=1/this.cellSize;f.fill(0);for(let h=0;h<e;h++)c[h]||(n[h]=Math.floor(t[h*4]*d),l[h]=Math.floor(t[h*4+1]*d),f[this.hash(n[h],l[h])+1]++);for(let h=0;h<this.tableSize;h++)f[h+1]+=f[h];let p=f.slice(0,this.tableSize);for(let h=0;h<e;h++)c[h]||(u[p[this.hash(n[h],l[h])]++]=h);let m=(h,b)=>{if(!r[h]&&!r[b])return;let y=t[h*4]-t[b*4],v=t[h*4+1]-t[b*4+1],B=i[h*4+1]+i[b*4+1];if(y*y+v*v>B*B)return;let g=Ki(h,b);if(!Qo(s,a,g)){if(this.pairCount===this.pairs.length){let A=new Float64Array(this.pairs.length*2);A.set(this.pairs),this.pairs=A}this.pairs[this.pairCount++]=g}};for(let h=0;h<e;h++){if(c[h])continue;let b=n[h],y=l[h];for(let v=-1;v<=1;v++)for(let B=-1;B<=1;B++){let g=this.hash(b+B,y+v);for(let A=f[g];A<f[g+1];A++){let x=u[A];x>=h||n[x]!==b+B||l[x]!==y+v||m(h,x)}}}for(let h of this.large)for(let b=0;b<e;b++)b===h||c[b]&&b>h||m(h,b);this.pairs.subarray(0,this.pairCount).sort()}};var Ye=new Float64Array(12),En=new Float64Array(12),bi=new Float64Array(12);function yt(o,e,t,i,r,s,a,n){let l=e*6;o[l]=t,o[l+1]=i,o[l+2]=r,o[l+3]=s,o[l+4]=a,o[l+5]=n}function zn(o,e,t,i,r,s){let a=0,n=t*e[0]+i*e[1]-r,l=t*e[6]+i*e[7]-r;if(n<=0){for(let c=0;c<6;c++)o[a*6+c]=e[c];a++}if(l<=0){for(let c=0;c<6;c++)o[a*6+c]=e[6+c];a++}if(n*l<0){let c=n/(n-l),f=e[0]+(e[6]-e[0])*c,u=e[1]+(e[7]-e[1])*c;n>0?yt(o,a,f,u,s,e[3],0,e[5]):yt(o,a,f,u,e[8],s,e[10],0),a++}return a}function Bs(o,e,t,i,r,s,a,n){let l=-(r*a+s*n),c=-(-s*a+r*n);Math.abs(l)>Math.abs(c)?l>0?(yt(Ye,0,o,-e,0,0,3,4),yt(Ye,1,o,e,0,0,4,1)):(yt(Ye,0,-o,e,0,0,1,2),yt(Ye,1,-o,-e,0,0,2,3)):c>0?(yt(Ye,0,o,e,0,0,4,1),yt(Ye,1,-o,e,0,0,1,2)):(yt(Ye,0,-o,-e,0,0,2,3),yt(Ye,1,o,-e,0,0,3,4));for(let f=0;f<2;f++){let u=f*6,d=Ye[u],p=Ye[u+1];Ye[u]=t+r*d-s*p,Ye[u+1]=i+s*d+r*p}}function Mn(o,e,t,i,r,s,a,n,l,c,f){let u=Math.cos(t),d=Math.sin(t),p=Math.cos(n),m=Math.sin(n),h=s-o,b=a-e,y=u*h+d*b,v=-d*h+u*b,B=p*h+m*b,g=-m*h+p*b,A=Math.abs(u*p+d*m),x=Math.abs(u*-m+d*p),w=Math.abs(-d*p+u*m),E=Math.abs(-d*-m+u*p),k=Math.abs(y)-i-(A*l+x*c),z=Math.abs(v)-r-(w*l+E*c);if(k>0||z>0)return 0;let M=Math.abs(B)-(A*i+w*r)-l,P=Math.abs(g)-(x*i+E*r)-c;if(M>0||P>0)return 0;let _=0,C=k,S=y>0?u:-u,R=y>0?d:-d;z>.95*C+.01*r&&(_=1,C=z,S=v>0?-d:d,R=v>0?u:-u),M>.95*C+.01*l&&(_=2,C=M,S=B>0?p:-p,R=B>0?m:-m),P>.95*C+.01*c&&(_=3,C=P,S=g>0?-m:m,R=g>0?p:-p);let I,O,q,G,j,F,H,ee,le;if(_===0){I=S,O=R,q=o*I+e*O+i,G=-d,j=u;let U=o*G+e*j;F=-U+r,H=U+r,ee=3,le=1,Bs(l,c,s,a,p,m,I,O)}else if(_===1){I=S,O=R,q=o*I+e*O+r,G=u,j=d;let U=o*G+e*j;F=-U+i,H=U+i,ee=2,le=4,Bs(l,c,s,a,p,m,I,O)}else if(_===2){I=-S,O=-R,q=s*I+a*O+l,G=-m,j=p;let U=s*G+a*j;F=-U+c,H=U+c,ee=3,le=1,Bs(i,r,o,e,u,d,I,O)}else{I=-S,O=-R,q=s*I+a*O+c,G=p,j=m;let U=s*G+a*j;F=-U+l,H=U+l,ee=2,le=4,Bs(i,r,o,e,u,d,I,O)}if(zn(En,Ye,-G,-j,F,ee)<2||zn(bi,En,G,j,H,le)<2)return 0;let xe=0;for(let U=0;U<2;U++){let ze=U*6,Me=bi[ze],ce=bi[ze+1],Ne=I*Me+O*ce-q;if(Ne>0)continue;let zt=Me-I*Ne,Ie=ce-O*Ne,qe=bi[ze+2],Re=bi[ze+3],Ve=bi[ze+4],et=bi[ze+5],Ai,wi,Bi,Ci;_>=2?([qe,Re,Ve,et]=[Ve,et,qe,Re],Ai=Me-o,wi=ce-e,Bi=zt-s,Ci=Ie-a):(Ai=zt-o,wi=Ie-e,Bi=Me-s,Ci=ce-a);let At=xe*7;f[At+0]=qe&255|(Re&255)<<8|(Ve&255)<<16|(et&255)<<24,f[At+1]=u*Ai+d*wi,f[At+1+1]=-d*Ai+u*wi,f[At+3]=p*Bi+m*Ci,f[At+3+1]=-m*Bi+p*Ci,f[At+5]=-S,f[At+5+1]=-R,xe++}return xe}var In=o=>31-Math.clz32(o&-o);function xc(o){let e=o+2654435769;return e^=e>>>16,e=Math.imul(e,2146121005),e^=e>>>15,e=Math.imul(e,2221713035),e^=e>>>16,e>>>0}var Ko=(o,e,t,i)=>o>t||o===t&&e>i,Cs=class{colors=new Int32Array(0);colorStart=new Int32Array(65);colorBodies=new Int32Array(0);next=new Int32Array(0);pending=new Uint8Array(0);prio=new Uint32Array(0);resize(e){if(this.colors.length===e)return;let t=new Int32Array(e).fill(-1);t.set(this.colors.subarray(0,Math.min(e,this.colors.length))),this.colors=t,this.next=new Int32Array(e),this.pending=new Uint8Array(e),this.colorBodies=new Int32Array(e),this.prio=Uint32Array.from({length:e},(i,r)=>xc(r))}run(e,t,i,r,s,a){this.resize(e);let{colors:n,next:l,pending:c,prio:f}=this,u=(g,A)=>{let x=s[g*4+1],w=x===A?s[g*4+2]:x;return w>=0&&t[w]?w:-1},d=(g,A)=>{let x=0,w=0;for(let E=i[g];E<i[g+1];E++){let k=u(r[E],g);if(k<0||A&&c[k])continue;let z=n[k];z<0||(z<32?x|=1<<z:w|=1<<z-32)}return~x!==0?In(~x):~w!==0?32+In(~w):63};for(let g=0;g<e;g++){if(l[g]=n[g],!t[g]||n[g]<0)continue;let A=!0;for(let x=i[g];x<i[g+1]&&A;x++){let w=u(r[x],g);w>=0&&!Ko(f[g],g,f[w],w)&&(A=!1)}A&&(l[g]=Math.min(n[g],d(g,!1)))}n.set(l);let p=()=>{let g=0;for(let A=0;A<e;A++)if(c[A]=0,!!t[A]){if(n[A]<0)c[A]=1;else for(let x=i[A];x<i[A+1];x++){let w=u(r[x],A);if(w>=0&&n[w]===n[A]&&Ko(f[w],w,f[A],A)){c[A]=1;break}}g+=c[A]}return g},m=p(),h=0;for(;m>0&&h<a;){h++;for(let g=0;g<e;g++){if(l[g]=-2,!c[g])continue;let A=!0;for(let x=i[g];x<i[g+1]&&A;x++){let w=u(r[x],g);w>=0&&c[w]&&!Ko(f[g],g,f[w],w)&&(A=!1)}A&&(l[g]=d(g,!0))}for(let g=0;g<e;g++)l[g]!==-2&&(n[g]=l[g],c[g]=0,m--)}let b=0;if(m>0){for(let g=0;g<e;g++)c[g]&&n[g]<0&&(n[g]=0);b=p()}let y=this.colorStart;y.fill(0);let v=0;for(let g=0;g<e;g++)t[g]&&(y[n[g]+1]++,v=Math.max(v,n[g]+1));for(let g=0;g<64;g++)y[g+1]+=y[g];let B=y.slice(0,64);for(let g=0;g<e;g++)t[g]&&(this.colorBodies[B[n[g]]++]=g);return{numColors:v,conflicts:b,rounds:h}}};var Dn=0,Qt=1,Gn=2,Ss=3,Zo=4,Fn=[0,3,1,1,2],Cc=.05,D=4,T=32,ge=0,ne=3,$=6,ft=9,dt=12,gi=15,at=18,W=21,K=23,ye=25,Ee=26,vt=27,xr=28,ks=class{params=xs();options;bodyCount=0;pose;initial;inertial;velocity;prevVelocity;shape;props;dynamic=new Uint8Array(0);jointCount=0;contactCount=0;info=new Int32Array(0);data;handles=[];prevCount=0;prevKeys=new Float64Array(0);prevInfo=new Int32Array(0);prevData=new Float64Array(0);ignorePairs=[];noCollide=new Float64Array(0);noCollideCount=0;noCollideDirty=!0;adjStart=new Int32Array(1);adjList=new Int32Array(0);broadphase=new ws;coloring=new Cs;numColors=0;colorConflicts=0;colorRounds=0;profiling=!1;profile={};phaseStart=0;contactOut=new Float64Array(14);dxBuf=new Float64Array(0);constructor(e={}){this.options={precision:"f32",order:"colored",colorRounds:32,...e},this.pose=this.real(0),this.initial=this.real(0),this.inertial=this.real(0),this.velocity=this.real(0),this.prevVelocity=this.real(0),this.shape=this.real(0),this.props=this.real(0),this.data=this.real(0)}real(e){return this.options.precision==="f32"?new Float32Array(e):new Float64Array(e)}grow(e,t){if(e.length>=t)return e;let i=new e.constructor(Math.max(t,e.length*2,16));return i.set(e),i}clear(){this.bodyCount=0,this.jointCount=0,this.contactCount=0,this.prevCount=0,this.handles=[],this.ignorePairs=[],this.noCollideDirty=!0,this.coloring.resize(0)}addBody(e,t,i,r,s=[0,0,0]){let a=this.bodyCount++,n=this.bodyCount*4;this.pose=this.grow(this.pose,n),this.initial=this.grow(this.initial,n),this.inertial=this.grow(this.inertial,n),this.velocity=this.grow(this.velocity,n),this.prevVelocity=this.grow(this.prevVelocity,n),this.shape=this.grow(this.shape,n),this.props=this.grow(this.props,n),this.dynamic=this.grow(this.dynamic,this.bodyCount);let l=e[0]*e[1]*t;return this.pose.set([r[0],r[1],r[2]??0,0],a*4),this.velocity.set([s[0],s[1],s[2]??0,0],a*4),this.prevVelocity.set(this.velocity.subarray(a*4,a*4+4),a*4),this.shape.set([e[0],e[1],l,l*(e[0]*e[0]+e[1]*e[1])/12],a*4),this.props.set([i,Math.hypot(e[0]*.5,e[1]*.5),0,0],a*4),this.dynamic[a]=l>0?1:0,a}allocConstraint(){let e=this.jointCount++,t=this.jointCount+this.contactCount;this.info=this.grow(this.info,t*D),this.data=this.grow(this.data,t*T),this.contactCount>0&&(this.info.copyWithin((e+1)*D,e*D,(t-1)*D),this.data.copyWithin((e+1)*T,e*T,(t-1)*T)),this.data.fill(0,e*T,e*T+T);for(let i=0;i<3;i++)this.data[e*T+$+i]=1/0,this.data[e*T+ft+i]=-1/0,this.data[e*T+dt+i]=1/0,this.data[e*T+gi+i]=1/0;return this.handles[e]=null,this.noCollideDirty=!0,e}setInfo(e,t,i,r){this.info.set([t,i,r,0],e*D)}addJoint(e,t,i,r,s=[1/0,1/0,1/0],a=1/0){let n=this.allocConstraint();this.setInfo(n,Qt,e,t);let l=this.data,c=n*T;l.set(s,c+$),l[c+dt+2]=a,l[c+ft+2]=-a,l[c+gi+2]=a,l.set(i,c+W),l.set(r,c+K),l[c+ye]=(e>=0?this.pose[e*4+2]:0)-this.pose[t*4+2];let f=(e>=0?this.shape[e*4]:0)+this.shape[t*4],u=(e>=0?this.shape[e*4+1]:0)+this.shape[t*4+1];l[c+Ee]=f*f+u*u;let d={slot:n,alive:!0};return this.handles[n]=d,d}setJointWorldAnchor(e,t,i){e.alive&&(this.data[e.slot*T+W]=t,this.data[e.slot*T+W+1]=i)}removeJoint(e){e.alive&&(this.disable(e.slot),e.alive=!1)}addSpring(e,t,i,r,s,a){let n=this.allocConstraint();this.setInfo(n,Gn,e,t);let l=n*T;this.data[l+$]=s,this.data.set(i,l+W),this.data.set(r,l+K),this.data[l+ye]=a}addMotor(e,t,i,r){let s=this.allocConstraint();this.setInfo(s,Ss,e,t);let a=s*T;this.data[a+dt]=r,this.data[a+ft]=-r,this.data[a+ye]=i}ignoredPairs(){return this.ignorePairs}addIgnoreCollision(e,t){this.ignorePairs.push(Ki(e,t)),this.noCollideDirty=!0}loadFromReference(e){this.clear();let t=Object.keys(xs());Object.assign(this.params,Object.fromEntries(t.map(r=>[r,e[r]])));let i=new Map(e.bodies.map((r,s)=>[r,s]));for(let r of e.bodies){let s=this.addBody(r.size,0,r.friction,r.position,r.velocity);this.shape[s*4+2]=r.mass,this.shape[s*4+3]=r.moment,this.dynamic[s]=r.mass>0?1:0}for(let r of e.forces){let s=r.bodyA?i.get(r.bodyA):-1,a=i.get(r.bodyB);if(r instanceof bs){let n=this.addJoint(s,a,r.rA,r.rB,[r.stiffness[0],r.stiffness[1],r.stiffness[2]],r.fracture[2]);this.data[n.slot*T+ye]=r.restAngle,this.data[n.slot*T+Ee]=r.torqueArm}else r instanceof gs?this.addSpring(s,a,r.rA,r.rB,r.stiffness[0],r.rest):r instanceof vs?this.addMotor(s,a,r.speed,r.fmax[0]):r instanceof ys&&this.addIgnoreCollision(s,a)}}step(){let e=this.params,t=e.postStabilize&&!e.vbd,i=e.vbd?0:e.alpha;this.phaseStart=this.profiling?performance.now():0,this.saveContacts(),this.findPairs(),this.mark("broadphase"),this.initJoints(),this.narrowphase(),this.mark("narrowphase"),this.warmStartConstraints(t,i),this.buildAdjacency(),this.mark("adjacency"),this.colorBodies(),this.mark("coloring"),this.warmStartBodies();let r=e.iterations+(t?1:0);for(let s=0;s<r;s++){let a=t?s<e.iterations?1:0:i;this.primal(a),this.mark("primal"),s<e.iterations&&this.dual(a),s===e.iterations-1&&this.updateVelocities(),this.mark("dual")}t&&this.refreshStick()}mark(e){if(!this.profiling)return;let t=performance.now();this.profile[e]=(this.profile[e]??0)+t-this.phaseStart,this.phaseStart=t}resetProfile(){for(let e of Object.keys(this.profile))delete this.profile[e]}saveContacts(){let e=this.contactCount,t=this.jointCount;this.prevKeys.length<e&&(this.prevKeys=new Float64Array(e*2),this.prevInfo=new Int32Array(e*2*D),this.prevData=new Float64Array(e*2*T));for(let i=0;i<e;i++){let r=t+i;this.prevKeys[i]=Ki(this.info[r*D+1],this.info[r*D+2])}this.prevInfo.set(this.info.subarray(t*D,(t+e)*D)),this.prevData.set(this.data.subarray(t*T,(t+e)*T)),this.prevCount=e,this.contactCount=0}findPairs(){if(this.noCollideDirty){let e=[...this.ignorePairs];for(let t=0;t<this.jointCount;t++){let i=this.info[t*D+1],r=this.info[t*D+2];this.info[t*D]!==Dn&&i>=0&&e.push(Ki(i,r))}this.noCollide=Float64Array.from(e).sort(),this.noCollideCount=e.length,this.noCollideDirty=!1}this.broadphase.findPairs(this.bodyCount,this.pose,this.props,this.dynamic,this.noCollide,this.noCollideCount)}initJoints(){let{info:e,data:t,pose:i}=this,r=0;for(let s=0;s<this.jointCount;s++){let a=s*T;if(e[s*D]===Qt){if(t[a+$]===0&&t[a+$+1]===0&&t[a+$+2]===0){let f=this.handles[s];f&&(f.alive=!1);continue}let l=e[s*D+1],c=e[s*D+2];this.jointC(l,c,a,i,t,a+at)}r!==s&&(e.copyWithin(r*D,s*D,(s+1)*D),t.copyWithin(r*T,a,a+T),this.handles[r]=this.handles[s],this.handles[r]&&(this.handles[r].slot=r)),r++}if(r!==this.jointCount){for(let s=r;s<this.jointCount;s++)this.handles[s]=null;this.jointCount=r,this.noCollideDirty=!0}}jointC(e,t,i,r,s,a,n=s){let l,c,f;if(e>=0){let h=Math.cos(r[e*4+2]),b=Math.sin(r[e*4+2]),y=s[i+W],v=s[i+W+1];l=h*y-b*v+r[e*4],c=b*y+h*v+r[e*4+1],f=r[e*4+2]}else l=s[i+W],c=s[i+W+1],f=0;let u=Math.cos(r[t*4+2]),d=Math.sin(r[t*4+2]),p=s[i+K],m=s[i+K+1];n[a]=l-(u*p-d*m+r[t*4]),n[a+1]=c-(d*p+u*m+r[t*4+1]),n[a+2]=(f-r[t*4+2]-s[i+ye])*s[i+Ee]}narrowphase(){let{pose:e,shape:t,props:i}=this,r=this.broadphase.pairs,s=this.contactOut;for(let a=0;a<this.broadphase.pairCount;a++){let n=r[a],l=Math.floor(n/2097152),c=n-l*2097152,f=Mn(e[l*4],e[l*4+1],e[l*4+2],t[l*4]*.5,t[l*4+1]*.5,e[c*4],e[c*4+1],e[c*4+2],t[c*4]*.5,t[c*4+1]*.5,s);if(f===0)continue;let u=0,d=this.prevCount;for(;u<d;){let h=u+d>>>1;this.prevKeys[h]<n?u=h+1:d=h}let p=u,m=Math.sqrt(i[l*4]*i[c*4]);for(let h=0;h<f;h++){let b=this.jointCount+this.contactCount++;this.info=this.grow(this.info,(b+1)*D),this.data=this.grow(this.data,(b+1)*T);let y=this.data,v=b*T,B=h*7,g=s[B+0];this.info.set([Zo,l,c,g],b*D),y.fill(0,v,v+T),y[v+$]=y[v+$+1]=1/0,y[v+ft]=-1/0,y[v+dt]=0,y[v+gi]=y[v+gi+1]=1/0,y[v+W]=s[B+1],y[v+W+1]=s[B+1+1],y[v+K]=s[B+3],y[v+K+1]=s[B+3+1],y[v+ye]=m,y[v+Ee]=s[B+5],y[v+vt]=s[B+5+1];let A=-1;for(let C=p;C<this.prevCount&&this.prevKeys[C]===n;C++)this.prevInfo[C*D+3]===g&&(A=C);if(A<0&&this.params.matchNearest){let C=Cc*Math.min(t[l*4],t[l*4+1],t[c*4],t[c*4+1]);for(let S=p;S<this.prevCount&&this.prevKeys[S]===n;S++){let R=Math.hypot(this.prevData[S*T+W]-y[v+W],this.prevData[S*T+W+1]-y[v+W+1]);R<=C&&(C=R,A=S)}}if(A>=0){let C=A*T;y[v+ge]=this.prevData[C+ge],y[v+ge+1]=this.prevData[C+ge+1],y[v+ne]=this.prevData[C+ne],y[v+ne+1]=this.prevData[C+ne+1],this.prevData[C+xr]&&(y[v+W]=this.prevData[C+W],y[v+W+1]=this.prevData[C+W+1],y[v+K]=this.prevData[C+K],y[v+K+1]=this.prevData[C+K+1])}let[x,w]=Yt(e[l*4+2],y[v+W],y[v+W+1]),[E,k]=Yt(e[c*4+2],y[v+K],y[v+K+1]),z=y[v+Ee],M=y[v+vt],P=e[l*4]+x-e[c*4]-E,_=e[l*4+1]+w-e[c*4+1]-k;y[v+at]=z*P+M*_+5e-4,y[v+at+1]=M*P-z*_}}}warmStartConstraints(e,t){let i=this.params,r=this.data,s=this.jointCount+this.contactCount;for(let a=0;a<s;a++){let n=Fn[this.info[a*D]],l=a*T;for(let c=0;c<n;c++){if(i.vbd){r[l+ge+c]=Yi(r[l+$+c],i.vbdStiffness);continue}e||(r[l+ne+c]=r[l+ne+c]*t*i.gamma),r[l+ge+c]=Yi(Qi(r[l+ge+c]*i.gamma,1,1e9),r[l+$+c])}}}prepareTopology(){this.buildAdjacency(),this.colorBodies()}buildAdjacency(){let e=this.bodyCount,t=this.jointCount+this.contactCount;this.adjStart=this.grow(this.adjStart,e+1),this.adjList=this.grow(this.adjList,t*2);let i=this.adjStart;i.fill(0,0,e+1);for(let s=0;s<t;s++)for(let a=1;a<=2;a++){let n=this.info[s*D+a];n>=0&&this.dynamic[n]&&i[n+1]++}for(let s=0;s<e;s++)i[s+1]+=i[s];let r=i.slice(0,e);for(let s=0;s<t;s++)for(let a=1;a<=2;a++){let n=this.info[s*D+a];n>=0&&this.dynamic[n]&&(this.adjList[r[n]++]=s)}}colorBodies(){if(this.options.order!=="colored")return;let e=this.coloring.run(this.bodyCount,this.dynamic,this.adjStart,this.adjList,this.info,this.options.colorRounds);this.numColors=e.numColors,this.colorConflicts=e.conflicts,this.colorRounds=e.rounds}warmStartBodies(){let{dt:e,gravity:t}=this.params,{pose:i,velocity:r,initial:s,inertial:a,prevVelocity:n}=this;for(let l=0;l<this.bodyCount;l++){let c=l*4;r[c+2]=Qi(r[c+2],-50,50),a[c]=i[c]+r[c]*e,a[c+1]=i[c+1]+r[c+1]*e,a[c+2]=i[c+2]+r[c+2]*e,this.dynamic[l]&&(a[c+1]+=t*e*e);let f=(r[c+1]-n[c+1])/e*_n(t),u=Qi(f/Math.abs(t),0,1);Number.isFinite(u)||(u=0),s[c]=i[c],s[c+1]=i[c+1],s[c+2]=i[c+2],i[c]=i[c]+r[c]*e,i[c+1]=i[c+1]+r[c+1]*e+t*u*e*e,i[c+2]=i[c+2]+r[c+2]*e}}eC=new Float64Array(3);eMin=new Float64Array(3);eMax=new Float64Array(3);eJ=new Float64Array(9);eG=new Float64Array(9);evalConstraint(e,t,i){let{info:r,data:s,pose:a,initial:n}=this,l=r[e*D],c=r[e*D+1],f=r[e*D+2],u=e*T,{eC:d,eMin:p,eMax:m,eJ:h,eG:b}=this,y=Fn[l];for(let B=0;B<y;B++)p[B]=s[u+ft+B],m[B]=s[u+dt+B];let v=i===c;if(b.fill(0),l===Qt){this.jointC(c,f,u,a,s,0,d);for(let B=0;B<3;B++)s[u+$+B]===1/0&&(d[B]-=s[u+at+B]*t);if(i>=0){let B=a[i*4+2],[g,A]=Yt(B,s[u+(v?W:K)],s[u+(v?W:K)+1]),x=v?1:-1;h[0]=x,h[1]=0,h[2]=-x*A,h[3]=0,h[4]=x,h[5]=x*g,h[6]=0,h[7]=0,h[8]=x*s[u+Ee],b[2]=Math.abs(g),b[5]=Math.abs(A)}}else if(l===Gn){let[B,g]=Un(a,c,s[u+W],s[u+W+1]),[A,x]=Un(a,f,s[u+K],s[u+K+1]),w=B-A,E=g-x,k=w*w+E*E,z=Math.sqrt(k);if(d[0]=z-s[u+ye],i>=0&&k!==0){let M=w/z,P=E/z,_=(1-M*M)/z,C=-M*P/z,S=(1-P*P)/z,R=a[i*4+2],I=v?W:K,[O,q]=Yt(R,-s[u+I+1],s[u+I]),[G,j]=Yt(R,s[u+I],s[u+I+1]),F=_*O+C*q,H=C*O+S*q,ee=M*G+P*j,le=M*O+P*q,xe=v?1:-1;h[0]=xe*M,h[1]=xe*P,h[2]=xe*le;let U=v?-ee-ee:ee+ee;b[0]=Math.hypot(_,C,F),b[1]=Math.hypot(C,S,H),b[2]=Math.hypot(F,H,U)}else i>=0&&h.fill(0,0,3)}else if(l===Ss){let B=c>=0?a[c*4+2]-n[c*4+2]:0,g=a[f*4+2]-n[f*4+2];d[0]=B-g-s[u+ye]*this.params.dt,i>=0&&(h[0]=0,h[1]=0,h[2]=v?1:-1)}else if(l===Zo){let B=s[u+Ee],g=s[u+vt],A=g,x=-B,[w,E]=Yt(n[c*4+2],s[u+W],s[u+W+1]),[k,z]=Yt(n[f*4+2],s[u+K],s[u+K+1]),M=w*g-E*B,P=-(k*g-z*B),_=w*x-E*A,C=-(k*x-z*A),S=a[c*4]-n[c*4],R=a[c*4+1]-n[c*4+1],I=a[c*4+2]-n[c*4+2],O=a[f*4]-n[f*4],q=a[f*4+1]-n[f*4+1],G=a[f*4+2]-n[f*4+2];d[0]=s[u+at]*(1-t)+B*S+g*R+M*I+-B*O+-g*q+P*G,d[1]=s[u+at+1]*(1-t)+A*S+x*R+_*I+-A*O+-x*q+C*G;let j=Math.abs(s[u+ne])*s[u+ye];m[1]=j,p[1]=-j,i>=0&&(v?(h[0]=B,h[1]=g,h[2]=M,h[3]=A,h[4]=x,h[5]=_):(h[0]=-B,h[1]=-g,h[2]=P,h[3]=-A,h[4]=-x,h[5]=C))}return y}solveBody(e,t){let i=this.params,{shape:r,pose:s,inertial:a,data:n}=this,l=i.dt*i.dt,c=r[e*4+2]/l,f=r[e*4+3]/l,u=c,d=0,p=c,m=0,h=0,b=f,y=c*(s[e*4]-a[e*4]),v=c*(s[e*4+1]-a[e*4+1]),B=f*(s[e*4+2]-a[e*4+2]),{eC:g,eMin:A,eMax:x,eJ:w,eG:E}=this,k=this.adjStart,z=this.adjList;for(let F=k[e+1]-1;F>=k[e];F--){let H=z[F],ee=this.evalConstraint(H,t,e),le=H*T,xe=!i.vbd;for(let U=0;U<ee;U++){let ze=n[le+$+U],Me=xe&&ze===1/0?n[le+ne+U]:0,ce=n[le+ge+U],Ne=g[U],zt=ce*Ne+Me,Ie=Qi(zt,A[U],x[U]),qe=Math.abs(Ie);i.stiffnessRescale&&Ne!==0&&(zt<A[U]?ce=Math.abs((A[U]-Me)/Ne):zt>x[U]&&(ce=Math.abs((x[U]-Me)/Ne)));let Re=w[U*3],Ve=w[U*3+1],et=w[U*3+2];y+=Re*Ie,v+=Ve*Ie,B+=et*Ie,u+=Re*Re*ce+E[U*3]*qe,d+=Ve*Re*ce,p+=Ve*Ve*ce+E[U*3+1]*qe,m+=et*Re*ce,h+=et*Ve*ce,b+=et*et*ce+E[U*3+2]*qe}}let M=u,P=d/u,_=m/u,C=p-P*P*M,S=(h-P*_*M)/C,R=b-(_*_*M+S*S*C),I=v-P*y,q=(B-_*y-S*I)/R,G=I/C-S*q,j=y/M-P*G-_*q;this.dxBuf[e*3]=j,this.dxBuf[e*3+1]=G,this.dxBuf[e*3+2]=q}applyDx(e){this.pose[e*4]-=this.dxBuf[e*3],this.pose[e*4+1]-=this.dxBuf[e*3+1],this.pose[e*4+2]-=this.dxBuf[e*3+2]}primal(e){if(this.dxBuf.length<this.bodyCount*3&&(this.dxBuf=new Float64Array(this.bodyCount*3)),this.options.order==="sequential"){for(let r=this.bodyCount-1;r>=0;r--)this.dynamic[r]&&(this.solveBody(r,e),this.applyDx(r));return}let{colorStart:t,colorBodies:i}=this.coloring;for(let r=0;r<this.numColors;r++){for(let s=t[r];s<t[r+1];s++)this.solveBody(i[s],e);for(let s=t[r];s<t[r+1];s++)this.applyDx(i[s])}}dual(e){let t=this.params,i=this.data,{eC:r,eMin:s,eMax:a}=this,n=this.jointCount+this.contactCount;for(let l=0;l<n;l++){let c=this.info[l*D];if(c===Dn)continue;let f=this.evalConstraint(l,e,-1),u=l*T;c===Zo&&(i[u+xr]=Math.abs(i[u+ne+1])<a[1]&&Math.abs(i[u+at+1])<.01?1:0);for(let d=0;d<f;d++){let p=i[u+$+d],m=!t.vbd&&p===1/0?i[u+ne+d]:0,h=Qi(i[u+ge+d]*r[d]+m,s[d],a[d]);i[u+ne+d]=h,Math.abs(h)>=i[u+gi+d]&&this.disable(l),!t.vbd&&h>s[d]&&h<a[d]&&(i[u+ge+d]=Yi(i[u+ge+d]+t.beta*Math.abs(r[d]),Yi(1e9,i[u+$+d])))}}}refreshStick(){let e=this.data;for(let t=0;t<this.contactCount;t++){let i=(this.jointCount+t)*T,r=Math.abs(e[i+ne])*e[i+ye];e[i+xr]=Math.abs(e[i+ne+1])<r&&Math.abs(e[i+at+1])<.01?1:0}}disable(e){let t=e*T;this.data.fill(0,t+ge,t+ge+3),this.data.fill(0,t+ne,t+ne+3),this.data.fill(0,t+$,t+$+3)}updateVelocities(){let{dt:e}=this.params,{pose:t,initial:i,velocity:r,prevVelocity:s}=this;for(let a=0;a<this.bodyCount;a++){let n=a*4;s[n]=r[n],s[n+1]=r[n+1],s[n+2]=r[n+2],this.dynamic[a]&&(r[n]=(t[n]-i[n])/e,r[n+1]=(t[n+1]-i[n+1])/e,r[n+2]=(t[n+2]-i[n+2])/e)}}pick(e,t){for(let i=this.bodyCount-1;i>=0;i--){let[r,s]=Yt(-this.pose[i*4+2],e-this.pose[i*4],t-this.pose[i*4+1]);if(Math.abs(r)<=this.shape[i*4]*.5&&Math.abs(s)<=this.shape[i*4+1]*.5)return{body:i,local:[r,s]}}return null}kineticEnergy(){let e=0;for(let t=0;t<this.bodyCount;t++){if(!this.dynamic[t])continue;let i=t*4,r=this.velocity;e+=.5*this.shape[i+2]*(r[i]*r[i]+r[i+1]*r[i+1])+.5*this.shape[i+3]*r[i+2]*r[i+2]}return e}maxJointError(){let e=0,t=new Float64Array(3);for(let i=0;i<this.jointCount;i++){if(this.info[i*D]!==Qt)continue;let r=i*T;this.jointC(this.info[i*D+1],this.info[i*D+2],r,this.pose,this.data,0,t);for(let s=0;s<2;s++)this.data[r+$+s]===1/0&&(e=Math.max(e,Math.abs(t[s])))}return e}isContactPairIgnored(e,t){return Qo(this.noCollide,this.noCollideCount,Ki(e,t))}};function Yt(o,e,t){let i=Math.cos(o),r=Math.sin(o);return[i*e-r*t,r*e+i*t]}function Un(o,e,t,i){let r=Math.cos(o[e*4+2]),s=Math.sin(o[e*4+2]);return[r*t-s*i+o[e*4],s*t+r*i+o[e*4+1]]}var Ar=`
${mt}

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
`,wr=`
${mt}

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
`;var Br=`
${mt}

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
`;var Ps=o=>o===1/0?3e38:o===-1/0?-3e38:o,Qe=o=>Math.ceil(o/64),Vn=o=>2**Math.ceil(Math.log2(Math.max(o,2))),Mc=o=>Math.max(o,1)*24*4,Ic=4,Ke=()=>GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST,Ls=class{device;params=As();topology;bodyCount=0;bodyCapacity;jointCount=0;jointCapacity=0;pairCapacity=0;contactCapacity=0;colorCap=12;splitPasses=!1;primalMode="bucket";shrinkVotes=0;get colorHistOffset(){return 3*this.bodyCapacity+65}colorRounds;bodyBuffer;ownsBodyBuffer;jointBuffer;infoBuffer;contactBuffers;pairBuffer;tableBuffer;gridBuffer;staticBuffer=null;counterBuffer;argsBuffer;adjBuffer=null;colorBuffer;paramsBuffer;passBuffer=null;passEntries=0;parity=0;tableSize;hashSize=0;cellSize=1;maxSmallRadius=0;largeCount=0;noCollideCount=0;staticsDirty=!0;layouts;pipes={};groups;passGroup=null;gridScan;colorHistScan;colorGroups;adjScan=null;timing;timingCallback=null;timingBusy=!1;destroyed=!1;constructor(e,t,i={}){if(this.device=e,this.topology=t,Object.assign(this.params,t.params),this.bodyCount=t.bodyCount,this.colorRounds=i.colorRounds??16,this.ownsBodyBuffer=!i.bodyBuffer,this.bodyCapacity=i.bodyBuffer?Math.floor(i.bodyBuffer.size/96):Math.max(i.bodyCapacity??this.bodyCount+1024,this.bodyCount,1),this.bodyCapacity<this.bodyCount)throw new Error("body buffer too small");this.bodyBuffer=i.bodyBuffer??e.createBuffer({label:"bodies",size:Mc(this.bodyCapacity),usage:Ke()});let r=this.bodyCapacity;this.tableSize=Vn(2*r),this.gridBuffer=e.createBuffer({label:"grid",size:(2*this.tableSize+1+3*r)*4,usage:Ke()}),this.counterBuffer=e.createBuffer({label:"counters",size:64,usage:Ke()}),this.argsBuffer=e.createBuffer({label:"indirect args",size:816,usage:Ke()|GPUBufferUsage.INDIRECT}),this.colorGroups=Math.ceil(r/256),this.colorBuffer=e.createBuffer({label:"colours",size:(3*r+65+64*this.colorGroups+1)*4,usage:Ke()}),this.paramsBuffer=e.createBuffer({label:"params",size:128,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),e.queue.writeBuffer(this.colorBuffer,0,new Uint32Array(r).fill(255));let s=2*fe.length;this.timing=e.features.has("timestamp-query")?{querySet:e.createQuerySet({type:"timestamp",count:s}),resolve:e.createBuffer({size:s*8,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC}),read:e.createBuffer({size:s*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST})}:null,this.layouts=this.createLayouts(),this.createPipelines(),this.gridScan=new Fe(e,this.gridBuffer,0,this.tableSize+1),this.colorHistScan=new Fe(e,this.colorBuffer,this.colorHistOffset,64*this.colorGroups+1),this.jointCount=t.jointCount,this.allocateJoints(t.jointCount+256),this.uploadJoints(0,t.jointCount),this.allocateContacts(Math.max(4096,4*r)),this.uploadBodies()}createLayouts(){let e=this.device,t=(a,n)=>e.createBindGroupLayout({label:a,entries:n.map((l,c)=>({binding:c,visibility:GPUShaderStage.COMPUTE,buffer:{type:l}}))}),i="read-only-storage",r="storage",s="uniform";return{broad:t("broadphase",[s,i,r,r,r,i,i]),contacts:t("contacts",[s,i,i,r,i,r,r]),topo:t("topology",[s,i,i,i,i,r,r,r]),solve:t("solve",[s,r,r,i,r,i,i,i]),pass:e.createBindGroupLayout({label:"pass",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform",hasDynamicOffset:!0,minBindingSize:16}}]}),args:t("args",[s,i,i,r])}}createPipelines(){let e=this.device,t=(r,s,a)=>{let n=e.createShaderModule({code:r}),l=e.createPipelineLayout({bindGroupLayouts:s});for(let c of a)this.pipes[c]=e.createComputePipeline({label:c,layout:l,compute:{module:n,entryPoint:c}})},i=this.layouts;t(Ar,[i.broad],["beginFrame","gridCount","gridScatter","findPairs"]),t(wr,[i.contacts],["hashInsert","narrowphase"]),t(nr,[i.topo],["degreeJoints","degreeContacts","fillJoints","fillContacts","sortAdjacency","colorCompact","colorMark","colorRoundAB","colorRoundBA","colorCount","colorStarts","colorScatter"]),t(Br,[i.solve,i.pass],["warmStartJoints","warmStartBodies","primal","primalScan","dual","refreshStick","updateVelocities"]),t(Fr,[i.args],["argsPrev","argsPairs","argsContacts","argsColors"])}allocateJoints(e){let t=this.device,i=t.createBuffer({label:"joints",size:Math.max(e,1)*36*4,usage:Ke()}),r=t.createBuffer({label:"joint info",size:Math.max(e,1)*16,usage:Ke()});if(this.jointBuffer){let s=t.createCommandEncoder();s.copyBufferToBuffer(this.jointBuffer,0,i,0,this.jointCapacity*36*4),s.copyBufferToBuffer(this.infoBuffer,0,r,0,this.jointCapacity*16),t.queue.submit([s.finish()]),this.jointBuffer.destroy(),this.infoBuffer.destroy()}this.jointBuffer=i,this.infoBuffer=r,this.jointCapacity=e,this.contactBuffers&&this.rebuildBindings()}allocateContacts(e,t=2*e){let i=this.device,r=i.limits.maxStorageBufferBindingSize,s=Math.min(e,Math.floor(r/80),Math.floor(r/16)),a=Math.min(t,Math.floor(r/8)),n=this.contactBuffers,l=this.contactCapacity;for(let c of[this.pairBuffer,this.tableBuffer])c?.destroy();if(this.contactCapacity=s,this.pairCapacity=a,this.hashSize=Vn(4*s),this.pairBuffer=i.createBuffer({label:"pairs",size:a*8,usage:Ke()}),this.tableBuffer=i.createBuffer({label:"contact hash",size:this.hashSize*4,usage:Ke()}),this.contactBuffers=[0,1].map(c=>i.createBuffer({label:`contacts ${c}`,size:s*20*4,usage:Ke()})),n){let c=i.createCommandEncoder(),f=Math.min(l,s)*20*4;n.forEach((u,d)=>c.copyBufferToBuffer(u,0,this.contactBuffers[d],0,f)),i.queue.submit([c.finish()]),n.forEach(u=>u.destroy())}this.rebuildBindings()}rebuildBindings(){let e=this.device,t=this.bodyCapacity;this.adjBuffer?.destroy(),this.adjBuffer=e.createBuffer({label:"adjacency",size:(2*t+1+2*(this.jointCapacity+this.contactCapacity))*4,usage:Ke()}),this.adjScan?.destroy(),this.adjScan=new Fe(e,this.adjBuffer,0,this.bodyCount+1),this.staticBuffer??=e.createBuffer({label:"statics",size:16,usage:Ke()});let i=(l,c)=>e.createBindGroup({layout:l,entries:c.map((f,u)=>({binding:u,resource:{buffer:f}}))}),r=this.paramsBuffer,[s,a]=this.contactBuffers,n=this.adjBuffer;this.groups={broad:i(this.layouts.broad,[r,this.bodyBuffer,this.gridBuffer,this.pairBuffer,this.counterBuffer,this.staticBuffer,this.jointBuffer]),contacts:[i(this.layouts.contacts,[r,this.bodyBuffer,this.pairBuffer,s,a,this.tableBuffer,this.counterBuffer]),i(this.layouts.contacts,[r,this.bodyBuffer,this.pairBuffer,a,s,this.tableBuffer,this.counterBuffer])],topo:[s,a].map(l=>i(this.layouts.topo,[r,this.bodyBuffer,this.jointBuffer,this.infoBuffer,l,this.counterBuffer,n,this.colorBuffer])),solve:[s,a].map(l=>i(this.layouts.solve,[r,this.bodyBuffer,this.jointBuffer,this.infoBuffer,l,n,this.colorBuffer,this.counterBuffer])),args:i(this.layouts.args,[r,this.counterBuffer,this.colorBuffer,this.argsBuffer])}}uploadBodies(e=0,t=this.topology.bodyCount-e){let i=this.topology,r=new Float32Array(Math.max(t,1)*24);for(let s=0;s<t;s++){let a=e+s,n=s*24;r.set(i.pose.subarray(a*4,a*4+3),n),r[n+3]=i.props[a*4],r.set(i.initial.subarray(a*4,a*4+4),n+4),r.set(i.inertial.subarray(a*4,a*4+4),n+8),r.set(i.velocity.subarray(a*4,a*4+4),n+12),r.set(i.prevVelocity.subarray(a*4,a*4+4),n+16),r.set(i.shape.subarray(a*4,a*4+4),n+20)}this.device.queue.writeBuffer(this.bodyBuffer,e*24*4,r),this.staticsDirty=!0}uploadJoints(e,t){if(t===0)return;let i=this.topology,r=new Float32Array(t*36);for(let s=0;s<t;s++){let a=(e+s)*T,n=s*36;for(let l=0;l<3;l++)r[n+0+l]=i.data[a+ge+l],r[n+4+l]=i.data[a+ne+l],r[n+8+l]=Ps(i.data[a+$+l]),r[n+12+l]=Ps(i.data[a+ft+l]),r[n+16+l]=Ps(i.data[a+dt+l]),r[n+20+l]=Ps(i.data[a+gi+l]),r[n+24+l]=i.data[a+at+l];r[n+28]=i.data[a+W],r[n+28+1]=i.data[a+W+1],r[n+28+2]=i.data[a+K],r[n+28+3]=i.data[a+K+1],r[n+32]=i.data[a+ye],r[n+32+1]=i.data[a+Ee]}this.device.queue.writeBuffer(this.jointBuffer,e*36*4,r),this.device.queue.writeBuffer(this.infoBuffer,e*16,i.info,e*D,t*D)}uploadStatics(){let e=this.topology,t=this.bodyCount,i=Float64Array.from({length:t},(u,d)=>e.props[d*4+1]).sort(),r=t>0?i[t>>1]:1,s=0;for(let u=0;u<t;u++)i[u]<=Ic*r&&(s=Math.max(s,i[u]));let a=1/0;for(let u=0;u<t;u++)i[u]>s&&(a=Math.min(a,i[u]));let n=a===1/0?s*1.5:(s+a)/2;this.maxSmallRadius=n,this.cellSize=Math.max(2*s*(1+1e-4),.001);let l=[];for(let u=0;u<t;u++)e.props[u*4+1]>n&&l.push(u);let c=[];for(let u=0;u<e.jointCount;u++){let d=e.info[u*D+1],p=e.info[u*D+2];d>=0&&c.push([Math.max(d,p),Math.min(d,p),u])}for(let u of e.ignoredPairs()){let d=Math.floor(u/2097152);c.push([d,u-d*2097152,4294967295])}c.sort((u,d)=>u[0]-d[0]||u[1]-d[1]),this.largeCount=l.length,this.noCollideCount=c.length;let f=new Uint32Array(Math.max(l.length+3*c.length,4));f.set(l,0),c.forEach((u,d)=>f.set(u,l.length+3*d)),this.staticBuffer.size<f.byteLength&&(this.staticBuffer.destroy(),this.staticBuffer=this.device.createBuffer({label:"statics",size:f.byteLength,usage:Ke()}),this.rebuildBindings()),this.device.queue.writeBuffer(this.staticBuffer,0,f),this.staticsDirty=!1}seedContactsFrom(e){let t=e.contactCount;if(t>this.contactCapacity)throw new Error("seedContactsFrom: too many contacts");let i=new ArrayBuffer(Math.max(t,1)*20*4),r=new Uint32Array(i),s=new Float32Array(i);for(let l=0;l<t;l++){let c=e.jointCount+l,f=c*T,u=l*20;r[u]=e.info[c*D+1],r[u+1]=e.info[c*D+2],r[u+2]=e.info[c*D+3],r[u+3]=e.data[f+xr]?1:0,s.set([e.data[f+ge],e.data[f+ge+1],e.data[f+ne],e.data[f+ne+1]],u+4),s.set([e.data[f+W],e.data[f+W+1],e.data[f+K],e.data[f+K+1]],u+8),s.set([e.data[f+at],e.data[f+at+1],e.data[f+Ee],e.data[f+vt]],u+12),s[u+16]=e.data[f+ye]}this.device.queue.writeBuffer(this.contactBuffers[1-this.parity],0,i);let a=new Uint32Array(16);a[1]=t,this.device.queue.writeBuffer(this.counterBuffer,0,a);let n=Uint32Array.from({length:this.bodyCount},(l,c)=>(e.coloring.colors[c]??-1)<0?255:e.coloring.colors[c]);this.device.queue.writeBuffer(this.colorBuffer,0,n)}addBody(e,t,i,r,s){if(this.bodyCount>=this.bodyCapacity)return-1;let a=this.topology.addBody(e,t,i,r,s);return this.bodyCount=this.topology.bodyCount,this.uploadBodies(a,1),this.device.queue.writeBuffer(this.colorBuffer,a*4,new Uint32Array([255])),this.adjScan.destroy(),this.adjScan=new Fe(this.device,this.adjBuffer,0,this.bodyCount+1),a}appendJoint(e,t,i,r,s,a=1/0){let n=this.topology;if(n.contactCount>0)throw new Error("appendJoint: the CPU mirror must not hold contacts");let l=n.addJoint(e,t,i,r,s,a).slot;return l>=this.jointCapacity&&this.allocateJoints(Math.max(l+1,this.jointCapacity*2)),this.jointCount=l+1,this.uploadJoints(l,1),e>=0&&(this.staticsDirty=!0),l}setWorldAnchor(e,t,i){this.device.queue.writeBuffer(this.jointBuffer,(e*36+28)*4,new Float32Array([t,i]))}disableConstraint(e){this.device.queue.writeBuffer(this.jointBuffer,(e*36+0)*4,new Float32Array(12)),this.topology.data.fill(0,e*T+$,e*T+$+3)}profileNextStep(e){this.timing&&!this.timingBusy&&(this.timingCallback=e)}writeParams(e,t){let i=this.params,r=this.bodyCapacity,s=new ArrayBuffer(128),a=new Float32Array(s),n=new Uint32Array(s);a[0]=i.dt,a[1]=i.gravity,a[2]=i.beta,a[3]=i.gamma,a[4]=e,a[5]=i.vbdStiffness,n[6]=(i.vbd?1:0)|(i.stiffnessRescale?2:0)|(t?4:0)|(i.matchNearest?8:0),n[7]=this.bodyCount,n[8]=this.jointCount,n[9]=this.colorCap,a[10]=this.cellSize,n[11]=this.tableSize-1,a[12]=this.maxSmallRadius,n[13]=this.largeCount,n[14]=this.noCollideCount,n[15]=this.pairCapacity,n[16]=this.contactCapacity,n[17]=this.hashSize-1,n[18]=r+1,n[19]=2*r+1,n[20]=this.tableSize+1,n[21]=2*this.tableSize+1,n[22]=2*this.tableSize+1+r,n[23]=r,n[24]=this.colorHistOffset,n[25]=2*r,n[26]=this.colorGroups,n[27]=2*r+65,n[28]=this.colorRounds,this.device.queue.writeBuffer(this.paramsBuffer,0,s)}writePassConstants(e,t){let i=this.colorCap+1,r=e*i;(r>this.passEntries||!this.passGroup)&&(this.passBuffer?.destroy(),this.passBuffer=this.device.createBuffer({label:"pass constants",size:r*256,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.passEntries=r,this.passGroup=this.device.createBindGroup({layout:this.layouts.pass,entries:[{binding:0,resource:{buffer:this.passBuffer,size:16}}]}));let s=new ArrayBuffer(r*256),a=new Uint32Array(s),n=new Float32Array(s);for(let l=0;l<e;l++)for(let c=0;c<=this.colorCap;c++){let f=(l*i+c)*256/4;a[f]=c,n[f+1]=t(l)}this.device.queue.writeBuffer(this.passBuffer,0,s)}step(){this.staticsDirty&&this.uploadStatics();let e=this.params,t=e.postStabilize&&!e.vbd,i=e.vbd?0:e.alpha,r=e.iterations+(t?1:0);this.writeParams(i,t),this.writePassConstants(r,A=>t?A<e.iterations?1:0:i);let s=this.parity,a=this.bodyCapacity,n=this.bodyCount,l=this.jointCount,c=this.device.createCommandEncoder({label:"avbd2d step"});c.clearBuffer(this.gridBuffer,0,(2*this.tableSize+1)*4),c.clearBuffer(this.tableBuffer),c.clearBuffer(this.adjBuffer,0,(2*a+1)*4);let f=this.timingCallback!==null&&this.timing!==null,u,d=0,p=f||this.splitPasses,m=()=>{u&&!p||(u?.end(),u=c.beginComputePass({label:p?fe[d]:"avbd2d step",timestampWrites:f?{querySet:this.timing.querySet,beginningOfPassWriteIndex:2*d,endOfPassWriteIndex:2*d+1}:void 0}),d++)},h=this.groups,b=(A,x,w)=>{w<=0||(u.setPipeline(this.pipes[A]),u.setBindGroup(0,x),u.dispatchWorkgroups(w))},y=(A,x,w)=>{u.setPipeline(this.pipes[A]),u.setBindGroup(0,x),u.dispatchWorkgroupsIndirect(this.argsBuffer,w*4)};m(),b("beginFrame",h.broad,1),b("argsPrev",h.args,1),y("hashInsert",h.contacts[s],6),b("gridCount",h.broad,Qe(n)),this.gridScan.encode(u),b("gridScatter",h.broad,Qe(n)),b("findPairs",h.broad,Qe(n)),b("argsPairs",h.args,1),y("narrowphase",h.contacts[s],0),b("argsContacts",h.args,1),m(),b("degreeJoints",h.topo[s],Qe(l)),y("degreeContacts",h.topo[s],3),this.adjScan.encode(u),b("fillJoints",h.topo[s],Qe(l)),y("fillContacts",h.topo[s],3),b("sortAdjacency",h.topo[s],Qe(n)),m(),b("colorCompact",h.topo[s],Qe(n)),b("colorMark",h.topo[s],Qe(n));for(let A=0;A<this.colorRounds;A++)b(A%2===0?"colorRoundAB":"colorRoundBA",h.topo[s],Qe(n));b("colorCount",h.topo[s],this.colorGroups),this.colorHistScan.encode(u),b("colorStarts",h.topo[s],1),b("argsColors",h.args,1),b("colorScatter",h.topo[s],this.colorGroups),m();let v=this.colorCap+1,B=A=>u.setBindGroup(1,this.passGroup,[A*256]);u.setBindGroup(0,h.solve[s]),B(0),l>0&&(u.setPipeline(this.pipes.warmStartJoints),u.dispatchWorkgroups(Qe(l))),u.setPipeline(this.pipes.warmStartBodies),u.dispatchWorkgroups(Qe(n));for(let A=0;A<r;A++){let x=this.primalMode==="scan";u.setPipeline(x?this.pipes.primalScan:this.pipes.primal);for(let w=0;w<this.colorCap;w++)B(A*v+w),x?u.dispatchWorkgroups(Qe(n)):u.dispatchWorkgroupsIndirect(this.argsBuffer,(12+3*w)*4);A<e.iterations&&(B(A*v+this.colorCap),u.setPipeline(this.pipes.dual),u.dispatchWorkgroupsIndirect(this.argsBuffer,36)),A===e.iterations-1&&(u.setPipeline(this.pipes.updateVelocities),u.dispatchWorkgroups(Qe(n)))}t&&(u.setPipeline(this.pipes.refreshStick),u.dispatchWorkgroupsIndirect(this.argsBuffer,12)),u.end();let g=2*fe.length;if(f){let{querySet:A,resolve:x,read:w}=this.timing;c.resolveQuerySet(A,0,g,x,0),c.copyBufferToBuffer(x,0,w,0,g*8)}if(this.device.queue.submit([c.finish()]),this.parity=1-s,f){let A=this.timingCallback;this.timingCallback=null,this.timingBusy=!0;let x=this.timing.read;x.mapAsync(GPUMapMode.READ).then(()=>{let w=new BigUint64Array(x.getMappedRange()).slice();if(x.unmap(),this.timingBusy=!1,this.destroyed)return this.releaseTiming();let E=(z,M)=>Number(w[M]-w[z])/1e6,k={total:E(0,g-1)};fe.forEach((z,M)=>k[z]=E(2*M,2*M+1)),A(k)},()=>{this.timingBusy=!1,this.destroyed&&this.releaseTiming()})}}async readBodies(){return new Float32Array(await this.read(this.bodyBuffer,this.bodyCount*24*4))}async readJoints(){return new Float32Array(await this.read(this.jointBuffer,this.jointCount*36*4))}async readCounters(){let e=new Uint32Array(await this.read(this.counterBuffer,64));return{pairs:e[0],contacts:e[1],overflow:e[3],clashes:e[4],colors:e[5]}}async readContacts(){let{contacts:e}=await this.readCounters(),t=Math.min(e,this.contactCapacity);return this.read(this.contactBuffers[1-this.parity],t*20*4)}async readPairs(){let{pairs:e}=await this.readCounters();return new Uint32Array(await this.read(this.pairBuffer,Math.min(e,this.pairCapacity)*8))}async readColors(){return new Uint32Array(await this.read(this.colorBuffer,this.bodyCount*4))}async readAdjacency(){let e=new Uint32Array(await this.read(this.adjBuffer,this.adjBuffer.size)),t=e.slice(0,this.bodyCount+1),i=2*this.bodyCapacity+1;return{start:t,list:e.slice(i,i+t[this.bodyCount])}}adapt(e){let t=e.colors;e.clashes>0||t>=this.colorCap-1?(this.colorCap=Math.min(64,Math.max(t+4,this.colorCap+4)),this.shrinkVotes=0):t+2<this.colorCap?++this.shrinkVotes>=3&&(this.colorCap=Math.min(64,Math.max(4,t+2)),this.shrinkVotes=0):this.shrinkVotes=0;let i=(e.overflow&2)!==0||e.contacts>.8*this.contactCapacity,r=(e.overflow&1)!==0||e.pairs>.8*this.pairCapacity,s=this.contactCapacity*(i?2:1),a=this.pairCapacity*(r?2:1);(i||r)&&this.capacityCanGrow(s,a)&&this.allocateContacts(s,a)}capacityCanGrow(e,t){let i=this.device.limits.maxStorageBufferBindingSize,r=Math.min(Math.floor(i/80),Math.floor(i/16));return Math.min(e,r)>this.contactCapacity||Math.min(t,Math.floor(i/8))>this.pairCapacity}async readStats(e){let[t,i]=await Promise.all([e??this.readBodies(),this.readJoints()]),r=0;for(let c=0;c<this.bodyCount;c++){let f=c*24,u=t[f+22],d=t[f+12],p=t[f+13],m=t[f+14];u>0&&(r+=.5*u*(d*d+p*p)+.5*t[f+23]*m*m)}let s=0,a=0,n=this.topology.info,l=(c,f,u)=>{let d=c*24,p=Math.cos(t[d+2]),m=Math.sin(t[d+2]);return[p*f-m*u+t[d],m*f+p*u+t[d+1]]};for(let c=0;c<this.jointCount;c++){if(n[c*D]!==Qt)continue;let f=c*36;if(i[f+8]===0&&i[f+8+1]===0&&i[f+8+2]===0)continue;a++;let u=n[c*D+1],d=n[c*D+2],p=u>=0?l(u,i[f+28],i[f+28+1]):[i[f+28],i[f+28+1]],m=l(d,i[f+28+2],i[f+28+3]);for(let h=0;h<2;h++)i[f+8+h]>=1e30&&(s=Math.max(s,Math.abs(p[h]-m[h])))}return{kineticEnergy:r,maxJointError:s,joints:a}}async read(e,t){if(t===0)return new ArrayBuffer(0);let i=this.device.createBuffer({size:t,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),r=this.device.createCommandEncoder();r.copyBufferToBuffer(e,0,i,0,t),this.device.queue.submit([r.finish()]),await i.mapAsync(GPUMapMode.READ);let s=i.getMappedRange().slice(0);return i.unmap(),i.destroy(),s}releaseTiming(){this.timing?.resolve.destroy(),this.timing?.read.destroy(),this.timing?.querySet.destroy()}destroy(){this.ownsBodyBuffer&&this.bodyBuffer.destroy();let e=[this.jointBuffer,this.infoBuffer,...this.contactBuffers,this.pairBuffer,this.tableBuffer,this.gridBuffer,this.staticBuffer,this.counterBuffer,this.argsBuffer,this.adjBuffer,this.colorBuffer,this.paramsBuffer,this.passBuffer];for(let t of e)t?.destroy();this.destroyed=!0,this.timingBusy||this.releaseTiming(),this.gridScan.destroy(),this.colorHistScan.destroy(),this.adjScan?.destroy()}};var Rc=`${mt}
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
`,_s=class extends Vi{constructor(e){super(e,{code:Rc,dimension:2})}};function Wn(o){for(let e of["warmStartJoints","warmStartBodies","primal","primalScan","dual","refreshStick","updateVelocities"]){let t=`fn ${e}(@builtin(global_invocation_id) gid: vec3u) {`;if(o.split(t).length!==2)throw Error(`Pinned 2D ${e} signature changed; review the step guard`);o=o.replace(t,`${t}
  if (counters[C_OVERFLOW] != 0u || counters[C_CLASHES] != 0u) { return; }`)}return o}function Hn(o){let e="if (col == NO_COLOR) { col = params.colorCap - 1u; }";if(o.split(e).length!==2)throw Error("Pinned 2D color-count layout changed; review the capacity guard");return o.replace(e,`${e}
    if (col >= params.colorCap) { atomicAdd(&counters[C_CLASHES], 1u); }`)}var Jn=`// Sleeping is scheduling metadata in velocity.w; physical mass and inertia stay intact.
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
`;function zs(o={}){if(o!==!0&&(typeof o!="object"||o===null))throw Error("sleeping must be a boolean or options object");let e=o.speedThreshold??.03,t=o.timeThreshold??.5;if(![e,t].every(i=>Number.isFinite(i)&&i>0))throw Error("Sleep thresholds must be positive and finite");return{speedThreshold:e,timeThreshold:t}}function $n(o){for(let e of["warmStartBodies","updateVelocities"])o=o.replace(`fn ${e}(@builtin(global_invocation_id) gid: vec3u) {`,`fn ${e}(@builtin(global_invocation_id) gid: vec3u) {
  if(gid.x<params.bodyCount && bodies[gid.x].vel.w!=0.){return;}`);return o.replace("fn solveBody(i: u32) {",`fn solveBody(i: u32) {
  if(bodies[i].vel.w!=0.){return;}`)}function Xn(o){return o.replace("return i >= 0 && bodies[i].shape.z > 0.0;","return i >= 0 && bodies[i].shape.z > 0.0 && bodies[i].vel.w==0.;")}var Es=class{constructor(e,t){this.gpu=e,this.device=e.device,this.options=zs(t);let i=this.device,r=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC;this.state=i.createBuffer({size:e.bodyCapacity*16,usage:r}),this.globals=i.createBuffer({size:8,usage:r}),this.params=i.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let s=i.createShaderModule({code:Jn});this.layout=i.createBindGroupLayout({entries:["storage","storage","read-only-storage","read-only-storage","read-only-storage","read-only-storage","storage","uniform"].map((l,c)=>({binding:c,visibility:GPUShaderStage.COMPUTE,buffer:{type:l}}))});let a=i.createPipelineLayout({bindGroupLayouts:[this.layout]});this.pipes=Object.fromEntries(["clear","before","contactsWake","jointsWake","decide","applyWake","rest"].map(l=>[l,i.createComputePipeline({layout:a,compute:{module:s,entryPoint:l}})]));let n=new Uint32Array(e.bodyCapacity*4);for(let l=0;l<e.bodyCount;l++)n[l*4+1]=e.sleepEligible?.get(l)===!1?0:1;i.queue.writeBuffer(this.state,0,n),this.wakeRequested=!1}register(e,t=!0){let i=Q(this.gpu);for(let r=0;r<4;r++)i.uint(this.state,e*4+r,r===1?Number(t):0);this.wakeRequested=!0}group(e){let t=this.gpu,i=[t.bodyBuffer,this.state,t.infoBuffer,t.jointBuffer,t.contactBuffers[e],t.counterBuffer,this.globals,this.params],r=this.groups?.find(s=>s.buffers.every((a,n)=>a===i[n]));return r||(r={buffers:i,group:this.device.createBindGroup({layout:this.layout,entries:i.map((s,a)=>({binding:a,resource:{buffer:s}}))})},this.groups=[...(this.groups??[]).slice(-1),r]),r.group}dispatch(e,t,i){e.setBindGroup(0,this.group(t));for(let[r,s]of i)s&&(e.setPipeline(this.pipes[r]),e.dispatchWorkgroups(Math.ceil(s/64)))}run(e,t){let i=t??this.device.createCommandEncoder(),r=i.beginComputePass();this.dispatch(r,1-this.gpu.parity,e),r.end(),t||this.device.queue.submit([i.finish()])}before(e){this.gpu.flushPropertyEdits(e);let t=this.gpu,i=new ArrayBuffer(32),r=new Uint32Array(i),s=new Float32Array(i);r.set([t.bodyCount,t.jointCount,t.contactCapacity,Number(this.wakeRequested)]),s.set([this.options.speedThreshold,this.options.timeThreshold,t.params.dt,t.params.gravity],4),this.device.queue.writeBuffer(this.params,0,i),this.wakeRequested=!1,this.run([["clear",1],["before",t.bodyCount]],e)}encodeWake(e,t){let i=this.gpu;this.dispatch(e,t,[["contactsWake",i.contactCapacity],["jointsWake",i.jointCount],["decide",i.bodyCount],["applyWake",i.bodyCount]])}after(e){this.run([["rest",this.gpu.bodyCount]],e)}async readStats(){let e=new Uint32Array(await this.gpu.read(this.globals,8));return{sleeping:e[1],wakeRequested:this.wakeRequested||!!e[0]}}destroy(){this.gpu.propertyEdits?.forget(this.state),this.state.destroy(),this.globals.destroy(),this.params.destroy()}};var Ze=o=>Math.ceil(o/64);function Yn(){this.staticsDirty&&this.uploadStatics();let o=this.params,e=o.postStabilize&&!o.vbd,t=o.vbd?0:o.alpha,i=o.iterations+(e?1:0);this.writeParams(t,e),this.writePassConstants(i,g=>e?g<o.iterations?1:0:t);let r=this.parity,s=this.bodyCapacity,a=this.bodyCount,n=this.jointCount,l=this.device.createCommandEncoder({label:"avbd2d step"});this.encodeStepPrelude?.(l),l.clearBuffer(this.gridBuffer,0,(2*this.tableSize+1)*4),l.clearBuffer(this.tableBuffer),l.clearBuffer(this.adjBuffer,0,(2*s+1)*4);let c=this.timingCallback!==null&&this.timing!==null,f,u=0,d=c||this.splitPasses,p=()=>{f&&!d||(f?.end(),f=l.beginComputePass({label:d?fe[u]:"avbd2d step",timestampWrites:c?{querySet:this.timing.querySet,beginningOfPassWriteIndex:2*u,endOfPassWriteIndex:2*u+1}:void 0}),u++)},m=this.groups,h=(g,A,x)=>{x<=0||(f.setPipeline(this.pipes[g]),f.setBindGroup(0,A),f.dispatchWorkgroups(x))},b=(g,A,x)=>{f.setPipeline(this.pipes[g]),f.setBindGroup(0,A),f.dispatchWorkgroupsIndirect(this.argsBuffer,x*4)};p(),h("beginFrame",m.broad,1),h("argsPrev",m.args,1),b("hashInsert",m.contacts[r],6),h("gridCount",m.broad,Ze(a)),this.gridScan.encode(f),h("gridScatter",m.broad,Ze(a)),h("findPairs",m.broad,Ze(a)),h("argsPairs",m.args,1),b("narrowphase",m.contacts[r],0),h("argsContacts",m.args,1),this.sleeping?.encodeWake(f,r),p(),h("degreeJoints",m.topo[r],Ze(n)),b("degreeContacts",m.topo[r],3),this.adjScan.encode(f),h("fillJoints",m.topo[r],Ze(n)),b("fillContacts",m.topo[r],3),h("sortAdjacency",m.topo[r],Ze(a)),p(),h("colorCompact",m.topo[r],Ze(a)),h("colorMark",m.topo[r],Ze(a));for(let g=0;g<this.colorRounds;g++)h(g%2===0?"colorRoundAB":"colorRoundBA",m.topo[r],Ze(a));h("colorCount",m.topo[r],this.colorGroups),this.colorHistScan.encode(f),h("colorStarts",m.topo[r],1),h("argsColors",m.args,1),h("colorScatter",m.topo[r],this.colorGroups),p();let y=this.colorCap+1,v=g=>f.setBindGroup(1,this.passGroup,[g*256]);f.setBindGroup(0,m.solve[r]),v(0),n>0&&(f.setPipeline(this.pipes.warmStartJoints),f.dispatchWorkgroups(Ze(n))),f.setPipeline(this.pipes.warmStartBodies),f.dispatchWorkgroups(Ze(a));for(let g=0;g<i;g++){let A=this.primalMode==="scan";f.setPipeline(A?this.pipes.primalScan:this.pipes.primal);for(let x=0;x<this.colorCap;x++)v(g*y+x),A?f.dispatchWorkgroups(Ze(a)):f.dispatchWorkgroupsIndirect(this.argsBuffer,(12+3*x)*4);g<o.iterations&&(v(g*y+this.colorCap),f.setPipeline(this.pipes.dual),f.dispatchWorkgroupsIndirect(this.argsBuffer,36)),g===o.iterations-1&&(f.setPipeline(this.pipes.updateVelocities),f.dispatchWorkgroups(Ze(a)))}e&&(f.setPipeline(this.pipes.refreshStick),f.dispatchWorkgroupsIndirect(this.argsBuffer,12)),f.end();let B=2*fe.length;if(c){let{querySet:g,resolve:A,read:x}=this.timing;l.resolveQuerySet(g,0,B,A,0),l.copyBufferToBuffer(A,0,x,0,B*8)}if(this.parity=1-r,this.encodeStepPostlude?.(l),this.device.queue.submit([l.finish()]),c){let g=this.timingCallback;this.timingCallback=null,this.timingBusy=!0;let A=this.timing.read;A.mapAsync(GPUMapMode.READ).then(()=>{let x=new BigUint64Array(A.getMappedRange()).slice();if(A.unmap(),this.timingBusy=!1,this.destroyed)return this.releaseTiming();let w=(k,z)=>Number(x[z]-x[k])/1e6,E={total:w(0,B-1)};fe.forEach((k,z)=>E[k]=w(2*z,2*z+1)),g(E)},()=>{this.timingBusy=!1,this.destroyed&&this.releaseTiming()})}}var Ms=5;function er({minAngle:o=-Math.PI,maxAngle:e=Math.PI}={}){if(!Number.isFinite(o)||!Number.isFinite(e)||o>e)throw Error("Angle limits require finite minAngle <= maxAngle, in radians");return{minAngle:o,maxAngle:e}}function ia(o,e,t){let i=e*T;o.info[e*D]=Ms,o.data.set([1/0,1/0,0],i+$),o.data.set([-1/0,0,0],i+ft),o.data.set([0,1/0,0],i+dt),o.data[i+Ee]=t.minAngle,o.data[i+vt]=t.maxAngle}function Qn(o){let e=o.topology;for(let t=0;t<e.jointCount;t++)e.info[t*D]===Ms&&o.device.queue.writeBuffer(o.jointBuffer,(t*36+32)*4,new Float32Array([e.data[t*T+ye],e.data[t*T+Ee],e.data[t*T+vt],0]))}var Sr=(o,e,t)=>{if(o.split(e).length!==2)throw Error("Pinned 2D angular layout changed");return o.replace(e,t)};function Kn(o){return o=Sr(o,"case T_JOINT: { return 3u; }",`case T_JOINT: { return 3u; }
    case 5: { return 2u; }`),o=Sr(o,"fn jointRowsC(j: u32, alpha: f32) -> vec3f {",`
fn limitAngle2D(k:Joint,a:i32,b:i32)->f32 {
  var angleA=0.;if(a>=0){angleA=bodies[a].pose.z;}
  return angleA-bodies[b].pose.z-k.param.x;
}
fn limitRows2D(k:Joint,a:i32,b:i32,alpha:f32)->vec3f {
  let angle=limitAngle2D(k,a,b);
  return vec3f(angle-k.param.y,angle-k.param.z,0.)-alpha*k.c0.xyz;
}
`+`
fn jointRowsC(j: u32, alpha: f32) -> vec3f {`),o=Sr(o,`  if (t == T_JOINT) {
    // Hard rows`,`  if(t==5){return limitRows2D(k,a,b,alpha);}
  if (t == T_JOINT) {
    // Hard rows`),o=Sr(o,"  let C = jointRowsC(j, alpha);",`  let C = jointRowsC(j, alpha);
  if(t==5){
    // Unilateral rows only contribute while their force is active. Inside the
    // interval a hinge has no angular stiffness and remains free to rotate.
    let F=clamp(k.pen.xyz*C+k.lam.xyz,k.fmin.xyz,k.fmax.xyz);
    if(F.x!=0.){addRow(acc,vec3f(0.,0.,sg),vec3f(0.),C.x,k.pen.x,k.lam.x,k.stiff.x,k.fmin.x,k.fmax.x);}
    if(F.y!=0.){addRow(acc,vec3f(0.,0.,sg),vec3f(0.),C.y,k.pen.y,k.lam.y,k.stiff.y,k.fmin.y,k.fmax.y);}
    return;
  }`),o=Sr(o,"  if (t == T_JOINT) { k.c0 = vec4f(jointC(k, info[j].y, info[j].z), 0.0); }",`  if (t == T_JOINT) { k.c0 = vec4f(jointC(k, info[j].y, info[j].z), 0.0); }
  if(t==5){let angle=limitAngle2D(k,info[j].y,info[j].z);k.c0=vec4f(min(0.,angle-k.param.y),max(0.,angle-k.param.z),0.,0.);}`),o}var Zn=`// Analytic circles and capsules, finite two-sided segments and solid half-space planes.
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
`;var ra=new WeakMap,tr=(o,e,t=!1)=>{if(!Number.isFinite(o)||(t?o<0:o<=0))throw Error(`${e} must be ${t?"nonnegative":"positive"} and finite`);return o},Is=(o,e)=>{if(!o||o.length!==2||!Array.from(o).every(Number.isFinite))throw Error(`${e} requires two finite components`);return Array.from(o)},kr=o=>ra.get(o);function Rs(o){let e=Array.from(o??[]),t=typeof e[0]=="number"?e:e.flatMap(x=>Is(x,"Hull point"));if(t.length<6||t.length%2||!t.every(Number.isFinite))throw Error("A 2D hull requires finite xy pairs spanning an area");let i=[];for(let x=0;x<t.length;x+=2)i.push([t[x],t[x+1]]);i.sort((x,w)=>x[0]-w[0]||x[1]-w[1]);let r=i.filter((x,w)=>!w||x[0]!==i[w-1][0]||x[1]!==i[w-1][1]),s=(x,w,E)=>(w[0]-x[0])*(E[1]-x[1])-(w[1]-x[1])*(E[0]-x[0]),a=x=>{let w=[];for(let E of x){for(;w.length>1&&s(w.at(-2),w.at(-1),E)<=0;)w.pop();w.push(E)}return w.slice(0,-1)},n=[...a(r),...a([...r].reverse())];if(n.length<3||n.length>32)throw Error("A 2D hull needs 3\u201332 boundary vertices spanning an area");let l=n[0],c=n.map(x=>[x[0]-l[0],x[1]-l[1]]),f=0,u=0,d=0;for(let x=0;x<c.length;x++){let w=c[x],E=c[(x+1)%c.length],k=w[0]*E[1]-E[0]*w[1];f+=k,u+=(w[0]+E[0])*k,d+=(w[1]+E[1])*k}if(!(f>0)||!Number.isFinite(f))throw Error("Hull area must be positive and finite");u/=3*f,d/=3*f;let p=c.map(x=>[x[0]-u,x[1]-d]),m=0,h=0,b=0,y=0,v=[];for(let x=0;x<p.length;x++){let w=p[x],E=p[(x+1)%p.length],k=w[0]*E[1]-E[0]*w[1];m+=k*(w[0]*w[0]+w[0]*E[0]+E[0]*E[0]+w[1]*w[1]+w[1]*E[1]+E[1]*E[1])/12;let z=E[0]-w[0],M=E[1]-w[1],P=Math.hypot(z,M);v.push(w[0],w[1],M/P,-z/P),h=Math.max(h,Math.hypot(...w)),b=Math.max(b,Math.abs(w[0])),y=Math.max(y,Math.abs(w[1]))}let B=f/2,g=m/B;if(![B,g,h,b,y,...v].every(x=>Number.isFinite(Math.fround(x)))||Math.fround(B)<=0||Math.fround(g)<=0)throw Error("Hull geometry exceeds GPU floating-point range");let A=[4,h,0,p.length];return A.vertices=v,{geometry:A,size:[2*b,2*y],area:B,momentPerMass:g,radius:h}}function Os(o){let e=tr(o,"radius");return{geometry:[1,e,0,0],size:[2*e,2*e],area:Math.PI*e*e,momentPerMass:e*e/2,radius:e}}function js(o,e){let t=tr(o,"radius");if(tr(e,"length"),e<2*t)throw Error("Capsule length must be at least twice its radius");return el((e-2*t)/2,t)}function el(o,e){let t=2*o,i=2*e*t,r=Math.PI*e*e,s=i+r,a=i*(t*t+4*e*e)/12+r*(t*t/4+e*e/2+4*t*e/(3*Math.PI));return{geometry:[2,e,o,0],size:[t+2*e,Math.max(2*e,1e-6)],area:s,momentPerMass:s?a/s:0,radius:o+e}}function Ts(o,e,t={}){let i=Is(o,"start"),r=Is(e,"end"),s=r[0]-i[0],a=r[1]-i[1],n=Math.hypot(s,a),l=tr(t.radius??0,"radius",!0);if(tr(n,"segment length"),t.position!==void 0||t.angle!==void 0)throw Error("Segment position and angle come from its endpoints");if(l===0&&(t.density??0)!==0)throw Error("A zero-thickness segment must be static; give it a radius for a dynamic capsule");return{...el(n/2,l),options:{...t,density:t.density??0,position:[(i[0]+r[0])/2,(i[1]+r[1])/2],angle:Math.atan2(a,s)}}}function Ds(o,e=0,t={}){let i=Is(o,"normal"),r=tr(Math.hypot(...i),"normal length");if(!Number.isFinite(e))throw Error("Plane offset must be finite");if((t.density??0)!==0)throw Error("An infinite plane must be static");if(t.position!==void 0||t.angle!==void 0)throw Error("Plane position and angle come from its normal and offset");let s=i[0]/r,a=i[1]/r;return{geometry:[3,0,0,0],size:[1,1],area:0,momentPerMass:0,radius:0,options:{...t,density:0,position:[s*e,a*e],angle:Math.atan2(-s,a)}}}function Gs(o,e,t,i){let r=ra.get(o);r||ra.set(o,r=new Map),r.set(e,t.geometry);let s=t.area*i,a=e*4;o.shape[a+2]=s,o.shape[a+3]=s*t.momentPerMass,o.props[a+1]=t.radius,o.dynamic[e]=+(s>0)}var tl=`struct Body {pose:vec4f,initial:vec4f,inertial:vec4f,velocity:vec4f,previous:vec4f,shape:vec4f}
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
`;function xt(o,e){let t=o&&typeof o.x=="number"?[o.x,o.y]:Array.isArray(o)||ArrayBuffer.isView(o)&&!(o instanceof DataView)?o:Array.from(o??[]);if(t.length!==2||!t.every(Number.isFinite))throw Error(`${e} requires two finite components`);return t}var xi=class{constructor(){this.count=0,this.capacity=0}reserve(e){if(e<=this.capacity)return;let t=Math.max(e,this.capacity*2,64),i=new ArrayBuffer(t*48),r=new Float32Array(i),s=new Uint32Array(i);this.u32&&s.set(this.u32.subarray(0,this.count*12)),this.words=r,this.u32=s,this.capacity=t}append(e,t,i,r,s=!1){this.reserve(this.count+1),il(this.words,this.u32,this.count++*12,e,t,i,r,s)}};function il(o,e,t,i,r,s,a,n){e[t]=i,e[t+1]=r,e[t+2]=Number(n),e[t+3]=0;for(let l=0;l<4;l++)o[t+4+l]=s[l]??0,o[t+8+l]=a?.[l]??0}var ir=class{constructor(e,t=tl,i=2){this.solver=e,this.shader=t,this.dimension=i,this.pending=new Map,this.queue=new xi,this.requested=0,this.linearOnly=!0,this.angularOnly=!0,this.hasTeleports=!1,this.motionOnly=!0,this.freeRanges=[]}slot(e,t){this.requested++,this.linearOnly&&=t===0,this.angularOnly&&=t===1,this.motionOnly&&=t===0||t===1,this.hasTeleports||=t===4;let i=this.pending.get(e);if(i&&(t===0||t===1)&&this.queue.u32[i.tail*12+1]===t)return i.tail;if(this.queue.reserve(this.queue.count+1),!this.next||this.next.length<this.queue.capacity){let s=new Int32Array(this.queue.capacity);this.next&&s.set(this.next),this.next=s}let r=this.queue.count++;return this.next[r]=-1,i?(this.next[i.tail]=r,i.tail=r,i.length++):(i=this.freeRanges.pop()??{},i.head=i.tail=r,i.length=1,this.pending.set(e,i)),r}enqueue(e,t,i,r,s=!1){let a=this.slot(e,t);il(this.queue.words,this.queue.u32,a*12,e,t,i,r,s)}enqueueValidated(e){for(let t=0;t<e.count;t++){let i=t*12,r=this.slot(e.u32[i],e.u32[i+1])*12;for(let s=0;s<12;s++)this.queue.u32[r+s]=e.u32[i+s]}}flush(e){if(!this.pending.size)return;let t=this.solver.device,i=this.pending.size;if(this.linearOnly||this.angularOnly){let r=this.angularOnly&&this.dimension===2?1:this.dimension;if(!this.linearIndices||this.linearIndices.length<i){let l=Math.max(i,(this.linearIndices?.length??0)*2,64);this.linearIndices=new Uint32Array(l),this.linearValues=new Float32Array(l*this.dimension)}let s=0;for(let[l,c]of this.pending){this.linearIndices[s]=l;for(let f=0;f<r;f++)this.linearValues[s*r+f]=this.queue.words[c.tail*12+4+f];s++}let a=this.angularOnly?"angularVelocityBatch":"velocityBatch",n=this.solver[a]??=new Lt(this.solver,this.dimension,this.angularOnly?"angular":"linear");n.submitValidated(this.linearIndices.subarray(0,i),this.linearValues.subarray(0,i*r),e),this.lastBatch={bodies:i,commands:this.queue.count,requestedCommands:this.requested,uploadedBytes:n.lastBatch.uploadedBytes,path:this.angularOnly?"packed-angular-velocities":"packed-velocities",submissions:e?0:1}}else if(this.motionOnly){let r=this.motionBatch??=new Ht(this.solver,this.dimension),s=r.wordsPerBody;(!this.motionData||this.motionData.length<i*s)&&(this.motionData=new Uint32Array(Math.max(i*s,(this.motionData?.length??0)*2,64*s)),this.motionFloats=new Float32Array(this.motionData.buffer));let a=0;for(let[n,l]of this.pending){let c=a++*s;this.motionData[c]=n;let f=0;for(let u=l.head;u!==-1;u=this.next[u]){let d=this.queue.u32[u*12+1];f|=1<<d;let p=c+(d===0?2:2+this.dimension),m=d===0||this.dimension===3?this.dimension:1;for(let h=0;h<m;h++)this.motionFloats[p+h]=this.queue.words[u*12+4+h]}this.motionData[c+1]=f}r.submitValidated(this.motionData.subarray(0,i*s),e),this.lastBatch={bodies:i,commands:this.queue.count,requestedCommands:this.requested,uploadedBytes:r.lastBatch.uploadedBytes,path:"packed-motion",submissions:e?0:1}}else{this.upload??=new xi,this.upload.count=0,this.upload.reserve(this.queue.count),(!this.rangeData||this.rangeData.length<i*2)&&(this.rangeData=new Uint32Array(Math.max(i*2,(this.rangeData?.length??0)*2,128)));let r=0,s=0;for(let p of this.pending.values()){this.rangeData[s++]=r,this.rangeData[s++]=p.length;for(let m=p.head;m!==-1;m=this.next[m]){for(let h=0;h<12;h++)this.upload.u32[r*12+h]=this.queue.u32[m*12+h];r++}}let a=r*48,n=i*8,l=Math.min(t.limits.maxStorageBufferBindingSize,t.limits.maxBufferSize);if(a>l||n>l)throw Error("Body command batch exceeds GPU buffer limits");for(let[p,m]of[["commands",a],["ranges",n]])(!this[p]||this[p].size<m)&&(this[p]?.destroy(),this[p]=t.createBuffer({size:Math.min(l,Math.max(m*2,16)),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}));t.queue.writeBuffer(this.commands,0,this.upload.words.buffer,0,a),t.queue.writeBuffer(this.ranges,0,this.rangeData.buffer,0,n),this.pipeline??=t.createComputePipeline({layout:"auto",compute:{entryPoint:"edit",module:t.createShaderModule({code:"const DISPATCH_STRIDE = "+t.limits.maxComputeWorkgroupsPerDimension*64+`u;
`+this.shader})}}),(!this.group||this.boundBody!==this.solver.bodyBuffer||this.boundCommands!==this.commands||this.boundRanges!==this.ranges||this.boundRangeBytes!==n)&&(this.group=t.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.solver.bodyBuffer}},{binding:1,resource:{buffer:this.commands}},{binding:2,resource:{buffer:this.ranges,size:n}}]}),this.boundBody=this.solver.bodyBuffer,this.boundCommands=this.commands,this.boundRanges=this.ranges,this.boundRangeBytes=n);let c=e??t.createCommandEncoder(),f=c.beginComputePass();f.setPipeline(this.pipeline),f.setBindGroup(0,this.group);let u=Math.ceil(i/64),d=t.limits.maxComputeWorkgroupsPerDimension;f.dispatchWorkgroups(Math.min(u,d),Math.ceil(u/d)),f.end(),this.encodeAfterEdits(c,i),e||t.queue.submit([c.finish()]),this.lastBatch={bodies:i,commands:r,requestedCommands:this.requested,uploadedBytes:a+n,path:"ordered-commands",submissions:e?0:1}}for(let r of this.pending.values())this.freeRanges.push(r);this.pending.clear(),this.queue.count=0,this.requested=0,this.linearOnly=!0,this.angularOnly=!0,this.motionOnly=!0,this.hasTeleports=!1}encodeAfterEdits(){}destroy(){this.commands?.destroy(),this.ranges?.destroy(),this.solver.velocityBatch?.destroy(),this.solver.angularVelocityBatch?.destroy(),this.motionBatch?.destroy(),this.freeRanges.length=0,this.pending.clear(),this.queue=this.upload=this.next=this.linearIndices=this.linearValues=this.rangeData=this.motionData=this.motionFloats=null,this.group=null}};var Fs=class extends Ls{writePassConstants(e,t){as.call(this,e,t)}createPipelines(){let e=this.layouts;this.compile(Ar,[e.broad],["beginFrame","gridCount","gridScatter","findPairs"]),this.compile(wr,[e.contacts],["hashInsert","narrowphase"]),this.compile(nr,[e.topo],["degreeJoints","degreeContacts","fillJoints","fillContacts","sortAdjacency","colorCompact","colorMark","colorRoundAB","colorRoundBA","colorCount","colorStarts","colorScatter"]),this.compile(Br,[e.solve,e.pass],["warmStartJoints","warmStartBodies","primal","primalScan","dual","refreshStick","updateVelocities"]),this.compile(Fr,[e.args],["argsPrev","argsPairs","argsContacts","argsColors"])}constructor(e,t,i={}){i.sleeping!==void 0&&i.sleeping!==!1&&zs(i.sleeping),super(e,t,i),this.sleepEligible=new Map(t.avbdSleepEligible??[]),Qn(this),kr(t)?.size&&this.enableShapes(),(i.sleeping||[...this.sleepEligible.values()].some(r=>r===!0))&&this.enableSleeping(i.sleeping||{})}enableShapes(){this.shapeBuffer||(this.syncShapeGeometry(),this.shapeContactLayout=this.makeLayout(["uniform","read-only-storage","read-only-storage","storage","read-only-storage","storage","storage","read-only-storage"]),this.compileBroadphase(),this.compileContacts(),this.bindContacts(),this.staticsDirty=!0)}geometryBytes(e=0){let t=(this.geometryRecords??this.bodyCapacity)*4+e;if(this.geometryRecords===void 0)for(let r of kr(this.topology)?.values()??[])t+=r.vertices?.length??0;let i=t*4;if(i>Math.min(this.device.limits.maxStorageBufferBindingSize,this.device.limits.maxBufferSize,16777216*16))throw Error("2D hull geometry exceeds this GPU's storage capacity");return i}syncShapeGeometry(){let e=this.geometryBytes(),t=new Float32Array(e/4);this.packedShapes=new Map;let i=this.bodyCapacity;for(let[r,s]of kr(this.topology)??[]){let a=Array.from(s);s.vertices&&(a[2]=i,t.set(s.vertices,i*4),i+=s.vertices.length/4),t.set(a,r*4),this.packedShapes.set(r,a)}this.geometryRecords=i,this.shapeBuffer=this.createShapeBuffer(e),this.device.queue.writeBuffer(this.shapeBuffer,0,t)}createShapeBuffer(e){let t=Math.min(this.device.limits.maxStorageBufferBindingSize,this.device.limits.maxBufferSize,268435456);return this.device.createBuffer({label:"2D collider geometry",size:Math.min(t,Math.max(e,Math.ceil(e*1.5/16)*16)),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC})}appendShapeGeometry(e,t){let i=this.geometryBytes(t.vertices?.length??0);if(this.shapeBuffer.size<i){let s=this.shapeBuffer;this.shapeBuffer=this.createShapeBuffer(i);let a=this.device.createCommandEncoder();a.copyBufferToBuffer(s,0,this.shapeBuffer,0,this.geometryRecords*16),this.device.queue.submit([a.finish()]),s.destroy(),this.bindFilters(),this.bindContacts()}let r=Array.from(t);t.vertices&&(r[2]=this.geometryRecords,this.device.queue.writeBuffer(this.shapeBuffer,this.geometryRecords*16,new Float32Array(t.vertices)),this.geometryRecords+=t.vertices.length/4),this.packedShapes.set(e,r),this.device.queue.writeBuffer(this.shapeBuffer,e*16,new Float32Array(r))}makeLayout(e){return this.device.createBindGroupLayout({entries:e.map((t,i)=>({binding:i,visibility:GPUShaderStage.COMPUTE,buffer:{type:t}}))})}contactSource(){let e=wr;return this.shapeBuffer&&(e=e.replace(`@compute @workgroup_size(64)
fn narrowphase`,Zn+`
@compute @workgroup_size(64)
fn narrowphase`).replace("let col = collideBoxes(A.pose.xyz, A.shape.xy * 0.5, B.pose.xyz, B.shape.xy * 0.5);","let col = collideShapes2D(a,b);")),this.sensorsEnabled&&(e=e.replace("rec.ids = vec4u(a, b, o.feature, 0u);","rec.ids = vec4u(a,b,o.feature,select(0u,0x80000000u,A.initial.w!=0.||B.initial.w!=0.));").replace("if (j >= 0) {","if (j >= 0 && rec.ids.w==0u && (prevContacts[j].ids.w&0x80000000u)==0u) {")),this.bodyCommands&&(e=e.replace("if (j >= 0","if (A.prevVel.w==0. && B.prevVel.w==0. && j >= 0")),e}compileContacts(){this.compile(this.contactSource(),[this.shapeContactLayout??this.layouts.contacts],["hashInsert","narrowphase"])}bindContacts(){this.shapeBuffer&&(this.groups.contacts=this.contactBuffers.map((e,t)=>this.device.createBindGroup({layout:this.shapeContactLayout,entries:[this.paramsBuffer,this.bodyBuffer,this.pairBuffer,e,this.contactBuffers[1-t],this.tableBuffer,this.counterBuffer,this.shapeBuffer].map((i,r)=>({binding:r,resource:{buffer:i}}))})))}compileBroadphase(){let e=["uniform","read-only-storage","storage","storage","storage","read-only-storage","read-only-storage"],t=Ar;if(this.shapeBuffer&&(e.push("read-only-storage"),t=t.replace(`fn radius(i: u32) -> f32 {
  return 0.5 * length(bodies[i].shape.xy);
}`,`@group(0) @binding(7) var<storage,read> geometry:array<vec4f>;
fn radius(i:u32)->f32{let g=geometry[i];if(g.x==4.){return g.y;}if(g.x==1.||g.x==2.){return g.y+g.z;}return .5*length(bodies[i].shape.xy);}`).replace("return radius(i) > params.maxSmallRadius;","return geometry[i].x==3. || radius(i) > params.maxSmallRadius;").replace("if (dot(d, d) > r * r) { return; }",`if(geometry[a].x==3.||geometry[b].x==3.) {
let plane=select(b,a,geometry[a].x==3.);let other=select(a,b,geometry[a].x==3.);let normal=rot(bodies[plane].pose.z,vec2f(0.,1.));
if(dot(bodies[other].pose.xy-bodies[plane].pose.xy,normal)>radius(other)){return;}
} else if(dot(d,d)>r*r){return;}`)),this.filters){let i=e.length;e.push("read-only-storage"),t=t.replace("fn ignored(hi: u32, lo: u32) -> bool {",`@group(0) @binding(${i}) var<storage,read> filters:array<vec2u>;
fn ignored(hi:u32,lo:u32)->bool{
if((filters[hi].x&filters[lo].y)==0u || (filters[lo].x&filters[hi].y)==0u){return true;}`)}this.filterLayout=this.makeLayout(e),this.compile(t,[this.filterLayout],["beginFrame","gridCount","gridScatter","findPairs"]),this.bindFilters()}uploadBodies(e=0,t=this.topology.bodyCount-e){this.flushPropertyEdits(),super.uploadBodies(e,t);for(let s=e;s<e+t;s++)this.sleeping?.register(s,this.sleepEligible?.get(s)!==!1);if(!this.shapeBuffer&&!this.triggers?.size)return;let i=this.shapeBuffer&&t>0?new Float32Array(t*4):null,r=this.packedShapes;for(let s=e;s<e+t;s++){let a=r?.get(s);i&&a&&i.set(a,(s-e)*4),this.triggers?.has(s)&&this.device.queue.writeBuffer(this.bodyBuffer,s*96+28,new Float32Array([1]))}i&&this.device.queue.writeBuffer(this.shapeBuffer,e*16,i)}uploadStatics(){if(!this.shapeBuffer)return super.uploadStatics();let e=this.topology,t=kr(e),i=[];for(let u=0;u<this.bodyCount;u++)t?.get(u)?.[0]!==3&&i.push(e.props[u*4+1]);i.sort((u,d)=>u-d);let r=i[i.length>>1]??1,s=0,a=1/0;for(let u of i)u<=4*r&&(s=Math.max(s,u));for(let u of i)u>s&&(a=Math.min(a,u));let n=a===1/0?s*1.5:(s+a)/2;this.maxSmallRadius=n,this.cellSize=Math.max(2*s*(1+1e-4),.001);let l=[],c=[];for(let u=0;u<this.bodyCount;u++)(t?.get(u)?.[0]===3||e.props[u*4+1]>n)&&l.push(u);for(let u=0;u<e.jointCount;u++){let d=e.info[u*4+1],p=e.info[u*4+2];d>=0&&c.push([Math.max(d,p),Math.min(d,p),u])}for(let u of e.ignoredPairs()){let d=Math.floor(u/2097152);c.push([d,u-d*2097152,4294967295])}c.sort((u,d)=>u[0]-d[0]||u[1]-d[1]),this.largeCount=l.length,this.noCollideCount=c.length;let f=new Uint32Array(Math.max(l.length+3*c.length,4));f.set(l),c.forEach((u,d)=>f.set(u,l.length+3*d)),this.staticBuffer.size<f.byteLength&&(this.staticBuffer.destroy(),this.staticBuffer=this.device.createBuffer({label:"2D boundaries",size:f.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.rebuildBindings()),this.device.queue.writeBuffer(this.staticBuffer,0,f),this.staticsDirty=!1}async raycast(e,t,i={}){let[r]=await this.raycastAll([{origin:e,direction:t,maxDistance:i.maxDistance}],i);return r}raycastAll(e,t={}){return this.flushEdits(),this.shapeQueries??=new Nt(this,2),this.shapeQueries.cast(e.map(i=>({...i,radius:0})),t)}async circleCast(e,t,i,r={}){let[s]=await this.circleCastAll([{origin:e,radius:t,direction:i,maxDistance:r.maxDistance}],r);return s}circleCastAll(e,t={}){return this.flushEdits(),this.shapeQueries??=new Nt(this,2),this.shapeQueries.cast(e,t)}liveIndex(e){if(this.destroyed)throw Error("The 2D solver has been destroyed");if(!Number.isInteger(e)||e<0||e>=this.bodyCount)throw Error("A live 2D body index is required")}queueBodyCommand(e,t,i,r,s=!1){return this.liveIndex(e),this.prepareBodyCommands().enqueue(e,t,i,r,s),this}prepareBodyCommands(){return this.wakeAll(),this.bodyCommands||(this.bodyCommands=new ir(this),this.compileContacts()),this.bodyCommands}setLinearVelocity(e,t){return this.queueBodyCommand(e,0,xt(t,"velocity"))}setAngularVelocity(e,t){if(!Number.isFinite(t))throw Error("Angular velocity must be finite");return this.queueBodyCommand(e,1,[t,0,0,0])}applyImpulse(e,t,i){return this.queueBodyCommand(e,2,xt(t,"impulse"),i===void 0?void 0:xt(i,"point"),i!==void 0)}applyForce(e,t,i){return this.queueBodyCommand(e,3,[...xt(t,"force"),0,this.params.dt],i===void 0?void 0:xt(i,"point"),i!==void 0)}applyAngularImpulse(e,t){if(!Number.isFinite(t))throw Error("Angular impulse must be finite");return this.queueBodyCommand(e,5,[t,0,0,0])}applyTorque(e,t){if(!Number.isFinite(t))throw Error("Torque must be finite");return this.queueBodyCommand(e,6,[t,0,0,this.params.dt])}teleport(e,t,i){if(i!==void 0&&!Number.isFinite(i))throw Error("Angle must be finite");return this.queueBodyCommand(e,4,[...xt(t,"position"),i??0,0],void 0,i!==void 0)}readBodies(){return this.flushEdits(),super.readBodies()}async readBodyState(e){this.liveIndex(e),this.flushEdits();let t=this.device,i=t.createBuffer({size:96,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let r=t.createCommandEncoder();r.copyBufferToBuffer(this.bodyBuffer,e*96,i,0,96),t.queue.submit([r.finish()]),await i.mapAsync(GPUMapMode.READ);let s=new Float32Array(i.getMappedRange());return{position:[s[0],s[1]],angle:s[2],linearVelocity:[s[12],s[13]],angularVelocity:s[14],mass:s[22],moment:s[23],sleeping:s[15]!==0}}finally{i.destroy()}}addBox(e,t={}){return this.addShape({size:Array.from(e)},t)}addCircle(e,t={}){return this.addShape(Os(e),t)}addHull(e,t={}){return this.addShape(Rs(e),t)}addCapsule(e,t,i={}){return this.addShape(js(e,t),i)}addSegment(e,t,i={}){return this.addShape(Ts(e,t,i))}addPlane(e=[0,1],t=0,i={}){return this.addShape(Ds(e,t,i))}addShape(e,t={}){t=e.options??t;let{density:i=1,friction:r=.6,position:s=[0,0],angle:a=0,velocity:n=[0,0,0],restitution:l=0,isTrigger:c=!1,group:f=4294967295,collidesWith:u=4294967295,allowSleep:d}=t;if(this.destroyed)throw Error("The 2D solver has been destroyed");if(d!==void 0&&typeof d!="boolean")throw Error("allowSleep must be boolean");if(this.bodyCount>=this.bodyCapacity)throw Error("2D body capacity reached; reserve bodyCapacity when creating the solver");if(e.size.length!==2||!e.size.every(h=>Number.isFinite(h)&&h>0)||!Number.isFinite(i)||i<0||!Number.isFinite(r)||r<0||!Number.isFinite(a))throw Error("Body dimensions must be positive, density and friction nonnegative, and angle finite");if(n.length!==3||!Array.from(n).every(Number.isFinite))throw Error("Velocity requires [x, y, angular] finite components");if(typeof c!="boolean"||!Number.isFinite(l)||l<0||l>1)throw Error("isTrigger must be boolean and restitution between zero and one");if([f,u].some(h=>!Number.isInteger(h)||h<0||h>4294967295))throw Error("Collision masks must be unsigned 32-bit integers");let p=xt(s,"position");e.geometry&&this.geometryBytes(e.geometry.vertices?.length??0);let m=super.addBody(e.size,i,r,[...p,a],Array.from(n));return e.geometry&&(Gs(this.topology,m,e,i),this.shapeBuffer?this.appendShapeGeometry(m,e.geometry):this.enableShapes(),this.uploadBodies(m,1)),l&&this.setRestitution(m,l),c&&this.setSensor(m,!0),(f!==4294967295||u!==4294967295)&&this.setFilters([m],[f],[u]),this.contactWatch?.setWatched([m],[!this.watchedIndices||this.watchedIndices.has(m)]),this.sleepEligible.set(m,d??!0),d===!0&&!this.sleeping&&this.enableSleeping(),this.sleeping?.register(m,d!==!1),this.wakeAll(),m}setRestitution(e,t){if(this.liveIndex(e),!Number.isInteger(e)||e<0||e>=this.bodyCount||!Number.isFinite(t)||t<0||t>1)throw Error("Restitution requires a live body index and a coefficient in 0..1");t>0&&!this.restitution&&(this.restitution=new _s(this)),this.restitution?.set(e,t),this.wakeAll()}constraintSlot(e,t){if(this.destroyed)throw Error("The 2D solver has been destroyed");if(!Number.isInteger(e)||e<0||e>=this.jointCount||this.topology.handles[e]?.disposed)throw Error("A live 2D constraint slot is required");if(t!==void 0&&this.topology.info[e*D]!==t)throw Error("The constraint has a different type");return e}setMotor(e,{speed:t,maxTorque:i}={}){if(this.constraintSlot(e,Ss),t!==void 0&&!Number.isFinite(t)||i!==void 0&&(!Number.isFinite(i)||i<0))throw Error("Motor speed must be finite and maximum torque nonnegative");let r=e*T,s=e*36;t!==void 0&&(this.topology.data[r+ye]=t,Q(this).float(this.jointBuffer,s+32,t)),i!==void 0&&(this.topology.data[r+ft]=-i,this.topology.data[r+dt]=i,Q(this).float(this.jointBuffer,s+12,-i),Q(this).float(this.jointBuffer,s+16,i)),this.wakeAll()}setAngleLimits(e,t){this.constraintSlot(e,Ms);let i=er(t);this.topology.data[e*T+Ee]=i.minAngle,this.topology.data[e*T+vt]=i.maxAngle,Q(this).float(this.jointBuffer,e*36+32+1,i.minAngle),Q(this).float(this.jointBuffer,e*36+32+2,i.maxAngle);for(let r=4;r<8;r++)Q(this).float(this.jointBuffer,e*36+r,0);this.wakeAll()}setWorldAnchor(e,t,i){if(this.constraintSlot(e,Qt),this.topology.info[e*D+1]!==-1||!Number.isFinite(t)||!Number.isFinite(i))throw Error("A world joint and finite xy anchor are required");Q(this).float(this.jointBuffer,e*36+28,t),Q(this).float(this.jointBuffer,e*36+28+1,i),this.wakeAll()}disableConstraint(e){if(this.topology.handles[e]?.disposed)return;this.constraintSlot(e),this.flushPropertyEdits(),super.disableConstraint(e),this.wakeAll();let t=this.topology.handles[e];t&&(t.alive=!1,t.disposed=!0)}appendJoint(e,t,i,r,s,a=1/0){if(e!==-1&&this.liveIndex(e),this.liveIndex(t),e===t)throw Error("Constraint endpoints must differ");let n=xt(i,"anchorA"),l=xt(r,"anchorB");if(!s||s.length!==3||Array.from(s).some(f=>f!==1/0&&(!Number.isFinite(f)||f<0))||a!==1/0&&(!Number.isFinite(a)||a<0))throw Error("Joint stiffness and break force must be nonnegative or Infinity");this.flushPropertyEdits();let c=super.appendJoint(e,t,n,l,Array.from(s),a);return this.wakeAll(),c}setFilters(e,t,i){if(this.destroyed)throw Error("The 2D solver has been destroyed");if(e.length!==t.length||e.length!==i.length)throw Error("Each body index needs a group and collision mask");let r=n=>{if(!Number.isInteger(n)||n<0||n>4294967295)throw Error("Collision masks must be unsigned 32-bit integers");return n},s=Array.from(e,(n,l)=>(this.liveIndex(n),[n,r(t[l]),r(i[l])]));if(this.wakeAll(),!this.filters){let n=this.device;this.filters=n.createBuffer({size:this.bodyCapacity*8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),n.queue.writeBuffer(this.filters,0,new Uint32Array(this.bodyCapacity*2).fill(4294967295)),this.compileBroadphase()}let a=Q(this);for(let[n,l,c]of s)a.uint(this.filters,n*2,l),a.uint(this.filters,n*2+1,c)}bindFilters(){this.filterLayout&&(this.groups.broad=this.device.createBindGroup({layout:this.filterLayout,entries:[this.paramsBuffer,this.bodyBuffer,this.gridBuffer,this.pairBuffer,this.counterBuffer,this.staticBuffer,this.jointBuffer,...this.shapeBuffer?[this.shapeBuffer]:[],...this.filters?[this.filters]:[]].map((e,t)=>({binding:t,resource:{buffer:e}}))}))}rebuildBindings(){super.rebuildBindings(),this.bindFilters(),this.bindContacts()}setSensor(e,t){if(this.liveIndex(e),typeof t!="boolean")throw Error("Sensor flag must be boolean");if(this.wakeAll(),t&&!this.sensorsEnabled){this.sensorsEnabled=!0;let i=this.device,r=i.createComputePipeline({layout:"auto",compute:{module:i.createShaderModule({code:"@group(0) @binding(0) var<storage,read_write> data:array<vec4f>; @compute @workgroup_size(64) fn clear(@builtin(global_invocation_id) id:vec3u){if(id.x*6u+1u<arrayLength(&data)){data[id.x*6u+1u].w=0.;}}"}),entryPoint:"clear"}}),s=i.createBindGroup({layout:r.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.bodyBuffer}}]}),a=i.createCommandEncoder(),n=a.beginComputePass();n.setPipeline(r),n.setBindGroup(0,s),n.dispatchWorkgroups(Math.ceil(this.bodyCount/64)),n.end(),i.queue.submit([a.finish()]),this.compileContacts();let l=Br.replace("b.initial = b.pose;","b.initial = vec4f(b.pose.xyz,b.initial.w);").replace("fn addContact(acc: ptr<function, Acc>, c: u32, alpha: f32, i: u32) {",`fn addContact(acc: ptr<function, Acc>, c: u32, alpha: f32, i: u32) {
 if((contacts[c].ids.w&0x80000000u)!=0u){return;}`).replace("fn dualContact(c: u32) {",`fn dualContact(c: u32) {
 if((contacts[c].ids.w&0x80000000u)!=0u){return;}`).replace(`  let k = contacts[c];
  let bound`,`  let k = contacts[c];
  if((k.ids.w&0x80000000u)!=0u){return;}
  let bound`);this.compile(l,[this.layouts.solve,this.layouts.pass],["warmStartJoints","warmStartBodies","primal","primalScan","dual","refreshStick","updateVelocities"]);let c=nr.replaceAll("if (gid.x >= topoCount()) { return; }",`if (gid.x >= topoCount()) { return; }
 if((contacts[gid.x].ids.w&0x80000000u)!=0u){return;}`);this.compile(c,[this.layouts.topo],["degreeContacts","fillContacts"])}this.sensorsEnabled&&Q(this).float(this.bodyBuffer,e*24+7,t?1:0),this.triggers??=new Set,t?this.triggers.add(e):this.triggers.delete(e)}compile(e,t,i){e.includes("fn warmStartBodies(")&&(e=Wn($n(Kn(e)))),e.includes("fn dynamicBody(")&&(e=Xn(e)),e.includes("fn colorCount(")&&(e=Hn(e));let r=this.device,s=r.createShaderModule({code:e}),a=r.createPipelineLayout({bindGroupLayouts:t});for(let n of i)this.pipes[n]=r.createComputePipeline({layout:a,compute:{module:s,entryPoint:n}})}watchContacts({maxPairs:e=8192,maxEvents:t=4096,indices:i}={}){if(this.destroyed)throw Error("The 2D solver has been destroyed");if(i!==void 0){if(!Array.isArray(i))throw Error("Watched indices must be an array of live body indices");for(let r of i)this.liveIndex(r)}for(let r of[e,t])if(!Number.isInteger(r)||r<1)throw Error("Contact capacities must be positive integers");return this.contactWatch||(this.contactWatch=new $t(this.device,this.bodyBuffer,this.bodyCapacity,e,t,2),i===void 0&&this.contactWatch.setWatched(Array.from({length:this.bodyCount},(r,s)=>s),Array(this.bodyCount).fill(!0))),i!==void 0&&(this.watchedIndices=new Set(i),this.contactWatch.setWatched(Array.from({length:this.bodyCount},(r,s)=>s),Array.from({length:this.bodyCount},(r,s)=>this.watchedIndices.has(s)))),this}async readContactEvents(){this.watchContacts();let e=await this.contactWatch.read();return{...e,events:e.events.map(t=>({...t,type:t.kind===Xt?"begin":"end",isTrigger:!!(this.triggers?.has(t.a)||this.triggers?.has(t.b))}))}}step(){if(this.destroyed)throw Error("The 2D solver has been destroyed");this.sleeping||this.restitution?.active.size||this.bodyCommands?.pending.size||this.propertyEdits?.pending?Yn.call(this):super.step(),this.contactWatch&&this.contactWatch.run({manifolds:this.contactBuffers[1-this.parity],contacts:this.contactBuffers[1-this.parity],counters:this.counterBuffer},this.contactCapacity,this.eventStep=(this.eventStep??0)+1,this.params.dt)}encodeStepPrelude(e){this.flushPropertyEdits(e),this.sleeping?.before(e),this.bodyCommands?.flush(e),this.restitution?.before(e)}encodeStepPostlude(e){this.restitution?.after(e),this.sleeping?.after(e)}destroy(){this.passConstantCache=null,this.propertyEdits?.destroy(),!this.destroyed&&(this.detachFromScene(),this.shapeQueries?.destroy(),this.restitution?.destroy(),this.filters?.destroy(),this.shapeBuffer?.destroy(),this.bodyCommands?.destroy(),this.contactWatch?.destroy(),this.sleeping?.destroy(),super.destroy())}enableSleeping(e={}){if(this.destroyed)throw Error("The 2D solver has been destroyed");return this.sleeping?this.sleeping.options=zs(e):this.sleeping=new Es(this,e),this}disableSleeping(){if(this.destroyed)throw Error("The 2D solver has been destroyed");return this.sleeping&&(this.sleeping.wakeRequested=!0,this.sleeping.before(),this.sleeping.destroy(),this.sleeping=null),this}setSleepEnabled(e,t){if(this.liveIndex(e),typeof t!="boolean")throw Error("Sleep flag must be boolean");return this.sleepEligible.set(e,t),t&&!this.sleeping&&this.enableSleeping(),this.sleeping?.register(e,t),this.wakeAll(),this}wakeAll(){return this.sleeping&&(this.sleeping.wakeRequested=!0),this}wakeUp(e){return this.liveIndex(e),this.wakeAll()}async readSleepStats(){return this.sleeping?this.sleeping.readStats():{sleeping:0,wakeRequested:!1}}flushEdits(){this.flushPropertyEdits(),this.sleeping?.wakeRequested&&this.sleeping.before(),this.bodyCommands?.flush()}flushPropertyEdits(e){this.propertyEdits?.flush(e)}readJoints(){return this.flushPropertyEdits(),super.readJoints()}attachToScene(e,{maxSubSteps:t=6,maxFrameTime:i=.05,afterStep:r}={}){if(this.destroyed)throw Error("The 2D solver has been destroyed");if(!e?.onBeforeRenderObservable?.add||!e?.onDisposeObservable?.addOnce||!e?.getEngine)throw Error("A Babylon scene is required");if(!Number.isInteger(t)||t<1||!Number.isFinite(i)||i<=0||r!==void 0&&typeof r!="function")throw Error("Scene stepping requires positive frame limits and an optional afterStep function");if(this.sceneBinding){if(this.sceneBinding.scene===e)return this;throw Error("The 2D solver is already attached to another scene")}let s=0,a=e.onBeforeRenderObservable.add(()=>{let l=this.params.dt;if(!(l>0)||!Number.isFinite(l))throw Error("Simulation timestep must be positive and finite");let c=e.getEngine().getDeltaTime()/1e3;s=Math.min(t*l,s+Math.min(i,Math.max(0,c)));for(let f=0;s+1e-12>=l&&f<t&&(this.step(),s=Math.max(0,s-l),r?.(this),!(!this.sceneBinding||this.destroyed));f++);}),n=e.onDisposeObservable.addOnce(()=>this.destroy());return this.sceneBinding={scene:e,before:a,dispose:n},this}detachFromScene(){let e=this.sceneBinding;return e&&(e.scene.onBeforeRenderObservable.remove(e.before),e.scene.onDisposeObservable.remove(e.dispose),this.sceneBinding=null),this}};var Us=o=>{if(!Number.isInteger(o)||o<0||o>4294967295)throw Error("Collision masks must be unsigned 32-bit integers");return o};function Be(o,e,t){let i=o&&typeof o.x=="number"?[o.x,o.y,...e>=3?[o.z]:[],...e===4?[o.w]:[]]:Array.isArray(o)||ArrayBuffer.isView(o)&&!(o instanceof DataView)?o:Array.from(o??[]);if(i.length!==e||!i.every(Number.isFinite))throw Error(`${t} requires ${e} finite components`);return i}var rl=["linearVelocity","angularVelocity","impulse","force","","angularImpulse","torque"];function Dc(o,e){if(this.destroyed)throw Error("The solver has been destroyed");let t=this.editInProgress,i=t?new xi:this.editStaging??=new xi;this.editInProgress=!0;try{return Gc.call(this,o,e,i)}finally{this.editInProgress=t}}function Gc(o,e,t){t.count=0;let i,r=(s,a)=>{if(e===3)return Be(s,3,a);if(!Number.isFinite(s))throw Error(`${a} must be finite`);return[s,0,0]};for(let s of o){let a=this.bodyIndex(s.body),{isTrigger:n,restitution:l,group:c,collidesWith:f,allowSleep:u}=s;if(n!==void 0||l!==void 0||c!==void 0||f!==void 0||u!==void 0){if(n!==void 0&&typeof n!="boolean")throw Error("isTrigger must be a boolean");if(u!==void 0&&typeof u!="boolean")throw Error("allowSleep must be a boolean");if(l!==void 0&&(!Number.isFinite(l)||l<0||l>1))throw Error("restitution must be between 0 and 1");if(f!==void 0&&c===void 0)throw Error("A collision-mask edit requires group as well");c!==void 0&&Us(c),f!==void 0&&Us(f),(i??=[]).push({index:a,isTrigger:n,restitution:l,group:c,collidesWith:f??4294967295,allowSleep:u})}let d=s.worldPoint===void 0?void 0:Be(s.worldPoint,e,"worldPoint");if(s.position!==void 0){let p=Be(s.position,e,"position"),m;if(s.rotation!==void 0){if(m=e===3?Be(s.rotation,4,"rotation"):[s.rotation],e===3){let h=Math.hypot(...m);if(!h)throw Error("rotation must be nonzero");m=m.map(b=>b/h)}else if(!Number.isFinite(s.rotation))throw Error("angle must be finite")}t.append(a,4,p,e===3?m:void 0,m!==void 0),e===2&&(t.words[(t.count-1)*12+6]=m?.[0]??0)}else if(s.rotation!==void 0)throw Error("A rotation edit requires position; use teleport for a full pose");for(let p=0;p<rl.length;p++){if(p===4)continue;let m=rl[p];if(s[m]===void 0)continue;let b=p===1||p>=5?r(s[m],m):Be(s[m],e,m);t.append(a,p,b,p===2||p===3?d:void 0,(p===2||p===3)&&d!==void 0),(p===3||p===6)&&(t.words[(t.count-1)*12+7]=this.params.dt)}}if(this.destroyed)throw Error("The solver was destroyed while reading body edits");t.count&&this.prepareBodyCommands().enqueueValidated(t);for(let s of i??[])s.isTrigger!==void 0&&this.setSensor(s.index,s.isTrigger),s.restitution!==void 0&&this.setRestitution(s.index,s.restitution),s.group!==void 0&&this.setFilters([s.index],[s.group],[s.collidesWith]),s.allowSleep!==void 0&&this.setSleepEnabled(s.index,s.allowSleep);return this}var Ns=class{constructor(e,t){this.solver=e,this.index=t}get gpuIndex(){return this.solver.liveIndex(this.index),this.index}setLinearVelocity(e){return this.solver.setLinearVelocity(this.gpuIndex,e),this}setAngularVelocity(e){return this.solver.setAngularVelocity(this.gpuIndex,e),this}applyImpulse(e,t){return this.solver.applyImpulse(this.gpuIndex,e,t),this}applyForce(e,t){return this.solver.applyForce(this.gpuIndex,e,t),this}applyAngularImpulse(e){return this.solver.applyAngularImpulse(this.gpuIndex,e),this}applyTorque(e){return this.solver.applyTorque(this.gpuIndex,e),this}teleport(e,t){return this.solver.teleport(this.gpuIndex,e,t),this}setTrigger(e){return this.solver.setSensor(this.gpuIndex,e),this.solver.wakeAll(),this}setRestitution(e){return this.solver.setRestitution(this.gpuIndex,e),this.solver.wakeAll(),this}setCollisionGroups(e,t=4294967295){return this.solver.setFilters([this.gpuIndex],[Us(e)],[Us(t)]),this.solver.wakeAll(),this}setSleepEnabled(e){return this.solver.setSleepEnabled(this.gpuIndex,e),this}wakeUp(){return this.solver.liveIndex(this.index),this.solver.wakeAll(),this}readState(){return this.solver.readBodyState(this.gpuIndex)}};function sl(o,{maxSubSteps:e=6,maxFrameTime:t=.05}={}){if(!Number.isInteger(e)||e<1||!Number.isFinite(t)||t<=0)throw Error("Stepping limits must be positive");let i=o.params.dt;if(!Number.isFinite(i)||i<=0)throw Error("Simulation timestep must be positive and finite");return{dt:i,maxSubSteps:e,maxFrameTime:t}}function ol(o,e,t,i){if(o.destroyed)throw Error("The solver has been destroyed");if(!Number.isFinite(e)||e<0)throw Error("elapsed must be finite nonnegative seconds");let{dt:r,maxSubSteps:s,maxFrameTime:a}=sl(o,t);o.timeAccumulator=Math.min(s*r,(o.timeAccumulator??0)+Math.min(a,e));let n=0;for(;o.timeAccumulator+1e-12>=r&&n<s;)o.step(),o.timeAccumulator=Math.max(0,o.timeAccumulator-r),n++,i?.(o);return n}function Fc(o,e){return ol(this,o,e)}function al(o,{afterStep:e,...t}={}){if(this.destroyed)throw Error("The solver has been destroyed");if(!o?.onBeforeRenderObservable?.add||!o?.onDisposeObservable?.addOnce||!o?.getEngine)throw Error("A Babylon scene is required");if(e!==void 0&&typeof e!="function")throw Error("afterStep must be a function");if(sl(this,t),this.sceneBinding){if(this.sceneBinding.scene===o)return this;throw Error("The solver is already attached to another scene")}let i=o.onBeforeRenderObservable.add(()=>{ol(this,Math.max(0,o.getEngine().getDeltaTime()/1e3),t,e)}),r=o.onDisposeObservable.addOnce(()=>this.destroy());return this.sceneBinding={scene:o,before:i,dispose:r},this}function nl(){let o=this.sceneBinding;return o&&(o.scene.onBeforeRenderObservable.remove(o.before),o.scene.onDisposeObservable.remove(o.dispose),this.sceneBinding=null,this.timeAccumulator=0),this}function qs(o,e,t){o.advance=Fc;let i,r;o.bodyIndex=function(a){if(this.destroyed)throw Error("The solver has been destroyed");let n=a;if(a instanceof Ns){if(a.solver!==this)throw Error("Body belongs to another solver");return a.gpuIndex}return typeof n!="number"&&t===3&&(r||(r=new WeakMap,e.bodies.forEach((l,c)=>r.set(l,this.gpuIndex(c)))),n=r.get(a)),this.liveIndex(n),n},o.body=function(a){let n=this.bodyIndex(a);return i??=new Map,i.has(n)||i.set(n,new Ns(this,n)),i.get(n)},o.editBodies=function(a){return Dc.call(this,a,t)},o.setLinearVelocities=function(a,n){if(this.destroyed)throw Error("The solver has been destroyed");return this.velocityBatch??=new Lt(this,t),this.velocityBatch.set(a,n),this},o.setVelocities=function(a,n){if(this.destroyed)throw Error("The solver has been destroyed");return n?.angular===void 0&&n?.linear!==void 0?this.setLinearVelocities(a,n.linear):n?.linear===void 0&&n?.angular!==void 0?this.setAngularVelocities(a,n.angular):(this.motionBatch??=new Ht(this,t),this.motionBatch.set(a,n),this)},o.setAngularVelocities=function(a,n){if(this.destroyed)throw Error("The solver has been destroyed");return this.angularVelocityBatch??=new Lt(this,t,"angular"),this.angularVelocityBatch.set(a,n),this};let s=o.destroy;return o.destroy=function(){this.destroyed||(this.velocityBatch?.destroy(),this.angularVelocityBatch?.destroy(),this.motionBatch?.destroy(),this.bodyReadback?.destroy(),this.editStaging=null,s.call(this),i?.clear(),r=null,e=null)},t===2&&(o.readSelectedBodies=function(a,{posesOnly:n=!1}={}){let l=a instanceof Uint32Array?a:Array.from(a);return l.forEach(c=>this.liveIndex(c)),this.flushEdits(),this.bodyReadback??=new Jt(this.device),this.bodyReadback.read(this.bodyBuffer,l,n,6)}),o}var Vs=class extends Fs{constructor(e,t,i){super(e,t,i),qs(this,null,2)}};var sa=`struct Body { pos:vec4f, rot:vec4f, initialPos:vec4f, initialRot:vec4f, size:vec4f, moment:vec4f, inertialPos:vec4f, inertialRot:vec4f, velocity:vec4f, angular:vec4f }
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
`;var oa=class extends ir{constructor(e){super(e,sa,3)}encodeAfterEdits(e,t){if(!this.hasTeleports)return;let i=this.solver,r=i.device;if(!this.invalidate){let c=r.createShaderModule({code:`const DISPATCH_STRIDE = ${r.limits.maxComputeWorkgroupsPerDimension*64}u;
${sa}`});this.invalidate=r.createComputePipeline({layout:"auto",compute:{module:c,entryPoint:"invalidate"}}),this.clearMarkers=r.createComputePipeline({layout:"auto",compute:{module:c,entryPoint:"clearMarkers"}})}(this.invalidateBody!==i.bodyBuffer||this.invalidateManifolds!==i.contactStorage.manifolds)&&(this.invalidateGroup=r.createBindGroup({layout:this.invalidate.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i.bodyBuffer}},{binding:3,resource:{buffer:i.contactStorage.manifolds}}]}),this.invalidateBody=i.bodyBuffer,this.invalidateManifolds=i.contactStorage.manifolds);let s=e.beginComputePass();s.setPipeline(this.invalidate),s.setBindGroup(0,this.invalidateGroup);let a=Math.ceil(i.manifoldCapacity/64),n=r.limits.maxComputeWorkgroupsPerDimension;s.dispatchWorkgroups(Math.min(a,n),Math.ceil(a/n)),s.end(),(this.markerBody!==i.bodyBuffer||this.markerCommands!==this.commands||this.markerRanges!==this.ranges||this.markerBytes!==t*8)&&(this.markerGroup=r.createBindGroup({layout:this.clearMarkers.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:i.bodyBuffer}},{binding:1,resource:{buffer:this.commands}},{binding:2,resource:{buffer:this.ranges,size:t*8}}]}),this.markerBody=i.bodyBuffer,this.markerCommands=this.commands,this.markerRanges=this.ranges,this.markerBytes=t*8),s=e.beginComputePass(),s.setPipeline(this.clearMarkers),s.setBindGroup(0,this.markerGroup);let l=Math.ceil(t/64);s.dispatchWorkgroups(Math.min(l,n),Math.ceil(l/n)),s.end()}},Ws=class extends Vt{constructor(e,t,i){super(e,t,i),this.nativeRef=t,qs(this,{bodies:t.bodies},3)}rigidAt(e){return this.nativeBodies||(this.nativeBodies=[],this.nativeRef.bodies.forEach((t,i)=>this.nativeBodies[this.gpuIndex(i)]=t)),this.nativeBodies[e]}rewriteBodies(e,t){if(super.rewriteBodies(e,t),this.nativeBodies)for(let i=0;i<e.length;i++)this.nativeBodies[e[i]]=t[i]}liveIndex(e){if(this.destroyed)throw Error("The 3D solver has been destroyed");if(!Number.isInteger(e)||e<0||e>=this.bodyCount)throw Error("A live 3D GPU body index is required")}queueBodyCommand(e,t,i,r,s=!1){return this.liveIndex(e),this.prepareBodyCommands(),this.bodyCommands.enqueue(e,t,i,r,s),this}prepareBodyCommands(){return this.wakeAll(),this.bodyCommands??=new oa(this)}setLinearVelocity(e,t){return this.queueBodyCommand(e,0,Be(t,3,"velocity"))}setAngularVelocity(e,t){return this.queueBodyCommand(e,1,Be(t,3,"angular velocity"))}applyImpulse(e,t,i){return this.queueBodyCommand(e,2,Be(t,3,"impulse"),i===void 0?void 0:Be(i,3,"point"),i!==void 0)}applyForce(e,t,i){return this.queueBodyCommand(e,3,[...Be(t,3,"force"),this.params.dt],i===void 0?void 0:Be(i,3,"point"),i!==void 0)}applyAngularImpulse(e,t){return this.queueBodyCommand(e,5,Be(t,3,"angular impulse"))}applyTorque(e,t){return this.queueBodyCommand(e,6,[...Be(t,3,"torque"),this.params.dt])}teleport(e,t,i){let r=Be(t,3,"position"),s;if(i!==void 0){s=Be(i,4,"rotation");let a=Math.hypot(...s);if(!a)throw Error("rotation must be nonzero");s=s.map(n=>n/a)}return this.queueBodyCommand(e,4,r,s,s!==void 0)}flushEdits(){if(this.destroyed)throw Error("The 3D solver has been destroyed");this.flushPropertyEdits(),this.sleeping?.wakeRequested&&this.sleeping.before(),this.bodyCommands?.flush()}readBodies(){return this.flushEdits(),super.readBodies()}readSelectedBodies(e,{posesOnly:t=!1}={}){let i=e instanceof Uint32Array?e:Array.from(e);return i.forEach(r=>this.liveIndex(r)),this.flushEdits(),this.bodyReadback??=new Jt(this.device),this.bodyReadback.read(this.bodyBuffer,i,t)}async readBodyState(e){let t=await this.readSelectedBodies([e]),i=this.rigidAt(e)?.mass??t[19];return{position:Array.from(t.subarray(0,3)),rotation:Array.from(t.subarray(4,8)),linearVelocity:Array.from(t.subarray(32,35)),angularVelocity:Array.from(t.subarray(36,39)),mass:i,effectiveMass:t[19],sleeping:i>0&&t[19]===0}}raycastAll(...e){return this.flushEdits(),super.raycastAll(...e)}sphereCastAll(...e){return this.flushEdits(),super.sphereCastAll(...e)}watchContacts({maxPairs:e=8192,maxEvents:t=4096,indices:i}={}){if(this.destroyed)throw Error("The 3D solver has been destroyed");if(i!==void 0){if(!Array.isArray(i))throw Error("Watched indices must be an array");i.forEach(r=>this.liveIndex(r))}for(let r of[e,t])if(!Number.isInteger(r)||r<1)throw Error("Contact capacities must be positive integers");if(this.contactWatch||(this.contactWatch=new $t(this.device,this.bodyBuffer,this.bodyCapacity,e,t),i===void 0&&(i=Array.from({length:this.bodyCount},(r,s)=>s))),i!==void 0){let r=new Set(i);this.contactWatch.setWatched(Array.from({length:this.bodyCount},(s,a)=>a),Array.from({length:this.bodyCount},(s,a)=>r.has(a)))}return this}async readContactEvents(){this.watchContacts();let e=await this.contactWatch.read();return{...e,events:e.events.map(t=>({...t,type:t.kind===Xt?"begin":"end",isTrigger:!!(this.triggers?.has(t.a)||this.triggers?.has(t.b))}))}}setSensor(e,t){super.setSensor(e,t),this.triggers??=new Set,t?this.triggers.add(e):this.triggers.delete(e)}setSleepEnabled(e,t){if(this.liveIndex(e),typeof t!="boolean")throw Error("Sleep flag must be boolean");let i=this.rigidAt(e);if(!i)throw Error("Sleep eligibility requires a scene body");return i.allowSleep=t,t&&!this.sleeping&&this.enableSleeping(),this.sleeping?.register(e,i.mass,t),this.wakeAll(),this}enableSleeping(e={},t={}){let i=e.bodies?e:this.nativeRef;return super.enableSleeping(i,e.bodies?t:e),this}disableSleeping(){return this.flushEdits(),this.sleeping&&(this.sleeping.wakeRequested=!0,this.sleeping.before(),this.sleeping.dispose(),this.sleeping=null),this}attachToScene(e,t){return al.call(this,e,t)}detachFromScene(){return nl.call(this)}step(){if(this.destroyed)throw Error("The 3D solver has been destroyed");super.step(),this.contactWatch?.run(this.contactStorage,this.manifoldCapacity,this.stepCount,this.params.dt)}destroy(){this.destroyed||(this.detachFromScene(),this.bodyCommands?.destroy(),this.contactWatch?.destroy(),super.destroy(),this.destroyed=!0)}};function Pr(o,e,t){if(o.split(e).length!==2)throw Error("Pinned solver changed; review the cloth kernel integration");return o.replace(e,t)}var Et=Pr(be,"  if (j >= params.jointCount || info[j].x != T_JOINT) { return; }",`  if (j >= params.jointCount) { return; }
  if (info[j].x == T_SPRING) {
    // Finite material stiffness: Eq. 16, with no hard-constraint multiplier.
    joints[j].penLin.x = min(joints[j].penLin.w, max(PENALTY_MIN, joints[j].penLin.x * params.gamma));
    return;
  }
  if (info[j].x != T_JOINT) { return; }`);Et=Pr(Et,"    let stiffness = k.penLin.w;","    let stiffness = k.penLin.x;");Et=Pr(Et,"    addRow(acc, n * sg, cross(r, n) * sg, stiffness, stiffness * (len - k.rA.w));",`    let force = stiffness * (len - k.rA.w);
    addRow(acc, n * sg, cross(r, n) * sg, stiffness, force);
    // Eq. 17: positive diagonal lumping of the geometric Hessian's column
    // norms. For C=|xA-xB|-L, G=(force/len)(I-n*n^T).
    let g = abs(force / len) * sqrt(max(vec3f(0.0), vec3f(1.0) - n*n));
    (*acc).lin += mat3x3f(vec3f(g.x,0.0,0.0), vec3f(0.0,g.y,0.0), vec3f(0.0,0.0,g.z));`);Et=Pr(Et,"  if (t != T_JOINT) { return; }",`  if (t == T_SPRING) {
    let a = info[j].y;
    let b = info[j].z;
    let C = length(anchorA(joints[j], a) - (qrotate(bodies[b].rot, joints[j].rB.xyz) + bodies[b].pos.xyz)) - joints[j].rA.w;
    joints[j].penLin.x = min(joints[j].penLin.w, joints[j].penLin.x + params.betaLin * abs(C));
    return;
  }
  if (t != T_JOINT) { return; }`);Et=Pr(Et,"fn finishBody(i: u32, acc: Acc) {",`fn finishBody(i: u32, acc: Acc) {
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
  }`);var ll=Et;var J=(o,e,t)=>{let i=Array.from(o);if(i.length!==e||!i.every(Number.isFinite))throw Error(`${t} requires ${e} finite components`);return i},V=(o,e,t=!1)=>{if(!Number.isFinite(o)||(t?o<0:o<=0))throw Error(`${e} must be ${t?"nonnegative":"positive"} and finite`);return o},cl=o=>{if(!Number.isInteger(o)||o<0||o>4294967295)throw Error("Collision masks must be unsigned 32-bit integers");return o};function Hs(o){for(let t of["allowSleep","isTrigger"])if(o[t]!==void 0&&typeof o[t]!="boolean")throw Error(`${t} must be a boolean`);let e=o.restitution??0;if(!Number.isFinite(e)||e<0||e>1)throw Error("restitution must be between 0 and 1");if(o.mass!==void 0&&(V(o.mass,"mass",!0),o.mass>0&&o.density===0))throw Error("A positive mass needs positive density");for(let t of["velocity","angularVelocity"])o[t]!==void 0&&J(o[t],3,t);if(o.rotation!==void 0&&!Math.hypot(...J(o.rotation,4,"rotation")))throw Error("rotation must be nonzero");cl(o.group??4294967295),cl(o.collidesWith??4294967295)}function ul(o,e){if(e.timeStep!==void 0&&(o.dt=V(e.timeStep,"timeStep")),e.iterations!==void 0){if(V(e.iterations,"iterations"),!Number.isInteger(e.iterations))throw Error("iterations must be an integer");o.iterations=e.iterations}if(e.gravity!==void 0){if(!Number.isFinite(e.gravity))throw Error("gravity must be finite");o.gravity=e.gravity}}var aa=class{constructor(e={}){if(this.ref=new jt,ul(this.ref,e),this.up=J(e.up??[0,1,0],3,"up"),Math.abs(Math.hypot(...this.up)-1)>1e-5)throw Error("up must be a unit vector");this.points=!1,this.handles=new Map,this.bodySet=new Set}get bodies(){return this.ref.bodies}get constraints(){return[...this.handles.values()]}assertEditable(){if(this.created)throw Error("Build this scene before createSolver; use the solver's GPU edit methods afterwards")}addBox(e,t={}){this.assertEditable(),Hs(t);let i=J(e,3,"size");i.forEach(s=>V(s,"size"));let r=new De(this.ref,i,V(t.density??1,"density",!0),V(t.friction??.6,"friction",!0),J(t.position??[0,0,0],3,"position"));return this.configure(r,t)}addSphere(e,t={}){return this.assertEditable(),Hs(t),this.configure(Mi(this.ref,V(e,"radius"),V(t.density??1,"density",!0),V(t.friction??.6,"friction",!0),J(t.position??[0,0,0],3,"position")),t)}addHull(e,t={}){if(this.assertEditable(),Hs(t),e.length%3||!Array.from(e).every(Number.isFinite))throw Error("Hull points must contain finite xyz triples");let i=or(e);if(!i)throw Error("A convex hull requires finite points spanning a volume");return this.hulls=!0,this.configure(Gr(this.ref,i,V(t.density??1,"density",!0),V(t.friction??.6,"friction",!0),J(t.position??[0,0,0],3,"position")),t)}addCapsule(e,t,i={}){return this.assertEditable(),Hs(i),this.configure(Hi(this.ref,e,t,V(i.density??1,"density",!0),V(i.friction??.6,"friction",!0),J(i.position??[0,0,0],3,"position")),i)}configure(e,t){if(t.allowSleep!==void 0&&typeof t.allowSleep!="boolean")throw Error("allowSleep must be a boolean");e.allowSleep=t.allowSleep??!0,this.sleepOptIn||=t.allowSleep===!0;let i=t.restitution??0;if(!Number.isFinite(i)||i<0||i>1)throw Error("restitution must be between 0 and 1");if(e.restitution=i,t.isTrigger!==void 0&&typeof t.isTrigger!="boolean")throw Error("isTrigger must be a boolean");if(e.isTrigger=t.isTrigger??!1,e.group=t.group??4294967295,e.collidesWith=t.collidesWith??4294967295,t.mass!==void 0){let r=V(t.mass,"mass",!0);if(e.mass===0&&r>0)throw Error("A positive mass needs positive density");let s=e.mass>0?r/e.mass:0;e.mass=r,e.moment.forEach((a,n)=>e.moment[n]=a*s)}if(t.rotation){let r=J(t.rotation,4,"rotation"),s=Math.hypot(...r);if(!s)throw Error("rotation must be nonzero");e.positionAng.set(r.map(a=>a/s))}return t.velocity&&e.velocityLin.set(J(t.velocity,3,"velocity")),t.angularVelocity&&e.velocityAng.set(J(t.angularVelocity,3,"angularVelocity")),this.bodySet.add(e),e}addPoint(e,{mass:t=.02,radius:i=.05,friction:r=.5}={}){let s=this.addSphere(i,{position:e,mass:t,friction:r});return s.moment.fill(0),this.points=!0,s}addFabric({columns:e=16,rows:t=16,spacing:i=.2,origin:r=[0,3,0],mass:s=.02,stiffness:a=1e3,anchorStiffness:n=a,materialAt:l,breakStrain:c=1/0,breakForce:f=1/0,bendingStiffness:u=Number.isFinite(c)||Number.isFinite(f)?0:a/50,pinCorners:d=!1,pinEdges:p=!d}={}){for(let[M,P]of Object.entries({columns:e,rows:t}))if(!Number.isInteger(P)||P<2)throw Error(`${M} must be an integer >= 2`);if(V(i,"spacing"),V(s,"mass"),V(a,"stiffness"),V(n,"anchorStiffness"),l!==void 0&&typeof l!="function")throw Error("materialAt must be a function");if(V(u,"bendingStiffness",!0),typeof d!="boolean"||typeof p!="boolean")throw Error("Fabric pin options must be boolean");let m=Pt({breakStrain:c,breakForce:f}),h=J(r,3,"origin"),b=(M,P)=>`${Math.min(M,P)},${Math.max(M,P)}`;function*y(){for(let M=0;M<t;M++)for(let P=0;P<e;P++){let _=M*e+P;P&&(yield[_,_-1,a]),M&&(yield[_,_-e,a]),P&&M&&(yield[_,_-e-1,a/2],yield[_-1,_-e,a/2]),P>1&&u&&(yield[_,_-2,u]),M>1&&u&&(yield[_,_-2*e,u])}}let v=new Map;if(l)for(let[M,P]of y()){let _=l((M%e+P%e)/(2*(e-1)),(Math.floor(M/e)+Math.floor(P/e))/(2*(t-1)))??{};if(typeof _!="object"||Array.isArray(_))throw Error("materialAt must return a material object");v.set(b(M,P),{scale:V(_.stiffnessScale??1,"materialAt.stiffnessScale"),material:Pt({...m,..._})})}let B=Array.from({length:t},(M,P)=>Array.from({length:e},(_,C)=>this.addPoint([h[0]+(C-(e-1)/2)*i,h[1],h[2]+(P-(t-1)/2)*i],{mass:p&&(C===0||P===0||C===e-1||P===t-1)||d&&(C===0||C===e-1)&&(P===0||P===t-1)?0:s,radius:i/Math.SQRT2}))),g=B.flat(),A=new Map(g.map((M,P)=>[M,P])),x=[],w=new Map,E=(M,P,_)=>{(M.mass===0||P.mass===0)&&(_*=n/a);let C=A.get(M),S=A.get(P),R=v.get(b(C,S)),I=this.addSpring(M,P,[0,0,0],[0,0,0],{stiffness:_*(R?.scale??1),...R?.material??m});return w.set(b(A.get(M),A.get(P)),x.length),x.push(I),I};for(let[M,P,_]of y())E(g[M],g[P],_);let k=[];for(let M=0;M<t;M++)for(let P=0;P<e;P++)if(P&&M){let _=(M-1)*e+P-1,C=_+1,S=M*e+P-1,R=S+1;k.push(_,S,C,C,S,R)}let z=[];for(let M=0;M<k.length;M+=3){let[P,_,C]=k.slice(M,M+3);z.push(w.get(b(P,_)),w.get(b(_,C)),w.get(b(C,P)))}return{points:g,grid:B,indices:Uint32Array.from(k),connections:x,triangleConnections:Uint32Array.from(z)}}addRope({segments:e=12,length:t=12,origin:i=[0,12,0],width:r=.15,endMass:s=20}={}){if(!Number.isInteger(e)||e<1)throw Error("segments must be a positive integer");V(t,"length"),V(r,"width"),V(s,"endMass",!0);let a=J(i,3,"origin"),n=t/e,l=this.addBox([r,r,r],{mass:0,position:a}),c=[];for(let f=0;f<e;f++){let u=this.addBox([r,n,r],{mass:1,position:[a[0],a[1]-(f+.5)*n,a[2]]});this.addJoint(f?c[f-1]:l,u,[0,f?-n/2:0,0],[0,n/2,0]),c.push(u)}if(s){let f=this.addBox([.6,.6,.6],{mass:s,position:[a[0],a[1]-t-.3,a[2]]});this.addJoint(c.at(-1),f,[0,-n/2,0],[0,.3,0]),c.push(f)}return{anchor:l,links:c}}addRagdoll({origin:e=[0,2,0],mass:t=10}={}){let i=J(e,3,"origin");V(t,"mass");let r=(l,c)=>this.addBox(l,{mass:t/10,position:c.map((f,u)=>f+i[u])}),s=r([.7,1.2,.35],[0,2,0]),a=this.addSphere(.25,{mass:t/10,position:[i[0],i[1]+2.9,i[2]]}),n=[s,a];this.addJoint(s,a,[0,.6,0],[0,-.3,0]);for(let l of[-1,1]){let c=r([.3,.8,.3],[l*.5,1.95,0]),f=r([.26,.7,.26],[l*.5,1.2,0]);this.addJoint(s,c,[l*.35,.35,0],[-l*.15,.4,0]),this.addJoint(c,f,[0,-.4,0],[0,.35,0]);let u=r([.28,.8,.3],[l*.2,1,0]),d=r([.26,.75,.28],[l*.2,.225,0]);this.addJoint(s,u,[l*.2,-.6,0],[0,.4,0]),this.addJoint(u,d,[0,-.4,0],[0,.375,0]),n.push(c,f,u,d)}return{torso:s,head:a,bodies:n}}addJoint(e,t,i=[0,0,0],r=[0,0,0],{linearStiffness:s=1/0,angularStiffness:a=0,breakForce:n=1/0,breakOnPull:l=!1}={}){this.assertEditable(),this.checkBodies(e,t);for(let c of[s,a,n])c!==1/0&&V(c,"joint stiffness/breakForce",!0);return this.handle(new we(this.ref,e,t,J(i,3,"anchorA"),J(r,3,"anchorB"),s,a,l&&n!==1/0?-n:n))}addSpring(e,t,i=[0,0,0],r=[0,0,0],{stiffness:s=1e3,rest:a=-1,breakStrain:n=1/0,breakForce:l=1/0}={}){if(this.assertEditable(),this.checkBodies(e,t),!e)throw Error("A spring requires two bodies");V(s,"stiffness",!0),a!==-1&&V(a,"rest",!0);let c=Pt({breakStrain:n,breakForce:l}),f=new ct(this.ref,e,t,J(i,3,"anchorA"),J(r,3,"anchorB"),s,a);return ts(f,c),this.handle(f)}checkBodies(e,t){if(!t||e===t||!this.bodySet.has(t)||e&&!this.bodySet.has(e))throw Error("Constraint endpoints must be distinct bodies in this scene")}addMotor(e,t,i={}){this.assertEditable(),this.checkBodies(e,t);let r=gt({...i,type:"motor"}),s=new we(this.ref,e,t,[0,0,0],[0,0,0],1/0,0);return Wi(s,r),this.handle(s)}addHinge(e,t,i={}){this.assertEditable(),this.checkBodies(e,t);let r=gt({...i,type:"limit"}),s=V(i.span??1,"span"),a=J(i.anchorA??[0,0,0],3,"anchorA"),n=J(i.anchorB??[0,0,0],3,"anchorB"),l=[-1,1].map(u=>this.addJoint(e,t,a.map((d,p)=>d+u*s*.5*r.axisA[p]),n.map((d,p)=>d+u*s*.5*r.axisB[p]))),c,f;if(i.minAngle!==void 0||i.maxAngle!==void 0){let u=new we(this.ref,e,t,[0,0,0],[0,0,0],1/0,0);Wi(u,r),c=this.handle(u)}return i.motor&&(f=this.addMotor(e,t,{axisA:r.axisA,axisB:r.axisB,...i.motor})),{joints:l,limit:c,motor:f,dispose(){for(let u of[...l,c,f])u?.dispose()}}}handle(e){let t={slot:-1,disposed:!1,dispose:()=>{t.disposed||(this.gpu?this.gpu.destroyed||this.gpu.releaseJoints([t.slot]):e.destroy(),this.handles.delete(e),t.disposed=!0)}};return t.destroy=t.dispose,this.handles.set(e,t),t}createSolver(e,t={}){if(this.assertEditable(),this.hulls&&e.limits.maxStorageBuffersPerShaderStage<9)throw Error("Hull collisions require nine storage buffer bindings");let i=new Ws(e,this.ref,us(this.ref,{...t,...this.points?{shaders:{...t.shaders,solve:ll}}:{}})),r=[];this.ref.forces.forEach((l,c)=>{this.handles.get(l).slot=c,l instanceof we&&l.stiffnessAng>0&&r.push({slot:c})}),i.captureConstraintFrames(r),i.params.up=[...this.up];let s=[],a=[],n=[];for(let[l,c]of this.ref.bodies.entries())(c.group!==4294967295||c.collidesWith!==4294967295)&&(s.push(i.gpuIndex(l)),a.push(c.group),n.push(c.collidesWith)),c.isTrigger&&i.setSensor(i.gpuIndex(l),!0),c.restitution>0&&i.setRestitution(i.gpuIndex(l),c.restitution);return s.length&&i.setFilters(s,a,n),(t.sleeping||this.sleepOptIn)&&i.enableSleeping(this.ref,t.sleeping===!0?{}:t.sleeping),this.gpu=i,this.created=!0,i}},na=class{constructor(e={}){if(this.topology=new ks,Object.assign(this.topology.params,As()),ul(this.topology.params,e),e.alpha!==void 0){if(!Number.isFinite(e.alpha)||e.alpha<0||e.alpha>1)throw Error("alpha must be between zero and one");this.topology.params.alpha=e.alpha}for(let t of["postStabilize","matchNearest"])if(e[t]!==void 0){if(typeof e[t]!="boolean")throw Error(`${t} must be boolean`);this.topology.params[t]=e[t]}}assertEditable(){if(this.created)throw Error("Build this scene before createSolver; use GPU edit methods afterwards")}get bodyCount(){return this.topology.bodyCount}addShape(e,t={}){let i=e.options??t,r=this.addBox(e.size,i);return Gs(this.topology,r,e,i.density??1),r}addCircle(e,t={}){return this.addShape(Os(e),t)}addHull(e,t={}){return this.addShape(Rs(e),t)}addCapsule(e,t,i={}){return this.addShape(js(e,t),i)}addSegment(e,t,i={}){return this.addShape(Ts(e,t,i))}addPlane(e=[0,1],t=0,i={}){return this.addShape(Ds(e,t,i))}addBox(e,{density:t=1,friction:i=.6,position:r=[0,0],angle:s=0,velocity:a=[0,0,0],restitution:n=0,isTrigger:l=!1,group:c=4294967295,collidesWith:f=4294967295,allowSleep:u}={}){if(this.assertEditable(),u!==void 0&&typeof u!="boolean")throw Error("allowSleep must be boolean");let d=J(e,2,"size");d.forEach(h=>V(h,"size"));let p=J(r,2,"position");if(!Number.isFinite(s))throw Error("angle must be finite");if(!Number.isFinite(n)||n<0||n>1)throw Error("restitution must be between 0 and 1");if(typeof l!="boolean")throw Error("isTrigger must be boolean");for(let h of[c,f])if(!Number.isInteger(h)||h<0||h>4294967295)throw Error("Collision masks must be unsigned 32-bit integers");let m=this.topology.addBody(d,V(t,"density",!0),V(i,"friction",!0),[...p,s],J(a,3,"velocity"));return this.restitution??=new Map,n>0&&this.restitution.set(m,n),this.sensors??=new Set,l&&this.sensors.add(m),this.filters??=new Map,(c!==4294967295||f!==4294967295)&&this.filters.set(m,[c,f]),this.topology.avbdSleepEligible??=new Map,u!==void 0&&this.topology.avbdSleepEligible.set(m,u),m}checkBodies(e,t){if(!Number.isInteger(e)||!Number.isInteger(t)||e<-1||e>=this.bodyCount||t<0||t>=this.bodyCount||e===t)throw Error("Invalid 2D constraint endpoints")}addJoint(e,t,i=[0,0],r=[0,0],{stiffness:s=[1/0,1/0,0],breakForce:a=1/0}={}){if(this.assertEditable(),this.checkBodies(e,t),!s||s.length!==3||Array.from(s).some(l=>l!==1/0&&(!Number.isFinite(l)||l<0))||a!==1/0&&(!Number.isFinite(a)||a<0))throw Error("Joint stiffness and break force must be nonnegative or Infinity");let n=this.topology.addJoint(e,t,J(i,2,"anchorA"),J(r,2,"anchorB"),s,a);return this.constraintHandle(n.slot,n)}constraintHandle(e,t={}){return Object.assign(t,{slot:e,alive:!0,disposed:!1}),t.dispose=()=>{t.disposed||(this.gpu&&!this.gpu.destroyed?this.gpu.disableConstraint(e):this.gpu||this.topology.data.fill(0,e*T+$,e*T+$+3),t.alive=!1,t.disposed=!0)},t.destroy=t.dispose,this.topology.handles[e]=t,t}addSpring(e,t,i=[0,0],r=[0,0],{stiffness:s=1e3,rest:a=1}={}){if(this.assertEditable(),this.checkBodies(e,t),e<0)throw Error("A spring requires two bodies");let n=this.topology.jointCount;return this.topology.addSpring(e,t,J(i,2,"anchorA"),J(r,2,"anchorB"),V(s,"stiffness",!0),V(a,"rest",!0)),this.constraintHandle(n)}addMotor(e,t,{speed:i=1,maxTorque:r=100}={}){if(this.assertEditable(),this.checkBodies(e,t),!Number.isFinite(i))throw Error("speed must be finite");let s=this.topology.jointCount;return this.topology.addMotor(e,t,i,V(r,"maxTorque",!0)),this.constraintHandle(s)}addAngularLimit(e,t,i={}){this.assertEditable(),this.checkBodies(e,t);let r=er(i),s=this.topology.addJoint(e,t,[0,0],[0,0],[0,0,0]);ia(this.topology,s.slot,r);let a=this.constraintHandle(s.slot,s);return a.setLimits=n=>{if(a.disposed)throw Error("The angular limit has been disposed");return this.gpu?this.gpu.setAngleLimits(a.slot,n):ia(this.topology,a.slot,er(n)),a},a}addHinge(e,t,i=[0,0],r=[0,0],s={}){this.assertEditable(),this.checkBodies(e,t);let a=J(i,2,"anchorA"),n=J(r,2,"anchorB"),l=s.minAngle!==void 0||s.maxAngle!==void 0?er(s):null,c=s.motor;if(c){if(!Number.isFinite(c.speed??1))throw Error("speed must be finite");V(c.maxTorque??100,"maxTorque",!0)}let f=this.addJoint(e,t,a,n),u=l?this.addAngularLimit(e,t,l):null,d=c?this.addMotor(e,t,c):null;return{joint:f,limits:u,motor:d,disposed:!1,dispose(){this.disposed||(this.joint.dispose(),this.limits?.dispose(),this.motor?.dispose(),this.disposed=!0)},destroy(){this.dispose()}}}createSolver(e,t={}){this.assertEditable();let i=new Vs(e,this.topology,t);for(let[r,s]of this.restitution??[])i.setRestitution(r,s);for(let r of this.sensors??[])i.setSensor(r,!0);for(let[r,s]of this.filters??[])i.setFilters([r],[s[0]],[s[1]]);return this.gpu=i,this.created=!0,i}};export{hs as AvbdPhysics,ps as AvbdPhysicsAggregate,ms as AvbdPhysicsBody,mr as AvbdPhysicsConstraint,br as AvbdPhysicsHinge,na as AvbdScene2D,aa as AvbdScene3D,Xe as AvbdShapeType,Xo as createWebGPUDevice,cs as prepareWebGPUDevice3D};
