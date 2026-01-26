# Relevance Score: Minimum Views Calculation

## 🎯 Problem Statement

**Given Parameters**:
- Semantic Score: 0.7
- Helpful Ratio: 0% (null or 0)
- Pinned: false
- **Target Final Score**: 0.8

**Find**: Minimum number of views required

---

## 📐 Mathematical Setup

### **Scoring Formula**

```
Final Score = min(
  Semantic Score 
  + Helpful Boost 
  + View Boost 
  + Pin Boost,
  1.0
)
```

### **Substituting Known Values**

```
0.8 = min(
  0.7 
  + (0/100) * 0.1     [Helpful Boost]
  + min(log(v+1)*0.05, 0.1)  [View Boost]
  + 0                 [Pin Boost]
  , 1.0
)
```

### **Simplifying**

```
0.8 = min(
  0.7 
  + 0 
  + min(log(v+1)*0.05, 0.1)
  + 0
  , 1.0
)

0.8 = min(
  0.7 + min(log(v+1)*0.05, 0.1)
  , 1.0
)
```

Since we're looking for a score of 0.8, which is less than 1.0, the `min()` function will not clamp the result. Therefore:

```
0.8 = 0.7 + min(log(v+1)*0.05, 0.1)
```

---

## 🔍 Solving for View Boost

Rearranging the equation:

```
0.8 - 0.7 = min(log(v+1)*0.05, 0.1)
0.1 = min(log(v+1)*0.05, 0.1)
```

This equation tells us that the view boost must equal exactly 0.1.

Since `min(log(v+1)*0.05, 0.1)` equals 0.1, we have two cases:

**Case 1**: `log(v+1)*0.05 ≥ 0.1` (the logarithmic term is at or above the cap)

In this case:
```
log(v+1)*0.05 ≥ 0.1
log(v+1) ≥ 0.1 / 0.05
log(v+1) ≥ 2
```

**Case 2**: `log(v+1)*0.05 < 0.1` (the logarithmic term is below the cap)

In this case, the view boost would be less than 0.1, and we couldn't reach a final score of 0.8.

Therefore, we need **Case 1** to be true.

---

## 🧮 Solving the Logarithm

From Case 1:
```
log(v+1) ≥ 2
```

Using the property that `log(x) = 2` means `x = e^2` (natural logarithm):

```
v + 1 = e^2
v + 1 = 7.389...
v = 6.389...
```

Since we need an integer number of views, and we need `v ≥ 6.389`:

```
v_min = 7 views
```

---

## ✅ Verification

Let's verify that 7 views gives us a final score of at least 0.8:

### **With 7 Views**

```
View Boost = min(log(7+1)*0.05, 0.1)
           = min(log(8)*0.05, 0.1)
           = min(2.079*0.05, 0.1)
           = min(0.104, 0.1)
           = 0.1 (clamped)

Final Score = 0.7 + 0 + 0.1 + 0
            = 0.8 ✓
```

**Result**: With 7 views, the final score is exactly 0.8.

---

### **With 6 Views**

```
View Boost = min(log(6+1)*0.05, 0.1)
           = min(log(7)*0.05, 0.1)
           = min(1.946*0.05, 0.1)
           = min(0.0973, 0.1)
           = 0.0973 (not clamped)

Final Score = 0.7 + 0 + 0.0973 + 0
            = 0.7973 ✗ (less than 0.8)
```

**Result**: With 6 views, the final score is 0.7973, which is less than 0.8.

---

## 📊 Detailed Calculation Table

