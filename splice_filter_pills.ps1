$file = 'h:\Gravity\js\ui.js'
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# ── 1. Loan renderer: replace search+filter block ──────────────────────────────
$loanOld = @'
      const search = this.fastInputState.search.toLowerCase();
      const finalItems = displayItems.filter((item) => {
        if (!item || !item.borrower) return false;
        if (!search) return true;
        const b = item.borrower;
        return (
          b.name.toLowerCase().includes(search) ||
          (b.mobile  || "").includes(search) ||
          (b.serialNo || "").includes(search) ||
          (item.loan.loanNo || "").includes(search)
        );
      });

      if (finalItems.length === 0) {
'@

$loanNew = @'
      const search = this.fastInputState.search.toLowerCase();
      const allFinalItems = displayItems.filter((item) => {
        if (!item || !item.borrower) return false;
        if (!search) return true;
        const b = item.borrower;
        return (
          b.name.toLowerCase().includes(search) ||
          (b.mobile  || "").includes(search) ||
          (b.serialNo || "").includes(search) ||
          (item.loan.loanNo || "").includes(search)
        );
      });

      if (allFinalItems.length === 0) {
'@

$content = $content.Replace($loanOld, $loanNew)

# ── 2. Loan renderer: replace empty state content and inject pills + filter ────
$loanEmptyOld = @'
        listContainer.innerHTML = `<div style="text-align:center;color:#94a3b8;margin-top:4rem;padding:2rem;"><div style="width:72px;height:72px;background:#f1f5f9;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;"><i class="fa-solid fa-calendar-xmark" style="font-size:1.75rem;color:#cbd5e1;"></i></div><p style="font-weight:600;color:#64748b;margin-bottom:0.25rem;">No loan collections for this date</p><p style="font-size:0.85rem;">Try a different date or check the schedule.</p></div>`;
        return;
      }

      const paidCount = finalItems.filter((i) => i.scheduleItem?.status === "PAID" || i.existingTxn).length;
'@

$loanEmptyNew = @'
        listContainer.innerHTML = `<div style="text-align:center;color:#94a3b8;margin-top:4rem;padding:2rem;"><div style="width:72px;height:72px;background:#f1f5f9;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;"><i class="fa-solid fa-calendar-xmark" style="font-size:1.75rem;color:#cbd5e1;"></i></div><p style="font-weight:600;color:#64748b;margin-bottom:0.25rem;">No loan collections for this date</p><p style="font-size:0.85rem;">Try a different date or check the schedule.</p></div>`;
        return;
      }

      // Compute pill amounts for Loan
      let paidPillAmt = 0, duePillAmt = 0;
      allFinalItems.forEach((item) => {
        const s = item.scheduleItem, txn = item.existingTxn, l = item.loan;
        const dueAmt  = parseFloat(s?.amount || l.installmentAmount || 0);
        const paidAmt = parseFloat(s?.paidAmount || (txn ? txn.amount : 0));
        const done = (paidAmt >= dueAmt && dueAmt > 0) || s?.status === "PAID" || (!!txn && !s);
        if (done) paidPillAmt += paidAmt; else duePillAmt += Math.max(0, dueAmt - paidAmt);
      });
      const paidPillCnt = allFinalItems.filter((item) => {
        const s = item.scheduleItem, txn = item.existingTxn, l = item.loan;
        const dueAmt  = parseFloat(s?.amount || l.installmentAmount || 0);
        const paidAmt = parseFloat(s?.paidAmount || (txn ? txn.amount : 0));
        return (paidAmt >= dueAmt && dueAmt > 0) || s?.status === "PAID" || (!!txn && !s);
      }).length;
      const duePillCnt = allFinalItems.length - paidPillCnt;

      // Inject filter pills
      const pillBarL = document.getElementById("filter-pill-bar");
      if (pillBarL) {
        const sfL = this.fastInputState.statusFilter;
        pillBarL.innerHTML = `<div style="display:flex;gap:0.5rem;padding:0.85rem 0 0.25rem 0;">
  <button onclick="window.ui.fastInputState.statusFilter='all';window.ui.renderFastCollection();" style="flex:1;padding:0.5rem 0.4rem;border-radius:12px;border:2px solid ${sfL==="all"?"var(--primary-color)":"#e2e8f0"};background:${sfL==="all"?"var(--primary-color)":"white"};color:${sfL==="all"?"white":"#64748b"};font-weight:700;font-size:0.73rem;cursor:pointer;transition:all 0.2s;text-align:center;line-height:1.4;">
    <div style="font-size:0.6rem;opacity:0.8;letter-spacing:0.4px;">ALL</div>
    <div style="font-size:0.9rem;font-weight:800;">&#8377;${(paidPillAmt+duePillAmt).toLocaleString()}</div>
    <div style="font-size:0.6rem;opacity:0.7;">${allFinalItems.length} loans</div>
  </button>
  <button onclick="window.ui.fastInputState.statusFilter='paid';window.ui.renderFastCollection();" style="flex:1;padding:0.5rem 0.4rem;border-radius:12px;border:2px solid ${sfL==="paid"?"var(--success)":"#e2e8f0"};background:${sfL==="paid"?"rgba(16,185,129,0.1)":"white"};color:${sfL==="paid"?"var(--success)":"#64748b"};font-weight:700;font-size:0.73rem;cursor:pointer;transition:all 0.2s;text-align:center;line-height:1.4;">
    <div style="display:flex;align-items:center;justify-content:center;gap:3px;font-size:0.6rem;opacity:0.8;letter-spacing:0.4px;"><i class="fa-solid fa-check-circle" style="font-size:0.55rem;"></i> PAID</div>
    <div style="font-size:0.9rem;font-weight:800;">&#8377;${paidPillAmt.toLocaleString()}</div>
    <div style="font-size:0.6rem;opacity:0.7;">${paidPillCnt} loans</div>
  </button>
  <button onclick="window.ui.fastInputState.statusFilter='due';window.ui.renderFastCollection();" style="flex:1;padding:0.5rem 0.4rem;border-radius:12px;border:2px solid ${sfL==="due"?"var(--danger)":"#e2e8f0"};background:${sfL==="due"?"rgba(239,68,68,0.08)":"white"};color:${sfL==="due"?"var(--danger)":"#64748b"};font-weight:700;font-size:0.73rem;cursor:pointer;transition:all 0.2s;text-align:center;line-height:1.4;">
    <div style="display:flex;align-items:center;justify-content:center;gap:3px;font-size:0.6rem;opacity:0.8;letter-spacing:0.4px;"><i class="fa-solid fa-clock" style="font-size:0.55rem;"></i> DUE</div>
    <div style="font-size:0.9rem;font-weight:800;">&#8377;${duePillAmt.toLocaleString()}</div>
    <div style="font-size:0.6rem;opacity:0.7;">${duePillCnt} loans</div>
  </button>
</div>`;
      }

      // Apply status filter
      const sfL2 = this.fastInputState.statusFilter;
      const finalItems = allFinalItems.filter((item) => {
        if (sfL2 === "all") return true;
        const s = item.scheduleItem, txn = item.existingTxn, l = item.loan;
        const dueAmt  = parseFloat(s?.amount || l.installmentAmount || 0);
        const paidAmt = parseFloat(s?.paidAmount || (txn ? txn.amount : 0));
        const done = (paidAmt >= dueAmt && dueAmt > 0) || s?.status === "PAID" || (!!txn && !s);
        return sfL2 === "paid" ? done : !done;
      });

      if (finalItems.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center;color:#94a3b8;margin-top:3rem;padding:2rem;"><div style="width:60px;height:60px;background:#f1f5f9;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;"><i class="fa-solid fa-filter" style="font-size:1.3rem;color:#cbd5e1;"></i></div><p style="font-weight:600;color:#64748b;margin-bottom:0.25rem;">No ${sfL2==="paid"?"paid":"due"} items</p><p style="font-size:0.85rem;">Switch filter above.</p></div>`;
        return;
      }

      const paidCount = finalItems.filter((i) => i.scheduleItem?.status === "PAID" || i.existingTxn).length;
