/**
 * Content for the "Beyond the 4% Rule: Dynamic Withdrawal Strategies" blog post
 */

export const content = `<div class="lead-quote">
  <blockquote>
    "The 4% rule is a rule of thumb, not a law of nature. Flexibility is the true safeguard against failure."
    <cite>— Michael Kitces</cite>
  </blockquote>
</div>

<div class="article-intro">
  The "4% Rule" is the bedrock of FIRE planning, but it has a major flaw: it assumes you are a robot who blindly sells assets even when the market is crashing. In reality, humans can adapt. Dynamic withdrawal strategies—adjusting your spending based on portfolio performance—can significantly reduce sequence of returns risk and allow for a higher initial safe withdrawal rate.
</div>

## The Problem with Static Withdrawals 📉

<div class="concept-box">
  <h4>Sequence of Returns Risk</h4>
  <p>If the stock market crashes 20% in the first year of your retirement, selling 4% of your original portfolio value actually depletes a much larger percentage of your remaining assets. This early depletion is the primary cause of portfolio failure in retirement simulations.</p>
</div>

## Strategy 1: The Guyton-Klinger Guardrails 🚧

This strategy sets upper and lower bounds for your withdrawal rate, forcing you to adjust if the market moves significantly.

<div class="styles-grid">
  <div class="style-card">
    <h3>Capital Preservation Rule</h3>
    <div class="style-details">
      <p>If your current withdrawal rate (Withdrawal $$ ÷ Current Portfolio $$) rises 20% above your initial target, cut your spending by 10%.</p>
      <p><em>Example: Target 4%. If current portfolio drops so that you are withdrawing 4.8%, cut spending.</em></p>
    </div>
  </div>
  
  <div class="style-card">
    <h3>Prosperity Rule</h3>
    <div class="style-details">
      <p>If your current withdrawal rate falls 20% below your initial target, increase your spending by 10%.</p>
      <p><em>Example: Portfolio booms, withdrawal rate drops to 3.2%. Give yourself a raise!</em></p>
    </div>
  </div>
</div>

## Strategy 2: The CAPE-Based Rule (Variable Percentage) 📊

Based on the Shiller PER (Cyclically Adjusted Price-to-Earnings ratio), this strategy adjusts withdrawals based on market valuation.

<div class="formula-highlight">
  Withdrawal Rate = CA / CAPE Yield
</div>

<p>Simply put: When stocks are expensive (high CAPE), you withdraw less because future returns are likely lower. When stocks are cheap (low CAPE), you withdraw more because future Expected returns are higher.</p>

<ul>
  <li><strong>Pros:</strong> Mathematically aligns spending with market valuations.</li>
  <li><strong>Cons:</strong> Can result in volatile income streams year-to-year.</li>
</ul>

## Strategy 3: The "Cash Buffer" or "Bucket" Strategy 🪣

Instead of changing your *rate*, you change *where* the money comes from.

<div class="strategy-box">
  <h4>The 3-Bucket System</h4>
  <ol>
    <li><strong>Bucket 1 (Cash):</strong> 1-2 years of expenses in High Yield Savings. Use this for spending.</li>
    <li><strong>Bucket 2 (Bonds/Safe):</strong> 3-7 years of expenses. Refill Bucket 1 from here when stocks are down.</li>
    <li><strong>Bucket 3 (Stocks/Growth):</strong> The rest of the portfolio. Refill Buckets 1 & 2 only when stocks are up.</li>
  </ol>
  <p><strong>Result:</strong> You never have to sell stocks at a loss to buy groceries.</p>
</div>

## Strategy 4: The 95% Rule 🛡️

A simpler version of guardrails.

<div class="implementation-tip">
  <h4>How it works</h4>
  <p>If your portfolio value is down for the year, you still take your inflation-adjusted withdrawal, but <strong>capped at 95% of last year's withdrawal amount</strong>. You simply "tighten your belt" by 5% during down years.</p>
  <p>This small adjustment (skipping a vacation, eating out less) during bear markets has a massive positive impact on long-term portfolio survivability.</p>
</div>

## Comparison of Outcomes 🔍

<div class="table-container">
  <table>
    <thead>
      <tr>
        <th>Strategy</th>
        <th>Success Rate (30 yrs)</th>
        <th>Ending Portfolio Value</th>
        <th>Income Stability</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Static 4% Rule</td>
        <td>~95%</td>
        <td>Variable (High)</td>
        <td>Very High (Stable)</td>
      </tr>
      <tr>
        <td>Guardrails</td>
        <td>~99%</td>
        <td>High</td>
        <td>Moderate</td>
      </tr>
      <tr>
        <td>Variable % (CAPE)</td>
        <td>~100%</td>
        <td>Moderate</td>
        <td>Low (Volatile)</td>
      </tr>
    </tbody>
  </table>
</div>

## Conclusion: Flexibility is Freedom 🕊️

The rigid "4% Rule" is a planning tool, not a suicide pact. By adopting a dynamic strategy, you can likely retire sooner (with a higher initial withdrawal rate like 4.5% or 5%) because you have a plan to cut back if—and only if—disaster strikes.

<div class="reflection-prompts">
  <h4>Planning Your Withdrawal Strategy</h4>
  <ul>
    <li>What percentage of your budget is "discretionary" (travel, dining) vs. "essential" (housing, food)?</li>
    <li>Could you survive on 20% less income for 2-3 years during a recession?</li>
    <li>Does your portfolio allocation support a "Cash Buffer" strategy?</li>
    <li>Are you psychologically prepared to give yourself a pay cut in retirement?</li>
  </ul>
</div>

---

<div class="engagement-section">
  <div class="resource-links">
    <h5>Related Articles:</h5>
    <ul>
      <li><a href="/blog/investment-strategies-2023">Investment Strategies for FIRE</a></li>
      <li><a href="/blog/psychology-financial-independence">The Psychology of Market Volatility</a></li>
      <li><a href="/blog/fire-basics-101">Understanding the 4% Rule</a></li>
    </ul>
  </div>
</div>

[Back to Blog](/blog)`;
