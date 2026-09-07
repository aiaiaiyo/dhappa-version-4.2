import pandas as pd, numpy as np, json, math
from sklearn.linear_model import SGDClassifier
from scipy.stats import binomtest

PATH='/mnt/data/lottery_draw_dataset_230_rows.csv'
df=pd.read_csv(PATH, parse_dates=['Date']).sort_values('Date').reset_index(drop=True)
markets=[c for c in df.columns if c!='Date']
for c in markets: df[c]=pd.to_numeric(df[c], errors='coerce')

def rev(n): return (n%10)*10+n//10

def candidate_features(series, dates, idx, cand):
    hist=series.iloc[:idx].dropna().astype(int)
    if len(hist)==0: return None
    last=int(hist.iloc[-1]); last2=int(hist.iloc[-2]) if len(hist)>1 else last
    tens, ones=divmod(cand,10); lt,lo=divmod(last,10)
    arr=hist.to_numpy()
    w10=arr[-10:]; w30=arr[-30:]; w60=arr[-60:]
    # all features only historical or calendar-known
    def freq(window, x): return float(np.mean(window==x)) if len(window) else 0.0
    def digitfreq(window,d,which):
        if not len(window): return 0.0
        vals=(window//10 if which==0 else window%10)
        return float(np.mean(vals==d))
    gaps=np.where(arr==cand)[0]
    gap=(len(arr)-1-gaps[-1]) if len(gaps) else min(100,len(arr))
    date=dates.iloc[idx]
    return [
        freq(w10,cand),freq(w30,cand),freq(w60,cand),
        digitfreq(w30,tens,0),digitfreq(w30,ones,1),
        digitfreq(w60,tens,0),digitfreq(w60,ones,1),
        1.0 if cand==last else 0.0,
        1.0 if cand==rev(last) else 0.0,
        1.0 if tens==lt else 0.0, 1.0 if ones==lo else 0.0,
        1.0 if (tens+ones)%10==(lt+lo)%10 else 0.0,
        min(gap,60)/60.0,
        math.sin(2*math.pi*date.dayofweek/7), math.cos(2*math.pi*date.dayofweek/7),
        math.sin(2*math.pi*date.day/31), math.cos(2*math.pi*date.day/31),
        abs(cand-last)/99.0, abs(cand-last2)/99.0,
        1.0 if cand%11==0 else 0.0,
    ]

feature_names=['freq10','freq30','freq60','tens30','ones30','tens60','ones60','repeat_last','reverse_last','same_tens_last','same_ones_last','same_digit_sum_last','gap_norm','dow_sin','dow_cos','dom_sin','dom_cos','dist_last','dist_last2','double']
results={}
all_steps=[]
for market in markets:
    srs=df[market]
    valid=np.where(srs.notna())[0]
    steps=[]
    model=SGDClassifier(loss='log_loss', alpha=0.001, penalty='l2', random_state=42, learning_rate='optimal', average=True)
    initialized=False
    for idx in valid:
        if idx<30: continue
        y=int(srs.iloc[idx])
        feats=np.array([candidate_features(srs,df['Date'],idx,c) for c in range(100)],float)
        labels=np.array([1 if c==y else 0 for c in range(100)])
        weights=np.where(labels==1,99.0,1.0)
        if idx>=60 and initialized:
            probs=model.predict_proba(feats)[:,1]
            order=np.argsort(-probs)
            rank=int(np.where(order==y)[0][0])+1
            steps.append({'date':str(df['Date'].iloc[idx].date()),'actual':y,'rank':rank,'top5':rank<=5,'top10':rank<=10,'top20':rank<=20,'top36':rank<=36})
        if not initialized:
            model.partial_fit(feats,labels,classes=np.array([0,1]),sample_weight=weights)
            initialized=True
        else:
            model.partial_fit(feats,labels,sample_weight=weights)
    summary={'n':len(steps)}
    for k in [5,10,20,36]:
        hits=sum(x[f'top{k}'] for x in steps)
        rate=hits/len(steps) if steps else 0
        p=k/100
        bt=binomtest(hits,len(steps),p,alternative='greater') if steps else None
        summary[f'top{k}']={'hits':hits,'rate':rate,'random_baseline':p,'lift':rate/p if p else None,'p_value':bt.pvalue if bt else None}
    summary['mean_rank']=float(np.mean([x['rank'] for x in steps])) if steps else None
    coefs=model.coef_[0]
    imps=sorted(zip(feature_names,coefs), key=lambda z:abs(z[1]),reverse=True)
    summary['top_coefficients']=[{'feature':a,'coefficient':float(b)} for a,b in imps[:8]]
    results[market]={'summary':summary,'steps':steps}

# pooled results
pooled=[]
for m in markets:
    for s in results[m]['steps']: pooled.append((m,s))
pooled_summary={'n':len(pooled)}
for k in [5,10,20,36]:
    hits=sum(s[f'top{k}'] for _,s in pooled); n=len(pooled); p=k/100
    pooled_summary[f'top{k}']={'hits':hits,'rate':hits/n,'random_baseline':p,'lift':(hits/n)/p,'p_value':binomtest(hits,n,p,alternative='greater').pvalue}
pooled_summary['mean_rank']=float(np.mean([s['rank'] for _,s in pooled]))

out={'dataset':{'rows':len(df),'date_min':str(df.Date.min().date()),'date_max':str(df.Date.max().date()),'markets':markets,'missing':{m:int(df[m].isna().sum()) for m in markets}},'method':'Expanding-window, zero-lookahead candidate-ranking logistic regression; retrained every 7 evaluated draws; calendar + lag/rolling-frequency features only.','markets':results,'pooled':pooled_summary}
with open('/mnt/data/ml_walkforward_report.json','w') as f: json.dump(out,f,indent=2)
print(json.dumps({'dataset':out['dataset'],'pooled':pooled_summary,'markets':{m:results[m]['summary'] for m in markets}},indent=2))