'@

$content = $content.Replace($loanEmptyOld, $loanEmptyNew)

# ── 3. Savings renderer: replace search+filter block ───────────────────────────
$savOld = @'
      const search = this.fastInputState.search.toLowerCase();
      const finalItems = displayItems.filter((item) => {
        if (!item || !item.user) return false;
        if (!search) return true;
        const u = item.user;
        return (
          u.name.toLowerCase().includes(search) ||
          (u.mobile   || "").includes(search) ||
          (u.serialNo || "").includes(search) ||
          (item.savings.accountNo || "").includes(search)
        );
      });

      if (finalItems.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center;color:#94a3b8;margin-top:4rem;padding:2rem;"><div style="width:72px;height:72px;background:#faf5ff;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;"><i class="fa-solid fa-piggy-bank" style="font-size:1.75rem;color:#c4b5fd;"></i></div><p style="font-weight:600;color:#64748b;margin-bottom:0.25rem;">No savings deposits for this date</p><p style="font-size:0.85rem;">Try a different date or check the savings schedule.</p></div>`;
        return;
      }

      const paidCount = finalItems.filter((i) => i.scheduleItem?.status === "PAID" || i.existingTxn).length;
'@

$savNew = @'
      const search = this.fastInputState.search.toLowerCase();
      const allFinalItems = displayItems.filter((item) => {
        if (!item || !item.user) return false;
        if (!search) return true;
        const u = item.user;
        return (
          u.name.toLowerCase().includes(search) ||
          (u.mobile   || "").includes(search) ||
          (u.serialNo || "").includes(search) ||
          (item.savings.accountNo || "").includes(search)
        );
      });

      if (allFinalItems.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center;color:#94a3b8;margin-top:4rem;padding:2rem;"><div style="width:72px;height:72px;background:#faf5ff;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;"><i class="fa-solid fa-piggy-bank" style="font-size:1.75rem;color:#c4b5fd;"></i></div><p style="font-weight:600;color:#64748b;margin-bottom:0.25rem;">No savings deposits for this date</p><p style="font-size:0.85rem;">Try a different date or check the savings schedule.</p></div>`;
        return;
      }

      // Compute pill amounts for Savings
      let paidPillAmt = 0, duePillAmt = 0;
      allFinalItems.forEach((item) => {
        const s = item.scheduleItem, sav = item.savings;
        const dueAmt  = parseFloat(s?.amount || sav.installmentAmount || 0);
        const paidAmt = parseFloat(s?.paidAmount || (item.existingTxn ? item.existingTxn.amount : 0));
        const done = (paidAmt >= dueAmt && dueAmt > 0) || s?.status === "PAID" || (!!item.existingTxn && !s);
        if (done) paidPillAmt += paidAmt; else duePillAmt += Math.max(0, dueAmt - paidAmt);
      });
      const paidPillCnt = allFinalItems.filter((item) => {
        const s = item.scheduleItem, sav = item.savings;
        const dueAmt  = parseFloat(s?.amount || sav.installmentAmount || 0);
        const paidAmt = parseFloat(s?.paidAmount || (item.existingTxn ? item.existingTxn.amount : 0));
        return (paidAmt >= dueAmt && dueAmt > 0) || s?.status === "PAID" || (!!item.existingTxn && !s);
      }).length;
      const duePillCnt = allFinalItems.length - paidPillCnt;

      // Inject filter pills
      const pillBarS = document.getElementById("filter-pill-bar");
      if (pillBarS) {
        const sfS = this.fastInputState.statusFilter;
        pillBarS.innerHTML = `<div style="display:flex;gap:0.5rem;padding:0.85rem 0 0.25rem 0;">
  <button onclick="window.ui.fastInputState.statusFilter='all';window.ui.renderFastCollection();" style="flex:1;padding:0.5rem 0.4rem;border-radius:12px;border:2px solid ${sfS==="all"?"#7c3aed":"#e2e8f0"};background:${sfS==="all"?"#7c3aed":"white"};color:${sfS==="all"?"white":"#64748b"};font-weight:700;font-size:0.73rem;cursor:pointer;transition:all 0.2s;text-align:center;line-height:1.4;">
    <div style="font-size:0.6rem;opacity:0.8;letter-spacing:0.4px;">ALL</div>
    <div style="font-size:0.9rem;font-weight:800;">&#8377;${(paidPillAmt+duePillAmt).toLocaleString()}</div>
    <div style="font-size:0.6rem;opacity:0.7;">${allFinalItems.length} accounts</div>
  </button>
  <button onclick="window.ui.fastInputState.statusFilter='paid';window.ui.renderFastCollection();" style="flex:1;padding:0.5rem 0.4rem;border-radius:12px;border:2px solid ${sfS==="paid"?"var(--success)":"#e2e8f0"};background:${sfS==="paid"?"rgba(16,185,129,0.1)":"white"};color:${sfS==="paid"?"var(--success)":"#64748b"};font-weight:700;font-size:0.73rem;cursor:pointer;transition:all 0.2s;text-align:center;line-height:1.4;">
    <div style="display:flex;align-items:center;justify-content:center;gap:3px;font-size:0.6rem;opacity:0.8;letter-spacing:0.4px;"><i class="fa-solid fa-check-circle" style="font-size:0.55rem;"></i> DEPOSITED</div>
    <div style="font-size:0.9rem;font-weight:800;">&#8377;${paidPillAmt.toLocaleString()}</div>
    <div style="font-size:0.6rem;opacity:0.7;">${paidPillCnt} accounts</div>
  </button>
  <button onclick="window.ui.fastInputState.statusFilter='due';window.ui.renderFastCollection();" style="flex:1;padding:0.5rem 0.4rem;border-radius:12px;border:2px solid ${sfS==="due"?"var(--danger)":"#e2e8f0"};background:${sfS==="due"?"rgba(239,68,68,0.08)":"white"};color:${sfS==="due"?"var(--danger)":"#64748b"};font-weight:700;font-size:0.73rem;cursor:pointer;transition:all 0.2s;text-align:center;line-height:1.4;">
    <div style="display:flex;align-items:center;justify-content:center;gap:3px;font-size:0.6rem;opacity:0.8;letter-spacing:0.4px;"><i class="fa-solid fa-clock" style="font-size:0.55rem;"></i> DUE</div>
    <div style="font-size:0.9rem;font-weight:800;">&#8377;${duePillAmt.toLocaleString()}</div>
    <div style="font-size:0.6rem;opacity:0.7;">${duePillCnt} accounts</div>
  </button>
</div>`;
      }

      // Apply status filter
      const sfS2 = this.fastInputState.statusFilter;
      const finalItems = allFinalItems.filter((item) => {
        if (sfS2 === "all") return true;
        const s = item.scheduleItem, sav = item.savings;
        const dueAmt  = parseFloat(s?.amount || sav.installmentAmount || 0);
        const paidAmt = parseFloat(s?.paidAmount || (item.existingTxn ? item.existingTxn.amount : 0));
        const done = (paidAmt >= dueAmt && dueAmt > 0) || s?.status === "PAID" || (!!item.existingTxn && !s);
        return sfS2 === "paid" ? done : !done;
      });

      if (finalItems.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center;color:#94a3b8;margin-top:3rem;padding:2rem;"><div style="width:60px;height:60px;background:#faf5ff;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;"><i class="fa-solid fa-filter" style="font-size:1.3rem;color:#c4b5fd;"></i></div><p style="font-weight:600;color:#64748b;margin-bottom:0.25rem;">No ${sfS2==="paid"?"deposited":"due"} items</p><p style="font-size:0.85rem;">Switch filter above.</p></div>`;
        return;
      }

      const paidCount = allFinalItems.filter((i) => i.scheduleItem?.status === "PAID" || i.existingTxn).length;