| Views | log(v+1) | log(v+1)*0.05 | View Boost | Final Score |
|-------|----------|---------------|-----------|-------------|
| 1 | 1.609 | 0.0805 | 0.0805 | 0.7805 |
| 2 | 1.792 | 0.0896 | 0.0896 | 0.7896 |
| 3 | 1.946 | 0.0973 | 0.0973 | 0.7973 |
| 4 | 2.079 | 0.1040 | 0.1000 | 0.8000 |
| 5 | 2.197 | 0.1099 | 0.1000 | 0.8000 |
| 6 | 2.303 | 0.1152 | 0.1000 | 0.8000 |
| 7 | 2.398 | 0.1199 | 0.1000 | 0.8000 |
| 8 | 2.485 | 0.1243 | 0.1000 | 0.8000 |
| 10 | 2.639 | 0.1320 | 0.1000 | 0.8000 |
| 100 | 4.615 | 0.2308 | 0.1000 | 0.8000 |
| 1000 | 6.909 | 0.3454 | 0.1000 | 0.8000 |

---

## 🎯 Answer

**Minimum Views Required: 7**

With the given parameters:
- Semantic Score: 0.7
- Helpful Ratio: 0%
- Pinned: false

An FAQ needs **at least 7 views** to achieve a final relevance score of 0.8.

---

## 💡 Key Insights

### **1. View Boost Clamping**

The view boost is capped at 0.1 maximum. This happens when:
```
log(v+1)*0.05 ≥ 0.1
log(v+1) ≥ 2
v+1 ≥ e^2 ≈ 7.389
v ≥ 6.389
```

So any FAQ with **7 or more views** will have the maximum view boost of 0.1.

### **2. Logarithmic Scaling**

The logarithmic scaling means:
- 1 view → +0.0805 boost
- 2 views → +0.0896 boost
- 3 views → +0.0973 boost
- 4+ views → +0.1 boost (clamped)

The boost increases quickly at first, then plateaus at 0.1.

### **3. Diminishing Returns**

Going from 1 to 2 views adds +0.0091 to the boost.
Going from 2 to 3 views adds +0.0077 to the boost.
Going from 3 to 4 views adds +0.0027 to the boost.

Each additional view adds less to the boost (diminishing returns).

### **4. Practical Implication**

For an FAQ with poor semantic match (0.7) and no helpful votes:
- It needs at least 7 views to be considered "good" (0.8 score)
- After 7 views, additional views don't improve the score (capped at 0.8)
- To improve further, it needs helpful votes or better semantic match

---

## 🔍 Extended Analysis

### **What if we want a score of 0.85?**

```
0.85 = 0.7 + Helpful Boost + View Boost + Pin Boost

With 0% helpful and not pinned:
0.85 = 0.7 + 0 + View Boost + 0
0.15 = View Boost

But View Boost is capped at 0.1, so:
Maximum achievable score = 0.7 + 0.1 = 0.8

Conclusion: Cannot reach 0.85 with these parameters.
Need either:
- Helpful votes (up to +0.1)
- Pin status (up to +0.15)
- Better semantic match (up to +1.0)
```

### **What if we want a score of 0.8 with 0 views?**

```
0.8 = 0.7 + 0 + min(log(1)*0.05, 0.1) + 0
0.8 = 0.7 + 0 + min(0, 0.1) + 0
0.8 = 0.7 + 0
0.8 = 0.7

This is false, so it's impossible with 0 views.
```

### **What if we want a score of 0.8 with helpful votes?**

```
0.8 = 0.7 + (h/100)*0.1 + min(log(v+1)*0.05, 0.1) + 0

With 50% helpful and 0 views:
0.8 = 0.7 + 0.05 + 0 + 0
0.8 = 0.75

Still not enough. Need more helpful votes or views.

With 100% helpful and 0 views:
0.8 = 0.7 + 0.1 + 0 + 0
0.8 = 0.8 ✓

So with 100% helpful and 0 views, we can reach 0.8.
```

---

## 📋 Summary

| Question | Answer |
|----------|--------|
| Minimum views for 0.8 score | **7 views** |
| View boost at 7 views | 0.1 (clamped) |
| Final score with 7 views | 0.8 |
| Maximum achievable score | 0.8 (with these parameters) |
| Why maximum is 0.8? | View boost capped at 0.1, no helpful votes, not pinned |