'@

$content = $content.Replace($savOld, $savNew)

# ── 4. Shell HTML: add filter-pill-bar placeholder ────────────────────────────
$shellOld = '</div>

<div id="fast-collection-list" style="padding-bottom:6rem;"></div>`'
$shellNew = '</div>

<div id="filter-pill-bar" style="padding:0 0.1rem;"></div>

<div id="fast-collection-list" style="padding-bottom:6rem;"></div>`'

$content = $content.Replace($shellOld, $shellNew)

# ── 5. Reset statusFilter on mode-loans click ─────────────────────────────────
$modeLoanOld = '    document.getElementById("mode-loans").onclick = () => {
      this.fastInputState.mode = "loans";
      updateModeButtons();
      renderCurrent();
    };
    document.getElementById("mode-savings").onclick = () => {
      this.fastInputState.mode = "savings";
      updateModeButtons();
      renderCurrent();
    };'

$modeLoanNew = '    document.getElementById("mode-loans").onclick = () => {
      this.fastInputState.mode = "loans";
      this.fastInputState.statusFilter = "all";
      updateModeButtons();
      renderCurrent();
    };
    document.getElementById("mode-savings").onclick = () => {
      this.fastInputState.mode = "savings";
      this.fastInputState.statusFilter = "all";
      updateModeButtons();
      renderCurrent();
    };'

$content = $content.Replace($modeLoanOld, $modeLoanNew)

# ── 6. Reset statusFilter on date + tab change ───────────────────────────────
$dateOld = '    document.getElementById("collection-date").addEventListener("change", (e) => {
      this.fastInputState.date = e.target.value;
      renderCurrent();
    });'
$dateNew = '    document.getElementById("collection-date").addEventListener("change", (e) => {
      this.fastInputState.date = e.target.value;
      this.fastInputState.statusFilter = "all";
      renderCurrent();
    });'
$content = $content.Replace($dateOld, $dateNew)

$tabOld = '        this.fastInputState.tab = tab;
        updateTabs();
        renderCurrent();'
$tabNew = '        this.fastInputState.tab = tab;
        this.fastInputState.statusFilter = "all";
        updateTabs();
        renderCurrent();'
$content = $content.Replace($tabOld, $tabNew)

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "All replacements done. Lines: $((Get-Content $file).Count)"