---

## 🧮 Mathematical Proof

**Theorem**: For parameters (semantic=0.7, helpful=0%, pinned=false), the minimum views to achieve score 0.8 is 7.

**Proof**:

1. The scoring formula is:
   ```
   score = min(0.7 + min(log(v+1)*0.05, 0.1), 1.0)
   ```

2. To achieve score = 0.8:
   ```
   0.8 = min(0.7 + min(log(v+1)*0.05, 0.1), 1.0)
   ```

3. Since 0.8 < 1.0, the outer min() doesn't apply:
   ```
   0.8 = 0.7 + min(log(v+1)*0.05, 0.1)
   ```

4. Rearranging:
   ```
   0.1 = min(log(v+1)*0.05, 0.1)
   ```

5. For this equation to hold, we need:
   ```
   log(v+1)*0.05 ≥ 0.1
   log(v+1) ≥ 2
   v+1 ≥ e^2 ≈ 7.389
   v ≥ 6.389
   ```

6. Since v must be an integer:
   ```
   v_min = 7
   ```

7. Verification:
   ```
   score(7) = 0.7 + min(log(8)*0.05, 0.1)
            = 0.7 + min(0.104, 0.1)
            = 0.7 + 0.1
            = 0.8 ✓
   ```

**Q.E.D.** ∎

---

## 🎯 Practical Application

In the Ologywood FAQ system, this means:

**Scenario**: A new FAQ about "Payment processing" has:
- Good semantic match (0.7)
- No helpful votes yet (0%)
- Not pinned

**Question**: How many people need to view it before it appears in the "good" results?

**Answer**: At least 7 people need to view it.

**Timeline**:
- 1 view → score 0.7805 (poor)
- 2 views → score 0.7896 (poor)
- 3 views → score 0.7973 (poor)
- 4 views → score 0.8000 (good) ✓
- 7 views → score 0.8000 (good) ✓

**Minimum**: 4 views (not 7!)

Let me recalculate...

Actually, looking at the table above, at 4 views:
```
log(4+1) = log(5) = 1.609
1.609 * 0.05 = 0.0805

Wait, that's not right. Let me recalculate the table.
```

---

## 🔧 Corrected Calculation

Let me recalculate more carefully:

```
For v views, view boost = min(ln(v+1)*0.05, 0.1)

v=1: ln(2)*0.05 = 0.693*0.05 = 0.0347
v=2: ln(3)*0.05 = 1.099*0.05 = 0.0549
v=3: ln(4)*0.05 = 1.386*0.05 = 0.0693
v=4: ln(5)*0.05 = 1.609*0.05 = 0.0805
v=5: ln(6)*0.05 = 1.792*0.05 = 0.0896
v=6: ln(7)*0.05 = 1.946*0.05 = 0.0973
v=7: ln(8)*0.05 = 2.079*0.05 = 0.1040 → clamped to 0.1
v=8: ln(9)*0.05 = 2.197*0.05 = 0.1099 → clamped to 0.1
```

So the view boost reaches 0.1 (and gets clamped) starting at **v=7**.

Therefore, the minimum views required is **7**.

---

## ✅ Final Answer

**Minimum Views Required: 7**

**Calculation**:
```
Target Score: 0.8
Base Score: 0.7 (semantic)
Required Boost: 0.1

View Boost Formula: min(ln(v+1)*0.05, 0.1)

For boost = 0.1:
ln(v+1)*0.05 ≥ 0.1
ln(v+1) ≥ 2
v+1 ≥ e^2 ≈ 7.389
v ≥ 6.389

Minimum integer: v = 7

Verification:
score(7) = 0.7 + min(ln(8)*0.05, 0.1)
         = 0.7 + min(0.1040, 0.1)
         = 0.7 + 0.1
         = 0.8 ✓
```

